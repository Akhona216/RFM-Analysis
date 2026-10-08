export type SegmentId =
  | 'champions'
  | 'loyal'
  | 'potential_loyalist'
  | 'new_customers'
  | 'churn_risk'
  | 'hibernating';

export type AnomalyType =
  | 'valid'
  | 'duplicate_invoice'
  | 'missing_customer_id'
  | 'negative_amount'
  | 'invalid_date'
  | 'outlier_amount';

export interface RawTransaction {
  id: string;
  invoiceNo: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  region: string;
  channel: 'Web Store' | 'Mobile App' | 'POS Retail' | 'B2B Portal';
  category: 'Audio Hardware' | 'Workspace Ergonomics' | 'Smart Lighting' | 'Compute Peripherals' | 'Storage Media';
  timestamp: string; // ISO string or malformed string
  amount: number;
  quantity: number;
  anomalyType: AnomalyType;
  isCleanedOut?: boolean;
}

export interface CleaningConfig {
  removeDuplicates: boolean;
  dropMissingCustomerIds: boolean;
  excludeNegativeReturns: boolean;
  fixMalformedDates: boolean;
  capExtremeOutliers: boolean;
  outlierCapThreshold: number;
}

export interface RFMThresholds {
  // Recency days thresholds for scores 5, 4, 3, 2 (anything higher is 1)
  recencyDays: [number, number, number, number]; // e.g., [14, 30, 60, 120]
  // Frequency count thresholds for scores 2, 3, 4, 5 (anything lower is 1)
  frequencyCount: [number, number, number, number]; // e.g., [2, 4, 7, 11]
  // Monetary spend thresholds ($) for scores 2, 3, 4, 5 (anything lower is 1)
  monetarySpend: [number, number, number, number]; // e.g., [250, 600, 1200, 2500]
}

export interface CustomerRFM {
  customerId: string;
  customerName: string;
  customerEmail: string;
  region: string;
  preferredChannel: string;
  preferredCategory: string;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  recencyDays: number;
  frequency: number;
  monetary: number;
  avgOrderValue: number;
  rScore: 1 | 2 | 3 | 4 | 5;
  fScore: 1 | 2 | 3 | 4 | 5;
  mScore: 1 | 2 | 3 | 4 | 5;
  rfmCode: string; // e.g., "555"
  rfmComposite: number; // average or weighted
  segment: SegmentId;
  transactions: RawTransaction[];
}

export interface SegmentMetadata {
  id: SegmentId;
  name: string;
  shortLabel: string;
  description: string;
  behaviorPattern: string;
  keyDriver: string;
  retentionRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
  accentColor: string;
  bgTint: string;
  borderTint: string;
  textTint: string;
  marketingPlaybook: {
    objective: string;
    primaryChannel: string;
    recommendedAction: string;
    offerStructure: string;
    expectedLift: string;
    estimatedRoiMultiple: string;
    subjectLineTemplate: string;
  };
}

