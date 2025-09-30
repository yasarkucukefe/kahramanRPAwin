// This file contains utility functions for the web application

const validateUploadFile = file => file.size <= MAX_FILE_SIZE && ALLOWED_TYPES.includes(file.type);

const gosterCount = (val) => parseInt(val) > 0 ? val : "-";

const showShareLinkError = () => {
    gosterMessage("Hata", "Geçersiz paylaşım linki. Lütfen kontrol ediniz.", "danger");
    document.getElementById("submitButton2").disabled = false; // Re-enable button
}

// Process share link here
const useShareLink = async() => {
    document.getElementById("submitButton2").disabled = true; // Disable button to prevent multiple clicks
    const shareLink = document.getElementById("shareLink").value.trim();
    if (!shareLink) {
        showShareLinkError();
        return;
    }

    const parts = shareLink.split('/');
    const token = parts.pop(); // get the last part
    if(!token){
        showShareLinkError();
        return;
    }

    options = {
            method: 'POST',
            body: JSON.stringify({}),
        };

    try {
        const response = await fetchWithToken("/shr_check_token", options, token);
        document.getElementById("submitButton2").disabled = false; // Re-enable button
        if(response.error) {
            showShareLinkError();
            return;
        }
        if(response.uid) {
            const origin = window.location.origin;
            const shareLink = `${origin}/shared/${response.token}`;
            window.location.href = shareLink; // Redirect to the share link page
        }
    } catch (error) {
        showShareLinkError();
        return;
    }
}

async function fetchWithToken(endPoint, options = {}, token) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        ...options.headers,
    };

    const response = await fetch(endPoint, { ...options, headers });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

const trDateFromIso = (isoDate) => {
    try {
        const date = new Date(isoDate);
        return date.toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    } catch (error) {
        console.error("Error parsing date:", error);
        return isoDate;
    }
};

const showCustomersPage = () => {
    const cid = document.getElementById("div-data").dataset.cid;
    window.open(`/c/${cid}`, '_self');
}

const returnTotalValuesJSON = (data) => {
    //console.log("Received total values data:", data);
    const json = {total_val: 0, total_kdv: 0, count: 0};
    data.items.forEach(item => {
        if(+item.durum > 0){
            const kkeg = parseInt(item.kkeg || 0);
            const ind = item.hasOwnProperty("ind") ? +item.ind : 1;
            const oran = parseFloat(item.oran || 100) / 100;
            if(kkeg === 0){ // if not KKEG
                json.total_val += parseFloat(item.toplam || 0) * oran;
            }
            if(ind === 1 && kkeg === 0){ // if KDV indirilebilir
                json.total_kdv += parseFloat(item.kdv || 0) * oran;
            }            
            json.count += 1;
        }        
    });
    return json;
}

