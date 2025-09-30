
// --- START: Cache frequently accessed DOM elements ---
const rpaTableBody = document.getElementById("rpaTable")?.querySelector("tbody");
const rpaEditModeCheckbox = document.getElementById('rpa-edit-mode');
const rpaHelperSelect = document.getElementById('rpa-helper');
const rpaWindowMinimizeCheckbox = document.getElementById('rpa-minimize');

// --- END: Cache DOM elements ---

// Global state management
const state = {
    actionRows: [],
    calibrationInProgress: false,
    pollingInterval: null,
    minimizedWindow: false,
};

// --- START: Core Functions ---

/**
 * Gathers all active rows and starts the RPA workflow process.
 */
function startRPAWorkflowFromButton() {
    state.minimizedWindow = false; // Reset minimized state
    startRPAWorkflow();
}


function startRPAWorkflow() {
    if (!rpaTableBody) return;

    if(!state.minimizedWindow && rpaWindowMinimizeCheckbox?.checked) {
        minimizeRPAwindow();
        state.minimizedWindow = true;
        return; // Exit to allow user to restore and continue
    }

    const rows = Array.from(rpaTableBody.querySelectorAll('tr'));

    if (rows.length === 0) {
        gosterMessage('Dikkat!', 'RPA iş akışında henüz bir işlem yok.', 'warning');
        return;
    }

    state.actionRows = rows
        .filter(row => row.querySelector('.active-status-cell')?.dataset.activeStatus === '1')
        .map(row => row.id);

    if (state.actionRows.length === 0) {
        gosterMessage('Bilgi', 'Aktif durumda bir RPA iş akışı bulunamadı.', 'info');
        return;
    }

    //gosterMessage('Bilgi', 'RPA iş akışı başlatıldı.', 'info');
    performNextRPAAction();
}

/**
 * Performs the next action in the queue. This is a recursive-style function.
 */
async function performNextRPAAction() {
    if (state.actionRows.length === 0) {
        //gosterMessage('Bilgi', 'RPA iş akışı tamamlandı.', 'success');
        return;
    }

    const rowID = state.actionRows.shift();
    const row = document.getElementById(rowID);

    if (row) {
        const isReady = row.querySelector('.calibrate-cell')?.dataset.ready === '1';
        if (isReady) {
            await performRPAAction(row); // Wait for the action to complete9/8/20259/8/2025
        } else {
            const actionLabel = row?.querySelector('.item-label')?.innerText || 'Bilinmeyen İşlem';
            gosterMessage(actionLabel, 'Bu işlem atlandı çünkü kalibrasyon yapılmamış.', 'warning');
        }
    }
    
    // Use a configured delay before starting the next action
    const pauseTime = parseInt(row.querySelector('.pause-time-cell')?.dataset.pauseTime || '200', 10);
    setTimeout(performNextRPAAction, pauseTime);
}

/**
 * Performs a single RPA action by sending a request to the server.
 * @param {HTMLElement} row The table row element representing the action.
 */
