const S = sessionStorage, g = (k) => { try { return S.getItem(k); } catch { return null; } }, s = (k, v) => { try { S.setItem(k, v); } catch {} };
export const getCat = () => g("ia:cat") || "all";
export const setCat = (c) => s("ia:cat", c);
export const saveScroll = () => s("ia:y", String(scrollY));
export const takeScroll = () => { const y = Number(g("ia:y")); s("ia:y", ""); return y || 0; };
