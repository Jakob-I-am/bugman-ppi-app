/**
 * The fixed parts of every report: property details, the inspection agreement and
 * the inspector's conclusions. These can't be removed, because AS 4349.1 / 4349.3
 * reports must always record them. Check the wording against your copies of
 * AS 4349.0, 4349.1 and 4349.3 and your PI insurer's requirements.
 */
import type { Field } from "./fields";
import { inScope, type ReportType, type Scope } from "./types";

export type FrameSection = { key: string; title: string; scope: Scope; fields: Field[] };

export const frameSections: FrameSection[] = [
  {
    key: "property",
    title: "Property and inspection details",
    scope: "both",
    fields: [
      { key: "inspectionDate", label: "Inspection date", type: "date", required: true },
      { key: "inspectionTime", label: "Inspection time", type: "time", required: true },
      { key: "weather", label: "Weather at time of inspection", type: "select", required: true,
        options: ["Fine and dry", "Overcast", "Recent rain", "Raining", "Windy", "Hot"] },
      { key: "personsPresent", label: "People present", type: "text", help: "e.g. Agent, vendor, purchaser" },
      { key: "titleType", label: "Title type", type: "select", required: true,
        options: ["Torrens title", "Strata title", "Community title", "Company title"],
        help: "For strata and company title, the inspection covers the lot and immediately adjoining common property only." },
      { key: "propertyType", label: "Building type", type: "select", required: true,
        options: ["Freestanding house", "Semi-detached", "Duplex", "Townhouse", "Villa", "Apartment", "Other"] },
      { key: "storeys", label: "Storeys", type: "select", required: true, options: ["Single", "Two", "Three or more", "Split level"] },
      { key: "walls", label: "Main wall construction", type: "select", required: true,
        options: ["Full brick", "Brick veneer", "Timber framed, weatherboard", "Timber framed, fibre cement", "Rendered masonry", "Concrete or block", "Mixed", "Other"] },
      { key: "roof", label: "Roof covering", type: "select", required: true,
        options: ["Concrete tile", "Terracotta tile", "Metal sheet", "Slate", "Fibre cement", "Membrane", "Mixed", "Other"] },
      { key: "floor", label: "Floor construction", type: "select", required: true,
        options: ["Suspended timber", "Concrete slab on ground", "Suspended concrete", "Combination"] },
      { key: "approxAge", label: "Approximate age", type: "text", help: "e.g. Built in the 1960s, extended around 2005" },
      { key: "occupancy", label: "Occupancy", type: "select", required: true,
        options: ["Occupied and furnished", "Vacant and unfurnished", "Vacant, partly furnished"] },
    ],
  },
  {
    key: "agreement",
    title: "Inspection agreement",
    scope: "both",
    fields: [
      { key: "agreementRef", label: "Agreement reference", type: "text", required: true },
      { key: "agreementDate", label: "Date agreement accepted", type: "date", required: true,
        help: "The inspection agreement must be in place before the inspection." },
      { key: "scopeVariations", label: "Agreed changes to the standard scope", type: "textarea",
        help: "Leave blank if the inspection follows the standard scope" },
    ],
  },
  {
    key: "buildingSummary",
    title: "Building inspection conclusion",
    scope: "building",
    fields: [
      { key: "overallCondition", label: "Overall condition", type: "select", required: true,
        options: ["Above average", "Average", "Below average"],
        help: "Compared with a similar building of similar age that has been reasonably maintained" },
      { key: "minorDefects", label: "Extent of minor defects", type: "select", required: true,
        options: ["Fewer than typical for age", "Typical for age", "More than typical for age"] },
      { key: "conclusion", label: "Inspector's conclusion", type: "textarea", required: true },
    ],
  },
  {
    key: "pestSummary",
    title: "Timber pest inspection conclusion",
    scope: "pest",
    fields: [
      { key: "activeTermites", label: "Active termites", type: "select", required: true, options: ["No visible evidence", "Found"] },
      { key: "termiteDamage", label: "Termite damage", type: "select", required: true, options: ["No visible evidence", "Found"] },
      { key: "previousTreatment", label: "Previous termite treatment", type: "select", required: true,
        options: ["No visible evidence", "Evidence found", "Durable notice found"] },
      { key: "durableNotice", label: "Durable notice location and details", type: "text" },
      { key: "borers", label: "Borers of seasoned timber", type: "select", required: true, options: ["No visible evidence", "Found"] },
      { key: "woodDecay", label: "Wood decay fungi", type: "select", required: true, options: ["No visible evidence", "Found"] },
      { key: "conducive", label: "Conditions conducive to timber pests", type: "select", required: true, options: ["None noted", "Present"] },
      { key: "susceptibility", label: "Overall susceptibility to termite attack", type: "select", required: true,
        options: ["Low", "Moderate", "High", "Very high"] },
      { key: "nextInspection", label: "Recommended next timber pest inspection", type: "select", required: true,
        options: ["Within 3 months", "Within 6 months", "Within 12 months"] },
      { key: "invasiveRecommended", label: "Invasive inspection recommended", type: "checkbox" },
      { key: "pestConclusion", label: "Inspector's conclusion", type: "textarea", required: true },
    ],
  },
];

export const frameFor = (type: ReportType) => frameSections.filter((s) => inScope(s.scope, type));
export const frameFields = (type: ReportType) => frameFor(type).flatMap((s) => s.fields);
