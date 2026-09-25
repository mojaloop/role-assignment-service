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

import Config from '~/shared/config'
import server from '~/server'

jest.mock('~/server')
jest.mock('~/shared/logger')

describe('cli', (): void => {
  it('start all services', async (): Promise<void> => {
    process.argv = ['jest', 'cli.ts', 'all']
    const cli = await import('~/cli')

    expect(cli).toBeDefined()
    // We use objectContaining because sometimes the
    // command line injects other args we can't control
    const expectedConfig = expect.objectContaining({
      PACKAGE: Config.PACKAGE,
      PORT: Config.PORT,
      HOST: Config.HOST,
      INSPECT: {
        DEPTH: 4,
        SHOW_HIDDEN: false,
        COLOR: true
      },
      ENDPOINT_CACHE_CONFIG: {
        expiresIn: 180000,
        generateTimeout: 30000
      },
      IAM_SERVICE_URL: 'http://iam-provisioning:3003',
      ORY_KRATOS_ADMIN_SERVICE_URL: 'http://kratos:4434',
      ERROR_HANDLING: {
        includeCauseExtension: true,
        truncateExtensions: true
      },
      INSTRUMENTATION: {
        METRICS: {
          DISABLED: false,
          labels: {
            eventId: '*'
          },
          config: {
            timeout: 5000,
            prefix: 'moja_ra_api',
            defaultLabels: {
              serviceName: 'role-assignment-service'
            }
          }
        }
      },
      CORS_WHITELIST: [
        'http://localhost:3000',
        'http://localhost:3010',
        'http://localhost:3012',
        'http://localhost:8080',
        'http://localhost:8081'
      ],
      ALLOW_CREDENTIALS: false
    })

    expect(server.run).toHaveBeenCalledWith(expectedConfig)
  })

})
