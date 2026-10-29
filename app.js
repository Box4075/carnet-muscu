/* Carnet Muscu — appli web installable, données stockées sur le téléphone (localStorage). */
const APP_VERSION = "1.1.0";
const KEY = "carnet-muscu-v1";
const $ = s => document.querySelector(s);
const el = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") e.className = v;
    else if (k === "text") e.textContent = v;
    else if (k.startsWith("on")) e[k] = v;
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? "" : v);
  }
  kids.flat().forEach(c => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
};
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => iso(new Date());
const parseISO = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const fmtDate = s => parseISO(s).toLocaleDateString("fr-FR", {weekday: "short", day: "numeric", month: "short"});
const fmtShort = s => parseISO(s).toLocaleDateString("fr-FR", {day: "numeric", month: "short"});
const fmtNum = v => (Math.round(v * 10) / 10).toLocaleString("fr-FR");
const num = v => { if (v === "" || v == null) return null; const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : null; };
const fmtTime = s => `${Math.floor(s / 60)}:${pad(Math.max(0, s % 60))}`;
const topOf = r => parseInt(String(r).split("-").pop(), 10);

/* ---------- état ---------- */
let S = load();
function load() {
  try { const o = JSON.parse(localStorage.getItem(KEY) || "null"); if (o && o.seances) return Object.assign({poids: {}, meta: {}}, o); } catch (e) {}
  return {seances: {}, poids: {}, meta: {}};
}
let saveTmr = null;
function save(now) {
  clearTimeout(saveTmr);
  const go = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Stockage plein ou bloqué"); } };
  now ? go() : (saveTmr = setTimeout(go, 300));
}
window.addEventListener("pagehide", () => save(true));
document.addEventListener("visibilitychange", () => { if (document.hidden) save(true); });

/* ---------- utilitaires séance ---------- */
const UI = {view: "seance", date: todayISO(), jour: null, exSel: null, metric: "kg"};
function defaultJour(date) {
  const s = S.seances[date]; if (s && s.jour) return s.jour;
  const wd = parseISO(date).getDay();
  if (wd >= 1 && wd <= 5) return wd;
  // week-end : séance suivant la dernière faite
  const last = Object.entries(S.seances).filter(([d]) => d < date).sort((a, b) => a[0] < b[0] ? 1 : -1)[0];
  return last ? (last[1].jour % 5) + 1 : 1;
}
function getItem(date, jour, slot, create) {
  let s = S.seances[date];
  if (!s || s.jour !== jour) {
    if (!create) return null;
    s = S.seances[date] = {jour, items: {}};
  }
  let it = s.items[slot.id];
  if (!it && create) {
    it = s.items[slot.id] = {ex: slot.id, sets: Array.from({length: slot.s}, () => ({kg: "", reps: "", ok: false}))};
  }
  return it;
}
function setsOf(it) { return (it && it.sets || []).filter(x => x.ok || num(x.reps) != null); }
function lastFor(exId, beforeDate) {
  const dates = Object.keys(S.seances).filter(d => d < beforeDate).sort().reverse();
  for (const d of dates) {
    const items = Object.values(S.seances[d].items || {});
    const it = items.find(i => i.ex === exId && setsOf(i).length);
    if (it) return {date: d, sets: setsOf(it)};
  }
  return null;
}
const setTxt = (sets, unit) => sets.map(s => unit === "min" ? `${s.reps || "–"} min` : `${num(s.kg) ? fmtNum(num(s.kg)) + "×" : ""}${s.reps || "–"}`).join(" · ");

/* ---------- repos ---------- */
const R = {end: 0, total: 0, tmr: null, label: ""};
let audioCtx = null;
function startRest(sec, label) {
  if (!sec) return;
  R.end = Date.now() + sec * 1000; R.total = sec; R.label = label;
  $("#rest").hidden = false; $("#rest").classList.remove("end");
  clearInterval(R.tmr); R.tmr = setInterval(tickRest, 250); tickRest();
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
}
function tickRest() {
  const left = Math.round((R.end - Date.now()) / 1000);
  $("#restTime").textContent = fmtTime(Math.max(0, left));
  $("#restLbl").textContent = left > 0 ? `Repos · ${R.label}` : "C'est reparti !";
  if (left <= 0 && !$("#rest").classList.contains("end")) {
    $("#rest").classList.add("end");
    try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) {}
    beep();
    setTimeout(stopRest, 6000);
  }
}
function stopRest() { clearInterval(R.tmr); $("#rest").hidden = true; }
function beep() {
  if (!audioCtx) return;
  try {
    [0, 0.25].forEach(t => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.25, audioCtx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + 0.2);
      o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.22);
    });
  } catch (e) {}
}
$("#restMinus").onclick = () => { R.end -= 15000; tickRest(); };
$("#restPlus").onclick = () => { R.end += 15000; $("#rest").classList.remove("end"); tickRest(); };
$("#restStop").onclick = stopRest;

