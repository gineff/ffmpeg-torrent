import inquirer from 'inquirer'
import { Instance } from 'parse-torrent'

type FileIndex = number

type SelectFile = (files: Instance['files']) => Promise<FileIndex>

export const selectFile: SelectFile = async files => {
  if (!files) return Promise.reject(new Error('no files in torrent'))
  return new Promise(resolve => {
    inquirer
      .prompt([
        {
          type: 'list',
          name: 'fileIndex',
          message: 'Choose one file',
          choices: Array.from(files).map((file, i) => ({
            name: `[${i}] ${file.name} : ${file.length}`,
            value: i,
          })),
        },
      ])
      .then(response => {
        const { fileIndex } = response
        resolve(Number(fileIndex))
      })
      .catch(err => {
        console.error(err)
        process.exit(0)
      })
  })
}
