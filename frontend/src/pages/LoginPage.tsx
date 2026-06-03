// src/pages/LoginPage.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
  Alert,
  Collapse,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  loginUser,
  clearError,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from '../features/auth/store/authSlice';
import { ROUTES } from '../routes/routes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LoginFormValues {
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading       = useAppSelector(selectAuthLoading);
  const authError       = useAppSelector(selectAuthError);

  const [showPassword, setShowPassword] = useState(false);

  // Where to send the user after a successful login.
  // ProtectedRoute stores the blocked destination in location.state.from.
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    ROUTES.DASHBOARD;

  // ── React Hook Form ──────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  // ── Side effects ─────────────────────────────────────────────────────────

  // Clear any stale auth error when the component mounts.
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Navigate away once the store confirms authentication.
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  // ── Submit ───────────────────────────────────────────────────────────────
  const onSubmit = (values: LoginFormValues) => {
    dispatch(loginUser(values));
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box component="section">

      {/* Heading */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 700, letterSpacing: '-0.5px', color: 'text.primary' }}
        >
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to your account to continue
        </Typography>
      </Box>

      {/* Server-side error banner */}
      <Collapse in={Boolean(authError && isSubmitted)}>
        <Alert
          severity="error"
          onClose={() => dispatch(clearError())}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {authError}
        </Alert>
      </Collapse>

      {/* Form */}
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Stack spacing={2.5}>

          {/* Email */}
          <TextField
            label="Email address"
            type="email"
            autoComplete="email"
            autoFocus
            fullWidth
            disabled={isLoading}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register('email', {
              required: 'Email is required.',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address.',
              },
            })}
          />

          {/* Password */}
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            fullWidth
            disabled={isLoading}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),

              {/* Forgot password */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link
                  component={RouterLink}
                  to={ROUTES.FORGOT_PASSWORD}
                  underline="hover"
                  sx={{ fontWeight: 600, color: 'primary.main', mt: 0.5 }}
                >
                  Forgot password?
                </Link>
              </Box>
            }}
            {...register('password', {
              required: 'Password is required.',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters.',
              },
            })}
          />

          {/* Submit */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isLoading}
            sx={{
              mt: 0.5,
              py: 1.4,
              fontWeight: 700,
              fontSize: '0.95rem',
              borderRadius: 2,
              position: 'relative',
            }}
          >
            {isLoading ? (
              <CircularProgress
                size={22}
                thickness={3}
                sx={{ color: 'primary.contrastText' }}
              />
            ) : (
              'Sign in'
            )}
          </Button>

        </Stack>
      </Box>

      {/* Footer link */}
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ mt: 4 }}
      >
        Don't have an account?{' '}
        <Link
          component={RouterLink}
          to={ROUTES.REGISTER}
          underline="hover"
          sx={{ fontWeight: 600, color: 'primary.main' }}
        >
          Create one
        </Link>
      </Typography>

    </Box>
  );
}