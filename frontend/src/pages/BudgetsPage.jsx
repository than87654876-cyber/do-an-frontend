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
  MenuItem,
  Snackbar,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  alpha,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import PageCard from '../components/PageCard'
import PageHeader from '../components/PageHeader'
import { FormDialog, ConfirmDialog, MoneyInput } from '../components/FormDialog'
import { budgetApi, categoryApi, getErrorMessage } from '../api'
import { fmtVND, fmtDate } from '../utils/format'
import t from '../utils/i18n'

function CircularProgressMini({ value, color, size = 76 }) {
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
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </Box>
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <Typography variant="caption" fontWeight={800} fontSize={13} color="text.primary">
          {value}%
        </Typography>
      </Box>
    </Box>
  )
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    category_id: '',
    limit_amount: '',
    period_start: '',
    period_end: '',
  })
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setStatus({ loading: true, error: '' })
    try {
      const [bRes, cRes] = await Promise.all([budgetApi.getAll(), categoryApi.getAll()])
      setBudgets(bRes.data)
      setCategories(cRes.data)
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
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    setForm({
      category_id: categories.find((c) => c.type === 'expense')?.id || '',
      limit_amount: '',
      period_start: first,
      period_end: last,
    })
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (b) => {
    setEditing(b)
    setForm({
      category_id: b.category_id,
      limit_amount: String(Number(b.limit_amount)),
      period_start: b.period_start,
      period_end: b.period_end,
    })
    setFormError('')
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.category_id || !form.limit_amount || !form.period_start || !form.period_end) {
      setFormError('Vui lòng chọn danh mục, nhập hạn mức và khoảng thời gian')
      return
    }
    if (form.period_end < form.period_start) {
      setFormError('Ngày kết thúc phải diễn ra sau ngày bắt đầu')
      return
    }
    setSaving(true)
    try {
      const payload = {
        category_id: Number(form.category_id),
        limit_amount: Number(form.limit_amount),
        period_start: form.period_start,
        period_end: form.period_end,
      }
      if (editing) {
        await budgetApi.update(editing.id, payload)
        setSnack({ msg: 'Đã cập nhật ngân sách', severity: 'success' })
      } else {
        await budgetApi.create(payload)
        setSnack({ msg: 'Đã tạo ngân sách mới 🎉', severity: 'success' })
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
      await budgetApi.remove(deleting.id)
      setSnack({ msg: 'Đã xóa ngân sách', severity: 'success' })
      setDeleting(null)
      load()
    } catch (err) {
      setSnack({ msg: getErrorMessage(err), severity: 'error' })
      setDeleting(null)
    } finally {
      setSaving(false)
    }
  }

  const overCount = budgets.filter((b) => b.isOverBudget).length

  return (
    <Stack spacing={3.5}>
      <PageHeader
        title={t('budgetsHeaderTitle')}
        subtitle={
          budgets.length
            ? `${budgets.length} ${t('navBudgets').toLowerCase()}${
                overCount > 0 ? ` · ⚠️ ${overCount} ${t('overBudgetWarning')}` : ''
              }`
            : t('budgetsHeaderSub')
        }
        badge={
          overCount > 0 ? (
            <Chip
              size="small"
              color="error"
              icon={<WarningAmberRoundedIcon sx={{ fontSize: '15px !important' }} />}
              label={`${overCount} cảnh báo`}
              sx={{ fontWeight: 700 }}
            />
          ) : null
        }
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            {t('createBudget')}
          </Button>
        }
      />

      <PageCard
        loading={status.loading}
        error={status.error}
        onRetry={load}
        isEmpty={budgets.length === 0}
        emptyIcon="🎯"
        emptyText='Chưa có ngân sách nào được thiết lập. Hãy bấm "Tạo ngân sách" để đặt hạn mức chi tiêu cho các danh mục.'
      >
        <Stack spacing={2.5}>
          {budgets.map((b) => {
            const isOver = b.isOverBudget
            const color = isOver ? '#ef4444' : b.percentage > 80 ? '#f59e0b' : '#10b981'
            const remaining = Number(b.limit_amount) - Number(b.spent)

            return (
              <Card
                key={b.id}
                elevation={0}
                sx={{
                  borderRadius: 3.5,
                  border: '1px solid',
                  borderColor: isOver ? alpha('#ef4444', 0.4) : 'divider',
                  bgcolor: isOver ? alpha('#ef4444', 0.03) : 'background.paper',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: (theme) =>
                      theme.palette.mode === 'light'
                        ? '0 10px 24px -8px rgba(15, 23, 42, 0.08)'
                        : '0 10px 24px -8px rgba(0, 0, 0, 0.35)',
                  },
                }}
              >
                <CardContent sx={{ p: 2.75 }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={3}
                    alignItems={{ sm: 'center' }}
                  >
                    <CircularProgressMini value={b.percentage} color={color} />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        flexWrap="wrap"
                        rowGap={0.5}
                        mb={0.5}
                      >
                        <Typography variant="subtitle1" fontWeight={800}>
                          {b.Category?.name || 'Danh mục'}
                        </Typography>
                        {isOver ? (
                          <Chip
                            size="small"
                            color="error"
                            icon={<WarningAmberRoundedIcon sx={{ fontSize: '13px !important' }} />}
                            label="Đã vượt hạn mức"
                            sx={{ fontWeight: 700, height: 22, fontSize: 11 }}
                          />
                        ) : b.percentage > 80 ? (
                          <Chip
                            size="small"
                            color="warning"
                            label="Sắp chạm hạn mức"
                            sx={{ fontWeight: 700, height: 22, fontSize: 11 }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            color="success"
                            variant="outlined"
                            label="Trong tầm kiểm soát"
                            sx={{ fontWeight: 700, height: 22, fontSize: 11 }}
                          />
                        )}
                      </Stack>

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={{ xs: 0.5, sm: 2 }}
                        alignItems={{ sm: 'center' }}
                        mt={0.5}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Đã chi:{' '}
                          <Typography component="span" fontWeight={800} color="text.primary">
                            {fmtVND(b.spent)}
                          </Typography>{' '}
                          /{' '}
                          <Typography component="span" fontWeight={600} color="text.secondary">
                            {fmtVND(b.limit_amount)}
                          </Typography>
                        </Typography>

                        <Typography variant="body2" color={isOver ? 'error.main' : 'text.secondary'}>
                          {isOver ? (
                            <strong>Vượt {fmtVND(Math.abs(remaining))}</strong>
                          ) : (
                            <>Còn lại: <strong>{fmtVND(remaining)}</strong></>
                          )}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center" mt={0.75}>
                        <CalendarMonthRoundedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          Kỳ hạn: {fmtDate(b.period_start)} → {fmtDate(b.period_end)}
                        </Typography>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={Math.min(b.percentage, 100)}
                        sx={{
                          mt: 1.5,
                          height: 7,
                          borderRadius: 4,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: color },
                        }}
                      />
                    </Box>

                    <Stack direction="row" spacing={0.5} alignSelf={{ xs: 'flex-end', sm: 'center' }}>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton size="small" onClick={() => openEdit(b)}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa ngân sách">
                        <IconButton size="small" color="error" onClick={() => setDeleting(b)}>
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
      </PageCard>

      {/* Form thêm / sửa ngân sách */}
      <FormDialog
        open={formOpen}
        title={editing ? 'Sửa ngân sách' : 'Thiết lập ngân sách mới'}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSave}
        saving={saving}
        error={formError}
      >
        <TextField
          select
          fullWidth
          label="Danh mục áp dụng"
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        >
          {categories
            .filter((c) => c.type === 'expense')
            .map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
        </TextField>

        <MoneyInput
          label="Hạn mức chi tối đa"
          value={form.limit_amount}
          onChange={(e) => setForm({ ...form, limit_amount: e.target.value })}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="Ngày bắt đầu kỳ"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.period_start}
            onChange={(e) => setForm({ ...form, period_start: e.target.value })}
          />
          <TextField
            fullWidth
            label="Ngày kết thúc kỳ"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.period_end}
            onChange={(e) => setForm({ ...form, period_end: e.target.value })}
          />
        </Stack>
      </FormDialog>

      {/* Xác nhận xóa */}
      <ConfirmDialog
        open={!!deleting}
        title="Xóa ngân sách?"
        content={
          <>
            Bạn có chắc chắn muốn xóa ngân sách cho danh mục <strong>"{deleting?.Category?.name}"</strong>?
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

