
const poolData = {
    UserPoolId: 'us-west-2_kJTXZKJfa',
    ClientId: '527fl7rr56u8v5e2644j96ef9e'
};
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

let refreshInterval;

const handleCongitoError = (err) => {
    console.log(err.code);
}

const showCongitoErrorToUser = (err) => {
    console.error("Cognito Error:", err);  // Always log the full error for debugging

    switch (err.code) {
        case "UsernameExistsException":
            gosterMessage("Hata!", "Bu kullanıcı adı zaten mevcut.", "danger"); 
            setTimeout(() => {
                location.href = "/signin"; // Redirect to signin page
            }, 1000);
            break;
        case "UserNotConfirmedException":
            gosterMessage("Hata!", "Kullanıcı henüz doğrulanmamış. Lütfen e-posta adresinizi doğrulayın.", "warning");
            localStorage.setItem('email', document.getElementById('email').value.trim());
            setTimeout(() => {
                location.href = "/validate"; // Redirect to validate page
            }, 1000);
            break;
        case "NotAuthorizedException":
            gosterMessage("Hata!", "Yanlış kullanıcı adı veya parola.", "danger");
            break;
        case "UserNotFoundException":
            gosterMessage("Hata!", "Kullanıcı bulunamadı.", "danger");
            break;
        case "CodeMismatchException":
            gosterMessage("Hata!", "Doğrulama kodu eşleşmiyor.", "danger");
            break;
        case "ExpiredCodeException":
            gosterMessage("Hata!", "Doğrulama kodu süresi doldu. Lütfen yeni bir kod isteyin.", "danger");
            break;
        case "LimitExceededException":
            gosterMessage("Hata!", "Çok fazla istek yaptınız. Lütfen daha sonra tekrar deneyin.", "danger"); // Rate limiting
            break;
        case "CodeDeliveryFailureException":
             gosterMessage("Hata!", "Doğrulama kodu gönderilemedi. Lütfen e-posta adresinizi kontrol edin.", "danger");
            break;
        case "InvalidParameterException":
            gosterMessage("Hata!", "Geçersiz parametre.", "danger"); //Typically a coding error
            break;
        default:
            console.warn("Unhandled Cognito Error:", err); // Log unhandled errors!
            gosterMessage("Hata!", "Bilinmeyen bir hata oluştu.", "danger"); // Generic error message
    }
}


function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({ Username: email, Password: password });
    const user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: userPool });
    const submitButton = document.getElementById('submitButton');
    submitButton.disabled = true;
    user.authenticateUser(authDetails, {
        onSuccess: function(result) {
            submitButton.disabled = false;
            const idToken = result.getIdToken().getJwtToken();
            const refreshToken = result.getRefreshToken().getToken();
            localStorage.setItem("email", email);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("idToken", idToken);
            startAutoRefresh(email, refreshToken, result.getIdToken().getExpiration());
            gosterMessage("", "Giriş başarılı! Yönlendiriliyorsunuz...", "success");
            setTimeout(() => {
                location.href = "/u"; // Kullanıcı paneline yönlendir
            }, 100);
        },
        onFailure: function(err) {
            submitButton.disabled = false;
            showCongitoErrorToUser(err);
        }
    });
}

function startAutoRefresh(expiration) {
    const intervalMs = (expiration - Math.floor(Date.now() / 1000) - 60) * 1000;
    refreshInterval = setTimeout(() => refreshSession(false), intervalMs);
}

function refreshSession(showToastOnSuccess = false, retryApiCall = null) {
    const email = localStorage.getItem("email");
    const refreshToken = localStorage.getItem("refreshToken");
    if (!email || !refreshToken) return;

    const user = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: userPool });
    const token = new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: refreshToken });

    user.refreshSession(token, (err, session) => {
        if (err) return showCongitoErrorToUser(err);;
        const newToken = session.getIdToken().getJwtToken();
        const newExp = session.getIdToken().getExpiration();
        localStorage.setItem("idToken", newToken);
        localStorage.setItem("refreshToken", session.getRefreshToken().getToken());
        startAutoRefresh(newExp);
        if (showToastOnSuccess) gosterMessage("", "Oturum yenilendi", 'info');
        if (retryApiCall) retryApiCall(newToken);
    });
} 

function signOut() {
    const user = userPool.getCurrentUser();
    localStorage.setItem("signed out user", Date.now());
    if (user) user.signOut();
    clearTimeout(refreshInterval);
    localStorage.clear();
    window.location.href = '/signin';
};