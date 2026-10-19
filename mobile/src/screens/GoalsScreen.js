import { useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { goalApi, getErrorMessage } from '../api'
import { fmtVND, fmtDate } from '../format'

export default function GoalsScreen() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  // Modal đóng góp (nạp tiền)
  const [contribGoal, setContribGoal] = useState(null)
  const [contribAmount, setContribAmount] = useState('')
  const [submittingContrib, setSubmittingContrib] = useState(false)

  // Modal tạo mục tiêu mới
  const [addVisible, setAddVisible] = useState(false)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [submittingAdd, setSubmittingAdd] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await goalApi.getAll()
      setGoals(res.data)
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

  const handleContribute = async () => {
    const val = Number(contribAmount.replace(/[^0-9]/g, ''))
    if (!val || val <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền đóng góp hợp lệ')
      return
    }
    setSubmittingContrib(true)
    try {
      await goalApi.updateProgress(contribGoal.id, val)
      setContribGoal(null)
      setContribAmount('')
      Alert.alert('Thành công', 'Đã tích lũy thêm tiền vào mục tiêu! 🎉')
      load()
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e))
    } finally {
      setSubmittingContrib(false)
    }
  }

  const handleCreate = async () => {
    const targetVal = Number(targetAmount.replace(/[^0-9]/g, ''))
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên mục tiêu')
      return
    }
    if (!targetVal || targetVal <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền mục tiêu hợp lệ')
      return
    }
    setSubmittingAdd(true)
    try {
      await goalApi.create({
        name: name.trim(),
        target_amount: targetVal,
        deadline: deadline.trim() || null,
      })
      setAddVisible(false)
      setName('')
      setTargetAmount('')
      setDeadline('')
      Alert.alert('Thành công', 'Đã tạo mục tiêu tiết kiệm mới! 🎯')
      load()
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e))
    } finally {
      setSubmittingAdd(false)
    }
  }

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
        data={goals}
        keyExtractor={(g) => String(g.id)}
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
                <Text style={styles.headerTitle}>Mục tiêu tiết kiệm</Text>
                <Text style={styles.headerSub}>Theo dõi và tích lũy cho ước mơ</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => setAddVisible(true)}>
                <Text style={styles.addBtnText}>+ Thêm</Text>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.empty}>Chưa có mục tiêu tiết kiệm nào.</Text>
            <Text style={styles.emptySub}>Bấm "+ Thêm" để tạo kế hoạch tiết kiệm mới!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const current = Number(item.current_amount) || 0
          const target = Number(item.target_amount) || 1
          const pct = Math.min(Math.round((current / target) * 100), 100)
          const isCompleted = item.status === 'completed' || pct >= 100

          return (
            <View style={[styles.card, isCompleted && styles.completedCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.goalName}>{item.name}</Text>
                <View style={[styles.statusBadge, isCompleted ? styles.badgeSuccess : styles.badgeProgress]}>
                  <Text style={[styles.statusText, isCompleted ? styles.textSuccess : styles.textProgress]}>
                    {isCompleted ? 'Hoàn thành 🏆' : `${pct}%`}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${pct}%`, backgroundColor: isCompleted ? '#10b981' : '#2563eb' },
                  ]}
                />
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.currentAmount}>{fmtVND(current)}</Text>
                <Text style={styles.targetAmount}>Mục tiêu: {fmtVND(target)}</Text>
              </View>

              {item.deadline && (
                <Text style={styles.deadlineText}>Hạn chót: {fmtDate(item.deadline)}</Text>
              )}

              {!isCompleted && (
                <TouchableOpacity
                  style={styles.contribBtn}
                  onPress={() => {
                    setContribGoal(item)
                    setContribAmount('')
                  }}
                >
                  <Text style={styles.contribBtnText}>+ Nạp tiền tích lũy</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }}
      />

      {/* Modal Nạp tiền tích lũy */}
      <Modal visible={!!contribGoal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tích lũy vào mục tiêu</Text>
            <Text style={styles.modalSub}>{contribGoal?.name}</Text>

            <TextInput
              style={styles.input}
              placeholder="Nhập số tiền (VD: 500000)"
              keyboardType="numeric"
              value={contribAmount}
              onChangeText={setContribAmount}
            />

            {/* Phím bấm chọn nhanh */}
            <View style={styles.quickAmounts}>
              {[500000, 1000000, 2000000].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={styles.quickBtn}
                  onPress={() => setContribAmount(String(val))}
                >
                  <Text style={styles.quickBtnText}>+{val / 1000}k</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setContribGoal(null)}
                disabled={submittingContrib}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleContribute}
                disabled={submittingContrib}
              >
                {submittingContrib ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Xác nhận nạp</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Tạo mục tiêu mới */}
      <Modal visible={addVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mục tiêu tiết kiệm mới</Text>

            <Text style={styles.label}>Tên mục tiêu</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Mua iPhone mới, Đi du lịch"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Số tiền mục tiêu (₫)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 20000000"
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />

            <Text style={styles.label}>Hạn chót (YYYY-MM-DD, tùy chọn)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 2026-12-31"
              value={deadline}
              onChangeText={setDeadline}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddVisible(false)}
                disabled={submittingAdd}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreate}
                disabled={submittingAdd}
              >
                {submittingAdd ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Tạo mục tiêu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  header: { marginBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  error: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 8, marginTop: 12 },
  emptyContainer: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  empty: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#64748b', fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  completedCard: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalName: { fontSize: 17, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeProgress: { backgroundColor: '#dbeafe' },
  textProgress: { color: '#1d4ed8', fontWeight: '800', fontSize: 12 },
  badgeSuccess: { backgroundColor: '#dcfce7' },
  textSuccess: { color: '#15803d', fontWeight: '800', fontSize: 12 },
  progressTrack: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, marginVertical: 12, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 4 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  currentAmount: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  targetAmount: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  deadlineText: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  contribBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  contribBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: '#0f172a' },
  modalSub: { fontSize: 14, color: '#2563eb', fontWeight: '600', marginTop: 2, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  quickBtnText: { color: '#334155', fontWeight: '700', fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#64748b', fontWeight: '700' },
  submitBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#2563eb' },
  submitBtnText: { color: '#ffffff', fontWeight: '700' },
})
