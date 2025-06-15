from flask import jsonify
import mysql.connector # Se mantiene para manejo de errores específicos si es necesario
from backend.bd import get_connection # ¡Importamos la función de conexión desde bd.py!
from datetime import date, timedelta, datetime # Importar para manejar fechas y horas

def get_nombre_completo_usuario(id_persona):
    conn = None
    cursor = None
    try:
        conn = get_connection() # Usamos la función de bd.py
        cursor = conn.cursor()
        query = "SELECT nombre, apellido FROM Persona WHERE id_persona = %s"
        cursor.execute(query, (id_persona,))
        resultado = cursor.fetchone()

        if resultado:
            nombre, apellido = resultado
            return f"{nombre} {apellido}"
        else:
            return "Usuario no encontrado"
    except mysql.connector.Error as err:
        print(f"Error al obtener nombre de usuario: {err}")
        return "Error en la base de datos" # Mensaje más genérico en caso de error
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def get_medicos():
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()       
        query = """
        SELECT
            m.id_medico,
            p.nombre,
            p.apellido
        FROM
            Medico m
        JOIN
            Persona p ON m.id_persona = p.id_persona
        JOIN
            Usuario u ON p.id_persona = u.id_persona
        WHERE
            u.rol = 'medico';
        """
        cursor.execute(query)
        raw_medicos = cursor.fetchall() # Obtiene la lista de tuplas

        # Transformar las tuplas en una lista de diccionarios
        medicos_formateados = []
        for medico_tuple in raw_medicos:
            # Asumiendo que el orden de las columnas en la consulta es:
            # 0: id_medico
            # 1: nombre
            # 2: apellido
            medicos_formateados.append({
                'id': medico_tuple[0],
                'nombre': medico_tuple[1],
                'apellido': medico_tuple[2],
                'nombre_completo': f"{medico_tuple[1]} {medico_tuple[2]}"
            })
        return medicos_formateados # Devuelve la lista de diccionarios
    except mysql.connector.Error as err:
        print(f"Error al obtener médicos: {err}")
        return []
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

## Generar los campos de código:

def generate_all_time_slots():
    slots = []
    start_time = datetime.strptime("08:00", "%H:%M").time()
    end_time = datetime.strptime("17:00", "%H:%M").time()
    interval = timedelta(minutes=30)

    current_time = start_time
    while current_time < end_time:
        slot_start = current_time
        slot_end = (datetime.combine(date.min, current_time) + interval).time()
        slots.append(f"{slot_start.strftime('%H:%M')}-{slot_end.strftime('%H:%M')}")
        current_time = slot_end
    return slots

def get_disponibilidad_medico_mes(id_medico):
    conn = None
    cursor = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        today = date.today()
        # Generar fechas para el próximo mes (ej. 30 días a partir de hoy)
        # Puedes ajustar el rango si necesitas más o menos días
        fechas_a_consultar = [today + timedelta(days=i) for i in range(30)]
        fechas_str = [f.strftime('%Y-%m-%d') for f in fechas_a_consultar]

        # Obtener todas las citas programadas para el médico en el rango de fechas
        # Unimos con Programacion para obtener la hora_inicio y hora_fin
        query_citas_ocupadas = f"""
        SELECT
            P.fecha,
            TIME_FORMAT(P.hora_inicio, '%H:%i') AS hora_inicio,
            TIME_FORMAT(P.hora_fin, '%H:%i') AS hora_fin
        FROM
            CitaMedica CM
        JOIN
            Programacion P ON CM.id_programacion = P.id_programacion
        WHERE
            P.id_medico = %s
            AND P.fecha BETWEEN %s AND %s
            AND CM.estado = 'programada';
        """
        cursor.execute(query_citas_ocupadas, (id_medico, fechas_str[0], fechas_str[-1]))
        citas_ocupadas_raw = cursor.fetchall()

        # Mapear las citas ocupadas para un acceso rápido: {'YYYY-MM-DD': ['HH:MM-HH:MM', ...]}
        ocupadas_por_fecha = {}
        for fecha, hora_inicio, hora_fin in citas_ocupadas_raw:
            fecha_key = fecha.strftime('%Y-%m-%d')
            if fecha_key not in ocupadas_por_fecha:
                ocupadas_por_fecha[fecha_key] = []
            ocupadas_por_fecha[fecha_key].append(f"{hora_inicio}-{hora_fin}")

        # Generar el resultado de disponibilidad para el frontend
        disponibilidad_completa = {}
        all_possible_slots = generate_all_time_slots()

        for d_date in fechas_a_consultar:
            fecha_key = d_date.strftime('%Y-%m-%d')
            slots_del_dia = []
            
            # Asumimos que todas las franjas están potencialmente disponibles
            # a menos que estén en 'ocupadas_por_fecha'
            for slot_time_range in all_possible_slots:
                is_occupied = False
                if fecha_key in ocupadas_por_fecha and slot_time_range in ocupadas_por_fecha[fecha_key]:
                    is_occupied = True
                
                # Para esta fase, no necesitamos el id_programacion aquí para el GET
                # Se obtendrá/creará en el POST de reserva.
                slots_del_dia.append({
                    'time_range': slot_time_range,
                    'ocupado': is_occupied,
                    'id_programacion': None # Placeholder, se llenará al reservar
                })
            disponibilidad_completa[fecha_key] = slots_del_dia
            
        return disponibilidad_completa

    except mysql.connector.Error as err:
        print(f"Error al obtener disponibilidad para médico {id_medico}: {err}")
        return {}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()