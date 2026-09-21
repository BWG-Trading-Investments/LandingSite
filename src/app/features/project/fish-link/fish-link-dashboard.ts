import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The Fish Link desk view, in a laptop.
 *
 * Built in markup rather than placed as a screenshot: there is no Fish Link UI
 * artwork in the repo, and a flat export would neither stay sharp across the
 * range of widths this sits at nor scale its type down honestly on a phone.
 *
 * The figures — shipment counts, quality score, warehouse tallies, the category
 * split — are the ones printed on BWG's own company-profile slide, reproduced as
 * they appear there. They are demonstration data, which is the other reason the
 * host is aria-hidden: nothing here should reach a screen reader as though it
 * were a live manifest.
 */
@Component({
  selector: 'bwg-fl-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  templateUrl: './fish-link-dashboard.html',
  styleUrl: './fish-link-dashboard.scss',
})
export class FishLinkDashboard {}
