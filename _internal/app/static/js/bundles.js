
const RECEIPT_ICON_URL = document.getElementById("div-src") ? document.getElementById("div-src").getAttribute("data-receiptIconUrl") : "";
const LOADING_GIF_URL = document.getElementById("div-src") ? document.getElementById("div-src").getAttribute("data-loadingGifUrl") : "";

const withShareToken = !!document.querySelector("#div-token");


const getCustomerID = () => {
    const customerNameElement = document.querySelector("nav");
    if (customerNameElement && customerNameElement.dataset.cid) {
        return customerNameElement.dataset.cid;
    }
    return 0;
};

const fetchBundles = () => {
    getSummaryForCompany();
    tableIsLoading("bundleTable", LOADING_GIF_URL, "Etiketler yükleniyor..."); // Show loading state
    const data = {cid: getCustomerID()};
    commonFetch("/bundles", receivedBundles, data, null);
};

const receivedBundles = (bundles) => {
    
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
        updateBundleRow(row, bundle);
        tbody.appendChild(row);
        addRowClickEvent(row); // Add click event to the row
        getSummaryForBundle(bundle.auto_id); // Fetch summary for each bundle
    });
     
};

const updateBundleRow = (row, bundle) => {
    const td_code = document.createElement("td");
    td_code.classList.add("editable", "td_code");
    td_code.textContent = bundle.bundle_code || "?";
    if(+bundle.status === 0){
        td_code.classList.add("bg-secondary","text-light");
    }
    row.appendChild(td_code);

    const td_name = document.createElement("td");
    td_name.classList.add("editable","td_name");
    td_name.textContent = bundle.bundle_name || "?";
    row.appendChild(td_name);

    const td_rmk1 = document.createElement("td");
    td_rmk1.classList.add("editable","td_rmk1");
    td_rmk1.textContent = bundle.bundle_rmk1 || "?";
    row.appendChild(td_rmk1);

    const td_rmk2 = document.createElement("td");
    td_rmk2.classList.add("editable","td_rmk2");
    td_rmk2.textContent = bundle.bundle_rmk2 || "?";
    row.appendChild(td_rmk2);

    const td_receipt = document.createElement("td");
    td_receipt.classList.add("receipt-icon", "text-center");
    td_receipt.innerHTML = `${returnImageTagForReceipt(24)}<span>...</span>`;
    row.appendChild(td_receipt);

    const td_matrah = document.createElement("td");
    td_matrah.classList.add("matrah-cell");
    td_matrah.textContent = "...";
    row.appendChild(td_matrah);

    const td_kdv = document.createElement("td");
    td_kdv.classList.add("kdv-cell", "text-primary");
    td_kdv.textContent = "...";
    row.appendChild(td_kdv);

    const td_toplam = document.createElement("td");
    td_toplam.classList.add("toplam-cell");
    td_toplam.textContent = "...";
    row.appendChild(td_toplam);
};

const addRowClickEvent = (row) => {
    row.addEventListener("click", function(e) {
        if (e.target.classList.contains("pencil")) {
            // If pencil icon clicked, do nothing
            return;
        }
        // If row clicked, get customer data
        const link = `/c/${getCustomerID()}/b/${row.id.replace("bundle_","")}`;
        location.href = link; // Redirect to customer details page
    });
}

const handleMonthChange = () => {
    
    getSummaryForCompany()

    const rows = document.querySelectorAll("#bundleTable tbody tr");
    rows.forEach(row => {
        const bundleId = row.id.replace("bundle_", "");
        getSummaryForBundle(bundleId); // Fetch summary for each bundle
        row.querySelector('.receipt-icon').querySelector('span').textContent = " ... ";
        row.querySelector('.matrah-cell').textContent = " ... ";
        row.querySelector('.kdv-cell').textContent = " ... ";
        row.querySelector('.toplam-cell').textContent = " ... ";
    });
    
}

const getSummaryForBundle = (bid) => {
    const monthInput = document.getElementById('monthInput');
    const [year, month] = monthInput.value.split('-');
    const from = `${year}-${month}-01`;
    const to =`${year}-${month}-${getLastDayOfMonth(from)}`;
    commonFetch(`/bundle_vat_total`, receivedBundleVATtotal, {bid: bid, from: from, to: to}, null);
}

