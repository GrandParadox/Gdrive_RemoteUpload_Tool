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
 * Called when the signed in status changes
 * @param {boolean} isSignedIn
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        document.getElementById('authButton').innerText = 'Sign out of Google Drive';
    } else {
        token = null;
        document.getElementById('authButton').innerText = 'Authorize Google Drive';
    }
}

/**
 * Handle authorization button click
 */
document.getElementById('authButton').onclick = () => {
    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        // If already signed in, sign out
        gapi.auth2.getAuthInstance().signOut();
    } else {
        // Sign in if not signed in
        gapi.auth2.getAuthInstance().signIn();
    }
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

    // Validate file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.avi'];
    const fileExtension = fileUrl.slice((Math.max(0, fileUrl.lastIndexOf(".")) || Infinity) + 1);
    if (!validExtensions.includes('.' + fileExtension)) {
        alert('Please enter a valid file URL (image or video)');
        return;
    }

    // Show loading spinner and progress bar
    loading.style.display = 'block';
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
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
            loading.style.display = 'none';  // Hide loading spinner
            if (xhr.status === 200) {
                message.innerText = 'Upload complete!';
                displayUploadedFile(metadata.name);
            } else {
                message.innerText = 'Error uploading file! Please try again.';
            }
        };

        xhr.onerror = () => {
            loading.style.display = 'none';  // Hide loading spinner
            message.innerText = 'Upload failed. Please check your URL or network connection.';
        };

        xhr.send(form);
        
    } catch (error) {
        loading.style.display = 'none';  // Hide loading spinner
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
