import type { LancerActor } from "../actor/lancer-actor";
import { LANCER } from "../config";

const lp = LANCER.log_prefix;

/**
 * The condition each structure/overheat outcome inflicts, keyed by the same i18n description key the
 * chat card shows the player. Keeping the two in one place is the point: the card and the applied
 * status can only disagree if this table is edited without reading the text next to it.
 *
 * Outcomes that destroy the mech, or that only schedule a meltdown, inflict nothing and are absent.
 * So are the two that hang on a follow-up check -- overheat "meltdown.2" (ENGINEERING) and structure
 * "direct.2" (HULL) -- because the condition depends on that roll's result, which is made later from
 * a button on the card. Those need the check flow to report back before anything can be applied.
 */
const CONDITION_BY_OUTCOME: Record<string, string> = {
  // Overheat
  "lancer.tables.overheat.description.meltdown.3plus": "exposed",
  "lancer.tables.overheat.description.destabilized": "exposed",
  "lancer.tables.overheat.description.shunt": "impaired",
  // Structure
  "lancer.tables.structure.description.direct.3plus": "stunned",
  "lancer.tables.structure.description.glancing": "impaired",
  // Structure, unique physiology (Monstrosity)
  "lancer.tables.structureMonstrosity.description.direct.3plus": "stunned",
  "lancer.tables.structureMonstrosity.description.dismember": "slow",
  "lancer.tables.structureMonstrosity.description.powerful": "prone",
  "lancer.tables.structureMonstrosity.description.glancing": "impaired",
};

/** The status an outcome inflicts, or null. Takes the description key, before it is localized. */
export function conditionForOutcome(descriptionKey: string): string | null {
  return CONDITION_BY_OUTCOME[descriptionKey] ?? null;
}

/**
 * Apply the condition an outcome inflicted. Shared by the structure and overheat flows.
 *
 * Deliberately not gated on the `structure` automation setting: that one only governs whether the
 * system *prompts* for the roll ("Automatically prompt for a structure or stress roll when a mech
 * reaches 0 hp or exceeds its heat cap"). Someone who turns the prompt off and rolls from the sheet
 * still rolled the outcome, and the flow already spends their stress and heat either way -- skipping
 * the condition there would just lose it silently.
 */
export async function applyTableCondition(actor: LancerActor, condition: string | null | undefined): Promise<void> {
  if (!condition) return;
  // Already present: toggling would remove it, and re-applying a duration is not ours to decide.
  if (actor.statuses.has(condition)) return;
  console.log(`${lp} Applying ${condition} from a structure/overheat outcome to ${actor.name}`);
  await actor.toggleStatusEffect(condition, { active: true });
}
