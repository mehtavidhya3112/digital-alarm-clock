// Digital Alarm Clock - web version (same logic as main.py)

const SNOOZE_MINUTES = 5;
const STORAGE_KEY = "digital-alarm-clock-alarms";

const timeEl = document.getElementById("time");
const dateEl = document.getElementById("date");
const format24 = document.getElementById("format24");
const alarmTime = document.getElementById("alarmTime");
const alarmLabel = document.getElementById("alarmLabel");
const addBtn = document.getElementById("addBtn");
const listEl = document.getElementById("alarmList");
const emptyEl = document.getElementById("empty");
const ringingEl = document.getElementById("ringing");
const ringTime = document.getElementById("ringTime");
const ringLabel = document.getElementById("ringLabel");
const stopBtn = document.getElementById("stopBtn");
const snoozeBtn = document.getElementById("snoozeBtn");
const toastEl = document.getElementById("toast");
let toastTimer = null;

let alarms = loadAlarms();
let ringing = null;
let beepTimer = null;
let audioCtx = null;
let lastChecked = "";

// ---------- save / load ----------
function loadAlarms() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveAlarms() {
  try {
    const permanent = alarms.filter(a => !a.snooze);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permanent));
  } catch (e) {
    /* storage unavailable - alarms still work until the tab closes */
  }
}

// ---------- time helpers ----------
const pad = n => String(n).padStart(2, "0");

function showTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  if (format24.checked) return `${pad(h)}:${pad(m)}`;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${pad(h % 12 || 12)}:${pad(m)} ${suffix}`;
}

// ---------- clock ----------
function tick() {
  const now = new Date();
  const h = now.getHours();
  const clock = format24.checked
    ? `${pad(h)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    : `${pad(h % 12 || 12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${h >= 12 ? "PM" : "AM"}`;
  timeEl.textContent = clock;
  dateEl.textContent = now.toLocaleDateString(undefined, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  updateWorld(now);

  const minuteKey = `${now.toDateString()} ${pad(h)}:${pad(now.getMinutes())}`;
  if (minuteKey !== lastChecked) {
    lastChecked = minuteKey;
    checkAlarms(`${pad(h)}:${pad(now.getMinutes())}`);
  }
}

// ---------- alarm list ----------
function renderList() {
  listEl.innerHTML = "";
  emptyEl.hidden = alarms.length > 0;

  alarms.forEach((alarm, index) => {
    const li = document.createElement("li");
    if (!alarm.active) li.classList.add("off");

    const when = document.createElement("span");
    when.className = "when";
    when.textContent = showTime(alarm.time);

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = alarm.label;

    const toggle = document.createElement("button");
    toggle.className = "small";
    toggle.textContent = alarm.active ? "Turn off" : "Turn on";
    toggle.addEventListener("click", () => {
      alarm.active = !alarm.active;
      saveAlarms();
      renderList();
    });

    const remove = document.createElement("button");
    remove.className = "small";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => {
      alarms.splice(index, 1);
      saveAlarms();
      renderList();
    });

    li.append(when, name, toggle, remove);
    listEl.appendChild(li);
  });
}

function addAlarm() {
  if (!alarmTime.value) {
    alert("Pick a time for the alarm.");
    return;
  }
  // A click is a user action, so the browser lets us create sound now.
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const alarm = {
    time: alarmTime.value,
    label: alarmLabel.value.trim() || "Alarm",
    active: true,
  };
  alarms.push(alarm);
  alarms.sort((a, b) => a.time.localeCompare(b.time));
  alarmLabel.value = "";
  saveAlarms();
  renderList();

  // Tell the user the alarm is set: default sound + message
  askNotifyPermission();
  chime();
  showToast(`Alarm set for ${showTime(alarm.time)}. Rings in ${untilText(alarm.time)}.`);
}

// ---------- ringing ----------
function checkAlarms(hhmm) {
  if (ringing) return;
  const match = alarms.find(a => a.active && a.time === hhmm);
  if (match) startRinging(match);
}

// One tone of the default sound
function beep(freq = 1000, seconds = 0.4) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  gain.gain.value = 0.2;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + seconds);
}

// Default alarm sound: two rising tones, repeated while ringing
function ringTone() {
  beep(880, 0.25);
  setTimeout(() => beep(1175, 0.25), 300);
}

// Short chime that confirms an alarm was set
function chime() {
  beep(660, 0.15);
  setTimeout(() => beep(990, 0.25), 180);
}

