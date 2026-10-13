const KEY = "prostokaty-save-v1";
const defaults = () => ({
  version: 1,
  currentLevel: 1,
  completed: {},
  bestMoves: {},
  totalMoves: 0,
  sound: true,
  theme: "dark"
});

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validLevelKey(key) {
  const id = Number(key);
  return Number.isInteger(id) && id >= 1 && id <= 100;
}

function normalizeCompleted(value) {
  if (!isRecord(value)) return {};
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (!validLevelKey(key) || !isRecord(item)) continue;
    const stars = Number.isInteger(item.stars) && item.stars >= 0 && item.stars <= 3
      ? item.stars : 0;
    const moves = Number.isInteger(item.moves) && item.moves >= 0
      ? item.moves : 0;
    if (stars > 0) result[key] = { stars, moves };
  }
  return result;
}

function normalizeBestMoves(value) {
  if (!isRecord(value)) return {};
  const result = {};
  for (const [key, moves] of Object.entries(value)) {
    if (validLevelKey(key) && Number.isInteger(moves) && moves >= 0) {
      result[key] = moves;
    }
  }
  return result;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!isRecord(parsed)) return defaults();
    return {
      ...defaults(),
      currentLevel: Number.isInteger(parsed.currentLevel) &&
        parsed.currentLevel >= 1 && parsed.currentLevel <= 100
        ? parsed.currentLevel : 1,
      completed: normalizeCompleted(parsed.completed),
      bestMoves: normalizeBestMoves(parsed.bestMoves),
      totalMoves: Number.isFinite(parsed.totalMoves) && parsed.totalMoves >= 0
        ? Math.floor(parsed.totalMoves) : 0,
      sound: typeof parsed.sound === "boolean" ? parsed.sound : true,
      theme: parsed.theme === "light" ? "light" : "dark"
    };
  } catch {
    // Brak dostępu do localStorage lub uszkodzony JSON nie powinien blokować gry.
    return defaults();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    // Gra nadal działa w pamięci, nawet jeśli przeglądarka blokuje zapis.
    return false;
  }
}

export function reset() {
  const state = defaults();
  save(state);
  return state;
}
