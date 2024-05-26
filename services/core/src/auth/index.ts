export * as Auth from '.'
import * as v from 'valibot'
import { Profile, User, Workspace, WorkspaceRecord } from '../db/accounts'
import type { UserSchema } from '../users'
import { hashPassword, verifyPassword } from './util'

register.Input = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
})
export async function register(input: v.InferOutput<typeof register.Input>): Promise<UserSchema> {
  const existingUser = await User.query
    .email({
      email: input.email,
    })
    .go()
    .then((r) => r.data?.[0])

  if (existingUser) throw new Error('User already exists.')

  const user = await User.put({
    provider: 'password',
    email: input.email,
    secret: await hashPassword(input.password),
  })
    .go()
    .then((r) => r.data)

  const workspace = await Workspace.put({
    name: 'My Workspace',
  })
    .go()
    .then((r) => r.data as WorkspaceRecord)

  const profile = await Profile.put({
    userID: user.userID,
    email: user.email,

    workspaceID: workspace.workspaceID,
    workspace: workspace,

    role: 'admin',
  })
    .go()
    .then((r) => r.data)

  return {
    userID: user.userID,
    email: user.email,
    workspaces: [
      {
        workspaceID: workspace.workspaceID,
        name: workspace.name,
        fullname: profile.fullname,
        role: profile.role,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
    ],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

identifyUser.Input = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
})
export async function identifyUser(input: v.InferOutput<typeof register.Input>): Promise<UserSchema> {
  const user = await User.query
    .email({
      email: input.email,
    })
    .go()
    .then((r) => r.data?.[0])

  if (!user) throw new Error('Credentials invalid.')
  if (user.provider !== 'password') throw new Error('Credentials invalid.')
  if (!user.secret) throw new Error('Credentials invalid.')

  const passwordIsValid = await verifyPassword(input.password, user.secret)
  if (!passwordIsValid) throw new Error('Credentials invalid.')

  const profiles = await Profile.query
    .user({ userID: user.userID })
    .go()
    .then((r) => r.data)

  return {
    userID: user.userID,
    email: user.email,
    workspaces: profiles.map((profile) => ({
      workspaceID: profile.workspace.workspaceID,
      name: profile.workspace.name,
      role: profile.role,
      createdAt: profile.workspace.createdAt,
      updatedAt: profile.workspace.updatedAt,
    })),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}
