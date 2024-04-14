/// <reference path="./.sst/platform/config.d.ts" />

import { Database } from './infra/database.js'
import { Ses } from './infra/ses.js'

const app = 'merki' as const

export default $config({
  app(input) {
    return {
      name: app,
      home: 'aws',
      providers: {
        aws: {
          region: 'eu-central-1',
        },
      },
      removal: input?.stage === 'production' ? 'retain' : 'remove',
    }
  },
  async run() {
    const stage = $util.getStack()
    const domainPrefix = stage === 'production' ? '' : `${stage}.`

    const zoneDomain = 'norde.tech'
    const appDomain = `${domainPrefix}${app}.${zoneDomain}` as const

    const zone = await aws.route53.getZone({ name: zoneDomain })

    const database = Database()

    const ses = Ses({
      zone,
      domain: appDomain,
      link: [database.table],
    })

    return {
      IdentityArn: ses.identity.arn,
      TopicArn: ses.topic.arn,
    }
  },
})