async function performRPAAction(row) {
    if (!row) return;

    const actionType = row.dataset.actionType;
    const actionLabel = row.querySelector('.item-label')?.innerText || 'Bilinmeyen İşlem';
    const fieldId = row.dataset.fieldId;
    const dataFieldElement = fieldId ? document.getElementById('rcp-' + fieldId) : null;

    if (actionType === 'fill-field' && !dataFieldElement) {
        gosterMessage(actionLabel, 'Bu işlem atlandı çünkü "Veri Alanı" bulunamadı.', 'warning');
        return;
    }

    let endPoint = '/mouse-click';
    let value = '';
    if (actionType !== 'fill-field') {
        const clbCell = row.querySelector('.calibrate-cell');
        switch(actionType) {
            case 'mouse-click': endPoint = '/mouse-click-helper'; break;
            case 'keyboard-today': endPoint = '/keyboard-input'; value = clbCell?.dataset.deger || ''; break;
            case 'keyboard-input': endPoint = '/keyboard-input'; value = clbCell?.dataset.deger || ''; break;
            case 'keyboard-enter': endPoint = '/keyboard-event'; value = 'enter'; break;
            case 'keyboard-tab': endPoint = '/keyboard-event'; value = 'tab'; break;
            default:9/8/2025
                gosterMessage('Hata', `Bilinmeyen işlem türü: ${actionType}`, 'danger');
                return;
        }
    }else{
        value = dataFieldElement?.innerText || dataFieldElement?.value || '';
    }

    //gosterMessage(actionLabel, `RPA başlatıldı.`, 'info');

    const calibrateCell = row.querySelector('.calibrate-cell');
    const data = {
        x: parseFloat(calibrateCell?.dataset.xpos || '0'),
        y: parseFloat(calibrateCell?.dataset.ypos || '0'),
        tag: row.id,
        val: value,
    };

    row.classList.add('bg-warning');

    try {
        const response = await fetchWithAuth(endPoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        console.log(response);
    } catch (error) {
        gosterMessage('Hata', 'RPA işlem akışı sırasında beklenmeyen bir sorun oluştu.', 'danger');
        console.error('Error with mouse click:', error);
        state.actionRows = []; // Stop workflow on error
    } finally {
        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => row.classList.remove('bg-warning'));
    }
}

// --- END: Core Functions ---

// --- START: Minimize and Maximize RPA Window ---

function minimizeRPAwindow(workflowStart=true) {
    fetchWithAuth('/minimize-rpa-window', {
        method: 'POST'
    }).then(response => {
        if (workflowStart) {
            startRPAWorkflow(); // Continue workflow after minimizing
        }
    }).catch(error => {
        console.error('Error minimizing RPA window:', error);
        gosterMessage('Hata', 'RPA ekranı küçültülemedi.', 'danger');
    });
}


// --- START: Row & Table Management ---

/**
 * Moves a table row up or down.
 * @param {HTMLElement} row The row to move.
 * @param {('up'|'down')} direction The direction to move the row.
 */
function moveRow(row, direction) {
    if (direction === 'up') {
        const prevRow = row.previousElementSibling;
        if (prevRow) {
            row.parentNode.insertBefore(row, prevRow);
        }
    } else if (direction === 'down') {
        const nextRow = row.nextElementSibling;
        if (nextRow) {
            row.parentNode.insertBefore(nextRow, row);
        }
    }
    saveRPAworkflow();
}

/**
 * Adds a new helper action row to the table.
 */
function addHelperActionToRPAtaskList() {
    if (!checkEditMode()) return;
    
    const actionType = rpaHelperSelect.value;
    const actionLabel = rpaHelperSelect.options[rpaHelperSelect.selectedIndex].text;

    const attributes = {
        id: `helper-${Date.now()}`,
        class: 'rpa-helper',
        'data-action-type': actionType,
    };
    addNewRowToRPAtable(attributes, actionLabel);
}

/**
 * Adds a new field action row to the table.
 * @param {HTMLElement} tr The source table row.
 */
function addItemToRPAtaskList(tr) {
    if (!checkEditMode()) return;

    const fieldId = tr.querySelector('.rcpValue')?.id.replace('rcp-', '');
    if (!fieldId) return;

    const newRowId = 'rpa-' + fieldId;
    if (document.getElementById(newRowId)) {
        gosterMessage('Dikkat!', 'Bu alan zaten RPA iş akışında mevcut.', 'warning');
        return;
    }
    
    const attributes = {
        id: newRowId,
        class: 'rpa-item',
        'data-field-id': fieldId,
        'data-action-type': 'fill-field'
    };
    const itemDesc = tr.querySelector('.rcpLabel')?.innerText.replace(':', '') || '';
    addNewRowToRPAtable(attributes, itemDesc);
}

/**
 * Creates and appends a new row to the RPA table.
 * @param {Object} attributes An object of attributes to set on the new row.
 * @param {string} itemDesc The description/label for the item.
 * @param {boolean} saveItem Whether to save the workflow after adding.
 */
