// src/pages/ProjectsPage.tsx
import { useState, useCallback } from 'react';
import { useNavigate }           from 'react-router-dom';
import { useForm }               from 'react-hook-form';
import {
  Box, Button, Card, CardActionArea, CardContent, CardActions,
  Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Grid, IconButton, InputAdornment,
  LinearProgress, Menu, MenuItem, OutlinedInput, Skeleton, Stack, TextField,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
  Alert,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import SearchIcon        from '@mui/icons-material/Search';
import MoreVertIcon      from '@mui/icons-material/MoreVert';
import FolderIcon        from '@mui/icons-material/Folder';
import ArchiveIcon       from '@mui/icons-material/Archive';
import DeleteIcon        from '@mui/icons-material/Delete';
import GroupIcon         from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import {
  useProjects,
  useCreateProject,
  useArchiveProject,
  useDeleteProject,
} from '../hooks/useProjects';
import type { Project, ProjectStatus, CreateProjectPayload } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CreateFormValues {
  name:        string;
  description: string;
}

interface ProjectCardMenuState {
  anchor:  HTMLElement;
  project: Project;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function statusColor(status: ProjectStatus): 'success' | 'default' {
  return status === 'active' ? 'success' : 'default';
}

function progressColor(value: number): 'error' | 'warning' | 'info' | 'success' {
  if (value < 25) return 'error';
  if (value < 50) return 'warning';
  if (value < 75) return 'info';
  return 'success';
}

// ---------------------------------------------------------------------------
// ProjectCardSkeleton
// ---------------------------------------------------------------------------
function ProjectCardSkeleton() {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Skeleton variant="text" width="60%" height={28} />
        <Skeleton variant="text" width="90%" sx={{ mt: 1 }} />
        <Skeleton variant="text" width="75%" />
        <Skeleton variant="rectangular" height={6} sx={{ mt: 2, borderRadius: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Skeleton variant="text" width={80} />
          <Skeleton variant="text" width={80} />
        </Box>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10, px: 4, gridColumn: '1 / -1', width: '100%' }}>
      <FolderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
        No projects yet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create your first project to get started
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateClick}>
        New Project
      </Button>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// CreateProjectDialog
// ---------------------------------------------------------------------------
function CreateProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate: createProject, isPending } = useCreateProject();
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<CreateFormValues>({ defaultValues: { name: '', description: '' }, mode: 'onTouched' });

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  const onSubmit = (values: CreateFormValues) => {
    const payload: CreateProjectPayload = {
      name:        values.name,
      description: values.description || undefined,
    };
    createProject(payload, { onSuccess: () => handleClose() });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm"
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>New Project</DialogTitle>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Project name" fullWidth autoFocus disabled={isPending}
              error={Boolean(errors.name)} helperText={errors.name?.message}
              {...register('name', {
                required:  'Project name is required',
                minLength: { value: 2,   message: 'At least 2 characters' },
                maxLength: { value: 120, message: 'Max 120 characters' },
              })}
            />
            <TextField
              label="Description" fullWidth multiline rows={3} disabled={isPending}
              error={Boolean(errors.description)}
              helperText={errors.description?.message ?? 'Optional'}
              {...register('description', {
                maxLength: { value: 1000, message: 'Max 1000 characters' },
              })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isPending} sx={{ minWidth: 120 }}>
            {isPending
              ? <CircularProgress size={18} sx={{ color: 'inherit' }} />
              : 'Create Project'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ConfirmDeleteDialog
// ---------------------------------------------------------------------------
function ConfirmDeleteDialog({
  project, onClose,
}: { project: Project | null; onClose: () => void }) {
  const { mutate: deleteProject, isPending } = useDeleteProject();

  return (
    <Dialog open={Boolean(project)} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete Project</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Are you sure you want to delete <strong>{project?.name}</strong>?
          This cannot be undone and will remove all associated tasks.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button variant="contained" color="error" disabled={isPending}
          sx={{ minWidth: 100 }}
          onClick={() => project && deleteProject(project._id, { onSuccess: onClose })}>
          {isPending ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ProjectCard
// ---------------------------------------------------------------------------
function ProjectCard({
  project, onMenuOpen,
}: {
  project:    Project;
  onMenuOpen: (e: React.MouseEvent<HTMLElement>, p: Project) => void;
}) {
  const navigate = useNavigate();

  return (
    <Card variant="outlined" sx={{
      borderRadius: 3,
      transition: 'box-shadow 0.2s, border-color 0.2s',
      opacity: project.status === 'archived' ? 0.7 : 1,
      '&:hover': { boxShadow: 3, borderColor: 'primary.main' },
    }}>
      <CardActionArea onClick={() => navigate(`/projects/${project._id}`)} sx={{ p: 0 }}>
        <CardContent sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{
              fontWeight: 600,
              fontSize: '1rem', lineHeight: 1.3,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {project.name}
            </Typography>
            <Chip label={project.status} size="small" color={statusColor(project.status)}
              sx={{ flexShrink: 0, textTransform: 'capitalize', fontWeight: 600 }} />
          </Stack>

          {project.description && (
            <Typography variant="body2" color="text.secondary" sx={{
              mt: 1, overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {project.description}
            </Typography>
          )}

          <Box sx={{ mt: 2.5 }}>
            <Stack direction="row" sx={{ mb: 0.5, justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Progress</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>{project.progress}%</Typography>
            </Stack>
            <LinearProgress variant="determinate" value={project.progress}
              color={progressColor(project.progress)}
              sx={{ height: 6, borderRadius: 1 }} />
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: 'center' }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <GroupIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {project.memberCount + 1}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatDate(project.createdAt)}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>

      <Divider />
      <CardActions sx={{ px: 2, py: 0.75, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary" noWrap>
          {project.owner.name}
        </Typography>
        <Tooltip title="More options">
          <IconButton size="small"
            onClick={(e) => { e.stopPropagation(); onMenuOpen(e, project); }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ProjectsPage
// ---------------------------------------------------------------------------
export default function ProjectsPage() {
  const [createOpen,   setCreateOpen]   = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [search,       setSearch]       = useState('');
  const [menuState,    setMenuState]    = useState<ProjectCardMenuState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const { mutate: archiveProject } = useArchiveProject();

  const queryParams = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(search.trim() && { search: search.trim() }),
    limit: 24,
  };

  const { data, isLoading, isError, error } = useProjects(queryParams);
  const projects   = data?.data  ?? [];
  const totalCount = data?.meta?.total ?? 0;

  const handleMenuOpen = useCallback(
    (e: React.MouseEvent<HTMLElement>, project: Project) =>
      setMenuState({ anchor: e.currentTarget, project }),
    []
  );
  const handleMenuClose = useCallback(() => setMenuState(null), []);

  const handleArchive = useCallback(() => {
    if (!menuState) return;
    archiveProject(menuState.project._id);
    handleMenuClose();
  }, [menuState, archiveProject, handleMenuClose]);

  const handleDeleteClick = useCallback(() => {
    if (!menuState) return;
    setDeleteTarget(menuState.project);
    handleMenuClose();
  }, [menuState, handleMenuClose]);

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Projects</Typography>
          {!isLoading && (
            <Typography variant="body2" color="text.secondary">
              {totalCount} project{totalCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
          New Project
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}
        sx={{ mb: 3, alignItems: { sm: 'center' } }}>
        <OutlinedInput
          placeholder="Search projects..." size="small" value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240 }}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          }
        />
        <ToggleButtonGroup value={statusFilter} exclusive size="small"
          onChange={(_e, val) => { if (val !== null) setStatusFilter(val); }}>
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="archived">Archived</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Error */}
      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(error as { response?: { data?: { message?: string } } })
            ?.response?.data?.message ?? 'Failed to load projects'}
        </Alert>
      )}

      {/* Grid */}
      <Grid container spacing={2.5}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                <ProjectCardSkeleton />
              </Grid>
            ))
          : projects.length === 0
            ? <Grid size={{ xs: 12 }}><EmptyState onCreateClick={() => setCreateOpen(true)} /></Grid>
            : projects.map((project) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project._id}>
                  <ProjectCard project={project} onMenuOpen={handleMenuOpen} />
                </Grid>
              ))
        }
      </Grid>

      {/* Context menu */}
      <Menu anchorEl={menuState?.anchor} open={Boolean(menuState)} onClose={handleMenuClose}
        sx={{ '& .MuiPaper-root': { minWidth: 160, borderRadius: 2 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
        <MenuItem onClick={handleArchive}
          disabled={menuState?.project.status === 'archived'} dense>
          <ArchiveIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
          Archive
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteClick} dense sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <ConfirmDeleteDialog project={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </Box>
  );
}