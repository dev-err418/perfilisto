export type SessionPhoto = {
  id: string;
  name: string;
  dataUrl: string;
};

type Session = {
  photos: SessionPhoto[];
  updatedAt: number;
};

const TTL_MS = 2 * 60 * 60 * 1000;

const globalStore = globalThis as typeof globalThis & {
  __perfilistoUploadSessions?: Map<string, Session>;
};

const sessions: Map<string, Session> =
  (globalStore.__perfilistoUploadSessions ??= new Map<string, Session>());

const prune = () => {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, session] of sessions) {
    if (session.updatedAt < cutoff) sessions.delete(id);
  }
};

export const createUploadSession = () => {
  prune();
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  sessions.set(id, { photos: [], updatedAt: Date.now() });
  return id;
};

export const getUploadSession = (id: string) => {
  prune();
  return sessions.get(id) ?? null;
};

export const mergeUploadSessionPhotos = (id: string, incoming: SessionPhoto[]) => {
  prune();
  const session = sessions.get(id);
  if (!session) return null;
  const existing = new Set(session.photos.map((photo) => photo.id));
  for (const photo of incoming) {
    if (existing.has(photo.id)) continue;
    session.photos.push(photo);
  }
  session.updatedAt = Date.now();
  sessions.set(id, session);
  return session;
};
