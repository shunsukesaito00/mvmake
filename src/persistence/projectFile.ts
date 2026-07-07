import { zip, unzip, type Zippable } from 'fflate'
import type { MediaAsset, Project, Track } from '../types/project'
import { normalizeProject } from '../types/project'
import { createId } from '../utils/id'

const FORMAT_VERSION = 1

interface FableManifest {
  version: number
  project: {
    name: string
    width: number
    height: number
    fps: number
    tracks: Track[]
    markers: Project['markers']
  }
  media: {
    id: string
    name: string
    type: MediaAsset['type']
    mimeType: string
    duration: number
    width?: number
    height?: number
    thumbnail?: string
    waveform?: number[]
  }[]
}

function zipAsync(data: Zippable): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(data, (err, result) => (err ? reject(err) : resolve(result)))
  })
}

function unzipAsync(data: Uint8Array): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    unzip(data, (err, result) => (err ? reject(err) : resolve(result)))
  })
}

export async function exportProjectFile(project: Project): Promise<Blob> {
  const manifest: FableManifest = {
    version: FORMAT_VERSION,
    project: {
      name: project.name,
      width: project.width,
      height: project.height,
      fps: project.fps,
      tracks: project.tracks,
      markers: project.markers ?? [],
    },
    media: project.mediaAssets.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      mimeType: a.blob.type,
      duration: a.duration,
      width: a.width,
      height: a.height,
      thumbnail: a.thumbnail,
      waveform: a.waveform,
    })),
  }

  const files: Zippable = {
    'manifest.json': new TextEncoder().encode(JSON.stringify(manifest)),
  }
  for (const asset of project.mediaAssets) {
    const bytes = new Uint8Array(await asset.blob.arrayBuffer())
    // 動画・画像・音声は既に圧縮済みのため再圧縮しない
    files[`media/${asset.id}`] = [bytes, { level: 0 }]
  }

  const zipped = await zipAsync(files)
  return new Blob([zipped as BlobPart], { type: 'application/zip' })
}

export async function importProjectFile(file: File): Promise<Project> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const entries = await unzipAsync(bytes)

  const manifestBytes = entries['manifest.json']
  if (!manifestBytes) throw new Error('不正なファイル形式です (manifest.json がありません)')

  const manifest: FableManifest = JSON.parse(new TextDecoder().decode(manifestBytes))
  if (manifest.version > FORMAT_VERSION) {
    throw new Error('このファイルは新しいバージョンの FABLE で作成されています')
  }

  const mediaAssets: MediaAsset[] = []
  for (const meta of manifest.media) {
    const data = entries[`media/${meta.id}`]
    if (!data) throw new Error(`メディア「${meta.name}」がファイル内に見つかりません`)
    const blob = new Blob([data as BlobPart], { type: meta.mimeType })
    mediaAssets.push({
      id: meta.id,
      name: meta.name,
      type: meta.type,
      blob,
      url: URL.createObjectURL(blob),
      duration: meta.duration,
      width: meta.width,
      height: meta.height,
      thumbnail: meta.thumbnail,
      waveform: meta.waveform,
    })
  }

  // インポートは常に新規プロジェクトとして扱う(既存と ID 衝突させない)
  return normalizeProject({
    id: createId(),
    name: manifest.project.name,
    width: manifest.project.width,
    height: manifest.project.height,
    fps: manifest.project.fps,
    tracks: manifest.project.tracks,
    mediaAssets,
    markers: manifest.project.markers ?? [],
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
