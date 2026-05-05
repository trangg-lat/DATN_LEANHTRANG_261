import mysql.connector
import pandas as pd
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Kết nối MySQL - thống nhất với db.js dùng database 'quanly_kho'
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="123456",
        database="quanly_kho"
    )

# ======================================================
# ENDPOINT 1: Dự báo đơn giản (giữ lại tương thích cũ)
# ======================================================
@app.route('/predict', methods=['GET'])
def predict():
    try:
        conn = get_db_connection()
        query = """
            SELECT sp.id, sp.ten_san_pham, IFNULL(tk.so_luong, 0) as so_luong
            FROM san_pham sp
            LEFT JOIN ton_kho tk ON sp.id = tk.san_pham_id
            ORDER BY sp.id ASC
        """
        df = pd.read_sql(query, conn)
        conn.close()

        if df.empty:
            return jsonify({"status": "error", "message": "Chưa có sản phẩm nào!"})

        X = np.array(df['id']).reshape(-1, 1)
        y = np.array(df['so_luong'])

        model = LinearRegression()
        model.fit(X, y)

        next_id = np.array([[X[-1][0] + 1]])
        prediction = model.predict(next_id)[0]

        return jsonify({
            "status": "success",
            "predicted_value": round(float(prediction), 2),
            "data_count": len(df),
            "message": "Dự báo dựa trên dữ liệu tồn kho."
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


# ======================================================
# ENDPOINT 2: DỰ BÁO NHU CẦU TOÀN BỘ SẢN PHẨM (MỚI)
# Phân tích lịch sử giao dịch xuất kho → dự báo 30 ngày
# ======================================================
@app.route('/predict-all', methods=['GET'])
def predict_all():
    try:
        conn = get_db_connection()

        # 1. Lấy lịch sử giao dịch XUẤT kho theo tuần cho từng sản phẩm
        query_history = """
            SELECT
                gd.san_pham_id,
                sp.ten_san_pham,
                YEARWEEK(gd.thoi_gian, 1) as year_week,
                MIN(gd.thoi_gian) as week_start,
                SUM(gd.so_luong) as tong_xuat
            FROM giao_dich gd
            JOIN san_pham sp ON gd.san_pham_id = sp.id
            WHERE gd.loai = 'xuat'
              AND gd.thoi_gian >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY gd.san_pham_id, sp.ten_san_pham, YEARWEEK(gd.thoi_gian, 1)
            ORDER BY gd.san_pham_id, year_week
        """
        df_history = pd.read_sql(query_history, conn)

        # 2. Lấy tồn kho hiện tại
        query_stock = """
            SELECT sp.id as san_pham_id, sp.ten_san_pham,
                   IFNULL(tk.so_luong, 0) as ton_kho_hien_tai
            FROM san_pham sp
            LEFT JOIN ton_kho tk ON sp.id = tk.san_pham_id
        """
        df_stock = pd.read_sql(query_stock, conn)

        # 3. Lấy tổng số giao dịch để thống kê
        query_count = "SELECT COUNT(*) as total FROM giao_dich"
        df_count = pd.read_sql(query_count, conn)
        total_transactions = int(df_count['total'].iloc[0])

        conn.close()

        if df_history.empty:
            return jsonify({
                "status": "error",
                "message": "Chưa có dữ liệu giao dịch xuất kho. Hãy import fake_data.sql trước!"
            })

        # 4. Dự báo cho từng sản phẩm
        predictions = []
        product_ids = df_history['san_pham_id'].unique()

        for pid in product_ids:
            product_data = df_history[df_history['san_pham_id'] == pid].copy()
            product_name = product_data['ten_san_pham'].iloc[0]

            if len(product_data) < 3:
                # Không đủ dữ liệu → lấy trung bình
                avg_weekly = product_data['tong_xuat'].mean()
                predicted_30d = round(avg_weekly * 4.3, 0)  # 4.3 tuần ≈ 1 tháng
                confidence = "Thấp"
                method = "Trung bình"
            else:
                # Đủ dữ liệu → Linear Regression
                product_data = product_data.reset_index(drop=True)
                X = np.arange(len(product_data)).reshape(-1, 1)
                y = product_data['tong_xuat'].values

                model = LinearRegression()
                model.fit(X, y)

                # Dự báo 4 tuần tiếp theo (≈ 30 ngày)
                future_weeks = np.arange(len(product_data), len(product_data) + 4).reshape(-1, 1)
                future_predictions = model.predict(future_weeks)
                predicted_30d = round(max(0, float(np.sum(future_predictions))), 0)

                # Đánh giá độ tin cậy dựa trên R²
                from sklearn.metrics import r2_score
                y_pred = model.predict(X)
                r2 = r2_score(y, y_pred)

                if r2 > 0.5:
                    confidence = "Cao"
                elif r2 > 0.2:
                    confidence = "Trung bình"
                else:
                    confidence = "Thấp"

                method = "Linear Regression"

                # Tính xu hướng (trend)
                trend_slope = float(model.coef_[0])

            # Lấy tồn kho hiện tại
            stock_row = df_stock[df_stock['san_pham_id'] == pid]
            current_stock = int(stock_row['ton_kho_hien_tai'].iloc[0]) if len(stock_row) > 0 else 0

            # Đánh giá trạng thái
            predicted_30d_int = int(predicted_30d)
            if current_stock >= predicted_30d_int * 1.5:
                status = "Dư thừa"
                suggestion = f"Giảm nhập {int(current_stock - predicted_30d_int)} đơn vị"
                status_color = "warning"
            elif current_stock >= predicted_30d_int:
                status = "Đủ hàng"
                suggestion = "Duy trì mức tồn kho hiện tại"
                status_color = "good"
            elif current_stock >= predicted_30d_int * 0.5:
                status = "Cần bổ sung"
                suggestion = f"Nhập thêm {int(predicted_30d_int - current_stock)} đơn vị"
                status_color = "low"
            else:
                status = "Thiếu hụt nghiêm trọng"
                suggestion = f"Nhập gấp {int(predicted_30d_int - current_stock)} đơn vị!"
                status_color = "critical"

            predictions.append({
                "san_pham_id": int(pid),
                "ten_san_pham": product_name,
                "ton_kho_hien_tai": current_stock,
                "du_bao_30_ngay": predicted_30d_int,
                "do_tin_cay": confidence,
                "trang_thai": status,
                "de_xuat": suggestion,
                "status_color": status_color,
                "phuong_phap": method
            })

        # Sắp xếp: thiếu hụt lên trước
        status_order = {"critical": 0, "low": 1, "warning": 2, "good": 3}
        predictions.sort(key=lambda x: status_order.get(x['status_color'], 4))

        return jsonify({
            "status": "success",
            "total_transactions": total_transactions,
            "total_products": len(predictions),
            "predictions": predictions,
            "message": f"Dự báo thành công cho {len(predictions)} sản phẩm dựa trên {total_transactions} giao dịch."
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)})


if __name__ == '__main__':
    print("🤖 AI Prediction Server đang chạy tại http://127.0.0.1:5000")
    print("📊 Endpoints:")
    print("   GET /predict     — Dự báo đơn giản")
    print("   GET /predict-all — Dự báo nhu cầu toàn bộ sản phẩm")
    app.run(port=5000, debug=True)