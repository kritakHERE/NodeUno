import { AppState, TopicPage } from '../types';
import { sha256Hex } from '../utils';

type JsonValue = any;

const USER_DATA_DIR = 'user-data';
const APP_STATE_FILE = 'app-state.json';
const TOPIC_PAGES_DIR = 'pages';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const pageCache = new Map<string, string>();

const opfsSupported = (): boolean => {
  return typeof navigator !== 'undefined' && !!(navigator.storage as any)?.getDirectory;
};

const getRootDir = async (): Promise<FileSystemDirectoryHandle> => {
  return await (navigator.storage as any).getDirectory();
};

const getOrCreateDir = async (base: FileSystemDirectoryHandle, parts: string[]): Promise<FileSystemDirectoryHandle> => {
  let dir = base;
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part, { create: true });
  }
  return dir;
};

const writeTextFile = async (dir: FileSystemDirectoryHandle, fileName: string, content: string): Promise<void> => {
  const handle = await dir.getFileHandle(fileName, { create: true });
  const writable = await (handle as any).createWritable();
  await writable.write(encoder.encode(content));
  await writable.close();
};

const readTextFile = async (dir: FileSystemDirectoryHandle, fileName: string): Promise<string | null> => {
  try {
    const handle = await dir.getFileHandle(fileName);
    const file = await handle.getFile();
    const buf = await file.arrayBuffer();
    return decoder.decode(buf);
  } catch {
    return null;
  }
};

const writeJsonFile = async (dir: FileSystemDirectoryHandle, fileName: string, data: JsonValue): Promise<void> => {
  await writeTextFile(dir, fileName, JSON.stringify(data));
};

const readJsonFile = async <T>(dir: FileSystemDirectoryHandle, fileName: string): Promise<T | null> => {
  const text = await readTextFile(dir, fileName);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

const pageHashToPathParts = (hashHex: string): string[] => {
  // Folder system: pages/ab/cd/<hash>.*
  return [USER_DATA_DIR, TOPIC_PAGES_DIR, hashHex.slice(0, 2), hashHex.slice(2, 4)];
};

const getUserDataDir = async (): Promise<FileSystemDirectoryHandle> => {
  const root = await getRootDir();
  return await root.getDirectoryHandle(USER_DATA_DIR, { create: true });
};

export const loadStateFromOpfs = async (): Promise<Partial<AppState> | null> => {
  if (!opfsSupported()) return null;
  const userData = await getUserDataDir();
  return await readJsonFile<Partial<AppState>>(userData, APP_STATE_FILE);
};

const persistableState = (state: AppState): Partial<AppState> => {
  // Keep the in-memory state shape, but avoid persisting volatile fields that change every second.
  const { pendingTasks, searchErrors, timeLeft, ...rest } = state;
  return {
    ...rest,
    pendingTasks: {},
    searchErrors: {},
    timeLeft
  };
};

export const saveStateToOpfs = async (state: AppState): Promise<void> => {
  if (!opfsSupported()) return;
  const userData = await getUserDataDir();
  await writeJsonFile(userData, APP_STATE_FILE, persistableState(state));
};

export const saveTopicPageToOpfs = async (page: TopicPage): Promise<void> => {
  if (!opfsSupported()) return;

  const pageHash = await sha256Hex(page.id);
  const cacheKey = page.id;
  const cacheValue = JSON.stringify({
    id: page.id,
    parentId: page.parentId,
    title: page.title,
    definition: page.definition,
    rawMarkdown: page.rawMarkdown,
    simpleExplanation: page.simpleExplanation,
    significance: page.significance,
    context: page.context,
    youtubeVideos: page.youtubeVideos,
    memes: page.memes,
    images: page.images,
    keywords: page.keywords,
    timestamp: page.timestamp,
    trends: page.trends,
    searchQueries: page.searchQueries,
    isDetailed: page.isDetailed,
    skillLevel: page.skillLevel,
    currentDefinition: page.currentDefinition
  });

  if (pageCache.get(cacheKey) === cacheValue) return;
  pageCache.set(cacheKey, cacheValue);

  const root = await getRootDir();
  const dir = await getOrCreateDir(root, pageHashToPathParts(pageHash));

  await writeTextFile(dir, `${pageHash}.md`, page.rawMarkdown || '');
  await writeJsonFile(dir, `${pageHash}.json`, {
    ...page,
    storage: {
      algorithm: 'sha256',
      hash: pageHash,
      markdownFile: `${USER_DATA_DIR}/${TOPIC_PAGES_DIR}/${pageHash.slice(0, 2)}/${pageHash.slice(2, 4)}/${pageHash}.md`,
      metaFile: `${USER_DATA_DIR}/${TOPIC_PAGES_DIR}/${pageHash.slice(0, 2)}/${pageHash.slice(2, 4)}/${pageHash}.json`
    }
  });
};

export const deleteTopicPageFromOpfs = async (pageId: string): Promise<void> => {
  if (!opfsSupported()) return;
  const pageHash = await sha256Hex(pageId);
  const root = await getRootDir();
  const dir = await getOrCreateDir(root, pageHashToPathParts(pageHash));
  try {
    await dir.removeEntry(`${pageHash}.md`);
  } catch {}
  try {
    await dir.removeEntry(`${pageHash}.json`);
  } catch {}
  pageCache.delete(pageId);
};

export const loadAllTopicPagesFromOpfs = async (): Promise<Record<string, TopicPage>> => {
  if (!opfsSupported()) return {};

  const root = await getRootDir();
  const pagesRoot = await getOrCreateDir(root, [USER_DATA_DIR, TOPIC_PAGES_DIR]);
  const pages: Record<string, TopicPage> = {};

  // Walk pages/<ab>/<cd>/
  for await (const [ab, abHandle] of (pagesRoot as any).entries()) {
    if (abHandle.kind !== 'directory') continue;
    for await (const [cd, cdHandle] of (abHandle as any).entries()) {
      if (cdHandle.kind !== 'directory') continue;
      for await (const [name, fileHandle] of (cdHandle as any).entries()) {
        if (fileHandle.kind !== 'file') continue;
        if (!name.endsWith('.json')) continue;
        const file = await fileHandle.getFile();
        const buf = await file.arrayBuffer();
        try {
          const page = JSON.parse(decoder.decode(buf)) as TopicPage;
          if (page?.id) pages[page.id] = page;
        } catch {
          // ignore bad files
        }
      }
    }
  }

  return pages;
};

export const opfsIsAvailable = opfsSupported;
