import { ShoppingTrip } from "../types";

const STORAGE_KEY = "carttracker_history_v1";

export const saveTrip = (trip: ShoppingTrip) => {
  const existing = getHistory();
  const updated = [trip, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getHistory = (): ShoppingTrip[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getAllItemsFlat = (): { name: string; price: number; date: number; store: string }[] => {
  const history = getHistory();
  const allItems: { name: string; price: number; date: number; store: string }[] = [];
  
  history.forEach(trip => {
    trip.items.forEach(item => {
      allItems.push({
        name: item.name,
        price: item.price / item.quantity, // Normalized unit price
        date: trip.date,
        store: trip.storeName
      });
    });
  });
  
  return allItems.sort((a, b) => a.date - b.date);
};

export const getWeeklyItemData = (): Record<string, string[]> => {
  const history = getHistory();
  const weeks: Record<string, string[]> = {};

  // Sort history by date descending
  const sortedHistory = [...history].sort((a, b) => b.date - a.date);

  sortedHistory.forEach(trip => {
    const date = new Date(trip.date);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Adjust to Sunday
    const weekKey = startOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    if (!weeks[weekKey]) {
        weeks[weekKey] = [];
    }
    trip.items.forEach(item => {
        weeks[weekKey].push(item.name);
    });
  });
  
  return weeks;
};
