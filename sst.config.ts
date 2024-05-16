/// <reference path="./.sst/platform/config.d.ts" />
import packageJson from './package.json'

import { Database } from './infra/database.js'
import { Ses } from './infra/ses.js'

const tld = 'mailito.dev'

const deployStages = ['production', 'dev']

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
    // fail-safes
    if ($dev === false && deployStages.includes($app.stage) === false)
      throw new Error('Do NOT deploy to stages other than deploy stages!')
    if ($dev && deployStages.includes($app.stage)) throw new Error('Do NOT run `sst dev` on deploy stages!')

    const prod = $app.stage === 'production'
    const domain = [$dev && $app.stage, prod ? null : $dev ? 'dev' : $app.stage, tld].filter(Boolean).join('.')

    const database = Database()

    const ses = Ses({
      domain,
      receiver: prod,
      link: [database.table],
    })

    return {
      IdentityArn: ses.identity.arn,
      TopicArn: ses.topic.arn,
    }
  },
})
