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

// ---- Storage backend: Firebase if configured, else localStorage (this device only) ----
const LOCAL_KEY = "bg-signups-v1";
let state = {}; // { key: "yes" | "no" }
let dbRef = null;
const usingFirebase = typeof firebaseConfig !== "undefined" && firebaseConfig;

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

function setAnswer(key, value) {
  if (usingFirebase) {
    dbRef.child(key).set(value);
  } else {
    state[key] = value;
    saveLocal();
    render();
  }
}

function init() {
  const banner = document.getElementById("status-banner");
  if (usingFirebase) {
    firebase.initializeApp(firebaseConfig);
    dbRef = firebase.database().ref("signups");
    dbRef.on("value", (snapshot) => {
      state = snapshot.val() || {};
      render();
    });
  } else {
    state = loadLocal();
    banner.textContent =
      "Shared sign-ups aren't enabled yet — your answer is only saved on this device.";
    banner.classList.remove("hidden");
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
