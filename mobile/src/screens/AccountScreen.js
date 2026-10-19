import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { accountApi, getErrorMessage } from '../api'
import ReportsScreen from './ReportsScreen'
import NotificationsScreen from './NotificationsScreen'

export default function AccountScreen({ user, onLogout }) {
  const [currentUser, setCurrentUser] = useState(user)
  const name = currentUser?.name || currentUser?.username || 'Người dùng'

  // Modal Đổi mật khẩu
  const [pwModalVisible, setPwModalVisible] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSubmitting, setPwSubmitting] = useState(false)

  // Modal Đổi tên hiển thị
  const [nameModalVisible, setNameModalVisible] = useState(false)
  const [newName, setNewName] = useState(name)
  const [nameSubmitting, setNameSubmitting] = useState(false)

  // Modal Báo cáo
  const [reportModalVisible, setReportModalVisible] = useState(false)

  // Modal Thông báo
  const [notifyModalVisible, setNotifyModalVisible] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mật khẩu')
      return
    }
    if (newPw.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (newPw !== confirmPw) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp')
      return
    }

    setPwSubmitting(true)
    try {
      await accountApi.changePassword(currentPw, newPw)
      setPwModalVisible(false)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      Alert.alert('Thành công', 'Đã đổi mật khẩu thành công! 🔒')
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e))
    } finally {
      setPwSubmitting(false)
    }
  }

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống')
      return
    }
    setNameSubmitting(true)
    try {
      const res = await accountApi.updateProfile({ username: newName.trim() })
      const updated = { ...currentUser, name: res.data.username, username: res.data.username }
      setCurrentUser(updated)
      await AsyncStorage.setItem('user', JSON.stringify(updated))
      setNameModalVisible(false)
      Alert.alert('Thành công', 'Đã cập nhật tên hiển thị! 🎉')
    } catch (e) {
      Alert.alert('Lỗi', getErrorMessage(e))
    } finally {
      setNameSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* User Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{currentUser?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {currentUser?.role === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng cá nhân'}
          </Text>
        </View>
      </View>

      {/* Danh mục tiện ích */}
      <Text style={styles.sectionHeader}>TIỆN ÍCH & TÀI CHÍNH</Text>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setReportModalVisible(true)}
      >
        <Text style={styles.menuIcon}>📊</Text>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Báo cáo & Thống kê</Text>
          <Text style={styles.menuSub}>Phân tích thu chi và dòng tiền cả năm</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setNotifyModalVisible(true)}
      >
        <Text style={styles.menuIcon}>🔔</Text>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Thông báo hệ thống</Text>
          <Text style={styles.menuSub}>Cảnh báo vượt hạn mức và nhắc nhở</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Cài đặt & Tài khoản */}
      <Text style={styles.sectionHeader}>CÀI ĐẶT TÀI KHOẢN</Text>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setNewName(name)
          setNameModalVisible(true)
        }}
      >
        <Text style={styles.menuIcon}>✏️</Text>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Đổi tên hiển thị</Text>
          <Text style={styles.menuSub}>Cập nhật tên tài khoản của bạn</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setCurrentPw('')
          setNewPw('')
          setConfirmPw('')
          setPwModalVisible(true)
        }}
      >
        <Text style={styles.menuIcon}>🔒</Text>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>Đổi mật khẩu</Text>
          <Text style={styles.menuSub}>Tăng cường bảo mật cho tài khoản</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      {/* Nút Đăng xuất */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
      </TouchableOpacity>

      {/* Modal Báo cáo */}
      <Modal visible={reportModalVisible} animationType="slide">
        <View style={styles.fullModalHeader}>
          <Text style={styles.fullModalTitle}>Báo cáo & Thống kê</Text>
          <TouchableOpacity
            style={styles.closeFullModal}
            onPress={() => setReportModalVisible(false)}
          >
            <Text style={styles.closeFullModalText}>Đóng</Text>
          </TouchableOpacity>
        </View>
        <ReportsScreen />
      </Modal>

      {/* Modal Thông báo */}
      <Modal visible={notifyModalVisible} animationType="slide">
        <View style={styles.fullModalHeader}>
          <Text style={styles.fullModalTitle}>Thông báo hệ thống</Text>
          <TouchableOpacity
            style={styles.closeFullModal}
            onPress={() => setNotifyModalVisible(false)}
          >
            <Text style={styles.closeFullModalText}>Đóng</Text>
          </TouchableOpacity>
        </View>
        <NotificationsScreen />
      </Modal>

      {/* Modal Đổi tên hiển thị */}
      <Modal visible={nameModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi tên hiển thị</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nhập tên mới..."
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setNameModalVisible(false)}
                disabled={nameSubmitting}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleUpdateName}
                disabled={nameSubmitting}
              >
                {nameSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Đổi mật khẩu */}
      <Modal visible={pwModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>

            <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={currentPw}
              onChangeText={setCurrentPw}
              placeholder="Nhập mật khẩu hiện tại"
            />

            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
              placeholder="Ít nhất 6 ký tự"
            />

            <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder="Nhập lại mật khẩu mới"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPwModalVisible(false)}
                disabled={pwSubmitting}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleChangePassword}
                disabled={pwSubmitting}
              >
                {pwSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Cập nhật</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { color: '#ffffff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 19, fontWeight: '800', color: '#0f172a' },
  email: { color: '#64748b', fontSize: 13, marginTop: 2, marginBottom: 10 },
  roleBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roleText: { color: '#2563eb', fontWeight: '700', fontSize: 12 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuIcon: { fontSize: 22, marginRight: 14 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  menuSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  menuArrow: { fontSize: 20, color: '#cbd5e1', fontWeight: '800' },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoutText: { color: '#dc2626', fontWeight: '800', fontSize: 15 },
  fullModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  fullModalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  closeFullModal: { backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  closeFullModalText: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9' },
  cancelBtnText: { color: '#64748b', fontWeight: '700' },
  submitBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#2563eb' },
  submitBtnText: { color: '#ffffff', fontWeight: '700' },
})