import { useState, useEffect } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, doc, updateDoc, serverTimestamp, getDoc,
  setDoc, arrayUnion, getDocs
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { 
  Box, List, ListItem, TextField, Button, Avatar, Paper, 
  Typography, IconButton, InputAdornment, Badge, Divider,
  Chip, alpha, useTheme
} from '@mui/material';
import { 
  Send, Search, Message, Add, PersonAdd, 
  Schedule, Check, CheckCircle
} from '@mui/icons-material';

export default function ChatSystem() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  
  const theme = useTheme();

  // Fetch conversations for current user
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setConversations(convos);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const q = query(
      collection(db, 'chats', selectedConversation.id, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setMessages(msgs);
      
      // Mark messages as read
      markMessagesAsRead(msgs);
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  // Fetch users for new chat
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== auth.currentUser.uid);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    if (showNewChat) {
      fetchUsers();
    }
  }, [showNewChat]);

  const markMessagesAsRead = async (msgs) => {
    const unreadMessages = msgs.filter(msg => 
     !msg.read && msg.sender !== auth.currentUser.uid
    );

    for (const msg of unreadMessages) {
      try {
        await updateDoc(doc(db, 'chats', selectedConversation.id, 'messages', msg.id), {
          read: true,
          readTime: serverTimestamp()
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await addDoc(collection(db, 'chats', selectedConversation.id, 'messages'), {
        text: newMessage.trim(),
        sender: auth.currentUser.uid,
        senderName: auth.currentUser.displayName,
        timestamp: serverTimestamp(),
        read: false
      });

      // Update conversation last message
      await updateDoc(doc(db, 'chats', selectedConversation.id), {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp(),
        lastMessageSender: auth.currentUser.uid
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startNewChat = async (receiver) => {
    const chatId = [auth.currentUser.uid, receiver.id].sort().join('_');
    
    try {
      // Check if chat already exists
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      
      if (!chatDoc.exists()) {
        // Create new chat
        await setDoc(doc(db, 'chats', chatId), {
          participants: [auth.currentUser.uid, receiver.id],
          participantNames: [auth.currentUser.displayName, receiver.name],
          participantPhotos: [auth.currentUser.photoURL, receiver.photoURL],
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      }

      // Select the chat
      const newConversation = {
        id: chatId,
        participants: [auth.currentUser.uid, receiver.id],
        participantNames: [auth.currentUser.displayName, receiver.name],
        participantPhotos: [auth.currentUser.photoURL, receiver.photoURL]
      };
      
      setSelectedConversation(newConversation);
      setShowNewChat(false);
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation.participants) return null;
    
    const otherParticipantIndex = conversation.participants.findIndex(
      participant => participant !== auth.currentUser.uid
    );
    
    return {
      name: conversation.participantNames?.[otherParticipantIndex] || 'Unknown User',
      photoURL: conversation.participantPhotos?.[otherParticipantIndex]
    };
  };

  const getUnreadCount = (conversation) => {
    // This would require additional logic to track unread messages
    // For now, return a simple count based on last message sender
    if (conversation.lastMessageSender !== auth.currentUser.uid) {
      return 1;
    }
    return 0;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(convo => {
    const otherParticipant = getOtherParticipant(convo);
    return otherParticipant.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
        <Typography>Loading messages...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '75vh', bgcolor: 'background.default', borderRadius: 2, overflow: 'hidden' }}>
      {/* Conversations Sidebar */}
      <Box sx={{ 
        width: 350, 
        borderRight: 1, 
        borderColor: 'divider', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.paper'
      }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Messages</Typography>
            <IconButton 
              onClick={() => setShowNewChat(!showNewChat)}
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' }
              }}
            >
              <Add />
            </IconButton>
          </Box>
          
          <TextField
            fullWidth
            size="small"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="disabled" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* New Chat User List */}
        {showNewChat && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', maxHeight: 200, overflow: 'auto' }}>
            <Typography variant="subtitle2" sx={{ p: 2, pb: 1, color: 'text.secondary' }}>
              Start new conversation
            </Typography>
            <List sx={{ py: 0 }}>
              {filteredUsers.slice(0, 5).map(user => (
                <ListItem
                  button
                  key={user.id}
                  onClick={() => startNewChat(user)}
                  sx={{ py: 1 }}
                >
                  <Avatar src={user.photoURL} sx={{ mr: 2, width: 40, height: 40 }} />
                  <Box>
                    <Typography variant="subtitle2">{user.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.headline || 'Professional connection'}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Conversations List */}
        <List sx={{ flexGrow: 1, overflow: 'auto', py: 0 }}>
          {filteredConversations.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Message sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">No conversations yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Start a new conversation to connect with your network
              </Typography>
            </Box>
          ) : (
            filteredConversations.map(conversation => {
              const otherParticipant = getOtherParticipant(conversation);
              const unreadCount = getUnreadCount(conversation);
              
              return (
                <ListItem
                  button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  selected={selectedConversation?.id === conversation.id}
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    py: 2,
                    '&:hover': { bgcolor: 'action.hover' },
                    bgcolor: selectedConversation?.id === conversation.id ? 
                      alpha(theme.palette.primary.main, 0.08) : 'transparent'
                  }}
                >
                  <Badge
                    overlap="circular"
                    badgeContent={unreadCount}
                    color="error"
                    sx={{ mr: 2 }}
                  >
                    <Avatar src={otherParticipant.photoURL} sx={{ width: 50, height: 50 }} />
                  </Badge>
                  
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" noWrap>
                        {otherParticipant.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(conversation.lastMessageTime)}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      noWrap
                      sx={{ 
                        fontWeight: unreadCount > 0 ? 600 : 400,
                        color: unreadCount > 0 ? 'text.primary' : 'text.secondary'
                      }}
                    >
                      {conversation.lastMessage || 'Start a conversation'}
                    </Typography>
                  </Box>
                </ListItem>
              );
            })
          )}
        </List>
      </Box>

      {/* Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <Paper sx={{ 
              p: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={getOtherParticipant(selectedConversation).photoURL} 
                  sx={{ mr: 2, width: 40, height: 40 }}
                />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {getOtherParticipant(selectedConversation).name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Online
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Messages Area */}
            <Box sx={{ 
              flexGrow: 1, 
              p: 2, 
              overflow: 'auto', 
              bgcolor: 'grey.50',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {messages.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  color: 'text.secondary'
                }}>
                  <Message sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No messages yet
                  </Typography>
                  <Typography>
                    Start the conversation by sending a message
                  </Typography>
                </Box>
              ) : (
                messages.map((message, index) => {
                  const isOwnMessage = message.sender === auth.currentUser.uid;
                  const showAvatar = index === 0 || messages[index - 1].sender !== message.sender;
                  
                  return (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                        mb: 0.5,
                        alignItems: 'flex-end'
                      }}
                    >
                      {!isOwnMessage && showAvatar && (
                        <Avatar 
                          src={getOtherParticipant(selectedConversation).photoURL}
                          sx={{ width: 32, height: 32, mr: 1, mb: 0.5 }}
                        />
                      )}
                      
                      {!isOwnMessage && !showAvatar && (
                        <Box sx={{ width: 32, mr: 1 }} />
                      )}
                      
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                          maxWidth: '70%'
                        }}
                      >
                        <Paper
                          sx={{
                            p: 1.5,
                            bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
                            color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                            borderRadius: 2,
                            borderBottomRightRadius: isOwnMessage ? 4 : 12,
                            borderBottomLeftRadius: isOwnMessage ? 12 : 4
                          }}
                        >
                          <Typography variant="body2">{message.text}</Typography>
                        </Paper>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {formatTime(message.timestamp)}
                          </Typography>
                          {isOwnMessage && (
                            message.read ? (
                              <CheckCircle sx={{ fontSize: 14, opacity: 0.7 }} />
                            ) : (
                              <Check sx={{ fontSize: 14, opacity: 0.7 }} />
                            )
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>

            {/* Message Input */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  multiline
                  maxRows={4}
                  variant="outlined"
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  sx={{ 
                    minWidth: 'auto', 
                    px: 2, 
                    py: 1,
                    borderRadius: 2
                  }}
                >
                  <Send />
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: 'text.secondary',
            textAlign: 'center',
            p: 4
          }}>
            <Message sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              Welcome to Messages
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Select a conversation from the sidebar or start a new one to begin messaging
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<PersonAdd />}
              onClick={() => setShowNewChat(true)}
            >
              Start New Conversation
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}