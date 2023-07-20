import mime from 'mime'
import rangeParser from 'range-parser'
import http from 'node:http'

export const createTorrentServer = (
  engine: TorrentStream.TorrentEngine,
  file: TorrentStream.TorrentFile
) => {
  const server = http.createServer()
  //@ts-ignore
  server.on('request', (request, response) => {
    if (request.url === '/pause') {
      //@ts-ignore
      engine.selection.length = 0
      response.statusCode = 200
      return response.end()
    }

    if (request.url === '/favicon.ico') {
      response.statusCode = 200
      return response.end()
    }

    if (
      request.method === 'OPTIONS' &&
      request.headers['access-control-request-headers']
    ) {
      if (request.headers.origin) {
        response.setHeader(
          'Access-Control-Allow-Origin',
          request.headers.origin
        )
      }
      response.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
      response.setHeader(
        'Access-Control-Allow-Headers',
        request.headers['access-control-request-headers']
      )
      response.setHeader('Access-Control-Max-Age', '1728000')
      return response.end()
    }

    if (request.headers.origin) {
      response.setHeader('Access-Control-Allow-Origin', request.headers.origin)
    }

    response.setHeader('Accept-Ranges', 'bytes')
    response.setHeader('Content-Type', mime.getType(file.name) || 'text/plain')
    response.setHeader(
      'Content-Disposition',
      `attachment;filename="${file.name}"`
    )
    response.setHeader('transferMode.dlna.org', 'Streaming')
    response.setHeader(
      'contentFeatures.dlna.org',
      'DLNA.ORG_OP=01;DLNA.ORG_CI=0;DLNA.ORG_FLAGS=01700000000000000000000000000000'
    )

    const range = request.headers.range
    //console.log('method', request.method, range)

    if (!range) {
      response.setHeader('Content-Length', file.length)
      if (request.method === 'HEAD') return response.end()
      const readStream = file.createReadStream()
      readStream.pipe(response)
    } else {
      const ranges = rangeParser(file.length, range)
      if (Array.isArray(ranges) && ranges.at(0) !== undefined) {
        const parsedRange = ranges.at(0)
        response.statusCode = 206
        response.setHeader(
          'Content-Length',
          parsedRange!.end - parsedRange!.start + 1
        )
        response.setHeader(
          'Content-Range',
          'bytes ' +
            parsedRange!.start +
            '-' +
            parsedRange!.end +
            '/' +
            file.length
        )
        if (request.method === 'HEAD') return response.end()
        const readStream = file.createReadStream(parsedRange)
        //@ts-ignore
        file.readStream = readStream
        readStream.pipe(response)

        readStream.on('close', () => {
          console.log('Stream ended')
          //process.exit()
        })
      } else {
        response.statusCode = 500
        response.end()
      }
    }
  })

  server.on('connection', function (socket) {
    socket.setTimeout(36000000)
  })

  return server
}
