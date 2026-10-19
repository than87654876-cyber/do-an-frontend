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
  Tabs,
  Tab,
  Card,
  CardContent,
  alpha,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import FastfoodRoundedIcon from '@mui/icons-material/FastfoodRounded'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import MovieRoundedIcon from '@mui/icons-material/MovieRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import HealthAndSafetyRoundedIcon from '@mui/icons-material/HealthAndSafetyRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import FlightRoundedIcon from '@mui/icons-material/FlightRounded'
import PetsRoundedIcon from '@mui/icons-material/PetsRounded'
import CoffeeRoundedIcon from '@mui/icons-material/CoffeeRounded'
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded'
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded'
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import PageCard from '../components/PageCard'
import PageHeader from '../components/PageHeader'
import { FormDialog, ConfirmDialog } from '../components/FormDialog'
import { categoryApi, getErrorMessage } from '../api'
import t from '../utils/i18n'

const ICON_MAP = {
  restaurant: <FastfoodRoundedIcon fontSize="small" />,
  directions_car: <DirectionsCarRoundedIcon fontSize="small" />,
  shopping_cart: <ShoppingCartRoundedIcon fontSize="small" />,
  movie: <MovieRoundedIcon fontSize="small" />,
  receipt: <ReceiptLongRoundedIcon fontSize="small" />,
  payments: <PaymentsRoundedIcon fontSize="small" />,
  trending_up: <TrendingUpRoundedIcon fontSize="small" />,
  home: <HomeRoundedIcon fontSize="small" />,
  health_and_safety: <HealthAndSafetyRoundedIcon fontSize="small" />,
  school: <SchoolRoundedIcon fontSize="small" />,
  flight: <FlightRoundedIcon fontSize="small" />,
  pets: <PetsRoundedIcon fontSize="small" />,
  coffee: <CoffeeRoundedIcon fontSize="small" />,
  sports_esports: <SportsEsportsRoundedIcon fontSize="small" />,
  phone_iphone: <PhoneIphoneRoundedIcon fontSize="small" />,
  card_giftcard: <CardGiftcardRoundedIcon fontSize="small" />,
}

const ICON_CHOICES = [
  { id: 'restaurant', label: 'Ăn uống' },
  { id: 'coffee', label: 'Cà phê / Trà' },
  { id: 'shopping_cart', label: 'Mua sắm' },
  { id: 'directions_car', label: 'Đi lại' },
  { id: 'home', label: 'Nhà cửa' },
  { id: 'receipt', label: 'Hóa đơn' },
  { id: 'payments', label: 'Tiền lương' },
  { id: 'trending_up', label: 'Đầu tư' },
  { id: 'health_and_safety', label: 'Sức khỏe' },
  { id: 'school', label: 'Học tập' },
  { id: 'sports_esports', label: 'Giải trí' },
  { id: 'movie', label: 'Phim ảnh' },
  { id: 'flight', label: 'Du lịch' },
  { id: 'pets', label: 'Thú cưng' },
  { id: 'phone_iphone', label: 'Công nghệ' },
  { id: 'card_giftcard', label: 'Quà tặng' },
]

const COLOR_PALETTE = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
]

