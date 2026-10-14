import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Heart, Play, Share2, CalendarDays } from "lucide-react";
import { useApp } from "../state";
import {
  browse,
  account,
  thumbnail,
  number,
  duration,
  errorText,
} from "../api";
import type { Channel, Connection, Video, Clip } from "../types";
import {
  PageTitle,
  Avatar,
  Loading,
  ErrorState,
  Empty,
  MediaCard,
  ServiceLink,
} from "../components";

export function ChannelPage() {
  const { login } = useParams();
  const a = useApp(),
    nav = useNavigate();
  const [tab, setTab] = useState("Vidéos");
  const q = useQuery({
    queryKey: ["channel", login],
    queryFn: () => browse<{ user: Channel }>("channel", { login }),
  });
  const vids = useQuery({
    queryKey: ["videos", login],
    enabled: tab === "Vidéos",
    queryFn: () =>
      browse<{ user: { videos: Connection<Video> } }>("videos", {
        login,
        first: 50,
      }),
  });
  const clips = useQuery({
    queryKey: ["clips", login],
    enabled: tab === "Clips",
    queryFn: () =>
      browse<{ user: { clips: Connection<Clip> } }>("clips", {
        login,
        first: 50,
      }),
  });
  const about = useQuery({
    queryKey: ["about", login],
    enabled: tab === "À propos",
    queryFn: () =>
      browse<{ user: { description: string } }>("about", { login }),
  });
  const schedule = useQuery({
    queryKey: ["schedule", q.data?.user?.id],
    enabled: tab === "Planning" && !!a.user && !!q.data?.user,
    queryFn: () =>
      account<{
        data: {
          segments: {
            id: string;
            title: string;
            start_time: string;
            end_time: string;
          }[];
        };
      }>("schedule", { broadcaster_id: q.data?.user.id }),
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => q.refetch()} />;
  const c = q.data?.user;
  if (!c)
    return (
      <Empty
        title="Chaîne introuvable"
        body="Cette chaîne n’existe plus ou a changé de nom."
      />
    );
  const followed = a.follows.some((x) => x.login === c.login);
  return (
    <>
      <PageTitle
        title="La chaîne"
        back
        action={
          <button
            className="icon-btn"
            aria-label="Partager la chaîne"
            onClick={() => {
              navigator.clipboard
                .writeText(`https://www.twitch.tv/${c.login}`)
                .then(() => a.notify("Lien copié."))
                .catch(() => a.notify(`twitch.tv/${c.login}`));
            }}
          >
            <Share2 />
          </button>
        }
      />
      <div
        className="channel-cover"
        style={{
          backgroundImage: `linear-gradient(0deg,#0a1014,transparent),url("${thumbnail(c.stream?.previewImageURL) || c.bannerImageURL || "/images/irl.jpg"}")`,
        }}
      >
        <Avatar channel={c} size={80} />
        {c.stream && (
          <span className="live-badge">
            <i />
            EN DIRECT
          </span>
        )}
      </div>
      <div className="channel-heading">
        <div>
          <h1>{c.displayName}</h1>
          <p>{number(c.followers?.totalCount)} followers</p>
        </div>
        <button
          className={followed ? "secondary" : "primary"}
          onClick={() => a.follow(c)}
        >
          <Heart size={18} fill={followed ? "currentColor" : "none"} />
          {followed ? "Suivi" : "Suivre"}
        </button>
      </div>
      {c.stream ? (
        <button
          className="primary full"
          onClick={() => {
            a.play({
              id: c.login,
              kind: "live",
              title: c.stream?.title || c.displayName,
              channel: c,
              poster: thumbnail(c.stream?.previewImageURL),
            });
            nav(`/watch/${c.login}`);
          }}
        >
          <Play size={18} fill="currentColor" />
          Rejoindre {number(c.stream.viewersCount)} spectateurs
        </button>
      ) : (
        <div className="offline-banner">
          <CalendarDays size={20} />
          <span>
            <strong>On se retrouve bientôt.</strong>
            <small>Cette chaîne est actuellement hors ligne.</small>
          </span>
        </div>
      )}
      <div className="channel-actions">
        <Link to={`/support/${c.login}`}>Soutenir la chaîne</Link>
        <Link to={`/report/${c.login}`}>Signaler</Link>
      </div>
      <div className="tabs">
        {["Vidéos", "Clips", "Planning", "À propos"].map((t) => (
          <button
            key={t}
            className={t === tab ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Vidéos" &&
        (vids.isPending ? (
          <Loading />
        ) : vids.error ? (
          <ErrorState error={vids.error} />
        ) : vids.data?.user?.videos.edges.length ? (
          <div className="media-list">
            {vids.data.user.videos.edges.map(({ node: v }) => (
              <MediaCard
                key={v.id}
                media={{
                  id: v.id,
                  kind: "video",
                  title: v.title,
                  poster: v.previewThumbnailURL,
                  channel: c,
                }}
                detail={`${duration(v.lengthSeconds)} · ${number(v.viewCount)} vues`}
              />
            ))}
          </div>
        ) : (
          <Empty
            title="Les replays arrivent"
            body="Aucune vidéo publique disponible pour cette chaîne."
          />
        ))}
      {tab === "Clips" &&
        (clips.isPending ? (
          <Loading />
        ) : clips.error ? (
          <ErrorState error={clips.error} />
        ) : clips.data?.user?.clips.edges.length ? (
          <div className="media-list">
            {clips.data.user.clips.edges.map(({ node: v }) => (
              <MediaCard
                key={v.slug}
                media={{
                  id: v.slug,
                  kind: "clip",
                  title: v.title,
                  poster: v.thumbnailURL,
                  channel: c,
                }}
                detail={`${duration(v.durationSeconds)} · ${number(v.viewCount)} vues`}
              />
            ))}
          </div>
        ) : (
          <Empty
            title="Les meilleurs moments sont à venir"
            body="Aucun clip public disponible."
          />
        ))}
      {tab === "À propos" &&
        (about.isPending ? (
          <Loading />
        ) : about.error ? (
          <ErrorState error={about.error} />
        ) : (
          <article className="panel about-copy">
            {about.data?.user?.description ||
              "Ce créateur n’a pas encore ajouté de présentation."}
          </article>
        ))}
      {tab === "Planning" &&
        (!a.user ? (
          <ServiceLink
            title="Le prochain rendez-vous"
            body="Le planning complet de ce créateur est disponible sur Twitch."
            url={`https://www.twitch.tv/${c.login}/schedule`}
          />
        ) : schedule.isPending ? (
          <Loading />
        ) : schedule.error ? (
          <ServiceLink
            title="Planning sur Twitch"
            body={errorText(schedule.error)}
            url={`https://www.twitch.tv/${c.login}/schedule`}
          />
        ) : schedule.data?.data?.segments?.length ? (
          <div className="panel">
            {schedule.data.data.segments.map((s) => (
              <div className="schedule-row" key={s.id}>
                <CalendarDays />
                <div>
                  <strong>{s.title}</strong>
                  <p>
                    {new Date(s.start_time).toLocaleString("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="Rien de prévu pour le moment"
            body="Le créateur n’a pas encore annoncé son prochain live."
          />
        ))}
    </>
  );
}
export function Library() {
  const a = useApp();
  const [tab, setTab] = useState("Historique");
  const items = tab === "Historique" ? a.history : a.bookmarks;
  return (
    <>
      <PageTitle
        title="Ta bibliothèque"
        subtitle="Les moments qui restent."
        back
      />
      <div className="tabs">
        {["Historique", "Enregistrés"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {items.length ? (
        <>
          <div className="media-list">
            {items.map((m) => (
              <MediaCard
                key={`${m.kind}:${m.id}`}
                media={m}
                detail={m.channel.displayName}
              />
            ))}
          </div>
          {tab === "Historique" && (
            <button
              className="text-button danger"
              onClick={() => {
                if (
                  confirm(
                    "Effacer tout l’historique de lecture de cet appareil ?",
                  )
                )
                  a.setHistory([]);
              }}
            >
              Effacer l’historique
            </button>
          )}
        </>
      ) : (
        <Empty
          title={
            tab === "Historique"
              ? "Ton prochain coup de cœur t’attend"
              : "Garde un moment pour plus tard"
          }
          body={
            tab === "Historique"
              ? "Les vidéos que tu regardes apparaîtront ici."
              : "Utilise le marque-page du lecteur pour enregistrer un direct, un replay ou un clip."
          }
          action={
            <Link className="primary" to="/explore">
              Explorer
            </Link>
          }
        />
      )}
    </>
  );
}
