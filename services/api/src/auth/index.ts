import { vValidator } from '@hono/valibot-validator'
import { router, withAuthorizer, withSession } from '../util/router'
import { Auth } from '@mailito/core/auth'

export const register = router.post('/accounts', vValidator('json', Auth.register.Input), async (c) => {
  const user = await Auth.register(c.req.valid('json'))

  return c.json(user, 201)
})

export const passwordLogin = withSession.post(
  '/auth/password',
  vValidator('json', Auth.identifyUser.Input),
  async (c) => {
    const user = await Auth.identifyUser(c.req.valid('json'))

    const session = c.get('session')
    const existingLogins = session.get('workspaces') as Record<string, string>

    console.log(existingLogins)

    const newLogins = user.workspaces.reduce(
      (res, item) => ({
        ...res,
        [item.workspaceID]: user.userID,
      }),
      {}
    )

    if (!existingLogins) session.set('workspaces', newLogins)
    else session.set('workspaces', { ...existingLogins, ...newLogins })

    return c.json(user, 200)
  }
)

export const me = withAuthorizer.get('/me', async (c) => {
  return c.json(c.get('user'), 200)
})
