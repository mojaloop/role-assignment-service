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
import ParticipantsHandler from '~/server/handlers/participants'
import { logger } from '~/shared/logger'
import axios from 'axios'

jest.mock('axios')
const mockLoggerPush = jest.spyOn(Logger, 'push')
const mockLoggerError = jest.spyOn(Logger, 'error')

describe('participants handler', () => {
  beforeEach((): void => {
    mockLoggerPush.mockReturnValue(null)
    mockLoggerError.mockReturnValue(null)
  })

  describe('GET /participants', () => {
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

    it('handles a successful request', async () => {
      axios.get = jest.fn().mockResolvedValueOnce(mockCentralLedgerParticipantsResponse)

      const request = {
        method: 'GET',
        url: '/participants',
        headers: {}
      }

      const response = await ParticipantsHandler.get(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit)

      expect(response.statusCode).toBe(200)
      expect(toolkit.response).toBeCalledWith({ participants: ['dfsp'] })
      expect(axios.get).toHaveBeenCalledWith('http://central-ledger:3001/participants')
    })

    it('handles errors', async () => {
      axios.get = jest.fn().mockImplementation(() => {
        throw new Error()
      })

      const request = {
        method: 'GET',
        url: '/participants',
        headers: {}
      }

      const response = await ParticipantsHandler.get(
        null,
        request as unknown as Request,
        toolkit as unknown as StateResponseToolkit
      )
      expect(response.statusCode).toBe(500)
    })
  })
})