/* écran allumé pendant la séance */
let wakeLock = null;
async function keepAwake() {
  if (UI.view !== "seance" || document.hidden || wakeLock) return;
  try { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => wakeLock = null); } catch (e) {}
}
document.addEventListener("visibilitychange", keepAwake);

/* ---------- toast ---------- */
let toastTmr = null;
function toast(t) {
  let e = $(".toast"); if (!e) { e = el("div", {class: "toast", role: "status"}); document.body.append(e); }
  e.textContent = t; e.hidden = false; clearTimeout(toastTmr); toastTmr = setTimeout(() => e.hidden = true, 2200);
}

/* ---------- vue séance ---------- */
function viewSeance() {
  const v = $("#view"); v.textContent = "";
  if (!UI.jour) UI.jour = defaultJour(UI.date);
  const P = PROGRAMME[UI.jour];

  // sauvegarde ancienne ?
  const nb = Object.keys(S.seances).length, lastExp = S.meta.lastExport;
  if (nb >= 5 && (!lastExp || Date.now() - lastExp > 14 * 864e5)) {
    v.append(el("div", {class: "banner"}, "Pense à sauvegarder tes données (onglet Plus → Exporter). ",
      el("button", {class: "btn sm", onclick: () => show("plus")}, "Y aller")));
  }

  const dateIn = el("input", {type: "date", id: "date", value: UI.date, "aria-label": "Date de la séance"});
  dateIn.onchange = () => { if (!dateIn.value) return; UI.date = dateIn.value; UI.jour = defaultJour(UI.date); render(); };
  const days = el("div", {class: "days"});
  [1, 2, 3, 4, 5].forEach(j => {
    const b = el("button", {class: `day p${j}`, "aria-pressed": UI.jour === j, "aria-label": `${JOURS[j]} – ${PROGRAMME[j].titre}`},
      PROGRAMME[j].code, el("small", {text: JOURS[j].slice(0, 3)}));
    b.onclick = () => {
      const s = S.seances[UI.date];
      if (s && s.jour !== j && Object.values(s.items).some(i => setsOf(i).length)) {
        if (b.dataset.c !== "1") { b.dataset.c = "1"; toast("Une séance est déjà notée ce jour. Retape pour changer."); return; }
        delete S.seances[UI.date]; save();
      }
      UI.jour = j; render();
    };
    days.append(b);
  });
  v.append(el("div", {class: "row between"}, el("span", {class: "label", text: "Séance du"}), dateIn), days);

  // hero
  const total = P.ex.reduce((a, x) => a + x.s, 0);
  const done = P.ex.reduce((a, x) => { const it = getItem(UI.date, UI.jour, x, false); return a + (it ? it.sets.filter(s => s.ok).length : 0); }, 0);
  const hero = el("div", {class: `hero p${UI.jour}`},
    el("div", {style: "flex:1"},
      el("div", {class: "s", text: `${JOURS[UI.jour]} · séance ${P.code}`}),
      el("div", {class: "t", text: P.titre}),
      el("div", {class: "s", text: P.sous}),
      el("div", {class: "progress"}, el("i", {style: `width:${Math.round(done / total * 100)}%`}))),
    el("div", {class: "num", style: "font:700 1.4rem var(--font-display);text-align:right"}, `${done}/${total}`, el("div", {class: "s", style: "font:500 .75rem var(--font-body)", text: "séries"})));
  v.append(hero);

  P.ex.forEach((slot, i) => v.append(exCard(slot, i)));
  v.append(el("p", {class: "muted small", style: "text-align:center"}, "Tout s'enregistre au fur et à mesure sur ton téléphone."));
  keepAwake();
}

