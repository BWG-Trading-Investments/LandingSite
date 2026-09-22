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

/**
 * The diagram's coordinate space.
 *
 * Deliberately landscape rather than square: the ring and its six satellite
 * labels share one coordinate system, so a label's position is derived from its
 * node's position instead of being mapped between two boxes.
 */
const VIEW_W = 1000;
const VIEW_H = 660;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;

/** Radius of the orbit the capability nodes sit on. */
const ORBIT_RADIUS = 175;

/** Radius of the disc behind each node's icon. */
const NODE_RADIUS = 32;

/** Radius of the gold ring around the BWG mark at the centre. */
const HUB_RADIUS = 92;

/** Icons are drawn in a 20-unit space, matching the hero's set. */
const ICON_SIZE = 20;

/**
 * How far the 20-unit icon is blown up to sit inside a 64-unit disc.
 *
 * Applied inside the SVG transform, never as a CSS `scale`. CSS scale is an
 * independent transform property: it composes outside the transform attribute
 * and about the icon's own local centre, so it multiplies the node coordinate
 * rather than the icon — which threw every icon clear of its disc.
 *
 * Scaling the group scales its stroke with it, which is what keeps the weight
 * proportional to the hero's icons rather than merely equal to them.
 */
const ICON_SCALE = 2;

/** Clearance between a node's disc and its satellite label. */
const LABEL_GAP = 16;

type CapabilityIcon = 'globe' | 'chip' | 'pulse' | 'cap' | 'megaphone' | 'growth';

/** Where a satellite label sits relative to its node, at the widest layout. */
type LabelSide = 'top' | 'end' | 'bottom' | 'start';

interface CapabilitySeed {
  readonly index: string;
  readonly title: string;
  /** What the division covers, in the profile's own words. Sits under the name. */
  readonly subtitle: string;
  readonly body: string;
  readonly icon: CapabilityIcon;
}

/** The marks the advantage band draws, copied from shared/ui/icon/icon.ts. */
type AdvantageIcon = 'users' | 'layers' | 'globe' | 'target';

interface Advantage {
  readonly label: string;
  readonly icon: AdvantageIcon;
  /**
   * What stands between this item and the one before it: three sums and a
   * result. The first carries none, and it is decoration — the meaning is the
   * four labels, so the operators are hidden from the accessibility tree.
   */
  readonly operator: string | null;
  /** The one the sum arrives at, set in gold. */
  readonly accent?: boolean;
}

/**
 * The six capabilities, clockwise from the top. All copy verbatim.
 *
 * Order is the only positional information here — every coordinate below is
 * derived from the array index, so reordering or adding a capability re-lays the
 * diagram out on its own.
 */
const CAPABILITIES: readonly CapabilitySeed[] = [
  {
    index: '01',
    title: 'BWG TRADING',
    subtitle: 'International Trade & Market Development',
    body: 'Sourcing, import & export, distribution, market access, and commercial opportunities',
    icon: 'globe',
  },
  {
    index: '02',
    title: 'BWG TECH',
    subtitle: 'Technology & Digital Solutions',
    body: 'Digital transformation, technology platforms, applications, and innovative solutions',
    icon: 'chip',
  },
  {
    index: '03',
    title: 'BWG MEDICAL',
    subtitle: 'Healthcare & Medical Solutions',
    body: 'Healthcare products, medical solutions, distribution, and strategic healthcare partnerships',
    icon: 'pulse',
  },
  {
    index: '04',
    title: 'BWG EDUCATION',
    subtitle: 'Education & Professional Development',
    body: 'Education solutions, training, professional development, and strategic partnerships',
    icon: 'cap',
  },
  {
    index: '05',
    title: 'BWG MARKETING',
    subtitle: 'Marketing, Branding & Business Growth',
    body: 'Strategic marketing, branding, communications, market positioning, and business development',
    icon: 'megaphone',
  },
  {
    index: '06',
    title: 'BWG ADVISORY',
    subtitle: 'Strategic Business & Market Advisory',
    body: 'Business consulting, market entry, strategic planning, partnerships, and growth advisory',
    icon: 'growth',
  },
];

/**
 * The BWG Advantage: three things added together, and what they come to.
 *
 * Read as a sum, which is why the operators are in the data rather than in the
 * template — the band is four labels and the relation between them.
 */
const ADVANTAGES: readonly Advantage[] = [
  { label: 'Specialized Expertise', icon: 'users', operator: null },
  { label: 'Integrated Capabilities', icon: 'layers', operator: '+' },
  { label: 'Strategic Network', icon: 'globe', operator: '+' },
  { label: 'One Vision', icon: 'target', operator: '=', accent: true },
];

interface CapabilityNode extends CapabilitySeed {
  /** Centre of the node's disc, in viewBox units. */
  readonly x: number;
  readonly y: number;
  /** The spoke, running from the hub's edge to the node's edge. */
  readonly spokeX1: number;
  readonly spokeY1: number;
  readonly spokeX2: number;
  readonly spokeY2: number;
  /**
   * Places the 20-unit icon centred on the node and scales it to fit the disc.
   *
   * Read right to left: centre the artwork on its own origin, scale it, then
   * move it to the node. Both this and the disc's cx/cy come from the same x/y,
   * so the two cannot drift apart.
   */
  readonly iconTransform: string;
  readonly side: LabelSide;
  /**
   * Satellite label placement, as percentages of the same box. Which inset each
   * one applies to depends on `side`, so the template binds them by side.
   */
  readonly insetInline: number;
  readonly insetBlock: number;
}

