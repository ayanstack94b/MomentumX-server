# 🚀 MomentumX - Fitness & Gym Management Platform (Server)

The MomentumX Server is the backend REST API powering the MomentumX Fitness & Gym Management Platform. It handles authentication, authorization, user management, trainer applications, class management, bookings, favorites, community forums, comments, and administrative operations using a secure role-based architecture.

---

## 🌐 Live API

**Server:** https://momentumx-server-77se.onrender.com

---

## 🔗 Client Repository

https://github.com/ayanstack94b/MomentumX-Client

---

## 🔗 Server Repository

https://github.com/ayanstack94b/MomentumX-server
---

# ✨ Backend Features

* 🔐 JWT Authentication
* 🔑 Better Auth Integration
* 👤 Role-Based Authorization (Member, Trainer, Admin)
* 🛡️ Protected API Routes
* 🏋️ Fitness Class Management
* 📋 Trainer Application Management
* ❤️ Favorite Classes API
* 📅 Booking Management
* 💬 Community Forum APIs
* 👍 Like & Dislike System
* 💭 Comment Management
* 🚫 Soft Block User Protection
* 🔍 Search & Filter Support
* 📄 Server-side Pagination
* 🌍 RESTful API Architecture

---

# 🛠️ Technology Stack

* Node.js
* Express.js
* MongoDB
* JWT (jsonwebtoken)
* Better Auth
* dotenv
* cors

---

# 📌 API Modules

### Authentication

* JWT Generation
* Better Auth Integration
* Protected Authentication Middleware

### Users

* Register User
* Get User Profile
* Update User Profile
* Manage Users
* Block / Unblock Users
* Promote Admin
* Remove Trainer Role

### Trainer Applications

* Apply as Trainer
* View Trainer Application
* Approve Application
* Reject Application
* Admin Feedback

### Classes

* Create Class
* Update Class
* Delete Class
* Approve Class
* Reject Class
* View Trainer Classes
* Search Classes
* Filter Classes
* Pagination

### Bookings

* Book Fitness Classes
* Prevent Duplicate Bookings
* View User Bookings

### Favorites

* Add Favorite
* Remove Favorite
* Prevent Duplicate Favorites

### Community Forum

* Create Forum Post
* Delete Forum Post
* Like / Dislike Posts
* Pagination

### Comments

* Add Comment
* Delete Comment
* Blocked User Validation

---

# 🔒 Security

* JWT Verification Middleware
* Admin Authorization Middleware
* Protected CRUD Operations
* Role-Based API Access
* MongoDB Credentials Secured with Environment Variables
* Sensitive Keys Hidden Using dotenv
* Soft Block Protection for Restricted Users

---

# 📦 Installation

### Clone Repository

```bash
git clone <https://github.com/ayanstack94b/MomentumX-server.git>
```

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm start
```

---

# ⚙️ Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000

DB_USER=
DB_PASS=

JWT_SECRET=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
```

---

# 📂 Project Structure

```
📦 MomentumX Server
│
├── config
│   └── db.js
│
├── lib
│   └── auth.js
│
├── index.js
├── package.json
└── .env
```

---

# 🚀 API Highlights

* RESTful API Architecture
* MongoDB Database Integration
* Secure JWT Authentication
* Better Auth Support
* Protected Role-Based Routes
* Trainer Application Workflow
* Community Forum Management
* Booking & Favorites Management
* Search, Filter & Pagination
* Robust Error Handling

---

# 👨‍💻 Developer

**Ayon Banerjee**

If you found this project useful, consider giving the repository a ⭐.