export const SEGMENT_DEFINITIONS: Record<SegmentId, SegmentMetadata> = {
  champions: {
    id: 'champions',
    name: 'Champions',
    shortLabel: 'Champions',
    description: 'Bought recently, order most frequently, and generate the highest lifetime revenue.',
    behaviorPattern: 'High basket consistency across multiple product lines; 78% organic repeat rate within 21 days.',
    keyDriver: 'Early product drops & tier status',
    retentionRisk: 'Low',
    accentColor: '#0F766E', // deep teal
    bgTint: 'bg-teal-50/70',
    borderTint: 'border-teal-200',
    textTint: 'text-teal-800',
    marketingPlaybook: {
      objective: 'Maximize advocacy, referrals, and high-margin attachment',
      primaryChannel: 'VIP Concierge Email & Mobile Push',
      recommendedAction: 'Invite to Private Beta Hardware Drop + Referral Ambassador Tier',
      offerStructure: 'No discount needed — Early 48hr access + complimentary expedited shipping',
      expectedLift: '+18.4% incremental category cross-sell',
      estimatedRoiMultiple: '9.4x',
      subjectLineTemplate: 'Private invitation: Early access to the Autumn Studio Series',
    },
  },
  loyal: {
    id: 'loyal',
    name: 'Loyal Customers',
    shortLabel: 'Loyal',
    description: 'Consistent repeat buyers with solid monetary contribution and regular purchase cadence.',
    behaviorPattern: 'Predictable 30–45 day replenishment cycle; responsive to bundle upgrades and loyalty points.',
    keyDriver: 'Bundle value & points multiplier',
    retentionRisk: 'Low',
    accentColor: '#1D4ED8', // royal blue
    bgTint: 'bg-blue-50/70',
    borderTint: 'border-blue-200',
    textTint: 'text-blue-800',
    marketingPlaybook: {
      objective: 'Ascend AOV and transition into Champions cohort',
      primaryChannel: 'Personalized Email & In-App Cart Upsell',
      recommendedAction: 'Tiered Threshold Bundle Offer + 2x Loyalty Points Weekend',
      offerStructure: 'Spend $400+ to unlock $60 studio accessory credit',
      expectedLift: '+24.2% average order value expansion',
      estimatedRoiMultiple: '6.8x',
      subjectLineTemplate: 'Unlock complimentary studio accessories on your next workstation upgrade',
    },
  },
  potential_loyalist: {
    id: 'potential_loyalist',
    name: 'Potential Loyalists',
    shortLabel: 'Promising',
    description: 'Recent customers with above-average initial spend and 2–3 orders showing strong affinity.',
    behaviorPattern: 'Exploring second product category within 35 days of acquisition; high email engagement.',
    keyDriver: 'Cross-category discovery & social proof',
    retentionRisk: 'Moderate',
    accentColor: '#4338CA', // indigo
    bgTint: 'bg-indigo-50/70',
    borderTint: 'border-indigo-200',
    textTint: 'text-indigo-800',
    marketingPlaybook: {
      objective: 'Lock in 3rd purchase habit before day 45 post-acquisition',
      primaryChannel: 'Automated Lifecycle Email & Retargeting',
      recommendedAction: 'Curated Category Companion Guide + Membership Enrollment',
      offerStructure: '10% companion item credit valid for 14 days',
      expectedLift: '+31.0% second-to-third order conversion',
      estimatedRoiMultiple: '5.5x',
      subjectLineTemplate: 'Complete your setup: Companion gear tailored to your recent order',
    },
  },
  new_customers: {
    id: 'new_customers',
    name: 'New Customers',
    shortLabel: 'New',
    description: 'Acquired within the last 30 days with a single transaction; high onboarding sensitivity.',
    behaviorPattern: 'Single category entry purchase; 64% drop-off risk if second order does not occur within 40 days.',
    keyDriver: 'Post-purchase onboarding & setup success',
    retentionRisk: 'Moderate',
    accentColor: '#0369A1', // sky blue
    bgTint: 'bg-sky-50/70',
    borderTint: 'border-sky-200',
    textTint: 'text-sky-800',
    marketingPlaybook: {
      objective: 'Accelerate time-to-second-order and eliminate buyer friction',
      primaryChannel: '3-Step Onboarding Sequence & SMS Check-in',
      recommendedAction: 'Interactive Setup Guide + Bounce-Back Second Order Voucher',
      offerStructure: '$25 welcome credit on second order over $150',
      expectedLift: '+22.5% 30-day repeat purchase rate',
      estimatedRoiMultiple: '4.9x',
      subjectLineTemplate: 'Getting the most from your new gear + a $25 studio credit inside',
    },
  },
  churn_risk: {
    id: 'churn_risk',
    name: 'At Risk / Churn Risk',
    shortLabel: 'Churn Risk',
    description: 'Previously frequent and high-value buyers whose recency has lapsed past their normal cycle.',
    behaviorPattern: 'Historical spend > $800 across 4+ orders, but 65–140 days elapsed since last checkout.',
    keyDriver: 'Direct win-back incentive & account outreach',
    retentionRisk: 'High',
    accentColor: '#B45309', // amber
    bgTint: 'bg-amber-50/80',
    borderTint: 'border-amber-200',
    textTint: 'text-amber-900',
    marketingPlaybook: {
      objective: 'Urgent reactivation before permanent defection to competitor',
      primaryChannel: 'Multi-Channel Win-Back (Email + Direct Account Note + Paid Social)',
      recommendedAction: 'Executive Win-Back Outreach + Time-Bound Reactivation Credit',
      offerStructure: '15% VIP Reactivation Credit + Free 2-Year Extended Warranty',
      expectedLift: '28.5% cohort recovery within 14 days',
      estimatedRoiMultiple: '7.2x',
      subjectLineTemplate: 'We noticed you have been away — your 15% VIP reactivation credit awaits',
    },
  },
  hibernating: {
    id: 'hibernating',
    name: 'Hibernating & Lost',
    shortLabel: 'Hibernating',
    description: 'Long-lapsed customers (120+ days inactive) with low historical frequency and spend.',
    behaviorPattern: 'Purchased once or twice during seasonal promotions over 4 months ago; low open rates.',
    keyDriver: 'Major product overhaul or clearance event',
    retentionRisk: 'Critical',
    accentColor: '#64748B', // slate
    bgTint: 'bg-slate-100',
    borderTint: 'border-slate-300',
    textTint: 'text-slate-700',
    marketingPlaybook: {
      objective: 'Low-cost automated re-engagement or list hygiene sunsetting',
      primaryChannel: 'Automated Seasonal Digest (Suppress Paid Spend)',
      recommendedAction: 'Send Flagship Annual Release Digest; suppress from paid ad audiences',
      offerStructure: '20% clearance & trade-in upgrade voucher',
      expectedLift: '6.8% reactivation; 35% ad-spend savings via suppression',
      estimatedRoiMultiple: '3.1x',
      subjectLineTemplate: 'Everything that changed this year + 20% trade-in upgrade credit',
    },
  },
};

export const DEFAULT_CLEANING_CONFIG: CleaningConfig = {
  removeDuplicates: true,
  dropMissingCustomerIds: true,
  excludeNegativeReturns: true,
  fixMalformedDates: true,
  capExtremeOutliers: true,
  outlierCapThreshold: 5000,
};

export const DEFAULT_RFM_THRESHOLDS: RFMThresholds = {
  recencyDays: [14, 32, 65, 115],
  frequencyCount: [2, 4, 6, 9],
  monetarySpend: [300, 750, 1450, 2600],
};

// Reference Date for deterministic real-time calculations: 2026-10-08
export const REFERENCE_DATE_ISO = '2026-10-08T10:15:00Z';

interface SeedCustomerProfile {
  id: string;
  name: string;
  email: string;
  region: string;
  channel: RawTransaction['channel'];
  category: RawTransaction['category'];
  recencyOffsets: number[]; // days ago for each transaction
  amounts: number[];
}

