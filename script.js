const CLIENT_ID = '118792209172-t63kcgvdksau4brmsa06f60hc69jp28u.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAah9cWRJXVyrSdixL6pPSfdYsht7-fZnI';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let token;

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
    }).then(() => {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
    } else {
        token = null;
    }
}

document.getElementById('authButton').onclick = () => {
    gapi.auth2.getAuthInstance().signIn();
};

document.getElementById('uploadButton').onclick = async () => {
    const fileUrl = document.getElementById('fileUrl').value;
    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressContainer');
    const message = document.getElementById('message');
    
    if (!fileUrl) {
        alert('Please enter a file URL');
        return;
    }

    // Show progress bar
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

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        
        // Track the upload progress
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
            if (xhr.status === 200) {
                message.innerText = 'Upload complete!';
            } else {
                message.innerText = 'Error uploading file!';
            }
        };

        xhr.onerror = () => {
            message.innerText = 'Upload failed. Please try again.';
        };

        xhr.send(form);
        
    } catch (error) {
        message.innerText = 'Error: ' + error.message;
    }
};

// Load the API client and auth2 library
handleClientLoad();
