import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
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

type PartnerIcon = 'globe' | 'cube' | 'nodes' | 'bars' | 'handshake' | 'trend';

interface PartnerAim {
  readonly label: string;
  readonly icon: PartnerIcon;
}

/** The six, in order. All copy verbatim. */
const AIMS: readonly PartnerAim[] = [
  { label: 'Enter new markets', icon: 'globe' },
  { label: 'Develop new products', icon: 'cube' },
  { label: 'Build digital ecosystems', icon: 'nodes' },
  { label: 'Create new revenue streams', icon: 'bars' },
  { label: 'Connect businesses with opportunities', icon: 'handshake' },
  { label: 'Scale successful concepts', icon: 'trend' },
];

/**
 * The convergence diagram, in one square coordinate space.
 *
 * Every number below is derived from these five, so moving the ring or resizing
 * a node re-lays the whole diagram out rather than needing each point edited.
 */
const VIEW = 440;
const CX = VIEW / 2;
const CY = VIEW / 2;
const RING_RADIUS = 150;
const NODE_RADIUS = 34;
const HUB_RADIUS = 52;
const ICON_SIZE = 20;
const ICON_SCALE = 1.8;

/** Where a spoke starts and ends, measured along the unrotated X axis. */
const SPOKE_START = CX + HUB_RADIUS;
const SPOKE_END = CX + RING_RADIUS - NODE_RADIUS;

/**
 * How much of the composition the drawing itself takes.
 *
 * The SVG above is framed tight around its ring; the six statements stand
 * outside it, in the space this leaves. Everything below is expressed as a
 * fraction of the composition's own width, so the ring, the satellites and the
 * statements are one object: give the composition a width and every part of it
 * follows, which is what lets a phone show the same arrangement as a desktop
 * rather than a rearranged one.
 */
const DIAGRAM_SCALE = 0.52;

/** Centre to satellite centre, and the satellite's own radius, in those terms. */
const ORBIT_F = (RING_RADIUS / VIEW) * DIAGRAM_SCALE;
const NODE_F = (NODE_RADIUS / VIEW) * DIAGRAM_SCALE;

/** Clearance between a satellite's edge and the statement it carries. */
const LABEL_GAP_F = 0.022;

/**
 * The composition's height, as a share of its width.
 *
 * It is wider than it is tall: the statements to the sides reach the edges,
 * while the ones above and below stop a line or two past the ring. Square, a
 * third of the height was empty. Every vertical fraction below is divided by
 * this, so the arrangement does not move — the air around it does.
 */
const STAGE_RATIO = 0.74;

/** Which side of its satellite a statement opens away from. */
type AimSide = 'top' | 'end' | 'bottom' | 'start';

interface DiagramNode extends PartnerAim {
  /** Centre of the satellite, in viewBox units. */
  readonly x: number;
  readonly y: number;
  /** Degrees, for the group each spoke and pulse is rotated by. */
  readonly angle: number;
  /** Places the 20-unit icon centred on the satellite and scales it to fit. */
  readonly iconTransform: string;
  readonly side: AimSide;
  /**
   * Where the statement sits, as percentages of the composition. Which inset
   * each one applies to depends on `side`, so the template binds them by side —
   * the same arrangement the ecosystem diagram places its divisions with.
   */
  readonly insetInline: number;
  readonly insetBlock: number;
}

/**
 * Six satellites, evenly spaced from twelve o’clock, in list order.
 *
 * The spokes are not placed here: each one is drawn flat along the X axis and
 * the group carrying it is rotated into position, which is what lets all six
 * pulses share a single keyframe and a single travel distance.
 */
const NODES: readonly DiagramNode[] = AIMS.map((aim, index) => {
  const degrees = -90 + index * (360 / AIMS.length);
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const x = CX + RING_RADIUS * cos;
  const y = CY + RING_RADIUS * sin;

  // The same satellite, now as a point in the composition rather than in the
  // viewBox: half of it, plus however far along the orbit this one sits.
  const fx = 0.5 + ORBIT_F * cos;
  // Vertical fractions are of the height, which is STAGE_RATIO of the width.
  const fy = 0.5 + (ORBIT_F / STAGE_RATIO) * sin;
  const clear = NODE_F + LABEL_GAP_F;
  const clearV = clear / STAGE_RATIO;

  // A satellite near the vertical axis has nothing beside it, so its statement
  // stands above or below instead. Everything else reads outward from the ring.
  const side: AimSide =
    Math.abs(cos) < 0.35 ? (sin < 0 ? 'top' : 'bottom') : cos > 0 ? 'end' : 'start';

  return {
    ...aim,
    x,
    y,
    angle: degrees,
    // Placement and scale both live in the SVG transform, driven by the node
    // centre. A CSS scale would compose outside it and throw the icon clear.
    iconTransform: `translate(${x} ${y}) scale(${ICON_SCALE}) translate(${-ICON_SIZE / 2} ${-ICON_SIZE / 2})`,
    side,
    insetInline: (side === 'end' ? fx + clear : side === 'start' ? 1 - (fx - clear) : fx) * 100,
    insetBlock: (side === 'top' ? 1 - (fy - clearV) : side === 'bottom' ? fy + clearV : fy) * 100,
  };
});

