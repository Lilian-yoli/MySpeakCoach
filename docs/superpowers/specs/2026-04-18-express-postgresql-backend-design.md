# Express + PostgreSQL Backend Design Spec

## 1. Overview
The goal of this project is to create an Express.js backend with PostgreSQL integration for the MySpeak project. The backend will serve as an independent layer, living in the same repository but managed independently from the Vite React frontend. It will rely on Prisma ORM to provide an efficient, type-safe, and clear way to interact with the PostgreSQL database.

## 2. Architecture & Tech Stack
- **Framework:** Express.js (Node.js)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Directory Structure:** Monorepo setup with a completely isolated `/server` directory containing its own Node context.

## 3. Directory Structure
```text
server/
├── prisma/               
│   └── schema.prisma     # Prisma configuration and database schema definition
├── src/
│   ├── index.js          # Express entry point and server initialization
│   ├── routes/           # API route definitions
│   ├── controllers/      # Request handlers and business logic
│   └── lib/
│       └── prisma.js     # Shared Prisma Client instance
├── .env                  # Backend-specific environment variables (e.g., DATABASE_URL)
└── package.json          # Backend dependencies (express, cors, prisma, @prisma/client, etc.)
```

## 4. Components & Data Flow
1. **Frontend to Backend Communication:** The frontend (React/Vite) will send HTTP requests to the backend API (`http://localhost:<PORT>/api/*`). The backend will enable CORS to accept these requests.
2. **Routing and Controllers:** Express router (`routes/`) forwards requests to specific `controllers/`, separating route maps from business logic.
3. **Database Interaction:** The controllers will import the shared Prisma Client from `src/lib/prisma.js` to execute queries against the PostgreSQL instance.
4. **Data Modeling:** The initial data model will be defined in `prisma/schema.prisma`. Running Prisma migrations will automatically update the local PostgreSQL database schema.

## 5. Security & Error Handling
- **Environment Variables:** All secrets, notably the PostgreSQL connection string (`DATABASE_URL`), will be stored in an `.env` file within the `server/` directory and explicitly excluded from Git via `.gitignore`.
- **CORS:** Controlled via the `cors` middleware to correctly manage cross-origin state.

## 6. Implementation Steps Summary
1. Initialize the `server` directory and `package.json`.
2. Install Express, CORS, Prisma CLI, and relevant dependencies.
3. Scaffold `index.js`, routing, and the controller structure.
4. Initialize Prisma and link the local PostgreSQL database in the `.env` file.
5. Create a basic test schema, run a migration, and create a sanity-check API route to confirm connectivity end-to-end.
