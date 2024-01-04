import { Request, Response } from 'express'

// MongoDB
import { ObjectId } from 'mongodb'

// Types
import { IMaterial } from '../types'

// MongoDB functions
import { deleteCurrentDataInDBCollection, getAllDataInDBCollection, getCurrentDataInDBCollection, getDBCollection } from '../mongoDataBase'

// Constants
import { contentDBCollections, dbNames } from '../utils/constants'

export async function getMaterialsList(req: Request, res: Response) {
  try {
    const page = parseInt(req?.query?.page as string, 10) || 1
    const limit = parseInt(req?.query?.limit as string, 10) || 10
    const search = (req?.query?.search as string) || ''
    const searchParam: string = (req?.query?.searchParam as string) || ''

    // Get materials list with pagination and search
    const materialsList = await getAllDataInDBCollection(dbNames.contentDB, contentDBCollections.materials)

    // Apply search filter
    const filteredMaterials = materialsList?.filter((material) => {
      return material?.[searchParam]?.toLowerCase()?.includes(search?.toLowerCase())
    })

    // Calculate pagination limits
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    // Paginate the results
    const paginatedMaterials = filteredMaterials?.slice(startIndex, endIndex)

    // Send paginated materials
    res.status(200).json({
      materials: paginatedMaterials,
      pagination: {
        page,
        limit,
        total: filteredMaterials?.length,
        totalPages: Math.ceil(filteredMaterials?.length / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Error in getting materials. Try again later!' })
  }
}

export async function getCurrentMaterial(req: Request, res: Response) {
  try {
    const materialId = req.params.id

    // Get current material
    const material: IMaterial | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.materials, materialId)) as IMaterial | null

    if (!material) return res.status(404).json({ message: 'Material not found!' })

    // Send material
    res.status(200).json(material)
  } catch (error) {
    res.status(500).json({ message: error })
  }
}

export async function addCurrentMaterial(req: Request, res: Response) {
  try {
    const { id, title } = req.body

    if (!id || !title) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    // Get current material
    const materialDB = getDBCollection(dbNames.contentDB, contentDBCollections.materials)

    const data = {
      id: id,
      title: title || '',
    }

    const response = await materialDB.insertOne(data)
    if (!response.insertedId) return res.status(404).json({ message: 'Material not found!' })

    res.status(200).json({ message: 'Material successfull added!' })
  } catch (error) {
    res.status(500).json({ message: 'Error in adding new material, please try again later!' })
  }
}

export async function editCurrentMaterial(req: Request, res: Response) {
  try {
    const { title } = req.body
    const materialId = req.params.id

    if (!title) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    const materialDB = getDBCollection(dbNames.contentDB, contentDBCollections.materials)
    // Get current material
    const currentMaterial: IMaterial | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.materials, materialId)) as IMaterial | null

    const data = {
      ...currentMaterial,
      title: title || currentMaterial?.title,
    }

    const response = await materialDB.replaceOne({ id: materialId }, data)

    if (response.matchedCount === 0) return res.status(404).json({ message: 'Material not found!' })

    res.status(200).json({ message: 'Material successfull edited!' })
  } catch (error) {
    res.status(500).json({ message: 'Error in editing material!' })
  }
}

export async function deleteCurrentMaterial(req: Request, res: Response) {
  try {
    const materialId = req.params.id

    // deleting material
    const response = await deleteCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.materials, materialId)

    if (response.deletedCount === 0) return res.status(404).json({ message: 'Material not found!' })

    res.status(200).json({ message: 'Material successfull deleted!' })
  } catch (error) {
    res.status(500).json({ message: error })
  }
}

export async function deleteManyMaterial(req: Request, res: Response) {
  try {
    const materialsId = JSON.parse(req.params.id) as string[]

    // Validate if IDs are provided
    if (!materialsId || !Array.isArray(materialsId) || materialsId.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty array of materialsId' })
    }

    // Convert each string ID to ObjectID
    const objectIds = materialsId?.map((id: string) => new ObjectId(id))

    // Get current collection in db
    const materialDB = getDBCollection(dbNames.contentDB, contentDBCollections.materials)

    // Delete documents with the specified IDs
    const result = await materialDB.deleteMany({ _id: { $in: objectIds } })

    if (result?.deletedCount === 0) return res.status(404).json({ message: 'Materials not found!' })
    res.status(200).json({ message: `${result.deletedCount} materials deleted!` })
  } catch (error) {
    res.status(500).json({ message: 'Error in deleting materials, please try again later!' })
  }
}