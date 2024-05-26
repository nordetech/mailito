import { string, email, literal, union, pipe, object, array, optional, InferOutput } from 'valibot'
import { Roles } from '../db/accounts'

const UserSchema = object({
  userID: string(),
  email: pipe(string(), email()),
  workspaces: array(
    object({
      workspaceID: string(),
      name: string(),
      fullname: optional(string()),
      role: union([literal(Roles[0]), literal(Roles[1]), literal(Roles[2])]),
      createdAt: string(),
      updatedAt: optional(string()),
    })
  ),
  createdAt: string(),
  updatedAt: optional(string()),
})
export interface UserSchema extends InferOutput<typeof UserSchema> {}
