export function Database() {
  const accounts = new sst.aws.Dynamo('Accounts', {
    fields: {
      pk: 'string',
      sk: 'string',
      gsi1pk: 'string',
      gsi1sk: 'string',
    },
    primaryIndex: {
      hashKey: 'pk',
      rangeKey: 'sk',
    },
    globalIndexes: {
      gsi1: {
        hashKey: 'gsi1pk',
        rangeKey: 'gsi1sk',
      },
    },
    transform: {
      table(args) {
        args.name = `${$util.getProject()}-${$util.getStack()}-accounts`
        return args
      },
    },
  })

  const database = new sst.aws.Dynamo('Database', {
    fields: {
      pk: 'string',
      sk: 'string',
    },
    primaryIndex: {
      hashKey: 'pk',
      rangeKey: 'sk',
    },
    transform: {
      table(args) {
        args.name = `${$util.getProject()}-${$util.getStack()}-database`
        return args
      },
    },
  })

  return {
    database,
    accounts,
  }
}
