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
import { RouterLink } from '@angular/router';

import { BWG_LOCKUP, LEADERS } from '../../../../data/leaders.data';
import { Icon } from '../../../../shared/ui/icon/icon';

/** All copy verbatim. */
const COPY = {
  eyebrow: 'Our Leaders',
  heading: 'The People Behind The Group',
  lead: 'BWG is led by a team whose experience spans international trade, technology, investment and strategic partnerships',
} as const;

/**
 * Our Leaders.
 *
 * A roster of four, each card a link to that person's profile page. The people
 * and their portraits come from data/leaders.data.ts, which is also what the
 * profile pages read, so nothing about a leader is written down twice.
 */
@Component({
  selector: 'bwg-leaders',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './leaders.html',
  styleUrl: './leaders.scss',
})
export class Leaders {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly copy = COPY;
  protected readonly leaders = LEADERS;
  protected readonly lockup = BWG_LOCKUP;

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
