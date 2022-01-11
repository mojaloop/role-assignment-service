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
import UsersIdRolesHandler from '~/server/handlers/users/{ID}/roles'
import { logger } from '~/shared/logger'
import axios, { AxiosError } from 'axios'
import * as keto from '@ory/keto-client'
import Config from '~/shared/config'

jest.mock('axios')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

describe('users id roles handler', () => {
  beforeEach((): void => {
    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)
  })

  const mockKetoUserRolesResponse = {
    data: {
      relation_tuples: [
        {
          namespace: 'role',
          object: 'admin',
          relation: 'member',
          subject: 'myTestUserID'
        }
      ],
      next_page_token: ''
    }
  }

  describe('GET /users/{ID}/roles', () => {
    const toolkit = {
      getLogger: jest.fn(() => logger),
      getKetoReadApi: jest.fn(() => new keto.ReadApi(
        undefined,
        Config.ORY_KETO_READ_SERVICE_URL
      )),
      getKetoWriteApi: jest.fn(),
      response: jest.fn(() => ({
        code: jest.fn((code: number) => ({
          statusCode: code
        }))
      }))
    }

    it('handles a successful request', async () => {
      axios.request = jest.fn().mockResolvedValueOnce(mockKetoUserRolesResponse)

      const request = {
        method: 'GET',
        url: '/users//roles',
        headers: {},
        params: {
          ID: ''
        }
      }

      const response = await UsersIdRolesHandler.get(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)

      expect(response.statusCode).toBe(200)
      expect(axios.request).toHaveBeenCalledWith({
        headers: expect.any(Object),
        method: 'GET',
        url: 'http://keto:4466/relation-tuples?namespace=role&relation=member&subject='
      })
    })

    it('handles errors', async () => {
      axios.request = jest.fn().mockImplementation(() => {
        throw new Error()
      })

      const request = {
        method: 'GET',
        url: '/users/myTestUserID/roles',
        headers: {},
        params: {
          ID: ''
        }
      }

      const response = await UsersIdRolesHandler.get(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit
      )
      expect(response.statusCode).toBe(500)
    })
  })

  describe('PATCH /users/{ID}/roles', () => {
    const toolkit = {
      getLogger: jest.fn(() => logger),
      getKetoReadApi: jest.fn(() => new keto.ReadApi(
        undefined,
        Config.ORY_KETO_READ_SERVICE_URL
      )),
      getKetoWriteApi: jest.fn(() => new keto.WriteApi(
        undefined,
        Config.ORY_KETO_WRITE_SERVICE_URL
      )),
      response: jest.fn(() => ({
        code: jest.fn((code: number) => ({
          statusCode: code
        }))
      }))
    }

    it('handles a successful request', async () => {
      axios.post = jest.fn().mockResolvedValueOnce(null)
      axios.request = jest.fn().mockResolvedValueOnce(mockKetoUserRolesResponse)

      const request = {
        method: 'PATCH',
        url: '/users/myTestUserID/roles',
        headers: {},
        params: {
          ID: 'myTestUserID'
        },
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

      const response = await UsersIdRolesHandler.patch(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)

      expect(response.statusCode).toBe(200)
      expect(axios.post).toHaveBeenCalledWith(
        'http://moja-role-operator:3001/assignment/user-role',
        {
          roles: ['admin'],
          username: 'myTestUserID'
        }
      )
    })

    it('handles keto get errors', async () => {
      axios.request = jest.fn().mockImplementation(() => {
        throw new Error()
      })

      const request = {
        method: 'PATCH',
        url: '/users/myTestUserID/roles',
        headers: {},
        params: {
          ID: 'myTestUserID'
        },
        payload: {
          participantOperations: [
            {
              action: 'insert',
              participantId: 'admin'
            },
            {
              action: 'delete',
              participantId: 'user'
            }
          ]
        }
      }

      const response = await UsersIdRolesHandler.patch(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit
      )
      expect(response.statusCode).toBe(500)
    })

    it('handles role operator post errors1', async () => {
      axios.request = jest.fn().mockResolvedValueOnce(mockKetoUserRolesResponse)
      axios.post = jest.fn().mockImplementation(() => {
        throw new Error()
      })

      const request = {
        method: 'PATCH',
        url: '/users/myTestUserID/roles',
        headers: {},
        params: {
          ID: 'myTestUserID'
        },
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

      const response = await UsersIdRolesHandler.patch(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)
      expect(response.statusCode).toBe(500)
    })

    it('handles role operator post errors2', async () => {
      axios.request = jest.fn().mockResolvedValueOnce(mockKetoUserRolesResponse)
      axios.post = jest.fn().mockImplementation(() => {
        const errorObj = <AxiosError>(new Error())
        errorObj.isAxiosError = true
        errorObj.response = {
          config: {},
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          data: { errors: ['asdf'] }
        }
        throw errorObj
      })

      const request = {
        method: 'PATCH',
        url: '/users/myTestUserID/roles',
        headers: {},
        params: {
          ID: 'myTestUserID'
        },
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

      const response = await UsersIdRolesHandler.patch(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)
      expect(response.statusCode).toBe(500)
    })

    it('handles role operator post errors3', async () => {
      axios.request = jest.fn().mockResolvedValueOnce(mockKetoUserRolesResponse)
      axios.post = jest.fn().mockImplementation(() => {
        const errorObj = <AxiosError>(new Error())
        errorObj.isAxiosError = true
        errorObj.response = {
          config: {},
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          data: { errors: ['asdf'] }
        }
        throw errorObj
      })

      const request = {
        method: 'PATCH',
        url: '/users/myTestUserID/roles',
        headers: {},
        params: {
          ID: 'myTestUserID'
        },
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

      const response = await UsersIdRolesHandler.patch(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)
      expect(response.statusCode).toBe(500)
    })

    it('handles role operator post errors3', async () => {
      axios.request = jest.fn().mockResolvedValueOnce(mockKetoUserRolesResponse)
      axios.post = jest.fn().mockImplementation(() => {
        const errorObj = <AxiosError>(new Error())
        errorObj.isAxiosError = true
        throw errorObj
      })

      const request = {
        method: 'PATCH',
        url: '/users/myTestUserID/roles',
        headers: {},
        params: {
          ID: 'myTestUserID'
        },
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

      const response = await UsersIdRolesHandler.patch(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)
      expect(response.statusCode).toBe(500)
    })
  })
})
