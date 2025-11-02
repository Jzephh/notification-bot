'use client';

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function MUIThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mode } = useTheme();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#6366f1',
            light: '#818cf8',
            dark: '#4f46e5',
          },
          secondary: {
            main: '#ec4899',
            light: '#f472b6',
            dark: '#db2777',
          },
          ...(mode === 'dark'
            ? {
                background: {
                  default: '#0f0f23',
                  paper: 'rgba(15, 15, 35, 0.8)',
                },
                text: {
                  primary: '#ffffff',
                  secondary: '#a1a1aa',
                },
              }
            : {
                background: {
                  default: '#ffffff',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#171717',
                  secondary: '#6b7280',
                },
              }),
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            fontSize: '3rem',
            fontWeight: 800,
          },
          h2: {
            fontSize: '2rem',
            fontWeight: 700,
          },
          h3: {
            fontSize: '1.5rem',
            fontWeight: 600,
          },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                ...(mode === 'dark' && {
                  background: 'rgba(15, 15, 35, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }),
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                ...(mode === 'dark' && {
                  background: 'rgba(15, 15, 35, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '12px',
                }),
              },
            },
          },
          MuiTabs: {
            styleOverrides: {
              root: {
                ...(mode === 'dark' && {
                  background: 'rgba(15, 15, 35, 0.6)',
                  borderRadius: '12px',
                  padding: '8px',
                }),
              },
              indicator: {
                ...(mode === 'dark' && {
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  borderRadius: '8px',
                }),
              },
            },
          },
          MuiTab: {
            styleOverrides: {
              root: {
                ...(mode === 'dark' && {
                  color: '#a1a1aa',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&.Mui-selected': {
                    color: '#ffffff',
                  },
                }),
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
