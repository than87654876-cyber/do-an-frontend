import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Stack,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded'
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import { useAuth } from '../context/AuthContext'
import { useThemeMode } from '../theme/AppTheme'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import t from '../utils/i18n'

const drawerWidth = 260

export default function Layout() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'
  const lang = user?.language || 'vi'

  const menuItems = [
    { to: '/', label: t('navDashboard', lang), icon: <DashboardRoundedIcon /> },
    { to: '/wallets', label: t('navWallets', lang), icon: <AccountBalanceWalletRoundedIcon /> },
    { to: '/transactions', label: t('navTransactions', lang), icon: <SwapHorizRoundedIcon /> },
    { to: '/categories', label: t('navCategories', lang), icon: <CategoryRoundedIcon /> },
    { to: '/budgets', label: t('navBudgets', lang), icon: <PieChartRoundedIcon /> },
    { to: '/goals', label: t('navGoals', lang), icon: <TrackChangesRoundedIcon /> },
    { to: '/reports', label: t('navReports', lang), icon: <BarChartRoundedIcon /> },
    { to: '/notifications', label: t('navNotifications', lang), icon: <NotificationsRoundedIcon /> },
  ]

  const adminItems = [
    { to: '/admin/stats', label: t('navSystemStats', lang), icon: <AssessmentRoundedIcon /> },
    { to: '/admin/users', label: t('navUserManagement', lang), icon: <PeopleAltRoundedIcon /> },
  ]
  const { mode, toggleMode } = useThemeMode()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    setAnchorEl(null)
    logout()
    navigate('/login')
  }

  const navList = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand logo in sidebar */}
      <Box sx={{ p: 2.5, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'grid',
              placeItems: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px -2px rgba(37, 99, 235, 0.4)',
            }}
          >
            <AccountBalanceRoundedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              FinAdmin
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {t('tagline', lang)}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ mx: 2, mb: 1.5 }} />

      {/* Nav Menu */}
      <List sx={{ px: 1.5, flex: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 1.5, mb: 1, display: 'block', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.6875rem' }}
        >
          {t('mainMenu', lang)}
        </Typography>
        {menuItems.map((m) => (
          <ListItemButton
            key={m.to}
            component={NavLink}
            to={m.to}
            end={m.to === '/'}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2.5,
              mb: 0.75,
              py: 1.1,
              px: 1.75,
              color: 'text.secondary',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: 'action.hover',
                color: 'text.primary',
              },
              '&.active': {
                background: (themeObj) =>
                  themeObj.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 14px -3px rgba(37, 99, 235, 0.5)',
                '& .MuiListItemIcon-root': { color: '#ffffff' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{m.icon}</ListItemIcon>
            <ListItemText
              primary={m.label}
              slotProps={{ primary: { fontWeight: 600, fontSize: '0.9rem' } }}
            />
          </ListItemButton>
        ))}

        {isAdmin && (
          <>
            <Divider sx={{ my: 2, mx: 0.5 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 1.5, mb: 1, display: 'block', fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.6875rem' }}
            >
              {t('systemAdmin', lang)}
            </Typography>
            {adminItems.map((m) => (
              <ListItemButton
                key={m.to}
                component={NavLink}
                to={m.to}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: 2.5,
                  mb: 0.75,
                  py: 1.1,
                  px: 1.75,
                  color: 'text.secondary',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'text.primary',
                  },
                  '&.active': {
                    background: (t) =>
                      t.palette.mode === 'light'
                        ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
                        : 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px -3px rgba(13, 148, 136, 0.5)',
                    '& .MuiListItemIcon-root': { color: '#ffffff' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{m.icon}</ListItemIcon>
                <ListItemText
                  primary={m.label}
                  slotProps={{ primary: { fontWeight: 600, fontSize: '0.9rem' } }}
                />
              </ListItemButton>
            ))}
          </>
        )}
      </List>

      {/* User profile section at the bottom of sidebar */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 1.75,
            borderRadius: 3,
            bgcolor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'light' ? 0.04 : 0.05),
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: isAdmin ? 'secondary.main' : 'primary.main',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {user?.name || user?.username || 'Người dùng'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {isAdmin ? t('userRoleAdmin', lang) : user?.email || t('userRoleUser', lang)}
              </Typography>
            </Box>
            <Tooltip title={t('logout', lang)}>
              <IconButton size="small" onClick={handleLogout} sx={{ color: 'text.secondary' }}>
                <LogoutRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: (t) =>
            t.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(9, 13, 22, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 }, gap: 1 }}>
          {!isDesktop && (
            <IconButton onClick={() => setMobileOpen(!mobileOpen)} edge="start" sx={{ mr: 1 }}>
              <MenuRoundedIcon />
            </IconButton>
          )}

          {!isDesktop && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#ffffff',
                }}
              >
                <AccountBalanceRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={800}>
                FinAdmin
              </Typography>
            </Stack>
          )}

          {isDesktop && <Box sx={{ flexGrow: 1 }} />}

          {/* Quick status pill if admin */}
          {isAdmin && (
            <Chip
              size="small"
              icon={<AdminPanelSettingsRoundedIcon sx={{ fontSize: '15px !important' }} />}
              label="Admin Mode"
              color="secondary"
              variant="outlined"
              sx={{ fontWeight: 700, mr: 1 }}
            />
          )}

          {/* Dark / Light Mode Switch */}
          <Tooltip title={mode === 'light' ? t('darkMode', lang) : t('lightMode', lang)}>
            <IconButton onClick={toggleMode} sx={{ color: 'text.secondary' }}>
              {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
            </IconButton>
          </Tooltip>

          {/* User menu avatar */}
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 0.5 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: isAdmin ? 'secondary.main' : 'primary.main',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {(user?.name || user?.username || 'U').charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: { minWidth: 200, mt: 1, borderRadius: 3, p: 0.5 },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {user?.name || user?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={() => {
                setAnchorEl(null)
                navigate('/profile')
              }}
              sx={{ borderRadius: 2 }}
            >
              <PersonRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
              {t('profile', lang)}
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main', borderRadius: 2 }}>
              <LogoutRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
              {t('logout', lang)}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Desktop Drawer */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
          }}
        >
          {navList}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              bgcolor: 'background.paper',
            },
          }}
        >
          {navList}
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, md: 4 },
          minWidth: 0,
          mt: 8,
          maxWidth: '100%',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

