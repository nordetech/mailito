import { Hono } from 'hono'
import { me, passwordLogin, register } from './auth'

const v1 = new Hono()
  .basePath('/v1')
  .onError((error, c) => {
    return c.json(
      {
        error: error.message,
      },
      500
    )
  })

  .route('/', register)
  .route('/', passwordLogin)
  .route('/', me)

export { v1 }
