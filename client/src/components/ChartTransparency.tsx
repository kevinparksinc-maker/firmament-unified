import { HOUSE_TOPICS, PLANET_CORE, SIGN_ORDER, SIGN_RULERS, type PlanetPlacement } from "@/lib/astroEngine";
import { getNakshatraDetails, SIGN_QUALITIES } from "@/lib/summarizePillarRich";

type ChartTransparencyProps = {
  planets: PlanetPlacement[] | Record<string, PlanetPlacement>;
  title?: string;
  subtitle?: string;
};

type PlacementView = PlanetPlacement & {
  rawLongitude: number | null;
  nakshatra: ReturnType<typeof getNakshatraDetails>;
};

function normalize(value: number) {
  return ((value % 360) + 360) % 360;
}

function toPlacementList(input: ChartTransparencyProps["planets"]): PlanetPlacement[] {
  return Array.isArray(input) ? input : Object.values(input);
}

function ordinal(value: number) {
  const suffix = value % 100 >= 11 && value % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][value % 10] ?? "th");
  return `${value}${suffix}`;
}

function rawLongitude(placement: PlanetPlacement) {
  if (placement.eclipticLon != null && Number.isFinite(placement.eclipticLon)) return normalize(placement.eclipticLon);
  const signIndex = SIGN_ORDER.indexOf(placement.sign);
  return signIndex >= 0 ? signIndex * 30 + placement.degree : null;
}

function houseSign(ascendant: PlanetPlacement | undefined, house: number) {
  const ascIndex = ascendant ? SIGN_ORDER.indexOf(ascendant.sign) : -1;
  return ascIndex >= 0 ? SIGN_ORDER[(ascIndex + house - 1) % SIGN_ORDER.length] : "Not assigned";
}

function explainPlacement(placement: PlacementView) {
  const core = PLANET_CORE[placement.planet] ?? PLANET_CORE[placement.planet.replace(/\s+Rx$/i, "")];
  const signQuality = placement.sign ? `${placement.sign} contributes its ${SIGN_QUALITIES[placement.sign] ?? "distinct sign quality"} quality, modifying how the planet acts and what it prioritizes.` : "The sign quality is unavailable until a sign is assigned.";
  const houseText = placement.house ? `The ${ordinal(placement.house)} house makes this concrete through ${HOUSE_TOPICS[placement.house] ?? "that life area"}.` : "No house has been assigned, so the life arena remains unverified.";
  const ruler = SIGN_RULERS[placement.sign];
  const rulerText = ruler ? `${ruler} rules ${placement.sign}; locating ${ruler} elsewhere in the chart shows where this sign’s agenda is carried out.` : "The sign ruler is not assigned in the current registry.";
  const coreText = core ? `At the planet level, this concerns ${core.mind}; emotionally it involves ${core.soul}; at the purpose level it involves ${core.spirit}.` : "A planet-specific core interpretation is not yet registered.";
  const lunarText = placement.nakshatra ? `${placement.nakshatra.name} (${placement.nakshatra.archetype}), pada ${placement.nakshatra.pada}, ruled by ${placement.nakshatra.ruler}, adds ${placement.nakshatra.shakti}. Its shadow pattern is ${placement.nakshatra.shadow}.` : "Nakshatra information is unavailable because the raw longitude is missing.";
  return `${coreText} ${signQuality} ${houseText} ${rulerText} ${lunarText}`;
}

export function ChartTransparency({ planets, title = "Complete chart — placements and meanings", subtitle = "Every placement is shown directly so the chart can be read and audited without searching through hidden sections." }: ChartTransparencyProps) {
  const source = toPlacementList(planets);
  const ascendant = source.find((placement) => placement.planet === "Asc" || placement.planet === "Ascendant");
  const views: PlacementView[] = source.map((placement) => ({ ...placement, rawLongitude: rawLongitude(placement), nakshatra: getNakshatraDetails(rawLongitude(placement)) }));
  const visiblePlacements = views.filter((placement) => !["Asc", "Ascendant"].includes(placement.planet));
  const houses = Array.from({ length: 12 }, (_, index) => index + 1).map((house) => {
    const occupants = visiblePlacements.filter((placement) => placement.house === house);
    return { house, sign: houseSign(ascendant, house), occupants };
  });

  return <section className="mt-6 rounded-xl border border-amber-500/35 bg-card p-4 text-card-foreground sm:p-6">
    <header className="border-b border-border pb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Audit-first astrology</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-4xl text-sm text-muted-foreground">{subtitle}</p>
    </header>

    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">House</th><th className="px-3 py-2">Sign</th><th className="px-3 py-2">House meaning</th><th className="px-3 py-2">Planets inside</th></tr></thead>
        <tbody>{houses.map(({ house, sign, occupants }) => <tr key={house} className="border-b border-border/60 align-top last:border-0"><td className="px-3 py-3 font-semibold">H{house}</td><td className="px-3 py-3">{sign}</td><td className="px-3 py-3 text-muted-foreground">{HOUSE_TOPICS[house]}</td><td className="px-3 py-3">{occupants.length === 0 ? <span className="text-muted-foreground">Empty</span> : occupants.map((placement) => <span key={placement.planet} className="mr-3 inline-block"><strong>{placement.planet}</strong> <span className="font-mono text-xs">{placement.rawLongitude == null ? "raw unavailable" : `${placement.rawLongitude.toFixed(4)}°`}</span></span>)}</td></tr>)}</tbody>
      </table>
    </div>

    <div className="mt-6 grid gap-4">
      {views.map((placement) => <article key={`${placement.planet}-${placement.kind}`} className="rounded-lg border border-border bg-background/45 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-3"><div><h3 className="text-lg font-semibold">{placement.planet}</h3><p className="text-sm text-muted-foreground">{placement.kind === "transit" ? "Transit placement" : "Natal placement"}</p></div><div className="font-mono text-sm">{placement.rawLongitude == null ? "Raw longitude unavailable" : `${placement.rawLongitude.toFixed(4)}°`} · {placement.sign} {placement.degree.toFixed(2)}° · {placement.house ? `${ordinal(placement.house)} house` : "house unassigned"}</div></div>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><span className="block text-xs uppercase tracking-wide text-muted-foreground">Sign ruler</span><strong>{SIGN_RULERS[placement.sign] ?? "Unassigned"}</strong></div><div><span className="block text-xs uppercase tracking-wide text-muted-foreground">Nakshatra</span><strong>{placement.nakshatra?.name ?? "Unavailable"}</strong>{placement.nakshatra && <span className="block text-xs text-muted-foreground">{placement.nakshatra.archetype} · pada {placement.nakshatra.pada}</span>}</div><div><span className="block text-xs uppercase tracking-wide text-muted-foreground">Mansion lord</span><strong>{placement.nakshatra?.ruler ?? "Unavailable"}</strong></div><div><span className="block text-xs uppercase tracking-wide text-muted-foreground">Status</span><span>{placement.rx ? "Retrograde" : "Direct"}{placement.combust ? " · Combust" : ""}{placement.cazimi ? " · Cazimi" : ""}</span></div></div>
        <p className="mt-4 text-sm leading-7 text-muted-foreground"><strong className="text-foreground">How to read this placement:</strong> {explainPlacement(placement)}</p>
      </article>)}
    </div>
  </section>;
}
