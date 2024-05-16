import { getZone } from './utils/get-zone'

interface Props {
  domain: $util.Input<string>
  receiver?: boolean
  link?: $util.Input<any>
}

export function Ses(props: Props) {
  const region = $util.output(aws.getRegion()).apply((region) => region.name)
  const zone = $util.output(getZone(props.domain))

  const identity = new aws.ses.DomainIdentity('Domain', {
    domain: props.domain,
  })

  // dkim
  new aws.route53.Record('DomainVerification', {
    zoneId: zone.id,
    name: $util.interpolate`_amazonses.${props.domain}`,
    type: aws.route53.RecordType.TXT,
    ttl: 600,
    records: [identity.verificationToken],
  })
  // dmarc
  new aws.route53.Record('DomainDmarc', {
    zoneId: zone.id,
    name: $util.interpolate`_dmarc.${props.domain}`,
    type: aws.route53.RecordType.TXT,
    ttl: 600,
    records: [`v=DMARC1; p=none;`],
  })
  // mx record for receiving
  new aws.route53.Record('DomainMX', {
    zoneId: zone.id,
    name: props.domain,
    type: aws.route53.RecordType.MX,
    ttl: 300,
    records: [$util.interpolate`10 inbound-smtp.${region}.amazonaws.com`],
  })

  const dkim = new aws.ses.DomainDkim(`DomainDkim`, { domain: props.domain })

  dkim.dkimTokens.apply((tokens) => {
    for (const [idx, token] of tokens.entries()) {
      new aws.route53.Record(`DomainDkimRecord${idx}`, {
        zoneId: zone.id,
        name: $util.interpolate`${token}._domainkey.${props.domain}`,
        type: aws.route53.RecordType.CNAME,
        ttl: 600,
        records: [`${token}.dkim.amazonses.com`],
      })
    }
  })

  const topic = new sst.aws.SnsTopic('Emails', {
    transform: {
      topic(args) {
        args.name = `${$util.getProject()}-${$util.getStack()}-emails`
        return args
      },
    },
  })
  topic.subscribe({
    handler: 'services/mailing/src/email-subscriber.handler',
    link: props.link,
    transform: {
      function(fn) {
        fn.name = `${$util.getProject()}-${$util.getStack()}-emails-handler`
        return fn
      },
      logGroup(logs) {
        logs.name = `/aws/lambda/${$util.getProject()}/${$util.getStack()}/emails-handler`
        return logs
      },
      role(role) {
        role.name = `${$util.getProject()}-${$util.getStack()}-emails-handler`
        return role
      },
    },
  })

  // a lot of resources will depend on this. make sure to add it as dependency where needed.
  const verification = new aws.ses.DomainIdentityVerification('EmailIdentityVerification', {
    domain: identity.domain,
  })

  const notificationTypes = ['Bounce', 'Complaint', 'Delivery']
  notificationTypes.forEach((notificationType) => {
    new aws.ses.IdentityNotificationTopic(
      `EmailNotificationOn${notificationType}`,
      {
        notificationType,
        identity: identity.arn,
        topicArn: topic.arn,
        includeOriginalHeaders: true,
      },
      { dependsOn: [verification] }
    )
  })

  const receivingRuleSet = new aws.ses.ReceiptRuleSet(
    'DomainReceiving',
    {
      ruleSetName: `${$util.getProject()}-${$util.getStack()}-receiving`,
    },
    { dependsOn: [verification] }
  )
  new aws.ses.ReceiptRule(
    'DomainReceiveRule',
    {
      ruleSetName: receivingRuleSet.ruleSetName,
      enabled: true,
      name: `${$util.getProject()}-${$util.getStack()}-receive-rule`,
      recipients: [props.domain],
      scanEnabled: true,
      snsActions: [{ position: 1, topicArn: topic.arn }],
    },
    { dependsOn: [verification] }
  )

  // only 1 is allowed in an aws account.
  if (props.receiver) {
    new aws.ses.ActiveReceiptRuleSet(
      'DomainReceivingActive',
      {
        ruleSetName: receivingRuleSet.ruleSetName,
      },
      { dependsOn: [verification] }
    )
  }

  new aws.ses.MailFrom(
    'DomainMailFrom',
    {
      domain: identity.domain,
      mailFromDomain: $util.interpolate`outbox.${identity.domain}`,
    },
    { dependsOn: [verification] }
  )
  new aws.route53.Record(
    'DomainMailFromMX',
    {
      zoneId: zone.id,
      name: $util.interpolate`outbox.${props.domain}`,
      type: aws.route53.RecordType.MX,
      ttl: 300,
      records: [$util.interpolate`10 feedback-smtp.${region}.amazonses.com`],
    },
    { dependsOn: [verification] }
  )
  new aws.route53.Record(
    'DomainMailFromTxt',
    {
      zoneId: zone.id,
      name: $util.interpolate`outbox.${props.domain}`,
      type: aws.route53.RecordType.TXT,
      ttl: 3600,
      records: [$util.interpolate`v=spf1 include:amazonses.com ~all`],
    },
    { dependsOn: [verification] }
  )

  return {
    identity: identity,
    topic,
  }
}
