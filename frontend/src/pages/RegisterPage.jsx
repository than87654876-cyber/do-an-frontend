import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  Paper,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { authApi, getErrorMessage } from '../api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name.trim()) {
      setError('Vui lòng nhập họ và tên')
      return
    }
    if (!form.email.trim()) {
      setError('Vui lòng nhập email')
      return
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)
    try {
      await authApi.register(form.name.trim(), form.email.trim(), form.password)
      setSuccess('Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng ký không thành công. Hãy chắc chắn backend đã cập nhật code mới và đang chạy.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2.5,
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
          boxShadow: (theme) =>
            theme.palette.mode === 'light'
              ? '0 20px 48px -12px rgba(15, 23, 42, 0.08)'
              : '0 20px 48px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Logo & Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <AccountBalanceRoundedIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              FinAdmin
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Quản lý tài chính cá nhân
            </Typography>
          </Box>
        </Stack>

        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
          Đăng ký tài khoản ✨
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Tạo tài khoản người dùng để bắt đầu quản lý thu chi cá nhân
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            icon={<CheckCircleRoundedIcon fontSize="inherit" />}
            sx={{ mb: 2.5, borderRadius: 2.5 }}
          >
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.2}>
            <TextField
              label="Họ và tên"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              fullWidth
              placeholder="Nguyễn Văn A"
            />

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
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </Button>

            <Typography variant="body2" textAlign="center" color="text.secondary" mt={1}>
              Đã có tài khoản?{' '}
              <Link component={RouterLink} to="/login" fontWeight={700} underline="hover">
                Đăng nhập ngay
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
