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

import { StateResponseToolkit } from '~/server/plugins/state'
import { Request, ResponseObject } from '@hapi/hapi'
import { PatchDelta } from '@ory/keto-client'

interface PatchOperation {
  roleId: string;
  action: 'insert' | 'delete';
}
interface UserIDRolesPatchRequest {
  roleOperations: PatchOperation[];
}

const get = async (_context: unknown, request: Request, h: StateResponseToolkit): Promise<ResponseObject> => {
  try {
    const userId = request.params.ID
    const response = await h.getKetoReadApi().getRelationTuples(
      'role',
      undefined,
      'member',
      userId
    )
    if (!response.data.relation_tuples) {
      return h.response({
        roles: []
      }).code(200)
    }
    const rolesIdList = response.data.relation_tuples.map(function (relationTuple) {
      return relationTuple.object
    })
    return h.response({
      roles: rolesIdList
    }).code(200)
  } catch (e) {
    h.getLogger().error(e)
    return h.response().code(500)
  }
}

const patch = async (_context: unknown, request: Request, h: StateResponseToolkit): Promise<ResponseObject> => {
  try {
    const userId = request.params.ID
    const payload = request.payload as UserIDRolesPatchRequest
    const roleDelta: PatchDelta[] = payload.roleOperations.map(function (operation) {
      return {
        action: operation.action,
        relation_tuple: {
          namespace: 'role',
          object: operation.roleId,
          relation: 'member',
          subject: userId
        }
      }
    })
    await h.getKetoWriteApi().patchRelationTuples(roleDelta)
    // NOTE: return a 200 or 204 here?
    return h.response().code(200)
  } catch (e) {
    h.getLogger().error(e)
    return h.response().code(500)
  }
}

export default {
  get,
  patch
}
