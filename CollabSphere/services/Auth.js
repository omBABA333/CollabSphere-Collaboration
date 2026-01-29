// AddmeApp/services/Auth.js
import * as AuthSession from "expo-auth-session";
import { getAuth, GithubAuthProvider, signInWithCredential } from "firebase/auth";

// Your GitHub OAuth App's Client Secret
// WARNING: This is NOT safe for production apps.
// This is for development and demonstration purposes ONLY.
const GITHUB_CLIENT_SECRET = "7e126c7939ed46fd129ed2fb36b97e56f5094b65";

const discovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
};


export const githubSignIn = async (authCode, redirectUri) => {
  try {
    // 1. Exchange the auth code for an access token
    const tokenResponse = await fetch(discovery.tokenEndpoint, {
      method: "POST",
      headers: {
        // HIGHLIGHTED CHANGE: Ensure we explicitly accept JSON
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      // HIGHLIGHTED CHANGE: The body must be JSON-encoded string
      body: JSON.stringify({
        client_id: "Ov23liFoDCKHVXR2rI8D",
        client_secret: GITHUB_CLIENT_SECRET,
        code: authCode,
        redirect_uri: "exp://yuy-pkq-omaher-8081.exp.direct", // Pass the redirectUri here
      }),
    });

    // Check for a non-200 OK status, which indicates an error
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange failed:", errorData);
      throw new Error("Failed to get GitHub access token. Check console for details.");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("GitHub did not return an access token. Check your client secret and redirect URI.");
    }

    // 2. Use the access token to get the user's GitHub profile
    const profileResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const profileData = await profileResponse.json();
    const githubUsername = profileData.login;
    const githubUid = profileData.id.toString();

    // 3. Sign in to Firebase with the GitHub credential
    const credential = GithubAuthProvider.credential(accessToken);
    const auth = getAuth();
    await signInWithCredential(auth, credential);

    return { githubUsername, githubUid, accessToken };

  } catch (error) {
    console.error("GitHub sign-in failed:", error);
    throw error;
  }
};