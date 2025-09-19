import { Submission, ConnectorConfig, ConnectorResult } from "./types";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Simple template rendering function
function renderTemplate(template: string, submission: Submission): string {
  let message = template;
  for (const [key, value] of Object.entries(submission)) {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return message;
}

// Function to format submission data as HTML if no template is provided
function formatAsHTML(submission: Submission): string {
  const items = Object.entries(submission)
    .map(([key, value]) => `<li><strong>${key}:</strong> ${String(value)}</li>`)
    .join('');
  return `
    <html>
      <body>
        <h3>New Form Submission:</h3>
        <ul>
          ${items}
        </ul>
      </body>
    </html>
  `;
}

export async function send(
  submission: Submission,
  config: ConnectorConfig
): Promise<ConnectorResult> {
  try {
    const { settings = {} } = config;
    const { to, subject = "New Form Submission", template } = settings;

    if (!to) {
      return {
        success: false,
        message: "Email 'to' address is required in settings"
      };
    }

    // Get SMTP configuration from environment variables
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : undefined;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailHost || !emailPort || !emailUser || !emailPass) {
      console.warn('📧 Email connector: SMTP environment variables are not fully configured. Email will be simulated.');
      console.log(`   Simulated Email to: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Data:`, submission);
      return {
        success: true,
        message: `Email simulated to ${to} (SMTP not fully configured)`
      };
    }

    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true for 465, false for other ports like 587
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const htmlContent = template ? renderTemplate(template, submission) : formatAsHTML(submission);

    await transporter.sendMail({
      from: emailUser, // Sender address
      to: to,
      subject: subject,
      html: htmlContent,
    });

    console.log(`📧 Email connector: Email sent successfully to ${to}`);
    return {
      success: true,
      message: `Email sent to ${to}`
    };
  } catch (error) {
    console.error('📧 Email connector: Failed to send email:', error);
    return {
      success: false,
      error,
      message: `Failed to send email: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}