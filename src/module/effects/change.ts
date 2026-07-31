/**
 * v14 replaced the numeric `mode` on ActiveEffect changes with a string `type` drawn from the
 * keys of CONST.ACTIVE_EFFECT_CHANGE_TYPES. The numeric form still works through a shim, but is
 * slated for removal in v16.
 *
 * fvtt-types has no v14 release yet and still models the pre-v14 schema, so a change literal
 * carrying `type` trips the excess property check even though Foundry accepts it. Describing the
 * shape here keeps the call sites readable; once the types catch up this can be dropped in favor
 * of the real schema type.
 */
export type LancerChangeType =
  | "custom"
  | "multiply"
  | "add"
  | "subtract"
  | "downgrade"
  | "upgrade"
  | "override"
  // Our own change type, registered into CONFIG.ActiveEffect.changeTypes at init. See
  // LANCER_WEAPON_BONUS_CHANGE in lancer-active-effect.ts.
  | "lancer.weaponBonus";

export type LancerEffectChange = {
  key: string;
  // Foundry defaults an absent value to "", which is what the status effects rely on -- they only
  // need the key to exist. The type is left open because most values are read straight out of
  // system data, which the stale fvtt-types resolve to unusable field descriptors rather than to
  // string or number. Narrow this once fvtt-types ships v14.
  value?: any;
  type: LancerChangeType;
  priority?: number | null;
};

/**
 * Hands a set of changes to Foundry. The argument is checked against the shape v14 actually
 * wants; the return type is deliberately opaque because the current types still describe the
 * numeric `mode` schema and would reject it. Drop this once fvtt-types ships v14.
 */
export function asChanges(changes: LancerEffectChange[]): any {
  return changes;
}
