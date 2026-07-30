/**
 * ARCANA STATE — Snow Globe Dome Renderer
 *
 * Visual Layer of the two-layer architecture:
 * - Parabolic dome with North Pole at origin (0,0,0)
 * - Dome vertex at 6,216 miles above North Pole
 * - Dome radius at base: 12,432 miles
 * - Planets pinned to dome surface at their true topocentric Alt/Az positions
 * - Everything rotates around Polaris (the still center)
 * - Polaris altitude = observer's latitude (enforced)
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface PlanetData {
  name: string;
  symbol: string;
  altitude: number; // degrees above horizon
  azimuth: number; // degrees, 0=N, 90=E
  sign: string;
  degreeInSign: number;
  retrograde: boolean;
}

interface SnowGlobeProps {
  planets: PlanetData[];
  observerLatitude: number; // degrees
  observerLongitude: number; // degrees
  width?: number;
  height?: number;
}

// Dome constants (miles)
const DOME_HEIGHT = 6216;
const DOME_RADIUS = 12432;

// Map topocentric Alt/Az to 3D point on parabolic dome
function altAzToDomePoint(
  altitude: number,
  azimuth: number,
  observerLat: number
): THREE.Vector3 {
  // Observer's position on the flat plane (distance from North Pole)
  // 1° latitude = 69.17 miles
  const observerR = (90 - observerLat) * 69.17;

  // Observer's X,Y on the flat plane (azimuthal equidistant)
  const observerX = 0; // center the view on the observer
  const observerY = 0;

  // Convert altitude to radial distance from zenith on dome
  // altitude=90° → zenith (directly above observer)
  // altitude=0°  → horizon (dome edge at observer's distance)
  const altRad = (altitude * Math.PI) / 180;
  const azRad = (azimuth * Math.PI) / 180;

  // Normalized altitude (0=horizon, 1=zenith)
  const normAlt = Math.max(0, altitude) / 90;

  // Radial distance from zenith on dome surface (0 at zenith, max at horizon)
  // Scale based on observer latitude so Polaris sits at correct altitude
  const maxR = DOME_RADIUS * 0.8; // visual scale
  const r = (1 - normAlt) * maxR * (observerLat / 90);

  // Direction on dome from zenith
  const dx = Math.sin(azRad) * r;
  const dy = Math.cos(azRad) * r; // north = +Y

  // Point on flat plane
  const flatX = dx;
  const flatY = dy;
  const flatR = Math.sqrt(flatX * flatX + flatY * flatY);

  // Z height on parabolic dome: Z = H - (H/R²) * r²
  const z =
    DOME_HEIGHT - (DOME_HEIGHT / (DOME_RADIUS * DOME_RADIUS)) * flatR * flatR;

  // Scale down for rendering (1 unit = 1000 miles)
  const scale = 1 / 1000;
  return new THREE.Vector3(flatX * scale, z * scale, flatY * scale);
}

// Planet colors
const PLANET_COLORS: Record<string, number> = {
  Sun: 0xffd700,
  Moon: 0xe8e8ff,
  Mercury: 0xaaaaaa,
  Venus: 0xffccaa,
  Mars: 0xff4444,
  Jupiter: 0xffaa44,
  Saturn: 0xddcc88,
  Uranus: 0x88ffee,
  Neptune: 0x4488ff,
  Pluto: 0xaa88cc,
  Rahu: 0x88aaff,
  Ketu: 0xff8888,
};

export function SnowGlobe({
  planets,
  observerLatitude,
  observerLongitude,
  width = 600,
  height = 500,
}: SnowGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const rotationRef = useRef<number>(0);
  const planetGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // ─── Scene Setup ──────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000308);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 100);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ─── Ambient light ────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x111122, 2));
    const pointLight = new THREE.PointLight(0x4466aa, 1, 20);
    pointLight.position.set(0, 8, 0);
    scene.add(pointLight);

    // ─── Flat Earth plane ─────────────────────────────────────────────────────
    const planeGeo = new THREE.CircleGeometry(10, 64);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x0a1520,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Flat Earth grid lines
    const gridHelper = new THREE.GridHelper(20, 20, 0x112233, 0x0a1a2a);
    scene.add(gridHelper);

    // ─── Parabolic Dome ───────────────────────────────────────────────────────
    // Z = H - (H/R²) * r²  scaled: 1 unit = 1000 miles
    const domeSegments = 48;
    const domePoints: THREE.Vector2[] = [];
    for (let i = 0; i <= domeSegments; i++) {
      const r = (i / domeSegments) * (DOME_RADIUS / 1000);
      const z =
        (DOME_HEIGHT -
          (DOME_HEIGHT / (DOME_RADIUS * DOME_RADIUS)) *
            (r * 1000) *
            (r * 1000)) /
        1000;
      domePoints.push(new THREE.Vector2(r, z));
    }

    const domeGeo = new THREE.LatheGeometry(domePoints, 64);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x0a1830,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      wireframe: false,
    });
    scene.add(new THREE.Mesh(domeGeo, domeMat));

    // Dome wireframe
    const domeWireMat = new THREE.MeshBasicMaterial({
      color: 0x112244,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const domeWire = new THREE.Mesh(domeGeo, domeWireMat);
    scene.add(domeWire);

    // ─── Background stars ─────────────────────────────────────────────────────
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5; // upper hemisphere only
      const r = 9 + Math.random() * 2;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.6,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ─── Polaris — the still center ───────────────────────────────────────────
    // Polaris sits at altitude = observer's latitude, due North (azimuth=0)
    const polarisPos = altAzToDomePoint(observerLatitude, 0, observerLatitude);

    const polarisGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const polarisMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const polarisMesh = new THREE.Mesh(polarisGeo, polarisMat);
    polarisMesh.position.copy(polarisPos);
    scene.add(polarisMesh);

    // Polaris glow
    const glowGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xaaccff,
      transparent: true,
      opacity: 0.3,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.copy(polarisPos);
    scene.add(glowMesh);

    // Polaris label
    const polarisLabel = makeLabel("POLARIS ✦", 0xaaccff);
    polarisLabel.position.copy(polarisPos);
    polarisLabel.position.y += 0.15;
    scene.add(polarisLabel);

    // ─── Royal Stars & Fixed Stars (fixed on dome, do NOT rotate) ─────────────
    // These are the permanent backdrop — they never move
    // Positions given as approximate altitude/azimuth for mid-northern latitudes
    // In the dome model, fixed stars are placed at their sidereal ecliptic positions
    // mapped to the dome surface at a fixed azimuth based on their ecliptic longitude

    const FIXED_STARS = [
      // ── The Four Royal Stars (Watchers of the Sky) ──
      {
        name: "ANTARES",
        subtitle: "Watcher of the West",
        lon: 249.7,
        lat: -4.6,
        color: 0xff3300,
        size: 0.09,
        royal: true,
      },
      {
        name: "ALDEBARAN",
        subtitle: "Watcher of the East",
        lon: 69.7,
        lat: -5.5,
        color: 0xff6600,
        size: 0.09,
        royal: true,
      },
      {
        name: "REGULUS",
        subtitle: "Watcher of the North",
        lon: 149.8,
        lat: 0.5,
        color: 0xffffff,
        size: 0.09,
        royal: true,
      },
      {
        name: "FOMALHAUT",
        subtitle: "Watcher of the South",
        lon: 333.9,
        lat: -21.1,
        color: 0x88ccff,
        size: 0.09,
        royal: true,
      },
      // ── Other Major Fixed Stars ──
      {
        name: "SIRIUS",
        subtitle: "The Brightest Star",
        lon: 104.1,
        lat: -39.6,
        color: 0xaaddff,
        size: 0.07,
        royal: false,
      },
      {
        name: "SPICA",
        subtitle: "Star of the Virgin",
        lon: 203.7,
        lat: -2.1,
        color: 0xbbddff,
        size: 0.07,
        royal: false,
      },
      {
        name: "VEGA",
        subtitle: "The Falling Eagle",
        lon: 284.8,
        lat: 61.7,
        color: 0xeeeeff,
        size: 0.06,
        royal: false,
      },
      {
        name: "ARCTURUS",
        subtitle: "The Bear Guardian",
        lon: 203.6,
        lat: 30.7,
        color: 0xffaa44,
        size: 0.06,
        royal: false,
      },
      {
        name: "ALGOL",
        subtitle: "The Demon Star",
        lon: 55.7,
        lat: 22.4,
        color: 0xff4488,
        size: 0.05,
        royal: false,
      },
      {
        name: "PLEIADES",
        subtitle: "The Seven Sisters",
        lon: 59.7,
        lat: 4.0,
        color: 0xaaccff,
        size: 0.05,
        royal: false,
      },
      {
        name: "POLLUX",
        subtitle: "The Immortal Twin",
        lon: 112.6,
        lat: 6.7,
        color: 0xffcc88,
        size: 0.05,
        royal: false,
      },
      {
        name: "DENEB",
        subtitle: "Tail of the Swan",
        lon: 324.9,
        lat: 60.2,
        color: 0xffffff,
        size: 0.05,
        royal: false,
      },
    ];

    // Fixed star group — does NOT rotate (stays fixed on dome)
    const fixedStarGroup = new THREE.Group();
    scene.add(fixedStarGroup);

    for (const star of FIXED_STARS) {
      // Map ecliptic longitude to azimuth on dome
      // Ecliptic lon 0° = East, increases counterclockwise when viewed from above
      // Convert to compass azimuth: 0=N, 90=E, 180=S, 270=W
      const azimuth = (90 - star.lon + 360) % 360;
      // Map ecliptic latitude to altitude (higher lat = higher on dome)
      const altitude = 30 + star.lat * 0.5 + (observerLatitude - 35) * 0.3;

      const pos = altAzToDomePoint(
        Math.max(5, altitude),
        azimuth,
        observerLatitude
      );

      if (star.royal) {
        // Royal Stars get a larger sphere + double glow ring
        const geo = new THREE.SphereGeometry(star.size, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: star.color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        fixedStarGroup.add(mesh);

        // Inner glow
        const g1 = new THREE.Mesh(
          new THREE.SphereGeometry(star.size * 2, 16, 16),
          new THREE.MeshBasicMaterial({
            color: star.color,
            transparent: true,
            opacity: 0.25,
          })
        );
        g1.position.copy(pos);
        fixedStarGroup.add(g1);

        // Outer glow ring
        const g2 = new THREE.Mesh(
          new THREE.SphereGeometry(star.size * 3.5, 16, 16),
          new THREE.MeshBasicMaterial({
            color: star.color,
            transparent: true,
            opacity: 0.08,
          })
        );
        g2.position.copy(pos);
        fixedStarGroup.add(g2);

        // Royal label with subtitle
        const label = makeLabel(`✦ ${star.name}`, star.color);
        label.position.copy(pos);
        label.position.y += 0.18;
        fixedStarGroup.add(label);

        const subLabel = makeLabel(star.subtitle, 0x888866);
        subLabel.position.copy(pos);
        subLabel.position.y += 0.06;
        fixedStarGroup.add(subLabel);
      } else {
        // Regular fixed stars — smaller, dimmer
        const geo = new THREE.SphereGeometry(star.size, 12, 12);
        const mat = new THREE.MeshBasicMaterial({ color: star.color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        fixedStarGroup.add(mesh);

        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(star.size * 2, 12, 12),
          new THREE.MeshBasicMaterial({
            color: star.color,
            transparent: true,
            opacity: 0.15,
          })
        );
        glow.position.copy(pos);
        fixedStarGroup.add(glow);

        const label = makeLabel(star.name, star.color);
        label.position.copy(pos);
        label.position.y += 0.12;
        fixedStarGroup.add(label);
      }
    }

    // ─── Planet Group (rotates around Polaris axis) ────────────────────────────
    const planetGroup = new THREE.Group();
    planetGroupRef.current = planetGroup;
    scene.add(planetGroup);

    // Add planets to dome
    for (const planet of planets) {
      if (planet.altitude < -10) continue; // below horizon, skip

      const pos = altAzToDomePoint(
        planet.altitude,
        planet.azimuth,
        observerLatitude
      );
      const color = PLANET_COLORS[planet.name] ?? 0xffffff;

      // Planet sphere
      const geo = new THREE.SphereGeometry(0.04, 12, 12);
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      planetGroup.add(mesh);

      // Glow
      const glowG = new THREE.SphereGeometry(0.08, 12, 12);
      const glowM = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.2,
      });
      const glow = new THREE.Mesh(glowG, glowM);
      glow.position.copy(pos);
      planetGroup.add(glow);

      // Label
      const rx = planet.retrograde ? " ℞" : "";
      const label = makeLabel(`${planet.symbol} ${planet.name}${rx}`, color);
      label.position.copy(pos);
      label.position.y += 0.12;
      planetGroup.add(label);
    }

    // ─── North Pole marker ────────────────────────────────────────────────────
    const poleGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.5, 8);
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x334455 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 0.25, 0);
    scene.add(pole);

    // ─── Animation loop ───────────────────────────────────────────────────────
    // Slow diurnal rotation around the Polaris axis (vertical)
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      rotationRef.current += 0.0005; // slow rotation
      if (planetGroupRef.current) {
        planetGroupRef.current.rotation.y = rotationRef.current;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (
        mountRef.current &&
        renderer.domElement.parentNode === mountRef.current
      ) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [planets, observerLatitude, width, height]);

  return (
    <div
      ref={mountRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--rim)",
        position: "relative",
      }}
    />
  );
}

// ─── Canvas label helper ──────────────────────────────────────────────────────

function makeLabel(text: string, color: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = "bold 18px Cinzel, serif";
  ctx.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
  ctx.textAlign = "center";
  ctx.fillText(text, 128, 40);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.2, 0.3, 1);
  return sprite;
}
