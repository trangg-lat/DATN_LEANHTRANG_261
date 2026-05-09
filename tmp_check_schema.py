import mysql.connector
conn = mysql.connector.connect(host='localhost', user='root', password='123456', database='quanly_kho')
cur = conn.cursor()
for tbl in ['ton_kho', 'inventory_snapshots', 'giao_dich', 'san_pham']:
    try:
        cur.execute(f"SHOW CREATE TABLE {tbl}")
        row = cur.fetchone()
        print('TABLE', tbl)
        print(row[1])
        print('-'*60)
    except Exception as e:
        print('ERR', tbl, e)

cur.execute("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='quanly_kho' AND column_name='vi_tri'")
for row in cur.fetchall():
    print('FOUND', row)
conn.close()
