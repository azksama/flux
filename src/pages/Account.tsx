import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Heart,
  Settings,
  Shield,
  LogOut,
  Video,
  MessageCircle,
  LockKeyhole,
  Check,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../state";
import { command, account, errorText, external } from "../api";
import type { User, Channel } from "../types";
import {
  PageTitle,
  Row,
  ServiceLink,
  ErrorState,
  Loading,
  Empty,
} from "../components";

export function Welcome() {
  const a = useApp(),
    nav = useNavigate();
  return (
    <div className="welcome">
      <div className="welcome-collage">
        <img src="/images/gaming.jpg" alt="" />
        <img src="/images/irl.jpg" alt="" />
        <img src="/images/music.jpg" alt="" />
        <span className="welcome-glass glass">
          <span className="live-dot" />
          Le direct nous rassemble.
        </span>
      </div>
      <span className="wordmark">
        FLUX
        <span />
      </span>
      <h1>
        Le direct.
        <br />
        Les autres.
        <br />
        <em>Et toi.</em>
      </h1>
      <p>
        Retrouve tes créateurs, découvre de nouvelles voix et vis chaque moment.
      </p>
      <button className="primary full" onClick={() => nav("/interests")}>
        Trouver mon univers
        <ArrowUpRight size={18} />
      </button>
      <button
        className="text-button"
        onClick={() => {
          a.setOnboarded(true);
          nav("/");
        }}
      >
        Explorer librement
      </button>
      <p className="footnote">
        Client indépendant pour Twitch. Aucune affiliation avec Twitch.
      </p>
    </div>
  );
}
export function Interests() {
  const a = useApp(),
    nav = useNavigate();
  const choices = [
    "Gaming",
    "IRL",
    "Musique",
    "Création",
    "Esport",
    "Discussion",
  ];
  return (
    <>
      <PageTitle
        title="Ça commence par toi."
        subtitle="Choisis les univers qui te ressemblent."
        back
      />
      <div className="interest-grid">
        {choices.map((v, i) => (
          <button
            key={v}
            className={a.interests.includes(v) ? "chosen" : ""}
            onClick={() =>
              a.setInterests((s) =>
                s.includes(v) ? s.filter((x) => x !== v) : [...s, v],
              )
            }
          >
            <img
              src={`/images/${["gaming", "irl", "music", "food"][i % 4]}.jpg`}
              alt=""
            />
            <strong>{v}</strong>
            {a.interests.includes(v) && <Check />}
          </button>
        ))}
      </div>
      <button
        className="primary full"
        onClick={() => {
          a.setOnboarded(true);
          nav("/");
        }}
      >
        C’est parti
        <ArrowUpRight size={18} />
      </button>
      <p className="footnote">Ces préférences restent sur ton appareil.</p>
    </>
  );
}
interface Device {
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}
export function Login() {
  const a = useApp(),
    nav = useNavigate();
  const [clientId, setClientId] = useState(a.settings.clientId),
    [device, setDevice] = useState<Device | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [password, setPassword] = useState("");
  useEffect(() => {
    if (!device) return;
    let disposed = false;
    const timer = setInterval(async () => {
      try {
        const r = await command<{ pending?: boolean; user?: User }>(
          "auth_poll",
        );
        if (!disposed && r.user) {
          a.setUser(r.user);
          a.setOnboarded(true);
          setDevice(null);
          nav("/account");
          a.notify("Bienvenue dans FLUX.");
        }
      } catch (e) {
        if (!disposed) {
          setError(errorText(e));
          setDevice(null);
        }
      }
    }, device.interval * 1000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [device]);
  useEffect(
    () => () => {
      command("auth_cancel").catch(() => {});
    },
    [],
  );
  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      a.updateSettings({ clientId: clientId.trim() });
      setDevice(
        await command<Device>("auth_begin", { clientId: clientId.trim() }),
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await command<User>("vault_unlock", { password });
      setPassword("");
      a.setUser(user);
      nav("/profile");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="Heureux de te retrouver."
        subtitle="Ton compte Twitch, ton univers."
        back
      />
      {a.user ? (
        <ServiceLink
          title={`Connecté : ${a.user.login}`}
          body="Tu peux gérer ta session dans les réglages du compte."
          url="https://www.twitch.tv/settings/security"
        />
      ) : device ? (
        <div className="auth-card glass">
          <LockKeyhole size={32} />
          <h2>Autorise FLUX sur Twitch</h2>
          <p>
            Saisis ce code sur la page Twitch. Reviens ici après l’autorisation.
          </p>
          <strong className="device-code">{device.user_code}</strong>
          <button
            className="primary full"
            onClick={() =>
              external(device.verification_uri).catch((e) =>
                setError(errorText(e)),
              )
            }
          >
            Ouvrir Twitch
            <ExternalLink size={17} />
          </button>
          <p role="status">En attente de ton autorisation…</p>
          <button
            className="text-button"
            onClick={() => {
              setDevice(null);
              command("auth_cancel").catch(() => {});
            }}
          >
            Annuler
          </button>
        </div>
      ) : (
        <>
          {a.vaultExists && (
            <form className="form-panel glass" onSubmit={unlock}>
              <LockKeyhole />
              <h2>Déverrouiller ton compte</h2>
              <label>
                Mot de passe du coffre
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <button className="primary full" disabled={busy}>
                Déverrouiller
              </button>
            </form>
          )}
          <form className="form-panel" onSubmit={start}>
            <h2>Connexion avec Twitch</h2>
            <p>
              FLUX utilise la page d’autorisation de Twitch. Ton mot de passe
              Twitch ne transite jamais par l’application.
            </p>
            <label>
              Client ID de l’application Twitch
              <input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Client ID public"
                required
                minLength={10}
                maxLength={80}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <button className="primary full" disabled={busy}>
              {busy ? "Connexion…" : "Continuer avec Twitch"}
              <ArrowUpRight size={18} />
            </button>
            <details>
              <summary>Où trouver le Client ID ?</summary>
              <p>
                Enregistre une application de type Public dans la console
                développeur Twitch. Colle son Client ID ici. Aucun secret client
                n’est nécessaire.
              </p>
              <button
                className="text-button"
                type="button"
                onClick={() =>
                  external("https://dev.twitch.tv/console/apps").catch((e) =>
                    setError(errorText(e)),
                  )
                }
              >
                Ouvrir la console Twitch
                <ExternalLink size={14} />
              </button>
            </details>
          </form>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="auth-links">
        <Link to="/signup">Créer un compte Twitch</Link>
        <Link to="/recovery">Compte inaccessible ?</Link>
      </div>
    </>
  );
}
export function Profile() {
  const a = useApp();
  return (
    <>
      <PageTitle
        title="Ton espace"
        action={
          <Link to="/settings" className="icon-btn" aria-label="Réglages">
            <Settings />
          </Link>
        }
      />
      <div className="profile-hero glass">
        <div className="profile-avatar">
          {a.user?.login[0]?.toUpperCase() || "F"}
        </div>
        <h1>{a.user?.login || "Bienvenue chez toi."}</h1>
        <p>
          {a.user
            ? "Ton univers, à ta façon."
            : "Le meilleur du direct n’attend que toi."}
        </p>
        {!a.user && (
          <Link className="primary" to="/login">
            Se connecter
            <ArrowUpRight size={17} />
          </Link>
        )}
        <div className="profile-stats">
          <div>
            <strong>{a.follows.length}</strong>
            <small>favoris</small>
          </div>
          <div>
            <strong>{a.bookmarks.length}</strong>
            <small>enregistrés</small>
          </div>
          <div>
            <strong>{a.history.length}</strong>
            <small>moments vus</small>
          </div>
        </div>
      </div>
      <div className="panel">
        <Row
          title="Ma bibliothèque"
          detail="Historique et moments enregistrés"
          to="/library"
          icon={<BookOpen />}
        />
        <Row
          title="Téléchargements"
          detail="Replays et clips hors connexion"
          to="/downloads"
          icon={<BookOpen />}
        />
        <Row
          title="Mes chaînes"
          detail="Retrouver mes créateurs"
          to="/following"
          icon={<Heart />}
        />
        <Row
          title="Mon compte"
          detail="Connexion et sécurité"
          to="/account"
          icon={<Shield />}
        />
        <Row
          title="Studio créateur"
          detail="Préparer et gérer ta chaîne"
          to="/studio"
          icon={<Video />}
        />
        <Row title="Messages privés" to="/messages" icon={<MessageCircle />} />
        <Row title="Réglages" to="/settings" icon={<Settings />} />
      </div>
      {a.user && (
        <button className="text-button danger" onClick={() => a.logout()}>
          <LogOut size={17} />
          Se déconnecter
        </button>
      )}
      <p className="footnote">FLUX 0.1.0 · Indépendant, ouvert, à tes côtés.</p>
    </>
  );
}
export function AccountPage() {
  const a = useApp();
  const [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false);
  const me = useQuery({
    queryKey: ["me", a.user?.user_id],
    enabled: !!a.user,
    queryFn: () =>
      account<{
        data: {
          description: string;
          display_name: string;
          profile_image_url: string;
        }[];
      }>("me"),
  });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await command("vault_save", { password });
      setPassword("");
      a.setVaultExists(true);
      a.notify("Session conservée dans ton coffre chiffré.");
    } catch (err) {
      a.notify(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function importFollows() {
    setBusy(true);
    try {
      let after: string | undefined;
      const channels: Channel[] = [];
      do {
        const r = await account<{
          data: {
            broadcaster_id: string;
            broadcaster_login: string;
            broadcaster_name: string;
          }[];
          pagination: { cursor?: string };
        }>("followed", { after });
        channels.push(
          ...r.data.map((c) => ({
            id: c.broadcaster_id,
            login: c.broadcaster_login,
            displayName: c.broadcaster_name,
            profileImageURL: "",
          })),
        );
        after = r.pagination?.cursor;
      } while (after && channels.length < 200);
      a.setFollows((old) =>
        Array.from(
          new Map([...old, ...channels].map((c) => [c.id, c])).values(),
        ).slice(0, 200),
      );
      a.notify("Tes suivis Twitch ont été importés.");
    } catch (e) {
      a.notify(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle title="Compte et sécurité" back />
      {!a.user ? (
        <Empty
          title="Retrouve ton compte"
          body="Connecte-toi pour importer tes suivis Twitch et participer au chat."
          action={
            <Link className="primary" to="/login">
              Se connecter
            </Link>
          }
        />
      ) : (
        <>
          <div className="panel account-summary">
            <strong>{a.user.login}</strong>
            <span className="mint">Connecté à Twitch</span>
            <p>{me.data?.data[0]?.description}</p>
          </div>
          <button
            className="secondary full"
            onClick={importFollows}
            disabled={busy}
          >
            Importer mes suivis Twitch
          </button>
          <form className="form-panel glass" onSubmit={save}>
            <LockKeyhole />
            <h2>
              {a.vaultExists ? "Actualiser le coffre" : "Garder ma connexion"}
            </h2>
            <p>
              Choisis un mot de passe local pour chiffrer ta session. Il sera
              demandé au prochain lancement. Sans coffre, la session reste en
              mémoire uniquement.
            </p>
            <label>
              Mot de passe du coffre
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={10}
                required
                autoComplete="new-password"
              />
            </label>
            <button className="primary full" disabled={busy}>
              Enregistrer la session
            </button>
          </form>
          <div className="panel">
            <Row title="Modifier mon profil" to="/profile/edit" />
            <Row title="Double authentification" to="/security" />
            <Row title="Mes abonnements" to="/subscriptions" />
            <Row title="Supprimer mon compte" to="/delete-account" />
          </div>
          <button className="text-button danger" onClick={() => a.logout()}>
            Déconnecter et supprimer le coffre
          </button>
        </>
      )}
    </>
  );
}
export function EditProfile() {
  const a = useApp();
  const q = useQuery({
    queryKey: ["me", a.user?.user_id],
    enabled: !!a.user,
    queryFn: () => account<{ data: { description: string }[] }>("me"),
  });
  const [description, setDescription] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await account("update_profile", {
        description: description ?? q.data?.data[0]?.description ?? "",
      });
      a.notify("Description mise à jour sur Twitch.");
    } catch (e) {
      a.notify(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle title="Modifier mon profil" back />
      {!a.user ? (
        <Empty
          title="Connecte-toi d’abord"
          body="Ton profil est lié à ton compte Twitch."
          action={
            <Link to="/login" className="primary">
              Se connecter
            </Link>
          }
        />
      ) : q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} />
      ) : (
        <form className="form-panel" onSubmit={submit}>
          <label>
            À propos de toi
            <textarea
              maxLength={300}
              rows={5}
              value={description ?? q.data?.data[0]?.description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <button className="primary" disabled={busy}>
            Enregistrer
          </button>
        </form>
      )}
      <ServiceLink
        title="Photo et identité"
        body="Twitch gère le nom d’utilisateur, l’adresse e-mail et la photo de profil."
        url="https://www.twitch.tv/settings/profile"
      />
    </>
  );
}
