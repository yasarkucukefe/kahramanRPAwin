

// Reset table filtering
const resetTableFilter = () => {
    document.getElementById('text-filter-input').value = "";
    document.getElementById('btn-clear-filter').classList.add('d-none');
    hideTableFooter();
};

// Return harcama türü text
const returnHarcamaTuruText = (key) => {
    if( key === "e0"){return "?";}
    return harcama_kalemleri[key] || "?";
}

// Populate harcama kalemleri
const populateHarcamaKalemleri = (selectId) => {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) {
        console.error(`Select element with ID ${selectId} not found.`);
        return;
    }

    // Clear existing options
    selectElement.innerHTML = '';

    // Add options from harcama_kalemleri
    for (const key in harcama_kalemleri) {
        if (harcama_kalemleri.hasOwnProperty(key)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = harcama_kalemleri[key];
            selectElement.appendChild(option);
        }
    }
}

// Populate yuzde oranları
const populateYuzdeOranSelect = (selectId) => {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) {
        console.error(`Select element with ID ${selectId} not found.`);
        return;
    }

    // Clear existing options
    selectElement.innerHTML = '';

    // Add options from yuzdelik_oranlar
    yuzdelik_oranlar.forEach(oran => {
        const option = document.createElement('option');
        option.value = oran;
        option.textContent = `%${oran}`;
        selectElement.appendChild(option);
    });
}

// Clear table filter
const clearTableFilter = () => {
    document.getElementById('text-filter-input').value = "";
    applyTableFilter("");
    document.getElementById('btn-clear-filter').classList.add('d-none');
};

// Show table rows meeting the filter criteria
document.getElementById('text-filter-input').addEventListener('input', function () {
    const filter = this.value.toLowerCase();
    applyTableFilter(filter);
});

const applyTableFilter = (textFilter) => {
    hideTableFooter();
    const selectedColumnIndex = parseInt(document.getElementById('text-filter-select').value || 0);
    const rows = document.querySelectorAll('.dataTable tbody tr');
    if(textFilter){
        document.getElementById('btn-clear-filter').classList.remove('d-none');
    }else{
        document.getElementById('btn-clear-filter').classList.add('d-none');
    }

    let say = 0;
    rows.forEach(row => {
        const cell = row.cells[selectedColumnIndex];
        if(textFilter){
            const match = cell && cell.textContent.toLowerCase().includes(textFilter);
            row.style.display = match ? '' : 'none';
            if (match) {
                say++;
            }
        }else{
            row.style.display = '';
        }
    });

    if (textFilter && say === 0) {
        showTableFooter();
    } else {
        hideTableFooter();
    }
};




const populateTextFilterSelect = () => {
    const textFilterSelect = document.getElementById("text-filter-select");
    textFilterSelect.innerHTML = ""; // Clear existing options

    // Add options to the select element
    let start = 0;
    document.querySelectorAll(".dataTable thead th").forEach(th => {
        const option = document.createElement("option");
        option.value = start;
        th.dataset.column = start; // Set data-column attribute for the th element
        option.textContent = th.textContent;
        textFilterSelect.appendChild(option);
        start++;
    });
}

// Sticky Table Headers
const adjustTableContainerHeight = () => {
    const scrollContainer = document.querySelector('.table-scroll-container');
    if (!scrollContainer) {
        console.warn('Table scroll container not found.');
        return;
    }

    // Get the current position of the scroll container relative to the viewport
    const containerRect = scrollContainer.getBoundingClientRect();
    const topOffset = containerRect.top; // Distance from viewport top to container's top

    // Get the total viewport height
    const viewportHeight = window.innerHeight;

    // Calculate available height:
    // Total viewport height
    // - Space taken by elements above the container (topOffset)
    // - A small padding at the bottom (e.g., 20px) to prevent it from touching the edge
    const bottomPadding = 20; // You can adjust this value

    // Calculate the height that should be assigned to the container
    const calculatedHeight = viewportHeight - topOffset - bottomPadding;

    // Apply the calculated height as max-height.
    // Use Math.max(0, calculatedHeight) to ensure it doesn't become negative.
    // The CSS min-height will prevent it from becoming smaller than 100px.
    scrollContainer.style.maxHeight = `${Math.max(0, calculatedHeight)}px`;
}

// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', adjustTableContainerHeight);

// Call the function whenever the window is resized
window.addEventListener('resize', adjustTableContainerHeight);


if(document.getElementById("btn-for-shared-link")){
    document.getElementById("btn-for-shared-link").addEventListener("click", function() { 
        window.open("/link", target='_blank');
    })
}