function addNewRowToRPAtable(attributes, itemDesc = '', saveItem = true) {
    if (!rpaTableBody) return;
    const newRow = document.createElement("tr");

    for (const [key, value] of Object.entries(attributes)) {
        newRow.setAttribute(key, value);
    }

    const isReady = ["keyboard-enter", "keyboard-tab"].includes(attributes['data-action-type']) ? '' : 'bg-warning';
    const readyValue = isReady === '' ? '1' : '0';

    newRow.innerHTML = `
        <td class="text-center text-danger"><i class="bi bi-x-circle remove-item" title="RPA iş akışından kaldır"></i></td>
        <td class="item-label">${itemDesc}</td>
        <td><i class="bi bi-arrow-up-circle item-up" title="Yukarı taşı"></i></td>
        <td><i class="bi bi-arrow-down-circle item-down" title="Aşağı taşı"></i></td>
        <td class="calibrate-cell ${isReady}" data-xpos="1" data-ypos="1" data-deger="0" data-ready="${readyValue}" style="white-space: nowrap;"><button type="button" class="btn btn-link p-0 item-calibrate" title="Kalibre Et"><i class="bi bi-gear-fill"></i> Kalibre et</button></td>
        <td class="pause-time-cell" data-pause-time="100" style="white-space: nowrap;"><i class="bi bi-pause-circle" title="Bekleme süresi"></i> ${createSelectHTML({ name: 'pause-time', options: Array.from({length: 20}, (_, i) => (i + 1) * 200), default: 200, suffix: ' ms' })}</td> 
        <td class="active-status-cell" data-active-status="1">${createSelectHTML({ name: 'active-status', options: {'1': 'Aktif', '0': 'İşlemi Atla'}, default: 1})}</td>
        <td><i class="bi bi-play-circle item-action" title="Çalıştır"></i></td>
    `;

    rpaTableBody.appendChild(newRow);

    if (saveItem) {
        saveRPAworkflow();
    }
}

// --- END: Row & Table Management ---


// --- START: Calibration Functions ---

/**
 * Starts the calibration process for a helper item.
 * @param {HTMLElement} row The table row element to calibrate.
 */
function calibrateHelper(row){
    if (!checkEditMode() || !row) return;
    
    if (state.calibrationInProgress) {
        gosterMessage('Dikkat!', 'Zaten bir kalibrasyon işlemi devam ediyor.', 'warning');
        return;
    }
    const actionType = row.dataset.actionType;
    const currentDate = new Date();
    switch(actionType) {
        case 'keyboard-today': 
            calibrateHelperKeyboardEntry(row, msg="RPA işlemi için kullanılacak Tarih:", defaultValue=currentDate.toLocaleDateString()); 
            break;
        case 'keyboard-input': 
            calibrateHelperKeyboardEntry(row, msg="RPA işlemi için kullanılacak Metin:", defaultValue=""); 
            break;
        default:
            gosterMessage('Bilgi', 'Bu işlem türü için kalibrasyon gerekmiyor.', 'info');
            return;
    }
}

/**
 * Starts the calibration process for a helper item Keyboard Entries text and date.
 * @param {HTMLElement} row The table row element to calibrate.
 */
function calibrateHelperKeyboardEntry(row, msg="RPA işlemi için kullanılacak Değer:", defaultValue="") {
    let input = prompt(msg, defaultValue);
    if(input) {
        const clbCell = row.querySelector('.calibrate-cell');
        if (clbCell) {
            clbCell.dataset.deger = input;
            clbCell.dataset.ready = '1';
            clbCell.classList.remove('bg-warning');
            const actionLabel = row?.querySelector('.item-label')?.innerText || '?';
            gosterMessage(actionLabel, 'Kalibrasyon tamamlandı.', 'success');
            saveRPAworkflow();
        }
    }
}


/**
 * Starts the calibration process for a given item.
 * @param {HTMLElement} row The table row element to calibrate.
 */
