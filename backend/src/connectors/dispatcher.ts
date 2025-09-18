import { ConnectorConfig, Submission, ConnectorResult } from "./types";

export async function dispatchToConnectors(
  submission: Submission,
  connectors: ConnectorConfig[]
): Promise<ConnectorResult[]> {
  const results: ConnectorResult[] = [];

  for (const config of connectors) {
    try {
      const connectorModule = await import(`./${config.type}.js`);
      const result = await connectorModule.send(submission, config);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        error,
        message: `Failed for ${config.type}`,
      });
    }
  }

  return results;
}