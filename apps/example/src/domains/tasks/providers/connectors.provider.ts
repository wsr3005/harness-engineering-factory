export interface ConnectorProvider {
  notifyTaskChanged(taskId: string): Promise<void>;
}

export class StubConnectorProvider implements ConnectorProvider {
  async notifyTaskChanged(_taskId: string): Promise<void> {
    return;
  }
}
