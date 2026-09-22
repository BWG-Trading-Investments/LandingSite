import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ARC_ROUTES, type GeoPoint, sampleLandPoints, toVector } from './world-map';

/**
 * The globe as inline SVG — no canvas, no WebGL, no image file.
 *
 * This is what the server prerenders and what the browser therefore shows for
 * its first render, so the hero is never an empty box in the static HTML and
 * hydration has the same DOM to match. The canvas replaces it immediately
 * afterwards on every device; it stays only where a WebGL context cannot be
 * created at all. Nothing about the machine decides this any more — no core
 * count, no motion preference — so this has to hold up as the globe, not as a
 * consolation for one.
 *
 * It is a copy of the WebGL render, not a diagram of the same planet: the same
 * filled disc and gold rim, land at the size the points are on screen there —
 * small enough that no map can be read off it, only a texture where they crowd
 * toward the limb — a brighter minority as city lights, and the same network
 * arcs, drawn front and back because the WebGL arcs ignore depth. It carries no
 * graticule, because that globe has none.
 *
 * Every strength here is stated per theme, mirroring DARK_TUNING and
 * LIGHT_TUNING in globe.ts: a pale sphere takes a hairline rim where a dark one
 * takes a glow.
 *
 * Everything below is pure arithmetic with no DOM access, which is what lets it
 * run in Node during prerender. It is computed once at module scope rather than
 * per instance: the geometry never changes, and there is only ever one globe.
 */

/** Projection radius, in user units. The viewBox is sized around it. */
const R = 100;

/** Longitude facing the viewer. 15°E puts Africa and Europe on the front face. */
const CENTER_LON = 15;

/** Tip of the north pole toward the viewer, matching AXIAL_TILT in the scene. */
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

/**
 * Dot width, in the same user units the radius is in.
 *
 * The WebGL points are 0.011 world units on a sphere of radius 1 — 1.1 units
 * here — but they are drawn through a soft sprite with alphaTest 0.35, so only
 * the core of each one reaches the canvas and what lands is about half of that,
 * a device pixel or so. Matching the nominal size instead is what made this
 * globe legible as a map when the other one is a texture.
 */
const DOT_WIDTH = 0.4;

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
 * Turn a sampled curve into path data, front and back.
 *
 * Nothing is broken where the curve passes behind the globe: the WebGL arcs are
 * drawn with depthTest off and a render order above the body, so the far side of
 * every arc shows through the sphere and the network reads as a cage around it
 * rather than as five strokes on its face. Drawing only the near half here was
 * the one place the two globes disagreed about what the network is.
 */
