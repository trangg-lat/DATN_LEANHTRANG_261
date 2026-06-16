import mysql.connector
import random

def generate_suppliers():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="123456",
        database="quanly_kho"
    )
    cursor = conn.cursor()

    print("Generating 20 new suppliers...")
    
    companies = [
        "Công ty TNHH Thương Mại", "Công ty Cổ Phần Đầu Tư", "Tập đoàn", "Công ty XNK", 
        "Nhà phân phối", "Đại lý cấp 1", "Công ty TNHH Dịch Vụ", "Hợp tác xã"
    ]
    
    names = [
        "Toàn Cầu", "Bình Minh", "Hải Đăng", "Sao Mai", "Việt Phát", "Hoàng Gia",
        "Tân Tiến", "Đức Lộc", "Minh Trí", "Phúc An", "Thành Đạt", "Hưng Thịnh",
        "Đại Hưng", "Hòa Bình", "Gia Phong", "Bảo Châu", "Trường Hải", "Vạn Xuân"
    ]
    
    cities = ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Bình Dương", "Đồng Nai", "Bắc Ninh"]
    streets = ["Nguyễn Trãi", "Lê Lợi", "Trần Hưng Đạo", "Hai Bà Trưng", "Lý Thường Kiệt", "Hoàng Hoa Thám", "Quang Trung", "Nguyễn Văn Cừ"]

    for i in range(20):
        comp = random.choice(companies)
        name = random.choice(names)
        full_name = f"{comp} {name} {i+1}"
        
        phone = f"0{random.randint(900000000, 999999999)}"
        
        address = f"Số {random.randint(1, 500)}, Đường {random.choice(streets)}, {random.choice(cities)}"
        
        cursor.execute(
            "INSERT INTO nha_cung_cap (ten_ncc, lien_he, dia_chi) VALUES (%s, %s, %s)",
            (full_name, phone, address)
        )

    conn.commit()
    cursor.close()
    conn.close()
    print("Successfully generated 20 new suppliers.")

if __name__ == '__main__':
    generate_suppliers()
