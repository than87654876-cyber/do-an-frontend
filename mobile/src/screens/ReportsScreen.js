import { useCallback, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { reportApi, getErrorMessage } from '../api'
import { fmtVND } from '../format'

export default function ReportsScreen() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await reportApi.getSummary(selectedYear)
      setData(res.data)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedYear])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const {
    totalIncome = 0,
    totalExpense = 0,
    netSavings = 0,
    savingsRate = 0,
    monthlyData = [],
    categoryExpenses = [],
  } = data || {}

  const maxVal = Math.max(...monthlyData.map((m) => Math.max(m.income, m.expense)), 1)

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true)
            load()
          }}
        />
      }
    >
      {/* Header & Bộ chọn năm */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Báo cáo tài chính</Text>
          <Text style={styles.headerSub}>Phân tích tổng quan thu chi</Text>
        </View>

        <View style={styles.yearPicker}>
          {[currentYear - 1, currentYear].map((y) => (
            <TouchableOpacity
              key={y}
              style={[styles.yearBtn, selectedYear === y && styles.yearBtnActive]}
              onPress={() => setSelectedYear(y)}
            >
              <Text
                style={[styles.yearBtnText, selectedYear === y && styles.yearBtnTextActive]}
              >
                Năm {y}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* 4 Thẻ thống kê */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.bgIncome]}>
          <Text style={styles.statLabel}>TỔNG THU NHẬP</Text>
          <Text style={[styles.statValue, styles.textIncome]}>+{fmtVND(totalIncome)}</Text>
          <Text style={styles.statSub}>Cả năm {selectedYear}</Text>
        </View>

        <View style={[styles.statCard, styles.bgExpense]}>
          <Text style={styles.statLabel}>TỔNG CHI TIÊU</Text>
          <Text style={[styles.statValue, styles.textExpense]}>-{fmtVND(totalExpense)}</Text>
          <Text style={styles.statSub}>Cả năm {selectedYear}</Text>
        </View>

        <View style={[styles.statCard, styles.bgSavings]}>
          <Text style={styles.statLabel}>TÍCH LŨY RÒNG</Text>
          <Text
            style={[
              styles.statValue,
              netSavings >= 0 ? styles.textIncome : styles.textExpense,
            ]}
          >
            {netSavings >= 0 ? '+' : ''}
            {fmtVND(netSavings)}
          </Text>
          <Text style={styles.statSub}>
            {netSavings >= 0 ? 'Thặng dư ngân sách' : 'Thâm hụt chi tiêu'}
          </Text>
        </View>

        <View style={[styles.statCard, styles.bgRate]}>
          <Text style={styles.statLabel}>TỶ LỆ TIẾT KIỆM</Text>
          <Text style={[styles.statValue, styles.textRate]}>{savingsRate}%</Text>
          <Text style={styles.statSub}>Mục tiêu &gt; 20%</Text>
        </View>
      </View>

      {/* Biểu đồ dòng tiền 12 tháng */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Dòng tiền 12 tháng (Năm {selectedYear})</Text>
        <Text style={styles.sectionSub}>Xanh: Thu nhập | Đỏ: Chi tiêu</Text>

        <View style={styles.barsContainer}>
          {monthlyData.map((m) => {
            const incHeight = Math.max((m.income / maxVal) * 110, 4)
            const expHeight = Math.max((m.expense / maxVal) * 110, 4)

            return (
              <View key={m.month} style={styles.barGroup}>
                <View style={styles.barPair}>
                  <View style={[styles.bar, styles.barIncome, { height: incHeight }]} />
                  <View style={[styles.bar, styles.barExpense, { height: expHeight }]} />
                </View>
                <Text style={styles.monthLabel}>T{m.month}</Text>
              </View>
            )
          })}
        </View>
      </View>

      {/* Danh mục chi tiêu nhiều nhất */}
      <View style={styles.categoryCard}>
        <Text style={styles.sectionTitle}>Chi tiêu theo danh mục</Text>
        <Text style={styles.sectionSub}>Các nhóm khoản chi trong năm</Text>

        {categoryExpenses.length === 0 ? (
          <Text style={styles.emptyCat}>Chưa có phát sinh chi tiêu trong năm này.</Text>
        ) : (
          categoryExpenses.map((cat, i) => (
            <View key={i} style={styles.catRow}>
              <View style={styles.catLeft}>
                <View
                  style={[
                    styles.catDot,
                    { backgroundColor: cat.color || '#2563eb' },
                  ]}
                />
                <Text style={styles.catName}>{cat.name}</Text>
              </View>
              <View style={styles.catRight}>
                <Text style={styles.catTotal}>{fmtVND(cat.total)}</Text>
                <Text style={styles.catPct}>{cat.percentage}%</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  yearPicker: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 12, padding: 3 },
  yearBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  yearBtnActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  yearBtnText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  yearBtnTextActive: { color: '#0f172a' },
  error: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 8, marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '48%', borderRadius: 14, padding: 14, borderWidth: 1 },
  bgIncome: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  bgExpense: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  bgSavings: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  bgRate: { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  statSub: { fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  textIncome: { color: '#16a34a' },
  textExpense: { color: '#dc2626' },
  textRate: { color: '#9333ea' },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sectionSub: { fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 14 },
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, paddingTop: 10 },
  barGroup: { alignItems: 'center', flex: 1 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: 8, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  barIncome: { backgroundColor: '#10b981' },
  barExpense: { backgroundColor: '#ef4444' },
  monthLabel: { fontSize: 10, color: '#64748b', marginTop: 6, fontWeight: '600' },
  categoryCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  emptyCat: { color: '#64748b', textAlign: 'center', paddingVertical: 20, fontSize: 13 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  catLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  catName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  catRight: { alignItems: 'flex-end' },
  catTotal: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  catPct: { fontSize: 11, color: '#64748b', fontWeight: '600' },
})
