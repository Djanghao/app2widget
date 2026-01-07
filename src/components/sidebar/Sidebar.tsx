'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
  Divider,
  Skeleton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';

interface ChatSession {
  id: string;
  inputContent: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SidebarProps {
  open: boolean
  onToggle: () => void
  currentSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewChat: () => void
  onSettingsClick: () => void
}

export default function Sidebar({
  open,
  onToggle,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  onSettingsClick
}: SidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false)

  const fetchSessions = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch('/api/sessions', { cache: 'no-store', signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions (${response.status})`);
      }
      const data = await response.json();
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Failed to fetch sessions:', error);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetchSessions(controller.signal);
    return () => controller.abort();
  }, [fetchSessions, open, currentSessionId]);

  const getSessionTitle = (session: ChatSession) => {
    const content = session.inputContent;
    if (content.length > 30) {
      return content.substring(0, 30) + '...';
    }
    return content || 'New Chat';
  };

  const getSessionDate = (session: ChatSession) => {
    const dateString = session.updatedAt || session.createdAt;
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const handleDeleteClick = useCallback((sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    const targetId = sessionToDelete;
    setSessions((prev) => prev.filter((session) => session.id !== targetId));

    try {
      const response = await fetch(`/api/sessions/${targetId}`, {
        method: 'DELETE',
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`Failed to delete session (${response.status})`);
      }

      // If deleting current session, create new session
      if (currentSessionId === targetId) {
        onNewChat();
      }

      // Refetch sessions list
      await fetchSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
      await fetchSessions();
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleClearAllClick = useCallback(() => {
    if (sessions.length === 0) return;
    setClearAllDialogOpen(true);
  }, [sessions.length]);

  const handleClearAllConfirm = async () => {
    const sessionIds = sessions.map((session) => session.id);
    setSessions([]);

    try {
      // Delete all sessions
      await Promise.allSettled(
        sessionIds.map((sessionId) =>
          fetch(`/api/sessions/${sessionId}`, { method: 'DELETE', cache: 'no-store' })
        )
      );

      // Create new session
      onNewChat();

      // Refetch sessions list
      await fetchSessions();
    } catch (error) {
      console.error('Failed to clear all sessions:', error);
      await fetchSessions();
    } finally {
      setClearAllDialogOpen(false);
    }
  };

  const drawerContent = (
    <Box
      sx={{
        width: 260,
        height: '100%',
        bgcolor: '#202123',
        color: '#ececec',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            onNewChat()
            onToggle()
          }}
          sx={{
            borderColor: 'rgba(255,255,255,0.2)',
            color: '#ececec',
            textTransform: 'none',
            justifyContent: 'flex-start',
            fontSize: 14,
            py: 1.25,
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.05)'
            }
          }}
        >
          New chat
        </Button>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Session List */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255,255,255,0.3)',
          },
        }}
      >
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={44}
                sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}
              />
            ))}
          </Box>
        ) : (
          <List sx={{ py: 1 }}>
            {sessions.map((session) => (
              <ListItem key={session.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={currentSessionId === session.id}
                  onClick={() => {
                    onSessionSelect(session.id)
                    onToggle()
                  }}
                  sx={{
                    borderRadius: 1,
                    py: 1.5,
                    px: 2,
                    display: 'flex',
                    position: 'relative',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.15)'
                      }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <ChatIcon sx={{ mr: 1.5, fontSize: 18, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
                    <ListItemText
                      primary={getSessionTitle(session)}
                      secondary={getSessionDate(session)}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: currentSessionId === session.id ? 500 : 400,
                        color: '#ececec',
                        noWrap: true
                      }}
                      secondaryTypographyProps={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.5)'
                      }}
                    />
                  </Box>

                  {/* Delete button - show on hover */}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteClick(session.id);
                    }}
                    sx={{
                      opacity: 0,
                      transition: 'opacity 0.15s',
                      '.MuiListItemButton-root:hover &': {
                        opacity: 1
                      },
                      color: 'rgba(255,255,255,0.5)',
                      '&:hover': {
                        color: '#ef4444',
                        bgcolor: 'rgba(239,68,68,0.1)'
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              </ListItem>
            ))}
            {sessions.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="rgba(255,255,255,0.5)">
                  No chat history yet
                </Typography>
              </Box>
            )}
          </List>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleClearAllClick}
          disabled={sessions.length === 0}
          sx={{
            borderRadius: 1,
            py: 1.5,
            px: 2,
            mb: 1,
            '&:hover': {
              bgcolor: sessions.length === 0 ? 'transparent' : 'rgba(239,68,68,0.1)'
            },
            '&:disabled': {
              opacity: 0.5
            }
          }}
        >
          <DeleteSweepIcon sx={{ mr: 1.5, fontSize: 18, color: sessions.length === 0 ? 'rgba(255,255,255,0.3)' : '#ef4444' }} />
          <ListItemText
            primary="Clear All"
            primaryTypographyProps={{
              fontSize: 14,
              color: sessions.length === 0 ? 'rgba(255,255,255,0.3)' : '#ef4444'
            }}
          />
        </ListItemButton>

        <ListItemButton
          onClick={() => {
            onSettingsClick()
            onToggle()
          }}
          sx={{
            borderRadius: 1,
            py: 1.5,
            px: 2,
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.05)'
            }
          }}
        >
          <SettingsIcon sx={{ mr: 1.5, fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
          <ListItemText
            primary="Settings"
            primaryTypographyProps={{
              fontSize: 14,
              color: '#ececec'
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 260,
            border: 'none'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#202123',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle sx={{ color: '#ececec' }}>Delete Chat?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
            This will permanently delete this conversation. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: '#ececec',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              color: 'white',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#dc2626'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={clearAllDialogOpen}
        onClose={() => setClearAllDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#202123',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle sx={{ color: '#ececec' }}>Clear All Conversations?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)' }}>
            This will permanently delete all {sessions.length} conversation{sessions.length > 1 ? 's' : ''}. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setClearAllDialogOpen(false)}
            sx={{
              color: '#ececec',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClearAllConfirm}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              color: 'white',
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#dc2626'
              }
            }}
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
