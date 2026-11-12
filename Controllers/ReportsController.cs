using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoT_Test.Data;
using IoT_Test.Models.ViewModels;

namespace IoT_Test.Controllers;

[Authorize]
public class ReportsController : Controller
{
    private readonly AppDbContext _db;

    public ReportsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /Reports
    public async Task<IActionResult> Index(int? plantId, string? startDate, string? endDate, string? reportType)
    {
        var today = DateTime.UtcNow.Date;
        var start = string.IsNullOrWhiteSpace(startDate)
            ? today.AddDays(-30)
            : DateTime.TryParse(startDate, out var sd) ? DateTime.SpecifyKind(sd, DateTimeKind.Utc) : today.AddDays(-30);
        var end = string.IsNullOrWhiteSpace(endDate)
            ? today
            : DateTime.TryParse(endDate, out var ed) ? DateTime.SpecifyKind(ed, DateTimeKind.Utc) : today;
        var type = reportType ?? "daily";

        var plants = await _db.SolarPlants.OrderBy(p => p.Name).ToListAsync();

        var query = _db.EnergyReadings
            .Where(r => r.Timestamp.Date >= start && r.Timestamp.Date <= end);

        if (plantId.HasValue)
            query = query.Where(r => r.SolarPlantId == plantId.Value);

        var rawData = await query.ToListAsync();

        List<ReportRow> reportData;

        if (type == "hourly")
        {
            reportData = rawData
                .GroupBy(r => new { r.Timestamp.Date, r.Timestamp.Hour })
                .OrderBy(g => g.Key.Date).ThenBy(g => g.Key.Hour)
                .Select(g => new ReportRow
                {
                    Period = $"{g.Key.Date:yyyy-MM-dd} {g.Key.Hour:D2}:00",
                    EnergyKwh = Math.Round(g.Sum(r => r.EnergyGeneratedKwh), 2),
                    PeakPowerKw = Math.Round(g.Max(r => r.PowerOutputKw), 2),
                    AvgPerformanceRatio = Math.Round(g.Average(r => r.PerformanceRatio), 3),
                    AvgIrradiance = Math.Round(g.Average(r => r.IrradianceWm2), 1)
                })
                .ToList();
        }
        else if (type == "monthly")
        {
            reportData = rawData
                .GroupBy(r => new { r.Timestamp.Year, r.Timestamp.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
                .Select(g => new ReportRow
                {
                    Period = $"{g.Key.Year}-{g.Key.Month:D2}",
                    EnergyKwh = Math.Round(g.Sum(r => r.EnergyGeneratedKwh), 2),
                    PeakPowerKw = Math.Round(g.Max(r => r.PowerOutputKw), 2),
                    AvgPerformanceRatio = Math.Round(g.Average(r => r.PerformanceRatio), 3),
                    AvgIrradiance = Math.Round(g.Average(r => r.IrradianceWm2), 1)
                })
                .ToList();
        }
        else // daily (default)
        {
            reportData = rawData
                .GroupBy(r => r.Timestamp.Date)
                .OrderBy(g => g.Key)
                .Select(g => new ReportRow
                {
                    Period = g.Key.ToString("yyyy-MM-dd"),
                    EnergyKwh = Math.Round(g.Sum(r => r.EnergyGeneratedKwh), 2),
                    PeakPowerKw = Math.Round(g.Max(r => r.PowerOutputKw), 2),
                    AvgPerformanceRatio = Math.Round(g.Average(r => r.PerformanceRatio), 3),
                    AvgIrradiance = Math.Round(g.Average(r => r.IrradianceWm2), 1)
                })
                .ToList();
        }

        var vm = new ReportsViewModel
        {
            Plants = plants,
            SelectedPlantId = plantId,
            StartDate = start,
            EndDate = end,
            ReportType = type,
            ReportData = reportData,
            TotalGeneration = Math.Round(reportData.Sum(r => r.EnergyKwh), 2),
            AveragePerformanceRatio = reportData.Any() ? Math.Round(reportData.Average(r => r.AvgPerformanceRatio), 3) : 0,
            PeakPower = reportData.Any() ? reportData.Max(r => r.PeakPowerKw) : 0,
            CO2Avoided = Math.Round(reportData.Sum(r => r.EnergyKwh) * 0.000716, 2)
        };

        return View(vm);
    }
}
