const {DataTypes} = require('sequelize');
const {sequelize} = require('../config/db');
//dn user bằng sequelize
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    avartar_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    language: {
        type: DataTypes.STRING,
        defaultValue: 'vi',
        allowNull: true,
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'VND',
        allowNull: true,
    },
    dark_mode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
    },
    // Quyền hạn: admin = quản trị hệ thống, user = người dùng thường
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user',
    },
    // Trạng thái tài khoản: active = bình thường, locked = bị admin khóa
    status: {
        type: DataTypes.ENUM('active', 'locked'),
        allowNull: false,
        defaultValue: 'active',
    },
},  {
        tableName: 'users', // Tên bảng trong cơ sở dữ liệu
        timestamps: true, // Tự động thêm các trường createdAt và updatedAt
    });
    module.exports = User;