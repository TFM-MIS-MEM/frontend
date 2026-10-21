import { request } from './client'
import type { Account, LoginResponse, RegisterResponse } from './types'

// auth-microservice/openapi/auth.yaml

export function register(email: string, password: string) {
  return request<RegisterResponse>('/v1/auth/register', { method: 'POST', json: { email, password } })
}

export function login(email: string, password: string) {
  return request<LoginResponse>('/v1/auth/login', { method: 'POST', json: { email, password } })
}

export function getMe(token: string) {
  return request<Account>('/v1/auth/me', { token })
}

export function rotateKey(token: string, password: string) {
  return request<{ apiKey: string }>('/v1/auth/rotate-key', { method: 'POST', token, json: { password } })
}
