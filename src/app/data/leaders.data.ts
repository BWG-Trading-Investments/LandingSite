import type { IconName } from '../shared/ui/icon/icon';

/**
 * The leadership roster.
 *
 * One record per person, read by both the homepage section and the profile
 * pages, so nothing about a leader is written down twice. Every block on a
 * profile page is optional: a leader with no quote, no information blocks or no
 * expertise simply does not render those parts, rather than rendering an empty
 * heading.
 *
 * The copy here was supplied by BWG. The one gap is noted against Sarah Hassan.
 */

/** One of the information blocks down the side of a profile page. */
export interface LeaderBlock {
  readonly icon: IconName;
  readonly heading: string;
  readonly body: string;
}

/** One item in a profile's Core Areas of Expertise. */
export interface ExpertiseItem {
  readonly icon: IconName;
  readonly label: string;
}

export interface Leader {
  /** URL segment: /leaders/<slug>. */
  readonly slug: string;
  readonly name: string;
  readonly title: string;
  /** The organisation under the title, where the title alone is not enough. */
  readonly org: string;
  /** Cut-out portrait on transparency, in `src/assets/images/`. */
  readonly photo: string;
  readonly width: number;
  readonly height: number;
  /** The mark on the leader's card in the homepage section. */
  readonly cardIcon: IconName;
  /** One line on the card. Kept short so four cards stay the same height. */
  readonly cardSummary: string;
  /** Lines of the pull quote. Empty for a leader who has not given one. */
  readonly quote: readonly string[];
  /** The opening line of the profile, set larger than the body. */
  readonly intro: string;
  readonly bio: readonly string[];
  readonly blocks: readonly LeaderBlock[];
  readonly expertise: readonly ExpertiseItem[];
}

