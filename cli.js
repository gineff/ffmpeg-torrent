const { readdir, mkdir, writeFile } = require('node:fs/promises')
const http = require('node:http')
const { exec } = require('child_process')
const crypto = require('crypto')

const URL = 'http://localhost'
const PORT = 8888

const getFileName = async () => {
  return new Promise(resolve => {
    http
      .request(`${URL}:${PORT}`, { method: 'HEAD' }, res => {
        const contentDisposition = res.headers['content-disposition']
        const [, filename] = contentDisposition
          ? contentDisposition.match(/filename="(.+?)"/)
          : ''
        resolve(filename ?? 'filename.mp4')
      })
      .on('error', e => {
        console.error(`error: ${e.message}`)
        resolve('filename.mp4')
      })
      .end()
  })
}

const parseIntervalsStr = strIntervals =>
  Array.from(strIntervals.matchAll(/(\d+)\S(\d+)\S(\d+)-(\d+)/g)).map(
    ([, hrs, min, sec, duration]) => [(+hrs * 60 + min) * 60 + +sec, +duration]
  )

const getHash = string =>
  crypto.createHash('sha256').update(string).digest('hex').slice(0, 16)

const prepareList = async (files, destination) => {
  writeFile(
    `${__dirname}/mylist.txt`,
    files.map(file => `file ${destination}/${file}`).join('\n')
  )
}

const shell = async str => {
  return new Promise(res => {
    exec(str, (error, stdout, stderr) => {
      if (error !== null) {
        console.log(`exec error: ${error}`)
      }
      console.log(stderr)
      res()
    })
  })
}

const convert = async catalog => {
  console.log('convert')
  const files = (await readdir(catalog)).filter(file => !file.startsWith('f_'))

  for (const fileName of files) {
    console.log(`${catalog}/${fileName}`)
    const stdout = await shell(
      `ffmpeg -ignore_editlist 1 -y -threads 3 -i ${catalog}/${fileName} -filter:v scale=1920:-1 -b:v 7M -minrate 2M -vsync vfr -c:a copy ${catalog}/${
        'f_' + fileName
      }`
    )
    console.log('stdout', stdout)
  }
  console.log('&')

  return ''
}

const concat = async (catalog, fileName) => {
  console.log('concat')
  const files = (await readdir(catalog)).filter(file => file.startsWith('f_')).sort((a,b)=>  Number(a.split('-')[1]) - Number(b.split('-')[1]))

  if (!Array.isArray(files) || files.length === 0) {
    return
  }
  await prepareList(files, catalog)
  await shell(
    `ffmpeg -y -threads 3 -f concat -safe 0 -i "${__dirname}/mylist.txt" -c copy "${catalog}/${fileName}"`
  )
}

const download = async (link, intervals, catalog, hash) => {
  const queue = intervals || []
  while (queue.length) {
    const [startTime, length] = queue.shift()
    const fileName = `${hash}-${startTime}-${length}.mp4`

    await shell(
      `ffmpeg -ss ${startTime} -i ${link} -t ${length} -c copy -y ${catalog}/${fileName}`
    )
  }

  console.log('downloaded')
  return
}

const downloadIntervals = async (strIntervals, catalog, fileName) => {
  const link = `${URL}:${PORT}`
  const hash = getHash(fileName)
  const intervals = parseIntervalsStr(strIntervals)
  console.log(intervals)
  return await download(link, intervals, catalog, hash)
}

const pauseTorrent = () => http.get(`${URL}:${PORT}/pause`)

const start = async () => {
  const params = process.argv.splice(2)
  if (params.includes('-a')) {
    let i = params.indexOf('-a')
    const action = params[++i]
    try {
      const tempDir = 'tmp'
      try {
        await mkdir(tempDir)
      } catch {}

      const fileName = await getFileName()

      if (action === 'convert') {
        convert(tempDir)
      } else if (action === 'concat') {
        const filename = params[++i]
        concat(tempDir, filename)
      } else if (action === 'download') {
        const intervals = params[++i]
        await downloadIntervals(intervals, tempDir, fileName)
        pauseTorrent()
      } else {
        const intervals = params[++i]

        await downloadIntervals(intervals, tempDir, fileName)
        pauseTorrent()

        await convert(tempDir)
        await concat(tempDir, fileName)
      }
    } catch (e) {
      console.log('error: ', e)
    }
  }
}

start()