function showToast(message, type = 'info') {
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
    <div id="\${toastId}" class="toast align-items-center text-white bg-\${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
            <div class="toast-body">\${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    </div>`;
    document.getElementById("toastContainer").insertAdjacentHTML("beforeend", toastHTML);
    new bootstrap.Toast(document.getElementById(toastId), { delay: 5000 }).show();
}

const turkishDateFormat = (dateString) => {
    const myArr = dateString.split("-");
    if (myArr.length !== 3) {
        console.error("Invalid date format:", dateString);
        return dateString; // Return original string if format is invalid
    }
    const year = myArr[0];
    const month = myArr[1];
    const day = myArr[2];
    return `${day}.${month}.${year}`;
}

const convertToLocalDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const populateSummaryMetrics = (data) => {
    document.getElementById("div-summaryMetrics").innerHTML = `
        <span class="badge bg-light fs-6 px-3 py-1 shadow-sm">
            <div class="small text-secondary fw-normal mb-1">MATRAH</div>
            <div class="fw-bold text-success" id="div-matrah"></div>
        </span>

        <span class="badge bg-light fs-6 px-3 py-1 shadow-sm">
            <div class="small text-secondary fw-normal mb-1">KDV TOPLAM</div>
            <div class="fw-bold text-primary" id="div-kdv"></div>
        </span>
        
        <span class="badge bg-light fs-6 px-3 py-1 shadow-sm">
            <div class="small text-secondary fw-normal mb-1">TOPLAM</div>
            <div class="fw-bold text-dark" id="div-toplam"></div>
        </span>

        <span class="badge bg-warning fs-6 px-3 py-1 shadow-sm">
            <div class="fw-bold text-dark" id="div-belge"></div>
            <div class="small text-secondary fw-normal m-1">Belge</div>
        </span>
    `
    document.getElementById("div-matrah").textContent = formatToTRnumbers(data.matrah);
    document.getElementById("div-kdv").textContent = formatToTRnumbers(data.totalKDV);
    document.getElementById("div-toplam").textContent = formatToTRnumbers(data.totalVAL);
    document.getElementById("div-belge").textContent = data.count;
}

const formatToTRnumbers = (num, dec=2) => {
    try {
        let numericValue;
        let decimalPlaces = 0;

        // 1. If the input is a string, determine the number of decimal places from it.
        // This is crucial for preserving trailing zeros (e.g., "46.90" vs "46.9").
        if (typeof num === 'string') {
            const parts = num.split('.');
            if (parts.length > 1) {
                decimalPlaces = parts[1].length;
            }
            numericValue = parseFloat(num); // Convert string to number for formatting
        } else if (typeof num === 'number') {
            // If it's already a number, converting it to string and back
            numericValue = num;
            decimalPlaces = dec; // Use the provided decimal places
        } else {
            // Handle other types (e.g., null, undefined, objects)
            return num; // Or throw an error, depending on desired behavior
        }

        // Handle cases where parsing results in NaN
        if (isNaN(numericValue)) {
            console.error("Invalid number format:", num);
            return num; // Return original if it couldn't be parsed
        }

        // Set options for toLocaleString to control minimum and maximum fractional digits
        const options = {
            minimumFractionDigits: decimalPlaces, // Always show at least this many
            maximumFractionDigits: decimalPlaces  // Never show more than this many
        };
        return numericValue.toLocaleString('tr-TR', options);

    } catch (error) {
        console.error("Error formatting number to TR locale:", error);
        return num; // Return original value if formatting fails
    }
};

function getLastDayOfMonth(yyyyMmDd) {
    // yyyyMmDd must be in 'YYYY-MM-DD' format
    const [year, month] = yyyyMmDd.split('-').map(Number);
    // JS months are 0-based, so for next month use month (not month - 1)
    // Set day to 0, which is the last day of the previous month (i.e., the target month)
    const lastDay = new Date(year, month, 0).getDate();
    return lastDay;
}

const removeNoRecordsRow = (tableID) => {
    const table = document.getElementById(tableID);
    const noRecordsRow = table.querySelector("tr.no-records");
    if (noRecordsRow) {
        noRecordsRow.remove();
        table.querySelector("tfoot").innerHTML = ""; // Clear footer
    }
};

const removeUploadingRow = (tableID) => {
    const table = document.getElementById(tableID);
    const uploadingRow = table.querySelector("tr.files-uploading");
    if (uploadingRow) {
        uploadingRow.remove();
    }
};

const showTableFooter = (msg="Filtreleme sonucu bir kayıt bulunamadı.") => {
    document.querySelector('.dataTable tfoot tr').classList.remove('d-none');
    const table = document.querySelector('.dataTable');
    const thCount = table.querySelectorAll("th").length;
    const trText =  `<tr><td colspan='${thCount}' class='text-secondary text-center'>${msg}</td></tr>`;
    table.querySelector("tfoot").innerHTML = trText;
};

const noRecordFoundMessage = (tableId, msg="Seçilen kriterlere uygun kayıt bulunamadı.") => {
    const trs = document.querySelectorAll(`#${tableId} tbody tr`);
    const tfoot = document.querySelector(`#${tableId} tfoot`);
    if(trs.length > 0) {
        tfoot.innerHTML = "";
        return;
    }
    const table = document.querySelector(`#${tableId}`);
    const thCount = table.querySelectorAll("th").length;
    const trText =  `<tr><td colspan='${thCount}' class='text-secondary text-center'>${msg}</td></tr>`;
    tfoot.innerHTML = trText;
};

const hideTableFooter = () => {
    document.querySelector('.dataTable tfoot').innerHTML = "";
};

const tableIsLoading = (tableID, loaderImgUrl, msg="Kayıtlar yükleniyor...") => {
    const table = document.getElementById(tableID);
    const thCount = table.querySelectorAll("th").length;
    const loading = `<img src='${loaderImgUrl}' alt='Yükleniyor...' class='loading-spinner'>`;
    const trLoading =  `<tr><td colspan='${thCount}' class='text-center'>${loading} <br> ${msg}</td></tr>`;
    table.querySelector("tbody").innerHTML = trLoading;
    table.querySelector("tfoot").innerHTML = ""; // Clear footer
}

// get user data on page load
const getUserData = () => {
    commonFetch("/userData",receivedUserData,{},null);
}

const receivedUserData = (userData) => {
    if(userData.error) {
        console.error("Error in user data:", userData.error);
        genericErrorMessage();
        return;
    }
    //console.log("Received user data:", userData);
    //document.getElementById("user-fullname").textContent = userData.name || "?";
    document.querySelector(".user-fullname").textContent = userData.name || "?";
    document.querySelector(".user-email-addr").textContent = userData.email || "?";
    getUserCredits();
};


const returnImageTagForReceipt = (width=24) => {
    return `<img class='receipt-icon' src="${RECEIPT_ICON_URL}" alt="Receipt" style='cursor:pointer' width="${width}">`;
}

// Fetch user credits

const getUserCredits = () => {
    if(withShareToken){
        commonFetchShare("/shr_userCredits", receivedUserCredits, {}, null);
    }else{
        commonFetch("/userCredits", receivedUserCredits, {}, null);
    }
};

let createUserIfNotExists = true;

const receivedUserCredits = (userCredits) => {
    if(userCredits.error) {
        if(userCredits.err === 102 && createUserIfNotExists){
            createUserIfNotExists = false;
            getUserCredits();
        }else{
            console.error("Error in user credits:", userCredits.error);
            genericErrorMessage();
        }
        return;
    }
    //console.log("Received user credits:", userCredits);
    document.getElementById("user-credits").querySelector("span").innerText = userCredits.credits || "0";
};


// type: success, danger, warning, info
const gosterMessage = (strong, text, type="info") => {
    const el = document.getElementById('resultMessage');
    el.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <strong>${strong}</strong> ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    el.style.display = "block";
    // Fade away after 3 seconds
    fadeOutAfterShowingMessage(el);
}

const fadeOutAfterShowingMessage = (el, duration = 2000) => {
    setTimeout(() => {
        el.firstElementChild.classList.remove('show'); // start Bootstrap fade-out
        setTimeout(() => {
            el.style.display = 'none';
        }, 300); // Bootstrap .fade duration
    }, duration);
};

const genericErrorMessage = () => {
    gosterMessage("Hata", "Bir hata oluştu. Lütfen tekrar deneyin.", "danger");
}

const createUUID = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    } else {
        // Fallback manual generation
        const timestamp = Date.now().toString(16); // current time in hex
        const randomPart = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        return `${timestamp}-${randomPart}`;
    }
}

