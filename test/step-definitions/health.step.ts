import path from 'path'
import { loadFeature, defineFeature } from 'jest-cucumber'
import { Server, ServerInjectResponse } from '@hapi/hapi'
import Config from '~/shared/config'

import RoleAssignmentService from '~/server'

jest.mock('@keycloak/keycloak-admin-client', () => {
  return jest.fn().mockImplementation(() => ({
    auth: jest.fn(),
    users: {
      find: jest.fn(),
      findOne: jest.fn()
    }
  }))
})

const featurePath = path.join(__dirname, '../features/health.scenario.feature')
const feature = loadFeature(featurePath)

defineFeature(feature, (test): void => {
  let server: Server
  let response: ServerInjectResponse

  afterEach((done): void => {
    server.events.on('stop', done)
    server.stop()
  })

  test('Health Check', ({ given, when, then }): void => {
    given('role-assignment-service server', async (): Promise<Server> => {
      server = await RoleAssignmentService.run(Config)
      return server
    })

    when('I get \'Health Check\' response', async (): Promise<ServerInjectResponse> => {
      const request = {
        method: 'GET',
        url: '/health'
      }
      response = await server.inject(request)
      return response
    })

    then('The status should be \'OK\'', (): void => {
      interface HealthResponse {
        status: string;
        uptime: number;
        startTime: string;
        versionNumber: string;
      }
      const healthResponse = response.result as HealthResponse
      expect(response.statusCode).toBe(200)
      expect(healthResponse.status).toEqual('OK')
      expect(healthResponse.uptime).toBeGreaterThan(1.0)
    })
  })
})
