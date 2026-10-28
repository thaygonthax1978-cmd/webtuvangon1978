/**
 * IndexedDB storage for real image caching
 * Ensures that images uploaded by the user are permanently retained and instantly accessible
 * directly in the browser, even if server containers restart or on ephemeral hosting.
 */

const DB_NAME = 'ThayGonImageCache';
const STORE_NAME = 'images';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('filename', 'filename', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

export interface CachedImageRecord {
  key: string;
  dataUrl: string;
  name?: string;
  filename?: string;
  updatedAt: string;
}

export async function saveImageToCache(
  key: string,
  dataUrl: string,
  name?: string,
  filename?: string
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: CachedImageRecord = {
      key: key.trim(),
      dataUrl,
      name: name?.trim(),
      filename: filename?.trim(),
      updatedAt: new Date().toISOString(),
    };

    store.put(record);

    // Also store by name and filename as secondary keys if provided
    if (name && name !== key) {
      store.put({
        key: `name:${name.trim().toLowerCase()}`,
        dataUrl,
        name: name.trim(),
        filename: filename?.trim(),
        updatedAt: new Date().toISOString(),
      });
    }
    if (filename && filename !== key) {
      store.put({
        key: `file:${filename.trim()}`,
        dataUrl,
        name: name?.trim(),
        filename: filename.trim(),
        updatedAt: new Date().toISOString(),
      });
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Lỗi lưu ảnh vào IndexedDB:', err);
  }
}

export async function getImageFromCache(key: string): Promise<string | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key.trim());

      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          resolve(req.result.dataUrl);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function findImageInCache(candidateKeys: (string | undefined | null)[]): Promise<string | null> {
  for (const k of candidateKeys) {
    if (!k) continue;
    const direct = await getImageFromCache(k);
    if (direct) return direct;

    const byName = await getImageFromCache(`name:${k.trim().toLowerCase()}`);
    if (byName) return byName;

    const byFile = await getImageFromCache(`file:${k.trim()}`);
    if (byFile) return byFile;
  }
  return null;
}

export async function removeImageFromCache(key: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key.trim());
  } catch {}
}
