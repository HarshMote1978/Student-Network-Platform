import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // ADDED useSelector
import { Navigate } from 'react-router-dom'; // ADDED Navigate
import { auth } from '../services/firebase';
import { login, logout, selectUser } from '../features/auth/authslice'; // ADDED selectUser

// Add these imports to your Navbar.js and other components
import WorkIcon from '@mui/icons-material/Work';
import MessageIcon from '@mui/icons-material/Message';
import EventIcon from '@mui/icons-material/Event';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(login({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }));
      } else {
        dispatch(logout());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return children;
};

export const PrivateRoute = ({ children }) => {
  const user = useSelector(selectUser);
  return user ? children : <Navigate to="/login" />;
};

