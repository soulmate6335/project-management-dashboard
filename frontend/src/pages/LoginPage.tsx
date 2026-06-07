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
  clearError,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
} from '../features/auth/store/authSlice';

import { loginUser } from '../features/auth/store/authThunks';
import { ROUTES } from '../routes/routes';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoading = useAppSelector(selectAuthLoading);
  const serverError = useAppSelector(selectAuthError);
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to continue
        </Typography>
      </Box>

      <Collapse in={Boolean(serverError)}>
        <Alert severity="error" onClose={() => dispatch(clearError())}>
          {serverError}
        </Alert>
      </Collapse>

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2.5}>
          <TextField
            label="Email"
            fullWidth
            disabled={busy}
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            disabled={busy}
            error={!!errors.password}
            helperText={errors.password?.message}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            {...register('password', { required: 'Password is required' })}
          />

          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? <CircularProgress size={20} /> : 'Login'}
          </Button>

          <Link component={RouterLink} to="/forgot-password">
            Forgot password?
          </Link>
        </Stack>
      </Box>
    </Box>
  );
}