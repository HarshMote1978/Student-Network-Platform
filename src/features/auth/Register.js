import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useDispatch } from 'react-redux';
import { login } from './authslice';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  TextField,
  Typography,
  Container,
  Box,
  Avatar,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon
} from '@mui/icons-material';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password should be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Update user profile with name
      await updateProfile(userCredential.user, {
        displayName: formData.name
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        createdAt: new Date(),
        skills: [],
        connections: [],
        headline: '',
        about: ''
      });

      // Dispatch login action
      dispatch(login({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: formData.name,
        photoURL: userCredential.user.photoURL
      }));

      navigate('/feed');
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <PersonIcon />
          </Avatar>
        </Box>
        
        <Typography variant="h4" align="center" gutterBottom>
          Create Account
        </Typography>
        
        {error && (
          <Typography color="error" align="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Full Name"
            name="name"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formData.name}
            onChange={handleChange}
            required
          />
          
          <TextField
            label="Email"
            type="email"
            name="email"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <TextField
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <Button 
            type="submit" 
            variant="contained" 
            fullWidth 
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <Typography sx={{ textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ textDecoration: 'none' }}>
            Sign in
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}