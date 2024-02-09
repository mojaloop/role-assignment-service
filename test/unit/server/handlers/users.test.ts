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

import { Request } from '@hapi/hapi'
import Logger from '@mojaloop/central-services-logger'

import { StateResponseToolkit } from '~/server/plugins/state'
import UsersHandler from '~/server/handlers/users'
import { logger } from '~/shared/logger'

const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

describe('users handler', () => {
  let mockFind: jest.Mock = jest.fn()
  beforeEach((): void => {
    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)
  })

  describe('GET /users', () => {
    const mockAuth: jest.Mock = jest.fn()
    const toolkit = {
      getLogger: jest.fn(() => logger),
      getReadRelationshipApi: jest.fn(),
      getWriteRelationshipApi: jest.fn(),
      getKeycloakAdmin: jest.fn().mockImplementation(() => ({
        auth: mockAuth,
        users: {
          find: mockFind
        }
      })),
      response: jest.fn(() => ({
        code: jest.fn((code: number) => ({
          statusCode: code
        }))
      }))
    }

    const mockKeycloakUsersResponse = [{
      firstName: 'user',
      lastName: 'name',
      id: '9e666741-53f2-4fc0-8c50-d4fce6f59eca',
      username: 'user',
      email: 'user@email.com',
      createdTimestamp: 1706645601591,
      enabled: true,
      totp: false,
      emailVerified: false,
      disableableCredentialTypes: [],
      requiredActions: [],
      notBefore: 0,
      access: { manageGroupMembership: true, view: true, mapRoles: true, impersonate: true, manage: true }
    }]

    it('handles a successful request', async () => {
      mockFind = jest.fn().mockImplementation(() => { return mockKeycloakUsersResponse })

      const request = {
        method: 'GET',
        url: '/users',
        headers: {}
      }

      const response = await UsersHandler.get(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)

      expect(response.statusCode).toBe(200)
      expect(toolkit.response).toHaveBeenCalledWith({
        users: [
          {
            id: '9e666741-53f2-4fc0-8c50-d4fce6f59eca',
            name: { givenName: 'user', familyName: 'name' },
            username: 'user',
            emails: ['user@email.com']
          }]
      })
      expect(mockFind).toHaveBeenCalled()
    })

    it('handles a successful request without email', async () => {
      const noEmail = [{ ...mockKeycloakUsersResponse[0], email: null }]
      mockFind = jest.fn().mockImplementation(() => { return noEmail })

      const request = {
        method: 'GET',
        url: '/users',
        headers: {}
      }

      const response = await UsersHandler.get(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)

      expect(response.statusCode).toBe(200)
      expect(toolkit.response).toHaveBeenCalledWith({
        users: [
          {
            id: '9e666741-53f2-4fc0-8c50-d4fce6f59eca',
            name: { givenName: 'user', familyName: 'name' },
            username: 'user',
            emails: ['user@email.com']
          }]
      })
      expect(mockFind).toHaveBeenCalled()
    })

    it('handles errors', async () => {
      mockFind = jest.fn().mockImplementation(() => { throw new Error('error') })

      const request = {
        method: 'GET',
        url: '/users',
        headers: {}
      }

      const response = await UsersHandler.get(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit
      )
      expect(response.statusCode).toBe(500)
    })
  })
})
