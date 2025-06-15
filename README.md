# Plataforma Web de Reservas de Citas Médicas 🏥

Este repositorio contiene la arquitectura y documentación del proyecto final de Computación en la Nube, cuyo objetivo es implementar una plataforma web en AWS para la gestión de citas médicas. La solución permite a los pacientes registrarse, iniciar sesión y reservar citas; mientras que médicos y administradores pueden gestionar la información del sistema de forma segura.

## 🌐 Arquitectura de la Solución en AWS

La arquitectura se despliega dentro de una **VPC privada**, segmentada en **subred pública** y **subred privada**:

- 🖥️ **EC2 (t2.micro)**: Aloja el backend en Python con contenido HTML.
- ☁️ **S3**: Almacena el frontend en HTML y archivos estáticos (CSS, JS, imágenes).
- 🔐 **Amazon Cognito**: Gestiona autenticación de pacientes, doctores y administrador.
- 🛢️ **Amazon RDS (MySQL)**: Guarda información de usuarios y citas, ubicado en la subred privada.
- 🌐 **Internet Gateway y tabla de rutas pública**: Permiten acceso web controlado solo a través de HTTP/HTTPS.

### Diagrama de Arquitectura

![Arquitectura en AWS](Arquitectura_AWS_proyecto%20final.png)

## 👤 Autores

- D.C. Sanchez Velasco  
- D.A Mora Segura  
- E.A Arroyave Lopez

---

> Proyecto desarrollado como trabajo final para la asignatura de **Computación en la Nube**.

