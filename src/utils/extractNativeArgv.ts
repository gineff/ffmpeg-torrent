type NativeArgv = {
  '-i': string //index
  '-fi'?: string //file index
  '-p'?: string //port
  '-ss'?: string // start time
}
type Native_argvKeys = keyof NativeArgv
type FfmpegArgv = string[]
type ResultArgvUnion = [NativeArgv, FfmpegArgv]
export type ExtractNativeArgv = () => ResultArgvUnion
const nativeFlags: Native_argvKeys[] = ['-i', '-fi', '-ss', '-p']

export const extractNativeArgv = (): ResultArgvUnion => {
  const args = process.argv.slice(2)
  const nativeArg = {} as NativeArgv

  nativeFlags.forEach((flag: Native_argvKeys) => {
    const i = args.indexOf(flag)
    if (~i ) {
      const nextArg = args[i + 1]
      const[, value] = args.splice(i, nextArg.startsWith('-')? 1 : 2)
      nativeArg[flag] = value
    }
  })

  return [nativeArg, args]
}