function exCard(slot, i) {
  const it = getItem(UI.date, UI.jour, slot, false);
  const exId = it ? it.ex : slot.id;
  const E = EX[exId];
  const unit = E.unit;
  const allOk = it && it.sets.length && it.sets.every(s => s.ok);
  const card = el("section", {class: "card ex" + (allOk ? " done" : ""), id: `ex-${slot.id}`});

  const tags = [];
  if (slot.kine) tags.push(el("span", {class: "chip warn", text: "Avis kiné"}));
  if (slot.ss) tags.push(el("span", {class: "chip info", text: `Superset ${slot.ss}`}));
  if (exId !== slot.id) tags.push(el("span", {class: "chip neutral", text: "Remplacé"}));
  card.append(el("div", {class: "ex-head"},
    E.img ? thumb(E, "thumb") : el("div", {class: "ex-num", text: i + 1}),
    el("div", {class: "ex-title"}, el("div", {class: "ex-name", text: E.n}), el("div", {class: "ex-machine", text: E.m}),
      tags.length ? el("div", {class: "row", style: "margin-top:4px"}, tags) : null),
    el("div", {class: "ex-target num"}, unit === "min" ? `${slot.r} min` : `${slot.s} × ${slot.r}${unit === "s" ? " s" : ""}`,
      slot.rest ? el("small", {text: `repos ${fmtTime(slot.rest)}`}) : null)));
  if (slot.note) card.append(el("div", {class: "ex-note", text: slot.note}));

  if (unit !== "min") {
    const last = lastFor(exId, UI.date);
    const lastRow = el("div", {class: "last"});
    if (last) {
      lastRow.append(el("span", {class: "num", text: `${fmtShort(last.date)} : ${setTxt(last.sets, unit)}`}));
      if (last.sets.length >= slot.s && last.sets.every(s => (num(s.reps) || 0) >= topOf(slot.r)))
        lastRow.append(el("span", {class: "chip up", text: unit === "s" ? "↑ Tiens plus longtemps" : "↑ Monte la charge"}));
      lastRow.append(el("button", {class: "btn sm ghost", text: "Reprendre", onclick: () => {
        const cur = getItem(UI.date, UI.jour, slot, true); cur.ex = exId;
        cur.sets = last.sets.map(s => ({kg: s.kg, reps: s.reps, ok: false}));
        while (cur.sets.length < slot.s) cur.sets.push({kg: "", reps: "", ok: false});
        save(); render();
      }}));
    } else lastRow.append(el("span", {text: "Première fois : note ta charge de départ."}));
    card.append(lastRow);
  }

  const sets = el("div", {class: "sets"});
  const rows = it ? it.sets : Array.from({length: slot.s}, () => ({kg: "", reps: "", ok: false}));
  const last = unit !== "min" ? lastFor(exId, UI.date) : null;
  rows.forEach((st, si) => {
    const ph = last && last.sets[si];
    const mk = (field, label, mode, placeholder) => {
      const inp = el("input", {type: "text", inputmode: mode, id: `${slot.id}-${si}-${field}`, value: st[field] ?? "", placeholder: placeholder ?? "", "aria-label": `${E.n}, série ${si + 1}, ${label}`, autocomplete: "off"});
      inp.oninput = () => { const cur = getItem(UI.date, UI.jour, slot, true); cur.ex = exId; cur.sets[si][field] = inp.value; save(); };
      return el("div", {class: "unit"}, inp, el("span", {text: label}));
    };
    const ok = el("button", {class: "ok", "aria-pressed": !!st.ok, "aria-label": `Valider la série ${si + 1}`, text: "✓"});
    ok.onclick = () => {
      const cur = getItem(UI.date, UI.jour, slot, true); cur.ex = exId;
      const s = cur.sets[si];
      if (!s.ok && num(s.reps) == null && ph && ph.reps) { s.reps = ph.reps; if (!num(s.kg) && ph.kg) s.kg = ph.kg; }
      s.ok = !s.ok; save();
      if (s.ok) {
        const lastSetOfSS = !slot.ss || !PROGRAMME[UI.jour].ex.some((x, k) => k > PROGRAMME[UI.jour].ex.indexOf(slot) && x.ss === slot.ss);
        if (lastSetOfSS) startRest(slot.rest, E.n);
      }
      render(true);
    };
    if (unit === "min") sets.append(el("div", {class: "set single"}, el("span", {class: "n", text: si + 1}), mk("reps", "min", "numeric", slot.r), ok));
    else sets.append(el("div", {class: "set"}, el("span", {class: "n", text: si + 1}),
      mk("kg", "kg", "decimal", ph && num(ph.kg) ? fmtNum(num(ph.kg)) : ""), el("span", {class: "x", text: "×"}),
      mk("reps", unit === "s" ? "sec" : "reps", "numeric", ph && ph.reps ? ph.reps : ""), ok));
  });
  card.append(sets);

  const foot = el("div", {class: "ex-foot"});
  const left = el("div", {class: "row"});
  if (unit !== "min") left.append(el("button", {class: "btn sm ghost", text: "+ série", onclick: () => {
    const cur = getItem(UI.date, UI.jour, slot, true); cur.ex = exId; cur.sets.push({kg: "", reps: "", ok: false}); save(); render(true);
  }}));
  if (slot.alts && slot.alts.length) {
    const sel = el("select", {id: `alt-${slot.id}`, "aria-label": "Changer de machine"});
    [slot.id, ...slot.alts].forEach(a => sel.append(el("option", {value: a, selected: a === exId, text: a === slot.id ? `Prévu : ${EX[a].n}` : `↔ ${EX[a].n}`})));
    sel.onchange = () => { const cur = getItem(UI.date, UI.jour, slot, true); cur.ex = sel.value; save(); render(true); };
    left.append(sel);
  }
  foot.append(left, el("a", {class: "link", href: PHOTO(E.q), target: "_blank", rel: "noopener", text: "Photo ↗"}));
  card.append(foot);
  return card;
}

