# File Conversion Backend (Node.js + Express)

This is a Node.js backend application built using **Express** that provides:

- Google OAuth authentication
- JWT-based authorization
- File conversion (mock – rename only)
- Centralized audit logging
- REST APIs consumed by a frontend UI

The backend acts as the **single source of truth** for authentication, conversion logic, and audit logs.

---

## 🚀 Features

- 🔐 Google Sign-In using OAuth 2.0
- 🪪 JWT-based protected APIs
- 📂 File upload using Multer
- 🔁 Mock file conversion (file renaming)
- 🧾 Centralized audit logs (UPLOAD / CONVERT / DOWNLOAD / ERROR)
- 🌐 CORS enabled for frontend integration
- 🩺 Health check endpoint

---

## 🛠 Tech Stack

- Node.js
- Express.js
- Google Auth Library
- JSON Web Token (JWT)
- Multer (file uploads)
- dotenv
- cors

---


-npm install
-npm start
-Backend running on port 5000

