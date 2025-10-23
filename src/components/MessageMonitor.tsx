'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

interface MonitorStatus {
  isRunning: boolean;
  chatExperiences: Array<{
    id: string;
    name: string;
    appName: string;
  }>;
  experienceCount: number;
}

export default function MessageMonitor() {
  const [status, setStatus] = useState<MonitorStatus>({
    isRunning: false,
    chatExperiences: [],
    experienceCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current status
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/monitor');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch {
      setError('Failed to fetch monitoring status');
    } finally {
      setLoading(false);
    }
  };

  // Start monitoring
  const startMonitoring = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.error || 'Failed to start monitoring');
      }
    } catch {
      setError('Failed to start monitoring');
    } finally {
      setLoading(false);
    }
  };

  // Stop monitoring
  const stopMonitoring = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stop' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.error || 'Failed to stop monitoring');
      }
    } catch {
      setError('Failed to stop monitoring');
    } finally {
      setLoading(false);
    }
  };

  // Clear message tracking
  const clearTracking = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setError(null);
        // Show success message
        setError('✅ Message tracking cleared - will start fresh on next poll');
      } else {
        setError(data.error || 'Failed to clear tracking');
      }
    } catch {
      setError('Failed to clear tracking');
    } finally {
      setLoading(false);
    }
  };

  // Load status on component mount
  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h2">
            Message Monitoring
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchStatus}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={3}>
          Monitor chat experiences for role mentions (@rolename). When admins mention roles in chat, 
          notifications are automatically sent to users with those roles.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <FormControlLabel
            control={
              <Switch
                checked={status.isRunning}
                onChange={status.isRunning ? stopMonitoring : startMonitoring}
                disabled={loading}
                color="primary"
              />
            }
            label={
              <Typography variant="body1">
                {status.isRunning ? 'Monitoring Active' : 'Start Monitoring'}
              </Typography>
            }
          />
          
          {loading && <CircularProgress size={20} />}
        </Box>

        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="outlined"
            color="warning"
            onClick={clearTracking}
            disabled={loading}
            size="small"
          >
            Clear Message Tracking
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Reset tracking to start fresh (useful after server restart)
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Chat Experiences ({status.experienceCount})
          </Typography>
          
          {status.chatExperiences.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No chat experiences found. Make sure you have chat apps configured in your Whop company.
            </Typography>
          ) : (
            <Box display="flex" flexWrap="wrap" gap={1}>
              {status.chatExperiences.map((experience) => (
                <Chip
                  key={experience.id}
                  icon={<ChatIcon />}
                  label={experience.name}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          )}
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            How it works:
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Admins can mention roles in chat using @rolename</li>
              <li>System automatically detects these mentions</li>
              <li>Notifications are sent to all users with the mentioned role</li>
              <li>Only admins can trigger role notifications</li>
            </ul>
          </Typography>
        </Box>

        {status.isRunning && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <NotificationsIcon />
              <Typography variant="body2">
                Monitoring is active. Role mentions in chat will trigger notifications.
              </Typography>
            </Box>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
