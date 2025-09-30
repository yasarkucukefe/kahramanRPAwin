
const RECEIPT_ICON_URL = document.getElementById("div-src") ? document.getElementById("div-src").getAttribute("data-receiptIconUrl") : "";
const LOADING_GIF_URL = document.getElementById("div-src") ? document.getElementById("div-src").getAttribute("data-loadingGifUrl") : "";

let allReceipts = [];
const withShareToken = !!document.querySelector("#div-token");
let showReceiptFromUpload = false;
const cachedImages = {}; // Cache for loaded images


// Modal instance for fullscreen receipt view
const myModalEl = document.getElementById('fullscreenModal');
const modal = new bootstrap.Modal(myModalEl);

if(document.getElementById("receipt-gif")) {
    document.getElementById("receipt-gif").src = LOADING_GIF_URL;
}

const calculateIncompleteReceipts = (arrayItems) => {
    arrayItems.forEach(receipt => {
        if (+receipt.durum === 0) {
            receipt.incomplete = false; // do not take into account receipts with durum 0
            return;
        }

        let incomplete = checkInvalidRcp(receipt.vd) || checkInvalidRcp(receipt.firm) || checkInvalidRcp(receipt.vn) || checkInvalidRcp(receipt.tarih, 10);
        incomplete = incomplete || (checkInvalidRcp(receipt.inv_no, 5) && checkInvalidRcp(receipt.rcp_no, 1));

        receipt.incomplete = incomplete;

    });
}

const checkInvalidRcp = (val, length = 2) => {
    if(val && val.length >= length){
        return false;
    }
    return true; // Invalid
}


const handleMonthChange = () => {
    fetchReceipts();
}

const getSummaryForBundle = () => {
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
    const bundleId = document.getElementById("bundle-set").dataset.id;
    if(withShareToken) {
        commonFetchShare(`/shr_bundle_vat_total`, receivedBundleVATtotal, {bid: bundleId, from: from, to: to}, null);
    }else{
        commonFetch(`/bundle_vat_total`, receivedBundleVATtotal, {bid: bundleId, from: from, to: to}, null);
    }
}


const isTableRowInEditMode = (td) => {
    const row = td.closest("tr");
    return row.classList.contains("editing");
}

const retrieveDetailsWithVergiNo = () => {
    if(isTableRowInEditMode(document.getElementById("rcp-vn")) || isTableRowInEditMode(document.getElementById("rcp-vd"))){
        gosterMessage("", "Düzenleme modu açık iken bu özellik kullanılamaz.");
        return;
    }
    const vergiNo = document.getElementById("rcp-vn").querySelector("span").textContent.trim();
    if (vergiNo) {
        getReceiptDetailByVergiNo(vergiNo);
    } 
}

const getReceiptDetailByVergiNo = (vergiNo) => {
    const customerId = document.getElementById("customer-name").dataset.id;
    if(String(vergiNo).length !== 10 && String(vergiNo).length !== 11) {
        gosterMessage("Hata!", "Geçerli olmayan vergi numarası.", "warning");
        return;
    }
    addThreeDotsLoadingGIF(document.getElementById("rcp-vd"));
    addThreeDotsLoadingGIF(document.getElementById("rcp-firm"));
    if(withShareToken) {
        commonFetchShare(`/shr_detail_by_vergi_no`, receivedReceiptDetailByVergiNo, {vergi_no: vergiNo, cid: customerId}, null);
    } else {
        commonFetch(`/detail_by_vergi_no`, receivedReceiptDetailByVergiNo, {vergi_no: vergiNo, cid: customerId}, null);
    }
}

const receivedReceiptDetailByVergiNo = (resp) => {
    document.getElementById("rcp-vd").closest("tr").classList.remove("editing");
    document.getElementById("rcp-firm").closest("tr").classList.remove("editing");
    const td_vd = document.getElementById("rcp-vd");
    const td_firm = document.getElementById("rcp-firm");
    //console.log("Received receipt detail data:", resp);
    if (resp.error) {
        //console.error("Error in receipt detail data:", resp.error);
        setTDtoItsOriginalValue(td_vd);
        setTDtoItsOriginalValue(td_firm);
        gosterMessage("Hata!", "Belge detayları alınamadı.", "warning");
        return;
    }
    // Process the successful response here
    const vergi_dairesi = resp.item.vd || "-";
    const firm_name = resp.item.firm || "-"; 

    if(td_vd.querySelector("span")){
        td_vd.querySelector("span").innerHTML = "";
        td_vd.querySelector("span").textContent = vergi_dairesi;
        td_vd.classList.add("changedCell");
    }

    if(td_firm.querySelector("span")){
        td_firm.querySelector("span").innerHTML = "";
        td_firm.querySelector("span").textContent = firm_name;
        td_firm.classList.add("changedCell");
    }

    const saveButton = document.getElementById('button-save-details');
    saveButton.classList.remove('d-none');
}  


const retrieveDetailsWithFirm = () => {
    if(isTableRowInEditMode(document.getElementById("rcp-firm"))){
        gosterMessage("", "Düzenleme modu açık iken bu özellik kullanılamaz.","warning");
        return;
    }
    const firmName = document.getElementById("rcp-firm").querySelector("span").textContent.trim();
    if (firmName) {
        getReceiptDetailByFirmName(firmName);
    } 
}

const getReceiptDetailByFirmName = (firmName) => {
    const customerId = document.getElementById("customer-name").dataset.id;
    if(String(firmName).length < 2) {
        gosterMessage("Hata!", "Arama yapılacak firma adı belirleyici değil.", "warning");
        return;
    }
    addThreeDotsLoadingGIF(document.getElementById("rcp-vd"));
    addThreeDotsLoadingGIF(document.getElementById("rcp-vn"));
    if(withShareToken) {
        commonFetchShare(`/shr_detail_by_firm_name`, receivedReceiptDetailByFirmName, {firm_name: firmName, cid: customerId}, null);
    } else {
        commonFetch(`/detail_by_firm_name`, receivedReceiptDetailByFirmName, {firm_name: firmName, cid: customerId}, null);
    }
}

const addThreeDotsLoadingGIF = (td) => {
    const originalvalue = td.querySelector('span').textContent.trim();
    td.dataset.originalvalue = originalvalue;
    const loadingGIF = document.createElement("img");
    loadingGIF.src = "/static/images/dots.gif";
    loadingGIF.alt = "Loading...";
    loadingGIF.width = 24;
    loadingGIF.classList.add("loading-gif");
    if(td.querySelector("span")) {
        td.querySelector("span").innerHTML = "";
        td.querySelector("span").appendChild(loadingGIF);
    }
    td.closest("tr").classList.add("editing");
}