/** Shown in the homepage section, in this order, left to right. */
export const LEADERS: readonly Leader[] = [
  {
    slug: 'adel-eskander',
    name: 'Adel Eskander',
    title: 'Group Marketing Director',
    org: 'BWG (Business World Group)',
    photo: '/assets/images/leader-adel.webp',
    width: 542,
    height: 980,
    cardIcon: 'megaphone',
    cardSummary:
      'Driving growth through strategic partnerships, market expansion, and business development excellence',
    quote: ['BWG — Where We Generate Value'],
    intro:
      'A seasoned business development and strategic partnerships leader with more than 25 years of experience',
    bio: [
      'As Group Marketing Director, Adel Eskander drives growth across BWG through strategic partnerships, market expansion, and business development excellence',
      'His work spans marketing and branding strategy, integrated campaigns, and leading operations and cross-functional teams across the Group',
    ],
    // Business development leads, as the profile does: the rest of the blocks
    // keep their own copy and their own icons and simply follow it.
    blocks: [
      {
        icon: 'growth',
        heading: 'Business Development',
        body: 'Driving strategic partnerships, market expansion, trade, and new business growth opportunities',
      },
      {
        icon: 'compass',
        heading: 'Strategic Marketing Leadership',
        body: 'Leading strategic planning and business development across multiple sectors',
      },
      {
        icon: 'megaphone',
        heading: 'Branding & Communications',
        body: 'Expertise in brand management, corporate identity, advertising, digital marketing, and integrated marketing strategies',
      },
      {
        icon: 'spark',
        heading: 'Events & Activations',
        body: 'Designing and executing impactful events, experiences, and activation campaigns that build brands and drive engagement',
      },
      {
        icon: 'screen',
        heading: 'Digital Transformation',
        body: 'Leveraging digital platforms, data-driven marketing, and technology solutions to create measurable impact and business value',
      },
      {
        icon: 'bulb',
        heading: 'Innovation & New Business',
        body: 'Developing innovative business platforms, ventures, and new commercial opportunities',
      },
    ],
    expertise: [
      { icon: 'briefcase', label: 'Business Development' },
      { icon: 'handshake', label: 'Strategic Partnerships' },
      { icon: 'globe', label: 'Market Expansion' },
      { icon: 'compass', label: 'Marketing Strategy' },
      { icon: 'tag', label: 'Brand Management' },
      { icon: 'diamond', label: 'Corporate Identity' },
      { icon: 'coins', label: 'Trade & Commercial Development' },
      { icon: 'spark', label: 'Events & Activations' },
      { icon: 'screen', label: 'Digital Marketing' },
      { icon: 'growth', label: 'Business Growth & Performance' },
    ],
  },

  {
    slug: 'sarah-hassan',
    name: 'Sarah Hassan',
    title: 'General Manager',
    org: 'BWG',
    photo: '/assets/images/leader-sarah.webp',
    width: 379,
    height: 824,
    cardIcon: 'briefcase',
    cardSummary:
      'Leading operations with excellence, ensuring efficiency, collaboration, and sustainable business success',
    quote: ['Driving Excellence', 'Building Brands', 'Creating Value'],
    intro:
      'An experienced management professional with more than 20 years of experience in business operations, international trading, fashion, brand management, and commercial development',
    bio: [
      'Sarah Hassan has held senior management and leadership positions across international trading companies and fashion and lifestyle brands, working across business operations and brand development',
      "At BWG she supports the Group's operational excellence, strategic partnerships and continued growth",
    ],
    // NOTE: the brief also called for an "Education & Specialized Studies" block.
    // Her academic background was not supplied and is recorded nowhere in this
    // project, so the block is left out rather than filled with a guess about a
    // real person. Add it here and it appears in place.
    blocks: [
      {
        icon: 'briefcase',
        heading: 'Seasoned Management Professional',
        body: 'More than 20 years of experience in management, business operations, international trading, fashion, and brand development',
      },
      {
        icon: 'globe',
        heading: 'Extensive Industry Experience',
        body: 'Senior management experience across international trading companies, fashion and lifestyle brands, operations, and brand development',
      },
      {
        icon: 'growth',
        heading: 'Driving Growth & Excellence',
        body: "Supporting BWG's operational excellence, strategic partnerships, and continued growth",
      },
      {
        icon: 'users',
        heading: 'Leadership Approach',
        body: 'Combining strategic thinking, commercial awareness, operational discipline, and strong understanding of brands and consumer markets',
      },
    ],
    expertise: [
      { icon: 'briefcase', label: 'Business Management' },
      { icon: 'gear', label: 'Business Operations' },
      { icon: 'globe', label: 'International Trading' },
      { icon: 'tag', label: 'Fashion & Lifestyle Management' },
      { icon: 'diamond', label: 'Brand Development' },
      { icon: 'handshake', label: 'Strategic Partnerships' },
      { icon: 'users', label: 'Team Leadership & People Development' },
      { icon: 'growth', label: 'Commercial Development' },
      { icon: 'compass', label: 'Consumer Products & Market Insight' },
    ],
  },

  {
    slug: 'dr-ahmed-bayoumy-elgabry',
    name: 'Dr. Ahmed Bayoumy ElGabry',
    title: 'Business Development Director',
    org: 'BWG (Business World Group)',
    photo: '/assets/images/leader-ahmed.webp',
    width: 471,
    height: 980,
    cardIcon: 'pulse',
    cardSummary:
      'Building strong brands and impactful marketing strategies that connect businesses with markets and create lasting value',
    quote: [],
    intro: 'More than 30 years of multidisciplinary experience',
    bio: [
      'Dr. Ahmed Bayoumy ElGabry is a distinguished executive and strategic professional whose experience spans healthcare, business development, strategic management, corporate communications, marketing, media, and philanthropy',
      'He has held senior leadership positions across Egypt and Saudi Arabia, contributing to organizational development, healthcare management, business growth, strategic partnerships, and leadership',
    ],
    blocks: [
      {
        icon: 'compass',
        heading: 'Distinguished Executive and Strategic Professional',
        body: 'More than 30 years of multidisciplinary experience spanning healthcare, business development, strategic management, corporate communications, marketing, media, and philanthropy',
      },
      {
        icon: 'pulse',
        heading: 'Medical Education & Qualifications',
        body: 'MBBS from Cairo University (1994), the Egyptian Fellowship in Family Medicine, and Membership of the Royal College of General Practitioners',
      },
      {
        icon: 'users',
        heading: 'Senior Leadership Experience',
        body: 'Senior leadership positions across Egypt and Saudi Arabia, contributing to organizational development, healthcare management, business growth, strategic partnerships, and leadership',
      },
      {
        icon: 'book',
        heading: 'Author & Knowledge Creator',
        body: 'An author and knowledge creator who has developed studies, books, and training programs',
      },
      {
        icon: 'handshake',
        heading: 'BWG Leadership Contribution',
        body: 'His extensive expertise contributes to Business World Group (BWG), supporting organizational strategy, business expansion, partnerships, and new investment opportunities',
      },
    ],
    expertise: [
      { icon: 'clock', label: '30+ Years of Experience' },
      { icon: 'pulse', label: 'Healthcare' },
      { icon: 'compass', label: 'Strategy' },
      { icon: 'growth', label: 'Business Development' },
      { icon: 'coins', label: 'Investment' },
      { icon: 'handshake', label: 'Partnerships' },
    ],
  },

  {
    slug: 'eng-saleh-hashaad',
    name: 'Eng. Saleh Hashaad',
    title: 'Chief Technology Officer',
    org: 'BWG Tech',
    photo: '/assets/images/leader-saleh.webp',
    width: 469,
    height: 980,
    cardIcon: 'chip',
    cardSummary:
      'Innovating and implementing technology solutions that drive digital transformation and business growth',
    quote: ['Driving Technology', 'Enabling Innovation', 'Creating Value'],
    intro: "Leading BWG Tech's technology vision, technology strategy, and digital transformation",
    bio: [
      'Eng. Saleh Hashaad leads the development of innovative technology solutions and scalable, high-performing digital platforms, keeping business and technology aligned behind one long-term technology strategy',
      'His approach combines strong leadership and problem-solving with a focus on innovation, security, agility, and excellence',
    ],
    blocks: [
      {
        icon: 'bulb',
        heading: 'Technology Visionary',
        body: 'Leading technology strategy, digital transformation, and innovation across BWG',
      },
      {
        icon: 'layers',
        heading: 'Innovation & Solutions',
        body: 'Developing scalable, secure, and high-performance technology solutions',
      },
      {
        icon: 'compass',
        heading: 'Strategic Leadership',
        body: 'Building technology ecosystems that combine innovation, business value, scalability, and user experience',
      },
    ],
    expertise: [
      { icon: 'compass', label: 'Technology Strategy & Leadership' },
      { icon: 'layers', label: 'Digital Platforms & Product Development' },
      { icon: 'screen', label: 'Digital Transformation' },
      { icon: 'shield', label: 'Cybersecurity & Data Protection' },
      { icon: 'gear', label: 'Automation & Smart Solutions' },
      { icon: 'growth', label: 'Scalability & Performance Optimization' },
      { icon: 'bulb', label: 'User Experience & Innovation' },
      { icon: 'handshake', label: 'Investment & Strategic Partnerships' },
    ],
  },
];

