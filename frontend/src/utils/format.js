// Lấy cài đặt tiền tệ và ngôn ngữ từ tài khoản đang đăng nhập
export const getCurrentCurrency = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.currency === 'USD' ? 'USD' : 'VND'
  } catch {
    return 'VND'
  }
}

export const getCurrentLang = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user.language === 'en' ? 'en' : 'vi'
  } catch {
    return 'vi'
  }
}

// Định dạng tiền tệ tự động theo cài đặt của người dùng (VND hoặc USD)
export const fmtVND = (n, forceCurrency = null) => {
  const currency = forceCurrency || getCurrentCurrency()
  const num = Number(n) || 0

  if (currency === 'USD') {
    // Quy đổi tỷ giá 1 USD = 25,000 VND khi số tiền ở định dạng VND
    const usdAmount = num >= 1000 ? num / 25000 : num
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usdAmount)
  }

  // Mặc định VND
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(num)
}

// Định dạng ngày theo ngôn ngữ
export const fmtDate = (d, forceLang = null) => {
  if (!d) return '—'
  const lang = forceLang || getCurrentLang()
  const locale = lang === 'en' ? 'en-US' : 'vi-VN'
  return new Date(d).toLocaleDateString(locale)
}

// Nhãn loại ví song ngữ
export const getWalletTypeLabel = (type, lang = null) => {
  const currentLang = lang || getCurrentLang()
  const labels = {
    vi: {
      cash: 'Tiền mặt',
      bank: 'Ngân hàng',
      'e-wallet': 'Ví điện tử',
    },
    en: {
      cash: 'Cash',
      bank: 'Bank Account',
      'e-wallet': 'E-Wallet',
    },
  }
  const dict = labels[currentLang] || labels.vi
  return dict[type] || type
}

// Giữ tương thích ngược với object walletTypeLabel cũ
export const walletTypeLabel = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  'e-wallet': 'Ví điện tử',
}
