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
import AssignmentsHandler from '~/server/handlers/users/{ID}/assignments'
import { IamError } from '~/shared/iam'
import { logger } from '~/shared/logger'

const toolkitWith = (iam: Record<string, unknown>) => ({
  getLogger: jest.fn(() => logger),
  getIam: jest.fn(() => iam),
  response: jest.fn(() => ({ code: jest.fn((code: number) => ({ statusCode: code })) }))
})

const patch = (toolkit: ReturnType<typeof toolkitWith>, operations: unknown[]) =>
  AssignmentsHandler.patch(
    null,
    {
      method: 'PATCH',
      url: '/users/alice/assignments',
      params: { ID: 'alice' },
      payload: { assignmentOperations: operations },
      headers: {}
    } as unknown as Request,
    toolkit as unknown as StateResponseToolkit)

describe('what a user holds', () => {
  it('reports one entry per role, with what it is over', async () => {
    const toolkit = toolkitWith({
      assignments: jest.fn().mockResolvedValue([
        { role: 'dfsp-operator', resources: { Participant: 'dfsp-a' } },
        { role: 'dfsp-operator', resources: { Participant: 'dfsp-b' } }
      ])
    })

    const response = await AssignmentsHandler.get(
      null,
      { method: 'GET', url: '/users/alice/assignments', params: { ID: 'alice' }, headers: {} } as unknown as Request,
      toolkit as unknown as StateResponseToolkit)

    expect(response.statusCode).toBe(200)
    expect(toolkit.response).toBeCalledWith({
      assignments: [
        { role: 'dfsp-operator', resources: { Participant: 'dfsp-a' } },
        { role: 'dfsp-operator', resources: { Participant: 'dfsp-b' } }
      ]
    })
  })

  it('applies each change as the operator made it', async () => {
    const assign = jest.fn().mockResolvedValue({ instance: 'x' })
    const unassign = jest.fn().mockResolvedValue({ instance: 'y' })
    const toolkit = toolkitWith({ assign, unassign })

    const response = await patch(toolkit, [
      { action: 'insert', role: 'dfsp-operator', resources: { Participant: 'dfsp-a' } },
      { action: 'delete', role: 'hub-admin' }
    ])

    expect(response.statusCode).toBe(200)
    expect(assign).toBeCalledWith('alice', { role: 'dfsp-operator', resources: { Participant: 'dfsp-a' } })
    expect(unassign).toBeCalledWith('alice', { role: 'hub-admin', resources: {} })
  })

  /**
   * A refusal is about the choice, not about the service, so it comes back as
   * one rather than being swallowed into a success.
   */
  it('reports what the IAM refused', async () => {
    const toolkit = toolkitWith({
      assign: jest.fn().mockRejectedValue(new IamError(422, ['no Participant called ghost'])),
      unassign: jest.fn()
    })

    const response = await patch(toolkit, [
      { action: 'insert', role: 'dfsp-operator', resources: { Participant: 'ghost' } }
    ])

    expect(response.statusCode).toBe(406)
    expect(toolkit.response).toBeCalledWith({ isCreated: false, errors: ['no Participant called ghost'] })
  })

  it('answers 502 when the IAM cannot be reached', async () => {
    const toolkit = toolkitWith({
      assign: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      unassign: jest.fn()
    })

    const response = await patch(toolkit, [{ action: 'insert', role: 'hub-admin' }])
    expect(response.statusCode).toBe(502)
  })
})
