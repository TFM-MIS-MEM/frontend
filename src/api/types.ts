// Tipos de las respuestas, copiados de los contratos:
//   auth-microservice/openapi/auth.yaml
//   fr-commercial-microservice/openapi/fr-commercial.yaml

export interface ErrorReport {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface RegisterResponse {
  accountId: string
  email: string
  apiKey: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
}

export interface Account {
  accountId: string
  email: string
  status: string
  role: 'CUSTOMER' | 'ADMIN'
  createdAt: string
}

export type ModelName = 'xs' | 's' | 'base'

export interface Gallery {
  id: string
  name: string
  description?: string
  model: ModelName
  status: 'active' | 'frozen'
  frozenReason?: string
  identityCount: number
  faceCount: number
  createdAt: string
  updatedAt?: string
}

export interface Identity {
  id: string
  galleryId: string
  fullName: string
  externalId?: string | null
  faceCount: number
  createdAt: string
  updatedAt?: string
}

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface VerificationResult {
  isTheSame: boolean
  confidence: number
  thresholdUsed?: number
  model?: string
}
