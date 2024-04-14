import { SNSEvent } from 'aws-lambda'
import { SESNotification } from './ses.types.js'

export async function handler(event: SNSEvent) {
  event.Records.forEach((record) => {
    console.log(record.Sns.Message)

    const body = JSON.parse(record.Sns.Message) as SESNotification

    switch (body.notificationType) {
      case 'Bounce': {
        break
      }
      case 'Complaint': {
        break
      }
      case 'Delivery': {
        break
      }
      case 'Received': {
        break
      }
    }
  })
}
