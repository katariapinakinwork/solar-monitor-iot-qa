import type { PlantCard } from './plant';

export interface ScenarioContext {
  plants: PlantCard[];
  statusCounts: Record<string, number>;
  values: Record<string, number>;
}