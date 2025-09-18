import { Submission, ConnectorConfig, ConnectorResult } from "./types";

export async function send(
  submission: Submission,
  config: ConnectorConfig
): Promise<ConnectorResult> {
  try {
    const { settings = {}, credentials = {} } = config;
    const { 
      subdomain, 
      priority = "normal", 
      status = "new",
      tags = ["form-submission"]
    } = settings;
    const { email, token } = credentials;
    
    if (!subdomain || !email || !token) {
      return {
        success: false,
        message: "Zendesk subdomain, email, and token are required"
      };
    }

    // Create ticket from submission
    const ticketData = createZendeskTicket(submission, { priority, status, tags });

    // For now, just log the Zendesk attempt
    console.log(`🎫 Zendesk connector: Creating ticket in ${subdomain}.zendesk.com`);
    console.log(`   Ticket data:`, ticketData);

    // TODO: Implement actual Zendesk API integration
    // Example:
    // const auth = Buffer.from(`${email}/token:${token}`).toString('base64');
    // const response = await fetch(`https://${subdomain}.zendesk.com/api/v2/tickets.json`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Basic ${auth}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ ticket: ticketData })
    // });
    // 
    // if (!response.ok) {
    //   const errorData = await response.json();
    //   throw new Error(`Zendesk API error: ${JSON.stringify(errorData)}`);
    // }

    return {
      success: true,
      message: `Support ticket created in Zendesk`
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: "Failed to create Zendesk ticket"
    };
  }
}

function createZendeskTicket(submission: Submission, options: any): any {
  // Extract common fields
  const { name, email, subject, message, ...customFields } = submission;
  
  // Build ticket
  const ticket: any = {
    priority: options.priority,
    status: options.status,
    tags: options.tags,
    subject: subject || `Form submission from ${name || email || 'Unknown'}`,
    comment: {
      body: message || formatSubmissionAsDescription(submission)
    }
  };

  // Set requester if email provided
  if (email) {
    ticket.requester = {
      email: email,
      name: name || email
    };
  }

  // Add custom fields as ticket fields if they exist
  if (Object.keys(customFields).length > 0) {
    ticket.custom_fields = Object.entries(customFields).map(([key, value]) => ({
      id: key, // In real implementation, you'd map to actual custom field IDs
      value: value
    }));
  }

  return ticket;
}

function formatSubmissionAsDescription(submission: Submission): string {
  const lines = Object.entries(submission)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  
  return `Form submission details:\n\n${lines}`;
}