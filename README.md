# Prostokąty — Logiczna Układanka

Profesjonalna gra logiczna z **100 ręcznie zaprojektowanymi poziomami**. Każdy poziom jest opisany jako dane, a silnik interpretuje reguły zamiast polegać wyłącznie na porównaniu z ukrytym obrazkiem.

## Rodziny zagadek

1. **Sąsiedztwo** — pary elementów muszą się stykać bokiem.
2. **Kolory** — kolor jest częścią ograniczeń sąsiedztwa.
3. **Suma pól** — trzeba odtworzyć sumy powierzchni wierszy.
4. **Symetria** — układ musi posiadać symetrię obrotową.
5. **Ścieżki** — prostokąty tworzą określoną ścieżkę.
6. **Ograniczenia** — krawędzie, narożniki i pola zakazane.
7. **Dedukcja** — relacje typu „1 jest na lewo od 2”.
8. **Wieloetapowe** — kilka reguł obowiązuje jednocześnie.
9. **Układ docelowy** — ćwiczenia precyzyjnego rozmieszczania według współrzędnych celu.
10. **Mistrzowskie** — kombinacje kilku mechanizmów.

## Architektura

```text
src/
├── levels.js       # content pack 100 poziomów + reguły
├── engine.js       # niezależny silnik i walidacja reguł
├── solver.js       # ograniczone liczenie rozwiązań
├── main.js         # UI, sterowanie i renderowanie
├── storage.js      # zapis postępu
├── audio.js        # Web Audio API
└── ui.js           # pomocnicze UI

tests/
└── engine.test.js  # testy zawartości i reguł
```

Poziom składa się z planszy, czterech elementów, celu, zestawu reguł oraz strukturalnych constraintów. Dzięki temu kolejne typy zagadek można dodawać bez przepisywania UI.

## Walidacja

Testy sprawdzają 100 poziomów, unikalność nazw, kompletność rodzin, geometrię i brak kolizji, zgodność rozwiązań z regułami, widoczne wskazówki, cofanie oraz solver z limitem liczenia rozwiązań. Solver zwraca liczbę rozwiązań do zadanego limitu; wynik równy limitowi oznacza „co najmniej tyle”.

Uruchomienie:

```bash
npm test
npm run check
```

## Roadmap

- większe prostokąty i różne kształty,
- rozszerzenie solvera o wydajniejsze przycinanie wyszukiwania i weryfikację unikalności łamigłówek opartych wyłącznie na wskazówkach logicznych,
- edytor poziomów,
- codzienne wyzwania,
- pełne E2E/Playwright,
- synchronizacja postępu,
- wersja mobilna.

MIT.
