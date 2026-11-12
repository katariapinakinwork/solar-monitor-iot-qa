// View Models for passing data to Views
namespace IoT_Test.Models.ViewModels;

public class DashboardViewModel
{
    public int TotalPlants { get; set; }
    public int OnlinePlants { get; set; }
    public int OfflinePlants { get; set; }
    public int MaintenancePlants { get; set; }
    public double TotalCapacityKw { get; set; }
    public double TodayGenerationKwh { get; set; }
    public double MonthGenerationKwh { get; set; }
    public double TotalGenerationKwh { get; set; }
    public int ActiveAlerts { get; set; }
    public int CriticalAlerts { get; set; }
    public List<SolarPlant> Plants { get; set; } = [];
    public List<Alert> RecentAlerts { get; set; } = [];
    public List<ChartDataPoint> HourlyProductionToday { get; set; } = [];
    public double FleetPerformanceRatio { get; set; }
    public double CO2AvoidedTons { get; set; }
}

public class ChartDataPoint
{
    public string Label { get; set; } = string.Empty;
    public double Value { get; set; }
}

public class PlantDetailViewModel
{
    public SolarPlant Plant { get; set; } = null!;
    public double TodayGenerationKwh { get; set; }
    public double MonthGenerationKwh { get; set; }
    public double CurrentPowerKw { get; set; }
    public double PerformanceRatio { get; set; }
    public int ActivePanels { get; set; }
    public int FaultyPanels { get; set; }
    public List<SolarPanel> Panels { get; set; } = [];
    public List<Alert> ActiveAlerts { get; set; } = [];
    public List<ChartDataPoint> HourlyToday { get; set; } = [];
    public List<ChartDataPoint> DailyThisMonth { get; set; } = [];
    public double PeakPowerKw { get; set; }
    public double AverageIrradiance { get; set; }
}

public class AlertsViewModel
{
    public List<Alert> ActiveAlerts { get; set; } = [];
    public List<Alert> ResolvedAlerts { get; set; } = [];
    public int TotalActive { get; set; }
    public int TotalCritical { get; set; }
    public int TotalWarning { get; set; }
    public int TotalInfo { get; set; }
    public string? FilterSeverity { get; set; }
    public string? FilterPlant { get; set; }
    public List<SolarPlant> Plants { get; set; } = [];
}

public class ReportsViewModel
{
    public List<SolarPlant> Plants { get; set; } = [];
    public int? SelectedPlantId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string ReportType { get; set; } = "daily";
    public List<ReportRow> ReportData { get; set; } = [];
    public double TotalGeneration { get; set; }
    public double AveragePerformanceRatio { get; set; }
    public double PeakPower { get; set; }
    public double CO2Avoided { get; set; }
}

public class ReportRow
{
    public string Period { get; set; } = string.Empty;
    public double EnergyKwh { get; set; }
    public double PeakPowerKw { get; set; }
    public double AvgPerformanceRatio { get; set; }
    public double AvgIrradiance { get; set; }
}

public class LoginViewModel
{
    public string UsernameOrEmail { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool RememberMe { get; set; }
    public string? ReturnUrl { get; set; }
}