/**
 * Dr. Basem Hashaad, kept whole.
 *
 * His profile was the entire Our Leaders section until that section became the
 * four-up roster above, and his biography and areas of expertise are real client
 * copy. He keeps his own page at /leaders/dr-basem-hashaad, and is not in
 * LEADERS because the brief asked for exactly four cards and he already appears
 * as CEO in the Board of Directors section.
 */
export const FEATURED_LEADER: Leader = {
  slug: 'dr-basem-hashaad',
  name: 'Dr. Basem Hashaad',
  title: 'Chief Executive Officer',
  org: 'Business World Group (BWG)',
  photo: '/assets/images/basem-hashaad-cutout.webp',
  width: 465,
  height: 920,
  cardIcon: 'compass',
  cardSummary:
    'Chief Executive Officer, with more than 25 years in international trade and business development',
  quote: [
    'Transforming strategic opportunities into sustainable growth and building connections that create value across markets',
  ],
  intro:
    'A distinguished international trade and business development executive with more than 25 years of experience in trade policy, compliance, facilitation and strategic development across Egypt, the MENA region and the GCC',
  bio: [
    'Dr. Basem Hashaad is a distinguished international trade and business development executive with more than 25 years of experience in trade policy, trade compliance, trade facilitation, economic analysis, international negotiations, and strategic development across Egypt, the MENA region, and the GCC',
    'As Chief Executive Officer of Business World Group (BWG), Dr. Hashaad brings extensive governmental, institutional, and private-sector experience to the Group, with a strong focus on transforming strategic opportunities into sustainable business growth, developing international partnerships, and creating value across markets',
    "Prior to joining BWG, Dr. Hashaad spent more than 15 years within Egypt's Ministry of Trade and Industry, where he held senior responsibilities within the Foreign Trade Sector. Throughout his tenure, he played a key role in international trade negotiations and trade-policy development, with particular expertise in Rules of Origin and the technical preparation of bilateral and multilateral trade protocols and agreements",
    "His professional experience includes engagement with prominent international and regional organizations and trade institutions, including the World Trade Organization (WTO), World Customs Organization (WCO), European Union (EU), European Free Trade Association (EFTA), Common Market for Eastern and Southern Africa (COMESA), Organisation of Islamic Cooperation's Standing Committee for Economic and Commercial Cooperation (COMCEC), and MERCOSUR",
    'Dr. Hashaad is recognized for his strategic thinking, analytical capabilities, negotiation expertise, and strong stakeholder-management skills. His career has involved working closely with government institutions, international organizations, corporate stakeholders, funding partners, and senior decision-makers, enabling him to navigate complex economic, operational, regulatory, and organizational environments effectively',
    'In addition to his expertise in international trade, he has significant experience in economic research, trade facilitation, institutional development, change management, crisis communication, sustainability, and community development. He is also an accomplished presenter and communicator, with the ability to translate complex economic and trade issues into practical strategic directions',
    "At BWG, Dr. Basem Hashaad leads the Group's strategic vision and growth agenda, leveraging his extensive international trade expertise, institutional relationships, and entrepreneurial mindset to expand BWG's regional and international presence and develop high-value business opportunities and strategic partnerships",
  ],
  blocks: [],
  expertise: [
    { icon: 'globe', label: 'International Trade & Trade Policy' },
    { icon: 'shield', label: 'Trade Compliance' },
    { icon: 'handshake', label: 'Trade Facilitation' },
    { icon: 'growth', label: 'Economic Analysis' },
    { icon: 'users', label: 'International Negotiations' },
    { icon: 'compass', label: 'Strategic Business Development' },
    { icon: 'briefcase', label: 'Stakeholder & Institutional Relations' },
    { icon: 'tag', label: 'Market Development' },
    { icon: 'spark', label: 'Sustainability & Community Development' },
    { icon: 'layers', label: 'Strategic Planning' },
  ],
};

/** Everyone with a profile page. This is what the prerender enumerates. */
export const ALL_LEADERS: readonly Leader[] = [...LEADERS, FEATURED_LEADER];

export const findLeader = (slug: string): Leader | undefined =>
  ALL_LEADERS.find((leader) => leader.slug === slug);

/**
 * The BWG lockup, keyed off the black card the supplied artwork is drawn on.
 *
 * Two files: the wordmark is white in the original, which is invisible on ivory,
 * so the light theme — the default — uses the variant whose wordmark is ink, and
 * the stylesheets swap the original back in under the dark theme.
 */
export const BWG_LOCKUP = {
  src: '/assets/bwg-lockup-light.png',
  width: 360,
  height: 415,
  alt: 'BWG — Business World Group',
} as const;
