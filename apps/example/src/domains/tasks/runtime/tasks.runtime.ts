import { createTasksConfig } from '../config/index.js';
import { InMemoryTaskRepository } from '../repo/index.js';
import { TaskService } from '../service/index.js';

export const createTasksRuntime = () => {
  const config = createTasksConfig();
  const repo = new InMemoryTaskRepository(config);
  const service = new TaskService({ repo, config });

  return {
    config,
    repo,
    service,
  };
};
