const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// Lấy dữ liệu báo cáo thống kê theo năm
async function getSummary(req, res) {
  try {
    const currentYear = new Date().getFullYear();
    const year = parseInt(req.query.year) || currentYear;

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Lấy toàn bộ giao dịch trong năm
    const transactions = await Transaction.findAll({
      where: {
        user_id: req.user.id,
        transaction_date: { [Op.between]: [startDate, endDate] },
      },
      include: [
        { model: Category, attributes: ['id', 'name', 'color', 'icon'] },
      ],
      order: [['transaction_date', 'ASC']],
    });

    let totalIncome = 0;
    let totalExpense = 0;

    // Chuẩn bị mảng 12 tháng
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: `Tháng ${i + 1}`,
      income: 0,
      expense: 0,
    }));

    // Gom nhóm chi tiêu theo danh mục
    const categoryMap = {};

    transactions.forEach((tx) => {
      const amount = parseFloat(tx.amount) || 0;
      const txDate = new Date(tx.transaction_date);
      const mIndex = txDate.getMonth(); // 0 - 11

      if (tx.type === 'income') {
        totalIncome += amount;
        monthlyData[mIndex].income += amount;
      } else if (tx.type === 'expense') {
        totalExpense += amount;
        monthlyData[mIndex].expense += amount;

        const catName = tx.Category?.name || 'Khác';
        const catColor = tx.Category?.color || '#94a3b8';
        if (!categoryMap[catName]) {
          categoryMap[catName] = { name: catName, total: 0, color: catColor };
        }
        categoryMap[catName].total += amount;
      }
    });

    // Chuyển categoryMap thành mảng và tính %
    const categoryExpenses = Object.values(categoryMap)
      .map((item) => ({
        ...item,
        percentage: totalExpense > 0 ? Math.round((item.total / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    return res.status(200).json({
      year,
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      monthlyData,
      categoryExpenses,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi lấy báo cáo', error: error.message });
  }
}

module.exports = {
  getSummary,
};
