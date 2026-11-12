namespace IoT_Test.Models;

public class SolarPlant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public double CapacityKw { get; set; }
    public int PanelCount { get; set; }
    public DateTime CommissionedDate { get; set; }
    public PlantStatus Status { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    // Navigation
    public ICollection<EnergyReading> EnergyReadings { get; set; } = [];
    public ICollection<Alert> Alerts { get; set; } = [];
    public ICollection<SolarPanel> Panels { get; set; } = [];
}

public enum PlantStatus
{
    Online,
    Offline,
    Maintenance,
    Degraded
}
