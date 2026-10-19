import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import BudgetsScreen from './BudgetsScreen'
import GoalsScreen from './GoalsScreen'

export default function PlansScreen() {
  const [activeTab, setActiveTab] = useState('budgets') // 'budgets' | 'goals'

  return (
    <View style={styles.container}>
      {/* Segment Switcher */}
      <View style={styles.switcherContainer}>
        <View style={styles.switcher}>
          <TouchableOpacity
            style={[styles.switchBtn, activeTab === 'budgets' && styles.switchBtnActive]}
            onPress={() => setActiveTab('budgets')}
          >
            <Text
              style={[
                styles.switchBtnText,
                activeTab === 'budgets' && styles.switchBtnTextActive,
              ]}
            >
              📊 Ngân sách
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchBtn, activeTab === 'goals' && styles.switchBtnActive]}
            onPress={() => setActiveTab('goals')}
          >
            <Text
              style={[
                styles.switchBtnText,
                activeTab === 'goals' && styles.switchBtnTextActive,
              ]}
            >
              🎯 Mục tiêu tiết kiệm
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Body */}
      <View style={styles.body}>
        {activeTab === 'budgets' ? <BudgetsScreen /> : <GoalsScreen />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  switcherContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  switcher: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 3,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  switchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  switchBtnTextActive: {
    color: '#2563eb',
    fontWeight: '800',
  },
  body: {
    flex: 1,
  },
})
