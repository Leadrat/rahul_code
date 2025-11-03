# Tic-Tac-Toe Multiplatform Stack

A full-stack, real-time Tic-Tac-Toe platform that ships with:

- **Next.js 16** web frontend (TypeScript, App Router)
- **Flutter** mobile application with feature parity to the web client
- **.NET 9** backend with SignalR, PostgreSQL, and Clean Architecture

This README serves as the single source of truth for setting up, running, and contributing to the project.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Solution Architecture](#solution-architecture)
4. [Repository Structure](#repository-structure)
5. [Technology Stack](#technology-stack)
6. [Prerequisites](#prerequisites)
7. [Quick Start](#quick-start)
8. [Backend Setup](#backend-setup)
9. [Web Frontend (Next.js) Setup](#web-frontend-nextjs-setup)
10. [Mobile Frontend (Flutter) Setup](#mobile-frontend-flutter-setup)
11. [Environment Configuration](#environment-configuration)
12. [API Overview](#api-overview)
13. [Available Scripts](#available-scripts)
14. [Testing](#testing)
15. [Troubleshooting](#troubleshooting)
16. [Additional Documentation](#additional-documentation)
17. [Contributing](#contributing)

---

## Project Overview

The platform delivers a consistent Tic-Tac-Toe experience across web and mobile. It includes secure authentication, invites, real-time multiplayer powered by SignalR, and an admin dashboard. The backend enforces row-level security and exposes REST APIs consumed by both frontend clients.

---

## Key Features

- Real-time multiplayer games with move synchronization
- Invite system with live notifications and presence updates
- Authentication with JWTs and Microsoft Identity
- Admin tooling for player and game management
- Mobile parity: Flutter app matches the web feature set

---

## Solution Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Tic-Tac-Toe Stack                          │
├───────────────────┬────────────────────────────────────┬──────────────┤
│ Web Frontend      │ Mobile Frontend                    │ Backend      │
│ Next.js 16 (TS)   │ Flutter 3 (Dart)                   │ .NET 9 API   │
│ - React 19        │ - Provider state management        │ - Clean Arch │
│ - API calls via   │ - SignalR client                   │ - PostgreSQL │
│   REST + SignalR  │ - Shared auth flow                 │ - JWT + RLS  │
└───────────────────┴────────────────────────────────────┴──────────────┘
```

- **SignalR Hub** (`/gameHub`) broadcasts game invites, moves, and presence.
- **REST APIs** under `/api/*` expose CRUD operations for auth, games, invites, and admin actions.
- **Shared DTOs and business logic** live in the Application layer of the backend, ensuring parity between clients.

---

## Repository Structure

```
│  README.md                # You are here
│  package.json             # Next.js workspace scripts
│  .env                     # Sample environment variables
│  start-all-parallel.ps1   # Launch backend + frontend together
│  start-backend.ps1        # Convenience script for API
│  start-frontend.ps1       # Convenience script for Next.js app
│  start-flutter.ps1        # Convenience script for Flutter app
├─ dotnet_core_backend/     # .NET 9 Clean Architecture solution
├─ src/                     # Next.js 16 web frontend (App Router)
├─ flutter_frontend/        # Flutter mobile application
├─ docs & notes             # plan.md, FLUTTER_SETUP.md, etc.
└─ specs/                   # Functional specifications and user stories
```

Refer to component-specific READMEs inside each directory for deeper dives.

---

## Technology Stack

| Layer            | Technologies                                                                 |
|------------------|------------------------------------------------------------------------------|
| Backend          | .NET 9, ASP.NET Core, Entity Framework Core, PostgreSQL, SignalR, Clean Arch |
| Web Frontend     | Next.js 16, React 19, TypeScript, CSS Modules                                |
| Mobile Frontend  | Flutter 3, Dart, Provider, SignalR (`signalr_netcore`), SharedPreferences     |
| Tooling          | ESLint, TypeScript, PowerShell scripts, Docker (backend)                      |

---

## Prerequisites

Install the following before running the stack locally:

- **Node.js** ≥ 20 (for Next.js and npm scripts)
- **npm** ≥ 10 (bundled with Node 20)
- **.NET SDK** 9.0
- **PostgreSQL** 14+ (or compatible managed instance)
- **Flutter SDK** ≥ 3.0 (if building the mobile client)
- **PowerShell** 7+ (for helper scripts on Windows)

Ensure the PostgreSQL instance is reachable and credentials are available for the backend configuration.

---

## Quick Start

1. **Clone the repository** (if you have not already).
2. **Configure environment variables** (see [Environment Configuration](#environment-configuration)).
3. **Start the backend**
   ```powershell
   # From repository root
   .\start-backend.ps1
   ```
4. **Start the web frontend**
   ```powershell
   # In a new terminal
   .\start-frontend.ps1
   ```
   Visit `http://localhost:3000`.
5. **Optional – Start the Flutter app**
   ```powershell
   .\start-flutter.ps1
   ```
6. **Full stack in parallel**
   ```powershell
   .\start-all-parallel.ps1
   ```
   This opens dedicated PowerShell windows for the backend and web frontend.

---

## Backend Setup

Project location: `dotnet_core_backend/`

1. **Restore and build**
   ```powershell
   cd dotnet_core_backend
   dotnet restore
   dotnet build
   ```
2. **Configure `appsettings.json`** with PostgreSQL connection string, JWT settings, and admin seed email.
3. **Apply database migrations**
   ```powershell
   dotnet ef database update
   ```
4. **Run the API**
   ```powershell
   cd GameBackend.API
   dotnet run
   ```
   Default URL: `http://localhost:5281`. Swagger/OpenAPI is available in Development mode.

> Detailed documentation lives in `dotnet_core_backend/README.md`.

---

## Web Frontend (Next.js) Setup

Project location: `src/`

1. **Install dependencies**
   ```powershell
   cd src
   npm install
   ```
2. **Environment variables**
   - Copy `.env` → `.env.local` at the repository root.
   - Ensure `NEXT_PUBLIC_BACKEND_URL` points to the running backend (e.g. `http://localhost:5281`).
3. **Start development server**
   ```powershell
   npm run dev
   ```
4. **Production build**
   ```powershell
   npm run build
   npm start
   ```

The web client uses SignalR to subscribe to game events and consumes REST endpoints via the configured backend URL.

---

## Mobile Frontend (Flutter) Setup

Project location: `flutter_frontend/`

1. **Install Flutter packages**
   ```powershell
   cd flutter_frontend
   flutter pub get
   ```
2. **Update API endpoints (if required)**
   - `lib/services/api_service.dart` → `baseUrl`
   - `lib/services/signalr_service.dart` → `hubUrl`
   Use `http://localhost:5281` for emulators or your machine IP for physical devices.
3. **Run the app**
   ```powershell
   flutter run
   ```
4. For convenience, `start-flutter.ps1` walks through dependency checks, device selection, and launch.

Refer to `FLUTTER_SETUP.md` and `flutter_frontend/README.md` for deeper guidance, troubleshooting, and platform-specific instructions.

---

## Environment Configuration

### Root `.env`

Copy `.env` to `.env.local` (ignored by Git) and update values:

```dotenv
MONGODB_URI=...                # Example placeholder – replace with your instance
PORT=4001                      # Backend service port (legacy)
NEXT_PUBLIC_BACKEND_URL=http://localhost:5281
```

> The web app only requires `NEXT_PUBLIC_BACKEND_URL`. Remove unused values if not applicable.

### Backend `appsettings.*.json`

Configure:

- `ConnectionStrings:DefaultConnection` → PostgreSQL connection string
- `JwtSettings` → Secret, Issuer, Audience
- `AdminEmail` → Seed admin account

### Flutter Secrets

API URLs are stored in Dart files under `flutter_frontend/lib/services/`. Adjust when testing on real devices.

---

## API Overview

Base URL: `http://localhost:5281/api`

| Area           | Endpoint                         | Description                    |
|----------------|----------------------------------|--------------------------------|
| Auth           | `POST /auth/register`            | Register a new account         |
|                | `POST /auth/login`               | Authenticate and receive JWT   |
|                | `GET /auth/me`                   | Fetch current user profile     |
| Games          | `GET /games`                     | List games for current user    |
|                | `GET /games/{id}`                | Fetch specific game            |
|                | `POST /games`                    | Create new game                |
|                | `PUT /games/{id}`                | Update existing game           |
|                | `DELETE /games/{id}`             | Remove game                    |
| Invites        | `GET /invites`                   | List invites for current user  |
|                | `POST /invites`                  | Send invite                    |
|                | `POST /invites/{id}/respond`     | Accept or decline invite       |
|                | `PUT /invites/{id}/status`       | Update invite status           |
| SignalR Hub    | `/gameHub`                       | Real-time invites & gameplay   |

Admin-specific endpoints reside under `/api/admin/*` (see backend documentation).

---

## Available Scripts

| Script                    | Description                                                   |
|---------------------------|---------------------------------------------------------------|
| `npm run dev`             | Start Next.js dev server (`src/`)                             |
| `npm run build`           | Build Next.js for production                                  |
| `npm run start`           | Serve built Next.js app                                       |
| `npm run lint`            | Lint web frontend                                             |
| `dotnet run`              | Launch backend API                                            |
| `dotnet test`             | Execute backend test suite                                    |
| `flutter run`             | Run Flutter application                                       |
| `flutter build <target>`  | Build Flutter for release (apk/appbundle/ios)                 |
| `start-backend.ps1`       | Helper script to run backend from repository root            |
| `start-frontend.ps1`      | Helper script to run Next.js frontend from repository root   |
| `start-flutter.ps1`       | Helper script to launch Flutter app from repository root     |
| `start-all-parallel.ps1`  | Start backend and web frontend in separate PowerShell shells |

---

## Testing

- **Backend**: `dotnet test` (from `dotnet_core_backend`) runs unit/integration tests.
- **Web Frontend**: `npm run lint` ensures code quality. Add tests with your preferred framework (e.g., Jest, Playwright) as the project evolves.
- **Flutter**: `flutter test` (from `flutter_frontend`) executes Dart unit/widget tests.

---

## Troubleshooting

| Issue                                  | Resolution                                                                 |
|----------------------------------------|----------------------------------------------------------------------------|
| Backend fails to connect to database   | Verify PostgreSQL credentials and network access; re-run migrations        |
| SignalR connection errors              | Confirm backend is running on the configured URL and JWT token is valid   |
| Flutter cannot reach backend           | Use machine IP instead of `localhost` on physical devices                  |
| Missing Flutter devices                | Run `flutter doctor` and start an emulator or connect a device             |
| Web frontend cannot fetch API          | Ensure `NEXT_PUBLIC_BACKEND_URL` matches backend origin                    |

Additional Flutter-specific troubleshooting tips are in `FLUTTER_SETUP.md`.

---

## Additional Documentation

- `dotnet_core_backend/README.md` – Clean Architecture, endpoints, migrations, Docker notes
- `flutter_frontend/README.md` – Mobile-specific setup, screenshots, troubleshooting
- `FLUTTER_SETUP.md` – Guided installation and launch flow for the Flutter app
- `FLUTTER_FRONTEND_SUMMARY.md` – Feature parity checklist and architecture notes
- `plan.md` / `plan.txt` – Historical planning documents

---

## Contributing

1. Fork and clone the repository.
2. Create a new branch for your feature or fix.
3. Run component-specific linters/tests before pushing.
4. Open a pull request documenting changes and testing evidence.

Please follow Clean Architecture patterns in the backend and keep frontend contributions aligned with existing code style and lint rules.

---

Happy hacking! 🚀
