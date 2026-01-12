import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || 'GadgetSwap <noreply@gadgetswap.tech>'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
}

export async function sendEmail({ to, subject, html, text, cc, bcc, replyTo }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      ...(cc && { cc: Array.isArray(cc) ? cc : [cc] }),
      ...(bcc && { bcc: Array.isArray(bcc) ? bcc : [bcc] }),
      ...(replyTo && { reply_to: replyTo }),
    })

    if (error) {
      console.error('Email send error:', error)
      throw new Error(error.message)
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string,
  text?: string
) {
  // Resend supports batch sending - send in chunks of 100
  const BATCH_SIZE = 100
  const results: { success: number; failed: number; errors: string[] } = {
    success: 0,
    failed: 0,
    errors: [],
  }

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)

    try {
      // Send to each recipient individually for proper personalization
      const batchPromises = batch.map(async (email) => {
        try {
          await sendEmail({ to: email, subject, html, text })
          return { success: true, email }
        } catch (error: any) {
          return { success: false, email, error: error.message }
        }
      })

      const batchResults = await Promise.all(batchPromises)

      batchResults.forEach((result) => {
        if (result.success) {
          results.success++
        } else {
          results.failed++
          results.errors.push(`${result.email}: ${result.error}`)
        }
      })
    } catch (error: any) {
      results.failed += batch.length
      results.errors.push(`Batch error: ${error.message}`)
    }
  }

  return results
}

// Email templates
export function wrapEmailTemplate(content: string, preheader?: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GadgetSwap</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;background-color:#f3f4f6;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:12px 12px 0 0;padding:24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:bold;">GadgetSwap</h1>
    </div>

    <!-- Content -->
    <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px;color:#6b7280;font-size:12px;">
      <p style="margin:0 0 8px;">GadgetSwap - The Marketplace for iOS Enthusiasts</p>
      <p style="margin:0;">
        <a href="https://gadgetswap.tech/unsubscribe" style="color:#6b7280;">Unsubscribe</a> |
        <a href="https://gadgetswap.tech/help" style="color:#6b7280;">Help</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}
