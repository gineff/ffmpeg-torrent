import torrentStream from 'torrent-stream'
import { Instance} from 'parse-torrent'

type CreateTorrentEngine = (torrent: Instance) => TorrentStream.TorrentEngine

export const createTorrentEngine: CreateTorrentEngine = (torrent) => {
  const engine = torrentStream(torrent as unknown as string)
  return engine
}
