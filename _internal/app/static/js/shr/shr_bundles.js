

const shr_fetchBundles = () => {
    shr_getSummaryForCompany();
    tableIsLoading("bundleTable", LOADING_GIF_URL, "Etiketler yükleniyor..."); // Show loading state
    const data = {};
    commonFetchShare("/shr_bundles", shr_receivedBundles, data, null);
};

const shr_receivedBundles = (bundles) => {
    
    if (bundles.error) {
        console.error("Error in bundles data:", bundles.error);
        genericErrorMessage();
        return;
    }
    //console.log("Received bundles data:", bundles);
    const tbody = document.querySelector("#bundleTable tbody");
    tbody.innerHTML = ""; // Clear existing rows
    if (bundles.length === 0) {
        //tbody.innerHTML = "<tr class='no-records'><td colspan='7' class='text-center'>Henüz bir etiket bulunmamaktadır.</td></tr>";
        noRecordFoundMessage("bundleTable");
        return;
    }
    bundles.forEach(bundle => {
        const row = document.createElement("tr");
        row.id = `bundle_${bundle.auto_id}` || "id_unknown";
        updateBundleRow(row,bundle);
        tbody.appendChild(row);
        shr_addRowClickEvent(row); // Add click event to the row
        shr_getSummaryForBundle(bundle.auto_id); // Fetch summary for each bundle
    });
};

const shr_getSummaryForBundle = (bid) => {
    const monthInput = document.getElementById('monthInput');
    const [year, month] = monthInput.value.split('-');
    const from = `${year}-${month}-01`;
    const to =`${year}-${month}-${getLastDayOfMonth(from)}`;
    commonFetchShare(`/shr_bundle_vat_total`, receivedBundleVATtotal, {bid: bid, from: from, to: to}, null);
}

const shr_addRowClickEvent = (row) => {
    row.addEventListener("click", function(e) {
        const link = `/shr/b/${row.id.replace("bundle_","")}/c/${shareToken}`;
        location.href = link; // Redirect to customer details page
    });
};

const shr_getSummaryForCompany = () => {
    if (document.getElementById("div-matrah")){
        document.getElementById("div-matrah").textContent = "...";
        document.getElementById("div-kdv").textContent = "...";
        document.getElementById("div-toplam").textContent = "...";
        document.getElementById("div-belge").textContent = "...";
    }
    
    const monthInput = document.getElementById('monthInput');
    const [year, month] = monthInput.value.split('-');
    const from = `${year}-${month}-01`;
    const to =`${year}-${month}-${getLastDayOfMonth(from)}`;
    commonFetchShare(`/shr_company_vat_total`, receivedCompanyVATtotal, {from: from, to: to}, null);
}


const startGettingSharedContent = () => {
    shr_shareRemarks();
    shr_getUserCredits();
    shr_getCustomerData();
    shr_fetchBundles();
    populateTextFilterSelect();
};

const handleMonthChangeShared = () => {

    shr_getSummaryForCompany();

    const rows = document.querySelectorAll("#bundleTable tbody tr");
    rows.forEach(row => {
        const bundleId = row.id.replace("bundle_", "");
        shr_getSummaryForBundle(bundleId); // Fetch summary for each bundle
        row.querySelector('.receipt-icon').querySelector('span').textContent = " ... ";
        row.querySelector('.matrah-cell').textContent = " ... ";
        row.querySelector('.kdv-cell').textContent = " ... ";
        row.querySelector('.toplam-cell').textContent = " ... ";
    });
    
}