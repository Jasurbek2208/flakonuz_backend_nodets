import fs from 'fs'
import { v4 } from 'uuid'
import { Request, Response } from 'express'

// MongoDB
import { Collection, Document, ObjectId } from 'mongodb'

// Types
import { ICategoryData, IImage } from '../types'

// MongoDB functions
import { deleteCurrentDataInDBCollection, getAllDataInDBCollection, getCurrentDataInDBCollection, getDBCollection, uploadImageToDB } from '../mongoDataBase'

// Constants
import { contentDBCollections, dbNames, imagesDBCollections } from '../utils/constants'

export async function getCategoriesList(req: Request, res: Response) {
  try {
    const page = parseInt(req?.query?.page as string, 10) || 1
    const limit = parseInt(req?.query?.limit as string, 10) || 10
    const search = (req?.query?.search as string) || ''
    const searchParam = (req?.query?.searchParam as string) || 'title_en'

    // Get category list with pagination and search
    const categoriesList = await getAllDataInDBCollection(dbNames.contentDB, contentDBCollections.categories)

    // Apply search filter
    const filteredCategories = categoriesList?.filter((category) => {
      return category?.[searchParam]?.toLowerCase()?.includes(search?.toLowerCase())
    })

    // Calculate pagination limits
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const paginatedCategories = filteredCategories?.slice(startIndex, endIndex)

    const images: Collection<Document> | string = getDBCollection(dbNames.images, imagesDBCollections.categories)
    const categoriesWithImages = await Promise.all(
      paginatedCategories?.map(async (category) => {
        const image = images && typeof images !== 'string' ? await images.findOne({ id: category?.image }) : ''
        return { ...category, image }
      }),
    )

    // Send paginated categories
    res.status(200).json({
      categories: categoriesWithImages,
      pagination: {
        page,
        limit,
        total: filteredCategories?.length,
        totalPages: Math.ceil(filteredCategories?.length / limit),
      },
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error in getting categories. Try again later!' })
  }
}

export async function getCurrentCategory(req: Request, res: Response) {
  try {
    const categoryId = req.params.id

    // Get current category
    const category: ICategoryData | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.categories, categoryId)) as ICategoryData | null

    if (!category) return res.status(404).json({ message: 'Category not found!' })
    const imagesDB: Collection<Document> | string = getDBCollection(dbNames.images, imagesDBCollections.products)

    // Enhance with images
    const categoryWithImage = { ...category, image: imagesDB && typeof imagesDB !== 'string' ? await imagesDB.findOne({ id: category?.image }) : '' }

    // Send category
    res.status(200).json(categoryWithImage)
  } catch (error) {
    res.status(500).json({ message: error })
  }
}

export async function addCurrentCategory(req: Request, res: Response) {
  try {
    const { id, title_en, title_ru, title_uz, aboutCategory_en, aboutCategory_ru, aboutCategory_uz } = req.body
    // Handle the uploaded file
    const file = req.file
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' })
    }

    if (!id || !title_en || !title_ru || !title_uz) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    // Get current category
    const categoryDB = getDBCollection(dbNames.contentDB, contentDBCollections.categories)

    const imageId = v4()
    const fileName = `src/uploads/${file.filename}`

    fs.readFile(fileName, async (err, data) => {
      if (err) return res.status(404).json({ message: 'Image file not found!' })
      try {
        await uploadImageToDB(dbNames.images, contentDBCollections.categories, imageId, fileName)
      } catch {
        res.status(500).json({ message: 'Error in saving image file!' })
      }
    })

    const data = {
      id: id,
      title_en: title_en || '',
      title_ru: title_ru || '',
      title_uz: title_uz || '',
      image: imageId || '',
      aboutCategory_en: aboutCategory_en || '',
      aboutCategory_ru: aboutCategory_ru || '',
      aboutCategory_uz: aboutCategory_uz || '',
    }

    const response = await categoryDB.insertOne(data)
    if (!response.insertedId) return res.status(404).json({ message: 'Category not found!' })

    res.status(200).json({ message: 'Category successfull added!' })
  } catch (error) {
    res.status(500).json({ message: 'Error in adding new category, please try again later!' })
  }
}

