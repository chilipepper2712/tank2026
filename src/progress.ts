import { resetPerm } from './upgrades';
import { resetCampaign } from './world/levels';

/**
 * Start the campaign completely fresh: the kept upgrades of both vehicles, the levels opened and the
 * air-support charge go; the career record, the training and the settings stay.
 */
export function freshStart() {
  resetPerm(); resetCampaign();
  try { localStorage.removeItem('tank2026.support'); } catch { /* storage blocked */ }
}
