import { useState } from 'react';
import { Box, Button, Card, CardContent, TextField, Typography, Alert } from '@mui/material';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      // TODO: Call forgotPassword endpoint once available in authService
      setSent(true);
      toast.success('Reset link sent to email');
    } catch (err: unknown) {
      let errorMessage = 'Failed to send reset link';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response === 'object'
      ) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <Card sx={{ width: 400, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
            Forgot Password
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your email to receive a password reset link.
          </Typography>

          {sent && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Check your email for reset instructions.
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              required
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}