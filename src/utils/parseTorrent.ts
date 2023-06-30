import { remote, Instance } from 'parse-torrent'
import { readFile } from 'node:fs/promises'

type ParseTorrent = (filename: string) => Promise<Instance>

export const parseTorrent: ParseTorrent = async filename => {
  return new Promise(async (res, rej) => {
    if (!filename) rej(new Error('torrent is undefined'))
    remote(await readFile(filename), (err, parsedTorrent) => {
      if (err) {
        rej(err)
      }
      if (parsedTorrent !== undefined) {
        res(parsedTorrent)
      }
      rej(new Error('torrent is undefined'))
    })
  })
}
