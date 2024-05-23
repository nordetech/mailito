import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Entity } from 'electrodb'
import { Resource } from 'sst'
import { ulid } from 'ulid'
import { slugify } from 'usemods'

export const config = {
  client: new DynamoDBClient(),
  table: Resource.Accounts.name,
}

/**
 * A `Workspace` is the encapsulation of all resources a set of `Users` can access.
 */
export const Workspace = new Entity(
  {
    model: {
      service: 'workspaces',
      entity: 'workspace',
      version: '1',
    },
    attributes: {
      workspaceID: { type: 'string', default: () => `wrk_${ulid().toLowerCase()}`, readOnly: true },
      name: { type: 'string', required: true },
      slug: { type: 'string', set: (val, item) => slugify(item['name']), required: true },
      createdAt: { type: 'string', default: () => new Date().toISOString(), readOnly: true },
      updatedAt: { type: 'string', set: () => new Date().toISOString(), readOnly: true },
    },
    indexes: {
      workspace: {
        pk: { field: 'pk', composite: ['workspaceID'] },
        sk: { field: 'sk', composite: ['createdAt'] },
      },
    },
  },
  config
)

/**
 * An `Identity` is an object that can access resources in the system.
 * An `Identity` can be a *machine* (e.g. that authenticates with a token) or a *human
 * user* (e.g. who authenticates via username/password). The type of `Identity` is determined
 * by the authentication provider.
 *
 * An `Identity` can be linked to multiple `User` instances.
 */
export const Identity = new Entity(
  {
    model: {
      entity: 'identity',
      service: 'workspaces',
      version: '1',
    },
    attributes: {
      identityID: { type: 'string', default: () => `id_${ulid().toLowerCase()}`, readOnly: true },

      provider: { type: ['password', 'token'], required: true },

      email: { type: 'string' },
      passwordHash: { type: 'string' },

      createdAt: { type: 'string', default: () => new Date().toISOString(), readOnly: true },
      updatedAt: { type: 'string', set: () => new Date().toISOString(), readOnly: true },
    },
    indexes: {},
  },
  config
)

/**
 * A `User` is an instance of an `Identity` scoped to a `Workspace`.
 *
 * An `Identity` can access a `Workspace` if and only if the `Workspace` has a `User` associated with that `Identity`.
 */
export const User = new Entity({
  model: {
    entity: 'user',
    service: 'workspaces',
    version: '1',
  },
  attributes: {
    userID: { type: 'string', default: () => `usr_${ulid().toLowerCase()}`, readOnly: true },
    identityID: { type: 'string', required: true },
    workspaceID: { type: 'string', required: true },

    fullname: { type: 'string', required: false },
  },
  indexes: {},
})
