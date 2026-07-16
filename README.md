# FINT Backend API — AI Financial Advisor 🚀

FINT is a comprehensive, production-ready AI Financial Advisor platform backend built with NestJS, Prisma, and PostgreSQL. It tracks personal finance, calculates a proprietary FINT Score, and leverages AI to provide personalized recommendations, forecasts, and financial simulations.

---

## 🎯 Architecture Overview

```mermaid
graph TD;
    Frontend-->API_Gateway;
    API_Gateway-->AuthService;
    API_Gateway-->FinanceService;
    API_Gateway-->ScoreEngine;
    API_Gateway-->AIEngine;
    
    AuthService-->Database[(PostgreSQL)];
    FinanceService-->Database;
    ScoreEngine-->Database;
    AIEngine-->Database;
    
    AIEngine-->OpenAI[OpenAI / Gemini API];
```

---

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (Node.js)
- **Database**: PostgreSQL (via [Prisma ORM](https://www.prisma.io/))
- **Security**: JWT, Passport.js, bcrypt, Helmet, CORS, Throttler
- **Validation**: class-validator, class-transformer
- **AI Integration**: OpenAI / Gemini APIs
- **DevOps**: Docker, Docker Compose, GitHub Actions (CI/CD)
- **Documentation**: Swagger UI

---

## 🚀 Installation Guide

### Prerequisites
- Node.js (v20+)
- PostgreSQL (v16+)
- Docker (optional, for containerized setup)

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/fint-backend.git
   cd fint-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:password@localhost:5432/fint_db?schema=public"
   
   JWT_SECRET=FINT_SUPER_SECRET_KEY
   JWT_EXPIRES_IN=1d
   REFRESH_SECRET=FINT_REFRESH_SECRET
   REFRESH_EXPIRES_IN=7d
   BCRYPT_ROUNDS=12
   ```

4. **Run Database Migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

---

## 🐳 Deployment Guide (Docker)

To run the entire stack (Backend, PostgreSQL, Redis, pgAdmin) via Docker:

```bash
docker compose up -d
```
The API will be available at `http://localhost:3000/api/v1`.

---

## 📚 API Documentation (Swagger)

Interactive API documentation is automatically generated using Swagger.

Once the server is running, visit:
**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

## 🗄️ Database Design

The database is divided into multiple core domains:

1. **Authentication**: `User`, `UserProfile`
2. **Finance Modules**: `FinancialAccount`, `Income`, `Expense`, `Asset`, `Loan`, `Investment`, `Insurance`, `Retirement`, `FinancialGoal`
3. **Score Engine**: `ScoreHistory`, `ScoreFactor`
4. **AI Engine**: `Recommendation`, `Forecast`, `Simulation`

*Refer to `prisma/schema.prisma` for the exact schema definitions.*

---

## 🛡️ Security Audit (Phase 11)

- **Helmet**: Secures HTTP headers.
- **CORS**: Configured for cross-origin requests.
- **Rate Limiting**: `ThrottlerModule` implemented to prevent brute-force attacks (100 req/min).
- **Authentication**: JWT-based with distinct short-lived Access Tokens and long-lived Refresh Tokens.
- **Password Security**: Passwords hashed with `bcrypt` (12 rounds).
- **Validation**: Strict input validation using `class-validator` stripping all un-whitelisted payloads.

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# End-to-End tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 🤝 Contribution Guide

1. Create a feature branch: `git checkout -b feature/module-name`
2. Commit changes: `git commit -m "feat: description"`
3. Ensure type safety: `npx tsc --noEmit`
4. Push to branch: `git push origin feature/module-name`
5. Open a Pull Request.

*Note: Please ensure no sensitive data is passed to the AI Engine prompts (e.g., API keys, passwords, PAN/Aadhar numbers).*
