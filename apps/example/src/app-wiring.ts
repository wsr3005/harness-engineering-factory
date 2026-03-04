import { createTasksRuntime } from './domains/tasks/runtime/index.js';
import {
  handleCreateTask,
  handleDeleteTask,
  handleGetTask,
  handleListTasks,
  handleUpdateTask,
} from './domains/tasks/ui/index.js';

export const createApp = () => {
  const tasks = createTasksRuntime();

  return {
    tasks: {
      ...tasks,
      handlers: {
        create: (input: unknown) => handleCreateTask(tasks.service, input),
        get: (input: unknown) => handleGetTask(tasks.service, input),
        list: (input: unknown) => handleListTasks(tasks.service, input),
        update: (input: unknown) => handleUpdateTask(tasks.service, input),
        delete: (input: unknown) => handleDeleteTask(tasks.service, input),
      },
    },
  };
};
