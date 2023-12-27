import express from 'express'
import cors from 'cors'
require('dotenv').config()

// Routers
import { aboutRoutes, authRoutes, categoriesRoutes, materialsRoutes, imagesRoutes, productsRoutes, colorsRoutes, manufacturersRoutes } from './router'

// MongoDB
import { Connect } from './mongoDataBase'

const app = express()
const PORT = process.env.PORT || 3000

// app.use(express.json())
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.use(cors(corsOptions));

// app.use((req: Request, res: Response, next: NextFunction) => {
//   res.header('Access-Control-Allow-Origin', '*')
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
//   next()
// })

// ========== Routes ==========
// Auth routes
app.use('/api/auth', authRoutes)

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

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})
