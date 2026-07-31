import type { DeepPartial } from "fvtt-types/utils";
import { EntryType, NpcFeatureType, NpcTechType } from "../../enums";
import { restrict_enum } from "../../helpers/commons";
import type { SourceData, SourceTemplates } from "../../source-template";
import type { BaseData } from "../../base-data";
import { convertNpcStats } from "../../util/migrations";
import type {
  PackedNpcReactionData,
  PackedNpcSystemData,
  PackedNpcTechData,
  PackedNpcTraitData,
  PackedNpcWeaponData,
} from "../../util/unpacking/packed-types";
import { type DamageData, DamageField, unpackDamage } from "../bits/damage";
import { RangeField, unpackRange } from "../bits/range";
import { TagField, unpackTag } from "../bits/tag";
import { LancerDataModel, NpcStatBlockField, type UnpackContext } from "../shared";
import { template_destructible, template_universal_item, template_uses } from "./shared";

import fields = foundry.data.fields;

const defineNpcFeatureModelSchema = () => {
  return {
    effect: new fields.HTMLField(),
    bonus: new NpcStatBlockField({ nullable: true }),
    override: new NpcStatBlockField({ nullable: true }),
    tags: new fields.ArrayField(new TagField()),
    type: new fields.StringField({ choices: Object.values(NpcFeatureType), initial: NpcFeatureType.Trait }),

    charged: new fields.BooleanField(),
    loaded: new fields.BooleanField(),

    tier_override: new fields.NumberField({ integer: true, min: 0, max: 3 }),

    // Weapon
    weapon_type: new fields.StringField(),
    damage: new fields.ArrayField(new fields.ArrayField(new DamageField())),
    range: new fields.ArrayField(new RangeField()),
    on_hit: new fields.HTMLField(),
    accuracy: new fields.ArrayField(new fields.NumberField({ integer: true, initial: 0 }), {
      min: 3,
      max: 3,
      initial: [0, 0, 0],
    }),
    attack_bonus: new fields.ArrayField(new fields.NumberField({ integer: true, initial: 0 }), {
      min: 3,
      max: 3,
      initial: [0, 0, 0],
    }),

    // Trait - N/A

    // Reaction
    trigger: new fields.StringField(),

    // System - N/A

    // Tech - mostly covered by weapon
    tech_type: new fields.StringField({ choices: Object.values(NpcTechType), initial: NpcTechType.Quick }),
    tech_attack: new fields.BooleanField({ nullable: true, initial: null }),

    // Origin data - track where it came from
    origin: new fields.SchemaField({
      type: new fields.StringField(),
      name: new fields.StringField(),
      base: new fields.BooleanField(),
    }),

    // Templates
    ...template_destructible(),
    ...template_uses(),
    ...template_universal_item(),
  };
};

type NpcFeatureModelSchema = ReturnType<typeof defineNpcFeatureModelSchema>;

export class NpcFeatureModel extends LancerDataModel<NpcFeatureModelSchema, Item.Implementation, BaseData.NpcFeature> {
  static DEFAULT_ICON = "systems/lancer/assets/icons/npc_feature.svg";
  static getDefaultArtwork(itemData?: Item.CreateData): Item.GetDefaultArtworkReturn {
    let img = this.DEFAULT_ICON;
    switch (itemData?.system?.type) {
      case NpcFeatureType.Reaction:
        img = "systems/lancer/assets/icons/reaction.svg";
        break;
      case NpcFeatureType.System:
        img = "systems/lancer/assets/icons/system.svg";
        break;
      case NpcFeatureType.Tech:
        img = "systems/lancer/assets/icons/tech_full.svg";
        break;
      case NpcFeatureType.Trait:
        img = "systems/lancer/assets/icons/trait.svg";
        break;
      case NpcFeatureType.Weapon:
        img = "systems/lancer/assets/icons/weapon.svg";
        break;
    }
    return { img };
  }

  static defineSchema() {
    return defineNpcFeatureModelSchema();
  }