function pathFromCurve(points: readonly Projected[]): string {
  let data = '';

  for (const point of points) {
    data += `${data ? 'L' : 'M'}${round(point.x)} ${round(point.y)}`;
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
 * One layer, at one opacity. The three depth bands this used to carry were
 * standing in for limb darkening, which the WebGL globe does not do either — its
 * points are unlit and all the same colour, and what makes the land show on the
 * shaded side and vanish on the lit one is the body gradient underneath, which
 * this globe has as well.
 */
const front = sampleLandPoints(LAND_SAMPLES)
  .map(({ lat, lon }) => project(lat, lon))
  .filter((p) => p.z > 0);

let landDots = '';
let cityDots = '';

front.forEach((p, index) => {
  const segment = `M${round(p.x)} ${round(p.y)}h.01`;

  if (index % CITY_EVERY === 0) {
    cityDots += segment;
    return;
  }

  landDots += segment;
});

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
      viewBox="-142 -142 284 284"
      role="img"
      aria-label="A globe of connected markets"
    >
      <defs>
        <radialGradient id="bwgGlobeBody" cx="36%" cy="66%" r="62%">
          <stop class="globe__body-core" offset="0%" />
          <stop class="globe__body-mid" offset="60%" />
          <stop class="globe__body-edge" offset="100%" />
        </radialGradient>
        <radialGradient id="bwgGlobeRim" cx="50%" cy="50%" r="50%">
          <stop class="globe__rim-out" offset="86%" />
          <stop class="globe__rim-peak" offset="94.3%" />
          <stop class="globe__rim-out" offset="100%" />
        </radialGradient>

        <!-- The wide outer haze, the shell at 1.16 in the WebGL scene. It is
             what sets the framing there, so it is here too. -->
        <radialGradient id="bwgGlobeHaze" cx="50%" cy="50%" r="50%">
          <stop class="globe__haze-out" offset="62%" />
          <stop class="globe__haze-peak" offset="83%" />
          <stop class="globe__haze-out" offset="100%" />
        </radialGradient>

        <!-- A marker on the network. The WebGL draws its endpoint nodes
             additively in the node colour, which over a body this bright
             disappears — hold the render still and the endpoints are not
             there. What the moving render does show along the arcs is the
             pulses, as small soft dark dots. This has no pulses to travel,
             so it puts that same dot on the endpoints and the network reads
             the way the render reads. -->
        <radialGradient id="bwgGlobeNode" cx="50%" cy="50%" r="50%">
          <stop class="globe__node-core" offset="0%" />
          <stop class="globe__node-out" offset="100%" />
        </radialGradient>
      </defs>

      <!-- The solid body. The land below it is drawn on the facing hemisphere
           only, so the disc occludes the far side exactly as the mesh does; the
           network above it is not, because the WebGL network is not either. -->
      <circle cx="0" cy="0" [attr.r]="radius" fill="url(#bwgGlobeBody)" />
      <circle cx="0" cy="0" [attr.r]="hazeRadius" fill="url(#bwgGlobeHaze)" />
      <circle cx="0" cy="0" [attr.r]="rimRadius" fill="url(#bwgGlobeRim)" />

      <path class="globe__dot" [attr.d]="land" />

      <!-- The city lights, twice off one path: the point, and a wide faint halo
           around it, which is what the two additive passes do over there. -->
      <path class="globe__city-halo" [attr.d]="cities" />
      <path class="globe__city" [attr.d]="cities" />

      @for (d of arcs; track $index) {
        <path class="globe__arc" [attr.d]="d" />
      }

      @for (node of nodes; track $index) {
        <circle class="globe__node" [attr.cx]="node.x" [attr.cy]="node.y" r="2.4" />
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
    //
    // These two are literals, and the only ones in the file. Every other colour
    // here is a token, because a token is what the material is; but what the
    // canvas shows is not its material — a #12151c albedo under a key light of
    // 2.6 renders as warm ivory, and a fallback built from the token drew a dark
    // navy ball where the other globe has a bright one. The values are read off
    // the render: centre and terminator, per theme — and the frame with them:
    // the canvas gives its disc 71% of the box, so the viewBox is the width
    // that gives this one the same.
    .globe__body-core {
      stop-color: #faeed8;
    }

    // Three stops, not two: a sphere under a key light holds most of its
    // brightness across the middle and gives it up quickly near the limb, and
    // a straight ramp between two colours does the opposite.
    .globe__body-mid {
      stop-color: #e4d9c3;
    }

    .globe__body-edge {
      stop-color: #bcb29e;
    }

    // Rim and haze carry the dark scene's strengths. The light theme takes a
    // fraction of each, below: a pale sphere with a dark one's rim reads as a
    // dish seen face-on rather than as a planet.
    .globe__rim-peak {
      stop-color: var(--bwg-globe-atmosphere);
      stop-opacity: 0.12;
    }

    .globe__rim-out {
      stop-color: var(--bwg-globe-atmosphere);
      stop-opacity: 0;
    }

    .globe__haze-peak {
      stop-color: var(--bwg-globe-haze);
      stop-opacity: 0.045;
    }

    .globe__haze-out {
      stop-color: var(--bwg-globe-haze);
      stop-opacity: 0;
    }

    // Zero-length segments painted as dots by the round linecap.
    //
    // Land and city colours are literals for the same reason the body stops
    // are: the token is the material, and the canvas shows the material lit.
    // The themes hold those materials far apart — --bwg-globe-land is #d0a862
    // against #6b5227, --bwg-globe-city #f0d494 against #3d2c12 — and under
    // its own lighting the canvas closes the gap: both renders speckle the
    // same, within a point or two of each other. A flat SVG has no lighting to
    // close it with, so it carries one closed palette for both themes.
    .globe__dot {
      fill: none;
      stroke: #b69158;
      stroke-width: 0.4;
      stroke-linecap: round;
      opacity: 1;
    }

    .globe__city {
      fill: none;
      stroke: #6a5530;
      stroke-width: 0.5;
      stroke-linecap: round;
    }

    .globe__city-halo {
      fill: none;
      stroke: #6a5530;
      stroke-width: 1.5;
      stroke-linecap: round;
      opacity: 0.15;
    }

    .globe__arc {
      fill: none;
      stroke: var(--bwg-globe-arc);
      stroke-width: 0.7;
      stroke-linecap: round;
      opacity: 0.6;
    }

    .globe__node {
      fill: url(#bwgGlobeNode);
      stroke: none;
      opacity: 0.9;
    }

    .globe__node-core {
      stop-color: #594424;
    }

    .globe__node-out {
      stop-color: #594424;
      stop-opacity: 0;
    }

    // The light theme's share of each, from LIGHT_TUNING: atmosphere 0.28
    // against 1.35, haze 0.05 against 0.32, the city halo 0.1 against 0.15, and
    // a node a shade softer.
    :host-context([data-theme='light']) {
      .globe__body-core {
        stop-color: #f8ecd6;
      }

      .globe__body-mid {
        stop-color: #ece1cb;
      }

      .globe__body-edge {
        stop-color: #b8ae99;
      }

      .globe__rim-peak {
        stop-opacity: 0.05;
      }

      .globe__haze-peak {
        stop-opacity: 0.02;
      }

      .globe__city-halo {
        opacity: 0.1;
      }

      .globe__dot {
        opacity: 0.7;
      }

      .globe__city {
        opacity: 0.6;
      }

      .globe__arc {
        opacity: 0.55;
      }

      .globe__node {
        opacity: 0.7;
      }
    }
  `,
})
export class GlobeStatic {
  protected readonly radius = R;
  /** The atmosphere and haze shells, at the radii the WebGL scene uses. */
  protected readonly rimRadius = R * 1.06;
  protected readonly hazeRadius = R * 1.16;
  protected readonly land = landDots;
  protected readonly cities = cityDots;
  protected readonly arcs = ARCS;
  protected readonly nodes = NODES;
}
