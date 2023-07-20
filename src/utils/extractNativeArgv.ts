type NativeArgv = {
  '-i': string //index
  '-fi'?: string //file index
  '-p'?: string //port
  '-ss'?: string // start time
  '-t'?: string // duration
}
type Native_argvKeys = keyof NativeArgv
type FfmpegArgv = string[]
type ResultArgvUnion = [NativeArgv, FfmpegArgv]
export type ExtractNativeArgv = () => ResultArgvUnion
const nativeFlags: Native_argvKeys[] = ['-i', '-fi', '-ss', '-p', '-t']

export const extractNativeArgv = (ffmpegCommand: string[]): ResultArgvUnion => {
  //const args = process.argv.slice(2)
  const args = ffmpegCommand
  const nativeArg = {} as NativeArgv

  nativeFlags.forEach((flag: Native_argvKeys) => {
    const i = args.indexOf(flag)
    if (~i) {
      const nextArg = args[i + 1]
      const [, value] = args.splice(i, nextArg.startsWith('-') ? 1 : 2)
      nativeArg[flag] = value
    }
  })

  args.splice(
    args.findIndex(item => item === 'ffmpeg'),
    1
  )

  return [nativeArg, args]
}
