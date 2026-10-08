import { getCat, setCat, saveScroll, takeScroll } from "./navigation.js";
const tabs = [...document.querySelectorAll("[data-cat]")], cards = [...document.querySelectorAll(".card")], count = document.getElementById("count");
function show(cat, push) {
  if (!tabs.some((t) => t.dataset.cat === cat)) cat = "all";
  let n = 0;
  cards.forEach((c) => { const on = cat === "all" || c.dataset.category === cat; c.hidden = !on; n += on; });
  tabs.forEach((t) => { const on = t.dataset.cat === cat; on ? t.setAttribute("aria-current", "true") : t.removeAttribute("aria-current"); });
  count.textContent = `${n} ${n === 1 ? "item" : "items"}`;
  setCat(cat);
  if (push) history.replaceState(null, "", cat === "all" ? "/catalogue/" : `/catalogue/?c=${cat}`);
}
tabs.forEach((t) => t.addEventListener("click", (e) => { e.preventDefault(); show(t.dataset.cat, true); t.scrollIntoView({ inline: "center", block: "nearest" }); }));
cards.forEach((c) => c.addEventListener("click", saveScroll));
show(new URLSearchParams(location.search).get("c") || getCat(), true);
const y = takeScroll(); if (y) requestAnimationFrame(() => scrollTo(0, y));
