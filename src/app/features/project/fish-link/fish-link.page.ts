import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { findProject } from '../../../data/projects.data';
import { FishLinkDashboard } from './fish-link-dashboard';
import { FishLinkPhone } from './fish-link-phone';

/**
 * FISH LINK's own page.
 *
 * Every other project renders through features/project/project.page.ts, which is
 * one layout serving one record shape. This one does not: the brief is that a
 * card takes you out of the BWG shell and into the product's own world, and a
 * marine supply-chain platform does not live in the same room as a precious
 * metals venture. So the route resolves here instead, and this component owns
 * its palette, its composition and its device mockups.
 *
 * What it does NOT own is the copy. Name, sector line, year, description,
 * capabilities and value points all still come out of data/projects.data.ts —
 * the same record the homepage card reads — so the page and the card can never
 * drift, and editing the client's wording is still a data edit in one file.
 * Only the things that are genuinely visual live here.
 *
 * The dashboard and handset are built in markup rather than dropped in as a
 * screenshot. There is no Fish Link UI artwork in the repo, and a flat image
 * would neither survive a theme nor scale down to a phone; the figures shown in
 * them are the ones printed on BWG's own company-profile slide, kept as they
 * appear there and marked up as decorative so a screen reader is not read a
 * mock shipment manifest.
 */
@Component({
  selector: 'bwg-fish-link-page',
  imports: [RouterLink, FishLinkDashboard, FishLinkPhone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fish-link.page.html',
  styleUrl: './fish-link.page.scss',
})
export class FishLinkPage {
  /**
   * The record behind the homepage card. It is always present — the route only
   * exists because the slug does — but findProject returns undefined for an
   * unknown slug, so this stays honest rather than asserting non-null.
   */
  protected readonly project = computed(() => findProject('fish-link') ?? null);
}
