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

type ElementIcon = 'eye' | 'knight' | 'people' | 'chip' | 'handshake' | 'growth';
type CardIcon = 'target' | 'telescope';

/**
 * The marks the approach row and the value tiles draw.
 *
 * Paths are copied from shared/ui/icon/icon.ts, except `target`, which that set
 * does not carry — it is the one already drawn on the mission card below, so
 * the two rows of this section share a single reading of it.
 */
type MarkIcon = 'users' | 'bulb' | 'target' | 'growth' | 'globe';

interface BuildingBlock {
  readonly label: string;
  readonly icon: ElementIcon;
}

/** One of the four things the group says it does, under Our Approach. */
interface ApproachItem {
  readonly label: string;
  readonly body: string;
  readonly icon: MarkIcon;
}

/** One of the four values the mission is measured against. */
interface ValueTile {
  readonly label: string;
  readonly line: string;
  readonly icon: MarkIcon;
}

/**
 * A run of copy where some phrases are set in gold.
 *
 * Modelled as segments rather than as markup in the template so the sentence
 * stays one editable string per part, and so nothing has to be escaped or
 * bypassed to get the emphasis in.
 */
interface Segment {
  readonly text: string;
  readonly accent: boolean;
}

interface Card {
  readonly label: string;
  readonly body: string;
  readonly icon: CardIcon;
}

interface AboutCopy {
  readonly eyebrow: string;
  readonly headingLead: string;
  readonly headingAccent: string;
  readonly subhead: string;
  readonly intro: string;
  readonly strength: readonly Segment[];
  /** What the shape of the group is for. Follows the strength paragraph. */
  readonly structure: string;
  readonly isolation: string;
  readonly closing: string;
  readonly blocks: readonly BuildingBlock[];
  readonly cards: readonly Card[];
  readonly approachEyebrow: string;
  readonly approach: readonly ApproachItem[];
  /** The line under the approach row, split where the gold begins. */
  readonly approachLead: string;
  readonly approachAccent: string;
  readonly values: readonly ValueTile[];
}

/** All copy verbatim. Nothing paraphrased, nothing invented. */
const COPY: AboutCopy = {
  eyebrow: 'ABOUT BWG',
  headingLead: 'ABOUT',
  headingAccent: 'BWG',
  subhead: 'WHO WE ARE',
  intro:
    'BWG — Business World Group is a diversified business group focused on developing and connecting opportunities across trading, technology, healthcare, education, marketing, advisory, and strategic business solutions',
  strength: [
    { text: 'We combine ', accent: false },
    {
      text: 'market knowledge, international relationships, operational capabilities',
      accent: true,
    },
    { text: ' and ', accent: false },
    { text: 'innovation', accent: true },
    {
      text: ' to deliver practical solutions and build sustainable business partnerships',
      accent: false,
    },
  ],
  structure:
    'Our multidisciplinary structure enables us to understand different industries, connect complementary capabilities, and create opportunities across markets',
  isolation:
    "We don't believe successful businesses are built in isolation. They are built through the right combination of:",
  closing: 'BWG brings these elements together',
  blocks: [
    { label: 'Vision', icon: 'eye' },
    { label: 'Strategy', icon: 'knight' },
    { label: 'People', icon: 'people' },
    { label: 'Technology', icon: 'chip' },
    { label: 'Partnerships', icon: 'handshake' },
    { label: 'Execution', icon: 'growth' },
  ],
  // Vision first, mission second: where the group is going, then what it does to
  // get there. The two carry their own copy and marks unchanged.
  cards: [
    {
      label: 'OUR VISION',
      body: 'To become a trusted and leading business group connecting markets, industries, technology, and opportunities across Egypt, Africa, the GCC, and international markets',
      icon: 'telescope',
    },
    {
      label: 'OUR MISSION',
      body: 'To create sustainable value through innovative business solutions, strategic partnerships, international trade and market access, technology-driven development, professional advisory, integrated marketing and business development, and long-term relationships',
      icon: 'target',
    },
  ],
  approachEyebrow: 'OUR APPROACH',
  approach: [
    {
      label: 'CONNECT',
      body: 'We build strong relationships and connect opportunities across industries and markets',
      icon: 'users',
    },
    {
      label: 'INNOVATE',
      body: 'We embrace innovation and creative thinking to develop forward-looking solutions',
      icon: 'bulb',
    },
    {
      label: 'DELIVER',
      body: 'We deliver with focus, efficiency, and commitment to create measurable impact',
      icon: 'target',
    },
    {
      label: 'GROW',
      body: 'We support sustainable growth for our partners, our businesses, and the communities we serve',
      icon: 'growth',
    },
  ],
  approachLead: 'We do not simply participate in markets — ',
  approachAccent: 'we work to create value within them',
  values: [
    { label: 'CREATE VALUE', line: 'In everything we do', icon: 'growth' },
    { label: 'BUILD TRUST', line: 'Through integrity and transparency', icon: 'users' },
    { label: 'DRIVE GROWTH', line: 'For our partners and communities', icon: 'globe' },
    { label: 'MAKE IMPACT', line: 'With sustainable and lasting results', icon: 'target' },
  ],
};

/**
 * About BWG.
 *
 * Copy on the inline-start side, the mission and vision cards on the inline-end.
 *
 * The reference artwork for this section is light navy on white over a city
 * photograph; only its content and its arrangement are taken from it. The
 * palette here is the site's own, from tokens, with no photograph and no
 * gradients carried across.
 */
@Component({
  selector: 'bwg-about',
  // The approach row and the value tiles draw from the same five marks, so the
  // switch that holds their paths is written once and rendered twice.
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly copy = COPY;

  /**
   * The two cards continue the building-block stagger rather than starting a
   * sequence of their own, so they arrive after the sixth element instead of
   * racing it. Six blocks, so the cards are 6 and 7.
   */
  protected readonly cardOrder = COPY.blocks.length;

  /**
   * And the rows after them carry the same count on, so the section reveals as
   * one sequence rather than three that start together: the value tiles take 8
   * to 11, the approach items 12 to 15.
   */
  protected readonly valueOrder = COPY.blocks.length + COPY.cards.length;
  protected readonly approachOrder = COPY.blocks.length + COPY.cards.length + COPY.values.length;

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
