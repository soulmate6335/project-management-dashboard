// src/pages/ProfilePage.tsx [FRONTEND]
import { useState } from 'react';
import { useForm, useWatch }  from 'react-hook-form';
import {
  Alert, Avatar, Box, Button, Card, CardContent,
  CircularProgress, Collapse, Divider, Grid,
  Stack, TextField, Typography, Chip,
} from '@mui/material';
import EditIcon         from '@mui/icons-material/Edit';
import LockIcon         from '@mui/icons-material/Lock';
import PersonIcon       from '@mui/icons-material/Person';
import EmailIcon        from '@mui/icons-material/Email';
import BadgeIcon        from '@mui/icons-material/Badge';

import { useAppSelector, useAppDispatch } from '../app/hooks';
import { selectCurrentUser, setCredentials } from '../features/auth/store/authSlice';
import { apiClient } from '../services/apiClient';



// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ProfileFormValues {
  name:  string;
  email: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword:     string;
  confirmPassword: string;
}

// ---------------------------------------------------------------------------
// ProfilePage
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const dispatch    = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);

  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError,   setProfileError]   = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError,   setPasswordError]   = useState('');
  const [editingProfile,  setEditingProfile]  = useState(false);

  // ── Profile form ──────────────────────────────────────────────────────
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
    reset: resetProfile,
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name:  currentUser?.name  ?? '',
      email: currentUser?.email ?? '',
    },
  });

  // ── Password form ─────────────────────────────────────────────────────
  const {
    register: regPassword,
    handleSubmit: handlePassword,
    control,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordFormValues>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPasswordValue = useWatch({ control, name: 'newPassword' });

  // ── Submit profile ────────────────────────────────────────────────────
  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      setProfileError('');
      const res = await apiClient.patch('/users/me', values);
      const updated = res.data.data;
      dispatch(setCredentials({
        user:  { ...currentUser!, ...updated },
        token: localStorage.getItem('auth_token') ?? '',
      }));
      setProfileSuccess('Profile updated successfully');
      setEditingProfile(false);
      setTimeout(() => setProfileSuccess(''), 3000);
    // ✅ Replace both catch blocks with this
} catch (err: unknown) {
  const error = err as { response?: { data?: { message?: string } } };
  setProfileError(error.response?.data?.message ?? 'Failed to update profile');
}
  };

  // ── Submit password ───────────────────────────────────────────────────
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      setPasswordError('');
      await apiClient.patch('/users/me/password', {
        currentPassword: values.currentPassword,
        newPassword:     values.newPassword,
      });
      setPasswordSuccess('Password changed successfully');
      resetPassword();
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setPasswordError(error.response?.data?.message ?? 'Failed to change password');
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Profile Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your personal information and security settings
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* ── Left: Avatar card ───────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar sx={{
                width: 96, height: 96, fontSize: 36,
                bgcolor: 'primary.main', mx: 'auto', mb: 2,
              }}>
                {getInitials(currentUser?.name ?? 'U')}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {currentUser?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {currentUser?.email}
              </Typography>
              <Chip
                label={currentUser?.role ?? 'member'}
                color="primary"
                size="small"
                sx={{ textTransform: 'capitalize', fontWeight: 600 }}
              />

              <Divider sx={{ my: 3 }} />

              <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {currentUser?.name}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {currentUser?.email}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <BadgeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {currentUser?.role}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right: Forms ────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>

            {/* Profile info */}
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row"
                  sx={{ mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <EditIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Personal Information
                    </Typography>
                  </Stack>
                  {!editingProfile && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setEditingProfile(true)}
                    >
                      Edit
                    </Button>
                  )}
                </Stack>

                <Collapse in={Boolean(profileSuccess)}>
                  <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                    {profileSuccess}
                  </Alert>
                </Collapse>
                <Collapse in={Boolean(profileError)}>
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
                    onClose={() => setProfileError('')}>
                    {profileError}
                  </Alert>
                </Collapse>

                <Box component="form" onSubmit={handleProfile(onProfileSubmit)} noValidate>
                  <Stack spacing={2.5}>
                    <TextField
                      label="Full name"
                      fullWidth
                      disabled={!editingProfile || profileSubmitting}
                      error={Boolean(profileErrors.name)}
                      helperText={profileErrors.name?.message}
                      {...regProfile('name', {
                        required:  'Name is required',
                        minLength: { value: 2, message: 'At least 2 characters' },
                      })}
                    />
                    <TextField
                      label="Email address"
                      fullWidth
                      disabled={!editingProfile || profileSubmitting}
                      error={Boolean(profileErrors.email)}
                      helperText={profileErrors.email?.message}
                      {...regProfile('email', {
                        required: 'Email is required',
                        pattern: {
                          value:   /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Enter a valid email',
                        },
                      })}
                    />

                    {editingProfile && (
                      <Stack direction="row" spacing={1.5}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={profileSubmitting}
                          sx={{ minWidth: 100 }}
                        >
                          {profileSubmitting
                            ? <CircularProgress size={18} sx={{ color: 'inherit' }} />
                            : 'Save'
                          }
                        </Button>
                        <Button
                          variant="outlined"
                          disabled={profileSubmitting}
                          onClick={() => {
                            setEditingProfile(false);
                            resetProfile();
                            setProfileError('');
                          }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {/* Change password */}
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <LockIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Change Password
                  </Typography>
                </Box>

                <Collapse in={Boolean(passwordSuccess)}>
                  <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                    {passwordSuccess}
                  </Alert>
                </Collapse>
                <Collapse in={Boolean(passwordError)}>
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
                    onClose={() => setPasswordError('')}>
                    {passwordError}
                  </Alert>
                </Collapse>

                <Box component="form" onSubmit={handlePassword(onPasswordSubmit)} noValidate>
                  <Stack spacing={2.5}>
                    <TextField
                      label="Current password"
                      type="password"
                      fullWidth
                      disabled={passwordSubmitting}
                      error={Boolean(passwordErrors.currentPassword)}
                      helperText={passwordErrors.currentPassword?.message}
                      {...regPassword('currentPassword', {
                        required: 'Current password is required',
                      })}
                    />
                    <TextField
                      label="New password"
                      type="password"
                      fullWidth
                      disabled={passwordSubmitting}
                      error={Boolean(passwordErrors.newPassword)}
                      helperText={passwordErrors.newPassword?.message ?? 'At least 8 characters'}
                      {...regPassword('newPassword', {
                        required:  'New password is required',
                        minLength: { value: 8, message: 'At least 8 characters' },
                        validate: {
                          hasLetter: (v) => /[a-zA-Z]/.test(v) || 'Must contain a letter',
                          hasNumber: (v) => /\d/.test(v)       || 'Must contain a number',
                        },
                      })}
                    />
                    <TextField
                      label="Confirm new password"
                      type="password"
                      fullWidth
                      disabled={passwordSubmitting}
                      error={Boolean(passwordErrors.confirmPassword)}
                      helperText={passwordErrors.confirmPassword?.message}
                      {...regPassword('confirmPassword', {
                        required: 'Please confirm your new password',
                        validate: (v) => v === newPasswordValue || 'Passwords do not match',
                      })}
                    />
                    <Box>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={passwordSubmitting}
                        sx={{ minWidth: 160 }}
                      >
                        {passwordSubmitting
                          ? <CircularProgress size={18} sx={{ color: 'inherit' }} />
                          : 'Change Password'
                        }
                      </Button>
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            </Card>

          </Stack>
        </Grid>

      </Grid>
    </Box>
  );
}