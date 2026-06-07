// src/pages/DashboardPage.tsx [FRONTEND]
import { useMemo }       from 'react';
import { useNavigate }   from 'react-router-dom';
import {
  Alert, Avatar, AvatarGroup, Box, Button, Card, CardActionArea,
  CardContent, Chip, Divider, Grid, LinearProgress, Skeleton,
  Stack, Typography,
} from '@mui/material';
import FolderIcon         from '@mui/icons-material/Folder';
import TaskAltIcon        from '@mui/icons-material/TaskAlt';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TrendingUpIcon     from '@mui/icons-material/TrendingUp';
import AddIcon            from '@mui/icons-material/Add';
import ArrowForwardIcon   from '@mui/icons-material/ArrowForward';

import { useProjects }    from '../hooks/useProjects';
import { useTaskSummary } from '../hooks/useTasks';
import { useAppSelector } from '../app/hooks';
import { selectCurrentUser } from '../features/auth/store/authSlice';
import type { Project }   from '../types';
import { ROUTES }         from '../routes/AppRoutes'; // ✅ fixed import

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function progressColor(value: number): 'error' | 'warning' | 'info' | 'success' {
  if (value < 25) return 'error';
  if (value < 50) return 'warning';
  if (value < 75) return 'info';
  return 'success';
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------
interface StatCardProps {
  label:    string;
  value:    number | string;
  icon:     React.ReactNode;
  color:    string;
  loading?: boolean;
  sub?:     string;
}

function StatCard({ label, value, icon, color, loading, sub }: StatCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {label}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={60} height={40} />
            ) : (
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1 }}>
                {value}
              </Typography>
            )}
            {sub && !loading && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {sub}
              </Typography>
            )}
          </Box>
          <Box sx={{
            width: 48, height: 48, borderRadius: 2,
            bgcolor: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// RecentProjectCard
// ---------------------------------------------------------------------------
function RecentProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();

  return (
    <Card variant="outlined" sx={{
      borderRadius: 2,
      transition: 'box-shadow 0.2s, border-color 0.2s',
      '&:hover': { boxShadow: 2, borderColor: 'primary.main' },
    }}>
      <CardActionArea onClick={() => navigate(`/projects/${project._id}`)}>
        <CardContent>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1,
            mb: 1.5,
          }}>
            <Typography variant="subtitle2" sx={{
              fontWeight: 600,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
            }}>
              {project.name}
            </Typography>
            <Chip
              label={project.status}
              size="small"
              color={project.status === 'active' ? 'success' : 'default'}
              sx={{ flexShrink: 0, textTransform: 'capitalize', fontWeight: 600, fontSize: '0.7rem' }}
            />
          </Box>

          <Stack direction="row" sx={{ mb: 0.5, justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">Progress</Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>{project.progress}%</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={project.progress}
            color={progressColor(project.progress)}
            sx={{ height: 5, borderRadius: 1, mb: 1.5 }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* ✅ Fixed: MuiAvatar.root → MuiAvatar-root */}
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: 10 } }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {project.owner.name[0]?.toUpperCase()}
              </Avatar>
              {project.members.slice(0, 2).map((m) => (
                <Avatar key={m.user._id} sx={{ bgcolor: 'secondary.main' }}>
                  {m.user.name[0]?.toUpperCase()}
                </Avatar>
              ))}
            </AvatarGroup>
            <Typography variant="caption" color="text.secondary">
              {formatDate(project.updatedAt)}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// TaskSummarySection
// ---------------------------------------------------------------------------
function TaskSummarySection({ projectId }: { projectId: string }) {
  const { data: summary, isLoading } = useTaskSummary(projectId);

  if (isLoading) return <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />;
  if (!summary)  return null;

  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  if (total === 0) return (
    <Typography variant="caption" color="text.secondary">No tasks yet</Typography>
  );

  const segments = [
    { key: 'done',        color: '#22c55e', label: 'Done' },
    { key: 'in_review',   color: '#3b82f6', label: 'In Review' },
    { key: 'in_progress', color: '#f59e0b', label: 'In Progress' },
    { key: 'todo',        color: '#e2e8f0', label: 'To Do' },
  ] as const;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', height: 8, borderRadius: 1, overflow: 'hidden', gap: '2px' }}>
        {segments.map(({ key, color }) => {
          const count = summary[key] ?? 0;
          const pct   = total > 0 ? (count / total) * 100 : 0;
          return pct > 0 ? (
            <Box key={key} sx={{ width: `${pct}%`, bgcolor: color, borderRadius: 0.5 }} />
          ) : null;
        })}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1.5 }}>
        {segments.map(({ key, color, label }) => {
          const count = summary[key] ?? 0;
          return count > 0 ? (
            <Box key={key} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.4 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
              <Typography variant="caption" color="text.secondary">
                {label} ({count})
              </Typography>
            </Box>
          ) : null;
        })}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// DashboardPage
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const navigate    = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);

  const { data: projectsData, isLoading: projectsLoading, isError } =
    useProjects({ limit: 6, sortBy: 'updatedAt', sortDir: 'desc' });

  const projects      = useMemo(() => projectsData?.data  ?? [], [projectsData]);
  const totalProjects = projectsData?.meta?.total ?? 0;

  const stats = useMemo(() => {
    const active      = projects.filter((p) => p.status === 'active').length;
    const archived    = projects.filter((p) => p.status === 'archived').length;
    const avgProgress = projects.length
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
      : 0;
    return { active, archived, avgProgress };
  }, [projects]);

  return (
    <Box>
      {/* Greeting */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {getGreeting()}, {currentUser?.name?.split(' ')[0] ?? 'there'} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Here's what's happening across your projects today.
        </Typography>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load dashboard data. Please refresh the page.
        </Alert>
      )}

      {/* Stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Projects" value={totalProjects}
            icon={<FolderIcon />} color="#2563eb"
            loading={projectsLoading} sub={`${stats.active} active`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Active Projects" value={stats.active}
            icon={<PendingActionsIcon />} color="#f59e0b"
            loading={projectsLoading} sub={`${stats.archived} archived`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Avg. Progress" value={`${stats.avgProgress}%`}
            icon={<TrendingUpIcon />} color="#7c3aed"
            loading={projectsLoading} sub="across all projects"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Completed" value={projects.filter((p) => p.progress === 100).length}
            icon={<TaskAltIcon />} color="#22c55e"
            loading={projectsLoading} sub="projects at 100%"
          />
        </Grid>
      </Grid>

      {/* Recent projects */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Recent Projects
        </Typography>
        <Button size="small" endIcon={<ArrowForwardIcon />}
          onClick={() => navigate(ROUTES.PROJECTS)}>
          View all
        </Button>
      </Box>

      {projectsLoading ? (
        <Grid container spacing={2.5}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Skeleton variant="text" width="70%" height={24} />
                  <Skeleton variant="rectangular" height={5} sx={{ mt: 2, borderRadius: 1 }} />
                  <Stack direction="row" sx={{ mt: 2, justifyContent: 'space-between' }}>
                    <Skeleton variant="circular" width={22} height={22} />
                    <Skeleton variant="text" width={80} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : projects.length === 0 ? (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <FolderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
              No projects yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Create your first project to see it here
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />}
              onClick={() => navigate(ROUTES.PROJECTS)}>
              Go to Projects
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {projects.map((project) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project._id}>
              <RecentProjectCard project={project} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Task breakdown */}
      {projects.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Task Breakdown
          </Typography>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={2.5} divider={<Divider />}>
                {projects
                  .filter((p) => p.status === 'active')
                  .slice(0, 4)
                  .map((project) => (
                    <Box key={project._id}>
                      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{
                          fontWeight: 600, cursor: 'pointer',
                          '&:hover': { color: 'primary.main' },
                        }}
                          onClick={() => navigate(`/projects/${project._id}`)}>
                          {project.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(project.updatedAt)}
                        </Typography>
                      </Stack>
                      <TaskSummarySection projectId={project._id} />
                    </Box>
                  ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}