async function calibrateItem(row) {
    if (!checkEditMode() || !row) return;

    if (state.calibrationInProgress) {
        gosterMessage('Dikkat!', 'Zaten bir kalibrasyon işlemi devam ediyor.', 'warning');
        return;
    }

    if(row.classList.contains('rpa-helper')) {
        if(row.dataset.actionType !== 'mouse-click'){
            calibrateHelper(row);
            return;
        }
    }

    const itemLabel = row.querySelector('.item-label')?.innerText || 'this item';
    gosterMessage(itemLabel, 'Veri girişi yapılacak alanı mouse ile tıklayın.', 'info');
    state.calibrationInProgress = true;

    try {
        const response = await fetchWithAuth("/start-listener", {
            method: 'POST',
            body: JSON.stringify({ tag: row.id })
        });
        console.log('Server response:', response.message);
        // Minimize RPA window if setting is enabled
        if(rpaWindowMinimizeCheckbox?.checked) {
            minimizeRPAwindow(workflowStart=false);
        }
        // Start polling if listener started successfully
        state.pollingInterval = setInterval(pollForClickResult, 2000);
    } catch (error) {
        gosterMessage('Hata', 'Kalibrasyon başlatılamadı.', 'danger');
        console.error('Error starting listener:', error);
        state.calibrationInProgress = false;
    }
}

/**
 * Polls the server to check for mouse click coordinates.
 */
async function pollForClickResult() {
    console.log('Polling for result...');
    try {
        const data = await fetchWithAuth("/check-for-click", { method: 'POST' });
        if (data.status === 'success') {
            console.log('Success! Received coordinates:', data);
            clearInterval(state.pollingInterval);
            state.calibrationInProgress = false;
            storeCalibrationData(data);
        } else {
            console.log('Server is still waiting...');
        }
    } catch (error) {
        gosterMessage('Hata', 'Kalibrasyon sırasında beklenmeyen bir hata oluştu.', 'danger');
        console.error('Polling error:', error);
        clearInterval(state.pollingInterval);
        state.calibrationInProgress = false;
    }
}

/**
 * Stores the received calibration data into the corresponding row's attributes.
 * @param {Object} data The data received from the server, including tag and coords.
 */
function storeCalibrationData(data) {
    const row = document.getElementById(data.tag);
    const actionLabel = row?.querySelector('.item-label')?.innerText || '?';
    if (row) {
        const clbCell = row.querySelector('.calibrate-cell');
        if (clbCell) {
            clbCell.dataset.xpos = data.coords.x;
            clbCell.dataset.ypos = data.coords.y;
            clbCell.dataset.ready = '1';
            clbCell.classList.remove('bg-warning');
            gosterMessage(actionLabel, 'Kalibrasyon tamamlandı.', 'success');
            saveRPAworkflow();
        }
    }
}

// --- END: Calibration Functions ---


// --- START: Persistence (LocalStorage) ---

/**
 * Saves the entire RPA workflow to localStorage.
 */
function saveRPAworkflow() {
    if (!rpaTableBody) return;
    // Remove any existing "no workflow" message
    rpaTableBody.querySelectorAll('.no-rpa-workflow').forEach(elm => elm.remove());
    
    // Gather all rows into an array of objects
    const rpaWorkflow = Array.from(rpaTableBody.querySelectorAll('tr')).map(tr => {
        const calibrateCell = tr.querySelector('.calibrate-cell');
        const pauseCell = tr.querySelector('.pause-time-cell');
        const activeCell = tr.querySelector('.active-status-cell');
        
        return {
            actionLabel: tr.querySelector('.item-label')?.innerText,
            actionType: tr.dataset.actionType,
            fieldId: tr.dataset.fieldId || null,
            rowId: tr.id,
            pauseTime: parseInt(pauseCell?.dataset.pauseTime || '200', 10),
            activeStatus: parseInt(activeCell?.dataset.activeStatus || '1', 10),
            clbDeger: calibrateCell?.dataset.deger || '',
            clbXpos: calibrateCell?.dataset.xpos || '0',
            clbYpos: calibrateCell?.dataset.ypos || '0',
            clbReady: calibrateCell?.dataset.ready || '0',
        };
    });

    if(rpaWorkflow.length === 0) {
        rpaTableBody.innerHTML = '<tr class="no-rpa-workflow"><td colspan="8" class="text-center text-muted">Henüz bir RPA iş akışı yok. <br> Tablodan alanları veya yardımcı işlemleri ekleyin.</td></tr>';
    }

    localStorage.setItem('rpaWorkflow', JSON.stringify(rpaWorkflow));
}

