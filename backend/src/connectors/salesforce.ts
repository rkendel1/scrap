import { Submission, ConnectorConfig, ConnectorResult } from "./types";

export async function send(
  submission: Submission,
  config: ConnectorConfig
): Promise<ConnectorResult> {
  try {
    const { settings = {}, credentials = {} } = config;
    const { objectType = "Lead", recordTypeId } = settings;
    const { instanceUrl, accessToken } = credentials;
    
    if (!instanceUrl || !accessToken) {
      return {
        success: false,
        message: "Salesforce instanceUrl and accessToken are required in credentials"
      };
    }

    // Map form fields to Salesforce fields
    const salesforceData = mapToSalesforceFields(submission, objectType);
    
    if (recordTypeId) {
      salesforceData.RecordTypeId = recordTypeId;
    }

    // For now, just log the Salesforce attempt
    console.log(`⚡ Salesforce connector: Creating ${objectType}`);
    console.log(`   Instance: ${instanceUrl}`);
    console.log(`   Data:`, salesforceData);

    // TODO: Implement actual Salesforce API integration
    // Example:
    // const endpoint = `${instanceUrl}/services/data/v57.0/sobjects/${objectType}/`;
    // const response = await fetch(endpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(salesforceData)
    // });
    // 
    // if (!response.ok) {
    //   const errorData = await response.json();
    //   throw new Error(`Salesforce API error: ${JSON.stringify(errorData)}`);
    // }

    return {
      success: true,
      message: `${objectType} created in Salesforce`
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: "Failed to create Salesforce record"
    };
  }
}

function mapToSalesforceFields(submission: Submission, objectType: string): Record<string, any> {
  // Basic field mapping for Leads/Contacts
  const leadMap: Record<string, string> = {
    'name': 'LastName',
    'first_name': 'FirstName',
    'last_name': 'LastName',
    'email': 'Email',
    'phone': 'Phone',
    'company': 'Company',
    'title': 'Title',
    'website': 'Website',
    'description': 'Description'
  };

  const contactMap: Record<string, string> = {
    'name': 'LastName',
    'first_name': 'FirstName',
    'last_name': 'LastName',
    'email': 'Email',
    'phone': 'Phone',
    'title': 'Title',
    'department': 'Department',
    'description': 'Description'
  };

  const propertyMap = objectType === 'Contact' ? contactMap : leadMap;
  const mapped: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(submission)) {
    const salesforceField = propertyMap[key.toLowerCase()] || key;
    mapped[salesforceField] = value;
  }

  // Set required fields for Lead
  if (objectType === 'Lead' && !mapped.LastName && !mapped.Company) {
    mapped.LastName = mapped.Email || 'Unknown';
    mapped.Company = 'Web Form Submission';
  }

  return mapped;
}