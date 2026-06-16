import mysql.connector
import random
from datetime import datetime, timedelta

def generate_data():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="123456",
        database="quanly_kho"
    )
    cursor = conn.cursor()

    print("Clearing old data...")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    cursor.execute("TRUNCATE TABLE giao_dich;")
    cursor.execute("TRUNCATE TABLE ton_kho;")
    cursor.execute("TRUNCATE TABLE san_pham;")
    cursor.execute("TRUNCATE TABLE inventory_snapshots;")
    cursor.execute("TRUNCATE TABLE ai_models_metadata;")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

    categories = ["Điện tử", "Đồ gia dụng", "Thực phẩm", "Quần áo", "Vật liệu xây dựng", "Phụ tùng ô tô", "Mỹ phẩm", "Đồ chơi", "Văn phòng phẩm", "Y tế"]
    units = ["Cái", "Hộp", "Thùng", "Chiếc", "Bộ", "Kg", "Lít", "Gói"]
    
    print("Generating 100 products...")
    # Generate 100 products
    products = []
    for i in range(1, 101):
        cat = random.choice(categories)
        unit = random.choice(units)
        price = random.randint(10, 5000) * 1000  # 10k to 5M
        name = f"Sản phẩm {cat} - Mã SP{i:03d}"
        
        cursor.execute(
            "INSERT INTO san_pham (ten_san_pham, danh_muc, don_vi, gia, ngay_tao) VALUES (%s, %s, %s, %s, %s)",
            (name, cat, unit, price, datetime.now() - timedelta(days=180))
        )
        product_id = cursor.lastrowid
        products.append(product_id)

    print("Generating transactions for the last 6 months...")
    # Generate transactions for the last 6 months (approx 180 days)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    
    locations = ["Khu A - Kệ 1", "Khu A - Kệ 2", "Khu B - Kệ 1", "Khu B - Kệ 2", "Khu C - Kệ 1", "Kho lạnh", "Kho ngoài trời", "Khu D - Kệ 1"]

    for pid in products:
        # Determine demand pattern for this product
        # 20% high demand, 50% medium, 30% low
        demand_type = random.choices(["high", "medium", "low"], weights=[0.2, 0.5, 0.3])[0]
        
        if demand_type == "high":
            tx_count = random.randint(80, 150)
            avg_qty = random.randint(20, 100)
        elif demand_type == "medium":
            tx_count = random.randint(30, 80)
            avg_qty = random.randint(10, 50)
        else:
            tx_count = random.randint(10, 30)
            avg_qty = random.randint(5, 20)
            
        current_stock = 0
        
        # Initial import
        initial_import = random.randint(500, 2000)
        import_time = start_date + timedelta(days=random.randint(0, 5))
        cursor.execute(
            "INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (%s, %s, %s, %s)",
            (pid, 'nhap', initial_import, import_time)
        )
        current_stock += initial_import
        
        # Generate random transactions
        for _ in range(tx_count):
            tx_time = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
            
            # 80% xuat, 20% nhap
            if random.random() < 0.8:
                # Xuất
                qty = int(random.gauss(avg_qty, avg_qty * 0.2))
                qty = max(1, qty)
                if current_stock >= qty:
                    cursor.execute(
                        "INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (%s, %s, %s, %s)",
                        (pid, 'xuat', qty, tx_time)
                    )
                    current_stock -= qty
                else:
                    # Need to import first
                    import_qty = random.randint(200, 1000)
                    cursor.execute(
                        "INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (%s, %s, %s, %s)",
                        (pid, 'nhap', import_qty, tx_time - timedelta(hours=1))
                    )
                    current_stock += import_qty
                    
                    cursor.execute(
                        "INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (%s, %s, %s, %s)",
                        (pid, 'xuat', qty, tx_time)
                    )
                    current_stock -= qty
            else:
                # Nhập
                qty = random.randint(100, 500)
                cursor.execute(
                    "INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (%s, %s, %s, %s)",
                    (pid, 'nhap', qty, tx_time)
                )
                current_stock += qty

        # Insert ton_kho
        cursor.execute(
            "INSERT INTO ton_kho (san_pham_id, so_luong, vi_tri) VALUES (%s, %s, %s)",
            (pid, current_stock, random.choice(locations))
        )

    conn.commit()
    cursor.close()
    conn.close()
    print("Successfully generated 100 products and transaction history.")

if __name__ == '__main__':
    generate_data()