interface PartnershipsCopy {
  readonly eyebrow: string;
  readonly headingLead: string;
  readonly headingAccent: string;
  readonly subheadLines: readonly string[];
  readonly paragraphs: readonly string[];
  readonly gridLabel: string;
}

const COPY: PartnershipsCopy = {
  eyebrow: 'PARTNERSHIP SECTION',
  headingLead: 'PARTNER',
  headingAccent: 'WITH BWG',
  subheadLines: ['GREAT BUSINESSES', 'ARE BUILT TOGETHER'],
  paragraphs: [
    'We believe strategic partnerships create opportunities that individual businesses cannot achieve alone',
    'BWG works with corporations, investors, technology companies, financial institutions, suppliers, government entities and entrepreneurs to develop mutually valuable opportunities',
  ],
  gridLabel: 'WE PARTNER TO:',
};

/**
 * Partner With BWG.
 *
 * The most restrained section on the page: hairlines, space and one accent. The
 * six aims are separated by rules alone — no cards, no fills, no outer border.
 */
@Component({
  selector: 'bwg-partnerships',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './partnerships.html',
  styleUrl: './partnerships.scss',
})
export class Partnerships {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly copy = COPY;
  protected readonly nodes = NODES;

  /** Handed to the stage, so the ratio the insets assume is the one it gets. */
  protected readonly stageRatio = STAGE_RATIO;

  protected readonly viewBox = `0 0 ${VIEW} ${VIEW}`;
  protected readonly cx = CX;
  protected readonly cy = CY;
  protected readonly ringRadius = RING_RADIUS;
  protected readonly nodeRadius = NODE_RADIUS;
  protected readonly hubRadius = HUB_RADIUS;
  protected readonly spokeStart = SPOKE_START;
  protected readonly spokeEnd = SPOKE_END;

  /** How far a pulse travels, handed to the keyframe as --pulse-travel. */
  protected readonly pulseTravel = `${SPOKE_END - SPOKE_START}px`;

  /**
   * The one highlighted item, by label — or null when nothing is.
   *
   * Both directions read and write this single signal: the list items and the
   * satellites are two views of the same state, so they cannot fall out of step
   * the way two separate hover handlers would.
   */
  private readonly active = signal<string | null>(null);

  /**
   * Whether the section is on screen. Starts true so the pulses run for anyone
   * whose observer never fires, and only ever turns off for a section that has
   * genuinely scrolled away.
   */
  protected readonly inView = signal(true);

  /**
   * Plays the entrance. Fails open — the finished state is the CSS default and
   * this only adds a class that animates it in, so if the observer never runs
   * the section is still fully visible.
   */
  protected readonly revealed = signal(false);

  constructor() {
    afterNextRender(() => {
      this.watchReveal();
      this.watchVisibility();
    });
  }

  protected setActive(label: string | null): void {
    this.active.set(label);
  }

  protected isActive(label: string): boolean {
    return this.active() === label;
  }

  /** True for everything except the highlighted item, once one is chosen. */
  protected isDimmed(label: string): boolean {
    const current = this.active();
    return current !== null && current !== label;
  }

  private watchReveal(): void {
    if (!this.isBrowser) {
      return;
    }

    const view = this.host.nativeElement.ownerDocument?.defaultView;
    if (view?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Nothing to play, and the default state is already the finished one.
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

  /**
   * Tracks whether the section is on screen, so the six pulse animations can be
   * paused while it is not.
   *
   * Unlike the entrance observer this one stays connected for the life of the
   * section — it is a state, not an entrance, and the pulses loop forever.
   */
  private watchVisibility(): void {
    if (!this.isBrowser) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting !== this.inView()) {
            this.zone.run(() => this.inView.set(entry.isIntersecting));
          }
        },
        { threshold: 0 },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
