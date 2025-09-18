import { Submission, ConnectorConfig, ConnectorResult } from "./types";

export async function send(
  submission: Submission,
  config: ConnectorConfig
): Promise<ConnectorResult> {
  try {
    const { settings = {}, credentials = {} } = config;
    const { baseId, tableId } = settings;
    const { apiKey } = credentials;
    
    if (!baseId || !tableId) {
      return {
        success: false,
        message: "Airtable baseId and tableId are required in settings"
      };
    }

    if (!apiKey) {
      return {
        success: false,
        message: "Airtable apiKey is required in credentials"
      };
    }

    // For now, just log the Airtable attempt
    console.log(`📋 Airtable connector: Adding record to ${baseId}/${tableId}`);
    console.log(`   Data:`, submission);

    // TODO: Implement actual Airtable API integration
    // Example:
    // const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     fields: submission
    //   })
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`Airtable API error: ${response.statusText}`);
    // }

    return {
      success: true,
      message: `Record added to Airtable ${baseId}/${tableId}`
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: "Failed to add record to Airtable"
    };
  }
}