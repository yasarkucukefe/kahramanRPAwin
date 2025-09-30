// Zoom functionality for the receipt image
document.getElementById('zoomSelect').addEventListener('change', function() {
    const scale = parseFloat(this.value);
    const receiptImage = document.getElementById('receipt-image');
    receiptImage.style.transform = `scale(${scale})`;
    receiptImage.style.transformOrigin = 'top left'; // Ensures zoom from top-left
});

// Mouse dragging functionality for the receipt image
const imgContainer = document.getElementById('receipt-container');
let isDragging = false;
let startX, startY, scrollLeft, scrollTop;

imgContainer.addEventListener('mousedown', function(e) {
    isDragging = true;
    imgContainer.style.cursor = 'grabbing';
    startX = e.pageX - imgContainer.offsetLeft;
    startY = e.pageY - imgContainer.offsetTop;
    scrollLeft = imgContainer.scrollLeft;
    scrollTop = imgContainer.scrollTop;
});

imgContainer.addEventListener('mouseleave', function() {
    isDragging = false;
    imgContainer.style.cursor = 'grab';
});

imgContainer.addEventListener('mouseup', function() {
    isDragging = false;
    imgContainer.style.cursor = 'grab';
});

imgContainer.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - imgContainer.offsetLeft;
    const y = e.pageY - imgContainer.offsetTop;
    const walkX = (x - startX);
    const walkY = (y - startY);
    imgContainer.scrollLeft = scrollLeft - walkX;
    imgContainer.scrollTop = scrollTop - walkY;
});


// Handle saving of receipt details
const confirmToastEl = document.getElementById('confirmToast');
const confirmToast = new bootstrap.Toast(confirmToastEl);

function editReceiptCellVAT(btn) {
    const dataLoading = document.getElementById('receiptsDataTable').dataset.loading;
    if (parseInt(dataLoading) === 1) {return;} // Prevent editing while data is loading    
    const table = btn.closest('table');
    const tr = table.closest('tr');
    if (!tr) return; // Ensure we have a valid row
    if(document.querySelectorAll('#receiptsDataTable tbody tr.editing').length > 0) {
        gosterMessage('','Sadece bir satır düzenlenebilir. Lütfen mevcut düzenlemeyi kaydedin veya iptal edin.', 'warning');
        return;
    } 
    document.getElementById('receiptsDataTable').dataset.loading = "1";
    tr.classList.add('editing'); // Add editing class to the row
    const tdActions = tr.querySelector('.rcpActions');
    if (tdActions) {
        tdActions.classList.remove('d-none'); // Show the actions for the current row
    }

    table.querySelectorAll('a.td-delete').forEach(td => {
        td.classList.remove('d-none');
    });

    document.querySelector('.rcpVATtable thead th.editPencil').classList.add('d-none'); // Hide the edit button in the header

    document.querySelectorAll('.rcpVATtable tbody td.rcpValue').forEach(td => {
        td.dataset.originalvalue = td.textContent.trim(); // Save original
        td.setAttribute('contenteditable', 'true'); // Make the cell editable

        td.addEventListener('click', function() {
            this.setAttribute('contenteditable', 'true');
            this.focus();
            this.dataset.originalvalue = this.textContent.trim(); // Save original
        });

        td.addEventListener('blur', function() {
            this.removeAttribute('contenteditable');
            const original = this.dataset.originalvalue;
            const current = this.textContent.trim();
            if (current !== original) {
                this.classList.add('changedCell');
                // Optional: handle/save change here
                const saveButton = document.getElementById('button-save-details');
                saveButton.classList.remove('d-none');
            } else {
                this.classList.remove('changedCell');
            }
        });
    });
    // Defer focus to the next "tick"
    setTimeout(() => {
        const firstTd = document.querySelector('.rcpVATtable tbody td.rcpValue');
        if (firstTd) firstTd.focus();
    }, 0);
}


