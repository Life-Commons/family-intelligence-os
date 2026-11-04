// A read-only snapshot of simple events. Unsupported calendar semantics fail closed.
function startDate(value, allDay) {
  const pattern = allDay
    ? /^(\d{4})(\d{2})(\d{2})$/
    : /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;
  const parts = pattern.exec(value);
  if (!parts) return null;
  const [year, month, day, hour = 0, minute = 0, second = 0] = parts
    .slice(1)
    .map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  )
    return null;
  return allDay ? new Date(year, month - 1, day) : utc;
}
export function readAgenda(text, now = new Date()) {
  if (text.length > 524288)
    throw Error("Choose a calendar file smaller than 512 KB.");
  const lines = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n[ \t]/g, "")
    .trim()
    .split("\n");
  if (
    lines.shift()?.toUpperCase() !== "BEGIN:VCALENDAR" ||
    lines.pop()?.toUpperCase() !== "END:VCALENDAR"
  )
    throw Error("Choose an exported .ics calendar file.");
  const stack = [],
    items = [],
    byId = new Map();
  let event = null,
    skipped = 0;
  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).toUpperCase(),
      prop = key.split(";")[0],
      value = line.slice(colon + 1);
    if (prop === "BEGIN") {
      stack.push(value.toUpperCase());
      if (stack.length === 1 && stack[0] === "VEVENT") event = {};
      continue;
    }
    if (prop === "END") {
      if (stack.pop() !== value.toUpperCase())
        throw Error("The calendar file is incomplete.");
      if (event && stack.length === 0) {
        items.push(event);
        byId.set(event.id, (byId.get(event.id) || 0) + 1);
        event = null;
      }
      continue;
    }
    if (!stack.length && prop === "METHOD" && value.toUpperCase() !== "PUBLISH")
      throw Error(
        "Choose a calendar export instead of an invitation or cancellation.",
      );
    if (stack.length !== 1 || !event) continue;
    if (prop === "UID") event.id = value;
    if (prop === "SUMMARY")
      event.title = value
        .replace(/\\([nN,;\\])/g, (_, c) => (/[nN]/.test(c) ? " " : c))
        .trim()
        .slice(0, 180);
    if (prop === "DTSTART") {
      event.allDay = key === "DTSTART;VALUE=DATE";
      event.start =
        key === "DTSTART" || event.allDay
          ? startDate(value, event.allDay)
          : null;
    }
    if (
      ["RRULE", "RDATE", "EXDATE", "RECURRENCE-ID", "EXRULE"].includes(prop) ||
      (prop === "STATUS" && value.toUpperCase() === "CANCELLED")
    )
      event.unsupported = true;
  }
  if (stack.length) throw Error("The calendar file is incomplete.");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const future = items
    .filter((e) => {
      if (!e.id || !e.start || e.unsupported || byId.get(e.id) !== 1) {
        skipped++;
        return false;
      }
      return e.start >= (e.allDay ? today : now);
    })
    .sort((a, b) => a.start - b.start);
  return {
    visits: future
      .slice(0, 6)
      .map(({ title, start, allDay }) => ({
        title: title || "Calendar event",
        start,
        allDay,
      })),
    skipped,
    total: future.length,
  };
}
export function setupAgenda() {
  const file = document.getElementById("agenda-file"),
    list = document.getElementById("agenda-list"),
    status = document.getElementById("agenda-status"),
    clear = document.getElementById("agenda-clear");
  let generation = 0;
  function reset() {
    generation++;
    list.replaceChildren();
    status.textContent = "";
    clear.hidden = true;
  }
  clear.onclick = () => {
    file.value = "";
    reset();
    status.textContent = "Calendar snapshot cleared.";
  };
  file.onchange = async () => {
    reset();
    const token = generation,
      source = file.files[0];
    if (!source) return;
    try {
      if (source.size > 524288)
        throw Error("Choose a calendar file smaller than 512 KB.");
      const data = readAgenda(await source.text());
      if (token !== generation) return;
      for (const visit of data.visits) {
        const row = document.createElement("li");
        const date = new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          ...(visit.allDay ? {} : { timeStyle: "short" }),
        }).format(visit.start);
        row.textContent =
          date + (visit.allDay ? " · All day" : "") + " — " + visit.title;
        list.append(row);
      }
      status.textContent =
        "Local snapshot · " +
        data.visits.length +
        " of " +
        data.total +
        " upcoming one-off events shown. " +
        data.skipped +
        " unsupported or cancelled entries omitted.";
      clear.hidden = false;
    } catch (error) {
      if (token === generation) status.textContent = error.message;
    }
  };
}
