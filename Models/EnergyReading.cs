namespace IoT_Test.Models;

public class EnergyReading
{
    public int Id { get; set; }
    public int SolarPlantId { get; set; }
    public SolarPlant SolarPlant { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public double PowerOutputKw { get; set; }
    public double EnergyGeneratedKwh { get; set; }
    public double IrradianceWm2 { get; set; }   // W/m²
    public double AmbientTempC { get; set; }
    public double PanelTempC { get; set; }
    public double PerformanceRatio { get; set; } // 0-1
}
