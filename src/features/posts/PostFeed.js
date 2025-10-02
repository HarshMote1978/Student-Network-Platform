import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import Post from './Post';
import CreatePost from './CreatePost';
import {
  Box, Typography, Paper, Tabs, Tab, Button, Card, CardContent,
  LinearProgress, Alert, alpha, useTheme
} from '@mui/material';
import {
  TrendingUp, Whatshot, NewReleases, Group, Business
} from '@mui/icons-material';

export default function PostFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    setLoading(true);
    
    let q;
    switch (activeTab) {
      case 0: // Following
        q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        break;
      case 1: // Trending
        q = query(collection(db, 'posts'), orderBy('likes', 'desc'));
        break;
      case 2: // Latest
        q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        break;
      default:
        q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const postsData = [];
        querySnapshot.forEach((doc) => {
          postsData.push({ id: doc.id, ...doc.data() });
        });
        setPosts(postsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error("Error fetching posts: ", error);
        setError("Failed to load posts. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeTab]);

  const FeedTabs = () => (
    <Paper sx={{ mb: 3, borderRadius: 3 }}>
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{
          '& .MuiTab-root': {
            minHeight: 60,
            fontSize: '0.9rem',
            fontWeight: 600
          }
        }}
      >
        <Tab icon={<Group />} label="Following" />
        <Tab icon={<Whatshot />} label="Trending" />
        <Tab icon={<NewReleases />} label="Latest" />
      </Tabs>
    </Paper>
  );

  const LoadingState = () => (
    <Box sx={{ width: '100%', mb: 2 }}>
      <LinearProgress />
    </Box>
  );

  const EmptyState = () => (
    <Card sx={{ textAlign: 'center', py: 6, mb: 3 }}>
      <CardContent>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No posts yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Be the first to share something with your network
        </Typography>
        <Button variant="contained" size="large">
          Create your first post
        </Button>
      </CardContent>
    </Card>
  );

  const SuggestedConnections = () => (
    <Card sx={{ mb: 3, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Grow your network
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Connect with professionals in your industry
        </Typography>
        <Button variant="outlined" fullWidth>
          Discover people
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', px: { xs: 1, sm: 2 } }}>
      <CreatePost />
      
      <FeedTabs />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <LoadingState />
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <Box>
          {posts.map((post) => (
            <Post key={post.id} post={post} />
          ))}
        </Box>
      )}

      {/* Sidebar content for larger screens */}
      <Box sx={{ 
        display: { xs: 'none', lg: 'block' }, 
        position: 'fixed', 
        right: 20, 
        top: 100, 
        width: 300 
      }}>
        <SuggestedConnections />
        
        {/* Trending Topics */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              <TrendingUp sx={{ mr: 1, verticalAlign: 'bottom' }} />
              Trending Topics
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['#ReactJS', '#JobSearch', '#RemoteWork', '#Tech', '#CareerGrowth'].map((topic) => (
                <Button 
                  key={topic} 
                  variant="outlined" 
                  size="small"
                  sx={{ borderRadius: 3, textTransform: 'none' }}
                >
                  {topic}
                </Button>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}