const express = require('express');
const axios = require('axios');
const router = express.Router();
const qs = require('qs');

const admin = require("firebase-admin");

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Firestore ref
const db = admin.firestore();

// Middleware to verify Firebase ID token
async function verifyIdToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.*)$/);
    if (!match) return res.status(401).json({ error: "Missing ID token" });

    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.user = decoded; // { uid, email, etc. }
    next();
  } catch (err) {
    console.error("verifyIdToken error:", err);
    res.status(401).json({ error: "Invalid ID token" });
  }
}

router.post('/get-access-token', async (req, res) => {
  const { code, redirectUri, codeVerifier } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is missing.' });
  }

  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      qs.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      console.error('GitHub token exchange response:', tokenResponse.data);
      return res.status(500).json({ error: 'Failed to get GitHub access token.' });
    }

    // Return ONLY the access token to the client
    res.json({ accessToken: accessToken });

  } catch (error) {
    console.error('Error during GitHub token exchange:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error getting access token.' });
  }
});


router.post('/exchange-github-code',verifyIdToken, async (req, res) => {
  const { code, redirectUri, codeVerifier } = req.body; // Expect code and redirectUri from frontend
  const uid = req.user.uid;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is missing.' });
  }
  if (!codeVerifier) {
      return res.status(400).json({ error: 'PKCE code_verifier is missing.' });
  }

  try {
    // Step 1: Exchange the authorization code for an access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      qs.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          Accept: 'application/json', // Tell GitHub we want JSON back
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) return res.status(500).json({ error: 'Failed to get GitHub access token.' });
    // if (!accessToken) {
    //   console.error('GitHub token exchange response:', tokenResponse.data);
    //   return res.status(500).json({ error: 'Failed to get GitHub access token.' });
    // }

    // Step 2: Use the access token to get user's GitHub profile data
    const githubUserResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const githubUsername = githubUserResponse.data.login;
    //const githubId = githubUserResponse.data.id; // Optional: Store GitHub ID

    // Save in Firestore
    //const uid = req.user.uid;
    await db.collection("users").doc(uid).set(
      {
        githubUsername,
        githubAccessToken: accessToken, // ⚠️ Consider encrypting or keeping server-only
        githubLinkedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    //await db.collection("users").doc(uid).set({ githubUsername }, { merge: true });

    res.json({ githubUsername });

    // Return the GitHub username to the client
    //res.json({ githubUsername, githubId, accessToken });

  } catch (error) {
    console.error('Error during GitHub OAuth exchange:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error linking GitHub account.' });
  }
});

router.post("/projects/:projectId/create-repo", verifyIdToken, async (req, res) => {
  const { projectId } = req.params;
  const { repoName, repoDescription = "", privateRepo = true } = req.body;

  try {
    const uid = req.user.uid;

    const projectSnap  = await db.collection("projects").doc(projectId).get();
    if (!projectSnap.exists) {
      return res.status(404).json({ error: "Group not found" });
    }
    const project  = projectSnap.data();

    if (project.leaderId !== uid) return res.status(403).json({ error: "Only leader can create repo" });

    // Get leader’s GitHub token
    const leaderAuth = await db.collection("users").doc(uid).get();
    if (!leaderAuth.exists || !leaderAuth.data().githubAccessToken) {
      return res.status(400).json({ error: "Leader has not linked GitHub" });
    }
    const leaderToken = leaderAuth.data().githubAccessToken;

    // Create repo under leader’s account
    const createResp = await axios.post(
      "https://api.github.com/user/repos",
      { name: repoName, description: repoDescription, private: !!privateRepo },
      { headers: { Authorization: `token ${leaderToken}` } }
    );
    const repoData = createResp.data;

    // Invite collaborators
    const invited = [];
    const pending = [];
    for (const memberUid of project.members || []) {

      if (memberUid === uid) continue; // skip leader

      const memberAuth = await db.collection("users").doc(memberUid).get();
      if (memberAuth.exists && memberAuth.data().githubUsername) {
        const ghUsername = memberAuth.data().githubUsername;
        try {
          await axios.put(
            `https://api.github.com/repos/${repoData.full_name}/collaborators/${ghUsername}`,
            { permission: "push" },
            { headers: { Authorization: `token ${leaderToken}` } }
          );
          invited.push(ghUsername);
        } catch (inviteErr) {
          console.warn("Invite failed:", ghUsername, inviteErr.response?.data || inviteErr.message);
          pending.push(memberUid);
        }
      } else {
        pending.push(memberUid);
      }
    }

    // Save repo info to Firestore
    await db.collection("projects").doc(projectId).set(
      {
        githubRepo: { fullName: repoData.full_name, url: repoData.html_url },
        invitedGitHubUsernames: invited,
        pendingGitHubInvites: pending,
      },
      { merge: true }
    );

    res.json({ 
      githubRepositoryUrl: repoData.html_url,
      fullName: repoData.fullName,
      //repo: repoData,
      invited,
      pending 
    });
  } catch (err) {
    console.error("create-repo error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create repo" });
  }
});


router.post("/projects/:projectId/add-collaborator", verifyIdToken, async (req, res) => {
  const { projectId } = req.params;
  const { memberUid  } = req.body; // Expecting the member's Firebase UID

  try {
    const projectSnap = await db.collection("projects").doc(projectId).get();
    if (!projectSnap.exists) return res.status(404).json({ error: "Project not found" });
    const project = projectSnap.data();

    // 1. Authorization Check
    if (project.leaderId !== req.user.uid) return res.status(403).json({ error: "Only leader can add collaborators" });

    // 2. Target Member Check (Existence of GitHub Username)
    const memberSnap = await db.collection("users").doc(memberUid).get();
    if (!memberSnap.exists || !memberSnap.data().githubUsername) {
        return res.status(400).json({ error: "Target member has not linked GitHub." });
    }
    const githubUsername = memberSnap.data().githubUsername;
    
    if (!project.githubRepo || !project.githubRepo.fullName) {
      return res.status(400).json({ error: "Project has no GitHub repository linked." });
    }

    // 3. Leader Token Check
    const leaderAuth = await db.collection("users").doc(project.leaderId).get();
    if (!leaderAuth.exists || !leaderAuth.data().githubAccessToken) {
      return res.status(400).json({ error: "Leader's GitHub account is unlinked." });
    }
    const leaderToken = leaderAuth.data().githubAccessToken;

    // 4. GitHub API Call
    await axios.put(
      `https://api.github.com/repos/${project.githubRepo.fullName}/collaborators/${githubUsername}`,
      { permission: "push" }, // Grant read/write access
      { 
        headers: { 
          Authorization: `token ${leaderToken}`,
          Accept: 'application/vnd.github.v3+json',
        } 
      }
    );
    
    // 5. Update Project Document
    await db.collection("projects").doc(projectId).set( 
      {
        invitedGitHubUsernames: admin.firestore.FieldValue.arrayUnion(githubUsername),
      },
      { merge: true }
    );

    res.json({ success: true, githubUsername });
  } catch (err) {
    // Check for specific GitHub 404 (Repo not found) or 422 (Validation error, e.g., already collaborator)
    const status = err.response?.status;
    const githubMessage = err.response?.data?.message;

    if (status === 404) {
        return res.status(404).json({ error: "GitHub Repository not found or leader lacks permission." });
    }
    if (status === 422 && githubMessage && githubMessage.includes('already a collaborator')) {
        return res.status(422).json({ error: "User is already a collaborator on this repository." });
    }
    
    console.error("add-collaborator error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to add collaborator due to a server error." });
  }
});



module.exports = router;


