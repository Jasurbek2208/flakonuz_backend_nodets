import fs from 'fs'
import util from 'util'

const readFileAsync = util.promisify(fs.readFile)
const writeFileAsync = util.promisify(fs.writeFile)

const JSON_FILE_PATH = 'config/default.json'

export default async function updateDB(dbname: 'USERS', newdata: any, isupdate = 'POST', currentid?: string) {
  try {
    const jsondata = await readFileAsync(JSON_FILE_PATH, 'utf8')
    const data = JSON.parse(jsondata)

    if (isupdate === 'GET') {
      return data[dbname]
    } else if (isupdate === 'PUT') {
      data[dbname] = data[dbname].map((item: any) => (item.id === currentid ? newdata : item))
    } else if (isupdate === 'DELETE') {
      data[dbname] = data[dbname].filter((item: any) => item.id !== currentid)
    } else {
      data[dbname].push(newdata)
    }

    await writeFileAsync(JSON_FILE_PATH, JSON.stringify(data), 'utf8')
  } catch (error) {
    console.log('Error in updating default.json file: ', error)
  }
}
