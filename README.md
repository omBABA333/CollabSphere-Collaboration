# 🚀 CollabSphere – Smart Collaboration & Project Management Platform

CollabSphere is a full-stack mobile application designed to simplify **team formation, project collaboration, task management, and GitHub-based proof of work** for students and developers.  
It enables leaders to manage projects, assign tasks, track progress, and verify contributions using GitHub integration.

This project was developed as a **Final Year Capstone Project**.

---

## ✨ Key Features

### 🔐 Authentication
- Firebase Authentication (Email & Password)
- GitHub Social Login (OAuth with Expo compatibility)
- Secure backend token verification using Firebase Admin SDK

### 👥 Team & Project Management
- Create and manage project groups
- Leader-based access control
- Member invitations and join requests
- Role-based permissions (Leader / Member)

### 📋 Task Management
- Leader creates and assigns tasks to one or more members
- Task status tracking:
  - Not Started
  - In Progress
  - Blocked
  - Pending
  - Done
- Due dates and task descriptions
- Task progress visible to all members

### 📊 Progress & Verification
- Task completion reports sent to leader
- Leader approval required for completed tasks
- GitHub repository integration used as **proof of work**
- Leader can verify progress using GitHub activity

### 🔔 Notifications
- Real-time notifications for:
  - Group invitations
  - Task assignments
  - Task updates
  - Join requests
- Actionable notification cards (Accept / Reject / View)

### 🧩 GitHub Integration
- Link GitHub account to profile
- Create repositories directly from the app
- Automatically add group members as collaborators
- Handles users with and without linked GitHub accounts

---

## 🧑‍💻 Tech Stack

### 📱 Frontend
- React Native (Expo)
- JavaScript (ES6+)
- Firebase Authentication
- Firebase Firestore
- Expo Auth Session (GitHub OAuth)
- React Navigation

### 🧠 Backend
- Node.js
- Express.js
- Firebase Admin SDK
- GitHub REST API
- Axios
- dotenv
- CORS

---

## Backend Setup
- cd backend
- npm install
- cp config.env.example config.env
- node index.js
- Backend runs on: http://localhost:5000

---

## frontend Setup
- cd frontend
- npm install
- cp .env.example .env
- npx expo start
- Run using Expo Go app or emulator.

---


