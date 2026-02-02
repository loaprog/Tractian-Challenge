const tableBody = document.getElementById("series-table-body");
const filterInput = document.querySelector(".filter-input");
const selectAllCheckbox = document.getElementById("select-all");

const btnCreate = document.getElementById("btn-create");
const btnDelete = document.getElementById("btn-delete");

let series = [];

let sortConfig = {
    key: "time_series_id",
    direction: "asc"
};

/* LOAD */

async function loadSeries() {
    try {
        const response = await fetch("/series/");
        series = await response.json();

        sortConfig = { key: "time_series_id", direction: "asc" };
        renderTable(series);
    } catch (error) {
        console.error("Erro ao carregar séries:", error);
    }
}


function sortData(data) {
    return [...data].sort((a, b) => {
        let v1 = a[sortConfig.key];
        let v2 = b[sortConfig.key];

        if (v1 === null) return 1;
        if (v2 === null) return -1;

        if (typeof v1 === "string") {
            return sortConfig.direction === "asc"
                ? v1.localeCompare(v2)
                : v2.localeCompare(v1);
        }

        return sortConfig.direction === "asc"
            ? v1 - v2
            : v2 - v1;
    });
}


function renderTable(data) {
    tableBody.innerHTML = "";

    const sortedData = sortData(data);

    sortedData.forEach(item => {
        const tr = document.createElement("tr");
        tr.dataset.id = item.time_series_id;

        tr.innerHTML = `
            <td>
                <input type="checkbox" class="row-check" data-id="${item.time_series_id}">
            </td>
            <td>${item.time_series_id}</td>
            <td>${item.series_id}</td>
            <td>v${item.current_version}</td>
            <td>${item.last_model_created_at ?? "-"}</td>
            <td>${item.first_model_created_at ?? "-"}</td>
        `;

        tableBody.appendChild(tr);
    });
}


filterInput.addEventListener("input", () => {
    const value = filterInput.value.toLowerCase();

    const filtered = series.filter(item =>
        item.series_id.toLowerCase().includes(value)
    );

    renderTable(filtered);
});


selectAllCheckbox.addEventListener("change", () => {
    document.querySelectorAll(".row-check").forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
    });
});


document.querySelectorAll("th[data-key]").forEach(th => {
    th.addEventListener("click", () => {
        const key = th.dataset.key;

        if (sortConfig.key === key) {
            sortConfig.direction =
                sortConfig.direction === "asc" ? "desc" : "asc";
        } else {
            sortConfig.key = key;
            sortConfig.direction = "asc";
        }

        renderTable(series);
    });
});

/* DELETE */

