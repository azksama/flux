import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Smile, ChevronDown, ShieldCheck } from "lucide-react";
import { parseIrc, messageFromIrc, type ChatMessage } from "./irc";
import { account, errorText } from "./api";
import { useApp } from "./state";
import type { Channel } from "./types";
import { readableChatColor } from "./chat-color";
type Emote = { name: string; url: string };
function MessageBody({
  message,
  emotes,
  enabled,
}: {
  message: ChatMessage;
  emotes: Map<string, string>;
  enabled: boolean;
}) {
  if (!enabled) return <>{message.text}</>;
  const points = Array.from(message.text);
  const chunks: React.ReactNode[] = [];
  let pos = 0;
  const addText = (text: string, key: string) =>
    chunks.push(
      <span key={key}>
        {text
          .split(/(\s+)/)
          .map((word, i) =>
            emotes.has(word) ? (
              <img
                className="emote"
                key={i}
                src={emotes.get(word)}
                alt={word}
                title={word}
                loading="lazy"
              />
            ) : (
              word
            ),
          )}
      </span>,
    );
  for (const e of message.emotes) {
    if (e.start < pos || e.end >= points.length) continue;
    addText(points.slice(pos, e.start).join(""), `text${pos}`);
    chunks.push(
      <img
        className="emote"
        key={`emote${e.start}`}
        src={`https://static-cdn.jtvnw.net/emoticons/v2/${encodeURIComponent(e.id)}/default/dark/2.0`}
        alt={points.slice(e.start, e.end + 1).join("")}
        loading="lazy"
      />,
    );
    pos = e.end + 1;
  }
  addText(points.slice(pos).join(""), `text${pos}`);
  return <>{chunks}</>;
}
export function Chat({ channel }: { channel: Channel }) {
  const a = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]),
    [status, setStatus] = useState("Connexion au chat…"),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [picker, setPicker] = useState(false),
    [emotes, setEmotes] = useState<Emote[]>([]),
    [paused, setPaused] = useState(false);
  const list = useRef<HTMLDivElement>(null),
    nearBottom = useRef(true);
  const map = new Map(emotes.map((e) => [e.name, e.url]));
  useEffect(() => {
    let ws: WebSocket | undefined,
      timer: ReturnType<typeof setTimeout> | undefined,
      closed = false,
      tries = 0;
    setMessages([]);
    function connect() {
      if (closed) return;
      setStatus("Connexion au chat…");
      ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
      ws.onopen = () => {
        tries = 0;
        ws!.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
        ws!.send(`NICK justinfan${Math.floor(Math.random() * 80000 + 10000)}`);
        ws!.send(`JOIN #${channel.login.toLowerCase()}`);
        setStatus("Chat en direct");
      };
      ws.onmessage = (e) => {
        for (const raw of String(e.data).split("\r\n")) {
          const l = parseIrc(raw);
          if (!l) continue;
          if (l.command === "PING") {
            ws?.send(`PONG :${l.trailing || "tmi.twitch.tv"}`);
            continue;
          }
          if (l.command === "PRIVMSG")
            setMessages((v) => [...v, messageFromIrc(l)].slice(-300));
          if (l.command === "CLEARMSG")
            setMessages((v) =>
              v.filter((m) => m.id !== l.tags["target-msg-id"]),
            );
          if (l.command === "CLEARCHAT")
            setMessages((v) =>
              l.tags["target-user-id"]
                ? v.filter((m) => m.userId !== l.tags["target-user-id"])
                : [],
            );
          if (l.command === "NOTICE") setStatus(l.trailing);
          if (l.command === "ROOMSTATE" && l.tags["subs-only"] === "1")
            setStatus("Chat réservé aux abonnés");
          if (l.command === "RECONNECT") ws?.close();
        }
      };
      ws.onclose = () => {
        if (!closed) {
          setStatus("Chat déconnecté · reconnexion…");
          timer = setTimeout(connect, Math.min(30000, 1000 * 2 ** tries++));
        }
      };
      ws.onerror = () => ws?.close();
    }
    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, [channel.login]);
  useEffect(() => {
    if (nearBottom.current && list.current)
      list.current.scrollTop = list.current.scrollHeight;
    else setPaused(true);
  }, [messages]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const result: Emote[] = [];
      const requests = await Promise.allSettled([
        fetch("https://api.betterttv.net/3/cached/emotes/global", {
          signal: controller.signal,
        }).then((r) => r.json()),
        fetch(
          `https://api.betterttv.net/3/cached/users/twitch/${encodeURIComponent(channel.id)}`,
          { signal: controller.signal },
        ).then((r) => r.json()),
        fetch(
          `https://7tv.io/v3/users/twitch/${encodeURIComponent(channel.id)}`,
          { signal: controller.signal },
        ).then((r) => r.json()),
      ]);
      for (let i = 0; i < requests.length; i++) {
        const r = requests[i];
        if (r.status !== "fulfilled") continue;
        if (i < 2) {
          const es =
            i === 0
              ? r.value
              : [
                  ...(r.value.channelEmotes || []),
                  ...(r.value.sharedEmotes || []),
                ];
          if (Array.isArray(es))
            for (const e of es)
              result.push({
                name: e.code,
                url: `https://cdn.betterttv.net/emote/${encodeURIComponent(e.id)}/2x`,
              });
        } else
          for (const e of r.value.emote_set?.emotes || [])
            result.push({
              name: e.name,
              url: `https://cdn.7tv.app/emote/${encodeURIComponent(e.id)}/2x.webp`,
            });
      }
      if (!controller.signal.aborted) setEmotes(result);
    }
    load().catch(() => {});
    return () => controller.abort();
  }, [channel.id]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    setBusy(true);
    try {
      const v = await account<{
        data: { is_sent: boolean; drop_reason?: { message: string } }[];
      }>("send_chat", { broadcaster_id: channel.id, message: input });
      if (v.data[0]?.is_sent) setInput("");
      else
        a.notify(
          v.data[0]?.drop_reason?.message ||
            "Le message a été refusé par Twitch.",
        );
    } catch (err) {
      a.notify(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="chat-panel">
      <div className="chat-heading">
        <strong>Le chat</strong>
        <span>
          <i className="live-dot" />
          {status}
        </span>
      </div>
      <div
        className="chat-messages"
        ref={list}
        role="log"
        aria-live="off"
        style={{ fontSize: a.settings.chatSize }}
        onScroll={() => {
          const e = list.current!;
          nearBottom.current =
            e.scrollHeight - e.scrollTop - e.clientHeight < 65;
          if (nearBottom.current) setPaused(false);
        }}
      >
        <p className="chat-welcome">
          Bienvenue dans le chat de {channel.displayName}. Fais comme chez toi.
        </p>
        {messages.map((m) => (
          <p key={m.id}>
            {m.badges.some((b) => b.startsWith("moderator")) && (
              <ShieldCheck className="mod-badge" size={13} />
            )}
            <strong style={{ color: readableChatColor(m.color) }}>
              {m.name}
            </strong>
            <span> : </span>
            <MessageBody message={m} emotes={map} enabled={a.settings.emotes} />
          </p>
        ))}
      </div>
      {paused && (
        <button
          className="chat-resume glass"
          onClick={() => {
            nearBottom.current = true;
            setPaused(false);
            if (list.current)
              list.current.scrollTop = list.current.scrollHeight;
          }}
        >
          Nouveaux messages
          <ChevronDown size={15} />
        </button>
      )}
      {picker && (
        <div className="emote-picker panel">
          {emotes.length ? (
            emotes.slice(0, 150).map((e, i) => (
              <button
                key={`${e.name}:${i}`}
                title={e.name}
                onClick={() => {
                  setInput((v) => `${v}${v ? " " : ""}${e.name} `);
                  setPicker(false);
                }}
              >
                <img src={e.url} alt={e.name} />
              </button>
            ))
          ) : (
            <p>Aucune emote supplémentaire sur cette chaîne.</p>
          )}
        </div>
      )}
      {a.user ? (
        <form className="chat-compose glass" onSubmit={send}>
          <button
            type="button"
            className="icon-btn"
            aria-label="Emotes"
            aria-expanded={picker}
            onClick={() => setPicker(!picker)}
          >
            <Smile size={20} />
          </button>
          <input
            aria-label="Envoyer un message dans le chat"
            placeholder="Fais partie du moment…"
            value={input}
            maxLength={500}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            className="send"
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Envoyer"
          >
            <Send size={18} />
          </button>
        </form>
      ) : (
        <Link className="chat-login glass" to="/login">
          Connecte-toi pour participer
          <Send size={17} />
        </Link>
      )}
    </section>
  );
}
