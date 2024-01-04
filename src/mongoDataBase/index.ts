import { MongoClient, Binary } from 'mongodb'
const config = require('config')
import fs from 'fs'

// Helpers
import fileDelete from '../utils/fileDelete'

// Utils
import updateDB from '../utils/updateDBJSON'

require('dotenv').config()

const client = new MongoClient(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@flakonuzbackend.hejv0nx.mongodb.net/?retryWrites=true&w=majority`)

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

// Uploading image to local db collection
export async function uploadImageToLocalDB(dbName: string, dataId: string, imagePath: string) {
  const db = await JSON.parse(JSON.stringify(config.get(dbName)))

  const currentDBItem = await db.find((item: any) => item?.id === dataId)

  // Read the image file as binary data
  const imageData = fs.readFileSync(imagePath)
  const binaryData = new Binary(imageData)

  // Create an object to be inserted into the collection
  const imageDocument = {
    id: dataId,
    data: binaryData,
    contentType: `image/${imagePath.split('.')[1]}`,
  }

  if (currentDBItem) {
    updateDB('USERS', imageDocument, 'PUT', dataId)
  } else {
    updateDB('USERS', imageDocument)
  }

  fileDelete(imagePath)
}