using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoT_Test.Data;
using IoT_Test.Models;
using IoT_Test.Models.ViewModels;

namespace IoT_Test.Controllers;

[Authorize]
public class PlantsController : Controller
{
    private readonly AppDbContext _db;

    public PlantsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /Plants
    public async Task<IActionResult> Index(string? search, string? status, string? region)
    {
        var query = _db.SolarPlants
            .Include(p => p.Alerts.Where(a => !a.IsResolved))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || p.Location.Contains(search));

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PlantStatus>(status, out var statusEnum))
            query = query.Where(p => p.Status == statusEnum);

        if (!string.IsNullOrWhiteSpace(region))
            query = query.Where(p => p.Region == region);

        var plants = await query.OrderBy(p => p.Name).ToListAsync();

        // Enrich with today's generation
        var today = DateTime.UtcNow.Date;
        var plantIds = plants.Select(p => p.Id).ToList();
        var todayGen = await _db.EnergyReadings
            .Where(r => plantIds.Contains(r.SolarPlantId) && r.Timestamp >= today)
            .GroupBy(r => r.SolarPlantId)
            .Select(g => new { PlantId = g.Key, Total = g.Sum(r => r.EnergyGeneratedKwh) })
            .ToDictionaryAsync(x => x.PlantId, x => x.Total);

        ViewBag.TodayGen = todayGen;
        ViewBag.Search = search;
        ViewBag.Status = status;
        ViewBag.Region = region;
        ViewBag.Regions = await _db.SolarPlants.Select(p => p.Region).Distinct().ToListAsync();

        return View(plants);
    }

    // GET /Plants/Detail/5
    [AllowAnonymous]
    public async Task<IActionResult> Detail(int id)
    {
        var plant = await _db.SolarPlants
            .Include(p => p.Panels)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (plant == null) return NotFound();

        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var todayReadings = await _db.EnergyReadings
            .Where(r => r.SolarPlantId == id && r.Timestamp >= today && r.Timestamp < today.AddDays(1))
            .OrderBy(r => r.Timestamp)
            .ToListAsync();

        var monthReadings = await _db.EnergyReadings
            .Where(r => r.SolarPlantId == id && r.Timestamp >= monthStart)
            .ToListAsync();

        var activeAlerts = await _db.Alerts
            .Where(a => a.SolarPlantId == id && !a.IsResolved)
            .OrderByDescending(a => a.Severity)
            .ToListAsync();

        var hourlyToday = todayReadings
            .GroupBy(r => r.Timestamp.Hour)
            .OrderBy(g => g.Key)
            .Select(g => new ChartDataPoint
            {
                Label = $"{g.Key:D2}:00",
                Value = Math.Round(g.Sum(r => r.EnergyGeneratedKwh), 1)
            })
            .ToList();

        var dailyMonth = monthReadings
            .GroupBy(r => r.Timestamp.Date)
            .OrderBy(g => g.Key)
            .Select(g => new ChartDataPoint
            {
                Label = g.Key.ToString("MMM dd"),
                Value = Math.Round(g.Sum(r => r.EnergyGeneratedKwh), 1)
            })
            .ToList();

        var vm = new PlantDetailViewModel
        {
            Plant = plant,
            TodayGenerationKwh = Math.Round(todayReadings.Sum(r => r.EnergyGeneratedKwh), 1),
            MonthGenerationKwh = Math.Round(monthReadings.Sum(r => r.EnergyGeneratedKwh), 1),
            CurrentPowerKw = todayReadings.LastOrDefault()?.PowerOutputKw ?? 0,
            PerformanceRatio = todayReadings.Any() ? Math.Round(todayReadings.Average(r => r.PerformanceRatio), 3) : 0,
            ActivePanels = plant.Panels.Count(p => p.Status == PanelStatus.Active),
            FaultyPanels = plant.Panels.Count(p => p.Status is PanelStatus.Faulty or PanelStatus.Underperforming),
            Panels = plant.Panels.ToList(),
            ActiveAlerts = activeAlerts,
            HourlyToday = hourlyToday,
            DailyThisMonth = dailyMonth,
            PeakPowerKw = todayReadings.Any() ? todayReadings.Max(r => r.PowerOutputKw) : 0,
            AverageIrradiance = todayReadings.Any() ? Math.Round(todayReadings.Average(r => r.IrradianceWm2), 1) : 0
        };

        return View(vm);
    }
}