const setTDtoItsOriginalValue = (td) => {
    const originalvalue = td.dataset.originalvalue; // Restore original value
    td.querySelector('span').innerHTML = ""; // Clear the loading GIF
    td.querySelector('span').textContent = originalvalue;
}

const receivedReceiptDetailByFirmName = (resp) => {
    document.getElementById("rcp-vd").closest("tr").classList.remove("editing");
    document.getElementById("rcp-vn").closest("tr").classList.remove("editing");
    //console.log("Received receipt detail data:", resp);
    const td_vd = document.getElementById("rcp-vd");
    const td_vn = document.getElementById("rcp-vn");
    if (resp.error) {
        setTDtoItsOriginalValue(td_vd);
        setTDtoItsOriginalValue(td_vn);
        //console.error("Error in receipt detail data:", resp.error);
        gosterMessage("Hata!", "Belge detayları alınamadı.", "warning");
        return;
    }
    // Process the successful response here


    const vergi_dairesi = resp.item.vd || "-";
    const vergi_no = resp.item.vn || "-"; 

    if(td_vd.querySelector("span")){
        td_vd.querySelector("span").innerHTML = "";
        td_vd.querySelector("span").textContent = vergi_dairesi;
        td_vd.classList.add("changedCell");
    }

    if(td_vn.querySelector("span")){
        td_vn.querySelector("span").innerHTML = "";
        td_vn.querySelector("span").textContent = vergi_no;
        td_vn.classList.add("changedCell");
    }

    const saveButton = document.getElementById('button-save-details');
    saveButton.classList.remove('d-none');
}

const receivedBundleVATtotal = (resp) => {
    if (resp.error) {
        console.error("Error in bundle VAT total data:", resp.error);
        gosterMessage("Hata!", "Gruplama etiketi verileri alınamadı.", "danger");
        return;
    }
    
    //console.log("Received bundle VAT total data:", data);

    const data = returnTotalValuesJSON(resp);

    setTimeout(() => {
        const counts = calculateFilterMetrics(resp.items || [] );
        populateFilterMetrics(counts);
    }, 10); // Delay to perform async operations

    const totalKDV = parseFloat(data.total_kdv || 0);
    const totalVAL = parseFloat(data.total_val || 0);
    const matrah = totalVAL - totalKDV;

    populateSummaryMetrics({matrah, totalKDV, totalVAL, count: data.count || "-"});

    document.getElementById("div-receiptFilterButtons").classList.remove("d-none"); // Show the filter buttons
}

const updateBundleMetrics = () => {
    const data = returnTotalValuesJSON({items: allReceipts});
    const totalKDV = parseFloat(data.total_kdv || 0);
    const totalVAL = parseFloat(data.total_val || 0);
    const matrah = totalVAL - totalKDV;

    populateSummaryMetrics({matrah, totalKDV, totalVAL, count: data.count || "-"});
}

