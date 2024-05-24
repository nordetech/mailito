import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Entity, Service } from 'electrodb'
import { Resource } from 'sst'
import { slugify } from 'usemods'
import { id, refID, timestamps } from './util'

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
      workspaceID: id('wrk'),

      name: { type: 'string', required: true },
      slug: { type: 'string', set: (val, item) => slugify(item['name']), required: true },

      ...timestamps,
    },
    indexes: {
      workspace: {
        pk: { field: 'pk', composite: ['workspaceID'] },
        sk: { field: 'sk', composite: ['createdAt'] },
      },
      members: {
        collection: 'members',
        index: 'gsi1',
        pk: { field: 'gsi1pk', composite: ['workspaceID'] },
        sk: { field: 'gsi1sk', composite: [] },
      },
    },
  },
  config
)

export const User = new Entity(
  {
    model: {
      entity: 'user',
      service: 'workspaces',
      version: '1',
    },
    attributes: {
      userID: id('usr'),

      provider: { type: ['password'], required: true },

      email: { type: 'string' },
      passwordHash: { type: 'string' },

      ...timestamps,
    },
    indexes: {
      user: {
        pk: { field: 'pk', composite: ['userID'] },
        sk: { field: 'sk', composite: ['createdAt'] },
      },
      profile: {
        collection: 'profiles',
        index: 'gsi2',
        pk: { field: 'gsi2pk', composite: ['userID'] },
        sk: { field: 'gsi2sk', composite: [] },
      },
    },
  },
  config
)

export const Profile = new Entity(
  {
    model: {
      entity: 'profile',
      service: 'workspaces',
      version: '1',
    },
    attributes: {
      profileID: id('prf'),
      workspaceID: refID('wrk', { required: true }),
      userID: refID('usr', { required: true }),

      fullname: { type: 'string', required: false },

      ...timestamps,
    },
    indexes: {
      profile: {
        pk: { field: 'pk', composite: ['profileID'] },
        sk: { field: 'sk', composite: ['createdAt'] },
      },
      workspace: {
        collection: 'members',
        index: 'gsi1',
        pk: { field: 'gsi1pk', composite: ['workspaceID'] },
        sk: { field: 'gsi1sk', composite: ['createdAt'] },
      },
      user: {
        collection: 'profiles',
        index: 'gsi2',
        pk: { field: 'gsi2pk', composite: ['userID'] },
        sk: { field: 'gsi2sk', composite: [] },
      },
    },
  },
  config
)

export const Account = new Service(
  {
    workspace: Workspace,
    user: User,
    profile: Profile,
  },
  config
)
