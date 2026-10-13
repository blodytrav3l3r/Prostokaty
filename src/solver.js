import { GameEngine } from "./engine.js";

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Liczy poprawne układy do limitu. Wynik równy limitowi oznacza „co najmniej
 * limit”, a nie dokładną liczbę. Dla dowodu unikalności wywołuj z limitem 2:
 * count === 1 oznacza dokładnie jedno rozwiązanie.
 */
export function countSolutions(level, limit = 2) {
  if (!level || !Number.isInteger(limit) || limit < 1) {
    throw new TypeError("Oczekiwano poziomu i dodatniego całkowitego limitu.");
  }
  const source = level.pieces || [];
  const targets = level.targets || [];
  const constraints = level.constraints || {};
  if (!Number.isInteger(level.width) || !Number.isInteger(level.height) ||
      level.width < 1 || level.height < 1 || source.length === 0) return 0;
  if (constraints.rowArea && constraints.rowArea.length !== level.height) return 0;
  if (constraints.columnArea && constraints.columnArea.length !== level.width) return 0;

  const targetById = new Map(targets.map(piece => [piece.id, piece]));
  const candidates = source.map(piece => {
    const target = targetById.get(piece.id);
    if (level.constraints?.exact) {
      return target ? [{ ...piece, x: target.x, y: target.y }] : [];
    }
    const result = [];
    if (!Number.isInteger(piece.w) || !Number.isInteger(piece.h) ||
        piece.w < 1 || piece.h < 1) return result;
    for (let y = 0; y <= level.height - piece.h; y++) {
      for (let x = 0; x <= level.width - piece.w; x++) {
        result.push({ ...piece, x, y });
      }
    }
    return result;
  });

  if (candidates.some(items => items.length === 0)) return 0;

  // Najbardziej ograniczone elementy są rozpatrywane jako pierwsze.
  const order = source.map((piece, index) => index)
    .sort((a, b) => candidates[a].length - candidates[b].length);
  const placed = [];
  const rowSums = Array(level.height).fill(0);
  const columnSums = Array(level.width).fill(0);
  let count = 0;
  const engine = new GameEngine(level);

  function search(depth) {
    if (count >= limit) return;
    if (depth === order.length) {
      engine.pieces = placed.map(piece => ({ ...piece }));
      if (engine.solved()) count++;
      return;
    }

    const index = order[depth];
    for (const candidate of candidates[index]) {
      if (placed.some(other => overlaps(candidate, other))) continue;

      let feasible = true;
      for (let y = candidate.y; y < candidate.y + candidate.h; y++) {
        if (constraints.rowArea && rowSums[y] + candidate.w > constraints.rowArea[y]) {
          feasible = false;
          break;
        }
      }
      if (!feasible) continue;
      for (let x = candidate.x; x < candidate.x + candidate.w; x++) {
        if (constraints.columnArea &&
            columnSums[x] + candidate.h > constraints.columnArea[x]) {
          feasible = false;
          break;
        }
      }
      if (!feasible) continue;

      for (let y = candidate.y; y < candidate.y + candidate.h; y++) rowSums[y] += candidate.w;
      for (let x = candidate.x; x < candidate.x + candidate.w; x++) columnSums[x] += candidate.h;
      placed.push(candidate);
      search(depth + 1);
      placed.pop();
      for (let y = candidate.y; y < candidate.y + candidate.h; y++) rowSums[y] -= candidate.w;
      for (let x = candidate.x; x < candidate.x + candidate.w; x++) columnSums[x] -= candidate.h;
      if (count >= limit) return;
    }
  }

  search(0);
  return count;
}
