// authMiddleware.ts
import { Request, Response, NextFunction } from 'express'

// MongoDB functions
import { getDBCollection } from '../mongoDataBase'

// Constants
import { adminsDBCollections, dbNames } from '../utils/constants'

// MongoDB collections
const admins = getDBCollection(dbNames.admins, adminsDBCollections.admins)

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) return res.status(400).json({ message: 'Unauthorized!' })
  const token: string | undefined = req?.headers?.authorization

  const currentUser = await admins.findOne({ access_token: token })
  if (!currentUser) return res.status(401).json({ message: 'Unauthorized. Token not found in the database.' })
  
  return next()
}