// How long until the next time the clock shows hhmm, as text
function untilText(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const totalMinutes = Math.max(1, Math.round((target - now) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 4000);
}

// Ask once for permission to show system notifications
function askNotifyPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, tag: "alarm-clock", requireInteraction: true });
    } catch (e) { /* some mobile browsers block this */ }
  }
}

function startRinging(alarm) {
  ringing = alarm;
  ringTime.textContent = showTime(alarm.time);
  ringLabel.textContent = alarm.label;
  ringingEl.hidden = false;
  ringTone();
  beepTimer = setInterval(ringTone, 1200);
  sendNotification(alarm.label, `Alarm for ${showTime(alarm.time)}`);
  if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
  stopBtn.focus();
}

function stopRinging() {
  clearInterval(beepTimer);
  ringingEl.hidden = true;
  const finished = ringing;
  ringing = null;
  if (finished && finished.snooze) {
    alarms = alarms.filter(a => a !== finished);
  }
  renderList();
}

function snooze() {
  stopRinging();
  const later = new Date(Date.now() + SNOOZE_MINUTES * 60000);
  alarms.push({
    time: `${pad(later.getHours())}:${pad(later.getMinutes())}`,
    label: "Snooze",
    active: true,
    snooze: true,
  });
  alarms.sort((a, b) => a.time.localeCompare(b.time));
  renderList();
}

// ---------- start ----------
addBtn.addEventListener("click", addAlarm);
stopBtn.addEventListener("click", stopRinging);
snoozeBtn.addEventListener("click", snooze);
format24.addEventListener("change", () => { tick(); renderList(); });


// =====================================================
// World time
// =====================================================
const WORLD_KEY = "digital-alarm-clock-cities";

const CITIES = [
  { name: "Kolkata", zone: "Asia/Kolkata" },
  { name: "Dubai", zone: "Asia/Dubai" },
  { name: "Karachi", zone: "Asia/Karachi" },
  { name: "Dhaka", zone: "Asia/Dhaka" },
  { name: "Bangkok", zone: "Asia/Bangkok" },
  { name: "Singapore", zone: "Asia/Singapore" },
  { name: "Hong Kong", zone: "Asia/Hong_Kong" },
  { name: "Beijing", zone: "Asia/Shanghai" },
  { name: "Tokyo", zone: "Asia/Tokyo" },
  { name: "Seoul", zone: "Asia/Seoul" },
  { name: "Sydney", zone: "Australia/Sydney" },
  { name: "Auckland", zone: "Pacific/Auckland" },
  { name: "Moscow", zone: "Europe/Moscow" },
  { name: "Istanbul", zone: "Europe/Istanbul" },
  { name: "Cairo", zone: "Africa/Cairo" },
  { name: "Nairobi", zone: "Africa/Nairobi" },
  { name: "Lagos", zone: "Africa/Lagos" },
  { name: "Johannesburg", zone: "Africa/Johannesburg" },
  { name: "Paris", zone: "Europe/Paris" },
  { name: "Berlin", zone: "Europe/Berlin" },
  { name: "London", zone: "Europe/London" },
  { name: "Sao Paulo", zone: "America/Sao_Paulo" },
  { name: "New York", zone: "America/New_York" },
  { name: "Toronto", zone: "America/Toronto" },
  { name: "Chicago", zone: "America/Chicago" },
  { name: "Mexico City", zone: "America/Mexico_City" },
  { name: "Denver", zone: "America/Denver" },
  { name: "Los Angeles", zone: "America/Los_Angeles" },
  { name: "Honolulu", zone: "Pacific/Honolulu" },
];

const DEFAULT_CITIES = ["Asia/Kolkata", "America/New_York", "Europe/London", "Asia/Dubai", "Asia/Tokyo", "Australia/Sydney"];

const tabAlarms = document.getElementById("tabAlarms");
const tabWorld = document.getElementById("tabWorld");
const alarmsPanel = document.getElementById("alarmsPanel");
const worldPanel = document.getElementById("worldPanel");
const localZoneEl = document.getElementById("localZone");
const citySelect = document.getElementById("citySelect");
const addCityBtn = document.getElementById("addCityBtn");
const worldList = document.getElementById("worldList");
const worldEmpty = document.getElementById("worldEmpty");

let savedZones = loadZones();
let worldRows = [];   // { zone, timeEl, metaEl }

function loadZones() {
  try {
    const stored = JSON.parse(localStorage.getItem(WORLD_KEY));
    if (Array.isArray(stored)) return stored;
  } catch (e) { /* fall through */ }
  return DEFAULT_CITIES.slice();
}

