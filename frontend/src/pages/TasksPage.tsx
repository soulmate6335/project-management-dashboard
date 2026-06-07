// src/pages/TasksPage.tsx [FRONTEND]
import { useState, useCallback, useMemo } from 'react';
import { useParams }             from 'react-router-dom';
import { useForm }               from 'react-hook-form';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  IconButton, MenuItem, Skeleton, Stack, TextField,
  Tooltip, Typography,
} from '@mui/material';
import AddIcon      from '@mui/icons-material/Add';
import DeleteIcon   from '@mui/icons-material/Delete';
import EditIcon     from '@mui/icons-material/Edit';
import FlagIcon     from '@mui/icons-material/Flag';

import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { useProject } from '../hooks/useProjects';
import type { Task, TaskStatus, TaskPriority, CreateTaskPayload, UpdateTaskPayload } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'todo',        label: 'To Do',       color: '#64748b' },
  { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'in_review',   label: 'In Review',   color: '#3b82f6' },
  { key: 'done',        label: 'Done',        color: '#22c55e' },
];

const PRIORITY_COLORS: Record<TaskPriority, 'default' | 'warning' | 'error' | 'info'> = {
  low:      'default',
  medium:   'info',
  high:     'warning',
  critical: 'error',
};

// ---------------------------------------------------------------------------
// CreateTaskDialog
// ---------------------------------------------------------------------------
interface CreateTaskDialogProps {
  open:       boolean;
  onClose:    () => void;
  projectId:  string;
  defaultStatus?: TaskStatus;
}

