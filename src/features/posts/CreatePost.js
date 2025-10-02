import { useState, useRef } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth, storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Avatar, Button, TextField, Box, Paper, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  Tabs, Tab, Divider, Typography, Tooltip
} from '@mui/material';
import {
  AddPhotoAlternate, Videocam, Event, Article, EmojiEmotions,
  Close, Public, Group, InsertLink, CloudUpload
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [postType, setPostType] = useState('post');
  const [audience, setAudience] = useState('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const theme = useTheme();

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 4) {
      alert('Maximum 4 images allowed');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const uploadImages = async () => {
    const uploadPromises = images.map(async (image) => {
      const storageRef = ref(storage, `posts/${auth.currentUser.uid}/${Date.now()}_${image.name}`);
      await uploadBytes(storageRef, image);
      return await getDownloadURL(storageRef);
    });

    return await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    setIsSubmitting(true);
    setProgress(0);

    try {
      let imageUrls = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
        setProgress(50);
      }

      const postData = {
        content: content.trim(),
        images: imageUrls,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: auth.currentUser.displayName,
        userPhoto: auth.currentUser.photoURL,
        type: postType,
        audience: audience,
        createdAt: serverTimestamp(),
        likes: [],
        comments: [],
        shares: 0,
        views: 0,
        hashtags: content.match(/#\w+/g) || []
      };

      await addDoc(collection(db, 'posts'), postData);
      setProgress(100);

      // Reset form
      setContent('');
      setImages([]);
      setImagePreviews([]);
      setPostType('post');
      
    } catch (err) {
      console.error("Error adding post: ", err);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const PostTypeTabs = () => (
    <Tabs 
      value={postType} 
      onChange={(e, newValue) => setPostType(newValue)}
      sx={{ mb: 2 }}
      variant="fullWidth"
    >
      <Tab value="post" label="Post" />
      <Tab value="article" label="Article" />
      <Tab value="event" label="Event" />
    </Tabs>
  );

  const AudienceSelector = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Chip
        icon={<Public />}
        label="Anyone"
        variant={audience === 'public' ? 'filled' : 'outlined'}
        onClick={() => setAudience('public')}
        size="small"
        color="primary"
      />
      <Chip
        icon={<Group />}
        label="Connections"
        variant={audience === 'connections' ? 'filled' : 'outlined'}
        onClick={() => setAudience('connections')}
        size="small"
      />
    </Box>
  );

  const ImagePreviews = () => (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
      {imagePreviews.map((preview, index) => (
        <Box key={index} sx={{ position: 'relative' }}>
          <img
            src={preview}
            alt={`Preview ${index}`}
            style={{
              width: 100,
              height: 100,
              objectFit: 'cover',
              borderRadius: 8,
            }}
          />
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'error.main',
              color: 'white',
              '&:hover': { bgcolor: 'error.dark' }
            }}
            onClick={() => removeImage(index)}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      ))}
    </Box>
  );

  const ActionButtons = () => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Add photo">
          <IconButton 
            color="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
          >
            <AddPhotoAlternate />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Add video">
          <IconButton color="primary" disabled>
            <Videocam />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Add event">
          <IconButton color="primary" disabled>
            <Event />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Add article">
          <IconButton color="primary" disabled>
            <Article />
          </IconButton>
        </Tooltip>

        <Tooltip title="Add emoji">
          <IconButton color="primary">
            <EmojiEmotions />
          </IconButton>
        </Tooltip>
      </Box>

      <Button 
        type="submit" 
        variant="contained"
        disabled={(!content.trim() && images.length === 0) || isSubmitting}
        startIcon={isSubmitting ? <CloudUpload /> : null}
      >
        {isSubmitting ? 'Posting...' : 'Post'}
      </Button>
    </Box>
  );

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Avatar 
          src={auth.currentUser?.photoURL} 
          alt={auth.currentUser?.displayName}
          sx={{ 
            width: 56, 
            height: 56,
            border: `2px solid ${theme.palette.primary.main}`
          }}
        />
        
        <form onSubmit={handleSubmit} style={{ flexGrow: 1 }}>
          <PostTypeTabs />
          <AudienceSelector />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder={
              postType === 'article' ? 'Write an article...' :
              postType === 'event' ? 'Share an event...' :
              'Share your professional updates, ask questions, or celebrate achievements...'
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '1.1rem'
              }
            }}
          />

          <ImagePreviews />
          
          {isSubmitting && (
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ mb: 2, height: 4, borderRadius: 2 }}
            />
          )}

          <ActionButtons />

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </form>
      </Box>

      {/* Progress Dialog */}
      <Dialog open={isSubmitting} maxWidth="sm" fullWidth>
        <DialogTitle>Creating Post</DialogTitle>
        <DialogContent>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            {progress < 50 ? 'Uploading images...' : 'Publishing post...'}
          </Typography>
        </DialogContent>
      </Dialog>
    </Paper>
  );
}