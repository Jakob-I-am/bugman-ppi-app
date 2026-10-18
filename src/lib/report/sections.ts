/**
 * Area sections you add to a report one by one. Each has the same access
 * fields (AS 4349.1 requires areas not inspected, and why, to be recorded),
 * any area-specific fields, and a list of findings with photos.
 * `elements` are suggestions offered when adding a finding in that area.
 */
import type { Field } from "./fields";

export type SectionTemplate = {
  key: string;
  label: string;
  defaultTitle: string;
  repeatable: boolean;
  fields: Field[];
  elements: string[];
  /** Asks "Smoke alarm present?" at the bottom of the area (building reports only). */
  smokeAlarm?: boolean;
};

export const ACCESS_OPTIONS = ["Fully accessible", "Partly accessible", "Not accessible"] as const;

export const accessFields: Field[] = [
  { key: "access", label: "Access", type: "select", required: true, options: [...ACCESS_OPTIONS] },
  { key: "accessReason", label: "What limited access", type: "textarea",
    help: "Required when not fully accessible, e.g. stored goods, no manhole, low clearance, locked" },
  { key: "notes", label: "General observations", type: "textarea" },
];

export const smokeAlarmField: Field = {
  key: "smokeAlarm", label: "Smoke alarm present", type: "select", required: true, options: ["Yes", "No"],
};

export const sectionTemplates: SectionTemplate[] = [
  {
    key: "site", label: "Site (within 30 m)", defaultTitle: "Site", repeatable: false,
    fields: [
      { key: "slope", label: "Site slope", type: "select", options: ["Level", "Gentle", "Moderate", "Steep"] },
      { key: "drainage", label: "Surface drainage", type: "select", options: ["Good", "Fair", "Poor"] },
    ],
    elements: ["Fencing", "Retaining walls", "Paths and driveways", "Surface drainage", "Stormwater", "Trees", "Garden timbers", "Landscaping"],
  },
  {
    key: "exterior", label: "Building exterior", defaultTitle: "Exterior", repeatable: false, fields: [],
    elements: ["Wall cladding", "Brickwork and mortar", "Weep holes", "Damp-proof course", "Windows", "Doors", "Eaves and fascias", "Gutters and downpipes", "Stairs and balustrades", "Paintwork"],
  },
  {
    key: "roofExterior", label: "Roof exterior", defaultTitle: "Roof exterior", repeatable: false,
    fields: [{ key: "viewedFrom", label: "Inspected from", type: "select", options: ["On the roof", "Ladder at eaves", "Ground level", "Elevated camera or drone"] }],
    elements: ["Roof covering", "Ridge capping and pointing", "Valleys", "Flashings", "Penetrations", "Skylights", "Gutters"],
  },
  {
    key: "roofSpace", label: "Roof space", defaultTitle: "Roof space", repeatable: false, fields: [],
    elements: ["Roof framing", "Ceiling framing", "Sarking", "Insulation", "Ventilation", "Party or fire walls", "Downlight clearances"],
  },
  {
    key: "subfloor", label: "Subfloor", defaultTitle: "Subfloor", repeatable: false,
    fields: [{ key: "clearance", label: "Clearance", type: "select", options: ["Under 400 mm", "400 mm or more", "Varies"] }],
    elements: ["Piers and stumps", "Bearers and joists", "Flooring", "Ventilation", "Moisture and drainage", "Ant capping", "Timber in contact with soil", "Debris"],
  },
  {
    key: "room", smokeAlarm: true, label: "Interior room", defaultTitle: "Bedroom", repeatable: true, fields: [],
    elements: ["Ceiling", "Walls", "Floor", "Windows", "Doors", "Cornices", "Skirting and architraves", "Built-in robes", "Stairs and balustrades"],
  },
  {
    key: "kitchen", smokeAlarm: true, label: "Kitchen", defaultTitle: "Kitchen", repeatable: true, fields: [],
    elements: ["Benchtops", "Cabinetry", "Sink and taps", "Splashback", "Floor", "Ceiling", "Walls", "Rangehood"],
  },
  {
    key: "wetArea", smokeAlarm: true, label: "Wet area", defaultTitle: "Bathroom", repeatable: true,
    fields: [{ key: "moisture", label: "Moisture readings", type: "text", help: "Where tested, e.g. shower walls normal, base of vanity elevated" }],
    elements: ["Shower recess", "Waterproofing", "Wall tiles", "Floor tiles", "Grout and sealant", "Floor waste", "Vanity", "Toilet", "Bath", "Exhaust ventilation"],
  },
  {
    key: "garage", smokeAlarm: true, label: "Garage or carport", defaultTitle: "Garage", repeatable: true, fields: [],
    elements: ["Structure", "Roof", "Floor slab", "Door", "Walls"],
  },
  {
    key: "outbuilding", smokeAlarm: true, label: "Outbuilding", defaultTitle: "Shed", repeatable: true, fields: [],
    elements: ["Structure", "Roof", "Floor", "Walls", "Doors and windows"],
  },
  {
    key: "deck", label: "Deck, balcony or pergola", defaultTitle: "Rear deck", repeatable: true, fields: [],
    elements: ["Posts and footings", "Bearers and joists", "Decking", "Balustrade", "Stairs", "Fixings", "Timber in contact with soil", "Waterproofing"],
  },
  {
    key: "pool", label: "Pool area", defaultTitle: "Pool area", repeatable: false,
    fields: [],
    elements: ["Pool barrier", "Gate", "Surrounds", "Coping", "Equipment housing"],
  },
  {
    key: "other", smokeAlarm: true, label: "Other area", defaultTitle: "Other area", repeatable: true, fields: [],
    elements: [],
  },
];

const byKey = new Map(sectionTemplates.map((t) => [t.key, t]));
export const getTemplate = (key: string) => byKey.get(key) ?? byKey.get("other")!;
export const sectionFields = (key: string) => {
  const t = getTemplate(key);
  return [...accessFields, ...t.fields, ...(t.smokeAlarm ? [smokeAlarmField] : [])];
};

/** Sections added automatically to a new job (remove any that don't apply). */
export const defaultSections: { key: string; title?: string }[] = [
  { key: "site" }, { key: "exterior" }, { key: "roofExterior" }, { key: "roofSpace" }, { key: "subfloor" },
  { key: "room", title: "Living room" }, { key: "kitchen" }, { key: "wetArea", title: "Bathroom" },
];

/** AS 4349.1 inspection areas. A building report must account for each, even if only to say it wasn't accessible. */
export const requiredBuildingAreas: { label: string; keys: string[] }[] = [
  { label: "Site", keys: ["site"] },
  { label: "Exterior", keys: ["exterior"] },
  { label: "Roof exterior", keys: ["roofExterior"] },
  { label: "Roof space", keys: ["roofSpace"] },
  { label: "Subfloor", keys: ["subfloor"] },
  { label: "Interior", keys: ["room", "kitchen", "wetArea"] },
];
