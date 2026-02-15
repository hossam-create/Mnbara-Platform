// Task Routes
import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { SchedulerService } from '../services/scheduler.service';

export function createTaskRoutes(schedulerService: SchedulerService): Router {
  const router = Router();
  const controller = new TaskController(schedulerService);

  // Task CRUD
  router.post('/', controller.createTask.bind(controller));
  router.get('/', controller.getAllTasks.bind(controller));
  router.get('/:id', controller.getTask.bind(controller));
  router.put('/:id', controller.updateTask.bind(controller));
  router.delete('/:id', controller.deleteTask.bind(controller));

  // Task execution
  router.post('/:id/run', controller.runTask.bind(controller));
  router.get('/:id/executions', controller.getTaskExecutions.bind(controller));

  // Execution details
  router.get('/executions/:executionId', controller.getExecution.bind(controller));

  return router;
}
