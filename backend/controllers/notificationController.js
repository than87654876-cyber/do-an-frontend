const Notification = require('../models/Notification');

// Lấy danh sách thông báo của người dùng
async function getNotifications(req, res) {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi khi lấy thông báo', error: error.message });
  }
}

// Đánh dấu 1 thông báo là đã đọc
async function markAsRead(req, res) {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    notification.is_read = true;
    await notification.save();
    return res.status(200).json({ message: 'Đã đánh dấu đã đọc', notification });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}

// Đánh dấu tất cả là đã đọc
async function markAllAsRead(req, res) {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id, is_read: false } }
    );
    return res.status(200).json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}

// Xóa 1 thông báo
async function deleteNotification(req, res) {
  try {
    const deleted = await Notification.destroy({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    return res.status(200).json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
