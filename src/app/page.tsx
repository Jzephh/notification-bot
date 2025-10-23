'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Notifications as NotificationsIcon,
  AdminPanelSettings as AdminIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import AdminSetup from '@/components/AdminSetup';
import MessageMonitor from '@/components/MessageMonitor';
import '@/lib/auto-start'; // Auto-start monitoring when server starts

interface User {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  isAdmin: boolean;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

interface Notification {
  id: string;
  roleName: string;
  message: string;
  sentBy: string;
  createdAt: string;
  isRead: boolean;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // Form states
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#1976d2');
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Role editing states
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editRoleColor, setEditRoleColor] = useState('#1976d2');

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchRoles();
      fetchNotifications();
      if (user.isAdmin) {
        fetchUsers();
      }
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setError('Failed to authenticate user');
      }
    } catch {
      setError('Network error');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      } else {
        setError('Failed to fetch roles');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch {
      setError('Network error');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
      const data = await response.json();
        setNotifications(data.notifications);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch {
      setError('Network error');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          action: 'mark-read'
        })
      });

      if (response.ok) {
        // Update local state to mark as read
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
      }
    } catch {
      // Silently fail - don't show error for read status
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId: 'all', // Special ID for mark-all-read
          action: 'mark-all-read'
        })
      });

      if (response.ok) {
        // Update local state to mark all as read
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setSuccess('All notifications marked as read');
      }
    } catch {
      setError('Failed to mark all notifications as read');
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDescription,
          color: newRoleColor
        })
      });

      if (response.ok) {
        setSuccess('Role created successfully!');
        setCreateRoleOpen(false);
        setNewRoleName('');
        setNewRoleDescription('');
        setNewRoleColor('#1976d2');
        fetchRoles();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create role');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleAssignRole = async (targetUserId: string, roleName: string, action: 'assign' | 'remove') => {
    try {
      const response = await fetch('/api/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          roleName,
          action
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`${action === 'assign' ? 'Assigned' : 'Removed'} @${roleName} ${action === 'assign' ? 'to' : 'from'} ${data.user.name}`);
        fetchUsers(); // Refresh users list
        fetchUser(); // Refresh current user
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${action} role`);
      }
    } catch {
      setError('Network error');
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setEditRoleDescription(role.description);
    setEditRoleColor(role.color);
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const response = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: editingRole._id,
          name: editRoleName,
          description: editRoleDescription,
          color: editRoleColor
        })
      });

      if (response.ok) {
        setSuccess('Role updated successfully!');
        setEditingRole(null);
        setEditRoleName('');
        setEditRoleDescription('');
        setEditRoleColor('#1976d2');
        fetchRoles();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update role');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This will remove it from all users.')) {
      return;
    }

    try {
      const response = await fetch(`/api/roles?roleId=${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Role deleted successfully!');
        fetchRoles();
        fetchUsers(); // Refresh users to show updated roles
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete role');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?notificationId=${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Notification deleted successfully!');
        fetchNotifications();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete notification');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleSendNotification = async () => {
    if (!selectedRole || !notificationMessage.trim()) return;

    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: selectedRole.name,
          message: notificationMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Notification sent to ${data.notification.subscriberCount} subscribers!`);
        setNotifyDialogOpen(false);
        setNotificationMessage('');
        setSelectedRole(null);
        fetchNotifications(); // Refresh notifications for all users
      } else {
      const data = await response.json();
        setError(data.error || 'Failed to send notification');
      }
    } catch {
      setError('Network error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
    );
  }

  if (error && !user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box mt={4}>
          <AdminSetup />
        </Box>
      </Container>
    );
  }

  // Show admin setup only if user doesn't exist (first time setup)
  if (!user) {
    return <AdminSetup />;
  }

  return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <NotificationsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            Role Notifications
        </Typography>
      </Box>

      {user && (
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={user.avatarUrl} sx={{ width: 40, height: 40 }}>
              {user.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{user.username}
              </Typography>
            </Box>
            {user.isAdmin && (
              <Chip icon={<AdminIcon />} label="Admin" color="primary" size="small" />
            )}
          </Box>
        )}
      </Box>

      {/* User's Assigned Roles */}
      {user && user.roles.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Assigned Roles
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {user.roles.map((roleName) => (
                <Chip
                  key={roleName}
                  label={`@${roleName}`}
                  color="primary"
                  variant="outlined"
                  icon={<CheckIcon />}
                />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You will receive notifications when these roles are mentioned.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* User's Notifications */}
      {notifications.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" gutterBottom>
                Your Notifications
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <Chip 
                    label={`${notifications.filter(n => !n.isRead).length} unread`}
                    color="error"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={markAllNotificationsAsRead}
                >
                  Mark All Read
                </Button>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Notifications for roles you are assigned to:
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  variant="outlined" 
                  sx={{ 
                    p: 2,
                    borderLeft: notification.isRead ? 'none' : '4px solid',
                    borderLeftColor: 'primary.main',
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Chip
                          label={`@${notification.roleName}`} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                        {!notification.isRead && (
                          <Chip
                            label="NEW"
                            size="small"
                            color="error"
                            variant="filled"
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography 
                        variant="body1"
                        sx={{ 
                          fontWeight: notification.isRead ? 'normal' : 'bold'
                        }}
                      >
                        {notification.message}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      {!notification.isRead && (
                        <IconButton
                          size="small"
                          onClick={() => markNotificationAsRead(notification.id)}
                          color="primary"
                          title="Mark as read"
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteNotification(notification.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Roles Grid */}
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
        {roles.map((role) => (
          <Card key={role._id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Chip
                    label={`@${role.name}`}
                    sx={{ 
                      backgroundColor: role.color,
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary">
                      Role
                    </Typography>
                    {user?.isAdmin && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleEditRole(role)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRole(role._id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
      </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {role.description || 'No description'}
            </Typography>

                <Box display="flex" gap={1}>
            {user?.isAdmin && (
              <Button
                variant="contained"
                      size="small"
                      onClick={() => {
                        setSelectedRole(role);
                        setNotifyDialogOpen(true);
                      }}
                      startIcon={<SendIcon />}
                      fullWidth
                    >
                      Send Notification
              </Button>
            )}
          </Box>
              </CardContent>
            </Card>
            ))}
          </Box>

      {/* User Management Section for Admins */}
      {user?.isAdmin && allUsers.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Assign roles to users. Users with roles will receive notifications when those roles are mentioned.
            </Typography>
            
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Current Roles</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allUsers.map((targetUser) => (
                    <TableRow key={targetUser.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar src={targetUser.avatarUrl} sx={{ width: 32, height: 32 }}>
                            {targetUser.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {targetUser.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{targetUser.username}
                </Typography>
                            {targetUser.isAdmin && (
                              <Chip label="Admin" size="small" color="primary" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {targetUser.roles.length > 0 ? (
                            targetUser.roles.map((roleName) => (
                              <Chip
                                key={roleName}
                                label={`@${roleName}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                onDelete={() => handleAssignRole(targetUser.id, roleName, 'remove')}
                              />
                            ))
                          ) : (
                <Typography variant="body2" color="text.secondary">
                              No roles assigned
                </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {roles.map((role) => (
                            <Tooltip key={role._id} title={`Assign @${role.name} to ${targetUser.name}`}>
                              <IconButton
                                size="small"
                                onClick={() => handleAssignRole(targetUser.id, role.name, 'assign')}
                                disabled={targetUser.roles.includes(role.name)}
                                color={targetUser.roles.includes(role.name) ? "default" : "primary"}
                              >
                                <Chip
                                  label={`@${role.name}`}
                                  size="small"
                                  color={targetUser.roles.includes(role.name) ? "default" : "primary"}
                                  variant={targetUser.roles.includes(role.name) ? "filled" : "outlined"}
                                />
                              </IconButton>
                            </Tooltip>
                          ))}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
              </CardContent>
            </Card>
          )}

      {/* Message Monitoring Section for Admins */}
      {user?.isAdmin && (
        <Box sx={{ mt: 4 }}>
          <MessageMonitor />
        </Box>
      )}

      {/* Create Role Button for Admins */}
      {user?.isAdmin && (
        <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setCreateRoleOpen(true)}
          >
            Create New Role
              </Button>
        </Box>
      )}

      {/* Create Role Dialog */}
      <Dialog open={createRoleOpen} onClose={() => setCreateRoleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            variant="outlined"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="e.g., flips, green, yellow"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newRoleDescription}
            onChange={(e) => setNewRoleDescription(e.target.value)}
            placeholder="Describe what this role is for..."
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Color"
            type="color"
            fullWidth
            variant="outlined"
            value={newRoleColor}
            onChange={(e) => setNewRoleColor(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoleOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained">Create Role</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={notifyDialogOpen} onClose={() => setNotifyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Send Notification to @{selectedRole?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            This will notify all users assigned to @{selectedRole?.name}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Message"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            placeholder="Type your notification message here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotifyDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSendNotification} 
            variant="contained"
            disabled={!notificationMessage.trim()}
          >
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onClose={() => setEditingRole(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Role: @{editingRole?.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            variant="outlined"
            value={editRoleName}
            onChange={(e) => setEditRoleName(e.target.value)}
            placeholder="e.g., flips"
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={editRoleDescription}
            onChange={(e) => setEditRoleDescription(e.target.value)}
            placeholder="Describe what this role is for..."
          />
          <TextField
            margin="dense"
            label="Color"
            type="color"
            fullWidth
            variant="outlined"
            value={editRoleColor}
            onChange={(e) => setEditRoleColor(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingRole(null)}>Cancel</Button>
          <Button onClick={handleUpdateRole} variant="contained">Update Role</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
      </Container>
  );
}