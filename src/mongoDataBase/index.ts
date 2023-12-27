import { MongoClient, Binary } from 'mongodb'
import fs from 'fs'

// Helpers
import fileDelete from '../utils/fileDelete'

require('dotenv').config()

const client = new MongoClient(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@flakonuzbackend.mongodb.net/?retryWrites=true&w=majority`)

// Connecting to MongoDB
export async function Connect() {
  try {
    await client.connect()
    console.log('MongoDB Connected!')
  } catch (error) {
    console.log('MongoDB Disconnected! ', error)
  }
}

// MongoDB Collections
// Getting current db collection
export function getDBCollection(db: string, collection: string) {
  return client.db(db).collection(collection)
}

// Getting all datas in db collection
export async function getAllDataInDBCollection(db: string, collection: string) {
  return await client.db(db).collection(collection).find({}).toArray()
}

// Getting current data in db collection
export async function getCurrentDataInDBCollection(db: string, collection: string, dataId: string) {
  return await client.db(db).collection(collection).findOne({ id: dataId })
}

// Getting current data in db collection
export async function getAllDataWithParamsInDBCollection(db: string, collection: string, paramId: string, param: string) {
  return await client
    .db(db)
    .collection(collection)
    .find({ [param]: paramId })
    .toArray()
}
// Delete many
export async function deleteManyDataInDBCollection(db: string, collection: string, id: string) {
  return await client.db(db).collection(collection).deleteMany({ id: id })
}
// Delete current
export async function deleteCurrentDataInDBCollection(db: string, collection: string, id: string) {
  return await client.db(db).collection(collection).deleteOne({ id: id })
}

// Creating db collection
export async function createCollection(db: string, collection: string) {
  const currentCollection = await client.db(db).createCollection(collection)
  return currentCollection ? true : false
}

// Uploading image to db collection
export async function uploadImageToDB(dbName: string, collection: string, dataId: string, imagePath: string) {
  const db = client.db(dbName)

  // Read the image file as binary data
  const imageData = fs.readFileSync(imagePath)
  const binaryData = new Binary(imageData)

  // Create an object to be inserted into the collection
  const imageDocument = {
    id: dataId,
    data: binaryData,
    contentType: `image/${imagePath.split('.')[1]}`,
  }

  // Insert the image document into the specified collection
  await db.collection(collection).insertOne(imageDocument)
  fileDelete(imagePath)
}

// const data = {
//   _id: { $oid: '65843dc4b1fc17cfa69e6f69' },
//   id: 'c4fbab2c-7759-44e6-9e7d-944c5504d8b0',
//   gmail: { en: 'Flakonuz@gmail.com', ru: 'Flakonuz@mail.ru' },
//   phone: ['+998881561256', '+998991101256'],
//   telegram: 'Flakonuz',
//   instagram: 'Flakonuz',
//   website: 'flakon.uz',
// }

async function setPDF() {
  const pdfFilePath = 'src/Catalog/catalogflakon2211.pdf'

  const writeStream = fs.createWriteStream(pdfFilePath)

  await new Promise((resolve, reject) => {
    writeStream.on('finish', async () => {
      resolve(pdfFilePath)
      fs.readFile(pdfFilePath, async (err, data) => {
        const db = getDBCollection('companyDB', 'settings')
        console.log(data)

        const response = await db.insertOne({
          id: 'c4fbab2c-7759-44e6-9e7d-944c5504d8b0',
          gmail: { en: 'Flakonuz@gmail.com', ru: 'Flakonuz@mail.ru' },
          phone: ['+998881561256', '+998991101256'],
          telegram: 'Flakonuz',
          instagram: 'Flakonuz',
          website: 'flakon.uz',
          catalogPDF: data.toJSON(),
        })
        console.log(response)
      })
    })
    writeStream.on('error', (err) => {
      fs.unlink(pdfFilePath, () => reject(err))
      reject(err)
    })
  })
}
// setPDF()
