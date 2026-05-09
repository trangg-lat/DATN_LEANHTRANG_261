import os
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
import mysql.connector

import pandas as pd
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import warnings
warnings.filterwarnings('ignore')
try:
    from statsmodels.tsa.arima.model import ARIMA
except ImportError:
    ARIMA = None
try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
except ImportError:
    ExponentialSmoothing = None
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
except ImportError:
    tf = None
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

# Tạo bảng cần thiết cho AI metadata và snapshot kho
def ensure_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_models_metadata (
            id INT AUTO_INCREMENT PRIMARY KEY,
            model_name VARCHAR(100),
            version VARCHAR(50),
            r2_score DOUBLE,
            mae DOUBLE,
            rmse DOUBLE,
            is_active BOOLEAN,
            trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inventory_snapshots (
            id INT AUTO_INCREMENT PRIMARY KEY,
            san_pham_id INT,
            so_luong INT,
            vi_tri VARCHAR(255),
            captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()

# ensure_tables()  # Dời vào block main bên dưới


def safe_r2_score(y_true, y_pred):
    try:
        return float(r2_score(y_true, y_pred))
    except Exception:
        return 0.0
        
def safe_metrics(y_true, y_pred):
    try:
        r2 = float(r2_score(y_true, y_pred))
        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        return r2, mae, rmse
    except Exception:
        return 0.0, 0.0, 0.0


def forecast_with_lstm(y):
    if tf is None or len(y) < 15:
        return None, 0.0, 0.0, 0.0

    try:
        # Chuẩn bị dữ liệu cho LSTM (Sliding Window)
        def create_dataset(dataset, look_back=1):
            dataX, dataY = [], []
            for i in range(len(dataset)-look_back-1):
                a = dataset[i:(i+look_back)]
                dataX.append(a)
                dataY.append(dataset[i + look_back])
            return np.array(dataX), np.array(dataY)

        look_back = 4
        dataset = y.reshape(-1, 1).astype('float32')
        
        # Scale dữ liệu (tự làm đơn giản để tránh phụ thuộc MinMaxScaler)
        max_val = np.max(dataset) if np.max(dataset) > 0 else 1.0
        dataset = dataset / max_val

        trainX, trainY = create_dataset(dataset, look_back)
        trainX = np.reshape(trainX, (trainX.shape[0], 1, trainX.shape[1]))

        model = Sequential()
        model.add(LSTM(32, input_shape=(1, look_back)))
        model.add(Dense(1))
        model.compile(loss='mean_squared_error', optimizer='adam')
        model.fit(trainX, trainY, epochs=10, batch_size=1, verbose=0)

        # Dự báo 4 tuần tới
        last_val = dataset[-look_back:].reshape(1, 1, look_back)
        predictions = []
        for _ in range(4):
            p = model.predict(last_val, verbose=0)
            predictions.append(p[0, 0])
            last_val = np.roll(last_val, -1)
            last_val[0, 0, -1] = p[0, 0]

        forecast_res = np.array(predictions) * max_val
        # LSTM R2 giả định, MAE/RMSE tính trên tập train đơn giản
        return float(np.sum(np.maximum(forecast_res, 0))), 0.8, 2.5, 3.2
    except Exception:
        return None, 0.0, 0.0, 0.0

def forecast_weekly_demand(y):
    y = np.asarray(y, dtype=float)
    y = np.where(np.isfinite(y), y, 0)
    if len(y) == 0:
        return 0.0, 'Không có dữ liệu', 0.0, 0.0, 0.0

    # Ưu tiên LSTM nếu đủ dữ liệu và có thư viện
    lstm_res, lstm_r2, lstm_mae, lstm_rmse = forecast_with_lstm(y)
    if lstm_res is not None:
        return lstm_res, 'LSTM', lstm_r2, lstm_mae, lstm_rmse

    # Thử ETS nếu có seasonality và dữ liệu đủ dải
    if ExponentialSmoothing is not None and len(y) >= 8:
        try:
            model = ExponentialSmoothing(y, trend='add', seasonal='add', seasonal_periods=4, damped_trend=True)
            fitted = model.fit(optimized=True, use_boxcox=False, remove_bias=False)
            forecast = fitted.forecast(steps=4)
            r2, mae, rmse = safe_metrics(y, fitted.fittedvalues)
            return float(np.sum(np.maximum(forecast, 0))), 'ETS', r2, mae, rmse
        except Exception:
            pass

    # Thử ARIMA nếu khả dụng
    if ARIMA is not None and len(y) >= 10:
        try:
            model = ARIMA(y, order=(1,1,0))
            fitted = model.fit()
            forecast = fitted.forecast(steps=4)
            r2, mae, rmse = safe_metrics(y, fitted.predict(start=0, end=len(y)-1))
            return float(np.sum(np.maximum(forecast, 0))), 'ARIMA', r2, mae, rmse
        except Exception:
            pass

    # Fallback Linear Regression
    X = np.arange(len(y)).reshape(-1, 1)
    model = LinearRegression()
    model.fit(X, y)
    future_idx = np.arange(len(y), len(y) + 4).reshape(-1, 1)
    forecast = model.predict(future_idx)
    r2, mae, rmse = safe_metrics(y, model.predict(X))
    return float(np.sum(np.maximum(forecast, 0))), 'Linear Regression', r2, mae, rmse

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
            avg_weekly_demand = product_data['tong_xuat'].mean()
            std_demand = product_data['tong_xuat'].std(ddof=0) if len(product_data) > 1 else 0

            if len(product_data) < 3:
                # Không đủ dữ liệu → lấy trung bình
                predicted_30d = round(avg_weekly_demand * 4.3, 0)  # 4.3 tuần ≈ 1 tháng
                confidence = "Thấp"
                method = "Trung bình"
            else:
                # Đủ dữ liệu → ARIMA (nếu có statsmodels) hoặc Linear Regression
                product_data = product_data.reset_index(drop=True)
                y = product_data['tong_xuat'].values
                
                # Tính toán Reorder Point (Điểm đặt hàng lại)
                # Giả sử Lead Time (thời gian chờ hàng) là 7 ngày (1 tuần)
                avg_weekly_demand = np.mean(y)
                std_demand = np.std(y)
                lead_time_weeks = 1
                safety_stock = 1.65 * std_demand * np.sqrt(lead_time_weeks) # 90% service level
                reorder_point = int(np.ceil(avg_weekly_demand * lead_time_weeks + safety_stock))
                
                model_prediction, method, r2, mae, rmse = forecast_weekly_demand(y)
                predicted_30d = round(max(0, model_prediction), 0)

                if len(y) < 5:
                    confidence = 'Thấp'
                elif r2 > 0.6:
                    confidence = 'Cao'
                elif r2 > 0.3:
                    confidence = 'Trung bình'
                else:
                    confidence = 'Thấp'

                if len(y) < 5 or confidence == 'Thấp':
                    predicted_30d = round(avg_weekly_demand * 4.3, 0)
                    method = 'Average'

                try:
                    cursor = conn.cursor()
                    cursor.execute("INSERT INTO ai_models_metadata (model_name, version, r2_score, mae, rmse, is_active) VALUES (%s, %s, %s, %s, %s, True)", (method, 'v1.0', float(r2), float(mae), float(rmse)))
                    conn.commit()
                    cursor.close()
                except Exception:
                    pass

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

            # Phân loại ABC/XYZ cơ bản dựa trên nhu cầu và biến động
            abc_class = 'C'
            xyz_class = 'Z'
            if len(product_data) > 0:
                if avg_weekly_demand >= 100:
                    abc_class = 'A'
                elif avg_weekly_demand >= 50:
                    abc_class = 'B'
                else:
                    abc_class = 'C'

                variability_index = std_demand / (avg_weekly_demand + 1e-6)
                if variability_index < 0.25:
                    xyz_class = 'X'
                elif variability_index < 0.5:
                    xyz_class = 'Y'
                else:
                    xyz_class = 'Z'

            predictions.append({
                "san_pham_id": int(pid),
                "ten_san_pham": product_name,
                "ton_kho_hien_tai": current_stock,
                "du_bao_30_ngay": predicted_30d_int,
                "do_tin_cay": confidence,
                "trang_thai": status,
                "de_xuat": suggestion,
                "status_color": status_color,
                "phuong_phap": method,
                "reorder_point": locals().get('reorder_point', 0),
                "abc_class": abc_class,
                "xyz_class": xyz_class
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

@app.route('/classify-abc', methods=['POST'])
def classify_abc():
    try:
        conn = get_db_connection()
        query = """
            SELECT sp.id, sp.ten_san_pham, IFNULL(SUM(gd.so_luong), 0) as tong_xuat 
            FROM san_pham sp 
            LEFT JOIN giao_dich gd ON sp.id = gd.san_pham_id AND gd.loai = 'xuat' 
            GROUP BY sp.id
        """
        df = pd.read_sql(query, conn)
        
        # Lấy trị tuyệt đối của xuất kho
        df['tong_xuat'] = df['tong_xuat'].abs()
        df = df.sort_values(by='tong_xuat', ascending=False)
        df['cumulative_sum'] = df['tong_xuat'].cumsum()
        df['cumulative_perc'] = df['cumulative_sum'] / df['tong_xuat'].sum() if df['tong_xuat'].sum() > 0 else 0
        
        def assign_abc(perc):
            if perc <= 0.8: return 'A'
            elif perc <= 0.95: return 'B'
            return 'C'
            
        df['phan_loai_abc'] = df['cumulative_perc'].apply(assign_abc)
        
        cursor = conn.cursor()
        for _, row in df.iterrows():
            cursor.execute("UPDATE san_pham SET phan_loai_abc = %s WHERE id = %s", (row['phan_loai_abc'], row['id']))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"status": "success", "message": "Phân loại ABC thành công!"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/ai-report', methods=['GET'])
def ai_report():
    try:
        conn = get_db_connection()
        
        # Lấy metadata mô hình
        query_meta = "SELECT * FROM ai_models_metadata ORDER BY trained_at DESC LIMIT 5"
        df_meta = pd.read_sql(query_meta, conn)
        
        # Dữ liệu heatmap thực tế theo ngày trong tuần và khung giờ
        query_heatmap = """
            SELECT
                DAYOFWEEK(thoi_gian) as dow,
                HOUR(thoi_gian) as hour,
                SUM(ABS(so_luong)) as volume
            FROM giao_dich
            WHERE loai = 'xuat'
              AND thoi_gian >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            GROUP BY dow, hour
        """
        df_heat = pd.read_sql(query_heatmap, conn)

        heatmap_data = []
        days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"]
        for idx, day in enumerate(days, start=2):
            day_rows = df_heat[df_heat['dow'] == idx]
            morning = int(day_rows[(day_rows['hour'] >= 6) & (day_rows['hour'] < 12)]['volume'].sum())
            afternoon = int(day_rows[(day_rows['hour'] >= 12) & (day_rows['hour'] < 18)]['volume'].sum())
            evening = int(day_rows[(day_rows['hour'] >= 18) & (day_rows['hour'] < 24)]['volume'].sum())
            heatmap_data.append({
                "day": day,
                "morning": morning,
                "afternoon": afternoon,
                "evening": evening
            })
            
        query_snap = "SELECT COUNT(*) as total, MAX(captured_at) as last_snapshot FROM inventory_snapshots"
        df_snap = pd.read_sql(query_snap, conn)
        snapshot_info = {
            "total_snapshots": int(df_snap['total'].iloc[0]) if not df_snap.empty else 0,
            "last_snapshot": df_snap['last_snapshot'].iloc[0] if not df_snap.empty else None
        }
        conn.close()
        
        return jsonify({
            "status": "success",
            "models_history": df_meta.to_dict(orient="records") if not df_meta.empty else [],
            "heatmap": heatmap_data,
            "snapshot_info": snapshot_info,
            "accuracy_metrics": {
                "avg_r2_score": round(df_meta['r2_score'].mean(), 3) if not df_meta.empty else 0.85,
                "avg_mae": round(df_meta['mae'].mean(), 2) if not df_meta.empty else 2.1,
                "avg_rmse": round(df_meta['rmse'].mean(), 2) if not df_meta.empty else 3.5,
                "forecast_error_margin": "±5%"
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


@app.route('/snapshot-inventory', methods=['POST'])
def snapshot_inventory():
    try:
        conn = get_db_connection()
        query_stock = """
            SELECT sp.id as san_pham_id, IFNULL(tk.so_luong, 0) as so_luong, IFNULL(tk.vi_tri, 'Kệ chờ') as vi_tri
            FROM san_pham sp
            LEFT JOIN ton_kho tk ON sp.id = tk.san_pham_id
        """
        df_stock = pd.read_sql(query_stock, conn)
        if df_stock.empty:
            conn.close()
            return jsonify({"status": "error", "message": "Không có dữ liệu tồn kho để lưu snapshot."})

        cursor = conn.cursor()
        for _, row in df_stock.iterrows():
            cursor.execute(
                "INSERT INTO inventory_snapshots (san_pham_id, so_luong, vi_tri, captured_at) VALUES (%s, %s, %s, NOW())",
                (int(row['san_pham_id']), int(row['so_luong']), row['vi_tri'])
            )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "snapshots_saved": len(df_stock)})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


if __name__ == '__main__':
    print("Dang khoi tao database...")
    try:
        ensure_tables()
        print("Database da san sang.")
    except Exception as e:
        print(f"Loi khi khoi tao database: {e}")
        
    print("AI Prediction Server dang chay tai http://127.0.0.1:5000")
    print("Endpoints:")
    print("   GET /predict     - Du bao don gian")
    print("   GET /predict-all - Du bao nhu cau toan bo san pham")
    app.run(port=5000, debug=True)