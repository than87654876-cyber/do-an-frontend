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
import { walletApi, getErrorMessage } from '../api'
import { fmtVND, walletTypeLabel } from '../format'

export default function WalletsScreen() {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  // Modal Thêm ví
  const [addVisible, setAddVisible] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('cash')
  const [balance, setBalance] = useState('')
  const [submittingAdd, setSubmittingAdd] = useState(false)

  // Modal Chuyển tiền
  const [transferVisible, setTransferVisible] = useState(false)
  const [fromWalletId, setFromWalletId] = useState('')
  const [toWalletId, setToWalletId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [submittingTransfer, setSubmittingTransfer] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await walletApi.getAll()
      setWallets(res.data)
      if (res.data.length >= 2) {
        setFromWalletId(String(res.data[0].id))
        setToWalletId(String(res.data[1].id))
      }
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

  const handleAddWallet = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên ví')
      return
    }
    const initBal = Number(balance.replace(/[^0-9]/g, '')) || 0
    setSubmittingAdd(true)
    try {
      await walletApi.create({
        name: name.trim(),
        type,
        balance: initBal,
      })
      setAddVisible(false)
      setName('')
      setBalance('')
      Alert.alert('Thành công', 'Đã thêm ví mới thành công! 👛')
      load()
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e))
    } finally {
      setSubmittingAdd(false)
    }
  }

  const handleTransfer = async () => {
    if (fromWalletId === toWalletId) {
      Alert.alert('Lỗi', 'Ví nguồn và ví đích không được trùng nhau')
      return
    }
    const amountVal = Number(transferAmount.replace(/[^0-9]/g, ''))
    if (!amountVal || amountVal <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền chuyển hợp lệ')
      return
    }

    const fromWallet = wallets.find((w) => String(w.id) === fromWalletId)
    if (fromWallet && Number(fromWallet.balance) < amountVal) {
      Alert.alert('Lỗi', 'Số dư ví chuyển không đủ')
      return
    }

    setSubmittingTransfer(true)
    try {
      await walletApi.transfer({
        from_wallet_id: Number(fromWalletId),
        to_wallet_id: Number(toWalletId),
        amount: amountVal,
        note: transferNote.trim() || 'Chuyển tiền giữa các ví',
      })
      setTransferVisible(false)
      setTransferAmount('')
      setTransferNote('')
      Alert.alert('Thành công', 'Chuyển tiền giữa các ví thành công! 🔄')
      load()
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e))
    } finally {
      setSubmittingTransfer(false)
    }
  }

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0)

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
        data={wallets}
        keyExtractor={(w) => String(w.id)}
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
          <View style={styles.headerBlock}>
            {/* Thẻ tổng tài sản */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>TỔNG TÀI SẢN KHẢ DỤNG</Text>
              <Text style={styles.totalValue}>{fmtVND(totalBalance)}</Text>
              <Text style={styles.totalCount}>{wallets.length} ví đang hoạt động</Text>
            </View>

            {/* Các nút hành động */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnTransfer]}
                onPress={() => setTransferVisible(true)}
                disabled={wallets.length < 2}
              >
                <Text style={styles.btnTransferText}>🔄 Chuyển tiền</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnAdd]}
                onPress={() => setAddVisible(true)}
              >
                <Text style={styles.btnAddText}>+ Thêm ví mới</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Bạn chưa có ví nào.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.iconCircle}>
                <Text style={styles.walletIcon}>
                  {item.type === 'bank' ? '🏦' : item.type === 'e-wallet' ? '📱' : '💵'}
                </Text>
              </View>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.type}>{walletTypeLabel[item.type] || item.type}</Text>
              </View>
            </View>
            <Text style={styles.balance}>{fmtVND(item.balance)}</Text>
          </View>
        )}
      />

      {/* Modal Thêm ví */}
      <Modal visible={addVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm ví mới</Text>

            <Text style={styles.label}>Tên ví</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Vietcombank, Ví Tiêu vặt..."
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Loại ví</Text>
            <View style={styles.typeRow}>
              {[
                { key: 'cash', label: 'Tiền mặt' },
                { key: 'bank', label: 'Ngân hàng' },
                { key: 'e-wallet', label: 'Ví điện tử' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, type === t.key && styles.typeBtnActive]}
                  onPress={() => setType(t.key)}
                >
                  <Text
                    style={[styles.typeBtnText, type === t.key && styles.typeBtnTextActive]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Số dư ban đầu (₫)</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 5000000"
              keyboardType="numeric"
              value={balance}
              onChangeText={setBalance}
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
                onPress={handleAddWallet}
                disabled={submittingAdd}
              >
                {submittingAdd ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Tạo ví</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Chuyển tiền */}
      <Modal visible={transferVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chuyển tiền giữa các ví</Text>

            <Text style={styles.label}>Từ ví nguồn</Text>
            <View style={styles.walletSelectRow}>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.walletSelectBtn,
                    fromWalletId === String(w.id) && styles.walletSelectBtnActive,
                  ]}
                  onPress={() => setFromWalletId(String(w.id))}
                >
                  <Text
                    style={[
                      styles.walletSelectText,
                      fromWalletId === String(w.id) && styles.walletSelectTextActive,
                    ]}
                  >
                    {w.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Đến ví nhận</Text>
            <View style={styles.walletSelectRow}>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[
                    styles.walletSelectBtn,
                    toWalletId === String(w.id) && styles.walletSelectBtnActiveTo,
                  ]}
                  onPress={() => setToWalletId(String(w.id))}
                >
                  <Text
                    style={[
                      styles.walletSelectText,
                      toWalletId === String(w.id) && styles.walletSelectTextActiveTo,
                    ]}
                  >
                    {w.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Số tiền chuyển (₫)</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 1000000"
              keyboardType="numeric"
              value={transferAmount}
              onChangeText={setTransferAmount}
            />

            <Text style={styles.label}>Ghi chú chuyển tiền</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: Chuyển tiền tiêu vặt"
              value={transferNote}
              onChangeText={setTransferNote}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setTransferVisible(false)}
                disabled={submittingTransfer}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleTransfer}
                disabled={submittingTransfer}
              >
                {submittingTransfer ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Xác nhận chuyển</Text>
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
  headerBlock: { marginBottom: 14 },
  totalCard: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#2563eb',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  totalValue: { color: '#ffffff', fontSize: 26, fontWeight: '900', marginVertical: 6 },
  totalCount: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  btnAction: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnTransfer: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1' },
  btnTransferText: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  btnAdd: { backgroundColor: '#2563eb' },
  btnAddText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  error: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 8, marginTop: 8 },
  empty: { color: '#64748b', textAlign: 'center', paddingVertical: 40 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  walletIcon: { fontSize: 22 },
  name: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  type: { color: '#64748b', fontSize: 12, fontWeight: '600', marginTop: 2 },
  balance: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 15, backgroundColor: '#f8fafc' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#2563eb' },
  typeBtnText: { color: '#64748b', fontWeight: '700', fontSize: 12 },
  typeBtnTextActive: { color: '#1d4ed8' },
  walletSelectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  walletSelectBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9' },
  walletSelectBtnActive: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#ef4444' },
  walletSelectText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  walletSelectTextActive: { color: '#dc2626' },
  walletSelectBtnActiveTo: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#10b981' },
  walletSelectTextActiveTo: { color: '#15803d' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#64748b', fontWeight: '700' },
  submitBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#2563eb' },
  submitBtnText: { color: '#ffffff', fontWeight: '700' },
})