import fs from 'fs'
import { v4 } from 'uuid'
import { Request, Response } from 'express'

// MongoDB
import { Collection, Document, ObjectId } from 'mongodb'

// Types
import { IImage, IProduct } from '../types'

// MongoDB functions
import { deleteCurrentDataInDBCollection, getAllDataInDBCollection, getCurrentDataInDBCollection, getDBCollection, uploadImageToDB } from '../mongoDataBase'

// Constants
import { contentDBCollections, dbNames, imagesDBCollections } from '../utils/constants'

export async function getProductsList(req: Request, res: Response) {
  try {
    const page = parseInt(req?.query?.page as string, 10) || 1
    const limit = parseInt(req?.query?.limit as string, 10) || 10
    const go = req?.query?.go
    const search = (req?.query?.search as string) || ''
    const searchParam: 'title' = (req?.query?.searchParam as 'title') || 'title'

    // Get products list with pagination and search
    const productsList: IProduct[] | [] = (await getAllDataInDBCollection(dbNames.contentDB, contentDBCollections.products)) as IProduct[] | []

    // Apply search filter
    const filteredProducts = productsList?.filter((product: IProduct) => {
      if (!go || go !== 'go-search') {
        return product?.[searchParam]?.toLowerCase()?.includes(search?.toLowerCase())
      } else {
        const category = req?.query?.parent
        const material = req?.query?.material
        const ob_min = Number(req?.query?.ob_min)
        const ob_max = Number(req?.query?.ob_max)

        return (
          (category ? product?.category === category : true) &&
          (material ? product?.material === material : true) &&
          (ob_min ? Number(product?.ml) >= ob_min : true) &&
          (ob_max ? Number(product?.ml) <= ob_max : true)
        )
      }
    })

    // Calculate pagination limits
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const paginatedProducts = filteredProducts?.slice(startIndex, endIndex)

    const images: Collection<Document> | string = getDBCollection(dbNames.images, imagesDBCollections.products)
    const productsWithImages = await Promise.all(
      paginatedProducts?.map(async (product) => {
        const image = images && typeof images !== 'string' ? await images.findOne({ id: product?.image }) : ''
        return { ...product, image }
      }),
    )

    // Send paginated products
    res.status(200).json({
      products: productsWithImages,
      pagination: {
        page,
        limit,
        total: filteredProducts?.length,
        totalPages: Math.ceil(filteredProducts?.length / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Error in getting products. Try again later!' })
  }
}

export async function getCurrentProduct(req: Request, res: Response) {
  try {
    const productId = req.params.id

    // Get current product
    const product: IProduct | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.products, productId)) as IProduct | null

    if (!product) return res.status(500).json({ message: 'Product not found!' })
    const imagesDB: Collection<Document> | string = getDBCollection(dbNames.images, imagesDBCollections.products)

    // Enhance with images
    const productWithImage = { ...product, image: imagesDB && typeof imagesDB !== 'string' ? await imagesDB.findOne({ id: product?.image }) : '' }

    // Send product
    res.status(200).json(productWithImage)
  } catch (error) {
    res.status(500).json({ message: error })
  }
}

export async function addCurrentProduct(req: Request, res: Response) {
  try {
    const { id, title, height, width, diameter, ml, material, category } = req.body
    // Handle the uploaded file
    const file = req.file
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' })
    }

    if (!id || !title || !height || !width || !diameter || !ml || !material || !category) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    // Get current product
    const productDB = getDBCollection(dbNames.contentDB, contentDBCollections.products)

    const imageId = v4()
    const fileName = `src/uploads/${file.filename}`

    fs.readFile(fileName, async (err, data) => {
      if (err) return res.status(500).json({ message: 'Image file not found!' })
      try {
        await uploadImageToDB(dbNames.images, contentDBCollections.products, imageId, fileName)
      } catch {
        res.status(500).json({ message: 'Error in saving image file!' })
      }
    })

    const data = {
      id: id,
      ml: ml || '',
      width: width || '',
      title: title || '',
      image: imageId || '',
      height: height || '',
      diameter: diameter || '',
      material: material || '',
      category: category || '',
    }

    const response = await productDB.insertOne(data)
    if (!response.insertedId) return res.status(500).json({ message: 'Product not found!' })

    res.status(200).json({ message: 'Product successfull added!' })
  } catch (error) {
    res.status(500).json({ message: 'Error in adding new product, please try again later!' })
  }
}

export async function editCurrentProduct(req: Request, res: Response) {
  try {
    const { title, height, width, diameter, ml, material, category } = req.body
    const productId = req.params.id
    const file = req.file

    if (!title || !height || !width || !diameter || !ml || !material || !category) {
      return res.status(400).json({ message: 'Params are required!' })
    }

    const productDB = getDBCollection(dbNames.contentDB, contentDBCollections.products)

    // Get current product
    const currentProduct: IProduct | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.products, productId)) as IProduct | null

    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found!' })
    }

    let imageId: string | undefined

    if (file) {
      const fileName = `src/uploads/${file.filename}`
      imageId = v4()

      // Deleting the existing product image
      const currentImageId = (currentProduct.image as string) || ''
      const responseImage = await deleteCurrentDataInDBCollection(dbNames.images, contentDBCollections.products, currentImageId)
      if (responseImage.deletedCount === 0) return res.status(404).json({ message: 'Product image not found in database!' })

      fs.readFile(fileName, async (err, data) => {
        if (err) return res.status(404).json({ message: 'Image file not found!' })
        try {
          await uploadImageToDB(dbNames.images, contentDBCollections.products, imageId || '', fileName)
        } catch {
          res.status(500).json({ message: 'Error in saving image file!' })
        }
      })
    }
    console.log('imageId: ', imageId)
    console.log('currentProduct?.image: ', currentProduct?.image)

    const data = {
      ...currentProduct,
      ml: ml || currentProduct?.ml,
      width: width || currentProduct?.width,
      title: title || currentProduct?.title,
      image: imageId || (currentProduct as any).image,
      height: height || currentProduct?.height,
      diameter: diameter || currentProduct?.diameter,
      material: material || currentProduct?.material,
      category: category || currentProduct?.category,
    }
    console.log('data: ', data)

    const response = await productDB.replaceOne({ id: productId }, data)
    if (response.matchedCount === 0) return res.status(404).json({ message: 'Product not found!' })
    res.status(200).json({ message: 'Product successfull edited!' })
  } catch (error) {
    res.status(500).json({ message: 'Error in editing product!' })
  }
}

