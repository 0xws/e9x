import { describe, expect, test } from 'bun:test'
import { routeKey } from './utils.ts'

describe('routeKey', () => {
  test('normalizes Elysia-style parameter names', () => {
    expect(routeKey({ feature: 'missions', method: 'get', path: '/missions/:missionId' }))
      .toBe('missions|GET|/missions/:param')
  })

  test('normalizes Next.js route parameter names', () => {
    expect(routeKey({ feature: 'users', method: 'PATCH', path: '/api/users/[id]' }))
      .toBe('users|PATCH|/api/users/:param')
  })

  test('normalizes required Next.js catch-all parameters', () => {
    expect(routeKey({ feature: 'files', method: 'GET', path: '/api/files/[...segments]' }))
      .toBe('files|GET|/api/files/*')
  })

  test('normalizes optional Next.js catch-all parameters', () => {
    expect(routeKey({ feature: 'docs', method: 'GET', path: '/api/docs/[[...segments]]' }))
      .toBe('docs|GET|/api/docs/*')
  })
})
