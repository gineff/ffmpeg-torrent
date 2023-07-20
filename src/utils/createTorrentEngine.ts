import torrentStream from 'torrent-stream'
import { Instance } from 'parse-torrent'

type CreateTorrentEngine = (
  torrent: Instance,
  options: { verify: boolean }
) => TorrentStream.TorrentEngine

export const createTorrentEngine: CreateTorrentEngine = (
  torrent,
  { verify }
) => {
  const engine = torrentStream(torrent as unknown as string, {
    path: '/media/anri/b8f61008-4cfd-4018-a3c6-1689ab220721/torrents/',
    verify,
  })
  return engine
}
