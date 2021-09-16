/*****
 License
 --------------
 Copyright © 2020 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the
 Apache License, Version 2.0 (the 'License') and you may not use these files
 except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files
 are distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied. See the License for the specific language
 governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 - Kevin Leyow <kevin.leyow@modusbox.com>

 --------------
 ******/

import index from '~/index'
import Config from '~/shared/config'
import { Server } from '@hapi/hapi'
import axios from 'axios'
import Logger from '@mojaloop/central-services-logger'

jest.mock('axios')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

describe('index', (): void => {
  it('must have proper layout', (): void => {
    expect(typeof index.server).toBeDefined()
    expect(typeof index.server.run).toEqual('function')
  })

  describe('api routes', (): void => {
    let server: Server

    beforeAll(async (): Promise<Server> => {
      mockLoggerPush.mockReturnValue(null)
      mockLoggerError.mockReturnValue(null)
      server = await index.server.run(Config)
      return server
    })

    afterAll((done): void => {
      server.events.on('stop', done)
      server.stop()
    })

    describe('/health', (): void => {
      it('GET', async (): Promise<void> => {
        interface HealthResponse {
          status: string;
          uptime: number;
          startTime: string;
          versionNumber: string;
        }

        const request = {
          method: 'GET',
          url: '/health'
        }

        const response = await server.inject(request)
        expect(response.statusCode).toBe(200)
        expect(response.result).toBeDefined()

        const result = response.result as HealthResponse
        expect(result.status).toEqual('OK')
        expect(result.uptime).toBeGreaterThan(1.0)
      })
    })

    describe('/metrics', (): void => {
      it('GET', async (): Promise<void> => {
        const request = {
          method: 'GET',
          url: '/metrics'
        }

        const response = await server.inject(request)
        expect(response.statusCode).toBe(200)
      })
    })

    describe('/roles', (): void => {
      it('GET /roles', async (): Promise<void> => {
        const request = {
          method: 'GET',
          url: '/roles',
          headers: {}
        }

        const response = await server.inject(request)

        expect(response.statusCode).toBe(200)
        expect(response.result).toEqual({ roles: Config.ROLES_LIST })
      })
    })

    describe('/participants', (): void => {
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
      it('GET /participants', async (): Promise<void> => {
        axios.get = jest.fn().mockResolvedValueOnce(mockCentralLedgerParticipantsResponse)

        const request = {
          method: 'GET',
          url: '/participants',
          headers: {}
        }

        const response = await server.inject(request)
        expect(response.statusCode).toBe(200)
        expect(response.result).toEqual({ participants: ['dfsp'] })
        expect(axios.get).toHaveBeenCalledWith('http://central-ledger:3001/participants')
      })
    })

    describe('/users/{ID}/participants', (): void => {
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

      it('GET /users/{ID}/participants', async (): Promise<void> => {
        axios.request = jest.fn().mockResolvedValueOnce(mockKetoUserParticipantsResponse)

        const request = {
          method: 'GET',
          url: '/users/myTestUserID/participants',
          headers: {}
        }

        const response = await server.inject(request)
        expect(response.statusCode).toBe(200)
        expect(response.result).toEqual({ participants: ['dfsp'] })
        expect(axios.request).toHaveBeenCalledWith({
          headers: expect.any(Object),
          method: 'GET',
          url: 'http://keto:4466/relation-tuples?namespace=participant&relation=member&subject=myTestUserID'
        })
      })

      it('PATCH /users/{ID}/participants', async (): Promise<void> => {
        axios.request = jest.fn()

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

        const response = await server.inject(request)
        expect(response.statusCode).toBe(200)
        expect(axios.request).toHaveBeenCalledWith({
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
      })
    })

    describe('/users/{ID}/roles', (): void => {
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
      it('GET /users/{ID}/roles', async (): Promise<void> => {
        axios.request = jest.fn().mockResolvedValueOnce(mockKetoUserRolesResponse)

        const request = {
          method: 'GET',
          url: '/users/myTestUserID/roles',
          headers: {}
        }

        const response = await server.inject(request)
        expect(response.statusCode).toBe(200)
        expect(response.result).toEqual({ roles: ['ADMIN_ROLE_6c1ec084-86d4-4915-ba81-6c59b87a65a6'] })
        expect(axios.request).toHaveBeenCalledWith({
          headers: expect.any(Object),
          method: 'GET',
          url: 'http://keto:4466/relation-tuples?namespace=role&relation=member&subject=myTestUserID'
        })
      })

      it('PATCH /users/{ID}/roles', async (): Promise<void> => {
        axios.request = jest.fn()

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

        const response = await server.inject(request)
        expect(response.statusCode).toBe(200)
        expect(axios.request).toHaveBeenCalledWith({
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
      })
    })
  })
})
