// src/pages/DashboardPage.tsx [FRONTEND]
import { useMemo }       from 'react';
import { useNavigate }   from 'react-router-dom';
import {
  Alert, Avatar, AvatarGroup, Box, Button, Card, CardActionArea,
  CardContent, Chip, Divider, Grid, LinearProgress, Skeleton,
  Stack, Typography, Paper,
} from '@mui/material';
import FolderIcon         from '@mui/icons-material/Folder';
import TaskAltIcon        from '@mui/icons-material/TaskAlt';
import TrendingUpIcon     from '@mui/icons-material/TrendingUp';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import AddIcon            from '@mui/icons-material/Add';
import ArrowForwardIcon   from '@mui/icons-material/ArrowForward';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import { useProjects }    from '../hooks/useProjects';
import { useTaskSummary } from '../hooks/useTasks';
import { useAppSelector } from '../app/hooks';
import { selectCurrentUser } from '../features/auth/store/authSlice';
import type { Project }   from '../types';
import { ROUTES }         from '../routes/AppRoutes';

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

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------
interface StatCardProps {
  label:   string;
  value:   number | string;
  icon:    React.ReactNode;
  color:   string;
  bgColor: string;
  loading?: boolean;
  sub?:    string;
  trend?:  string;
}

function StatCard({ label, value, icon, color, bgColor, loading, sub, trend }: StatCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              width: 52, height: 52, borderRadius: 2.5,
              bgcolor: bgColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color,
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Chip
              label={trend}
              size="small"
              sx={{
                bgcolor: '#f0fdf4', color: '#16a34a',
                fontWeight: 700, fontSize: '0.7rem', height: 22,
              }}
            />
          )}
        </Box>

        {loading ? (
          <>
            <Skeleton variant="text" width={80} height={44} />
            <Skeleton variant="text" width={120} height={20} />
          </>
        ) : (
          <>
            <Typography variant="h3" sx={{ lineHeight: 1.1, mb: 0.5, fontWeight: 800 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {label}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                {sub}
              </Typography>
            )}
          </>
        )}
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
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        border: '1px solid', borderColor: 'divider',
        transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s',
        '&:hover': { boxShadow: 4, borderColor: 'primary.main', transform: 'translateY(-2px)' },
      }}
    >
      <CardActionArea onClick={() => navigate(`/projects/${project._id}`)} sx={{ p: 0 }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* Header */}
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 2 }}>
            <Stack direction="row" sx={{ alignItems: 'center', spacing: 1.5, minWidth: 0 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                bgcolor: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <FolderIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              </Box>
              <Typography variant="subtitle2" sx={{
                fontWeight: 700,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
              }}>
                {project.name}
              </Typography>
            </Stack>
            <Chip
              label={project.status}
              size="small"
              color={project.status === 'active' ? 'success' : 'default'}
              sx={{ flexShrink: 0, textTransform: 'capitalize', fontWeight: 600, fontSize: '0.65rem' }}
            />
          </Stack>

          {/* Progress */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Progress
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color:
                    project.progress >= 75 ? 'success.main' :
                    project.progress >= 50 ? 'info.main' :
                    project.progress >= 25 ? 'warning.main' : 'error.main',
                }}
              >
                {project.progress}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={project.progress}
              color={progressColor(project.progress)}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          {/* Footer */}
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 10, border: '2px solid white' } }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24, fontSize: 10 }}>
                {getInitials(project.owner.name)}
              </Avatar>
              {project.members.slice(0, 2).map((m) => (
                <Avatar key={m.user._id} sx={{ bgcolor: 'secondary.main', width: 24, height: 24, fontSize: 10 }}>
                  {getInitials(m.user.name)}
                </Avatar>
              ))}
            </AvatarGroup>
            <Typography variant="caption" color="text.disabled">
              {formatDate(project.updatedAt)}
            </Typography>
          </Stack>
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

  if (isLoading) return <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 2 }} />;
  if (!summary)  return null;

  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  if (total === 0) return (
    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
      No tasks yet
    </Typography>
  );

  const segments = [
    { key: 'done',        color: '#22c55e', label: 'Done' },
    { key: 'in_review',   color: '#3b82f6', label: 'In Review' },
    { key: 'in_progress', color: '#f59e0b', label: 'In Progress' },
    { key: 'todo',        color: '#94a3b8', label: 'To Do' },
  ] as const;

  return (
    <Stack spacing={1}>
      {/* Stacked bar */}
      <Stack direction="row" sx={{ height: 8, borderRadius: 4, overflow: 'hidden', gap: '2px' }}>
        {segments.map(({ key, color }) => {
          const count = summary[key] ?? 0;
          const pct   = total > 0 ? (count / total) * 100 : 0;
          return pct > 0 ? (
            <Box key={key} sx={{ width: `${pct}%`, bgcolor: color }} />
          ) : null;
        })}
      </Stack>
      {/* Legend */}
      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
        {segments.map(({ key, color, label }) => {
          const count = summary[key] ?? 0;
          return count > 0 ? (
            <Box
              key={key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <FiberManualRecordIcon sx={{ fontSize: 8, color }} />
              <Typography variant="caption" color="text.secondary">
                {label} <strong>{count}</strong>
              </Typography>
            </Box>
          ) : null;
        })}
      </Stack>
    </Stack>
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
    const completed   = projects.filter((p) => p.progress === 100).length;
    return { active, archived, avgProgress, completed };
  }, [projects]);

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>

      {/* ── Hero greeting ─────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          color: 'white',
          p: { xs: 3, md: 4 },
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box sx={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.05)', top: -100, right: -50,
        }} />
        <Box sx={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.05)', bottom: -80, right: 100,
        }} />

        <Stack 
          sx={{
            direction: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
          }}
          spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ letterSpacing: '-0.5px', fontWeight: 800 }}>
              {getGreeting()}, {currentUser?.name?.split(' ')[0] ?? 'there'} 👋
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>
              Here's an overview of your workspace today.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.PROJECTS)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.3)',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            }}
          >
            New Project
          </Button>
        </Stack>
      </Paper>

      {isError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Failed to load dashboard data. Please refresh the page.
        </Alert>
      )}

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Total Projects"
            value={projectsLoading ? '—' : totalProjects}
            icon={<FolderIcon fontSize="medium" />}
            color="#2563eb" bgColor="#eff6ff"
            loading={projectsLoading}
            sub={`${stats.active} active · ${stats.archived} archived`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Active Projects"
            value={projectsLoading ? '—' : stats.active}
            icon={<TrendingUpIcon fontSize="medium" />}
            color="#f59e0b" bgColor="#fffbeb"
            loading={projectsLoading}
            sub="Currently in progress"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Avg. Progress"
            value={projectsLoading ? '—' : `${stats.avgProgress}%`}
            icon={<TaskAltIcon fontSize="medium" />}
            color="#7c3aed" bgColor="#f5f3ff"
            loading={projectsLoading}
            sub="Across all projects"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Completed"
            value={projectsLoading ? '—' : stats.completed}
            icon={<CheckCircleIcon fontSize="medium" />}
            color="#16a34a" bgColor="#f0fdf4"
            loading={projectsLoading}
            sub="Projects at 100%"
            trend={stats.completed > 0 ? `${stats.completed} done` : undefined}
          />
        </Grid>
      </Grid>

      {/* ── Recent projects + Task breakdown ──────────────────────────── */}
      <Grid container spacing={3}>

        {/* Recent projects */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Projects</Typography>
              <Typography variant="caption" color="text.secondary">
                Your most recently updated projects
              </Typography>
            </Box>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(ROUTES.PROJECTS)}
              sx={{ fontWeight: 600 }}
            >
              View all
            </Button>
          </Stack>

          {projectsLoading ? (
            <Grid container spacing={2}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6 }} key={i}>
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                        <Skeleton variant="rounded" width={40} height={40} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="70%" height={20} />
                          <Skeleton variant="text" width="40%" height={16} />
                        </Box>
                      </Stack>
                      <Skeleton variant="rectangular" height={6} sx={{ borderRadius: 3, mb: 1 }} />
                      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                        <Skeleton variant="circular" width={24} height={24} />
                        <Skeleton variant="text" width={80} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : projects.length === 0 ? (
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Box sx={{
                  width: 64, height: 64, borderRadius: 3,
                  bgcolor: '#eff6ff', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                }}>
                  <FolderIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
                  No projects yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first project to get started
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />}
                  onClick={() => navigate(ROUTES.PROJECTS)}>
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {projects.map((project) => (
                <Grid size={{ xs: 12, sm: 6 }} key={project._id}>
                  <RecentProjectCard project={project} />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Task breakdown */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Task Breakdown</Typography>
              <Typography variant="caption" color="text.secondary">
                Status overview per project
              </Typography>
            </Box>
          </Stack>

          <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            {projects.length === 0 ? (
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <TaskAltIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No active projects to show tasks for
                </Typography>
              </CardContent>
            ) : (
              <CardContent sx={{ p: 0 }}>
                <Stack divider={<Divider />}>
                  {projects
                    .filter((p) => p.status === 'active')
                    .slice(0, 5)
                    .map((project) => (
                      <Box
                        key={project._id}
                        sx={{
                          px: 2.5, py: 2,
                          cursor: 'pointer',
                          transition: 'bgcolor 0.15s',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/projects/${project._id}`)}
                      >
                        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{
                            fontWeight: 600,
                            overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                            maxWidth: '70%',
                          }}>
                            {project.name}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatDate(project.updatedAt)}
                          </Typography>
                        </Stack>
                        <TaskSummarySection projectId={project._id} />
                      </Box>
                    ))}
                </Stack>
              </CardContent>
            )}
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}