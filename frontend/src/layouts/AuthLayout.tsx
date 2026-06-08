// src/layouts/AuthLayout.tsx
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useAppSelector } from '../app/hooks';
import { selectIsAuthenticated } from '../features/auth/store/authSlice';
import { ROUTES } from '../routes/routes';

export default function AuthLayout() {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.DASHBOARD, { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>

      {/* ── Branding panel (desktop only) ───────────────────────────────── */}
      {!isMobile && (
        <Box
          sx={{
            width: { md: '45%', lg: '50%' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: (t) =>
              `linear-gradient(135deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 60%, ${t.palette.secondary.main} 100%)`,
            p: 6,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)', top: -100, left: -100 }} />
          <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)', bottom: -80, right: -80 }} />

          <Box sx={{ position: 'relative', textAlign: 'center', color: 'white' }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 3, fontSize: 28,
            }}>
              📋
            </Box>

            <Typography variant="h3" gutterBottom sx={{ fontWeight: 600, letterSpacing: '-0.5px' }}>
              YOUR PROJECT MANAGEMENT HUB
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 320, mx: 'auto', lineHeight: 1.7 }}>
              Manage projects, collaborate in real time, and ship faster — all in one place.
            </Typography>

            <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                '✦  Real-time collaboration',
                '✦  Task & project tracking',
                '✦  Analytics dashboard',
              ].map((feat) => (
                <Typography key={feat} variant="body2" sx={{
                  opacity: 0.75,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  px: 2,
                  py: 0.75,
                }}>
                  {feat}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Form panel ──────────────────────────────────────────────────── */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
      }}>
        <Paper elevation={0} sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}>
          {isMobile && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>📋 YOUR PROJECT MANAGEMENT HUB</Typography>
            </Box>
          )}
          <Outlet />
        </Paper>
      </Box>

    </Box>
  );
}