import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The icons this section draws, named after what the reference shows.
 *
 * They are declared and drawn inside this component rather than taken from the
 * shared icon set: the reference calls for marks the shared set does not have
 * (a bank, a clipboard, a leaf), and extending a shared component for one
 * section would reach outside what this change is allowed to touch.
 */
type SpotIcon =
  | 'briefcase'
  | 'bank'
  | 'handshake'
  | 'chart'
  | 'people'
  | 'target'
  | 'globe'
  | 'shield'
  | 'gear'
  | 'bars'
  | 'globe-grid'
  | 'leaf'
  | 'clipboard';

interface StatRow {
  readonly icon: SpotIcon;
  /** The figure, where there is one. The second row is a phrase instead. */
  readonly value: string;
  readonly label: string;
  readonly note: string;
}

interface BioBlock {
  readonly icon: SpotIcon;
  readonly text: string;
}

interface AreaItem {
  readonly icon: SpotIcon;
  readonly label: string;
}

interface Spotlight {
  /** Set on two lines: the first navy, the second gold. */
  readonly nameLead: string;
  readonly nameTail: string;
  /** The title, broken where the reference breaks it. Same words either way. */
  readonly titleLines: readonly string[];
  readonly portrait: { readonly src: string; readonly width: number; readonly height: number };
  readonly lockup: { readonly src: string; readonly width: number; readonly height: number };
  readonly stats: readonly StatRow[];
  readonly bio: readonly BioBlock[];
  readonly areasHeading: string;
  readonly areas: readonly AreaItem[];
}

/**
 * Every string this section renders, in one typed object.
 *
 * The two asset paths point at files that already exist and are reused rather
 * than regenerated: basem-hashaad-cutout.webp is the portrait from
 * assets/dr.basem.jpeg with its dark studio background removed, and
 * bwg-lockup-light.png is assets/BWGimg.png with its black card keyed out to
 * transparency so it sits on ivory with no box.
 */
const CONTENT: Spotlight = {
  nameLead: 'Dr. Basem',
  nameTail: 'Hashaad',
  titleLines: ['Chief Executive Officer,', 'Business World Group (BWG)'],

  portrait: { src: '/assets/images/basem-hashaad-cutout.webp', width: 465, height: 920 },
  lockup: { src: '/assets/bwg-lockup-light.png', width: 360, height: 415 },

  stats: [
    {
      icon: 'people',
      value: '25+',
      label: 'Years of Experience',
      note: 'in international trade, policy, and business development',
    },
    {
      icon: 'globe',
      value: '',
      label: 'Regional & Global Perspective',
      note: 'Extensive experience across Egypt, the MENA region, and the GCC',
    },
  ],

  // Filled down the first column and then the second, which is the order the
  // reference reads in. The stylesheet sets grid-auto-flow to match.
  bio: [
    {
      icon: 'briefcase',
      text: 'Dr. Basem Hashaad is a distinguished international trade and business development executive with more than 25 years of experience in trade policy, trade compliance, trade facilitation, economic analysis, international negotiations, and strategic development across Egypt, the MENA region, and the GCC.',
    },
    {
      icon: 'bank',
      text: "Prior to joining BWG, Dr. Hashaad spent more than 15 years within Egypt's Ministry of Trade and Industry, where he held senior responsibilities within the Foreign Trade Sector. He played a key role in international trade negotiations and the development of trade policy, with particular expertise in Rules of Origin and the technical preparation of bilateral and multilateral trade protocols and agreements.",
    },
    {
      icon: 'handshake',
      text: 'His professional experience includes engagement with prominent international and regional organizations and trade institutions, including the WTO, WCO, EU, EFTA, COMESA, COMCEC, and MERCOSUR.',
    },
    {
      icon: 'chart',
      text: 'Dr. Hashaad is recognized for his strategic thinking, analytical capabilities, negotiation expertise, and strong stakeholder-management skills. He has worked closely with government institutions, international organizations, corporate stakeholders, funding partners, and senior decision-makers.',
    },
    {
      icon: 'people',
      text: 'In addition to his expertise in international trade, he has significant experience in economic research, trade facilitation, institutional development, change management, crisis communication, sustainability, and community development. He is an accomplished presenter and communicator, with the ability to translate complex issues into practical strategic directions.',
    },
    {
      icon: 'target',
      text: "At BWG, Dr. Basem Hashaad leads the Group's strategic vision and growth agenda, leveraging his extensive international trade expertise, institutional relationships, and entrepreneurial mindset to expand BWG's regional and international presence and develop high-value business opportunities and strategic partnerships.",
    },
  ],

  areasHeading: 'Core Areas of Expertise',
  areas: [
    { icon: 'globe', label: 'International Trade & Trade Policy' },
    { icon: 'shield', label: 'Trade Compliance' },
    { icon: 'gear', label: 'Trade Facilitation' },
    { icon: 'bars', label: 'Economic Analysis' },
    { icon: 'people', label: 'International Negotiations' },
    { icon: 'target', label: 'Strategic Business Development' },
    { icon: 'bank', label: 'Stakeholder & Institutional Relations' },
    { icon: 'globe-grid', label: 'Market Development' },
    { icon: 'leaf', label: 'Sustainability & Community Development' },
    { icon: 'clipboard', label: 'Strategic Planning' },
  ],
};

/**
 * CEO Spotlight.
 *
 * One landscape card, sized to sit inside a single viewport on a desktop rather
 * than scrolling across several screens. Sits between the Board of Directors and
 * Our Leaders sections and owns all of its own copy and marks.
 */
@Component({
  selector: 'bwg-ceo-spotlight',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ceo-spotlight.html',
  styleUrl: './ceo-spotlight.scss',
})
export class CeoSpotlight {
  protected readonly copy = CONTENT;
}
