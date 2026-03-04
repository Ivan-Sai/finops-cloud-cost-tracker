# 💰 FinOps Cloud Cost Tracker

Desktop application for tracking cloud infrastructure costs, managing budgets, and analyzing spending deviations. Built with Electron, React, and SQLite.

![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-0170FE?logo=antdesign&logoColor=white)

## ✨ Features

- 📊 **Dashboard** — KPI cards (MTD spend, previous month, change %), 6-month trend chart, top-5 services, budget deviation overview
- 🔍 **Cost Explorer** — searchable data table with filters (service, project, date range), sorting, pagination, CRUD, area chart, CSV export
- 💵 **Budget Management** — create/edit/delete budgets with 3-level alert system (warning 80% / critical 95% / exceeded 100%), progress indicators, trend charts
- 📈 **Period Comparison** — month-to-month cost comparison with grouped bar chart and delta table
- 📥 **CSV Import Wizard** — 4-step flow: file selection → column mapping → data preview → import results with error reporting
- 📋 **Audit Log** — immutable event journal with filters, detail drawer, and CSV export
- ⚙️ **Settings** — theme toggle (dark/light), currency selection (USD/EUR/GBP/UAH), service & project management

### 🖥️ Electron Native Features

- **System Tray** — minimize to tray, quick navigation menu, alert summary badge
- **OS Notifications** — native desktop alerts when budgets are exceeded (with deduplication)
- **File Dialogs** — native open/save dialogs for CSV import and export

### 🎁 Bonus

- **Keyboard Shortcuts** — `Ctrl+D` Dashboard, `Ctrl+E` Cost Explorer, `Ctrl+N` new budget, `Ctrl+I` Import, `Ctrl+F` search
- **CSV Import/Export** — full import wizard + one-click export from Cost Explorer and Audit Log
- **Budget Alert System** — automatic checks after every data mutation, multi-channel notifications (in-app + tray + OS)

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Electron 33 + electron-vite |
| Frontend | React 18, TypeScript 5.7 |
| UI Library | Ant Design 5 |
| Charts | Recharts |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Database | better-sqlite3 (local SQLite) |
| Settings | electron-store |
| CSV | Papa Parse |
| Dates | dayjs |
| Routing | react-router-dom v6 |

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install & Run

```bash
npm install
npm run seed       # populate database with sample data
npm run dev
```

> **VS Code users:** if the Electron window doesn't open, clear the environment variable first:
> ```powershell
> $env:ELECTRON_RUN_AS_NODE=''; npm run dev
> ```

### Build

```bash
npm run build          # compile
npm run build:win      # Windows installer
npm run build:mac      # macOS installer
npm run build:linux    # Linux installer
```

## 📁 Project Structure

```
src/
├── main/                        # Electron main process
│   ├── index.ts                 # App entry — window, tray, IPC registration
│   ├── database/
│   │   ├── connection.ts        # SQLite connection
│   │   ├── migrations.ts        # Table creation & indexes
│   │   └── seed.ts              # Mock data (~200 cost records)
│   ├── ipc/                     # IPC handlers (8 modules, 30+ endpoints)
│   │   ├── costs.ipc.ts         # Cost CRUD, stats, export
│   │   ├── budgets.ipc.ts       # Budget CRUD, alert checks
│   │   ├── services.ipc.ts      # Service CRUD
│   │   ├── projects.ipc.ts      # Project CRUD
│   │   ├── audit.ipc.ts         # Audit log queries & export
│   │   ├── import.ipc.ts        # CSV parsing & import
│   │   ├── comparison.ipc.ts    # Period comparison
│   │   └── settings.ipc.ts      # App settings
│   └── services/
│       ├── alert.service.ts     # Budget alert computation
│       ├── notification.service.ts  # OS notifications
│       └── tray.service.ts      # System tray
├── preload/
│   └── index.ts                 # contextBridge (invoke / on / removeAllListeners)
└── renderer/                    # React application
    ├── App.tsx                  # Router, theme provider, error boundary
    ├── pages/
    │   ├── Dashboard/           # KPIs, trend chart, top services, alerts
    │   ├── CostExplorer/        # Table, filters, chart, CRUD forms
    │   ├── Budgets/             # List, form, detail page, trend
    │   ├── Comparison/          # Period picker, chart, delta table
    │   ├── Import/              # 4-step wizard
    │   ├── AuditLog/            # Table, filters, detail drawer
    │   └── Settings/            # Theme, currency, service/project management
    ├── stores/                  # Zustand stores (costs, budgets, projects, audit, theme, settings)
    ├── components/Layout/       # AppLayout, Sidebar, Header
    ├── hooks/                   # Keyboard shortcuts
    ├── types/                   # TypeScript interfaces
    └── utils/                   # Formatters (currency, dates, percentages)
```

## 🏗 Architecture

All database operations run in the **main process** — the renderer communicates exclusively through IPC via `contextBridge`. This ensures data integrity and process isolation.

```
Renderer (React)  ←→  Preload (contextBridge)  ←→  Main (SQLite + Services)
     │                                                     │
  Zustand stores                                    IPC handlers (8 modules)
  React Hook Form                                   better-sqlite3
  Recharts                                          electron-store
  Ant Design                                        Tray + Notifications
```

### IPC Channels

| Channel | Operations |
|---------|-----------|
| `costs:*` | getAll, getById, create, update, delete, getStats, getByService, getByProject, export |
| `budgets:*` | getAll, getById, create, update, delete, checkAlerts |
| `services:*` | getAll, create, update, delete |
| `projects:*` | getAll, create, update, delete |
| `audit:*` | getAll, getFilterOptions, export |
| `import:*` | selectFile, parseCSV, execute, getMappingOptions |
| `comparison:*` | getData |
| `settings:*` | get, set |

## 🗄 Database

SQLite with 5 tables:

- **services** — cloud services (EC2, S3, RDS, Lambda, CloudFront, EKS)
- **projects** — organizational projects with environment tags
- **costs** — cost records linked to services and projects
- **budgets** — spending limits with configurable alert thresholds
- **audit_log** — immutable event log (who, what, when, outcome)

Run `npm run seed` to populate with sample data (see [Sample Data](#-sample-data)).

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+D` | Go to Dashboard |
| `Ctrl+E` | Go to Cost Explorer |
| `Ctrl+N` | Create new budget |
| `Ctrl+I` | Go to Import |
| `Ctrl+F` | Focus search field |

## 📦 Sample Data

Run `npm run seed` to populate the database with mock data (6 services, 4 projects, ~200 cost records, 4 budgets, 50 audit entries). Re-running the command resets and re-seeds the database.

A `sample-import.csv` file is also included in the project root for testing the CSV import wizard.
