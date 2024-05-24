import { Attribute, StringAttribute } from 'electrodb'
import { ulid } from 'ulid'

export type IdPrefix = 'wrk' | 'usr' | 'prf' | 'ev'

export const id = (prefix: IdPrefix) =>
  ({ type: 'string', default: () => `${prefix}_${ulid().toLowerCase()}`, readOnly: true }) satisfies Attribute

export const refID = (prefix: IdPrefix, props: Partial<Omit<StringAttribute, 'type' | 'validate'>> = {}) =>
  ({
    type: 'string',
    validate: (value) => {
      const isValid = value.startsWith(prefix)
      if (!isValid) return `The ID provided does not start with "${prefix}".`
    },
    ...props,
  }) satisfies Attribute

export const timestamps = {
  get createdAt() {
    return { type: 'string', default: () => new Date().toISOString(), readOnly: true } satisfies Attribute
  },
  get updatedAt() {
    return { type: 'string', set: () => new Date().toISOString(), readOnly: true } satisfies Attribute
  },
} as const