const enableButton = (id) => {
    document.getElementById(id).disabled = false; // Enable button
    document.getElementById(id).classList.remove('disabled'); // Remove Bootstrap disabled class  
}

const commonFetch = async(endpoint,callback, data={}, dsbElm=null) => {
    if(dsbElm){
        dsbElm.disabled = true; // Disable button
        dsbElm.classList.add('disabled'); // Add Bootstrap disabled class
    }
    const idToken = localStorage.getItem("idToken");
    fetch(endpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + idToken
        },
        body: JSON.stringify(data)
    }).then(res => res.json())
    .then(callback)
    .catch(error => {
        console.error("Error:", error);
        if(dsbElm){
            dsbElm.disabled = false; // Enable button
            dsbElm.classList.remove('disabled'); // Remove Bootstrap disabled class
        }
        gosterMessage("Hata", "Bir hata oluştu. Lütfen tekrar deneyin.", "danger");
    });
}

const setSelectByText = (selectId, text) => {
    const select = document.getElementById(selectId);
    for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].text === text) {
            select.selectedIndex = i;
            break;
        }
    }
}

const commonFetchShare = async(endpoint,callback, data={}, dsbElm=null) => {
    if(dsbElm){
        dsbElm.disabled = true; // Disable button
        dsbElm.classList.add('disabled'); // Add Bootstrap disabled class
    }
    const shareToken = document.getElementById("div-token").dataset.token;
    fetch(endpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + shareToken
        },
        body: JSON.stringify(data)
    }).then(res => res.json())
    .then(callback)
    .catch(error => {
        console.error("Error:", error);
        if(dsbElm){
            dsbElm.disabled = false; // Enable button
            dsbElm.classList.remove('disabled'); // Remove Bootstrap disabled class
        }
        gosterMessage("Hata", "Bir hata oluştu. Lütfen tekrar deneyin.", "danger");
    });
}

