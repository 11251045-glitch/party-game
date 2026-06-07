import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getDatabase, 
  ref as realRef, 
  onValue as realOnValue, 
  set as realSet, 
  push as realPush, 
  update as realUpdate, 
  get as realGet,
  Database
} from "firebase/database";

// 🔧 Replace with your Firebase config
export const firebaseConfig = {
  apiKey: "AIzaSyBB5QZq1lr27ULHh9Qbk_KJMDvUpglYrFs",
  authDomain: "bingo-83c8a.firebaseapp.com",
  databaseURL: "https://bingo-83c8a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bingo-83c8a",
  storageBucket: "bingo-83c8a.firebasestorage.app",
  messagingSenderId: "154760297789",
  appId: "1:154760297789:web:21d24c884edc4380b01954",
  measurementId: "G-F61J9W8ZKS"
};

// Check if client is using placeholders vs true configurations
export const isMockFirebase = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey.includes("YOUR_") || 
  !firebaseConfig.databaseURL || 
  firebaseConfig.databaseURL.includes("YOUR_");

let realDbInstance: Database | null = null;

if (!isMockFirebase) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    realDbInstance = getDatabase(app);
  } catch (error) {
    console.error("Failed to initialize real Firebase, falling back to local simulation:", error);
  }
}

// --------------------------------------------------------------------------
// LOCAL MULTIPLAYER EMULATION ENGINE (BroadcastChannel Sync for Multi-tab Play)
// --------------------------------------------------------------------------
const channel = typeof window !== 'undefined' ? new BroadcastChannel("party_night_rtdb") : null;

// Deep path lookup/update utility helpers
function getValAtPath(obj: any, pathParts: string[]): any {
  let curr = obj;
  for (const part of pathParts) {
    if (!curr || typeof curr !== "object") return undefined;
    curr = curr[part];
  }
  return curr;
}

function setValAtPath(obj: any, pathParts: string[], value: any) {
  let curr = obj;
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    if (i === pathParts.length - 1) {
      if (value === null) {
        delete curr[part];
      } else {
        curr[part] = JSON.parse(JSON.stringify(value)); // Deep copy to prevent reference bugs
      }
    } else {
      if (!curr[part] || typeof curr[part] !== "object") {
        curr[part] = {};
      }
      curr = curr[part];
    }
  }
}

class MockRealtimeDatabase {
  private dataStore: Record<string, any> = {};
  private listeners: Record<string, Set<(snapshot: any) => void>> = {};

  constructor() {
    // Load from localStorage to persist rooms locally
    const saved = localStorage.getItem("party_night_mock_rtdb");
    if (saved) {
      try {
        this.dataStore = JSON.parse(saved);
      } catch (e) {
        this.dataStore = {};
      }
    }

    if (channel) {
      channel.onmessage = (event) => {
        if (event.data && event.data.type === "SYNC_STORE") {
          this.dataStore = event.data.dataStore;
          this.triggerListeners(event.data.triggeredPath);
        }
      };
    }
  }

  private persistAndSync(triggeredPath: string) {
    localStorage.setItem("party_night_mock_rtdb", JSON.stringify(this.dataStore));
    if (channel) {
      channel.postMessage({
        type: "SYNC_STORE",
        dataStore: this.dataStore,
        triggeredPath
      });
    }
    this.triggerListeners(triggeredPath);
  }

  private triggerListeners(changedPath: string) {
    // Trigger direct listeners and parent/child listeners
    Object.keys(this.listeners).forEach((listenPath) => {
      if (
        listenPath === changedPath ||
        changedPath.startsWith(listenPath + "/") ||
        listenPath.startsWith(changedPath + "/")
      ) {
        const val = this.get(listenPath);
        this.listeners[listenPath].forEach((cb) => {
          cb({
            val: () => val,
            exists: () => val !== undefined && val !== null,
          });
        });
      }
    });
  }

  get(path: string): any {
    const cleanPath = path.replace(/^\/|\/$/g, "");
    if (!cleanPath) return this.dataStore;
    return getValAtPath(this.dataStore, cleanPath.split("/"));
  }

  set(path: string, value: any) {
    const cleanPath = path.replace(/^\/|\/$/g, "");
    if (!cleanPath) {
      this.dataStore = value || {};
    } else {
      setValAtPath(this.dataStore, cleanPath.split("/"), value);
    }
    this.persistAndSync(cleanPath);
  }

  update(path: string, values: Record<string, any>) {
    const cleanPath = path.replace(/^\/|\/$/g, "");
    const parts = cleanPath ? cleanPath.split("/") : [];

    Object.entries(values).forEach(([key, val]) => {
      // Keys in update can be relative paths (e.g., "players/p1/score")
      const updatedParts = [...parts, ...key.split("/")];
      setValAtPath(this.dataStore, updatedParts, val);
    });

    this.persistAndSync(cleanPath);
  }

  onValue(path: string, callback: (snapshot: any) => void): () => void {
    const cleanPath = path.replace(/^\/|\/$/g, "");
    if (!this.listeners[cleanPath]) {
      this.listeners[cleanPath] = new Set();
    }
    this.listeners[cleanPath].add(callback);

    // Initial trigger
    const val = this.get(cleanPath);
    callback({
      val: () => val,
      exists: () => val !== undefined && val !== null,
    });

    // Return unsubscribe function
    return () => {
      this.listeners[cleanPath]?.delete(callback);
      if (this.listeners[cleanPath]?.size === 0) {
        delete this.listeners[cleanPath];
      }
    };
  }

  push(path: string, value: any = null): string {
    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    const itemPath = `${path}/${key}`;
    if (value !== null) {
      this.set(itemPath, value);
    }
    return key;
  }
}

export const mockDb = new MockRealtimeDatabase();

// --------------------------------------------------------------------------
// UNIFIED ABSTRACT EXPORTS
// --------------------------------------------------------------------------
export function dbRef(path: string) {
  if (isMockFirebase) {
    return { path, isMock: true };
  } else {
    return realRef(realDbInstance!, path);
  }
}

export function dbOnValue(reference: any, callback: (snapshot: any) => void) {
  if (isMockFirebase) {
    return mockDb.onValue(reference.path, callback);
  } else {
    return realOnValue(reference, (snap) => {
      callback({
        val: () => snap.val(),
        exists: () => snap.exists(),
      });
    });
  }
}

export async function dbSet(reference: any, value: any) {
  if (isMockFirebase) {
    mockDb.set(reference.path, value);
    return Promise.resolve();
  } else {
    return realSet(reference, value);
  }
}

export function dbPush(reference: any, value: any = null) {
  if (isMockFirebase) {
    const key = mockDb.push(reference.path, value);
    return {
      key,
      path: `${reference.path}/${key}`,
      isMock: true
    };
  } else {
    const result = realPush(reference, value);
    return result;
  }
}

export async function dbUpdate(reference: any, values: Record<string, any>) {
  if (isMockFirebase) {
    mockDb.update(reference.path, values);
    return Promise.resolve();
  } else {
    return realUpdate(reference, values);
  }
}

export async function dbGet(reference: any) {
  if (isMockFirebase) {
    const val = mockDb.get(reference.path);
    return Promise.resolve({
      val: () => val,
      exists: () => val !== undefined && val !== null,
    });
  } else {
    const snap = await realGet(reference);
    return {
      val: () => snap.val(),
      exists: () => snap.exists(),
    };
  }
}
