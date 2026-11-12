using Microsoft.EntityFrameworkCore;
using IoT_Test.Models;

namespace IoT_Test.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<SolarPlant> SolarPlants { get; set; }
    public DbSet<SolarPanel> SolarPanels { get; set; }
    public DbSet<EnergyReading> EnergyReadings { get; set; }
    public DbSet<Alert> Alerts { get; set; }
    public DbSet<User> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.Property(u => u.Username).IsRequired().HasMaxLength(100);
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.Email).IsRequired().HasMaxLength(200);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.FullName).IsRequired().HasMaxLength(200);
            e.Property(u => u.Role).IsRequired().HasMaxLength(50);
            e.Property(u => u.PasswordHash).IsRequired();
        });

        modelBuilder.Entity<SolarPlant>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Name).IsRequired().HasMaxLength(200);
            e.Property(p => p.Location).IsRequired().HasMaxLength(300);
            e.Property(p => p.Region).HasMaxLength(100);
            e.HasMany(p => p.EnergyReadings).WithOne(r => r.SolarPlant).HasForeignKey(r => r.SolarPlantId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(p => p.Alerts).WithOne(a => a.SolarPlant).HasForeignKey(a => a.SolarPlantId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(p => p.Panels).WithOne(p => p.SolarPlant).HasForeignKey(p => p.SolarPlantId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SolarPanel>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.SerialNumber).IsRequired().HasMaxLength(100);
            e.HasIndex(p => p.SerialNumber).IsUnique();
        });

        modelBuilder.Entity<EnergyReading>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => new { r.SolarPlantId, r.Timestamp });
        });

        modelBuilder.Entity<Alert>(e =>
        {
            e.HasKey(a => a.Id);
            e.Property(a => a.Title).IsRequired().HasMaxLength(300);
        });
    }
}
