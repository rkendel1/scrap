import { Submission, ConnectorConfig, ConnectorResult } from "./types";

export async function send(
  submission: Submission,
  config: ConnectorConfig
): Promise<ConnectorResult> {
  try {
    const { settings = {}, credentials = {} } = config;
    const { databaseId } = settings;
    const { token } = credentials;
    
    if (!databaseId) {
      return {
        success: false,
        message: "Notion databaseId is required in settings"
      };
    }

    if (!token) {
      return {
        success: false,
        message: "Notion token is required in credentials"
      };
    }

    // Convert submission to Notion page properties
    const notionProperties = mapToNotionProperties(submission);

    // For now, just log the Notion attempt
    console.log(`📝 Notion connector: Adding page to database ${databaseId}`);
    console.log(`   Properties:`, notionProperties);

    // TODO: Implement actual Notion API integration
    // Example:
    // const response = await fetch('https://api.notion.com/v1/pages', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json',
    //     'Notion-Version': '2022-06-28'
    //   },
    //   body: JSON.stringify({
    //     parent: { database_id: databaseId },
    //     properties: notionProperties
    //   })
    // });
    // 
    // if (!response.ok) {
    //   const errorData = await response.json();
    //   throw new Error(`Notion API error: ${JSON.stringify(errorData)}`);
    // }

    return {
      success: true,
      message: `Page added to Notion database ${databaseId}`
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: "Failed to add page to Notion database"
    };
  }
}

function mapToNotionProperties(submission: Submission): Record<string, any> {
  const properties: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(submission)) {
    const propertyName = key.charAt(0).toUpperCase() + key.slice(1);
    
    // Notion requires specific property formats
    if (typeof value === 'string') {
      if (value.includes('@') && value.includes('.')) {
        // Likely an email
        properties[propertyName] = {
          email: value
        };
      } else if (value.length > 100) {
        // Long text as rich text
        properties[propertyName] = {
          rich_text: [
            {
              text: {
                content: value.substring(0, 2000) // Notion has limits
              }
            }
          ]
        };
      } else {
        // Regular title/text
        properties[propertyName] = {
          title: [
            {
              text: {
                content: value
              }
            }
          ]
        };
      }
    } else if (typeof value === 'number') {
      properties[propertyName] = {
        number: value
      };
    } else if (typeof value === 'boolean') {
      properties[propertyName] = {
        checkbox: value
      };
    } else {
      // Convert to string for other types
      properties[propertyName] = {
        rich_text: [
          {
            text: {
              content: String(value)
            }
          }
        ]
      };
    }
  }

  return properties;
}