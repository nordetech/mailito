import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Entity } from 'electrodb'
import { Resource } from 'sst'
import { id, refID, timestamps } from './util'

export const config = {
  client: new DynamoDBClient(),
  table: Resource.Database.name,
}

export const Event = new Entity(
  {
    model: {
      service: 'database',
      entity: 'event',
      version: '1',
    },
    attributes: {
      eventID: id('ev'),
      workspaceID: refID('wrk', { required: true }),

      name: { type: 'string' },
      payload: { type: 'any' },

      createdAt: timestamps.createdAt,
    },
    indexes: {
      // this should allow us two access patterns:
      // - get all events in a workspace
      // - get a specific event
      // also, because eventID is an ULID, they will be sorted chronologically directly
      event: {
        pk: { field: 'pk', composite: ['workspaceID'] },
        sk: { field: 'sk', composite: ['eventID'] },
      },
    },
  },
  config
)
