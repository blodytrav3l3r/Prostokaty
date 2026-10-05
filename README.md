# Prostokąty — Logiczna Układanka

Lekka gra logiczna działająca bez backendu. Celem jest ułożenie prostokątnych elementów na planszy. Projekt zawiera 100 poziomów, system gwiazdek, wskazówki, cofanie, zapis postępu i PWA/offline.

## Uruchomienie
```bash
npx serve .
npm test
npm run check
```

## Architektura
```text
index.html
styles.css
src/main.js       UI i sterowanie
src/engine.js     czysty silnik gry
src/levels.js     generator 100 poziomów
src/storage.js    zapis postępu
src/audio.js      Web Audio API
src/ui.js         pomocnicze UI
tests/engine.test.js
.github/workflows/ci.yml
```

Funkcje: 100 poziomów, drag & drop, kolizje, cofanie, reset, wskazówki, 1–3 gwiazdki, localStorage, jasny/ciemny motyw, dźwięki, PWA i CI.

## Dalszy rozwój
Edytor poziomów, solver z gwarancją jednego rozwiązania, bogatsze reguły, Playwright E2E, WCAG, synchronizacja opcjonalna i wersje mobilne.

MIT.
