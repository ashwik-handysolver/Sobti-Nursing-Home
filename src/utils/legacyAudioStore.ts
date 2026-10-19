// Audio saved in this browser (IndexedDB) by earlier versions of the app.
// Only read once, to move it into Supabase Storage, then cleared.
const DB_NAME = 'meetmind_audio_v1';
const STORE_NAME = 'recordings';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = run(tx.objectStore(STORE_NAME));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function loadLegacyAudio(recordingId: string): Promise<Blob | null> {
  try {
    const audio = await withStore<Blob | undefined>('readonly', (store) => store.get(recordingId));
    return audio || null;
  } catch (err) {
    console.warn('Could not load recording audio:', err);
    return null;
  }
}

export async function clearLegacyAudio(): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.clear());
  } catch (err) {
    console.warn('Could not clear recording audio:', err);
  }
}
