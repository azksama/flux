import {
  ArrowLeft,
  ChevronRight,
  Radio,
  RefreshCw,
  Search,
  Heart,
  Play,
  ExternalLink,
  LoaderCircle,
  WifiOff,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { thumbnail, number, errorText, external } from "./api";
import type { Channel, Stream, Media } from "./types";
import { useApp } from "./state";
export function PageTitle({
  title,
  subtitle,
  back = false,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  const nav = useNavigate();
  return (
    <header className="page-heading">
      {back && (
        <button
          className="icon-btn"
          onClick={() => nav(-1)}
          aria-label="Retour"
        >
          <ArrowLeft />
        </button>
      )}
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
export function Section({
  title,
  to,
  label = "Tout voir",
}: {
  title: string;
  to?: string;
  label?: string;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {to && (
        <Link to={to}>
          {label}
          <ChevronRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function Avatar({
  channel,
  size = 42,
}: {
  channel: Channel;
  size?: number;
}) {
  return (
    <img
      className="avatar"
      width={size}
      height={size}
      src={channel.profileImageURL || "/images/irl.jpg"}
      alt=""
      loading="lazy"
    />
  );
}
export function StreamCard({
  stream,
  hero = false,
}: {
  stream: Stream;
  hero?: boolean;
}) {
  const a = useApp();
  const nav = useNavigate();
  const c = stream.broadcaster;
  return (
    <button
      className={`stream-card ${hero ? "hero-card" : ""}`}
      onClick={() => {
        a.play({
          kind: "live",
          id: c.login,
          title: stream.title || c.broadcastSettings?.title || c.displayName,
          poster: thumbnail(stream.previewImageURL),
          channel: c,
        });
        nav(`/watch/${c.login}`);
      }}
    >
      <div className="stream-image">
        <img
          src={thumbnail(stream.previewImageURL)}
          alt=""
          loading={hero ? "eager" : "lazy"}
        />
        <span className="live-badge">
          <i />
          EN DIRECT
        </span>
        <span className="viewers glass">
          <Radio size={12} />
          {number(stream.viewersCount)}
        </span>
        {hero && (
          <div className="hero-copy">
            <span>{stream.game?.displayName || "En direct"}</span>
            <h2>
              {stream.title || c.broadcastSettings?.title || c.displayName}
            </h2>
            <div className="hero-person">
              <Avatar channel={c} size={30} />
              <strong>{c.displayName}</strong>
              <span className="hero-play">
                <Play size={18} fill="currentColor" />
              </span>
            </div>
          </div>
        )}
      </div>
      {!hero && (
        <div className="stream-caption">
          <Avatar channel={c} />
          <div>
            <h3>
              {stream.title || c.broadcastSettings?.title || c.displayName}
            </h3>
            <p>
              {c.displayName}
              <span> · {stream.game?.displayName || "Live"}</span>
            </p>
          </div>
        </div>
      )}
    </button>
  );
}
export function ChannelRow({ channel }: { channel: Channel }) {
  const a = useApp();
  return (
    <div className="channel-row">
      <Link to={`/channel/${channel.login}`}>
        <Avatar channel={channel} />
        <span>
          <strong>{channel.displayName}</strong>
          <small>
            {channel.stream
              ? `${number(channel.stream.viewersCount)} spectateurs`
              : "Hors ligne"}
          </small>
        </span>
        {channel.stream && <i className="live-dot" />}
      </Link>
      <button
        className={`icon-btn ${a.follows.some((f) => f.login === channel.login) ? "selected" : ""}`}
        onClick={() => a.follow(channel)}
        aria-label={`${a.follows.some((f) => f.login === channel.login) ? "Ne plus suivre" : "Suivre"} ${channel.displayName}`}
      >
        <Heart
          size={19}
          fill={
            a.follows.some((f) => f.login === channel.login)
              ? "currentColor"
              : "none"
          }
        />
      </button>
    </div>
  );
}
export function MediaCard({ media, detail }: { media: Media; detail: string }) {
  const a = useApp(),
    nav = useNavigate();
  return (
    <button
      className="media-card"
      onClick={() => {
        a.play(media);
        nav(`/watch/${media.channel.login}`);
      }}
    >
      <img src={thumbnail(media.poster)} alt="" loading="lazy" />
      <div>
        <strong>{media.title}</strong>
        <small>{detail}</small>
      </div>
      <Play size={18} />
    </button>
  );
}
export function Loading({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={22} />
      <span>{label}</span>
      <div className="skeleton-grid">
        {[1, 2, 3, 4].map((n) => (
          <div className="skeleton" key={n} />
        ))}
      </div>
    </div>
  );
}
export function Empty({
  title,
  body,
  action,
  icon = "search",
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: "search" | "heart" | "network";
}) {
  const Icon = icon === "heart" ? Heart : icon === "network" ? WifiOff : Search;
  return (
    <div className="empty-state">
      <span className="empty-icon glass">
        <Icon size={30} />
      </span>
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <Empty
      title="Un instant…"
      body={errorText(error)}
      icon="network"
      action={
        retry && (
          <button className="primary" onClick={retry}>
            <RefreshCw size={17} />
            Réessayer
          </button>
        )
      }
    />
  );
}
export function Row({
  title,
  detail,
  to,
  icon,
  action,
}: {
  title: string;
  detail?: string;
  to?: string;
  icon?: ReactNode;
  action?: () => void;
}) {
  const body = (
    <>
      {icon}
      <span>
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </span>
      <ChevronRight size={18} />
    </>
  );
  return to ? (
    <Link className="setting-row" to={to}>
      {body}
    </Link>
  ) : (
    <button className="setting-row" onClick={action}>
      {body}
    </button>
  );
}
export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  );
}
export function ServiceLink({
  title,
  body,
  url,
  button = "Continuer sur Twitch",
}: {
  title: string;
  body: string;
  url: string;
  button?: string;
}) {
  const a = useApp();
  return (
    <section className="service-panel glass">
      <ExternalLink size={25} />
      <h2>{title}</h2>
      <p>{body}</p>
      <button
        className="primary"
        onClick={() => external(url).catch((e) => a.notify(errorText(e)))}
      >
        {button}
        <ExternalLink size={16} />
      </button>
    </section>
  );
}
