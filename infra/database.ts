export function Database() {
  const table = new sst.aws.Dynamo('Database', {
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
      },
    },
  })

  return {
    table,
  }
}
