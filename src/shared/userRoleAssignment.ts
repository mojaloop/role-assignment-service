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

 - Vijaya Kumar Guthi <vijaya.guthi@infitx.com>

 --------------
 ******/

import * as keto from '@ory/keto-client'
import axios, { AxiosError } from 'axios'
import { ServiceConfig } from './config'

export type AssignRoleToUserIdOptions = {
  readRelationshipApi: keto.RelationshipApi;
  config: ServiceConfig;
  // logger: SDKLogger.Logger;
}

export enum PatchOperationActionEnum {
  INSERT = 'insert',
  DELETE = 'delete'
}

export type PatchOperation = {
  roleId: string;
  action: PatchOperationActionEnum;
}

export async function patchRolesForUserId (userId: string, roleOperations: PatchOperation[], options: AssignRoleToUserIdOptions): Promise<void> {
  // Get the current set of user role assignments
  const response = await options.readRelationshipApi.getRelationships({
    namespace: 'role',
    relation: 'member',
    subjectId: userId
  })
  const rolesIdList = response?.data.relation_tuples?.map(({ object }) => object)
  const userRoles = new Set(rolesIdList)

  // Calculate the resultant set of user role assignments
  roleOperations.forEach(roleOperation => {
    if (roleOperation.action === 'insert') {
      if (!userRoles.has(roleOperation.roleId)) {
        userRoles.add(roleOperation.roleId)
      }
    } else if (roleOperation.action === 'delete') {
      userRoles.delete(roleOperation.roleId)
    }
  })

  // Call the operator API
  const updatePayload = {
    username: userId,
    roles: Array.from(userRoles.values())
  }
  try {
    await axios.post(options.config.ROLE_OPERATOR_SERVICE_URL + '/assignment/user-role', updatePayload)
  } catch (err) {
    if ((<AxiosError>err).isAxiosError && (<AxiosError>err).response?.data.errors) {
      throw new Error((<AxiosError>err).response?.data.errors.join(', '))
    } else {
      throw (err)
    }
  }
}
