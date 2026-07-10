import type { LutAsset, MediaAsset, Project, Track } from '../types/project'

const DB_NAME = 'fable-editor'
const DB_VERSION = 2
const PROJECT_STORE = 'projects'
const MEDIA_STORE = 'media'
const LUT_STORE = 'luts'

interface StoredProject {
  id: string
  name: string
  width: number
  height: number
  fps: number
  tracks: Track[]
  mediaIds: string[]
  lutIds?: string[]
  markers?: Project['markers']
  updatedAt: number
}

interface StoredMedia {
  id: string
  name: string
  type: MediaAsset['type']
  blob: Blob
  duration: number
  width?: number
  height?: number
  thumbnail?: string
  waveform?: number[]
}

interface StoredLut {
  id: string
  name: string
  blob: Blob
  size: number
  title?: string
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PROJECT_STORE)) {
        db.createObjectStore(PROJECT_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(LUT_STORE)) {
        db.createObjectStore(LUT_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function put<T>(db: IDBDatabase, store: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function get<T>(db: IDBDatabase, store: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const request = tx.objectStore(store).get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const request = tx.objectStore(store).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function deleteKey(db: IDBDatabase, store: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export interface SaveProjectProgress {
  phase: 'media' | 'project' | 'done'
  mediaIndex: number
  mediaTotal: number
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export async function saveProject(
  project: Project,
  onProgress?: (progress: SaveProjectProgress) => void,
): Promise<void> {
  const db = await openDB()
  const mediaTotal = project.mediaAssets.length
  const lutTotal = project.lutAssets?.length ?? 0

  for (let i = 0; i < project.mediaAssets.length; i++) {
    const asset = project.mediaAssets[i]!
    onProgress?.({ phase: 'media', mediaIndex: i + 1, mediaTotal })
    const stored: StoredMedia = {
      id: asset.id,
      name: asset.name,
      type: asset.type,
      blob: asset.blob,
      duration: asset.duration,
      width: asset.width,
      height: asset.height,
      thumbnail: asset.thumbnail,
      waveform: asset.waveform,
    }
    await put(db, MEDIA_STORE, stored)
    if (asset.blob.size > 1024 * 1024) await yieldToMainThread()
  }

  for (let i = 0; i < lutTotal; i++) {
    const lut = project.lutAssets![i]!
    const stored: StoredLut = {
      id: lut.id,
      name: lut.name,
      blob: lut.blob,
      size: lut.size,
      title: lut.title,
    }
    await put(db, LUT_STORE, stored)
  }

  onProgress?.({ phase: 'project', mediaIndex: mediaTotal, mediaTotal })
  const storedProject: StoredProject = {
    id: project.id,
    name: project.name,
    width: project.width,
    height: project.height,
    fps: project.fps,
    tracks: project.tracks,
    mediaIds: project.mediaAssets.map((a) => a.id),
    lutIds: (project.lutAssets ?? []).map((a) => a.id),
    markers: project.markers ?? [],
    updatedAt: Date.now(),
  }
  await put(db, PROJECT_STORE, storedProject)
  onProgress?.({ phase: 'done', mediaIndex: mediaTotal, mediaTotal })
  db.close()
}

async function hydrateProject(db: IDBDatabase, stored: StoredProject): Promise<Project> {
  const mediaAssets: MediaAsset[] = []
  const lutAssets: LutAsset[] = []

  for (const mediaId of stored.mediaIds) {
    const media = await get<StoredMedia>(db, MEDIA_STORE, mediaId)
    if (media) {
      mediaAssets.push({
        id: media.id,
        name: media.name,
        type: media.type,
        blob: media.blob,
        url: URL.createObjectURL(media.blob),
        duration: media.duration,
        width: media.width,
        height: media.height,
        thumbnail: media.thumbnail,
        waveform: media.waveform,
      })
    }
  }

  for (const lutId of stored.lutIds ?? []) {
    const lut = await get<StoredLut>(db, LUT_STORE, lutId)
    if (lut) {
      lutAssets.push({
        id: lut.id,
        name: lut.name,
        blob: lut.blob,
        size: lut.size,
        title: lut.title,
      })
    }
  }

  return {
    id: stored.id,
    name: stored.name,
    width: stored.width,
    height: stored.height,
    fps: stored.fps,
    tracks: stored.tracks as Track[],
    mediaAssets,
    lutAssets,
    markers: stored.markers ?? [],
  }
}

export async function loadLatestProject(): Promise<Project | null> {
  const db = await openDB()
  const projects = await getAll<StoredProject>(db, PROJECT_STORE)
  if (projects.length === 0) {
    db.close()
    return null
  }

  const latest = projects.sort((a, b) => b.updatedAt - a.updatedAt)[0]
  const project = await hydrateProject(db, latest)
  db.close()
  return project
}

export interface ProjectSummary {
  id: string
  name: string
  width: number
  height: number
  fps: number
  updatedAt: number
  clipCount: number
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const db = await openDB()
  const projects = await getAll<StoredProject>(db, PROJECT_STORE)
  db.close()
  return projects
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((p) => ({
      id: p.id,
      name: p.name,
      width: p.width,
      height: p.height,
      fps: p.fps,
      updatedAt: p.updatedAt,
      clipCount: p.tracks.reduce((n, t) => n + t.clips.length, 0),
    }))
}

export async function loadProjectById(id: string): Promise<Project | null> {
  const db = await openDB()
  const stored = await get<StoredProject>(db, PROJECT_STORE, id)
  if (!stored) {
    db.close()
    return null
  }
  const project = await hydrateProject(db, stored)
  db.close()
  return project
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB()
  await deleteKey(db, PROJECT_STORE, id)
  db.close()
  await cleanupOrphanMedia()
}

export async function duplicateProjectInDB(id: string, newId: string, newName: string): Promise<boolean> {
  const db = await openDB()
  const stored = await get<StoredProject>(db, PROJECT_STORE, id)
  if (!stored) {
    db.close()
    return false
  }
  const copy: StoredProject = { ...stored, id: newId, name: newName, updatedAt: Date.now() }
  await put(db, PROJECT_STORE, copy)
  db.close()
  return true
}

// 全プロジェクトのどこからも参照されないメディアのみ削除する
// (メディアはプロジェクト間で共有され得るため、単一プロジェクト基準では消せない)
export async function cleanupOrphanMedia(currentProject?: Project): Promise<void> {
  const db = await openDB()
  const allProjects = await getAll<StoredProject>(db, PROJECT_STORE)
  const allMedia = await getAll<StoredMedia>(db, MEDIA_STORE)

  const usedIds = new Set<string>()
  const usedLutIds = new Set<string>()
  for (const p of allProjects) {
    for (const id of p.mediaIds) usedIds.add(id)
    for (const id of p.lutIds ?? []) usedLutIds.add(id)
  }
  // 未保存の現行プロジェクト状態も参照中とみなす
  if (currentProject) {
    for (const a of currentProject.mediaAssets) usedIds.add(a.id)
    for (const a of currentProject.lutAssets ?? []) usedLutIds.add(a.id)
  }

  for (const media of allMedia) {
    if (!usedIds.has(media.id)) {
      await deleteKey(db, MEDIA_STORE, media.id)
    }
  }

  const allLuts = await getAll<StoredLut>(db, LUT_STORE)
  for (const lut of allLuts) {
    if (!usedLutIds.has(lut.id)) {
      await deleteKey(db, LUT_STORE, lut.id)
    }
  }
  db.close()
}

export async function clearStorage(): Promise<void> {
  const db = await openDB()
  const tx = db.transaction([PROJECT_STORE, MEDIA_STORE, LUT_STORE], 'readwrite')
  tx.objectStore(PROJECT_STORE).clear()
  tx.objectStore(MEDIA_STORE).clear()
  tx.objectStore(LUT_STORE).clear()
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export type { StoredProject, StoredMedia, StoredLut }
