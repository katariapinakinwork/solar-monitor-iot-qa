# SolarMonitor IIoT Platform

A customer-facing solar energy monitoring web application built with **ASP.NET Core MVC (.NET 10)** and **PostgreSQL**. It provides real-time visibility into solar plant performance, energy production metrics, alert management, and historical reporting for an industrial IoT (IIoT) solar fleet with role-based authentication and authorization.

---

## Authentication & Pre-configured Test Accounts

The platform includes cookie-based authentication with two distinct roles: **Viewer** and **Action Taker**. Pre-seeded accounts are initialized on the very first start.

### Login Credentials

| Role | Username | Email | Password | Allowed Capabilities |
|------|----------|-------|----------|----------------------|
| **Viewer** | `viewer` | `viewer@solarmonitor.io` | `Viewer@123` | Read-only access to Dashboard, Plants, Plant Detail, Reports, and Alerts. **Cannot** acknowledge alerts or modify system state. |
| **Action Taker** | `actiontaker` | `actiontaker@solarmonitor.io` | `Action@123` | Full access. Can view all pages **and** perform operational actions such as acknowledging and resolving alerts. |

> **Login Page:** Navigate to `http://localhost:8080/Account/Login`.  
> Both usernames and emails are accepted. The sign-in page also includes quick-fill test credential buttons for rapid manual and Playwright automated testing.

---

## Authorization & Role Matrix

| Resource / Endpoint | HTTP Method | Anonymous | Viewer | Action Taker |
|---------------------|-------------|-----------|--------|--------------|
| `/Account/Login` | GET, POST | Allowed | Allowed | Allowed |
| `/Account/Logout` | POST | Denied (Redirect) | Allowed | Allowed |
| `/Account/AccessDenied` | GET | Allowed | Allowed | Allowed |
| `/` (Dashboard) | GET | Denied (Redirect to Login) | Allowed | Allowed |
| `/Plants` (Plant List) | GET | Denied (Redirect to Login) | Allowed | Allowed |
| `/Plants/Detail/{id}` | GET | Denied (Redirect to Login) | Allowed | Allowed |
| `/Alerts` (Alerts View) | GET | Denied (Redirect to Login) | Allowed (Acknowledge buttons disabled) | Allowed (Full access) |
| `/Alerts/Acknowledge` | POST | Denied (Redirect to Login) | **403 Forbidden** (Redirect to AccessDenied) | **Allowed** (Acknowledge & resolve) |
| `/Reports` (Reports View) | GET | Denied (Redirect to Login) | Allowed | Allowed |

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Sign In | `/Account/Login` | Authentication page with credential helpers for automated testing |
| Dashboard | `/` | Fleet-wide KPIs, plant status overview, hourly chart, recent alerts |
| Solar Plants | `/Plants` | Searchable/filterable plant grid with today's generation |
| Plant Detail | `/Plants/Detail/{id}` | Per-plant metrics, panel inventory, hourly & daily charts |
| Alerts | `/Alerts` | Active/resolved alerts with role-gated acknowledge workflow |
| Reports | `/Reports` | Configurable energy reports (hourly/daily/monthly) with charts |
| Access Denied | `/Account/AccessDenied` | 403 Forbidden page for unauthorized actions |

---

## Quick Start — Docker (Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Run with Docker Compose

```bash
# Clone / open the project directory
cd IoT_Test

# Build and start both the app and PostgreSQL
docker compose up --build
```

The application will be available at **http://localhost:8080**

> **First start:** EF Core automatically applies database migrations and seeds all dummy data. No manual database setup required.

### Stop the application

```bash
docker compose down
```

### Reset database (clear all data and re-seed)

```bash
docker compose down -v   # -v removes the postgres volume
docker compose up --build
```

---

