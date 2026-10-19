import { useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { notificationApi, getErrorMessage } from '../api'
import { fmtDate } from '../format'

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await notificationApi.getAll()
      setNotifications(res.data)
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

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (e) {
      console.error(e)
    }
  }

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      Alert.alert('Thành công', 'Đã đánh dấu đã đọc tất cả thông báo')
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e))
    }
  }

  const handleDelete = async (id) => {
    try {
      await notificationApi.delete(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e))
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={notifications}
        keyExtractor={(n) => String(n.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              load()
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Thông báo</Text>
                <Text style={styles.headerSub}>
                  {unreadCount > 0
                    ? `Bạn có ${unreadCount} thông báo mới`
                    : 'Tất cả thông báo đã đọc'}
                </Text>
              </View>
              {unreadCount > 0 && (
                <TouchableOpacity style={styles.readAllBtn} onPress={handleMarkAll}>
                  <Text style={styles.readAllBtnText}>Đọc tất cả</Text>
                </TouchableOpacity>
              )}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.empty}>Chưa có thông báo nào.</Text>
            <Text style={styles.emptySub}>
              Cảnh báo vượt ngân sách và nhắc nhở mục tiêu sẽ xuất hiện tại đây.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isWarning = item.type === 'budget_warning'
          const isGoal = item.type === 'goal_reached'
          const icon = isWarning ? '⚠️' : isGoal ? '🏆' : 'ℹ️'

          return (
            <TouchableOpacity
              style={[styles.card, !item.is_read && styles.unreadCard]}
              activeOpacity={0.7}
              onPress={() => !item.is_read && handleMarkAsRead(item.id)}
            >
              <View style={styles.cardContent}>
                <Text style={styles.itemIcon}>{icon}</Text>
                <View style={styles.textContainer}>
                  <View style={styles.rowTitle}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {!item.is_read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.itemMessage}>{item.message}</Text>
                  <Text style={styles.itemDate}>{fmtDate(item.createdAt)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  header: { marginBottom: 14 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  readAllBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  readAllBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  error: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 8, marginTop: 10 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 44, marginBottom: 12, opacity: 0.6 },
  empty: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#64748b', fontSize: 13, marginTop: 4, textAlign: 'center', maxWidth: 280 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unreadCard: {
    backgroundColor: '#f8faff',
    borderColor: '#93c5fd',
  },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  itemIcon: { fontSize: 24, marginRight: 12, marginTop: 2 },
  textContainer: { flex: 1 },
  rowTitle: { flexDirection: 'row', alignItems: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563eb', marginLeft: 6 },
  itemMessage: { fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 18 },
  itemDate: { fontSize: 11, color: '#94a3b8', marginTop: 6 },
  deleteBtn: { padding: 4, marginLeft: 8 },
  deleteBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
})
