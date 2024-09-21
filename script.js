const CLIENT_ID = '118792209172-t63kcgvdksau4brmsa06f60hc69jp28u.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAah9cWRJXVyrSdixL6pPSfdYsht7-fZnI';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let token;

/**
 * Load the Google API client library and initialize it
 */
function handleClientLoad() {
    console.log("Loading Google API...");
    gapi.load('client:auth2', initClient);
}

/**
 * Initialize the API client library and set up sign-in state listeners
 */
function initClient() {
    console.log("Initializing Google API client...");
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(() => {
        console.log("Google API initialized successfully.");
        
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
    console.log("Sign-in status updated: ", isSignedIn);
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
        console.log("Attempting to sign in...");
        gapi.auth2.getAuthInstance().signIn();
    }
};