const receivedBundleVATtotal = (resp) => {
    if (resp.error) {
        console.error("Error in bundle VAT total data:", resp.error);
        gosterMessage("Hata!", "Etiket KDV toplamı alınamadı.", "danger");
        return;
    }
    // console.log("Received bundle VAT total data:", data);

    const data = returnTotalValuesJSON(resp);

    // Update the row with the new data
    const row = document.getElementById(`bundle_${resp.bid}`);
    if (row) {
        const totalKDV = parseFloat(data.total_kdv || 0);
        const totalVAL = parseFloat(data.total_val || 0);
        const matrah = totalVAL - totalKDV;
        row.querySelector('.receipt-icon').querySelector('span').textContent = data.count || " - ";
        row.querySelector('.matrah-cell').textContent = formatToTRnumbers(matrah) || "0,00";
        row.querySelector('.kdv-cell').textContent = formatToTRnumbers(totalKDV) || "0,00";
        row.querySelector('.toplam-cell').textContent = formatToTRnumbers(totalVAL) || "0,00";
    } else {
        console.warn("Row not found for customer ID:", data.cid);
    }
}

const getSummaryForCompany = () => {
    if (document.getElementById("div-matrah")){
        document.getElementById("div-matrah").textContent = "...";
        document.getElementById("div-kdv").textContent = "...";
        document.getElementById("div-toplam").textContent = "...";
        document.getElementById("div-belge").textContent = "...";
    }
    
    const monthInput = document.getElementById('monthInput');
    const [year, month] = monthInput.value.split('-');
    const customerId = document.querySelector("nav").dataset.cid;
    const from = `${year}-${month}-01`;
    const to =`${year}-${month}-${getLastDayOfMonth(from)}`;
    commonFetch(`/company_vat_total`, receivedCompanyVATtotal, {cid: customerId, from: from, to: to}, null);
}

const receivedCompanyVATtotal = (resp) => {
    if (resp.error) {
        console.error("Error in company VAT total data:", resp.error);
        gosterMessage("Hata!", "Şirket KDV toplamı alınamadı.", "danger");
        return;
    }

    const data = returnTotalValuesJSON(resp);

    //console.log("Received company VAT total data:", data);
    const totalKDV = parseFloat(data.total_kdv || 0);
    const totalVAL = parseFloat(data.total_val || 0);
    const matrah = totalVAL - totalKDV;

    populateSummaryMetrics({matrah, totalKDV, totalVAL, count: data.count || "-"});
}


const getCustomerData = () => {
    const customerId = document.querySelector("nav").dataset.cid;
    commonFetch(`/customer`, receivedCustomerData, {id: customerId}, null);
};

const receivedCustomerData = (customerData) => {
    if (customerData.error) {
        console.error("Error in customer data:", customerData.error);
        gosterMessage("Hata!", "Müşteri verileri alınamadı.", "danger");
        return;
    }
    //console.log("Received customer data:", customerData);
    document.getElementById("customer-name").textContent = customerData.customer_name || "?";
    document.getElementById("shareModalLabel").textContent = customerData.customer_name || "?";
}

// populate dates
const populateDates = () => {
    const tarih = new Date();
    document.getElementById("input-tarih").valueAsDate  = tarih;
    tarih.setMonth(tarih.getMonth() + 1); // Set to one month later
    document.getElementById("input-sonTarih").valueAsDate  = tarih;
};


function handleUserSignedIn(user) {
    //console.log("User signed in:", user);
    getUserData();
    getCustomerData();
    fetchBundles();
    populateTextFilterSelect();
};

function handleNoUserSignedIn() {
    //console.log("No user signed in");
    location.href = "/"; // Redirect to home page if no user is signed in
};


// Customer Share Token Create and other features

const createNewShareTokenForCustomer = () => {
    const customer_id = document.querySelector('.nav-common').dataset.cid;
    const createBtn = document.querySelector('#createShareTokenBtn');
    createBtn.disabled = true; // Disable button to prevent multiple clicks
    document.getElementById("ajaxCreateShareLink").classList.remove('d-none'); // Show loading indicator
    // Call your API or function to create a new share token
    commonFetch(`/create_share_token`, receivedCustomerShareToken, {cid: customer_id}, createBtn);
};

const receivedCustomerShareToken = (json) => {
    enableButton("createShareTokenBtn");
    document.getElementById("ajaxCreateShareLink").classList.add('d-none'); // Hide loading indicator
    if (json.error) {
        console.error("Error in customer shared links:", json.error);
        if(json.err === 102){
            gosterMessage("Hata!", "Yetersiz belge okuma kredisi.", "warning");
        }else{
            gosterMessage("Hata!", "Paylaşım linkleri alınamadı.", "danger");
        }
        return;
    }
    
    gosterMessage("Başarılı!", "Paylaşım linki oluşturuldu.", "success");

    json.record.link.forEach(item => {
        const dropdownItem = returnShareDropdownItem(item);
        document.querySelector('#share-link-container .dropdown-menu').appendChild(dropdownItem);
        shareLinksArr.push(item);
        document.querySelector('#share-link-container').classList.remove('d-none'); // Show the dropdown if there are links
        document.querySelector('#share-link-container .dropdown-menu li:last-child').click();
        showShareActionForm(); // Show the share action form so that the user can edit the link details
    });
};

