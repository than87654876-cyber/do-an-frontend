import { useState, useCallback } from 'react'
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
  ScrollView,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { transactionApi, walletApi, categoryApi, getErrorMessage } from '../api'
import { fmtVND, fmtDate } from '../format'

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState([])
  const [wallets, setWallets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterType, setFilterType] = useState('all') // 'all' | 'income' | 'expense'
  const [error, setError] = useState('')

  // Modal thêm giao dịch
  const [modalVisible, setModalVisible] = useState(false)
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [walletId, setWalletId] = useState(null)
  const [categoryId, setCategoryId] = useState(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    setError('')
    try {
      const [tRes, wRes, cRes] = await Promise.all([
        transactionApi.getAll(),
        walletApi.getAll(),
        categoryApi.getAll(),
      ])
      setTransactions(tRes.data)
      setWallets(wRes.data)
      setCategories(cRes.data)
      if (wRes.data.length > 0 && !walletId) setWalletId(wRes.data[0].id)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [walletId])

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData])
  )

  const handleCreate = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ')
      return
    }
    if (!walletId) {
      Alert.alert('Lỗi', 'Vui lòng chọn ví')
      return
    }
    if (!categoryId) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục')
      return
    }

    setSubmitting(true)
    try {
      await transactionApi.create({
        wallet_id: walletId,
        category_id: categoryId,
        amount: Number(amount),
        type,
        note,
        transaction_date: new Date().toISOString().split('T')[0],
      })
      Alert.alert('Thành công', 'Đã thêm giao dịch mới!')
      setModalVisible(false)
      setAmount('')
      setNote('')
      loadData()
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id) => {
    Alert.alert('Xóa giao dịch', 'Bạn có chắc chắn muốn xóa giao dịch này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await transactionApi.delete(id)
            setTransactions((prev) => prev.filter((t) => t.id !== id))
          } catch (e) {
            Alert.alert('Lỗi', getErrorMessage(e))
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  const filteredList = transactions.filter((t) => {
    if (filterType === 'all') return true
    return t.type === filterType
  })

  const availableCategories = categories.filter((c) => c.type === type)

  return (
    <View style={styles.container}>
      {/* Thanh bộ lọc & nút Thêm */}
      <View style={styles.headerBar}>
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'income' && styles.filterChipActive]}
            onPress={() => setFilterType('income')}
          >
            <Text style={[styles.filterText, filterType === 'income' && styles.filterTextActive]}>Thu nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'expense' && styles.filterChipActive]}
            onPress={() => setFilterType('expense')}
          >
            <Text style={[styles.filterText, filterType === 'expense' && styles.filterTextActive]}>Chi tiêu</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={filteredList}
        keyExtractor={(t) => String(t.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadData()
            }}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>Không có giao dịch nào.</Text>}
        renderItem={({ item }) => {
          const isIncome = item.type === 'income'
          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.catName}>{item.Category?.name || (isIncome ? 'Thu nhập' : 'Chi tiêu')}</Text>
                <Text style={styles.walletName}>Ví: {item.Wallet?.name || 'Chưa rõ'}</Text>
                {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
                <Text style={styles.date}>{fmtDate(item.transaction_date)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.amount, { color: isIncome ? '#16a34a' : '#dc2626' }]}>
                  {isIncome ? '+' : '-'}{fmtVND(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }}
      />

      {/* Modal Thêm Giao Dịch */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm giao dịch mới</Text>

            {/* Loại giao dịch */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]}
                onPress={() => {
                  setType('expense')
                  setCategoryId(null)
                }}
              >
                <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Chi tiêu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]}
                onPress={() => {
                  setType('income')
                  setCategoryId(null)
                }}
              >
                <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Thu nhập</Text>
              </TouchableOpacity>
            </View>

            {/* Nhập số tiền */}
            <Text style={styles.fieldLabel}>Số tiền (VNĐ)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Chọn ví */}
            <Text style={styles.fieldLabel}>Chọn ví</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.selectChip, walletId === w.id && styles.selectChipActive]}
                  onPress={() => setWalletId(w.id)}
                >
                  <Text style={[styles.selectChipText, walletId === w.id && styles.selectChipTextActive]}>
                    {w.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Chọn danh mục */}
            <Text style={styles.fieldLabel}>Chọn danh mục</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {availableCategories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.selectChip, categoryId === c.id && styles.selectChipActive]}
                  onPress={() => setCategoryId(c.id)}
                >
                  <Text style={[styles.selectChipText, categoryId === c.id && styles.selectChipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Ghi chú */}
            <Text style={styles.fieldLabel}>Ghi chú (tùy chọn)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ăn sáng, xăng xe..."
              value={note}
              onChangeText={setNote}
            />

            {/* Nút hành động */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleCreate}
                disabled={submitting}
              >
                <Text style={styles.saveBtnText}>{submitting ? 'Đang lưu...' : 'Lưu lại'}</Text>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filters: { flexDirection: 'row', gap: 6 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  filterTextActive: { color: '#ffffff' },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  error: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: 10,
    margin: 16,
    borderRadius: 8,
  },
  empty: { color: '#64748b', textAlign: 'center', paddingVertical: 40 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  walletName: { fontSize: 12, color: '#64748b', marginTop: 2 },
  note: { fontSize: 13, color: '#334155', marginTop: 3 },
  date: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  amount: { fontSize: 15, fontWeight: '800' },
  deleteBtn: { marginTop: 10, paddingVertical: 2, paddingHorizontal: 6 },
  deleteText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  typeBtnExpense: { backgroundColor: '#fee2e2' },
  typeBtnIncome: { backgroundColor: '#dcfce7' },
  typeBtnText: { fontWeight: '700', color: '#64748b' },
  typeBtnTextActive: { color: '#0f172a' },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  selectChipActive: { backgroundColor: '#2563eb' },
  selectChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  selectChipTextActive: { color: '#ffffff' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '700', color: '#64748b' },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  saveBtnText: { fontWeight: '700', color: '#ffffff' },
})
