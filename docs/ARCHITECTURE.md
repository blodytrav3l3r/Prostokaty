# Architektura

UI komunikuje się z niezależnym silnikiem gry. Reguły można testować bez przeglądarki i później wykorzystać w edytorze poziomów, solverze lub aplikacji mobilnej.

```text
UI / DOM -> main.js -> engine.js
                  -> storage.js
                  -> audio.js
                  -> levels.js
```

Generator jest deterministyczny. Startowe elementy są umieszczane w osobnej strefie, cele w innej. Testy sprawdzają brak kolizji i możliwość wykonania rozwiązania.

Docelowo warto wydzielić core/, content/, ui/, services/, tools/level-editor/ oraz tests/unit i tests/e2e.
