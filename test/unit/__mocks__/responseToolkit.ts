import { ResponseToolkit, ResponseObject } from '@hapi/hapi'

/**
 * mockResponseToolkit
 * @description A mock Response toolkit for testing handler functions
 *   Currently only mocks out the `statusCode` parameter
 */
const mockResponseToolkit = {
  response: (): ResponseObject => {
    return {
      code: (statusCode: number): ResponseObject => {
        const response: ResponseObject = {
          statusCode
        } as unknown as ResponseObject
        return response
      }
    } as unknown as ResponseObject
  }
} as unknown as ResponseToolkit

export {
  mockResponseToolkit
}
