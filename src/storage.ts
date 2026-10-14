import { defaultSettings } from "./types";
export function restore<T>(key: string, value: unknown, fallback: T): T {
  if (key === "settings") {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return fallback;
    const source = value as Record<string, unknown>,
      next = { ...defaultSettings };
    for (const name of Object.keys(next) as (keyof typeof next)[]) {
      if (typeof source[name] === typeof next[name])
        Object.assign(next, { [name]: source[name] });
    }
    next.chatSize = Math.min(
      22,
      Math.max(13, Number.isFinite(next.chatSize) ? next.chatSize : 14),
    );
    next.quality =
      Number.isInteger(next.quality) && next.quality >= -1 && next.quality < 30
        ? next.quality
        : -1;
    next.clientId = next.clientId.slice(0, 80);
    next.language = /^[A-Z]{2}$/.test(next.language) ? next.language : "";
    return next as T;
  }
  if (Array.isArray(fallback)) {
    if (!Array.isArray(value)) return fallback;
    const channel = (v: unknown) =>
      !!v &&
      typeof v === "object" &&
      "id" in v &&
      typeof v.id === "string" &&
      "login" in v &&
      typeof v.login === "string" &&
      /^[a-zA-Z0-9_]{1,25}$/.test(v.login) &&
      "displayName" in v &&
      typeof v.displayName === "string";
    return value
      .filter((v) =>
        key === "interests"
          ? typeof v === "string"
          : key === "follows"
            ? channel(v)
            : key === "notices"
              ? v &&
                typeof v.id === "string" &&
                typeof v.login === "string" &&
                typeof v.time === "number"
              : v &&
                typeof v.id === "string" &&
                typeof v.title === "string" &&
                ["live", "video", "clip"].includes(v.kind) &&
                channel(v.channel),
      )
      .slice(0, key === "follows" ? 200 : 100) as T;
  }
  return typeof value === typeof fallback ? (value as T) : fallback;
}
