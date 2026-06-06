// src/modules/tasks/task.service.ts
import { Types, SortOrder } from 'mongoose';
import Task, { ITask }      from './task.model';
import Project              from '../../models/Project.model';
import { ApiError }         from '../../utils/ApiError';
import type {       
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
  ReorderTasksInput,
} from './task.validation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const USER_SELECT = 'name email avatar';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toObjectId(id: string, label = 'ID'): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest(`Invalid ${label}: "${id}"`);
  }
  return new Types.ObjectId(id);
}

/**
 * Confirm the project exists and the requesting user is either the owner
 * or a member. Returns the project document.
 */
async function assertProjectAccess(
  projectId: string,
  userId: string
): Promise<void> {
  const project = await Project.findById(projectId).lean();

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  const isOwner  = project.owner.toString() === userId;
  const isMember = project.members.some(
    (m) => m.user.toString() === userId
  );

  if (!isOwner && !isMember) {
    throw ApiError.forbidden('You do not have access to this project');
  }
}

/**
 * Fetch a single task, verify it belongs to the given project.
 * Throws 404 if not found, 400 if it belongs to a different project.
 */
async function getTaskInProject(
  taskId: string,
  projectId: string
): Promise<ITask> {
  const task = await Task.findById(taskId)
    .populate('assignee', USER_SELECT)
    .populate('reporter', USER_SELECT);

  if (!task) throw ApiError.notFound('Task not found');

  if (task.project.toString() !== projectId) {
    throw ApiError.badRequest('Task does not belong to this project');
  }

  return task;
}

// ---------------------------------------------------------------------------
// Service methods
// ---------------------------------------------------------------------------

async function create(
  projectId: string,
  data: CreateTaskInput,
  reporterId: string
): Promise<ITask> {
  await assertProjectAccess(projectId, reporterId);

  const task = await Task.create({
    project:     toObjectId(projectId, 'projectId'),
    reporter:    toObjectId(reporterId, 'reporterId'),
    title:       data.title,
    description: data.description,
    status:      data.status   ?? 'todo',
    priority:    data.priority ?? 'medium',
    assignee:    data.assignee ? toObjectId(data.assignee, 'assignee') : undefined,
    dueDate:     data.dueDate  ? new Date(data.dueDate) : undefined,
    tags:        data.tags     ?? [],
    order:       data.order    ?? 0,
  });

  return task.populate([
    { path: 'assignee', select: USER_SELECT },
    { path: 'reporter', select: USER_SELECT },
  ]);
}

interface PaginatedTasks {
  tasks:      ITask[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

async function list(
  projectId: string,
  userId: string,
  query: ListTasksQuery
): Promise<PaginatedTasks> {
  await assertProjectAccess(projectId, userId);

  const { status, priority, assignee, search, page, limit, sortBy, sortDir } = query;

  const filter: Record<string, unknown> = {
    project: toObjectId(projectId, 'projectId'),
  };

  if (status)   filter['status']   = status;
  if (priority) filter['priority'] = priority;
  if (assignee) filter['assignee'] = toObjectId(assignee, 'assignee');
  if (search)   filter['$text']    = { $search: search };

  const sortOrder: SortOrder = sortDir === 'desc' ? -1 : 1;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignee', USER_SELECT)
      .populate('reporter', USER_SELECT)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter),
  ]);

  return {
    tasks: tasks as unknown as ITask[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async function getById(
  taskId: string,
  projectId: string,
  userId: string
): Promise<ITask> {
  await assertProjectAccess(projectId, userId);
  return getTaskInProject(taskId, projectId);
}

async function update(
  taskId: string,
  projectId: string,
  data: UpdateTaskInput,
  userId: string
): Promise<ITask> {
  await assertProjectAccess(projectId, userId);
  const task = await getTaskInProject(taskId, projectId);

  if (data.title       !== undefined) task.title       = data.title;
  if (data.description !== undefined) task.description = data.description;
  if (data.status      !== undefined) task.status      = data.status;
  if (data.priority    !== undefined) task.priority    = data.priority;
  if (data.order       !== undefined) task.order       = data.order;
  if (data.tags        !== undefined) task.tags        = data.tags ?? [];

  // null = explicit unassign; undefined = no change
  if (data.assignee !== undefined) {
    task.assignee = data.assignee
      ? toObjectId(data.assignee, 'assignee')
      : undefined;
  }

  // null = clear due date; undefined = no change
  if (data.dueDate !== undefined) {
    task.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
  }

  await task.save(); // triggers pre-save hook for completedAt

  return task.populate([
    { path: 'assignee', select: USER_SELECT },
    { path: 'reporter', select: USER_SELECT },
  ]);
}

async function remove(
  taskId: string,
  projectId: string,
  userId: string
): Promise<void> {
  await assertProjectAccess(projectId, userId);
  const task = await getTaskInProject(taskId, projectId);
  await Task.findByIdAndDelete(task._id);
}

/**
 * Bulk-update `order` field for a list of tasks.
 * Used after drag-and-drop reordering on the frontend board.
 * Runs as a series of updateOne calls — fast enough for typical board sizes
 * (< 200 tasks per column). For very large boards, switch to a bulkWrite.
 */
async function reorder(
  projectId: string,
  data: ReorderTasksInput,
  userId: string
): Promise<void> {
  await assertProjectAccess(projectId, userId);

  const projectObjectId = toObjectId(projectId, 'projectId');

  await Promise.all(
    data.tasks.map(({ id, order }) =>
      Task.updateOne(
        { _id: toObjectId(id, 'taskId'), project: projectObjectId },
        { $set: { order } }
      )
    )
  );
}

/**
 * Returns a summary grouped by status — used by the analytics endpoint
 * and optionally by the project detail page for a quick stat block.
 */
async function getStatusSummary(
  projectId: string,
  userId: string
): Promise<Record<string, number>> {
  await assertProjectAccess(projectId, userId);

  const results = await Task.aggregate<{ _id: string; count: number }>([
    { $match: { project: toObjectId(projectId, 'projectId') } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const base: Record<string, number> = {
    todo: 0, in_progress: 0, in_review: 0, done: 0,
  };

  return results.reduce<Record<string, number>>((acc: Record<string, number>, { _id, count }: { _id: string; count: number }) => {
    acc[_id] = count;
    return acc;
  }, base);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
const taskService = {
  create,
  list,
  getById,
  update,
  remove,
  reorder,
  getStatusSummary,
};

export default taskService;