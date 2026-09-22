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
 * A board member, and the cut-out that stands in for them.
 *
 * The three portraits were photographed separately, in a dark room against a
 * backlit gold map. None of that survives here: each subject was separated from
 * their own background with a segmentation model, cleaned of the fragments it
 * left behind, and rescaled so that all three heads are the same size with their
 * crowns on one line. The files are therefore interchangeable in the layout —
 * every one is a 900px-tall canvas with the crown at the top edge — which is
 * what lets three separate photographs read as a single group portrait standing
 * in the one environment the section draws behind them.
 *
 * The widths differ because the men do. Height is what the layout fixes.
 */
interface Director {
  readonly name: string;
  readonly role: string;
  readonly photo: string;
  readonly width: number;
  readonly height: number;
}

// Rendered in this order, left to right, and staggered into view in it too:
// the section's markup is a straight loop over this list and nothing in the
// stylesheet keys off a card's position.
const DIRECTORS: readonly Director[] = [
  {
    name: 'Dr. Basem Hashaad',
    role: 'Chief Executive Officer (CEO)',
    photo: '/assets/images/board-basem.webp',
    width: 478,
    height: 900,
  },
  {
    name: 'Mr. Mohamed Fouda',
    role: 'Board Member',
    photo: '/assets/images/board-mohamed.webp',
    width: 576,
    height: 900,
  },
  {
    name: 'Dr. Yasser Ghanem',
    role: 'Board Member',
    photo: '/assets/images/board-yasser.webp',
    width: 558,
    height: 900,
  },
];

type ValueIcon = 'compass' | 'horizon' | 'leaf' | 'diamond' | 'globe';

interface BoardValue {
  readonly lead: string;
  readonly tail: string;
  readonly icon: ValueIcon;
}

const VALUES: readonly BoardValue[] = [
  { lead: 'Strategic', tail: 'Leadership', icon: 'compass' },
  { lead: 'Long-Term', tail: 'Vision', icon: 'horizon' },
  { lead: 'Sustainable', tail: 'Growth', icon: 'leaf' },
  { lead: 'Value', tail: 'Creation', icon: 'diamond' },
  { lead: 'Global', tail: 'Perspective', icon: 'globe' },
];

/** All copy verbatim. */
const COPY = {
  titleLead: 'Board',
  titleAccent: 'of',
  titleTail: 'Directors',
  kicker: 'Leadership • Strategy • Sustainable Growth',
  motto: 'One Vision • One Team • Greater Value',
} as const;

/**
 * Board of Directors.
 *
 * One environment, three isolated people, three name plates and a values bar —
 * deliberately not three cards. Everything behind the directors is drawn by this
 * component in CSS and SVG, so there is exactly one background and it runs the
 * full width of the section.
 */
@Component({
  selector: 'bwg-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly copy = COPY;
  protected readonly directors = DIRECTORS;
  protected readonly values = VALUES;

  /**
   * Plays the entrance. Fails open — the finished state is the CSS default and
   * this only adds a class that animates it in, so if the observer never runs
   * the section is still fully visible.
   */
  protected readonly revealed = signal(false);

  constructor() {
    afterNextRender(() => this.watchReveal());
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
        { rootMargin: '0px 0px -10% 0px', threshold: 0 },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
