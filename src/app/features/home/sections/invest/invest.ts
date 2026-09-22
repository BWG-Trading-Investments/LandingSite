import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ScrollSpyService } from '../../../../core/scroll-spy.service';

type CapabilityIcon = 'intel' | 'growth' | 'chip' | 'handshake' | 'bolt';
type PartnerIcon = 'globe' | 'cube' | 'trend' | 'nodes' | 'gem';

interface Capability {
  /** 01–05, shown in the readout. */
  readonly index: string;
  readonly name: string;
  readonly icon: CapabilityIcon;
}

/**
 * The five parts of the approach, in the order the document lists them.
 *
 * They are rendered as the orbit's nodes rather than as a separate list beside
 * it — printing the same five names twice in one section reads as a mistake. The
 * orbit is an ordered list, so the numbering is carried semantically and every
 * name is real, focusable text rather than something drawn into a graphic.
 */
const CAPABILITIES: readonly Capability[] = [
  { index: '01', name: 'Market Intelligence', icon: 'intel' },
  { index: '02', name: 'Business Development', icon: 'growth' },
  { index: '03', name: 'Technology', icon: 'chip' },
  { index: '04', name: 'Strategic Partnerships', icon: 'handshake' },
  { index: '05', name: 'Execution', icon: 'bolt' },
];

interface PartnerCard {
  readonly label: string;
  readonly icon: PartnerIcon;
}

const PARTNER_CARDS: readonly PartnerCard[] = [
  { label: 'Enter new markets', icon: 'globe' },
  { label: 'Develop new products', icon: 'cube' },
  { label: 'Accelerate growth', icon: 'trend' },
  { label: 'Build strong networks', icon: 'nodes' },
  { label: 'Create long-term value', icon: 'gem' },
];

// ---------------------------------------------------------------------------
// Orbit geometry. One square coordinate space; every point below is derived
// from these four, so moving the ring re-lays the diagram out on its own.
// ---------------------------------------------------------------------------
const VIEW = 480;
const CX = VIEW / 2;
const CY = VIEW / 2;
const ORBIT_RADIUS = 150;
const HUB_RADIUS = 54;

/** Where a spoke stops, short of the node that sits on the orbit. */
const SPOKE_END = ORBIT_RADIUS - 26;

/** Four particles, spread evenly around the ring by a negative animation delay. */
const PARTICLE_OFFSETS = [0, 0.25, 0.5, 0.75] as const;

interface OrbitNode extends Capability {
  /** Degrees, for the group each spoke is rotated by. */
  readonly angle: number;
  /** Percentages of the box, for positioning the node's button over the SVG. */
  readonly xPercent: number;
  readonly yPercent: number;
}

const NODES: readonly OrbitNode[] = CAPABILITIES.map((capability, index) => {
  const degrees = -90 + index * (360 / CAPABILITIES.length);
  const radians = (degrees * Math.PI) / 180;

  return {
    ...capability,
    angle: degrees,
    xPercent: ((CX + ORBIT_RADIUS * Math.cos(radians)) / VIEW) * 100,
    yPercent: ((CY + ORBIT_RADIUS * Math.sin(radians)) / VIEW) * 100,
  };
});

interface InvestCopy {
  readonly eyebrow: string;
  readonly heading: string;
  readonly subheading: string;
  readonly lead: string;
  readonly approachLabel: string;
  readonly approachClosing: string;
  readonly body: string;
  readonly closing: string;
  readonly cta: string;
  readonly ctaTarget: string;
  readonly cardsLabel: string;
}

/** All copy verbatim. */
const COPY: InvestCopy = {
  eyebrow: '08 — INVESTORS',
  heading: 'INVEST WITH BWG',
  subheading: 'CAPITAL FOLLOWS OPPORTUNITY',
  lead: 'BWG identifies emerging market opportunities and develops business models designed for scalable growth',
  approachLabel: 'Our approach combines:',
  approachClosing: 'to create businesses capable of generating sustainable value',
  body: 'We welcome strategic investors and institutional partners who share our vision for building scalable businesses across Egypt, the Middle East and international markets',
  closing: 'CATCH THE NEXT OPPORTUNITY WITH US',
  cta: 'DISCOVER INVESTMENT OPPORTUNITIES',
  ctaTarget: 'contact',
  cardsLabel: 'WE PARTNER TO:',
};

/**
 * Invest With BWG.
 *
 * Copy inline-start, an orbit of the five approach capabilities inline-end.
 *
 * The orbit is inline SVG and CSS only — no canvas and no new dependency. The
 * ring, spokes, particles and centre glow are decorative and sit in an
 * aria-hidden graphic; the five nodes themselves are real buttons layered over
 * it, so they carry their own labels, take focus, and work without the graphic.
 */
@Component({
  selector: 'bwg-invest',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invest.html',
  styleUrl: './invest.scss',
})
export class Invest {
  private readonly spy = inject(ScrollSpyService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly copy = COPY;
  protected readonly nodes = NODES;
  protected readonly cards = PARTNER_CARDS;
  protected readonly particles = PARTICLE_OFFSETS;

  protected readonly viewBox = `0 0 ${VIEW} ${VIEW}`;
  protected readonly cx = CX;
  protected readonly cy = CY;
  protected readonly orbitRadius = ORBIT_RADIUS;
  protected readonly hubRadius = HUB_RADIUS;
  protected readonly spokeStart = CX + HUB_RADIUS;
  protected readonly spokeEnd = CX + SPOKE_END;
  protected readonly orbitTop = CY - ORBIT_RADIUS;

  /** Rotation pivot for the particle groups, in the SVG's own units. */
  protected readonly orbitOrigin = `${CX}px ${CY}px`;

  /**
   * The highlighted capability, by index — or null when none is.
   *
   * One signal drives the node, its spoke and the readout together, so the three
   * cannot disagree the way separate handlers would.
   */
  private readonly active = signal<string | null>(null);

  /**
   * What the readout says. Falls back to the section's own closing line rather
   * than to invented descriptive copy, so nothing on screen is written by me.
   */
  protected readonly readout = computed(() => {
    const current = this.active();
    const node = current === null ? undefined : NODES.find((n) => n.index === current);
    return node ? { index: node.index, text: node.name } : null;
  });

  /** Which partner card is showing its stronger border. */
  protected readonly activeCard = signal<string | null>(null);

  protected readonly revealed = signal(false);

  constructor() {
    afterNextRender(() => this.watchReveal());
  }

  protected setActive(index: string | null): void {
    this.active.set(index);
  }

  protected isActive(index: string): boolean {
    return this.active() === index;
  }

  /** True for everything except the highlighted node, once one is chosen. */
  protected isDimmed(index: string): boolean {
    const current = this.active();
    return current !== null && current !== index;
  }

  protected setCard(label: string | null): void {
    this.activeCard.set(label);
  }

  protected isCardActive(label: string): boolean {
    return this.activeCard() === label;
  }

  /**
   * The same handler the hero uses: the anchor keeps a real href so it can be
   * opened in a new tab, and normal clicks are taken over for the smooth scroll.
   */
  protected onAnchor(event: MouseEvent, target: string): void {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    this.spy.goToSection(target);
  }

  /**
   * Plays the entrance. Fails open — the finished state is the CSS default and
   * this only adds a class that animates it in, so if the observer never runs
   * the section is still fully visible.
   */
  private watchReveal(): void {
    if (!this.isBrowser) {
      return;
    }

    const view = this.host.nativeElement.ownerDocument?.defaultView;
    if (view?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
        { rootMargin: '0px 0px -15% 0px', threshold: 0 },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