export async function deleteCurrentProduct(req: Request, res: Response) {
  try {
    const productId = req.params.id

    // Get current product
    const currentProduct: IProduct | null = (await getCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.products, productId)) as IProduct | null

    // deleting product image
    const imageId = (currentProduct?.image as any) || ''
    const responseImage = await deleteCurrentDataInDBCollection(dbNames.images, contentDBCollections.products, imageId)
    if (responseImage.deletedCount === 0) return res.status(500).json({ message: 'Product image not found!' })

    // deleting product
    const response = await deleteCurrentDataInDBCollection(dbNames.contentDB, contentDBCollections.products, productId)

    if (response.deletedCount === 0) return res.status(500).json({ message: 'Product not found!' })

    res.status(200).json({ message: 'Product successfull deleted!' })
  } catch (error) {
    res.status(500).json({ message: error })
  }
}

export async function deleteManyProducts(req: Request, res: Response) {
  try {
    const productsId = JSON.parse(req.params.id) as string[]

    // Validate if IDs are provided
    if (!productsId || !Array.isArray(productsId) || productsId.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty array of productsId' })
    }
    // Get all images in db collection
    const imageDB = getDBCollection(dbNames.images, contentDBCollections.products)
    const imagesDB = (await imageDB.find({}).toArray()) as IImage[] | []

    // Convert each string ID to ObjectID
    const objectIds = productsId?.map((id: string) => new ObjectId(id))

    // Get current collection in db
    const productDB = getDBCollection(dbNames.contentDB, contentDBCollections.products)

    // Find documents with the specified IDs
    const currentProducts = (await productDB.find({ _id: { $in: objectIds } }).toArray()) as IProduct[] | []

    const imagesId: string[] = []
    currentProducts?.map((product: IProduct) => {
      imagesId.push(product?.image)
    })

    const imagesValidId: string[] = []
    imagesDB?.map((image: IImage) => {
      if (imagesId?.includes(image?.id)) {
        imagesValidId.push(image?._id)
      }
    })

    // Convert each string ID to ObjectID
    const objectImagesIds = imagesValidId.map((id) => new ObjectId(id))

    // Deleting products images in DB Collection
    const resultImage = await imageDB.deleteMany({ _id: { $in: objectImagesIds } })
    if (resultImage?.deletedCount === 0) return res.status(500).json({ message: 'Products images not found!' })

    // Delete documents with the specified IDs
    const result = await productDB.deleteMany({ _id: { $in: objectIds } })

    if (result?.deletedCount === 0) return res.status(500).json({ message: 'Products not found!' })
    res.status(200).json({ message: `${result.deletedCount} products deleted!` })
  } catch (error) {
    res.status(500).json({ message: 'Error in deleting products, please try again later!' })
  }
}