import { SESClient, waitUntilIdentityExists } from '@aws-sdk/client-ses'

interface Props {
  domain: $util.Input<string>
  zone: aws.route53.GetZoneResult | aws.route53.Zone
}

const sesClient = new SESClient()

export function Ses(props: Props) {
  const region = $util.output(aws.getRegion()).apply((region) => region.name)
  const subdomain = $util.all([props.domain, props.zone.name]).apply(([domain, zone]) => {
    const replaced = domain.replace(zone, '')
    if (replaced.endsWith('.')) return replaced.slice(0, -1)
    return replaced
  })

  const identity = new aws.ses.DomainIdentity('Domain', {
    domain: props.domain,
  })

  // dkim
  new aws.route53.Record('DomainVerification', {
    zoneId: props.zone.zoneId,
    name: $util.interpolate`_amazonses.${props.domain}`,
    type: aws.route53.RecordType.TXT,
    ttl: 600,
    records: [identity.verificationToken],
  })
  // dmarc
  new aws.route53.Record('DomainDmarc', {
    zoneId: props.zone.zoneId,
    name: $util.interpolate`_dmarc.${props.domain}`,
    type: aws.route53.RecordType.TXT,
    ttl: 600,
    records: [`v=DMARC1;p=quarantine;rua=mailto:dmarc@${props.domain}`],
  })
  // mx record for receiving
  new aws.route53.Record('DomainMX', {
    zoneId: props.zone.id,
    name: subdomain,
    type: aws.route53.RecordType.MX,
    ttl: 3600,
    records: [$util.interpolate`10 inbound-smtp.${region}.amazonaws.com`],
  })

  const dkim = new aws.ses.DomainDkim(`DomainDkim`, { domain: props.domain })

  dkim.dkimTokens.apply((tokens) => {
    for (const [idx, token] of tokens.entries()) {
      new aws.route53.Record(`DomainDkimRecord${idx}`, {
        zoneId: props.zone.zoneId,
        name: $util.interpolate`${token}._domainkey.${subdomain}`,
        type: aws.route53.RecordType.CNAME,
        ttl: 600,
        records: [`${token}.dkim.amazonses.com`],
      })
    }
  })

  const topic = new sst.aws.SnsTopic('Emails', {})
  topic.subscribe({
    handler: 'services/fns/src/email-subscriber.handler',
    transform: {
      function(fn) {
        fn.name = `${$util.getStack()}-emails-subscriber`
        return fn
      },
      logGroup(logs) {
        logs.name = `/aws/lambda/${$util.getStack()}/emails-subscriber`
        return logs
      },
      role(role) {
        role.name = `${$util.getStack()}-emails-subscriber`
        return role
      },
    },
  })

  $util.output(props.domain).apply(async (domain) => {
    const result = await waitUntilIdentityExists(
      {
        client: sesClient,
        maxWaitTime: 300,
      },
      { Identities: [domain] }
    )

    if (result.state !== 'SUCCESS') {
      throw new Error('Could not verify domain identity.')
    }

    const notificationTypes = ['Bounce', 'Complaint', 'Delivery']
    notificationTypes.forEach((notificationType) => {
      new aws.ses.IdentityNotificationTopic(`EmailNotificationOn${notificationType}`, {
        notificationType,
        identity: identity.arn,
        topicArn: topic.arn,
        includeOriginalHeaders: true,
      })
    })

    const receivingRuleSet = new aws.ses.ReceiptRuleSet('DomainReceiving', {
      ruleSetName: `${$util.getStack()}-receiving`,
    })
    new aws.ses.ReceiptRule('DomainReceiveRule', {
      ruleSetName: receivingRuleSet.ruleSetName,
      enabled: true,
      name: `${$util.getStack()}-receive-rule`,
      recipients: [props.domain],
      scanEnabled: true,
      snsActions: [{ position: 1, topicArn: topic.arn }],
    })
    new aws.ses.ActiveReceiptRuleSet('DomainReceivingActive', {
      ruleSetName: receivingRuleSet.ruleSetName,
    })
  })

  return {
    identity: identity,
    topic,
  }
}