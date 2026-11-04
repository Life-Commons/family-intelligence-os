import { setupAgenda } from "./agenda.js";
import {
  cards,
  cardFor,
  eventFor,
  codePattern,
  validSetup,
  week,
} from "./fieldbook.js";
import { setupTeaching, reviewedCard } from "./teaching.js";
import { startStory } from "./story.js";
const $ = (id) => document.getElementById(id);
const say = (message) => {
  $("notice").textContent = message;
};
const prefix = "sunday-stories.v1.";
function read(key) {
  try {
    return JSON.parse(localStorage.getItem(prefix + key));
  } catch {
    return null;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value));
    return true;
  } catch {
    say(
      "This browser could not save the setup. You can still open an activity once.",
    );
    return false;
  }
}
function remove(key) {
  try {
    localStorage.removeItem(prefix + key);
    return true;
  } catch {
    say("This browser could not remove the entry.");
    return false;
  }
}
function link(view, card) {
  const url = new URL("./", location.href);
  url.search = new URLSearchParams({ view, card });
  return url;
}
const params = new URLSearchParams(location.search);
const preset = read("start");
const custom = reviewedCard(read("lesson"));
const saved =
  Object.hasOwn(cards, preset?.card) || (preset?.card === "reviewed" && custom)
    ? preset
    : null;
