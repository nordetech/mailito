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
  })

  return {
    table,
  }
}
