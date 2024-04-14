import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Service } from 'electrodb'
import { emails } from './emails.js'

const dynamo = new DynamoDBClient()
export const db = new Service(
  {
    emails,
  },
  {
    client: dynamo,
    table: 'table',
  }
)