/**
 * Loads the RPA workflow from localStorage and populates the table.
 */
function loadRPAworkflow() {
    const rpaWorkflow = JSON.parse(localStorage.getItem('rpaWorkflow') || '[]');
    if (!rpaTableBody) return;
    if (rpaWorkflow.length === 0) {
        // No workflow found, you might want to show a message or handle this case
        rpaTableBody.innerHTML = '<tr class="no-rpa-workflow"><td colspan="8" class="text-center text-muted">Henüz bir RPA iş akışı yok.<br> Tablodan alanları veya yardımcı işlemleri ekleyin.</td></tr>';
        return;
    }

    // Use a DocumentFragment for performance: build all rows in memory first.
    const fragment = document.createDocumentFragment();

    rpaWorkflow.forEach(item => {
        const newRow = document.createElement('tr');
        
        const attributes = {
            id: item.rowId,
            class: item.actionType === 'fill-field' ? 'rpa-item' : 'rpa-helper',
            'data-action-type': item.actionType,
            ...(item.fieldId && { 'data-field-id': item.fieldId }) // Conditionally add fieldId
        };
        for (const [key, value] of Object.entries(attributes)) {
            newRow.setAttribute(key, value);
        }

        const isReady = item.clbReady === '1' ? '' : 'bg-warning';
        const readyValue = item.clbReady;

        item.actionLabel = returnActionLabel(item);

        newRow.innerHTML = `
            <td class="text-center text-danger"><i class="bi bi-x-circle remove-item" title="RPA iş akışından kaldır"></i></td>
            <td class="item-label">${item.actionLabel}</td>
            <td><i class="bi bi-arrow-up-circle item-up" title="Yukarı taşı"></i></td>
            <td><i class="bi bi-arrow-down-circle item-down" title="Aşağı taşı"></i></td>
            <td class="calibrate-cell ${isReady}" data-xpos="${item.clbXpos}" data-ypos="${item.clbYpos}" data-deger="${item.clbDeger}" data-ready="${readyValue}" style="white-space: nowrap;"><button type="button" class="btn btn-link p-0 item-calibrate" title="Kalibre Et"><i class="bi bi-gear-fill"></i> Kalibre et</button></td>
            <td class="pause-time-cell" data-pause-time="${item.pauseTime}" style="white-space: nowrap;"><i class="bi bi-pause-circle" title="Bekleme süresi"></i> ${createSelectHTML({ name: 'pause-time', options: Array.from({length: 20}, (_, i) => (i + 1) * 200), default: item.pauseTime, suffix: ' ms' })}</td>
            <td class="active-status-cell" data-active-status="${item.activeStatus}" style="white-space: nowrap;">${createSelectHTML({ name: 'active-status', options: {'1': 'Aktif', '0': 'İşlemi Atla'}, default: item.activeStatus})}</td>
            <td><i class="bi bi-play-circle item-action" title="Çalıştır"></i></td>
        `;
        fragment.appendChild(newRow);
    });

    // Append all rows to the DOM in a single operation.
    rpaTableBody.appendChild(fragment);
}

const returnActionLabel = (item) => {
    
    if (item.actionType === 'keyboard-input'){
        return '<i class="bi bi-card-text"></i> ' + item.clbDeger;
    }

    if (item.actionType === 'keyboard-today'){
        return '<i class="bi bi-calendar-event"></i> ' + item.clbDeger;
    }

    if (item.actionType === 'mouse-click'){
        return '<i class="bi bi-mouse"></i> Mouse Tıklaması';
    }
    
    return item.actionLabel;
};

// --- END: Persistence ---


// --- START: Utility & Helper Functions ---

