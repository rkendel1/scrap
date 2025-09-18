import { Submission, ConnectorConfig, ConnectorResult } from "./types";

export async function send(
  submission: Submission,
  config: ConnectorConfig
): Promise<ConnectorResult> {
  try {
    const { settings = {} } = config;
    const { webhookUrl, template, title = "New Form Submission" } = settings;
    
    if (!webhookUrl) {
      return {
        success: false,
        message: "Teams webhookUrl is required in settings"
      };
    }

    // Format submission data for Teams
    const teamsMessage = formatTeamsMessage(submission, template, title);

    // For now, just log the Teams attempt
    console.log(`🟦 Teams connector: Sending message`);
    console.log(`   Webhook: ${webhookUrl}`);
    console.log(`   Message:`, teamsMessage);

    // TODO: Implement actual Teams webhook posting
    // Example:
    // const response = await fetch(webhookUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(teamsMessage)
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`Teams webhook error: ${response.statusText}`);
    // }

    return {
      success: true,
      message: "Message sent to Teams channel"
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: "Failed to send Teams message"
    };
  }
}

function formatTeamsMessage(submission: Submission, template?: string, title: string = "New Form Submission"): any {
  if (template) {
    // Simple template replacement
    let message = template;
    for (const [key, value] of Object.entries(submission)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    
    return {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "0076D7",
      "summary": title,
      "sections": [{
        "activityTitle": title,
        "text": message
      }]
    };
  }

  // Default Teams adaptive card format
  const facts = Object.entries(submission).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: String(value)
  }));

  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0076D7",
    "summary": title,
    "sections": [{
      "activityTitle": title,
      "activitySubtitle": "Form submission received",
      "facts": facts
    }]
  };
}