import { useEffect, useRef, useState } from "react";
import {
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Home as HomeIcon,
  Compass,
  Heart,
  UserRound,
  WifiOff,
  X,
  ArrowLeft,
} from "lucide-react";
import { useApp } from "./state";
import { browse, thumbnail, native } from "./api";
import type { Channel } from "./types";
import { Player } from "./Player";
import { DownloadsPage } from "./pages/Downloads";
import {
  Home,
  Explore,
  GamePage,
  SearchPage,
  Following,
} from "./pages/Discover";
import { ChannelPage, Library } from "./pages/Channel";
import {
  Welcome,
  Interests,
  Login,
  Profile,
  AccountPage,
  EditProfile,
} from "./pages/Account";
import {
  SettingsPage,
  SettingDetail,
  Notifications,
  Help,
  OfficialFlow,
  Messages,
} from "./pages/Settings";
import { Studio, Prepare, StudioExternal, Moderation } from "./pages/Studio";
import { Empty, ErrorState, Loading } from "./components";

function WatchRoute() {
  const { login } = useParams();
  const a = useApp();
  const q = useQuery({
    queryKey: ["channel", login],
    enabled: !a.media && !!login,
    queryFn: () => browse<{ user: Channel }>("channel", { login }),
  });
  useEffect(() => {
    const c = q.data?.user;
    if (c?.stream && !a.media)
      a.play({
        id: c.login,
        kind: "live",
        title: c.stream.title || c.displayName,
        poster: thumbnail(c.stream.previewImageURL),
        channel: c,
      });
  }, [q.data]);
  if (a.media) return null;
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} />;
  return (
    <Empty
      title="Cette chaîne est hors ligne"
      body="Retrouve ses replays et son planning sur sa page."
      action={
        <Link className="primary" to={`/channel/${login}`}>
          Voir la chaîne
        </Link>
      }
    />
  );
}
function LiveNotices() {
  const a = useApp();
  const seen = useRef<Set<string> | null>(null);
  const q = useQuery({
    queryKey: ["live-notices", a.follows.map((f) => f.login).join(",")],
    enabled: a.settings.notifications && a.follows.length > 0,
    queryFn: () =>
      browse<{ users: Channel[] }>("following", {
        logins: a.follows.map((f) => f.login),
      }),
    refetchInterval: 120000,
    refetchIntervalInBackground: false,
  });
  useEffect(() => {
    if (!q.data) return;
    const now = new Set(
      q.data.users.filter((c) => c.stream).map((c) => c.login),
    );
    if (seen.current) {
      const fresh = q.data.users.filter(
        (c) => c.stream && !seen.current!.has(c.login),
      );
      if (fresh.length)
        a.setNotices((v) =>
          [
            ...fresh.map((c) => ({
              id: `${c.login}:${Date.now()}`,
              login: c.login,
              name: c.displayName,
              time: Date.now(),
              read: false,
            })),
            ...v,
          ].slice(0, 100),
        );
    }
    seen.current = now;
  }, [q.data]);
  return null;
}
export function App() {
  const a = useApp(),
    loc = useLocation(),
    nav = useNavigate();
  const minimal = ["/welcome", "/interests", "/login"].includes(loc.pathname);
  const watching = loc.pathname.startsWith("/watch/");
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [loc.pathname]);
  useEffect(() => {
    if (!a.onboarded && loc.pathname === "/")
      nav("/welcome", { replace: true });
  }, []);
  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Aller au contenu
      </a>
      {!online && (
        <div className="network-banner">
          <WifiOff size={16} />
          Tu es hors connexion. Tes favoris restent disponibles.
        </div>
      )}
      {!native && (
        <div className="preview-banner">
          Aperçu navigateur · Les services Twitch nécessitent l’application
          FLUX.
        </div>
      )}
      <div
        className={`app-shell ${watching ? "watching" : ""} ${minimal ? "minimal" : ""}`}
      >
        <aside className="desktop-sidebar">
          <Link className="wordmark" to="/">
            FLUX
            <span />
          </Link>
          <p>Le direct, autrement.</p>
          <Navigation />
          <div className="sidebar-bottom">
            <Link to="/studio">Studio créateur</Link>
            <Link to="/settings">Réglages</Link>
            <Link to="/help">À propos de FLUX</Link>
          </div>
        </aside>
        <main id="main" className="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/game/:slug" element={<GamePage />} />
            <Route path="/following" element={<Following />} />
            <Route path="/channel/:login" element={<ChannelPage />} />
            <Route path="/watch/:login" element={<WatchRoute />} />
            <Route path="/library" element={<Library />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/interests" element={<Interests />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/:section" element={<SettingDetail />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/help" element={<Help />} />
            <Route path="/messages" element={<Messages />} />
            <Route
              path="/support/:login"
              element={<OfficialFlow kind="support" />}
            />
            <Route
              path="/report/:login"
              element={<OfficialFlow kind="report" />}
            />
            {[
              "signup",
              "recovery",
              "security",
              "subscriptions",
              "delete-account",
            ].map((k) => (
              <Route
                key={k}
                path={`/${k}`}
                element={<OfficialFlow kind={k} />}
              />
            ))}
            <Route path="/studio" element={<Studio />} />
            <Route path="/studio/prepare" element={<Prepare />} />
            <Route path="/studio/moderation" element={<Moderation />} />
            {["analytics", "revenue", "broadcast"].map((k) => (
              <Route
                key={k}
                path={`/studio/${k}`}
                element={<StudioExternal kind={k} />}
              />
            ))}
            <Route
              path="*"
              element={
                <Empty
                  title="Cette page a filé"
                  body="Retrouve ton chemin vers les directs."
                  action={
                    <Link className="primary" to="/">
                      Retour à l’accueil
                    </Link>
                  }
                />
              }
            />
          </Routes>
        </main>
        <Player />
      </div>
      {!minimal && !watching && (
        <nav className="floating-nav glass" aria-label="Navigation principale">
          <Navigation />
        </nav>
      )}
      {watching && !a.media && (
        <button
          className="watch-back icon-btn glass"
          aria-label="Retour"
          onClick={() => nav(-1)}
        >
          <ArrowLeft />
        </button>
      )}
      {a.toast && (
        <div className="toast glass" role="status">
          <span>{a.toast}</span>
          <button
            className="icon-btn"
            aria-label="Fermer la notification"
            onClick={() => a.notify("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <LiveNotices />
    </>
  );
}
function Navigation() {
  return (
    <>
      {[
        { to: "/", label: "Accueil", Icon: HomeIcon },
        { to: "/explore", label: "Explorer", Icon: Compass },
        { to: "/following", label: "Suivis", Icon: Heart },
        { to: "/profile", label: "Profil", Icon: UserRound },
      ].map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <span>
            <Icon size={21} />
          </span>
          <small>{label}</small>
        </NavLink>
      ))}
    </>
  );
}
