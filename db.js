const DB_NAME = 'mylibrary-db';
const DB_VERSION = 1;
let dbPromise;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of ['books', 'authors', 'notes', 'sessions', 'settings']) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function getAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function put(store, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error);
  });
}

export async function remove(store, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function seedIfEmpty() {
  const [books, authors] = await Promise.all([getAll('books'), getAll('authors')]);
  if (!authors.length) {
    const examples = [
      { id: 'a-rothfuss', name: 'Patrick Rothfuss', nationality: 'Estadounidense', birthDate: '1973-06-06', bio: 'Autor de la Crónica del Asesino de Reyes.', favorite: false },
      { id: 'a-tolkien', name: 'J. R. R. Tolkien', nationality: 'Británico', birthDate: '1892-01-03', bio: 'Escritor y filólogo, creador de la Tierra Media.', favorite: true },
      { id: 'a-sanderson', name: 'Brandon Sanderson', nationality: 'Estadounidense', birthDate: '1975-12-19', bio: 'Autor de fantasía épica y del Cosmere.', favorite: false }
    ];
    for (const author of examples) await put('authors', author);
  }
  if (!books.length) {
    const examples = [
      { id: 'b-name-wind', title: 'El nombre del viento', authorIds: ['a-rothfuss'], authorNames: ['Patrick Rothfuss'], genre: 'Fantasía', status: 'Leído', pages: 880, favorite: true, createdAt: Date.now() },
      { id: 'b-wise-man', title: 'El temor de un hombre sabio', authorIds: ['a-rothfuss'], authorNames: ['Patrick Rothfuss'], genre: 'Fantasía', status: 'Leyendo', pages: 1200, favorite: false, createdAt: Date.now() },
      { id: 'b-fellowship', title: 'La comunidad del anillo', authorIds: ['a-tolkien'], authorNames: ['J. R. R. Tolkien'], genre: 'Fantasía', status: 'Pendiente', pages: 576, favorite: false, createdAt: Date.now() },
      { id: 'b-way-kings', title: 'El camino de los reyes', authorIds: ['a-sanderson'], authorNames: ['Brandon Sanderson'], genre: 'Fantasía', status: 'Leído', pages: 1200, favorite: true, createdAt: Date.now() }
    ];
    for (const book of examples) await put('books', book);
  }
}
