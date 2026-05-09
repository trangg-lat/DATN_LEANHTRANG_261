const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "quanly_kho",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error("Lỗi kết nối DB:", err.message);
        return;
    }
    console.log("Kết nối DB thành công");
    if (connection) connection.release();
});

module.exports = pool;