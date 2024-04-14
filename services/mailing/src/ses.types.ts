import { SESMail, SESReceipt } from 'aws-lambda'

interface SESBounce {
  timestamp: string
  remoteMtaIp: string
  reportingMTA: string

  feedbackId: string
  bounceType: 'Undetermined' | 'Permanent' | 'Transient'
  bounceSubType:
    | 'Undetermined'
    | 'General'
    | 'NoEmail'
    | 'Suppressed'
    | 'OnAccountSuppressionList'
    | 'General'
    | 'MailboxFull'
    | 'MessageTooLarge'
    | 'ContentRejected'
    | 'AttachmentRejected'
  bouncedRecipients: Array<{
    emailAddress: string
    action: string
    status: string
    diagnosticCode?: string
  }>
}

interface SESComplaint {
  timestamp: string
  feedbackId: string
  complainedRecipients: Array<{ emailAddress: string }>

  remoteMtaIp?: string
  reportingMTA?: string
  complaintSubType?: 'OnAccountSuppressionList' | null
  userAgent?: string
  complaintFeedbackType?: string
  arrivalDate?: string
}

interface SESDelivery {
  timestamp: string
  remoteMtaIp: string
  reportingMTA: string

  processingTimeMillis: number
  recipients: string[]
  smtpResponse: string
}

interface SESBounceNotification {
  notificationType: 'Bounce'
  mail: SESMail
  bounce: SESBounce
}
interface SESComplaintNotification {
  notificationType: 'Complaint'
  mail: SESMail
  complaint: SESComplaint
}
interface SESDeliveryNotification {
  notificationType: 'Delivery'
  mail: SESMail
  delivery: SESDelivery
}
interface SESReceivedNotification {
  notificationType: 'Received'
  mail: SESMail
  receipt: SESReceipt
  content: string
}

export type SESNotification =
  | SESBounceNotification
  | SESComplaintNotification
  | SESDeliveryNotification
  | SESReceivedNotification
