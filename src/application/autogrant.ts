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

import { ServiceConfig } from '../shared/config'
import * as keto from '@ory/keto-client'
import {
    Logger as SDKLogger
} from '@mojaloop/sdk-standard-components'
import { patchRolesForUserId, PatchOperationActionEnum } from '~/shared/userRoleAssignment';
import { KeycloakClientFactory } from '~/shared/keycloakClientFactory';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';

// This is hardcoded intentionally to minimize the security risk
const PORTAL_ADMIN_USER = 'portal_admin'

export class AutoGrant {
    static async start (config: ServiceConfig, logger: SDKLogger.Logger): Promise<void> {
        try {
            const kcAdminClient = await KeycloakClientFactory.createKeycloakClient(config)
            const credentials: Credentials = {
                username: config.KEYCLOAK_USER,
                password: config.KEYCLOAK_PASSWORD,
                grantType: 'password',
                clientId: 'admin-cli'
            }
            // Authorize with username / password
            await kcAdminClient.auth(credentials)
    
            const keycloakUsers = await kcAdminClient.users.find({
                username: PORTAL_ADMIN_USER
            })
            if (!keycloakUsers || keycloakUsers.length === 0) {
                throw new Error('portal_admin user not found')
            }
            if (keycloakUsers.length > 1) {
                throw new Error('multiple portal_admin users found')
            }
    
            if (keycloakUsers[0].id) {
                const portalAdminUserId = keycloakUsers[0].id
                const roleOperations = config.AUTO_GRANT_PORTAL_ADMIN_ROLES.map(roleId => {
                    return {
                        action: PatchOperationActionEnum.INSERT,
                        roleId
                    }
                })
    
                const oryKetoReadRelationshipApi = new keto.RelationshipApi(
                    undefined,
                    config.ORY_KETO_READ_SERVICE_URL
                )
                await patchRolesForUserId(portalAdminUserId, roleOperations, {
                    readRelationshipApi: oryKetoReadRelationshipApi,
                    config
                })
            }
        
        } catch (e: any) {
            logger.error(`Error while auto granting permissions ${e.message}`)
        }
    }
}