const SEED_PROFILES: SeedCustomerProfile[] = [
  // Champions (Recent, frequent, high monetary)
  {
    id: 'CUST-1001',
    name: 'Elena Rostova',
    email: 'e.rostova@studio-kinesis.io',
    region: 'North America',
    channel: 'B2B Portal',
    category: 'Audio Hardware',
    recencyOffsets: [2, 11, 24, 39, 55, 72, 91, 110, 135, 160],
    amounts: [480, 390, 520, 310, 440, 290, 610, 350, 420, 380],
  },
  {
    id: 'CUST-1002',
    name: 'Marcus Vance',
    email: 'mvance@vancedesign.co',
    region: 'North America',
    channel: 'Web Store',
    category: 'Workspace Ergonomics',
    recencyOffsets: [4, 15, 29, 44, 62, 85, 102, 128, 149],
    amounts: [620, 410, 380, 290, 510, 340, 490, 280, 360],
  },
  {
    id: 'CUST-1003',
    name: 'Sora Takahashi',
    email: 'sora@takahashi-labs.jp',
    region: 'APAC',
    channel: 'Web Store',
    category: 'Compute Peripherals',
    recencyOffsets: [1, 9, 19, 31, 48, 66, 80, 99, 118, 140, 165],
    amounts: [310, 450, 295, 540, 380, 410, 275, 390, 460, 320, 290],
  },
  {
    id: 'CUST-1004',
    name: 'Henrik Lindqvist',
    email: 'hlindqvist@nordic-acoustics.se',
    region: 'Europe',
    channel: 'B2B Portal',
    category: 'Audio Hardware',
    recencyOffsets: [6, 18, 33, 50, 68, 89, 112, 134, 155],
    amounts: [590, 480, 510, 390, 420, 350, 460, 310, 490],
  },
  {
    id: 'CUST-1005',
    name: 'Amara Okafor',
    email: 'amara@okafor-architects.uk',
    region: 'Europe',
    channel: 'Mobile App',
    category: 'Smart Lighting',
    recencyOffsets: [3, 14, 27, 42, 60, 77, 95, 120, 144, 170],
    amounts: [340, 290, 410, 380, 260, 330, 470, 310, 295, 360],
  },
  {
    id: 'CUST-1006',
    name: 'Julian Thorne',
    email: 'j.thorne@meridian-post.com',
    region: 'North America',
    channel: 'B2B Portal',
    category: 'Storage Media',
    recencyOffsets: [5, 16, 28, 41, 59, 76, 98, 115, 139],
    amounts: [410, 530, 390, 460, 310, 420, 380, 290, 410],
  },
  {
    id: 'CUST-1007',
    name: 'Clara Mendelssohn',
    email: 'clara@atelier-mendelssohn.de',
    region: 'Europe',
    channel: 'Web Store',
    category: 'Workspace Ergonomics',
    recencyOffsets: [8, 21, 35, 51, 70, 88, 106, 125, 148],
    amounts: [390, 340, 480, 310, 290, 430, 370, 280, 350],
  },

  // Loyal Customers (R: 3-5, F: 4-5, M: 3-5)
  {
    id: 'CUST-1008',
    name: 'Devon Brooks',
    email: 'dbrooks@brookscreative.io',
    region: 'North America',
    channel: 'Web Store',
    category: 'Compute Peripherals',
    recencyOffsets: [16, 34, 52, 74, 96, 122, 148],
    amounts: [280, 310, 240, 350, 290, 260, 310],
  },
  {
    id: 'CUST-1009',
    name: 'Linnea Bergstrom',
    email: 'linnea@forma-studio.no',
    region: 'Europe',
    channel: 'Mobile App',
    category: 'Smart Lighting',
    recencyOffsets: [19, 38, 59, 81, 105, 132],
    amounts: [320, 270, 340, 290, 250, 310],
  },
  {
    id: 'CUST-1010',
    name: 'Rafael Mendoza',
    email: 'rmendoza@sonora-labs.mx',
    region: 'LATAM',
    channel: 'Web Store',
    category: 'Audio Hardware',
    recencyOffsets: [12, 31, 54, 78, 104, 130, 158],
    amounts: [290, 340, 260, 310, 280, 330, 240],
  },
  {
    id: 'CUST-1011',
    name: 'Nadia Al-Mansoor',
    email: 'nadia@crescent-ventures.ae',
    region: 'MEA',
    channel: 'B2B Portal',
    category: 'Workspace Ergonomics',
    recencyOffsets: [22, 43, 64, 88, 114, 142],
    amounts: [410, 360, 290, 380, 320, 270],
  },
  {
    id: 'CUST-1012',
    name: 'Thomas Sterling',
    email: 'tsterling@sterling-audio.co.uk',
    region: 'Europe',
    channel: 'POS Retail',
    category: 'Audio Hardware',
    recencyOffsets: [15, 36, 58, 82, 109, 136, 162],
    amounts: [240, 290, 310, 265, 280, 230, 295],
  },
  {
    id: 'CUST-1013',
    name: 'Mei-Ling Zhou',
    email: 'mlzhou@shanghai-synth.cn',
    region: 'APAC',
    channel: 'Web Store',
    category: 'Compute Peripherals',
    recencyOffsets: [25, 47, 69, 92, 118, 145],
    amounts: [330, 280, 310, 260, 340, 290],
  },
  {
    id: 'CUST-1014',
    name: 'Gabriel Moreau',
    email: 'g.moreau@lumiere-paris.fr',
    region: 'Europe',
    channel: 'Mobile App',
    category: 'Smart Lighting',
    recencyOffsets: [18, 40, 63, 89, 115, 140],
    amounts: [260, 310, 285, 240, 290, 275],
  },
  {
    id: 'CUST-1015',
    name: 'Hannah Abbott',
    email: 'habbott@abbott-editorial.ca',
    region: 'North America',
    channel: 'Web Store',
    category: 'Storage Media',
    recencyOffsets: [11, 29, 51, 76, 102, 129],
    amounts: [275, 240, 320, 260, 280, 250],
  },

  // Potential Loyalists (Recent R: 4-5, moderate F: 2-3, moderate M: 2-4)
  {
    id: 'CUST-1016',
    name: 'Liam O’Connor',
    email: 'liam@dublin-soundworks.ie',
    region: 'Europe',
    channel: 'Web Store',
    category: 'Audio Hardware',
    recencyOffsets: [7, 24, 46],
    amounts: [340, 290, 260],
  },
  {
    id: 'CUST-1017',
    name: 'Priya Patel',
    email: 'priya@monolith-design.in',
    region: 'APAC',
    channel: 'Mobile App',
    category: 'Workspace Ergonomics',
    recencyOffsets: [10, 28, 52],
    amounts: [420, 310, 280],
  },
  {
    id: 'CUST-1018',
    name: 'Lucas Silva',
    email: 'lucas@paulista-tech.br',
    region: 'LATAM',
    channel: 'Web Store',
    category: 'Compute Peripherals',
    recencyOffsets: [13, 31],
    amounts: [380, 340],
  },
  {
    id: 'CUST-1019',
    name: 'Chloe Beaumont',
    email: 'c.beaumont@montreal-fx.ca',
    region: 'North America',
    channel: 'POS Retail',
    category: 'Smart Lighting',
    recencyOffsets: [9, 26, 49],
    amounts: [260, 295, 240],
  },
  {
    id: 'CUST-1020',
    name: 'Kenji Sato',
    email: 'ksato@osaka-vision.jp',
    region: 'APAC',
    channel: 'Web Store',
    category: 'Storage Media',
    recencyOffsets: [17, 37, 61],
    amounts: [310, 280, 330],
  },
  {
    id: 'CUST-1021',
    name: 'Zoe Papadopoulos',
    email: 'zoe@aegean-media.gr',
    region: 'Europe',
    channel: 'Mobile App',
    category: 'Audio Hardware',
    recencyOffsets: [14, 35],
    amounts: [390, 270],
  },
  {
    id: 'CUST-1022',
    name: 'Isaac Kofi',
    email: 'isaac@accra-digital.gh',
    region: 'MEA',
    channel: 'Web Store',
    category: 'Compute Peripherals',
    recencyOffsets: [20, 44, 68],
    amounts: [250, 310, 270],
  },

  // New Customers (Very recent R: 4-5, F: 1)
  {
    id: 'CUST-1023',
    name: 'Sophia Chen',
    email: 'sophia.chen@veri-labs.com',
    region: 'North America',
    channel: 'Web Store',
    category: 'Workspace Ergonomics',
    recencyOffsets: [3],
    amounts: [460],
  },
  {
    id: 'CUST-1024',
    name: 'Mateo Rossi',
    email: 'mrossi@milano-industrial.it',
    region: 'Europe',
    channel: 'Mobile App',
    category: 'Smart Lighting',
    recencyOffsets: [6],
    amounts: [285],
  },
  {
    id: 'CUST-1025',
    name: 'Aria Montgomery',
    email: 'aria@montgomery-film.us',
    region: 'North America',
    channel: 'POS Retail',
    category: 'Storage Media',
    recencyOffsets: [9],
    amounts: [340],
  },
  {
    id: 'CUST-1026',
    name: 'Noah Van Der Berg',
    email: 'noah@amsterdam-craft.nl',
    region: 'Europe',
    channel: 'Web Store',
    category: 'Audio Hardware',
    recencyOffsets: [12],
    amounts: [520],
  },
  {
    id: 'CUST-1027',
    name: 'Yuna Kim',
    email: 'yuna.kim@seoul-grid.kr',
    region: 'APAC',
    channel: 'Mobile App',
    category: 'Compute Peripherals',
    recencyOffsets: [15],
    amounts: [240],
  },
  {
    id: 'CUST-1028',
    name: 'Owen Gallagher',
    email: 'owen@gallagher-sound.co',
    region: 'North America',
    channel: 'Web Store',
    category: 'Audio Hardware',
    recencyOffsets: [2],
    amounts: [395],
  },
  {
    id: 'CUST-1029',
    name: 'Fatima Zahra',
    email: 'fatima@casablanca-design.ma',
    region: 'MEA',
    channel: 'Web Store',
    category: 'Smart Lighting',
    recencyOffsets: [18],
    amounts: [220],
  },

  // At Risk / Churn Risk (High past F & M, poor Recency 68-135 days)
  {
    id: 'CUST-1030',
    name: 'Victor Krum',
    email: 'vkrum@balkan-broadcast.bg',
    region: 'Europe',
    channel: 'B2B Portal',
    category: 'Audio Hardware',
    recencyOffsets: [74, 92, 110, 128, 145, 168, 190],
    amounts: [480, 510, 390, 440, 360, 490, 410],
  },
  {
    id: 'CUST-1031',
    name: 'Rachel Greenwald',
    email: 'rgreenwald@apex-production.com',
    region: 'North America',
    channel: 'B2B Portal',
    category: 'Workspace Ergonomics',
    recencyOffsets: [82, 101, 119, 138, 159, 182],
    amounts: [540, 420, 380, 460, 390, 340],
  },
  {
    id: 'CUST-1032',
    name: 'Daisuke Nakamura',
    email: 'd.nakamura@kyoto-media.jp',
    region: 'APAC',
    channel: 'Web Store',
    category: 'Storage Media',
    recencyOffsets: [69, 88, 107, 126, 149, 173],
    amounts: [360, 410, 330, 390, 280, 350],
  },
  {
    id: 'CUST-1033',
    name: 'Sebastien Laurent',
    email: 'slaurent@lyon-acoustics.fr',
    region: 'Europe',
    channel: 'Web Store',
    category: 'Audio Hardware',
    recencyOffsets: [94, 112, 131, 150, 174],
    amounts: [410, 380, 450, 320, 390],
  },
  {
    id: 'CUST-1034',
    name: 'Olivia Vance-Sterling',
    email: 'olivia@sterling-post.us',
    region: 'North America',
    channel: 'POS Retail',
    category: 'Compute Peripherals',
    recencyOffsets: [78, 96, 115, 139, 162, 185],
    amounts: [310, 340, 290, 380, 270, 320],
  },
  {
    id: 'CUST-1035',
    name: 'Carlos Santoro',
    email: 'csantoro@andes-digital.cl',
    region: 'LATAM',
    channel: 'Web Store',
    category: 'Smart Lighting',
    recencyOffsets: [105, 124, 142, 165, 188],
    amounts: [350, 290, 380, 310, 340],
  },
  {
    id: 'CUST-1036',
    name: ' Astrid Lindholm',
    email: 'astrid@stockholm-render.se',
    region: 'Europe',
    channel: 'B2B Portal',
    category: 'Workspace Ergonomics',
    recencyOffsets: [86, 108, 129, 152, 179],
    amounts: [490, 430, 370, 410, 360],
  },

  // Hibernating & Lost (Very old Recency > 125 days, low F: 1-2, low M)
  {
    id: 'CUST-1037',
    name: 'Brendan Miller',
    email: 'bmiller@midwest-print.org',
    region: 'North America',
    channel: 'Web Store',
    category: 'Storage Media',
    recencyOffsets: [138, 172],
    amounts: [140, 165],
  },
  {
    id: 'CUST-1038',
    name: 'Katarina Novak',
    email: 'k.novak@prague-design.cz',
    region: 'Europe',
    channel: 'Mobile App',
    category: 'Smart Lighting',
    recencyOffsets: [154],
    amounts: [180],
  },
  {
    id: 'CUST-1039',
    name: 'Tariq Hassan',
    email: 'thassan@cairo-logistics.eg',
    region: 'MEA',
    channel: 'Web Store',
    category: 'Compute Peripherals',
    recencyOffsets: [166, 195],
    amounts: [120, 145],
  },
  {
    id: 'CUST-1040',
    name: 'Eleanor Vance',
    email: 'eleanor@portland-type.co',
    region: 'North America',
    channel: 'POS Retail',
    category: 'Workspace Ergonomics',
    recencyOffsets: [142],
    amounts: [210],
  },
  {
    id: 'CUST-1041',
    name: 'Hugo Bossard',
    email: 'hbossard@geneva-watch.ch',
    region: 'Europe',
    channel: 'Web Store',
    category: 'Audio Hardware',
    recencyOffsets: [178],
    amounts: [260],
  },
  {
    id: 'CUST-1042',
    name: 'Min-Jae Park',
    email: 'mjpark@busan-harbor.kr',
    region: 'APAC',
    channel: 'Mobile App',
    category: 'Storage Media',
    recencyOffsets: [129, 164],
    amounts: [130, 155],
  },
];

