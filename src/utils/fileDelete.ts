import fs from 'fs'

export default function fileDelete(imagePath: string) {
  return fs.unlink(imagePath, (err) => {
    if (err) {
      return false
    }
    return true
  })
}