function editReceiptCell(btn) {
    const dataLoading = document.getElementById('receiptsDataTable').dataset.loading;
    if (parseInt(dataLoading) === 1) {return;} // Prevent editing while data is loading    
    const tr = btn.closest('tr');
    if (!tr) return; // Ensure we have a valid row    
    // Prevent multiple rows from being edited at the same time
    if(document.querySelectorAll('#receiptsDataTable tbody tr.editing').length > 0) {
        gosterMessage('','Sadece bir satır düzenlenebilir. Lütfen mevcut düzenlemeyi kaydedin veya iptal edin.', 'warning');
        return;
    } 
    if (tr.classList.contains('editing')) return; // Check if the row is already in editing mode
    document.getElementById('receiptsDataTable').dataset.loading = "1";
    // Remove editing mode from any other rows
    const tdActions = tr.querySelector('.rcpActions');
    if (tdActions) {
        tdActions.classList.remove('d-none'); // Show the actions for the current row
    }
    const tdValue = tr.querySelector('.rcpValue');
    if (!tdValue) return; // Ensure we have a valid value cell
    tr.classList.add('editing');
    const originalvalue = tdValue.querySelector('span').textContent.trim();
    tdValue.innerHTML = ''; // Clear the cell content
    tdValue.textContent = originalvalue === "-" || originalvalue === "..." ? "" : originalvalue;
    tdValue.setAttribute('contenteditable', 'true');
    tdValue.focus();
    tdValue.dataset.originalvalue = originalvalue; // Save original value

}

const checkNewVATRow = () => {
    let validNewVAT = true;
    const newVatRow = document.querySelector('.rcpVATtable tbody tr.newVatRow');
    if (!newVatRow) {
        return true; // If there is no new VAT row, it's valid
    }

    const newVatCells = newVatRow.querySelectorAll('td.rcpValue');
    newVatCells.forEach(td => {
        if( td.textContent.trim() !== '' && td.textContent.trim() !== '%') {
            td.classList.add('changedCell'); // Mark cell as changed if value is different
        }
        validNewVAT = validNewVAT && (td.textContent.trim() !== '' );
        if(td.textContent.trim() === '' || td.textContent.trim() === '%') {
            td.classList.add('text-danger'); // Mark empty cells as error
            validNewVAT = false; // If any cell is empty, the new VAT row is invalid
        }
    });

    if (validNewVAT === false){
        gosterMessage('','Yeni KDV oranı için tüm hücreler doldurulmalıdır. Lütfen kontrol edin.', 'danger');
        document.getElementById('receiptsDataTable').dataset.loading = "0"; // Reset loading state
        return false; // Prevent saving if new VAT row is invalid
    }
        
    // new VAT row is valid, remove its new vat tag
    document.querySelector('.rcpVATtable tbody tr.newVatRow').classList.remove('newVatRow'); // Remove the new VAT row class
    
    return true; // New VAT row is valid
}

function saveVATEdit(tr) {
    const tdActions = tr.querySelector('.rcpActions');
    if (tdActions) {
        tdActions.classList.add('d-none'); // Hide the actions after saving
    }

    if( !checkNewVATRow()) {
        // If the new VAT row is not valid, do not proceed with saving
        return;
    }

    // Check if any cell has changed
    document.querySelectorAll('.rcpVATtable tbody td.rcpValue').forEach(td => {
        if(td.dataset.originalvalue){
            if( td.textContent.trim() !== td.dataset.originalvalue.trim()) {
                td.classList.add('changedCell'); // Mark cell as changed if value is different
            }
            td.setAttribute('contenteditable', 'false'); // Make the cell editable
        }        
    });

    tr.classList.remove('editing');
    document.querySelector('.rcpVATtable thead th.editPencil').classList.remove('d-none');
    document.getElementById('receiptsDataTable').dataset.loading = "0"; // Reset loading state

    const saveButton = document.getElementById('button-save-details');
    saveButton.classList.remove('d-none');
}

