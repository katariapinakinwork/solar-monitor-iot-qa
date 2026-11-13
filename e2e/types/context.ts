import type { PlantCard } from './plant';

export interface ScenarioContext {
  plants: PlantCard[];
  statusCounts: Record<string, number>;
  values: Record<string, number>;
  current?: PlantCard;
}

export interface PickedAlert {
  id: string;
  title: string;
  plant: string;
}

export interface ScenarioContext {
  plants: PlantCard[];
  statusCounts: Record<string, number>;
  values: Record<string, number>;
  /** The plant whose detail page the scenario opened. */
  current?: PlantCard;
  /** The alert the scenario acknowledged. */
  alert?: PickedAlert;
}