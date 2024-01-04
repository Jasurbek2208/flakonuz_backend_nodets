import { Request, Response } from 'express'

// MongoDB
import { ObjectId } from 'mongodb'

// Types
import { IManufacturer } from '../types'

// MongoDB functions
import { deleteCurrentDataInDBCollection, getAllDataInDBCollection, getCurrentDataInDBCollection, getDBCollection } from '../mongoDataBase'

// Constants
import { contentDBCollections, dbNames } from '../utils/constants'

export async function getManufacturerList(req: Request, res: Response) {
  try {
    const page = parseInt(req?.query?.page as string, 10) || 1
    const limit = parseInt(req?.query?.limit as string, 10) || 10
    const search = (req?.query?.search as string) || ''
    const searchParam: string = (req?.query?.searchParam as string) || ''

    // Get manufacturers list with pagination and search
    const manufacturerList = await getAllDataInDBCollection(dbNames.contentDB, contentDBCollections.manufacturer)

    // Apply search filter
    const filteredManufacturer = manufacturerList?.filter((manufacturer) => {
      return manufacturer?.[searchParam]?.toLowerCase()?.includes(search?.toLowerCase())
    })

    // Calculate pagination limits
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    // Paginate the results
    const paginatedManufacturer = filteredManufacturer?.slice(startIndex, endIndex)

    // Send paginated manufacturers
    res.status(200).json({
      manufacturers: paginatedManufacturer,
      pagination: {
        page,
        limit,
        total: filteredManufacturer?.length,
        totalPages: Math.ceil(filteredManufacturer?.length / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Error in getting manufacturers. Try again later!' })
  }
}

export async function getCurrentManufacturer(req: Request, res: Response) {
  try {
    const manufacturerId = req.params.id

    // Get current manufacturer
    const manufacturer: IManufacturer | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.manufacturer, manufacturerId)) as IManufacturer | null

    if (!manufacturer) return res.status(404).json({ message: 'Manufacturer not found!' })

    // Send manufacturer
    res.status(200).json(manufacturer)
  } catch (error) {
    res.status(500).json({ message: error })
  }
}

export async function addCurrentManufacturer(req: Request, res: Response) {
  try {
    const { id, title_en, title_ru, title_uz } = req.body

    if (!id || !title_en || !title_ru || !title_uz) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    // Get current manufacturer
    const manufacturerDB = getDBCollection(dbNames.contentDB, contentDBCollections.manufacturer)

    const data = {
      id,
      title_en,
      title_ru,
      title_uz,
    }

    const response = await manufacturerDB.insertOne(data)
    if (!response.insertedId) return res.status(404).json({ message: 'Manufacturer not found!' })

    res.status(200).json({ message: 'Manufacturer successfull added!' })
  } catch (error) {
    res.status(500).json({ message: 'Error in adding new manufacturer, please try again later!' })
  }
}

export async function editCurrentManufacturer(req: Request, res: Response) {
  try {
    const { title_en, title_ru, title_uz } = req.body
    const manufacturerId = req.params.id

    if (!title_en || !title_ru || !title_uz) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    const manufacturerDB = getDBCollection(dbNames.contentDB, contentDBCollections.manufacturer)
    // Get current manufacturer
    const currentManufacturer: IManufacturer | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.manufacturer, manufacturerId)) as IManufacturer | null

    const data = {
      ...currentManufacturer,
      title_en: title_en || currentManufacturer?.title_en,
      title_ru: title_ru || currentManufacturer?.title_ru,
      title_uz: title_uz || currentManufacturer?.title_uz,
    }

    const response = await manufacturerDB.replaceOne({ id: manufacturerId }, data)

    if (response.matchedCount === 0) return res.status(404).json({ message: 'Manufacturer not found!' })

    res.status(200).json({ message: 'Manufacturer successfull edited!' })
  } catch (error) {
    res.status(500).json({ message: 'Error in editing manufacturer!' })
  }
}

export async function deleteCurrentManufacturer(req: Request, res: Response) {
  try {
    const manufacturerId = req.params.id

    // deleting manufacturer
    const response = await deleteCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.manufacturer, manufacturerId)

    if (response.deletedCount === 0) return res.status(404).json({ message: 'Manufacturer not found!' })

    res.status(200).json({ message: 'Manufacturer successfull deleted!' })
  } catch (error) {
    res.status(500).json({ message: error })
  }
}

export async function deleteManyManufacturer(req: Request, res: Response) {
  try {
    const manufacturersId = JSON.parse(req.params.id) as string[]

    // Validate if IDs are provided
    if (!manufacturersId || !Array.isArray(manufacturersId) || manufacturersId.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty array of manufacturersId' })
    }

    // Convert each string ID to ObjectID
    const objectIds = manufacturersId?.map((id: string) => new ObjectId(id))

    // Get current collection in db
    const manufacturerDB = getDBCollection(dbNames.contentDB, contentDBCollections.manufacturer)

    // Delete documents with the specified IDs
    const result = await manufacturerDB.deleteMany({ _id: { $in: objectIds } })

    if (result?.deletedCount === 0) return res.status(404).json({ message: 'Manufacturers not found!' })
    res.status(200).json({ message: `${result.deletedCount} manufacturers deleted!` })
  } catch (error) {
    res.status(500).json({ message: 'Error in deleting manufacturers, please try again later!' })
  }
}