/**
 * A generic wrapper for fetch requests that includes authorization.
 * @param {string} url The URL to fetch.
 * @param {Object} options The options for the fetch request.
 * @returns {Promise<Object>} A promise that resolves to the JSON response.
 */
async function fetchWithAuth(url, options = {}) {
    const idToken = localStorage.getItem("idToken");
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + idToken,
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

/**
 * Creates HTML for a <select> element.
 * @param {Object} config - Configuration object.
 * @returns {string} The HTML string for the select element.
 */
function createSelectHTML({ name, options, default: defaultValue, title = '', suffix = '' }) {
    let optionsHTML = '';
    if (Array.isArray(options)) {
        optionsHTML = options.map(val => `<option value="${val}"${val === defaultValue ? ' selected' : ''}>${val}${suffix}</option>`).join('');
    } else { // It's an object
        optionsHTML = Object.entries(options).map(([val, text]) => `<option value="${val}"${val == defaultValue ? ' selected' : ''}>${text}</option>`).join('');
    }
    return `<select name="${name}" title="${title}">${optionsHTML}</select>`;
}

/**
 * Checks if edit mode is active and shows a message if not.
 * @returns {boolean} True if edit mode is active.
 */
function checkEditMode() {
    if (!rpaEditModeCheckbox.checked) {
        gosterMessage('Dikkat!', 'Değişiklik modu etkin değil. RPA iş akışında değişiklik yapmak için "Değişiklik Modu"nu işaretleyiniz.', 'warning');
        return false;
    }
    return true;
}

/**
 * Toggles the disabled state of all select elements in the table.
 */
function enableDisableRPAeditMode() {
    rpaTableBody?.querySelectorAll('select').forEach(elm => {
        elm.disabled = !rpaEditModeCheckbox.checked;
    });
}

// --- END: Utility & Helper Functions ---


// --- START: Event Listeners ---

// Use Event Delegation for actions within the RPA table for performance.
rpaTableBody?.addEventListener('click', (event) => {
    const target = event.target;
    const row = target.closest('tr');
    if (!row) return;

    // Find the action based on the clicked element's class
    if (target.matches('.remove-item, .remove-item *')) {
        if (checkEditMode()) {
            row.remove();
            saveRPAworkflow();
        }
    } else if (target.matches('.item-up, .item-up *')) {
        checkEditMode() && moveRow(row, 'up');
    } else if (target.matches('.item-down, .item-down *')) {
        checkEditMode() && moveRow(row, 'down');
    } else if (target.matches('.item-calibrate, .item-calibrate *')) {
        checkEditMode() && calibrateItem(row);
    } else if (target.matches('.item-action, .item-action *')) {
        state.actionRows = [row.id];
        state.minimizedWindow = false; // Reset minimized state
        performNextRPAAction();
    }
});

// Listener for select changes to update data attributes
rpaTableBody?.addEventListener('change', (event) => {
    const target = event.target;
    if (target.tagName === 'SELECT') {
        const cell = target.closest('td');
        if (cell) {
            const attribute = target.name === 'pause-time' ? 'data-pause-time' : 'data-active-status';
            cell.setAttribute(attribute, target.value);
            saveRPAworkflow();
        }
    }
});

// Listeners for global controls
document.getElementById('startRPA')?.addEventListener('click', startRPAWorkflow);
document.getElementById('addHelperAction')?.addEventListener('click', addHelperActionToRPAtaskList);
rpaEditModeCheckbox?.addEventListener('change', enableDisableRPAeditMode);

// Add listeners to source table for adding items to the workflow
document.querySelectorAll('td.rcpActions2').forEach(td => {
    const button = document.createElement('div');
    button.className = 'edit-actions text-center';
    button.title = 'RPA iş akışına ekle';
    button.innerHTML = '<i class="bi bi-arrow-right-circle text-primary"></i>';
    button.addEventListener('click', () => {
        addItemToRPAtaskList(td.closest('tr'));
    });
    td.innerHTML = ''; // Clear existing content
    td.appendChild(button);
});

// --- END: Event Listeners ---

// Initial load
loadRPAworkflow();
enableDisableRPAeditMode();



