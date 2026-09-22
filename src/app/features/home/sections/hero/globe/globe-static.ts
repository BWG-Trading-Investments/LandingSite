import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ARC_ROUTES, type GeoPoint, sampleLandPoints, toVector } from './world-map';

/**
 * The globe as inline SVG — no canvas, no WebGL, no image file.
 *
 * This is what renders on low-core machines, under reduced motion, and whenever
 * a WebGL context cannot be created. It is also what the server prerenders, so
 * the hero is never an empty box in the static HTML.
 *
 * It mirrors the WebGL globe's construction: a filled dark disc, a gold rim, a
 * dense landmass with a brighter minority picked out as city lights, and the
 * same network arcs with glowing endpoints. Parity of look, not of dot count.
 *
 * Everything below is pure arithmetic with no DOM access, which is what lets it
 * run in Node during prerender. It is computed once at module scope rather than
 * per instance: the geometry never changes, and there is only ever one globe.
 */

/** Projection radius, in user units. The viewBox is sized around it. */
const R = 100;

/** Longitude facing the viewer. 15°E puts Africa and Europe on the front face. */
const CENTER_LON = 15;

/** Tip of the north pole toward the viewer, so latitude rings read as ellipses. */
const TILT = (-18 * Math.PI) / 180;

/**
 * Candidates tested against the landmask.
 *
 * Bounded by page weight, not by taste: the SVG is inlined into the prerendered
 * HTML, so every dot is bytes on the wire. At roughly 0.22 front-facing dots per
 * sample and 15 bytes per dot, this lands near 23 kB of path data.
 */
const LAND_SAMPLES = 9000;

/** Every Nth land dot becomes a city light. 7 gives ~14%, matching the WebGL globe. */
const CITY_EVERY = 7;

interface Projected {
  readonly x: number;
  readonly y: number;
  /** Positive is the hemisphere facing the viewer. */
  readonly z: number;
}

function project(lat: number, lon: number, radius = R): Projected {
  // toVector puts -90° longitude at the front, so shifting by the centre plus 90
  // brings CENTER_LON round to face the viewer.
  const v = toVector(lat, lon - CENTER_LON - 90, radius);
  const ct = Math.cos(TILT);
  const st = Math.sin(TILT);

  return {
    x: v.x,
    // SVG's y axis points down, hence the negation.
    y: -(v.y * ct - v.z * st),
    z: v.y * st + v.z * ct,
  };
}

const round = (n: number): number => Math.round(n * 10) / 10;

/**
 * Turn a sampled curve into path data, breaking it wherever it passes behind the
 * globe. Without the break, an arc would be drawn straight across the disc.
 */
function pathFromCurve(points: readonly Projected[]): string {
  let data = '';
  let drawing = false;

  for (const point of points) {
    if (point.z <= 0) {
      drawing = false;
      continue;
    }
    data += `${drawing ? 'L' : 'M'}${round(point.x)} ${round(point.y)}`;
    drawing = true;
  }

  return data;
}

/**
 * Land dots, as path data rather than as `<circle>` elements.
 *
 * A zero-length segment with a round linecap paints a dot in about 15 bytes;
 * the equivalent `<circle>` costs nearly 100 once Angular's encapsulation
 * attribute is added to it. That difference is what allows this many dots to
 * live in the prerendered HTML at all.
 *
 * The dim dots are split into three depth bands so the disc still darkens toward
 * the limb without carrying a per-dot opacity attribute.
 */
const front = sampleLandPoints(LAND_SAMPLES)
  .map(({ lat, lon }) => project(lat, lon))
  .filter((p) => p.z > 0);

const dotBands: string[] = ['', '', ''];
let cityDots = '';

front.forEach((p, index) => {
  const segment = `M${round(p.x)} ${round(p.y)}h.01`;

  if (index % CITY_EVERY === 0) {
    cityDots += segment;
    return;
  }

  const depth = p.z / R;
  const band = depth < 0.35 ? 0 : depth < 0.7 ? 1 : 2;
  dotBands[band] += segment;
});

/** Latitude rings and meridians, kept faint — the landmass is the subject. */
const RINGS: readonly string[] = [
  ...[-60, -30, 0, 30, 60].map((lat) =>
    pathFromCurve(Array.from({ length: 181 }, (_, i) => project(lat, -180 + i * 2))),
  ),
  ...Array.from({ length: 12 }, (_, m) =>
    pathFromCurve(Array.from({ length: 181 }, (_, i) => project(-90 + i, -180 + m * 30))),
  ),
].filter((d) => d.length > 0);

/**
 * Network arcs, lifted off the surface so they read as connections rather than
 * as more grid lines. Matches the curve the WebGL globe draws.
 */
