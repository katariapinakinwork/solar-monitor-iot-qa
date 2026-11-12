using System.Diagnostics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoT_Test.Data;
using IoT_Test.Models;
using IoT_Test.Models.ViewModels;

namespace IoT_Test.Controllers;

[Authorize]
public class HomeController : Controller
{
    private readonly AppDbContext _db;

    public HomeController(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IActionResult> Index()
    {
        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var plants = await _db.SolarPlants
            .Include(p => p.Alerts.Where(a => !a.IsResolved))
            .ToListAsync();

        var todayReadings = await _db.EnergyReadings
            .Where(r => r.Timestamp >= today && r.Timestamp < today.AddDays(1))
            .ToListAsync();

        var monthReadings = await _db.EnergyReadings
            .Where(r => r.Timestamp >= monthStart)
            .ToListAsync();

        var allReadings = await _db.EnergyReadings.ToListAsync();

        var recentAlerts = await _db.Alerts
            .Include(a => a.SolarPlant)
            .OrderByDescending(a => a.TriggeredAt)
            .Take(5)
            .ToListAsync();

        // Hourly chart for today (fleet-wide)
        var hourlyProduction = todayReadings
            .GroupBy(r => r.Timestamp.Hour)
            .OrderBy(g => g.Key)
            .Select(g => new ChartDataPoint
            {
                Label = $"{g.Key:D2}:00",
                Value = Math.Round(g.Sum(r => r.EnergyGeneratedKwh), 1)
            })
            .ToList();

        var vm = new DashboardViewModel
        {
            TotalPlants = plants.Count,
            OnlinePlants = plants.Count(p => p.Status == PlantStatus.Online),
            OfflinePlants = plants.Count(p => p.Status == PlantStatus.Offline),
            MaintenancePlants = plants.Count(p => p.Status is PlantStatus.Maintenance or PlantStatus.Degraded),
            TotalCapacityKw = plants.Sum(p => p.CapacityKw),
            TodayGenerationKwh = Math.Round(todayReadings.Sum(r => r.EnergyGeneratedKwh), 1),
            MonthGenerationKwh = Math.Round(monthReadings.Sum(r => r.EnergyGeneratedKwh), 1),
            TotalGenerationKwh = Math.Round(allReadings.Sum(r => r.EnergyGeneratedKwh), 1),
            ActiveAlerts = plants.Sum(p => p.Alerts.Count),
            CriticalAlerts = plants.Sum(p => p.Alerts.Count(a => a.Severity == AlertSeverity.Critical)),
            Plants = plants,
            RecentAlerts = recentAlerts,
            HourlyProductionToday = hourlyProduction,
            FleetPerformanceRatio = todayReadings.Any() ? Math.Round(todayReadings.Average(r => r.PerformanceRatio), 3) : 0,
            CO2AvoidedTons = Math.Round(allReadings.Sum(r => r.EnergyGeneratedKwh) * 0.000716, 1) // 716g CO2/kWh Indian grid factor
        };

        return View(vm);
    }

    [AllowAnonymous]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
