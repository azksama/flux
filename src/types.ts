export interface Channel {
  id: string;
  login: string;
  displayName: string;
  profileImageURL: string;
  stream?: Stream | null;
  followers?: { totalCount: number };
  bannerImageURL?: string;
}
export interface Game {
  id: string;
  displayName: string;
  slug: string;
  boxArtURL?: string;
  viewersCount?: number;
}
export interface Stream {
  id: string;
  title?: string;
  viewersCount: number;
  previewImageURL: string;
  broadcaster: Channel & { broadcastSettings?: { title: string } };
  game?: Game;
  createdAt?: string;
  freeformTags?: { name: string }[];
}
export interface Video {
  id: string;
  title: string;
  previewThumbnailURL: string;
  lengthSeconds: number;
  viewCount: number;
  createdAt: string;
  game?: Game;
}
export interface Clip {
  slug: string;
  title: string;
  thumbnailURL: string;
  durationSeconds: number;
  viewCount: number;
}
export interface Connection<T> {
  edges: { node: T; cursor: string }[];
  pageInfo: { hasNextPage: boolean };
}
export interface User {
  login: string;
  user_id: string;
  client_id: string;
}
export interface Media {
  id: string;
  kind: "live" | "video" | "clip";
  title: string;
  channel: Channel;
  poster: string;
  localUrl?: string;
}
export interface Settings {
  language: string;
  quality: number;
  lowLatency: boolean;
  autoplay: boolean;
  muted: boolean;
  reduceMotion: boolean;
  contrast: boolean;
  chatSize: number;
  emotes: boolean;
  clientId: string;
  notifications: boolean;
}
export interface Notice {
  id: string;
  login: string;
  name: string;
  time: number;
  read: boolean;
}
export const defaultSettings: Settings = {
  language: "FR",
  quality: -1,
  lowLatency: true,
  autoplay: true,
  muted: false,
  reduceMotion: false,
  contrast: false,
  chatSize: 14,
  emotes: true,
  clientId: "",
  notifications: true,
};