/* ---------- photos des machines ---------- */
function thumb(E, cls) {
  const b = el("button", {class: cls, "aria-label": `Voir la photo : ${E.m}`});
  const img = el("img", {src: E.img, alt: E.m, loading: "lazy", referrerpolicy: "no-referrer-when-downgrade"});
  img.onerror = () => { b.classList.add("noimg"); img.remove(); b.textContent = "📷"; };
  b.append(img);
  b.onclick = () => openPhoto(E);
  return b;
}
function openPhoto(E) {
  const box = el("div", {class: "lightbox", role: "dialog", "aria-label": E.m},
    el("div", {class: "lb-in"},
      el("img", {src: E.img.replace(/([?&])(sw|w)=\d+/, "$1$2=1200"), alt: E.m}),
      el("div", {class: "lb-cap"}, el("b", {text: E.n}), el("span", {class: "muted", text: E.m})),
      el("div", {class: "row between"},
        el("a", {class: "link", href: PHOTO(E.q), target: "_blank", rel: "noopener", text: "Autres photos ↗"}),
        el("button", {class: "btn sm", text: "Fermer"}))));
  box.onclick = e => { if (e.target === box || e.target.tagName === "BUTTON") box.remove(); };
  document.body.append(box);
}

/* ---------- vue programme ---------- */
function viewProgramme() {
  const v = $("#view"); v.textContent = "";
  v.append(el("div", {class: "card"},
    el("h2", {text: "Les règles"}),
    el("ul", {class: "rules"},
      el("li", {}, el("b", {text: "Intensité : "}), "arrête-toi à 1-2 reps de l'échec sur les gros exos ; échec possible sur la dernière série d'isolation."),
      el("li", {}, el("b", {text: "Progression : "}), "quand tu fais le haut de la fourchette sur toutes les séries, monte la charge (+2,5 kg haltères/machines, +5 kg barre/presse). L'appli te le signale."),
      el("li", {}, el("b", {text: "Genou : "}), "douleur max 3/10 pendant et le lendemain. Au-dessus, réduis l'amplitude ou remplace. Pas de fentes pour l'instant."),
      el("li", {}, el("b", {text: "Épaule : "}), "raideur à l'arrière au développé couché → prise un peu plus serrée, pause sur la poitrine, ou version machine."),
      el("li", {}, el("b", {text: "Décharge : "}), "toutes les 6-8 semaines, une semaine à la moitié des séries."),
      el("li", {}, el("b", {text: "Supersets : "}), "le vendredi, enchaîne les 2 exos du même numéro, puis repos.")
    )));
  [1, 2, 3, 4, 5].forEach(j => {
    const P = PROGRAMME[j];
    const c = el("div", {class: "card prog-day", style: `border-left-color:var(--p${j})`},
      el("div", {class: "row between"}, el("h2", {text: `${JOURS[j]} · ${P.titre}`}), el("span", {class: `chip p${j}`, text: P.code})),
      el("div", {class: "muted small", text: P.sous}));
    P.ex.forEach(x => {
      const E = EX[x.id];
      c.append(el("div", {class: "prog-ex"},
        el("span", {class: "row", style: "flex-wrap:nowrap;gap:10px"}, E.img ? thumb(E, "thumb sm") : el("span", {class: "thumb sm noimg"}), el("span", {}, E.n), x.kine ? el("span", {class: "chip warn", style: "margin-left:6px", text: "kiné"}) : null, x.ss ? el("span", {class: "chip info", style: "margin-left:6px", text: `SS${x.ss}`}) : null),
        el("span", {class: "num muted", text: E.unit === "min" ? `${x.r} min` : `${x.s} × ${x.r}${E.unit === "s" ? " s" : ""}`}),
        x.alts ? el("span", {class: "alt", text: "ou " + x.alts.map(a => EX[a].n).join(", ")}) : null));
    });
    const btn = el("button", {class: "btn sm", text: "Faire cette séance aujourd'hui", onclick: () => { UI.date = todayISO(); UI.jour = j; show("seance"); }});
    c.append(btn);
    v.append(c);
  });
}

