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
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface MonitorStatus {
  isRunning: boolean;
  isAutoStarted: boolean;
  autoStartEnabled: boolean;
  chatExperiences: Array<{
    id: string;
    name: string;
    appName: string;
  }>;
  experienceCount: number;
  lastError?: string;
  lastRestart?: string;
  uptime?: number;
}

export default function MessageMonitor() {
  const [status, setStatus] = useState<MonitorStatus>({
    isRunning: false,
    isAutoStarted: false,
    autoStartEnabled: true,
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

  // Force restart monitoring
  const forceRestart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'force-restart' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
        setError('✅ Monitoring force restarted successfully');
      } else {
        setError(data.error || 'Failed to force restart');
      }
    } catch {
      setError('Failed to force restart monitoring');
    } finally {
      setLoading(false);
    }
  };

  // Reset restart attempts
  const resetRestartAttempts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset-restart-attempts' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
        setError('✅ Restart attempts reset successfully');
      } else {
        setError(data.error || 'Failed to reset restart attempts');
      }
    } catch {
      setError('Failed to reset restart attempts');
    } finally {
      setLoading(false);
    }
  };

  // Load status on component mount and refresh every 30 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
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
          Automatic monitoring of chat experiences for role mentions (@rolename). 
          The system runs continuously and auto-restarts if issues occur.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Status Display */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          {status.isRunning ? (
            <Chip
              icon={<CheckCircleIcon />}
              label="Monitoring Active"
              color="success"
              variant="filled"
            />
          ) : (
            <Chip
              icon={<ErrorIcon />}
              label="Monitoring Stopped"
              color="error"
              variant="filled"
            />
          )}
          
          {status.isAutoStarted && (
            <Chip
              label="Auto-started"
              color="info"
              size="small"
              variant="outlined"
            />
          )}

          {loading && <CircularProgress size={20} />}
        </Box>

        {/* System Health Info */}
        {status.lastError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <WarningIcon />
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  Last Error:
                </Typography>
                <Typography variant="body2">
                  {status.lastError}
                </Typography>
                {status.lastRestart && (
                  <Typography variant="caption" color="text.secondary">
                    Auto-restarted: {status.lastRestart}
                  </Typography>
                )}
              </Box>
            </Box>
          </Alert>
        )}

        {status.uptime && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Uptime: {Math.floor(status.uptime / 1000 / 60)} minutes
            </Typography>
          </Box>
        )}

        {/* Admin Controls */}
        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="outlined"
            color="primary"
            onClick={forceRestart}
            disabled={loading}
            size="small"
          >
            Force Restart
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={resetRestartAttempts}
            disabled={loading}
            size="small"
          >
            Reset Attempts
          </Button>
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
              <li>System automatically starts when the server starts</li>
              <li>Continuously monitors all chat experiences for @rolename mentions</li>
              <li>Auto-restarts if monitoring stops due to errors</li>
              <li>Only admins can trigger role notifications</li>
              <li>No manual intervention required</li>
            </ul>
          </Typography>
        </Box>

        {status.isRunning && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <NotificationsIcon />
              <Typography variant="body2">
                Monitoring is active and will continue running automatically.
              </Typography>
            </Box>
          </Alert>
        )}

        {!status.isRunning && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <WarningIcon />
              <Typography variant="body2">
                Monitoring is not running. The system will attempt to restart automatically.
              </Typography>
            </Box>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
