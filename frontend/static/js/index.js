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

        // ordem crescente
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