const NODES: readonly CapabilityNode[] = CAPABILITIES.map((seed, index) => {
  const angle = ((-90 + index * (360 / CAPABILITIES.length)) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const x = CX + ORBIT_RADIUS * cos;
  const y = CY + ORBIT_RADIUS * sin;

  // A node near the vertical axis has no room beside it, so its label goes above
  // or below instead. Everything else reads outward from the ring.
  const side: LabelSide =
    Math.abs(cos) < 0.35 ? (sin < 0 ? 'top' : 'bottom') : cos > 0 ? 'end' : 'start';

  // Each label is pushed clear of its own disc, then expressed against whichever
  // edge of the box it opens away from.
  const clear = NODE_RADIUS + LABEL_GAP;
  const insetInline =
    side === 'end'
      ? ((x + clear) / VIEW_W) * 100
      : side === 'start'
        ? ((VIEW_W - (x - clear)) / VIEW_W) * 100
        : (x / VIEW_W) * 100;
  const insetBlock =
    side === 'top'
      ? ((VIEW_H - (y - clear)) / VIEW_H) * 100
      : side === 'bottom'
        ? ((y + clear) / VIEW_H) * 100
        : (y / VIEW_H) * 100;

  return {
    ...seed,
    x,
    y,
    spokeX1: CX + HUB_RADIUS * cos,
    spokeY1: CY + HUB_RADIUS * sin,
    spokeX2: CX + (ORBIT_RADIUS - NODE_RADIUS) * cos,
    spokeY2: CY + (ORBIT_RADIUS - NODE_RADIUS) * sin,
    iconTransform: `translate(${x} ${y}) scale(${ICON_SCALE}) translate(${-ICON_SIZE / 2} ${-ICON_SIZE / 2})`,
    side,
    insetInline,
    insetBlock,
  };
});

interface EcosystemCopy {
  readonly heading: string;
  readonly subhead: string;
  readonly leadLead: string;
  readonly leadAccent: string;
  readonly advantageEyebrow: string;
}

const COPY: EcosystemCopy = {
  heading: 'OUR BUSINESS DIVISIONS',
  subhead: 'ONE GROUP. MULTIPLE CAPABILITIES',
  leadLead: 'Specialized business divisions, backed by the strength, network and resources of ',
  leadAccent: 'one integrated group',
  advantageEyebrow: 'THE BWG ADVANTAGE',
};

/**
 * Our Business Ecosystem.
 *
 * Copy inline-start, the six capabilities arranged around a ring inline-end.
 *
 * The reference artwork is white with a navy band; only its content and its
 * arrangement are taken from it. The palette here is the site's own, from
 * tokens, with no photograph and no gradients carried across.
 *
 * There is one set of capability elements, not three. The satellite ring, the
 * two-column list and the stacked cards are the same six nodes laid out three
 * ways, so no copy is duplicated into the DOM to serve a breakpoint.
 */
@Component({
  selector: 'bwg-ecosystem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ecosystem.html',
  styleUrl: './ecosystem.scss',
})
export class Ecosystem {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly copy = COPY;
  protected readonly nodes = NODES;
  protected readonly advantages = ADVANTAGES;

  /**
   * Where the advantage band picks the stagger up. The six nodes are indexed 0
   * to 5, so the band follows them rather than arriving alongside the ring.
   */
  protected readonly advantageOrder = CAPABILITIES.length;

  protected readonly viewBox = `0 0 ${VIEW_W} ${VIEW_H}`;
  protected readonly cx = CX;
  protected readonly cy = CY;
  protected readonly orbitRadius = ORBIT_RADIUS;
  protected readonly nodeRadius = NODE_RADIUS;
  protected readonly hubRadius = HUB_RADIUS;

  /**
   * The ring's circumference, for the draw-on animation.
   *
   * Computed rather than written down so it cannot drift out of step with
   * ORBIT_RADIUS and leave the stroke either short of closing or overshooting.
   */
  protected readonly orbitLength = 2 * Math.PI * ORBIT_RADIUS;

  protected readonly revealed = signal(false);

  constructor() {
    afterNextRender(() => this.watchReveal());
  }

  /** Reveal once, when the section first reaches the viewport. */
  private watchReveal(): void {
    if (!this.isBrowser) {
      return;
    }

    const view = this.host.nativeElement.ownerDocument?.defaultView;
    if (view?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.revealed.set(true);
      return;
    }

    this.zone.runOutsideAngular(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) {
            return;
          }
          // An entrance, not a state: it should not replay on every scroll past.
          observer.disconnect();
          this.zone.run(() => this.revealed.set(true));
        },
        { rootMargin: '0px 0px -15% 0px', threshold: 0 },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
