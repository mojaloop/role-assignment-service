import { Server, ServerInjectResponse } from '@hapi/hapi'
import axios from 'axios'
import { defineFeature, loadFeature } from 'jest-cucumber'
import path from 'path'
import RoleAssignmentService from '~/server'
import Config from '~/shared/config'

jest.mock('axios')

const featurePath = path.join(__dirname, '../features/participants.scenario.feature')
const feature = loadFeature(featurePath)

const mockCentralLedgerParticipantsResponse = {
  data: [
    {
      name: 'dfsp',
      id: 'http://central-ledger/participants/pineapplepay',
      created: '"2021-09-16T13:58:38.000Z"',
      isActive: 1,
      links: [],
      accounts: []
    }
  ]
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

  test('Get Participants', ({ given, when, then }): void => {
    given('role-assignment-service server', (): void => {
      expect(server).toBeDefined()
    })

    when('I make a GET Participants request', async (): Promise<ServerInjectResponse> => {
      axios.get = jest.fn().mockResolvedValueOnce(mockCentralLedgerParticipantsResponse)
      const request = {
        method: 'GET',
        url: '/participants'
      }
      response = await server.inject(request)
      return response
    })

    then('The status should be \'OK\'', (): void => {
      expect(response.statusCode).toBe(200)
      expect(JSON.parse(response.payload)).toEqual({
        participants: ['dfsp']
      })
    })
  })
})
