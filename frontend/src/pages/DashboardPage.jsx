import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  LinearProgress,
  Chip,
  Skeleton,
  Button,
  FormControl,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import { Link } from 'react-router-dom'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrackChangesRoundedIcon from '@mui/icons-material/TrackChangesRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import PageHeader from '../components/PageHeader'
import { StatCard, SimpleBarChart, MONTH_NAMES } from '../components/Chart'
import { walletApi, transactionApi, budgetApi, goalApi } from '../api'
import { fmtVND, fmtDate } from '../utils/format'
import { useAuth } from '../context/AuthContext'
import t from '../utils/i18n'

export default function DashboardPage() {
  const { user } = useAuth()
  const lang = user?.language || 'vi'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wallets, setWallets] = useState([])
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [goals, setGoals] = useState([])

  // Bộ lọc thời gian: 'month' (theo tháng/năm) hoặc 'year' (theo cả năm)
  const [filterMode, setFilterMode] = useState('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [wRes, tRes, bRes, gRes] = await Promise.all([
        walletApi.getAll(),
        transactionApi.getAll(),
        budgetApi.getAll(),
        goalApi.getAll(),
      ])
      setWallets(wRes.data)
      setTransactions(tRes.data)
      setBudgets(bRes.data)
      setGoals(gRes.data)
    } catch {
      setError('Không tải được dữ liệu. Hãy kiểm tra kết nối tới server.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  if (loading) {
    return (
      <Stack spacing={3.5}>
        <Skeleton variant="rounded" height={42} width={280} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={130} sx={{ flex: 1, borderRadius: 4 }} />
          ))}
        </Stack>
        <Skeleton variant="rounded" height={360} sx={{ borderRadius: 4 }} />
      </Stack>
    )
  }

  if (error) {
    return (
      <Card elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          ⚠️ {error}
        </Typography>
        <Button variant="contained" onClick={loadAll} sx={{ mt: 2 }}>
          Thử lại
        </Button>
      </Card>
    )
  }

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? t('greetingMorning', lang) : hour < 18 ? t('greetingAfternoon', lang) : t('greetingEvening', lang)
  const userName =
    JSON.parse(localStorage.getItem('user') || '{}')?.name?.split(' ').slice(-1)[0] || ''

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0)

  // Tính toán dữ liệu theo bộ lọc đã chọn (tháng/năm hoặc cả năm)
  let filterPrefix
  let incomeTitle
  let incomeSub
  let expenseTitle
  let expenseSub
  let chartTitle
  let chartSub
  const chartData = []

  if (filterMode === 'month') {
    filterPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
    incomeTitle = `${t('incomeTitle', lang)} T${selectedMonth}/${selectedYear}`
    incomeSub = `${t('incomeSubMonth', lang)} ${selectedMonth}/${selectedYear}`
    expenseTitle = `${t('expenseTitle', lang)} T${selectedMonth}/${selectedYear}`
    expenseSub = `${t('expenseSubMonth', lang)} ${selectedMonth}/${selectedYear}`
    chartTitle = lang === 'en'
      ? `Cash Flow (6 months to ${selectedMonth}/${selectedYear})`
      : `Dòng tiền Thu – Chi (6 tháng đến T${selectedMonth}/${selectedYear})`
    chartSub = lang === 'en'
      ? `Comparison of income and expenses up to ${selectedMonth}/${selectedYear}`
      : `So sánh tổng quan thu chi 6 tháng gần nhất tính đến T${selectedMonth}/${selectedYear}`

    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - 1 - i, 1)
      const p = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const txs = transactions.filter((t) => (t.transaction_date || '').startsWith(p))
      chartData.push({
        month: MONTH_NAMES[d.getMonth()] + (d.getFullYear() !== selectedYear ? `/${String(d.getFullYear()).slice(-2)}` : ''),
        income: txs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expense: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      })
    }
  } else {
    filterPrefix = `${selectedYear}-`
    incomeTitle = `${t('incomeTitle', lang)} ${selectedYear}`
    incomeSub = `${t('incomeSubYear', lang)} ${selectedYear}`
    expenseTitle = `${t('expenseTitle', lang)} ${selectedYear}`
    expenseSub = `${t('expenseSubYear', lang)} ${selectedYear}`
    chartTitle = lang === 'en'
      ? `Cash Flow 12 Months ${selectedYear}`
      : `Dòng tiền Thu – Chi 12 tháng năm ${selectedYear}`
    chartSub = lang === 'en'
      ? `Overview comparing income and expenses across 12 months in ${selectedYear}`
      : `So sánh tổng quan thu chi cả 12 tháng của năm ${selectedYear}`

    for (let i = 0; i < 12; i++) {
      const p = `${selectedYear}-${String(i + 1).padStart(2, '0')}`
      const txs = transactions.filter((t) => (t.transaction_date || '').startsWith(p))
      chartData.push({
        month: MONTH_NAMES[i],
        income: txs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expense: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      })
    }
  }

  const periodTx = transactions.filter((t) => (t.transaction_date || '').startsWith(filterPrefix))
  const periodIncome = periodTx
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0)
  const periodExpense = periodTx
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0)

  const savingTotal = goals.reduce((s, g) => s + Number(g.current_amount), 0)
  const activeGoals = goals.filter((g) => g.status === 'in_progress').length
  const overBudgets = budgets.filter((b) => b.isOverBudget).length

  return (
    <Stack spacing={3.5}>
      <PageHeader
        title={`${greeting}${userName ? ', ' + userName : ''} 👋`}
        subtitle={now.toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        badge={
          overBudgets > 0 ? (
            <Chip
              size="small"
              color="error"
              icon={<WarningAmberRoundedIcon sx={{ fontSize: '15px !important' }} />}
              label={`${overBudgets} ${t('overBudgetWarning', lang)}`}
              sx={{ fontWeight: 700 }}
            />
          ) : null
        }
        action={
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            {/* Chế độ lọc: Theo Tháng hoặc Theo Năm */}
            <ToggleButtonGroup
              value={filterMode}
              exclusive
              onChange={(_, val) => val && setFilterMode(val)}
              size="small"
              sx={{ bgcolor: 'background.paper', borderRadius: 2.5 }}
            >
              <ToggleButton value="month" sx={{ px: 1.5, py: 0.5, fontWeight: 700, fontSize: '0.8125rem' }}>
                {t('byMonth', lang)}
              </ToggleButton>
              <ToggleButton value="year" sx={{ px: 1.5, py: 0.5, fontWeight: 700, fontSize: '0.8125rem' }}>
                {t('byYear', lang)}
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Chọn Năm */}
            <FormControl size="small" sx={{ minWidth: 105 }}>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                sx={{ borderRadius: 2.5, fontWeight: 700, bgcolor: 'background.paper', fontSize: '0.875rem' }}
              >
                {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                  <MenuItem key={y} value={y} sx={{ fontWeight: 600 }}>
                    {t('yearLabel', lang)} {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Chọn Tháng (nếu ở chế độ theo tháng) */}
            {filterMode === 'month' && (
              <FormControl size="small" sx={{ minWidth: 115 }}>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  sx={{ borderRadius: 2.5, fontWeight: 700, bgcolor: 'background.paper', fontSize: '0.875rem' }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <MenuItem key={m} value={m} sx={{ fontWeight: 600 }}>
                      {t('monthLabel', lang)} {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        }
      />

      {/* 4 Cards Thống kê tài chính */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} flexWrap="wrap">
        <StatCard
          title={t('totalBalance', lang)}
          value={fmtVND(totalBalance)}
          icon={AccountBalanceWalletRoundedIcon}
          gradient="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
          sub={`${wallets.length} ${t('activeWallets', lang)}`}
        />
        <StatCard
          title={incomeTitle}
          value={fmtVND(periodIncome)}
          icon={TrendingUpRoundedIcon}
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          sub={incomeSub}
        />
        <StatCard
          title={expenseTitle}
          value={fmtVND(periodExpense)}
          icon={TrendingDownRoundedIcon}
          gradient="linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)"
          sub={expenseSub}
        />
        <StatCard
          title={t('accumulating', lang)}
          value={fmtVND(savingTotal)}
          icon={TrackChangesRoundedIcon}
          gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          sub={`${activeGoals} ${t('activeGoalsCount', lang)}`}
        />
      </Stack>

      {/* Biểu đồ thu chi */}
      <Card elevation={0} sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 3.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                {chartTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {chartSub}
              </Typography>
            </Box>
            <Button
              component={Link}
              to="/transactions"
              size="small"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{ fontWeight: 600 }}
            >
              {t('viewTransactions', lang)}
            </Button>
          </Stack>
          <SimpleBarChart data={chartData} />
        </CardContent>
      </Card>

      {/* 2 Cột: Ngân sách & Mục tiêu tiết kiệm */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Ngân sách */}
        <Card elevation={0} sx={{ flex: 1, borderRadius: 4 }}>
          <CardContent sx={{ p: 3.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {t('budgetControl', lang)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('budgetSub', lang)}
                </Typography>
              </Box>
              <Button component={Link} to="/budgets" size="small" endIcon={<ArrowForwardRoundedIcon />}>
                {t('details', lang)}
              </Button>
            </Stack>

            {budgets.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                {t('noBudget', lang)}
              </Typography>
            ) : (
              <Stack spacing={2.5}>
                {budgets.slice(0, 4).map((b) => (
                  <Box key={b.id}>
                    <Stack direction="row" justifyContent="space-between" mb={0.75} alignItems="center">
                      <Typography variant="body2" fontWeight={700}>
                        {b.Category?.name || 'Danh mục'}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={b.isOverBudget ? 'error.main' : 'text.secondary'}
                        fontWeight={700}
                      >
                        {fmtVND(b.spent)} / {fmtVND(b.limit_amount)}
                        {b.isOverBudget && ' (Vượt hạn)'}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(b.percentage, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: b.isOverBudget
                            ? 'linear-gradient(90deg, #f43f5e, #e11d48)'
                            : b.percentage > 80
                              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                              : 'linear-gradient(90deg, #10b981, #059669)',
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Mục tiêu tiết kiệm */}
        <Card elevation={0} sx={{ flex: 1, borderRadius: 4 }}>
          <CardContent sx={{ p: 3.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {t('savingsGoal', lang)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('savingsSub', lang)}
                </Typography>
              </Box>
              <Button component={Link} to="/goals" size="small" endIcon={<ArrowForwardRoundedIcon />}>
                {t('details', lang)}
              </Button>
            </Stack>

            {goals.length === 0 ? (
              <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                {t('noGoal', lang)}
              </Typography>
            ) : (
              <Stack spacing={2.5}>
                {goals.slice(0, 4).map((g) => {
                  const pct = Math.min(
                    Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100),
                    100
                  )
                  const isDone = g.status === 'completed'

                  return (
                    <Box key={g.id}>
                      <Stack direction="row" justifyContent="space-between" mb={0.75} alignItems="center">
                        <Typography variant="body2" fontWeight={700}>
                          {isDone ? '🏆 ' : ''}
                          {g.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={`${pct}%`}
                          color={isDone ? 'success' : 'primary'}
                          variant={isDone ? 'filled' : 'outlined'}
                          sx={{ height: 22, fontWeight: 700, fontSize: 11 }}
                        />
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        color={isDone ? 'success' : 'primary'}
                        sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }}
                      />
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                        {fmtVND(g.current_amount)} / {fmtVND(g.target_amount)}
                        {g.deadline ? ` · Hạn chót: ${fmtDate(g.deadline)}` : ''}
                      </Typography>
                    </Box>
                  )
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  )
}

