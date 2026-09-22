import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type OnDestroy,
  afterNextRender,
  effect,
  inject,
  output,
  viewChild,
} from '@angular/core';

import { ThemeService } from '../../../../../core/theme.service';

import { ARC_ROUTES, type GeoPoint, sampleLandPoints, toVector } from './world-map';

// Types only — erased at compile time, so this does NOT pull Three.js into the
// bundle or into the prerender. The library itself arrives via the dynamic
// import inside start(), which only ever runs in a browser.
import type * as THREE from 'three';

/** Radians per second. Slow enough to read as a rotating planet, not a spinner. */
const ROTATION_SPEED = 0.05;

/** Maximum cursor parallax, in CSS pixels. */
const PARALLAX_PX = 8;

/**
 * What the arcs hold at when nothing is animating.
 *
 * They breathe between nothing and 0.95 while the loop runs; stopped at either
 * end the network would read as either missing or shouting, so the still frame
 * takes the middle of the swell.
 */
const STILL_ARC_OPACITY = 0.6;

/** Axial tilt, matching the SVG fallback so the two globes look like one globe. */
const AXIAL_TILT = -0.31;

/** Candidates tested against the landmask. Roughly a third come back as land. */
const LAND_SAMPLES = 24000;

/** Share of land points promoted to the brighter "city lights" layer. */
const CITY_SHARE = 0.15;

/** Land sits fractionally above the body so it is occluded by it, not inside it. */
const LAND_RADIUS = 1.002;

/** Atmosphere shell radius. The visible rim is the annulus outside the body. */
const ATMOSPHERE_RADIUS = 1.06;

/** The wide outer haze. This is the outermost geometry, so it sets the framing. */
const HAZE_RADIUS = 1.16;

/** Vertical field of view, in degrees. */
const FOV = 34;

/**
 * Camera distance, chosen so the whole globe fits the stage rather than being
 * clipped by it.
 *
 * The visible extent at the origin is 2 * tan(FOV/2) * distance. The outermost
 * geometry is the haze shell, spanning 2 * 1.16 = 2.32 world units, and the
 * stage is always square (aspect-ratio: 1), so the same number bounds both axes.
 *
 *   2 * tan(17deg) * 4.75 = 2.90 world units visible
 *   2.90 - 2.32 = 0.58, i.e. 0.29 of clear margin on every side
 *
 * At 3.25 the visible extent was 1.99 against the same 2.32 — which is exactly
 * why the globe was being cut off top, right and bottom.
 */
const CAMERA_DISTANCE = 4.75;

/**
 * The numbers that cannot come from a colour token.
 *
 * Light mode is not the dark scene with different colours in it: an ivory
 * sphere lit at 2.6 blows out to flat white, and every additive glow — which by
 * definition can only brighten — disappears into an ivory page. Intensities and
 * strengths therefore carry a value per theme, and the additive passes switch
 * to normal blending so the same gold darkens the page instead of lightening it.
 */
interface Tuning {
  readonly keyIntensity: number;
  readonly ambientIntensity: number;
  readonly atmosphereStrength: number;
  readonly hazeStrength: number;
  readonly cityHalo: number;
  readonly nodeOpacity: number;
}

const DARK_TUNING: Tuning = {
  keyIntensity: 2.6,
  ambientIntensity: 0.55,
  atmosphereStrength: 1.35,
  hazeStrength: 0.32,
  cityHalo: 0.15,
  nodeOpacity: 0.9,
};

const LIGHT_TUNING: Tuning = {
  // Less key, more fill. The terminator still has to be there — it is what makes
  // the disc read as a sphere — but the shaded side has to stay light enough to
  // look like ivory in shadow rather than a hole cut in the page.
  // Ambient light is multiplicative, so on a light ground the fill sets the
  // floor and the key only adds the last stretch. A dark-theme-shaped split —
  // dim fill, strong key — drags a white albedo down to khaki and then cannot
  // lift it back, which is exactly what a mid-grey planet looked like. Here the
  // fill carries the sphere to just under the page colour and the key lifts the
  // lit face the rest of the way, so the form comes from a shallow gradient
  // rather than from darkness.
  //
  // The numbers are not comparable to the dark ones and are not meant to be.
  // Three applies irradiance without the legacy factor of PI, so an intensity
  // here buys about a third of what it reads as, and the dark scene tuned its
  // own values empirically against a near-black albedo. These were measured off
  // the rendered canvas against the page colour.
  keyIntensity: 1.55,
  ambientIntensity: 1.85,
  // A rim that only has to draw the edge, not glow. Any more and a pale sphere
  // acquires a heavy ring and starts reading as a dish seen face-on.
  atmosphereStrength: 0.28,
  hazeStrength: 0.05,
  cityHalo: 0.1,
  nodeOpacity: 0.85,
};

