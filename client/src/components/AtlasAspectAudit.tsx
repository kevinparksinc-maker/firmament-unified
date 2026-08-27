import type { AtlasAspectScan } from "@/lib/atlasAspects";

const degree = (value: number) => `${value.toFixed(1)}°`;
const compact = (values: string[]) => values.length ? values.join(" · ") : "None detected.";

export function AtlasAspectAudit({ scan }: { scan: AtlasAspectScan }) {
  return <section className="atlas-audit">
    <h2>Aspects & configurations · atlas-aspects-v1</h2>
    <div className="atlas-scroll"><table><thead><tr><th>Pair</th><th>Aspect</th><th>Separation</th><th>Orb</th><th>State</th></tr></thead><tbody>
      {scan.aspects.map(aspect => <tr key={`${aspect.first}-${aspect.second}-${aspect.type}`}><td>{aspect.first} / {aspect.second}</td><td>{aspect.type}</td><td>{degree(aspect.separation)}</td><td>{degree(aspect.orb)} / {degree(aspect.orbLimit)}</td><td>{aspect.state}</td></tr>)}
    </tbody></table></div>
    <div style={{ marginTop:14, fontSize:12, lineHeight:1.45 }}>
      <p className="atlas-eyebrow">Angle contacts</p><p className="atlas-copy" style={{ margin:"4px 0" }}>{compact(scan.angularContacts.map(contact => `${contact.planet} / ${contact.angle}: ${degree(contact.distance)} ≤ ${degree(contact.orbLimit)}`))}</p>
      <p className="atlas-eyebrow" style={{ marginTop:12 }}>Stelliums</p><p className="atlas-copy" style={{ margin:"4px 0" }}>{compact(scan.stelliums.map(stellium => `${stellium.scope} ${stellium.location}: ${stellium.planets.join(", ")}`))}</p>
      <p className="atlas-eyebrow" style={{ marginTop:12 }}>Mutual reception</p><p className="atlas-copy" style={{ margin:"4px 0" }}>{compact(scan.mutualReceptions.map(reception => `${reception.first} in ${reception.firstSign} ↔ ${reception.second} in ${reception.secondSign}`))}</p>
      <p className="atlas-eyebrow" style={{ marginTop:12 }}>Detected configurations</p><p className="atlas-copy" style={{ margin:"4px 0" }}>{compact(scan.configurations.map(configuration => `${configuration.type}: ${configuration.planets.join(" / ")}`))}</p>
      <p className="atlas-eyebrow" style={{ marginTop:12 }}>Dispositor chains</p><p className="atlas-copy" style={{ margin:"4px 0" }}>{compact(scan.dispositorChains.map(chain => `${chain.planet}: ${chain.chain.join(" → ")}${chain.isLoop ? " (loop)" : ""}`))}</p>
    </div>
  </section>;
}

export function AtlasPointRelations({ pointName, scan }: { pointName: string; scan: AtlasAspectScan }) {
  const relatedAspects = scan.aspects.filter(aspect => aspect.first === pointName || aspect.second === pointName);
  const angularContacts = scan.angularContacts.filter(contact => contact.planet === pointName);
  return <div style={{ borderTop:"1px solid rgba(26,44,49,.16)", marginTop:10, paddingTop:10, fontSize:12, color:"#334c50", lineHeight:1.45 }}>
    <strong style={{ color:"#1c3c41" }}>Declared aspects:</strong> {relatedAspects.length ? relatedAspects.map(aspect => `${aspect.type} to ${aspect.first === pointName ? aspect.second : aspect.first} (${degree(aspect.orb)} orb · ${aspect.state})`).join("; ") : "None within the declared orb limits."}<br />
    <strong style={{ color:"#1c3c41" }}>Angle contacts:</strong> {angularContacts.length ? angularContacts.map(contact => `${contact.angle} (${degree(contact.distance)})`).join("; ") : "None within 5.0°."}
  </div>;
}
