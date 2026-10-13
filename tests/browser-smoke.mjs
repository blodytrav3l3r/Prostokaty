import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !message.text().includes("favicon")) {
      errors.push(message.text());
    }
  });

  await page.addInitScript(() => {
    const completed = {};
    const bestMoves = {};
    for (let id = 1; id <= 100; id++) {
      completed[String(id)] = { stars: 1, moves: 1 };
      bestMoves[String(id)] = 1;
    }
    localStorage.setItem("prostokaty-save-v1", JSON.stringify({
      version: 1,
      currentLevel: 1,
      completed,
      bestMoves,
      totalMoves: 100,
      sound: false,
      theme: "dark"
    }));
  });

  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.locator("#levelTitle").waitFor();
  assert.equal(await page.locator("#levelList .level-item").count(), 100);
  assert.equal(await page.locator("#board .cell").count(), 64);
  assert.ok(await page.locator("#board .piece").count() > 0);
  assert.ok(await page.locator("#rules .rule").count() >= 3);

  // Podstawowe działania interfejsu: wskazówka, reset, motyw i sterowanie klawiaturą.
  await page.locator("#hintBtn").click();
  assert.match(await page.locator("#message").innerText(), /Wskazówka|rozwiązana/);
  const firstPiece = page.locator("#board .piece").first();
  await firstPiece.focus();
  await firstPiece.press("ArrowRight");
  await page.locator("#resetBtn").click();
  await page.locator("#themeBtn").click();
  assert.ok(await page.locator("#board .piece").count() > 0);
  await page.locator("#themeBtn").click();

  // Przejdź przez wszystkie 100 poziomów w prawdziwej przeglądarce.
  const seenTitles = new Set();
  for (let id = 1; id <= 100; id++) {
    const levelButton = page.locator("#levelList .level-item").nth(id - 1);
    await levelButton.click();
    const title = (await page.locator("#levelTitle").innerText()).trim();
    assert.ok(title.length > 0, `Poziom ${id}: brak tytułu`);
    assert.ok(!seenTitles.has(title), `Powtórzony tytuł poziomu: ${title}`);
    seenTitles.add(title);
    assert.equal(await page.locator("#board .cell").count(), 64, `Poziom ${id}: plansza nie ma 64 pól`);
    assert.ok(await page.locator("#board .piece").count() > 0, `Poziom ${id}: brak prostokątów`);
    assert.ok(await page.locator("#rules .rule").count() >= 3, `Poziom ${id}: brak reguł`);
  }
  assert.equal(seenTitles.size, 100);
  assert.deepEqual(errors, [], `Błędy przeglądarki: ${errors.join(" | ")}`);
  console.log("PASS: interfejs uruchomiony; wszystkie 100 poziomów wyrenderowane; podstawowe sterowanie działa; brak błędów przeglądarki.");
} finally {
  await browser.close();
}