interface Palette {
  readonly body: string;
  readonly light: string;
  readonly ambient: string;
  readonly haze: string;
  readonly land: string;
  readonly city: string;
  readonly atmosphere: string;
  readonly arc: string;
  readonly node: string;
}

/**
 * Mirrors the --bwg-globe-* tokens in _tokens.scss, and is the one place in a
 * component where a colour is written as a literal.
 *
 * It is only reached if getComputedStyle hands back an empty string, which means
 * the stylesheet has not applied — the globe loads after first paint, so that
 * should not happen. The alternative to duplicating the values is rendering an
 * uncoloured globe when it does. _tokens.scss remains the source of truth; if a
 * value changes there, change it here too.
 */
const FALLBACK_PALETTE: Palette = {
  body: '#12151c',
  light: '#ffd9a0',
  ambient: '#2a3140',
  haze: '#c9a15b',
  land: '#d0a862',
  city: '#f0d494',
  atmosphere: '#c9a15b',
  arc: '#d9b877',
  node: '#f4e2b8',
};

/**
 * The fresnel shell, used for both the atmosphere and the wider haze.
 *
 * Drawn on the inside of a sphere larger than the body. Everything within the
 * body's silhouette is depth-occluded, so the only part that survives is the
 * annulus around the limb: brightest where it meets the planet's edge, falling
 * off outward. That is the lit horizon, for one extra draw call and no
 * postprocessing.
 *
 * uPower controls how tightly the falloff hugs the limb — lower is wider.
 */
const SHELL_VERTEX = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SHELL_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uStrength;
  varying vec3 vNormal;
  void main() {
    float rim = 0.78 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
    float intensity = clamp(pow(max(rim, 0.0), uPower), 0.0, 1.0) * uStrength;
    gl_FragColor = vec4(uColor * intensity, intensity);
  }
