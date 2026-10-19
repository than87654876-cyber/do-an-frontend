import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  IconButton,
  Button,
  Chip,
  Skeleton,
  Tooltip,
} from '@mui/material'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import PageHeader from '../components/PageHeader'
import { notificationApi, getErrorMessage } from '../api'
import { fmtDate } from '../utils/format'
import t from '../utils/i18n'

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await notificationApi.getAll()
      setNotifications(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Không tải được danh sách thông báo'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await notificationApi.delete(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <Stack spacing={2.5}>
        <Skeleton variant="rounded" height={42} width={260} />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={85} sx={{ borderRadius: 3.5 }} />
        ))}
      </Stack>
    )
  }

  if (error) {
    return (
      <Card elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          ⚠️ {error}
        </Typography>
        <Button variant="contained" onClick={loadNotifications} sx={{ mt: 2 }}>
          Thử lại
        </Button>
      </Card>
    )
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <Stack spacing={3}>
      <PageHeader
        title={t('notificationsHeaderTitle')}
        subtitle={
          unreadCount > 0
            ? `${unreadCount} ${t('navNotifications').toLowerCase()}`
            : t('notificationsHeaderSub')
        }
        action={
          unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DoneAllRoundedIcon />}
              onClick={handleMarkAllAsRead}
              sx={{ borderRadius: 2.5, fontWeight: 700 }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )
        }
      />

      {notifications.length === 0 ? (
        <Card elevation={0} sx={{ p: 6, borderRadius: 4, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <NotificationsRoundedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
          <Typography variant="h6" fontWeight={700}>
            Chưa có thông báo nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Các cảnh báo về ngân sách hoặc đạt mục tiêu tiết kiệm sẽ xuất hiện ở đây.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {notifications.map((n) => {
            const isWarning = n.type === 'budget_warning'
            const isGoal = n.type === 'goal_reached'
            const iconBg = isWarning ? '#fee2e2' : isGoal ? '#fef3c7' : '#e0e7ff'
            const iconColor = isWarning ? '#dc2626' : isGoal ? '#d97706' : '#2563eb'

            return (
              <Card
                key={n.id}
                elevation={0}
                sx={{
                  borderRadius: 3.5,
                  border: '1px solid',
                  borderColor: n.is_read ? 'divider' : 'primary.light',
                  bgcolor: n.is_read ? 'background.paper' : 'action.hover',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)' },
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        bgcolor: iconBg,
                        color: iconColor,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isWarning ? (
                        <WarningAmberRoundedIcon />
                      ) : isGoal ? (
                        <EmojiEventsRoundedIcon />
                      ) : (
                        <NotificationsRoundedIcon />
                      )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                        <Typography variant="subtitle2" fontWeight={750}>
                          {n.title}
                        </Typography>
                        {!n.is_read && (
                          <Chip
                            label="Mới"
                            size="small"
                            color="primary"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                          />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                        {n.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                        {fmtDate(n.createdAt)}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.5}>
                      {!n.is_read && (
                        <Tooltip title="Đánh dấu đã đọc">
                          <IconButton size="small" onClick={() => handleMarkAsRead(n.id)} color="primary">
                            <CheckCircleOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Xóa thông báo">
                        <IconButton size="small" onClick={() => handleDelete(n.id)} color="default">
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
