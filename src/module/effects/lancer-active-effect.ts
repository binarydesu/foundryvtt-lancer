import { LancerActor } from "../actor/lancer-actor";
import { LANCER } from "../config";
import { DeployableType, EntryType } from "../enums";
import { LancerItem, type LancerSTATUS } from "../item/lancer-item";
import {
  baselineStatuses,
  cancerConditionsStatus,
  cancerNPCTemplates,
  defaultStatuses,
  hayleyConditionsStatus,
  hayleyNPC,
  hayleyPC,
  hayleyUtility,
  tommyConditionsStatus,
} from "../status-icons";
import { get_pack_id } from "../util/doc";

const lp = LANCER.log_prefix;

// Chassis = mech or standard npc
export type LancerEffectTarget =
  | EntryType.PILOT
  | EntryType.MECH
  | EntryType.NPC
  | EntryType.DEPLOYABLE
  | "only_drone"
  | "only_deployable"
  | "mech_and_npc";

interface StatusEffect {
  id: string;
  name: string;
  img: string;
}

export class LancerActiveEffect<
  SubType extends ActiveEffect.SubType = ActiveEffect.SubType,
> extends ActiveEffect<SubType> {
  /**
   * Determine whether this Active Effect is suppressed or not.
   */
  get isSuppressed(): boolean {
    // Check it's not just passing through
    return !this.affectsUs();
  }

  /**
   * Determine whether this Active Effect is present only to be passed to descendants
   */
  affectsUs(): boolean {
    // Check right actor type
    let tf = this.flags[game.system.id];
    if (!tf?.target_type) {
      return true; // Safe bet - no target type, assume it affects us
    }

    // Otherwise got to get the parent
    let parent: LancerActor | null = null;
    if (this.parent instanceof LancerActor) {
      parent = this.parent;
    } else if (this.parent instanceof LancerItem) {
      parent = this.parent.parent;
    }

    // No parent? Just exit early, something's weird but not really our problem
    if (!(parent instanceof LancerActor)) {
      return false; // Doesn't matter
    }

    switch (tf.target_type) {
      case EntryType.PILOT:
        return parent.is_pilot();
      case EntryType.MECH:
        return parent.is_mech();
      case EntryType.DEPLOYABLE:
        return parent.is_deployable();
      case EntryType.NPC:
        return parent.is_npc();
      case "mech_and_npc":
        return parent.is_mech() || parent.is_npc();
      case "only_deployable":
        return parent.is_deployable() && parent.system.type == DeployableType.Deployable;
      case "only_drone":
        return parent.is_deployable() && parent.system.type == DeployableType.Drone;
      default:
        return false;
    }
  }

  /* --------------------------------------------- */

  /**
   * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
   */
  static prepareActiveEffectCategories(
    actor: LancerActor
  ): Array<{ type: string; label: string; effects: [number, LancerActiveEffect][] }> {
    // Define effect header categories
    let passives = {
      type: "passive",
      label: game.i18n.localize("lancer.effect.categories.passive"),
      effects: [] as [number, LancerActiveEffect][],
    };
    let inherited = {
      type: "inherited",
      label: game.i18n.localize("lancer.effect.categories.inherited"),
      effects: [] as [number, LancerActiveEffect][],
    };
    let disabled = {
      type: "disabled",
      label: game.i18n.localize("lancer.effect.categories.disabled"),
      effects: [] as [number, LancerActiveEffect][],
    };
    let passthrough = {
      type: "passthrough",
      label: game.i18n.localize("lancer.effect.categories.passthrough"),
      effects: [] as [number, LancerActiveEffect][],
    };

    // Iterate over active effects, classifying them into categories
    let index = 0;
    for (let e of actor.allApplicableEffects()) {
      // e._getSourceName(); // Trigger a lookup for the source name
      if (!e.affectsUs()) passthrough.effects.push([index, e]);
      else if (e.disabled) disabled.effects.push([index, e]);
      else if (e.flags[game.system.id]?.deep_origin) inherited.effects.push([index, e]);
      else passives.effects.push([index, e]);
      index++;
    }

    // categories.suppressed.hidden = !categories.suppressed.effects.length;
    return [passives, inherited, disabled, passthrough];
  }

  // Fully update the status icons in CONFIG.statusEffects.
  // This is not used on page load, since the two methods need to be run in different hooks.
  // Any time after that, though, both should be run together and in this order.
  static async updateIcons() {
    await this.initConfig();
    await this.populateFromCompendiumItems();
    await this.populateFromWorldItems();
    Hooks.callAll("lancer.statusesReady");
  }

  // Populate config with our static/compendium statuses instead of the builtin ones
  static async initConfig() {
    const statusIconConfig = game.settings.get(game.system.id, LANCER.setting_status_icons);
    // If no sets are selected, enable the default set
    if (game.ready && !Object.keys(statusIconConfig).some(k => (<any>statusIconConfig)[k])) {
      statusIconConfig.defaultConditionsStatus = true;
      await game.settings.set(game.system.id, LANCER.setting_status_icons, statusIconConfig);
    }

    /**
     * Helper function to populate the status config with the selected status icon set. For each icon in swapWith:
     * - If the status is already in statuses, leave it as-is
     * - If the status is not in statuses yet, add it
     * @param statuses The set of statuses being worked on, to be put back into CONFIG.statusEffects afterward
     * @param newStatuses The set of icons to swap in
     * @returns The statuses set with the icons swapped, and any missing statuses added.
     */
    function _backfillIcons(
      statuses: StatusEffect[],
      newStatuses: { id: string; name: string; img: string }[]
    ): StatusEffect[] {
      for (let icon of newStatuses) {
        let status = statuses.find(s => s.id === icon.id);
        if (!status) {
          statuses.push({
            id: icon.id,
            name: icon.name,
            img: icon.img,
          });
        }
      }
      return statuses;
    }

    let configStatuses: StatusEffect[] = [];
    // Pull the default statuses from the compendium if it exists
    if (statusIconConfig.defaultConditionsStatus) {
      configStatuses = _backfillIcons(configStatuses, defaultStatuses);
    }
    if (statusIconConfig.cancerConditionsStatus) {
      configStatuses = _backfillIcons(configStatuses, cancerConditionsStatus);
    }
    if (statusIconConfig.hayleyConditionsStatus) {
      configStatuses = _backfillIcons(configStatuses, hayleyConditionsStatus);
    }
    if (statusIconConfig.tommyConditionsStatus) {
      configStatuses = _backfillIcons(configStatuses, tommyConditionsStatus);
    }
    // Always add baseline statuses to the end of the conditions/statuses group
    configStatuses = _backfillIcons(configStatuses, baselineStatuses);

    // Icons for other things which aren't mechanical condition/status
    if (statusIconConfig.cancerNPCTemplates) {
      configStatuses = _backfillIcons(configStatuses, cancerNPCTemplates);
    }
    if (statusIconConfig.hayleyPC) {
      configStatuses = _backfillIcons(configStatuses, hayleyPC);
    }
    if (statusIconConfig.hayleyNPC) {
      configStatuses = _backfillIcons(configStatuses, hayleyNPC);
    }
    if (statusIconConfig.hayleyUtility) {
      configStatuses = _backfillIcons(configStatuses, hayleyUtility);
    }
    console.log(`${lp} ${configStatuses.length} status icons configured from settings`);
    CONFIG.statusEffects = configStatuses;
    // Use downandout to mark units as defeated
    CONFIG.specialStatusEffects.DEFEATED = "downandout";
    // Disable the vision mechanics Foundry applies to certain status names
    CONFIG.specialStatusEffects.INVISIBLE = null;
    CONFIG.specialStatusEffects.BLIND = null;

    Hooks.callAll("lancer.statusInitComplete");
  }

  /**
   * Load statuses from the compendia and world items and backfill into CONFIG.statusEffects.
   */
  static async populateFromWorldItems() {
    const originalLength = CONFIG.statusEffects.length;
    const worldStatuses: LancerSTATUS[] = game.items?.filter(i => i.type === EntryType.STATUS) as LancerSTATUS[];
    this._populateFromItems(worldStatuses, true);
    console.log(
      `${lp} ${CONFIG.statusEffects.length - originalLength} status icons loaded from world items, total: ${
        CONFIG.statusEffects.length
      }`
    );
  }

  static async populateFromCompendiumItems() {
    const originalLength = CONFIG.statusEffects.length;
    const pack = game.packs.get(get_pack_id(EntryType.STATUS));
    const packStatuses: LancerSTATUS[] = ((await pack?.getDocuments({ type: EntryType.STATUS })) ||
      []) as unknown as LancerSTATUS[];
    this._populateFromItems(packStatuses, false);
    console.log(
      `${lp} ${CONFIG.statusEffects.length - originalLength} status icons loaded from compendiums, total: ${
        CONFIG.statusEffects.length
      }`
    );
  }

  static async _populateFromItems(items: LancerItem[] = [], overwrite = false) {
    if (!items.length) {
      return;
    }
    // Update the status icons with data from the items. Add any statuses which are missing, and populate descriptions.
    for (const status of items) {
      if (!status.is_status() || !status.system.lid || !status.img) continue;
      const existingStatus = CONFIG.statusEffects.find(s => s.id === status.system.lid);
      if (!existingStatus) {
        const effects = [...status.effects];
        const changes = effects.reduce((all, e) => {
          return all.concat(e.changes || []);
        }, []);
        CONFIG.statusEffects.push({
          id: status.system.lid,
          name: status.name,
          img: status.img,
          description: status.system.effects,
          changes,
        });
      } else {
        existingStatus.img = overwrite ? status.img || existingStatus.img : existingStatus.img || status.img;
        existingStatus.name = overwrite ? status.name || existingStatus.name : existingStatus.name || status.name;
        if (status.system.effects) {
          existingStatus.description = status.system.effects;
        }
        // If overwrite is on, replace the effect's changes with those from the item.
        if (overwrite && [...status.effects].length > 0) {
          const changes = existingStatus.changes || [];
          status.effects.forEach(e => {
            if (e.changes && e.changes.length > 0) {
              changes.push(...e.changes);
            }
          });
          existingStatus.changes = changes;
        }
        // If not overwriting, insert the changes if the existing status doesn't have any changes.
        else if (!existingStatus.changes && status.effects.size) {
          const effects = [...status.effects];
          const changes = effects.reduce((all, e) => {
            return all.concat(e.changes || []);
          }, []);
          existingStatus.changes = changes;
        }
      }
    }
  }
}

