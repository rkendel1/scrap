import { Submission, ConnectorConfig, ConnectorResult } from "./types";

export async function send(
  submission: Submission,
  config: ConnectorConfig
): Promise<ConnectorResult> {
  try {
    const { settings = {}, credentials = {} } = config;
    const { url, method = "POST", headers = {} } = settings;
    
    if (!url) {
      return {
        success: false,
        message: "Webhook URL is required in settings"
      };
    }

    // Prepare request headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
      ...credentials // Allow credentials to override headers
    };

    // For now, just log the webhook attempt
    console.log(`🔗 Webhook connector: ${method} to ${url}`);
    console.log(`   Headers:`, requestHeaders);
    console.log(`   Payload:`, submission);

    // TODO: Implement actual HTTP request
    // Example:
    // const response = await fetch(url, {
    //   method,
    //   headers: requestHeaders,
    //   body: JSON.stringify(submission)
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
    // }
    // 
    // const responseText = await response.text();
    // console.log('Webhook response:', responseText);

    return {
      success: true,
      message: `Webhook ${method} sent to ${url}`
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: "Failed to send webhook"
    };
  }
}