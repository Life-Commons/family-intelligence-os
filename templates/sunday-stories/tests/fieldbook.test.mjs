import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import {
  cards,
  cardFor,
  validSetup,
  week,
  eventFor,
} from "../public/fieldbook.js";
const now = Date.UTC(2026, 10, 4);
const hash = (pack = "map", code = "12345ABCDE", expires = now + week) =>
  "#" + new URLSearchParams({ pack, code, until: expires });
test("setup links contain a built-in activity, short receipt and bounded lifetime", () => {
  assert.deepEqual(validSetup(hash(), now), {
    card: "map",
    code: "12345ABCDE",
    expires: now + week,
  });
  for (const h of [
    hash("constructor"),
    hash("no"),
    hash("map", "x"),
    hash("map", "12345ABCDE", now),
    hash("map", "12345ABCDE", now + 8 * 86400000),
  ])
    assert.equal(validSetup(h, now), null);
});
test("each role resolves only its own curated content", () => {
  assert.equal(cardFor("learn", "kitchen"), "sounds");
  assert.equal(cardFor("story", "constructor"), "kitchen");
  for (const [key, card] of Object.entries(cards))
    assert.equal(cardFor(card.view, key), key);
});
test("calendar uses UTC instants, a stable event id, and a 15 minute alert", () => {
  const { ics, google } = eventFor(
    new Date("2026-11-08T16:00:00+01:00"),
    "visit-1",
    new Date(now),
  );
  assert.match(ics, /DTSTART:20261108T150000Z\r\nDTEND:20261108T152000Z/);
  assert.match(ics, /UID:visit-1@sunday-stories.local/);
  assert.match(ics, /TRIGGER:-PT15M/);
  assert.equal(
    new URL(google).searchParams.get("dates"),
    "20261108T150000Z/20261108T152000Z",
  );
  assert.throws(() => eventFor(new Date(now), "x", new Date(now)));
});
test("Worker serves exactly the release files and rejects reads of other paths and all uploads", async () => {
  execFileSync(process.execPath, ["scripts/build-worker.mjs"], {
    cwd: new URL("../", import.meta.url),
  });
  const { default: worker } = await import("../dist/worker.mjs");
  const call = (path, method = "GET") =>
    worker.fetch(new Request("https://example.test" + path, { method }));
  assert.match(await call("/").text(), /Sunday Stories/);
  for (const path of [
    "/icon-512.png",
    "/fieldbook.js",
    "/manifest.webmanifest",
  ]) {
    const r = call(path);
    assert.equal(r.status, 200);
    assert.deepEqual(
      Buffer.from(await r.arrayBuffer()),
      await readFile(new URL("../public" + path, import.meta.url)),
    );
    assert.match(
      r.headers.get("Content-Security-Policy"),
      /connect-src 'none'/,
    );
  }
  assert.equal(await call("/", "HEAD").text(), "");
  assert.equal(call("/private").status, 404);
  assert.equal(call("/audio", "POST").status, 405);
});
import { reviewedCard } from "../public/teaching.js";
test("adult cards are bounded plain text with exactly three steps", () => {
  assert.equal(reviewedCard(["A", "B", "C", "D", "E"]).steps.length, 3);
  for (const input of [
    null,
    [],
    ["", "B", "C", "D", "E"],
    ["A", "B", "C", "D", "E\nF"],
    ["A".repeat(81), "B", "C", "D", "E"],
    [12, "B", "C", "D", "E"],
  ])
    assert.equal(reviewedCard(input), null);
});
import { readAgenda } from "../public/agenda.js";
test("local calendar preview unfolds titles and omits private fields, unknown time zones and recurrences", () => {
  const event = (id, start, extra = "") =>
    [
      "BEGIN:VEVENT",
      "UID:" + id,
      start,
      "SUMMARY:Family\\,",
      "  visit",
      "DESCRIPTION:Private notes",
      "BEGIN:VALARM",
      "SUMMARY:Alarm content",
      "END:VALARM",
      extra,
      "END:VEVENT",
    ].join("\r\n");
  const calendar = [
    "BEGIN:VCALENDAR",
    event("1", "DTSTART:20320103T110000Z"),
    event("2", "DTSTART;VALUE=DATE:20320102"),
    event("3", "DTSTART;TZID=Europe/Amsterdam:20320102T100000"),
    event("4", "DTSTART:20320102T100000Z", "RRULE:FREQ=WEEKLY"),
    event("5", "DTSTART:20320230T100000Z"),
    "END:VCALENDAR",
  ].join("\r\n");
  const preview = readAgenda(calendar, new Date("2032-01-01T00:00:00Z"));
  assert.equal(preview.total, 2);
  assert.equal(preview.skipped, 3);
  assert.equal(preview.visits[0].allDay, true);
  assert.equal(preview.visits[1].title, "Family, visit");
  assert.doesNotMatch(JSON.stringify(preview), /Private|Alarm/);
  assert.throws(() =>
    readAgenda(
      calendar.replace("BEGIN:VCALENDAR", "BEGIN:VCALENDAR\nMETHOD:CANCEL"),
    ),
  );
  assert.throws(() => readAgenda("x".repeat(524289)));
});
