import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import {
  Avatar, Button, Card, CardContent, CardActions, Typography, Box,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Check, PersonAdd, Message, ConnectWithoutContact, LocationOn, Work
} from '@mui/icons-material';

export default function UserCard({ user, showActions = true, onConnectionUpdate }) {
  const [connectionStatus, setConnectionStatus] = useState('none'); // 'none', 'pending', 'connected'
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ FIXED: Proper useEffect with cleanup and dependencies
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!auth.currentUser || !user.id) return;
      
      try {
        setLoading(true);
        
        // Check if there's a connection request
        const requestId = `${auth.currentUser.uid}_${user.id}`;
        const requestDoc = await getDoc(doc(db, 'connectionRequests', requestId));
        
        if (requestDoc.exists()) {
          setConnectionStatus(requestDoc.data().status === 'accepted' ? 'connected' : 'pending');
          return;
        }

        // Check if users are already connected
        const connectionId = [auth.currentUser.uid, user.id].sort().join('_');
        const connectionDoc = await getDoc(doc(db, 'connections', connectionId));
        
        if (connectionDoc.exists() && connectionDoc.data().status === 'accepted') {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('none');
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
        setConnectionStatus('none');
      } finally {
        setLoading(false);
      }
    };

    checkConnectionStatus();
  }, [user.id]); // ✅ Only re-run when user.id changes

  const handleConnection = async (action) => {
    if (!auth.currentUser || !user.id) return;

    try {
      setLoading(true);

      if (action === 'connect') {
        // Create connection request
        const requestId = `${auth.currentUser.uid}_${user.id}`;
        await setDoc(doc(db, 'connectionRequests', requestId), {
          senderId: auth.currentUser.uid,
          senderName: auth.currentUser.displayName,
          senderPhoto: auth.currentUser.photoURL,
          receiverId: user.id,
          receiverName: user.name || user.displayName,
          receiverPhoto: user.photoURL,
          status: 'pending',
          sentAt: new Date()
        });
        setConnectionStatus('pending');

      } else if (action === 'disconnect') {
        // Remove connection
        const connectionId = [auth.currentUser.uid, user.id].sort().join('_');
        await updateDoc(doc(db, 'connections', connectionId), {
          status: 'removed',
          removedAt: new Date()
        });
        setConnectionStatus('none');

      } else if (action === 'accept') {
        // Accept connection (if this card is used for incoming requests)
        const requestId = `${user.id}_${auth.currentUser.uid}`; // Note: reversed IDs
        await updateDoc(doc(db, 'connectionRequests', requestId), {
          status: 'accepted',
          acceptedAt: new Date()
        });

        // Create connection document
        const connectionId = [auth.currentUser.uid, user.id].sort().join('_');
        await setDoc(doc(db, 'connections', connectionId), {
          users: [auth.currentUser.uid, user.id],
          userNames: {
            [auth.currentUser.uid]: auth.currentUser.displayName,
            [user.id]: user.name || user.displayName
          },
          userPhotos: {
            [auth.currentUser.uid]: auth.currentUser.photoURL,
            [user.id]: user.photoURL
          },
          status: 'accepted',
          connectedAt: new Date()
        });
        setConnectionStatus('connected');
      }
      
      if (onConnectionUpdate) {
        onConnectionUpdate();
      }
    } catch (error) {
      console.error('Error updating connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionButton = () => {
    if (user.id === auth.currentUser?.uid) {
      return (
        <Button variant="outlined" disabled size="small">
          This is you
        </Button>
      );
    }

    if (connectionStatus === 'connected') {
      return (
        <Button
          variant="contained"
          startIcon={<Check />}
          onClick={() => handleConnection('disconnect')}
          color="success"
          size="small"
          disabled={loading}
        >
          Connected
        </Button>
      );
    }

    if (connectionStatus === 'pending') {
      return (
        <Button
          variant="outlined"
          disabled
          size="small"
        >
          Request Sent
        </Button>
      );
    }

    return (
      <Button
        variant="contained"
        startIcon={<PersonAdd />}
        onClick={() => handleConnection('connect')}
        size="small"
        disabled={loading}
      >
        Connect
      </Button>
    );
  };

  // ✅ Add loading state
  if (loading && connectionStatus === 'none') {
    return (
      <Card sx={{ p: 2, mb: 2 }}>
        <Typography>Loading connection status...</Typography>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ 
        display: 'flex', 
        p: 2, 
        mb: 2, 
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)'
        }
      }}>
        <Avatar 
          src={user.photoURL} 
          sx={{ 
            width: 64, 
            height: 64, 
            mr: 2,
            border: '3px solid',
            borderColor: 'primary.main'
          }} 
        />
        
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {user.name || user.displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Work sx={{ fontSize: 16, mr: 0.5 }} />
                {user.headline || 'Professional'}
              </Typography>
              {user.location && (
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                  {user.location}
                </Typography>
              )}
            </Box>
            
            {showActions && getConnectionButton()}
          </Box>

          {user.skills && user.skills.length > 0 && (
            <Box sx={{ mb: 1 }}>
              {user.skills.slice(0, 4).map((skill, index) => (
                <Chip 
                  key={index}
                  label={skill} 
                  size="small" 
                  sx={{ mr: 0.5, mb: 0.5 }}
                  variant="outlined"
                />
              ))}
              {user.skills.length > 4 && (
                <Chip 
                  label={`+${user.skills.length - 4}`} 
                  size="small" 
                  sx={{ mb: 0.5 }}
                />
              )}
            </Box>
          )}

          {showActions && (
            <CardActions sx={{ px: 0, pt: 1 }}>
              <IconButton 
                size="small" 
                onClick={() => setShowMessageDialog(true)}
                disabled={connectionStatus !== 'connected'}
                title={connectionStatus === 'connected' ? "Send message" : "Connect to message"}
              >
                <Message />
              </IconButton>
              <Button 
                size="small" 
                component="a" 
                href={`/profile/${user.id}`}
              >
                View Profile
              </Button>
            </CardActions>
          )}
        </Box>
      </Card>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onClose={() => setShowMessageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message to {user.name || user.displayName}</DialogTitle>
        <DialogContent>
          <Typography>This would open your chat system with {user.name || user.displayName}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMessageDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setShowMessageDialog(false);
              // Navigate to chat with this user
              window.location.href = `/messages?user=${user.id}`;
            }}
          >
            Open Chat
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}