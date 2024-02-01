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

describe('GET /users', (): void => {
  // keycloak is preloaded with an admin account
  const expectedResp = {
    users: [{
      emails: expect.any(Array),
      id: expect.any(String),
      name: {},
      username: 'admin'
    }]
  }

  it('returns participant id list queried from keycloak', async (): Promise<void> => {
    const scenariosURI = 'http://127.0.0.1:3008/users'
    const response = await axios.get(scenariosURI)

    expect(response.status).toBe(200)
    expect(response.data).toEqual(expectedResp)
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
    expect(response.data).toEqual(expectedResp)
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
    expect(response.data).toEqual(expectedResp)
  })
})

describe('GET /users/{ID}', (): void => {
  // keycloak is preloaded with an admin account
  const expectedResp = {
    users: [{
      emails: expect.any(Array),
      id: expect.any(String),
      name: {},
      username: 'admin'
    }]
  }

  const expectedUserResp = {
    user: {
      id: expect.any(String),
      name: {},
      username: 'admin',
      emails: expect.any(Array)
    }
  }

  it('returns participant id list queried from keycloak', async (): Promise<void> => {
    const scenariosURI = 'http://127.0.0.1:3008/users'
    const response = await axios.get(scenariosURI)

    expect(response.status).toBe(200)
    expect(response.data).toEqual(expectedResp)

    // id is non-deterministic in the integration keycloak service
    // so we are just retrieving all users and taking a test id to use
    const id = response.data.users[0].id

    const scenariosIdURI = `http://127.0.0.1:3008/users/${id}`
    const userResponse = await axios.get(scenariosIdURI)

    expect(userResponse.status).toBe(200)
    expect(userResponse.data).toEqual(expectedUserResp)
  })
})
