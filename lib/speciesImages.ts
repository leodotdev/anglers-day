import { ImageSourcePropType } from "react-native";

const images: Record<string, ImageSourcePropType> = {
  "barracuda": require("@/assets/species/barracuda.png"),
  "black-drum": require("@/assets/species/black-drum.png"),
  "blackfin-tuna": require("@/assets/species/blackfin-tuna.png"),
  "blue-marlin": require("@/assets/species/blue-marlin.png"),
  "bonefish": require("@/assets/species/bonefish.png"),
  "cero-mackerel": require("@/assets/species/cero-mackerel.png"),
  "escolar": require("@/assets/species/escolar.png"),
  "grouper": require("@/assets/species/grouper.png"),
  "hogfish": require("@/assets/species/hogfish.png"),
  "juvenile-tarpon": require("@/assets/species/juvenile-tarpon.png"),
  "king-mackerel": require("@/assets/species/king-mackerel.png"),
  "kingfish": require("@/assets/species/kingfish.png"),
  "lane-snapper": require("@/assets/species/lane-snapper.png"),
  "mahi-mahi": require("@/assets/species/mahi-mahi.png"),
  "mangrove-snapper": require("@/assets/species/mangrove-snapper.png"),
  "permit": require("@/assets/species/permit.png"),
  "queen-snapper": require("@/assets/species/queen-snapper.png"),
  "red-grouper": require("@/assets/species/red-grouper.png"),
  "redfish": require("@/assets/species/redfish.png"),
  "snook": require("@/assets/species/snook.png"),
  "spotted-sea-trout": require("@/assets/species/spotted-sea-trout.png"),
  "swordfish": require("@/assets/species/swordfish.png"),
  "tarpon": require("@/assets/species/tarpon.png"),
  "triggerfish": require("@/assets/species/triggerfish.png"),
  "wahoo": require("@/assets/species/wahoo.png"),
  "yellowtail-snapper": require("@/assets/species/yellowtail-snapper.png"),
};

export function getSpeciesImage(name: string): ImageSourcePropType | null {
  const key = name.toLowerCase().replace(/[\s_]+/g, "-");
  return images[key] ?? null;
}
