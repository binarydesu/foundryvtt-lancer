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
export type LancerChangeType = "custom" | "multiply" | "add" | "subtract" | "downgrade" | "upgrade" | "override";

export type LancerEffectChange = {
  key: string;
  value: string | number;
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
