import type { ApiKeys } from '../types'

// Encrypted API keys — safe to commit. AES-256-GCM, PBKDF2 200k rounds.
// Regenerate with: node scripts/encrypt-keys.mjs
export const VAULT = {
  "salt": "Gox4OtykUSmEjvmp4xJ6Yw==",
  "iv": "55LFasQIRifv0Z1o",
  "tag": "Q9jB0RuZ3YMr3DvKJTr8AQ==",
  "ct": "bvr3Z4Vm1t5P++wbMrxsy6AVu6BbAzC/Bewa9YEAzoGLy/EH1190fhAuoeNs+UZv63xLETWGDjfzFwcRLvKKJXPD29s/qgFcrIHQZ/nj3OUDoMp5xcbM3t4d3J7zWUnmfX/Ye5ou/6zfTpIGnVnH+gP9O/MdjK+nacUJEa8eXSQqFoTHniDAbHO9YT0VER6cAo0PufM7KNPeVQgpqVOWvQRdjUSURjgtgibphSqGPuZJl9wNMt1MwD4Fog17lGyoLIFbh4Zx5iwFZ6y7HPv70WGYFJxt/SIZ9HpJK+N63S6kuOe0heqeYV1ravbGvjiHdu2X/c3DijNhEPgbFYtg9aNbWMNYAZjSr/Tf5SE58VKhD64PXS7ioyqYd5Q3qDqbZrwIBzbutXfjkXMM/FYsOOmbE5UodxmMJn4C0z3fpN2tgRo4NDTC9X7CnJktUc4dG9HB6ZjTnzkgte0M5vhl/jbkUUUsU87S2DAdA8bTO4rdbSfI+5HNEq//wTDaBtoqBfjO30CjvXXQPwCgkk5qredomUT+hHUavzRavIFiCjSNRXHkk7K2NXwj77DBOK4NVJPnD3QuodyHOTs0"
} as const

function b64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

export async function decryptVault(password: string): Promise<ApiKeys> {
  const enc = new TextEncoder()

  const rawKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: b64(VAULT.salt),
      iterations: 200_000,
      hash: 'SHA-256',
    },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )

  // AES-GCM expects ciphertext + auth tag concatenated
  const ct  = b64(VAULT.ct)
  const tag = b64(VAULT.tag)
  const ctWithTag = new Uint8Array(ct.length + tag.length)
  ctWithTag.set(ct)
  ctWithTag.set(tag, ct.length)

  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64(VAULT.iv) },
    aesKey,
    ctWithTag,
  )

  const plain = new TextDecoder().decode(plainBuf)
  return JSON.parse(plain) as ApiKeys
}