function saveZones() {
  try {
    localStorage.setItem(WORLD_KEY, JSON.stringify(savedZones));
  } catch (e) { /* storage unavailable */ }
}

function cityName(zone) {
  const city = CITIES.find(c => c.zone === zone);
  return city ? city.name : zone;
}

// Break a moment into year/month/day/hour/minute/second as seen in a time zone
function zoneParts(date, zone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
  }).formatToParts(date);
  const out = {};
  parts.forEach(p => { if (p.type !== "literal") out[p.type] = Number(p.value); });
  return out;
}

const asUTC = p => Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);

function describeOffset(diffMinutes) {
  if (diffMinutes === 0) return "Same time as you";
  const abs = Math.abs(diffMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const amount = (h ? `${h}h` : "") + (h && m ? " " : "") + (m ? `${m}m` : "");
  return `${amount} ${diffMinutes > 0 ? "ahead" : "behind"}`;
}

function describeDay(dayDiff) {
  if (dayDiff === 0) return "Today";
  return dayDiff > 0 ? "Tomorrow" : "Yesterday";
}

function setupLocalZone() {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "your time zone";
  localZoneEl.textContent = `Your time zone: ${zone.replace(/_/g, " ")}`;
}

// Build the list (runs when cities change)
function buildWorld() {
  worldList.innerHTML = "";
  worldRows = [];
  worldEmpty.hidden = savedZones.length > 0;

  savedZones.forEach(zone => {
    const li = document.createElement("li");
    li.className = "world-item";

    const place = document.createElement("div");
    place.className = "place";
    const city = document.createElement("div");
    city.className = "city";
    city.textContent = cityName(zone);
    const meta = document.createElement("div");
    meta.className = "meta";
    place.append(city, meta);

    const clock = document.createElement("div");
    clock.className = "clock";

    const remove = document.createElement("button");
    remove.className = "small";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${cityName(zone)}`);
    remove.addEventListener("click", () => {
      savedZones = savedZones.filter(z => z !== zone);
      saveZones();
      buildWorld();
      fillCitySelect();
    });

    li.append(place, clock, remove);
    worldList.appendChild(li);
    worldRows.push({ zone, clock, meta });
  });

  updateWorld(new Date());
}

// Refresh the clocks (runs every tick)
function updateWorld(now) {
  if (worldPanel.hidden) return;
  const local = zoneParts(now, Intl.DateTimeFormat().resolvedOptions().timeZone);
  const localDay = Date.UTC(local.year, local.month - 1, local.day);

  worldRows.forEach(row => {
    const p = zoneParts(now, row.zone);
    const diffMinutes = Math.round((asUTC(p) - asUTC(local)) / 60000);
    const dayDiff = Math.round((Date.UTC(p.year, p.month - 1, p.day) - localDay) / 86400000);

    const hh = pad(p.hour);
    const mm = pad(p.minute);
    const ss = pad(p.second);
    row.clock.textContent = format24.checked
      ? `${hh}:${mm}:${ss}`
      : `${pad(p.hour % 12 || 12)}:${mm}:${ss} ${p.hour >= 12 ? "PM" : "AM"}`;
    row.meta.textContent = `${describeDay(dayDiff)} · ${describeOffset(diffMinutes)}`;
  });
}

function fillCitySelect() {
  citySelect.innerHTML = "";
  CITIES.filter(c => !savedZones.includes(c.zone))
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(c => {
      const option = document.createElement("option");
      option.value = c.zone;
      option.textContent = c.name;
      citySelect.appendChild(option);
    });
  addCityBtn.disabled = citySelect.options.length === 0;
}

function addCity() {
  const zone = citySelect.value;
  if (!zone || savedZones.includes(zone)) return;
  savedZones.push(zone);
  saveZones();
  buildWorld();
  fillCitySelect();
}

function showTab(which) {
  const world = which === "world";
  worldPanel.hidden = !world;
  alarmsPanel.hidden = world;
  tabWorld.classList.toggle("active", world);
  tabAlarms.classList.toggle("active", !world);
  tabWorld.setAttribute("aria-selected", String(world));
  tabAlarms.setAttribute("aria-selected", String(!world));
  if (world) updateWorld(new Date());
}

tabAlarms.addEventListener("click", () => showTab("alarms"));
tabWorld.addEventListener("click", () => showTab("world"));
addCityBtn.addEventListener("click", addCity);

setupLocalZone();
fillCitySelect();
buildWorld();

// ---------- start (runs last, after everything above is defined) ----------
renderList();
tick();
setInterval(tick, 500);
