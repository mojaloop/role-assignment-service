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

const featurePath = path.join(__dirname, '../features/roles.scenario.feature')
const feature = loadFeature(featurePath)

defineFeature(feature, (test): void => {
  let server: Server
  let response: ServerInjectResponse

  beforeAll(async (): Promise<void> => {
    server = await RoleAssignmentService.run(Config)
  })

  afterAll((done): void => {
    server.events.on('stop', done)
    server.stop()
  })

  test('Get Roles', ({ given, when, then }): void => {
    given('role-assignment-service server', (): void => {
      expect(server).toBeDefined()
    })

    when('I make a GET Roles request', async (): Promise<ServerInjectResponse> => {
      const request = {
        method: 'GET',
        url: '/roles'
      }
      response = await server.inject(request)
      return response
    })

    then('The status should be \'OK\'', (): void => {
      expect(response.statusCode).toBe(200)
    })
  })
})
