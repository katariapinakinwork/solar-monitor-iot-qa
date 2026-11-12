namespace IoT_Test.Models;

public class SolarPanel
{
    public int Id { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public int SolarPlantId { get; set; }
    public SolarPlant SolarPlant { get; set; } = null!;
    public string Model { get; set; } = string.Empty;
    public double RatedPowerW { get; set; }
    public PanelStatus Status { get; set; }
    public double Efficiency { get; set; }  // percentage 0-100
    public DateTime InstalledDate { get; set; }
    public string StringGroup { get; set; } = string.Empty; // inverter string group
}

public enum PanelStatus
{
    Active,
    Faulty,
    Offline,
    Underperforming
}
