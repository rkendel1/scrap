import { ConnectorConfig, Submission, ConnectorResult } from "./types";

export async function dispatchToConnectors(
  submission: Submission,
  connectors: ConnectorConfig[]
): Promise<ConnectorResult[]> {
  const results: ConnectorResult[] = [];

  for (const config of connectors) {
    try {
      let result: ConnectorResult;
      
      // Handle n8n connector specially
      if (config.type === 'n8n') {
        const { n8nConnector } = await import('./n8n');
        result = await n8nConnector.send(submission, config as any);
      } else {
        // Handle other connectors with existing pattern
        const connectorModule = await import(`./${config.type}.js`);
        result = await connectorModule.send(submission, config);
      }
      
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        error,
        message: `Failed for ${config.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  return results;
}