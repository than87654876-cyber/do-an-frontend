const express = require("express");
const cors = require("cors");
const {sequelize, testConnection } = require("./config/db");
const User = require("./models/User");
const Category = require('./models/Category');
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require('./routes/categoryRoutes');
const Wallet = require('./models/Wallet');
const walletRoutes = require('./routes/walletRoutes');
const Transaction = require('./models/Transaction');
const transactionRoutes = require('./routes/transactionRoutes');
const Budget = require('./models/Budget');
const budgetRoutes = require('./routes/budgetRoutes');
const savingsGoalRoutes = require('./routes/savingsGoalRoutes');
const SavingsGoal = require('./models/SavingsGoal');
const adminRoutes = require('./routes/adminRoutes');
const seedAdmin = require('./seedAdmin');
const accountRoutes = require('./routes/accountRoutes');
const Notification = require('./models/Notification');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/savings-goals', savingsGoalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

app.get("/", (req, res) => {
    res.json({ message: "BackEnd đang chạy" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
    await testConnection();

    await sequelize.sync({ alter: true }); // Đồng bộ hóa các mô hình với cơ sở dữ liệu
    console.log("Đã đồng bộ hóa các mô hình với cơ sở dữ liệu");

    await seedAdmin(); // Tạo tài khoản admin cố định nếu chưa có
});

