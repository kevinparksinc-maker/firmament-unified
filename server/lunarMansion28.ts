export type MansionNature = "Sharid" | "Mutadil" | "Latif";

export interface LunarMansionDefinition {
  index: number;
  arabicName: string;
  transliterations: string[];
  translation: string;
  startDegree: number;
  endDegree: number;
  nature: MansionNature;
  determinantStar: string;
  traditionalRuler: string;
  vedicOverlap: string;
}

const MANSION_WIDTH = 360 / 28;

type MansionMetadata = Omit<LunarMansionDefinition, "index" | "startDegree" | "endDegree">;

/**
 * User-supplied fixed-canopy registry. The 28 Arabic stations are structural
 * slots; Vedic names are overlap annotations and do not replace the separate
 * 27-Nakshatra layer.
 */
const MANSION_METADATA: readonly MansionMetadata[] = [
  { arabicName: "الشرطان", transliterations: ["Al-Sharatan", "Al-Saratain"], translation: "The Two Signs", nature: "Sharid", determinantStar: "Beta & Gamma Arietis", traditionalRuler: "Mars", vedicOverlap: "Ashwini (0°00'–13°20' Aries)" },
  { arabicName: "البطين", transliterations: ["Al-Butayn"], translation: "The Little Belly", nature: "Mutadil", determinantStar: "Epsilon Arietis", traditionalRuler: "Venus", vedicOverlap: "Bharani (13°20'–26°40' Aries)" },
  { arabicName: "الثريا", transliterations: ["Al-Thurayya"], translation: "The Pleiades", nature: "Latif", determinantStar: "Eta Tauri (Alcyone)", traditionalRuler: "Moon", vedicOverlap: "Krittika (26°40' Aries–10°00' Taurus)" },
  { arabicName: "الدبران", transliterations: ["Al-Dabaran"], translation: "The Follower", nature: "Sharid", determinantStar: "Alpha Tauri (Aldebaran)", traditionalRuler: "Sun", vedicOverlap: "Rohini (10°00'–23°20' Taurus)" },
  { arabicName: "الهقعة", transliterations: ["Al-Haq'ah"], translation: "The White Spot", nature: "Mutadil", determinantStar: "Lambda Orionis (Meissa)", traditionalRuler: "Mercury", vedicOverlap: "Mrigashira (23°20' Taurus–6°40' Gemini)" },
  { arabicName: "الهنعة", transliterations: ["Al-Han'ah"], translation: "The Brand", nature: "Latif", determinantStar: "Gamma Geminorum (Alhena)", traditionalRuler: "Jupiter", vedicOverlap: "Ardra (6°40'–20°00' Gemini)" },
  { arabicName: "الذراع", transliterations: ["Al-Dhira"], translation: "The Forearm", nature: "Mutadil", determinantStar: "Alpha & Beta Geminorum (Castor & Pollux)", traditionalRuler: "Saturn", vedicOverlap: "Punarvasu (20°00' Gemini–3°20' Cancer)" },
  { arabicName: "النسرة", transliterations: ["Al-Nathrah"], translation: "The Gap / Nose", nature: "Latif", determinantStar: "Praesepe (M44) / Gamma & Delta Cancri", traditionalRuler: "Mars", vedicOverlap: "Pushya (3°20'–16°40' Cancer)" },
  { arabicName: "الطرف", transliterations: ["Al-Tarf"], translation: "The Glance", nature: "Sharid", determinantStar: "Lambda Leonis", traditionalRuler: "Venus", vedicOverlap: "Ashlesha (16°40'–30°00' Cancer)" },
  { arabicName: "الجبهة", transliterations: ["Al-Jabhah"], translation: "The Forehead", nature: "Latif", determinantStar: "Alpha Leonis (Regulus)", traditionalRuler: "Moon", vedicOverlap: "Magha (0°00'–13°20' Leo)" },
  { arabicName: "الزبرة", transliterations: ["Al-Zubrah"], translation: "The Mane", nature: "Mutadil", determinantStar: "Delta & Theta Leonis", traditionalRuler: "Sun", vedicOverlap: "Purva Phalguni (13°20'–26°40' Leo)" },
  { arabicName: "الصرفة", transliterations: ["Al-Sarfah"], translation: "The Changer of Weather", nature: "Sharid", determinantStar: "Beta Leonis (Denebola)", traditionalRuler: "Mercury", vedicOverlap: "Uttara Phalguni (26°40' Leo–10°00' Virgo)" },
  { arabicName: "العواء", transliterations: ["Al-Awwa"], translation: "The Barker", nature: "Latif", determinantStar: "Beta, Gamma, Delta Virginis", traditionalRuler: "Jupiter", vedicOverlap: "Hasta (10°00'–23°20' Virgo)" },
  { arabicName: "السماك", transliterations: ["Al-Simak"], translation: "The Unarmed Lifter", nature: "Mutadil", determinantStar: "Alpha Virginis (Spica)", traditionalRuler: "Saturn", vedicOverlap: "Chitra (23°20' Virgo–6°40' Libra)" },
  { arabicName: "الَغَفْر", transliterations: ["Al-Ghafr"], translation: "The Covering", nature: "Latif", determinantStar: "Iota, Kappa, Lambda Virginis", traditionalRuler: "Mars", vedicOverlap: "Swati (6°40'–20°00' Libra)" },
  { arabicName: "الزبانا", transliterations: ["Al-Zubana"], translation: "The Claws", nature: "Sharid", determinantStar: "Alpha & Beta Librae", traditionalRuler: "Venus", vedicOverlap: "Vishakha (20°00' Libra–3°20' Scorpio)" },
  { arabicName: "الإكليل", transliterations: ["Al-Iklil"], translation: "The Crown", nature: "Mutadil", determinantStar: "Beta, Delta, Pi Scorpii", traditionalRuler: "Moon", vedicOverlap: "Anuradha (3°20'–16°40' Scorpio)" },
  { arabicName: "القلب", transliterations: ["Al-Qalb"], translation: "The Heart", nature: "Sharid", determinantStar: "Alpha Scorpii (Antares)", traditionalRuler: "Sun", vedicOverlap: "Jyeshtha (16°40'–30°00' Scorpio)" },
  { arabicName: "الشولة", transliterations: ["Al-Shaulah"], translation: "The Stinger", nature: "Sharid", determinantStar: "Lambda & Upsilon Scorpii (Shaula)", traditionalRuler: "Mercury", vedicOverlap: "Mula (0°00'–13°20' Sagittarius)" },
  { arabicName: "النعائم", transliterations: ["Al-Na'am"], translation: "The Ostriches", nature: "Latif", determinantStar: "Gamma, Delta, Epsilon, Zeta Sagittarii", traditionalRuler: "Jupiter", vedicOverlap: "Purva Ashadha (13°20'–26°40' Sagittarius)" },
  { arabicName: "البلدة", transliterations: ["Al-Baldah"], translation: "The City / Waste Place", nature: "Mutadil", determinantStar: "Pi Sagittarii", traditionalRuler: "Saturn", vedicOverlap: "Uttara Ashadha (26°40' Sagittarius–10°00' Capricorn)" },
  { arabicName: "سعد الذابح", transliterations: ["Sa'd al-Dhabih"], translation: "The Lucky Star of the Slaughterer", nature: "Sharid", determinantStar: "Alpha & Beta Capricorni", traditionalRuler: "Mars", vedicOverlap: "Shravana (10°00'–23°20' Capricorn)" },
  { arabicName: "سعد بلع", transliterations: ["Sa'd Bula'"], translation: "The Lucky Star of the Swallower", nature: "Mutadil", determinantStar: "Epsilon, Mu, Nu Aquarii", traditionalRuler: "Venus", vedicOverlap: "Dhanishta (23°20' Capricorn–6°40' Aquarius)" },
  { arabicName: "سعد السعود", transliterations: ["Sa'd al-Su'ud"], translation: "The Luckiest of the Lucky", nature: "Latif", determinantStar: "Beta & Xi Aquarii", traditionalRuler: "Moon", vedicOverlap: "Shatabhisha (6°40'–20°00' Aquarius)" },
  { arabicName: "سعد الأخبية", transliterations: ["Sa'd al-Akhbiyah"], translation: "The Lucky Star of the Tents", nature: "Mutadil", determinantStar: "Gamma, Alpha, Zeta, Eta Aquarii", traditionalRuler: "Sun", vedicOverlap: "Purva Bhadrapada (20°00' Aquarius–3°20' Pisces)" },
  { arabicName: "المقدم", transliterations: ["Al-Muqaddam"], translation: "The Upper Spout", nature: "Sharid", determinantStar: "Alpha & Beta Pegasi", traditionalRuler: "Mercury", vedicOverlap: "Uttara Bhadrapada (3°20'–16°40' Pisces)" },
  { arabicName: "المؤخر", transliterations: ["Al-Mu'akhar"], translation: "The Lower Spout", nature: "Mutadil", determinantStar: "Gamma Pegasi & Alpha Andromedae", traditionalRuler: "Jupiter", vedicOverlap: "Revati (16°40'–30°00' Pisces)" },
  { arabicName: "الرشاء", transliterations: ["Al-Risha"], translation: "The Well-Rope", nature: "Latif", determinantStar: "Beta Piscium", traditionalRuler: "Saturn", vedicOverlap: "Revati / Ashwini transition zero-point" },
];

export const COMPLETE_28_MANSION_TABLE: readonly LunarMansionDefinition[] = MANSION_METADATA.map((metadata, index) => ({
  index: index + 1,
  ...metadata,
  startDegree: index * MANSION_WIDTH,
  endDegree: (index + 1) * MANSION_WIDTH,
}));

export const MANSIONS_SOURCE_URLS = [
  "https://www.thearabiconline.com/arabic-lunar-mansions-al-manazil/",
  "https://www.astrologycom.com/mansions.html",
];

export function mansionForLongitude(longitude: number): LunarMansionDefinition {
  const normalized = ((longitude % 360) + 360) % 360;
  return COMPLETE_28_MANSION_TABLE[Math.min(27, Math.floor(normalized / MANSION_WIDTH))]!;
}
