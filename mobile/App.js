import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import LoginScreen from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import TransactionsScreen from './src/screens/TransactionsScreen'
import WalletsScreen from './src/screens/WalletsScreen'
import PlansScreen from './src/screens/PlansScreen'
import AccountScreen from './src/screens/AccountScreen'
import { authApi, setUnauthorizedHandler } from './src/api'

const Tab = createBottomTabNavigator()

const tabIcon = (emoji) => ({ focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
)

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user'])
    setUser(null)
  }

  useEffect(() => {
    AsyncStorage.getItem('user')
      .then((raw) => {
        if (raw) setUser(JSON.parse(raw))
      })
      .finally(() => setReady(true))
    // Token hết hạn: api.js gọi hàm này để đưa người dùng về màn hình đăng nhập
    setUnauthorizedHandler(logout)
  }, [])

  const login = async (email, password) => {
    const res = await authApi.login(email, password)
    await AsyncStorage.setItem('token', res.data.token)
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user))
    setUser(res.data.user)
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen onLogin={login} />
      </>
    )
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          headerTitleStyle: { fontWeight: '800' },
          tabBarActiveTintColor: '#2563eb',
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Tổng quan', tabBarIcon: tabIcon('🏠') }}
        />
        <Tab.Screen
          name="Transactions"
          component={TransactionsScreen}
          options={{ title: 'Giao dịch', tabBarIcon: tabIcon('💳') }}
        />
        <Tab.Screen
          name="Wallets"
          component={WalletsScreen}
          options={{ title: 'Ví tiền', tabBarIcon: tabIcon('👛') }}
        />
        <Tab.Screen
          name="Plans"
          component={PlansScreen}
          options={{ title: 'Kế hoạch', tabBarIcon: tabIcon('🎯') }}
        />
        <Tab.Screen name="Account" options={{ title: 'Tài khoản', tabBarIcon: tabIcon('👤') }}>
          {() => <AccountScreen user={user} onLogout={logout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
})