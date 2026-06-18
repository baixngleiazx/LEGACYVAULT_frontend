const PBKDF2_ITERATIONS = 310000
const KEY_BYTES = 32
const DB_NAME = 'legacy-vault-keys'
const STORE_NAME = 'local-shards'

export interface EncryptedPayload {
  version: 1
  algorithm: 'AES-256-GCM'
  kdf: 'PBKDF2-SHA256'
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

export interface EncryptedPackage {
  encryptedData: string
  contentHash: string
  k1Shard: string
  k2Shard: string
  k3Shard: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function uint16ToBase64(values: Uint16Array): string {
  const bytes = new Uint8Array(values.length * 2)
  values.forEach((value, index) => {
    bytes[index * 2] = value & 0xff
    bytes[index * 2 + 1] = value >> 8
  })
  return bytesToBase64(bytes)
}

function base64ToUint16(base64: string): Uint16Array {
  const bytes = base64ToBytes(base64)
  const values = new Uint16Array(bytes.length / 2)
  for (let i = 0; i < values.length; i += 1) {
    values[i] = bytes[i * 2] | (bytes[i * 2 + 1] << 8)
  }
  return values
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: asBufferSource(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

function splitKey(rawKey: Uint8Array) {
  const coefficients = new Uint8Array(KEY_BYTES)
  crypto.getRandomValues(coefficients)
  const makeShare = (x: number) => {
    const values = new Uint16Array(KEY_BYTES + 1)
    values[0] = x
    for (let i = 0; i < KEY_BYTES; i += 1) {
      values[i + 1] = (rawKey[i] + coefficients[i] * x) % 257
    }
    return uint16ToBase64(values)
  }
  return {
    k1Shard: makeShare(1),
    k2Shard: makeShare(2),
    k3Shard: makeShare(3)
  }
}

function reconstructKey(shareA: string, shareB: string): Uint8Array {
  const a = base64ToUint16(shareA)
  const b = base64ToUint16(shareB)
  const x1 = a[0]
  const x2 = b[0]
  const denominator = ((x1 - x2) % 257 + 257) % 257
  const inverse = modularInverse(denominator)
  const key = new Uint8Array(KEY_BYTES)

  for (let i = 0; i < KEY_BYTES; i += 1) {
    const y1 = a[i + 1]
    const y2 = b[i + 1]
    const slope = (((y1 - y2) % 257 + 257) * inverse) % 257
    const secret = ((y1 - slope * x1) % 257 + 257) % 257
    key[i] = secret === 256 ? 0 : secret
  }
  return key
}

function modularInverse(value: number): number {
  for (let i = 1; i < 257; i += 1) {
    if ((value * i) % 257 === 1) return i
  }
  throw new Error('Invalid shard pair')
}

export async function encryptContent(plainText: string, masterPassword: string): Promise<EncryptedPackage> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(masterPassword, salt)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plainText))
  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  const shards = splitKey(rawKey)
  const payload: EncryptedPayload = {
    version: 1,
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted))
  }
  const encryptedData = btoa(JSON.stringify(payload))
  return {
    encryptedData,
    contentHash: await sha256Hex(encryptedData),
    ...shards
  }
}

export async function decryptContent(encryptedData: string, k2Shard: string, k3Shard: string): Promise<string> {
  const payload = JSON.parse(atob(encryptedData)) as EncryptedPayload
  const rawKey = reconstructKey(k2Shard, k3Shard)
  const key = await crypto.subtle.importKey('raw', asBufferSource(rawKey), { name: 'AES-GCM' }, false, ['decrypt'])
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: asBufferSource(base64ToBytes(payload.iv)) },
    key,
    asBufferSource(base64ToBytes(payload.ciphertext))
  )
  return decoder.decode(decrypted)
}

export async function saveLocalShard(contentHash: string, k1Shard: string) {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ contentHash, k1Shard, savedAt: new Date().toISOString() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function getLocalShard(contentHash: string): Promise<string | null> {
  const db = await openDb()
  const shard = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(contentHash)
    request.onsuccess = () => resolve(request.result?.k1Shard || null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return shard
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'contentHash' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
