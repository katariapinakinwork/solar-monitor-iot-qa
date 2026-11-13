export interface PlantCard {
  id: number;
  name: string;
  location: string;
  status: string;
  region: string;
  capacityKw: number;
  todayKwh: number;
  panels: number;
  commissionedYear: number;
  activeAlerts: number;
}