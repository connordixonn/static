const views = ['signInView', 'initialView', 'uploadView', 'enrichmentView'];
const sessionTimeout = 15 * 60 * 1000; // 15 minutes in milliseconds
const gcp_url = 'https://us-central1-fair-feat-430020-c3.cloudfunctions.net/webapp-to-bucket';

// Hashes for the valid username and password
const validUsernameHash = 'c47545ebae14529c0cc7b2c7d5a8cd2e6e407d4972a083f27c33953cfe639777';
const validPasswordHash = '87522d1836df8793d745f4c3e384277d3d3b6d1088a7f3f6dee7fc870e7ac573';

function signIn() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Generates the hashes of the entered credentials
    const usernameHash = CryptoJS.SHA256(username).toString();
    const passwordHash = CryptoJS.SHA256(password).toString();

    // Verifies if the hashes match
    if (usernameHash === validUsernameHash && passwordHash === validPasswordHash) {
        const loginTime = Date.now();
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('loginTime', loginTime);
        navigateTo('initialView', true);
    } else {
        showMessage('Invalid username or password.', 'error');
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
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const loginTime = localStorage.getItem('loginTime');
    if (isLoggedIn && loginTime) {
        const currentTime = Date.now();
        if (currentTime - loginTime > sessionTimeout) {
            signOut();
            showMessage('Session expired. Please log in again.', 'error');
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

    document.querySelector('.sign-out').style.display = isLoggedIn ? 'block' : 'none';
}

function handleFileSelect(input) {
    const file = input.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    const fileName = file.name;
    document.querySelector('.upload-text').textContent = `Selected file: ${fileName}`;
    document.querySelector('.remove-file').style.display = 'inline-block';
    navigateTo('enrichmentView', true);
}

function removeFile() {
    const fileInput = document.getElementById('csvFile');
    fileInput.value = '';
    document.querySelector('.upload-text').textContent = 'Click or drag and drop your CSV file here';
    document.querySelector('.remove-file').style.display = 'none';
    navigateTo('uploadView', true);
}

function triggerFileInput() {
    document.getElementById('csvFile').click();
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');

    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                document.getElementById('csvFile').files = files;
                processFile(file);
            } else {
                showMessage('Please upload a valid CSV file.', 'error');
            }
        }
    });
}

function toggleCheckbox(optionElement) {
    const checkbox = optionElement.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
}

async function uploadFile() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        showMessage('Please select a CSV file.', 'error');
        return;
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showMessage('Please select a valid CSV file.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const selectedOption = document.querySelector('input[name="enrichment"]:checked');
    if (!selectedOption) {
        showMessage('Please select a verification option.', 'error');
        return;
    }
    formData.append('verification_type', selectedOption.value);

    try {
        const response = await axios.post(gcp_url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        showMessage('File uploaded and verification process started!', 'success');
    } catch (error) {
        console.error('Error:', error);
        if (error.message === 'Network Error') {
            showMessage('Unable to connect to the server. Please check your internet connection and try again.', 'error');
        } else if (error.response) {
            showMessage(`Error: ${error.response.data.message || 'An unexpected error occurred.'}`, 'error');
        } else if (error.request) {
            showMessage('No response received from the server. Please try again later.', 'error');
        } else {
            showMessage('An unexpected error occurred. Please try again.', 'error');
        }
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = type;
}

// Handle browser navigation
window.onpopstate = function(event) {
    const viewId = event.state ? event.state.view : 'signInView';
    updateView(viewId);
};

// Initialize the page
window.onload = function() {
    setupDragAndDrop();
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const loginTime = localStorage.getItem('loginTime');

    // Determine the initial view based on login status and URL hash
    let initialView = 'signInView';
    if (isLoggedIn && loginTime) {
        const currentTime = Date.now();
        if (currentTime - loginTime > sessionTimeout) {
            signOut();
            showMessage('Session expired. Please log in again.', 'error');
        } else {
            if (location.hash && views.includes(location.hash.substring(1))) {
                initialView = location.hash.substring(1);
            } else {
                initialView = 'initialView';
            }
        }
    }

    // Replace the current history state with the initial view
    history.replaceState({ view: initialView }, null, '#' + initialView);
    updateView(initialView);

};