const calculateFilterMetrics = (data) => {    
    const counts = data.reduce((acc, obj) => {
        if ('durum' in obj) {
            const key = `d${obj.durum}`;
            acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
    }, {});
    return counts;
}

const populateFilterMetrics = (counts) => {
    const toplam = (counts.d1 || 0) + (counts.d2 || 0);
    document.getElementById("btn-rcp-toplam").textContent = toplam || 0;
    document.getElementById("btn-rcp-checked").textContent = counts.d2 || 0;
    document.getElementById("btn-rcp-pending").textContent = counts.d1 || 0;
    document.getElementById("btn-rcp-no-use").textContent = counts.d0 || 0;
}

const shareBundleLink = () => {
    const link = document.getElementById('qr-canvas').dataset.link;
    if (!link) {
        gosterMessage("Hata!", "QR kod bağlantısı bulunamadı.", "danger");
        return;
    }
    navigator.clipboard.writeText(link).then(() => {
        gosterMessage("Kopyalandı!", "Bağlantı linkini paylaşabilirsiniz. (Ctrl+V)", "success");
    }).catch(err => {
        console.error("Failed to copy text: ", err);
        gosterMessage("Hata!", "Bağlantı panoya kopyalanamadı.", "danger");
    });

}

const showQRCode = () => {
    document.getElementById('div-qr-canvas2').classList.add("d-none");
    document.getElementById("img-qr-loading").classList.remove("d-none");
    const bundleId = document.getElementById("bundle-set").dataset.id;
    commonFetch(`/jwt_token`, receivedJWT, {bid: bundleId}, null);
};

const receivedJWT = (jwtData) => {
    if (jwtData.error) {
        console.error("Error in JWT data:", jwtData.error);
        gosterMessage("Hata!", "Sunucu ile iletişim kurulamadı.", "danger");
        return;
    }
    document.getElementById("img-qr-loading").classList.add("d-none");
    document.getElementById('div-qr-canvas2').classList.remove("d-none");
    const qrCanvas = document.getElementById('qr-canvas2');
    const link =  `${window.location.origin}/jwt/${jwtData.token}`;
    qrCanvas.dataset.link = link; // Store the link in the canvas element for later use
    QRCode.toCanvas(qrCanvas, link, function (error) {
        if (error) console.error(error);
    });
};

const getReceiptbyId = (docId, receiptId, showCanvas = true) => {
    // showCanvas: if it is not showing, we need to display it first, otherwise no need for show animation
    belgeler = [];
    receiptsData = {};
    document.getElementById('ai-response').innerHTML = "";
    document.getElementById('receipt-image').style.display = "none";
    document.querySelectorAll('.form-check').forEach(el => {
        el.classList.add('d-none'); // Show the form check elements
    });
    document.querySelectorAll('.post-data').forEach(el => {
        el.classList.add('d-none'); // Show the form check elements
    });
    if (document.querySelector('.ekle-new-vat')) {
        document.querySelector('.ekle-new-vat').classList.add('d-none'); // Hide the add new VAT button
    }
    document.getElementById('receipt-loading').style.display = "block"; // Show the loading GIF
    document.getElementById('fullscreenModal').dataset.rid = receiptId; // Store the receipt ID in the fullscreen modal for later use
    document.getElementById('fullscreenModal').dataset.did = docId; // Store the document ID in the fullscreen modal for later use

    if (showCanvas) {
        showReceiptOffcanvas();
    }
    
    document.getElementById("progressBarContainer2").classList.remove("d-none");
    resetReceiptDetailsTable();

    document.getElementById('fullscreenModal').dataset.rid = receiptId; // Set rid to receiptId

    // Fetch receipt data
    const isCached = isImageCached(docId);
    const cached = isCached ? cachedImages[docId] : null;

    if(withShareToken){
        if(isCached){
            receivedReceiptData(cached.receipt);
        }else{
            commonFetchShare(`/shr_get_receipt`, receivedReceiptData, {rid: docId}, null); // Fetch upload details by receipt ID (rid)
        }
        commonFetchShare(`/shr_tek_receipt`, receivedDataOfTekReceipt, {rid: receiptId}, null);
    }else{
        if(isCached){
            receivedReceiptData(cached.receipt);
        }else{
            commonFetch(`/get_receipt`, receivedReceiptData, {rid: docId}, null); // Fetch upload details by receipt ID (rid)
        }
        commonFetch(`/tek_receipt`, receivedDataOfTekReceipt, {rid: receiptId}, null);
    }
    document.getElementById('receiptsDataTable').dataset.loading = "1"; // Set loading state for the receipt data table
};

const receivedReceiptData = (receiptData) => {
    if (receiptData.error) {
        console.error("Error in receipt data:", receiptData.error);
        gosterMessage("Hata!", "Fiş verileri yüklenemedi. Lütfen tekrar deneyin.", "danger");
        hideReceiptOffcanvas();
        return;
    }
    //console.log("Received receipt data:", receiptData);
    populateReceiptView(receiptData);
};

const receivedDataOfTekReceipt = (data) => {
    document.getElementById('div-receiptIdx').innerHTML = ""; // Clear loading message
    if (data.error) {
        console.error("Error in all receipts data:", data.error);
        gosterMessage("Hata!", "Tüm fiş verileri yüklenemedi. Lütfen tekrar deneyin.", "danger");
        hideReceiptOffcanvas();
        return;
    }  
    receiptsData = data; // Store the received data globally  
    populateReceiptViewTable(data.item, false);
    document.getElementById("progressBarContainer2").classList.add("d-none");
};

const fetchReceipts = () => {
    getSummaryForBundle();
    tableIsLoading("receiptTable", LOADING_GIF_URL, "Fatura verileri yükleniyor...");
    document.getElementById("btn-rcp-toplam").classList.add("active");
    document.getElementById("btn-show-duplicates").classList.remove("active");
    const monthInput = document.getElementById('monthInput');
    const [year, month] = monthInput.value.split('-');
    const from = `${year}-${month}-01`;
    const to =`${year}-${month}-${getLastDayOfMonth(from)}`;
    // Show the main content
    document.getElementById('receiptTable').classList.remove("d-none");
    const cid = document.getElementById("customer-name").dataset.id;
    const bid = document.getElementById("bundle-set").dataset.id;
    if(withShareToken){
        commonFetchShare(`/shr_receipts`, receivedReceipts, {cid, bid, from, to}, null);
    }else{
        commonFetch(`/receipts`, receivedReceipts, {cid, bid, from, to}, null);
    }
    document.querySelectorAll('#div-receiptFilterButtons button').forEach(button => {
        button.textContent = `...`; // Reset button text to loading state
    });
};

const receivedReceipts = (receipts) => {
    if (receipts.error) {
        console.error("Error in receipts data:", receipts.error);
        gosterMessage("Hata!", "Fiş verileri alınamadı.", "danger");
        return;
    }
    //console.log("Received receipts:", receipts);
    allReceipts.length = 0; // Clear the allReceipts array
    allReceipts.push(...receipts); // Add new receipts to the array

    calculateIncompleteReceipts(allReceipts);
    updateDuplicateReceiptsButton();

    document.getElementById("btn-rcp-incomplete").textContent = allReceipts.filter(r => r.incomplete).length ;

    populateReceiptTable(receipts);
};


const updateBelgeCell = (belgeCell, durum) => {
    belgeCell.classList.remove("bg-secondary", "bg-success", "text-light");
    if( +durum === 0) { // Do not use the receipt
        belgeCell.classList.add("bg-secondary");
        belgeCell.classList.add("text-light");
    }else if( +durum === 2) { // Checked OK
        belgeCell.classList.add("bg-success");
        belgeCell.classList.add("text-light");
    }  
}

const updateIncompletenessAfterUpdate = (item, rowId) => {
    const updatedReceipt = allReceipts.find(receipt => receipt.receipt_id === rowId);
    if(updatedReceipt) {
        updatedReceipt.firm = item.firm;
        updatedReceipt.inv_no = item.inv_no;
        updatedReceipt.rcp_no = item.rcp_no;
        updatedReceipt.tarih = item.tarih;
        updatedReceipt.kdv = item.kdv;
        updatedReceipt.toplam = item.toplam;
        updatedReceipt.vd = item.vd;
        updatedReceipt.vn = item.vn;

        calculateIncompleteReceipts([updatedReceipt]); // Recalculate incomplete receipt
        document.getElementById("btn-rcp-incomplete").textContent = allReceipts.filter(r => r.incomplete).length ;
    }
}

const updateReceiptStatus = (durum,rowId) => {
    //console.log("Updating receipt status:", durum, rowId);
    const row = document.getElementById(rowId);
    if (!row) {
        console.error("Row not found:", rowId);
        return;
    }

    const belgeCell = row.querySelector("td:nth-child(4)");
    updateBelgeCell(belgeCell, durum);

    const updatedReceipt = allReceipts.find(receipt => receipt.receipt_id === rowId);
    if (updatedReceipt) {
        updatedReceipt.durum = durum;
        calculateIncompleteReceipts([updatedReceipt]); // Recalculate incomplete receipt
        document.getElementById("btn-rcp-incomplete").textContent = allReceipts.filter(r => r.incomplete).length ;
    }
}

const updateRowInReceiptTable = (receipt, rowId) => {
    if(showReceiptFromUpload){return;}
    
    const row = document.getElementById(rowId);
    if (!row) {
        console.error("Row not found:", rowId);
        return;
    }

    const invoiceNo = receipt.inv_no || "-";
    const rcp_no = receipt.rcp_no || "-";
    const matrah = computeMatrah(receipt.toplam, receipt.kdv) || "?";
    let belgeTuru = "Fiş";
    if (invoiceNo.length > 10) { belgeTuru = "Fatura"; }
    if (invoiceNo.length > 15 || rcp_no.length > 15) { belgeTuru = "E-Arşiv"; }

    // Update the row with new data
    row.querySelector("td:nth-child(1)").textContent = receipt.firm || "?";
    row.querySelector("td:nth-child(2)").textContent = receipt.vd || "-";
    row.querySelector("td:nth-child(3)").textContent = receipt.vn || "-";
    row.querySelector("td:nth-child(4)").textContent = belgeTuru || "?";
    row.querySelector("td:nth-child(5)").textContent = invoiceNo || "-";
    row.querySelector("td:nth-child(6)").textContent = rcp_no || "-";
    row.querySelector("td:nth-child(7)").textContent = turkishDateFormat(receipt.tarih) || "?";
    row.querySelector("td:nth-child(8)").textContent = formatToTRnumbers(matrah || "?");
    row.querySelector("td:nth-child(9)").textContent = formatToTRnumbers(receipt.kdv || "?");
    row.querySelector("td:nth-child(10)").textContent = formatToTRnumbers(receipt.toplam || "?");
};

const returnClassForReceiptStatus = (durum) => {
    switch (+durum) {
        case 0:
            return "bg-secondary"; // Do not use
        case 2:
            return "bg-success"; // Checked OK
        default:
            return "rcp-pending"; // Default case, no specific class
    }
};

const returnClassForReceiptStatusTextColor = (durum) => {
    switch (+durum) {
        case 0:
            return "text-light"; // Do not use
        case 2:
            return "text-light"; // Checked OK
        default:
            return "rcp-pending"; // Default case, no specific class
    }
};

const addRowToReceiptTable = (receipt) => {
    //console.log("Adding row to receipt table:", receipt);
    const tbody = document.querySelector("#receiptTable tbody");
    const newRow = document.createElement("tr");
    newRow.id = receipt.receipt_id || "id_unknown";
    newRow.dataset.docid = receipt.doc_id || "doc_id_unknown";

    const firmCell = document.createElement("td");
    firmCell.textContent = receipt.firm || "?";

    // KKEG & IND values
    const kkeg = parseInt(receipt.kkeg || 0);
    const ind = receipt.hasOwnProperty("ind") ? +receipt.ind : 1; // VAT indirilebilir or not?

    //Vergi Dairesi and Vergi No cells 
    const vergiDairesiCell = document.createElement("td");
    vergiDairesiCell.textContent = receipt.vd || "-";

    const vergiNoCell = document.createElement("td");
    vergiNoCell.textContent = receipt.vn || "-";

    const belgeCell = document.createElement("td");
    const invoiceNo = receipt.inv_no || "-";
    const rcp_no = receipt.rcp_no || "-";

    let belgeTuru = "Fiş";
    if (invoiceNo.length > 10) { belgeTuru = "Fatura"; }
    if (invoiceNo.length > 15 || rcp_no.length > 15) { belgeTuru = "E-Arşiv"; }
    belgeCell.textContent = belgeTuru;

    updateBelgeCell(belgeCell, receipt.durum);

    const faturaNoCell = document.createElement("td");
    faturaNoCell.textContent = invoiceNo;

    const fisCell = document.createElement("td");
    fisCell.textContent = rcp_no;

    const tarihCell = document.createElement("td");
    tarihCell.textContent = turkishDateFormat(receipt.tarih) || "?";
    
    const matrahCell = document.createElement("td");
    matrahCell.textContent = formatToTRnumbers(computeMatrah(receipt.toplam, receipt.kdv)) || "?";
    matrahCell.classList.add("text-end","td-matrah");
    if(kkeg === 1){
        matrahCell.classList.add("text-decoration-line-through");
    }

    const kdvCell = document.createElement("td");
    kdvCell.textContent = formatToTRnumbers(receipt.kdv) || "?";
    kdvCell.classList.add("text-end","td-kdv");
    if(ind === 0 || kkeg === 1){
        kdvCell.classList.add("text-decoration-line-through");
    }

    const totalCell = document.createElement("td");
    totalCell.textContent = formatToTRnumbers(receipt.toplam) || "?";
    totalCell.classList.add("text-end","td-toplam");
    if(kkeg === 1){
        totalCell.classList.add("text-decoration-line-through");
    }

    const oranCell = document.createElement("td");
    oranCell.textContent = receipt.oran || "100";
    oranCell.classList.add("text-center", "td-oran");

    const kalemCell = document.createElement("td");
    kalemCell.textContent = returnHarcamaTuruText(receipt.kalem || "-");
    kalemCell.classList.add("text-center", "td-kalem");

    const uploadedWhenCell = document.createElement("td");
    uploadedWhenCell.textContent = "..."; // Placeholder for upload time
    uploadedWhenCell.classList.add("upload-when");

    const uploadDescCell = document.createElement("td");
    uploadDescCell.textContent = "..."; // Placeholder for upload description
    uploadDescCell.classList.add("upload-desc");

    newRow.appendChild(firmCell);
    newRow.appendChild(vergiDairesiCell);
    newRow.appendChild(vergiNoCell);
    newRow.appendChild(belgeCell);
    newRow.appendChild(faturaNoCell);
    newRow.appendChild(fisCell);
    newRow.appendChild(tarihCell);
    newRow.appendChild(matrahCell);
    newRow.appendChild(kdvCell);
    newRow.appendChild(totalCell);
    newRow.appendChild(oranCell);
    newRow.appendChild(kalemCell);
    newRow.appendChild(uploadedWhenCell);
    newRow.appendChild(uploadDescCell);

    tbody.appendChild(newRow);

    newRow.addEventListener("click", function(e) {
        showReceiptFromUpload = false;
        getReceiptbyId(receipt.doc_id, receipt.receipt_id);
    });
};

const showPendingCheckedReceipts = (btn) => {
    const showReceipts = allReceipts.filter(receipt => +receipt.durum === 1 || +receipt.durum === 2);
    populateReceiptTable(showReceipts);
    setActiveFilterButton(btn);
};

const showPendingReceipts = (btn) => {
    const showReceipts = allReceipts.filter(receipt => +receipt.durum === 1);
    populateReceiptTable(showReceipts);
    setActiveFilterButton(btn);
};

const showCheckedReceipts = (btn) => {
    const showReceipts = allReceipts.filter(receipt => +receipt.durum === 2);
    populateReceiptTable(showReceipts);
    setActiveFilterButton(btn);
};

const showIncompleteReceipts = (btn) => {
    const showReceipts = allReceipts.filter(receipt => receipt.incomplete);
    populateReceiptTable(showReceipts);
    setActiveFilterButton(btn);
};

const showNoUseReceipts = (btn) => {
    const showReceipts = allReceipts.filter(receipt => +receipt.durum === 0);
    populateReceiptTable(showReceipts, false);
    setActiveFilterButton(btn);
};

const setActiveFilterButton = (btn) => {
    document.getElementById("btn-show-duplicates").classList.remove("active");
    const filterButtons = document.querySelectorAll(".receipt-filter-btn");
    filterButtons.forEach(button => button.classList.remove("active"));
    btn.classList.add("active");
};

const populateReceiptTable = (receipts, showAll = true) => {
    const tbody = document.querySelector("#receiptTable tbody");
    tbody.innerHTML = ""; // Clear existing rows
    hideTableFooter();

    const docSet = new Set(); // to retrieve unique document IDs

    let say = 0;

    receipts.forEach(receipt => {

        if(showAll && +receipt.durum === 0 ) {return;} // Skip receipts that are marked as "Do not use"

        addRowToReceiptTable(receipt); // Add row to the table

        say++;

        docSet.add(receipt.doc_id); // Add document ID to the set

        if (docSet.size > 20) { // If there are more than 20 unique document IDs, fetch details (batch processing)
            const uniqueDocIds = Array.from(docSet);
            if(withShareToken){
                commonFetchShare(`/shr_upload_details`, populateDocumentDetails, {doc_ids: uniqueDocIds}, null);
            }else{
                commonFetch(`/upload_details`, populateDocumentDetails, {doc_ids: uniqueDocIds}, null);
            }
            docSet.clear(); // Clear the set after fetching details
        }
    });

    if (docSet.size > 0) { // If there are pending unique document IDs, fetch details
        const uniqueDocIds = Array.from(docSet);
        if(withShareToken){
            commonFetchShare(`/shr_upload_details`, populateDocumentDetails, {doc_ids: uniqueDocIds}, null);
        }else{
            commonFetch(`/upload_details`, populateDocumentDetails, {doc_ids: uniqueDocIds}, null);
        }
    }

    // Handle no records displayed
    if (say === 0) {
        noRecordFoundMessage("receiptTable");
        return;
    }

    
}

const populateDocumentDetails = (data) => {
    if (data.error) {
        console.error("Error in document details:", data.error);
        gosterMessage("Hata!", "Yüklenen belge detayları alınamadı.", "danger");
        return;
    }
    data.forEach(doc => {
        const rows = document.querySelectorAll(`[id^="${doc.upload_id}"]`);
        rows.forEach(row => {
            const uploadWhenCell = row.querySelector("td.upload-when");
            const uploadDescCell = row.querySelector("td.upload-desc");


            if (uploadWhenCell) {
                uploadWhenCell.textContent = unixTimestampToDatetimeTR(doc.time_stamp) || "?";
            }
            if (uploadDescCell) {
                uploadDescCell.textContent = doc.desc_ || "-";
            }
        });
    });
}

const computeMatrah = (toplam, kdv) => {
    try {
        const matrah = parseFloat(toplam) - parseFloat(kdv);
        return matrah.toFixed(2);
    } catch (error) {
        console.error("Error computing matrah:", error);
        return "?";
    }
}

const getCustomerData = () => {
    const customerId = document.getElementById("customer-name").dataset.id;
    commonFetch(`/customer`, receivedCustomerData, {id: customerId}, null);
};

const receivedCustomerData = (customerData) => {
    if (customerData.error) {
        console.error("Error in customer data:", customerData.error);
        gosterMessage("Hata!", "Müşteri verileri alınamadı.", "danger");
        return;
    }
    //console.log("Received customer data:", customerData);
    document.getElementById("customer-name").querySelector("a").textContent = customerData.customer_name || "?";
}


const getBundleData = () => {
    const customerId = document.getElementById("customer-name").dataset.id;
    const bundleId = document.getElementById("bundle-set").dataset.id;
    commonFetch(`/bundle`, receivedBundleData, {id: bundleId, cid: customerId}, null);
};

const receivedBundleData = (bundleData) => {
    if (bundleData.error) {
        console.error("Error in bundle data:", bundleData.error);
        gosterMessage("Hata!", "Evrak seti verileri alınamadı.", "danger");
        return;
    }
    //console.log("Received bundle data:", bundleData);
    const bundleCode = bundleData.bundle_code || " ";
    const bundleName = bundleData.bundle_name || " ";
    //const bundleSet = `${bundleCode} - ${bundleName}`;
    document.querySelector("#bundle-set button").textContent = bundleCode;
    document.getElementById("bundle-set").title = bundleName;

};


function handleUserSignedIn() {
    getUserData();
    getCustomerData();
    getBundleData();
    fetchReceipts();
    populateTextFilterSelect();
    populateHarcamaKalemleri("sel-expense-type");
    populateYuzdeOranSelect("sel-receipt-oran");
}

function handleNoUserSignedIn() {
    location.href = "/"; // Redirect to home page if no user is signed in
}


const removeExistingRowsOnTable = () => {
    const tbody = document.querySelector("#receiptTable tbody");
    tbody.innerHTML = "";
};

const showUploadOffcanvas = () => {

    const uploadedItems = document.querySelectorAll("#uploadList .upload-item");
    document.getElementById('offcanvasUploadList').dataset.uploaded = uploadedItems.length > 0 ? "1" : "0"; // Set uploaded state

    const left = new bootstrap.Offcanvas('#offcanvasUploadList');
    const right = new bootstrap.Offcanvas('#uploadFormOffcanvas');
    left.show();
    right.show();
}

const hideUploadOffcanvas = () => {
    // Get the DOM elements
    var offcanvas1 = document.getElementById('offcanvasUploadList');
    var offcanvas2 = document.getElementById('uploadFormOffcanvas');

    // Get Bootstrap Offcanvas instances
    var bsOffcanvas1 = bootstrap.Offcanvas.getOrCreateInstance(offcanvas1);
    var bsOffcanvas2 = bootstrap.Offcanvas.getOrCreateInstance(offcanvas2);

    // Hide both
    bsOffcanvas1.hide();
    bsOffcanvas2.hide();

    const firstCount = +document.getElementById('offcanvasUploadList').dataset.uploaded
    const uploadedItems = document.querySelectorAll("#uploadList .upload-item");

    if(uploadedItems.length > firstCount){ // Refresh table if there are new uploads
        fetchReceipts();
    }

};

const resetReceiptDetailsTable = () => {
    document.querySelectorAll('#receiptsDataTable tbody td.rcpValue').forEach(td => {td.textContent = '...';});
    document.querySelector('#rcpVATtable tbody').innerHTML = "";
    document.querySelector('#rcpVATtable thead').innerHTML = "";
    //document.getElementById('div-receiptIdx').innerHTML = "Yükleniyor...";
    document.querySelectorAll('td.changedCell').forEach(td => { td.classList.remove('changedCell'); });
}

const showReceiptOffcanvas = () => {
    resetReceiptDetailsTable();
    modal.show(); // Show the modal first to avoid flickering
    // image loading
    document.getElementById('receipt-image').style.display = "none";
    document.getElementById('receipt-gif').style.display = "block";
}

const hideReceiptOffcanvas = () => {    

    getSummaryForBundle(); // Fetch summary for the selected bundle

    // Remove editing state from all receipt rows
    resetReceiptUpdateTable();
}

const resetReceiptUpdateTable = () => {
    document.querySelectorAll('#receiptsDataTable tbody tr').forEach(row => {
        row.classList.remove('editing');
    });

    document.getElementById('receiptsDataTable').dataset.loading = "0"; // Reset loading state

}

const isImageCached = (uploadId) => {
    const cached = cachedImages[uploadId];
    if (!cached) return false;
    if (cached.expiry < Date.now()) {
        delete cachedImages[uploadId];
        return false;
    }
    return true;
}

const populateReceiptView = (receipt) => {
    const spinner = document.getElementById('receipt-loading');
    const img = document.getElementById('receipt-image');
    if(isImageCached(receipt.upload_id)){
        img.classList.remove('fade-image');  // Trigger the transition to opacity: 0
        img.style.opacity = 0;
        setTimeout(() => {
            img.src = receipt.file_url;
            void img.offsetWidth; // Trigger a reflow, flushing the CSS changes
            img.classList.add('fade-image');
            img.style.opacity = 1; // Fade in the new image
        }, 200); // Wait for the fade-out transition to complete    
    }else{
        const skeleton = document.getElementById('image-skeleton');
        // Only set up the onload once
        img.onload = function () { 
            spinner.style.display = "none";
            img.style.display = "block";
            //skeleton.style.display = "none";
            cachedImages[receipt.upload_id] ={
                receipt: receipt,
                expiry: Date.now() + 58 * 60 * 1000 // Cache for 58 minutes
            };
        };
        // Set the image source and show spinner
        img.style.display = "none";
        spinner.style.display = "block";
        img.src = receipt.file_url;
    }    
    
    showReceiptResult(receipt);
    getNextReceiptImage(); // Preload the next receipt image
};


let belgeler = [];
let receiptsData = {}; // Global variable to store receipt data

const showReceiptResult = (receipt) => {
    
    belgeler = receipt.parse_json.belgeler || []; // Store the receipt data for later use
    //document.getElementById("progressBarContainer2").classList.add("d-none");

    // Upload META data
    document.getElementById('rcp-desc').textContent = receipt.desc_ || '-';
    document.getElementById('rcp-dt').textContent = unixTimestampToDatetimeTR(receipt.time_stamp) || '-';
    document.getElementById('rcp-kim').textContent = "PENDING";

    

};

let vatTableChanged = false;
const saveChangesInReceiptDetails = () => {
    confirmToast.hide(); // Hide confirmation toast if it was shown
    if (document.querySelectorAll('td.changedCell').length === 0 && !vatTableChanged) { 
        document.getElementById('button-save-details').classList.add('d-none'); // Hide save button if no changes
        return; 
    } // No changes to save
    const idx = document.getElementById('div-receiptIdx').dataset.idx;
    const receipt_id = `${receiptsData.doc_id}_${parseInt(idx)+1}`;
    const arrayIdx = returnReceiptToUpdateDetails(receipt_id);
    if (arrayIdx < 0) { return; } // Invalid index, do not proceed

    const updatedData = structuredClone(receiptsData.items[arrayIdx]); // Clone the existing receipt data to update

    if(+updatedData.revize === MAX_RCP_REVISION){
        gosterMessage("Hata!", `Bu fiş için güncelleme sayısı limiti aşılmıştır (${MAX_RCP_REVISION})`, "danger");
        return; // Prevent saving if the update limit is reached
    }


    document.querySelectorAll('td.changedCell').forEach(td => {
        if (!td.querySelector('.cell-value')) {return;} // Skip if no cell-value element (prevents VAT rows from being processed)
        const field = mappingReceiptFields(td.dataset.field);
        const newValue = td.querySelector('.cell-value').textContent;
        updatedData[field] = convertToNumber(field, newValue);
        if( field === "tarih") {
            updatedData[field] = convertDMYtoISO(newValue); // Convert date to ISO
        }
        td.classList.remove('changedCell'); // Remove changedCell class after saving
    });

    // Check date is valid
    if (updatedData.tarih === null) {
        gosterMessage("Hata!", `Geçersiz tarih (${updatedData.tarih}). Lütfen GG.AA.SSSS formatında bir tarih girin (Örnek: 31.03.2023)`, "danger");
        return; // Prevent saving if date is invalid
    }


    // VAT Table updates
    const vatRows = document.querySelectorAll('.rcpVATtable tbody tr');
    const vatData = [];
    vatRows.forEach(row => {
        const rowData = {};
        row.querySelectorAll('td').forEach(td => {
            if (td.querySelector('.editCellVAT')) {return;}
            const field = mappingReceiptFields(td.dataset.field);
            rowData[field] = convertToNumber(field, td.textContent);
            td.classList.remove('changedCell');

        });
        vatData.push(rowData);
    });
    updatedData.vat_table = vatData; // Update the VAT data in the global receiptsData object

    if (isNumeric(updatedData.kdv) === false) {
        gosterMessage("Hata!", "KDV tutarı bir rakam olmalıdır.", "danger");
        return; // Prevent saving if KDV is invalid
    }

    if (isNumeric(updatedData.toplam) === false) {
        gosterMessage("Hata!", "Toplam tutarı bir rakam olmalıdır.", "danger");
        return; // Prevent saving if Toplam is invalid
    }

    // Check vn is valid (must be a number)
    updatedData.vn = convertVergiNoToNumber("vn", updatedData.vn);

    const receiptID = receiptsData.items[arrayIdx].receipt_id || `id_unknown_${arrayIdx}`;
    document.getElementById("progressBarContainer2").classList.remove("d-none"); // Show progress bar for AI processing
    if(withShareToken){
        commonFetchShare(`/shr_update_receipt_details`, postUpdateReceiptDetails, {rid: receiptID, data: updatedData}, null);
    }else{
        commonFetch(`/update_receipt_details`, postUpdateReceiptDetails, {rid: receiptID, data: updatedData}, null);
    }
    document.getElementById('button-save-details').classList.add('d-none'); // Hide save button after saving changes
};

const setKontrolStatus = () => {
    const rid = document.getElementById('fullscreenModal').dataset.rid;
    const cb = document.getElementById('kontrolCheckBox');
    const kontrol = cb.checked ? 2 : 1; // Convert checkbox state
    if(withShareToken){
        commonFetchShare(`/shr_set_receipt_durum`, postUpdateReceiptDurum, {rid: rid, drm: kontrol}, null);
    }else{
        commonFetch(`/set_receipt_durum`, postUpdateReceiptDurum, {rid: rid, drm: kontrol}, null);
    }
}

const updateDoNotUseStatus = () => {
    const rid = document.getElementById('fullscreenModal').dataset.rid;
    const cb = document.getElementById('donotUseCheckBox');
    const doNotUse = cb.checked ? 0 : 1; // Convert checkbox state
    if(withShareToken){
        commonFetchShare(`/shr_set_receipt_durum`, postUpdateReceiptDurum, {rid: rid, drm: doNotUse}, null);
    }else{
        commonFetch(`/set_receipt_durum`, postUpdateReceiptDurum, {rid: rid, drm: doNotUse}, null);
    }
}

const postUpdateReceiptDurum = (response) => { 

    const rid = document.getElementById('fullscreenModal').dataset.rid;

    //console.log("Response from update_receipt_durum:", response);
    if (response.error) {
        if(response.err === 401) {
            gosterMessage("Hata!", `Bu belge için güncelleme sayısı limiti aşılmıştır (${MAX_RCP_REVISION})`, "danger");
        }else{
            gosterMessage("Hata!", "Belge durumu güncellenemedi.", "danger");
        }
        const durum = receiptsData.item.durum || 1; // Default to 1 if not set
        setReceiptCheckBoxes(durum);
        return;
    }
    
    //gosterMessage("Başarılı!", "Belge durumu başarıyla güncellendi.", "success");
    receiptsData.item.durum = response.item.durum; // Update the receipt status in the global receiptsData object
    updateReceiptStatus(response.item.durum, rid);
    // Update the receipt checkbox states
    const durum = response.item.durum || 1; // Default to 1 if not set
    setReceiptCheckBoxes(durum);
    updateDuplicateReceiptsButton();
};

const setReceiptCheckBoxes = (durum) => {
    const cbKontrol = document.getElementById('kontrolCheckBox');
    const cbUsage = document.getElementById('donotUseCheckBox');
    cbKontrol.checked = (+durum === 2);
    cbUsage.checked = (+durum === 0);
}

const convertToNumber = (key, value) => {
    if( key === "vat_rate") { // Convert VAT rate to number without percentage sign
        if(value){
            return value.trim().replace("%",""); 
        }
        return value;
    }
    const numberFields = ['total', 'kdv', 'tutar','vat_amount','vat_total','toplam'];
    if (numberFields.includes(key)) {
        return trNumberToDecimal(value.trim());
    }
    return value;
}

// Due to DynamoDB indexing requirement, vergi no must be a integer number
const convertVergiNoToNumber = (key, value) => {
    if (key === "vn") {
        if(value){
            const num = Number(value.trim());
            if(Number.isInteger(num)) {
                return String(num);
            }
        }
        return "1";
    }
    return value;
}

const postUpdateReceiptDetails = (response) => {
    document.getElementById("progressBarContainer2").classList.add("d-none");
    if (response.error) {
        document.getElementById('button-save-details').classList.remove('d-none'); // Show save button if error occurs
        if(response.err === 401) {
            gosterMessage("Hata!", "Bu belge için güncelleme sayısı limiti aşılmıştır (10)", "danger");
        }else{
            gosterMessage("Hata!", "Fiş detayları güncellenemedi.", "danger");
        }
        return; 
    }    
    gosterMessage("Başarılı!", "Fiş detayları başarıyla güncellendi.", "success");
    const arrayIdx = returnReceiptToUpdateDetails(response.receipt_id);
    if(arrayIdx < 0) { return; } // Invalid index, do not proceed

    for (const [field, newValue] of Object.entries(response.item)) {
        receiptsData.items[arrayIdx][field] = newValue;
    }

    updateRowInReceiptTable(response.item, response.receipt_id); // Update the row in the receipt table
    updateIncompletenessAfterUpdate(response.item, response.receipt_id); // update incomplete status
    updateDuplicateReceiptsButton();

    // Update allReceipts array
    const updatedReceipt = allReceipts.find(receipt => receipt.receipt_id === response.receipt_id);
    if (updatedReceipt) {
        for (const [field, newValue] of Object.entries(response.item)) {
            updatedReceipt[field] = newValue;
        }
        updateBundleMetrics();
    }

    // hide the save button
    const saveButton = document.getElementById('button-save-details');
    saveButton.classList.add('d-none');
    vatTableChanged = false;
    //getSummaryForBundle();
};

const mappingReceiptFields = (fieldName) => {
    const mapping = {
        'date': 'tarih',
        'total': 'toplam',
        'time': 'saat',
    };
    return mapping[fieldName] || fieldName;
}


const cancelChangesInReceiptDetails = () => {
    confirmToast.hide(); // Hide confirmation toast if it was shown
    if(document.querySelector('.rcpVATtable tbody tr.newVatRow')){
        document.querySelector('.rcpVATtable tbody tr.newVatRow').remove(); // Remove the new VAT row if it exists
    }
    document.querySelectorAll('td.changedCell').forEach(td => {
        td.classList.remove('changedCell');
        const originalvalue = td.dataset.originalvalue; // Restore original value
        td.innerHTML = editableCellHTML;
        td.querySelector('.cell-value').textContent = originalvalue; // Set original value

    });
    document.getElementById('button-save-details').classList.add('d-none'); // Hide save button
};

const returnReceiptToUpdateDetails = (receipt_id) => {   
    const idx = document.getElementById('div-receiptIdx').dataset.idx; 
    if(receiptsData.items.length > idx) {
        for (let i = 0; i < receiptsData.items.length; i++) {
            const rcp = receiptsData.items[i];
            const rcpID = rcp.receipt_id || "id_unknown";
            if (rcpID === receipt_id) {
                return i; // Return the index of the receipt to update details
            }
        }
    }
    return -1; // Return -1 if not found
};

const populateFromAIdata = (idx) => {
    if(belgeler.length > idx) {
        populateReceiptViewTable(belgeler[idx], true);
    }
};

const populateReceiptViewTable = (receipt, fromAI=false) => {
    //console.log("Populating receipt view table with data:", receipt);
    if (document.querySelector('.ekle-new-vat')) {
        document.querySelector('.ekle-new-vat').classList.remove('d-none'); // Show the add new VAT button
    }

    document.getElementById("sel-receipt-oran").value = receipt.oran || "100";
    document.getElementById("sel-expense-type").value = receipt.kalem || "e0";
    document.getElementById("chk-kkeg").checked = +receipt.kkeg || 0;
    document.getElementById("chk-ind").checked = receipt.hasOwnProperty("ind") ? +receipt.ind : 1;

    document.querySelectorAll('td.changedCell').forEach(td => { td.classList.remove('changedCell'); }); // Clear previous changes
    if (fromAI) {
        document.querySelector('#rcp-date').textContent = receipt.date || '-';
        document.querySelector('#rcp-total').textContent = formatToTRnumbers(receipt.total) || '-';
        document.querySelector('#rcp-time').textContent = receipt.time || '-';
    }else{
        document.querySelector('#rcp-date').textContent = trDateFromIso(receipt.tarih) || '-';
        document.querySelector('#rcp-total').textContent = formatToTRnumbers(receipt.toplam) || '-';
        document.querySelector('#rcp-time').textContent = receipt.saat || '-';
    }
    // Common key values
    document.querySelector('#rcp-firm').textContent = receipt.firm || '-';
    document.querySelector('#rcp-addr').textContent = receipt.addr || '-';
    document.querySelector('#rcp-kdv').textContent = formatToTRnumbers(receipt.kdv) || '-';
    document.querySelector('#rcp-inv_no').textContent = receipt.inv_no || '-';
    document.querySelector('#rcp-rcp_no').textContent = receipt.rcp_no || '-';
    document.querySelector('#rcp-pln').textContent = receipt.pln || '-';
    document.querySelector('#rcp-vd').textContent = receipt.vd || '-';
    document.querySelector('#rcp-vn').textContent = receipt.vn || '-';

    // Belge No
    const belgeNo = receipt.inv_no || receipt.rcp_no || '-';
    document.querySelector('#rcp-belge_no').textContent = belgeNo;

    // VAT Table
    document.querySelector('.rcpVATtable thead').innerHTML = ''; // Clear existing rows
    const headerRow = document.createElement('tr');
    headerRow.className = 'text-secondary text-center';
    headerRow.innerHTML = `
        <th>KDV</th>
        <th>TUTAR</th>
        <th>TOPLAM</th>
    `;
    document.querySelector('.rcpVATtable thead').appendChild(headerRow);

    document.querySelector('.rcpVATtable tbody').innerHTML = ''; // Clear existing rows

    let vatIdx = 0;
    receipt.vat_table.forEach(vat => {
        const vatRow = document.createElement('tr');
        const vatCell = document.createElement('td');
        vatCell.classList.add('rcpValue');
        vatCell.dataset.field = 'vat_rate'; // Add data attribute for field name
        vatCell.textContent = `%${vat.vat_rate}`;
        vatRow.appendChild(vatCell);

        const amountCell = document.createElement('td');
        amountCell.classList.add('rcpValue', 'text-end');
        amountCell.dataset.field = 'vat_amount'; // Add data attribute for field name
        amountCell.textContent = formatToTRnumbers(vat.vat_amount);
        vatRow.appendChild(amountCell);

        const totalCell = document.createElement('td');
        totalCell.classList.add('rcpValue', 'text-end');
        totalCell.dataset.field = 'vat_total'; // Add data attribute for field name
        totalCell.textContent = formatToTRnumbers(vat.vat_total);
        vatRow.appendChild(totalCell);

        document.querySelector('.rcpVATtable tbody').appendChild(vatRow);
        vatIdx++;
    });

    document.getElementById('receiptsDataTable').dataset.loading = "0"; // Reset loading state

    document.querySelectorAll('.form-check').forEach(el => {
        el.classList.remove('d-none'); // Show the form check elements
    });

    document.querySelectorAll('.post-data').forEach(el => {
        el.classList.remove('d-none'); // Show the post data elements
    });

    setReceiptCheckBoxes(receipt.durum || 1); // Set the checkbox states based on receipt status


};

const deleteVATRow = (vatCell) => {
    const trs = document.querySelector('.rcpVATtable tbody').querySelectorAll("tr");
    if(trs && trs.length === 1){
        gosterMessage('','Tabloda en az bir KDV satırı bulunmalıdır!', 'warning');
        return;
    }
    const vatRow = vatCell.closest('tr');
    if (vatRow) {
        vatRow.remove();
        const saveButton = document.getElementById('button-save-details');
        saveButton.classList.remove('d-none');
        vatTableChanged = true;
    }
};

const handleAIProcessButtonClicked = () => {
    document.getElementById("process-receipt-btn").classList.add("d-none");
    document.getElementById("progressBarContainer2").classList.remove("d-none");
};

const checkReceiptDataIsValid = (obj, objKey, tableKey) => {
    const declaredVal = parseFloat(trNumberToDecimal(obj[objKey]));

    // 2. Calculate the sum of values from the vat_table
    const calculatedSum = obj.vat_table.reduce((sum, item) => {
        // Parse each value string to a float and add to the sum
        return sum + parseFloat(trNumberToDecimal(item[tableKey])) || 0; // Use 0 if parsing fails
    }, 0); // Start sum from 0

    const declaredValRounded = declaredVal.toFixed(2);
    const calculatedSumRounded = calculatedSum.toFixed(2);

    // 3. Compare the rounded values
    if (declaredValRounded === calculatedSumRounded) {
        return true; // Values match
    }

    return false;
};

