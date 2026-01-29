// index.js
require('dotenv').config({ path: './config.env' }); // Load environment variables first

const express = require('express');
const cors = require('cors');
//const app = express();
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
//const port = process.env.PORT || 5000; // Use port from .env or default to 5000
//const githubRoutes = require('./routes/github');

// ✅ Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const app = express();
const port = process.env.PORT || 5000;

const githubRoutes = require('./routes/github');

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Enable parsing of JSON request bodies

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Collabsphere Backend is running!');
});

app.use('/api/github', githubRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Collabsphere backend listening at http://localhost:${port}`);
});