`;

/**
 * The globe, in WebGL.
 *
 * Loaded lazily by the hero after first paint, on every device. It used to be
 * gated on width, core count and the motion preference, and each of those turned
 * out to be a way of showing some readers a different globe rather than the same
 * one: WebKit reports four cores or fewer whatever the hardware, so every iPhone
 * and iPad was getting the SVG fallback and its readable map. If a context
 * cannot be created it emits `failed` and the hero falls back to that globe,
 * which is now the only thing the fallback is for.
 *
 * Reduced motion is honoured here rather than by swapping the picture: the loop
 * does not run, nothing rotates, no pulse travels and the pointer is ignored —
 * see settle(). Frames are drawn on start, on resize and on a theme change.
 *
 * The entrance animation is deliberately NOT here: the hero transforms the
 * wrapping element in CSS. Moving the camera instead would cost more and would
 * change the scene's framing mid-flight.
 */
@Component({
  selector: 'bwg-globe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas aria-hidden="true"></canvas>`,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class Globe implements OnDestroy {
  /** Emitted when WebGL is unavailable, so the hero can swap in the SVG globe. */
  readonly failed = output<void>();

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly document = inject(DOCUMENT);
  private readonly themeService = inject(ThemeService);

  /** The library itself, kept so a theme change can reach its blending enums. */
  private three: typeof THREE | null = null;

  /**
   * One entry per material that owns a colour, registered by whichever build
   * method creates it.
   *
   * The alternative is a field for every material and one long applyTheme that
   * has to be kept in step with five build methods. Here each material states
   * its own theme behaviour next to its construction, which is the only place
   * that knows what the material is for.
   */
  private readonly themed: ((palette: Palette, light: boolean, lib: typeof THREE) => void)[] = [];

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private root: THREE.Group | null = null;

  private readonly disposables: { dispose(): void }[] = [];
  private readonly arcs: { material: THREE.LineBasicMaterial; phase: number }[] = [];

  /** One travelling pulse per arc, riding its precomputed curve. */
  private readonly pulses: {
    sprite: THREE.Sprite;
    material: THREE.SpriteMaterial;
    path: THREE.Vector3[];
    phase: number;
  }[] = [];

  private palette: Palette = FALLBACK_PALETTE;

  /** One soft round dot, shared by the land, node and pulse materials. */
  private dotTexture: THREE.Texture | null = null;

  private resizeObserver: ResizeObserver | null = null;
  private viewportObserver: IntersectionObserver | null = null;
  private detachListeners: (() => void) | null = null;

  private inViewport = true;
  private running = false;
  private destroyed = false;

  /**
   * Whether the reader has asked for less motion.
   *
   * Watched rather than read once: the preference can be turned on mid-session,
   * and when it is, the globe has to stop where it is rather than carry on until
   * the next reload.
   */
  private reduced = false;

  private lastFrame = 0;
  private elapsed = 0;

  /** Parallax, in world units: where the globe is, and where it is heading. */
  private offsetX = 0;
  private offsetY = 0;
  private targetX = 0;
  private targetY = 0;
  private pointer = { x: 0, y: 0 };

  constructor() {
    // afterNextRender never runs during prerender, so Node never reaches any of
    // the DOM or WebGL below.
    afterNextRender(() => void this.start());

    // A canvas cannot use var(), so a theme change has to be pushed into the
    // materials by hand. The tokens are re-read on every change rather than
    // cached per theme, so _tokens.scss stays the one place a globe colour is
    // written. No-ops until the scene exists, and never runs on the server.
    effect(() => {
      this.themeService.theme();
      this.applyTheme();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.teardown();
  }

  private async start(): Promise<void> {
    const canvas = this.canvasRef().nativeElement;

    let three: typeof THREE;
    try {
      three = await import('three');
    } catch {
      this.fail();
      return;
    }

    // The import is async; the hero may have swapped us out in the meantime.
    if (this.destroyed) {
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new three.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      // Context creation fails on blocklisted drivers and when too many contexts
      // are already live. Never leave an empty box behind.
      this.fail();
      return;
    }

    // Capped at 2: beyond that the cost is real and the difference is not.
    renderer.setPixelRatio(Math.min(2, this.document.defaultView?.devicePixelRatio ?? 1));
    renderer.setClearAlpha(0);
    this.renderer = renderer;
    this.three = three;

    this.readPalette();

    this.scene = new three.Scene();
    // Near and far are pulled tight around the geometry. A 0.1 near plane spends
    // almost all of the depth buffer on empty space, and the land points sit only
    // 0.002 above the body — they z-fight without this.
    this.camera = new three.PerspectiveCamera(
      FOV,
      1,
      CAMERA_DISTANCE - HAZE_RADIUS - 0.5,
      CAMERA_DISTANCE + HAZE_RADIUS + 0.5,
    );
    this.camera.position.set(0, 0, CAMERA_DISTANCE);

    this.root = new three.Group();
    this.root.rotation.x = AXIAL_TILT;
    this.scene.add(this.root);

    this.dotTexture = this.createDotTexture(three);
    if (this.dotTexture) {
      this.disposables.push(this.dotTexture);
    }

    this.buildLighting(three);
    this.buildBody(three);
    this.buildShells(three);
    this.buildLand(three);
    this.buildNetwork(three);

    // The build above uses the dark tuning throughout. If the reader arrived on
    // the light palette this is what corrects it, in one pass, before the first
    // frame is drawn.
    this.applyTheme();

    this.resize();
    this.watchResize();
    this.watchVisibility();
    this.watchPointer();
    this.watchMotionPreference();
    this.resume();
  }

  /**
   * Read the globe's colours from the design tokens.
   *
   * The canvas cannot use var(), so the values are lifted off the document
   * element once at startup. This keeps _tokens.scss the single source of colour
   * for the WebGL globe and the SVG fallback alike.
   */
  private readPalette(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    const styles = view.getComputedStyle(this.document.documentElement);
    const read = (name: string, fallback: string): string =>
      styles.getPropertyValue(name).trim() || fallback;

    this.palette = {
      body: read('--bwg-globe-body', FALLBACK_PALETTE.body),
      light: read('--bwg-globe-light', FALLBACK_PALETTE.light),
      ambient: read('--bwg-globe-ambient', FALLBACK_PALETTE.ambient),
      haze: read('--bwg-globe-haze', FALLBACK_PALETTE.haze),
      land: read('--bwg-globe-land', FALLBACK_PALETTE.land),
      city: read('--bwg-globe-city', FALLBACK_PALETTE.city),
      atmosphere: read('--bwg-globe-atmosphere', FALLBACK_PALETTE.atmosphere),
      arc: read('--bwg-globe-arc', FALLBACK_PALETTE.arc),
      node: read('--bwg-globe-node', FALLBACK_PALETTE.node),
    };
  }

  /**
   * Push the current theme through every material that owns a colour.
   *
   * Cheap enough to run on every change: it is a few dozen colour writes and no
   * geometry, no shader recompile and no reallocation. Blending and
   * premultipliedAlpha are renderer state rather than program state, so none of
   * this needs needsUpdate — flipping them does not cost a recompile.
   *
   * Safe to call before the scene exists and on the server, where it returns at
   * the first line.
   */
  private applyTheme(): void {
    const three = this.three;
    if (!three || this.destroyed) {
      return;
    }

    this.readPalette();
    const light = this.themeService.theme() === 'light';

    for (const apply of this.themed) {
      apply(this.palette, light, three);
    }

    // The loop is stopped whenever the hero is off screen, the tab is hidden,
    // or the reader has asked for less motion. Draw one frame so the canvas is
    // already correct the next time it is looked at.
    if (!this.running) {
      this.renderOnce();
    }
  }

  // ---------------------------------------------------------------------------
  // Scene
  // ---------------------------------------------------------------------------

  /**
   * A warm gold key light from the front-lower-left, plus a low cool fill.
   *
   * The key is deliberately off-axis: a light at the camera flattens the sphere
   * into a disc. Placed down and to the left it produces a terminator, which is
   * what reads as a planet. The ambient is only strong enough to keep the dark
   * side from going to pure black.
   *
   * Both are added to the scene, not to the rotating root, so the lighting stays
   * put while the globe turns underneath it.
   */
  private buildLighting(three: typeof THREE): void {
    const key = new three.DirectionalLight(
      new three.Color(this.palette.light),
      DARK_TUNING.keyIntensity,
    );
    key.position.set(-2.2, -1.4, 2.6);
    this.scene?.add(key);

    const fill = new three.AmbientLight(
      new three.Color(this.palette.ambient),
      DARK_TUNING.ambientIntensity,
    );
    this.scene?.add(fill);

    this.themed.push((palette, light) => {
      const tuning = light ? LIGHT_TUNING : DARK_TUNING;
      key.color.set(palette.light);
      fill.color.set(palette.ambient);
      key.intensity = tuning.keyIntensity;
      fill.intensity = tuning.ambientIntensity;
    });
  }

  /** The solid planet. Opaque and depth-writing — this is what makes it a globe. */
  private buildBody(three: typeof THREE): void {
    const geometry = new three.SphereGeometry(1, 64, 48);
    const material = new three.MeshStandardMaterial({
      color: new three.Color(this.palette.body),
      roughness: 0.92,
      metalness: 0.05,
      depthWrite: true,
    });

    this.root?.add(new three.Mesh(geometry, material));
    this.disposables.push(geometry, material);

    this.themed.push((palette) => material.color.set(palette.body));
  }

  /**
   * The gold fresnel rim, and a wider, fainter haze outside it.
   *
   * Two shells rather than one: the tight shell is the lit horizon, the wide one
   * is the glow bleeding off it. Together they do the job a bloom pass would,
   * for two draw calls and no render targets.
   */
  private buildShells(three: typeof THREE): void {
    const shells: {
      radius: number;
      key: 'atmosphere' | 'haze';
      // Falloff power: lower is wider.
      power: number;
      strength: (tuning: Tuning) => number;
    }[] = [
      {
        radius: ATMOSPHERE_RADIUS,
        key: 'atmosphere',
        power: 2.1,
        strength: (tuning) => tuning.atmosphereStrength,
      },
      { radius: HAZE_RADIUS, key: 'haze', power: 1.5, strength: (tuning) => tuning.hazeStrength },
    ];

    for (const shell of shells) {
      const geometry = new three.SphereGeometry(shell.radius, 64, 48);
      const material = new three.ShaderMaterial({
        vertexShader: SHELL_VERTEX,
        fragmentShader: SHELL_FRAGMENT,
        uniforms: {
          uColor: { value: new three.Color(this.palette[shell.key]) },
          uPower: { value: shell.power },
          uStrength: { value: shell.strength(DARK_TUNING) },
        },
        side: three.BackSide,
        blending: three.AdditiveBlending,
        transparent: true,
        // Depth test stays on so the body occludes each shell's centre; depth
        // write stays off so a shell never occludes anything itself.
        depthWrite: false,
      });

      this.root?.add(new three.Mesh(geometry, material));
      this.disposables.push(geometry, material);

      this.themed.push((palette, light, lib) => {
        material.uniforms['uColor'].value.set(palette[shell.key]);
        material.uniforms['uStrength'].value = shell.strength(light ? LIGHT_TUNING : DARK_TUNING);
        // On ivory an additive rim can only climb toward white, which erases it.
        // Normal blending lets the same gold sit *over* the page and darken it,
        // so the lit horizon survives. premultipliedAlpha is what makes that
        // correct rather than merely different: the shader already emits colour
        // scaled by intensity with intensity as alpha, so without it the colour
        // would be multiplied by alpha a second time and the rim would go muddy.
        material.blending = light ? lib.NormalBlending : lib.AdditiveBlending;
        material.premultipliedAlpha = light;
      });
    }
  }

  /**
   * The continents, as two point clouds.
   *
   * Density plus a small point size is what turns specks into legible landmass;
   * splitting a bright minority out as city lights is what stops the result
   * reading as uniform noise. Two draw calls for the whole planet.
   */
  private buildLand(three: typeof THREE): void {
    const land = sampleLandPoints(LAND_SAMPLES);
    const sprite = this.dotTexture;

    const dim: number[] = [];
    const bright: number[] = [];

    land.forEach(({ lat, lon }, index) => {
      const v = toVector(lat, lon, LAND_RADIUS);
      // Deterministic rather than random: the same points light up on every load,
      // so the globe has a stable identity instead of reshuffling per visit.
      const target = index % Math.round(1 / CITY_SHARE) === 0 ? bright : dim;
      target.push(v.x, v.y, v.z);
    });

    // The dim majority. Normal blending and an alpha test, so the continents
    // read as land rather than as haze.
    const dimGeometry = new three.BufferGeometry();
    dimGeometry.setAttribute('position', new three.BufferAttribute(new Float32Array(dim), 3));
    const dimMaterial = new three.PointsMaterial({
      color: new three.Color(this.palette.land),
      size: 0.011,
      sizeAttenuation: true,
      map: sprite,
      transparent: true,
      opacity: 0.95,
      alphaTest: 0.35,
      depthWrite: false,
    });
    this.root?.add(new three.Points(dimGeometry, dimMaterial));
    this.disposables.push(dimGeometry, dimMaterial);

    // Normal blending already, in both themes: the continents are meant to read
    // as land, and the token flips them from warm gold on a dark sphere to deep
    // gold on an ivory one.
    this.themed.push((palette) => dimMaterial.color.set(palette.land));

    // The city lights, drawn twice off one geometry: once at true size and full
    // opacity for the point itself, once at triple size and very low opacity for
    // the halo around it. Two cheap additive passes stand in for a bloom pass.
    const cityGeometry = new three.BufferGeometry();
    cityGeometry.setAttribute('position', new three.BufferAttribute(new Float32Array(bright), 3));
    this.disposables.push(cityGeometry);

    const cityPasses: { size: number; opacity: (tuning: Tuning) => number }[] = [
      { size: 0.011, opacity: () => 1 },
      { size: 0.033, opacity: (tuning) => tuning.cityHalo },
    ];

    for (const pass of cityPasses) {
      const material = new three.PointsMaterial({
        color: new three.Color(this.palette.city),
        size: pass.size,
        sizeAttenuation: true,
        map: sprite,
        transparent: true,
        opacity: pass.opacity(DARK_TUNING),
        blending: three.AdditiveBlending,
        depthWrite: false,
      });

      this.root?.add(new three.Points(cityGeometry, material));
      this.disposables.push(material);

      this.themed.push((palette, light, lib) => {
        material.color.set(palette.city);
        material.opacity = pass.opacity(light ? LIGHT_TUNING : DARK_TUNING);
        // Lights on a dark planet add; marks on a pale one subtract. Same two
        // passes either way — the halo simply becomes a soft shadow around the
        // point rather than a bloom off it.
        material.blending = light ? lib.NormalBlending : lib.AdditiveBlending;
      });
    }
  }

  /**
   * A soft round dot, drawn into a 2D canvas.
   *
   * PointsMaterial renders squares without one, and squares read as noise rather
   * than as a network at this size.
   */
  private createDotTexture(three: typeof THREE): THREE.Texture | null {
    const canvas = this.document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;

    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }

    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.55, 'rgba(255,255,255,0.95)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);

    const texture = new three.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * The network: arcs, a glowing node at every endpoint, and a pulse travelling
   * along each arc.
   */
  private buildNetwork(three: typeof THREE): void {
    const sprite = this.dotTexture;
    const endpoints: GeoPoint[] = [];

    ARC_ROUTES.forEach(([from, to], index) => {
      endpoints.push(from, to);

      const path = this.arcPath(three, from, to);
      const geometry = new three.BufferGeometry().setFromPoints(path);
      const material = new three.LineBasicMaterial({
        color: new three.Color(this.palette.arc),
        transparent: true,
        opacity: 0,
        blending: three.AdditiveBlending,
        // Over the body, not occluded by it. The reference shows the network as
        // a cage enveloping the globe, with the far side of each arc still
        // visible through it, so the arcs opt out of the depth test entirely.
        depthTest: false,
        depthWrite: false,
      });

      const line = new three.Line(geometry, material);
      line.renderOrder = 2;
      this.root?.add(line);
      this.disposables.push(geometry, material);
      // Spread the phases so the network never pulses in unison.
      this.arcs.push({ material, phase: index / ARC_ROUTES.length });

      this.themed.push((palette, light, lib) => {
        material.color.set(palette.arc);
        material.blending = light ? lib.NormalBlending : lib.AdditiveBlending;
      });

      const pulseMaterial = new three.SpriteMaterial({
        color: new three.Color(this.palette.node),
        map: sprite,
        transparent: true,
        opacity: 0,
        blending: three.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      });
      const pulse = new three.Sprite(pulseMaterial);
      pulse.renderOrder = 3;
      pulse.scale.setScalar(0.05);
      pulse.position.copy(path[0]);

      this.root?.add(pulse);
      this.disposables.push(pulseMaterial);
      this.pulses.push({
        sprite: pulse,
        material: pulseMaterial,
        path,
        phase: index / ARC_ROUTES.length,
      });

      this.themed.push((palette, light, lib) => {
        pulseMaterial.color.set(palette.node);
        pulseMaterial.blending = light ? lib.NormalBlending : lib.AdditiveBlending;
      });
    });

    // Every endpoint as one additive point cloud — one draw call for all of them.
    const positions: number[] = [];
    for (const point of endpoints) {
      const v = toVector(point.lat, point.lon, LAND_RADIUS + 0.004);
      positions.push(v.x, v.y, v.z);
    }

    const geometry = new three.BufferGeometry();
    geometry.setAttribute('position', new three.BufferAttribute(new Float32Array(positions), 3));
    const material = new three.PointsMaterial({
      color: new three.Color(this.palette.node),
      size: 0.032,
      sizeAttenuation: true,
      map: sprite,
      transparent: true,
      opacity: DARK_TUNING.nodeOpacity,
      blending: three.AdditiveBlending,
      depthWrite: false,
    });

    this.root?.add(new three.Points(geometry, material));
    this.disposables.push(geometry, material);

    this.themed.push((palette, light, lib) => {
      material.color.set(palette.node);
      material.opacity = (light ? LIGHT_TUNING : DARK_TUNING).nodeOpacity;
      material.blending = light ? lib.NormalBlending : lib.AdditiveBlending;
    });
  }

  /**
   * One arc, lifted off the surface so it leaves the ground at both ends and
   * peaks in the middle. Same curve the SVG fallback draws.
   */
  private arcPath(three: typeof THREE, from: GeoPoint, to: GeoPoint): THREE.Vector3[] {
    const a = toVector(from.lat, from.lon);
    const b = toVector(to.lat, to.lon);
    const points: THREE.Vector3[] = [];
    const steps = 64;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const z = a.z + (b.z - a.z) * t;
      const length = Math.hypot(x, y, z) || 1;
      // Renormalise back onto the sphere, then lift by a sine bump.
      const lift = 1 + 0.17 * Math.sin(Math.PI * t);
      points.push(new three.Vector3((x / length) * lift, (y / length) * lift, (z / length) * lift));
    }

    return points;
  }

  // ---------------------------------------------------------------------------
  // Loop
  // ---------------------------------------------------------------------------

  private readonly frame = (time: number): void => {
    const renderer = this.renderer;
    const scene = this.scene;
    const camera = this.camera;
    const root = this.root;
    if (!renderer || !scene || !camera || !root) {
      return;
    }

    // Clamped: after a pause, time jumps and an unclamped delta would spin the
    // globe through a whole revolution in one frame.
    const delta = this.lastFrame ? Math.min(0.05, (time - this.lastFrame) / 1000) : 0;
    this.lastFrame = time;
    this.elapsed += delta;

    root.rotation.y += ROTATION_SPEED * delta;

    // Ease toward the pointer rather than tracking it exactly, so the parallax
    // trails the cursor instead of sticking to it.
    this.offsetX += (this.targetX - this.offsetX) * Math.min(1, delta * 4);
    this.offsetY += (this.targetY - this.offsetY) * Math.min(1, delta * 4);
    root.position.set(this.offsetX, this.offsetY, 0);

    for (const arc of this.arcs) {
      // Triangle wave through a smoothstep: a slow swell in and out, held near
      // zero for part of the cycle so arcs read as firing rather than throbbing.
      const phase = (this.elapsed * 0.18 + arc.phase) % 1;
      const wave = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
      arc.material.opacity = wave * wave * (3 - 2 * wave) * 0.95;
    }

    for (const pulse of this.pulses) {
      const progress = (this.elapsed * 0.22 + pulse.phase) % 1;
      const index = Math.min(pulse.path.length - 1, Math.floor(progress * pulse.path.length));
      pulse.sprite.position.copy(pulse.path[index]);
      // Fades in as it leaves and out as it arrives, so nothing pops at the ends.
      pulse.material.opacity = Math.sin(Math.PI * progress) * 0.85;
    }

    renderer.render(scene, camera);
  };

  /**
   * Draw the scene once, wherever it currently stands.
   *
   * This is what a globe under reduced motion is: the same scene, the same
   * materials and the same camera as everyone else's, rendered when something
   * changes rather than sixty times a second.
   */
  private renderOnce(): void {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Put the animated values where they belong when nothing moves, and draw.
   *
   * Rotation is left at the orientation the scene was built with, the parallax
   * offset goes back to centre, the pulses are not drawn at all — they only
   * exist as travelling dots — and the arcs hold STILL_ARC_OPACITY, so the
   * network still reads as a cage around the globe.
   */
  private settle(): void {
    if (!this.root) {
      return;
    }

    this.offsetX = 0;
    this.offsetY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.root.position.set(0, 0, 0);

    for (const arc of this.arcs) {
      arc.material.opacity = STILL_ARC_OPACITY;
    }
    for (const pulse of this.pulses) {
      pulse.material.opacity = 0;
    }

    this.renderOnce();
  }

  private resume(): void {
    if (this.destroyed || !this.renderer) {
      return;
    }
    if (!this.inViewport || this.document.hidden) {
      return;
    }

    // Reduced motion gets the scene, not the loop.
    if (this.reduced) {
      this.pause();
      this.settle();
      return;
    }

    if (this.running) {
      return;
    }
    this.running = true;
    this.lastFrame = 0;
    this.renderer.setAnimationLoop(this.frame);
  }

  private pause(): void {
    if (!this.running) {
      return;
    }
    this.running = false;
    this.renderer?.setAnimationLoop(null);
  }

  // ---------------------------------------------------------------------------
  // Observers and listeners
  // ---------------------------------------------------------------------------

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height || !this.renderer || !this.camera) {
      return;
    }

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // A still globe has no next frame to pick the new size up in.
    if (!this.running) {
      this.renderOnce();
    }
  }

  private watchResize(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvasRef().nativeElement);
  }

  /** Stop rendering when the hero scrolls away, and when the tab is backgrounded. */
  private watchVisibility(): void {
    this.viewportObserver = new IntersectionObserver(
      ([entry]) => {
        this.inViewport = entry.isIntersecting;
        if (this.inViewport) {
          this.resume();
        } else {
          this.pause();
        }
      },
      { threshold: 0 },
    );
    this.viewportObserver.observe(this.canvasRef().nativeElement);

    const onVisibility = () => (this.document.hidden ? this.pause() : this.resume());
    this.document.addEventListener('visibilitychange', onVisibility);

    const previous = this.detachListeners;
    this.detachListeners = () => {
      previous?.();
      this.document.removeEventListener('visibilitychange', onVisibility);
    };
  }

  private watchPointer(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || this.reduced) {
        return;
      }
      // -1 → 1 across the viewport.
      this.pointer.x = (event.clientX / view.innerWidth) * 2 - 1;
      this.pointer.y = (event.clientY / view.innerHeight) * 2 - 1;
      this.updateParallaxTarget();
    };

    view.addEventListener('pointermove', onPointerMove, { passive: true });

    const previous = this.detachListeners;
    this.detachListeners = () => {
      previous?.();
      view.removeEventListener('pointermove', onPointerMove);
    };
  }

  /**
   * Convert the 8px parallax budget into world units.
   *
   * The conversion depends on the camera's field of view and the canvas height,
   * so it is recomputed from the live values rather than hard-coded.
   */
  private updateParallaxTarget(): void {
    const camera = this.camera;
    const canvas = this.canvasRef().nativeElement;
    if (!camera || !canvas.clientHeight) {
      return;
    }

    const visibleHeight = 2 * Math.tan(((camera.fov / 2) * Math.PI) / 180) * camera.position.z;
    const worldPerPixel = visibleHeight / canvas.clientHeight;
    const budget = PARALLAX_PX * worldPerPixel;

    // Negated: the globe drifts against the cursor, which reads as depth.
    this.targetX = -this.pointer.x * budget;
    this.targetY = this.pointer.y * budget;
  }

  // ---------------------------------------------------------------------------
  // Teardown
  // ---------------------------------------------------------------------------

  private fail(): void {
    this.teardown();
    this.failed.emit();
  }

  /**
   * Follow the motion preference for as long as the globe is alive.
   *
   * Turning it on stops the loop and settles the scene; turning it off starts
   * the loop again from where it stands. The picture is the same either way —
   * the same sphere, the same land, the same network in the same colours — so
   * nobody is shown a different globe on account of the setting.
   */
  private watchMotionPreference(): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    const query = view.matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = query.matches;

    const onChange = () => {
      this.reduced = query.matches;
      this.resume();
    };

    query.addEventListener('change', onChange);

    const previous = this.detachListeners;
    this.detachListeners = () => {
      previous?.();
      query.removeEventListener('change', onChange);
    };
  }

  private teardown(): void {
    this.pause();

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.viewportObserver?.disconnect();
    this.viewportObserver = null;
    this.detachListeners?.();
    this.detachListeners = null;

    for (const item of this.disposables) {
      item.dispose();
    }
    this.disposables.length = 0;
    this.arcs.length = 0;
    this.pulses.length = 0;
    // These close over disposed materials; a late theme change must not reach
    // them.
    this.themed.length = 0;

    // Releases the GPU context. Without it a few navigations exhaust the
    // browser's context limit and every later globe fails to create one.
    this.renderer?.dispose();
    this.dotTexture = null;
    this.three = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.root = null;
  }
}
