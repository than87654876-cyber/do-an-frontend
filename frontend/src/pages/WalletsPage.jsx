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
  Card,
  CardContent,
  alpha,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded'
import PageCard from '../components/PageCard'
import PageHeader from '../components/PageHeader'
import { FormDialog, ConfirmDialog, MoneyInput } from '../components/FormDialog'
import { walletApi, getErrorMessage } from '../api'
import { fmtVND, getWalletTypeLabel } from '../utils/format'
import t from '../utils/i18n'

const TYPE_META = {
  cash: {
    label: 'Tiền mặt',
    icon: <PaymentsRoundedIcon />,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  bank: {
    label: 'Ngân hàng',
    icon: <AccountBalanceRoundedIcon />,
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
  },
  'e-wallet': {
    label: 'Ví điện tử',
    icon: <PhoneAndroidRoundedIcon />,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  },
}

const emptyForm = { name: '', type: 'cash', balance: '' }

export default function WalletsPage() {
  const [wallets, setWallets] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')

  const [deleting, setDeleting] = useState(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transfer, setTransfer] = useState({ from_wallet_id: '', to_wallet_id: '', amount: '' })

  const load = useCallback(async () => {
    setStatus({ loading: true, error: '' })
    try {
      const res = await walletApi.getAll()
      setWallets(res.data)
    } catch (err) {
      setStatus({ loading: false, error: getErrorMessage(err) })
      return
    }
    setStatus({ loading: false, error: '' })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (w) => {
    setEditing(w)
    setForm({ name: w.name, type: w.type, balance: '' })
    setFormError('')
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.type) {
      setFormError('Vui lòng nhập tên và chọn loại ví')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await walletApi.update(editing.id, { name: form.name, type: form.type })
        setSnack({ msg: 'Đã cập nhật thông tin ví', severity: 'success' })
      } else {
        await walletApi.create({
          name: form.name,
          type: form.type,
          balance: Number(form.balance) || 0,
        })
        setSnack({ msg: 'Đã tạo ví mới thành công ✨', severity: 'success' })
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
      await walletApi.remove(deleting.id)
      setSnack({ msg: 'Đã xóa ví thành công', severity: 'success' })
      setDeleting(null)
      load()
    } catch (err) {
      setSnack({ msg: getErrorMessage(err), severity: 'error' })
      setDeleting(null)
    } finally {
      setSaving(false)
    }
  }

  const handleTransfer = async () => {
    const { from_wallet_id, to_wallet_id, amount } = transfer
    if (!from_wallet_id || !to_wallet_id || !amount || Number(amount) <= 0) {
      setSnack({ msg: 'Vui lòng chọn ví nguồn, ví đích và số tiền hợp lệ', severity: 'warning' })
      return
    }
    if (from_wallet_id === to_wallet_id) {
      setSnack({ msg: 'Ví nguồn và ví đích không được trùng nhau', severity: 'warning' })
      return
    }
    setSaving(true)
    try {
      await walletApi.transfer(from_wallet_id, to_wallet_id, Number(amount))
      setSnack({ msg: 'Chuyển tiền giữa các ví thành công 🎉', severity: 'success' })
      setTransferOpen(false)
      setTransfer({ from_wallet_id: '', to_wallet_id: '', amount: '' })
      load()
    } catch (err) {
      setSnack({ msg: getErrorMessage(err), severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const total = wallets.reduce((s, w) => s + Number(w.balance), 0)

  return (
    <Stack spacing={3.5}>
      <PageHeader
        title={t('walletsHeaderTitle')}
        subtitle={`${t('walletsSubPrefix')} ${wallets.length} ${t('activeWalletsUnit')} · ${t('totalBalanceLabel')}: ${fmtVND(total)}`}
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<SwapHorizRoundedIcon />}
              onClick={() => setTransferOpen(true)}
              disabled={wallets.length < 2}
            >
              {t('transferMoney')}
            </Button>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
              {t('addNewWallet')}
            </Button>
          </Stack>
        }
      />

      <PageCard
        loading={status.loading}
        error={status.error}
        onRetry={load}
        isEmpty={wallets.length === 0}
        emptyIcon="👛"
        emptyText='Chưa có ví nào. Hãy bấm "Thêm ví mới" để bắt đầu theo dõi tài sản của bạn.'
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {wallets.map((w) => {
            const meta = TYPE_META[w.type] || TYPE_META.cash

            return (
              <Card
                key={w.id}
                elevation={0}
                sx={{
                  borderRadius: 4,
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: (theme) =>
                      theme.palette.mode === 'light'
                        ? '0 12px 24px -10px rgba(15, 23, 42, 0.1)'
                        : '0 12px 24px -10px rgba(0, 0, 0, 0.4)',
                    '& .wallet-actions': { opacity: 1 },
                  },
                }}
              >
                {/* Top Accent Gradient Bar */}
                <Box sx={{ height: 4, background: meta.gradient }} />

                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 3,
                          bgcolor: alpha(meta.color, 0.1),
                          color: meta.color,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        {meta.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} noWrap>
                          {w.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={meta.label}
                          sx={{
                            height: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            bgcolor: alpha(meta.color, 0.08),
                            color: meta.color,
                            mt: 0.25,
                          }}
                        />
                      </Box>
                    </Stack>
                  </Stack>

                  <Box sx={{ my: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Số dư khả dụng
                    </Typography>
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      sx={{ letterSpacing: '-0.02em', color: 'text.primary', mt: 0.25 }}
                    >
                      {fmtVND(w.balance)}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                    className="wallet-actions"
                    sx={{
                      pt: 1,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      opacity: { xs: 1, sm: 0.8 },
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <Tooltip title="Chuyển tiền từ ví này">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setTransfer({
                            from_wallet_id: String(w.id),
                            to_wallet_id: '',
                            amount: '',
                          })
                          setTransferOpen(true)
                        }}
                        sx={{ bgcolor: 'action.hover' }}
                      >
                        <SwapHorizRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sửa tên ví">
                      <IconButton size="small" onClick={() => openEdit(w)} sx={{ bgcolor: 'action.hover' }}>
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa ví">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleting(w)}
                        sx={{ bgcolor: 'action.hover' }}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </PageCard>

      {/* Thêm / Sửa ví */}
      <FormDialog
        open={formOpen}
        title={editing ? 'Cập nhật ví' : 'Thêm ví mới'}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSave}
        saving={saving}
        error={formError}
      >
        <TextField
          fullWidth
          label="Tên ví"
          placeholder="Ví dụ: Tiền mặt hàng ngày, Techcombank, Momo..."
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <TextField
          select
          fullWidth
          label="Loại ví"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <MenuItem value="cash">💵 Tiền mặt</MenuItem>
          <MenuItem value="bank">🏦 Tài khoản Ngân hàng</MenuItem>
          <MenuItem value="e-wallet">📱 Ví điện tử (Momo, ZaloPay...)</MenuItem>
        </TextField>
        {!editing && (
          <MoneyInput
            label="Số dư ban đầu"
            value={form.balance}
            onChange={(e) => setForm({ ...form, balance: e.target.value })}
          />
        )}
        {editing && (
          <Alert severity="info" sx={{ borderRadius: 2.5 }}>
            Số dư ví được đồng bộ tự động qua các giao dịch và chuyển tiền — không sửa trực tiếp.
          </Alert>
        )}
      </FormDialog>

      {/* Chuyển tiền giữa các ví */}
      <FormDialog
        open={transferOpen}
        title="Chuyển tiền giữa các ví"
        onClose={() => setTransferOpen(false)}
        onSubmit={handleTransfer}
        saving={saving}
        submitLabel="Xác nhận chuyển"
        error=""
      >
        <TextField
          select
          fullWidth
          label="Từ ví nguồn"
          value={transfer.from_wallet_id}
          onChange={(e) => setTransfer({ ...transfer, from_wallet_id: e.target.value })}
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
          label="Đến ví đích"
          value={transfer.to_wallet_id}
          onChange={(e) => setTransfer({ ...transfer, to_wallet_id: e.target.value })}
        >
          {wallets
            .filter((w) => String(w.id) !== String(transfer.from_wallet_id))
            .map((w) => (
              <MenuItem key={w.id} value={w.id}>
                {w.name} — ({fmtVND(w.balance)})
              </MenuItem>
            ))}
        </TextField>

        <MoneyInput
          label="Số tiền chuyển"
          value={transfer.amount}
          onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })}
        />
      </FormDialog>

      {/* Xác nhận xóa ví */}
      <ConfirmDialog
        open={!!deleting}
        title="Xóa ví tiền?"
        content={
          <>
            Bạn có chắc chắn muốn xóa ví <strong>"{deleting?.name}"</strong>? Toàn bộ giao dịch gắn với ví này cũng sẽ bị xóa.
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