  static migrateData(data: any) {
    // Fix stats
    if (data.bonus && typeof data.bonus == "object" && !Array.isArray(data.bonus)) {
      data.bonus = convertNpcStats(data.bonus)[0];
    }
    if (data.override && typeof data.override == "object" && !Array.isArray(data.override)) {
      data.override = convertNpcStats(data.override)[0];
    }
    // Non-tech features should not have tech_attack
    if (data.type && data.type !== NpcFeatureType.Tech) {
      data.tech_attack = false;
    } else if (data.tech_attack === null) {
      // Populate tech_attack if missing
      data.tech_attack = !!data.attack_bonus || !!data.accuracy;
    }

    return super.migrateData(data);
  }
}

// Converts an lcp bonus into our expected format
/**
 * The lancer-data wiki documents v3 feature types in lower case ("trait", "weapon", ...), while
 * Massif's own v3 packs write them capitalized, as v2 did. NpcFeatureType is capitalized and the
 * schema field restricts to exactly those values, so a lower-case type fails validation outright
 * and the feature never imports -- silently, since the import reports success regardless. Match
 * case-insensitively so either spelling works; capitalized input passes through unchanged.
 */
function restrictNpcFeatureType(raw: unknown): NpcFeatureType {
  const match = Object.values(NpcFeatureType).find(t => t.toLowerCase() === String(raw).toLowerCase());
  return match ?? NpcFeatureType.Trait;
}

export function unpackNpcFeature(
  data: PackedNpcReactionData | PackedNpcSystemData | PackedNpcTechData | PackedNpcTraitData | PackedNpcWeaponData,
  context: UnpackContext
): {
  name: string;
  type: EntryType.NPC_FEATURE;
  system: DeepPartial<SourceData.NpcFeature>;
} {
  // Normalized once here so both the branch checks below and the stored value agree on casing.
  data = { ...data, type: restrictNpcFeatureType(data.type) } as typeof data;
  let base = {
    name: data.name,
    type: EntryType.NPC_FEATURE as const,
    system: {
      lid: data.id,
      effect: data.effect,
      bonus: data.bonus,
      override: data.override,
      tags: (data.tags || []).map(unpackTag),
      type: data.type,

      origin: data.origin,

      charged: undefined,
      uses: undefined,
      loaded: undefined,
      destroyed: undefined,

      tier_override: 0,
    },
  };

  // Then do our specific features - if they aren't needed they won't be used!
  if (data.type == NpcFeatureType.Reaction) {
    let bs = base.system as Partial<SourceTemplates.NPC.ReactionData>;
    bs.trigger = data.trigger;
  } else if (data.type == NpcFeatureType.System) {
  } else if (data.type == NpcFeatureType.Trait) {
  } else if (data.type == NpcFeatureType.Tech) {
    let bs = base.system as Partial<SourceTemplates.NPC.TechData>;
    bs.tech_type = restrict_enum(NpcTechType, NpcTechType.Quick, data.tech_type);
    bs.accuracy = data.accuracy ?? [0, 0, 0];
    bs.attack_bonus = data.attack_bonus ?? [0, 0, 0];
    bs.tech_attack = !!data.attack_bonus || !!data.accuracy;
  } else if (data.type == NpcFeatureType.Weapon) {
    let bs = base.system as Partial<SourceTemplates.NPC.WeaponData>;
    bs.accuracy = data.accuracy ?? [0, 0, 0];
    bs.attack_bonus = data.attack_bonus ?? [0, 0, 0];
    bs.weapon_type = data.weapon_type;
    bs.on_hit = data.on_hit;

    // Build out damage. v2 puts the per-tier values under `damage`, CC v3 under `val` -- and v3 may
    // give a single value rather than one per tier. Reading only `damage` threw on every v3 weapon
    // and aborted the whole import.
    bs.damage = [];
    let i = 0;
    let done = false;
    while (!done) {
      done = true;
      let sub_damage: DamageData[] = [];
      for (let d of data.damage ?? []) {
        const raw = (d as { damage?: unknown; val?: unknown }).damage ?? (d as { val?: unknown }).val;
        const tiers = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];
        if (tiers.length > i) {
          sub_damage.push(
            unpackDamage({
              type: d.type as any,
              val: tiers[i] as any,
            })
          );
          done = false;
        }
      }
      if (!done) bs.damage.push(sub_damage);
      i += 1;
    }

    // Build out range
    bs.range = data.range.map(unpackRange);
  }

  return base;
}
