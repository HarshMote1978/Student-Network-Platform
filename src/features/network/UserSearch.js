import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { Grid, TextField, InputAdornment, Card, CardContent, Avatar, Button, Typography, Box } from '@mui/material';
import { Search, PersonAdd } from '@mui/icons-material';

export default function UserSearch() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // ✅ FIXED: Proper useEffect with cleanup
  useEffect(() => {
    if (!auth.currentUser) return;

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('displayName', 'asc')
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(user => user.id !== auth.currentUser.uid);
      
      setUsers(usersData);
      setLoading(false);
    });

    // ✅ Cleanup the listener
    return () => unsubscribe();
  }, []); // ✅ Empty dependency array

  const handleConnect = async (userId) => {
    try {
      const requestId = `${auth.currentUser.uid}_${userId}`;
      await updateDoc(doc(db, 'connectionRequests', requestId), {
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName,
        receiverId: userId,
        status: 'pending',
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Typography>Loading users...</Typography>;
  }

  return (
    <Box>
      <TextField
        fullWidth
        placeholder="Search by name, headline, or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={3}>
        {filteredUsers.map((user) => (
          <Grid item xs={12} md={6} lg={4} key={user.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Avatar 
                  src={user.photoURL} 
                  sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  {user.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.headline}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  {user.email}
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<PersonAdd />}
                  onClick={() => handleConnect(user.id)}
                  sx={{ mt: 2 }}
                >
                  Connect
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}