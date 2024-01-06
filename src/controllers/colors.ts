import { Request, Response } from 'express'

// MongoDB
import { ObjectId } from 'mongodb'

// Types
import { IColor } from '../types'

// MongoDB functions
import { deleteCurrentDataInDBCollection, getAllDataInDBCollection, getCurrentDataInDBCollection, getDBCollection } from '../mongoDataBase'

// Constants
import { contentDBCollections, dbNames } from '../utils/constants'

export async function getColorsList(req: Request, res: Response) {
  try {
    const page = parseInt(req?.query?.page as string, 10) || 1
    const limit = parseInt(req?.query?.limit as string, 10) || 10
    const search = (req?.query?.search as string) || ''
    const searchParam: string = (req?.query?.searchParam as string) || ''

    // Get colors list with pagination and search
    const colorsList = await getAllDataInDBCollection(dbNames.contentDB, contentDBCollections.colors)

    // Apply search filter
    const filteredColors = colorsList?.filter((color) => {
      return color?.[searchParam]?.toLowerCase()?.includes(search?.toLowerCase())
    })

    // Calculate pagination limits
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    // Paginate the results
    const paginatedColors = filteredColors?.slice(startIndex, endIndex)

    // Send paginated colors
    res.status(200).json({
      colors: paginatedColors,
      pagination: {
        page,
        limit,
        total: filteredColors?.length,
        totalPages: Math.ceil(filteredColors?.length / limit),
      },
    })
    return
  } catch (error) {
    res.status(500).json({ message: 'Error in getting colors. Try again later!' })
    return
  }
}

export async function getCurrentColor(req: Request, res: Response) {
  try {
    const colorId = req.params.id

    // Get current color
    const color: IColor | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.colors, colorId)) as IColor | null

    if (!color) return res.status(404).json({ message: 'Color not found!' })

    // Send color
    res.status(200).json(color)
    return
  } catch (error) {
    res.status(500).json({ message: error })
    return
  }
}

export async function addCurrentColor(req: Request, res: Response) {
  try {
    const { id, title_en, title_ru, title_uz } = req.body

    if (!id || !title_en || !title_ru || !title_uz) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    // Get current color
    const colorDB = getDBCollection(dbNames.contentDB, contentDBCollections.colors)

    const data = {
      id: id,
      title_en,
      title_ru,
      title_uz,
    }

    const response = await colorDB.insertOne(data)
    if (!response.insertedId) return res.status(404).json({ message: 'Color not found!' })

    res.status(200).json({ message: 'Color successfull added!' })
    return
  } catch (error) {
    res.status(500).json({ message: 'Error in adding new color, please try again later!' })
    return
  }
}

export async function editCurrentColor(req: Request, res: Response) {
  try {
    const { title_en, title_ru, title_uz } = req.body
    const colorId = req.params.id

    if (!title_en || !title_ru || !title_uz) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    const colorDB = getDBCollection(dbNames.contentDB, contentDBCollections.colors)
    // Get current color
    const currentColor: IColor | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.colors, colorId)) as IColor | null

    const data = {
      ...currentColor,
      title_en: title_en || currentColor?.title_en,
      title_ru: title_ru || currentColor?.title_ru,
      title_uz: title_uz || currentColor?.title_uz,
    }

    const response = await colorDB.replaceOne({ id: colorId }, data)

    if (response.matchedCount === 0) return res.status(404).json({ message: 'Color not found!' })

    res.status(200).json({ message: 'Color successfull edited!' })
    return
  } catch (error) {
    res.status(500).json({ message: 'Error in editing color!' })
    return
  }
}

export async function deleteCurrentColor(req: Request, res: Response) {
  try {
    const colorId = req.params.id

    // deleting color
    const response = await deleteCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.colors, colorId)

    if (response.deletedCount === 0) return res.status(404).json({ message: 'Color not found!' })

    res.status(200).json({ message: 'Color successfull deleted!' })
    return
  } catch (error) {
    res.status(500).json({ message: error })
    return
  }
}

export async function deleteManyColor(req: Request, res: Response) {
  try {
    const colorsId = JSON.parse(req.params.id) as string[]

    // Validate if IDs are provided
    if (!colorsId || !Array.isArray(colorsId) || colorsId.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty array of colorsId' })
    }

    // Convert each string ID to ObjectID
    const objectIds = colorsId?.map((id: string) => new ObjectId(id))

    // Get current collection in db
    const colorDB = getDBCollection(dbNames.contentDB, contentDBCollections.colors)

    // Delete documents with the specified IDs
    const result = await colorDB.deleteMany({ _id: { $in: objectIds } })

    if (result?.deletedCount === 0) return res.status(404).json({ message: 'Colors not found!' })
    res.status(200).json({ message: `${result.deletedCount} colors deleted!` })
    return
  } catch (error) {
    res.status(500).json({ message: 'Error in deleting colors, please try again later!' })
    return
  }
}