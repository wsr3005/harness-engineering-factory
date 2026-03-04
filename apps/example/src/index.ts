import { createApp } from './app-wiring.js';
import { createLogger } from './utils/index.js';

const logger = createLogger({ service: '@harness/example' });

export const start = (): ReturnType<typeof createApp> => {
  const app = createApp();
  logger.info('example app started', {
    domain: 'tasks',
    defaultPageSize: app.tasks.config.pageSize,
  });
  return app;
};

start();
