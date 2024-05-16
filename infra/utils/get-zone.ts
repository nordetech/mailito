import { Route53Client, ListHostedZonesCommand } from '@aws-sdk/client-route-53'

interface GetZone {
  id: string
  name: string
}

export async function getZone(domain: $util.Input<string>) {
  const route53 = new Route53Client()

  const { HostedZones } = await route53.send(new ListHostedZonesCommand())

  const zone = $output(domain)
    .apply((domain) => HostedZones?.find((zone) => domain.includes(trimZoneName(zone.Name!))))
    .apply((zone) => {
      if (!zone) throw new Error('Could not find zone.')
      return zone
    })

  return zone.apply(
    (zone) =>
      ({
        id: zone.Id!,
        name: zone.Name!,
      }) as GetZone
  )
}

// zone names are FQDS's, we want to remove the trailing period
function trimZoneName(zone: string): string {
  if (!zone.endsWith('.')) return zone
  return zone.substring(0, zone.length - 1)
}
