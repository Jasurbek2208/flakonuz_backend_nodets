import { Request, Response } from 'express'
import { v4 } from 'uuid'
import fs from 'fs'

// MongoDB
import { Collection, Document, ObjectId } from 'mongodb'

// MongoDB functions
import { deleteCurrentDataInDBCollection, getAllDataInDBCollection, getCurrentDataInDBCollection, getDBCollection, uploadImageToDB } from '../mongoDataBase'

// Constants
import { dbNames, companyDBCollections, imagesDBCollections, contentDBCollections } from '../utils/constants'

// Types
import { ICompanyNews, IImage, ISettings } from '../types'

// ABOUT SETTINGS CONTROLLERS
export async function getAboutSettings(req: Request, res: Response) {
  try {
    const db: ISettings[] = (await getAllDataInDBCollection(dbNames.companyDB, companyDBCollections.settings)) as ISettings[] | []

    if (!db || db.length === 0) {
      return res.status(500).json(null)
    }

    const settings = db[0]
    delete settings?.catalogPDF

    res.status(200).json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export async function sendFeedback(req: Request, res: Response) {
  try {
    const { name, mail, message } = req?.body

    if (!name || !mail || !message) {
      return res.status(401).json({ message: 'name, mail, message params are required!' })
    }

    res.status(200).json({ success: true, message_en: 'Message sent successfully!', message_ru: 'Сообщение успешно отправлено!', message_uz: 'Xabar muvofaqiyatli yuborildi!' })
  } catch (error) {
    res.status(500).json({
      success: false,
      message_en: 'Message could not be sent, please try again later!',
      message_ru: 'Не удалось отправить сообщение. Повторите попытку позже!',
      message_uz: "Xabar yuborilmadi, birozdan so'ng qayta urinib ko'ring!",
    })
  }
}

export async function updateAboutSettings(req: Request, res: Response) {
  try {
    const { id, addressName_en, addressName_ru, addressName_uz, gmail_en, gmail_ru, phone1, phone2, telegram, instagram, website, videoLink } = req.body

    if (!id || !addressName_en || !addressName_ru || !addressName_uz || !gmail_en || !gmail_ru || !phone1 || !phone2 || !telegram || !instagram || !website || !videoLink) {
      return res.status(400).json({ message: 'Params are required!' })
    }
    const settingsId = req.params.id
    const db: Collection<Document> = getDBCollection(dbNames.companyDB, companyDBCollections.settings) as Collection<Document>

    if (!db) return res.status(500).json(null)
    const data = {
      id,
      addressName: { en: addressName_en, ru: addressName_ru, uz: addressName_uz },
      gmail: { en: gmail_en, ru: gmail_ru },
      phone: [phone1, phone2],
      telegram,
      instagram,
      website,
      videoLink,
    }

    const response = await db.updateOne({ id: settingsId }, data)
    if (response?.upsertedCount === 0) return res.status(500).json({ message: 'Settings not updated!' })

    res.status(200).json({ message: 'Settings successfull updated!', data })
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

// COMPANY NEWS CONTROLLERS
export async function getCompanyNews(req: Request, res: Response) {
  try {
    const page = parseInt(req?.query?.page as string, 10) || 1
    const limit = parseInt(req?.query?.limit as string, 10) || 10
    const search = (req?.query?.search as string) || ''
    const searchParam = (req?.query?.searchParam as string) || ''

    const images: Collection<Document> | string = getDBCollection(dbNames.images, imagesDBCollections.companyNews)
    const news: ICompanyNews[] = (await getAllDataInDBCollection(dbNames.companyDB, companyDBCollections.news)) as ICompanyNews[] | []
    if (!news || news.length === 0) {
      return res.status(200).json([])
    }

    if (!req?.query?.page && !req?.query?.limit && !req?.query?.search) {
      const newsWithImages = await Promise.all(
        news?.map(async (item: ICompanyNews) => {
          const image = images && typeof images !== 'string' ? await images.findOne({ id: item?.image }) : ''
          return { ...item, image }
        }),
      )

      // Send all companny news
      res.status(200).json(newsWithImages)
    } else {
      const filteredMaterials = news?.filter((item: any) => {
        return item?.[searchParam]?.toLowerCase()?.includes(search?.toLowerCase())
      })

      // Calculate pagination limits
      const startIndex = (page - 1) * limit
      const endIndex = page * limit
      const paginatedNews = filteredMaterials?.slice(startIndex, endIndex)

      const newsWithImages = await Promise.all(
        paginatedNews?.map(async (item: ICompanyNews) => {
          const image = images && typeof images !== 'string' ? await images.findOne({ id: item?.image }) : ''
          return { ...item, image }
        }),
      )
      // Send all companny news
      res.status(200).json({
        companyNews: newsWithImages,
        pagination: {
          page,
          limit,
          total: filteredMaterials?.length,
          totalPages: Math.ceil(filteredMaterials?.length / limit),
        },
      })
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export async function getCurrentCompanyNews(req: Request, res: Response) {
  try {
    const newsId = req.params.id

    // Get current news
    const news: ICompanyNews | null = (await getCurrentDataInDBCollection(dbNames.companyDB, companyDBCollections.news, newsId)) as ICompanyNews | null

    if (!news) return res.status(500).json({ message: 'News not found!' })
    const imagesDB: Collection<Document> | string = getDBCollection(dbNames.images, imagesDBCollections.companyNews)

    // Enhance with images
    const newsWithImages = { ...news, image: imagesDB && typeof imagesDB !== 'string' ? await imagesDB.findOne({ id: news?.image }) : '' }

    // Send companny current news
    res.status(200).json(newsWithImages)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

export async function addCurrentCompanyNews(req: Request, res: Response) {
  try {
    const { id, title_en, title_ru, title_uz, description_en, description_ru, description_uz, published_date } = req.body
    // Handle the uploaded file
    const file = req.file
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' })
    }

    if (!id || !title_en || !title_ru || !title_uz || !description_en || !description_ru || !description_uz || !published_date) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    // Get news collection
    const newsDB = getDBCollection(dbNames.companyDB, companyDBCollections.news)

    const imageId = v4()
    const fileName = `src/uploads/${file.filename}`

    fs.readFile(fileName, async (err, data) => {
      if (err) return res.status(500).json({ message: 'Image file not found!' })
      try {
        await uploadImageToDB(dbNames.images, companyDBCollections.news, imageId, fileName)
      } catch {
        res.status(500).json({ message: 'Error in saving image file!' })
      }
    })

    const data = {
      id: id,
      image: imageId,
      title_en,
      title_ru,
      title_uz,
      description_en,
      description_ru,
      description_uz,
      published_date,
    }

    const response = await newsDB.insertOne(data)
    if (!response.insertedId) return res.status(500).json({ message: 'Company News not found!' })

    res.status(200).json({ message: 'Company News successfull added!' })
  } catch (error) {
    res.status(500).json({ message: 'Error in adding new Company 0News, please try again later!' })
  }
}

export async function editCurrentCompanyNews(req: Request, res: Response) {
  try {
    const { title_en, title_ru, title_uz, description_en, description_ru, description_uz, published_date } = req.body
    const newsId = req.params.id

    // Handle the uploaded file
    const file = req.file

    if (!title_en || !title_ru || !title_uz || !description_en || !description_ru || !description_uz || !published_date) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    const newsDB = getDBCollection(dbNames.companyDB, companyDBCollections.news)

    // Get current company news
    const currentNews: ICompanyNews | null = (await getCurrentDataInDBCollection(dbNames.companyDB, companyDBCollections.news, newsId)) as ICompanyNews | null

    const imageId = v4()

    if (file) {
      const fileName = `src/uploads/${file.filename}`

      // deleting news image
      const currentImageId = (currentNews?.image as any) || ''
      const responseImage = await deleteCurrentDataInDBCollection(dbNames.images, companyDBCollections.news, currentImageId)
      if (responseImage.deletedCount === 0) return res.status(500).json({ message: 'Current Company News image not found in database!' })

      fs.readFile(fileName, async (err, data) => {
        if (err) return res.status(500).json({ message: 'Image file not found!' })
        try {
          await uploadImageToDB(dbNames.images, companyDBCollections.news, imageId, fileName)
        } catch {
          res.status(500).json({ message: 'Error in saving image file!' })
        }
      })
    }

    const data = {
      ...currentNews,
      image: file ? imageId : currentNews?.image,
      title_en: title_en || currentNews?.title_en,
      title_ru: title_ru || currentNews?.title_ru,
      title_uz: title_uz || currentNews?.title_uz,
      description_en: description_en || currentNews?.description_en,
      description_ru: description_ru || currentNews?.description_ru,
      description_uz: description_uz || currentNews?.description_uz,
      published_date: published_date || currentNews?.published_date,
    }

    const response = await newsDB.replaceOne({ id: newsId }, data)

    if (response.matchedCount === 0) return res.status(500).json({ message: 'Current Company News not found!' })

    res.status(200).json({ message: 'Current Company News successfull edited!' })
  } catch (error) {
    res.status(500).json({ message: 'Error in editing Current Company News!' })
  }
}

export async function deleteCurrentNews(req: Request, res: Response) {
  try {
    const newsId = req.params.id

    // Get current news
    const currentNews: ICompanyNews | null = (await getCurrentDataInDBCollection(dbNames.companyDB, companyDBCollections.news, newsId)) as ICompanyNews | null

    // deleting news image
    const imageId = (currentNews?.image as any) || ''
    const responseImage = await deleteCurrentDataInDBCollection(dbNames.images, companyDBCollections.news, imageId)
    if (responseImage.deletedCount === 0) return res.status(500).json({ message: 'Current Company News image not found!' })

    // deleting news
    const response = await deleteCurrentDataInDBCollection(dbNames.companyDB, companyDBCollections.news, newsId)

    if (response.deletedCount === 0) return res.status(500).json({ message: 'Current Company News not found!' })

    res.status(200).json({ message: 'Current Company News successfull deleted!' })
  } catch (error) {
    res.status(500).json({ message: error })
  }
}

export async function deleteManyCompanyNews(req: Request, res: Response) {
  try {
    const newsId = JSON.parse(req.params.id) as string[]

    // Validate if IDs are provided
    if (!newsId || !Array.isArray(newsId) || newsId.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty array of newsId' })
    }
    // Get all images in db collection
    const imageDB = getDBCollection(dbNames.images, companyDBCollections.news)
    const imagesDB = await imageDB.find({}).toArray() as IImage[] | []

    // Convert each string ID to ObjectID
    const objectIds = newsId?.map((id: string) => new ObjectId(id))

    // Get current collection in db
    const newsDB = getDBCollection(dbNames.companyDB, companyDBCollections.news)

    // Find documents with the specified IDs
    const currentNews = (await newsDB.find({ _id: { $in: objectIds } }).toArray()) as ICompanyNews[] | []

    const imagesId: string[] = []
    currentNews?.map((item: ICompanyNews) => {
      imagesId.push(item?.image)
    })

    const imagesValidId: string[] = []
    imagesDB?.map((image: IImage) => {
      if (imagesId?.includes(image?.id)) {
        imagesValidId.push(image?._id)
      }
    })

    // Convert each string ID to ObjectID
    const objectImagesIds = imagesValidId.map((id) => new ObjectId(id))

    // Deleting news images in DB Collection
    const resultImage = await imageDB.deleteMany({ _id: { $in: objectImagesIds } })
    if (resultImage?.deletedCount === 0) return res.status(500).json({ message: 'current Company News images not found!' })

    // Delete documents with the specified IDs
    const result = await newsDB.deleteMany({ _id: { $in: objectIds } })

    if (result?.deletedCount === 0) return res.status(500).json({ message: 'Current Company News not found!' })
    res.status(200).json({ message: `${result.deletedCount} current Company News deleted!` })
  } catch (error) {
    res.status(500).json({ message: 'Error in deleting current Company News, please try again later!' })
  }
}

export async function getStatistics(req: Request, res: Response) {
  try {
    const categories: Collection<Document> = getDBCollection(dbNames.contentDB, contentDBCollections.categories) as Collection<Document>
    const products: Collection<Document> = getDBCollection(dbNames.contentDB, contentDBCollections.products) as Collection<Document>
    const materials: Collection<Document> = getDBCollection(dbNames.contentDB, contentDBCollections.materials) as Collection<Document>
    const manufacturers: Collection<Document> = getDBCollection(dbNames.contentDB, contentDBCollections.manufacturer) as Collection<Document>
    const colors: Collection<Document> = getDBCollection(dbNames.contentDB, contentDBCollections.colors) as Collection<Document>
    const news: Collection<Document> = getDBCollection(dbNames.companyDB, companyDBCollections.news) as Collection<Document>

    if (!categories || !products || !materials || !manufacturers || !colors || !news) {
      return res.status(500).json(null)
    }
    const statistics = {
      id: v4(),
      categories: await categories?.countDocuments(),
      products: await products?.countDocuments(),
      materials: await materials?.countDocuments(),
      manufacturers: await manufacturers?.countDocuments(),
      colors: await colors?.countDocuments(),
      news: await news?.countDocuments(),
    }

    res.status(200).json(statistics)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
}