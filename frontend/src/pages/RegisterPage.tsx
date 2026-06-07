// src/pages/RegisterPage.tsx [FRONTEND]
import { useEffect, useState } from 'react';
import { useForm }             from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, CircularProgress, Collapse, Divider,
  IconButton, InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import VisibilityIcon    from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  clearError,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
} from '../features/auth/store/authSlice';

import { registerUser } from '../features/auth/store/authThunks';
import { ROUTES } from '../routes/routes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RegisterFormValues {
  name:            string;
  email:           string;
  password:        string;
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.DASHBOARD, { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const passwordValue = watch('password');

  const onSubmit = async (values: RegisterFormValues) => {
    const result = await dispatch(
      registerUser({
        name:     values.name,
        email:    values.email,
        password: values.password,
      })
    );
    if (registerUser.fulfilled.match(result)) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  };

  const busy = isLoading || isSubmitting;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{
          width: 52, height: 52, borderRadius: 3,
          bgcolor: 'secondary.main',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', mx: 'auto', mb: 2,
        }}>
          <PersonAddOutlinedIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
          Create an account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Get started — it's free. No credit card required.
        </Typography>
      </Box>

      {/* Server error */}
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
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
            {...register('name', {
              required:  'Full name is required',
              minLength: { value: 2,  message: 'At least 2 characters' },
              maxLength: { value: 80, message: 'Max 80 characters' },
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
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value:   /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
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
            helperText={errors.password?.message ?? 'At least 8 characters with a number and letter'}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            {...register('password', {
              required:  'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              validate: {
                hasLetter: (v) => /[a-zA-Z]/.test(v) || 'Must contain at least one letter',
                hasNumber: (v) => /\d/.test(v)       || 'Must contain at least one number',
              },
            })}
          />

          {/* Confirm password */}
          <TextField
            label="Confirm password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            fullWidth
            disabled={busy}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword?.message}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirm((v) => !v)}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
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
              py: 1.4,
              fontWeight: 600,
              fontSize: '0.95rem',
              borderRadius: 2,
            }}
          >
            {busy
              ? <CircularProgress size={22} thickness={3} sx={{ color: 'inherit' }} />
              : 'Create account'
            }
          </Button>

        </Stack>
      </Box>

      {/* Divider */}
      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Already have an account?
        </Typography>
      </Divider>

      {/* Login link */}
      <Button
        component={RouterLink}
        to={ROUTES.LOGIN}
        variant="outlined"
        fullWidth
        size="large"
        sx={{
          fontWeight: 600,
          borderRadius: 2,
          bgcolor: 'secondary.main',
          color: 'white',

          py: 1.2,
        }}
      >
        Sign in instead
      </Button>
    </Box>
  );
}