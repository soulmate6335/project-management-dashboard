import { useMemo } from 'react';
import { Box, Card, CardContent, Typography, LinearProgress,} from '@mui/material';
import  Grid from '@mui/material/Grid';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';

export default function AnalyticsPage() {
  const { data: projectsData } = useProjects({});
  const projects = useMemo(() => projectsData?.data ?? [], [projectsData?.data]);

  const { data: tasksData } = useTasks(projects[0]?._id || '');
  const tasks = useMemo(() => tasksData?.data ?? [], [tasksData?.data]);

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.progress === 100).length;

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;

    return {
      totalProjects,
      completedProjects,
      totalTasks,
      doneTasks,
      inProgress,
    };
  }, [projects, tasks]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
        Analytics
      </Typography>

      <Grid container spacing={2.5}>
        <Grid xs={12} md={3}>
          <Card><CardContent>
            <Typography>Total Projects</Typography>
            <Typography variant="h4">{stats.totalProjects}</Typography>
          </CardContent></Card>
        </Grid>

        <Grid xs={12} md={3}>
          <Card><CardContent>
            <Typography>Completed Projects</Typography>
            <Typography variant="h4">{stats.completedProjects}</Typography>
            <LinearProgress
              variant="determinate"
              value={(stats.completedProjects / (stats.totalProjects || 1)) * 100}
              sx={{ mt: 1 }}
            />
          </CardContent></Card>
        </Grid>

        <Grid xs={12} md={3}>
          <Card><CardContent>
            <Typography>Total Tasks</Typography>
            <Typography variant="h4">{stats.totalTasks}</Typography>
          </CardContent></Card>
        </Grid>

        <Grid xs={12} md={3}>
          <Card><CardContent>
            <Typography>Done Tasks</Typography>
            <Typography variant="h4">{stats.doneTasks}</Typography>
          </CardContent></Card>
        </Grid>

        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 600, mb: 2 }}>
                Task Breakdown
              </Typography>

              <Typography>In Progress: {stats.inProgress}</Typography>
              <Typography>Completed: {stats.doneTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}