function saveReceiptCell(btn) {
    const tr = btn.closest('tr');
    if (!tr) return; // Ensure we have a valid row
    if(tr.classList.contains('vatTableTr')) {
        saveVATEdit(tr);
        return;
    }
    const tdValue = tr.querySelector('.rcpValue');
    const newValue = tdValue.textContent.trim();
    if (newValue === tdValue.dataset.originalvalue) {
        // If the value hasn't changed, just cancel the edit
        cancelReceiptEdit(btn);
        return;
    }
    // If the value has changed, update the cell
    tdValue.innerHTML = editableCellHTML;
    tdValue.querySelector('.cell-value').textContent = newValue; // Set new value
    tdValue.classList.add('changedCell'); // Mark the cell as changed
    tr.classList.remove('editing');
    const tdActions = tr.querySelector('.rcpActions');
    if (tdActions) {
        tdActions.classList.add('d-none'); // Hide the actions after saving
    }
    const saveButton = document.getElementById('button-save-details');
    saveButton.classList.remove('d-none');
    document.getElementById('receiptsDataTable').dataset.loading = "0"; // Reset loading state

}

function cancelReceiptEdit(btn) {
    const tr = btn.closest('tr');
    if (!tr) return; // Ensure we have a valid row
    if(tr.classList.contains('vatTableTr')) {
        cancelVATEdit(tr);
        return;
    }
    const tdValue = tr.querySelector('.rcpValue');
    if (!tdValue) return; // Ensure we have a valid value cell
    const originalvalue = tdValue.dataset.originalvalue; // Restore original value
    tdValue.innerHTML = editableCellHTML;
    tdValue.querySelector('.cell-value').textContent = originalvalue; // Set original value
    tr.classList.remove('editing');
    tr.querySelector('.rcpActions').classList.add('d-none'); // Hide the actions
    document.getElementById('receiptsDataTable').dataset.loading = "0"; // Reset loading state
}

function cancelVATEdit(tr) {
    document.querySelector('.rcpVATtable tbody tr.newVatRow')?.remove(); // Remove the new VAT row if it exists
    document.querySelectorAll('.rcpVATtable tbody td.rcpValue').forEach(td => {
        if (!td.dataset.originalvalue) return; // Skip if no original value
        td.textContent = td.dataset.originalvalue.trim(); // use original value
        td.classList.remove('changedCell'); // Remove changed cell class
        td.setAttribute('contenteditable', 'false'); // Make the cell not editable again
    });
    tr.classList.remove('editing');
    tr.querySelector('.rcpActions').classList.add('d-none'); // Hide the actions
    document.getElementById('receiptsDataTable').dataset.loading = "0"; // Reset loading state
    document.querySelector('.rcpVATtable thead th.editPencil').classList.remove('d-none'); // Show the edit button in the header

    tr.querySelectorAll('a.td-delete').forEach(td => {
        td.classList.add('d-none');
    });
};


const addNewRowToVATTable = () => {
    // Add a new row for adding new VAT entry
    if(document.querySelector('.newVatRow')) {
        gosterMessage("Uyarı!", "Yeni KDV satırı zaten mevcut. Kayıt veya iptal edin.", "warning");
        return; // Prevent adding a new row if it already exists
    }
    const newVatRow = document.createElement('tr');
    newVatRow.innerHTML = `<td class='rcpValue vatPercent' contenteditable='true' data-originalvalue='%' data-field='vat_rate'>%</td>
                            <td class='rcpValue' contenteditable='true' data-originalvalue='' data-field='vat_amount'></td>
                            <td class='rcpValue' contenteditable='true' data-originalvalue='' data-field='vat_total'></td>
                            <td><a href="#" onclick="deleteVATRow(this)" class="text-danger text-center"><i class="bi bi-x-lg text-danger" title="Sil" style="cursor: pointer;" ></i></a></td>`;
    newVatRow.classList.add('newVatRow'); // Add a class to identify the new row
    document.querySelector('.rcpVATtable tbody').appendChild(newVatRow);
    const td = newVatRow.querySelector('.vatPercent');
    td.focus();
    // Place the cursor at the end
    const range = document.createRange();
    range.selectNodeContents(td);
    range.collapse(false); // false means collapse to end

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    const table = document.querySelector('.rcpVATtable');
    const tr = table.closest('tr');
    const tdActions = tr.querySelector('.rcpActions');
    if (tdActions) {
        tdActions.classList.remove('d-none'); // Show the actions for the current row
    }
};

