// src/pages/RegisterPage.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  registerUser,
  clearError,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
} from '../features/auth/store/authSlice';
import { ROUTES } from '../routes/routes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ---------------------------------------------------------------------------
// RegisterPage
// ---------------------------------------------------------------------------
export default function RegisterPage() {
  const dispatch        = useAppDispatch();
  const navigate        = useNavigate();

  const isLoading       = useAppSelector(selectAuthLoading);
  const serverError     = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Already authenticated — bounce immediately
  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.DASHBOARD, { replace: true });
  }, [isAuthenticated, navigate]);

  // Clear stale server errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // ── React Hook Form ──────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  // Live password value — used by confirmPassword cross-field validation
  const passwordValue = watch('password');

  const onSubmit = async (values: RegisterFormValues) => {
    const { confirmPassword: _, ...payload } = values; // strip UI-only field
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
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
          Create an account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Get started — it's free. No credit card required.
        </Typography>
      </Box>

      {/* Server error banner */}
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
        aria-label="Registration form"
      >
        <Stack spacing={2.5}>

          {/* Full name */}
          <TextField
            label="Full name"
            type="text"
            autoComplete="name"
            autoFocus
            fullWidth
            disabled={busy}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            inputProps={{ 'aria-label': 'Full name' }}
            {...register('name', {
              required: 'Full name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
              maxLength: {
                value: 80,
                message: 'Name must be 80 characters or fewer',
              },
              pattern: {
                value: /^[a-zA-Z\s'\-]+$/,
                message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
              },
            })}
          />

          {/* Email */}
          <TextField
            label="Email address"
            type="email"
            autoComplete="email"
            fullWidth
            disabled={busy}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            inputProps={{ 'aria-label': 'Email address' }}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
          />

          {/* Password */}
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            fullWidth
            disabled={busy}
            error={Boolean(errors.password)}
            helperText={
              errors.password?.message ??
              'At least 8 characters with a number and a letter'
            }
            inputProps={{ 'aria-label': 'Password' }}
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
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
              validate: {
                hasLetter: (v) =>
                  /[a-zA-Z]/.test(v) || 'Password must contain at least one letter',
                hasNumber: (v) =>
                  /\d/.test(v) || 'Password must contain at least one number',
              },
            })}
          />

          {/* Confirm password */}
          <TextField
            label="Confirm password"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            fullWidth
            disabled={busy}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword?.message}
            inputProps={{ 'aria-label': 'Confirm password' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === passwordValue || 'Passwords do not match',
            })}
          />

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
              'Create account'
            )}
          </Button>

        </Stack>
      </Box>

      {/* Login link */}
      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{ mt: 4 }}
      >
        Already have an account?{' '}
        <Link
          component={RouterLink}
          to={ROUTES.LOGIN}
          underline="hover"
          fontWeight={600}
          sx={{ color: 'primary.main' }}
        >
          Sign in
        </Link>
      </Typography>
    </Box>
  );
}