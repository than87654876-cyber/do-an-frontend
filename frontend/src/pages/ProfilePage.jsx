import { useEffect, useState, useCallback } from 'react'
import {
  Stack,
  TextField,
  Button,
  MenuItem,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  Typography,
  Avatar,
  Box,
  Chip,
} from '@mui/material'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'
import { useAuth } from '../context/AuthContext'
import { useThemeMode } from '../theme/AppTheme'
import { accountApi } from '../api'
import { getErrorMessage } from '../api/http'
import { fmtDate } from '../utils/format'
import t from '../utils/i18n'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { mode, toggleMode } = useThemeMode()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ username: '', email: '', language: 'vi', currency: 'VND' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')

  const [snack, setSnack] = useState(null)

  // Ngôn ngữ hiển thị giao diện PHẢI theo cài đặt đã lưu của user (CHỈ ĐỔI KHI BẤM LƯU THAY ĐỔI)
  const currentLang = user?.language || 'vi'

  const LANGUAGES = [
    { value: 'vi', label: currentLang === 'en' ? 'Vietnamese (Tiếng Việt)' : 'Tiếng Việt' },
    { value: 'en', label: currentLang === 'en' ? 'English' : 'Tiếng Anh (English)' },
  ]
  const CURRENCIES = [
    { value: 'VND', label: 'VND (₫)' },
    { value: 'USD', label: 'USD ($)' },
  ]

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await accountApi.getProfile()
      setProfile(res.data)
      const dbLang = res.data.language || 'vi'
      const dbCurr = res.data.currency || 'VND'
      setForm({
        username: res.data.username || '',
        email: res.data.email || '',
        language: dbLang,
        currency: dbCurr,
      })
      // Đồng bộ thông tin đã lưu từ database vào session
      updateUser({
        name: res.data.username,
        username: res.data.username,
        email: res.data.email,
        language: dbLang,
        currency: dbCurr,
      })
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [updateUser])

  useEffect(() => {
    load()
  }, [load])

  const saveProfile = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.username.trim() || !form.email.trim()) {
      setFormError(t('emptyNameEmail', currentLang))
      return
    }
    setSaving(true)
    try {
      const res = await accountApi.updateProfile(form)
      setProfile(res.data)
      // Khi bấm lưu thành công thì mới cập nhật toàn bộ web sang ngôn ngữ và tiền tệ mới
      updateUser({
        name: res.data.username,
        username: res.data.username,
        email: res.data.email,
        language: res.data.language,
        currency: res.data.currency,
      })
      setSnack({
        msg: t('savedSuccess', res.data.language),
        severity: 'success',
      })
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const changeDarkMode = () => {
    const willBeDark = mode === 'light'
    toggleMode()
    accountApi.updateProfile({ dark_mode: willBeDark }).catch(() => {})
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pw.next.length < 6) {
      setPwError(t('shortPassword', currentLang))
      return
    }
    if (pw.next !== pw.confirm) {
      setPwError(t('passwordNotMatch', currentLang))
      return
    }
    setPwSaving(true)
    try {
      await accountApi.changePassword(pw.current, pw.next)
      setPw({ current: '', next: '', confirm: '' })
      setSnack({ msg: t('passwordChangedSuccess', currentLang), severity: 'success' })
    } catch (err) {
      setPwError(getErrorMessage(err))
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <Stack spacing={3.5}>
      <PageHeader
        title={t('profileTitle', currentLang)}
        subtitle={t('profileSub', currentLang)}
      />

      <PageCard title={t('accountInfo', currentLang)} loading={loading} error={error} onRetry={load}>
        {profile && (
          <Stack component="form" onSubmit={saveProfile} spacing={2.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  fontWeight: 700,
                  bgcolor: profile.role === 'admin' ? 'secondary.main' : 'primary.main',
                }}
              >
                {profile.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{profile.username}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('joinedDate', currentLang)} {fmtDate(profile.createdAt, currentLang)}
                </Typography>
              </Box>
              {profile.role === 'admin' && (
                <Chip size="small" color="secondary" label={t('adminBadge', currentLang)} sx={{ fontWeight: 700 }} />
              )}
            </Stack>

            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label={t('displayName', currentLang)}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <TextField
                select
                label={t('language', currentLang)}
                value={form.language}
                onChange={(e) => {
                  const newLang = e.target.value
                  setForm({ ...form, language: newLang })
                }}
                fullWidth
              >
                {LANGUAGES.map((l) => (
                  <MenuItem key={l.value} value={l.value}>
                    {l.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t('currency', currentLang)}
                value={form.currency}
                onChange={(e) => {
                  const newCurr = e.target.value
                  setForm({ ...form, currency: newCurr })
                }}
                fullWidth
              >
                {CURRENCIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <FormControlLabel
              control={<Switch checked={mode === 'dark'} onChange={changeDarkMode} />}
              label={t('darkModeLabel', currentLang)}
            />

            <Box>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? t('saving', currentLang) : t('saveChanges', currentLang)}
              </Button>
            </Box>
          </Stack>
        )}
      </PageCard>

      <PageCard title={t('changePassword', currentLang)} subtitle={t('changePasswordSub', currentLang)}>
        <Stack component="form" onSubmit={savePassword} spacing={2.5} sx={{ maxWidth: 420 }}>
          {pwError && <Alert severity="error">{pwError}</Alert>}
          <TextField
            label={t('currentPassword', currentLang)}
            type="password"
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
            fullWidth
          />
          <TextField
            label={t('newPassword', currentLang)}
            type="password"
            value={pw.next}
            onChange={(e) => setPw({ ...pw, next: e.target.value })}
            fullWidth
          />
          <TextField
            label={t('confirmNewPassword', currentLang)}
            type="password"
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            fullWidth
          />
          <Box>
            <Button type="submit" variant="contained" disabled={pwSaving || !pw.current}>
              {pwSaving ? t('updatingPassword', currentLang) : t('savePasswordBtn', currentLang)}
            </Button>
          </Box>
        </Stack>
      </PageCard>

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