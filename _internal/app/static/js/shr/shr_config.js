
const shareToken = document.getElementById("div-token").dataset.token;

// Populate navbar
if(document.querySelector('.nav-common')) {
    const navbar = document.querySelector('.nav-common');
    //navbar.classList.add('navbar', 'navbar-expand-lg', 'navbar-dark', 'bg-dark', 'border-bottom', 'shadow-sm');
    const cid = navbar.dataset.cid || 0;

    const bundleHTML = navbar.classList.contains('nav-bundles') ? `<div class="fw-bold text-light fs-5" id="customer-name" data-id="${cid}"></div>` : '';
    const receiptHTML = navbar.classList.contains('nav-receipts') ? `<div class="fw-bold text-light fs-5" id="customer-name" data-id="${cid}"><a class="nav-link" href="/c/${cid}"></a></div>` : '';

    navbar.innerHTML = `
    <div class="container-fluid justify-content-between">
        <!-- Brand Section -->
        <a class="navbar-brand" href="/u">Kahraman <span class="fw-bold">AI</span></a>
        ${bundleHTML}
        ${receiptHTML}
        <!-- User Section -->
        <div class="d-flex align-items-center gap-3">
            <div class="d-flex align-items-center">
                <div id="user-credits" class="me-1 text-secondary"><i class="bi bi-file-text fs-5"></i><span class='fw-semibold bg-warning text-dark px-2 py-1 rounded text-center' title="Kalan Belge Okuma Sayısı">...</span></div>
            </div>            
        </div>

        <div class="dropdown">
            <button class="btn btn-info user-fullname" type="button" id="share-rmk" title="">...</button>
        </div>
    </div>    
    `;
}

if (document.getElementById('monthInput')) {
    const monthInput = document.getElementById('monthInput');
    if (monthInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        monthInput.value = `${yyyy}-${mm}`;
    }

    monthInput.addEventListener('change', function() {
        handleMonthChangeShared();
    });

}

startGettingSharedContent();