// Our out-of-range numeric append mode, from before v14 replaced numeric modes with string types.
// Nothing in the system emits it any more -- weapon bonuses travel as the registered
// "lancer.weaponBonus" change type below -- but it is exported, so the hook keeps honoring it for a
// module that still does. Its counterpart AE_MODE_SET_JSON (11) is gone: nothing ever emitted it,
// here or in any installed module.
export const AE_MODE_APPEND_JSON = 12 as CONST.ACTIVE_EFFECT_MODES;

// Keys we append JSON-encoded values onto via a custom change.
export const JSON_APPEND_KEYS = new Set(["system.bonuses.weapon_bonuses"]);

// Our own v14-native change type for weapon bonuses. convertBonus emits changes carrying this type;
// registerLancerChangeTypes (below) registers a handler for it into CONFIG.ActiveEffect.changeTypes
// at init, so ActiveEffect.applyChange dispatches straight to that handler. This replaces the older
// approach of emitting a bare "custom" change and matching it by key in the hook.
export const LANCER_WEAPON_BONUS_CHANGE = "lancer.weaponBonus";

const _json_cache = {} as Record<string, any>;

// Decode a JSON-append change value into a fresh copy. v14 resolves change values before handing
// them over, so what we stringified on the way in can arrive already parsed -- only decode when it
// is still a string, and cache that parse for the next actor carrying the same bonus. The copy is
// required because the value lands in an actor's prepared data; two actors sharing one bonus would
// otherwise end up sharing one object.
function resolveJsonAppendValue(raw: unknown): any {
  const source = typeof raw === "string" ? (_json_cache[raw] ??= JSON.parse(raw)) : raw;
  return foundry.utils.deepClone(source);
}

