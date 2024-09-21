const CLIENT_ID = '118792209172-t63kcgvdksau4brmsa06f60hc69jp28u.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAah9cWRJXVyrSdixL6pPSfdYsht7-fZnI';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let token;

/**
 * Load the Google API client library and initialize it
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 * Initialize the API client library and set up sign-in state listeners
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(() => {
        // Listen for sign-in state changes
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }).catch((error) => {
        console.error("Error during Google API client initialization: ", error);
    });
}

/**
 * Called when the signed-in status changes
 * @param {boolean} isSignedIn
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        document.getElementById('uploadSection').style.display = 'block'; // Show upload section
        alert("You are signed in.");
    } else {
        token = null;
        document.getElementById('uploadSection').style.display = 'none'; // Hide upload section
        alert("You are signed out.");
    }
    toggleSignOutButton(isSignedIn);
}

/**
 * Toggle sign-out button visibility
 */
function toggleSignOutButton(isSignedIn) {
    const signOutButton = document.getElementById('signOutButton');
    if (isSignedIn) {
        signOutButton.style.display = 'block'; // Always show sign-out button
    } else {
        signOutButton.style.display = 'block'; // Show sign-out button even if not signed in
    }
}

/**
 * Handle authorization button click (sign in)
 */
document.getElementById('authButton').onclick = () => {
    gapi.auth2.getAuthInstance().signIn().then(() => {
        updateSigninStatus(true);  // Manually update the UI after successful sign-in
    }).catch((error) => {
        console.error("Error during sign-in: ", error);
    });
};

/**
 * Handle sign-out button click (always visible)
 */
document.getElementById('signOutButton').onclick = () => {
    gapi.auth2.getAuthInstance().signOut().then(() => {
        updateSigninStatus(false);  // Manually update the UI after sign-out
        alert("You have successfully signed out.");
    }).catch((error) => {
        console.error("Error during sign-out: ", error);
    });
};

/**
 * Handle file upload button click
 */
document.getElementById('uploadButton').onclick = async () => {
    const fileUrl = document.getElementById('fileUrl').value;
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const message = document.getElementById('message');
    const loading = document.getElementById('loading');

    if (!fileUrl) {
        alert('Please enter a file URL');
        return;
    }

    // Show progress bar and loading spinner
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    loading.style.display = 'block';
    message.innerText = 'Uploading...';

    try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const metadata = {
            name: fileUrl.split('/').pop(),
            mimeType: blob.type,
        };

        // Prepare form data for upload
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

        // Make an XMLHttpRequest to upload the file to Google Drive
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressBar.style.width = percentComplete + '%';
            }
        };

        xhr.onload = () => {
            loading.style.display = 'none';
            if (xhr.status === 200) {
                message.innerText = 'Upload complete!';
                displayUploadedFile(metadata.name);
            } else {
                message.innerText = 'Error uploading file! Please try again.';
            }
        };

        xhr.onerror = () => {
            loading.style.display = 'none';
            message.innerText = 'Upload failed. Please check your URL or network connection.';
        };

        xhr.send(form);

    } catch (error) {
        loading.style.display = 'none';
        message.innerText = 'Error: ' + error.message;
    }
};

/**
 * Display uploaded file information
 * @param {string} fileName 
 */
function displayUploadedFile(fileName) {
    const uploadedFiles = document.getElementById('uploadedFiles');
    const fileItem = document.createElement('div');
    fileItem.innerText = `Uploaded: ${fileName}`;
    uploadedFiles.appendChild(fileItem);
    }
