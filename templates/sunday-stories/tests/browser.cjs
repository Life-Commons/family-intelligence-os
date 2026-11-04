// Run after npm test with Playwright and Chromium installed.
const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const { chromium } = require("playwright");
(async () => {
  const { default: worker } = await import("../dist/worker.mjs");
  const server = require("node:http").createServer(async (req, res) => {
    const response = worker.fetch(
      new Request("http://localhost" + req.url, { method: req.method }),
    );
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  await new Promise((resolve, reject) =>
    server.once("error", reject).listen(0, "127.0.0.1", resolve),
  );
  server.unref();
  const base =
    process.env.FIELD_TEST_URL || "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_BIN || undefined,
    headless: true,
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--no-sandbox",
    ],
  });
  const errors = [],
    requests = [];
  async function page(context) {
    const p = await context.newPage();
    p.setDefaultTimeout(10000);
    p.on("pageerror", (e) => errors.push(String(e)));
    p.on("request", (r) => requests.push([r.method(), r.url()]));
    return p;
  }
  try {
    const adult = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      }),
      relative = await browser.newContext({
        viewport: { width: 390, height: 844 },
        permissions: ["microphone"],
      });
    const desk = await page(adult),
      phone = await page(relative);
    await desk.goto(base);
    await desk.getByRole("heading", { name: "A moment together." }).waitFor();
    if (process.env.SCREEN_DIR)
      await desk.screenshot({ path: process.env.SCREEN_DIR + "/desk.png" });
    assert.equal(await desk.locator("#pack").isVisible(), false);
    await desk.locator("#other-question").click();
    assert.equal(
      await desk.locator("#pick-title").textContent(),
      "Where did your family gather?",
    );
    await desk.locator("#setup-nav").click();
    await desk.evaluate(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (payload) => {
          window.sharedSetup = payload;
        },
      });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error("Unavailable");
          },
        },
      });
    });
    await desk.selectOption("#pack", "place");
    await desk.getByText("Create setup link", { exact: true }).click();
    assert.equal(await desk.locator("#prepare").isVisible(), false);
    await desk.locator("#share-link").click();
    const invite = await desk.locator("#setup-link").inputValue();
    assert.equal(await desk.evaluate(() => window.sharedSetup.url), invite);
    await desk.locator("#copy-link").click();
    assert.ok(await desk.locator("#setup-link").isVisible());
    await phone.goto(invite);
    if (process.env.SCREEN_DIR)
      await phone.screenshot({ path: process.env.SCREEN_DIR + "/welcome.png" });
    await phone.locator("#accept").click();
    await phone
      .getByRole("heading", { name: "Where did your family gather?" })
      .waitFor();
    if (process.env.SCREEN_DIR)
      await phone.screenshot({
        path: process.env.SCREEN_DIR + "/story-ready.png",
      });
    await phone.locator("#phone summary").click();
    const code = await phone.locator("#receipt-code").textContent();
    await desk.locator("#prepared-phones > summary").click();
    await desk.locator(".device details > summary").click();
    const input = desk.getByLabel("Returned setup code");
    await input.fill("000000");
    await desk.locator(".device form button").click();
    assert.match(await desk.locator("#notice").textContent(), /does not match/);
    await input.fill(code);
    await desk.locator(".device form button").click();
    await desk.reload();
    await desk.locator("#prepared-phones > summary").click();
    await desk.getByText("Acknowledged by returned code").waitFor();
    await phone.goto(base);
    await phone
      .getByRole("heading", { name: "Where did your family gather?" })
      .waitFor();
    await phone.locator("#record").click();
    await phone.locator("#stop").waitFor();
    await phone.waitForFunction(() =>
      document.querySelector("#stop").textContent.includes(":"),
    );
    await phone.locator("#stop").click();
    await phone.locator("#download").waitFor();
    await phone.waitForFunction(
      () => document.getElementById("audio").readyState >= 2,
    );
    await phone.locator("audio").evaluate((a) => a.play());
    if (process.env.SCREEN_DIR)
      await phone.screenshot({
        path: process.env.SCREEN_DIR + "/story-review.png",
      });
    const download = phone.waitForEvent("download");
    await phone.locator("#download").click();
    const file = await download;
    assert.ok((await readFile(await file.path())).length > 100);
    const noteDownload = phone.waitForEvent("download");
    await phone.locator(".more-options summary").click();
    await phone.locator("#source-note").click();
    const note = JSON.parse(
      await readFile(await (await noteDownload).path(), "utf8"),
    );
    const bytes = await readFile(await file.path());
    assert.equal(
      note.sha256,
      require("node:crypto").createHash("sha256").update(bytes).digest("hex"),
    );
    assert.equal(note.bytes, bytes.length);
    await phone.locator("#discard").click();
    assert.equal(await phone.locator("#review").isVisible(), false);
    await phone.locator("#writing summary").click();
    await phone.locator("#story-text").fill("A synthetic field note.");
    const writing = phone.waitForEvent("download");
    await phone.locator("#save-text").click();
    assert.match(
      await readFile(await (await writing).path(), "utf8"),
      /synthetic field note/,
    );
    await desk.locator("#home-link").click();
    await desk.getByRole("button", { name: /Make time for a visit/ }).click();
    await desk.locator("#when").fill("2031-11-02T16:00");
    const calendar = desk.waitForEvent("download");
    await desk.getByText("Download calendar event", { exact: true }).click();
    assert.match(
      await readFile(await (await calendar).path(), "utf8"),
      /BEGIN:VALARM/,
    );
    assert.match(
      await desk.locator("#google-event").getAttribute("href"),
      /dates=/,
    );
    await desk.keyboard.press("Escape");
    assert.equal(await desk.locator("#plan-dialog").isVisible(), false);
    await phone.goto(base + "/?view=learn&card=map");
    await phone.locator("#next-step").click();
    assert.equal(
      await phone.locator("#lesson-progress").getAttribute("aria-valuenow"),
      "2",
    );
    await phone.locator("#prev-step").click();
    assert.equal(
      await phone.locator("#instruction").textContent(),
      "Ask a grown-up to describe a room or garden they remember. Start with one object.",
    );
    for (let i = 0; i < 3; i++) await phone.locator("#next-step").click();
    await phone
      .getByRole("heading", { name: "A discovery to share." })
      .waitFor();
    await phone.locator("#next-step").click();
    await phone.getByRole("heading", { name: "Choose one place." }).waitFor();
    for (const width of [320, 390, 768, 1280]) {
      await desk.setViewportSize({ width, height: 800 });
      await desk.goto(base + "/?view=desk");
      if (process.env.SCREEN_DIR)
        await desk.screenshot({
          path: process.env.SCREEN_DIR + "/home-" + width + ".png",
          fullPage: true,
        });
      assert.ok(
        await desk.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Overflow at " + width,
      );
    }
    await phone.goto(base + "/?view=story&card=kitchen");
    await phone.evaluate(() =>
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        value: () =>
          Promise.reject(new DOMException("denied", "NotAllowedError")),
      }),
    );
    await phone.locator("#record").click();
    await phone.getByText(/Microphone unavailable/).waitFor();
    assert.ok(await phone.locator("#record").isEnabled());
    if (process.env.SCREEN_DIR)
      await phone.screenshot({ path: process.env.SCREEN_DIR + "/phone.png" });
    await desk.goto(base + "/?view=setup");
    await desk.locator("#prepared-phones > summary").click();
    await desk.getByRole("button", { name: "Forget entry" }).click();
    await desk.getByText("Your first setup will appear here.").waitFor();
    await desk.locator("#home-link").click();
    await desk
      .getByRole("button", { name: "Add calendar", exact: true })
      .click();
    await desk.locator("#agenda-file").setInputFiles({
      name: "fixture.ics",
      mimeType: "text/calendar",
      buffer: Buffer.from(
        "BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:visit\nDTSTART:20321105T120000Z\nSUMMARY:Family visit\nEND:VEVENT\nEND:VCALENDAR",
      ),
    });
    await desk.getByText(/1 of 1 upcoming/).waitFor();
    assert.match(
      await desk.locator("#agenda-list").textContent(),
      /Family visit/,
    );
    await desk.locator("#agenda-clear").click();
    assert.equal(await desk.locator("#agenda-list").textContent(), "");
    await desk.locator("#setup-nav").click();
    await desk.locator("#teaching > summary").click();
    const draft =
      "Sky shapes\nLook up together.\nFind a cloud.\nDraw an outline.\nCompare your sketches.";
    await desk.locator("#ai-draft summary").click();
    await desk.locator("#teacher-draft").fill(draft);
    await desk.locator("#apply-draft").click();
    assert.equal(
      await desk.locator("#activity-title").inputValue(),
      "Sky shapes",
    );
    await desk.locator("#preview-draft").click();
    const cardDownload = desk.waitForEvent("download");
    await desk.locator("#export-card").click();
    const cardPath = await (await cardDownload).path();
    await phone.goto(base + "/?view=setup");
    await phone.locator("#teaching > summary").click();
    await phone.locator("#card-file").setInputFiles(cardPath);
    await phone.locator("#activate-card").click();
    await phone.getByRole("heading", { name: "Sky shapes" }).waitFor();
    assert.equal(
      await phone.locator("#instruction").textContent(),
      "Find a cloud.",
    );
    await phone.goto(base);
    await phone.getByRole("heading", { name: "Sky shapes" }).waitFor();
    assert.deepEqual(errors, []);
    assert.ok(
      requests.every(
        ([method, url]) =>
          method === "GET" && (url.startsWith(base) || url.startsWith("blob:")),
      ),
    );
    console.log(
      "Passed two-browser handoff, wrong/right code, persistence, recording/playback/download/discard, written export, calendar, guided learning, denied mic, no uploads and responsive widths.",
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
