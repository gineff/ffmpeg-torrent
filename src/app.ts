import {
  extractNativeArgv,
  parseTorrent,
  selectFile,
  createTorrentEngine,
  createTorrentServer,
} from './utils'
import { exec, spawn } from 'node:child_process'
import minimist from 'minimist'
import clivas from 'clivas'
//import keypress from 'keypress'
import inquirer from 'inquirer'
import config from './config.json'

const messages: string[] = []
const commands: string[] = []

const draw = (engine: TorrentStream.TorrentEngine) => {
  clivas.clear()
  clivas.line('')
  clivas.line(
    '{yellow:info} {green:streaming} {green:-} {bold:' +
      //@ts-ignore
      engine.swarm.downloadSpeed() +
      '/s} {green:from} {bold:' +
      //@ts-ignore
      engine.swarm.wires.length +
      '} {green:peers}    '
  )
  //@ts-ignore
  clivas.line('{yellow:info} {green:path} {cyan:' + engine.path + '}')
  clivas.line(
    '{yellow:info} {green:downloaded} {bold:' + engine.swarm.downloaded + '} '
  )
  clivas.line('')
  messages.forEach(message => clivas.line(message))
}

const downloadFile = async (
  url: string,
  startTime: string,
  duration: string
): Promise<string> => {
  return new Promise((res, rej) => {
    exec(
      `ffmpeg -ss ${startTime} -ignore_editlist true -i ${url} -t ${duration} -c copy -y output.mp4`,
      (error, _stdout, _stderr) => {
        //ffmpeg log into stderr
        if (error) rej(error)
        res('output.mp4')
      }
    )
  })
}

const askFfmpegCommand = async (): Promise<string[]> => {
  return new Promise(resolve => {
    inquirer
      .prompt([
        {
          type: 'input',
          name: 'ffmpegCommand',
          message: 'type ffmpeg command',
        },
      ])
      .then(response => {
        const { ffmpegCommand } = response
        commands.push(ffmpegCommand)
        resolve(ffmpegCommand.split(' '))
      })
      .catch(err => {
        console.error(err)
        process.exit(0)
      })
  })
}

const queue = async (engine: TorrentStream.TorrentEngine) => {
  const id = setInterval(() => draw(engine), 1000)
  draw(engine)
  const ffmpegCommand: string[] = await askFfmpegCommand()
  messages.length = 0
  const [nativeArg, ffmpegArg] = extractNativeArgv(ffmpegCommand)
  //const [startTime, duration] = extractArg(ffmpegCommand,['-ss', '-t'])
  let filePath: null | string = null
  try {
    filePath = await downloadFile(
      `http://localhost:8888`,
      nativeArg['-ss'],
      nativeArg['-t']
    )

    engine.files.forEach(file => {
      file.deselect()
    })
    //@ts-ignore
    engine.selection.length = 0

    const ffmpeg = spawn('ffmpeg', ['-i', filePath, ...ffmpegArg])
    ffmpeg.on('exit', () => {
      messages.push('ffmpeg process finished')
      clearInterval(id)
      queue(engine)
    })
    ffmpeg.stderr.on('data', data => {
      messages.push(data)
    })
  } catch (e) {
    console.log('e', e)
  }
}

async function start() {
  const argv = minimist(process.argv.slice(2))
  const [torrentSource] = argv._
  const check = Boolean(argv.c)

  try {
    const torrent = await parseTorrent(torrentSource)
    const fileIndex = argv.fi
      ? Number(argv.fi)
      : await selectFile(torrent?.files)

    const engine: TorrentStream.TorrentEngine = createTorrentEngine(torrent, {
      verify: check,
    })
    const server = createTorrentServer(engine, engine.files[fileIndex])
    server.listen(config.port)

    engine.on('ready', async () => {
      console.log('engine is ready')
      process.stdout.write(Buffer.from('G1tIG1sySg==', 'base64'))
      queue(engine)
    })
  } catch (err) {
    console.error((err as Error).message)
    process.exit(1)
  }
}

start()
