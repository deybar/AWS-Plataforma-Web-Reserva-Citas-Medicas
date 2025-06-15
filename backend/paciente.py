import pymysql
from backend.bd import get_connection

def guardar_paciente(datos):
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            # 1. Insertar en tabla Persona
            sql_persona = """
                INSERT INTO Persona (num_documento, nombre, apellido, correo, telefono, direccion)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql_persona, (
                datos['documento'],
                datos['nombre'],
                datos['apellido'],
                datos['correo'],
                datos['telefono'],
                datos['direccion']
            ))
            connection.commit()
            id_persona = cursor.lastrowid

            # 2. Insertar en tabla Usuario
            sql_usuario = """
                INSERT INTO Usuario (id_persona, id_cognito, rol)
                VALUES (%s, %s, %s)
            """
            cursor.execute(sql_usuario, (id_persona, datos['id_cognito'], 'paciente'))
            connection.commit()
            id_usuario = cursor.lastrowid

            # 3. Insertar en tabla Paciente
            sql_paciente = """
                INSERT INTO Paciente (id_persona, fecha_nacimiento)
                VALUES (%s, %s)
            """
            cursor.execute(sql_paciente, (
                id_persona,
                datos['fechaNacimiento']
            ))
            connection.commit()

            return {"status": "ok", "id_usuario": id_usuario}

    except Exception as e:
        print("Error al guardar paciente:", e)
        return {"status": "error", "error": str(e)}
	finally:
        if 'connection' in locals():
            connection.close()

