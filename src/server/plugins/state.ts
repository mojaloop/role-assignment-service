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

import {
  Logger as SDKLogger
} from '@mojaloop/sdk-standard-components'
import { ResponseToolkit, Server } from '@hapi/hapi'
import { logger } from '~/shared/logger'
import * as keto from '@ory/keto-client'

export interface StateResponseToolkit extends ResponseToolkit {
  getLogger: () => SDKLogger.Logger
  getKetoReadApi: () => keto.ReadApi
  getKetoWriteApi: () => keto.WriteApi
}

export const StatePlugin = {
  version: '1.0.0',
  name: 'StatePlugin',
  once: true,

  register: async (server: Server): Promise<void> => {
    const oryKetoReadApi = new keto.ReadApi()
    const oryKetoWriteApi = new keto.WriteApi()

    logger.info('StatePlugin: plugin initializing')

    try {
      // prepare toolkit accessors
      server.decorate('toolkit', 'getLogger', (): SDKLogger.Logger => logger)
      server.decorate('toolkit', 'getKetoReadApi', (): keto.ReadApi => oryKetoReadApi)
      server.decorate('toolkit', 'getKetoWriteApi', (): keto.WriteApi => oryKetoWriteApi)
    } catch (err) {
      logger.error('StatePlugin: unexpected exception during plugin registration')
      logger.error(err)
      logger.error('StatePlugin: exiting process')
      process.exit(1)
    }
  }
}
