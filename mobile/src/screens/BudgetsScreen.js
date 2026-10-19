import { useCallback, useState } from 'react'
import { View, Text, FlatList, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { budgetApi, getErrorMessage } from '../api'
import { fmtVND, fmtDate } from '../format'

export default function BudgetsScreen() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await budgetApi.getAll()
      setBudgets(res.data)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      data={budgets}
      keyExtractor={(b) => String(b.id)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true)
            load()
          }}
        />
      }
      ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
      ListEmptyComponent={<Text style={styles.empty}>Bạn chưa thiết lập ngân sách nào.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.category}>{item.Category?.name || 'Chi tiêu chung'}</Text>
          <Text style={styles.amount}>Hạn mức: {fmtVND(item.limit_amount)}</Text>
          <Text style={styles.dates}>
            Áp dụng: {fmtDate(item.period_start)} - {fmtDate(item.period_end)}
          </Text>
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  error: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  empty: { color: '#64748b', textAlign: 'center', paddingVertical: 40 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  category: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  amount: { fontSize: 18, fontWeight: '800', color: '#2563eb', marginBottom: 4 },
  dates: { fontSize: 12, color: '#64748b' },
})
