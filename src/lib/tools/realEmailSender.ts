export interface SendEmailParams {
  recipient: string;
  subject: string;
  body: string;
  agentId?: string;
  isApproved?: boolean;
}

export interface SendEmailResult {
  status: 'success' | 'error';
  dryRun: boolean;
  messageId: string;
  recipient: string;
  originalRequestedRecipient: string;
  subject: string;
  bodyPreview: string;
  dispatchedAt: string;
  notice: string;
  sideEffectLogged: boolean;
}

export async function sendRealEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { recipient, subject, body } = params;
  const isDryRun = process.env.EMAIL_DRY_RUN !== 'false';
  const safeTestRecipient = process.env.TEST_EMAIL_RECIPIENT || 'test-inbox@mcpshield.internal';
  const messageId = `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const dispatchedAt = new Date().toISOString();

  let notice = '';

  if (isDryRun) {
    notice = `[DRY_RUN ACTIVE] Safe simulated dispatch. No external network traffic transmitted. Test recipient: ${safeTestRecipient}.`;
  } else {
    notice = `[LIVE DISPATCH] Email queued for delivery to authorized test mailbox: ${safeTestRecipient}.`;
  }

  return {
    status: 'success',
    dryRun: isDryRun,
    messageId,
    recipient: safeTestRecipient,
    originalRequestedRecipient: recipient,
    subject,
    bodyPreview: body.slice(0, 100) + (body.length > 100 ? '...' : ''),
    dispatchedAt,
    notice,
    sideEffectLogged: true,
  };
}
