import mysql.connector

def sync_locations():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="123456",
        database="quanly_kho"
    )
    cursor = conn.cursor()

    locations = [
        ("Khu A - Kệ 1", "Kệ chứa hàng điện tử và thiết bị công nghệ"),
        ("Khu A - Kệ 2", "Kệ chứa linh kiện nhỏ"),
        ("Khu B - Kệ 1", "Kệ chứa đồ gia dụng"),
        ("Khu B - Kệ 2", "Kệ chứa hàng may mặc, quần áo"),
        ("Khu C - Kệ 1", "Kệ chứa thực phẩm khô"),
        ("Khu D - Kệ 1", "Kệ đa năng dự phòng"),
        ("Kho lạnh", "Kho bảo quản thực phẩm đông lạnh, y tế"),
        ("Kho ngoài trời", "Kho chứa vật liệu xây dựng và hàng cồng kềnh")
    ]
    
    # Check existing locations
    cursor.execute("SELECT ten_vi_tri FROM vi_tri_kho")
    existing = [row[0] for row in cursor.fetchall()]
    
    count = 0
    for name, desc in locations:
        if name not in existing:
            cursor.execute(
                "INSERT INTO vi_tri_kho (ten_vi_tri, mo_ta) VALUES (%s, %s)",
                (name, desc)
            )
            count += 1
            
    conn.commit()
    cursor.close()
    conn.close()
    
    # Try using ascii only so it doesn't fail printing
    print(f"Added {count} new locations to vi_tri_kho.")

if __name__ == '__main__':
    sync_locations()
