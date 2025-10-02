import { useState, useEffect } from 'react';
import { 
  doc, updateDoc, arrayUnion, arrayRemove, increment,
  collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import {
  Avatar, Box, Typography, Paper, IconButton, Divider, Button,
  TextField, Card, CardContent, Chip, Dialog, DialogContent,
  Menu, MenuItem, Tooltip, alpha, useTheme
} from '@mui/material';
import {
  ThumbUp, Comment, Share, MoreVert, Bookmark,
  ThumbUpOffAlt, BookmarkBorder, Visibility,
  Favorite, Send, EmojiEmotions
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// Safe date formatting function
const formatPostTime = (timestamp) => {
  if (!timestamp) return 'Recently';
  
  try {
    // Handle Firestore Timestamp
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // Check if date is valid
    if (date instanceof Date && !isNaN(date)) {
      return formatDistanceToNow(date) + ' ago';
    }
    return 'Recently';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Recently';
  }
};

export default function Post({ post }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const theme = useTheme();

  useEffect(() => {
    // Check if current user liked the post
    setIsLiked(post.likes?.includes(auth.currentUser?.uid) || false);
    
    // Listen to comments in real-time
    if (showComments) {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);
      });

      return () => unsubscribe();
    }
  }, [post, showComments]);

  const handleLike = async () => {
    if (!auth.currentUser) return;

    const postRef = doc(db, 'posts', post.id);
    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(auth.currentUser.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(auth.currentUser.uid)
        });
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !auth.currentUser) return;

    try {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      await addDoc(commentsRef, {
        content: comment.trim(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        userPhoto: auth.currentUser.photoURL,
        createdAt: serverTimestamp()
      });
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = async () => {
    // Implement share functionality
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.userName}`,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Failed to copy: ', err));
    }
  };

  const handleBookmark = async () => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      if (isBookmarked) {
        await updateDoc(userRef, {
          savedPosts: arrayRemove(post.id)
        });
      } else {
        await updateDoc(userRef, {
          savedPosts: arrayUnion(post.id)
        });
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const PostHeader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Avatar 
          src={post.userPhoto} 
          alt={post.userName}
          sx={{ 
            width: 56, 
            height: 56,
            border: `2px solid ${theme.palette.primary.main}`
          }}
        />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            {post.userName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {post.userEmail} • {formatPostTime(post.createdAt)}
          </Typography>
          {post.audience && (
            <Chip 
              label={post.audience === 'public' ? 'Anyone' : 'Connections'} 
              size="small" 
              variant="outlined"
              sx={{ mt: 0.5, height: 20 }}
            />
          )}
        </Box>
      </Box>
      
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVert />
      </IconButton>
    </Box>
  );

  const PostContent = () => (
    <Box sx={{ mb: 2 }}>
      <Typography paragraph sx={{ 
        fontSize: '1.1rem', 
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap'
      }}>
        {post.content}
      </Typography>
      
      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {post.hashtags.map((tag, index) => (
            <Chip 
              key={index}
              label={tag} 
              size="small" 
              variant="outlined"
              clickable
            />
          ))}
        </Box>
      )}

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: post.images.length === 1 ? '1fr' : '1fr 1fr',
          gap: 1,
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          {post.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`Post image ${index + 1}`}
              style={{
                width: '100%',
                height: post.images.length === 1 ? 400 : 200,
                objectFit: 'cover',
                cursor: 'pointer',
                borderRadius: 8
              }}
              onClick={() => {
                setSelectedImage(image);
                setShowImageDialog(true);
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );

  const PostStats = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: 10,
          px: 1,
          py: 0.5
        }}>
          <ThumbUp sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ ml: 0.5 }}>
            {post.likes?.length || 0}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {comments.length || 0} comments • {post.shares || 0} shares
        </Typography>
      </Box>
      {post.views > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
          <Visibility sx={{ fontSize: 16, mr: 0.5 }} />
          {post.views} views
        </Typography>
      )}
    </Box>
  );

  const PostActions = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-around', py: 1 }}>
      <Button 
        startIcon={isLiked ? <ThumbUp /> : <ThumbUpOffAlt />}
        onClick={handleLike}
        sx={{ 
          color: isLiked ? 'primary.main' : 'text.secondary',
          fontWeight: isLiked ? 600 : 400
        }}
      >
        Like
      </Button>
      
      <Button 
        startIcon={<Comment />}
        onClick={() => setShowComments(!showComments)}
        sx={{ color: 'text.secondary' }}
      >
        Comment
      </Button>
      
      <Button 
        startIcon={<Share />}
        onClick={handleShare}
        sx={{ color: 'text.secondary' }}
      >
        Share
      </Button>
      
      <Button 
        startIcon={isBookmarked ? <Bookmark /> : <BookmarkBorder />}
        onClick={handleBookmark}
        sx={{ color: isBookmarked ? 'primary.main' : 'text.secondary' }}
      >
        Save
      </Button>
    </Box>
  );

  const CommentsSection = () => (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Avatar 
          src={auth.currentUser?.photoURL} 
          sx={{ width: 40, height: 40 }}
        />
        <TextField
          fullWidth
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
          size="small"
          InputProps={{
            endAdornment: (
              <IconButton 
                onClick={handleAddComment} 
                disabled={!comment.trim()}
                sx={{ color: 'primary.main' }}
              >
                <Send />
              </IconButton>
            )
          }}
        />
      </Box>

      {comments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No comments yet. Be the first to comment!
        </Typography>
      ) : (
        comments.map((comment) => (
          <Box key={comment.id} sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Avatar src={comment.userPhoto} sx={{ width: 32, height: 32 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Card variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {comment.userName}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {comment.content}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatPostTime(comment.createdAt)}
                </Typography>
              </Card>
            </Box>
          </Box>
        ))
      )}
    </Box>
  );

  return (
    <>
      <Paper 
        elevation={1} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          '&:hover': {
            boxShadow: 2,
            borderColor: alpha(theme.palette.primary.main, 0.2)
          }
        }}
      >
        <PostHeader />
        <PostContent />
        <Divider sx={{ my: 2 }} />
        <PostStats />
        <Divider sx={{ my: 1 }} />
        <PostActions />
        {showComments && <CommentsSection />}
      </Paper>

      {/* Image Dialog */}
      <Dialog 
        open={showImageDialog} 
        onClose={() => setShowImageDialog(false)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            maxWidth: '90vw',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogContent>
          <img
            src={selectedImage}
            alt="Enlarged post"
            style={{ 
              width: '100%', 
              height: 'auto', 
              borderRadius: 8,
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        </DialogContent>
      </Dialog>

      {/* More Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }
        }}
      >
        <MenuItem onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          setAnchorEl(null);
        }}>
          Copy link
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          Save post
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          Report post
        </MenuItem>
      </Menu>
    </>
  );
}