const viewFor = (key) => (key === "reviewed" ? "learn" : cards[key].view);
const setup = validSetup(location.hash);
function openCard(card) {
  location.replace(link(cards[card].view, card));
}
function showPhone(key) {
  $("phone").hidden = false;
  $("bookmark").href = link(viewFor(key), key);
  if (
    saved?.card === key &&
    codePattern.test(saved.code) &&
    saved.expires > Date.now()
  ) {
    $("receipt").hidden = false;
    $("receipt-code").textContent = saved.code;
    $("phone").querySelector("details").open = true;
  }
}
function initActivity(view, key) {
  $(view).hidden = false;
  showPhone(key);
  if (view === "story") {
    startStory(cards[key]);
    return;
  }
  const card = key === "reviewed" ? custom : cards[key];
  let i = 0;
  $("lesson-title").textContent = card.title;
  $("lesson-intro").textContent = card.intro;
  function showStep() {
    const done = i === card.steps.length;
    $("step-no").textContent = done
      ? "FINISHED"
      : "FIELD NOTE 0" + (i + 1) + " / 03";
    $("step").textContent = done ? "Fieldwork complete." : card.steps[i][0];
    $("instruction").textContent = done
      ? "Tell each other one thing you noticed."
      : card.steps[i][1];
    $("next-step").textContent = done
      ? "Start again"
      : i === 2
        ? "Finish activity"
        : "Next step";
  }
  $("next-step").onclick = () => {
    i = (i + 1) % (card.steps.length + 1);
    showStep();
    $("step").tabIndex = -1;
    $("step").focus();
  };
  showStep();
}
function deviceList() {
  const box = $("devices");
  box.replaceChildren();
  let entries = [];
  try {
    entries = Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix + "kit:"))
      .map((k) => ({
        key: k.slice(prefix.length),
        entry: read(k.slice(prefix.length)),
      }))
      .filter(
        ({ entry }) =>
          entry &&
          Object.hasOwn(cards, entry.card) &&
          codePattern.test(entry.code),
      )
      .sort((a, b) => b.entry.created - a.entry.created);
  } catch {
    say("The phone notebook requires local storage.");
  }
  if (!entries.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "Your first setup will appear here.";
    box.append(p);
    return;
  }
  for (const { key, entry } of entries) {
    const row = document.createElement("div");
    row.className = "device";
    const title = document.createElement("strong");
    title.textContent = cards[entry.card].name;
    const status = document.createElement("p");
    const expired = entry.expires <= Date.now();
    status.textContent = entry.confirmed
      ? "Acknowledged by returned code"
      : expired
        ? "Setup expired"
        : "Awaiting returned code";
    row.append(title, status);
    if (!entry.confirmed && !expired) {
      const form = document.createElement("form"),
        label = document.createElement("label"),
        input = document.createElement("input"),
        submit = document.createElement("button");
      label.textContent = "Returned setup code";
      input.id = key;
      label.htmlFor = key;
      input.autocomplete = "off";
      input.maxLength = 12;
      input.required = true;
      submit.className = "secondary";
      submit.textContent = "Confirm code";
      form.append(label, input, submit);
      form.onsubmit = (e) => {
        e.preventDefault();
        const latest = read(key);
        if (!latest || latest.expires <= Date.now()) {
          deviceList();
          say("This setup is no longer active here.");
          return;
        }
        if (input.value.trim().toUpperCase() !== latest.code) {
          say("That code does not match this setup.");
          return;
        }
        if (write(key, { ...latest, confirmed: true })) {
          deviceList();
          say("Setup acknowledged.");
        }
      };
      row.append(form);
    }
    const forget = document.createElement("button");
    forget.className = "quiet";
    forget.textContent = "Forget entry";
    forget.onclick = () => {
      if (remove(key)) {
        deviceList();
        say("Entry removed from this browser.");
      }
    };
    row.append(forget);
    box.append(row);
  }
}
function initDesk() {
  setupAgenda();
  setupTeaching(write, say);
  $("reset-activity").onclick = () => {
    if (remove("start") && remove("lesson"))
      say("Saved activity cleared from this browser.");
  };
  $("desk").hidden = false;
  for (const [key, card] of Object.entries(cards))
    $("pack").add(new Option(card.name, key));
  $("prepare").onsubmit = (e) => {
    e.preventDefault();
    const card = $("pack").value,
      code = crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase(),
      created = Date.now(),
      expires = created + week;
    if (
      !write("kit:" + code, { card, code, created, expires, confirmed: false })
    )
      return;
    const url = new URL("./", location.href);
    url.hash = new URLSearchParams({
      pack: card,
      code,
      until: String(expires),
    });
    $("setup-link").value = url.href;
    $("handoff").hidden = false;
    deviceList();
    say("Setup link ready. It expires in seven days.");
  };
  $("copy-link").onclick = async () => {
    try {
      await navigator.clipboard.writeText($("setup-link").value);
      say("Setup link copied.");
    } catch {
      $("setup-link").select();
      say("Select and copy the link above.");
    }
  };
  const when = $("when"),
    visit = new Date();
  visit.setDate(visit.getDate() + ((7 - visit.getDay()) % 7 || 7));
  visit.setHours(16, 0, 0, 0);
  when.value = new Date(visit.getTime() - visit.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  let uid = crypto.randomUUID();
  function event() {
    return eventFor(new Date(when.value), uid);
  }
  function update() {
    try {
      $("google-event").href = event().google;
      $("google-event").hidden = false;
    } catch {
      $("google-event").hidden = true;
    }
  }
  when.oninput = () => {
    uid = crypto.randomUUID();
    update();
  };
  update();
  $("remind").onsubmit = (e) => {
    e.preventDefault();
    try {
      const blob = new Blob([event().ics], {
        type: "text/calendar;charset=utf-8",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "family-story-visit.ics";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
      say("Open the event in your calendar to confirm the visit and reminder.");
    } catch (error) {
      say(error.message);
    }
  };
  deviceList();
  window.addEventListener("storage", deviceList);
}
if (location.hash && location.hash !== "#main" && !setup) {
  say("This setup link is incomplete or expired. Ask for a new link.");
  initDesk();
} else if (setup) {
  $("welcome").hidden = false;
  $("welcome-name").textContent = cards[setup.card].name;
  $("once").onclick = () => openCard(setup.card);
  $("accept").onclick = () => {
    if (!validSetup(location.hash)) {
      say("This setup expired. Ask for a new link.");
      return;
    }
    if (write("start", setup)) openCard(setup.card);
  };
} else {
  const view = params.get("view") || (saved ? viewFor(saved.card) : "desk");
  if (view === "story" || view === "learn") {
    const requested = params.has("view") ? params.get("card") : saved?.card;
    const card =
      requested === "reviewed" && custom && view === "learn"
        ? "reviewed"
        : cardFor(view, requested);
    initActivity(view, card);
  } else initDesk();
}