## Local Development (without Docker)

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [PostgreSQL 14+](https://www.postgresql.org/download/) running locally

### 1. Configure the connection string

Edit `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=solarmonitor;Username=solaruser;Password=solarpass"
  }
}
```

Or set it as an environment variable:
```bash
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Port=5432;Database=solarmonitor;Username=solaruser;Password=solarpass"
```

### 2. Create the PostgreSQL database and user

```sql
CREATE DATABASE solarmonitor;
CREATE USER solaruser WITH ENCRYPTED PASSWORD 'solarpass';
GRANT ALL PRIVILEGES ON DATABASE solarmonitor TO solaruser;
```

### 3. Run the application

```bash
cd IoT_Test
dotnet run
```

The app will auto-apply migrations and seed data, then be available at **https://localhost:5001** / **http://localhost:5000**.

---

## Database

### Technology
- **PostgreSQL 16** (via Docker) or any PostgreSQL 14+ instance
- **Entity Framework Core 9** with Npgsql provider
- Migrations in `Migrations/` folder

### Schema Overview

| Table | Description |
|-------|-------------|
| `SolarPlants` | Solar installation master data (5 plants seeded) |
| `SolarPanels` | Panel inventory, 20 representative panels per plant |
| `EnergyReadings` | Hourly readings for 30 days (6 AM–6 PM), ~1,650 rows |
| `Alerts` | 10 seeded alerts (6 active, 4 resolved) |

### Manual DB operations

```bash
# Apply migrations manually
dotnet ef database update

# See the reference SQL script
cat Scripts/init-db.sql
```

---

## Project Structure

```
IoT_Test/
├── Controllers/
│   ├── HomeController.cs       # Dashboard
│   ├── PlantsController.cs     # Plant list + detail
│   ├── AlertsController.cs     # Alerts + acknowledge
│   └── ReportsController.cs    # Energy reports
├── Data/
│   ├── AppDbContext.cs          # EF Core DbContext
│   └── DbSeeder.cs             # First-run data seeder
├── Migrations/                  # EF Core migrations
├── Models/
│   ├── SolarPlant.cs
│   ├── SolarPanel.cs
│   ├── EnergyReading.cs
│   ├── Alert.cs
│   └── ViewModels/ViewModels.cs
├── Scripts/
│   └── init-db.sql             # Reference SQL / manual verification
├── Views/
│   ├── Home/Index.cshtml        # Dashboard
│   ├── Plants/
│   │   ├── Index.cshtml         # Plant list
│   │   └── Detail.cshtml        # Plant detail
│   ├── Alerts/Index.cshtml      # Alerts management
│   ├── Reports/Index.cshtml     # Energy reports
│   └── Shared/_Layout.cshtml    # Master layout
├── wwwroot/                     # Static assets (CSS, JS, Bootstrap)
├── appsettings.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Backend Framework | ASP.NET Core MVC (.NET 10) |
| ORM | Entity Framework Core 9 |
| Database | PostgreSQL 16 |
| Frontend | Bootstrap 5.3, Bootstrap Icons, Chart.js 4 |
| Containerization | Docker + Docker Compose |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ConnectionStrings__DefaultConnection` | (see appsettings.json) | PostgreSQL connection string |
| `ASPNETCORE_ENVIRONMENT` | `Production` | ASP.NET environment |
| `ASPNETCORE_URLS` | `http://+:8080` | Listening URL in Docker |

---

## Useful Commands

```bash
# View running containers
docker compose ps

# View application logs
docker compose logs app -f

# View database logs
docker compose logs db -f

# Access PostgreSQL in Docker
docker exec -it solarmonitor_db psql -U solaruser -d solarmonitor

# Rebuild only the app (after code changes)
docker compose up --build app
```

---

## Notes for Testers

This application is designed for **automation testing practice using Playwright**. It includes:

- **Authentication & Role Authorization**:
  - Sign in and sign out workflows (`/Account/Login`, `/Account/Logout`)
  - Redirect on unauthorized access to protected routes (`/Account/Login?ReturnUrl=...`)
  - Role-based UI visibility & state (Action Taker vs. Viewer)
  - Endpoint protection and 403 handling (`/Alerts/Acknowledge` restricted to `ActionTaker`)
- **Interactive UI components**:
  - **5 customer-facing pages** with distinct patterns (KPI cards, data tables, charts, forms, modals)
  - **Filtering and search** functionality on Plants and Alerts pages
  - **Modal form submission** via the Alert Acknowledge modal
  - **Tab navigation** on the Alerts page (Active vs. Resolved)
  - **Dynamic charts** rendered with Chart.js
  - **Bootstrap badges** with status-driven colors

The application intentionally contains subtle functional issues for testers to discover and report as part of the assignment deliverable.
