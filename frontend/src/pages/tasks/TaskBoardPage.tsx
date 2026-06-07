import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useDeleteTask, useUpdateTask } from '../../hooks/useTasks';
import { useState } from 'react';

import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';

// React import removed (unused) - using new JSX transform
import { useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
} from '@mui/material';
import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../types/task.types';
import EditTaskModal from '../../components/tasks/EditTaskModal';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';


export default function TaskBoardPage() {
  const { projectId } = useParams();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const { mutate: updateTask } = useUpdateTask(projectId || '', '');

  const { mutate: deleteTask } = useDeleteTask(projectId || '');

  const [open, setOpen] = useState(false);
  
  const { data } = useTasks(projectId || '');
  const tasks = data?.data ?? [];

const handleDragEnd = (result: DropResult) => {
  if (!result.destination) return;

  const { source, destination } = result;

  if (source.droppableId === destination.droppableId) return;

  const status = destination.droppableId as Task['status'];

  updateTask({
    status,
  });
};

  const statuses = ['todo', 'in_progress', 'in_review', 'done'] as const;
  return (
    <Box>
      <Stack direction="row" sx={{ mb: 3, justifyContent: 'space-between' }}>
  <Typography variant="h5" sx={{ fontWeight: 700 }}>
    Task Board
  </Typography>

  <DragDropContext onDragEnd={handleDragEnd}>
    <Droppable droppableId="todo">
      {(provided) => (
        <div {...provided.droppableProps} ref={provided.innerRef}>
          {tasks
            .filter((t) => t.status === 'todo')
            .map((task) => (
              <Draggable key={task._id} draggableId={task._id} index={0}>
                {(provided) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    variant="outlined"
                  >
                    <CardContent>
                      <Typography sx={{ fontWeight: 600 }}>
                        {task.title}
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Draggable>
            ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  </DragDropContext>

  <Button
    variant="contained"
    startIcon={<AddIcon />}
    onClick={() => setOpen(true)}
  >
    New Task
  </Button>
</Stack>

        <CreateTaskModal
          open={open}
          onClose={() => setOpen(false)}
          projectId={projectId || ''}
        />
      <Stack component="div" direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        {statuses.map((status) => (
          <Box key={status} sx={{ width: '25%' }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              {status.toUpperCase()}
            </Typography>

            <Stack spacing={1}>
              {tasks
                .filter((t) => t.status === status)
                .map((task) => (
                  <Card key={task._id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
  <Typography sx={{ fontWeight: 600 }}>
    {task.title}
  </Typography>

  <Stack direction="row">
    <IconButton
      size="small"
      onClick={() => {
        setSelectedTask(task);
        setEditOpen(true);
      }}
    >
      <EditIcon fontSize="small" />
    </IconButton>

    <IconButton
      size="small"
      onClick={() => deleteTask(task._id)}
    >
      <DeleteIcon fontSize="small" />
    </IconButton>
  </Stack>
</Stack>

<EditTaskModal
  open={editOpen}
  onClose={() => setEditOpen(false)}
  projectId={projectId || ''}
  task={selectedTask}
/>



                      <Chip
                        size="small"
                        label={task.status}
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

