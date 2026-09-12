import type { LostItem, FoundItem, MatchResult, MatchLevel, FieldMatch } from '@/types';


// ── Weighting ──────────────────────────────────────────────
// Each field contributes a portion of the total 100% score.
// Weights sum to 1.0. Fields that are empty in BOTH items are
// skipped (not counted against the score) so that a match isn't
// penalized just because someone didn't fill in a brand or tags.
const WEIGHTS = {
  itemName: 0.22,
  category: 0.18,
  color: 0.15,
  brand: 0.10,
  tags: 0.10,
  description: 0.10,
  location: 0.10,
  date: 0.05,
};

// ── String utilities ───────────────────────────────────────

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

function tokenize(str: string): string[] {
  return normalize(str)
    .split(/[\s,]+/)
    .filter((t) => t.length > 1);
}

// Jaccard similarity between two sets of tokens (0–1)
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  setA.forEach((t) => {
    if (setB.has(t)) intersection += 1;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Levenshtein-based similarity ratio (0–1)
function levenshteinRatio(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len = Math.max(s1.length, s2.length);
  if (len === 0) return 1;
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  const dist = matrix[s1.length][s2.length];
  return 1 - dist / len;
}

// ── Field scorers (each returns 0–1) ───────────────────────

function scoreExact(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  return levenshteinRatio(na, nb) >= 0.8 ? 0.85 : 0;
}

function scoreTokenSet(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  return jaccard(ta, tb);
}

function scoreCategory(a: string, b: string): number {
  return scoreExact(a, b);
}

function scoreColor(a: string, b: string): number {
  return scoreExact(a, b);
}

function scoreBrand(a: string, b: string): number {
  return scoreExact(a, b);
}

function scoreTags(a: string[] | null, b: string[] | null): number {
  const ta = (a ?? []).map(normalize).filter((t) => t);
  const tb = (b ?? []).map(normalize).filter((t) => t);
  if (ta.length === 0 || tb.length === 0) return 0;
  return jaccard(ta, tb);
}

function scoreDescription(a: string, b: string): number {
  return scoreTokenSet(a, b);
}

function scoreLocation(a: string, b: string): number {
  return scoreTokenSet(a, b);
}

function scoreDate(lostDate: string | null, foundDate: string | null): number {
  if (!lostDate || !foundDate) return 0;
  const lost = new Date(lostDate).getTime();
  const found = new Date(foundDate).getTime();
  if (isNaN(lost) || isNaN(found)) return 0;
  const diffDays = Math.abs(found - lost) / (1000 * 60 * 60 * 24);
  // Found within 0 days of lost = 1.0; decays over 30 days to 0.
  if (diffDays <= 0) return 1;
  if (diffDays >= 30) return 0;
  return 1 - diffDays / 30;
}

// ── Main matcher ───────────────────────────────────────────

function levelFor(confidence: number): MatchLevel {
  if (confidence >= 90) return 'Very High';
  if (confidence >= 70) return 'High';
  if (confidence >= 40) return 'Possible';
  return 'Low';
}

export function calculateMatch(lost: LostItem, found: FoundItem): MatchResult {
  const rawFields: { key: string; label: string; weight: number; score: number; lostValue: string; foundValue: string }[] = [
    {
      key: 'itemName',
      label: 'Item Name',
      weight: WEIGHTS.itemName,
      score: scoreExact(lost.item_name, found.item_name),
      lostValue: lost.item_name,
      foundValue: found.item_name,
    },
    {
      key: 'category',
      label: 'Category',
      weight: WEIGHTS.category,
      score: scoreCategory(lost.category, found.category),
      lostValue: lost.category,
      foundValue: found.category,
    },
    {
      key: 'color',
      label: 'Color',
      weight: WEIGHTS.color,
      score: scoreColor(lost.color, found.color),
      lostValue: lost.color,
      foundValue: found.color,
    },
    {
      key: 'brand',
      label: 'Brand',
      weight: WEIGHTS.brand,
      score: scoreBrand(lost.brand, found.brand),
      lostValue: lost.brand,
      foundValue: found.brand,
    },
    {
      key: 'tags',
      label: 'Tags',
      weight: WEIGHTS.tags,
      score: scoreTags(lost.tags, found.tags),
      lostValue: (lost.tags ?? []).join(', '),
      foundValue: (found.tags ?? []).join(', '),
    },
    {
      key: 'description',
      label: 'Description',
      weight: WEIGHTS.description,
      score: scoreDescription(lost.description, found.description),
      lostValue: lost.description,
      foundValue: found.description,
    },
    {
      key: 'location',
      label: 'Location',
      weight: WEIGHTS.location,
      score: scoreLocation(lost.location, found.location),
      lostValue: lost.location,
      foundValue: found.location,
    },
    {
      key: 'date',
      label: 'Date/Time',
      weight: WEIGHTS.date,
      score: scoreDate(lost.lost_date, found.found_date),
      lostValue: lost.lost_date ? new Date(lost.lost_date).toLocaleDateString() : '',
      foundValue: found.found_date ? new Date(found.found_date).toLocaleDateString() : '',
    },
  ];

  // Only include fields where at least one side has data.
  // If both sides are empty, the field is skipped and its weight
  // is redistributed proportionally to the remaining fields.
  const included = rawFields.filter(
    (f) => f.lostValue.trim() !== '' || f.foundValue.trim() !== ''
  );

  const totalWeight = included.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = included.reduce((sum, f) => sum + f.score * f.weight, 0);
  const rawConfidence = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  const confidence = Math.round(rawConfidence);

  const fieldMatches: FieldMatch[] = included.map((f) => ({
    field: f.key,
    label: f.label,
    matched: f.score >= 0.5,
    lostValue: f.lostValue,
    foundValue: f.foundValue,
    weight: f.weight,
    score: Math.round(f.score * 100),
  }));

  const matchedLabels = fieldMatches.filter((f) => f.matched).map((f) => f.label);
  const summary =
    matchedLabels.length > 0
      ? `This item is likely yours because the ${matchedLabels.join(', ')} ${
          matchedLabels.length === 1 ? 'closely matches' : 'closely match'
        } your lost-item report.`
      : 'This item has some differences from your lost-item report. Review the details carefully.';

  return {
    lostItem: lost,
    foundItem: found,
    confidence,
    level: levelFor(confidence),
    fieldMatches,
    summary,
  };
}

export function findMatchesForFoundItem(found: FoundItem, lostItems: LostItem[]): MatchResult[] {
  return lostItems
    .filter((l) => l.status === 'active')
    .map((l) => calculateMatch(l, found))
    .sort((a, b) => b.confidence - a.confidence);
}

export function findMatchesForLostItem(lost: LostItem, foundItems: FoundItem[]): MatchResult[] {
  return foundItems
    .filter((f) => f.status === 'active')
    .map((f) => calculateMatch(lost, f))
    .sort((a, b) => b.confidence - a.confidence);
}
