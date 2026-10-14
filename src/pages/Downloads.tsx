import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { convertFileSrc } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useNavigate } from "react-router-dom";
import { Play, Trash2, Download as DownloadIcon, X } from "lucide-react";
import { command, errorText, native } from "../api";
import { useApp } from "../state";
import { PageTitle, Loading, ErrorState, Empty } from "../components";
interface Download {
  id: string;
  title: string;
  channel: string;
  filename: string;
  bytes: number;
}
interface Progress {
  id: string;
  done: number;
  total: number;
  bytes: number;
}
export function DownloadsPage() {
  const a = useApp(),
    nav = useNavigate();
  const [active, setActive] = useState<Record<string, Progress>>({});
  const q = useQuery({
    queryKey: ["downloads"],
    queryFn: () => command<Download[]>("download_list"),
    refetchInterval: 5000,
  });
  useEffect(() => {
    if (!native) return;
    let cleanup: (() => void) | undefined;
    let disposed = false;
    listen<Progress>("download-progress", (e) => {
      setActive((v) => ({ ...v, [e.payload.id]: e.payload }));
    }).then((f) => {
      if (disposed) f();
      else cleanup = f;
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);
  async function play(d: Download) {
    try {
      const path = await command<string>("download_path", {
        id: d.id,
        filename: d.filename,
      });
      a.play({
        id: d.id,
        kind: d.filename.endsWith(".mp4") ? "clip" : "video",
        title: d.title,
        poster: "/images/gaming.jpg",
        channel: {
          id: "",
          login: d.channel,
          displayName: d.channel,
          profileImageURL: "",
        },
        localUrl: convertFileSrc(path),
      });
      nav(`/watch/${d.channel}`);
    } catch (e) {
      a.notify(errorText(e));
    }
  }
  async function remove(d: Download) {
    if (!confirm(`Supprimer « ${d.title} » de cet appareil ?`)) return;
    try {
      await command("download_remove", { id: d.id });
      q.refetch();
    } catch (e) {
      a.notify(errorText(e));
    }
  }
  return (
    <>
      <PageTitle
        title="Hors connexion"
        subtitle="Tes moments, même sans réseau."
        back
      />
      {Object.values(active)
        .filter((p) => !q.data?.some((d) => d.id === p.id))
        .map((p) => (
          <div className="download-row panel" key={p.id}>
            <DownloadIcon />
            <div>
              <strong>Téléchargement en cours</strong>
              <progress value={p.done} max={p.total} />
              <small>
                {p.done}/{p.total} · {(p.bytes / 1048576).toFixed(1)} Mo
              </small>
            </div>
            <button
              className="icon-btn"
              aria-label="Annuler le téléchargement"
              onClick={() => {
                command("download_cancel", { id: p.id }).catch((e) =>
                  a.notify(errorText(e)),
                );
                setActive((v) => {
                  const n = { ...v };
                  delete n[p.id];
                  return n;
                });
              }}
            >
              <X />
            </button>
          </div>
        ))}
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => q.refetch()} />
      ) : q.data?.length ? (
        <div className="panel">
          {q.data.map((d) => (
            <div className="download-row" key={d.id}>
              <button
                className="icon-btn"
                aria-label={`Lire ${d.title}`}
                onClick={() => play(d)}
              >
                <Play />
              </button>
              <div>
                <strong>{d.title}</strong>
                <small>
                  {d.channel} · {(d.bytes / 1048576).toFixed(1)} Mo
                </small>
              </div>
              <button
                className="icon-btn danger"
                aria-label={`Supprimer ${d.title}`}
                onClick={() => remove(d)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="Emporte tes meilleurs moments"
          body="Depuis un replay terminé ou un clip, ouvre les options du lecteur puis Télécharger. Garde FLUX ouvert pendant le transfert."
        />
      )}
      <p className="footnote">
        Les fichiers restent dans le stockage privé de FLUX et sont supprimés
        lors de sa désinstallation. La qualité la plus légère au-dessus de 500
        kb/s est choisie pour les replays.
      </p>
    </>
  );
}
