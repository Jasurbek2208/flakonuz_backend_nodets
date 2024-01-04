require('dotenv').config()

export default function passwordHasher(password: string, userId: string, method: 'UNHASH' | 'HASH' = 'UNHASH') {
  const checkerId: string = `${process?.env?.PASSWORD_CHACKER_ID}`
  if (method === 'UNHASH') {
    const firstUnHash: string = password?.split(checkerId)[1]
    const secondUnHash: string[] = firstUnHash?.split(userId)
    const thirdUnHash: string = secondUnHash?.join('')
    return thirdUnHash
  } else if (method === 'HASH') {
    const firsHash: string = password?.split('')?.join(userId)
    const secondHash: string = [checkerId, firsHash, checkerId]?.join('')
    return secondHash
  }
}