import { Server, ServerInjectResponse } from '@hapi/hapi'
import axios from 'axios'
import { defineFeature, loadFeature } from 'jest-cucumber'
import path from 'path'
import RoleAssignmentService from '~/server'
import Config from '~/shared/config'

// NOTE: having trouble mocking the ory client libraries
//       so mocking axios which they use for now
jest.mock('axios')

const featurePath = path.join(__dirname, '../features/users.scenario.feature')
const feature = loadFeature(featurePath)

const mockKetoUserRolesResponse = {
  data: {
    relation_tuples: [
      {
        namespace: 'Role',
        object: 'hub-admin',
        relation: 'members',
        subject_id: 'myTestUserID'
      }
    ],
    next_page_token: ''
  }
}

const mockKetoUserParticipantsResponse = {
  data: {
    relation_tuples: [
      {
        namespace: 'Participant',
        object: 'dfsp',
        relation: 'members',
        subject_id: 'myTestUserID'
      }
    ],
    next_page_token: ''
  }
}

const mockKratosIdentity = {
  id: '9e666741-53f2-4fc0-8c50-d4fce6f59eca',
  schema_id: 'default',
  traits: { email: 'user@email.com', roles: [] }
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
      expect(axios.request).toBeCalledWith(expect.objectContaining({
        method: 'GET',
        url: expect.stringContaining('http://keto:4466/relation-tuples?namespace=Role&relation=members&subject_id=myTestUserID')
      }))
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload)).toEqual({
        roles: ['hub-admin']
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
      expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'PATCH',
        url: expect.stringContaining('http://keto:4467/admin/relation-tuples'),
        data: JSON.stringify([
          {
            action: 'insert',
            relation_tuple: {
              namespace: 'Role',
              object: 'admin',
              relation: 'members',
              subject_id: 'myTestUserID'
            }
          },
          {
            action: 'delete',
            relation_tuple: {
              namespace: 'Role',
              object: 'user',
              relation: 'members',
              subject_id: 'myTestUserID'
            }
          }
        ])
      }))
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
      expect(axios.request).toBeCalledWith(expect.objectContaining({
        method: 'GET',
        url: expect.stringContaining('http://keto:4466/relation-tuples?namespace=Participant&relation=members&subject_id=myTestUserID')
      }))
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
      expect(axios.request).toBeCalledWith(expect.objectContaining({
        method: 'PATCH',
        url: expect.stringContaining('http://keto:4467/admin/relation-tuples'),
        data: JSON.stringify([
          {
            action: 'insert',
            relation_tuple: {
              namespace: 'Participant',
              object: 'dfspa',
              relation: 'members',
              subject_id: 'myTestUserID'
            }
          },
          {
            action: 'delete',
            relation_tuple: {
              namespace: 'Participant',
              object: 'dfspb',
              relation: 'members',
              subject_id: 'myTestUserID'
            }
          }
        ])
      }))
      expect(response.statusCode).toBe(200)
    })
  })

  test('Get Users', ({ given, when, then }): void => {
    given('role-assignment-service server', (): void => {
      expect(server).toBeDefined()
    })

    when('I make a GET Users request', async (): Promise<ServerInjectResponse> => {
      axios.request = jest.fn().mockResolvedValueOnce({ data: [mockKratosIdentity], headers: {} })
      const request = {
        method: 'GET',
        url: '/users'
      }
      response = await server.inject(request)
      return response
    })

    then('The status should be \'OK\'', (): void => {
      expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        url: expect.stringContaining('http://kratos:4434/admin/identities')
      }))
      expect(response.statusCode).toBe(200)
    })
  })

  test('Get User By ID', ({ given, when, then }): void => {
    given('role-assignment-service server', (): void => {
      expect(server).toBeDefined()
    })

    when('I make a GET User by ID request', async (): Promise<ServerInjectResponse> => {
      axios.request = jest.fn().mockResolvedValueOnce({ data: mockKratosIdentity })
      const request = {
        method: 'GET',
        url: '/users/9e666741-53f2-4fc0-8c50-d4fce6f59eca'
      }
      response = await server.inject(request)
      return response
    })

    then('The status should be \'OK\'', (): void => {
      expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        url: expect.stringContaining('http://kratos:4434/admin/identities/9e666741-53f2-4fc0-8c50-d4fce6f59eca')
      }))
      expect(response.statusCode).toBe(200)
    })
  })
})
