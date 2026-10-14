import { useEffect, useRef, useState } from "react";
import Hls, {
  type Loader,
  type LoaderContext,
  type LoaderConfiguration,
  type LoaderCallbacks,
  type LoaderStats,
} from "hls.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  X,
  Volume2,
  VolumeX,
  Maximize,
  Minimize2,
  Headphones,
  Bookmark,
  Scissors,
  Settings2,
  RefreshCw,
  Play,
  Pause,
} from "lucide-react";
import { useApp } from "./state";
import { command, errorText, native, account, external } from "./api";
import { Chat } from "./Chat";
import { Avatar } from "./components";

// Binary IPC keeps tokens and request handling in Rust, and avoids WebView CORS differences.
class NativeLoader implements Loader<LoaderContext> {
  context!: LoaderContext;
  stats: LoaderStats = {
    aborted: false,
    loaded: 0,
    total: 0,
    retry: 0,
    chunkCount: 0,
    bwEstimate: 0,
    loading: { start: 0, first: 0, end: 0 },
    parsing: { start: 0, end: 0 },
    buffering: { start: 0, first: 0, end: 0 },
  };
  private done = false;
  private timer?: ReturnType<typeof setTimeout>;
  load(
    context: LoaderContext,
    config: LoaderConfiguration,
    callbacks: LoaderCallbacks<LoaderContext>,
  ) {
    this.context = context;
    this.stats.loading.start = performance.now();
    this.timer = setTimeout(() => {
      if (this.done) return;
      this.done = true;
      callbacks.onTimeout(this.stats, context, null);
    }, config.timeout || 25000);
    command<ArrayBuffer>("media_fetch", { url: context.url })
      .then((buffer) => {
        if (this.done) return;
        this.done = true;
        clearTimeout(this.timer);
        this.stats.loading.first = this.stats.loading.end = performance.now();
        this.stats.loaded = this.stats.total = buffer.byteLength;
        const data =
          context.responseType === "arraybuffer"
            ? buffer
            : new TextDecoder().decode(buffer);
        callbacks.onSuccess(
          { url: context.url, data },
          this.stats,
          context,
          null,
        );
      })
      .catch((e) => {
        if (this.done) return;
        this.done = true;
        clearTimeout(this.timer);
        callbacks.onError(
          { code: 0, text: errorText(e) },
          context,
          null,
          this.stats,
        );
      });
  }
  abort() {
    this.done = true;
    this.stats.aborted = true;
    clearTimeout(this.timer);
  }
  destroy() {
    this.abort();
  }
}
export function Player() {
  const a = useApp(),
    location = useLocation(),
    nav = useNavigate();
  const m = a.media;
  const expanded = location.pathname.startsWith("/watch/");
  const video = useRef<HTMLVideoElement>(null),
    box = useRef<HTMLDivElement>(null),
    hls = useRef<Hls | null>(null);
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [qualities, setQualities] = useState<{ height: number; bitrate: number }[]>(
      [],
    ),
    [options, setOptions] = useState(false),
    [attempt, setAttempt] = useState(0),
    [paused, setPaused] = useState(false),
    [clipping, setClipping] = useState(false);
  const historyRef = useRef(a.history);
  historyRef.current = a.history;
  const settingsRef = useRef(a.settings);
  settingsRef.current = a.settings;
  useEffect(() => {
    if (!m) return;
    let active = true;
    const el = video.current!;
    setError("");
    setLoading(true);
    setQualities([]);
    async function load() {
      try {
        const url =
          m!.localUrl ||
          (await command<string>("playback", { kind: m!.kind, id: m!.id }));
        if (!active) return;
        if (m!.kind === "clip") {
          el.src = url;
          setLoading(false);
          if (settingsRef.current.autoplay)
            el.play().catch(() => setPaused(true));
          return;
        }
        if (Hls.isSupported()) {
          const instance = new Hls({
            enableWorker: true,
            lowLatencyMode: settingsRef.current.lowLatency,
            backBufferLength: 30,
            ...(native && !m!.localUrl ? { loader: NativeLoader } : {}),
          });
          hls.current = instance;
          instance.loadSource(url);
          instance.attachMedia(el);
          instance.on(Hls.Events.MANIFEST_PARSED, () => {
            setQualities(
              instance.levels.map((l) => ({
                height: l.height,
                bitrate: l.bitrate,
              })),
            );
            instance.currentLevel =
              settingsRef.current.quality < instance.levels.length
                ? settingsRef.current.quality
                : -1;
            if (m!.kind === "video") {
              const old = historyRef.current.find((v) => v.id === m!.id);
              if (old?.position) el.currentTime = old.position;
            }
            setLoading(false);
            if (settingsRef.current.autoplay)
              el.play().catch(() => setPaused(true));
          });
          instance.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              setError(
                "Lecture interrompue. Ce direct peut être hors ligne ou réservé aux abonnés.",
              );
              setLoading(false);
              instance.destroy();
            }
          });
        } else if (el.canPlayType("application/vnd.apple.mpegurl")) {
          el.src = url;
          setLoading(false);
          if (settingsRef.current.autoplay)
            el.play().catch(() => setPaused(true));
        } else
          throw new Error("Ce WebView ne prend pas en charge la lecture HLS.");
      } catch (e) {
        if (active) {
          setError(errorText(e));
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
      hls.current?.destroy();
      hls.current = null;
      el.pause();
      el.removeAttribute("src");
      el.load();
    };
  }, [m?.id, m?.kind, attempt]);
  useEffect(() => {
    if (video.current) video.current.muted = a.settings.muted;
  }, [a.settings.muted]);
  useEffect(() => {
    if (!m || m.kind !== "video") return;
    const id = setInterval(() => {
      const position = video.current?.currentTime;
      if (position)
        a.setHistory((v) =>
          v.map((x) => (x.id === m.id ? { ...x, position } : x)),
        );
    }, 10000);
    return () => clearInterval(id);
  }, [m?.id, m?.kind, a.setHistory]);
  if (!m) return null;
  const saved = a.bookmarks.some((b) => b.id === m.id && b.kind === m.kind);
  async function clip() {
    if (!m || clipping) return;
    setClipping(true);
    try {
      const v = await account<{ data: { id: string; edit_url: string }[] }>(
        "create_clip",
        { broadcaster_id: m.channel.id },
      );
      if (!v.data[0]) throw new Error("Twitch n’a pas créé de clip.");
      await external(v.data[0].edit_url);
      a.notify("Clip créé. Termine sa publication sur Twitch.");
    } catch (e) {
      a.notify(errorText(e));
    } finally {
      setClipping(false);
    }
  }
  return (
    <div
      className={`player-shell ${expanded ? "expanded" : "mini"} ${a.audioOnly ? "audio-only" : ""}`}
    >
      <div className="player-video" ref={box}>
        <video
          ref={video}
          controls={expanded && !a.audioOnly}
          playsInline
          preload="metadata"
          poster={m.poster}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
          onError={() => {
            if (!loading)
              setError("La vidéo ne peut pas être lue sur cet appareil.");
          }}
        />
        {a.audioOnly && (
          <div className="audio-art">
            <Avatar channel={m.channel} size={70} />
            <Headphones />
            <strong>Audio seul</strong>
          </div>
        )}
        {loading && (
          <span className="player-loading glass">Connexion au direct…</span>
        )}
        {error && (
          <div className="player-error">
            <p>{error}</p>
            <button
              className="secondary"
              onClick={() => setAttempt((v) => v + 1)}
            >
              <RefreshCw size={16} />
              Réessayer
            </button>
          </div>
        )}
        <div className="player-top-controls">
          <button
            className="icon-btn glass"
            onClick={() =>
              expanded ? nav("/") : nav(`/watch/${m.channel.login}`)
            }
            aria-label={expanded ? "Réduire le lecteur" : "Agrandir le lecteur"}
          >
            {expanded ? <Minimize2 size={18} /> : <Maximize size={16} />}
          </button>
          <button
            className="icon-btn glass"
            onClick={() => {
              a.setMedia(null);
              if (expanded) nav(`/channel/${m.channel.login}`);
            }}
            aria-label="Fermer le lecteur"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      {!expanded ? (
        <button
          className="mini-label"
          onClick={() => nav(`/watch/${m.channel.login}`)}
        >
          <strong>{m.channel.displayName}</strong>
          <span>{m.kind === "live" ? "En direct" : m.title}</span>
        </button>
      ) : (
        <>
          <div className="watch-meta">
            <Link to={`/channel/${m.channel.login}`}>
              <Avatar channel={m.channel} />
              <span>
                <strong>{m.channel.displayName}</strong>
                <small>{m.title}</small>
              </span>
            </Link>
            <button
              className="icon-btn"
              onClick={() => a.follow(m.channel)}
              aria-label="Suivre la chaîne"
            >
              <Bookmark
                fill={
                  a.follows.some((c) => c.login === m.channel.login)
                    ? "currentColor"
                    : "none"
                }
              />
            </button>
          </div>
          <div className="player-actions">
            <button
              onClick={() => {
                if (paused) video.current?.play().catch(() => {});
                else video.current?.pause();
              }}
              aria-label={paused ? "Lecture" : "Pause"}
            >
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button
              onClick={() => a.updateSettings({ muted: !a.settings.muted })}
              aria-label={a.settings.muted ? "Activer le son" : "Couper le son"}
            >
              {a.settings.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              className={a.audioOnly ? "selected" : ""}
              aria-label="Audio seul"
              aria-pressed={a.audioOnly}
              onClick={() => {
                a.setAudioOnly(!a.audioOnly);
                if (hls.current) {
                  const idx = hls.current.levels.findIndex((l) => !l.height);
                  hls.current.currentLevel =
                    !a.audioOnly && idx >= 0 ? idx : a.settings.quality;
                }
              }}
            >
              <Headphones size={18} />
              <span className="audio-label">Audio</span>
            </button>
            <button
              className={saved ? "selected" : ""}
              onClick={() => a.bookmark(m)}
              aria-label={saved ? "Retirer des enregistrés" : "Enregistrer"}
            >
              <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
            </button>
            {m.kind === "live" && a.user && (
              <button
                onClick={clip}
                disabled={clipping}
                aria-label="Créer un clip"
              >
                <Scissors size={18} />
              </button>
            )}
            <button
              onClick={() => setOptions(!options)}
              aria-label="Options du lecteur"
              aria-expanded={options}
            >
              <Settings2 size={18} />
            </button>
            <button
              onClick={() =>
                box.current
                  ?.requestFullscreen()
                  .catch(() => a.notify("Plein écran indisponible."))
              }
              aria-label="Plein écran"
            >
              <Maximize size={18} />
            </button>
          </div>
          {options && (
            <div className="player-options panel">
              <label>
                Qualité vidéo
                <select
                  value={a.settings.quality}
                  onChange={(e) => {
                    const q = Number(e.target.value);
                    a.updateSettings({ quality: q });
                    if (hls.current) hls.current.currentLevel = q;
                  }}
                >
                  <option value={-1}>Automatique</option>
                  {qualities.map((q, i) => (
                    <option value={i} key={i}>
                      {q.height ? `${q.height}p` : "Audio"} ·{" "}
                      {Math.round(q.bitrate / 1000)} kb/s
                    </option>
                  ))}
                </select>
              </label>
              {m.kind !== "live" && !m.localUrl && (
                <button
                  className="secondary"
                  onClick={() => {
                    a.notify("Téléchargement démarré. Garde FLUX ouvert.");
                    command("download_start", {
                      kind: m.kind,
                      id: m.id,
                      title: m.title,
                      channel: m.channel.login,
                    })
                      .then(() => a.notify("Téléchargement terminé."))
                      .catch((e) => a.notify(errorText(e)));
                  }}
                >
                  Télécharger
                </button>
              )}
              <Link className="text-button" to="/downloads">
                Mes téléchargements
              </Link>
              <button
                className="secondary"
                onClick={() =>
                  external(`https://www.twitch.tv/${m.channel.login}`).catch(
                    (e) => a.notify(errorText(e)),
                  )
                }
              >
                Ouvrir sur Twitch
              </button>
            </div>
          )}
          {m.kind === "live" ? (
            <Chat channel={m.channel} />
          ) : (
            <div className="replay-info panel">
              <h2>{m.title}</h2>
              <p>
                {m.kind === "clip"
                  ? "Un moment à partager."
                  : "Reprends la lecture là où tu l’as laissée."}
              </p>
              <Link to={`/channel/${m.channel.login}`}>
                Plus de vidéos de {m.channel.displayName}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
