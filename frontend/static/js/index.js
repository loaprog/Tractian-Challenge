const tableBody = document.getElementById("series-table-body");
const filterInput = document.querySelector(".filter-input");
const selectAllCheckbox = document.getElementById("select-all");

let series = [];


let sortConfig = {
    key: "time_series_id",
    direction: "asc"
};


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
            <td><input type="checkbox" class="row-check"></td>
            <td>${item.time_series_id}</td>
            <td class="link">${item.series_id}</td>
            <td>v${item.current_version}</td>
            <td>${item.last_model_created_at ?? "-"}</td>
        `;

        tr.addEventListener("click", (e) => {
            if (e.target.type === "checkbox") return;

            document
                .querySelectorAll(".monitor-table tbody tr")
                .forEach(r => r.classList.remove("selected"));
            tr.classList.add("selected");
        });

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
    const checked = selectAllCheckbox.checked;

    document.querySelectorAll(".row-check").forEach(cb => {
        cb.checked = checked;
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

loadSeries();
