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
import UsersIdHandler from '~/server/handlers/users/{ID}'
import { logger } from '~/shared/logger'
import axios from 'axios'

jest.mock('axios')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

describe('users handler', () => {
  beforeEach((): void => {
    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)
  })

  describe('GET /users/{ID}', () => {
    const toolkit = {
      getLogger: jest.fn(() => logger),
      getKetoReadApi: jest.fn(),
      getKetoWriteApi: jest.fn(),
      response: jest.fn(() => ({
        code: jest.fn((code: number) => ({
          statusCode: code
        }))
      }))
    }

    const mockWso2UserResponse = {
      data: {
        name: { givenName: 'user', familyName: 'name' },
        id: '9e666741-53f2-4fc0-8c50-d4fce6f59eca',
        userName: 'user'
      }
    }

    it('handles a successful request', async () => {
      axios.get = jest.fn().mockResolvedValueOnce(mockWso2UserResponse)

      const request = {
        method: 'GET',
        url: '/users/9e666741-53f2-4fc0-8c50-d4fce6f59eca',
        headers: {},
        params: {
          ID: '9e666741-53f2-4fc0-8c50-d4fce6f59eca'
        }
      }

      const response = await UsersIdHandler.get(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)

      expect(response.statusCode).toBe(200)
      expect(toolkit.response).toBeCalledWith({
        user: {
          id: '9e666741-53f2-4fc0-8c50-d4fce6f59eca',
          name: { givenName: 'user', familyName: 'name' },
          username: 'user'
        }
      })
      expect(axios.get).toHaveBeenCalledWith(
        'https://identity-server:9443/scim2/Users/9e666741-53f2-4fc0-8c50-d4fce6f59eca',
        expect.any(Object)
      )
    })

    it('handles errors', async () => {
      axios.get = jest.fn().mockImplementation(() => {
        throw new Error()
      })

      const request = {
        method: 'GET',
        url: '/users/9e666741-53f2-4fc0-8c50-d4fce6f59eca',
        headers: {}
      }

      const response = await UsersIdHandler.get(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit
      )
      expect(response.statusCode).toBe(500)
    })
  })
})