Hooks.on("applyActiveEffect", function (actor, change) {
  // Back-compat path only: our own weapon bonuses now use the registered "lancer.weaponBonus" type
  // and are dispatched by core straight to its handler, never reaching this hook. What still lands
  // here is a module emitting the exported numeric modes (11/12). v14 swapped numeric modes for
  // string types, so it never arrives untyped: the migration rewrites `mode: N` to `type:
  // "custom.N"` (and keeps mode: N alongside). Recover the numeric mode from the "custom.N" suffix
  // -- this matches the migrated change and avoids reading the deprecated `mode` field. Fall back
  // to a bare mode only for a truly untyped change, which no v14 core path produces.
  const changeType = (change as { type?: string }).type;
  const suffix =
    typeof changeType === "string" && changeType.startsWith("custom.") ? Number(changeType.slice("custom.".length)) : NaN;
  const legacyMode = !Number.isNaN(suffix)
    ? suffix
    : changeType === undefined
      ? (change as { mode?: number }).mode
      : undefined;
  // A change carrying our own type should have been dispatched to the registered handler and never
  // arrive here. If it does, registration did not take effect (init ordering, or CHANGE_TYPES was
  // already memoized). Apply it anyway so bonuses do not silently vanish, but say so out loud --
  // silent loss is exactly the failure mode this whole path keeps producing.
  const isStrandedOwnType = changeType === LANCER_WEAPON_BONUS_CHANGE;
  if (isStrandedOwnType) {
    console.warn(
      `Lancer: ${LANCER_WEAPON_BONUS_CHANGE} reached the applyActiveEffect hook, so its change type is not registered. ` +
        `Falling back to the legacy append path.`
    );
  }
  const isAppend =
    legacyMode == AE_MODE_APPEND_JSON ||
    isStrandedOwnType ||
    (changeType === "custom" && JSON_APPEND_KEYS.has(change.key));
  if (!isAppend) return;
  try {
    const items = foundry.utils.getProperty(actor, change.key) as unknown[];
    items.push(resolveJsonAppendValue(change.value));
  } catch (e) {
    // Nothing to do really, except log it
    console.warn(e);
    console.warn(`JSON effect parse failed, ${change.value}`);
  }
});

