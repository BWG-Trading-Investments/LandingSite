import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The Fish Link handset.
 *
 * Its own component because the page shows it twice — small, tucked against the
 * laptop in the hero, and large on its own in the platform section — and a
 * second copy of the markup would be a second place to keep the tracking steps
 * in step.
 *
 * Decorative throughout: the host carries aria-hidden, so none of the mock
 * shipment data is announced. It inherits the page's `--fl-*` palette through
 * the DOM rather than redeclaring it, which is why it only ever looks right
 * inside this page.
 */
@Component({
  selector: 'bwg-fl-phone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.is-large]': 'large()',
  },
  templateUrl: './fish-link-phone.html',
  styleUrl: './fish-link-phone.scss',
})
export class FishLinkPhone {
  /** The standalone treatment in the platform section, rather than the hero inset. */
  readonly large = input(false);
}
