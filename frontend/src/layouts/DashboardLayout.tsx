// src/layouts/DashboardLayout.tsx [FRONTEND]
import { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Avatar, Menu, MenuItem, Divider, Tooltip, Badge,
  useTheme, useMediaQuery,
} from '@mui/material';
import MenuIcon          from '@mui/icons-material/Menu';
import DashboardIcon     from '@mui/icons-material/Dashboard';
import FolderIcon        from '@mui/icons-material/Folder';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChevronLeftIcon   from '@mui/icons-material/ChevronLeft';
import LogoutIcon        from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DarkModeIcon      from '@mui/icons-material/DarkMode';
import LightModeIcon     from '@mui/icons-material/LightMode';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout, selectCurrentUser }      from '../features/auth/store/authSlice';
//import { useSocketConnection }            from '../hooks/useSocket';
import { useThemeMode }                   from '../context/ThemeContext';
import { ROUTES }                         from '../routes/AppRoutes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DRAWER_WIDTH           = 240;
const DRAWER_COLLAPSED_WIDTH = 64;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, to: ROUTES.DASHBOARD },
  { label: 'Projects',  icon: <FolderIcon />,    to: ROUTES.PROJECTS  },
] as const;

// ---------------------------------------------------------------------------
// DashboardLayout
// ---------------------------------------------------------------------------
export default function DashboardLayout() {
  const theme       = useTheme();
  const isMobile    = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch    = useAppDispatch();
  const navigate    = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const { mode, toggleMode } = useThemeMode();

  // useSocketConnection();

  const [sidebarOpen,      setSidebarOpen]      = useState(!isMobile);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuAnchor,   setUserMenuAnchor]   = useState<null | HTMLElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

const [notifications] = useState<
  { id: number; message: string }[]
>([
  { id: 1, message: 'Welcome to Project Hub' },
]);

const [unreadCount] = useState(notifications.length);

  const handleToggleSidebar = useCallback(() => {
    if (isMobile) setMobileDrawerOpen((p) => !p);
    else          setSidebarOpen((p) => !p);
  }, [isMobile]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate(ROUTES.LOGIN, { replace: true });
  }, [dispatch, navigate]);

  const handleProfile = useCallback(() => {
    setUserMenuAnchor(null);
    navigate('/profile');
  }, [navigate]);

  const drawerWidth = sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED_WIDTH;

  // ── Sidebar content ──────────────────────────────────────────────────────
  const SidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo row */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarOpen ? 'space-between' : 'center',
        px: sidebarOpen ? 2 : 1,
        py: 1.5,
        minHeight: 64,
      }}>
        {sidebarOpen && (
          <Typography variant="h6" noWrap sx={{ fontWeight: 700, letterSpacing: '-0.3px' }}>
            📋 Project Hub
          </Typography>
        )}
        {!isMobile && (
          <Tooltip title={sidebarOpen ? 'Collapse' : 'Expand'} placement="right">
            <IconButton size="small" onClick={handleToggleSidebar}>
              <ChevronLeftIcon sx={{
                transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.2s ease',
              }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider />

      {/* Nav items */}
      <List sx={{ px: 1, py: 1.5, flex: 1 }}>
        {NAV_ITEMS.map(({ label, icon, to }) => (
          <ListItem key={label} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={!sidebarOpen ? label : ''} placement="right">
              <ListItemButton
                component={NavLink}
                to={to}
                end={to === ROUTES.DASHBOARD}
                onClick={() => isMobile && setMobileDrawerOpen(false)}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  px: sidebarOpen ? 1.5 : 1,
                  '&.active': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                  '&:not(.active):hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 0,
                  mr: sidebarOpen ? 1.5 : 0,
                  justifyContent: 'center',
                }}>
                  {icon}
                </ListItemIcon>
                {sidebarOpen && (
                  <ListItemText
                    primary={
                      <Typography component="span" sx={{ fontWeight: 500 }}>
                        {label}
                      </Typography>
                    }
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {/* Bottom user strip */}
      <Divider />
      <Box sx={{
        px: sidebarOpen ? 2 : 1,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        overflow: 'hidden',
      }}>
        <Avatar sx={{
          width: 32, height: 32,
          fontSize: 14, bgcolor: 'primary.main', flexShrink: 0,
          cursor: 'pointer',
        }}
          onClick={handleProfile}
        >
          {currentUser?.name?.[0]?.toUpperCase() ?? 'U'}
        </Avatar>
        {sidebarOpen && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {currentUser?.name ?? 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {currentUser?.email ?? ''}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* Desktop permanent sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing:   theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {SidebarContent}
        </Drawer>
      )}

      {/* Mobile temporary drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {SidebarContent}
        </Drawer>
      )}

      {/* Main column */}
      <Box component="main" sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        transition: theme.transitions.create('margin', {
          easing:   theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}>

        {/* AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
            zIndex: (t) => t.zIndex.drawer - 1,
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={handleToggleSidebar} sx={{ mr: 1.5 }}>
                <MenuIcon />
              </IconButton>
            )}

            <Typography variant="h6" noWrap sx={{ flex: 1, fontWeight: 600 }}>
              Project Management Dashboard
            </Typography>

            {/* ✅ Dark mode toggle */}
            <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              <IconButton onClick={toggleMode} sx={{ mr: 0.5 }}>
                {mode === 'light'
                  ? <DarkModeIcon fontSize="small" />
                  : <LightModeIcon fontSize="small" />
                }
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
  <IconButton
    sx={{ mr: 0.5 }}
    onClick={(e) => setAnchorEl(e.currentTarget)}
  >
    <Badge
      badgeContent={unreadCount}
      color="error"
      invisible={unreadCount === 0}
    >
      <NotificationsIcon />
    </Badge>
  </IconButton>
</Tooltip>

<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={() => setAnchorEl(null)}
>
  {notifications.length === 0 ? (
    <MenuItem>No notifications</MenuItem>
  ) : (
    notifications.map((n) => (
      <MenuItem key={n.id}>
        {n.message}
      </MenuItem>
    ))
  )}
</Menu>

            {/* Profile avatar */}
            <Tooltip title="Account settings">
              <IconButton
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                size="small"
              >
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
                  {currentUser?.name?.[0]?.toUpperCase() ?? 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>

            {/* User dropdown menu */}
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  elevation: 3,
                  sx: { mt: 0.5, minWidth: 200, borderRadius: 2 },
                },
              }}
            >
              {/* User info */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {currentUser?.name ?? 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentUser?.email ?? ''}
                </Typography>
              </Box>

              <Divider />

              {/* Profile */}
              <MenuItem onClick={handleProfile} dense sx={{ py: 1 }}>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Profile settings</Typography>
              </MenuItem>

              {/* Dark mode toggle inside menu */}
              <MenuItem
                dense
                sx={{ py: 1 }}
                onClick={() => { toggleMode(); setUserMenuAnchor(null); }}
              >
                <ListItemIcon>
                  {mode === 'light'
                    ? <DarkModeIcon fontSize="small" />
                    : <LightModeIcon fontSize="small" />
                  }
                </ListItemIcon>
                <Typography variant="body2">
                  {mode === 'light' ? 'Dark mode' : 'Light mode'}
                </Typography>
              </MenuItem>

              <Divider />

              {/* Sign out */}
              <MenuItem
                dense
                sx={{ py: 1, color: 'error.main' }}
                onClick={() => { setUserMenuAnchor(null); handleLogout(); }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body2" color="error.main">Sign out</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
          <Outlet />
        </Box>

      </Box>
    </Box>
  );
}