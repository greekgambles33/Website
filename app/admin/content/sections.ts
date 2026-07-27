export type FieldType = "text" | "textarea" | "number" | "boolean" | "datetime";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
}

export interface ListSection {
  key: string;
  label: string;
  description: string;
  kind: "list";
  fields: FieldDef[];
  hasId: boolean;
  fixedRows?: string[]; // when set, rows can't be added/removed — used for the 7-day schedule
}

export interface ObjectSection {
  key: string;
  label: string;
  description: string;
  kind: "object";
  fields: FieldDef[];
}

export type Section = ListSection | ObjectSection;

export const SECTIONS: Section[] = [
  {
    key: "hero_highlights",
    label: "Hero Stats",
    description: "The three stat pairs shown under the hero CTAs (e.g. Followers, Nights Streamed).",
    kind: "list",
    hasId: false,
    fields: [
      { key: "label", label: "Label", type: "text" },
      { key: "value", label: "Value", type: "text" },
    ],
  },
  {
    key: "community_stats",
    label: "Community Stats",
    description: "The 4-tile animated stat row on the homepage.",
    kind: "list",
    hasId: false,
    fields: [
      { key: "label", label: "Label", type: "text" },
      { key: "value", label: "Value", type: "number" },
    ],
  },
  {
    key: "announcements",
    label: "Announcements",
    description: "Latest posts shown on the homepage.",
    kind: "list",
    hasId: true,
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
      { key: "date", label: "Date label", type: "text" },
      { key: "pinned", label: "Pinned", type: "boolean" },
    ],
  },
  {
    key: "games",
    label: "Featured Games",
    description: "Homepage shows the first 2; /games shows all. Bonus Hunt and Tournament should keep their href pointing at /bonus-hunt and /tournament.",
    kind: "list",
    hasId: true,
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "description", label: "Short description", type: "text" },
      { key: "status", label: "Status (Live / Voting Open / Coming Soon)", type: "text" },
      { key: "participants", label: "Participants (0 to hide)", type: "number" },
      { key: "href", label: "Link (optional)", type: "text" },
      { key: "howToPlay", label: "How to play (optional, shown on /games)", type: "textarea" },
    ],
  },
  {
    key: "store",
    label: "Store Items",
    description: "Homepage shows the first 4; /store shows all, grouped by category.",
    kind: "list",
    hasId: true,
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "price", label: "Price (HellCatCoins)", type: "number" },
      { key: "category", label: "Category", type: "text" },
      { key: "limited", label: "Limited", type: "boolean" },
    ],
  },
  {
    key: "community_highlights",
    label: "Community Highlights",
    description: "Testimonial quotes on the homepage — only use real quotes from real people.",
    kind: "list",
    hasId: true,
    fields: [
      { key: "username", label: "Username", type: "text" },
      { key: "quote", label: "Quote", type: "textarea" },
    ],
  },
];
