# GreenMarket 🌿

GreenMarket - Chợ điện tử cho người đam mê cây cảnh.

## 🏗 Project Structure

- `admin-web/`: Frontend dashboard built with React + TypeScript + Vite.
- `back-end/`: API server built with Node.js Express + TypeScript + Drizzle ORM.
- `docker/`: Docker configuration for postgreSQL and node.

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/oopsntn/GreenMarket.git
cd GreenMarket
```

### 2. Infrastructure Setup (Database)
The project uses PostgreSQL 18.2. The easiest way to run it is via Docker:

```bash
docker-compose up -d db
```
*Port: `5433` (External) | User/Pass: `admin`/`admin`*

---

## 💻 Development Guide

This project is optimized for **TypeScript** and uses **pnpm** as the package manager.

### 🎨 Frontend Development (`admin-web`)
To start developing the admin dashboard:

1. Navigate to the folder:
   ```bash
   cd admin-web
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run development server:
   ```bash
   pnpm dev
   ```
   *Dashboard will be available at: `http://localhost:5173`*

### ⚙️ Backend Development (`back-end`)
To start developing the API server:

1. Navigate to the folder:
   ```bash
   cd back-end
   ```
2. Setup environment variables:
   - Copy `.env.example` to `.env`.
   - Update `DATABASE_URL` in `.env`:
     ```env
     PORT=5000
     DATABASE_URL=postgresql://admin:admin@localhost:5433/GreenMarket
     ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Push database schema (if necessary):
   ```bash
   pnpm db:push
   ```
5. Run development server:
   ```bash
   pnpm dev
   ```
   *API will be available at: `http://localhost:5000`*

---

## 🐳 Docker Deployment

To run the entire stack (API + Database) using Docker:

```bash
docker-compose up --build
```

- **API:** `http://localhost:5000`
- **Database:** `localhost:5433`

---

## 🛠 Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build the project for production |
| `pnpm lint` | Run ESLint (TypeScript aware) |
| `pnpm type-check` | Run TypeScript compiler in check mode |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:push` | Sync schema to database |

---
*Happy coding! 🚀*
