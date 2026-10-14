import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Palette,
  Play,
  Shield,
  Bell,
  HelpCircle,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import { useApp } from "../state";
import { PageTitle, Row, Toggle, ServiceLink, Empty } from "../components";
import { external, errorText } from "../api";

export function SettingsPage() {
  return (
    <>
      <PageTitle
        title="À ta façon"
        subtitle="Un espace qui te ressemble."
        back
      />
      <div className="panel">
        <Row
          title="Lecture et données"
          detail="Langue, qualité, latence"
          to="/settings/playback"
          icon={<Play />}
        />
        <Row
          title="Apparence et accessibilité"
          detail="Contraste, mouvement, chat"
          to="/settings/appearance"
          icon={<Palette />}
        />
        <Row
          title="Notifications"
          detail="Les directs de tes favoris"
          to="/settings/notifications"
          icon={<Bell />}
        />
        <Row
          title="Confidentialité"
          detail="Tes données sur cet appareil"
          to="/settings/privacy"
          icon={<Shield />}
        />
        <Row
          title="Connexion Twitch"
          detail="Client ID de l’application"
          to="/settings/connection"
          icon={<SlidersHorizontal />}
        />
        <Row title="Aide et à propos" to="/help" icon={<HelpCircle />} />
      </div>
    </>
  );
}
export function SettingDetail() {
  const { section } = useParams();
  const a = useApp(),
    s = a.settings;
  const titles: Record<string, string> = {
    playback: "Lecture et données",
    appearance: "Apparence",
    notifications: "Notifications",
    privacy: "Confidentialité",
    connection: "Connexion Twitch",
  };
  return (
    <>
      <PageTitle title={titles[section || ""] || "Réglages"} back />
      <div className="panel settings-panel">
        {section === "playback" && (
          <>
            <label>
              Langue des directs
              <select
                value={s.language}
                onChange={(e) => a.updateSettings({ language: e.target.value })}
              >
                <option value="">Toutes les langues</option>
                {[
                  ["FR", "Français"],
                  ["EN", "English"],
                  ["ES", "Español"],
                  ["DE", "Deutsch"],
                  ["JA", "日本語"],
                  ["KO", "한국어"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <Toggle
              label="Lecture automatique"
              checked={s.autoplay}
              onChange={(autoplay) => a.updateSettings({ autoplay })}
            />
            <Toggle
              label="Faible latence"
              description="S’applique au prochain direct ouvert."
              checked={s.lowLatency}
              onChange={(lowLatency) => a.updateSettings({ lowLatency })}
            />
            <Toggle
              label="Démarrer sans le son"
              checked={s.muted}
              onChange={(muted) => a.updateSettings({ muted })}
            />
            <p className="footnote">
              La qualité vidéo se choisit dans les options du lecteur. Le mode
              Audio utilise la piste audio dédiée lorsqu’elle est disponible.
            </p>
          </>
        )}
        {section === "appearance" && (
          <>
            <Toggle
              label="Contraste renforcé"
              description="Remplace les surfaces de verre par des fonds opaques."
              checked={s.contrast}
              onChange={(contrast) => a.updateSettings({ contrast })}
            />
            <Toggle
              label="Réduire les mouvements"
              checked={s.reduceMotion}
              onChange={(reduceMotion) => a.updateSettings({ reduceMotion })}
            />
            <Toggle
              label="Emotes Twitch, BTTV et 7TV"
              checked={s.emotes}
              onChange={(emotes) => a.updateSettings({ emotes })}
            />
            <label>
              Taille du texte du chat : {s.chatSize}px
              <input
                type="range"
                min={13}
                max={22}
                value={s.chatSize}
                onChange={(e) =>
                  a.updateSettings({ chatSize: Number(e.target.value) })
                }
              />
            </label>
            <div
              className="chat-example glass"
              style={{ fontSize: s.chatSize }}
            >
              <strong className="mint">Nova</strong> : On est bien ici ✨
            </div>
          </>
        )}
        {section === "notifications" && (
          <>
            <Toggle
              label="Signaler les nouveaux directs"
              description="Notifications dans FLUX pendant que l’application est ouverte."
              checked={s.notifications}
              onChange={(notifications) => a.updateSettings({ notifications })}
            />
            <p className="footnote">
              FLUX vérifie tes favoris toutes les deux minutes quand
              l’application est visible. Cette version ne propose pas de
              notifications système en arrière-plan.
            </p>
            <Link className="secondary" to="/notifications">
              Voir mes notifications
            </Link>
          </>
        )}
        {section === "privacy" && (
          <>
            <p>
              Les favoris, préférences, marque-pages et historiques sont
              enregistrés sur cet appareil. Aucun service d’analytique FLUX
              n’est intégré.
            </p>
            <p>
              Twitch et les fournisseurs d’emotes reçoivent les requêtes
              nécessaires au fonctionnement du lecteur et du chat.
            </p>
            <button
              className="secondary full"
              onClick={() => {
                if (
                  confirm(
                    "Supprimer l’historique et les notifications de cet appareil ?",
                  )
                ) {
                  a.setHistory([]);
                  a.setNotices([]);
                  a.notify("Historique et notifications supprimés.");
                }
              }}
            >
              Effacer historique et notifications
            </button>
            <Link className="secondary full" to="/account">
              Gérer le coffre et la connexion
            </Link>
          </>
        )}
        {section === "connection" && (
          <>
            <label>
              Client ID Twitch public
              <input
                value={s.clientId}
                maxLength={80}
                onChange={(e) =>
                  a.updateSettings({ clientId: e.target.value.trim() })
                }
                placeholder="Client ID"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <p>
              Utilise une application Twitch de type Public pour l’autorisation
              par code. Ne saisis jamais de secret client.
            </p>
            <Link className="primary" to="/login">
              Connecter Twitch
            </Link>
          </>
        )}
      </div>
    </>
  );
}
export function Notifications() {
  const a = useApp();
  return (
    <>
      <PageTitle
        title="Quoi de neuf ?"
        subtitle="Tes créateurs entrent en scène."
        back
      />
      {a.notices.length ? (
        <>
          <button
            className="text-button"
            onClick={() =>
              a.setNotices((v) => v.map((n) => ({ ...n, read: true })))
            }
          >
            Tout marquer comme lu
          </button>
          <div className="panel">
            {a.notices.map((n) => (
              <Link
                className={`notification-row ${n.read ? "" : "unread"}`}
                key={n.id}
                to={`/channel/${n.login}`}
                onClick={() =>
                  a.setNotices((v) =>
                    v.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
                  )
                }
              >
                <span className="notification-icon">
                  <Bell size={20} />
                </span>
                <span>
                  <strong>{n.name} est en direct</strong>
                  <small>
                    {new Date(n.time).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </small>
                </span>
                <span className="live-dot" />
              </Link>
            ))}
          </div>
        </>
      ) : (
        <Empty
          title="Tout est calme ici"
          body="Les nouveaux directs de tes favoris apparaîtront ici pendant que FLUX est ouvert."
          action={
            <Link className="primary" to="/following">
              Mes chaînes
            </Link>
          }
        />
      )}
    </>
  );
}
export function Help() {
  const a = useApp();
  return (
    <>
      <PageTitle title="On est là pour toi" back />
      <div className="help-intro glass">
        <span className="wordmark">
          FLUX
          <span />
        </span>
        <p>
          Un client Twitch indépendant.
          <br />
          Le direct, autrement.
        </p>
        <span className="version">Version 0.1.0 · AGPL-3.0</span>
      </div>
      <div className="panel faq">
        {[
          [
            "Pourquoi le lecteur ne fonctionne pas ?",
            "Certains contenus nécessitent un abonnement ou une vérification Twitch. Les interfaces publiques non documentées peuvent évoluer. Réessaie, puis ouvre la chaîne sur Twitch si nécessaire.",
          ],
          [
            "Mes favoris sont-ils synchronisés ?",
            "Les favoris FLUX restent sur cet appareil. Tu peux importer tes suivis Twitch depuis Mon compte. Ajouter un favori FLUX ne modifie pas ton compte Twitch.",
          ],
          [
            "Comment conserver ma connexion ?",
            "Après connexion, crée ton coffre dans Mon compte. Son mot de passe protège ta session chiffrée sur le disque. Il n’est pas récupérable ; reconnecte Twitch si tu l’oublies.",
          ],
          [
            "Comment diffuser depuis FLUX ?",
            "Le studio permet de préparer le titre et la catégorie de ta chaîne. La capture caméra et l’envoi RTMP sont confiés à Twitch ou à ton logiciel de diffusion.",
          ],
          [
            "D’où vient ce projet ?",
            "FLUX réinterprète Xtra en Rust/Tauri avec un design mobile original. Les requêtes GraphQL de Xtra sont reprises sous AGPL-3.0. Twitch, BTTV et 7TV restent des services tiers.",
          ],
        ].map(([q, r]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{r}</p>
          </details>
        ))}
      </div>
      <button
        className="secondary full"
        onClick={() =>
          external("https://github.com/azksama/flux").catch((e) =>
            a.notify(errorText(e)),
          )
        }
      >
        Code source et problèmes
        <ExternalLink size={16} />
      </button>
    </>
  );
}
export function OfficialFlow({ kind }: { kind: string }) {
  const { login } = useParams();
  const flows: Record<string, [string, string, string]> = {
    signup: [
      "Créer un compte",
      "Crée ton compte directement sur Twitch, puis connecte-le à FLUX.",
      "https://www.twitch.tv/signup",
    ],
    recovery: [
      "Retrouver ton compte",
      "Twitch t’accompagne pour récupérer ton identifiant ou réinitialiser ton mot de passe.",
      "https://www.twitch.tv/user/account-recovery",
    ],
    security: [
      "Protéger ton compte",
      "Gère ton e-mail, ton mot de passe et la double authentification dans l’espace sécurisé Twitch.",
      "https://www.twitch.tv/settings/security",
    ],
    subscriptions: [
      "Mes abonnements",
      "Retrouve tes abonnements, renouvellements et factures dans ton compte Twitch.",
      "https://www.twitch.tv/subscriptions",
    ],
    "delete-account": [
      "Supprimer mon compte Twitch",
      "Cette action est gérée par Twitch. Déconnecter FLUX ne supprime pas ton compte Twitch.",
      "https://www.twitch.tv/user/delete-account",
    ],
    support: [
      `Soutenir ${login || "une chaîne"}`,
      "Les prix, abonnements offerts et paiements sont présentés et traités par Twitch. FLUX ne recueille aucune donnée bancaire.",
      `https://www.twitch.tv/subs/${login || ""}`,
    ],
    report: [
      "Signaler un contenu",
      "Ouvre la chaîne puis son menu Signaler. Twitch examinera ton signalement.",
      `https://www.twitch.tv/${login || ""}`,
    ],
  };
  const f = flows[kind] || flows.security;
  return (
    <>
      <PageTitle title={f[0]} back />
      <ServiceLink title={f[0]} body={f[1]} url={f[2]} />
    </>
  );
}
export function Messages() {
  const [target, setTarget] = useState("");
  return (
    <>
      <PageTitle title="Messages privés" back />
      <ServiceLink
        title="Garder le lien"
        body="Retrouve tes conversations et l’historique de tes messages privés sur Twitch."
        url="https://www.twitch.tv/directory"
      />
      <label>
        Ouvrir la chaîne d’un destinataire
        <input
          value={target}
          maxLength={25}
          onChange={(e) =>
            setTarget(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
          }
          placeholder="Nom d’utilisateur"
        />
      </label>
      {target && (
        <Link className="secondary full" to={`/channel/${target}`}>
          Voir {target}
        </Link>
      )}
      <p className="footnote">
        L’API Twitch publique ne permet pas à FLUX de lire l’historique des
        conversations privées.
      </p>
    </>
  );
}
