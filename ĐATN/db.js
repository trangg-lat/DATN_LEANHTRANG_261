const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "quanly_kho"
});

db.connect(err => {
    if (err) throw err;
    console.log("Kết nối DB thành công");
});

module.exports = db;