const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

async function register(req, res) {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username: name,
            email,
            password: hashedPassword,
            role: 'user',
            status: 'active',
        });

        // Tạo 1 ví mặc định "Tiền mặt" cho người dùng mới
        try {
            await Wallet.create({
                user_id: newUser.id,
                name: 'Tiền mặt',
                type: 'cash',
                balance: 0,
            });
        } catch (walletErr) {
            console.error('Không tạo được ví mặc định:', walletErr.message);
        }

        return res.status(201).json({
            message: 'Đăng ký thành công',
            user: {
                id: newUser.id,
                name: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng ký' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
        if (user.status === 'locked') {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        return res.status(200).json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.id,
                name: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
                language: user.language || 'vi',
                currency: user.currency || 'VND',
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng nhập', error: error.message });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu mới' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        return res.status(200).json({ message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập lại.' });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server khi đặt lại mật khẩu', error: error.message });
    }
}

module.exports = { register, login, forgotPassword };