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

import KcAdminClient from '@keycloak/keycloak-admin-client'
import * as keto from '@ory/keto-client'
import { logger } from '~/shared/logger'
import Config from '~/shared/config'
import { AutoGrant } from '~/application'
import { patchRolesForUserId, PatchOperationActionEnum } from '~/shared/userRoleAssignment';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users'

jest.mock('@keycloak/keycloak-admin-client')
jest.mock('@ory/keto-client')
jest.mock('~/shared/userRoleAssignment')
jest.mock('@keycloak/keycloak-admin-client/lib/resources/users')


// jest.spyOn(patchRolesForUserId, 'auth').mockResolvedValue();
// jest.spyOn(KcAdminClient.prototype.users, 'find').mockResolvedValue([{ id: '1234' }])



describe('AutoGrant', () => {
  beforeEach((): void => {
    jest.clearAllMocks()
  })  

  it('AutoGrantStart - happy path', async () => {
    jest.spyOn(KcAdminClient.prototype, 'auth').mockImplementation(async () => {});
    const adminClient = new KcAdminClient({})
    const usersObj = new Users(adminClient);
    usersObj.find = jest.fn().mockResolvedValue([{ id: 'portal_admin' }])
    KcAdminClient.prototype.users = usersObj;

    await AutoGrant.start(Config, logger)
    expect(patchRolesForUserId).toHaveBeenCalled()
  })
  it('AutoGrantStart - with no portal_admin users', async () => {
    jest.spyOn(KcAdminClient.prototype, 'auth').mockImplementation(async () => {});
    const adminClient = new KcAdminClient({})
    const usersObj = new Users(adminClient);
    usersObj.find = jest.fn().mockResolvedValue([])
    KcAdminClient.prototype.users = usersObj;

    await AutoGrant.start(Config, logger)
    expect(patchRolesForUserId).not.toHaveBeenCalled()
  })
  it('AutoGrantStart - multiple portal_admin users', async () => {
    jest.spyOn(KcAdminClient.prototype, 'auth').mockImplementation(async () => {});
    const adminClient = new KcAdminClient({})
    const usersObj = new Users(adminClient);
    usersObj.find = jest.fn().mockResolvedValue([{ id: 'portal_admin' }, { id: 'portal_admin' }])
    KcAdminClient.prototype.users = usersObj;

    await AutoGrant.start(Config, logger)
    expect(patchRolesForUserId).not.toHaveBeenCalled()
  })
})
