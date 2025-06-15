document.addEventListener("DOMContentLoaded", function () {
    const appointmentsList = document.getElementById("appointments-list");
    const noAppointmentsMessage = document.getElementById("no-appointments-message");

    // Modales de Bootstrap
    const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    const messageModalBody = document.getElementById('messageModalBody');

    // Función para mostrar mensajes usando el modal de Bootstrap
    function showMessage(message, title = "Mensaje") {
        document.getElementById('messageModalLabel').textContent = title; // Asegurarse de que el modal tiene un label
        messageModalBody.textContent = message;
        messageModal.show();
    }

    // Función para simular la carga de citas desde una "API"
    function loadAppointments() {
        // Simulación de datos de citas no procesadas
        const appointments = [
            { id: 1, date: "2025-06-28", time: "09:00-09:30", patient: "Deybar A. Mora S.", status: "Pendiente", type: "Revisión General" },
            { id: 2, date: "2025-07-05", time: "14:30-15:00", patient: "Deybar A. Mora S.", status: "Pendiente", type: "Control Post-operatorio" },
            { id: 3, date: "2025-07-12", time: "10:00-10:30", patient: "Deybar A. Mora S.", status: "Pendiente", type: "Consulta Nutricional" }
            // Agrega más citas simuladas si lo deseas
        ];

        // Ocultar el mensaje "Cargando citas..."
        noAppointmentsMessage.classList.add("d-none");

        if (appointments.length === 0) {
            noAppointmentsMessage.textContent = "No tienes citas médicas pendientes en este momento.";
            noAppointmentsMessage.classList.remove("d-none");
        } else {
            appointments.forEach(appointment => {
                const colDiv = document.createElement("div");
                colDiv.className = "col"; // Bootstrap grid column

                colDiv.innerHTML = `
                    <div class="card appointment-card h-100">
                        <div class="card-header">
                            Cita #${appointment.id} - ${appointment.type}
                        </div>
                        <div class="card-body">
                            <p><strong>Fecha:</strong> ${appointment.date}</p>
                            <p><strong>Hora:</strong> ${appointment.time}</p>
                            <p><strong>Paciente:</strong> ${appointment.patient}</p>
                            <p><strong>Estado:</strong> <span class="badge bg-warning text-dark">${appointment.status}</span></p>
                            <div class="d-flex justify-content-end gap-2 mt-3">
                                <button class="btn btn-danger btn-cancel-appointment" data-id="${appointment.id}">Cancelar Cita</button>
                                <button class="btn btn-success btn-reschedule-appointment" data-id="${appointment.id}">Reprogramar</button>
                            </div>
                        </div>
                    </div>
                `;
                appointmentsList.appendChild(colDiv);
            });

            // Añadir event listeners a los botones (simulados)
            document.querySelectorAll(".btn-cancel-appointment").forEach(button => {
                button.addEventListener("click", function() {
                    const appointmentId = this.dataset.id;
                    // Aquí iría la lógica para cancelar la cita en una base de datos
                    showMessage(`Cita #${appointmentId} cancelada (simulado).`, "Cita Cancelada");
                    // Opcional: Recargar o eliminar la tarjeta de la cita
                    this.closest(".col").remove();
                    if (appointmentsList.children.length === 0) {
                        noAppointmentsMessage.textContent = "No tienes citas médicas pendientes en este momento.";
                        noAppointmentsMessage.classList.remove("d-none");
                    }
                });
            });

            document.querySelectorAll(".btn-reschedule-appointment").forEach(button => {
                button.addEventListener("click", function() {
                    const appointmentId = this.dataset.id;
                    // Aquí iría la lógica para reprogramar la cita
                    showMessage(`Reprogramar cita #${appointmentId} (simulado).`, "Cita Reprogramada");
                    // Idealmente, esto podría redirigir al usuario a la página de reserva con la información de la cita precargada.
                });
            });
        }
    }

    // Cargar las citas cuando la página esté lista
    loadAppointments();
});