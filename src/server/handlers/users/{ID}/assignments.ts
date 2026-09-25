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
import { Assignment, IamError } from '~/shared/iam'
import { logThrown } from '~/shared/logger'

interface AssignmentOperation extends Assignment {
  action: 'insert' | 'delete';
}

interface AssignmentsPatchRequest {
  assignmentOperations: AssignmentOperation[];
}

/** What a user holds: one entry per role instance, with the resources it names. */
const get = async (_context: unknown, request: Request, h: StateResponseToolkit): Promise<ResponseObject> => {
  try {
    const assignments = await h.getIam().assignments(request.params.ID)
    return h.response({ assignments }).code(200)
  } catch (e) {
    logThrown(h.getLogger(), e)
    return h.response().code(502)
  }
}

/**
 * Applies a set of changes as the operator made them, and reports the ones the
 * IAM refused rather than pretending the whole edit landed.
 */
const patch = async (_context: unknown, request: Request, h: StateResponseToolkit): Promise<ResponseObject> => {
  const { assignmentOperations } = request.payload as AssignmentsPatchRequest
  const iam = h.getIam()
  const errors: string[] = []

  for (const operation of assignmentOperations) {
    const assignment: Assignment = { role: operation.role, resources: operation.resources ?? {} }
    try {
      if (operation.action === 'insert') await iam.assign(request.params.ID, assignment)
      else await iam.unassign(request.params.ID, assignment)
    } catch (e) {
      if (e instanceof IamError && e.status === 422) errors.push(...e.errors)
      else {
        logThrown(h.getLogger(), e)
        return h.response().code(502)
      }
    }
  }

  return errors.length > 0
    ? h.response({ isCreated: false, errors }).code(406)
    : h.response().code(200)
}

export default {
  get,
  patch
}