const emptyForm = { name: '', type: 'expense', icon: 'shopping_cart', color: '#ef4444' }

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [saving, setSaving] = useState(false)
  const [snack, setSnack] = useState(null)
  const [tab, setTab] = useState('all') // all | expense | income

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setStatus({ loading: true, error: '' })
    try {
      const res = await categoryApi.getAll()
      setCategories(res.data)
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
    setForm(emptyForm)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      name: c.name,
      type: c.type,
      icon: c.icon || 'shopping_cart',
      color: c.color || '#ef4444',
    })
    setFormError('')
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError('Vui lòng nhập tên danh mục')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await categoryApi.update(editing.id, form)
        setSnack({ msg: 'Đã cập nhật danh mục', severity: 'success' })
      } else {
        await categoryApi.create(form)
        setSnack({ msg: 'Đã tạo danh mục mới 🎉', severity: 'success' })
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
      await categoryApi.remove(deleting.id)
      setSnack({ msg: 'Đã xóa danh mục thành công', severity: 'success' })
      setDeleting(null)
      load()
    } catch (err) {
      setSnack({ msg: getErrorMessage(err), severity: 'error' })
      setDeleting(null)
    } finally {
      setSaving(false)
    }
  }

  const filteredCategories = categories.filter((c) => {
    if (tab === 'expense') return c.type === 'expense'
    if (tab === 'income') return c.type === 'income'
    return true
  })

  const expenseCount = categories.filter((c) => c.type === 'expense').length
  const incomeCount = categories.filter((c) => c.type === 'income').length

  return (
    <Stack spacing={3.5}>
      <PageHeader
        title={t('categoriesHeaderTitle')}
        subtitle={`${categories.length} ${t('navCategories').toLowerCase()} · ${expenseCount} ${t('filterExpense').toLowerCase()} · ${incomeCount} ${t('filterIncome').toLowerCase()}`}
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            {t('addNewCategory')}
          </Button>
        }
      />

      <PageCard
        loading={status.loading}
        error={status.error}
        onRetry={load}
        isEmpty={filteredCategories.length === 0}
        emptyIcon="🏷️"
        emptyText='Không có danh mục nào trong nhóm này. Hãy bấm "Thêm danh mục" để tạo mới.'
      >
        {/* Tab lọc: Tất cả / Chi tiêu / Thu nhập */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                fontSize: '0.875rem',
                textTransform: 'none',
              },
            }}
          >
            <Tab label={`${t('filterAll')} (${categories.length})`} value="all" />
            <Tab label={`${t('filterExpense')} (${expenseCount})`} value="expense" />
            <Tab label={`${t('filterIncome')} (${incomeCount})`} value="income" />
          </Tabs>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2.25,
          }}
        >
          {filteredCategories.map((c) => {
            const isIncome = c.type === 'income'
            const color = c.color || (isIncome ? '#10b981' : '#ef4444')
            const iconElement = ICON_MAP[c.icon] || <CategoryRoundedIcon fontSize="small" />

            return (
              <Card
                key={c.id}
                elevation={0}
                sx={{
                  borderRadius: 3.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) =>
                      theme.palette.mode === 'light'
                        ? '0 10px 20px -8px rgba(15, 23, 42, 0.08)'
                        : '0 10px 20px -8px rgba(0, 0, 0, 0.35)',
                    '& .cat-actions': { opacity: 1 },
                  },
                }}
              >
                <CardContent sx={{ p: 2.25 }}>
                  <Stack direction="row" spacing={1.75} alignItems="center">
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 3,
                        bgcolor: alpha(color, 0.12),
                        color,
                        flexShrink: 0,
                      }}
                    >
                      {iconElement}
                    </Avatar>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={800} noWrap>
                        {c.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={isIncome ? 'Thu nhập' : 'Chi tiêu'}
                        color={isIncome ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ mt: 0.5, height: 20, fontSize: 10, fontWeight: 700 }}
                      />
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.5}
                      className="cat-actions"
                      sx={{
                        opacity: { xs: 1, sm: 0 },
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <Tooltip title="Sửa">
                        <IconButton size="small" onClick={() => openEdit(c)}>
                          <EditRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton size="small" color="error" onClick={() => setDeleting(c)}>
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
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

      {/* Form thêm / sửa danh mục */}
      <FormDialog
        open={formOpen}
        title={editing ? 'Sửa danh mục' : 'Thêm danh mục mới'}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSave}
        saving={saving}
        error={formError}
      >
        <TextField
          fullWidth
          label="Tên danh mục"
          placeholder="Ví dụ: Tiền chợ, Xăng xe, Lương thưởng..."
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <TextField
          select
          fullWidth
          label="Loại danh mục"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <MenuItem value="expense">💸 Khoản Chi tiêu</MenuItem>
          <MenuItem value="income">💰 Khoản Thu nhập</MenuItem>
        </TextField>

        <TextField
          select
          fullWidth
          label="Biểu tượng đại diện"
          value={form.icon}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
        >
          {ICON_CHOICES.map((ic) => (
            <MenuItem key={ic.id} value={ic.id}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                {ICON_MAP[ic.id] || <CategoryRoundedIcon fontSize="small" />}
                <Typography variant="body2">{ic.label}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </TextField>

        {/* Color Palette Picker */}
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
            Màu sắc nhận diện:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {COLOR_PALETTE.map((color) => {
              const isSelected = form.color === color
              return (
                <Box
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: color,
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    border: '2px solid',
                    borderColor: isSelected ? 'text.primary' : 'transparent',
                    boxShadow: isSelected ? '0 0 0 2px rgba(0,0,0,0.1)' : 'none',
                    transition: 'transform 0.15s',
                    '&:hover': { transform: 'scale(1.15)' },
                  }}
                />
              )
            })}
          </Stack>
        </Box>

        {/* Preview */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: 'action.hover',
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Avatar
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              bgcolor: alpha(form.color, 0.12),
              color: form.color,
            }}
          >
            {ICON_MAP[form.icon] || <CategoryRoundedIcon fontSize="small" />}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={800}>
              {form.name || 'Xem trước danh mục'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {form.type === 'expense' ? 'Khoản chi tiêu' : 'Khoản thu nhập'}
            </Typography>
          </Box>
        </Stack>
      </FormDialog>

      {/* Xác nhận xóa */}
      <ConfirmDialog
        open={!!deleting}
        title="Xóa danh mục?"
        content={
          <>
            Bạn có chắc chắn muốn xóa danh mục <strong>"{deleting?.name}"</strong>? Các giao dịch và ngân sách liên quan cũng sẽ bị ảnh hưởng.
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

