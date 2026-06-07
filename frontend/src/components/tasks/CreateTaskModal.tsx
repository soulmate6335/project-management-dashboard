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
import { useState } from 'react';
import { useCreateTask } from '../../hooks/useTasks';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
}

export default function CreateTaskModal({ open, onClose, projectId }: Props) {
  const { mutate, isPending } = useCreateTask(projectId);

  type Status = 'todo' | 'in_progress' | 'in_review' | 'done';

  interface FormState {
    title: string;
    description: string;
    status: Status;
  }

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    status: 'todo',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    mutate({ ...form }, {
      onSuccess: () => {
        setForm({ title: '', description: '', status: 'todo' });
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Task</DialogTitle>

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
          disabled={isPending || !form.title}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}