export function generateInitialTransactions(): RawTransaction[] {
  const refTime = new Date(REFERENCE_DATE_ISO).getTime();
  const list: RawTransaction[] = [];
  let invoiceCounter = 84100;

  for (const profile of SEED_PROFILES) {
    profile.recencyOffsets.forEach((daysAgo, idx) => {
      invoiceCounter++;
      const txDate = new Date(refTime - daysAgo * 86400 * 1000 - idx * 3600 * 1000);
      const amount = profile.amounts[idx] ?? 250;
      list.push({
        id: `TX-${invoiceCounter}`,
        invoiceNo: `INV-${invoiceCounter}`,
        customerId: profile.id,
        customerName: profile.name.trim(),
        customerEmail: profile.email,
        region: profile.region,
        channel: profile.channel,
        category: profile.category,
        timestamp: txDate.toISOString(),
        amount,
        quantity: Math.max(1, Math.round(amount / 140)),
        anomalyType: 'valid',
      });
    });
  }

  // Inject realistic dirty / anomalous transactional records for the Data Cleaning & Preparation stage
  const dirtyRecords: RawTransaction[] = [
    {
      id: 'TX-DIRTY-01',
      invoiceNo: 'INV-84101', // Duplicate of Elena Rostova's first invoice
      customerId: 'CUST-1001',
      customerName: 'Elena Rostova',
      customerEmail: 'e.rostova@studio-kinesis.io',
      region: 'North America',
      channel: 'B2B Portal',
      category: 'Audio Hardware',
      timestamp: new Date(refTime - 2 * 86400 * 1000).toISOString(),
      amount: 480,
      quantity: 3,
      anomalyType: 'duplicate_invoice',
    },
    {
      id: 'TX-DIRTY-02',
      invoiceNo: 'INV-84991',
      customerId: null, // Missing Customer ID (guest checkout leak)
      customerName: 'Unattributed POS Guest',
      customerEmail: 'null@pos-terminal-04.local',
      region: 'North America',
      channel: 'POS Retail',
      category: 'Smart Lighting',
      timestamp: new Date(refTime - 5 * 86400 * 1000).toISOString(),
      amount: 315,
      quantity: 2,
      anomalyType: 'missing_customer_id',
    },
    {
      id: 'TX-DIRTY-03',
      invoiceNo: 'INV-84992',
      customerId: 'CUST-1038', // Katarina Novak (Hibernating) - negative credit memo
      customerName: 'Katarina Novak',
      customerEmail: 'k.novak@prague-design.cz',
      region: 'Europe',
      channel: 'Mobile App',
      category: 'Smart Lighting',
      timestamp: new Date(refTime - 12 * 86400 * 1000).toISOString(),
      amount: -180,
      quantity: -1,
      anomalyType: 'negative_amount',
    },
    {
      id: 'TX-DIRTY-04',
      invoiceNo: 'INV-84993',
      customerId: 'CUST-1018',
      customerName: 'Lucas Silva',
      customerEmail: 'lucas@paulista-tech.br',
      region: 'LATAM',
      channel: 'Web Store',
      category: 'Compute Peripherals',
      timestamp: '2026/13/45 99:00:00', // Malformed timestamp from legacy ERP import
      amount: 410,
      quantity: 2,
      anomalyType: 'invalid_date',
    },
    {
      id: 'TX-DIRTY-05',
      invoiceNo: 'INV-84994',
      customerId: 'CUST-1037',
      customerName: 'Brendan Miller',
      customerEmail: 'bmiller@midwest-print.org',
      region: 'North America',
      channel: 'Web Store',
      category: 'Storage Media',
      timestamp: new Date(refTime - 4 * 86400 * 1000).toISOString(),
      amount: 19450, // Extreme B2B wholesale billing test glitch
      quantity: 120,
      anomalyType: 'outlier_amount',
    },
    {
      id: 'TX-DIRTY-06',
      invoiceNo: 'INV-84995',
      customerId: null,
      customerName: 'Anonymous Webhook Retry',
      customerEmail: 'webhook@gateway.internal',
      region: 'Europe',
      channel: 'Web Store',
      category: 'Audio Hardware',
      timestamp: new Date(refTime - 1 * 86400 * 1000).toISOString(),
      amount: 640,
      quantity: 1,
      anomalyType: 'missing_customer_id',
    },
    {
      id: 'TX-DIRTY-07',
      invoiceNo: 'INV-84996',
      customerId: 'CUST-1030',
      customerName: 'Victor Krum',
      customerEmail: 'vkrum@balkan-broadcast.bg',
      region: 'Europe',
      channel: 'B2B Portal',
      category: 'Audio Hardware',
      timestamp: new Date(refTime - 8 * 86400 * 1000).toISOString(),
      amount: -480, // Chargeback reversal entry
      quantity: -2,
      anomalyType: 'negative_amount',
    },
    {
      id: 'TX-DIRTY-08',
      invoiceNo: 'INV-84110', // Duplicate invoice ID
      customerId: 'CUST-1002',
      customerName: 'Marcus Vance',
      customerEmail: 'mvance@vancedesign.co',
      region: 'North America',
      channel: 'Web Store',
      category: 'Workspace Ergonomics',
      timestamp: new Date(refTime - 4 * 86400 * 1000).toISOString(),
      amount: 620,
      quantity: 4,
      anomalyType: 'duplicate_invoice',
    },
  ];

  return [...dirtyRecords, ...list];
}

