
const shr_getUserCredits = () => {
    commonFetchShare("/shr_userCredits", shr_receivedUserCredits, {}, null);
};

const shr_receivedUserCredits = (userCredits) => {
    if(userCredits.error) {
        gosterMessage("Hata!", "Müşteri verileri alınamadı.", "danger");
        return;
    }
    document.getElementById("user-credits").querySelector("span").innerText = userCredits.credits || "0";
};

const shr_getCustomerData = () => {
    const customerId = document.querySelector("nav").dataset.cid;
    commonFetchShare(`/shr_customer`, shr_receivedCustomerData, {id: customerId}, null);
};

const shr_receivedCustomerData = (customerData) => {
    if (customerData.error) {
        console.error("Error in customer data:", customerData.error);
        gosterMessage("Hata!", "Müşteri verileri alınamadı.", "danger");
        return;
    }
    document.getElementById("customer-name").textContent = customerData.customer_name || "?";
}

const shr_shareRemarks = () => {
    const customerId = document.querySelector("nav").dataset.cid;
    commonFetchShare(`/shr_remarks`, shr_receivedRemarks, {id: customerId}, null);
};

const shr_receivedRemarks = (remarksData) => {
    if (remarksData.error) {
        console.error("Error in remarks data:", remarksData.error);
        gosterMessage("Hata!", "Paylaşılan bağlantı verisi alınamadı.", "danger");
        return;
    }
    document.getElementById("share-rmk").textContent = remarksData.share_rmk1 || "?";
    document.getElementById("share-rmk").title = remarksData.share_rmk2 || "?";
}
