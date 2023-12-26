// Types
import { IImage } from '../types'

// MongoDB functions
import { getCurrentDataInDBCollection, getDBCollection } from '../mongoDataBase'

export async function getAllImages(dbName: string, collection: string): Promise<IImage[] | string> {
  try {
    const imagesDocument: IImage[] = await getDBCollection(dbName, collection).find({}).toArray() as IImage[] | []

    if (!imagesDocument || imagesDocument.length === 0) {
      return 'Images not found!'
    }

    return imagesDocument
  } catch (error) {
    return 'Error in getting all images!'
  }
}

export async function getCurrentImage(dbName: string, collection: string, imageId: string) {
  try {
    const imageDocument = await getCurrentDataInDBCollection(dbName, collection, imageId)

    if (!imageDocument) {
      return 'Image not found'
    }

    return imageDocument
  } catch (error) {
    return error
  }
}
