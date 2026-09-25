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

import axios from 'axios'

const KRATOS_ADMIN_URL = 'http://127.0.0.1:4434'
const TEST_EMAIL = 'integration-user@example.com'

// Seeds a Kratos identity for the user endpoints to surface
const createTestIdentity = async (): Promise<string> => {
  const { data } = await axios.post(`${KRATOS_ADMIN_URL}/admin/identities`, {
    schema_id: 'default',
    traits: { email: TEST_EMAIL, roles: [] }
  })
  return data.id
}

const deleteTestIdentity = async (id: string): Promise<void> => {
  await axios.delete(`${KRATOS_ADMIN_URL}/admin/identities/${id}`)
}

describe('GET /users', (): void => {
  let identityId: string

  beforeAll(async (): Promise<void> => {
    identityId = await createTestIdentity()
  })

  afterAll(async (): Promise<void> => {
    await deleteTestIdentity(identityId)
  })

  it('returns the identities known to kratos', async (): Promise<void> => {
    const scenariosURI = 'http://127.0.0.1:3008/users'
    const response = await axios.get(scenariosURI)

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('users')
    expect(response.data.users).toContainEqual({
      id: identityId,
      name: {},
      username: TEST_EMAIL,
      emails: [TEST_EMAIL]
    })
  })
})

describe('GET/PATCH /users/{ID}/participants', (): void => {
  beforeAll(async (): Promise<void> => {
    // populate keto
    await axios.patch(
      'http://127.0.0.1:3008/users/myTestUserID/participants',
      {
        participantOperations: [
          {
            action: 'insert',
            participantId: 'dfspa'
          },
          {
            action: 'insert',
            participantId: 'dfspb'
          }
        ]
      }
    )
  })

  afterAll(async (): Promise<void> => {
    // clean up keto
    await axios.patch(
      'http://127.0.0.1:3008/users/myTestUserID/participants',
      {
        participantOperations: [
          {
            action: 'delete',
            participantId: 'dfspa'
          },
          {
            action: 'delete',
            participantId: 'dfspb'
          }
        ]
      }
    )
  })

  const expectedResp = {
    participants: ['dfspa', 'dfspb']
  }

  it('returns list of role ids', async (): Promise<void> => {
    const scenariosURI = 'http://127.0.0.1:3008/users/myTestUserID/participants'
    const response = await axios.get(scenariosURI)

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('participants')
    expect(response.data.participants.sort()).toEqual(expectedResp.participants.sort())
  })
})

describe('GET/PATCH /users/{ID}/roles', (): void => {
  beforeAll(async (): Promise<void> => {
    // populate keto
    await axios.patch(
      'http://127.0.0.1:3008/users/myTestUserID/roles',
      {
        roleOperations: [
          {
            action: 'insert',
            roleId: 'admin'
          },
          {
            action: 'insert',
            roleId: 'user'
          }
        ]
      }
    )
  })

  afterAll(async (): Promise<void> => {
    // clean up keto
    await axios.patch(
      'http://127.0.0.1:3008/users/myTestUserID/roles',
      {
        roleOperations: [
          {
            action: 'delete',
            roleId: 'admin'
          },
          {
            action: 'delete',
            roleId: 'user'
          }
        ]
      }
    )
  })

  const expectedResp = {
    roles: ['admin', 'user']
  }

  it('returns list of role ids', async (): Promise<void> => {
    const scenariosURI = 'http://127.0.0.1:3008/users/myTestUserID/roles'
    const response = await axios.get(scenariosURI)

    expect(response.status).toBe(200)
    expect(response.data).toHaveProperty('roles')
    expect(response.data.roles.sort()).toEqual(expectedResp.roles.sort())
  })
})

describe('GET /users/{ID}', (): void => {
  let identityId: string

  beforeAll(async (): Promise<void> => {
    identityId = await createTestIdentity()
  })

  afterAll(async (): Promise<void> => {
    await deleteTestIdentity(identityId)
  })

  it('returns the identity by id', async (): Promise<void> => {
    const scenariosIdURI = `http://127.0.0.1:3008/users/${identityId}`
    const userResponse = await axios.get(scenariosIdURI)

    expect(userResponse.status).toBe(200)
    expect(userResponse.data).toEqual({
      user: {
        id: identityId,
        name: {},
        username: TEST_EMAIL,
        emails: [TEST_EMAIL]
      }
    })
  })

  it('returns 404 for an unknown identity', async (): Promise<void> => {
    const unknownURI = 'http://127.0.0.1:3008/users/6e3c0aeb-0000-0000-0000-000000000000'
    const response = await axios.get(unknownURI, { validateStatus: () => true })
    expect(response.status).toBe(404)
  })
})
