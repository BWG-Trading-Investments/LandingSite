import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';

/** The diagram's coordinate space. Square, so one number bounds both axes. */
const VIEWBOX = 400;
const CENTRE = VIEWBOX / 2;

/** Radius of the orbit the capability nodes sit on. */
const ORBIT_RADIUS = 128;

/** Radius of the disc behind each node's icon. */
const NODE_RADIUS = 27;

/** Radius of the gold ring around the BWG mark at the centre. */
const HUB_RADIUS = 56;

/** Icons are drawn in a 20-unit space, matching the hero's set. */
const ICON_SIZE = 20;

/** Gap between a node's disc and the label beneath it. */
const LABEL_GAP = 12;

type OrbitIcon = 'megaphone' | 'globe' | 'code' | 'chart' | 'handshake';

interface OrbitSeed {
  readonly label: string;
  readonly icon: OrbitIcon;
}

/**
 * The five capabilities on the orbit, clockwise from the top.
 *
 * Order is the only positional information here — every coordinate below is
 * derived from the index, so reordering or adding a capability re-lays the
 * diagram out on its own rather than needing every point moved by hand.
 */
const ORBIT: readonly OrbitSeed[] = [
  { label: 'STRATEGIC MARKETING', icon: 'megaphone' },
  { label: 'INTERNATIONAL TRADE', icon: 'globe' },
  { label: 'TECHNOLOGY & DIGITAL PLATFORMS', icon: 'code' },
  { label: 'INVESTMENT', icon: 'chart' },
  { label: 'BUSINESS DEVELOPMENT', icon: 'handshake' },
];

interface OrbitNode extends OrbitSeed {
  /** Centre of the node's disc, in viewBox units. */
  readonly x: number;
  readonly y: number;
  /** The spoke, running from the hub's edge to the node's edge. */
  readonly spokeX1: number;
  readonly spokeY1: number;
  readonly spokeX2: number;
  readonly spokeY2: number;
  /** Places the 20-unit icon centred on the node. */
  readonly iconTransform: string;
  /** Percentages, for positioning the HTML label layer over the SVG. */
  readonly xPercent: number;
  readonly labelYPercent: number;
}

/** Lay the seeds out evenly around the orbit, starting at twelve o'clock. */
const NODES: readonly OrbitNode[] = ORBIT.map((seed, index) => {
  const angle = ((-90 + index * (360 / ORBIT.length)) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const x = CENTRE + ORBIT_RADIUS * cos;
  const y = CENTRE + ORBIT_RADIUS * sin;

  return {
    ...seed,
    x,
    y,
    spokeX1: CENTRE + HUB_RADIUS * cos,
    spokeY1: CENTRE + HUB_RADIUS * sin,
    spokeX2: CENTRE + (ORBIT_RADIUS - NODE_RADIUS) * cos,
    spokeY2: CENTRE + (ORBIT_RADIUS - NODE_RADIUS) * sin,
    iconTransform: `translate(${x - ICON_SIZE / 2} ${y - ICON_SIZE / 2})`,
    xPercent: (x / VIEWBOX) * 100,
    labelYPercent: ((y + NODE_RADIUS + LABEL_GAP) / VIEWBOX) * 100,
  };
});

interface StatementCopy {
  readonly eyebrow: string;
  readonly headingLines: readonly string[];
  readonly lead: string;
  readonly pull: string;
  readonly paragraphs: readonly string[];
  readonly closing: string;
  readonly strip: readonly string[];
}

/**
 * All copy verbatim from the BWG website data document. Nothing paraphrased.
 */
const COPY: StatementCopy = {
  eyebrow: 'THE BWG STATEMENT',
  headingLines: ["WE DON'T JUST BUILD BUSINESSES", 'WE BUILD VALUE ECOSYSTEMS'],
  lead: 'BWG is a diversified business group built around one fundamental principle:',
  pull: 'Every business should create measurable value',
  paragraphs: [
    'From strategic marketing and international trade to technology, digital platforms, business development and investment, BWG brings complementary capabilities together to transform opportunities into sustainable businesses',
    'We connect people, markets, capital, technology and ideas to create opportunities that move businesses forward',
  ],
  closing: 'This is how we generate value',
  strip: [
    'ONE VISION',
    'COMPLEMENTARY CAPABILITIES',
    'STRATEGIC PARTNERSHIPS',
    'INNOVATIVE SOLUTIONS',
    'MEASURABLE VALUE',
  ],
};

/**
 * The BWG statement.
 *
 * Copy on the inline-start side, an orbit diagram on the inline-end. The diagram
 * is inline SVG generated from the node index — no image is embedded, because the
 * reference artwork has its text baked into the pixels and could neither be
 * translated, selected, nor read aloud.
 */
@Component({
  selector: 'bwg-statement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './statement.html',
  styleUrl: './statement.scss',
})
export class Statement {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly copy = COPY;
  protected readonly nodes = NODES;

  protected readonly centre = CENTRE;
  protected readonly orbitRadius = ORBIT_RADIUS;
  protected readonly nodeRadius = NODE_RADIUS;
  protected readonly hubRadius = HUB_RADIUS;
  protected readonly viewBox = `0 0 ${VIEWBOX} ${VIEWBOX}`;

  /**
   * Drives the scroll reveal. False during prerender and on the first client
   * render; the animations are gated on it plus the .bwg-js flag, so the static
   * HTML shows everything in its final state.
   */
  protected readonly revealed = signal(false);

  constructor() {
    afterNextRender(() => this.watchReveal());
  }

  /**
   * Reveal once, when the section first reaches the viewport.
   *
   * The observer disconnects on its first hit rather than staying attached — the
   * reveal is an entrance, not a state, and re-running it on every scroll past
   * would be noise.
   */
  private watchReveal(): void {
    if (!this.isBrowser) {
      return;
    }

    const view = this.host.nativeElement.ownerDocument?.defaultView;
    if (view?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Nothing to animate, so land in the finished state immediately.
      this.revealed.set(true);
      return;
    }

    this.zone.runOutsideAngular(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            return;
          }
          observer.disconnect();
          this.zone.run(() => this.revealed.set(true));
        },
        // Waits until the section is properly on screen rather than firing on
        // the first pixel of it.
        { rootMargin: '0px 0px -15% 0px', threshold: 0 },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
