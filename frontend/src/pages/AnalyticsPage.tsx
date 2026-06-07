import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { useParams } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';

export default function AnalyticsPage() {
  const { projectId } = useParams();
  const { data } = useAnalytics(projectId || '');

  type AnalyticsItem = {
    name: string;
    value: number;
  };

  const analytics: {
    tasksByStatus: AnalyticsItem[];
    tasksByPriority: AnalyticsItem[];
  } = data || {
    tasksByStatus: [],
    tasksByPriority: [],
  };

  const COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'];

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
        Project Analytics
      </Typography>

      <Grid container spacing={2}>
        {/* TASK STATUS PIE CHART */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography component="div" sx={{ mb: 2, fontWeight: 600 }}>
                Tasks by Status
              </Typography>

              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.tasksByStatus}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                  >
                    {analytics.tasksByStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* PRIORITY BAR CHART */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography component="div" sx={{ mb: 2, fontWeight: 600 }}>
                Tasks by Priority
              </Typography>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.tasksByPriority}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}