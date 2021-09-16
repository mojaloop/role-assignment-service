import { Server, ServerInjectResponse } from '@hapi/hapi'
import axios from 'axios'
import { defineFeature, loadFeature } from 'jest-cucumber'
import path from 'path'
import RoleAssignmentService from '~/server'
import Config from '~/shared/config'

// NOTE: having trouble mocking the keto library
//       so mocking axios which the keto library uses for now
jest.mock('axios')

const featurePath = path.join(__dirname, '../features/users.scenario.feature')
const feature = loadFeature(featurePath)

const mockKetoUserRolesResponse = {
  data: {
    relation_tuples: [
      {
        namespace: 'role',
        object: 'ADMIN_ROLE_6c1ec084-86d4-4915-ba81-6c59b87a65a6',
        relation: 'member',
        subject: 'myTestUserID'
      }
    ],
    next_page_token: ''
  }
}

const mockKetoUserParticipantsResponse = {
  data: {
    relation_tuples: [
      {
        namespace: 'participant',
        object: 'dfsp',
        relation: 'member',
        subject: 'myTestUserID'
      }
    ],
    next_page_token: ''
  }
}

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

  test('Get User Roles', ({ given, when, then }): void => {
    given('role-assignment-service server', (): void => {
      expect(server).toBeDefined()
    })

    when('I make a GET User Roles request', async (): Promise<ServerInjectResponse> => {
      axios.request = jest.fn().mockResolvedValue(mockKetoUserRolesResponse)
      const request = {
        method: 'GET',
        url: '/users/myTestUserID/roles'
      }
      response = await server.inject(request)
      return response
    })

    then('The status should be \'OK\'', (): void => {
      expect(axios.request).toBeCalledWith({
        headers: expect.any(Object),
        method: 'GET',
        url: 'http://keto:4466/relation-tuples?namespace=role&relation=member&subject=myTestUserID'
      })
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload)).toEqual({
        roles: ['ADMIN_ROLE_6c1ec084-86d4-4915-ba81-6c59b87a65a6']
      })
    })
  })

  test('Patch User Roles', ({ given, when, then }): void => {
    given('role-assignment-service server', (): void => {
      expect(server).toBeDefined()
    })

    when('I make a PATCH User roles request', async (): Promise<ServerInjectResponse> => {
      axios.request = jest.fn().mockResolvedValueOnce(null)
      const request = {
        method: 'PATCH',
        url: '/users/myTestUserID/roles',
        payload: {
          roleOperations: [
            {
              action: 'insert',
              roleId: 'admin'
            },
            {
              action: 'delete',
              roleId: 'user'
            }
          ]
        }
      }
      response = await server.inject(request)
      return response
    })

    then('The status should be \'OK\'', (): void => {
      expect(axios.request).toBeCalledWith({
        headers: expect.any(Object),
        method: 'PATCH',
        url: 'http://keto:4467/relation-tuples',
        data: JSON.stringify([
          {
            action: 'insert',
            relation_tuple: {
              namespace: 'role',
              object: 'admin',
              relation: 'member',
              subject: 'myTestUserID'
            }
          },
          {
            action: 'delete',
            relation_tuple: {
              namespace: 'role',
              object: 'user',
              relation: 'member',
              subject: 'myTestUserID'
            }
          }
        ])
      })
      expect(response.statusCode).toBe(200)
    })
  })

  test('Get User Participants', ({ given, when, then }): void => {
    given('role-assignment-service server', (): void => {
      expect(server).toBeDefined()
    })

    when('I make a GET User Participants request', async (): Promise<ServerInjectResponse> => {
      axios.request = jest.fn().mockResolvedValueOnce(mockKetoUserParticipantsResponse)
      const request = {
        method: 'GET',
        url: '/users/myTestUserID/participants'
      }
      response = await server.inject(request)
      return response
    })

    then('The status should be \'OK\'', (): void => {
      expect(axios.request).toBeCalledWith({
        headers: expect.any(Object),
        method: 'GET',
        url: 'http://keto:4466/relation-tuples?namespace=participant&relation=member&subject=myTestUserID'
      })
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload)).toEqual({
        participants: ['dfsp']
      })
    })
  })

  test('Patch User Participants', ({ given, when, then }): void => {
    given('role-assignment-service server', (): void => {
      expect(server).toBeDefined()
    })

    when('I make a PATCH User Participants request', async (): Promise<ServerInjectResponse> => {
      axios.request = jest.fn().mockResolvedValueOnce(null)
      const request = {
        method: 'PATCH',
        url: '/users/myTestUserID/participants',
        payload: {
          participantOperations: [
            {
              action: 'insert',
              participantId: 'dfspa'
            },
            {
              action: 'delete',
              participantId: 'dfspb'
            }
          ]
        }
      }
      response = await server.inject(request)
      return response
    })

    then('The status should be \'OK\'', (): void => {
      expect(axios.request).toBeCalledWith({
        headers: expect.any(Object),
        method: 'PATCH',
        url: 'http://keto:4467/relation-tuples',
        data: JSON.stringify([
          {
            action: 'insert',
            relation_tuple: {
              namespace: 'participant',
              object: 'dfspa',
              relation: 'member',
              subject: 'myTestUserID'
            }
          },
          {
            action: 'delete',
            relation_tuple: {
              namespace: 'participant',
              object: 'dfspb',
              relation: 'member',
              subject: 'myTestUserID'
            }
          }
        ])
      })
      expect(response.statusCode).toBe(200)
    })
  })
})
