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
  Avatar,
  Divider,
  InputAdornment,
  ButtonGroup,
  alpha,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import PageCard from '../components/PageCard'
import PageHeader from '../components/PageHeader'
import { FormDialog, ConfirmDialog, MoneyInput } from '../components/FormDialog'
import { transactionApi, walletApi, categoryApi, getErrorMessage } from '../api'
import { fmtVND, fmtDate } from '../utils/format'
import t from '../utils/i18n'

const emptyForm = {
  wallet_id: '',
  category_id: '',
  amount: '',
  type: 'expense',
  note: '',
  transaction_date: new Date().toISOString().slice(0, 10),
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [wallets, setWallets] = useState([])
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState(null)

  const [filters, setFilters] = useState({ month: '', type: '', search: '' })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setStatus({ loading: true, error: '' })
    try {
      const params = {}
      if (filters.month) {
        const [year, month] = filters.month.split('-')
        params.year = year
        params.month = String(Number(month))
      }
      if (filters.type) params.type = filters.type
      const res = await transactionApi.getAll(params)
      setTransactions(res.data)
      setStatus({ loading: false, error: '' })
    } catch (err) {
      setStatus({ loading: false, error: getErrorMessage(err) })
    }
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    Promise.all([walletApi.getAll(), categoryApi.getAll()])
      .then(([wRes, cRes]) => {
        setWallets(wRes.data)
        setCategories(cRes.data)
      })
      .catch(() => {})
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      wallet_id: wallets[0]?.id || '',
      category_id: categories.find((c) => c.type === 'expense')?.id || '',
    })
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (t) => {
    setEditing(t)
    setForm({
      wallet_id: t.wallet_id,
      category_id: t.category_id,
      amount: String(Number(t.amount)),
      type: t.type,
      note: t.note || '',
      transaction_date: t.transaction_date,
    })
    setFormError('')
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.wallet_id || !form.category_id || !form.amount || Number(form.amount) <= 0) {
      setFormError('Vui lòng chọn ví, danh mục và nhập số tiền hợp lệ')
      return
    }
    setSaving(true)
    try {
      const payload = {
        wallet_id: Number(form.wallet_id),
        category_id: Number(form.category_id),
        amount: Number(form.amount),
        type: form.type,
        note: form.note,
        transaction_date: form.transaction_date,
      }
      if (editing) {
        await transactionApi.update(editing.id, payload)
        setSnack({ msg: 'Đã cập nhật giao dịch', severity: 'success' })
      } else {
        await transactionApi.create(payload)
        setSnack({ msg: 'Đã lưu giao dịch mới 🎉', severity: 'success' })
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
      await transactionApi.remove(deleting.id)
      setSnack({ msg: 'Đã xóa giao dịch (số dư ví đã được hoàn tác)', severity: 'success' })
      setDeleting(null)
      load()
    } catch (err) {
      setSnack({ msg: getErrorMessage(err), severity: 'error' })
      setDeleting(null)
    } finally {
      setSaving(false)
    }
  }

  const catById = (id) => categories.find((c) => c.id === id)
  const walletById = (id) => wallets.find((w) => w.id === id)

  const visible = transactions.filter((t) => {
    if (!filters.search) return true
    const q = filters.search.toLowerCase()
    const cat = t.Category || catById(t.category_id)
    return (
      (t.note || '').toLowerCase().includes(q) ||
      (cat?.name || '').toLowerCase().includes(q) ||
      (t.Wallet?.name || walletById(t.wallet_id)?.name || '').toLowerCase().includes(q)
    )
  })

  const totalIncome = visible
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = visible
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)
  const netBalance = totalIncome - totalExpense

  const filteredCategories = categories.filter((c) => c.type === form.type)

  return (
    <Stack spacing={3.5}>
      <PageHeader
        title={t('transactionsHeaderTitle')}
        subtitle={`${visible.length} ${t('navTransactions').toLowerCase()}`}
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            {t('addTransaction')}
          </Button>
        }
      />

      {/* Mini summary cards for filtered transactions */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Box
          sx={{
            flex: 1,
            p: 2.25,
            borderRadius: 3.5,
            bgcolor: (tTheme) => alpha(tTheme.palette.success.main, 0.08),
            border: '1px solid',
            borderColor: (tTheme) => alpha(tTheme.palette.success.main, 0.2),
          }}
        >
          <Typography variant="caption" color="success.main" fontWeight={700}>
            {t('totalIncome').toUpperCase()}
          </Typography>
          <Typography variant="h6" fontWeight={800} color="success.main" mt={0.25}>
            +{fmtVND(totalIncome)}
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            p: 2.25,
            borderRadius: 3.5,
            bgcolor: (tTheme) => alpha(tTheme.palette.error.main, 0.08),
            border: '1px solid',
            borderColor: (tTheme) => alpha(tTheme.palette.error.main, 0.2),
          }}
        >
          <Typography variant="caption" color="error.main" fontWeight={700}>
            {t('totalExpense').toUpperCase()}
          </Typography>
          <Typography variant="h6" fontWeight={800} color="error.main" mt={0.25}>
            −{fmtVND(totalExpense)}
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            p: 2.25,
            borderRadius: 3.5,
            bgcolor: (tTheme) => alpha(tTheme.palette.primary.main, 0.08),
            border: '1px solid',
            borderColor: (tTheme) => alpha(tTheme.palette.primary.main, 0.2),
          }}
        >
          <Typography variant="caption" color="primary.main" fontWeight={700}>
            {t('netDifference').toUpperCase()}
          </Typography>
          <Typography
            variant="h6"
            fontWeight={800}
            color={netBalance >= 0 ? 'success.main' : 'error.main'}
            mt={0.25}
          >
            {netBalance >= 0 ? '+' : ''}
            {fmtVND(netBalance)}
          </Typography>
        </Box>
      </Stack>

      <PageCard
        loading={status.loading}
        error={status.error}
        onRetry={load}
        isEmpty={visible.length === 0}
        emptyIcon="🧾"
        emptyText='Không tìm thấy giao dịch nào. Hãy bấm "Ghi giao dịch" để thêm khoản chi tiêu/thu nhập đầu tiên.'
      >
        {/* Bộ lọc tìm kiếm & loại */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
          mb={3}
        >
          <TextField
            size="small"
            placeholder="Tìm theo ghi chú, danh mục, ví..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            sx={{ flex: 1, maxWidth: { md: 360 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
            <TextField
              size="small"
              type="month"
              label="Kỳ tháng"
              slotProps={{ inputLabel: { shrink: true } }}
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              sx={{ width: 160 }}
            />

            <ButtonGroup size="small" variant="outlined">
              <Button
                variant={filters.type === '' ? 'contained' : 'outlined'}
                onClick={() => setFilters({ ...filters, type: '' })}
              >
                Tất cả
              </Button>
              <Button
                variant={filters.type === 'income' ? 'contained' : 'outlined'}
                color="success"
                onClick={() => setFilters({ ...filters, type: 'income' })}
              >
                Thu nhập
              </Button>
              <Button
                variant={filters.type === 'expense' ? 'contained' : 'outlined'}
                color="error"
                onClick={() => setFilters({ ...filters, type: 'expense' })}
              >
                Chi tiêu
              </Button>
            </ButtonGroup>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Danh sách giao dịch */}
        <Stack spacing={1}>
          {visible.map((t) => {
            const cat = t.Category || catById(t.category_id)
            const isIncome = t.type === 'income'
            const catColor = cat?.color || (isIncome ? '#10b981' : '#f43f5e')

            return (
              <Stack
                key={t.id}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 3,
                  bgcolor: (theme) => alpha(theme.palette.text.primary, 0.015),
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'translateX(2px)',
                    borderColor: 'primary.light',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.75,
                    bgcolor: alpha(catColor, 0.12),
                    color: catColor,
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  {(cat?.name || '?').charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700} noWrap>
                    {t.note || cat?.name || 'Giao dịch'}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" mt={0.5} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {fmtDate(t.transaction_date)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      •
                    </Typography>
                    <Chip
                      size="small"
                      icon={<AccountBalanceWalletRoundedIcon sx={{ fontSize: '13px !important' }} />}
                      label={t.Wallet?.name || walletById(t.wallet_id)?.name || 'Ví'}
                      sx={{ height: 20, fontSize: 11, fontWeight: 600 }}
                    />
                    {cat && (
                      <Chip
                        size="small"
                        label={cat.name}
                        sx={{
                          height: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          bgcolor: alpha(catColor, 0.1),
                          color: catColor,
                        }}
                      />
                    )}
                  </Stack>
                </Box>

                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    color={isIncome ? 'success.main' : 'error.main'}
                  >
                    {isIncome ? '+' : '−'}
                    {fmtVND(t.amount)}
                  </Typography>
                  <Chip
                    size="small"
                    icon={
                      isIncome ? (
                        <ArrowUpwardRoundedIcon sx={{ fontSize: '13px !important' }} />
                      ) : (
                        <ArrowDownwardRoundedIcon sx={{ fontSize: '13px !important' }} />
                      )
                    }
                    label={isIncome ? 'Thu nhập' : 'Chi tiêu'}
                    color={isIncome ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ height: 20, fontSize: 11, fontWeight: 700, mt: 0.25 }}
                  />
                </Box>

                <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                  <Tooltip title="Chỉnh sửa">
                    <IconButton size="small" onClick={() => openEdit(t)}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa giao dịch">
                    <IconButton size="small" color="error" onClick={() => setDeleting(t)}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            )
          })}
        </Stack>
      </PageCard>

      {/* Form thêm / sửa giao dịch */}
      <FormDialog
        open={formOpen}
        title={editing ? 'Sửa giao dịch' : 'Ghi giao dịch mới'}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSave}
        saving={saving}
        error={formError}
      >
        {/* Toggle Loại: Chi tiêu / Thu nhập */}
        <Stack direction="row" spacing={1.5}>
          {[
            { value: 'expense', label: 'Chi tiêu', emoji: '💸' },
            { value: 'income', label: 'Thu nhập', emoji: '💰' },
          ].map((opt) => {
            const isSelected = form.type === opt.value
            return (
              <Box
                key={opt.value}
                onClick={() => {
                  const firstCat = categories.find((c) => c.type === opt.value)
                  setForm({ ...form, type: opt.value, category_id: firstCat?.id || '' })
                }}
                sx={{
                  flex: 1,
                  p: 1.75,
                  borderRadius: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: isSelected
                    ? opt.value === 'expense'
                      ? 'error.main'
                      : 'success.main'
                    : 'divider',
                  bgcolor: isSelected
                    ? opt.value === 'expense'
                      ? alpha('#ef4444', 0.08)
                      : alpha('#10b981', 0.08)
                    : 'transparent',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                }}
              >
                <Typography fontSize={24}>{opt.emoji}</Typography>
                <Typography variant="subtitle2" fontWeight={800} mt={0.5}>
                  {opt.label}
                </Typography>
              </Box>
            )
          })}
        </Stack>

        <MoneyInput
          label="Số tiền giao dịch"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          autoFocus
        />

        <TextField
          select
          fullWidth
          label="Ví thanh toán"
          value={form.wallet_id}
          onChange={(e) => setForm({ ...form, wallet_id: e.target.value })}
        >
          {wallets.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {w.name} — ({fmtVND(w.balance)})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          fullWidth
          label="Danh mục phân loại"
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
        >
          {filteredCategories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: c.color || '#94a3b8',
                  }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {c.name}
                </Typography>
              </Stack>
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label="Ngày phát sinh"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          value={form.transaction_date}
          onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
        />

        <TextField
          fullWidth
          label="Ghi chú chi tiết (tùy chọn)"
          placeholder="Ví dụ: Cơm trưa với đồng nghiệp..."
          multiline
          rows={2}
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </FormDialog>

      {/* Xác nhận xóa */}
      <ConfirmDialog
        open={!!deleting}
        title="Xóa giao dịch?"
        content={
          <>
            Bạn có chắc chắn muốn xóa giao dịch{' '}
            <strong>"{deleting?.note || deleting?.Category?.name || 'này'}"</strong>? Số dư ví sẽ được tự động hoàn tác.
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

