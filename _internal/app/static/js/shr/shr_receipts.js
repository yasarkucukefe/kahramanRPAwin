
const bundleId = document.getElementById("div-token").dataset.bid;

const shr_getBundleData = () => {
    commonFetchShare(`/shr_bundle`, receivedBundleData, {bid: bundleId}, null);
};

const shr_getSummaryForBundle = (bid) => {
    const monthInput = document.getElementById('monthInput');
    const [year, month] = monthInput.value.split('-');
    const from = `${year}-${month}-01`;
    const to =`${year}-${month}-${getLastDayOfMonth(from)}`;
    commonFetchShare(`/shr_bundle_vat_total`, receivedBundleVATtotal, {bid: bid, from: from, to: to}, null);
}

const startGettingSharedContent = () => {
    shr_shareRemarks();
    shr_getUserCredits();
    shr_getCustomerData();
    shr_getBundleData();
    fetchReceipts();
    populateTextFilterSelect();    
    populateHarcamaKalemleri("sel-expense-type");
    populateYuzdeOranSelect("sel-receipt-oran");
};

const handleMonthChangeShared = () => {
    fetchReceipts();
};