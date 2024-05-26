import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { CustomAttributeType, Entity, EntityRecord, Service } from 'electrodb'
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
      slug: { type: 'string', set: (val, item) => slugify(item['name']) },

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
export interface WorkspaceRecord extends EntityRecord<typeof Workspace> {}

export const User = new Entity(
  {
    model: {
      entity: 'user',
      service: 'workspaces',
      version: '1',
    },
    attributes: {
      userID: id('usr'),

      provider: { type: ['password'] as const, required: true },

      email: { type: 'string', required: true },
      secret: { type: 'string' },

      ...timestamps,
    },
    indexes: {
      user: {
        pk: { field: 'pk', composite: ['userID'] },
        sk: { field: 'sk', composite: ['createdAt'] },
      },
      email: {
        index: 'gsi1',
        pk: { field: 'gsi1pk', composite: ['email'] },
        sk: { field: 'gsi1sk', composite: [] },
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
export type UserRecord = EntityRecord<typeof User>

export const Roles = ['admin', 'editor', 'viewer'] as const
export const Profile = new Entity(
  {
    model: {
      entity: 'profile',
      service: 'workspaces',
      version: '1',
    },
    attributes: {
      profileID: id('prf'),
      userID: refID('usr', { required: true }),
      workspaceID: refID('wrk', { required: true }),

      // these records act as a cache so multiple queries are not required when fetching a user profile
      workspace: { type: CustomAttributeType<WorkspaceRecord>('any'), required: true },
      email: { type: 'string', required: true },

      role: { type: Roles, required: true },
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
export type ProfileRecord = EntityRecord<typeof Profile>

export const Account = new Service(
  {
    workspace: Workspace,
    user: User,
    profile: Profile,
  },
  config
)
