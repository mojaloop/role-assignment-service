/*****
 License
 --------------
 Copyright © 2020-2026 Mojaloop Foundation
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
 * Mojaloop Foundation
 --------------
 ******/

import { Request } from '@hapi/hapi'

import { StateResponseToolkit } from '~/server/plugins/state'
import RolesHandler from '~/server/handlers/roles'
import ResourcesHandler from '~/server/handlers/resources'
import { logger } from '~/shared/logger'

const toolkitWith = (iam: Record<string, unknown>) => {
  const response = jest.fn(() => ({ code: jest.fn((code: number) => ({ statusCode: code })) }))
  return {
    getLogger: jest.fn(() => logger),
    getIam: jest.fn(() => iam),
    response
  }
}

describe('what an operator is offered', () => {
  /**
   * Each open resource name is a list of real resources the operator picks
   * from, rather than a text box.
   */
  it('lists the roles and the resource names each leaves open', async () => {
    const toolkit = toolkitWith({
      roles: jest.fn().mockResolvedValue([
        { name: 'hub-admin', open: [], grants: [] },
        {
          name: 'dfsp-operator',
          open: ['Participant'],
          grants: [{ permission: 'mcm.getDFSPca' }]
        }
      ])
    })

    const response = await RolesHandler.get(
      null,
      { method: 'GET', url: '/roles', headers: {} } as unknown as Request,
      toolkit as unknown as StateResponseToolkit)

    expect(response.statusCode).toBe(200)
    expect(toolkit.response).toBeCalledWith({
      roles: [
        { name: 'hub-admin', open: [] },
        { name: 'dfsp-operator', open: ['Participant'] }
      ]
    })
  })

  it('lists the resources of one resource name, as the services that own them reported', async () => {
    const resources = jest.fn().mockResolvedValue([{ resourceName: 'Participant', id: 'dfsp-a' }])
    const toolkit = toolkitWith({ resources })

    const response = await ResourcesHandler.get(
      null,
      {
        method: 'GET',
        url: '/resources?resourceName=Participant',
        query: { resourceName: 'Participant' },
        headers: {}
      } as unknown as Request,
      toolkit as unknown as StateResponseToolkit)

    expect(response.statusCode).toBe(200)
    expect(resources).toBeCalledWith('Participant')
    expect(toolkit.response).toBeCalledWith({ resources: [{ resourceName: 'Participant', id: 'dfsp-a' }] })
  })

  /** The IAM holds the graph, so it being unreachable is not this service's failure to report as its own. */
  it('answers 502 when the IAM cannot be reached', async () => {
    const toolkit = toolkitWith({ roles: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) })

    const response = await RolesHandler.get(
      null,
      { method: 'GET', url: '/roles', headers: {} } as unknown as Request,
      toolkit as unknown as StateResponseToolkit)

    expect(response.statusCode).toBe(502)
  })
})
