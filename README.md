# 🏦 Zorvyn Secure Finance Dashboard Backend

A highly secure, scalable, and robust RESTful API built with Node.js, Express, and PostgreSQL to manage and analyze financial records. This application is architected around Role-Based Access Control (RBAC) and military-grade AES-256-GCM encryption, ensuring that sensitive financial data remains strictly confidential and immutable to unauthorized actors. It is natively backed by **PostgreSQL**, making it 100% production and deployment ready!

---

## 🚀 Core Features & Security Posture

### 1. Role-Based Access Control (RBAC)
- **`ADMIN`**: Full CRUD access. Can create, read, update, and delete financial records.
- **`ANALYST`**: Data analysis access. Can read all records and generate financial summaries/analytics.
- **`VIEWER`**: Read-only access. Can view basic data but is strictly prohibited from analytical queries or destructive operations.

### 2. Cryptographic Security at Rest (AES-256-GCM)
- Financial `amount` and descriptive `notes` fields are securely encrypted at rest in the PostgreSQL database using the advanced `AES-256-GCM` algorithm.
- Employs a random 16-byte Initialization Vector (IV) for every record, eliminating vector collisions.
- Uses an Authentication Tag to verify ciphertext integrity upon decryption, ensuring data has not been tampered with.
- User passwords are cryptographically hashed using `bcryptjs` with salt.
- Highly secure JSON Web Tokens (JWT) are used for stateless session management.

### 3. API Hardening & Resiliency
- **Rate Limiting** (`express-rate-limit`) prevents brute-force login attempts and DDoS attacks.
- **HTTP Header Security** (`helmet`) safeguards against common web vulnerabilities like XSS, Clickjacking, and MIME sniffing.
- **Input Validation** (`zod`) ensures strict incoming payload validation, throwing immediate `400 Bad Request` cascades for malformed bodies or weak passwords.

---

## 🛠 Tech Stack

- **Runtime Engine**: Node.js (v18+)
- **Web Framework**: Express.js
- **Database**: PostgreSQL (Cloud/Remote Ready)
- **ORM (Object-Relational Mapping)**: Prisma Client
- **Validation Schema**: Zod
- **Encryption**: Native Node.js `crypto` module
- **Authentication**: `jsonwebtoken` (JWT), `bcryptjs`

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (Node Package Manager)
- A PostgreSQL Database

### 2. Installation
Clone the repository and install all required dependencies:
```bash
npm install
```

### 3. Environment Configuration (`.env`)
Create a `.env` file in the root directory:
```env
PORT=3000
DATABASE_URL="postgres://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?sslmode=require"
JWT_SECRET="your_highly_secure_random_jwt_secret_key"

# ENCRYPTION_KEY MUST be exactly 64 hexadecimal characters (32 bytes representation). 
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

### 4. Database Setup & Initialization
Generate the Prisma client and push the schema to the remote PostgreSQL database:
```bash
npx prisma generate
npx prisma db push
```

### 5. Start the Server
```bash
npm run dev  # For nodemon watching
# OR
npm start    # For standard Node execution
```

---

## 🌍 Deployment Guide (Production Ready)

The project is fully configured for deployment on platforms like Render, Heroku, Vercel, AWS or Railway.

### 1. Package.json adjustments for deployment
On platforms like Render, ensure that your `build` command executes the Prisma client generation. Alternatively, deploy hooks usually manage this, but adding a `postinstall` script helps securely generate the Prisma client automatically during the build architecture phase:
```json
"scripts": {
  "start": "node index.js",
  "postinstall": "prisma generate"
}
```

### 2. Environment Variables in Production
Provide the following exact keys to your Hosting Provider's Environment Variable/Secrets settings:
- `DATABASE_URL` (Your production PostgreSQL connection string)
- `JWT_SECRET` (A strong, securely generated string)
- `ENCRYPTION_KEY` (MUST match your existing 64-hex-character string to successfully decrypt existing data! NEVER lose or cycle this key in production without migrating data first!)

### 3. Database Migrations on Deploy
Your platform build command (e.g., on Render or Railway settings dashboard) should execute the schema synchronization before starting the server natively:
```bash
npm install && npx prisma db push
```
Then let the platform natively fire `npm start` to execute `node index.js`. 

---

## 📚 API Documentation & Endpoints

### 🔐 Authentication

#### 1. Register User
- **Path:** `POST /api/auth/register`
- **Access:** Public
- **Payload:**
  ```json
  {
    "email": "admin@zorvyn.com",
    "password": "Password123!",
    "role": "ADMIN" // "ADMIN", "ANALYST", or "VIEWER"
  }
  ```
- **Returns:** `201 Created` with `userId`

#### 2. Login User
- **Path:** `POST /api/auth/login`
- **Access:** Public
- **Payload:**
  ```json
  {
    "email": "admin@zorvyn.com",
    "password": "Password123!"
  }
  ```
- **Returns:** `200 OK` with JSON Web Token (`token`)

---

### 📊 Financial Records
**ALL routes below require the HTTP Header:** 
`Authorization: Bearer <YOUR_JWT_TOKEN>`

#### 1. Create Record
- **Path:** `POST /api/records`
- **Access:** `ADMIN` strictly
- **Payload:**
  ```json
  {
    "amount": 2500.50,
    "type": "INCOME",
    "category": "Consulting",
    "date": "2026-04-02T10:00:00Z",
    "notesEncrypted": "Confidential corporate consulting payout"
  }
  ```
- **Returns:** `201 Created`. *(Returns `403 Forbidden` if logged in as VIEWER/ANALYST). Data is securely encrypted via AES-256-GCM before arriving in PostgreSQL.*

#### 2. Retrieve All Records
- **Path:** `GET /api/records`
- **Access:** `ADMIN`, `ANALYST`, `VIEWER`
- **Returns:** `200 OK` array of all decrypted human-readable records safely reconstructed from PostgreSQL.

#### 3. Dashboard Financial Analytics
- **Path:** `GET /api/summary`
- **Access:** `ADMIN`, `ANALYST` (Viewer is blocked)
- **Returns:** `200 OK` containing secure dynamic mathematical calculation of Total Income, Total Expenses, Net Balance, and categorizations safely decrypted natively on the fly. 

#### 4. Delete Record
- **Path:** `DELETE /api/records/:id`
- **Access:** `ADMIN` strictly
- **Returns:** `200 OK`. 

---

## 🧠 Architecture details

1. **MVC Separation:** 
   - `routes/` dictates endpoints and middleware bindings.
   - `controllers/` processes logic.
   - `models/` uses `prisma/schema.prisma` for strict PostgreSQL relationships.
2. **Zod Validations:** Extracts invalid properties to fail quickly before expensive encryption/database requests execute.
3. **Symmetric Payload Cryptography (`utils/encryption.js`):** 
   - Generates dynamic IVs per interaction.
   - Outputs formatting seamlessly to the Database in string format: `<iv>:<authTag>:<encryptedText>`.
   - Highly decoupled and guarantees mathematical integrity inside the remote Database.# Finance-Data-Processing-and-Access-Control-Backend
