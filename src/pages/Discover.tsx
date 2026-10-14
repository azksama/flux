import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  Bell,
  Search,
  SlidersHorizontal,
  Heart,
  Radio,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { browse, thumbnail, number } from "../api";
import type { Channel, Connection, Game, Stream } from "../types";
import { useApp } from "../state";
import {
  PageTitle,
  Section,
  StreamCard,
  Loading,
  ErrorState,
  Empty,
  ChannelRow,
} from "../components";

export function Home() {
  const a = useApp();
  const [filter, setFilter] = useState("Pour toi");
  const q = useInfiniteQuery({
    queryKey: ["streams", a.settings.language, filter],
    initialPageParam: "",
    queryFn: ({ pageParam }) =>
      browse<{ streams: Connection<Stream> }>("streams", {
        after: pageParam || null,
        languages:
          filter !== "Tout le monde" && a.settings.language
            ? [a.settings.language]
            : null,
        tags:
          filter === "IRL" ? ["IRL"] : filter === "Gaming" ? ["Gaming"] : null,
      }),
    getNextPageParam: (p) =>
      p.streams.pageInfo.hasNextPage
        ? p.streams.edges.at(-1)?.cursor
        : undefined,
  });
  const streams =
    q.data?.pages.flatMap((p) => p.streams.edges.map((e) => e.node)) ?? [];
  return (
    <>
      <header className="home-header">
        <Link className="wordmark" to="/">
          FLUX
          <span />
        </Link>
        <div>
          <Link className="icon-btn" to="/search" aria-label="Rechercher">
            <Search size={21} />
          </Link>
          <Link
            className="icon-btn notice-button"
            to="/notifications"
            aria-label="Notifications"
          >
            <Bell size={21} />
            {a.notices.some((n) => !n.read) && <i />}
          </Link>
          <Link className="profile-dot" to="/profile" aria-label="Mon profil">
            {a.user?.login[0]?.toUpperCase() || "F"}
          </Link>
        </div>
      </header>
      <div className="intro">
        <h1>
          Trouve ton prochain{" "}
          <br />
          <em>rendez-vous.</em>
        </h1>
        <p>Des streams, des rencontres. Ta communauté.</p>
      </div>
      <div className="chips">
        {["Pour toi", "Gaming", "IRL", "Tout le monde"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => {
              setFilter(f);
            }}
          >
            {f === "Pour toi" && <Sparkles size={13} />}
            {f}
          </button>
        ))}
      </div>
      {q.isPending ? (
        <Loading label="Les directs arrivent…" />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => q.refetch()} />
      ) : streams.length ? (
        <>
          <Section title="À la une" />
          <div className="featured-grid">
            {streams.slice(0, 2).map((s, i) => (
              <div key={s.id} className={i === 1 ? "second-feature" : ""}>
                <StreamCard stream={s} hero />
              </div>
            ))}
          </div>
          <Section title="En direct maintenant" to="/explore" />
          <div className="stream-grid">
            {streams.slice(2).map((s) => (
              <StreamCard key={s.id} stream={s} />
            ))}
          </div>
          {q.hasNextPage && (
            <button
              className="secondary load-more"
              disabled={q.isFetchingNextPage}
              onClick={() => q.fetchNextPage()}
            >
              {q.isFetchingNextPage ? "Chargement…" : "Voir plus de directs"}
            </button>
          )}
        </>
      ) : (
        <Empty
          title="Aucun direct pour ce filtre"
          body="Essaie une autre langue ou explore les catégories."
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
export function Explore() {
  const q = useInfiniteQuery({
    queryKey: ["games"],
    initialPageParam: "",
    queryFn: ({ pageParam }) =>
      browse<{ games: Connection<Game> }>("games", {
        after: pageParam || null,
      }),
    getNextPageParam: (p) =>
      p.games.pageInfo.hasNextPage ? p.games.edges.at(-1)?.cursor : undefined,
  });
  return (
    <>
      <PageTitle
        title="Explorer"
        subtitle="À chacun son univers."
        action={
          <Link className="icon-btn" to="/search" aria-label="Rechercher">
            <Search />
          </Link>
        }
      />
      <Link className="search-field" to="/search">
        <Search size={19} />
        <span>Jeux, chaînes, créateurs…</span>
        <SlidersHorizontal size={18} />
      </Link>
      <Section title="Les catégories du moment" />
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => q.refetch()} />
      ) : (
        <>
          <div className="games-grid">
            {q.data?.pages
              .flatMap((p) => p.games.edges)
              .map(({ node: g }) => (
                <Link className="game-card" to={`/game/${g.slug}`} key={g.id}>
                  <img src={thumbnail(g.boxArtURL, 285, 380)} alt="" />
                  <h3>{g.displayName}</h3>
                  <p>
                    <span className="live-dot" />
                    {number(g.viewersCount)} spectateurs
                  </p>
                </Link>
              ))}
          </div>
          {q.hasNextPage && (
            <button
              className="secondary load-more"
              onClick={() => q.fetchNextPage()}
              disabled={q.isFetchingNextPage}
            >
              Plus de catégories
            </button>
          )}
        </>
      )}
    </>
  );
}
export function GamePage() {
  const { slug } = useParams();
  const a = useApp();
  const q = useInfiniteQuery({
    queryKey: ["game", slug, a.settings.language],
    initialPageParam: "",
    queryFn: ({ pageParam }) =>
      browse<{ game: { streams: Connection<Stream> } }>("game", {
        slug,
        after: pageParam || null,
        languages: a.settings.language ? [a.settings.language] : null,
      }),
    getNextPageParam: (p) =>
      p.game?.streams.pageInfo.hasNextPage
        ? p.game.streams.edges.at(-1)?.cursor
        : undefined,
  });
  return (
    <>
      <PageTitle
        title={slug?.replaceAll("-", " ") || "Catégorie"}
        subtitle="Rejoins le direct."
        back
      />
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => q.refetch()} />
      ) : q.data?.pages[0]?.game?.streams.edges.length ? (
        <>
          <div className="stream-grid">
            {q.data.pages
              .flatMap((p) => p.game.streams.edges)
              .map(({ node: s }) => (
                <StreamCard key={s.id} stream={s} />
              ))}
          </div>
          {q.hasNextPage && (
            <button
              className="secondary load-more"
              onClick={() => q.fetchNextPage()}
            >
              Voir plus
            </button>
          )}
        </>
      ) : (
        <Empty
          title="Le calme avant le live"
          body="Aucune chaîne ne diffuse dans cette catégorie avec tes filtres."
        />
      )}
    </>
  );
}
export function SearchPage() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [live, setLive] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setQuery(text.trim()), 350);
    return () => clearTimeout(id);
  }, [text]);
  const q = useInfiniteQuery({
    queryKey: ["search", query],
    enabled: query.length > 1,
    initialPageParam: "",
    queryFn: ({ pageParam }) =>
      browse<{ searchUsers: Connection<Channel> }>("search", {
        query,
        after: pageParam || null,
      }),
    getNextPageParam: (p) =>
      p.searchUsers.pageInfo.hasNextPage
        ? p.searchUsers.edges.at(-1)?.cursor
        : undefined,
  });
  const channels =
    q.data?.pages
      .flatMap((p) => p.searchUsers.edges.map((e) => e.node))
      .filter((c) => !live || c.stream) ?? [];
  return (
    <>
      <PageTitle title="Une envie précise ?" back />
      <label className="search-field">
        <Search />
        <input
          aria-label="Rechercher une chaîne"
          placeholder="Rechercher une chaîne…"
          autoFocus
          value={text}
          maxLength={100}
          onChange={(e) => setText(e.target.value)}
        />
        {text && (
          <button aria-label="Effacer la recherche" onClick={() => setText("")}>
            ×
          </button>
        )}
      </label>
      <div className="chips">
        <button
          className={!live ? "active" : ""}
          onClick={() => setLive(false)}
        >
          Toutes les chaînes
        </button>
        <button className={live ? "active" : ""} onClick={() => setLive(true)}>
          <Radio size={15} />
          En direct
        </button>
      </div>
      {query.length < 2 ? (
        <Empty
          title="Un nom, mille découvertes"
          body="Saisis au moins deux caractères pour chercher un créateur."
        />
      ) : q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => q.refetch()} />
      ) : channels.length ? (
        <>
          <p className="muted">Résultats pour « {query} »</p>
          <div className="panel">
            {channels.map((c) => (
              <ChannelRow key={c.id} channel={c} />
            ))}
          </div>
          {q.hasNextPage && (
            <button
              className="secondary load-more"
              disabled={q.isFetchingNextPage}
              onClick={() => q.fetchNextPage()}
            >
              Plus de résultats
            </button>
          )}
        </>
      ) : (
        <Empty
          title="Personne ici… pour l’instant"
          body="Vérifie le nom de la chaîne ou retire le filtre En direct."
        />
      )}
    </>
  );
}
export function Following() {
  const a = useApp();
  const q = useQuery({
    queryKey: ["following", a.follows.map((c) => c.login).join(",")],
    enabled: !!a.follows.length,
    queryFn: () =>
      browse<{ users: Channel[] }>("following", {
        logins: a.follows.map((c) => c.login),
      }),
    refetchInterval: 60000,
  });
  const online = q.data?.users.filter((c) => c.stream) ?? [];
  return (
    <>
      <PageTitle
        title="Tes rendez-vous"
        subtitle="Les créateurs que tu aimes, au même endroit."
        action={<Heart className="mint" />}
      />
      <div className="chips">
        <span className="count-chip">{online.length} en direct</span>
        <span className="count-chip">{a.follows.length} favoris locaux</span>
      </div>
      {!a.follows.length ? (
        <Empty
          title="Le début d’une belle histoire"
          body="Ajoute une chaîne à tes favoris pour retrouver ses prochains directs ici."
          icon="heart"
          action={
            <Link className="primary" to="/explore">
              Découvrir des créateurs
              <ArrowUpRight size={17} />
            </Link>
          }
        />
      ) : q.isPending ? (
        <Loading />
      ) : q.error ? (
        <>
          <ErrorState error={q.error} retry={() => q.refetch()} />
          <div className="panel">
            {a.follows.map((c) => (
              <ChannelRow key={c.id} channel={c} />
            ))}
          </div>
        </>
      ) : (
        <>
          <Section title="En direct" />
          {online.length ? (
            <div className="stream-grid">
              {online.map((c) => (
                <StreamCard
                  key={c.id}
                  stream={{
                    ...c.stream!,
                    broadcaster: {
                      ...c,
                      broadcastSettings:
                        c.stream?.broadcaster?.broadcastSettings,
                    },
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="muted">
              Tes créateurs sont hors ligne. Profites-en pour explorer.
            </p>
          )}
          <Section title="Toutes tes chaînes" />
          <div className="panel">
            {q.data?.users.map((c) => (
              <ChannelRow key={c.id} channel={c} />
            ))}
          </div>
        </>
      )}
      <p className="footnote">
        Les favoris FLUX sont conservés sur cet appareil.{" "}
        <Link to="/account">Importer tes suivis Twitch</Link>
      </p>
    </>
  );
}
