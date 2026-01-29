//import axios from "axios";
import { auth } from "./firebase";

const BACKEND_IP_ADDRESS = "10.125.52.71";
const BACKEND_URL = `http://${BACKEND_IP_ADDRESS}:5000`;

// Base URL of your backend
//const API_BASE = "http://localhost:5000/api/github"; 
// 👆 Change localhost to your LAN IP (e.g. http://192.168.x.x:5000) if testing on a real device

// Helper: Get Firebase ID token
// const getAuthHeader = async () => {
//   const token = await auth.currentUser.getIdToken();
//   return { headers: { Authorization: `Bearer ${token}` } };
// };

const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("No authenticated user found.");
    }
    // Get the Firebase ID token for the current user
    const idToken = await user.getIdToken();
    return idToken;
};

// 👉 Link GitHub account (after OAuth flow gives you code)
// export const linkGitHub = async (code) => {
//   const config = await getAuthHeader();
//   const res = await axios.post(`${API_BASE}/link`, { code }, config);
//   return res.data;
// };
export const linkGitHub = async (code, redirectUri, codeVerifier) => {
    const idToken = await getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/github/exchange-github-code`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ 
            code: code, 
            redirectUri: redirectUri, 
            codeVerifier: codeVerifier }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to exchange GitHub code.');
    }

    return data;
};

// 👉 Create a new repository under user/organization
// export const createRepo = async (repoName, description = "") => {
//   const config = await getAuthHeader();
//   const res = await axios.post(
//     `${API_BASE}/create-repo`,
//     { name: repoName, description },
//     config
//   );
//   return res.data;
// };
export const createGitHubRepo = async (projectId,projectName, description,privateRepo=true) => {

    const idToken = await getAuthToken();

    const response = await fetch(`${BACKEND_URL}/api/github/projects/${projectId}/create-repo`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`, // Securely send the ID token
        },
        body: JSON.stringify({ 
            repoName: projectName, 
            repoDescription: description,
            privateRepo,
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to create GitHub repository.');
    }
    return data;
};

// 👉 Add collaborator to a repository
// export const addCollaborator = async (repoName, collaboratorUsername) => {
//   const config = await getAuthHeader();
//   const res = await axios.post(
//     `${API_BASE}/add-collaborator`,
//     { repo: repoName, username: collaboratorUsername },
//     config
//   );
//   return res.data;
// };
export const addCollaboratorToRepo = async (projectId, memberUid) => {
    const idToken = await getAuthToken();
    const response = await fetch(`${BACKEND_URL}/api/github/projects/${projectId}/add-collaborator`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ memberUid }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to add collaborator to repository.');
    }
    return data;
};