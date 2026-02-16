import { ShoppingTrip } from "../types";

const DB_NAME = 'CartTrackerDB';
const STORE_NAME = 'trips';
const DB_VERSION = 1;
const LOCAL_STORAGE_KEY = "carttracker_history_v1";

// Open (and initialize) the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// Migrate data from LocalStorage to IndexedDB if it exists
const migrateIfNeeded = async (db: IDBDatabase) => {
    const lsData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (lsData) {
        try {
            const trips: ShoppingTrip[] = JSON.parse(lsData);
            if (trips.length > 0) {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                
                // Check count to prevent duplicates if migration ran partially before
                const countRequest = store.count();
                
                await new Promise<void>((resolve) => {
                     countRequest.onsuccess = () => {
                         if (countRequest.result === 0) {
                             // DB is empty, migrate all
                             trips.forEach(trip => {
                                 store.put(trip);
                             });
                             // Clear LS after scheduling puts
                             localStorage.removeItem(LOCAL_STORAGE_KEY);
                         }
                         resolve();
                     };
                     countRequest.onerror = () => resolve(); // Fail safe
                });
            } else {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
        } catch (e) {
            console.error("Migration failed", e);
        }
    }
}

export const saveTrip = async (trip: ShoppingTrip): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(trip);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getHistory = async (): Promise<ShoppingTrip[]> => {
  const db = await openDB();
  await migrateIfNeeded(db);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
        const result = (request.result as ShoppingTrip[]) || [];
        // Sort descending by date (newest first)
        result.sort((a, b) => b.date - a.date);
        resolve(result);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getAllItemsFlat = async (): Promise<{ name: string; price: number; date: number; store: string }[]> => {
  const history = await getHistory();
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

export const getWeeklyItemData = async (): Promise<Record<string, string[]>> => {
  const history = await getHistory();
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