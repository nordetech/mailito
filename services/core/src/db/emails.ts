import { Entity } from 'electrodb'

export const emails = new Entity({
  model: {
    entity: 'emails',
    service: 'db',
    version: '1',
  },
  attributes: {},
  indexes: {},
})
