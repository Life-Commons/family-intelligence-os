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
    await desk.getByRole("heading", { name: "Sunday Stories." }).waitFor();
    if (process.env.SCREEN_DIR)
      await desk.screenshot({ path: process.env.SCREEN_DIR + "/desk.png" });
    await desk.selectOption("#pack", "place");
    await desk.getByText("Prepare setup link", { exact: true }).click();
    const invite = await desk.locator("#setup-link").inputValue();
    await phone.goto(invite);
    await phone.locator("#accept").click();
    await phone
      .getByRole("heading", { name: "Where did your family gather?" })
      .waitFor();
    const code = await phone.locator("#receipt-code").textContent();
    const input = desk.getByLabel("Returned setup code");
    await input.fill("000000");
    await desk.locator(".device form button").click();
    assert.match(await desk.locator("#notice").textContent(), /does not match/);
    await input.fill(code);
    await desk.locator(".device form button").click();
    await desk.reload();
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
    const download = phone.waitForEvent("download");
    await phone.locator("#download").click();
    const file = await download;
    assert.ok((await readFile(await file.path())).length > 100);
    await phone.locator("#discard").click();
    assert.equal(await phone.locator("#review").isVisible(), false);
    await phone.locator("#story summary").click();
    await phone.locator("#story-text").fill("A synthetic field note.");
    const writing = phone.waitForEvent("download");
    await phone.locator("#save-text").click();
    assert.match(
      await readFile(await (await writing).path(), "utf8"),
      /synthetic field note/,
    );
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
    await phone.goto(base + "/?view=learn&card=map");
    for (let i = 0; i < 3; i++) await phone.locator("#next-step").click();
    await phone.getByRole("heading", { name: "Fieldwork complete." }).waitFor();
    await phone.locator("#next-step").click();
    await phone.getByRole("heading", { name: "Choose one place." }).waitFor();
    for (const width of [320, 390, 768, 1280]) {
      await desk.setViewportSize({ width, height: 800 });
      await desk.goto(base + "/?view=desk");
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
    await desk.getByRole("button", { name: "Forget entry" }).click();
    await desk.getByText("Your first setup will appear here.").waitFor();
    await desk.locator("#teaching summary").click();
    const draft =
      "Sky shapes\nLook up together.\nFind a cloud.\nDraw an outline.\nCompare your sketches.";
    await desk.locator("#teacher-draft").fill(draft);
    await desk.locator("#preview-draft").click();
    const cardDownload = desk.waitForEvent("download");
    await desk.locator("#export-card").click();
    const cardPath = await (await cardDownload).path();
    await phone.goto(base + "/?view=desk");
    await phone.locator("#teaching summary").click();
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
