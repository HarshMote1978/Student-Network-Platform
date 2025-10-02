import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  TextField,
  Typography,
  Container,
  Box,
  Alert
} from '@mui/material';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Check your email for password reset instructions');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        mt: 8, 
        p: 4, 
        boxShadow: 3, 
        borderRadius: 2,
        backgroundColor: 'background.paper'
      }}>
        <Typography variant="h4" align="center" gutterBottom>
          Reset Password
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center' }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            Back to Login
          </Link>
        </Box>
      </Box>
    </Container>
  );
}