// src/pages/LoginPage.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
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
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
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
  const dispatch        = useAppDispatch();
  const navigate        = useNavigate();
  const location        = useLocation();

  const isLoading       = useAppSelector(selectAuthLoading);
  const serverError     = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [showPassword, setShowPassword] = useState(false);

  // Where to send the user after login — honour the preserved destination
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    ROUTES.DASHBOARD;

  // If already authenticated (e.g. back-button after login), redirect immediately
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  // Clear any stale server error when the component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // ── React Hook Form ──────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    mode: 'onTouched', // validate on blur, revalidate on change after first touch
  });

  const emailRegister = register('email', {
    required: 'Email is required',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Enter a valid email address',
    },
  });

  const passwordRegister = register('password', {
    required: 'Password is required',
    minLength: {
      value: 6,
      message: 'Password must be at least 6 characters',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      navigate(from, { replace: true });
    }
    // On rejection, serverError is populated by the slice — no extra handling needed
  };

  const busy = isLoading || isSubmitting;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ letterSpacing: '-0.5px', color: 'text.primary', fontWeight: 700 }}
        >
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to continue to your workspace
        </Typography>
      </Box>

      {/* Server-side error banner */}
      <Collapse in={Boolean(serverError)}>
        <Alert
          severity="error"
          onClose={() => dispatch(clearError())}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {serverError}
        </Alert>
      </Collapse>

      {/* Form */}
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Login form"
      >
        <Stack spacing={2.5}>

          {/* Email */}
          <TextField
            variant="outlined"
            label="Email address"
            type="email"
            autoComplete="email"
            autoFocus
            fullWidth
            disabled={busy}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            aria-label="Email address"
            name={emailRegister.name}
            onChange={emailRegister.onChange}
            onBlur={emailRegister.onBlur}
            inputRef={emailRegister.ref}
          />

          {/* Password */}
          <TextField
            variant="outlined"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            fullWidth
            disabled={busy}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            aria-label="Password"
            name={passwordRegister.name}
            onChange={passwordRegister.onChange}
            onBlur={passwordRegister.onBlur}
            inputRef={passwordRegister.ref}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* Forgot password */}
          <Box sx={{ textAlign: 'right', mt: -1 }}>
            <Link
              component={RouterLink}
              to="/forgot-password"
              variant="body2"
              underline="hover"
              sx={{ color: 'primary.main', fontWeight: 500 }}
            >
              Forgot your password?
            </Link>
          </Box>

          {/* Submit */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={busy}
            sx={{
              mt: 0.5,
              py: 1.4,
              fontWeight: 600,
              fontSize: '0.95rem',
              borderRadius: 2,
            }}
          >
            {busy ? (
              <CircularProgress size={22} thickness={3} sx={{ color: 'inherit' }} />
            ) : (
              'Sign in'
            )}
          </Button>

        </Stack>
      </Box>

      {/* Register link */}
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
          sx={{ color: 'primary.main', fontWeight: 600 }}
        >
          Create one
        </Link>
      </Typography>
    </Box>
  );
}