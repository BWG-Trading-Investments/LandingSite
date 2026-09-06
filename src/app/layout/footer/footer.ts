import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The site footer.
 *
 * Deliberately minimal: the homepage already ends on the contact section, which
 * carries the address and the calls to action, so repeating any of that here
 * would be noise. This exists to give the legal documents somewhere to be
 * linked from — a privacy policy nothing links to is not published — and to
 * carry the copyright line.
 *
 * Only documents that have copy are linked. See data/legal-docs.data.ts.
 *
 * The year is a constant rather than `new Date().getFullYear()` on purpose.
 * Every route here is prerendered to static HTML at build time and then
 * hydrated, so a year computed at runtime would print the build's year in the
 * static markup and the visitor's year on hydration — a hydration mismatch, and
 * a console error, for everyone who loads the site after new year. Bump it.
 */
const COPYRIGHT_YEAR = 2026;

@Component({
  selector: 'bwg-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  protected readonly year = COPYRIGHT_YEAR;
}
