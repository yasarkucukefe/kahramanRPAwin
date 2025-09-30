const RECEIPT_ICON_URL = document.getElementById("div-src") ? document.getElementById("div-src").getAttribute("data-receiptIconUrl") : "";
const LOADING_GIF_URL = document.getElementById("div-src") ? document.getElementById("div-src").getAttribute("data-loadingGifUrl") : "";

const withShareToken = !!document.querySelector("#div-token");


const handleMonthChange = () => {
    const rows = document.querySelectorAll("#customerTable tbody tr");
    rows.forEach(row => {
        const customerId = row.id.replace("cst_", "");
        getSummaryForCompany(customerId); // Fetch summary for each customer
        row.querySelector('.receipt-icon').querySelector('span').textContent = " ... ";
        row.querySelector('.matrah-cell').textContent = " ... ";
        row.querySelector('.kdv-cell').textContent = " ... ";
        row.querySelector('.toplam-cell').textContent = " ... ";
    });
}

const getSummaryForCompany = (customerId) => {
    const monthInput = document.getElementById('monthInput');
    const [year, month] = monthInput.value.split('-');
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

    // Update the row with the new data
    const row = document.getElementById(`cst_${resp.cid}`);
    if (row) {
        const totalKDV = parseFloat(data.total_kdv || 0);
        const totalVAL = parseFloat(data.total_val || 0);
        const matrah = totalVAL - totalKDV;
        row.querySelector('.receipt-icon').querySelector('span').textContent = data.count || " - ";
        row.querySelector('.matrah-cell').textContent = formatToTRnumbers(matrah) || "0,00";
        row.querySelector('.kdv-cell').textContent = formatToTRnumbers(totalKDV) || "0,00";
        row.querySelector('.toplam-cell').textContent = formatToTRnumbers(totalVAL) || "0,00";
    } else {
        console.warn("Row not found for customer ID:", resp.cid);
    }
}



const updateCustomerRow = (row, customer) => {
    const td_code = document.createElement("td");
    td_code.classList.add("editable","td_code");
    if(+customer.status === 0){
        td_code.classList.add("bg-secondary","text-light");
    }
    td_code.textContent = customer.customer_code || "?";
    row.appendChild(td_code);
    //
    const td_name = document.createElement("td");
    td_name.classList.add("editable","td_name");
    td_name.textContent = customer.customer_name || "?";
    row.appendChild(td_name);
    //
    const td_contact = document.createElement("td");
    td_contact.classList.add("editable","td_contact");
    td_contact.textContent = customer.customer_contact || "?";
    row.appendChild(td_contact);
    //
    const td_phone = document.createElement("td");
    td_phone.classList.add("editable","td_phone");
    td_phone.textContent = customer.customer_phone || "?";
    row.appendChild(td_phone);
    //
    const td_email = document.createElement("td");
    td_email.classList.add("editable","td_email");
    td_email.textContent = customer.customer_email || "?";
    row.appendChild(td_email);
    //
    const td_remark = document.createElement("td");
    td_remark.classList.add("editable","td_remark");
    td_remark.textContent = customer.customer_remark || "?";
    row.appendChild(td_remark);
    //
    const td_vergiNo = document.createElement("td");
    td_vergiNo.classList.add("editable","td_vergiNo");
    td_vergiNo.textContent = customer.vergi_no || "?";
    row.appendChild(td_vergiNo);
    //
    const td_vergiDairesi = document.createElement("td");
    td_vergiDairesi.classList.add("editable","td_vergiDairesi");
    td_vergiDairesi.textContent = customer.vergi_dairesi || "?";
    row.appendChild(td_vergiDairesi);
    //
    const td_receiptIcon = document.createElement("td");
    td_receiptIcon.classList.add("receipt-icon", "text-center");
    td_receiptIcon.innerHTML = returnImageTagForReceipt(24) + '<span>...</span>';
    row.appendChild(td_receiptIcon);
    //
    const td_matrah = document.createElement("td");
    td_matrah.classList.add("matrah-cell");
    td_matrah.textContent = "...";
    row.appendChild(td_matrah);
    //
    const td_kdv = document.createElement("td");
    td_kdv.classList.add("kdv-cell", "text-primary");
    td_kdv.textContent = "...";
    row.appendChild(td_kdv);
    //
    const td_toplam = document.createElement("td");
    td_toplam.classList.add("toplam-cell");
    td_toplam.textContent = "...";
    row.appendChild(td_toplam);
}

// Fetch customers 
const fetchCustomers = () => {
    tableIsLoading("customerTable", LOADING_GIF_URL, "Mükellef verileri yükleniyor..."); // Show loading state
    resetTableFilter();
    commonFetch("/customers", receivedCustomers, {}, null);
};

const receivedCustomers = (customers) => {
    if (customers.error) {
        console.error("Error in customers data:", customers.error);
        genericErrorMessage();
        return;
    }
    const tbody = document.querySelector("#customerTable tbody");
    tbody.innerHTML = ""; // Clear existing rows
    if (customers.length === 0) {
        tbody.innerHTML = "<tr class='no-records'><td colspan='8' class='text-center'>Henüz mükellef bulunmamaktadır.</td></tr>";
        return;
    }
    customers.forEach(customer => {
        const row = document.createElement("tr");
        row.id = `cst_${customer.auto_id}` || "id_unknown";
        updateCustomerRow(row, customer);
        tbody.appendChild(row);
        addRowClickEvent(row); // Add click event to the row
        getSummaryForCompany(customer.auto_id); // Fetch summary for each customer
    });
};



const addRowClickEvent = (row) => {
    row.addEventListener("click", function(e) {
        if (e.target.classList.contains("pencil")) {
            // If pencil icon clicked, do nothing
            return;
        }
        // If row clicked, get customer data
        const link = `/c/${row.id.replace("cst_","")}`;
        location.href = link; // Redirect to customer details page
    });
};


function handleUserSignedIn() {
    getUserData();
    fetchCustomers();
    populateTextFilterSelect();    
}

function handleNoUserSignedIn() {
    //console.log("No user signed in");
    location.href = "/"; // Redirect to home page if no user is signed in
}



