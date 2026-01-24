// Email test endpoint with TypeScript and validation

import type { PagesContext } from '../../_shared/types.js';
import { createResponse, checkAdminAuth, handleCORS } from '../../_shared/auth.js';
import { validate, validators, ValidationSchema } from '../../_shared/validation.js';
import { errors, createErrorResponse, generateRequestId, handleError } from '../../_shared/errors.js';

interface Env {
  DB: D1Database;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
}

interface EmailResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

const testEmailSchema: ValidationSchema = {
  testEmail: { validators: [validators.required, validators.email] }
};

// Handle CORS preflight
export async function onRequestOptions(): Promise<Response> {
  return handleCORS();
}

// POST /api/email/test - Test email functionality
export async function onRequestPost(context: PagesContext): Promise<Response> {
  const requestId = generateRequestId();

  try {
    const admin = checkAdminAuth(context.request);
    if (!admin) {
      return createErrorResponse(errors.unauthorized('Invalid or expired token', requestId));
    }

    const body = await context.request.json() as Record<string, unknown>;

    // Validate input
    const validation = validate(body, testEmailSchema);
    if (!validation.valid) {
      return createErrorResponse(errors.validation(validation.errors, requestId));
    }

    const { testEmail } = body as { testEmail: string };

    console.log(`[${requestId}] Testing email to:`, testEmail);
    console.log(`[${requestId}] API key available:`, !!context.env.RESEND_API_KEY);
    console.log(`[${requestId}] From email:`, context.env.FROM_EMAIL || 'Not set');

    // Check for required environment variables
    if (!context.env.RESEND_API_KEY || !context.env.FROM_EMAIL) {
      console.error(`[${requestId}] Email configuration missing`);
      return createErrorResponse(errors.internal('Email system not configured', requestId));
    }

    // Send test email using Resend
    const emailResult = await sendTestEmail(context.env as Env, testEmail);

    if (emailResult.success) {
      return createResponse({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        service: 'Resend API',
        fromEmail: context.env.FROM_EMAIL
      });
    } else {
      return createErrorResponse(errors.externalService('Email service', requestId, emailResult.error));
    }

  } catch (error) {
    console.error(`[${requestId}] Error sending test email:`, error);
    return createErrorResponse(handleError(error, requestId));
  }
}

async function sendTestEmail(env: Env, toEmail: string): Promise<EmailResult> {
  if (!env.RESEND_API_KEY) {
    return {
      success: false,
      error: 'RESEND_API_KEY not configured. Please add it in Cloudflare Pages settings.'
    };
  }

  if (!env.FROM_EMAIL) {
    return {
      success: false,
      error: 'FROM_EMAIL not configured. Please add it in Cloudflare Pages settings.'
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [toEmail],
        subject: 'Retreat Portal - Email Test Successful!',
        html: generateTestEmailTemplate(env.FROM_EMAIL)
      })
    });

    if (response.ok) {
      const result = await response.json() as { id: string };
      console.log('Email sent successfully:', result);
      return { success: true, data: result };
    } else {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return { success: false, error: `Resend API error: ${errorText}` };
    }

  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

function generateTestEmailTemplate(fromEmail: string): string {
  const timestamp = new Date().toLocaleString();

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.8rem;">Email Test Successful!</h1>
        <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Your retreat portal email system is working perfectly</p>
      </div>

      <!-- Content -->
      <div style="background: white; padding: 2rem; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #10b981; margin: 1rem 0;">
          <h3 style="margin: 0 0 1rem 0; color: #065f46;">System Status: All Good!</h3>
          <ul style="margin: 0; padding-left: 1.2rem; color: #374151;">
            <li>Email service connected successfully</li>
            <li>Authentication working properly</li>
            <li>Templates rendering correctly</li>
            <li>Ready for production use</li>
          </ul>
        </div>

        <h3 style="color: #1f2937; margin: 1.5rem 0 1rem 0;">What's Next?</h3>
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 1rem 0;">
          Your retreat portal can now automatically send:
        </p>
        <ul style="color: #4b5563; line-height: 1.6; margin: 0 0 1.5rem 1.2rem;">
          <li><strong>Welcome emails</strong> with login details for new attendees</li>
          <li><strong>Urgent announcements</strong> directly to attendees' inboxes</li>
          <li><strong>Payment reminders</strong> for outstanding balances</li>
          <li><strong>Custom bulk emails</strong> to specific groups</li>
        </ul>

        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 1.5rem; margin-top: 2rem;">
          <div style="color: #6b7280; font-size: 0.875rem; text-align: center;">
            <p><strong>Sent:</strong> ${timestamp}</p>
            <p><strong>Service:</strong> Resend API</p>
            <p><strong>From:</strong> ${fromEmail}</p>
            <div style="margin-top: 1rem; padding: 0.5rem; background: #f3f4f6; border-radius: 6px;">
              <strong style="color: #374141;">Retreat Portal Email System</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
