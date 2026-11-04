export const cards = Object.freeze({
  kitchen: {
    view: "story",
    name: "Story · The family kitchen",
    title: "Who taught you to cook?",
    intro:
      "Think of one kitchen. What could you smell? What did the person beside you say?",
  },
  place: {
    view: "story",
    name: "Story · A place to remember",
    title: "Where did your family gather?",
    intro:
      "Picture the doorway. Who opened it? Tell one small thing you can still see.",
  },
  sounds: {
    view: "learn",
    name: "Field school · Sound detective",
    title: "Be a sound detective.",
    intro: "A five-minute listening walk with someone you trust.",
    steps: [
      [
        "Listen closely.",
        "Stand somewhere comfortable. Close your eyes if you like. Find one sound nearby and one far away.",
      ],
      [
        "Draw what you heard.",
        "On paper, draw a mark for each sound. Which would be a tiny dot? Which would be a wavy line?",
      ],
      [
        "Trade a question.",
        "Show your drawing to your grown-up. Ask which sound they remember from when they were small.",
      ],
    ],
  },
  map: {
    view: "learn",
    name: "Field school · Memory map",
    title: "Make a memory map.",
    intro: "A piece of paper, a pencil and someone with a story.",
    steps: [
      [
        "Choose one place.",
        "Ask a grown-up to describe a room or garden they remember. Start with one object.",
      ],
      [
        "Sketch the scene.",
        "Draw three details from the story. Leave a little space where you are unsure.",
      ],
      [
        "Compare memories.",
        "Show your map. Ask what they would add or draw differently. Give it a name together.",
      ],
    ],
  },
});
export function cardFor(view, key) {
  return Object.hasOwn(cards, key) && cards[key].view === view
    ? key
    : view === "learn"
      ? "sounds"
      : "kitchen";
}
const stamp = (d) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
export function eventFor(start, uid, now = new Date()) {
  if (
    !(start instanceof Date) ||
    !Number.isFinite(start.getTime()) ||
    start <= now
  )
    throw new Error("Choose a visit time in the future.");
  const dates =
    stamp(start) + "/" + stamp(new Date(start.getTime() + 20 * 60000));
  const summary = "Sunday Stories - family visit";
  const [from, to] = dates.split("/");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Family Commons//Sunday Stories//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:" + uid + "@sunday-stories.local",
    "DTSTAMP:" + stamp(now),
    "DTSTART:" + from,
    "DTEND:" + to,
    "SUMMARY:" + summary,
    "DESCRIPTION:Bring a question for a family story.",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Family story visit",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  const google = new URL("https://calendar.google.com/calendar/render");
  google.search = new URLSearchParams({
    action: "TEMPLATE",
    text: summary,
    dates,
    details: "Bring a question for a family story.",
  });
  return { ics, google: google.href };
}
export const codePattern = /^[A-F0-9]{10}$/;
export const week = 7 * 24 * 60 * 60 * 1000;
export function validSetup(hash, now = Date.now()) {
  const p = new URLSearchParams(hash.replace(/^#/, "")),
    card = p.get("pack"),
    code = p.get("code"),
    expires = Number(p.get("until"));
  return Object.hasOwn(cards, card) &&
    codePattern.test(code) &&
    Number.isSafeInteger(expires) &&
    expires > now &&
    expires <= now + week + 60000
    ? { card, code, expires }
    : null;
}
