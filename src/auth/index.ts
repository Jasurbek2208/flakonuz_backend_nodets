import { Request, Response } from 'express'
import { adminsDBCollections, dbNames } from '../utils/constants'

// MongoDB functions
import { getDBCollection } from '../mongoDataBase'

// Utils
import passwordHasher from '../utils/passwordHasher'

// Types
import { IUser } from '../types'

// MongoDB collections
const admins = getDBCollection(dbNames.admins, adminsDBCollections.admins)

// Login
const login = async (req: Request, res: Response) => {
  const { username, password } = req?.body

  if (!username || !password) return res.status(401).json({ message: 'Username and password required!' })
  if (username?.length < 4 || username?.length > 8) return res.status(401).json({ message: 'The length of the "Username" should be 4 characters more and less than 8 characters!' })
  if (password?.length < 4 || password?.length > 8) return res.status(401).json({ message: 'The length of the "Password" should be 4 characters more and less than 8 characters!' })

  const user: IUser | null = (await admins.findOne({ username: username })) as IUser | null

  if (!user) return res.status(401).json({ message: 'Username or password entered incorrectly!' })

  const validPassword = passwordHasher(user?.password, user?.id)

  if (username && password && password === validPassword) {
    res.status(200)

    res.json({
      status: 200,
      message: 'You entered your account successfully!',
      user: { _id: user?._id, name: user?.name, surname: user?.surname, username: user?.username, image: user?.image },
      access_token: user?.access_token,
    })
  } else {
    res.status(401)
    res.json({ message: 'Username or password entered incorrectly!' })
  }
}

// UserME
const userme = async (req: Request, res: Response) => {
  const token: string | undefined = req?.headers?.authorization

  if (!token) {
    res.status(400)
    return res.json({ message: 'Token not found in request headers!' })
  }

  const currentUser = await admins.findOne({ access_token: token })

  if (!currentUser) {
    res.status(401)
    return res.json({
      message: 'Unauthorized. Token not found in the database.',
    })
  }

  res.status(200)
  res.json({
    status: 200,
    user: { _id: currentUser?._id, name: currentUser?.name, surname: currentUser?.surname, username: currentUser?.username, image: currentUser?.image },
  })
}

export { login, userme }
