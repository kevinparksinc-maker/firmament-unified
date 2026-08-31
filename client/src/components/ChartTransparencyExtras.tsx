import { HOUSE_TOPICS, PLANET_CORE, SIGN_ORDER, SIGN_RULERS, type Activation, type PlanetPlacement } from "@/lib/astroEngine";
import { detectFixedStarConjunctions } from "@/lib/fixedStars";
import { findAtlasAspects, type AtlasAspect } from "@/lib/atlasAspects";
import { getNakshatraDetails } from "@/lib/summarizePillarRich";

type ChartTransparencyExtrasProps = {
  natal: PlanetPlacement[] | Record<string, PlanetPlacement>;
  transits?: PlanetPlacement[] | Record<string, PlanetPlacement>;
  activations?: Activation[];
};

function list(input: ChartTransparencyExtrasProps["natal"]): PlanetPlacement[] {
  return Array.isArray(input) ? input : Object.values(input);
}
function normalize(value: number) { return ((value % 360) + 360) % 360; }
function raw(p: PlanetPlacement) { return p.eclipticLon ?? p.absolute ?? null; }
function ordinal(value: number) { const suffix = value % 100 >= 11 && value % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][value % 10] ?? "th"); return `${value}${suffix}`; }

function AspectTable({ aspects }: { aspects: AtlasAspect[] }) {
  return <section className="mt-6 rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-6"><h3 className="text-lg font-semibold">Natal aspects — exact geometry</h3><p className="mt-1 text-sm text-muted-foreground">These are calculated relationships between raw longitudes. The declared aspect angle, orb, and motion state are shown; this table is evidence, not a hidden score.</p>{aspects.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No declared major aspects fall within the active orb policy.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">Pair</th><th className="px-3 py-2">Aspect</th><th className="px-3 py-2">Raw separation</th><th className="px-3 py-2">Orb / limit</th><th className="px-3 py-2">Motion state</th></tr></thead><tbody>{aspects.map((aspect) => <tr key={`${aspect.first}-${aspect.second}`} className="border-b border-border/60 last:border-0"><td className="px-3 py-3 font-medium">{aspect.first} — {aspect.second}</td><td className="px-3 py-3">{aspect.type} ({aspect.angle}°)</td><td className="px-3 py-3 font-mono">{aspect.separation.toFixed(4)}°</td><td className="px-3 py-3 font-mono">{aspect.orb.toFixed(4)}° / {aspect.orbLimit}°</td><td className="px-3 py-3">{aspect.state}</td></tr>)}</tbody></table></div>}</section>;
}

export function ChartTransparencyExtras({ natal, transits = [], activations = [] }: ChartTransparencyExtrasProps) {
  const natalList = list(natal);
  const transitList = list(transits);
  const byName = new Map(natalList.map((p) => [p.planet, p]));
  const aspectPoints = natalList.filter((p) => !["Asc", "Ascendant"].includes(p.planet) && raw(p) != null).map((p) => ({ key: p.planet, name: p.planet, kind: "planet" as const, longitude: normalize(raw(p)!), speedDegreesPerDay: null, sign: p.sign, house: p.house ?? undefined }));
  const aspects = findAtlasAspects(aspectPoints);
  const starInputs = Object.fromEntries(natalList.filter((p) => raw(p) != null).map((p) => [p.planet, { planet: p.planet, sign: p.sign, degree: p.degree, eclipticLon: normalize(raw(p)!), absolute: normalize(raw(p)!) }]));
  const stars = detectFixedStarConjunctions(starInputs);
  const asc = natalList.find((p) => ["Asc", "Ascendant"].includes(p.planet));
  const ascIndex = asc ? SIGN_ORDER.indexOf(asc.sign) : -1;
  const houses = Array.from({ length: 12 }, (_, index) => index + 1).map((house) => {
    const sign = ascIndex >= 0 ? SIGN_ORDER[(ascIndex + house - 1) % 12]! : "Unassigned";
    const ruler = SIGN_RULERS[sign];
    const rulerPlacement = ruler ? byName.get(ruler) : undefined;
    const chain: string[] = [];
    const seen = new Set<string>();
    let current = ruler;
    while (current && !seen.has(current) && chain.length < 8) { seen.add(current); chain.push(current); const placement = byName.get(current); current = placement ? SIGN_RULERS[placement.sign] : undefined; }
    return { house, sign, ruler, rulerPlacement, chain };
  });
  const natalByName = new Map(natalList.map((p) => [p.planet, p]));

  return <>
    <AspectTable aspects={aspects} />
    <section className="mt-6 rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-6"><h3 className="text-lg font-semibold">Fixed-star contacts</h3><p className="mt-1 text-sm text-muted-foreground">Only contacts inside the existing star-specific orb policy are listed, with the star’s declared meaning and warning.</p>{stars.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No fixed-star conjunction falls inside the active orb policy.</p> : <div className="mt-4 grid gap-3">{stars.map((hit) => <article key={`${hit.planet}-${hit.star.name}`} className="rounded-lg border border-border/70 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{hit.planet} conjunct {hit.star.name}</strong><span className="font-mono text-xs">orb {hit.orb.toFixed(2)}°{hit.exact ? " · exact" : ""}</span></div><p className="mt-2 text-sm leading-6">{hit.star.meaning}</p><p className="mt-2 text-sm"><strong>Gift:</strong> {hit.star.gift}. <strong>Shadow:</strong> {hit.star.shadow}. <strong>Warning:</strong> {hit.star.warning}.</p></article>)}</div>}</section>
    <section className="mt-6 rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-6"><h3 className="text-lg font-semibold">House rulers and dispositor chains</h3><p className="mt-1 text-sm text-muted-foreground">Each house is traced from house sign to sign ruler, then to the sign occupied by that ruler. A repeated planet marks the end of the declared chain.</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2">House</th><th className="px-3 py-2">Sign / theme</th><th className="px-3 py-2">Ruler placement</th><th className="px-3 py-2">Dispositor chain</th></tr></thead><tbody>{houses.map((house) => <tr key={house.house} className="border-b border-border/60 align-top last:border-0"><td className="px-3 py-3 font-semibold">H{house.house}</td><td className="px-3 py-3">{house.sign}<span className="mt-1 block text-xs text-muted-foreground">{HOUSE_TOPICS[house.house]}</span></td><td className="px-3 py-3">{house.ruler ? <>{house.ruler} {house.rulerPlacement ? `in ${house.rulerPlacement.sign}, ${house.rulerPlacement.house ? `${ordinal(house.rulerPlacement.house)} house` : "house unassigned"}` : "not placed"}</> : "Unassigned"}</td><td className="px-3 py-3 font-mono text-xs">{house.chain.length ? house.chain.join(" → ") : "No chain"}</td></tr>)}</tbody></table></div></section>
    <section className="mt-6 rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-6"><h3 className="text-lg font-semibold">Transit-to-natal activations</h3><p className="mt-1 text-sm text-muted-foreground">Each card keeps the transit position, natal target, aspect, orb, natal house, and nakshatra context together so the interpretation can be checked against the chart.</p>{activations.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No transit activation rows are available for this chart run.</p> : <div className="mt-4 grid gap-3">{activations.map((activation, index) => { const natalTarget = natalByName.get(activation.natalPlanet); const transitSource = transitList.find((p) => p.planet === activation.transitPlanet) ?? activation.transit; const nk = getNakshatraDetails(raw(natalTarget ?? activation.natal)); const core = PLANET_CORE[activation.natalPlanet]; return <article key={`${activation.transitPlanet}-${activation.natalPlanet}-${index}`} className="rounded-lg border border-border/70 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{activation.transitPlanet} {activation.aspect} natal {activation.natalPlanet}</strong><span className="font-mono text-xs">orb {activation.orb.toFixed(2)}°</span></div><p className="mt-2 text-sm leading-6"><strong>Transit raw longitude:</strong> {raw(transitSource)?.toFixed(4) ?? "unavailable"}°. <strong>Natal target:</strong> {raw(natalTarget ?? activation.natal)?.toFixed(4) ?? "unavailable"}° in {natalTarget?.sign ?? activation.natal.sign}, {natalTarget?.house ? `${ordinal(natalTarget.house)} house` : "house unassigned"}. {nk ? <><strong>Nakshatra:</strong> {nk.name}, pada {nk.pada}, lord {nk.ruler}; {nk.shakti}.</> : null} {core ? `This activates ${core.mind} through the natal placement.` : ""}</p><p className="mt-2 text-sm text-muted-foreground">{activation.summary}</p></article>; })}</div>}</section>
  </>;
}
