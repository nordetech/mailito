import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import { v1 } from './routes.v1'

const api = new Hono().basePath('/api')
api.route('/', v1)
export const handler = handle(api)
