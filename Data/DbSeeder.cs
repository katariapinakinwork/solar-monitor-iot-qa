using IoT_Test.Data;
using IoT_Test.Models;
using IoT_Test.Services;
using Microsoft.EntityFrameworkCore;

namespace IoT_Test.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // ── Seed Users ────────────────────────────────────────────────────────
        if (!await db.Users.AnyAsync())
        {
            var users = new List<User>
            {
                new()
                {
                    Username = "viewer",
                    Email = "viewer@solarmonitor.io",
                    FullName = "Alex Vance (Auditor)",
                    Role = UserRoles.Viewer,
                    PasswordHash = PasswordHelper.HashPassword("Viewer@123"),
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Username = "actiontaker",
                    Email = "actiontaker@solarmonitor.io",
                    FullName = "Priya Sharma (Lead Operator)",
                    Role = UserRoles.ActionTaker,
                    PasswordHash = PasswordHelper.HashPassword("Action@123"),
                    CreatedAt = DateTime.UtcNow
                }
            };
            db.Users.AddRange(users);
            await db.SaveChangesAsync();
        }

        // Idempotent — skip if plants already exist
        if (await db.SolarPlants.AnyAsync()) return;

        var rng = new Random(42);

        // ── Plants ────────────────────────────────────────────────────────────
        var plants = new List<SolarPlant>
        {
            new() { Name = "Rajasthan Solar Farm Alpha",  Location = "Jodhpur, Rajasthan", Region = "North India",
                    CapacityKw = 5000, PanelCount = 12500, CommissionedDate = new DateTime(2021, 3, 15, 0, 0, 0, DateTimeKind.Utc),
                    Status = PlantStatus.Online,  Latitude = 26.2389, Longitude = 73.0243 },
            new() { Name = "Gujarat Sun Park",            Location = "Gandhinagar, Gujarat", Region = "West India",
                    CapacityKw = 3200, PanelCount = 8000,  CommissionedDate = new DateTime(2020, 7, 1, 0, 0, 0, DateTimeKind.Utc),
                    Status = PlantStatus.Online,  Latitude = 23.2156, Longitude = 72.6369 },
            new() { Name = "Andhra Pradesh Solar Hub",    Location = "Kurnool, Andhra Pradesh", Region = "South India",
                    CapacityKw = 7500, PanelCount = 18750, CommissionedDate = new DateTime(2022, 1, 20, 0, 0, 0, DateTimeKind.Utc),
                    Status = PlantStatus.Degraded, Latitude = 15.8281, Longitude = 78.0373 },
            new() { Name = "Tamil Nadu Coastal Array",    Location = "Tuticorin, Tamil Nadu", Region = "South India",
                    CapacityKw = 2800, PanelCount = 7000,  CommissionedDate = new DateTime(2019, 11, 10, 0, 0, 0, DateTimeKind.Utc),
                    Status = PlantStatus.Online,  Latitude = 8.7642, Longitude = 78.1348 },
            new() { Name = "Maharashtra Sunrise Station", Location = "Pune, Maharashtra", Region = "West India",
                    CapacityKw = 1500, PanelCount = 3750,  CommissionedDate = new DateTime(2023, 5, 8, 0, 0, 0, DateTimeKind.Utc),
                    Status = PlantStatus.Maintenance, Latitude = 18.5204, Longitude = 73.8567 },
        };

        db.SolarPlants.AddRange(plants);
        await db.SaveChangesAsync();

        // ── Panels ────────────────────────────────────────────────────────────
        var panelModels = new[] { "SunPower X22", "LG NeON 2", "Canadian Solar HiKu7", "Jinko Tiger Neo", "Trina Vertex S+" };
        var allPanels = new List<SolarPanel>();
        int panelSerial = 1000;

        foreach (var plant in plants)
        {
            int count = Math.Min(plant.PanelCount, 20); // seed 20 representative panels per plant
            for (int i = 0; i < count; i++)
            {
                var status = i < count - 2 ? PanelStatus.Active :
                             i == count - 2 ? PanelStatus.Underperforming :
                             PanelStatus.Faulty;
                allPanels.Add(new SolarPanel
                {
                    SolarPlantId = plant.Id,
                    SerialNumber = $"SP-{plant.Id:D2}-{panelSerial++:D6}",
                    Model = panelModels[rng.Next(panelModels.Length)],
                    RatedPowerW = 400,
                    Status = status,
                    Efficiency = status == PanelStatus.Active ? 19.5 + rng.NextDouble() * 2 :
                                 status == PanelStatus.Underperforming ? 12 + rng.NextDouble() * 4 : 0,
                    InstalledDate = plant.CommissionedDate.AddDays(rng.Next(-30, 30)),
                    StringGroup = $"INV-{(i / 10) + 1:D2}-STR-{(i % 2) + 1}"
                });
            }
        }
        db.SolarPanels.AddRange(allPanels);
        await db.SaveChangesAsync();

        // ── Energy Readings (last 30 days, hourly 6am-6pm) ────────────────────
        var now = DateTime.UtcNow.Date;
        var readings = new List<EnergyReading>();

        foreach (var plant in plants)
        {
            if (plant.Status == PlantStatus.Maintenance) continue;

            for (int d = 29; d >= 0; d--)
            {
                var date = now.AddDays(-d);
                for (int h = 6; h <= 18; h++)
                {
                    // solar bell curve peaking at noon
                    double solarFactor = Math.Sin(Math.PI * (h - 6) / 12.0);
                    double irradiance = solarFactor * (650 + rng.NextDouble() * 350);
                    double efficiency = plant.Status == PlantStatus.Degraded ? 0.72 : 0.85 + rng.NextDouble() * 0.08;
                    double power = plant.CapacityKw * solarFactor * efficiency * (1 - rng.NextDouble() * 0.05);
                    if (plant.Status == PlantStatus.Offline) power = 0;

                    readings.Add(new EnergyReading
                    {
                        SolarPlantId = plant.Id,
                        Timestamp = date.AddHours(h),
                        PowerOutputKw = Math.Round(power, 2),
                        EnergyGeneratedKwh = Math.Round(power * 1.0, 2), // 1-hour interval
                        IrradianceWm2 = Math.Round(irradiance, 1),
                        AmbientTempC = Math.Round(28 + rng.NextDouble() * 10, 1),
                        PanelTempC = Math.Round(38 + rng.NextDouble() * 15, 1),
                        PerformanceRatio = Math.Round(efficiency, 3)
                    });
                }
            }
        }

        db.EnergyReadings.AddRange(readings);
        await db.SaveChangesAsync();

        // ── Alerts ────────────────────────────────────────────────────────────
        var alerts = new List<Alert>
        {
            // Active alerts
            new() { SolarPlantId = plants[2].Id, Severity = AlertSeverity.Critical, Type = AlertType.Performance,
                    Title = "String Inverter INV-03 Failure", Description = "Inverter INV-03 on String B is reporting zero output. Estimated capacity loss: 480 kW.",
                    TriggeredAt = DateTime.UtcNow.AddHours(-6), IsResolved = false },
            new() { SolarPlantId = plants[2].Id, Severity = AlertSeverity.Warning, Type = AlertType.Equipment,
                    Title = "High Panel Temperature Alert", Description = "Panel temperatures exceeding 65°C on String A. Performance degradation expected.",
                    TriggeredAt = DateTime.UtcNow.AddHours(-2), IsResolved = false },
            new() { SolarPlantId = plants[4].Id, Severity = AlertSeverity.Info, Type = AlertType.Equipment,
                    Title = "Scheduled Maintenance Started", Description = "Annual preventive maintenance has begun. Plant will be offline for approximately 48 hours.",
                    TriggeredAt = DateTime.UtcNow.AddDays(-1), IsResolved = false },
            new() { SolarPlantId = plants[0].Id, Severity = AlertSeverity.Warning, Type = AlertType.Performance,
                    Title = "Performance Ratio Below Threshold", Description = "24-hour average performance ratio dropped to 0.74 (threshold: 0.78). Possible soiling event.",
                    TriggeredAt = DateTime.UtcNow.AddHours(-14), IsResolved = false },
            new() { SolarPlantId = plants[1].Id, Severity = AlertSeverity.Info, Type = AlertType.Weather,
                    Title = "Dust Storm Warning", Description = "IMD has issued a dust storm advisory for Gandhinagar region. Monitor irradiance and clean panels after event.",
                    TriggeredAt = DateTime.UtcNow.AddHours(-1), IsResolved = false },
            new() { SolarPlantId = plants[3].Id, Severity = AlertSeverity.Warning, Type = AlertType.Communication,
                    Title = "Sensor Data Gap Detected", Description = "No telemetry received from monitoring unit MU-04 for 45 minutes. Last known status: healthy.",
                    TriggeredAt = DateTime.UtcNow.AddMinutes(-48), IsResolved = false },

            // Resolved alerts
            new() { SolarPlantId = plants[0].Id, Severity = AlertSeverity.Critical, Type = AlertType.Safety,
                    Title = "Grid Fault: Overvoltage Detected", Description = "Grid voltage exceeded safe limits. Plant automatically disconnected per protection relay.",
                    TriggeredAt = DateTime.UtcNow.AddDays(-3), ResolvedAt = DateTime.UtcNow.AddDays(-3).AddHours(2),
                    IsResolved = true, AcknowledgedBy = "Engineer Priya Sharma" },
            new() { SolarPlantId = plants[1].Id, Severity = AlertSeverity.Warning, Type = AlertType.Performance,
                    Title = "Low Irradiance Period", Description = "Extended cloud cover reduced generation by 35% over 6-hour window.",
                    TriggeredAt = DateTime.UtcNow.AddDays(-5), ResolvedAt = DateTime.UtcNow.AddDays(-5).AddHours(7),
                    IsResolved = true, AcknowledgedBy = "SCADA System" },
            new() { SolarPlantId = plants[3].Id, Severity = AlertSeverity.Warning, Type = AlertType.Equipment,
                    Title = "Tracking System Offset Error", Description = "Single-axis tracker on row 12 reported a 5° misalignment. Corrected remotely.",
                    TriggeredAt = DateTime.UtcNow.AddDays(-7), ResolvedAt = DateTime.UtcNow.AddDays(-7).AddHours(1),
                    IsResolved = true, AcknowledgedBy = "Engineer Rahul Nair" },
            new() { SolarPlantId = plants[2].Id, Severity = AlertSeverity.Info, Type = AlertType.Communication,
                    Title = "SCADA Connection Timeout", Description = "Brief connectivity interruption to SCADA server. Data logging resumed automatically.",
                    TriggeredAt = DateTime.UtcNow.AddDays(-2), ResolvedAt = DateTime.UtcNow.AddDays(-2).AddMinutes(15),
                    IsResolved = true, AcknowledgedBy = "SCADA System" },
        };

        db.Alerts.AddRange(alerts);
        await db.SaveChangesAsync();
    }
}