/* ---------- graphe ---------- */
function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw || 1))); const f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
function chart(points, unit) {
  if (!points.length) return null;
  const W = 600, H = 240, L = 44, Rr = 16, T = 22, B = 30;
  let x0 = Math.min(...points.map(p => p.t)), x1 = Math.max(...points.map(p => p.t));
  if (x0 === x1) { x0 -= 3 * 864e5; x1 += 3 * 864e5; }
  let y0 = Math.min(...points.map(p => p.y)), y1 = Math.max(...points.map(p => p.y));
  const span = Math.max(y1 - y0, 2); y0 -= span * .15; y1 += span * .15; if (y0 < 0) y0 = 0;
  const st = niceStep((y1 - y0) / 4); y0 = Math.floor(y0 / st) * st; y1 = Math.ceil(y1 / st) * st;
  const sx = t => L + (t - x0) / (x1 - x0) * (W - L - Rr), sy = v => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B);
  let g = "";
  for (let y = y0; y <= y1 + 1e-9; y += st) g += `<line x1="${L}" x2="${W - Rr}" y1="${sy(y)}" y2="${sy(y)}" stroke="var(--line)"/><text x="${L - 8}" y="${sy(y) + 4}" text-anchor="end" font-size="12" fill="var(--muted)">${fmtNum(y)}</text>`;
  const idx = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  idx.forEach((i, k) => { const p = points[i]; const a = points.length === 1 ? "middle" : k === 0 ? "start" : i === points.length - 1 ? "end" : "middle";
    g += `<text x="${sx(p.t)}" y="${H - 8}" text-anchor="${a}" font-size="12" fill="var(--muted)">${fmtShort(p.d)}</text>`; });
  const path = points.map((p, i) => `${i ? "L" : "M"}${sx(p.t).toFixed(1)},${sy(p.y).toFixed(1)}`).join("");
  const area = points.length > 1 ? `<path d="${path}L${sx(points.at(-1).t)},${sy(y0)}L${sx(points[0].t)},${sy(y0)}Z" fill="var(--accent)" opacity=".12"/>` : "";
  const dots = points.map((p, i) => `<circle cx="${sx(p.t)}" cy="${sy(p.y)}" r="${i === points.length - 1 ? 5 : 3}" fill="${i === points.length - 1 ? "var(--accent)" : "var(--surface)"}" stroke="var(--accent)" stroke-width="2"/>`).join("");
  const lp = points.at(-1);
  const lbl = `<text x="${Math.min(Math.max(sx(lp.t), L + 60), W - Rr)}" y="${Math.max(sy(lp.y) - 10, 14)}" text-anchor="end" font-size="15" font-weight="700" fill="var(--fg)">${fmtNum(lp.y)} ${unit}</text>`;
  const d = el("div", {class: "chart"});
  d.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution" font-family="Barlow, system-ui, sans-serif">${g}${area}<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>${dots}${lbl}</svg>`;
  return d;
}