const showPreviousOrNextReceipt = (which) => {
    if(document.querySelectorAll('td.changedCell').length > 0){
        confirmToast.show();
        return; // Prevent changing receipt if there are unsaved changes
    }
    if(document.querySelectorAll('#receiptsDataTable tbody tr.editing').length > 0) {
        gosterMessage('','Lütfen mevcut düzenlemeyi kaydedin veya iptal edin.', 'warning');
        return;
    } 

    if(showReceiptFromUpload){
        showNextPrevUploadedFile(which);
        return;
    }

    const rid = document.getElementById('fullscreenModal').dataset.rid;
    const tr = document.getElementById(rid);
    if (tr) {
        if(+which === 0){ // Reload the same receipt
            getReceiptbyId(tr.dataset.docid, tr.id, false);
            return;
        }
        const myTr = +which < 0 ? tr.previousElementSibling : tr.nextElementSibling;
        if (myTr) {
            skipHiddenTableRows(myTr, which);
        }
    } else {
        gosterMessage("Hata!", "Fiş bulunamadı.", "warning");
    }
}

const skipHiddenTableRows = (tr, which) => {
    if (tr && tr.style.display !== 'none') {
        const receipt_id = tr.id;
        const doc_id = tr.dataset.docid;
        getReceiptbyId(doc_id, receipt_id, false);
        return;
    }   

    if (tr) {
        const myTr = which < 0 ? tr.previousElementSibling : tr.nextElementSibling;
        if (myTr) {
            skipHiddenTableRows(myTr, which);
        }
    }
}

const showNextPrevUploadedFile = (which) => {
    const docId = document.getElementById('fullscreenModal').dataset.did;
    const uploadItem = document.getElementById(`upload-item-${returnUploadItemId(docId)}`);
    if(uploadItem){
        const showItem = +which < 0 ? uploadItem.previousElementSibling : uploadItem.nextElementSibling;
        if(showItem){
            const doc_id = showItem.getAttribute("data-id");
            getReceiptbyId(doc_id, "0", false);
        }
    }
}

// Cache receipt image pre-fetching
const getNextReceiptImage = () => {
    const rid = document.getElementById('fullscreenModal').dataset.rid;
    const tr = document.getElementById(rid);
    if (tr) {
        const myTr = tr.nextElementSibling;
        if (myTr) {
            skipHiddenTableRowsToFindNext(myTr);
        }
    } else {
        gosterMessage("Hata!", "Fiş bulunamadı.", "warning");
    }
}

const skipHiddenTableRowsToFindNext = (tr) => {
    if (tr && tr.style.display !== 'none') {
        const receipt_id = tr.id;
        const doc_id = tr.dataset.docid;
        getReceiptImagebyId(doc_id, receipt_id, false);
        return;
    }   

    if (tr) {
        const myTr = tr.nextElementSibling;
        if (myTr) {
            skipHiddenTableRowsToFindNext(myTr);
        }
    }
}

const getReceiptImagebyId = (doc_id) => {
    if (isImageCached(doc_id)) {return;} // If image is cached, do not fetch again
    
    if(withShareToken){
        commonFetchShare(`/shr_get_receipt`, receivedReceiptImageLink, {rid: doc_id}, null); // Fetch upload details by receipt ID (rid)
    }else{
        commonFetch(`/get_receipt`, receivedReceiptImageLink, {rid: doc_id}, null); // Fetch upload details by receipt ID (rid)
    }    
};