function CreateTaskDialog({ open, onClose, projectId, defaultStatus = 'todo' }: CreateTaskDialogProps) {
  const { mutate: createTask, isPending } = useCreateTask(projectId);
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<{ title: string; description: string; priority: TaskPriority }>({
      defaultValues: { title: '', description: '', priority: 'medium' },
      mode: 'onTouched',
    });

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = (values: { title: string; description: string; priority: TaskPriority }) => {
    const payload: CreateTaskPayload = {
      title:       values.title,
      description: values.description || undefined,
      priority:    values.priority,
      status:      defaultStatus,
    };
    createTask(payload, { onSuccess: handleClose });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>New Task</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2.5}>
            <TextField label="Task title" fullWidth autoFocus disabled={isPending}
              error={Boolean(errors.title)} helperText={errors.title?.message}
              {...register('title', {
                required:  'Title is required',
                minLength: { value: 2, message: 'At least 2 characters' },
              })}
            />
            <TextField label="Description" fullWidth multiline rows={3} disabled={isPending}
              {...register('description')} />
            <TextField select label="Priority" defaultValue="medium"
              disabled={isPending} {...register('priority')}>
              {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
                <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isPending} sx={{ minWidth: 110 }}>
            {isPending ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : 'Create Task'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TaskCard
// ---------------------------------------------------------------------------
interface TaskCardProps {
  task:      Task;
  projectId: string;
  onEdit:    (task: Task) => void;
}

function TaskCard({ task, projectId, onEdit }: TaskCardProps) {
  const { mutate: deleteTask } = useDeleteTask(projectId);

  return (
    <Card variant="outlined" sx={{
      borderRadius: 2, cursor: 'grab',
      transition: 'box-shadow 0.15s',
      '&:hover': { boxShadow: 3 },
    }}>
      <CardContent sx={{ p: '12px !important' }}>
        <Typography variant="body2" sx={{
          fontWeight: 600, mb: 1, overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {task.title}
        </Typography>

        {task.description && (
          <Typography variant="caption" color="text.secondary" sx={{
            mb: 1, display: '-webkit-box', overflow: 'hidden',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {task.description}
          </Typography>
        )}

        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              label={task.priority}
              size="small"
              color={PRIORITY_COLORS[task.priority]}
              icon={<FlagIcon style={{ fontSize: 12 }} />}
              sx={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.65rem', height: 20 }}
            />
            {task.isOverdue && (
              <Chip label="Overdue" size="small" color="error"
                sx={{ fontSize: '0.65rem', height: 20 }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(task)}>
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => deleteTask(task._id)}
                sx={{ color: 'error.main' }}>
                <DeleteIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {task.assignee && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Assigned: {task.assignee.name}
          </Typography>
        )}

        {task.dueDate && (
          <Typography variant="caption"
            color={task.isOverdue ? 'error.main' : 'text.secondary'}
            sx={{ display: 'block' }}>
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// EditTaskDialog
// ---------------------------------------------------------------------------
interface EditTaskDialogProps {
  task:      Task | null;
  projectId: string;
  onClose:   () => void;
}

function EditTaskDialog({ task, projectId, onClose }: EditTaskDialogProps) {
  const { mutate: updateTask, isPending } = useUpdateTask(projectId, task?._id ?? '');
  const { register, handleSubmit, formState: { errors } } =
    useForm<{ title: string; description: string; priority: TaskPriority; status: TaskStatus }>({
      values: {
        title:       task?.title ?? '',
        description: task?.description ?? '',
        priority:    task?.priority ?? 'medium',
        status:      task?.status  ?? 'todo',
      },
    });

  const onSubmit = (values: UpdateTaskPayload) => {
    updateTask(values, { onSuccess: onClose });
  };

  return (
    <Dialog open={Boolean(task)} onClose={onClose} fullWidth maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Edit Task</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2.5}>
            <TextField label="Title" fullWidth disabled={isPending}
              error={Boolean(errors.title)} helperText={errors.title?.message}
              {...register('title', { required: 'Title is required' })} />
            <TextField label="Description" fullWidth multiline rows={3}
              disabled={isPending} {...register('description')} />
            <TextField select label="Status" disabled={isPending} {...register('status')}
              defaultValue={task?.status ?? 'todo'}>
              {COLUMNS.map((c) => (
                <MenuItem key={c.key} value={c.key}>{c.label}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Priority" disabled={isPending} {...register('priority')}
              defaultValue={task?.priority ?? 'medium'}>
              {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
                <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isPending} sx={{ minWidth: 100 }}>
            {isPending ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : 'Save'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// KanbanColumn
// ---------------------------------------------------------------------------
interface KanbanColumnProps {
  status:    TaskStatus;
  label:     string;
  color:     string;
  tasks:     Task[];
  loading:   boolean;
  projectId: string;
  onAddClick: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

function KanbanColumn({
  status, label, color, tasks, loading, projectId, onAddClick, onEditTask,
}: KanbanColumnProps) {
  return (
    <Box sx={{
      minWidth: 260, maxWidth: 300, flex: '1 1 260px',
      bgcolor: 'action.hover', borderRadius: 3, p: 1.5,
      display: 'flex', flexDirection: 'column', gap: 1,
    }}>
      {/* Column header */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', px: 0.5, mb: 0.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{label}</Typography>
          <Chip label={tasks.length} size="small"
            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
        </Stack>
        <Tooltip title={`Add task to ${label}`}>
          <IconButton size="small" onClick={() => onAddClick(status)}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Task cards */}
      <Stack spacing={1} sx={{ flex: 1, minHeight: 100 }}>
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
            ))
          : tasks.map((task) => (
              <TaskCard key={task._id} task={task} projectId={projectId} onEdit={onEditTask} />
            ))
        }
        {!loading && tasks.length === 0 && (
          <Box sx={{
            border: '2px dashed', borderColor: 'divider',
            borderRadius: 2, p: 2, textAlign: 'center',
          }}>
            <Typography variant="caption" color="text.secondary">No tasks</Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// TasksPage
// ---------------------------------------------------------------------------
export default function TasksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const pid = projectId ?? '';

  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null);
  const [editTask,     setEditTask]     = useState<Task | null>(null);

  const { data: projectData } = useProject(pid);
  const { data, isLoading, isError } = useTasks(pid, { limit: 100, sortBy: 'order' });

  const tasks = useMemo(() => data?.data ?? [], [data]);

  const tasksByStatus = useCallback((status: TaskStatus) =>
    tasks.filter((t) => t.status === status), [tasks]);

  if (!pid) {
    return (
      <Alert severity="warning">
        No project selected. Go to Projects and open a project first.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {projectData?.name ?? 'Tasks'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => setCreateStatus('todo')}>
          New Task
        </Button>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>Failed to load tasks</Alert>
      )}

      {/* Kanban board */}
      <Box sx={{
        display: 'flex', gap: 2, overflowX: 'auto',
        pb: 2, alignItems: 'flex-start',
      }}>
        {COLUMNS.map(({ key, label, color }) => (
          <KanbanColumn
            key={key}
            status={key}
            label={label}
            color={color}
            tasks={tasksByStatus(key)}
            loading={isLoading}
            projectId={pid}
            onAddClick={(s) => setCreateStatus(s)}
            onEditTask={(t) => setEditTask(t)}
          />
        ))}
      </Box>

      {/* Dialogs */}
      <CreateTaskDialog
        open={Boolean(createStatus)}
        onClose={() => setCreateStatus(null)}
        projectId={pid}
        defaultStatus={createStatus ?? 'todo'}
      />
      <EditTaskDialog
        task={editTask}
        projectId={pid}
        onClose={() => setEditTask(null)}
      />
    </Box>
  );
}