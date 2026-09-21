import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BWG_LOCKUP } from '../../data/leaders.data';
import { type Project, findProject } from '../../data/projects.data';
import { Icon } from '../../shared/ui/icon/icon';

/**
 * One project's page.
 *
 * A single component serves all of them: everything on the page comes from the
 * record in data/projects.data.ts that the slug resolves to, so adding a project
 * is a data edit and nothing more. It is deliberately the same arrangement as
 * the leader profiles — mark, name, standfirst, body, blocks, a closing grid —
 * because the two are the site's only detail pages and they should not feel like
 * two different sites.
 *
 * Every section is conditional on its own data. A project with no overview, no
 * blocks or no highlights simply does not render those parts.
 *
 * MADAAAD is the one exception to "one layout serves all of them". Its slide is
 * a product world of its own — a green storefront platform, with its sectors,
 * its supply categories and its own interface — and the ink-and-gold layout
 * above cannot carry that without becoming a different page for everyone. So the
 * template branches on the slug and MADAAAD renders its own composition inside
 * this same component and the same `projects/:slug` route: no second route, no
 * second page, and every other project's markup left exactly as it was.
 *
 * Its copy comes from the same record in data/projects.data.ts that the homepage
 * card reads, so the page and the card can never drift.
 *
 * The outbound link to a live site lives here and only here. It used to sit on
 * the homepage card, which meant the two projects with a site were the only ones
 * you could click and they took you straight off the site; now every card leads
 * here first, and leaving for the live product is a decision made on the page
 * about it.
 */
@Component({
  selector: 'bwg-project-page',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project.page.html',
  // Three stylesheets, one component: the shared layout, MADAAAD's page, and its
  // two device mockups. They share no selector, and a component style budget is
  // measured per file — one file carrying all of it fails the build.
  styleUrls: [
    './project.page.scss',
    './project.page.madaaad.scss',
    './project.page.madaaad-devices.scss',
  ],
})
export class ProjectPage {
  /** Bound from the `:slug` route param by withComponentInputBinding(). */
  readonly slug = input.required<string>();

  /** The lockup is the group's, not the leadership section's — shared from there. */
  protected readonly lockup = BWG_LOCKUP;

  /** The resolved project, or null when the slug is not one of ours. */
  protected readonly project = computed<Project | null>(() => findProject(this.slug()) ?? null);

  /** Which of the two layouts renders. See the note above. */
  protected readonly isMadaaad = computed(() => this.project()?.slug === 'madaaad');

  /**
   * Whether the page draws its large mark frame beside the copy.
   *
   * Only for a project with artwork the frame can actually hold. One with none,
   * and one whose mark is small enough that it is set beside the name instead,
   * both used to get the frame anyway with the project's icon inside it — a
   * square several times the glyph's size, which read as an empty placeholder.
   * Those pages now run the copy the full width of the column.
   */
  protected readonly hasMarkFrame = computed(() => {
    const item = this.project();
    return !!item?.image && !item.smallMark;
  });
}
