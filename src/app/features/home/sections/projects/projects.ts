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

import { PROJECTS } from '../../../../data/projects.data';
import { Icon } from '../../../../shared/ui/icon/icon';
import { CardTilt } from './card-tilt';

interface ProjectsCopy {
  readonly eyebrow: string;
  readonly heading: string;
  readonly subhead: string;
  readonly lead: string;
  readonly closingLead: string;
  readonly closingAccent: string;
}

/** All copy verbatim. */
const COPY: ProjectsCopy = {
  eyebrow: 'OUR PROJECTS',
  heading: 'FROM IDEAS TO IMPACT',
  subhead: 'WE TURN OPPORTUNITIES INTO BUSINESSES',
  lead: 'Across our ecosystem, BWG develops and supports businesses, platforms and strategic initiatives designed to solve real market challenges',
  closingLead: 'MORE THAN PROJECTS',
  closingAccent: 'These are building blocks of a larger ecosystem',
};

/**
 * Our Projects.
 *
 * Six cards, each a link to that project's own page — the same arrangement Our
 * Leaders uses. The projects come from data/projects.data.ts, which is also what
 * the detail pages read, so nothing about a project is written down twice.
 *
 * The two projects with a live site used to be the only clickable cards, and
 * they left the site immediately. Every card now leads to the page about the
 * project, and the outbound link lives there.
 */
@Component({
  selector: 'bwg-projects',
  imports: [RouterLink, Icon, CardTilt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly copy = COPY;
  protected readonly projects = PROJECTS;

  /**
   * Plays the entrance. Fails open: the finished state is the CSS default and
   * this only adds a class that animates it in, so if the observer never runs —
   * no JavaScript, an old browser, an error earlier on the page — the section is
   * still fully visible rather than stuck at opacity zero.
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
        { rootMargin: '0px 0px -15% 0px', threshold: 0 },
      );

      observer.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
