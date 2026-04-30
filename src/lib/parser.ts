import type { Category, Account, SinkingFund } from '../types';

export interface ParseContext {
  categories: Category[];
  accounts: Account[];
  funds: SinkingFund[];
}

export interface ParseResult {
  action: 'create_transaction' | 'contribute_fund';
  amount: number | null;
  type: 'income' | 'expense';
  description: string;
  category_id: number | null;
  account_id: number | null;
  date: string;
  fund_id: number | null;
  confidence: 'high' | 'medium' | 'low';
  unresolved: string[];
}

// ─── Category keyword aliases ─────────────────────────────────────────────────
// Keys are normalized (lowercase) category names. Values extend matching keywords.
// Keywords are stored already stemmed (no trailing 's' for plurals).

const CATEGORY_ALIASES: Record<string, string[]> = {
  // Default expense categories from db.ts seed:
  // Housing, Food & Dining, Transportation, Utilities, Entertainment,
  // Shopping, Health, Personal Care, Subscriptions, Other, Savings

  'food & dining': [
    'restaurant', 'coffee', 'cafe', 'starbuck', 'dunkin', 'mcdonald', 'wendy',
    'burger', 'pizza', 'chipotle', 'subway', 'lunch', 'dinner', 'breakfast',
    'doordash', 'grubhub', 'ubereat', 'takeout', 'fastfood', 'eat',
    'taco', 'chickfila', 'dominos', 'panera', 'sushi', 'thai', 'chinese',
    'mexican', 'italian', 'snack', 'meal', 'brunch',
    // phrases
    'eating out', 'eat out', 'ate out', 'dine out', 'dining out',
    'fast food', 'drive thru', 'drive through', 'take out', 'to go',
    'grabbed lunch', 'grabbed dinner', 'grabbed breakfast', 'grabbed coffee',
    'grabbed a bite', 'grab a bite', 'got lunch', 'got dinner', 'got breakfast',
    'got coffee', 'out to eat', 'went to eat', 'ordered food', 'ordered takeout',
    'happy hour', 'date night', 'food delivery',
  ],

  groceries: [
    'grocery', 'supermarket', 'produce',
    'kroger', 'safeway', 'aldi', 'publix', 'heb', 'wegman', 'meijer',
    'sprout', 'cashsaver', 'foodlion', 'shoprite', 'vons', 'albertson',
    // phrases
    'food lion', 'harris teeter', 'whole foods', 'trader joe',
    'stop and shop', 'winn dixie', 'fresh market', 'cash saver',
    'grocery shopping', 'grocery run', 'food shopping', 'stocked up',
    'weekly groceries', 'weekly shop', 'grocery store',
  ],

  transportation: [
    'gas', 'fuel', 'uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'parking',
    'toll', 'shell', 'bp', 'exxon', 'chevron', 'mobil', 'sunoco', 'gasoline',
    'rideshare', 'transit', 'car', 'vehicle', 'mechanic', 'tire',
    'speedway',
    // phrases
    'filled up', 'fill up', 'filling up', 'fuel up', 'got gas', 'gas station',
    'gas tank', 'oil change', 'car wash', 'car payment', 'car repair',
    'bus fare', 'train fare', 'subway fare', 'parking fee', 'parking meter',
    'car maintenance',
  ],

  utilities: [
    'electric', 'electricity', 'power', 'water', 'internet', 'wifi', 'cable',
    'pge', 'att', 'verizon', 'tmobile', 'comcast', 'xfinity', 'utility',
    'energy', 'sewer', 'trash', 'garbage',
    // phrases
    'electric bill', 'water bill', 'gas bill', 'internet bill', 'phone bill',
    'cable bill', 'utility bill', 'power bill', 'trash bill', 'sewer bill',
    'paid the bill', 'monthly bill', 'cell phone', 'cell bill',
  ],

  housing: [
    'rent', 'mortgage', 'lease', 'landlord', 'apartment', 'hoa', 'property',
    'escrow', 'pmi',
    // phrases
    'paid rent', 'paid mortgage', 'rent payment', 'mortgage payment',
    'home insurance', 'renters insurance', 'property tax', 'hoa dues',
  ],

  entertainment: [
    'netflix', 'hulu', 'disney', 'spotify', 'youtube', 'movie', 'cinema',
    'concert', 'ticket', 'gaming', 'steam', 'playstation', 'xbox', 'nintendo',
    'twitch', 'show', 'theater', 'theatre',
    // phrases
    'movie night', 'saw a movie', 'went to the movies', 'went to a movie',
    'video game', 'video games', 'board game', 'bowling', 'mini golf',
    'concert tickets', 'bought tickets', 'escape room', 'arcade',
  ],

  shopping: [
    'amazon', 'bestbuy', 'clothing', 'clothe', 'clothes', 'shoe', 'mall', 'store',
    'online', 'ebay', 'etsy', 'wayfair', 'shirt', 'pant', 'dress', 'jacket',
    'coat', 'sock', 'walmart', 'target', 'costco', 'sam', 'kohl', 'macy',
    'nordstrom', 'tjmax', 'marshall', 'ikea', 'homegood', 'homedepot', 'lowe',
    // phrases
    'went shopping', 'online order', 'online shopping', 'bought clothes',
    'new shoes', 'new clothes', 'new shirt', 'home depot', 'home goods',
    'best buy', 'sam club', 'sams club',
  ],

  health: [
    'doctor', 'hospital', 'pharmacy', 'cvs', 'walgreen', 'medical', 'dental',
    'dentist', 'prescription', 'medicine', 'copay', 'clinic', 'urgent', 'therapy',
    'therapist', 'vision', 'glass', 'rx',
    // phrases
    'doctor visit', 'doctor appointment', 'dentist appointment', 'urgent care',
    'eye exam', 'prescription refill', 'co pay', 'er visit', 'emergency room',
    'physical therapy', 'eye doctor', 'contact lenses',
  ],

  'personal care': [
    'haircut', 'salon', 'barber', 'nail', 'spa', 'hygiene', 'toiletry', 'gym',
    'fitness', 'shampoo', 'soap', 'makeup', 'cosmetic',
    // phrases
    'got a haircut', 'got haircut', 'hair cut', 'nail salon', 'mani pedi',
    'gym membership', 'personal trainer', 'massage therapy', 'skin care',
  ],

  subscriptions: [
    'netflix', 'hulu', 'disney', 'spotify', 'youtube', 'apple', 'subscription',
    'monthly', 'annual', 'membership',
    // phrases
    'amazon prime', 'apple music', 'apple tv', 'monthly subscription',
    'annual fee', 'yearly fee', 'subscription renewal', 'auto renew',
    'youtube premium', 'hbo max', 'paramount plus',
  ],

  savings: [
    'save', 'saving', 'fund', 'emergency', 'piggy', 'sinking', 'contribution',
    // phrases
    'savings account', 'emergency fund', 'put aside', 'set aside',
    'rainy day', 'nest egg',
  ],

  other: [],

  // Default income categories: Paycheck, Freelance, Transfer, Other Income
  paycheck: [
    'salary', 'wage', 'pay', 'paid', 'income', 'work', 'job', 'employer',
    'biweekly', 'hourly', 'shift',
    // phrases
    'direct deposit', 'got paid', 'pay day', 'payday', 'paycheck deposit',
    'work paid', 'weekly pay', 'biweekly pay', 'monthly pay',
  ],
  freelance: [
    'contract', 'client', 'invoice', 'consulting', 'gig',
    // phrases
    'self employed', 'side hustle', 'freelance gig', 'client paid',
    'invoice paid', 'consulting fee', 'contract work',
  ],
  transfer: [
    'transfer', 'deposit', 'moved', 'sent',
    // phrases
    'bank transfer', 'wire transfer', 'moved money', 'transferred funds',
    'account transfer',
  ],
  'other income': [
    'bonus', 'refund', 'reimbursement', 'rebate', 'cashback', 'gift',
    'interest', 'dividend',
    // phrases
    'tax refund', 'birthday money', 'christmas money', 'gift card',
    'cash back', 'sold on ebay', 'yard sale', 'garage sale',
  ],

  // Common alternate names (in case user renames)
  food: [
    'restaurant', 'grocery', 'cafe', 'dining', 'lunch', 'dinner', 'coffee',
    'eat', 'pizza', 'burger', 'kroger', 'supermarket',
  ],
  dining: [
    'restaurant', 'coffee', 'cafe', 'lunch', 'dinner', 'breakfast', 'pizza',
    'burger', 'eat', 'starbuck',
  ],
  grocery: [
    'groceries', 'kroger', 'safeway', 'aldi', 'supermarket', 'food',
  ],
  gas: ['fuel', 'shell', 'bp', 'exxon', 'chevron', 'mobil', 'gasoline'],
  auto: ['gas', 'fuel', 'car', 'vehicle', 'mechanic', 'repair', 'oil', 'tire'],
  transport: ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'parking'],
  rent: ['mortgage', 'lease', 'landlord', 'housing', 'apartment'],
  utility: ['electric', 'water', 'internet', 'wifi', 'cable', 'phone', 'bill'],
  medical: ['doctor', 'hospital', 'pharmacy', 'dental', 'prescription'],
  salary: ['paycheck', 'wage', 'pay', 'income', 'work', 'job'],
  income: ['salary', 'paycheck', 'wage', 'pay', 'earned'],
  refund: ['reimbursement', 'rebate', 'cashback', 'return', 'refunded'],
};

