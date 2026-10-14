import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Video, BarChart3, Clapperboard, Shield, Wallet } from "lucide-react";
import { account, errorText } from "../api";
import { useApp } from "../state";
import {
  PageTitle,
  Row,
  ServiceLink,
  Empty,
  Loading,
  ErrorState,
} from "../components";
export function Studio() {
  const a = useApp();
  return (
    <>
      <PageTitle
        title="Ton studio"
        subtitle="Prépare le prochain moment."
        back
      />
      <div className="studio-hero glass">
        <Video size={30} />
        <h2>À toi d’entrer en scène.</h2>
        <p>
          Prépare ta chaîne, retrouve tes contenus et échange avec ta
          communauté.
        </p>
        <Link className="primary" to="/studio/prepare">
          Préparer mon direct
        </Link>
      </div>
      <div className="panel">
        <Row
          title="Mes contenus"
          detail="Replays et clips"
          to={a.user ? `/channel/${a.user.login}` : "/login"}
          icon={<Clapperboard />}
        />
        <Row
          title="Modération"
          detail="Actions sur le chat"
          to="/studio/moderation"
          icon={<Shield />}
        />
        <Row
          title="Statistiques"
          detail="Tableau de bord Twitch"
          to="/studio/analytics"
          icon={<BarChart3 />}
        />
        <Row
          title="Revenus"
          detail="Monétisation et versements"
          to="/studio/revenue"
          icon={<Wallet />}
        />
      </div>
    </>
  );
}
export function Prepare() {
  const a = useApp();
  const q = useQuery({
    queryKey: ["my-channel", a.user?.user_id],
    enabled: !!a.user,
    queryFn: () =>
      account<{
        data: {
          title: string;
          game_id: string;
          broadcaster_language: string;
        }[];
      }>("channel_info"),
  });
  const [title, setTitle] = useState<string | null>(null),
    [game, setGame] = useState<string | null>(null),
    [language, setLanguage] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await account("update_channel", {
        title: title ?? q.data?.data[0]?.title ?? "",
        game_id: game ?? q.data?.data[0]?.game_id ?? "",
        language: language ?? q.data?.data[0]?.broadcaster_language ?? "fr",
      });
      a.notify("Informations du direct enregistrées sur Twitch.");
    } catch (err) {
      a.notify(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle title="Préparer mon direct" back />
      {!a.user ? (
        <Empty
          title="La scène t’attend"
          body="Connecte ton compte Twitch pour modifier les informations de ta chaîne."
          action={
            <Link className="primary" to="/login">
              Se connecter
            </Link>
          }
        />
      ) : q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => q.refetch()} />
      ) : (
        <form className="form-panel" onSubmit={submit}>
          <label>
            Titre du direct
            <input
              value={title ?? q.data?.data[0]?.title ?? ""}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              required
            />
          </label>
          <label>
            Identifiant de catégorie Twitch
            <input
              value={game ?? q.data?.data[0]?.game_id ?? ""}
              onChange={(e) => setGame(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
            />
          </label>
          <label>
            Langue
            <select
              value={language ?? q.data?.data[0]?.broadcaster_language ?? "fr"}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
            </select>
          </label>
          <button className="primary full" disabled={busy}>
            Enregistrer sur Twitch
          </button>
        </form>
      )}
      <ServiceLink
        title="Lancer la diffusion"
        body="La capture caméra, le micro et l’envoi vidéo sont assurés par ton logiciel de diffusion ou l’application Twitch. Retrouve les commandes de ton direct dans le tableau de bord."
        url="https://dashboard.twitch.tv/"
        button="Ouvrir mon tableau de bord"
      />
    </>
  );
}
export function StudioExternal({ kind }: { kind: string }) {
  const a = useApp();
  const login = a.user?.login;
  const data: Record<string, [string, string, string]> = {
    analytics: [
      "Statistiques",
      "Retrouve les mesures d’audience et le bilan de tes directs.",
      `https://dashboard.twitch.tv/u/${login || ""}/analytics/overview`,
    ],
    revenue: [
      "Revenus",
      "Consulte les revenus, seuils de paiement et versements de ta chaîne.",
      `https://dashboard.twitch.tv/u/${login || ""}/analytics/revenue`,
    ],
    broadcast: [
      "Diffusion",
      "Gère le direct et les outils de diffusion depuis Twitch.",
      "https://dashboard.twitch.tv/",
    ],
  };
  const [title, body, url] = data[kind] || data.broadcast;
  return (
    <>
      <PageTitle title={title} back />
      <ServiceLink title={title} body={body} url={url} />
    </>
  );
}
export function Moderation() {
  const a = useApp();
  const [userId, setUserId] = useState(""),
    [reason, setReason] = useState(""),
    [duration, setDuration] = useState("600"),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!a.user) return;
    if (
      !confirm(
        `Confirmer ${duration === "permanent" ? "le bannissement" : "l’exclusion temporaire"} de cet utilisateur ?`,
      )
    )
      return;
    setBusy(true);
    try {
      await account("ban", {
        broadcaster_id: a.user.user_id,
        user_id: userId,
        duration: duration === "permanent" ? null : Number(duration),
        reason,
      });
      a.notify("Action de modération appliquée.");
      setUserId("");
    } catch (err) {
      a.notify(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle title="Modération" back />
      {!a.user ? (
        <Empty
          title="Connecte ton compte"
          body="Les actions de modération nécessitent une autorisation Twitch."
          action={
            <Link className="primary" to="/login">
              Se connecter
            </Link>
          }
        />
      ) : (
        <form className="form-panel" onSubmit={submit}>
          <p>
            Appliquer une action sur ta chaîne <strong>{a.user.login}</strong>.
          </p>
          <label>
            Identifiant Twitch de l’utilisateur
            <input
              inputMode="numeric"
              pattern="[0-9]+"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </label>
          <label>
            Action
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="60">Exclure 1 minute</option>
              <option value="600">Exclure 10 minutes</option>
              <option value="86400">Exclure 24 heures</option>
              <option value="permanent">Bannir définitivement</option>
            </select>
          </label>
          <label>
            Motif
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
          </label>
          <button className="primary" disabled={busy}>
            Appliquer l’action
          </button>
        </form>
      )}
      <ServiceLink
        title="Tous les outils de modération"
        body="Retrouve la file d’attente, les messages et les réglages du chat sur Twitch."
        url={`https://www.twitch.tv/moderator/${a.user?.login || ""}`}
      />
    </>
  );
}
