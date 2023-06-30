import {
  extractNativeArgv,
  parseTorrent,
  selectFile,
  createTorrentEngine,
  createTorrentServer,
} from './utils'
import { exec } from 'child_process'

async function start() {
  const [nativeArg, ffmpegArg] = extractNativeArgv()
  try {
    const torrent = await parseTorrent(nativeArg['-i'])
    /*prettier-ignore*/
    const fileIndex = Number(nativeArg['-fi']) || (await selectFile(torrent?.files))
    const port = 8888
    const engine = createTorrentEngine(torrent)
    const server = createTorrentServer(engine.files[fileIndex])

    engine.on('ready', function () {
      server.listen(port)
      console.log('engine is ready')
      /*@ts-ignore*/
      engine.swarm.pause()

      exec(
        `ffmpeg ${
          nativeArg['-ss'] ? `-ss ${nativeArg['-ss']}` : ''
        } -i http://localhost:${
          Number(nativeArg['-p']) || port
        } ${ffmpegArg.join(' ')}`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`)
            return
          }
          console.log(`stdout: ${stdout}`)
          console.error(`stderr: ${stderr}`)
          process.exit()
        }
      )
    })

    //engine.listen()

    //const ffmpegOptions: string = ffmpegArg.join(' ')
  } catch (err) {
    console.error((err as Error).message)
    process.exit(1)
  }
}

start()