const receivedReceiptImageLink = (json) => {
    if(json.error) {return;}

    const div = document.getElementById('div-image-cache');
    const img = div.querySelector('img');
    // Only set up the onload once
    img.onload = function () { 
        cachedImages[json.upload_id] = {
            receipt: json,
            expiry: Date.now() + 58 * 60 * 1000 // Cache for 58 minutes
        };
    };
    img.src = json.file_url; // This will trigger the onload event
};

// Share Bundle here

const createNewShareTokenForBundle = () => {
    const cid = document.getElementById("customer-name").dataset.id;
    const bid = document.getElementById("bundle-set").dataset.id;
    const createBtn = document.querySelector('#createShareTokenBtn');
    createBtn.disabled = true; // Disable button to prevent multiple clicks
    document.getElementById("ajaxCreateShareLink").classList.remove('d-none'); // Show loading indicator
    // Call your API or function to create a new share token
    commonFetch(`/create_share_token`, receivedBundleShareToken, {cid: cid, bid: bid}, createBtn);
};

const receivedBundleShareToken = (json) => {
    enableButton("createShareTokenBtn");
    document.getElementById("ajaxCreateShareLink").classList.add('d-none'); // Hide loading indicator
    if (json.error) {
        console.error("Error in bundle shared links:", json.error);
        if(json.err === 102){
            gosterMessage("Hata!", "Yetersiz belge okuma kredisi.", "warning");
        }else{
            gosterMessage("Hata!", "Paylaşım linkleri alınamadı.", "danger");
        }
        return;
    }
    
    gosterMessage("Başarılı!", "Paylaşım link kaydı oluşturuldu. Link açıklaması ve detay bilgi değiştirilebilir.", "success");

    json.record.link.forEach(item => {
        const dropdownItem = returnShareDropdownItem(item);
        document.querySelector('#share-link-container .dropdown-menu').appendChild(dropdownItem);
        shareLinksArr.push(item);
        document.querySelector('#share-link-container').classList.remove('d-none'); // Show the dropdown if there are links
        document.querySelector('#share-link-container .dropdown-menu li:last-child').click()
        showShareActionForm(); // Show the share action form so that the user can edit the link details
    });
};

const getBundleSharedLinks = () => {
    document.querySelector('#share-link-container').classList.add('d-none'); // Hide the dropdown initially
    //document.querySelector('#shareModalFooter').classList.add('d-none'); // Hide the footer initially
    document.querySelector('.share-action-content').classList.add('d-none'); // Hide the action content initially
    document.querySelector('.share-action-divs').classList.add('d-none'); // Hide the action content initially
    document.querySelector('#createShareTokenBtn').classList.add('d-none'); // Hide the create button initially
    document.querySelector('#shareModalBody .div-data-loading').classList.remove('d-none'); // Show the loading indicator
    const customer_id = document.querySelector('.nav-common').dataset.cid;
    const bid = document.getElementById("bundle-set").dataset.id;
    commonFetch(`/get_bundle_shared_links`, receivedBundleSharedLinks, {cid: customer_id, bid: bid}, null);
};

const shareLinksArr = [];

