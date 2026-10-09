import { siteConfig as C } from "../data/config.js";
export function buildMessage({ name, variant, price, url }) {
  const v = variant ? ` — ${variant}` : "";
  const p = variant && price ? ` (${C.currency} ${price})` : "";
  return `Hi, I'm interested in the ${name}${v}${p}. Is it available?${url ? "\n" + url : ""}`;
}
export const waLink = (msg) => `https://wa.me/${C.whatsappNumber}?text=${encodeURIComponent(msg)}`;