// ─── Trigger words ────────────────────────────────────────────────────────────
// Only unambiguous income signals — "paid" and "got" are too ambiguous alone.

const INCOME_TRIGGERS = new Set([
  'received', 'earned', 'income', 'paycheck', 'salary', 'wage', 'wages',
  'deposited', 'refund', 'refunded', 'reimbursed', 'reimbursement',
  'sold', 'bonus', 'commission', 'tip', 'tips', 'freelance', 'invoice', 'collected',
]);

const FUND_ACTION_WORDS = /\b(?:add(?:ed)?|put|contribut(?:ed?|ing)?|transfer(?:red)?|mov(?:ed?|ing)?|sav(?:ed?|ing)?|deposit(?:ed)?)\b/i;
const FUND_DESTINATION_WORDS = /\b(?:to|into|in|for|toward[s]?)\b/i;

// Words to strip from descriptions
const STOPWORDS = new Set([
  'on', 'at', 'from', 'for', 'the', 'a', 'an', 'to', 'in', 'into', 'my', 'of',
  'i', 'was', 'is', 'are', 'this', 'that', 'it', 'just', 'some', 'got',
  'paid', 'spent', 'bought', 'purchased', 'received', 'earned', 'ordered',
  'yesterday', 'today', 'dollar', 'dollars', 'buck', 'bucks', 'and', 'or',
  'with', 'of', 'me', 'us', 'we',
]);

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function lastWeekday(dayName: string): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const target = days.indexOf(dayName.toLowerCase());
  if (target === -1) return todayStr();
  const d = new Date();
  const current = d.getDay();
  let diff = current - target;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function buildDateFromMonthDay(monthIdx: number, day: number, explicitYear?: number): string {
  const today = new Date();
  let year = explicitYear ?? today.getFullYear();

  if (!explicitYear) {
    // Smart year: if resulting date would be in the future, assume prior year
    // (transactions are typically past events)
    const candidate = new Date(year, monthIdx, day);
    candidate.setHours(0, 0, 0, 0);
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);
    if (candidate > todayMidnight) {
      year -= 1;
    }
  }

  const m = String(monthIdx + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

// ─── Extraction functions ─────────────────────────────────────────────────────

function extractDate(input: string): { date: string; remaining: string } {
  let text = input;

  if (/\byesterday\b/i.test(text)) {
    return { date: daysAgo(1), remaining: text.replace(/\byesterday\b/i, ' ').trim() };
  }

  if (/\btoday\b/i.test(text)) {
    return { date: todayStr(), remaining: text.replace(/\btoday\b/i, ' ').trim() };
  }

  const daysAgoMatch = text.match(/\b(\d+)\s+days?\s+ago\b/i);
  if (daysAgoMatch) {
    return { date: daysAgo(parseInt(daysAgoMatch[1])), remaining: text.replace(daysAgoMatch[0], ' ').trim() };
  }

  // Only match weekday with explicit qualifier: "last monday", "on monday"
  const weekdayMatch = text.match(/\b(?:last|on|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (weekdayMatch) {
    return { date: lastWeekday(weekdayMatch[1]), remaining: text.replace(weekdayMatch[0], ' ').trim() };
  }

  // "April 15", "April the 15th", "Apr 15th", "April 15, 2026"
  const monthFirst = text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?(?:[,\s]+(\d{4}))?\b/i);
  if (monthFirst) {
    const monthIdx = MONTHS[monthFirst[1].toLowerCase()];
    const day = parseInt(monthFirst[2]);
    const yr = monthFirst[3] ? parseInt(monthFirst[3]) : undefined;
    if (monthIdx !== undefined && day >= 1 && day <= 31) {
      return { date: buildDateFromMonthDay(monthIdx, day, yr), remaining: text.replace(monthFirst[0], ' ').trim() };
    }
  }

  // "15 April", "the 15th of April", "15 apr 2026"
  const dayFirst = text.match(/\b(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:[,\s]+(\d{4}))?\b/i);
  if (dayFirst) {
    const monthIdx = MONTHS[dayFirst[2].toLowerCase()];
    const day = parseInt(dayFirst[1]);
    const yr = dayFirst[3] ? parseInt(dayFirst[3]) : undefined;
    if (monthIdx !== undefined && day >= 1 && day <= 31) {
      return { date: buildDateFromMonthDay(monthIdx, day, yr), remaining: text.replace(dayFirst[0], ' ').trim() };
    }
  }

  // MM/DD or MM/DD/YY — require at least one / with digits on both sides
  const slashDate = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slashDate) {
    const m = slashDate[1].padStart(2, '0');
    const d2 = slashDate[2].padStart(2, '0');
    const yr = slashDate[3]
      ? (slashDate[3].length === 2 ? '20' + slashDate[3] : slashDate[3])
      : new Date().getFullYear().toString();
    return { date: `${yr}-${m}-${d2}`, remaining: text.replace(slashDate[0], ' ').trim() };
  }

  return { date: todayStr(), remaining: text.trim() };
}

// Matches: 2000, 2,000, 2,000.50, 47.50, 0.99
// Does NOT match: ,000 (orphan), ,,, (garbage)
const NUM_PATTERN = `(?:\\d{1,3}(?:,\\d{3})+(?:\\.\\d{1,2})?|\\d{1,7}(?:[.,]\\d{1,2})?)`;

function parseNumberString(raw: string): number {
  // If it contains a thousands-separator pattern (digit, three-digits), strip commas
  if (/\d,\d{3}/.test(raw)) return parseFloat(raw.replace(/,/g, ''));
  // Otherwise a lone comma is a decimal separator (European style)
  return parseFloat(raw.replace(',', '.'));
}

function extractAmount(input: string): { amount: number | null; remaining: string } {
  // Priority 1: $47, $2,000, $47.50 — explicit marker
  let match = input.match(new RegExp(`\\$\\s*(${NUM_PATTERN})`));

  // Priority 2: 47 dollars / 2,000 bucks
  if (!match) match = input.match(new RegExp(`(${NUM_PATTERN})\\s*(?:dollars?|bucks?)\\b`, 'i'));

  // Priority 3: decimal number (likely an amount) — e.g. 47.50, 4.99, 1,234.56
  if (!match) match = input.match(/\b(\d{1,3}(?:,\d{3})+\.\d{1,2}|\d{1,7}[.,]\d{1,2})\b/);

  // Priority 4: comma-grouped integer (e.g. 2,000)
  if (!match) match = input.match(/\b(\d{1,3}(?:,\d{3})+)\b/);

  // Priority 5: first bare integer
  if (!match) match = input.match(/\b(\d{1,7})\b/);

  if (!match) return { amount: null, remaining: input };

  const amount = parseNumberString(match[1] ?? match[0]);
  if (isNaN(amount) || amount <= 0) return { amount: null, remaining: input };

  return {
    amount,
    remaining: input.replace(match[0], ' ').replace(/\s+/g, ' ').trim(),
  };
}

function stem(token: string): string {
  // groceries → grocery, bakeries → bakery
  if (token.length >= 5 && token.endsWith('ies')) {
    return token.slice(0, -3) + 'y';
  }
  // restaurants → restaurant (strip trailing 's' from 4+ char words, skip "ss")
  if (token.length >= 4 && token.endsWith('s') && !token.endsWith('ss')) {
    return token.slice(0, -1);
  }
  return token;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map(stem);
}

// ─── Matching functions ───────────────────────────────────────────────────────

function buildCategoryKeywords(cat: Category): Set<string> {
  const name = cat.name.toLowerCase().trim();
  const nameWords = name
    .split(/[\s&,\/\-]+/)
    .filter((w) => w.length > 1)
    .map(stem);
  const aliases = (CATEGORY_ALIASES[name] ?? []).map(stem);
  return new Set([...nameWords, ...aliases]);
}

function matchCategory(tokens: string[], allText: string, categories: Category[], type: 'income' | 'expense'): number | null {
  const eligible = categories.filter((c) => c.type === type);
  if (eligible.length === 0) return null;

  let bestId: number | null = null;
  let bestScore = 0;

  for (const cat of eligible) {
    const keywords = buildCategoryKeywords(cat);
    let score = 0;

    for (const token of tokens) {
      if (keywords.has(token)) score += 2;
    }

    // Multi-word keyword (raw alias text may include spaces — e.g. "direct deposit")
    const lowerText = allText.toLowerCase();
    const rawAliases = CATEGORY_ALIASES[cat.name.toLowerCase().trim()] ?? [];
    for (const kw of rawAliases) {
      if (kw.includes(' ') && lowerText.includes(kw)) score += 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestId = cat.id;
    }
  }

  // Require at least one strong match (score of 2)
  return bestScore >= 2 ? bestId : null;
}

function matchAccount(tokens: string[], accounts: Account[]): number | null {
  for (const account of accounts) {
    const nameParts = account.name.toLowerCase().split(/\s+/).map(stem);
    if (nameParts.some((part) => part.length > 2 && tokens.includes(part))) {
      return account.id;
    }
  }
  return null;
}

function matchFund(text: string, funds: SinkingFund[]): SinkingFund | null {
  const lower = text.toLowerCase();
  // Exact name match
  for (const fund of funds) {
    if (lower.includes(fund.name.toLowerCase())) return fund;
  }
  // Partial word match on meaningful word (4+ chars)
  let best: SinkingFund | null = null;
  let bestLen = 0;
  for (const fund of funds) {
    const parts = fund.name.toLowerCase().split(/\s+/).filter((p) => p.length > 3);
    for (const part of parts) {
      if (lower.includes(part) && part.length > bestLen) {
        best = fund;
        bestLen = part.length;
      }
    }
  }
  return best;
}

function detectType(tokens: string[], raw: string): 'income' | 'expense' {
  // Unambiguous income phrases
  if (/\bgot\s+(?:my\s+)?paid\b|\bgot\s+(?:my\s+)?paycheck\b|\breceived\s+(?:my\s+)?(?:paycheck|pay)\b|\bgot\s+paid\b|\bdirect\s+deposit\b/i.test(raw)) {
    return 'income';
  }

  for (const token of tokens) {
    if (INCOME_TRIGGERS.has(token)) return 'income';
  }

  return 'expense';
}

function isFundContribution(raw: string, funds: SinkingFund[]): boolean {
  if (!FUND_ACTION_WORDS.test(raw)) return false;
  if (!FUND_DESTINATION_WORDS.test(raw)) return false;
  return matchFund(raw, funds) !== null;
}

function buildDescription(remaining: string, originalRaw: string): string {
  // Strip known stopwords, trigger words, plus any residual digits
  const cleanedTokens = remaining
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  if (cleanedTokens.length === 0) {
    // Fall back to original text with stopwords stripped
    const fallback = originalRaw
      .toLowerCase()
      .replace(/\$?\d+(?:[.,]\d{1,2})?/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w));
    if (fallback.length === 0) return '';
    return capitalize(fallback.join(' '));
  }

  return capitalize(cleanedTokens.join(' '));
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getDefaultAccountId(accounts: Account[]): number | null {
  const defaultAcct = accounts.find((a) => a.is_default === 1);
  if (defaultAcct) return defaultAcct.id;
  return accounts.length > 0 ? accounts[0].id : null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function parseInput(raw: string, context: ParseContext): ParseResult {
  const { categories, accounts, funds } = context;
  const unresolved: string[] = [];

  if (!raw.trim()) {
    return {
      action: 'create_transaction',
      amount: null,
      type: 'expense',
      description: '',
      category_id: null,
      account_id: getDefaultAccountId(accounts),
      date: todayStr(),
      fund_id: null,
      confidence: 'low',
      unresolved: ['amount', 'description'],
    };
  }

  // 1. Extract date
  const { date, remaining: afterDate } = extractDate(raw);

  // 2. Detect fund contribution
  if (isFundContribution(raw, funds)) {
    const fund = matchFund(raw, funds)!;
    const { amount } = extractAmount(afterDate);
    const tokens = tokenize(afterDate);
    const acct = matchAccount(tokens, accounts) ?? getDefaultAccountId(accounts);
    if (amount === null) unresolved.push('amount');
    return {
      action: 'contribute_fund',
      amount,
      type: 'expense',
      description: `Contribution to ${fund.name}`,
      category_id: null,
      account_id: acct,
      date,
      fund_id: fund.id,
      confidence: amount !== null ? 'high' : 'medium',
      unresolved,
    };
  }

  // 3. Extract amount
  const { amount, remaining: afterAmount } = extractAmount(afterDate);
  if (amount === null) unresolved.push('amount');

  // 4. Tokenize remaining
  const tokens = tokenize(afterAmount);

  // 5. Detect type
  const type = detectType(tokens, raw);

  // 6. Match category
  const category_id = matchCategory(tokens, afterAmount, categories, type);
  if (category_id === null) unresolved.push('category');

  // 7. Match account (fall back to default)
  const matchedAccount = matchAccount(tokens, accounts);
  const account_id = matchedAccount ?? getDefaultAccountId(accounts);

  // 8. Build description
  const description = buildDescription(afterAmount, raw);

  // 9. Confidence
  let confidence: 'high' | 'medium' | 'low';
  if (amount !== null && category_id !== null && description.length > 1) {
    confidence = 'high';
  } else if (amount !== null) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    action: 'create_transaction',
    amount,
    type,
    description,
    category_id,
    account_id,
    date,
    fund_id: null,
    confidence,
    unresolved,
  };
}
