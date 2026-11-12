-- ============================================================
-- SolarMonitor IIoT — Database Initialization Script
-- This script is for reference / manual setup only.
-- The application runs migrations and seeds data automatically
-- on first start via EF Core + DbSeeder.cs
-- ============================================================

-- Create database (run as postgres superuser if needed)
-- CREATE DATABASE solarmonitor;
-- CREATE USER solaruser WITH ENCRYPTED PASSWORD 'solarpass';
-- GRANT ALL PRIVILEGES ON DATABASE solarmonitor TO solaruser;

-- ── Tables are created by EF Core migrations ──────────────────
-- Run: dotnet ef database update
-- Or via Docker: docker compose up  (auto-applies on start)

-- ── Verify seeded data ────────────────────────────────────────
-- After first start, verify with:

-- SELECT name, location, status, capacity_kw FROM "SolarPlants";
-- SELECT COUNT(*) FROM "EnergyReadings";
-- SELECT COUNT(*) FROM "Alerts" WHERE is_resolved = false;
-- SELECT COUNT(*) FROM "SolarPanels";
-- SELECT id, username, email, role, full_name FROM "Users";

-- ── Useful queries for testing ────────────────────────────────

-- Today's total generation (fleet-wide):
-- SELECT SUM(energy_generated_kwh) AS today_kwh
-- FROM "EnergyReadings"
-- WHERE DATE(timestamp) = CURRENT_DATE;

-- Active alerts by severity:
-- SELECT severity, COUNT(*) FROM "Alerts"
-- WHERE is_resolved = false
-- GROUP BY severity ORDER BY severity;

-- Plants with current status:
-- SELECT p.name, p.status, COUNT(a.id) AS active_alerts
-- FROM "SolarPlants" p
-- LEFT JOIN "Alerts" a ON a.solar_plant_id = p.id AND a.is_resolved = false
-- GROUP BY p.id, p.name, p.status
-- ORDER BY p.name;

-- Monthly generation per plant:
-- SELECT p.name,
--        DATE_TRUNC('month', r.timestamp) AS month,
--        SUM(r.energy_generated_kwh) AS monthly_kwh
-- FROM "EnergyReadings" r
-- JOIN "SolarPlants" p ON p.id = r.solar_plant_id
-- GROUP BY p.id, p.name, month
-- ORDER BY month DESC, p.name;
