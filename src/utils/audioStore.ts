// Persists uploaded recording audio in IndexedDB so playback survives page reloads
// (object URLs die with the page and audio is too large for localStorage)
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

export async function saveRecordingAudio(recordingId: string, audio: Blob): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.put(audio, recordingId));
  } catch (err) {
    console.warn('Could not persist recording audio:', err);
  }
}

export async function loadRecordingAudio(recordingId: string): Promise<Blob | null> {
  try {
    const audio = await withStore<Blob | undefined>('readonly', (store) => store.get(recordingId));
    return audio || null;
  } catch (err) {
    console.warn('Could not load recording audio:', err);
    return null;
  }
}

export async function deleteRecordingAudio(recordingId: string): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.delete(recordingId));
  } catch (err) {
    console.warn('Could not delete recording audio:', err);
  }
}

export async function clearRecordingAudio(): Promise<void> {
  try {
    await withStore('readwrite', (store) => store.clear());
  } catch (err) {
    console.warn('Could not clear recording audio:', err);
  }
}
