const views = ['signInView', 'initialView', 'uploadView', 'enrichmentView'];
const sessionTimeout = 15 * 60 * 1000; // 15 minutes in milliseconds

function signIn() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username && password) {
        const loginTime = Date.now();
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginTime', loginTime);
        navigateTo('initialView', true);
    } else {
        showMessage('Please enter both username and password.', 'error');
    }
}

function signOut() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTime');
    navigateTo('signInView', true);
}

function navigateTo(viewId, addToHistory = false) {
    if (addToHistory) {
        history.pushState({ view: viewId }, null, '#' + viewId);
    }
    updateView(viewId);
}

function updateView(viewId) {
    // Check for session timeout
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const loginTime = localStorage.getItem('loginTime');
    if (isLoggedIn && loginTime) {
        const currentTime = Date.now();
        if (currentTime - loginTime > sessionTimeout) {
            signOut();
            showMessage('Session expired. Please sign in again.', 'error');
            return;
        }
    }

    views.forEach(view => {
        const element = document.getElementById(view);
        if (view === viewId) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    });
    document.querySelector('.sign-out').style.display = localStorage.getItem('isLoggedIn') ? 'block' : 'none';
}

/* Remaining JavaScript omitted for brevity */