// Receipts table in DynamoDB returns "vat_table" as a typed JSON structure for attribute values.
// Deserialize array of DynamoDB Maps
// Usage: 
// const vatTable = vatTableRaw.map(item => parseDynamoMap(item.M));

function parseDynamoValue(value) {
  if (value.N !== undefined) return parseFloat(value.N);
  if (value.S !== undefined) return value.S;
  if (value.M !== undefined) return parseDynamoMap(value.M);
  if (value.L !== undefined) return value.L.map(parseDynamoValue);
  if (value.BOOL !== undefined) return value.BOOL;
  if (value.NULL !== undefined) return null;
  return value;
}

function parseDynamoMap(map) {
  const result = {};
  for (const key in map) {
    result[key] = parseDynamoValue(map[key]);
  }
  return result;
}


const unixTimestampToDatetimeTR = (unixTimestamp) => {
    if (!unixTimestamp) return "";
    const date = new Date(unixTimestamp * 1000); // Convert seconds to milliseconds
    return date.toLocaleString("tr-TR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

const trNumberToDecimalSimple = (str) => {
    // Remove thousand separators (.)
    let s = str.replace(/\./g, '');
    // Replace decimal comma (,) with dot (.)
    return s.replace(',', '.');
}

const trNumberToDecimal = (numericValue) => {
    let numStr = numericValue.toString().trim();

    // 1. Basic validation and trimming
    if (typeof numStr !== 'string' || numStr.trim() === '') {
        return NaN; // Return NaN for non-string or empty inputs
    }

    let s = numStr.trim();

    // 2. Determine potential decimal and thousand separators
    const lastDotIdx = s.lastIndexOf('.');
    const lastCommaIdx = s.lastIndexOf(',');

    let decimalSeparator = '.'; // Default assumption for decimal
    let thousandSeparator = null; // Default assumption for thousand (none)

    // Case A: Both dot and comma exist
    if (lastDotIdx > -1 && lastCommaIdx > -1) {
        if (lastDotIdx > lastCommaIdx) {
            // Example: "1,234,567.89" -> Dot is decimal, Comma is thousand
            decimalSeparator = '.';
            thousandSeparator = ',';
        } else {
            // Example: "1.234.567,89" -> Comma is decimal, Dot is thousand
            decimalSeparator = ',';
            thousandSeparator = '.';
        }
    }
    // Case B: Only dot exists
    else if (lastDotIdx > -1) {
        // Ambiguity: "1.234" (thousand) vs "123.45" (decimal)
        // Heuristic: If a dot is followed by exactly 3 digits at the very end of the integer part,
        // it's usually a thousand separator. Otherwise, it's a decimal.
        // This regex ensures it's specifically a thousand separator pattern (e.g., "1.234" but not "1.234.567")
        if (s.match(/^-?\d{1,3}(\.\d{3})+$/)) {
             // Example: "1.234", "123.456", "-1.234.567"
            thousandSeparator = '.';
            decimalSeparator = null; // No explicit decimal here, it's an integer
        } else {
            // Example: "123.45", "1.2"
            decimalSeparator = '.';
            thousandSeparator = null;
        }
    }
    // Case C: Only comma exists
    else if (lastCommaIdx > -1) {
        // Ambiguity: "1,234" (thousand) vs "123,45" (decimal)
        // Heuristic: Same logic as for dot.
        if (s.match(/^-?\d{1,3}(,\d{3})+$/)) {
            // Example: "1,234", "123,456", "-1,234,567"
            thousandSeparator = ',';
            decimalSeparator = null; // No explicit decimal here, it's an integer
        } else {
            // Example: "123,45", "1,2"
            decimalSeparator = ',';
            thousandSeparator = null;
        }
    }
    // Case D: No separators exist (e.g., "1234") - already in desired format

    // 3. Remove thousand separators
    if (thousandSeparator) {
        // Escape the separator character for regex if it's a special character like '.'
        const escapedThousandSeparator = thousandSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        s = s.replace(new RegExp(escapedThousandSeparator, 'g'), '');
    }

    // 4. Replace decimal separator with a dot if necessary
    if (decimalSeparator && decimalSeparator !== '.') {
        const escapedDecimalSeparator = decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        s = s.replace(new RegExp(escapedDecimalSeparator, 'g'), '.');
    }

    // 5. Convert to number and then back to string to finalize format (e.g., "123." becomes "123")
    const num = parseFloat(s);

    // Return NaN if the string couldn't be parsed into a valid number
    if (isNaN(num)) {
        return NaN;
    }

    return num.toString();
}

function isNumeric(str) {
  return !isNaN(str) && !isNaN(parseFloat(str));
}

/**
 * Converts a date string from DD.MM.YYYY format to ISO YYYY-MM-DD format.
 * If the input date string is already in a valid ISO YYYY-MM-DD format, it returns it directly.
 * Returns null if the input format is incorrect or the date itself is invalid for either format.
 *
 * @param {string} dateString The date string in DD.MM.YYYY or YYYY-MM-DD format.
 * @returns {string|null} The date in YYYY-MM-DD format, or null if conversion/validation fails.
 */
const convertDMYtoISO = (dateString) => {
    // 1. Basic input validation
    if (typeof dateString !== 'string' || dateString.trim() === '') {
        return null;
    }

    const trimmedDateString = dateString.trim().split("/").join("."); // Normalize slashes to dots

    // Helper function to validate if a set of year, month, day forms a valid calendar date
    // This helps avoid repeating the validation logic for both formats.
    const isValidCalendarDate = (year, month, day) => {
        // Month in Date constructor is 0-indexed (0-11)
        const dateObject = new Date(year, month - 1, day);

        // Check if the Date object is "Invalid Date" OR if the components
        // "rolled over" to a different date due to invalid input (e.g., Feb 30th)
        return (
            !isNaN(dateObject.getTime()) && // Checks if the date is not "Invalid Date"
            dateObject.getFullYear() === year &&
            dateObject.getMonth() === (month - 1) &&
            dateObject.getDate() === day
        );
    }

    // --- Attempt to parse and validate ISO YYYY-MM-DD format first ---
    const isoRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    let match = trimmedDateString.match(isoRegex);

    if (match) {
        // Input looks like YYYY-MM-DD. Now validate if it's a real date.
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);

        if (isValidCalendarDate(year, month, day)) {
            // It's a valid date and already in ISO format, so return it.
            // We re-construct it to ensure proper padding, even if the regex implies it.
            const isoMonth = month.toString().padStart(2, '0');
            const isoDay = day.toString().padStart(2, '0');
            return `${year}-${isoMonth}-${isoDay}`;
        } else {
            // It matched the ISO format pattern, but it's an invalid calendar date (e.g., "2023-02-30")
            return null;
        }
    }

    // --- If not ISO, attempt to parse and convert DD.MM.YYYY format ---
    const dmyRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    match = trimmedDateString.match(dmyRegex); // Reuse the 'match' variable

    if (match) {
        // Input looks like DD.MM.YYYY. Now validate if it's a real date.
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);

        if (isValidCalendarDate(year, month, day)) {
            // It's a valid DD.MM.YYYY date, convert it to ISO YYYY-MM-DD.
            const isoMonth = month.toString().padStart(2, '0');
            const isoDay = day.toString().padStart(2, '0');
            return `${year}-${isoMonth}-${isoDay}`;
        } else {
            // It matched the DD.MM.YYYY format pattern, but it's an invalid calendar date (e.g., "30.02.2023")
            return null;
        }
    }

    // --- If neither format matched ---
    return null;
}