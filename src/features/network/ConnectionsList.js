import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { Grid, Card, CardContent, Avatar, Button, Typography, Box, Chip, Divider } from '@mui/material';
import { Message, PersonRemove } from '@mui/icons-material';

export default function ConnectionsList() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: Proper useEffect with cleanup
  useEffect(() => {
    if (!auth.currentUser) return;

    const connectionsQuery = query(
      collection(db, 'connections'),
      where('users', 'array-contains', auth.currentUser.uid),
      where('status', '==', 'accepted'),
      orderBy('connectedAt', 'desc')
    );

    const unsubscribe = onSnapshot(connectionsQuery, (snapshot) => {
      const connectionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConnections(connectionsData);
      setLoading(false);
    });

    // ✅ Cleanup the listener
    return () => unsubscribe();
  }, []); // ✅ Empty dependency array

  const handleRemoveConnection = async (connectionId) => {
    try {
      await updateDoc(doc(db, 'connections', connectionId), {
        status: 'removed'
      });
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  if (loading) {
    return <Typography>Loading connections...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Connections ({connections.length})
      </Typography>
      
      <Grid container spacing={3}>
        {connections.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No connections yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start connecting with people to build your network
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          connections.map((connection) => {
            const otherUser = connection.users?.find(uid => uid !== auth.currentUser.uid);
            const otherUserName = connection.userNames?.[otherUser] || 'Unknown User';
            
            return (
              <Grid item xs={12} md={6} key={connection.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        src={connection.userPhotos?.[otherUser]} 
                        sx={{ width: 60, height: 60, mr: 2 }}
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{otherUserName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {connection.userHeadlines?.[otherUser] || 'Professional connection'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="outlined" 
                        startIcon={<Message />}
                        size="small"
                        fullWidth
                      >
                        Message
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error"
                        startIcon={<PersonRemove />}
                        size="small"
                        onClick={() => handleRemoveConnection(connection.id)}
                      >
                        Remove
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>
    </Box>
  );
}