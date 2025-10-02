import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  Box, Paper, Typography, TextField, Button, Chip,
  Grid, Card, CardContent, Avatar, MenuItem, Slider,
  Tabs, Tab, List, ListItem, ListItemAvatar, ListItemText,
  Divider, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import ArticleIcon from '@mui/icons-material/Article';
import ClearIcon from '@mui/icons-material/Clear';

export default function AdvancedSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    type: 'all',
    category: '',
    location: '',
    skills: [],
    experience: [0, 20],
    salary: [0, 200000],
    company: ''
  });
  const [results, setResults] = useState({ users: [], jobs: [], posts: [] });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim() && filters.type === 'all') {
      setResults({ users: [], jobs: [], posts: [] });
      return;
    }

    const searchAll = async () => {
      try {
        // Search Users
        const usersQuery = query(
          collection(db, 'users'),
          where('name', '>=', searchTerm),
          where('name', '<=', searchTerm + '\uf8ff')
        );
        
        // Search Jobs
        const jobsQuery = query(
          collection(db, 'jobs'),
          where('title', '>=', searchTerm),
          where('title', '<=', searchTerm + '\uf8ff')
        );
        
        // Search Posts
        const postsQuery = query(
          collection(db, 'posts'),
          where('content', '>=', searchTerm),
          where('content', '<=', searchTerm + '\uf8ff')
        );

        const [usersSnapshot, jobsSnapshot, postsSnapshot] = await Promise.all([
          getDocs(usersQuery),
          getDocs(jobsQuery),
          getDocs(postsQuery)
        ]);

        const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'user' }));
        const jobsData = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'job' }));
        const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'post' }));

        // Apply additional filters
        const filteredUsers = usersData.filter(user =>
          (!filters.location || user.location?.toLowerCase().includes(filters.location.toLowerCase())) &&
          (!filters.category || user.category === filters.category) &&
          (filters.skills.length === 0 || user.skills?.some(skill => filters.skills.includes(skill)))
        );

        const filteredJobs = jobsData.filter(job =>
          (!filters.location || job.location?.toLowerCase().includes(filters.location.toLowerCase())) &&
          (!filters.category || job.category === filters.category) &&
          (!filters.company || job.company?.toLowerCase().includes(filters.company.toLowerCase())) &&
          (job.salary >= filters.salary[0] && job.salary <= filters.salary[1])
        );

        const filteredPosts = postsData.filter(post =>
          (!filters.category || post.category === filters.category)
        );

        setResults({
          users: filteredUsers,
          jobs: filteredJobs,
          posts: filteredPosts
        });
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const debounceTimer = setTimeout(searchAll, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filters]);

  const addSkill = (skill) => {
    if (skill.trim() && !filters.skills.includes(skill.trim())) {
      setFilters({...filters, skills: [...filters.skills, skill.trim()]});
    }
  };

  const removeSkill = (skillToRemove) => {
    setFilters({...filters, skills: filters.skills.filter(skill => skill !== skillToRemove)});
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      category: '',
      location: '',
      skills: [],
      experience: [0, 20],
      salary: [0, 200000],
      company: ''
    });
  };

  const renderUserResults = () => (
    <List>
      {results.users.map(user => (
        <ListItem key={user.id} alignItems="flex-start">
          <ListItemAvatar>
            <Avatar src={user.photoURL} alt={user.name} />
          </ListItemAvatar>
          <ListItemText
            primary={user.name}
            secondary={
              <>
                <Typography variant="body2" color="text.primary">
                  {user.headline}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.location}
                </Typography>
                {user.skills && (
                  <Box sx={{ mt: 1 }}>
                    {user.skills.slice(0, 4).map(skill => (
                      <Chip key={skill} label={skill} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                )}
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );

  const renderJobResults = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {results.jobs.map(job => (
        <Card key={job.id}>
          <CardContent>
            <Typography variant="h6" color="primary">{job.title}</Typography>
            <Typography variant="subtitle1">{job.company} • {job.location}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>{job.description?.substring(0, 200)}...</Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={job.type} size="small" />
              {job.salary && <Chip label={`$${job.salary.toLocaleString()}`} size="small" color="success" />}
              <Chip label={job.category} size="small" variant="outlined" />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderPostResults = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {results.posts.map(post => (
        <Card key={post.id}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar src={post.userPhoto} sx={{ mr: 2 }} />
              <Box>
                <Typography variant="subtitle1">{post.userName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(post.createdAt?.toDate()).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1">{post.content}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        <SearchIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
        Advanced Search
      </Typography>

      {/* Search Bar */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search professionals, jobs, posts, companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={clearFilters}
          >
            Clear
          </Button>
        </Box>

        {/* Advanced Filters */}
        {showFilters && (
          <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="technology">Technology</MenuItem>
                  <MenuItem value="design">Design</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="education">Education</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company"
                  placeholder="Filter by company"
                  value={filters.company}
                  onChange={(e) => setFilters({...filters, company: e.target.value})}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Add Skill"
                  placeholder="Type and press enter"
                  onKeyPress={(e) => e.key === 'Enter' && addSkill(e.target.value)}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {filters.skills.map(skill => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      onDelete={() => removeSkill(skill)}
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Salary Range (${filters.salary[0].toLocaleString()} - ${filters.salary[1].toLocaleString()})</Typography>
                <Slider
                  value={filters.salary}
                  onChange={(e, newValue) => setFilters({...filters, salary: newValue})}
                  valueLabelDisplay="auto"
                  min={0}
                  max={200000}
                  step={10000}
                  valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Results Tabs */}
      <Paper>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<PersonIcon />} label={`People (${results.users.length})`} />
          <Tab icon={<WorkIcon />} label={`Jobs (${results.jobs.length})`} />
          <Tab icon={<ArticleIcon />} label={`Posts (${results.posts.length})`} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderUserResults()}
          {activeTab === 1 && renderJobResults()}
          {activeTab === 2 && renderPostResults()}

          {activeTab === 0 && results.users.length === 0 && searchTerm && (
            <Typography color="text.secondary" align="center">
              No users found matching your search
            </Typography>
          )}

          {activeTab === 1 && results.jobs.length === 0 && searchTerm && (
            <Typography color="text.secondary" align="center">
              No jobs found matching your search
            </Typography>
          )}

          {activeTab === 2 && results.posts.length === 0 && searchTerm && (
            <Typography color="text.secondary" align="center">
              No posts found matching your search
            </Typography>
          )}

          {!searchTerm && (
            <Typography color="text.secondary" align="center">
              Start typing to search across the platform
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}