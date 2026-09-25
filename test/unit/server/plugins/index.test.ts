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
 --------------
 ******/

import { Server } from '@hapi/hapi'
import Plugins from '~/server/plugins'

describe('the API document', () => {
  let server: Server

  beforeAll(async () => {
    server = new Server()
    await Plugins.register(server)
  })

  afterAll(async () => {
    await server.stop()
  })

  it('is served where the platform reads it, ahead of the catch-all route', async () => {
    const res = await server.inject({ method: 'GET', url: '/.authz/openapi' })
    expect(res.statusCode).toEqual(200)
    expect(res.headers['content-type']).toEqual('application/json')
    expect(JSON.parse(res.payload).openapi).toMatch(/^3\.1/)

    const again = await server.inject({
      method: 'GET',
      url: '/.authz/openapi',
      headers: { 'if-none-match': res.headers.etag as string }
    })
    expect(again.statusCode).toEqual(304)
  })
})