export interface CleaningPipelineResult {
  cleanedTransactions: RawTransaction[];
  rejectedTransactions: RawTransaction[];
  stats: {
    totalRaw: number;
    totalValid: number;
    duplicatesRemoved: number;
    missingIdsDropped: number;
    negativeExcluded: number;
    datesNormalized: number;
    outliersCapped: number;
  };
}

export function runDataCleaningPipeline(
  rawTransactions: RawTransaction[],
  config: CleaningConfig
): CleaningPipelineResult {
  const seenInvoices = new Set<string>();
  const cleaned: RawTransaction[] = [];
  const rejected: RawTransaction[] = [];

  let duplicatesRemoved = 0;
  let missingIdsDropped = 0;
  let negativeExcluded = 0;
  let datesNormalized = 0;
  let outliersCapped = 0;

  // Sort chronological or process in order so primary valid invoice is seen first
  const ordered = [...rawTransactions].sort((a, b) => {
    if (a.anomalyType === 'valid' && b.anomalyType !== 'valid') return -1;
    if (a.anomalyType !== 'valid' && b.anomalyType === 'valid') return 1;
    return 0;
  });

  for (const tx of ordered) {
    let workingTx: RawTransaction = { ...tx };

    // 1. Check missing customer ID
    if (!workingTx.customerId || workingTx.anomalyType === 'missing_customer_id') {
      if (config.dropMissingCustomerIds) {
        missingIdsDropped++;
        rejected.push({ ...workingTx, isCleanedOut: true });
        continue;
      } else {
        workingTx.customerId = 'CUST-GUEST-UNASSIGNED';
      }
    }

    // 2. Check duplicate invoice number
    if (seenInvoices.has(workingTx.invoiceNo) || workingTx.anomalyType === 'duplicate_invoice') {
      if (config.removeDuplicates && seenInvoices.has(workingTx.invoiceNo)) {
        duplicatesRemoved++;
        rejected.push({ ...workingTx, isCleanedOut: true });
        continue;
      }
    }
    seenInvoices.add(workingTx.invoiceNo);

    // 3. Check negative / cancelled amounts
    if (workingTx.amount <= 0 || workingTx.anomalyType === 'negative_amount') {
      if (config.excludeNegativeReturns) {
        negativeExcluded++;
        rejected.push({ ...workingTx, isCleanedOut: true });
        continue;
      }
    }

    // 4. Check malformed dates
    const parsedTime = Date.parse(workingTx.timestamp);
    if (Number.isNaN(parsedTime) || workingTx.anomalyType === 'invalid_date') {
      if (config.fixMalformedDates) {
        datesNormalized++;
        // Fallback to 10 days before reference date
        const fallbackDate = new Date(new Date(REFERENCE_DATE_ISO).getTime() - 10 * 86400 * 1000);
        workingTx.timestamp = fallbackDate.toISOString();
      } else {
        rejected.push({ ...workingTx, isCleanedOut: true });
        continue;
      }
    }

    // 5. Check extreme monetary outliers
    if (workingTx.amount > config.outlierCapThreshold || workingTx.anomalyType === 'outlier_amount') {
      if (config.capExtremeOutliers && workingTx.amount > config.outlierCapThreshold) {
        outliersCapped++;
        workingTx.amount = config.outlierCapThreshold;
      }
    }

    cleaned.push(workingTx);
  }

  return {
    cleanedTransactions: cleaned,
    rejectedTransactions: rejected,
    stats: {
      totalRaw: rawTransactions.length,
      totalValid: cleaned.length,
      duplicatesRemoved,
      missingIdsDropped,
      negativeExcluded,
      datesNormalized,
      outliersCapped,
    },
  };
}

