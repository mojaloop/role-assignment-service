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
 * What an operator can choose among when a role leaves a resource name open.
 * A resource appears here the moment the service that owns it says it exists,
 * so a DFSP onboarded this morning is grantable this morning.
 */
const get = async (_context: unknown, request: Request, h: StateResponseToolkit): Promise<ResponseObject> => {
  try {
    const resourceName = request.query.resourceName as string | undefined
    return h.response({ resources: await h.getIam().resources(resourceName) }).code(200)
  } catch (e) {
    logThrown(h.getLogger(), e)
    return h.response().code(502)
  }
}

export default {
  get
}
