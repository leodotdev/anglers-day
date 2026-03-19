export const BOAT_TYPES = [
  { value: "center_console", label: "Center Console" },
  { value: "sportfisher", label: "Sportfisher" },
  { value: "pontoon", label: "Pontoon" },
  { value: "sailboat", label: "Sailboat" },
  { value: "catamaran", label: "Catamaran" },
  { value: "kayak", label: "Kayak" },
  { value: "other", label: "Other" },
] as const;

export const TRIP_TYPES = [
  { value: "inshore", label: "Inshore" },
  { value: "offshore", label: "Offshore" },
  { value: "deep_sea", label: "Deep Sea" },
  { value: "fly_fishing", label: "Fly Fishing" },
  { value: "trolling", label: "Trolling" },
  { value: "bottom_fishing", label: "Bottom Fishing" },
  { value: "spearfishing", label: "Spearfishing" },
  { value: "sunset_cruise", label: "Sunset Cruise" },
  { value: "custom", label: "Custom" },
] as const;

export const AMENITIES = [
  "Fish Finder",
  "Live Well",
  "Restroom",
  "Cabin",
  "Air Conditioning",
  "Cooler",
  "Fighting Chair",
  "Outriggers",
  "Fly Bridge",
  "Swim Platform",
  "Shade/Bimini",
  "Sound System",
  "Wi-Fi",
  "GPS/Navigation",
] as const;

export const COMMON_SPECIES = [
  "Marlin",
  "Sailfish",
  "Tuna",
  "Mahi-Mahi",
  "Wahoo",
  "Swordfish",
  "Snapper",
  "Grouper",
  "Tarpon",
  "Bonefish",
  "Redfish",
  "Snook",
  "Kingfish",
  "Cobia",
  "Amberjack",
  "Barracuda",
  "Shark",
  "Flounder",
  "Striped Bass",
  "Trout",
] as const;

export const CANCELLATION_POLICIES = [
  {
    value: "flexible",
    label: "Flexible",
    description: "Full refund up to 24 hours before departure",
  },
  {
    value: "moderate",
    label: "Moderate",
    description: "Full refund up to 5 days before departure",
  },
  {
    value: "strict",
    label: "Strict",
    description: "50% refund up to 7 days before departure",
  },
] as const;
