import { ckdScenario } from './ckdScenario';
import { masldScenario } from './masldScenario';
import { ScenarioData, ScenarioId } from '../types';

export const SCENARIOS: Record<ScenarioId, ScenarioData> = {
  ckd: ckdScenario,
  masld: masldScenario
};

export const DEFAULT_SCENARIO_ID: ScenarioId = 'ckd';

export function getScenario(id: ScenarioId): ScenarioData {
  return SCENARIOS[id] || SCENARIOS[DEFAULT_SCENARIO_ID];
}
