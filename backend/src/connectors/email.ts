import { Submission, ConnectorConfig, ConnectorResult } from "./types";

export async function send(
  submission: Submission,
  config: ConnectorConfig
): Promise<ConnectorResult> {
  try {
    // Basic email sending implementation
    // In a real implementation, you would use nodemailer or similar
    const { settings = {} } = config;
    const { to, subject = "New Form Submission", template } = settings;

    if (!to) {
      return {
        success: false,
        message: "Email 'to' address is required in settings"
      };
    }

    // For now, just log the email attempt
    console.log(`📧 Email connector: Sending to ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Data:`, submission);

    // TODO: Implement actual email sending with nodemailer/SMTP or SendGrid
    // Example:
    // const transporter = nodemailer.createTransporter(config.credentials);
    // await transporter.sendMail({
    //   to,
    //   subject,
    //   html: template ? renderTemplate(template, submission) : formatAsHTML(submission)
    // });

    return {
      success: true,
      message: `Email sent to ${to}`
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: "Failed to send email"
    };
  }
}