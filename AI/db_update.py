import mysql.connector

try:
    conn = mysql.connector.connect(host='localhost', user='root', password='123456', database='quanly_kho')
    cursor = conn.cursor()
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS inventory_snapshots (
        id INT AUTO_INCREMENT PRIMARY KEY, 
        san_pham_id INT, 
        so_luong INT, 
        ngay_snapshot DATE, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        FOREIGN KEY (san_pham_id) REFERENCES san_pham(id) ON DELETE CASCADE
    );''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS ai_models_metadata (
        id INT AUTO_INCREMENT PRIMARY KEY, 
        model_name VARCHAR(100), 
        version VARCHAR(50), 
        mse DOUBLE, 
        rmse DOUBLE, 
        mae DOUBLE, 
        r2_score DOUBLE, 
        is_active BOOLEAN DEFAULT FALSE, 
        trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );''')
    
    try:
        cursor.execute("ALTER TABLE san_pham ADD COLUMN phan_loai_abc VARCHAR(10) DEFAULT 'C';")
    except Exception as e:
        print("Column phan_loai_abc already exists or error:", e)
        
    conn.commit()
    cursor.close()
    conn.close()
    print("Database updated successfully!")
except Exception as e:
    print("Error:", e)
