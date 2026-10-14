import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  defaultSettings,
  type Channel,
  type Media,
  type Notice,
  type Settings,
  type User,
} from "./types";
import { command, errorText } from "./api";
import { restore } from "./storage";
function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(`flux.${key}`);
    return value ? restore(key, JSON.parse(value), fallback) : fallback;
  } catch {
    return fallback;
  }
}
function useSaved<T>(key: string, fallback: T) {
  const [v, set] = useState<T>(() => read(key, fallback));
  useEffect(() => {
    try {
      localStorage.setItem(`flux.${key}`, JSON.stringify(v));
    } catch {
      /* Storage unavailable: current session remains usable. */
    }
  }, [key, v]);
  return [v, set] as const;
}
function useStore() {
  const [settings, setSettings] = useSaved<Settings>(
    "settings",
    defaultSettings,
  );
  const [follows, setFollows] = useSaved<Channel[]>("follows", []);
  const [history, setHistory] = useSaved<
    (Media & { time: number; position: number })[]
  >("history", []);
  const [bookmarks, setBookmarks] = useSaved<Media[]>("bookmarks", []);
  const [notices, setNotices] = useSaved<Notice[]>("notices", []);
  const [interests, setInterests] = useSaved<string[]>("interests", []);
  const [onboarded, setOnboarded] = useSaved<boolean>("onboarded", false);
  const [user, setUser] = useState<User | null>(null);
  const [vaultExists, setVaultExists] = useState(false);
  const [media, setMedia] = useState<Media | null>(null);
  const [audioOnly, setAudioOnly] = useState(false);
  const [toast, setToast] = useState("");
  const notify = useCallback((s: string) => setToast(s), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    command<{ user: User | null; vault_exists: boolean }>("session_status")
      .then((v) => {
        setUser(v.user);
        setVaultExists(v.vault_exists);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "high-contrast",
      settings.contrast,
    );
    document.documentElement.classList.toggle(
      "reduce-motion",
      settings.reduceMotion,
    );
  }, [settings.contrast, settings.reduceMotion]);
  const updateSettings = (patch: Partial<Settings>) =>
    setSettings((v) => ({ ...v, ...patch }));
  const follow = (c: Channel) =>
    setFollows((v) =>
      v.some((x) => x.login === c.login)
        ? v.filter((x) => x.login !== c.login)
        : [
            {
              id: c.id,
              login: c.login,
              displayName: c.displayName,
              profileImageURL: c.profileImageURL,
            },
            ...v,
          ].slice(0, 200),
    );
  const play = (m: Media) => {
    setMedia(m);
    setAudioOnly(false);
    setHistory((v) =>
      [
        {
          ...m,
          time: Date.now(),
          position:
            v.find((x) => x.id === m.id && x.kind === m.kind)?.position ?? 0,
        },
        ...v.filter((x) => x.id !== m.id || x.kind !== m.kind),
      ].slice(0, 100),
    );
  };
  const bookmark = (m: Media) =>
    setBookmarks((v) =>
      v.some((x) => x.id === m.id && x.kind === m.kind)
        ? v.filter((x) => x.id !== m.id || x.kind !== m.kind)
        : [m, ...v].slice(0, 100),
    );
  const logout = async () => {
    try {
      await command("logout");
      setUser(null);
      setVaultExists(false);
      notify("Compte déconnecté.");
    } catch (e) {
      notify(errorText(e));
    }
  };
  return {
    settings,
    updateSettings,
    follows,
    follow,
    setFollows,
    history,
    setHistory,
    bookmarks,
    bookmark,
    notices,
    setNotices,
    interests,
    setInterests,
    onboarded,
    setOnboarded,
    user,
    setUser,
    vaultExists,
    setVaultExists,
    media,
    setMedia,
    play,
    audioOnly,
    setAudioOnly,
    toast,
    notify,
    logout,
  };
}
const Store = createContext<ReturnType<typeof useStore> | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  return <Store.Provider value={useStore()}>{children}</Store.Provider>;
}
export function useApp() {
  const v = useContext(Store);
  if (!v) throw new Error("Store missing");
  return v;
}
