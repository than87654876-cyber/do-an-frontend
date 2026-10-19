const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Category = require('../models/Category');
const { sequelize } = require('../config/db');

// Lấy danh sách giao dịch (hỗ trợ lọc: ngày, tháng, danh mục, loại)
async function getTransactions(req, res) {
  try {
    const { date, month, year, category_id, type } = req.query; // query string, vd: ?month=9&year=2026

    const where = { user_id: req.user.id };

    if (category_id) where.category_id = category_id;
    if (type) where.type = type;

    if (date) {
      where.transaction_date = date; // lọc đúng 1 ngày, vd: 2026-09-15
    } else if (month && year) {
      // lọc theo khoảng ngày đầu tháng -> cuối tháng
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // ngày cuối tháng
      where.transaction_date = { [Op.between]: [startDate, endDate] };
    } else if (year) {
      where.transaction_date = { [Op.between]: [`${year}-01-01`, `${year}-12-31`] };
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: Wallet, attributes: ['id', 'name'] },
        { model: Category, attributes: ['id', 'name', 'icon', 'color'] },
      ],
      order: [['transaction_date', 'DESC']],
    });

    return res.status(200).json(transactions);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}

// Tạo giao dịch mới + tự động cập nhật số dư ví
async function createTransaction(req, res) {
  const t = await sequelize.transaction();
  try {
    const { wallet_id, category_id, amount, type, note, transaction_date } = req.body;

    if (!wallet_id || !category_id || !amount || !type) {
      await t.rollback();
      return res.status(400).json({ message: 'Vui lòng nhập đủ wallet_id, category_id, amount, type' });
    }
    if (amount <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Số tiền phải lớn hơn 0' });
    }

    // Kiểm tra ví có thuộc về user này không
    const wallet = await Wallet.findOne({ where: { id: wallet_id, user_id: req.user.id }, transaction: t });
    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy ví' });
    }

    // Nếu là chi tiêu, kiểm tra đủ số dư không
    if (type === 'expense' && parseFloat(wallet.balance) < parseFloat(amount)) {
      await t.rollback();
      return res.status(400).json({ message: 'Số dư ví không đủ để thực hiện giao dịch này' });
    }

    // Tạo giao dịch
    const newTransaction = await Transaction.create({
      wallet_id,
      category_id,
      amount,
      type,
      note,
      transaction_date: transaction_date || new Date(),
      user_id: req.user.id,
    }, { transaction: t });

    // Cập nhật số dư ví: income thì cộng, expense thì trừ
    if (type === 'income') {
      wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
    } else {
      wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
    }
    await wallet.save({ transaction: t });

    await t.commit();

    // Tự động kiểm tra cảnh báo ngân sách
    if (type === 'expense') {
      try {
        const Budget = require('../models/Budget');
        const Notification = require('../models/Notification');
        const txDate = transaction_date || new Date().toISOString().split('T')[0];
        const budget = await Budget.findOne({
          where: {
            user_id: req.user.id,
            category_id,
            period_start: { [Op.lte]: txDate },
            period_end: { [Op.gte]: txDate },
          },
          include: [{ model: Category, attributes: ['name'] }],
        });

        if (budget) {
          const totalSpent = (await Transaction.sum('amount', {
            where: {
              user_id: req.user.id,
              category_id,
              type: 'expense',
              transaction_date: { [Op.between]: [budget.period_start, budget.period_end] },
            },
          })) || 0;

          if (totalSpent > parseFloat(budget.limit_amount)) {
            await Notification.create({
              user_id: req.user.id,
              title: 'Cảnh báo vượt ngân sách!',
              message: `Chi tiêu danh mục "${budget.Category?.name || 'Chi tiêu'}" đạt ${totalSpent.toLocaleString('vi-VN')} đ, vượt hạn mức ${parseFloat(budget.limit_amount).toLocaleString('vi-VN')} đ.`,
              type: 'budget_warning',
            });
          }
        }
      } catch (checkErr) {
        console.error('Lỗi kiểm tra ngân sách:', checkErr);
      }
    }

    return res.status(201).json({ transaction: newTransaction, newWalletBalance: wallet.balance });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}

// Sửa giao dịch: phải HOÀN TÁC tác động cũ rồi ÁP DỤNG tác động mới
async function updateTransaction(req, res) {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const oldTransaction = await Transaction.findOne({ where: { id, user_id: req.user.id }, transaction: t });

    if (!oldTransaction) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }

    const wallet = await Wallet.findOne({ where: { id: oldTransaction.wallet_id }, transaction: t });

    // Bước 1: hoàn tác tác động cũ lên số dư ví (đảo ngược lại)
    if (oldTransaction.type === 'income') {
      wallet.balance = parseFloat(wallet.balance) - parseFloat(oldTransaction.amount);
    } else {
      wallet.balance = parseFloat(wallet.balance) + parseFloat(oldTransaction.amount);
    }

    // Bước 2: lấy dữ liệu mới (nếu không gửi lên thì giữ nguyên giá trị cũ)
    const amount = req.body.amount ?? oldTransaction.amount;
    const type = req.body.type ?? oldTransaction.type;
    const category_id = req.body.category_id ?? oldTransaction.category_id;
    const note = req.body.note ?? oldTransaction.note;
    const transaction_date = req.body.transaction_date ?? oldTransaction.transaction_date;

    // Bước 3: áp dụng tác động mới
    if (type === 'income') {
      wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
    } else {
      wallet.balance = parseFloat(wallet.balance) - parseFloat(amount);
    }

    if (parseFloat(wallet.balance) < 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Số dư ví không đủ sau khi cập nhật giao dịch' });
    }

    await wallet.save({ transaction: t });
    await oldTransaction.update({ amount, type, category_id, note, transaction_date }, { transaction: t });

    await t.commit();
    return res.status(200).json({ transaction: oldTransaction, newWalletBalance: wallet.balance });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}

// Xóa giao dịch: phải hoàn tác tác động lên số dư ví
async function deleteTransaction(req, res) {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({ where: { id, user_id: req.user.id }, transaction: t });

    if (!transaction) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
    }

    const wallet = await Wallet.findOne({ where: { id: transaction.wallet_id }, transaction: t });

    // Hoàn tác: nếu trước đó là income (đã cộng tiền) thì giờ trừ lại, ngược lại thì cộng lại
    if (transaction.type === 'income') {
      wallet.balance = parseFloat(wallet.balance) - parseFloat(transaction.amount);
    } else {
      wallet.balance = parseFloat(wallet.balance) + parseFloat(transaction.amount);
    }
    await wallet.save({ transaction: t });

    await transaction.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({ message: 'Đã xóa giao dịch', newWalletBalance: wallet.balance });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction };