/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
// const {onRequest} = require("firebase-functions/https");
// const logger = require("firebase-functions/logger");
const functions = require("firebase-functions");
const fetch = require("node-fetch");
const admin = require("firebase-admin");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});
admin.initializeApp();

// 🔹 Replace with your GitHub OAuth App details
const GITHUB_CLIENT_ID = "Ov23liFoDCKHVXR2rI8D";
const GITHUB_CLIENT_SECRET = "7e126c7939ed46fd129ed2fb36b97e56f5094b65";
exports.githubAuth = functions.https.onRequest(async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).json({error: "Missing code parameter"});
    }

    // Step 1: Exchange code for GitHub access_token
    const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code: code,
          }),
        },
    );

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error("GitHub token exchange error:", tokenData);
      return res.status(400).json(tokenData);
    }

    const githubAccessToken = tokenData.access_token;

    // Step 2: Use GitHub token to create Firebase custom token
    // (You can also fetch user info here if you want)
    const credential = admin.auth().createCustomToken(githubAccessToken);

    // Step 3: Return token to client
    return res.json({
      firebaseToken: await credential,
      githubAccessToken,
    });
  } catch (err) {
    console.error("Error in githubAuth function:", err);
    return res.status(500).json({error: "Internal Server Error"});
  }
});
// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
