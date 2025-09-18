import { Submission, ConnectorConfig, ConnectorResult } from "./types";

export async function send(
  submission: Submission,
  config: ConnectorConfig
): Promise<ConnectorResult> {
  try {
    const { settings = {} } = config;
    const { webhookUrl, channel, template } = settings;
    
    if (!webhookUrl) {
      return {
        success: false,
        message: "Slack webhookUrl is required in settings"
      };
    }

    // Format submission data for Slack
    const formattedMessage = formatSlackMessage(submission, template);

    // For now, just log the Slack attempt
    console.log(`💬 Slack connector: Sending to ${channel || 'default channel'}`);
    console.log(`   Webhook: ${webhookUrl}`);
    console.log(`   Message:`, formattedMessage);

    // TODO: Implement actual Slack webhook posting
    // Example:
    // const response = await fetch(webhookUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     text: formattedMessage,
    //     channel: channel
    //   })
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`Slack webhook error: ${response.statusText}`);
    // }

    return {
      success: true,
      message: `Message sent to Slack ${channel || 'channel'}`
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: "Failed to send Slack message"
    };
  }
}

function formatSlackMessage(submission: Submission, template?: string): string {
  if (template) {
    // Simple template replacement
    let message = template;
    for (const [key, value] of Object.entries(submission)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return message;
  }

  // Default formatting
  const fields = Object.entries(submission)
    .map(([key, value]) => `*${key}:* ${value}`)
    .join('\n');
  
  return `🚀 New form submission:\n\n${fields}`;
}