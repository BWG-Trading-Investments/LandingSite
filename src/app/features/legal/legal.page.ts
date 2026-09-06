import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { legalDocTitle } from '../../data/legal-docs.data';
import { type LegalDocument, findLegalDoc } from '../../data/legal-content.data';

/**
 * A legal document. Kept as a real route because an investor-facing site needs
 * real privacy and terms pages, and because legal-docs.data.ts already drives
 * both this page and the prerenderer's getPrerenderParams block.
 *
 * One component serves every document: everything on the page comes from the
 * record the slug resolves to, so publishing a document is a data edit and
 * nothing more. A slug that is routed but has no copy yet renders the missing
 * state below rather than an empty shell.
 */
@Component({
  selector: 'bwg-legal-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './legal.page.html',
  styleUrl: './legal.page.scss',
})
export class LegalPage {
  /** Bound from the `:doc` route param by withComponentInputBinding(). */
  readonly doc = input.required<string>();

  /** The resolved document, or null when the slug has no published copy. */
  protected readonly document = computed<LegalDocument | null>(() => findLegalDoc(this.doc()));

  /** The heading. Read from the same place app.routes.ts titles the route from. */
  protected readonly title = computed(() => legalDocTitle(this.doc()));

  /** A section's printed number, zero-padded: the contents list and the headings share it. */
  protected num(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
