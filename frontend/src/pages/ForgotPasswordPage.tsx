import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';

import api from '../services/apiClient';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitEmail = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await api.post('/auth/forgot-password', {
        email,
      });

      setToken(res.data.data.resetToken);
      setStep(2);
    } catch (err: unknown) {

      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ||
            'Failed to generate reset token'
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate reset token');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    try {
      setLoading(true);
      setError('');

      await api.post('/auth/reset-password', {
        token,
        newPassword,
      });

      setSuccess('Password reset successful');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ||
            'Password reset failed'
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Password reset failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', mt: 8 }}>
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Forgot Password
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {step === 1 && (
            <>
              <TextField
                fullWidth
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={submitEmail}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  'Send Reset Token'
                )}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Typography
                variant="caption"
                sx={{ display: 'block', mb: 2 }}
              >
                Token: {token}
              </Typography>

              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={resetPassword}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  'Reset Password'
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}