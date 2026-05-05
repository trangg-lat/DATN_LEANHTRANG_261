-- =====================================================
-- FAKE DATA: Lịch sử giao dịch xuất/nhập kho 12 tháng
-- Dành cho AI dự báo nhu cầu sản phẩm
-- Database: quanly_kho
-- Bảng: giao_dich (san_pham_id, loai, so_luong, thoi_gian)
-- =====================================================

USE quanly_kho;

-- =====================================================
-- PROCEDURE tạo data tự động
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS GenerateFakeData //

CREATE PROCEDURE GenerateFakeData()
BEGIN
    DECLARE v_product_id INT;
    DECLARE v_day_offset INT;
    DECLARE v_month INT;
    DECLARE v_base_demand INT;
    DECLARE v_seasonal_factor DECIMAL(3,2);
    DECLARE v_random_qty INT;
    DECLARE v_date DATETIME;
    DECLARE v_done INT DEFAULT 0;

    -- Cursor lấy tất cả sản phẩm hiện có
    DECLARE product_cursor CURSOR FOR SELECT id FROM san_pham;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    OPEN product_cursor;

    product_loop: LOOP
        FETCH product_cursor INTO v_product_id;
        IF v_done = 1 THEN
            LEAVE product_loop;
        END IF;

        -- Tạo base demand ngẫu nhiên cho mỗi sản phẩm (20-80)
        SET v_base_demand = 20 + FLOOR(RAND() * 60);

        -- Lặp qua 365 ngày gần nhất (12 tháng)
        SET v_day_offset = 365;

        WHILE v_day_offset >= 0 DO
            SET v_date = DATE_SUB(NOW(), INTERVAL v_day_offset DAY);
            SET v_month = MONTH(v_date);

            -- Hệ số mùa vụ (tháng 11-12 cao, tháng 2-3 thấp)
            CASE v_month
                WHEN 1 THEN SET v_seasonal_factor = 0.85;
                WHEN 2 THEN SET v_seasonal_factor = 0.70;
                WHEN 3 THEN SET v_seasonal_factor = 0.75;
                WHEN 4 THEN SET v_seasonal_factor = 0.90;
                WHEN 5 THEN SET v_seasonal_factor = 0.95;
                WHEN 6 THEN SET v_seasonal_factor = 1.00;
                WHEN 7 THEN SET v_seasonal_factor = 1.05;
                WHEN 8 THEN SET v_seasonal_factor = 1.10;
                WHEN 9 THEN SET v_seasonal_factor = 1.15;
                WHEN 10 THEN SET v_seasonal_factor = 1.20;
                WHEN 11 THEN SET v_seasonal_factor = 1.35;
                WHEN 12 THEN SET v_seasonal_factor = 1.40;
                ELSE SET v_seasonal_factor = 1.00;
            END CASE;

            -- 60% xác suất có giao dịch xuất
            IF RAND() < 0.60 THEN
                SET v_random_qty = GREATEST(1, ROUND(v_base_demand * v_seasonal_factor * (0.5 + RAND())));

                INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian)
                VALUES (v_product_id, 'xuat', v_random_qty, v_date);
            END IF;

            -- 40% xác suất có giao dịch nhập (bổ sung hàng)
            IF RAND() < 0.40 THEN
                SET v_random_qty = GREATEST(5, ROUND(v_base_demand * 1.2 * (0.8 + RAND() * 0.6)));

                INSERT INTO giao_dich (san_pham_id, loai, so_luong, thoi_gian)
                VALUES (v_product_id, 'nhap', v_random_qty, v_date);
            END IF;

            SET v_day_offset = v_day_offset - 1;
        END WHILE;

    END LOOP;

    CLOSE product_cursor;
END //

DELIMITER ;

-- Chạy procedure tạo data
CALL GenerateFakeData();

-- Xóa procedure sau khi dùng xong
DROP PROCEDURE IF EXISTS GenerateFakeData;

-- Kiểm tra kết quả
SELECT 'Tổng giao dịch đã tạo' AS thong_ke, COUNT(*) AS so_luong FROM giao_dich;

SELECT
    sp.ten_san_pham,
    COUNT(gd.id) AS so_giao_dich,
    SUM(CASE WHEN gd.loai = 'xuat' THEN gd.so_luong ELSE 0 END) AS tong_xuat,
    SUM(CASE WHEN gd.loai = 'nhap' THEN gd.so_luong ELSE 0 END) AS tong_nhap
FROM giao_dich gd
JOIN san_pham sp ON gd.san_pham_id = sp.id
GROUP BY sp.id, sp.ten_san_pham
ORDER BY so_giao_dich DESC;
