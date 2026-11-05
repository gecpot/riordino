import { PdfBatch, SavedCsvData, ItemOverride } from '../types';

const DB_NAME = 'riordino_fumetti_db';
const DB_VERSION = 1;
const STORE_NAME = 'session_store';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Errore lettura IndexedDB:', e);
    return null;
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Errore scrittura IndexedDB:', e);
  }
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Errore cancellazione IndexedDB:', e);
  }
}

const KEY_PDF_BATCHES = 'pdf_batches_v1';
const KEY_CSV_DATA = 'csv_data_v1';
const KEY_OVERRIDES = 'item_overrides_v1';

export async function loadPdfBatches(): Promise<PdfBatch[]> {
  return (await idbGet<PdfBatch[]>(KEY_PDF_BATCHES)) || [];
}

export async function savePdfBatches(batches: PdfBatch[]): Promise<void> {
  await idbSet(KEY_PDF_BATCHES, batches);
}

export async function loadCsvData(): Promise<SavedCsvData | null> {
  return await idbGet<SavedCsvData>(KEY_CSV_DATA);
}

export async function saveCsvData(data: SavedCsvData | null): Promise<void> {
  if (data === null) {
    await idbDelete(KEY_CSV_DATA);
  } else {
    await idbSet(KEY_CSV_DATA, data);
  }
}

export async function loadOverrides(): Promise<Record<string, ItemOverride>> {
  return (await idbGet<Record<string, ItemOverride>>(KEY_OVERRIDES)) || {};
}

export async function saveOverrides(overrides: Record<string, ItemOverride>): Promise<void> {
  await idbSet(KEY_OVERRIDES, overrides);
}

export async function clearAllSessionStorage(): Promise<void> {
  await idbDelete(KEY_PDF_BATCHES);
  await idbDelete(KEY_CSV_DATA);
  await idbDelete(KEY_OVERRIDES);
}