const getCustomerSharedLinks = () => {
    document.querySelector('#share-link-container').classList.add('d-none'); // Hide the dropdown initially
    //document.querySelector('#shareModalFooter').classList.add('d-none'); // Hide the footer initially
    document.querySelector('.share-action-content').classList.add('d-none'); // Hide the action content initially
    document.querySelector('.share-action-divs').classList.add('d-none'); // Hide the action content initially
    document.querySelector('#createShareTokenBtn').classList.add('d-none'); // Hide the create button initially
    document.querySelector('#shareModalBody .div-data-loading').classList.remove('d-none'); // Show the loading indicator
    const customer_id = document.querySelector('.nav-common').dataset.cid;
    commonFetch(`/get_customer_shared_links`, receivedCustomerSharedLinks, {cid: customer_id}, null);
};

const shareLinksArr = [];

const receivedCustomerSharedLinks = (json) => {
    shareLinksArr.length = 0; // Clear the array
    document.querySelector('#shareModalBody .div-data-loading').classList.add('d-none'); // Hide the loading indicator
    document.querySelector('#createShareTokenBtn').classList.remove('d-none'); // Show the create button
    document.querySelector('#share-link-container .dropdown-menu').innerHTML = ""; // Clear existing dropdown items

    if (json.error) {
        console.error("Error in customer shared links:", json.error);
        if(json.err === 102){
            gosterMessage("Hata!", "Yetersiz belge okuma kredisi.", "warning");
        }else{
            gosterMessage("Hata!", "Paylaşım linkleri alınamadı.", "danger");
        }
        return;
    }

    json.links.forEach(item => {
        const dropdownItem = returnShareDropdownItem(item);
        document.querySelector('#share-link-container .dropdown-menu').appendChild(dropdownItem);
        shareLinksArr.push(item);
    });

    const webHost = json.host  || "https://www.kahramanai.com";

    const sharedLinkContainer = document.querySelector('#share-link-container');
    if (json.links.length > 0) {
        sharedLinkContainer.classList.remove('d-none'); // Show the dropdown if there are links        
        document.querySelector('#share-link-container .dropdown-menu li').click()
        document.querySelector('.share-action-content').classList.remove('d-none');
    }
};

// Event delegation for dropdown items
if (document.querySelector('#share-link-container .dropdown-menu')) {
    document.querySelector('#share-link-container .dropdown-menu').addEventListener('click', (event) => {
        const clickedItem = event.target.closest('li');
        if (clickedItem) {
            const itemId = +clickedItem.getAttribute('data-id');
            const item = shareLinksArr.find(link => link.auto_id === itemId);
            if (item) {
                handleShareItemClick(item);
            }
        }
    });
}


// Handle form submit for new customer
document.getElementById('shareActionForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const shareSelectButton = document.getElementById("shareSelectBtn");
    const shareUpdateBtn = document.getElementById('shareUpdateBtn');
    const customer_id = document.querySelector('.nav-common').dataset.cid;
    if (this.checkValidity()) {
        const formData = new FormData(this);
        const data = {
            q1: formData.get('share-q1'),
            q2: formData.get('share-q2'),
            cid: customer_id,
            id: document.getElementById("shareSelectBtn").getAttribute('data-sid') || "0",
            jwt: document.getElementById("shareSelectBtn").getAttribute('data-jwt') || "0",
        };
        shareUpdateBtn.disabled = true; // Disable button
        shareSelectButton.disabled = true; // Disable the select button
        document.getElementById("ajaxUpdateShareLink").classList.remove('d-none'); // Show loading indicator
        commonFetch("/updateShareLinkCustomer", updatedShareLinkForm, data, shareUpdateBtn);                     
    } else {
        this.reportValidity();
    }
});

const deleteShareLink = (id) => {
    const shareSelectButton = document.getElementById("shareSelectBtn");
    const shareLinkDeleteBtn = document.getElementById("share-action-delete").querySelector('button');
    const item = shareLinksArr.find(link => link.auto_id === +id);
    if (item) {
        // Show loading state
        shareSelectButton.disabled = true;
        shareLinkDeleteBtn.disabled = true;
        document.getElementById("ajaxDeleteShareLink").classList.remove('d-none'); // Show loading indicator
        const customer_id = document.querySelector('.nav-common').dataset.cid;
        commonFetch("/deleteShareLinkCustomer", deletedShareLinkForm, { id: item.auto_id, cid: customer_id }, shareSelectButton);
    }
};

// To prevent focus warning in Chrome
const shareModalEl = document.getElementById('shareModal');
shareModalEl.addEventListener('hidden.bs.modal', () => {
    if (shareModalEl.contains(document.activeElement)) {
        // Remove focus from any element inside the modal
        document.activeElement.blur();
        // Or set focus to a safe element outside the modal
        document.body.focus();
    }
});
