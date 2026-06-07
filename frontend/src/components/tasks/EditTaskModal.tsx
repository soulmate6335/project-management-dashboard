import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useUpdateTask } from '../../hooks/useTasks';
import type { Task } from '../../types/task.types';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task: Task | null;
}

export default function EditTaskModal({
  open,
  onClose,
  projectId,
  task,
}: Props) {
  const { mutate, isPending } = useUpdateTask(projectId, task?._id || '');

  const [form, setForm] = useState(() => ({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
  }));

  useEffect(() => {
    if (task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
      });
    }
  }, [task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    mutate(form, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Task</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
          />

          <TextField
            select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="todo">Todo</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="in_review">In Review</MenuItem>
            <MenuItem value="done">Done</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}