function arcPath(from: GeoPoint, to: GeoPoint): string {
  const steps = 48;
  const points: Projected[] = [];
  const a = toVector(from.lat, from.lon - CENTER_LON - 90);
  const b = toVector(to.lat, to.lon - CENTER_LON - 90);
  const ct = Math.cos(TILT);
  const st = Math.sin(TILT);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Linear interpolation renormalised back onto the sphere approximates the
    // great circle closely enough at this scale, then a sine bump lifts it.
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const z = a.z + (b.z - a.z) * t;
    const length = Math.hypot(x, y, z) || 1;
    const lift = R * (1 + 0.17 * Math.sin(Math.PI * t));

    const py = (y / length) * lift;
    const pz = (z / length) * lift;
    points.push({ x: (x / length) * lift, y: -(py * ct - pz * st), z: py * st + pz * ct });
  }

  return pathFromCurve(points);
}

const ROUTES = ARC_ROUTES.slice(0, 6);

const ARCS: readonly string[] = ROUTES.map(([from, to]) => arcPath(from, to)).filter(
  (d) => d.length > 0,
);

/** A glowing node at every arc endpoint that faces the viewer. */
const NODES: readonly { x: number; y: number }[] = ROUTES.flatMap(([from, to]) => [from, to])
  .map((point) => project(point.lat, point.lon, R * 1.004))
  .filter((p) => p.z > 0)
  .map((p) => ({ x: round(p.x), y: round(p.y) }));

@Component({
  selector: 'bwg-globe-static',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="globe"
      viewBox="-118 -118 236 236"
      role="img"
      aria-label="A globe of connected markets"
    >
      <defs>
        <radialGradient id="bwgGlobeBody" cx="36%" cy="66%" r="62%">
          <stop class="globe__body-core" offset="0%" />
          <stop class="globe__body-edge" offset="100%" />
        </radialGradient>
        <radialGradient id="bwgGlobeRim" cx="50%" cy="50%" r="50%">
          <stop class="globe__rim-out" offset="86%" />
          <stop class="globe__rim-peak" offset="94.3%" />
          <stop class="globe__rim-out" offset="100%" />
        </radialGradient>
      </defs>

      <!-- The solid body. Everything below it is drawn on the facing hemisphere
           only, so the disc occludes the far side exactly as the mesh does. -->
      <circle cx="0" cy="0" [attr.r]="radius" fill="url(#bwgGlobeBody)" />
      <circle cx="0" cy="0" [attr.r]="rimRadius" fill="url(#bwgGlobeRim)" />

      @for (d of rings; track $index) {
        <path class="globe__ring" [attr.d]="d" />
      }

      @for (d of dots; track $index) {
        <path class="globe__dot" [attr.d]="d" [attr.opacity]="dotOpacity[$index]" />
      }

      <path class="globe__city" [attr.d]="cities" />

      @for (d of arcs; track $index) {
        <path class="globe__arc" [attr.d]="d" />
      }

      @for (node of nodes; track $index) {
        <circle class="globe__node" [attr.cx]="node.x" [attr.cy]="node.y" r="1.6" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .globe {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    // Gradient stops carry colour as a CSS property rather than a presentation
    // attribute, because var() does not resolve in presentation attributes.
    // Offset toward the lower-left, matching where the WebGL key light sits, so
    // the flat disc still shows a terminator.
    .globe__body-core {
      stop-color: var(--bwg-globe-body-lit);
    }

    .globe__body-edge {
      stop-color: var(--bwg-globe-body);
    }

    .globe__rim-peak {
      stop-color: var(--bwg-globe-atmosphere);
      stop-opacity: 0.7;
    }

    .globe__rim-out {
      stop-color: var(--bwg-globe-atmosphere);
      stop-opacity: 0;
    }

    .globe__ring {
      fill: none;
      stroke: var(--bwg-gold-deep);
      stroke-width: 0.4;
      opacity: 0.22;
    }

    // Zero-length segments painted as dots by the round linecap.
    .globe__dot {
      fill: none;
      stroke: var(--bwg-globe-land);
      stroke-width: 1.3;
      stroke-linecap: round;
    }

    .globe__city {
      fill: none;
      stroke: var(--bwg-globe-city);
      stroke-width: 1.8;
      stroke-linecap: round;
    }

    .globe__arc {
      fill: none;
      stroke: var(--bwg-globe-arc);
      stroke-width: 0.7;
      stroke-linecap: round;
      opacity: 0.6;
    }

    .globe__node {
      fill: var(--bwg-globe-node);
      stroke: none;
      opacity: 0.9;
    }
  `,
})
export class GlobeStatic {
  protected readonly radius = R;
  protected readonly rimRadius = R * 1.06;
  protected readonly rings = RINGS;
  protected readonly dots = dotBands;
  /** Limb darkening, one value per depth band rather than per dot. */
  protected readonly dotOpacity = [0.4, 0.65, 0.9];
  protected readonly cities = cityDots;
  protected readonly arcs = ARCS;
  protected readonly nodes = NODES;
}
