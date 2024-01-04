import { Request, Response } from 'express'
import { v4 } from 'uuid'
import fs from 'fs'

// MongoDB functions
import { getDBCollection, uploadImageToLocalDB } from '../mongoDataBase'

// Constants
import { adminsDBCollections, dbNames } from '../utils/constants'

// Utils
import fileDelete from '../utils/fileDelete'
import updateDB from '../utils/updateDBJSON'
import passwordHasher from '../utils/passwordHasher'

// Types
import { IUser } from '../types'

// MongoDB collections
const admins = getDBCollection(dbNames.admins, adminsDBCollections.admins)

// Update user profile
export async function updateProfile(req: Request, res: Response) {
  const { name, surname, username } = req?.body
  const userId = req.params.id
  const token: string | undefined = req?.headers?.authorization

  if (!token) {
    res.status(400)
    return res.json({ message: 'Unauthorized! Token not found in request headers!' })
  }
  if (!name || !surname || !username) return res.status(401).json({ message: 'Username and password required!' })
  if (name?.length < 3 || name?.length > 20) return res.status(401).json({ message: 'The length of the "Firstname" should be 4 characters more and less than 20 characters!' })
  if (surname?.length < 3 || surname?.length > 20) return res.status(401).json({ message: 'The length of the "Lastname" should be 4 characters more and less than 20 characters!' })
  if (username?.length < 4 || username?.length > 12) return res.status(401).json({ message: 'The length of the "Username" should be 4 characters more and less than 12 characters!' })

  const currentUser: IUser | null = (await admins.findOne({ id: userId })) as IUser | null
  if (!currentUser || currentUser.access_token !== token) {
    res.status(401)
    return res.json({
      message: 'User not found!',
    })
  }
  const user: IUser = {
    ...currentUser,
    name,
    surname,
    username,
  }

  const response = await admins.replaceOne({ id: user?.id }, user)
  if (response.matchedCount === 0) return res.status(404).json({ message: 'Product not found!' })

  res.status(200).json({
    status: 200,
    message: 'Your profile successfull updated!',
    user: { _id: user?._id, id: user?.id, name: user?.name, surname: user?.surname, username: user?.username },
  })
}

// Update user profile image
export async function updateProfileImage(req: Request, res: Response) {
  const userId = req.params.id
  const file = req.file

  if (!file) return res.status(400).json({ message: 'No file uploaded.' })

  const currentUser: IUser | null = (await admins.findOne({ id: userId })) as IUser | null
  if (!currentUser) {
    res.status(401)
    return res.json({
      message: 'User not found!',
    })
  }
  const imageId = currentUser?.image || v4()
  const fileName = `src/uploads/${file.filename}`

  fs.readFile(fileName, async (err, data) => {
    if (err) return res.status(404).json({ message: 'Image file not found!' })
    try {
      await uploadImageToLocalDB('USERS', imageId, fileName)
    } catch {
      res.status(500).json({ message: 'Error in saving image file!' })
    }
  })

  const user: IUser = {
    ...currentUser,
    image: imageId,
  }

  const response = await admins.replaceOne({ id: user?.id }, user)
  if (response.matchedCount === 0) return res.status(404).json({ message: 'Product not found!' })

  const db = await updateDB('USERS', null, 'GET')
  const currentDBImage = await db.find((item: any) => item?.id === imageId)

  res.status(200).json({
    status: 200,
    message: 'Your profile image successfull updated!',
    image: currentDBImage,
  })
}

// Update user profile image
export async function deleteProfileImage(req: Request, res: Response) {
  const userId = req.params.id

  const currentUser: IUser | null = (await admins.findOne({ id: userId })) as IUser | null
  if (!currentUser) {
    res.status(401)
    return res.json({
      message: 'User not found!',
    })
  }
  const imageId = currentUser?.image || ''

  const user: IUser = {
    ...currentUser,
    image: '',
  }

  const response = await admins.replaceOne({ id: user?.id }, user)
  if (response.matchedCount === 0) return res.status(404).json({ message: 'Product not found!' })

  await updateDB('USERS', null, 'DELETE', imageId)

  res.status(200).json({
    status: 200,
    message: 'Your profile image successfull deleted!',
    image: '',
  })
}

// Update Password
export async function updateProfilePassword(req: Request, res: Response) {
  const { password, newPassword } = req?.body
  const userId = req.params.id

  if (!newPassword || !password) return res.status(401).json({ message: 'Password and New Password required!' })
  if (password?.length < 4 || password?.length > 8) return res.status(401).json({ message: 'The length of the "Password" should be 4 characters more and less than 8 characters!' })
  if (newPassword?.length < 4 || newPassword?.length > 8) return res.status(401).json({ message: 'The length of the "newPassword" should be 4 characters more and less than 8 characters!' })

  const currentUser: IUser | null = (await admins.findOne({ id: userId })) as IUser | null

  if (!currentUser) return res.status(401).json({ message: 'Your current password entered incorrectly!' })

  const validPassword = passwordHasher(currentUser?.password, currentUser?.id)

  if (newPassword && password && password === validPassword) {
    const hashedPassword = passwordHasher(newPassword, currentUser?.id, 'HASH')

    const user: IUser = {
      ...currentUser,
      password: hashedPassword || currentUser?.password,
    }

    const response = await admins.replaceOne({ id: user?.id }, user)
    if (response.matchedCount === 0) return res.status(404).json({ message: 'User not found!' })

    res.status(200).json({
      status: 200,
      message: 'Your password successfull edited!',
      user: { _id: user?._id, name: user?.name, surname: user?.surname, username: user?.username, image: user?.image },
    })
  } else {
    res.status(401)
    res.json({ message: 'Username or password entered incorrectly!' })
  }
}