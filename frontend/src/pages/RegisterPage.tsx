// src/pages/RegisterPage.tsx
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  selectAuth,
  selectAuthLoading,
  selectIsAuthenticated,
} from '../features/auth/store/authSlice';
import { ROUTES } from '../routes/routes';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isLoading = useAppSelector(selectAuthLoading);
  const { error: serverError } = useAppSelector(selectAuth);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.DASHBOARD, { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const password = useWatch({ control, name: 'password', defaultValue: '' });
  const confirmPassword = useWatch({ control, name: 'confirmPassword', defaultValue: '' });

  const onSubmit = async (values: RegisterFormValues) => {
    await dispatch(
      registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      })
    );
  };

  const busy = isLoading || isSubmitting;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Create account
      </Typography>

      <Collapse in={Boolean(serverError)}>
        <Alert severity="error" onClose={() => dispatch(clearError())}>
          {serverError}
        </Alert>
      </Collapse>

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2.5}>
          <TextField
            label="Name"
            fullWidth
            disabled={busy}
            {...register('name', { required: 'Name is required' })}
          />

          <TextField
            label="Email"
            fullWidth
            disabled={busy}
            {...register('email', { required: 'Email is required' })}
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            disabled={busy}
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

          <TextField
            label="Confirm Password"
            type={showConfirm ? 'text' : 'password'}
            fullWidth
            disabled={busy}
            error={password !== confirmPassword}
            helperText={
              password !== confirmPassword
                ? 'Passwords do not match'
                : ''
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirm(v => !v)}>
                      {showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            {...register('confirmPassword')}
          />

          <Button type="submit" variant="contained" disabled={busy}>
            {busy ? <CircularProgress size={20} /> : 'Create account'}
          </Button>
        </Stack>
      </Box>

      <Link component={RouterLink} to={ROUTES.LOGIN}>
        Already have an account?
      </Link>
    </Box>
  );
}