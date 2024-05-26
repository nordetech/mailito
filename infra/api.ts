interface Props {
  tables: {
    database: sst.aws.Dynamo
    accounts: sst.aws.Dynamo
  }
}

export function Api(props: Props) {
  const authSecret = new sst.Secret('AuthSecret', 'you must change this using `sst secret set`')

  const backend = new sst.aws.Function('Api', {
    handler: 'services/api/src/index.handler',
    architecture: 'x86_64',
    nodejs: {
      install: ['@node-rs/argon2'],
    },
    url: {
      cors: false,
    },
    link: [authSecret, props.tables.accounts, props.tables.database],
  })

  return {
    function: backend,
  }
}