function scoreRecency(days: number, thresholds: [number, number, number, number]): 1 | 2 | 3 | 4 | 5 {
  if (days <= thresholds[0]) return 5;
  if (days <= thresholds[1]) return 4;
  if (days <= thresholds[2]) return 3;
  if (days <= thresholds[3]) return 2;
  return 1;
}

function scoreFrequency(count: number, thresholds: [number, number, number, number]): 1 | 2 | 3 | 4 | 5 {
  if (count >= thresholds[3]) return 5;
  if (count >= thresholds[2]) return 4;
  if (count >= thresholds[1]) return 3;
  if (count >= thresholds[0]) return 2;
  return 1;
}

function scoreMonetary(spend: number, thresholds: [number, number, number, number]): 1 | 2 | 3 | 4 | 5 {
  if (spend >= thresholds[3]) return 5;
  if (spend >= thresholds[2]) return 4;
  if (spend >= thresholds[1]) return 3;
  if (spend >= thresholds[0]) return 2;
  return 1;
}

export function classifySegment(
  r: 1 | 2 | 3 | 4 | 5,
  f: 1 | 2 | 3 | 4 | 5,
  m: 1 | 2 | 3 | 4 | 5
): SegmentId {
  // Champions: Bought very recently (4-5), high frequency (4-5), and high monetary (4-5)
  if (r >= 4 && f >= 4 && m >= 4) {
    return 'champions';
  }
  // Loyal Customers: R >= 3 and F >= 4
  if (r >= 3 && f >= 4) {
    return 'loyal';
  }
  // At Risk / Churn Risk: Low recency (1-2), but historically strong frequency (f >= 3) or high monetary (m >= 4)
  if (r <= 2 && (f >= 3 || m >= 4)) {
    return 'churn_risk';
  }
  // New Customers: High recency (4-5) and first-time buyer (f === 1)
  if (r >= 4 && f === 1) {
    return 'new_customers';
  }
  // Potential Loyalists: Recent (r >= 3) and moderate frequency (f >= 2)
  if (r >= 3 && f >= 2) {
    return 'potential_loyalist';
  }
  // Default remaining low-recency, low-frequency into Hibernating
  return 'hibernating';
}

