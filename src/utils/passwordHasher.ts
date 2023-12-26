require('dotenv').config()

export default function passwordHasher(password: string, userId: string) {
  const checkerId: string = `${process?.env?.PASSWORD_CHACKER_ID}`
  const firstHash: string = password?.split(checkerId)[1]
  const secondHash: string[] = firstHash?.split(userId)
  const thirdHash: string = secondHash?.join('')
  return thirdHash
}