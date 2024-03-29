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
import UsersIdParticipantsHandler from '~/server/handlers/users/{ID}/participants'
import { logger } from '~/shared/logger'
import axios from 'axios'
import * as keto from '@ory/keto-client'
import Config from '~/shared/config'

jest.mock('axios')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

describe('users id participants handler', () => {
  beforeEach((): void => {
    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)
  })

  const mockKetoUserParticipantsResponse = {
    data: {
      relation_tuples: [
        {
          namespace: 'participant',
          object: 'dfsp',
          relation: 'member',
          subject_id: 'myTestUserID'
        }
      ],
      next_page_token: ''
    }
  }

  describe('GET /users/{ID}/participants', () => {
    const toolkit = {
      getLogger: jest.fn(() => logger),
      getReadRelationshipApi: jest.fn(() => new keto.RelationshipApi(
        undefined,
        Config.ORY_KETO_READ_SERVICE_URL
      )),
      getWriteRelationshipApi: jest.fn(),
      response: jest.fn(() => ({
        code: jest.fn((code: number) => ({
          statusCode: code
        }))
      }))
    }

    it('handles a successful request', async () => {
      axios.request = jest.fn().mockResolvedValueOnce(mockKetoUserParticipantsResponse)

      const request = {
        method: 'GET',
        url: '/users/myTestUserID/participants',
        headers: {},
        params: {
          ID: 'myTestUserID'
        }
      }

      const response = await UsersIdParticipantsHandler.get(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)

      expect(response.statusCode).toBe(200)
      expect(axios.request).toHaveBeenCalledWith({
        headers: expect.anything(),
        method: 'GET',
        url: 'http://keto:4466/relation-tuples?namespace=participant&relation=member&subject_id=myTestUserID'
      })
    })

    it('handles errors', async () => {
      axios.request = jest.fn().mockImplementation(() => {
        throw new Error()
      })

      const request = {
        method: 'GET',
        url: '/users/myTestUserID/participants',
        headers: {},
        params: {
          ID: 'myTestUserID'
        }
      }

      const response = await UsersIdParticipantsHandler.get(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit
      )
      expect(response.statusCode).toBe(500)
    })
  })

  describe('PATCH /users/{ID}/participants', () => {
    const toolkit = {
      getLogger: jest.fn(() => logger),
      getReadRelationshipApi: jest.fn(),
      getWriteRelationshipApi: jest.fn(() => new keto.RelationshipApi(
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
      axios.request = jest.fn().mockResolvedValueOnce(null)

      const request = {
        method: 'PATCH',
        url: '/users/myTestUserID/participants',
        headers: {},
        params: {
          ID: 'myTestUserID'
        },
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

      const response = await UsersIdParticipantsHandler.patch(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)

      expect(response.statusCode).toBe(200)
      expect(axios.request).toHaveBeenCalledWith({
        headers: expect.anything(),
        method: 'PATCH',
        url: 'http://keto:4467/admin/relation-tuples',
        data: JSON.stringify([
          {
            action: 'insert',
            relation_tuple: {
              namespace: 'participant',
              object: 'dfspa',
              relation: 'member',
              subject_id: 'myTestUserID'
            }
          },
          {
            action: 'delete',
            relation_tuple: {
              namespace: 'participant',
              object: 'dfspb',
              relation: 'member',
              subject_id: 'myTestUserID'
            }
          }
        ])
      })
    })

    it('handles errors', async () => {
      axios.request = jest.fn().mockImplementation(() => {
        throw new Error()
      })

      const request = {
        method: 'PATCH',
        url: '/users/myTestUserID/participants',
        headers: {},
        params: {
          ID: 'myTestUserID'
        },
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

      const response = await UsersIdParticipantsHandler.patch(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit
      )
      expect(response.statusCode).toBe(500)
    })
  })
})
