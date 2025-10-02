import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../services/firebase';
import { useDispatch } from 'react-redux';
import { login } from './authslice';
import { useNavigate, Link } from 'react-router-dom';
import { Button, TextField, Typography, Container, Box, Avatar } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      dispatch(login({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL
      }));
      navigate('/feed');
    } catch (err) {
      setError(err.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      dispatch(login({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      }));
      navigate('/feed');
    } catch (err) {
      setError(err.message);
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
          Welcome Back
        </Typography>
        {error && <Typography color="error" align="center">{error}</Typography>}
        
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
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            sx={{ mt: 2, mb: 2, py: 1.5 }}
          >
            Sign In
          </Button>
        </form>

        <Typography align="center" sx={{ my: 2 }}>OR</Typography>

        <Button
          variant="outlined"
          startIcon={<GoogleIcon />}
          fullWidth
          sx={{ py: 1.5 }}
          onClick={signInWithGoogle}
        >
          Continue with Google
        </Button>

        <Typography sx={{ mt: 3, textAlign: 'center' }}>
          New user? <Link to="/register" style={{ textDecoration: 'none' }}>Create an account</Link>
        </Typography>
      </Box>
    </Container>
  );
}