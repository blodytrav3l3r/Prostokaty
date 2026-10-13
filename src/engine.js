function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.h && a.y + a.h > b.y;
}

// Prostokąty stykają się bokiem tylko wtedy, gdy ich krawędzie są równe,
// a odcinek wspólny ma dodatnią długość. Samo sąsiedztwo punktów (x, y)
// nie wystarcza dla elementów o różnych wymiarach.
function adjacent(a, b) {
  if (!a || !b) return false;
  const verticalTouch =
    (a.x + a.w === b.x || b.x + b.w === a.x) &&
    Math.max(a.y, b.y) < Math.min(a.y + a.h, b.y + b.h);
  const horizontalTouch =
    (a.y + a.h === b.y || b.y + b.h === a.y) &&
    Math.max(a.x, b.x) < Math.min(a.x + a.w, b.x + b.w);
  return verticalTouch || horizontalTouch;
}

function edge(p, level) {
  return p.x === 0 || p.y === 0 ||
    p.x + p.w === level.width || p.y + p.h === level.height;
}

export class GameEngine {
  constructor(level) {
    this.level = level;
    this.pieces = (level.pieces || []).map(p => ({ ...p }));
    this.history = [];
    this.moves = 0;
  }

  snapshot() {
    return this.pieces.map(p => ({ id: p.id, x: p.x, y: p.y }));
  }

  restore(snapshot) {
    snapshot.forEach(value => {
      const piece = this.pieces.find(item => item.id === value.id);
      if (piece && Number.isInteger(value.x) && Number.isInteger(value.y)) {
        piece.x = value.x;
        piece.y = value.y;
      }
    });
  }

  valid(piece, x, y) {
    if (!piece || !Number.isInteger(x) || !Number.isInteger(y)) return false;
    if (![piece.w, piece.h].every(v => Number.isInteger(v) && v > 0)) return false;
    if (x < 0 || y < 0 || x + piece.w > this.level.width ||
        y + piece.h > this.level.height) return false;
    const candidate = { ...piece, x, y };
    return !this.pieces.some(other =>
      other.id !== piece.id && overlap(candidate, other));
  }

  move(id, x, y) {
    const piece = this.pieces.find(item => item.id === id);
    if (!this.valid(piece, x, y)) return false;
    if (piece.x === x && piece.y === y) return false;
    this.history.push(this.snapshot());
    piece.x = x;
    piece.y = y;
    this.moves++;
    return true;
  }

  undo() {
    const previous = this.history.pop();
    if (!previous) return false;
    this.restore(previous);
    this.moves = Math.max(0, this.moves - 1);
    return true;
  }

  reset() {
    this.pieces = (this.level.pieces || []).map(p => ({ ...p }));
    this.history = [];
    this.moves = 0;
  }

  solved() {
    const level = this.level;
    if (this.pieces.length !== (level.pieces || []).length) return false;
    if (this.pieces.some(p => !this.validForBoard(p))) return false;
    for (let i = 0; i < this.pieces.length; i++) {
      for (let j = i + 1; j < this.pieces.length; j++) {
        if (overlap(this.pieces[i], this.pieces[j])) return false;
      }
    }
    return this.checkConstraints(level.constraints || {});
  }

  validForBoard(piece) {
    return !!piece &&
      Number.isInteger(piece.x) && Number.isInteger(piece.y) &&
      Number.isInteger(piece.w) && piece.w > 0 &&
      Number.isInteger(piece.h) && piece.h > 0 &&
      piece.x >= 0 && piece.y >= 0 &&
      piece.x + piece.w <= this.level.width &&
      piece.y + piece.h <= this.level.height;
  }

  checkConstraints(constraints) {
    const level = this.level;
    const byId = id => this.pieces.find(piece => piece.id === id);
    const targets = level.targets || [];

    if (constraints.exact && !targets.every(target => {
      const piece = byId(target.id);
      return piece && piece.x === target.x && piece.y === target.y;
    })) return false;

    if (constraints.adjacent && !constraints.adjacent.every(([a, b]) =>
      adjacent(byId(a), byId(b)))) return false;

    if (constraints.path) {
      for (let i = 0; i < constraints.path.length - 1; i++) {
        if (!adjacent(byId(constraints.path[i]), byId(constraints.path[i + 1]))) {
          return false;
        }
      }
    }

    if (constraints.symmetry === "rot180") {
      for (const piece of this.pieces) {
        const hasMirror = this.pieces.some(other =>
          other.id !== piece.id &&
          other.x === level.width - piece.x - piece.w &&
          other.y === level.height - piece.y - piece.h &&
          other.w === piece.w && other.h === piece.h);
        if (!hasMirror) return false;
      }
    }

    if (constraints.rowArea) {
      if (constraints.rowArea.length !== level.height) return false;
      const sums = Array(level.height).fill(0);
      this.pieces.forEach(piece => {
        for (let y = piece.y; y < piece.y + piece.h; y++) sums[y] += piece.w;
      });
      if (sums.some((value, index) => value !== constraints.rowArea[index])) return false;
    }

    if (constraints.colorAdjacentDifferent) {
      for (let i = 0; i < this.pieces.length; i++) {
        for (let j = i + 1; j < this.pieces.length; j++) {
          const a = this.pieces[i], b = this.pieces[j];
          if (adjacent(a, b) && a.color === b.color) return false;
        }
      }
    }

    if (constraints.forbidden) {
      const forbidden = constraints.forbidden.map(([x, y]) => ({ x, y, w: 1, h: 1 }));
      if (this.pieces.some(piece => forbidden.some(cell => overlap(piece, cell)))) {
        return false;
      }
    }

    if (Number.isInteger(constraints.edgeCount) &&
        this.pieces.filter(piece => edge(piece, level)).length !== constraints.edgeCount) {
      return false;
    }

    if (constraints.leftOf && !constraints.leftOf.every(([a, b]) => {
      const left = byId(a), right = byId(b);
      return !!left && !!right && left.x < right.x;
    })) return false;

    return true;
  }

  hint() {
    const piece = this.pieces.find(item => {
      const target = (this.level.targets || []).find(value => value.id === item.id);
      return target && (item.x !== target.x || item.y !== target.y);
    });
    return piece ? this.level.targets.find(target => target.id === piece.id) || null : null;
  }
}
