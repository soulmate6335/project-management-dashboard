// src/pages/LoginPage.tsx [FRONTEND]
import { useEffect, useState } from 'react';
import { useForm }             from 'react-hook-form';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Button, CircularProgress, Divider, IconButton,
  InputAdornment, Link, Stack, TextField, Typography,
  Alert, Collapse,
} from '@mui/material';
import VisibilityIcon    from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon  from '@mui/icons-material/LockOutlined';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  clearError,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
} from '../features/auth/store/authSlice';

import { loginUser } from '../features/auth/store/authThunks';
import { ROUTES } from '../routes/routes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LoginFormValues {
  email:    string;
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

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    ROUTES.DASHBOARD;

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (values: LoginFormValues) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      navigate(from, { replace: true });
    }
  };

  const busy = isLoading || isSubmitting;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{
          width: 52, height: 52, borderRadius: 3,
          bgcolor: 'primary.main',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', mx: 'auto', mb: 2,
        }}>
          <LockOutlinedIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Typography variant="h4" sx={{ letterSpacing: '-0.5px', fontWeight: 700 }}>
         WELCOME BACK
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Sign in to continue to your workspace
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
            autoComplete="current-password"
            fullWidth
            disabled={busy}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
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
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
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
              py: 1.4,
              fontWeight: 600,
              fontSize: '0.95rem',
              borderRadius: 2,
            }}
          >
            {busy
              ? <CircularProgress size={22} thickness={3} sx={{ color: 'inherit' }} />
              : 'Sign in'
            }
          </Button>

        </Stack>
      </Box>

      {/* Divider */}
      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Don't have an account?
        </Typography>
      </Divider>

      {/* Register link */}
      <Button
        component={RouterLink}
        to={ROUTES.REGISTER}
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
        Create an account
      </Button>
    </Box>
  );
}


