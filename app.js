document.addEventListener("DOMContentLoaded", function () {
    // Referencias a elementos del DOM
    const doctorSelect = document.getElementById("doctor-select");
    const calendarAndSlotsContainer = document.getElementById("calendar-and-slots-container");
    const calendarEl = document.getElementById("calendar");
    const selectedDateEl = document.getElementById("selected-date");
    const franjaDia = document.getElementById("franja-dia");
    const morningSlots = document.getElementById("morning-slots");
    const afternoonSlots = document.getElementById("afternoon-slots");
    const reservationSummaryEl = document.getElementById("reservation-summary");
    const btnReservar = document.getElementById("btn-reservar");
    const btnConfirmarReserva = document.getElementById("btn-confirmar-reserva");
    const patientNameDisplay = document.getElementById("patient-name-display"); // Nuevo: para mostrar el nombre del paciente
    const logoutButton = document.getElementById("logout-button"); // Botón de cerrar sesión

    // Modales de Bootstrap
    const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    const messageModalBody = document.getElementById('messageModalBody');
    const confirmReservationModal = new bootstrap.Modal(document.getElementById('confirmReservationModal'));
    const confirmReservationModalBody = document.getElementById('confirmReservationModalBody');

    // Variables para almacenar la selección del usuario
    let selectedDayElement = null;
    let selectedDateString = null;
    let selectedTimeSlotElement = null;
    let selectedTimeSlotString = null;
    let selectedDoctorId = null;
    let selectedDoctorName = null;

    // URL base de tu backend
    const BASE_API_URL = "http://44.199.251.29:5000/api";

    // Franjas horarias generales disponibles para todos los doctores
    const allMorningSlots = [
        "08:00-08:30", "08:30-09:00", "09:00-09:30", "09:30-10:00",
        "10:00-10:30", "10:30-11:00", "11:00-11:30", "11:30-12:00"
    ];
    const allAfternoonSlots = [
        "13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00",
        "15:00-15:30", "15:30-16:00", "16:00-16:30", "16:30-17:00"
    ];

    // --- FullCalendar Instance ---
    let calendar = null; // Initialize calendar as null

    // --- Funciones de utilidad ---

    function showMessage(message, title = "Mensaje") {
        document.getElementById('messageModalLabel').textContent = title;
        messageModalBody.textContent = message;
        messageModal.show();
    }

    function updateReservationSummary() {
        if (selectedDateString && selectedTimeSlotString && selectedDoctorName) {
            reservationSummaryEl.innerHTML = `
                <strong>Resumen de tu cita:</strong><br>
                Doctor: <span class="fw-bold text-primary">${selectedDoctorName}</span><br>
                Fecha: <span class="fw-bold text-primary">${selectedDateString}</span><br>
                Hora: <span class="fw-bold text-primary">${selectedTimeSlotString}</span>
            `;
            reservationSummaryEl.classList.remove("d-none");
        } else {
            reservationSummaryEl.innerHTML = "";
            reservationSummaryEl.classList.add("d-none");
        }
    }

    // --- Lógica de Carga de Datos del Backend ---

    async function fetchPatientName(idCognito) {
        if (!idCognito) {
            patientNameDisplay.textContent = "Usuario no logueado";
            console.warn("ID de Cognito no encontrado en localStorage. Redirigiendo a login...");
            // Redirigir al login si no hay ID de Cognito
            window.location.href = "index.html"; // index.html es ahora tu página de login/registro
            return;
        }
        try {
            // Nota: Aquí usaremos el id_cognito, pero tu backend espera un ID numérico de persona.
            // Necesitarías un endpoint en tu backend que resuelva el id_cognito a un id_persona.
            // O bien, el backend podría devolver el nombre directamente al buscar por id_cognito.
            // Para este ejemplo, simularé que tengo un id_paciente para enviar al endpoint existente.
            // Si el backend espera 'id_cognito' para buscar el nombre, la URL sería:
            // `${BASE_API_URL}/nombre_usuario_por_cognito/${idCognito}`
            // Pero según el index_esteban.html, el endpoint es por id numérico.
            // Por simplicidad en el frontend y dado que el backend de nombre_usuario espera un id numérico,
            // usaremos el nombre guardado en localStorage como fallback o simularemos un ID.
            // Idealmente, el backend debería tener un endpoint para obtener el nombre por id_cognito.

            const userNameFromStorage = localStorage.getItem("userName"); // Nombre que guardamos del token Cognito
            if (userNameFromStorage) {
                patientNameDisplay.textContent = userNameFromStorage;
            } else {
                patientNameDisplay.textContent = "Usuario sin nombre";
                // Podrías intentar buscar el nombre por el idCognito si tu backend lo soporta
                // const response = await fetch(`${BASE_API_URL}/nombre_usuario_por_cognito/${idCognito}`);
                // if (response.ok) {
                //     const data = await response.json();
                //     patientNameDisplay.textContent = data.nombre_completo;
                //     localStorage.setItem("userName", data.nombre_completo); // Guardar para futuras cargas
                // } else {
                //     console.error("Error al obtener nombre de usuario por Cognito ID:", response.status);
                //     patientNameDisplay.textContent = "Error al cargar nombre";
                // }
            }

        } catch (error) {
            console.error("Error al obtener el nombre del paciente:", error);
            patientNameDisplay.textContent = "Error al cargar nombre";
        }
    }

    async function fetchDoctors() {
        try {
            const response = await fetch(`${BASE_API_URL}/medicos`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const doctorsData = await response.json();
            populateDoctorsDropdown(doctorsData);
        } catch (error) {
            console.error("Error al cargar médicos:", error);
            showMessage("No se pudo cargar la lista de doctores. Intenta de nuevo más tarde.", "Error de Carga");
            // Deshabilitar el selector de doctores si hay un error
            doctorSelect.innerHTML = `<option selected disabled value="">-- Error al cargar Doctores --</option>`;
            doctorSelect.disabled = true;
        }
    }

    // Función para poblar el dropdown de doctores
    function populateDoctorsDropdown(doctorsArray) {
        doctorSelect.innerHTML = '<option selected disabled value="">-- Selecciona un Doctor --</option>'; // Limpiar opciones existentes
        if (doctorsArray.length > 0) {
            doctorsArray.forEach(doctor => {
                const option = document.createElement("option");
                option.value = doctor.id_medico; // Asumo que tu API devuelve id_medico
                option.textContent = `${doctor.nombre} ${doctor.apellido}`; // Asumo que devuelve nombre y apellido
                doctorSelect.appendChild(option);
            });
            doctorSelect.disabled = false;
        } else {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No hay médicos disponibles";
            doctorSelect.appendChild(option);
            doctorSelect.disabled = true;
        }
    }

    // --- Funciones de manejo de selección de Doctor y Calendario ---

    doctorSelect.addEventListener("change", function () {
        selectedDoctorId = this.value;
        selectedDoctorName = this.options[this.selectedIndex].textContent;

        console.log("Doctor seleccionado:", selectedDoctorName, "ID:", selectedDoctorId);

        // Resetear la selección de fecha y hora al cambiar de doctor
        if (selectedDayElement) {
            selectedDayElement.classList.remove("selected-day");
            selectedDayElement = null;
        }
        selectedDateString = null;
        selectedTimeSlotElement = null;
        selectedTimeSlotString = null;
        morningSlots.innerHTML = "";
        afternoonSlots.innerHTML = "";
        selectedDateEl.textContent = "Selecciona un día en el calendario";
        franjaDia.textContent = "selecciona un día";
        updateReservationSummary(); // Ocultar el resumen

        // Mostrar el calendario y las franjas horarias
        calendarAndSlotsContainer.classList.remove("d-none");

        // Renderizar o re-renderizar el calendario solo una vez
        if (!calendar) {
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: "dayGridMonth",
                locale: "es",
                height: "auto",
                headerToolbar: {
                    left: "prev",
                    center: "title",
                    right: "next"
                },
                dateClick: function (info) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selected = new Date(info.dateStr);
                    selected.setHours(0, 0, 0, 0);

                    if (selectedDayElement) {
                        selectedDayElement.classList.remove("selected-day");
                    }

                    if (selected < today) {
                        showMessage("No puedes seleccionar una fecha pasada.");
                        selectedDayElement = null;
                        selectedDateString = null;
                        selectedDateEl.textContent = "Selecciona un día en el calendario";
                        franjaDia.textContent = "selecciona un día";
                        morningSlots.innerHTML = "";
                        afternoonSlots.innerHTML = "";
                        if (selectedTimeSlotElement) {
                            selectedTimeSlotElement.classList.remove("slot-seleccionado");
                            selectedTimeSlotElement = null;
                        }
                        selectedTimeSlotString = null;
                        updateReservationSummary();
                        return;
                    }

                    selectedDayElement = info.dayEl;
                    selectedDayElement.classList.add("selected-day");

                    selectedDateString = info.dateStr;
                    selectedDateEl.textContent = `Has seleccionado: ${selectedDateString}`;
                    franjaDia.textContent = `el día ${selectedDateString}`;

                    if (selectedTimeSlotElement) {
                        selectedTimeSlotElement.classList.remove("slot-seleccionado");
                        selectedTimeSlotElement = null;
                    }
                    selectedTimeSlotString = null;

                    cargarFranjas(selectedDateString, selectedDoctorId); // Pasa el ID del doctor
                    updateReservationSummary();
                },
                dayCellDidMount: function (info) {
                    const fecha = new Date(info.date);
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    fecha.setHours(0, 0, 0, 0);

                    if (fecha < hoy) {
                        info.el.style.backgroundColor = "#eee";
                        info.el.setAttribute("title", "Día pasado");
                        info.el.classList.remove("slot-ocupado", "slot-disponible");
                    } else {
                        // La disponibilidad del día sigue siendo simulada, no vinculada al doctor específico.
                        // Para vincularla, el backend necesitaría dar disponibilidad diaria por doctor.
                        const ocupado = Math.random() > 0.6;
                        info.el.style.backgroundColor = ocupado ? "#f8c6cc" : "#c5f7d3";
                        info.el.setAttribute("title", ocupado ? "Día lleno" : "Citas disponibles");
                        info.el.classList.add(ocupado ? "slot-ocupado-calendar-cell" : "slot-disponible-calendar-cell");
                    }

                    if (fecha.getFullYear() === hoy.getFullYear() &&
                        fecha.getMonth() === hoy.getMonth() &&
                        fecha.getDate() === hoy.getDate()) {
                        info.el.style.backgroundColor = "rgba(194, 200, 211, 0.8)";
                        info.el.style.color = "rgba(161, 22, 22, 0.8)";
                        info.el.style.fontWeight = "bold";
                        info.el.setAttribute("title", "Hoy");
                    }

                    new bootstrap.Tooltip(info.el);
                }
            });
            calendar.render();
        } else {
            // Si el calendario ya está inicializado y solo cambiamos de doctor,
            // podemos re-renderizar los eventos si los tuviéramos (para la disponibilidad de días)
            // y luego recargar las franjas horarias.
            calendar.refetchEvents(); // Recarga si tienes eventos dinámicos por doctor
            calendar.render();
        }
    });

    // Función para cargar y mostrar las franjas horarias según el doctor seleccionado
    async function cargarFranjas(fecha, doctorId) {
        if (!doctorId) {
            morningSlots.innerHTML = "";
            afternoonSlots.innerHTML = "";
            return;
        }

        // Simula la obtención de slots ocupados por doctor (antes era un array local)
        // En un caso real, esto sería una llamada a tu API:
        // const response = await fetch(`${BASE_API_URL}/doctor_disponibilidad/${doctorId}/${fecha}`);
        // const data = await response.json();
        // const busySlots = data.busySlots;

        const simulatedDoctorBusySlots = { // Esto vendría de la API real del doctor
            'doc1': {
                morning: ["09:00-09:30", "11:00-11:30"],
                afternoon: ["14:30-15:00", "16:30-17:00"]
            },
            'doc2': {
                morning: ["08:30-09:00", "09:30-10:00"],
                afternoon: ["13:00-13:30", "15:30-16:00"]
            },
            'doc3': {
                morning: ["10:00-10:30"],
                afternoon: ["13:30-14:00", "16:00-16:30"]
            }
        };

        const currentDoctorBusySlots = simulatedDoctorBusySlots[doctorId] || { morning: [], afternoon: [] };

        morningSlots.innerHTML = "";
        afternoonSlots.innerHTML = "";

        const createSlotDiv = (slot, isOccupied) => {
            const div = document.createElement("div");
            div.className = isOccupied ? "slot-ocupado" : "slot-disponible";
            div.innerText = slot;

            if (!isOccupied) {
                div.addEventListener("click", () => {
                    if (selectedTimeSlotElement) {
                        selectedTimeSlotElement.classList.remove("slot-seleccionado");
                    }
                    selectedTimeSlotElement = div;
                    selectedTimeSlotElement.classList.add("slot-seleccionado");
                    selectedTimeSlotString = slot;

                    updateReservationSummary();
                });
            }
            return div;
        };

        allMorningSlots.forEach((slot) => {
            const ocupado = currentDoctorBusySlots.morning.includes(slot);
            morningSlots.appendChild(createSlotDiv(slot, ocupado));
        });

        allAfternoonSlots.forEach((slot) => {
            const ocupado = currentDoctorBusySlots.afternoon.includes(slot);
            afternoonSlots.appendChild(createSlotDiv(slot, ocupado));
        });
    }

    // Event listener para el botón "Reservar cita"
    btnReservar.addEventListener("click", () => {
        if (!selectedDoctorId) {
            showMessage("Por favor, selecciona un doctor antes de reservar una cita.");
            return;
        }
        if (!selectedDateString || !selectedTimeSlotString) {
            showMessage("Por favor, selecciona primero un día en el calendario y una franja horaria disponible.");
            return;
        }

        confirmReservationModalBody.innerHTML = `
            ¿Estás seguro de que quieres reservar tu cita con el Dr.
            <span class="fw-bold text-primary">${selectedDoctorName}</span> para el
            <span class="fw-bold text-primary">${selectedDateString}</span>
            a las <span class="fw-bold text-primary">${selectedTimeSlotString}</span>?
        `;
        confirmReservationModal.show();
    });

    // Event listener para el botón "Confirmar" dentro del modal de confirmación
    btnConfirmarReserva.addEventListener("click", () => {
        console.log(`Cita confirmada para ${selectedDateString} a las ${selectedTimeSlotString} con el Dr. ${selectedDoctorName}`);

        confirmReservationModal.hide();

        showMessage(`¡Cita reservada correctamente con el Dr. ${selectedDoctorName} para el ${selectedDateString} a las ${selectedTimeSlotString}!`);

        // Opcional: Resetear la interfaz después de la reserva exitosa
        // Para reiniciar la selección y ocultar el calendario, descomenta esto:
        // selectedDateEl.textContent = "Selecciona un día en el calendario";
        // franjaDia.textContent = "selecciona un día";
        // morningSlots.innerHTML = "";
        // afternoonSlots.innerHTML = "";
        // if (selectedDayElement) {
        //     selectedDayElement.classList.remove("selected-day");
        //     selectedDayElement = null;
        // }
        // if (selectedTimeSlotElement) {
        //     selectedTimeSlotElement.classList.remove("slot-seleccionado");
        //     selectedTimeSlotElement = null;
        // }
        // selectedDateString = null;
        // selectedTimeSlotString = null;
        // selectedDoctorId = null; // Reiniciar selección de doctor
        // selectedDoctorName = null;
        // doctorSelect.value = ""; // Resetear dropdown del doctor
        // calendarAndSlotsContainer.classList.add("d-none"); // Ocultar calendario y slots
        // updateReservationSummary();
    });

    // --- Lógica para cerrar sesión ---
    logoutButton.addEventListener("click", function() {
        // Limpiar datos de sesión (ej. de localStorage)
        localStorage.removeItem("emailConfirmado");
        localStorage.removeItem("idCognito");
        localStorage.removeItem("userName");
        // Redirigir a la página de login
        window.location.href = "index.html";
    });

    // --- Inicialización al cargar la página ---
    const idCognitoPaciente = localStorage.getItem("idCognito");
    fetchPatientName(idCognitoPaciente); // Cargar el nombre del paciente en el navbar
    fetchDoctors(); // Cargar los doctores en el dropdown

    // El calendario y las franjas horarias están ocultos por defecto hasta que se seleccione un doctor.
});