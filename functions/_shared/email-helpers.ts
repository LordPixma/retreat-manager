// Email styling helpers for retreat-manager

export type EmailType = 'urgent' | 'welcome' | 'payment' | 'reminder' | 'announcement' | 'default';

export const headerStyles: Record<EmailType | 'default', string> = {
  urgent: 'background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);',
  welcome: 'background: linear-gradient(135deg, #059669 0%, #047857 100%);',
  payment: 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%);',
  reminder: 'background: linear-gradient(135deg, #d97706 0%, #b45309 100%);',
  announcement: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);',
  default: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'
};

export const typeIcons: Record<EmailType, string> = {
  urgent: '🚨',
  welcome: '🎉',
  payment: '💳',
  reminder: '⏰',
  announcement: '📢',
  default: '📧'
};

/**
 * Get header style for email type
 */
export function getHeaderStyle(type?: string): string {
  if (type && type in headerStyles) {
    return headerStyles[type as EmailType];
  }
  return headerStyles.default;
}

/**
 * Get icon for email type
 */
export function getTypeIcon(type?: string): string {
  if (type && type in typeIcons) {
    return typeIcons[type as EmailType];
  }
  return typeIcons.default;
}

/**
 * Build email HTML template
 */
export function buildEmailTemplate(options: {
  subject: string;
  message: string;
  type?: EmailType;
  retreatName?: string;
  portalUrl?: string;
  attendeeName?: string;
}): string {
  const { subject, message, type = 'default', retreatName = 'Retreat Portal', portalUrl, attendeeName } = options;
  const headerStyle = getHeaderStyle(type);
  const icon = getTypeIcon(type);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="${headerStyle} color: #ffffff; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">${icon} ${retreatName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              ${attendeeName ? `<p style="margin: 0 0 20px 0; color: #333;">Dear ${attendeeName},</p>` : ''}
              <div style="color: #333; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
              ${portalUrl ? `<p style="margin: 0 0 10px 0;">Visit: <a href="${portalUrl}" style="color: #667eea;">${portalUrl}</a></p>` : ''}
              <p style="margin: 0;">This is an automated message from ${retreatName}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