btnDelete.addEventListener("click", async () => {
    const ids = [...document.querySelectorAll(".row-check:checked")]
        .map(cb => cb.dataset.id);

    if (!ids.length) {
        alert("Selecione ao menos uma série.");
        return;
    }

    if (!confirm(`Deseja deletar ${ids.length} série(s)?`)) return;

    try {
        const params = ids.map(id => `series_ids=${id}`).join("&");

        const response = await fetch(`/series/?${params}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Erro ao deletar");

        await loadSeries();
        selectAllCheckbox.checked = false;

    } catch (error) {
        console.error(error);
        alert("Erro ao deletar séries");
    }
});

/* CREATE */

const createModal = document.getElementById("create-modal");
const closeModalBtn = document.getElementById("close-modal");
const cancelModalBtn = document.getElementById("cancel-modal");
const submitModalBtn = document.getElementById("submit-modal");

const jsonInput = document.getElementById("json-input");
const preview = document.getElementById("data-preview");
const seriesIdInput = document.getElementById("series-id-input");

btnCreate.addEventListener("click", () => {
    createModal.classList.add("active");
    jsonInput.value = "";
    seriesIdInput.value = "";
    preview.innerHTML = "<em>Insira um JSON válido</em>";
    submitModalBtn.disabled = true;
});

function closeModal() {
    createModal.classList.remove("active");
}

closeModalBtn.addEventListener("click", closeModal);
cancelModalBtn.addEventListener("click", closeModal);

jsonInput.addEventListener("input", validateForm);
seriesIdInput.addEventListener("input", validateForm);

function validateForm() {
    try {
        const parsed = JSON.parse(jsonInput.value);
        const seriesId = seriesIdInput.value.trim();

        if (!seriesId) throw new Error("Informe o series_id");

        if (!Array.isArray(parsed.timestamps))
            throw new Error("Campo timestamps inválido");

        if (!Array.isArray(parsed.values))
            throw new Error("Campo values inválido");

        if (parsed.timestamps.length !== parsed.values.length)
            throw new Error("timestamps e values devem ter o mesmo tamanho");

        if (parsed.timestamps.length < 2)
            throw new Error("Mínimo de 2 pontos");

        parsed.timestamps.forEach((t, i) => {
            if (typeof t !== "number" || t < 0)
                throw new Error(`Timestamp inválido na posição ${i}`);
        });

        const sorted = [...parsed.timestamps].sort((a, b) => a - b);
        if (JSON.stringify(sorted) !== JSON.stringify(parsed.timestamps))
            throw new Error("timestamps devem estar em ordem crescente");

        parsed.values.forEach((v, i) => {
            if (typeof v !== "number")
                throw new Error(`Value inválido na posição ${i}`);
        });

        const allEqual = parsed.values.every(v => v === parsed.values[0]);
        if (allEqual)
            throw new Error("Values sem variabilidade (std = 0)");

        preview.innerHTML = `
            <strong>Série:</strong> ${seriesId}<br>
            <strong>Pontos:</strong> ${parsed.timestamps.length}
        `;

        submitModalBtn.disabled = false;

    } catch (e) {
        preview.innerHTML = `<span style="color:red">${e.message}</span>`;
        submitModalBtn.disabled = true;
    }
}

submitModalBtn.addEventListener("click", async () => {
    try {
        const payload = JSON.parse(jsonInput.value);
        const seriesId = seriesIdInput.value.trim();

        const response = await fetch(`/fit/${seriesId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                timestamps: payload.timestamps,
                values: payload.values
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Erro ao criar modelo");
        }

        const result = await response.json();

        alert(`Modelo criado: ${result.series_id} (${result.version})\nPontos usados: ${result.points_used}`);

        closeModal();
        await loadSeries();

    } catch (e) {
        alert(e.message || "Erro ao criar modelo");
    }
});

loadSeries();


const analyzeModal = document.getElementById("analyze-modal");
const closeAnalyzeModalBtn = document.getElementById("close-analyze-modal");
const cancelAnalyzeModalBtn = document.getElementById("cancel-analyze-modal");
const analyzeSubmitBtn = document.getElementById("analyze-submit-btn");
const btnPredict = document.getElementById("btn-predict");

const selectedModelInfo = document.getElementById("selected-model-info");
const timestampInput = document.getElementById("timestamp-input");
const valueInput = document.getElementById("value-input");
const versionInput = document.getElementById("version-input");
const analysisResult = document.getElementById("analysis-result");

let selectedModel = null; 

/* Analisar */
btnPredict.addEventListener("click", () => {
    const selectedRows = document.querySelectorAll(".row-check:checked");
    
    if (selectedRows.length === 0) {
        alert("Selecione um modelo para análise");
        return;
    }
    
    if (selectedRows.length > 1) {
        alert("Selecione apenas um modelo por vez para análise");
        return;
    }
    
    const selectedRow = selectedRows[0];
    const rowElement = selectedRow.closest('tr');
    
    if (!rowElement) {
        alert("Erro ao encontrar linha selecionada");
        return;
    }
    
    const cells = rowElement.querySelectorAll('td');
    if (cells.length < 3) {
        alert("Estrutura da tabela inválida");
        return;
    }
    
    const timeSeriesId = cells[1].textContent.trim();
    
    selectedModel = series.find(s => 
        s.time_series_id === timeSeriesId || 
        s.time_series_id.toString() === timeSeriesId
    );
    
    if (!selectedModel) {
        const seriesId = cells[2].textContent.trim();
        selectedModel = series.find(s => s.series_id === seriesId);
        
        if (!selectedModel) {
            alert("Modelo não encontrado. Tente recarregar a página.");
            console.log("Tentou encontrar:", {
                timeSeriesId,
                seriesId,
                seriesDisponiveis: series.map(s => ({ 
                    time_series_id: s.time_series_id, 
                    series_id: s.series_id 
                }))
            });
            return;
        }
    }
    
    selectedModelInfo.innerHTML = `
        <strong>${selectedModel.series_id}</strong><br>
        Versão atual: v${selectedModel.current_version}<br>
        Último treinamento: ${selectedModel.last_model_created_at || "N/A"}
    `;
    
    timestampInput.value = "";
    valueInput.value = "";
    versionInput.value = "";
    analysisResult.innerHTML = '<em>Preencha os dados e clique em Analisar</em>';
    analyzeSubmitBtn.disabled = false;
    
    analyzeModal.classList.add("active");
    
    setTimeout(() => timestampInput.focus(), 100);
});

function closeAnalyzeModal() {
    analyzeModal.classList.remove("active");
    selectedModel = null;
}

closeAnalyzeModalBtn.addEventListener("click", closeAnalyzeModal);
cancelAnalyzeModalBtn.addEventListener("click", closeAnalyzeModal);

function validateAnalyzeForm() {
    const timestamp = timestampInput.value.trim();
    const value = valueInput.value.trim();
    const numValue = parseFloat(value);
    
    if (!timestamp || !value || isNaN(numValue)) {
        analyzeSubmitBtn.disabled = true;
        return false;
    }
    
    if (!timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
        console.warn("Formato de timestamp pode não ser o ideal");
    }
    
    analyzeSubmitBtn.disabled = false;
    return true;
}

timestampInput.addEventListener("input", validateAnalyzeForm);
valueInput.addEventListener("input", validateAnalyzeForm);

analyzeSubmitBtn.addEventListener("click", async () => {
    if (!validateAnalyzeForm() || !selectedModel) {
        alert("Preencha todos os campos obrigatórios");
        return;
    }
    
    const payload = {
        timestamp: timestampInput.value.trim(),
        value: parseFloat(valueInput.value)
    };
    
    const version = versionInput.value.trim() || null;
    
    try {
        analysisResult.innerHTML = '<div class="loading">Analisando...</div>';
        analyzeSubmitBtn.disabled = true;
        
        let url = `/predict/${encodeURIComponent(selectedModel.series_id)}`;
        
        if (version) {
            url += `?version=${encodeURIComponent(version)}`;
        }
        
        console.log("Enviando requisição para:", url, "com payload:", payload);
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });
        
        const responseText = await response.text();
        console.log("Resposta bruta:", responseText);
        
        if (!response.ok) {
            let errorMessage = `Erro ${response.status}: ${response.statusText}`;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.detail || errorMessage;
            } catch (e) {
                errorMessage = responseText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        const result = JSON.parse(responseText);
        
        const isAnomaly = result.anomaly;
        const versionUsed = result.model_version;
        
        analysisResult.innerHTML = `
            <div style="padding: 10px; background-color: ${isAnomaly ? '#ffebee' : '#e8f5e8'}; border-radius: 4px; margin-bottom: 10px;">
                <strong style="color: ${isAnomaly ? '#c62828' : '#2e7d32'}; font-size: 16px;">
                    ${isAnomaly ? '⚠️ ANOMALIA DETECTADA' : '✅ COMPORTAMENTO NORMAL'}
                </strong>
            </div>
            <div style="margin-top: 10px; font-size: 14px;">
                <strong>Versão do modelo:</strong> ${versionUsed}<br>
                <strong>Timestamp:</strong> ${payload.timestamp}<br>
                <strong>Valor:</strong> ${payload.value}<br>
                <strong>Status:</strong> <span style="color: ${isAnomaly ? '#c62828' : '#2e7d32'}">${isAnomaly ? 'Anômalo' : 'Normal'}</span>
            </div>
        `;
        
        analyzeSubmitBtn.disabled = false;
        
    } catch (error) {
        console.error("Erro na análise:", error);
        analysisResult.innerHTML = `
            <div style="padding: 10px; background-color: #ffebee; border-radius: 4px;">
                <span style="color: #c62828;">
                    <strong>Erro:</strong> ${error.message}
                </span>
            </div>
        `;
        analyzeSubmitBtn.disabled = false;
    }
});

const style = document.createElement('style');
style.textContent = `
    .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        padding: 20px;
    }
    
    .loading:after {
        content: '...';
        animation: dots 1.5s steps(4, end) infinite;
        margin-left: 5px;
    }
    
    @keyframes dots {
        0%, 20% { content: ''; }
        40% { content: '.'; }
        60% { content: '..'; }
        80%, 100% { content: '...'; }
    }
    
    .anomaly {
        color: #c62828;
        font-weight: bold;
    }
    
    .normal {
        color: #2e7d32;
        font-weight: bold;
    }
`;
document.head.appendChild(style);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && analyzeModal.classList.contains('active')) {
        closeAnalyzeModal();
    }
});

analyzeModal.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !analyzeSubmitBtn.disabled && analyzeModal.classList.contains('active')) {
        e.preventDefault();
        analyzeSubmitBtn.click();
    }
});

validateAnalyzeForm();