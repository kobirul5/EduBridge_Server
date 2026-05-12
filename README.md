# 🎓 EduBridge Server

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-v4-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-black.svg)](https://www.prisma.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**EduBridge Server** is a robust, scalable, and feature-rich backend designed for a tutor-student marketplace. It facilitates seamless learning experiences through real-time communication, secure payments, and an efficient tutor booking system.

---

## 🔍 Project Analysis

EduBridge is built on a modern **Modular Architecture**, ensuring high maintainability and scalability. Each functional area (User, Tutor, Payment, Chat, etc.) is isolated into its own module containing its routes, controllers, services, and validation logic.

### Core Systems:
1.  **Identity Management**: Secure authentication using JWT with role-based access control (Admin, Tutor, Student). Includes password reset and account status management (Blocked/Suspended).
2.  **Marketplace Engine**: Specialized modules for tutor profiles, availability management, and a booking system that connects students with the right educators.
3.  **Real-time Layer**: A WebSocket-powered engine for instant messaging and signaling for audio/video calls.
4.  **Financial Infrastructure**: Integrated with Stripe for secure payment processing and financial analytics for admins.
5.  **Engagement & Notifications**: Firebase-powered push notifications and Brevo-integrated email services to keep users engaged and informed.

---

## ✨ Key Features

-   **👤 User Management**: Multi-role support (Student, Tutor, Admin) with profile completion tracking.
-   **📅 Tutor Booking**: Advanced search, booking requests, and availability management.
-   **💬 Real-time Chat**: Instant messaging with image support and unread message tracking.
-   **📞 Video/Audio Signaling**: WebSocket infrastructure to support peer-to-peer calling.
-   **💳 Payments**: Stripe integration for bookings and transaction history.
-   **🔔 Notifications**: Real-time push notifications via Firebase and transactional emails via Brevo.
-   **📊 Admin Dashboard**: Comprehensive stats (User growth, Income analytics) and tutor approval workflow.
-   **⭐ Reviews & Ratings**: Trust-based system for students to rate their learning experience.

---

## 🛠️ Tech Stack

-   **Backend**: Node.js, Express.js
-   **Language**: TypeScript
-   **ORM**: Prisma
-   **Database**: MongoDB (via Prisma)
-   **Real-time**: WS (WebSockets)
-   **Validation**: Zod
-   **Storage**: DigitalOcean Spaces, Cloudinary
-   **Payments**: Stripe
-   **Email**: Brevo (Sendinblue)
-   **Push Notifications**: Firebase Admin SDK

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── modules/          # Business logic (Auth, User, Tutor, etc.)
│   ├── middlewares/      # Global & custom middlewares
│   ├── routes/           # Centralized route management
│   └── db/               # Database initialization
├── config/               # Environment & global configurations
├── errors/               # Custom error handling
├── helpars/              # Utility functions (JWT, Websockets, etc.)
├── shared/               # Reusable logic (Prisma, Cloudinary, etc.)
├── server.ts             # Application entry point
└── app.ts                # Express app configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB connection string

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd EduBridge_Server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root and add the necessary keys (refer to `.env.example`).
4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

### Running the Project
- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Production**: `npm start`

---

## 📜 Available Scripts

- `npm run dev`: Starts the development server with hot-reload.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm start`: Runs the production build.
- `npm run generate`: Custom script to scaffold new modules.

---

## 🛡️ Security
- JWT-based authentication.
- Password hashing with Bcrypt.
- Request validation using Zod.
- Graceful shutdown handles for database and server connections.

---

*Built with by Md. Kobirul Islam*
