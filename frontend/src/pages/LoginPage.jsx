import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  Paper,
  Avatar,
  useMediaQuery,
  useTheme,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import PieChartRoundedIcon from '@mui/icons-material/PieChartRounded'
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { useAuth } from '../context/AuthContext'
import { authApi, getErrorMessage } from '../api'

const FEATURES = [
  { icon: <AccountBalanceWalletRoundedIcon />, title: 'Quản lý đa ví', desc: 'Tiền mặt, tài khoản ngân hàng, ví điện tử' },
  { icon: <TrendingUpRoundedIcon />, title: 'Theo dõi thu – chi', desc: 'Tự động tính toán và đối soát số dư ví tức thì' },
  { icon: <PieChartRoundedIcon />, title: 'Kiểm soát ngân sách', desc: 'Hạn mức chi tiêu theo danh mục, cảnh báo vượt hạn' },
  { icon: <TrackChangesRoundedIcon />, title: 'Mục tiêu tài chính', desc: 'Tích lũy định kỳ với tiến độ trực quan, sinh động' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const [tab, setTab] = useState(0) // 0: Đăng nhập, 1: Đăng ký
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // Quên mật khẩu dialog state
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotPassword, setForgotPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotErr, setForgotErr] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (tab === 0) {
        // Đăng nhập
        await login(form.email, form.password)
        navigate('/')
      } else {
        // Đăng ký
        if (!form.name.trim()) {
          setError('Vui lòng nhập họ và tên')
          setLoading(false)
          return
        }
        if (form.password.length < 6) {
          setError('Mật khẩu phải có ít nhất 6 ký tự')
          setLoading(false)
          return
        }
        if (form.password !== form.confirmPassword) {
          setError('Mật khẩu xác nhận không khớp')
          setLoading(false)
          return
        }

        await authApi.register(form.name.trim(), form.email.trim(), form.password)
        setSuccessMsg('Đăng ký tài khoản thành công! Đang tự động đăng nhập...')

        // Auto login sau khi đăng ký
        setTimeout(async () => {
          try {
            await login(form.email, form.password)
            navigate('/')
          } catch {
            setTab(0)
            setSuccessMsg('Đăng ký thành công! Vui lòng đăng nhập.')
          }
        }, 1200)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const leftPanel = (
    <Box
      sx={{
        flex: 1.1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        p: { xs: 4, md: 8, lg: 10 },
        color: '#fff',
        background: 'linear-gradient(145deg, #1e3a8a 0%, #1e40af 35%, #2563eb 70%, #0d9488 120%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background soft circles */}
      <Box
        sx={{
          position: 'absolute',
          width: 440,
          height: 440,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,.05)',
          top: -140,
          right: -100,
          filter: 'blur(30px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          bgcolor: 'rgba(13, 148, 136, 0.2)',
          bottom: -80,
          left: -60,
          filter: 'blur(40px)',
        }}
      />

      {/* Brand logo */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={5} sx={{ position: 'relative' }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 3.5,
            bgcolor: 'rgba(255,255,255, 0.18)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
          }}
        >
          <AccountBalanceRoundedIcon sx={{ fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
            FinAdmin
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>
            Quản Lý Tài Chính Thông Minh
          </Typography>
        </Box>
      </Stack>

      <Typography
        variant="h3"
        fontWeight={800}
        sx={{ lineHeight: 1.25, letterSpacing: '-0.02em', mb: 2, position: 'relative' }}
      >
        Nắm bắt tài chính, <br />
        kiến tạo tương lai.
      </Typography>
      <Typography
        variant="body1"
        sx={{ opacity: 0.85, mb: 6, maxWidth: 480, fontSize: '1rem', lineHeight: 1.6 }}
      >
        Giải pháp theo dõi thu chi, phân bổ ngân sách và thiết lập mục tiêu tài chính cá nhân khoa học và hiện đại.
      </Typography>

      <Stack spacing={3} sx={{ position: 'relative' }}>
        {FEATURES.map((f) => (
          <Stack key={f.title} direction="row" spacing={2.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255, 0.14)',
                backdropFilter: 'blur(6px)',
                color: '#fff',
                width: 44,
                height: 44,
                borderRadius: 3,
              }}
            >
              {f.icon}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                {f.title}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                {f.desc}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      {isDesktop && leftPanel}

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 4, md: 6 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 440,
            borderRadius: 4.5,
            p: { xs: 3, sm: 4.5 },
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: (t) =>
              t.palette.mode === 'light'
                ? '0 20px 48px -12px rgba(15, 23, 42, 0.08)'
                : '0 20px 48px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Mobile Logo */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            mb={3}
            sx={{ display: { xs: 'flex', md: 'none' } }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
              }}
            >
              <AccountBalanceRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                FinAdmin
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Quản lý tài chính cá nhân
              </Typography>
            </Box>
          </Stack>

          {/* Tab Selector */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => {
                setTab(v)
                setError('')
                setSuccessMsg('')
              }}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  textTransform: 'none',
                  py: 1.5,
                },
              }}
            >
              <Tab label="Đăng nhập" />
              <Tab label="Đăng ký tài khoản" />
            </Tabs>
          </Box>

          <Box mb={3}>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
              {tab === 0 ? 'Chào mừng trở lại! 👋' : 'Tạo tài khoản mới ✨'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tab === 0
                ? 'Nhập email và mật khẩu của bạn để tiếp tục'
                : 'Bắt đầu quản lý tài chính cá nhân của bạn ngay hôm nay'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>
              {error}
            </Alert>
          )}

          {successMsg && (
            <Alert
              severity="success"
              icon={<CheckCircleRoundedIcon fontSize="inherit" />}
              sx={{ mb: 2.5, borderRadius: 2.5 }}
            >
              {successMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.25}>
              {tab === 1 && (
                <TextField
                  label="Họ và tên"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  fullWidth
                  placeholder="Nguyễn Văn A"
                />
              )}

              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
                placeholder="example@gmail.com"
              />

              <TextField
                label="Mật khẩu"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                required
                fullWidth
                placeholder="Tối thiểu 6 ký tự"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {tab === 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setForgotErr('')
                      setForgotMsg('')
                      setForgotOpen(true)
                    }}
                    sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    Quên mật khẩu?
                  </Button>
                </Box>
              )}

              {tab === 1 && (
                <TextField
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  fullWidth
                  placeholder="Nhập lại mật khẩu"
                />
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.35,
                  borderRadius: 3,
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  mt: 1,
                }}
              >
                {loading
                  ? tab === 0 ? 'Đang đăng nhập...' : 'Đang khởi tạo tài khoản...'
                  : tab === 0 ? 'Đăng nhập' : 'Tạo tài khoản'}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>

      {/* Dialog Quên mật khẩu */}
      <Dialog
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Đặt lại mật khẩu</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Nhập email tài khoản của bạn và mật khẩu mới để thiết lập lại.
          </Typography>
          {forgotErr && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{forgotErr}</Alert>}
          {forgotMsg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{forgotMsg}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email đã đăng ký"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Mật khẩu mới"
              type="password"
              value={forgotPassword}
              onChange={(e) => setForgotPassword(e.target.value)}
              fullWidth
              required
              helperText="Tối thiểu 6 ký tự"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setForgotOpen(false)} sx={{ fontWeight: 600 }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            disabled={forgotLoading}
            onClick={async () => {
              setForgotErr('')
              setForgotMsg('')
              if (!forgotEmail.trim() || !forgotPassword) {
                setForgotErr('Vui lòng nhập email và mật khẩu mới')
                return
              }
              if (forgotPassword.length < 6) {
                setForgotErr('Mật khẩu mới phải từ 6 ký tự trở lên')
                return
              }
              setForgotLoading(true)
              try {
                const res = await authApi.forgotPassword(forgotEmail.trim(), forgotPassword)
                setForgotMsg(res.data.message || 'Đặt lại mật khẩu thành công!')
                setTimeout(() => {
                  setForgotOpen(false)
                }, 1200)
              } catch (err) {
                setForgotErr(getErrorMessage(err))
              } finally {
                setForgotLoading(false)
              }
            }}
            sx={{ borderRadius: 2.5, fontWeight: 700 }}
          >
            {forgotLoading ? 'Đang cập nhật...' : 'Xác nhận đặt lại'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

