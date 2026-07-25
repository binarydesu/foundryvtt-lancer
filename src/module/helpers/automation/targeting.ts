import type { LancerActor } from "../../actor/lancer-actor";
import type { SystemTemplates } from "../../system-template";

export function getTargets(): LancerActor[] {
  const targets = game.user!.targets;
  const ret: LancerActor[] = [];
  targets.forEach(token => {
    ret.push(token.actor!);
  });

  return ret;
}

export async function checkForHit(tech: boolean, roll: Roll, target: LancerActor): Promise<boolean> {
  let sysData = (target as any).system as SystemTemplates.actor_universal;
  let def: number = tech ? sysData.edef || 8 : sysData.evasion || 5;
  return (roll.total ?? 0) >= def;
}

// Quickly computes the distance between two tokens as a number of grid units
// TODO: Make it size aware, using the token.document.system.size if it exists? Prefer htss size
export function gridDist(token1: Token.Implementation, token2: Token.Implementation) {
  // Both `canvas.grid.grid` and `BaseGrid#measureDistances` were removed in v14 (their v12
  // deprecation period expired). The optional chaining made that silent -- this returned
  // undefined rather than throwing. `measurePath` is the replacement and already reports
  // distance in grid units, so the old `gridSpaces: true` flag has no equivalent.
  // The cast is needed because fvtt-types declares BaseGrid#measurePath with `never`
  // parameters to force narrowing to a concrete grid subclass, which `canvas.grid` is not.
  const grid = canvas?.grid as { measurePath(waypoints: Canvas.Point[], options: object): { distance: number } };
  return grid?.measurePath([token1.center, token2.center], {}).distance;
}
