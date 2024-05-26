import { hash, verify, Algorithm, Version } from '@node-rs/argon2'

export async function hashPassword(password: string) {
  return hash(password, {
    algorithm: Algorithm.Argon2id,
    version: Version.V0x13,
  })
}

export async function verifyPassword(password: string, ciphertext: string) {
  return verify(ciphertext, password, {
    algorithm: Algorithm.Argon2id,
    version: Version.V0x13,
  })
}