export function calculateCustomerRFM(
  cleanedTransactions: RawTransaction[],
  thresholds: RFMThresholds = DEFAULT_RFM_THRESHOLDS,
  referenceDateIso: string = REFERENCE_DATE_ISO
): CustomerRFM[] {
  const refTime = new Date(referenceDateIso).getTime();
  const grouped = new Map<string, RawTransaction[]>();

  for (const tx of cleanedTransactions) {
    const cid = tx.customerId || 'CUST-GUEST-UNASSIGNED';
    const existing = grouped.get(cid);
    if (existing) {
      existing.push(tx);
    } else {
      grouped.set(cid, [tx]);
    }
  }

  const customers: CustomerRFM[] = [];

  for (const [customerId, txs] of grouped.entries()) {
    // Sort customer transactions newest first
    const sorted = [...txs].sort((a, b) => {
      const ta = Date.parse(a.timestamp) || refTime;
      const tb = Date.parse(b.timestamp) || refTime;
      return tb - ta;
    });

    const latestTx = sorted[0];
    const oldestTx = sorted[sorted.length - 1];
    const latestMs = Date.parse(latestTx.timestamp) || refTime;
    const recencyDays = Math.max(0, Math.round((refTime - latestMs) / (86400 * 1000)));
    const frequency = sorted.length;
    const monetary = Math.round(sorted.reduce((sum, item) => sum + item.amount, 0));
    const avgOrderValue = frequency > 0 ? Math.round(monetary / frequency) : 0;

    const rScore = scoreRecency(recencyDays, thresholds.recencyDays);
    const fScore = scoreFrequency(frequency, thresholds.frequencyCount);
    const mScore = scoreMonetary(monetary, thresholds.monetarySpend);

    const segment = classifySegment(rScore, fScore, mScore);
    const rfmCode = `${rScore}${fScore}${mScore}`;
    const rfmComposite = Number(((rScore + fScore + mScore) / 3).toFixed(2));

    customers.push({
      customerId,
      customerName: latestTx.customerName,
      customerEmail: latestTx.customerEmail,
      region: latestTx.region,
      preferredChannel: latestTx.channel,
      preferredCategory: latestTx.category,
      firstPurchaseDate: oldestTx.timestamp,
      lastPurchaseDate: latestTx.timestamp,
      recencyDays,
      frequency,
      monetary,
      avgOrderValue,
      rScore,
      fScore,
      mScore,
      rfmCode,
      rfmComposite,
      segment,
      transactions: sorted,
    });
  }

  return customers.sort((a, b) => b.monetary - a.monetary);
}