const receivedBundleSharedLinks = (json) => {
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



// Update the receipt oran value
function updateReceiptOranValueAndExpenseTypeEtc() {
    const selectOran = document.getElementById("sel-receipt-oran");
    const newOran = selectOran.value;

    const selectExpense = document.getElementById("sel-expense-type");
    const selectedType = selectExpense.value;

    const kkeg = document.getElementById("chk-kkeg").checked ? 1 : 0;

    const ind = document.getElementById("chk-ind").checked ? 1 : 0;

    const rid = document.getElementById('fullscreenModal').dataset.rid;

    if(withShareToken){
        commonFetchShare(`/shr_set_receipt_oran_type`, postUpdateReceiptOranType, {rid: rid, oran: newOran, expense: selectedType, kkeg: kkeg, ind: ind}, null);
    }else{
        commonFetch(`/set_receipt_oran_type`, postUpdateReceiptOranType, {rid: rid, oran: newOran, expense: selectedType, kkeg: kkeg, ind: ind}, null);
    }

}

const postUpdateReceiptOranType = (response) => {
    //console.log("Response from update receipt oran and type:", response);
    if(response.error) {
        gosterMessage("Hata!", "Gider oranı ve gider türü güncellenemedi.", "danger");
        return;
    } 
    
    //gosterMessage("Başarılı!", "Gider oranı ve gider türü güncellendi.", "success");

    const rowId = response.receipt_id;
    const updatedReceipt = allReceipts.find(receipt => receipt.receipt_id === rowId);
    if (updatedReceipt) {
        updatedReceipt.oran = response.item.oran;
        updatedReceipt.kalem = response.item.kalem;
        updatedReceipt.kkeg = response.item.kkeg;
        updatedReceipt.ind = response.item.ind;

        const tr = document.getElementById(rowId);
        if (tr) {
            tr.querySelector(".td-oran").textContent = updatedReceipt.oran;
            tr.querySelector(".td-kalem").textContent =  returnHarcamaTuruText(updatedReceipt.kalem);
            //
            const kkeg = +updatedReceipt.kkeg;
            const ind = +updatedReceipt.ind; // VAT indirilebilir or not?
            if(kkeg === 1) {
                tr.querySelector(".td-toplam").classList.add("text-decoration-line-through");
                tr.querySelector(".td-kdv").classList.add("text-decoration-line-through");
                tr.querySelector(".td-matrah").classList.add("text-decoration-line-through");
            } else {
                tr.querySelector(".td-toplam").classList.remove("text-decoration-line-through");
                if(ind === 1) {
                    tr.querySelector(".td-kdv").classList.remove("text-decoration-line-through");
                } else {
                    tr.querySelector(".td-kdv").classList.add("text-decoration-line-through");
                }
            } 
        }
        //updateBundleMetrics();
    }

    // Update the receipt details table oran and type
    const idx = returnReceiptToUpdateDetails(rowId);
    if (idx >= 0) {
       receiptsData.items[idx].oran = response.item.oran;
       receiptsData.items[idx].kalem = response.item.kalem;
       receiptsData.items[idx].kkeg = response.item.kkeg;
       receiptsData.items[idx].ind = response.item.ind;
    }

};

// Show dublicate receipts
const showDuplicateReceipts = () => {
    const duplicateReceipts = checkForDuplicateReceipts();
    const btn = document.getElementById("btn-show-duplicates");
    if (duplicateReceipts.length > 0) {
        // Display the duplicate receipts in a modal or a dedicated section
        btn.classList.add("danger");
        btn.querySelector("span").textContent = duplicateReceipts.length;
        populateReceiptTable(duplicateReceipts);
        setActiveFilterButton(btn);
        btn.classList.add("active");
    } else {
        gosterMessage("Bilgi", "Mükerrer yükleme bulunamadı.", "info");
        btn.classList.remove("danger");
        btn.querySelector("span").textContent = "";
    }
};

// Update btn state based on duplicate receipts
const updateDuplicateReceiptsButton = () => {
    const duplicateReceipts = checkForDuplicateReceipts();
    const btn = document.getElementById("btn-show-duplicates");
    if (btn) {
        if (duplicateReceipts.length > 0) {
            btn.classList.add("danger");
            btn.querySelector("span").textContent = duplicateReceipts.length;
        } else {
            btn.classList.remove("danger");
            btn.querySelector("span").textContent = "";
        }
    }
};

// Check for duplicate receipts
const checkForDuplicateReceipts = () => {
    // Evaluate receipts with durum > 0 
    const arr = allReceipts.filter(receipt => receipt.durum > 0);

    const duplicateKeys = ["vn", "saat", "tarih", "toplam"];
    const seenObjectsMap = new Map(); // Stores key -> array of objects with that key
    const duplicateList = []; // The final array of all duplicate objects

   arr.forEach(obj => {
        obj.saat = obj.saat || '10:00';
        // Create a unique string key from the values of the specified properties.
        // Using `|| ''` handles cases where a property might be null or undefined.
        // Using a separator like '|' helps prevent collisions (e.g., '1' + '23' vs '12' + '3').
        const comparisonKey = duplicateKeys.map(key => obj[key] || '').join('|');

        if (seenObjectsMap.has(comparisonKey)) {
            // If this key has been seen before, add the current object to its list.
            seenObjectsMap.get(comparisonKey).push(obj);
        } else {
            // First time seeing this key, start a new list with the current object.
            seenObjectsMap.set(comparisonKey, [obj]);
        }
    });

    // Now, iterate through the map and collect all groups that have more than one object.
    for (const [key, objList] of seenObjectsMap.entries()) {
        if (objList.length > 1) {
            // If a group has more than one object, all objects in that group are duplicates
            // relative to each other based on the defined keys. Add them all to the result.
            duplicateList.push(...objList);
        }
    }

    return duplicateList;
};

// Download html table as CSV
/**
 * Converts an HTML table to a CSV string.
 * Handles escaping for commas, double quotes, and newlines.
 *
 * @param {HTMLTableElement} tableElement The HTML table element to convert.
 * @returns {string} The CSV formatted string.
 */
function tableToCsv(tableElement) {
    const rows = tableElement.querySelectorAll('tr');
    const csvRows = [];

    const firmName = document.getElementById("customer-name").querySelector("a").innerText.trim();
    const bundleName = document.getElementById("bundle-set").innerText.trim();
    const aySene = document.getElementById("monthInput").value || "";
    csvRows.push(`Firma:,"${firmName}"`);
    csvRows.push(`Kayıt:,"${bundleName}"`);
    if (aySene) {
        csvRows.push(`Sene-Ay:,"${aySene}"`);
    }
    csvRows.push(''); // Empty line for separation

    for (const row of rows) {
        if (row.style.display === 'none') continue; // Skip hidden rows

        const cells = row.querySelectorAll('th, td');
        const rowData = [];

        for (const cell of cells) {
            let cellText = cell.textContent.trim(); // Get text content and trim whitespace

            // CSV escaping:
            // 1. If the text contains a comma, double quote, or newline,
            //    it must be enclosed in double quotes.
            // 2. Any double quotes within the text must be escaped by
            //    doubling them up (" becomes "").
            const needsQuotes = cellText.includes(',') || cellText.includes('"') || cellText.includes('\n');

            let escapedText = cellText.replace(/"/g, '""'); // Escape existing double quotes

            // Add a star if the cell is kkeg or vat not deductible
            const starEkle = cell.classList.contains("text-decoration-line-through") ? '*' : '';

            if (needsQuotes) {
                rowData.push(`"${escapedText}${starEkle}"`);
            } else {
                rowData.push(escapedText + starEkle);
            }
        }
        csvRows.push(rowData.join(','));
    }

    return csvRows.join('\n');
}

/**
 * Initiates the download of a string as a file.
 *
 * @param {string} content The string content to download.
 * @param {string} filename The desired filename (e.g., "data.csv").
 * @param {string} mimeType The MIME type of the file (e.g., "text/csv").
 */
function downloadFile(content, filename, mimeType) {
     // Prepend the UTF-8 BOM (\ufeff) to the content.
    // This explicitly tells Excel (and other programs) that the file is UTF-8.
    const blob = new Blob(['\ufeff' + content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // Append to body to make it clickable
    a.click(); // Programmatically click the link to trigger download
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(url); // Release the object URL
}


function clickedDownloadCsv() {
    // Get the button and table elements
    const myDataTable = document.getElementById('receiptTable');
    const csvContent = tableToCsv(myDataTable);
    downloadFile(csvContent, 'tablo.csv', 'text/csv;charset=utf-8;');

}