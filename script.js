// ---- Roster (edit names here) ----
const ROSTER = {
  goalies: [
    { key: "g0", name: "Rasmus Mosca" },
    { key: "g1", name: "Tuomas Tonteri" },
  ],
  players: [
    { key: "p0", name: "Karl Söderby" },
    { key: "p1", name: "Lucas Stenberg" },
    { key: "p2", name: "Evan Farbstein" },
    { key: "p3", name: "Jonas von Nolting" },
    { key: "p4", name: "Martin Park" },
    { key: "p5", name: "Oscar Simey" },
    { key: "p6", name: "Peter Dahlgren" },
    { key: "p7", name: "Lee Ruttle" },
    { key: "p8", name: "Dave Andersson" },
    { key: "p9", name: "Reidar Balstad" },
    { key: "p10", name: "Mohamad Hamid" },
    { key: "p11", name: "Martin Ollinen" },
    { key: "p12", name: "Patrik Sjöman" },
    { key: "p13", name: "Philippe Luu" },
    { key: "p14", name: "Elias Brange" },
    { key: "p15", name: "Jens Lindahl" },
    { key: "p16", name: "Carl Henrik Adler" },
    { key: "p17", name: "Per Buell" },
    { key: "p18", name: "Anton Gustafsson" },
    { key: "p19", name: "Jesper Pettersson" },
  ],
};

// ---- Storage backend: GitHub repo (signups.json) if a token is configured, ----
// ---- else localStorage (this device only). ----
const LOCAL_KEY = "bg-signups-v1";
let state = {}; // { key: "yes" | "no" }
const usingGitHub =
  typeof GITHUB_CONFIG !== "undefined" && GITHUB_CONFIG && GITHUB_CONFIG.token;

function b64ToUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function utf8ToB64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveLocal() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

function showBanner(text) {
  const banner = document.getElementById("status-banner");
  banner.textContent = text;
  banner.classList.remove("hidden");
}

function hideBanner() {
  document.getElementById("status-banner").classList.add("hidden");
}

function contentsUrl() {
  return `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
}

async function fetchState() {
  const res = await fetch(`${contentsUrl()}?ref=${GITHUB_CONFIG.branch}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_CONFIG.token}`,
    },
  });
  if (!res.ok) throw new Error(`Could not load sign-ups (${res.status})`);
  const json = await res.json();
  state = JSON.parse(b64ToUtf8(json.content));
  render();
}

async function commitChange(key, value, attempt = 0) {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${GITHUB_CONFIG.token}`,
  };
  const getRes = await fetch(`${contentsUrl()}?ref=${GITHUB_CONFIG.branch}`, { headers });
  if (!getRes.ok) throw new Error(`Could not read current data (${getRes.status})`);
  const getJson = await getRes.json();
  const remoteState = JSON.parse(b64ToUtf8(getJson.content));
  remoteState[key] = value;

  const putRes = await fetch(contentsUrl(), {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Sign-up: ${key} -> ${value}`,
      content: utf8ToB64(JSON.stringify(remoteState, null, 2) + "\n"),
      sha: getJson.sha,
      branch: GITHUB_CONFIG.branch,
    }),
  });

  if (putRes.status === 409 && attempt < 3) {
    return commitChange(key, value, attempt + 1);
  }
  if (!putRes.ok) throw new Error(`Could not save (${putRes.status})`);

  state = remoteState;
  render();
}

function setAnswer(key, value) {
  const previous = state[key];
  state[key] = value;
  render();

  if (usingGitHub) {
    commitChange(key, value).catch((err) => {
      console.error(err);
      state[key] = previous;
      render();
      showBanner("Could not save — check your connection and try again.");
    });
  } else {
    saveLocal();
  }
}

function init() {
  if (usingGitHub) {
    fetchState().catch((err) => {
      console.error(err);
      showBanner("Could not load sign-ups — check your connection and reload.");
    });
    setInterval(() => {
      fetchState().catch(() => {});
    }, 8000);
  } else {
    state = loadLocal();
    showBanner("Shared sign-ups aren't enabled yet — your answer is only saved on this device.");
    render();
  }
}

// ---- Rendering ----
function renderList(el, entries) {
  el.innerHTML = "";
  entries.forEach(({ key, name }) => {
    const li = document.createElement("li");
    const answer = state[key];
    li.className = answer === "yes" ? "state-yes" : answer === "no" ? "state-no" : "";
    li.innerHTML = `<span>${name}</span><span class="status-tag">${
      answer === "yes" ? "IN" : answer === "no" ? "OUT" : ""
    }</span>`;
    li.addEventListener("click", () => openModal(key, name));
    el.appendChild(li);
  });
}

function render() {
  renderList(document.getElementById("goalie-list"), ROSTER.goalies);
  renderList(document.getElementById("player-list"), ROSTER.players);

  const goalieYes = ROSTER.goalies.filter((g) => state[g.key] === "yes").length;
  const playerYes = ROSTER.players.filter((p) => state[p.key] === "yes").length;
  document.getElementById("goalie-count").textContent = `Goalies ${goalieYes}/2`;
  document.getElementById("player-count").textContent = `Players ${playerYes}/20`;
}

// ---- Modal ----
const overlay = document.getElementById("overlay");
const modalName = document.getElementById("modal-name");
let activeKey = null;

function openModal(key, name) {
  activeKey = key;
  modalName.textContent = name;
  overlay.classList.remove("hidden");
}

function closeModal() {
  overlay.classList.add("hidden");
  activeKey = null;
}

document.getElementById("btn-yes").addEventListener("click", () => {
  if (activeKey) setAnswer(activeKey, "yes");
  closeModal();
});
document.getElementById("btn-no").addEventListener("click", () => {
  if (activeKey) setAnswer(activeKey, "no");
  closeModal();
});
document.getElementById("btn-cancel").addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

init();
