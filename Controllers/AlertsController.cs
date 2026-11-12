using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IoT_Test.Data;
using IoT_Test.Models;
using IoT_Test.Models.ViewModels;

namespace IoT_Test.Controllers;

[Authorize]
public class AlertsController : Controller
{
    private readonly AppDbContext _db;

    public AlertsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /Alerts
    public async Task<IActionResult> Index(string? severity, int? plantId, string? tab)
    {
        var activeQuery = _db.Alerts
            .Include(a => a.SolarPlant)
            .Where(a => !a.IsResolved)
            .AsQueryable();

        var resolvedQuery = _db.Alerts
            .Include(a => a.SolarPlant)
            .Where(a => a.IsResolved)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(severity) && Enum.TryParse<AlertSeverity>(severity, out var sev))
        {
            activeQuery = activeQuery.Where(a => a.Severity == sev);
            resolvedQuery = resolvedQuery.Where(a => a.Severity == sev);
        }

        if (plantId.HasValue)
        {
            activeQuery = activeQuery.Where(a => a.SolarPlantId == plantId.Value);
            resolvedQuery = resolvedQuery.Where(a => a.SolarPlantId == plantId.Value);
        }

        var allActive = await _db.Alerts.Where(a => !a.IsResolved).ToListAsync();

        var vm = new AlertsViewModel
        {
            ActiveAlerts = await activeQuery.OrderByDescending(a => a.Severity).ThenByDescending(a => a.TriggeredAt).ToListAsync(),
            ResolvedAlerts = await resolvedQuery.OrderByDescending(a => a.ResolvedAt).Take(20).ToListAsync(),
            TotalActive = allActive.Count,
            TotalCritical = allActive.Count(a => a.Severity == AlertSeverity.Critical),
            TotalWarning = allActive.Count(a => a.Severity == AlertSeverity.Warning),
            TotalInfo = allActive.Count(a => a.Severity == AlertSeverity.Info),
            FilterSeverity = severity,
            FilterPlant = plantId?.ToString(),
            Plants = await _db.SolarPlants.OrderBy(p => p.Name).ToListAsync()
        };

        ViewBag.ActiveTab = tab ?? "active";
        return View(vm);
    }

    // POST /Alerts/Acknowledge/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize] // BUG: Missing role restriction — allows Viewer to acknowledge
    public async Task<IActionResult> Acknowledge(int id, string acknowledgedBy)
    {
        var alert = await _db.Alerts.FindAsync(id);
        if (alert == null) return NotFound();

        // BUG: Missing null/empty check on acknowledgedBy — sets it even if blank
        alert.AcknowledgedBy = acknowledgedBy;
        alert.IsResolved = true;
        alert.ResolvedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        TempData["Success"] = $"Alert #{id} has been acknowledged and resolved.";
        return RedirectToAction(nameof(Index));
    }
}
