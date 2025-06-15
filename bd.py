import pymysql

def get_connection():
    return pymysql.connect(
        host="database-proyecto-final.ce1g806g8367.us-east-1.rds.amazonaws.com",
        user="admin",
        password="#Citasmedicas123",
        database="citas_medicas"
    )
