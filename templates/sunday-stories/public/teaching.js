export function reviewedCard(lines) {
  if (!Array.isArray(lines) || lines.length !== 5) return null;
  const bounds = [80, 180, 300, 300, 300];
  if (
    !lines.every(
      (s, i) =>
        typeof s === "string" &&
        s.trim().length > 0 &&
        s.length <= bounds[i] &&
        !/[\r\n\u0000-\u001f]/.test(s),
    )
  )
    return null;
  const [title, intro, ...steps] = lines.map((s) => s.trim());
  return { title, intro, steps: steps.map((s, i) => ["Step " + (i + 1), s]) };
}
export function setupTeaching(write, say) {
  const el = (id) => document.getElementById(id);
  const brief =
    "Draft a five-minute, adult-led activity about a topic I choose. Ask for the topic only. Return exactly five plain text lines: a title (80 characters maximum), an introduction (180 maximum), and three concrete steps (300 each). Use common household materials, no accounts, links, personal data or external contact. An adult will review it before use.";
  let approvedLines = null,
    revision = 0;
  el("teacher-brief").onclick = async () => {
    try {
      await navigator.clipboard.writeText(brief);
      say("Brief copied. Open your own AI account and choose a topic.");
    } catch {
      const field = el("teacher-prompt");
      field.hidden = false;
      field.value = brief;
      field.select();
      say("Select and copy the adult brief.");
    }
  };
  function reset() {
    approvedLines = null;
    revision++;
    el("teacher-review").hidden = true;
    el("activate-card").hidden = true;
  }
  function preview(lines, fromFile) {
    reset();
    const card = reviewedCard(lines);
    if (!card) {
      say(
        "Use exactly five nonempty lines: title (up to 80 characters), introduction (180) and three steps (300 each).",
      );
      return;
    }
    approvedLines = lines.map((s) => s.trim());
    el("teacher-title").textContent = card.title;
    el("teacher-intro").textContent = card.intro;
    el("teacher-steps").replaceChildren(
      ...card.steps.map(([, s]) => {
        const item = document.createElement("li");
        item.textContent = s;
        return item;
      }),
    );
    el("teacher-review").hidden = false;
    el("export-card").hidden = fromFile;
    el("activate-card").hidden = !fromFile;
    say("Review the complete card before approving it.");
  }
  el("teacher-draft").oninput = reset;
  el("preview-draft").onclick = () =>
    preview(el("teacher-draft").value.trim().split(/\r?\n/), false);
  el("export-card").onclick = () => {
    if (!approvedLines) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(
        [JSON.stringify({ format: "sunday-card/1", lines: approvedLines })],
        { type: "application/json" },
      ),
    );
    a.download = "family-activity.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    say(
      "Card download requested. Review the file on the receiving phone before use.",
    );
  };
  el("card-file").onchange = async () => {
    reset();
    const current = revision,
      file = el("card-file").files[0];
    if (!file) return;
    try {
      if (file.size > 8192) throw Error();
      const data = JSON.parse(await file.text());
      if (current !== revision) return;
      if (data?.format !== "sunday-card/1") throw Error();
      preview(data.lines, true);
    } catch {
      if (current === revision)
        say(
          "This is not a supported activity card. Choose a Sunday Stories card file.",
        );
    }
  };
  el("activate-card").onclick = () => {
    if (
      approvedLines &&
      write("lesson", approvedLines) &&
      write("start", { card: "reviewed" })
    )
      location.assign("?view=learn&card=reviewed");
  };
}
