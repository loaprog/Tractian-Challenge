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



loadSeries();
