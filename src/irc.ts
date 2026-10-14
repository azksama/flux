export interface ChatMessage {
  id: string;
  userId: string;
  name: string;
  color: string;
  text: string;
  emotes: { id: string; start: number; end: number }[];
  badges: string[];
  system?: boolean;
}
export interface IrcLine {
  command: string;
  tags: Record<string, string>;
  params: string[];
  trailing: string;
}
export function parseIrc(raw: string): IrcLine | null {
  let s = raw.trimEnd(),
    tags: Record<string, string> = {};
  if (s.startsWith("@")) {
    const n = s.indexOf(" ");
    if (n < 0) return null;
    tags = Object.fromEntries(
      s
        .slice(1, n)
        .split(";")
        .map((t) => {
          const i = t.indexOf("=");
          return [
            i < 0 ? t : t.slice(0, i),
            (i < 0 ? "" : t.slice(i + 1)).replace(
              /\\([snr:\\])/g,
              (_, c: string) =>
                ({ s: " ", n: "\n", r: "\r", ":": ";", "\\": "\\" })[c] ?? c,
            ),
          ];
        }),
    );
    s = s.slice(n + 1);
  }
  if (s.startsWith(":")) {
    const n = s.indexOf(" ");
    if (n < 0) return null;
    s = s.slice(n + 1);
  }
  const trailingAt = s.indexOf(" :");
  const trailing = trailingAt >= 0 ? s.slice(trailingAt + 2) : "";
  const parts = (trailingAt >= 0 ? s.slice(0, trailingAt) : s).split(" ");
  const command = parts.shift();
  if (!command) return null;
  return { command, tags, params: parts, trailing };
}
export function messageFromIrc(line: IrcLine): ChatMessage {
  const emotes: ChatMessage["emotes"] = [];
  for (const group of (line.tags.emotes || "").split("/")) {
    const [id, ranges] = group.split(":");
    if (!ranges) continue;
    for (const range of ranges.split(",")) {
      const [start, end] = range.split("-").map(Number);
      if (Number.isInteger(start) && Number.isInteger(end) && end >= start)
        emotes.push({ id, start, end });
    }
  }
  return {
    id: line.tags.id || crypto.randomUUID(),
    userId: line.tags["user-id"] || "",
    name: line.tags["display-name"] || "Twitch",
    color: /^#[0-9a-fA-F]{6}$/.test(line.tags.color || "")
      ? line.tags.color
      : "#B2F5D4",
    text: line.trailing,
    emotes: emotes.sort((a, b) => a.start - b.start),
    badges: (line.tags.badges || "").split(",").filter(Boolean),
  };
}
