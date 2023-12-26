import express, { Request, Response } from 'express'

// constants
import { dbNames, imagesDBCollections } from '../utils/constants'

// Controllers
import { getCurrentImage } from '../controllers/images'

const router = express.Router()

// ===========================Images routes===========================
// Catalog images
router.get('/catalogs/:id', async (req: Request, res: Response) => {
  const imageId = req.params.id

  const imageData = await getCurrentImage(dbNames.images, imagesDBCollections.categories, imageId)
  res.json(imageData)
})

// Category images
router.get('/categories/:id', async (req: Request, res: Response) => {
  const imageId = req.params.id

  const imageData = await getCurrentImage(dbNames.images, imagesDBCollections.categories, imageId)
  res.json(imageData)
})

// Product images
router.get('/products/:id', async (req: Request, res: Response) => {
  const imageId = req.params.id

  const imageData = await getCurrentImage(dbNames.images, imagesDBCollections.products, imageId)
  res.json(imageData)
})

// About images
router.get('/about/:id', async (req: Request, res: Response) => {
  const imageId = req.params.id

  const imageData = await getCurrentImage(dbNames.images, imagesDBCollections.about, imageId)
  res.json(imageData)
})

// Company news images
router.get('/news/:id', async (req: Request, res: Response) => {
  const imageId = req.params.id

  const imageData = await getCurrentImage(dbNames.images, imagesDBCollections.companyNews, imageId)
  res.json(imageData)
})

// Partners images
router.get('/partners/:id', async (req: Request, res: Response) => {
  const imageId = req.params.id

  const imageData = await getCurrentImage(dbNames.images, imagesDBCollections.partners, imageId)
  res.json(imageData)
})

export default router