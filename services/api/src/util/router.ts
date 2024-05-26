import { UserSchema, Users } from '@mailito/core/users'
import { Env, Hono } from 'hono'
import { Session, sessionMiddleware, CookieStore } from 'hono-sessions'

export const router = new Hono()

const cookieStore = new CookieStore()
const session = sessionMiddleware({
  store: cookieStore,
  encryptionKey: 'password_at_least_32_characters_long', // TODO: update to a env value
  expireAfterSeconds: 60 * 60 * 24 * 31,
  sessionCookieName: 'x-lito-session',
  cookieOptions: {
    sameSite: 'Lax',
    path: '/',
    httpOnly: true,
  },
})

export const withSession = new Hono<WithSession>().use('*', session)

export const withAuthorizer = new Hono<WithAuthorizer>().use('*', session, async (c, next) => {
  const workspaceID = c.req.header('x-lito-workspace')
  if (!workspaceID) throw new Error('The x-lito-workspace header must be supplied with a valid workspace ID as value.')

  const isSessionValid = c.get('session').sessionValid()
  if (!isSessionValid) throw new Error('Session is not active or is invalid. Please log in.')

  const workspaces = c.get('session').get('workspaces') as Record<string, string>

  const userID = workspaces[workspaceID]
  if (!userID) throw new Error('Session is not active or is invalid. Please log in.')

  const user = await Users.findByID(userID)
  if (!user) throw new Error('Session is not active or is invalid. Please log in.')
  c.set('user', user)

  await next()
})

export interface WithSession extends Env {
  Variables: {
    session: Session
  }
}
export interface WithAuthorizer extends Env {
  Variables: {
    session: Session
    user: UserSchema
  }
}
