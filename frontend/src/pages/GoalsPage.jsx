import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Snackbar,
  Alert,
  Card,
  CardContent,
  alpha,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import PageCard from '../components/PageCard'
import PageHeader from '../components/PageHeader'
import { FormDialog, ConfirmDialog, MoneyInput } from '../components/FormDialog'
import { goalApi, getErrorMessage } from '../api'
import { fmtVND, fmtDate } from '../utils/format'
import t from '../utils/i18n'

function ProgressRing({ value, completed, size = 80 }) {
  const color = completed ? '#f59e0b' : '#2563eb'
  const strokeColor = completed ? '#f59e0b' : '#3b82f6'
  const r = (size - 12) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(value, 100)

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <Box component="svg" width={size} height={size} sx={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={8}
          sx={{ color }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </Box>
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        {completed ? (
          <EmojiEventsRoundedIcon sx={{ color: '#f59e0b', fontSize: 26 }} />
        ) : (
          <Typography variant="caption" fontWeight={800} fontSize={13}>
            {value}%
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', target_amount: '', deadline: '' })
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const [contrib, setContrib] = useState(null)
  const [contribAmount, setContribAmount] = useState('')
  const [contribError, setContribError] = useState('')

  const load = useCallback(async () => {
    setStatus({ loading: true, error: '' })
    try {
      const res = await goalApi.getAll()
      setGoals(res.data)
      setStatus({ loading: false, error: '' })
    } catch (err) {
      setStatus({ loading: false, error: getErrorMessage(err) })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', target_amount: '', deadline: '' })
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (g) => {
    setEditing(g)
    setForm({
      name: g.name,
      target_amount: String(Number(g.target_amount)),
      deadline: g.deadline || '',
    })
    setFormError('')
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.target_amount || Number(form.target_amount) <= 0) {
      setFormError('Vui lòng nhập tên và số tiền mục tiêu hợp lệ')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        target_amount: Number(form.target_amount),
        deadline: form.deadline || null,
      }
      if (editing) {
        await goalApi.update(editing.id, payload)
        setSnack({ msg: 'Đã cập nhật mục tiêu', severity: 'success' })
      } else {
        await goalApi.create(payload)
        setSnack({ msg: 'Đã thêm mục tiêu 🎉', severity: 'success' })
      }
      setFormOpen(false)
      load()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await goalApi.remove(deleting.id)
      setSnack({ msg: 'Đã xóa mục tiêu', severity: 'success' })
      setDeleting(null)
      load()
    } catch (err) {
      setSnack({ msg: getErrorMessage(err), severity: 'error' })
      setDeleting(null)
    } finally {
      setSaving(false)
    }
  }

  const handleContribute = async () => {
    if (!contribAmount || Number(contribAmount) <= 0) {
      setContribError('Số tiền đóng góp phải lớn hơn 0')
      return
    }
    setSaving(true)
    setContribError('')
    try {
      await goalApi.updateProgress(contrib.id, Number(contribAmount))
      const willComplete = Number(contrib.current_amount) + Number(contribAmount) >= Number(contrib.target_amount)
      setSnack({
        msg: willComplete ? `Chúc mừng! 🏆 Mục tiêu "${contrib.name}" đã hoàn thành!` : `Đã đóng góp ${fmtVND(contribAmount)}`,
        severity: 'success',
      })
      setContrib(null)
      setContribAmount('')
      load()
    } catch (err) {
      setContribError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const completedCount = goals.filter((g) => g.status === 'completed').length
  const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0)
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0)

  return (
    <Stack spacing={3.5}>
      <PageHeader
        title={t('goalsHeaderTitle')}
        subtitle={`${fmtVND(totalSaved)} / ${fmtVND(totalTarget)} · ${completedCount} ${t('goalsTitle').toLowerCase()}`}
        badge={
          completedCount > 0 ? (
            <Chip
              size="small"
              color="warning"
              icon={<EmojiEventsRoundedIcon sx={{ fontSize: '15px !important' }} />}
              label={`${completedCount} 🏆`}
              sx={{ fontWeight: 700 }}
            />
          ) : null
        }
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            {t('createGoal')}
          </Button>
        }
      />

      <PageCard
        loading={status.loading}
        error={status.error}
        onRetry={load}
        isEmpty={goals.length === 0}
        emptyIcon="🏆"
        emptyText='Chưa có mục tiêu tiết kiệm nào. Hãy bấm "Mục tiêu mới" để bắt đầu tích lũy cho ước mơ của bạn.'
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2.75,
          }}
        >
          {goals.map((g) => {
            const pct = Math.min(
              Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100),
              100
            )
            const completed = g.status === 'completed'

            return (
              <Card
                key={g.id}
                elevation={0}
                sx={{
                  borderRadius: 4,
                  position: 'relative',
                  border: '1px solid',
                  borderColor: completed ? alpha('#f59e0b', 0.4) : 'divider',
                  bgcolor: completed ? alpha('#f59e0b', 0.03) : 'background.paper',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: (theme) =>
                      theme.palette.mode === 'light'
                        ? '0 12px 28px -10px rgba(15, 23, 42, 0.1)'
                        : '0 12px 28px -10px rgba(0, 0, 0, 0.4)',
                  },
                }}
              >
                {/* Top Accent Strip */}
                <Box
                  sx={{
                    height: 4,
                    background: completed
                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                      : 'linear-gradient(90deg, #2563eb, #1d4ed8)',
                  }}
                />

                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2.5} alignItems="flex-start" mb={2}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={800} noWrap>
                        {g.name}
                      </Typography>
                      {completed ? (
                        <Chip
                          size="small"
                          color="warning"
                          icon={<CheckCircleRoundedIcon sx={{ fontSize: '13px !important' }} />}
                          label="Hoàn thành xuất sắc"
                          sx={{ mt: 0.5, fontWeight: 700, height: 22, fontSize: 11 }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          color="primary"
                          variant="outlined"
                          label="Đang tích lũy"
                          sx={{ mt: 0.5, fontWeight: 600, height: 22, fontSize: 11 }}
                        />
                      )}
                    </Box>
                    <ProgressRing value={pct} completed={completed} size={76} />
                  </Stack>

                  <Box sx={{ my: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Đã tích lũy:
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="text.primary" mt={0.25}>
                      {fmtVND(g.current_amount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Mục tiêu cần đạt: <strong>{fmtVND(g.target_amount)}</strong>
                    </Typography>
                  </Box>

                  {g.deadline && (
                    <Stack direction="row" spacing={1} alignItems="center" mb={2.5}>
                      <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Hạn chót: {fmtDate(g.deadline)}
                      </Typography>
                    </Stack>
                  )}

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    pt={1.5}
                    borderTop="1px solid"
                    borderColor="divider"
                  >
                    {!completed ? (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<SavingsRoundedIcon />}
                        onClick={() => {
                          setContrib(g)
                          setContribAmount('')
                          setContribError('')
                        }}
                        sx={{ borderRadius: 2.5, px: 2, fontWeight: 700 }}
                      >
                        Đóng góp
                      </Button>
                    ) : (
                      <Chip
                        size="small"
                        color="success"
                        label="Đạt mục tiêu"
                        variant="filled"
                        sx={{ fontWeight: 700 }}
                      />
                    )}

                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton size="small" onClick={() => openEdit(g)}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa mục tiêu">
                        <IconButton size="small" color="error" onClick={() => setDeleting(g)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </PageCard>

      {/* Thêm / sửa mục tiêu */}
      <FormDialog
        open={formOpen}
        title={editing ? 'Sửa mục tiêu' : 'Mục tiêu mới'}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSave}
        saving={saving}
        error={formError}
      >
        <TextField
          fullWidth
          label="Tên mục tiêu"
          placeholder="Ví dụ: Mua xe máy, Đi du lịch Nhật Bản..."
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <MoneyInput
          label="Số tiền mục tiêu"
          value={form.target_amount}
          onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
        />

        <TextField
          fullWidth
          label="Hạn chót (tùy chọn)"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
      </FormDialog>

      {/* Đóng góp */}
      <FormDialog
        open={!!contrib}
        title={`Đóng góp vào "${contrib?.name || ''}"`}
        onClose={() => setContrib(null)}
        onSubmit={handleContribute}
        saving={saving}
        submitLabel="Xác nhận đóng góp"
        error={contribError}
      >
        <Typography variant="body2" color="text.secondary">
          Hiện tại đã có <strong>{fmtVND(contrib?.current_amount)}</strong> trên mục tiêu{' '}
          <strong>{fmtVND(contrib?.target_amount)}</strong>.
        </Typography>

        <MoneyInput
          label="Số tiền đóng góp thêm"
          value={contribAmount}
          onChange={(e) => setContribAmount(e.target.value)}
          autoFocus
        />

        {/* Quick add presets */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {[100000, 200000, 500000, 1000000, 2000000].map((val) => (
            <Chip
              key={val}
              label={`+${fmtVND(val)}`}
              clickable
              onClick={() => setContribAmount(String((Number(contribAmount) || 0) + val))}
              sx={{ fontWeight: 600 }}
            />
          ))}
        </Stack>
      </FormDialog>

      {/* Xác nhận xóa */}
      <ConfirmDialog
        open={!!deleting}
        title="Xóa mục tiêu?"
        content={
          <>
            Bạn có chắc chắn muốn xóa mục tiêu <strong>"{deleting?.name}"</strong>?
          </>
        }
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        saving={saving}
      />

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnack(null)} severity={snack?.severity || 'info'} sx={{ borderRadius: 2.5 }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
