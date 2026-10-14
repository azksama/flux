import { invoke, isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
export const native = isTauri();
export interface ServiceError {
  code: string;
  message: string;
}
export function errorText(e: unknown): string {
  return typeof e === "object" && e && "message" in e
    ? String(e.message)
    : typeof e === "string"
      ? e
      : "Une erreur est survenue.";
}
export async function command<T>(
  name: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!native)
    throw {
      code: "native_required",
      message: "Ouvrez l’application FLUX pour accéder à Twitch.",
    };
  return invoke<T>(name, args);
}
export function browse<T>(
  kind: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  return command("browse", { kind, variables: { first: 24, ...variables } });
}
export function account<T>(
  type: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  return command("account", { action: { type, ...args } });
}
export async function external(url: string) {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    ![
      "www.twitch.tv",
      "dashboard.twitch.tv",
      "dev.twitch.tv",
      "help.twitch.tv",
      "github.com",
      "clips.twitch.tv",
    ].includes(parsed.hostname)
  )
    throw new Error("Lien non autorisé.");
  if (native) await openUrl(url);
  else window.open(url, "_blank", "noopener,noreferrer");
}
export const thumbnail = (url: string | undefined, w = 640, h = 360) =>
  url?.replace("{width}", String(w)).replace("{height}", String(h)) ?? "";
export const number = (n = 0) =>
  new Intl.NumberFormat("fr", {
    notation: n > 9999 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);
export function duration(n: number) {
  return `${Math.floor(n / 3600) ? `${Math.floor(n / 3600)}:` : ""}${String(Math.floor(n / 60) % 60).padStart(2, "0")}:${String(Math.floor(n) % 60).padStart(2, "0")}`;
}