// Generate a realistic live transaction for real-time simulation
export function createSimulatedLiveTransaction(
  existingCustomers: CustomerRFM[],
  stepIndex: number
): RawTransaction {
  const categories: RawTransaction['category'][] = [
    'Audio Hardware',
    'Workspace Ergonomics',
    'Smart Lighting',
    'Compute Peripherals',
    'Storage Media',
  ];
  const channels: RawTransaction['channel'][] = [
    'Web Store',
    'Mobile App',
    'POS Retail',
    'B2B Portal',
  ];

  // Every 5th simulated event, inject a dirty anomaly so the user can see real-time anomaly filtering in action
  const shouldInjectAnomaly = stepIndex % 5 === 4;
  const invoiceNum = 85200 + stepIndex;

  if (shouldInjectAnomaly) {
    const anomalyPool: AnomalyType[] = ['duplicate_invoice', 'missing_customer_id', 'negative_amount'];
    const chosenAnomaly = anomalyPool[stepIndex % anomalyPool.length];
    const targetCustomer = existingCustomers[stepIndex % existingCustomers.length];

    if (chosenAnomaly === 'missing_customer_id') {
      return {
        id: `TX-LIVE-${invoiceNum}`,
        invoiceNo: `INV-${invoiceNum}`,
        customerId: null,
        customerName: 'Unverified Guest Checkout',
        customerEmail: 'guest@checkout-session.io',
        region: 'North America',
        channel: 'POS Retail',
        category: 'Smart Lighting',
        timestamp: REFERENCE_DATE_ISO,
        amount: 290,
        quantity: 2,
        anomalyType: 'missing_customer_id',
      };
    }

    if (chosenAnomaly === 'negative_amount') {
      return {
        id: `TX-LIVE-${invoiceNum}`,
        invoiceNo: `INV-${invoiceNum}`,
        customerId: targetCustomer.customerId,
        customerName: targetCustomer.customerName,
        customerEmail: targetCustomer.customerEmail,
        region: targetCustomer.region,
        channel: 'Web Store',
        category: targetCustomer.preferredCategory as RawTransaction['category'],
        timestamp: REFERENCE_DATE_ISO,
        amount: -240,
        quantity: -1,
        anomalyType: 'negative_amount',
      };
    }

    return {
      id: `TX-LIVE-${invoiceNum}`,
      invoiceNo: 'INV-84101', // Duplicate invoice ID
      customerId: targetCustomer.customerId,
      customerName: targetCustomer.customerName,
      customerEmail: targetCustomer.customerEmail,
      region: targetCustomer.region,
      channel: 'B2B Portal',
      category: targetCustomer.preferredCategory as RawTransaction['category'],
      timestamp: REFERENCE_DATE_ISO,
      amount: 480,
      quantity: 2,
      anomalyType: 'duplicate_invoice',
    };
  }

  // Prioritize Churn Risk or Potential Loyalists or New Customers so user sees live segment transitions!
  const priorityCandidates = existingCustomers.filter(
    (c) => c.segment === 'churn_risk' || c.segment === 'new_customers' || c.segment === 'potential_loyalist'
  );
  const pool = priorityCandidates.length > 0 ? priorityCandidates : existingCustomers;
  const chosen = pool[stepIndex % pool.length];
  const amount = 280 + ((stepIndex * 95) % 450);

  return {
    id: `TX-LIVE-${invoiceNum}`,
    invoiceNo: `INV-${invoiceNum}`,
    customerId: chosen.customerId,
    customerName: chosen.customerName,
    customerEmail: chosen.customerEmail,
    region: chosen.region,
    channel: channels[stepIndex % channels.length],
    category: categories[stepIndex % categories.length],
    timestamp: REFERENCE_DATE_ISO,
    amount,
    quantity: Math.max(1, Math.round(amount / 150)),
    anomalyType: 'valid',
  };
}
