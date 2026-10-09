import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { siteConfig as C } from "../src/data/config.js";
import { products } from "../src/data/products.js";
const R = join(dirname(fileURLToPath(import.meta.url)), ".."), S = join(R, "src"), D = join(R, "dist");
const errs = [], esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const slugify = (n) => n.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const money = (p) => `${C.currency} ${p.toLocaleString("en-US")}`;
function dims(f) { const b = readFileSync(f); let i = 2; while (i < b.length) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1]; if (m >= 0xc0 && m <= 0xc2) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) }; i += 2 + b.readUInt16BE(i + 2); } throw new Error("no JPEG size: " + f); }
// ---- validate
const cats = new Set(C.categories.map((c) => c.id)), ids = new Set(), slugs = new Set();
if (!/^\d{11,15}$/.test(C.whatsappNumber)) errs.push("Invalid whatsappNumber");
for (const p of products) {
  const t = `Product "${p.name || p.id}"`;
  if (!p.id || ids.has(p.id)) errs.push(`${t}: missing/duplicate id`); ids.add(p.id);
  if (!p.name) errs.push(`${t}: missing name`);
  p.slug = slugify(p.name || ""); if (!p.slug || slugs.has(p.slug)) errs.push(`${t}: bad/duplicate slug`); slugs.add(p.slug);
  if (!cats.has(p.category)) errs.push(`${t}: unknown category ${p.category}`);
  if (!Number.isInteger(p.price) || p.price <= 0) errs.push(`${t}: invalid price`);
  if (!p.alt) errs.push(`${t}: missing alt`);
  if (!Array.isArray(p.images) || p.images.length < 1 || p.images.length > 20) errs.push(`${t}: needs 1-20 images`);
  p.images = p.images || [];
  p.dims = p.images.map((im) => { const f = join(S, "assets/products", im); if (!existsSync(f)) { errs.push(`${t}: missing image ${im}`); return { w: 1, h: 1 }; } return dims(f); });
  for (const v of p.variants || []) { if (!v || typeof v.name !== "string" || !v.name) errs.push(`${t}: malformed variant`); else if (v.price !== undefined && (!Number.isInteger(v.price) || v.price <= 0)) errs.push(`${t}: invalid variant price`); }
}
if (errs.length) { console.error("BUILD FAILED:\n- " + errs.join("\n- ")); process.exit(1); }
// ---- helpers
const fill = (t, m) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!(k in m)) throw new Error("unknown token " + k); return m[k]; });
const url = (p) => C.siteUrl.replace(/\/$/, "") + p;
const WAG = `https://wa.me/${C.whatsappNumber}?text=${encodeURIComponent("Hi, I'd like to ask about your jewellery and accessories on the I&A Jewels catalogue.")}`;
const ld = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;
const head = ({ title, desc, path, image, extra = "" }) => `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url(path))}"><link rel="icon" type="image/png" href="/assets/brand/favicon.png"><link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png"><meta name="theme-color" content="#fcf6f3"><meta property="og:type" content="website"><meta property="og:site_name" content="${esc(C.brandName)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url(path))}"><meta property="og:image" content="${esc(url(image))}"><meta name="twitter:card" content="summary_large_image">${extra}`;
const img = (p, i, o = {}) => { const { w, h } = p.dims[i]; return `<img src="/assets/products/${p.images[i]}" width="${w}" height="${h}" alt="${esc(p.alt)}"${o.style ? ` style="${o.style}"` : ""}${o.eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`; };
const card = (p, n = 99) => { const { w, h } = p.dims[0], tall = w / h < 0.75, st = tall ? `aspect-ratio:3/4;object-position:50% ${p.focus ?? 50}%` : `aspect-ratio:${w}/${h}`; return `<a class="card" href="/products/${p.slug}/" data-category="${p.category}">${img(p, 0, { style: st, eager: n < 4 })}<div class="m"><h2>${esc(p.name)}</h2><p class="p">${money(p.price)}${p.priceNote ? ` <small>${esc(p.priceNote)}</small>` : ""}${p.variants?.length ? " · options" : ""}</p></div></a>`; };
// ---- output
rmSync(D, { recursive: true, force: true }); mkdirSync(D, { recursive: true });
for (const d of ["css", "js", "data", "assets"]) cpSync(join(S, d), join(D, d), { recursive: true });
const w = (p, s) => { mkdirSync(dirname(join(D, p)), { recursive: true }); writeFileSync(join(D, p), s); };
const rd = (f) => readFileSync(join(S, f), "utf8");
const org = ld({ "@context": "https://schema.org", "@type": "Organization", name: C.brandName, url: url("/"), logo: url("/assets/brand/logo.png") });
w("index.html", fill(rd("index.html"), { HEAD: head({ title: `${C.brandName} — ${C.tagline}`, desc: "Cute, classy everyday jewellery and accessories. Browse the catalogue and enquire on WhatsApp.", path: "/", image: "/assets/brand/og.jpg", extra: org }), TAGLINE: esc(C.tagline), WA: WAG }));
const used = C.categories.filter((c) => products.some((p) => p.category === c.id));
const tabs = [{ id: "all", name: "All" }, ...used].map((c) => `<li><a href="/catalogue/${c.id === "all" ? "" : "?c=" + c.id}" data-cat="${c.id}"${c.id === "all" ? ' aria-current="true"' : ""}>${esc(c.name)}</a></li>`).join("");
w("catalogue/index.html", fill(rd("catalogue/index.html"), { HEAD: head({ title: `Catalogue | ${C.brandName}`, desc: "Browse I&A Jewels necklaces, rings, hair accessories and waist chains. Prices in KSh; enquire on WhatsApp.", path: "/catalogue/", image: "/assets/brand/og.jpg" }), TABS: tabs, COUNT: String(products.length), CARDS: products.map(card).join(""), WA: WAG }));
const tpl = rd("templates/product.html"), msg = (p, v) => `Hi, I'm interested in the ${p.name}${v ? " — " + v.name : ""}. Is it available?`;
for (const p of products) {
  const cn = C.categories.find((c) => c.id === p.category).name, same = products.filter((q) => q.category === p.category && q !== p), rel = [...same, ...products.filter((q) => q.category !== p.category && q !== p)].slice(0, 4);
  const vars = p.variants?.length ? `<fieldset><legend>Choose an option</legend>${p.variants.map((v, i) => `<label><input type="radio" name="variant" value="${esc(v.name)}" data-price="${v.price ?? p.price}"${i ? "" : " checked"}> ${esc(v.name)}${v.price ? " · " + money(v.price) : ""}</label>`).join("")}</fieldset>` : "";
  const gal = p.images.length > 1 ? `<section class="more"><h2>More images</h2><div class="rel">${p.images.slice(1).map((_, i) => `<div class="card">${img(p, i + 1)}</div>`).join("")}</div></section>` : "";
  const m0 = msg(p, p.variants?.[0]), pd = ld({ "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description, image: p.images.map((i) => url("/assets/products/" + i)), category: cn, brand: { "@type": "Brand", name: C.brandName }, offers: { "@type": "Offer", priceCurrency: "KES", price: String(p.price), url: url(`/products/${p.slug}/`) } });
  w(`products/${p.slug}/index.html`, fill(tpl, { HEAD: head({ title: `${p.name} — ${money(p.price)} | ${C.brandName}`, desc: p.description, path: `/products/${p.slug}/`, image: "/assets/products/" + p.images[0], extra: pd }), HERO: img(p, 0, { eager: true }), NAME: esc(p.name), PRICE: money(p.price) + (p.priceNote ? ` <small>${esc(p.priceNote)}</small>` : ""), DESC: esc(p.description || ""), VARIANTS: vars, MSG: esc(m0), WA: `https://wa.me/${C.whatsappNumber}?text=${encodeURIComponent(m0)}`, GALLERY: gal, RELTITLE: same.length ? "You may also like" : "More to explore", CARDS: rel.map((q) => card(q)).join("") }));
}
const urls = ["/", "/catalogue/", ...products.map((p) => `/products/${p.slug}/`)];
w("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${esc(url(u))}</loc></url>`).join("\n")}\n</urlset>\n`);
w("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${url("/sitemap.xml")}\n`);
// ---- post-build checks: tokens, local links/assets
let bad = 0; const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
for (const f of walk(D).filter((f) => f.endsWith(".html"))) { const h = readFileSync(f, "utf8"); if (/\{\{\w+\}\}/.test(h)) { console.error("Unresolved token in", f); bad++; } for (const m of h.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) { const t = join(D, m[1]); if (!existsSync(m[1].endsWith("/") ? join(t, "index.html") : t)) { console.error("Broken link", m[1], "in", f); bad++; } } }
if (bad) process.exit(1);
if (C.siteUrlIsPlaceholder) console.warn("WARNING: siteUrl is a placeholder; canonical URLs and sitemap need the real domain.");
console.log(`Built ${products.length} products, ${urls.length} URLs. Checks passed.`);
