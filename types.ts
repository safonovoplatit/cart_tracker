export interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  category: string; // AI determined
  quantity: number;
  timestamp: number;
  imageUrl?: string; // AI generated
}

export interface ShoppingTrip {
  id: string;
  storeName: string;
  date: number; // timestamp
  budget: number;
  items: ShoppingItem[];
  totalSpent: number;
}

export interface ProductPricePoint {
  date: number;
  price: number;
  storeName: string;
}

export type AppView = 'home' | 'active-trip' | 'history' | 'analytics';

export interface CategoryChartData {
  name: string;
  value: number;
}

export interface WeeklySummary {
  week: string;
  summary: string;
}
