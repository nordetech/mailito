import { Account, Profile } from '../db/accounts'
import { UserSchema } from './schemas'

export * as Users from '.'
export * from './schemas'

export async function findByID(userID: string): Promise<UserSchema | undefined> {
  const { user, profiles } = await Account.collections
    .profiles({ userID })
    .go()
    .then((r) => ({
      user: r.data.user[0],
      profiles: r.data.profile,
    }))

  if (!user) return

  return {
    userID: userID,
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
