import { useState, useEffect, useCallback } from 'react'
import {
  Card,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import PercentRoundedIcon from '@mui/icons-material/PercentRounded'
import PageHeader from '../components/PageHeader'
import { StatCard } from '../components/Chart'
import { reportApi, getErrorMessage } from '../api'
import { fmtVND } from '../utils/format'
import t from '../utils/i18n'

export default function ReportsPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await reportApi.getSummary(selectedYear)
      setData(res.data)
    } catch (err) {
      setError(getErrorMessage(err, 'Không tải được báo cáo tài chính'))
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rounded" height={42} width={260} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={130} sx={{ flex: 1, borderRadius: 4 }} />
          ))}
        </Stack>
        <Skeleton variant="rounded" height={380} sx={{ borderRadius: 4 }} />
      </Stack>
    )
  }

  if (error) {
    return (
      <Card elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          ⚠️ {error}
        </Typography>
        <Button variant="contained" onClick={loadData} sx={{ mt: 2 }}>
          Thử lại
        </Button>
      </Card>
    )
  }

  const { totalIncome = 0, totalExpense = 0, netSavings = 0, savingsRate = 0, monthlyData = [], categoryExpenses = [] } = data || {}

  // Tìm giá trị max để scale chiều cao cột biểu đồ
  const maxVal = Math.max(...monthlyData.map((m) => Math.max(m.income, m.expense)), 1)

  return (
    <Stack spacing={3.5}>
      <PageHeader
        title={t('reportsHeaderTitle')}
        subtitle={t('reportsHeaderSub')}
        action={
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              sx={{ borderRadius: 2.5, fontWeight: 700, bgcolor: 'background.paper' }}
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <MenuItem key={y} value={y} sx={{ fontWeight: 600 }}>
                  {t('yearLabel')} {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />

      {/* 4 Thẻ thống kê chính */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
        <StatCard
          title={t('incomeSubYear')}
          value={fmtVND(totalIncome)}
          icon={TrendingUpRoundedIcon}
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          sub={`${t('yearLabel')} ${selectedYear}`}
        />
        <StatCard
          title={t('expenseSubYear')}
          value={fmtVND(totalExpense)}
          icon={TrendingDownRoundedIcon}
          gradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
          sub={`${t('yearLabel')} ${selectedYear}`}
        />
        <StatCard
          title={t('accumulating')}
          value={fmtVND(netSavings)}
          icon={SavingsRoundedIcon}
          gradient={netSavings >= 0 ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}
          sub={`${t('yearLabel')} ${selectedYear}`}
        />
        <StatCard
          title="Tỷ lệ tiết kiệm"
          value={`${savingsRate}%`}
          icon={PercentRoundedIcon}
          gradient="linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
          sub="Phần trăm tích lũy trên thu nhập"
        />
      </Stack>

      {/* Biểu đồ 12 tháng */}
      <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Thu chi 12 tháng trong năm {selectedYear}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              So sánh thu nhập và chi phí qua từng tháng
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981' }} />
              <Typography variant="caption" fontWeight={600}>Thu nhập</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
              <Typography variant="caption" fontWeight={600}>Chi tiêu</Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* Thanh đồ thị */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 260, gap: { xs: 1, sm: 2 }, pt: 2, pb: 1 }}>
          {monthlyData.map((m) => {
            const incH = Math.max((m.income / maxVal) * 200, 4)
            const expH = Math.max((m.expense / maxVal) * 200, 4)
            return (
              <Box
                key={m.month}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ height: 200, width: '100%', justifyContent: 'center' }}>
                  {/* Cột Thu */}
                  <Box
                    sx={{
                      width: { xs: 8, sm: 16 },
                      height: `${incH}px`,
                      bgcolor: '#10b981',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                    title={`Thu T${m.month}: ${fmtVND(m.income)}`}
                  />
                  {/* Cột Chi */}
                  <Box
                    sx={{
                      width: { xs: 8, sm: 16 },
                      height: `${expH}px`,
                      bgcolor: '#ef4444',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                    title={`Chi T${m.month}: ${fmtVND(m.expense)}`}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" fontWeight={600} mt={1}>
                  T{m.month}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Card>

      {/* Phân bổ chi tiêu theo danh mục */}
      <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', p: 3 }}>
        <Typography variant="h6" fontWeight={800} mb={1}>
          Cơ cấu chi tiêu theo danh mục
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Tỷ lệ phân bổ chi phí của các danh mục trong năm {selectedYear}
        </Typography>

        {categoryExpenses.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            Chưa có dữ liệu chi tiêu trong năm {selectedYear}
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            {categoryExpenses.map((cat) => (
              <Box key={cat.name}>
                <Stack direction="row" justifyContent="space-between" mb={0.75}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color }} />
                    <Typography variant="body2" fontWeight={700}>
                      {cat.name}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={700}>
                    {fmtVND(cat.total)}{' '}
                    <Typography component="span" variant="caption" color="text.secondary">
                      ({cat.percentage}%)
                    </Typography>
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={cat.percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: cat.color,
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Card>

      {/* Bảng chi tiết 12 tháng */}
      <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, pb: 1 }}>
          <Typography variant="h6" fontWeight={800}>
            Chi tiết từng tháng
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Tháng</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Tổng thu</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Tổng chi</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Chênh lệch</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthlyData.map((row) => {
                const diff = row.income - row.expense
                return (
                  <TableRow key={row.month} hover>
                    <TableCell sx={{ fontWeight: 600 }}>Tháng {row.month}</TableCell>
                    <TableCell align="right" sx={{ color: '#10b981', fontWeight: 600 }}>
                      +{fmtVND(row.income)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#ef4444', fontWeight: 600 }}>
                      -{fmtVND(row.expense)}
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={fmtVND(diff)}
                        color={diff >= 0 ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  )
}
