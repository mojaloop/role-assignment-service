/* eslint-disable import/first */
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
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { name: 'hub-admin', open: [], grants: [] },
            {
              name: 'dfsp-operator',
              open: ['Participant'],
              grants: [{ permission: 'mcm.getDFSPca' }]
            }
          ]
        }) as unknown as typeof fetch

        const response = await server.inject({ method: 'GET', url: '/roles', headers: {} })

        expect(response.statusCode).toBe(200)
        expect(response.result).toEqual({
          roles: [
            { name: 'hub-admin', open: [] },
            { name: 'dfsp-operator', open: ['Participant'] }
          ]
        })
        expect(global.fetch).toHaveBeenCalledWith(
          'http://iam-provisioning:3003/roles',
          expect.objectContaining({ method: 'GET' })
        )
      })
    })

    describe('/resources', (): void => {
      it('GET /resources', async (): Promise<void> => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => [{ resourceName: 'Participant', id: 'dfsp-a' }]
        }) as unknown as typeof fetch

        const response = await server.inject({ method: 'GET', url: '/resources?resourceName=Participant', headers: {} })

        expect(response.statusCode).toBe(200)
        expect(response.result).toEqual({ resources: [{ resourceName: 'Participant', id: 'dfsp-a' }] })
        expect(global.fetch).toHaveBeenCalledWith(
          'http://iam-provisioning:3003/resources?resourceName=Participant',
          expect.objectContaining({ method: 'GET' })
        )
      })
    })

    describe('/users/{ID}/assignments', (): void => {
      it('GET /users/{ID}/assignments', async (): Promise<void> => {
        global.fetch = jest.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => [{ role: 'dfsp-operator', resources: { Participant: 'dfsp-a' } }]
        }) as unknown as typeof fetch

        const response = await server.inject({
          method: 'GET',
          url: '/users/myTestUserID/assignments',
          headers: {}
        })

        expect(response.statusCode).toBe(200)
        expect(response.result).toEqual({
          assignments: [{ role: 'dfsp-operator', resources: { Participant: 'dfsp-a' } }]
        })
      })

      it('PATCH /users/{ID}/assignments', async (): Promise<void> => {
        global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ instance: 'x' }) }) as unknown as typeof fetch

        const response = await server.inject({
          method: 'PATCH',
          url: '/users/myTestUserID/assignments',
          headers: {},
          payload: {
            assignmentOperations: [
              { action: 'insert', role: 'dfsp-operator', resources: { Participant: 'dfsp-a' } },
              { action: 'delete', role: 'hub-admin' }
            ]
          }
        })

        expect(response.statusCode).toBe(200)
        expect(global.fetch).toHaveBeenCalledWith(
          'http://iam-provisioning:3003/subjects/myTestUserID/assignments',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ role: 'dfsp-operator', resources: { Participant: 'dfsp-a' } })
          })
        )
        expect(global.fetch).toHaveBeenCalledWith(
          'http://iam-provisioning:3003/subjects/myTestUserID/assignments',
          expect.objectContaining({
            method: 'DELETE',
            body: JSON.stringify({ role: 'hub-admin', resources: {} })
          })
        )
      })
    })


    describe('/users', (): void => {
      const mockKratosIdentitiesResponse = {
        data: [{
          id: '9e666741-53f2-4fc0-8c50-d4fce6f59eca',
          schema_id: 'default',
          traits: { email: 'user@email.com', roles: [] }
        }],
        headers: {}
      }
      it('GET /user', async (): Promise<void> => {
        axios.request = jest.fn().mockResolvedValueOnce(mockKratosIdentitiesResponse)

        const request = {
          method: 'GET',
          url: '/users',
          headers: {}
        }

        const response = await server.inject(request)
        expect(response.statusCode).toBe(200)
        expect(response.result).toEqual({
          users: [
            {
              id: '9e666741-53f2-4fc0-8c50-d4fce6f59eca',
              name: {},
              username: 'user@email.com',
              emails: ['user@email.com']
            }]
        })
        expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('http://kratos:4434/admin/identities')
        }))
      })
    })

    describe('/users/{ID}', (): void => {
      const mockKratosIdentityResponse = {
        data: {
          id: '9e666741-53f2-4fc0-8c50-d4fce6f59eca',
          schema_id: 'default',
          traits: { email: 'user@email.com', roles: [] }
        }
      }

      it('GET /user/{ID}', async (): Promise<void> => {
        axios.request = jest.fn().mockResolvedValueOnce(mockKratosIdentityResponse)

        const request = {
          method: 'GET',
          url: '/users/9e666741-53f2-4fc0-8c50-d4fce6f59eca',
          headers: {}
        }

        const response = await server.inject(request)
        expect(response.statusCode).toBe(200)
        expect(response.result).toEqual({
          user: {
            id: '9e666741-53f2-4fc0-8c50-d4fce6f59eca',
            name: {},
            username: 'user@email.com',
            emails: ['user@email.com']
          }
        })
        expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({
          method: 'GET',
          url: expect.stringContaining('http://kratos:4434/admin/identities/9e666741-53f2-4fc0-8c50-d4fce6f59eca')
        }))
      })
    })
  })
})
