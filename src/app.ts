import express, { Express, NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import http from 'http'
import cors from 'cors'
require('dotenv').config()

// Routers
import { aboutRoutes, authRoutes, userRoutes, categoriesRoutes, materialsRoutes, imagesRoutes, productsRoutes, colorsRoutes, manufacturersRoutes } from './router'

// MongoDB
import { Connect } from './mongoDataBase'

const app: Express = express()
const PORT = Number(process.env.PORT) || 3000
const EXTERNAL_IP = process.env.EXTERNAL_IP || '0.0.0.0'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.json())
// const corsOptions = {
//   origin: 'http://localhost:5173',
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true,
// }

app.use(cors())

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// ========== Routes ==========
// Auth routes
app.use('/api/auth', authRoutes)

// User routes
app.use('/api/user', userRoutes)

// Basic routes
app.use('/api/about', aboutRoutes)
app.use('/api/colors', colorsRoutes)
app.use('/api/get-image', imagesRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/materials', materialsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/manufacturers', manufacturersRoutes)
// ========== Routes ==========

// Connecting MongoDB
Connect()

const server = http.createServer(app)

server.listen(PORT, EXTERNAL_IP, () => {
  console.log(`Server running at http://${EXTERNAL_IP}:${PORT}`)
})