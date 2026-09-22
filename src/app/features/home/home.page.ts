import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
} from '@angular/core';

import { SECTION_IDS } from '../../core/navigation';
import { ScrollSpyService } from '../../core/scroll-spy.service';
import { About } from './sections/about/about';
import { Board } from './sections/board/board';
import { CeoSpotlight } from './sections/ceo-spotlight/ceo-spotlight';
import { Contact } from './sections/contact/contact';
import { Ecosystem } from './sections/ecosystem/ecosystem';
import { Hero } from './sections/hero/hero';
import { Invest } from './sections/invest/invest';
import { Leaders } from './sections/leaders/leaders';
import { Partnerships } from './sections/partnerships/partnerships';
import { Projects } from './sections/projects/projects';
import { Statement } from './sections/statement/statement';

/**
 * The homepage.
 *
 * Nothing but an ordered list of sections. It owns no markup of its own — each
 * section component brings its own <section> element and the id the scroll-spy
 * watches — and it is the component that registers those ids, because it is the
 * one that knows they exist and when they are in the DOM.
 */
@Component({
  selector: 'bwg-home-page',
  imports: [
    Hero,
    Statement,
    About,
    Ecosystem,
    Board,
    CeoSpotlight,
    Leaders,
    Projects,
    Partnerships,
    Invest,
    Contact,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly spy = inject(ScrollSpyService);

  constructor() {
    // afterNextRender is browser-only and runs once the sections are in the DOM,
    // which is exactly what IntersectionObserver needs. During prerender it never
    // fires, so Node never sees an observer.
    afterNextRender(() => this.spy.observe(SECTION_IDS));

    // The spy is a root singleton and outlives this page. Leaving /leadership
    // with a stale observer would keep a link lit for sections that are gone.
    inject(DestroyRef).onDestroy(() => this.spy.stop());
  }
}
