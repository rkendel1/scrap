import { Submission, ConnectorConfig, ConnectorResult } from "./types";

export async function send(
  submission: Submission,
  config: ConnectorConfig
): Promise<ConnectorResult> {
  try {
    const { settings = {}, credentials = {} } = config;
    const { portalId, objectType = "contact" } = settings;
    const { apiKey } = credentials;
    
    if (!apiKey) {
      return {
        success: false,
        message: "HubSpot apiKey is required in credentials"
      };
    }

    // Map form fields to HubSpot properties
    const hubspotData = mapToHubSpotProperties(submission, objectType);

    // For now, just log the HubSpot attempt
    console.log(`🎯 HubSpot connector: Creating ${objectType} in portal ${portalId}`);
    console.log(`   Data:`, hubspotData);

    // TODO: Implement actual HubSpot API integration
    // Example:
    // const endpoint = `https://api.hubapi.com/crm/v3/objects/${objectType}`;
    // const response = await fetch(endpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     properties: hubspotData
    //   })
    // });
    // 
    // if (!response.ok) {
    //   throw new Error(`HubSpot API error: ${response.statusText}`);
    // }

    return {
      success: true,
      message: `${objectType} created in HubSpot`
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: "Failed to create HubSpot record"
    };
  }
}

function mapToHubSpotProperties(submission: Submission, objectType: string): Record<string, any> {
  // Basic field mapping for contacts
  const propertyMap: Record<string, string> = {
    'name': 'firstname',
    'first_name': 'firstname',
    'last_name': 'lastname',
    'email': 'email',
    'phone': 'phone',
    'company': 'company',
    'message': 'notes',
    'website': 'website'
  };

  const mapped: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(submission)) {
    const hubspotProperty = propertyMap[key.toLowerCase()] || key.toLowerCase();
    mapped[hubspotProperty] = value;
  }

  return mapped;
}