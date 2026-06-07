// src/pages/NotFoundPage.tsx [FRONTEND]
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { ROUTES } from '../routes/routes';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4,
    }}>
      <Typography component="h1" variant="h1" color="primary" sx={{ fontSize: { xs: '5rem', md: '8rem' }, fontWeight: 800 }}>
        404
      </Typography>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>Page not found</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button variant="contained" onClick={() => navigate(ROUTES.DASHBOARD)}>
        Back to Dashboard
      </Button>
    </Box>
  );
}