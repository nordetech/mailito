import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Service } from 'electrodb'
import { emails } from './emails.js'
import { Resource } from 'sst'

const dynamo = new DynamoDBClient()
export const db = new Service(
  {
    emails,
  },
  {
    client: dynamo,
    table: Resource.App.name,
  }
)
