import { ChangeDetectionStrategy, Component, afterNextRender, inject, signal } from '@angular/core';

import { ScrollSpyService } from '../../../../core/scroll-spy.service';
import { Globe } from './globe/globe';
import { GlobeStatic } from './globe/globe-static';

/**
 * The headline, split into the two lines it is set on. Each rises out of its own
 * clipping mask, so the split is structural rather than a line break.
 */
const HEADLINE = ['BUSINESS', 'CONNECTED'] as const;

const COPY = {
  subline: 'Because We Generate Value',
  paragraph:
    'We build, connect and scale businesses through an integrated ecosystem of technology, trade, marketing, investment and strategic partnerships',
  tagline: 'One Group. Multiple Capabilities. One Vision',
} as const;

interface HeroAction {
  readonly label: string;
  readonly target: string;
}

const ACTIONS = {
  primary: { label: 'EXPLORE BWG', target: 'ecosystem' } satisfies HeroAction,
  secondary: { label: 'PARTNER WITH US', target: 'partnerships' } satisfies HeroAction,
} as const;

type CapabilityIcon = 'chip' | 'globe' | 'growth' | 'megaphone' | 'handshake';

/** Which side of the globe a label sits on — drives its connector and its slide. */
type CapabilitySide = 'start' | 'end';

interface Capability {
  readonly label: string;
  readonly lineOne: string;
  readonly lineTwo: string;
  readonly icon: CapabilityIcon;
  readonly side: CapabilitySide;
  /** Positioning slot around the globe. Fixed in the layout, never projected. */
  readonly slot: string;
  /** The homepage section this capability belongs to. */
  readonly target: string;
}

/**
 * The five capabilities placed around the globe.
 *
 * Positions are fixed percentages in the layout rather than projections of 3D
 * coordinates — projected labels drift as the globe turns, which reads as a bug.
 *
 * Technology, Trade and Marketing all point at #ecosystem, the section that
 * carries the six capabilities in full. They get their own anchors if those are
 * ever split out into sections of their own.
 */
const CAPABILITIES: readonly Capability[] = [
  {
    label: 'TECHNOLOGY',
    lineOne: 'Driving Innovation',
    lineTwo: 'Building Solutions',
    icon: 'chip',
    side: 'start',
    slot: 'upper-start',
    target: 'ecosystem',
  },
  {
    label: 'TRADE',
    lineOne: 'Connecting Markets',
    lineTwo: 'Creating Opportunities',
    icon: 'globe',
    side: 'end',
    slot: 'upper-end',
    target: 'ecosystem',
  },
  {
    label: 'INVESTMENT',
    lineOne: 'Funding Growth',
    lineTwo: 'Building Value',
    icon: 'growth',
    side: 'end',
    slot: 'mid-end',
    target: 'invest',
  },
  {
    label: 'MARKETING',
    lineOne: 'Building Brands',
    lineTwo: 'Creating Impact',
    icon: 'megaphone',
    side: 'start',
    slot: 'lower-start',
    target: 'ecosystem',
  },
  {
    label: 'STRATEGIC PARTNERSHIPS',
    lineOne: 'Stronger Together',
    lineTwo: 'Greater Impact',
    icon: 'handshake',
    side: 'end',
    slot: 'lower-end',
    target: 'partnerships',
  },
];

/**
 * The hero.
 *
 * Three layers: the gold glow, the globe, and the copy overlay. The copy layer
 * is complete on its own — if the globe never loads, or WebGL is unavailable, or
 * JavaScript never runs, the section still reads as a finished page.
 *
 * The globe starts as the SVG fallback on both the server and the first client
 * render, which keeps hydration matching and guarantees the prerendered HTML is
 * never an empty box. WebGL replaces it after first paint, on every device.
 */
@Component({
  selector: 'bwg-hero',
  // Globe is used only inside a @defer block, so the compiler emits it as a
  // lazy chunk and Three.js never touches the initial bundle.
  imports: [Globe, GlobeStatic],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  private readonly spy = inject(ScrollSpyService);

  protected readonly headline = HEADLINE;
  protected readonly copy = COPY;
  protected readonly actions = ACTIONS;
  protected readonly capabilities = CAPABILITIES;

  /**
   * False on the server and on the first client render, so the hydrated DOM
   * matches the prerendered DOM. Flipped after first paint, which is also what
   * keeps Three.js off the critical path.
   */
  protected readonly useWebgl = signal(false);

  /** Once a context has failed, never try again for this instance. */
  private webglFailed = false;

  constructor() {
    // afterNextRender is browser-only and runs after the hydrated DOM has
    // matched the prerendered one, which is the whole reason the SVG goes first.
    // From here the canvas takes over, on every device.
    afterNextRender(() => this.useWebgl.set(!this.webglFailed));
  }

  protected onGlobeFailed(): void {
    this.webglFailed = true;
    this.useWebgl.set(false);
  }

  protected onAnchor(event: MouseEvent, target: string): void {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    this.spy.goToSection(target);
  }
}
