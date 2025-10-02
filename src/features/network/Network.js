import { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import { People, Group, PersonAdd, ConnectWithoutContact } from '@mui/icons-material';
import UserSearch from './UserSearch';
import ConnectionsList from './ConnectionsList';

export default function Network() {
  const [activeTab, setActiveTab] = useState(0);

  // Add this to track renders
  useEffect(() => {
    console.log('Network component rendered');
  });

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
        My Network
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<PersonAdd />} label="Find Connections" />
          <Tab icon={<Group />} label="My Connections" />
          <Tab icon={<ConnectWithoutContact />} label="Connection Requests" />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <UserSearch />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ConnectionsList />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6" gutterBottom>Connection Requests</Typography>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ConnectWithoutContact sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography>No pending connection requests</Typography>
        </Paper>
      </TabPanel>
    </Box>
  );
}