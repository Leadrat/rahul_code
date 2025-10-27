// Lightweight IndexedDB helper for storing/retrieving games
export function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('tictactoe', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('games')) {
        db.createObjectStore('games', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGames(games: any[]) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('games', 'readwrite');
    const store = tx.objectStore('games');
    games.forEach((g) => store.put(g));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveGame(game: any) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('games', 'readwrite');
    const store = tx.objectStore('games');
    store.put(game);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllGames() {
  const db = await openDB();
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction('games', 'readonly');
    const store = tx.objectStore('games');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as any[]);
    req.onerror = () => reject(req.error);
  });
}

export async function getGame(id: string) {
  const db = await openDB();
  return new Promise<any>((resolve, reject) => {
    const tx = db.transaction('games', 'readonly');
    const store = tx.objectStore('games');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
