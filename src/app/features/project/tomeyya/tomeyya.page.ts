import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BWG_LOCKUP } from '../../../data/leaders.data';
import { type ProjectBlock, findProject } from '../../../data/projects.data';
import { Icon } from '../../../shared/ui/icon/icon';

/** One group of capabilities, as the record's `group` field files them. */
interface CapabilityGroup {
  readonly label: string;
  readonly items: readonly ProjectBlock[];
}

/**
 * TOMEYYA's own page.
 *
 * The second project to get one, after FISH LINK, and for a reason the shared
 * layout cannot meet: Tomeyya is not one product with a logo but three — a
 * till, a web menu and a handset app — and a page about it has to show all
 * three running. So the route resolves here, and this component owns the
 * palette, the composition and the three device mockups.
 *
 * What it does NOT own is the copy. The category, the name, the tagline, the
 * description, the three experiences, the twelve capabilities, the flow through
 * the ecosystem and the closing summary all come out of the record in
 * data/projects.data.ts — the same record the homepage card reads — so the page
 * and the card can never drift, and editing the client's wording stays a data
 * edit in one file.
 *
 * The interfaces inside the three devices are built in markup rather than
 * dropped in as screenshots: there is no Tomeyya UI artwork in the repo, and a
 * flat image would neither survive a theme nor scale down to a phone. They are
 * illustrations of the product, marked decorative so a screen reader is never
 * read a menu it cannot order from, and every figure in them is a placeholder
 * rather than a claim about the platform's data.
 */
@Component({
  selector: 'bwg-tomeyya-page',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tomeyya.page.html',
  // Two stylesheets, one component: the page, then the three devices. A
  // component style budget is measured per file, and one file carrying both
  // fails the build.
  styleUrls: ['./tomeyya.page.scss', './tomeyya-devices.scss'],
})
export class TomeyyaPage {
  /** Kept from the shared shell: this is still a BWG page, entered from a BWG card. */
  protected readonly lockup = BWG_LOCKUP;

  /**
   * The record behind the homepage card. It is always present — the route only
   * exists because the slug does — but findProject returns undefined for an
   * unknown slug, so this stays honest rather than asserting non-null.
   */
  protected readonly project = computed(() => findProject('tomeyya') ?? null);

  /**
   * The capabilities, gathered into the groups the record files them under.
   *
   * Order comes from the record and nowhere else: a group appears where its
   * first capability does, and the capabilities inside it keep their order. A
   * block with no group would be dropped, so the record keeps every one of them
   * grouped — see ProjectBlock.group.
   */
  protected readonly capabilityGroups = computed<readonly CapabilityGroup[]>(() => {
    const groups: { label: string; items: ProjectBlock[] }[] = [];

    for (const block of this.project()?.blocks ?? []) {
      if (!block.group) continue;

      const open = groups.at(-1);
      if (open && open.label === block.group) {
        open.items.push(block);
      } else {
        groups.push({ label: block.group, items: [block] });
      }
    }

    return groups;
  });
}
