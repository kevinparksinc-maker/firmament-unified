/**
 * Apps Hub — Quick access to all your applications
 */

import { ExternalLink } from "lucide-react";

export function AppsHub() {
  const apps = [
    {
      name: "The Firmament",
      description: "Natal & transit astrology readings",
      url: "/",
      color: "#C4A24A",
    },
    {
      name: "Sports Horary",
      description: "16-layer sports prediction engine",
      url: "/sports",
      color: "#16a34a",
    },
    {
      name: "Oracle of Babylon",
      description: "Tarot readings & divination",
      url: "https://oracle-of-babylon.onrender.com",
      isExternal: true,
      color: "#dc2626",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "12px",
        marginBottom: "32px",
      }}
    >
      {apps.map(app => (
        <a
          key={app.name}
          href={app.url}
          target={app.isExternal ? "_blank" : undefined}
          rel={app.isExternal ? "noopener noreferrer" : undefined}
          style={{
            padding: "16px",
            borderRadius: "8px",
            border: `1px solid ${app.color}`,
            backgroundColor: `${app.color}0a`,
            color: "#fff",
            textDecoration: "none",
            transition: "all 0.3s ease",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = `${app.color}1a`;
            (e.currentTarget as HTMLElement).style.borderColor = app.color;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = `${app.color}0a`;
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontFamily: "'Cinzel', serif",
              letterSpacing: "1px",
              color: app.color,
              textTransform: "uppercase",
            }}
          >
            {app.name}
            {app.isExternal && <ExternalLink style={{ display: "inline", marginLeft: "4px", width: "10px", height: "10px" }} />}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#999",
              lineHeight: 1.3,
            }}
          >
            {app.description}
          </div>
        </a>
      ))}
    </div>
  );
}
