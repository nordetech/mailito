/// <reference path="./.sst/platform/config.d.ts" />
import packageJson from './package.json'

import { Database } from './infra/database.js'
import { Ses } from './infra/ses.js'

const zoneDomain = 'mailito.dev'

export default $config({
  app(input) {
    return {
      name: packageJson.name,
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
    const stage = $app.stage
    const isLocal = $dev

    const localEnvDomainPrefix = isLocal ? '' : `${stage}.dev`
    const domainPrefix = stage === 'production' ? '' : `${isLocal ? localEnvDomainPrefix : stage}.`
    const domain = `${domainPrefix}${zoneDomain}` as const

    const zone = await aws.route53.getZone({ name: zoneDomain })

    const database = Database()

    const ses = Ses({
      zone,
      domain,
      isReceivingActive: stage === 'dev',
      link: [database.table],
    })

    return {
      IdentityArn: ses.identity.arn,
      TopicArn: ses.topic.arn,
    }
  },
})
