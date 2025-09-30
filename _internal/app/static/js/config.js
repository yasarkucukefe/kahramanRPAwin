if (document.getElementById('monthInput')) {
    const monthInput = document.getElementById('monthInput');
    if (monthInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        monthInput.value = `${yyyy}-${mm}`;
    }

    monthInput.addEventListener('change', function() {
        handleMonthChange();
    });

}

function showSupportMessage(){
    const el = document.getElementById('resultMessage');
    el.innerHTML = `
        <div class="alert alert-info alert-dismissible fade show" role="alert">
            <strong>Destek</strong> Sorularınız için lütfen <strong>destek@kahramanai.com.tr</strong> adresine e-posta gönderin.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    el.style.display = "block";
    fadeOutAfterShowingMessage(el, 5000);
}

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
                <div id="user-credits" class="me-1 text-secondary"><i class="bi bi-receipt fs-5"></i><span class='fw-semibold bg-warning text-dark px-2 py-1 rounded text-center' title="Kalan Belge Okuma Sayısı">...</span></div>
                <a href="/buy-credits" title="Yeni Belge Okuma Satın Al" class="ms-1 text-decoration-none">
                    <i class="bi bi-plus-circle-fill text-primary fs-5" style="cursor:pointer; transition: transform 0.2s;"></i>
                </a>
            </div>

            <div id="user-fullname" class="fw-semibold ms-2"></div>

            <div class="dropdown">
                <button class="btn btn-secondary dropdown-toggle user-fullname" type="button" id="dropdown" data-bs-toggle="dropdown" aria-expanded="false">...</button>
                
                <div class="dropdown-menu dropdown-menu-end dropdown-menu-dark">                    
                    <a class="dropdown-item user-email-addr small" href="#">...</a> <br />
                    <a class="dropdown-item" href="#" onclick="showSupportMessage()">Destek</a>
                    <hr />                    
                    <div class="text-end m-2">
                        <a href="/signout" class="btn btn-warning btn-sm">Çıkış Yap</a>
                    </div>
                </div>

            </div>
        </div>
    </div>    
    `;
}

const poolData = {
    UserPoolId: 'us-west-2_kJTXZKJfa',
    ClientId: '527fl7rr56u8v5e2644j96ef9e'
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

let refreshInterval;

const cognitoUser = userPool.getCurrentUser();

function refreshSession() {
    const email = localStorage.getItem("email");
    const refreshToken = localStorage.getItem("refreshToken");
    if (!email || !refreshToken) return;

    const user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: userPool });
    const token = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: refreshToken });

    user.refreshSession(token, (err, session) => {
        if (err) {
            console.error("Failed to refresh session:", err);
            signOut(); // Sign out the user if session refresh fails
            return;
        }
        localStorage.setItem("accessToken", session.getAccessToken().getJwtToken());
        localStorage.setItem("idToken", session.getIdToken().getJwtToken());
        startAutoRefresh(session.getIdToken().getExpiration());
    });
}

function startAutoRefresh(expiration) {
    const intervalMs = (expiration - Math.floor(Date.now() / 1000) - 60) * 1000;
    refreshInterval = setTimeout(() => refreshSession(), intervalMs);
}

function signOut() {
    const user = userPool.getCurrentUser();
    if (user) user.signOut();
    clearTimeout(refreshInterval);
    localStorage.clear();
    window.location.href = '/signin';
}

if (cognitoUser) {
    cognitoUser.getSession((err, session) => {
        if (err) {
            //console.error("Error getting session:", err);
            // no session or error occurred
            signOut();
            return;
        }
        //console.log("Session:", session);

        if(!session.isValid()) {
            // Session has expired or is invalid
            cognitoUser.refreshSession(session.getRefreshToken(), (err, session) => {
                if (err) {
                    console.error("Failed to refresh session:", err);
                    signOut(); // Sign out the user if session refresh fails
                    return;
                }
                //console.log("Session refreshed successfully:", session);
                localStorage.setItem("accessToken", session.getAccessToken().getJwtToken());
                localStorage.setItem("idToken", session.getIdToken().getJwtToken());
                startAutoRefresh(session.getIdToken().getExpiration());
            });
        }else{
            localStorage.setItem("accessToken", session.getAccessToken().getJwtToken());
            localStorage.setItem("idToken", session.getIdToken().getJwtToken());
            startAutoRefresh(session.getIdToken().getExpiration());
        }
        
        handleUserSignedIn();

    });

} else {
    handleNoUserSignedIn();
}