export async function editCurrentCategory(req: Request, res: Response) {
  try {
    const { title_en, title_ru, title_uz, aboutCategory_en, aboutCategory_ru, aboutCategory_uz } = req.body
    const categoryId = req.params.id
    // Handle the uploaded file
    const file = req.file

    if (!title_en || !title_ru || !title_uz) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    const categoryDB = getDBCollection(dbNames.contentDB, contentDBCollections.categories)
    // Get current category
    const currentCategory: ICategoryData | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.categories, categoryId)) as ICategoryData | null

    const imageId = v4()
    if (file) {
      const fileName = `src/uploads/${file.filename}`

      // deleting category image
      const currentImageId = (currentCategory?.image as any) || ''
      const responseImage = await deleteCurrentDataInDBCollection(dbNames.images, contentDBCollections.categories, currentImageId)
      if (responseImage.deletedCount === 0) return res.status(404).json({ message: 'Category image not found in database!' })

      fs.readFile(fileName, async (err, data) => {
        if (err) return res.status(404).json({ message: 'Image file not found!' })
        try {
          await uploadImageToDB(dbNames.images, contentDBCollections.categories, imageId, fileName)
        } catch {
          res.status(500).json({ message: 'Error in saving image file!' })
        }
      })
    }

    const data = {
      ...currentCategory,
      id: title_en?.split(' ')?.join('-')?.toLocaleLowerCase() || currentCategory?.id,
      title_en: title_en || currentCategory?.title_en,
      title_ru: title_ru || currentCategory?.title_ru,
      title_uz: title_uz || currentCategory?.title_uz,
      image: file ? imageId : currentCategory?.image,
      aboutCategory_en: aboutCategory_en || currentCategory?.aboutCategory_en,
      aboutCategory_ru: aboutCategory_ru || currentCategory?.aboutCategory_ru,
      aboutCategory_uz: aboutCategory_uz || currentCategory?.aboutCategory_uz,
    }
    if (data.categories) {
      delete data.categories
    }
    delete (data as any)?.aboutCatalog_en
    delete (data as any)?.aboutCatalog_ru
    delete (data as any)?.aboutCatalog_uz

    const response = await categoryDB.replaceOne({ id: categoryId }, data)

    if (response.matchedCount === 0) return res.status(404).json({ message: 'Category not found!' })

    res.status(200).json({ message: 'Category successfull edited!' })
  } catch (error) {
    res.status(500).json({ message: 'Error in editing category!' })
  }
}

export async function deleteCurrentCategory(req: Request, res: Response) {
  try {
    const categoryId = req.params.id

    // Get current category
    const currentCategory: ICategoryData | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.categories, categoryId)) as ICategoryData | null

    // deleting category image
    const imageId = (currentCategory?.image as any) || ''
    const responseImage = await deleteCurrentDataInDBCollection(dbNames.images, contentDBCollections.categories, imageId)
    if (responseImage.deletedCount === 0) return res.status(404).json({ message: 'Category image not found!' })

    // deleting category
    const response = await deleteCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.categories, categoryId)

    if (response.deletedCount === 0) return res.status(404).json({ message: 'Category not found!' })

    res.status(200).json({ message: 'Category successfull deleted!' })
  } catch (error) {
    res.status(500).json({ message: error })
  }
}

export async function deleteManyCategories(req: Request, res: Response) {
  try {
    const categoriesId = JSON.parse(req.params.id) as string[]

    // Validate if IDs are provided
    if (!categoriesId || !Array.isArray(categoriesId) || categoriesId.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty array of categoriesId' })
    }
    // Get all images in db collection
    const imageDB = getDBCollection(dbNames.images, contentDBCollections.categories)
    const imagesDB = (await imageDB.find({}).toArray()) as IImage[] | []

    // Convert each string ID to ObjectID
    const objectIds = categoriesId?.map((id: string) => new ObjectId(id))

    // Get current collection in db
    const categoryDB = getDBCollection(dbNames.contentDB, contentDBCollections.categories)

    // Find documents with the specified IDs
    const currentCategories = (await categoryDB.find({ _id: { $in: objectIds } }).toArray()) as ICategoryData[] | []

    const imagesId: string[] = []
    currentCategories?.map((category: ICategoryData) => {
      imagesId.push(category?.image)
    })

    const imagesValidId: string[] = []
    imagesDB?.map((image: IImage) => {
      if (imagesId?.includes(image?.id)) {
        imagesValidId.push(image?._id)
      }
    })

    // Convert each string ID to ObjectID
    const objectImagesIds = imagesValidId.map((id) => new ObjectId(id))

    // Deleting categories images in DB Collection
    const resultImage = await imageDB.deleteMany({ _id: { $in: objectImagesIds } })
    if (resultImage?.deletedCount === 0) return res.status(404).json({ message: 'Categories images not found!' })

    // Delete documents with the specified IDs
    const result = await categoryDB.deleteMany({ _id: { $in: objectIds } })

    if (result?.deletedCount === 0) return res.status(404).json({ message: 'Categories not found!' })
    res.status(200).json({ message: `${result.deletedCount} categories deleted!` })
  } catch (error) {
    res.status(500).json({ message: 'Error in deleting categories, please try again later!' })
  }
}