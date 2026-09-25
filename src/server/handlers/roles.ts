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

import { StateResponseToolkit } from '~/server/plugins/state'
import { Request, ResponseObject } from '@hapi/hapi'
import { logThrown } from '~/shared/logger'

/**
 * The roles a deployment defined, each with the resource names its grants
 * leave open. A role leaving none is held as it is; a role leaving some is
 * held once per set of resources an assignment names, and each open name is
 * the list an operator picks those resources from.
 */
const get = async (_context: unknown, _request: Request, h: StateResponseToolkit): Promise<ResponseObject> => {
  try {
    const roles = await h.getIam().roles()
    return h.response({
      roles: roles.map((role) => ({ name: role.name, open: role.open }))
    }).code(200)
  } catch (e) {
    logThrown(h.getLogger(), e)
    return h.response().code(502)
  }
}

export default {
  get
}
