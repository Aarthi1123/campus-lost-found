export type ItemCategory =
  | 'Electronics'
  | 'Clothing'
  | 'Bag'
  | 'Accessory'
  | 'Book'
  | 'ID Card'
  | 'Keys'
  | 'Wallet'
  | 'Other';

export const CATEGORIES: ItemCategory[] = [
  'Electronics',
  'Clothing',
  'Bag',
  'Accessory',
  'Book',
  'ID Card',
  'Keys',
  'Wallet',
  'Other',
];

export const CATEGORY_ICONS: Record<ItemCategory, string> = {
  Electronics: 'laptop',
  Clothing: 'shirt',
  Bag: 'briefcase',
  Accessory: 'watch',
  Book: 'book-open',
  'ID Card': 'credit-card',
  Keys: 'key',
  Wallet: 'wallet',
  Other: 'package',
};

export interface LostItem {
  id: string;
  reporter_name: string;
  reporter_contact: string;
  item_name: string;
  category: string;
  color: string;
  brand: string;
  tags: string[] | null;
  description: string;
  location: string;
  lost_date: string | null;
  photo_url: string;
  status: string;
  created_at: string;
}

export interface FoundItem {
  id: string;
  finder_name: string;
  finder_contact: string;
  item_name: string;
  category: string;
  color: string;
  brand: string;
  tags: string[] | null;
  description: string;
  location: string;
  found_date: string | null;
  photo_url: string;
  status: string;
  created_at: string;
}

export type MatchLevel = 'Very High' | 'High' | 'Possible' | 'Low';

export interface FieldMatch {
  field: string;
  label: string;
  matched: boolean;
  lostValue: string;
  foundValue: string;
  weight: number;
  score: number;
}

export interface MatchResult {
  lostItem: LostItem;
  foundItem: FoundItem;
  confidence: number;
  level: MatchLevel;
  fieldMatches: FieldMatch[];
  summary: string;
}
