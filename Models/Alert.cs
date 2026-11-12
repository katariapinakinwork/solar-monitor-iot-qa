namespace IoT_Test.Models;

public class Alert
{
    public int Id { get; set; }
    public int SolarPlantId { get; set; }
    public SolarPlant SolarPlant { get; set; } = null!;
    public AlertSeverity Severity { get; set; }
    public AlertType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime TriggeredAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public bool IsResolved { get; set; }
    public string? AcknowledgedBy { get; set; }
}

public enum AlertSeverity
{
    Info,
    Warning,
    Critical
}

public enum AlertType
{
    Performance,
    Equipment,
    Weather,
    Communication,
    Safety
}
