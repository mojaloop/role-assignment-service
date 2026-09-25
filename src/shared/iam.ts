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

/**
 * The IAM is where roles, resources and assignments live, and the only thing
 * holding write access to the permission graph. This service shows an operator
 * what is on offer and relays the choice they make.
 */

export interface Role {
  name: string;
  /** The resource names the role's grants leave open, for an assignment to name. */
  open: string[];
  grants: Array<{ permission: string; resources?: Record<string, string | string[]> }>;
}

export interface Resource {
  resourceName: string;
  id: string;
}

export interface Assignment {
  role: string;
  resources: Record<string, string>;
}

export class IamError extends Error {
  constructor(
    readonly status: number,
    readonly errors: string[],
  ) {
    super(errors.join('; '))
  }
}

export class IamClient {
  constructor (private readonly baseUrl: string) {}

  private async request<T> (method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      ...(body === undefined
        ? {}
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const errors = (payload as { errors?: string[]; error?: string }).errors ??
        [(payload as { error?: string }).error ?? `IAM answered ${response.status}`]
      throw new IamError(response.status, errors)
    }
    return payload as T
  }

  roles (): Promise<Role[]> {
    return this.request<Role[]>('GET', '/roles')
  }

  /** Every resource that exists, or only those of one resource name. */
  resources (resourceName?: string): Promise<Resource[]> {
    return this.request<Resource[]>(
      'GET',
      `/resources${resourceName ? `?resourceName=${encodeURIComponent(resourceName)}` : ''}`
    )
  }

  assignments (subject: string): Promise<Assignment[]> {
    return this.request<Assignment[]>('GET', `/subjects/${encodeURIComponent(subject)}/assignments`)
  }

  assign (subject: string, assignment: Assignment): Promise<{ instance: string }> {
    return this.request('POST', `/subjects/${encodeURIComponent(subject)}/assignments`, assignment)
  }

  unassign (subject: string, assignment: Assignment): Promise<{ instance: string }> {
    return this.request('DELETE', `/subjects/${encodeURIComponent(subject)}/assignments`, assignment)
  }
}
