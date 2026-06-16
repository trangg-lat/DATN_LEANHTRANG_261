-- Tạo bảng liên kết nhân viên với khu vực
CREATE TABLE IF NOT EXISTS nhan_vien_vi_tri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nhan_vien_id INT NOT NULL,
    vi_tri_id INT NOT NULL,
    ngay_phan_cong DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nhan_vien_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    FOREIGN KEY (vi_tri_id) REFERENCES vi_tri_kho(id) ON DELETE CASCADE,
    UNIQUE KEY unique_nhan_vien_vi_tri (nhan_vien_id, vi_tri_id)
);