/* ---------- vue progrès ---------- */
function historyOf(exId) {
  return Object.keys(S.seances).sort().map(d => {
    const it = Object.values(S.seances[d].items || {}).find(i => i.ex === exId);
    const sets = setsOf(it); return sets.length ? {d, sets} : null;
  }).filter(Boolean);
}
function viewProgres() {
  const v = $("#view"); v.textContent = "";
  const withData = Object.keys(EX).filter(id => EX[id].unit !== "min" && historyOf(id).length);
  if (!withData.length) { v.append(el("div", {class: "empty"}, "Pas encore de données. Note tes séries dans l'onglet Séance et tes courbes apparaîtront ici.")); return; }
  if (!UI.exSel || !withData.includes(UI.exSel)) UI.exSel = withData[0];
  const sel = el("select", {id: "exSelect", "aria-label": "Exercice"});
  withData.forEach(id => sel.append(el("option", {value: id, selected: id === UI.exSel, text: EX[id].n + " — " + EX[id].m})));
  sel.onchange = () => { UI.exSel = sel.value; render(); };
  v.append(el("div", {class: "card"}, el("span", {class: "label", text: "Exercice"}), sel));

  const E = EX[UI.exSel], hist = historyOf(UI.exSel);
  const isTime = E.unit === "s";
  const bodyweight = hist.every(h => h.sets.every(s => !num(s.kg)));
  const metrics = isTime || bodyweight ? [["reps", isTime ? "Durée max" : "Reps max"]] : [["kg", "Charge max"], ["1rm", "Force (1RM estimé)"], ["vol", "Volume"]];
  if (!metrics.some(m => m[0] === UI.metric)) UI.metric = metrics[0][0];
  const pts = hist.map(h => {
    let y;
    if (UI.metric === "kg") y = Math.max(...h.sets.map(s => num(s.kg) || 0));
    else if (UI.metric === "1rm") y = Math.max(...h.sets.map(s => (num(s.kg) || 0) * (1 + (num(s.reps) || 0) / 30)));
    else if (UI.metric === "vol") y = h.sets.reduce((a, s) => a + (num(s.kg) || 0) * (num(s.reps) || 0), 0);
    else y = Math.max(...h.sets.map(s => num(s.reps) || 0));
    return {d: h.d, t: parseISO(h.d).getTime(), y: Math.round(y * 10) / 10};
  });
  const unit = UI.metric === "reps" ? (isTime ? "s" : "reps") : "kg";
  const seg = el("div", {class: "seg"});
  metrics.forEach(([k, l]) => seg.append(el("button", {"aria-pressed": UI.metric === k, text: l, onclick: () => { UI.metric = k; render(); }})));
  const card = el("div", {class: "card"}, seg);
  if (pts.length >= 2) {
    const dlt = pts.at(-1).y - pts[0].y;
    card.append(el("span", {class: `chip ${dlt > 0 ? "up" : "neutral"}`, style: "align-self:flex-start", text: `${dlt > 0 ? "+" : ""}${fmtNum(dlt)} ${unit} depuis le ${fmtShort(pts[0].d)}`}));
  }
  card.append(chart(pts, unit));
  if (UI.metric === "1rm") card.append(el("div", {class: "muted small", text: "Le 1RM estimé combine charge et reps : il monte même si tu fais plus de reps à la même charge."}));
  v.append(card);

  const list = el("div", {class: "card list"}, el("h3", {text: "Historique"}));
  hist.slice().reverse().slice(0, 12).forEach(h => list.append(el("div", {class: "item"},
    el("span", {text: fmtDate(h.d)}), el("span", {class: "num", style: "text-align:right", text: setTxt(h.sets, E.unit)}))));
  v.append(list);
}

