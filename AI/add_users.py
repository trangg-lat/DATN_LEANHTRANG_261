import mysql.connector

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="123456",
        database="quanly_kho"
    )

def main():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get existing shelf locations
    cursor.execute("SELECT * FROM vi_tri_kho")
    shelves = cursor.fetchall()
    
    if not shelves:
        print("No shelves found!")
        return

    # bcrypt hash for "123456"
    hashed_password = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

    names = ["Nguyễn Văn An", "Trần Thị Bình", "Lê Văn Cường", "Phạm Thị Duyên", 
             "Hoàng Văn Ân", "Vũ Thị Phương", "Đặng Văn Hùng", "Bùi Thị Hải", 
             "Đỗ Văn Ích", "Hồ Thị Kỷ"]
    
    for i in range(10):
        name = names[i]
        shelf = shelves[i % len(shelves)]
        
        ho_ten = f"{name} (Khu {shelf['ten_vi_tri']})"
        ten_dang_nhap = f"nhanvien_khu{i+1}"
        
        try:
            cursor.execute("""
                INSERT INTO nguoi_dung (ten_dang_nhap, mat_khau, ho_ten, vai_tro, quyen_xem, quyen_sua, quyen_xoa)
                VALUES (%s, %s, %s, 'nhan_vien', 1, 0, 0)
            """, (ten_dang_nhap, hashed_password, ho_ten))
            pass
        except Exception as e:
            print("Error")
            
    conn.commit()
    cursor.close()
    conn.close()
    print("Successfully added 10 employees.")

if __name__ == "__main__":
    main()
