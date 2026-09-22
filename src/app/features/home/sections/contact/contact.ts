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

import { ScrollSpyService } from '../../../../core/scroll-spy.service';

/** How a call to action resolves. */
type ActionKind = 'anchor' | 'mail';

interface Action {
  readonly label: string;
  readonly kind: ActionKind;
  /** A section id for `anchor`, an address for `mail`. */
  readonly target: string;
  readonly primary: boolean;
}

type DetailKind = 'mail' | 'external' | 'phone';

interface ContactDetail {
  readonly label: string;
  /** What is printed. Always the value exactly as BWG supplied it. */
  readonly value: string;
  readonly kind: DetailKind;
  /** The href. Derived from the value, never a different number or address. */
  readonly href: string;
}

const EMAIL = 'info@bwg-trading.com';
const WEBSITE = 'www.bwg-trading.com';

interface ContactCopy {
  readonly eyebrow: string;
  readonly headingLines: readonly string[];
  readonly body: string;
  readonly closing: string;
  readonly addressLabel: string;
  readonly addressLines: readonly string[];
}

const COPY: ContactCopy = {
  eyebrow: 'CONTACT US',
  headingLines: ['THE NEXT OPPORTUNITY', 'COULD START HERE'],
  body: 'Whether you are looking for a strategic partner, entering a new market, developing a new business, investing in an opportunity, or transforming an existing operation — BWG is ready to build it with you',
  closing: "LET'S GENERATE VALUE TOGETHER",
  addressLabel: 'Head office',
  addressLines: [
    'Sama Towers, Tower Z, 9th Floor, Office 91',
    'Zahraa El Maadi, Maadi Ring Road',
    'Cairo, Egypt',
  ],
};

/**
 * The three closing actions.
 *
 * Two carry the reader back into the page; the third opens a message, which is
 * the only real action a contact section can offer without a backend.
 */
const ACTIONS: readonly Action[] = [
  { label: 'PARTNER WITH BWG', kind: 'anchor', target: 'partnerships', primary: false },
  { label: 'INVEST WITH BWG', kind: 'anchor', target: 'invest', primary: false },
  { label: 'CONTACT US', kind: 'mail', target: EMAIL, primary: true },
];

/**
 * Every href below is derived from the printed value rather than rewritten.
 *
 * The two numbers are dialled exactly as BWG gave them, in Egyptian local form.
 * Converting them to +20 would make them dial from abroad but would also mean
 * publishing a number BWG has not confirmed, so the local form stands.
 */
const DETAILS: readonly ContactDetail[] = [
  { label: 'Email', value: EMAIL, kind: 'mail', href: `mailto:${EMAIL}` },
  { label: 'Website', value: WEBSITE, kind: 'external', href: `https://${WEBSITE}` },
  { label: 'Mobile', value: '01031699905', kind: 'phone', href: 'tel:01031699905' },
  {
    label: 'Customer service',
    value: '01031799928',
    kind: 'phone',
    href: 'tel:01031799928',
  },
];

interface Mote {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly delay: number;
  readonly duration: number;
  readonly rise: number;
  readonly peak: number;
}

/**
 * A deterministic value in 0–1 from an index.
 *
 * Deterministic rather than random so the server and the client lay the field
 * out identically — a Math.random field would differ between the prerendered
 * HTML and the hydrated DOM.
 */
function noise(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/** A slow field of gold motes behind the closing statement. */
const MOTES: readonly Mote[] = Array.from({ length: 16 }, (_, i) => ({
  x: Math.round(noise(i, 1) * 1000) / 10,
  y: 55 + Math.round(noise(i, 2) * 450) / 10,
  size: 1 + Math.round(noise(i, 3) * 20) / 10,
  delay: Math.round(noise(i, 4) * 180) / 10,
  duration: 16 + Math.round(noise(i, 5) * 140) / 10,
  rise: -(4 + Math.round(noise(i, 6) * 60) / 10),
  peak: 0.25 + Math.round(noise(i, 7) * 45) / 100,
}));

/**
 * Contact — the closing section of the homepage.
 *
 * Statement and actions inline-start, the details panel inline-end. The motion
 * behind it is a slow drift of gold motes rather than another diagram: every
 * section above already carries one, and the page should close quietly.
 */
@Component({
  selector: 'bwg-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  private readonly spy = inject(ScrollSpyService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly copy = COPY;
  protected readonly actions = ACTIONS;
  protected readonly details = DETAILS;
  protected readonly motes = MOTES;

  /**
   * Plays the entrance. Fails open — the finished state is the CSS default and
   * this only adds a class that animates it in, so if the observer never runs
   * the section is still fully visible.
   */
  protected readonly revealed = signal(false);

  constructor() {
    afterNextRender(() => this.watchReveal());
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
