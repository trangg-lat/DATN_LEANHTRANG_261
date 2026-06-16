# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import mysql.connector
import random
from datetime import datetime, timedelta

def generate_may_june_transactions():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="123456",
        database="quanly_kho"
    )
    cursor = conn.cursor()

    # Lấy danh sách sản phẩm và tồn kho hiện tại
    cursor.execute("SELECT sp.id, sp.ten_san_pham, IFNULL(tk.so_luong, 0) as so_luong FROM san_pham sp LEFT JOIN ton_kho tk ON sp.id = tk.san_pham_id ORDER BY sp.id")
    products = cursor.fetchall()

    if not products:
        print("❌ Không có sản phẩm nào trong database!")
        conn.close()
        return

    print(f"✅ Tìm thấy {len(products)} sản phẩm.")

    # Xác định khoảng thời gian tháng 5 và 6/2026
    start_may = datetime(2026, 5, 1, 7, 0, 0)
    end_june  = datetime(2026, 6, 15, 23, 59, 59)  # Đến hôm nay 15/6

    total_tx = 0

    for (pid, ten_sp, so_luong_hien_tai) in products:
        current_stock = so_luong_hien_tai

        # Mỗi sản phẩm có 20-50 giao dịch trong tháng 5-6
        tx_count = random.randint(20, 50)

        # Tỉ lệ: 40% nhập, 60% xuất (thực tế hơn)
        for _ in range(tx_count):
            # Random thời gian trong khoảng 1/5 - 15/6/2026
            delta_seconds = int((end_june - start_may).total_seconds())
            tx_time = start_may + timedelta(seconds=random.randint(0, delta_seconds))
            # Chỉ ngày làm việc (8h-18h) để thực tế hơn
            tx_time = tx_time.replace(hour=random.randint(8, 17), minute=random.randint(0, 59), second=random.randint(0, 59))

            loai_gd = random.choices(['nhap', 'xuat'], weights=[0.4, 0.6])[0]

            if loai_gd == 'nhap':
                qty = random.randint(50, 300)
                cursor.execute(
                    "INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (%s, %s, %s, %s)",
                    (pid, 'nhap', qty, tx_time)
                )
                current_stock += qty
                total_tx += 1

            else:  # xuat
                qty = random.randint(10, 100)
                if current_stock >= qty:
                    cursor.execute(
                        "INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (%s, %s, %s, %s)",
                        (pid, 'xuat', qty, tx_time)
                    )
                    current_stock -= qty
                    total_tx += 1
                else:
                    # Nếu không đủ tồn kho, nhập bù trước rồi mới xuất
                    import_qty = random.randint(200, 500)
                    cursor.execute(
                        "INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (%s, %s, %s, %s)",
                        (pid, 'nhap', import_qty, tx_time - timedelta(hours=2))
                    )
                    current_stock += import_qty
                    total_tx += 1

                    cursor.execute(
                        "INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian) VALUES (%s, %s, %s, %s)",
                        (pid, 'xuat', qty, tx_time)
                    )
                    current_stock -= qty
                    total_tx += 1

        # Cập nhật tồn kho hiện tại (sau khi thêm giao dịch)
        if current_stock < 0:
            current_stock = 0

        cursor.execute(
            "UPDATE ton_kho SET so_luong = %s WHERE san_pham_id = %s",
            (current_stock, pid)
        )
        # Nếu chưa có bản ghi tồn kho thì insert
        if cursor.rowcount == 0:
            cursor.execute(
                "INSERT INTO ton_kho (san_pham_id, so_luong, vi_tri) VALUES (%s, %s, 'Kệ chờ')",
                (pid, current_stock)
            )

        print(f"  ✔ {ten_sp[:40]:<40} | Tồn kho mới: {current_stock:>6}")

    conn.commit()
    cursor.close()
    conn.close()

    print(f"\n🎉 Hoàn tất! Đã thêm {total_tx} giao dịch nhập/xuất kho cho tháng 5-6/2026.")

if __name__ == '__main__':
    generate_may_june_transactions()