/* ---------- vue poids ---------- */
function viewPoids() {
  const v = $("#view"); v.textContent = "";
  const dIn = el("input", {type: "date", id: "wDate", value: todayISO(), style: "flex:1 1 140px"});
  const kIn = el("input", {type: "text", inputmode: "decimal", id: "wKg", placeholder: "kg", style: "flex:1 1 90px"});
  const add = el("button", {class: "btn primary", text: "Ajouter", onclick: () => {
    const kg = num(kIn.value);
    if (!dIn.value || kg == null || kg < 30 || kg > 250) { kIn.focus(); toast("Entre un poids valide"); return; }
    S.poids[dIn.value] = kg; save(true); toast("Pesée enregistrée"); render();
  }});
  v.append(el("div", {class: "card"}, el("h2", {text: "Pesée du matin"}), el("div", {class: "row"}, dIn, kIn, add),
    el("div", {class: "muted small", text: "Au réveil, à jeun, 3 fois par semaine. On regarde la moyenne, pas le chiffre du jour."})));

  const arr = Object.entries(S.poids).map(([d, kg]) => ({d, kg})).sort((a, b) => a.d < b.d ? -1 : 1);
  if (!arr.length) { v.append(el("div", {class: "empty", text: "Aucune pesée pour l'instant."})); return; }
  const last = arr.at(-1), lt = parseISO(last.d).getTime(), D = 864e5;
  const avg = (a, b) => { const x = arr.filter(w => { const t = parseISO(w.d).getTime(); return t > a && t <= b; }).map(w => w.kg); return x.length ? x.reduce((p, c) => p + c, 0) / x.length : null; };
  const a7 = avg(lt - 7 * D, lt), aPrev = avg(lt - 35 * D, lt - 28 * D);
  const rate = a7 != null && aPrev != null ? (a7 - aPrev) / 4 : null;
  const lo = last.kg * .0025, hi = last.kg * .005;
  const stat = (l, val, chip, cls) => el("div", {class: "stat"}, el("span", {class: "label", text: l}), el("span", {class: "v num", text: val}), chip ? el("span", {class: `chip ${cls || "neutral"}`, style: "align-self:flex-start", text: chip}) : null);
  v.append(el("div", {class: "stats"},
    stat("Dernière", `${fmtNum(last.kg)} kg`, fmtShort(last.d)),
    stat("Moy. 7 j", a7 != null ? `${fmtNum(a7)} kg` : "–"),
    rate != null ? stat("Rythme /sem", `${rate >= 0 ? "+" : ""}${fmtNum(rate)}`, rate < lo ? "trop lent" : rate > hi ? "trop rapide" : "dans la cible", rate >= lo && rate <= hi ? "up" : "warn")
      : stat("Rythme /sem", "–", "5 sem. de pesées")));
  v.append(el("div", {class: "card"}, el("h3", {text: "Courbe"}), chart(arr.map(w => ({d: w.d, t: parseISO(w.d).getTime(), y: w.kg})), "kg"),
    el("div", {class: "muted small", text: `Cible prise de masse sèche : +${fmtNum(lo)} à +${fmtNum(hi)} kg par semaine (0,25-0,5 % du poids). Moyenne qui stagne 2 semaines → +150-200 kcal/jour.`})));
  const list = el("div", {class: "card list"}, el("h3", {text: "Pesées"}));
  arr.slice().reverse().slice(0, 20).forEach(w => {
    const del = el("button", {class: "btn sm ghost danger", text: "Suppr."});
    del.onclick = () => { if (del.dataset.c !== "1") { del.dataset.c = "1"; del.textContent = "Confirmer"; return; } delete S.poids[w.d]; save(true); render(); };
    list.append(el("div", {class: "item"}, el("span", {class: "grow", text: fmtDate(w.d)}), el("b", {class: "num", text: `${fmtNum(w.kg)} kg`}), del));
  });
  v.append(list);
}

