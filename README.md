# Daily Money Flow (Monorepo)

Monorepo architecture separating the application into distinct `frontend` and `backend` modules.

## Project Structure

```
daily-money-flow/
├── frontend/                  # Vite + React + TypeScript + Tailwind
│   ├── src/                   # Client application source
│   ├── public/                # Static assets & PWA icons
│   ├── index.html             # HTML entry point
│   ├── vite.config.ts         # Vite configuration
│   ├── package.json           # Frontend dependencies & scripts
│   └── .env                   # Frontend environment variables
│
├── backend/                   # Node.js + Express API & Supabase services
│   ├── server.js              # Express API server (port 5000)
│   ├── supabase/              # Supabase edge functions & configs
│   ├── package.json           # Backend dependencies & scripts
│   └── .env                   # Backend environment variables
│
├── package.json               # Root monorepo orchestration scripts
└── README.md
```

## Getting Started

### 1. Install All Dependencies
From the repository root:
```bash
npm run install:all
```

### 2. Run the Applications

- **Frontend (Vite dev server - port 5173)**:
  ```bash
  npm run dev
  # or
  npm run dev:frontend
  ```

- **Backend (Express API server - port 5000)**:
  ```bash
  npm run dev:backend
  # or
  npm run start
  ```

- **Build Frontend**:
  ```bash
  npm run build
  ```