// Register Lancer's own ActiveEffect change types. Must run at init: CONFIG.ActiveEffect.changeTypes
// feeds ActiveEffect.CHANGE_TYPES, which memoizes on the first effect application, so a later
// registration is silently ignored.
export function registerLancerChangeTypes() {
  const changeTypes = (CONFIG.ActiveEffect as { changeTypes?: Record<string, any> }).changeTypes;
  if (!changeTypes) return;
  changeTypes[LANCER_WEAPON_BONUS_CHANGE] = {
    label: "lancer.effect.changeType.weaponBonus",
    defaultPriority: 50,
    // applyChange invokes this for its side effect (the return value is ignored) and expects it to
    // honor modifyTarget, exactly as core's applyChangeField does. We append the decoded bonus onto
    // system.bonuses.weapon_bonuses -- a free-form array with no schema field of its own, which is
    // why the "custom" form had to fall through to the applyActiveEffect hook before.
    handler(targetDoc: any, change: any, _field: unknown, _replacementData: unknown, modifyTarget = true) {
      if (!modifyTarget) return;
      try {
        const items = foundry.utils.getProperty(targetDoc, change.key) as unknown[];
        if (Array.isArray(items)) items.push(resolveJsonAppendValue(change.value));
      } catch (e) {
        console.warn(e);
        console.warn(`Lancer weapon-bonus change failed, ${change.value}`);
      }
    },
  };
}

declare module "fvtt-types/configuration" {
  interface DocumentClassConfig {
    ActiveEffect: typeof LancerActiveEffect<ActiveEffect.SubType>;
  }

  interface ConfiguredActiveEffect<SubType extends ActiveEffect.SubType> {
    document: LancerActiveEffect<SubType>;
  }

  interface FlagConfig {
    ActiveEffect: {
      lancer: {
        // If true, then this is the effect innately generated by certain categories of items, such as frames, npc classes, etc
        // or an effect generated by the bonuses on such an item
        // These are aggressively regenerated. Do not become attached to them.
        ephemeral?: boolean;

        // If specified, disable unless this
        target_type?: LancerEffectTarget;

        // When we propagate an effect, the origin becomes the parent actor.
        // This field maintains the true original
        deep_origin?: string | null;
      };
    };
  }
}