/* ---------- vue plus ---------- */
let installEvt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; if (UI.view === "plus") render(); });
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], {type}));
  const a = el("a", {href: url, download: name}); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function toCSV() {
  const rows = [["date", "seance", "exercice", "machine", "serie", "kg", "reps"]];
  Object.keys(S.seances).sort().forEach(d => {
    const s = S.seances[d];
    Object.values(s.items).forEach(it => setsOf(it).forEach((st, i) => rows.push([d, PROGRAMME[s.jour]?.code || "", EX[it.ex]?.n || it.ex, EX[it.ex]?.m || "", i + 1, num(st.kg) ?? "", num(st.reps) ?? ""])));
  });
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
}
async function viewPlus() {
  const v = $("#view"); v.textContent = "";
  const standalone = matchMedia("(display-mode: standalone)").matches;
  const inst = el("div", {class: "card"}, el("h2", {text: "Installer l'appli"}));
  if (standalone) inst.append(el("div", {class: "chip up", style: "align-self:flex-start", text: "Installée ✓"}));
  else if (installEvt) inst.append(el("button", {class: "btn primary", text: "Installer sur mon téléphone", onclick: async () => { installEvt.prompt(); await installEvt.userChoice; installEvt = null; render(); }}));
  else inst.append(el("div", {class: "small", text: "Dans Chrome : menu ⋮ → « Ajouter à l'écran d'accueil » → « Installer »."}));
  v.append(inst);

  const nbS = Object.keys(S.seances).length, nbP = Object.keys(S.poids).length;
  const lastExp = S.meta.lastExport ? new Date(S.meta.lastExport).toLocaleDateString("fr-FR") : "jamais";
  let persisted = null; try { persisted = navigator.storage && await navigator.storage.persisted(); } catch (e) {}
  const imp = el("button", {class: "btn", text: "Importer une sauvegarde", onclick: () => $("#importFile").click()});
  v.append(el("div", {class: "card"},
    el("h2", {text: "Mes données"}),
    el("div", {class: "small"}, `${nbS} séance${nbS > 1 ? "s" : ""}, ${nbP} pesée${nbP > 1 ? "s" : ""}. Dernière sauvegarde : ${lastExp}.`),
    el("div", {class: "muted small", text: "Tes données restent sur ce téléphone. Si tu vides les données de Chrome ou changes de téléphone, elles sont perdues : exporte une sauvegarde de temps en temps (Google Drive, WhatsApp à toi-même…)."}),
    el("div", {class: "row"},
      el("button", {class: "btn primary", text: "Exporter la sauvegarde", onclick: () => {
        S.meta.lastExport = Date.now(); save(true);
        download(`carnet-muscu-${todayISO()}.json`, JSON.stringify(S, null, 1), "application/json"); render();
      }}),
      imp,
      el("button", {class: "btn ghost", text: "Exporter en tableur (CSV)", onclick: () => download(`carnet-muscu-${todayISO()}.csv`, "﻿" + toCSV(), "text/csv")})),
    persisted === false ? el("button", {class: "btn sm ghost", style: "align-self:flex-start", text: "Protéger mes données contre le nettoyage auto", onclick: async () => {
      try { const ok = await navigator.storage.persist(); toast(ok ? "Données protégées" : "Refusé par le navigateur (installe l'appli d'abord)"); } catch (e) {} render(); }}) :
      persisted ? el("span", {class: "chip up", style: "align-self:flex-start", text: "Stockage protégé ✓"}) : null));

  v.append(el("div", {class: "card"}, el("h2", {text: "À propos"}),
    el("div", {class: "small muted", text: `Carnet Muscu v${APP_VERSION}. Fonctionne hors connexion une fois ouvert une première fois.`})));
}
$("#importFile").onchange = async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try {
    const o = JSON.parse(await f.text());
    if (!o || typeof o.seances !== "object") throw new Error("format");
    Object.assign(S.seances, o.seances); Object.assign(S.poids, o.poids || {});
    save(true); toast("Sauvegarde importée"); render();
  } catch (err) { toast("Fichier invalide : choisis un export .json du Carnet Muscu"); }
};

/* ---------- navigation ---------- */
const VIEWS = {seance: viewSeance, programme: viewProgramme, progres: viewProgres, poids: viewPoids, plus: viewPlus};
function render(keepScroll) {
  const y = window.scrollY;
  VIEWS[UI.view]();
  document.querySelectorAll("nav.tabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.v === UI.view));
  if (keepScroll) window.scrollTo(0, y);
}
function show(v) { UI.view = v; if (v === "seance" && !UI.jour) UI.jour = defaultJour(UI.date); render(); window.scrollTo(0, 0); }
document.querySelectorAll("nav.tabs button").forEach(b => b.onclick = () => show(b.dataset.v));
$("#today").textContent = new Date().toLocaleDateString("fr-FR", {weekday: "long", day: "numeric", month: "long"});
render();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
