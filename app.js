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

    // Modales de Bootstrap
    const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    const messageModalBody = document.getElementById('messageModalBody');
    const confirmReservationModal = new bootstrap.Modal(document.getElementById('confirmReservationModal'));
    const confirmReservationModalBody = document.getElementById('confirmReservationModalBody');

    // Variables para almacenar la selección del usuario
    let selectedDayElement = null; // Elemento DOM del día seleccionado en el calendario
    let selectedDateString = null; // Fecha seleccionada en formato YYYY-MM-DD
    let selectedTimeSlotElement = null; // Elemento DOM de la franja horaria seleccionada
    let selectedTimeSlotString = null; // Franja horaria seleccionada (ej: "08:00-08:30")
    let selectedDoctorId = null;
    let selectedDoctorName = null;

    // --- Datos de Doctores y Disponibilidad (Simulados) ---
    // En un escenario real, esto vendría de una API
    const doctors = [
        {
            id: 'doc1',
            name: 'Dr. Ana García (General)',
            busySlots: {
                // Slots ocupados para el Dr. Ana García para cualquier día
                // Puedes extender esto para tener disponibilidad por fecha si es necesario
                morning: ["09:00-09:30", "11:00-11:30"],
                afternoon: ["14:30-15:00", "16:30-17:00"]
            }
        },
        {
            id: 'doc2',
            name: 'Dr. Carlos Pérez (Pediatra)',
            busySlots: {
                morning: ["08:30-09:00", "09:30-10:00"],
                afternoon: ["13:00-13:30", "15:30-16:00"]
            }
        },
        {
            id: 'doc3',
            name: 'Dr. Laura Martínez (Dermatóloga)',
            busySlots: {
                morning: ["10:00-10:30"],
                afternoon: ["13:30-14:00", "16:00-16:30"]
            }
        }
    ];

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

    // Función para mostrar mensajes usando el modal general
    function showMessage(message, title = "Mensaje") {
        document.getElementById('messageModalLabel').textContent = title;
        messageModalBody.textContent = message;
        messageModal.show();
    }

    // Función para actualizar el resumen de la reserva
    function updateReservationSummary() {
        if (selectedDateString && selectedTimeSlotString && selectedDoctorName) {
            reservationSummaryEl.innerHTML = `
                <strong>Resumen de tu cita:</strong><br>
                Doctor: <span class="fw-bold text-primary">${selectedDoctorName}</span><br>
                Fecha: <span class="fw-bold text-primary">${selectedDateString}</span><br>
                Hora: <span class="fw-bold text-primary">${selectedTimeSlotString}</span>
            `;
            reservationSummaryEl.classList.remove("d-none"); // Mostrar el resumen
        } else {
            reservationSummaryEl.innerHTML = "";
            reservationSummaryEl.classList.add("d-none"); // Ocultar si no hay selección completa
        }
    }

    // --- Funciones de inicialización y manejo de selección de Doctor ---

    // Función para poblar el dropdown de doctores
    function populateDoctorsDropdown() {
        doctors.forEach(doctor => {
            const option = document.createElement("option");
            option.value = doctor.id;
            option.textContent = doctor.name;
            doctorSelect.appendChild(option);
        });
    }

    // Event listener para la selección de doctor
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
                    today.setHours(0, 0, 0, 0); // Normalizar hoy a inicio del día
                    const selected = new Date(info.dateStr);
                    selected.setHours(0, 0, 0, 0); // Normalizar selección a inicio del día

                    // Restablecer el estilo del día previamente seleccionado
                    if (selectedDayElement) {
                        selectedDayElement.classList.remove("selected-day");
                    }

                    // Si la fecha seleccionada es pasada, mostrar mensaje y no seleccionar
                    if (selected < today) {
                        showMessage("No puedes seleccionar una fecha pasada.");
                        selectedDayElement = null;
                        selectedDateString = null;
                        selectedDateEl.textContent = "Selecciona un día en el calendario";
                        franjaDia.textContent = "selecciona un día";
                        morningSlots.innerHTML = "";
                        afternoonSlots.innerHTML = "";
                        // Limpiar también la selección de franja horaria y el resumen
                        if (selectedTimeSlotElement) {
                            selectedTimeSlotElement.classList.remove("slot-seleccionado");
                            selectedTimeSlotElement = null;
                        }
                        selectedTimeSlotString = null;
                        updateReservationSummary(); // Ocultar resumen si no hay fecha válida
                        return;
                    }

                    // Si la fecha es válida, aplicar la clase de seleccionado
                    selectedDayElement = info.dayEl; // Guarda la referencia al elemento del día
                    selectedDayElement.classList.add("selected-day");

                    selectedDateString = info.dateStr; // Guarda la fecha seleccionada
                    selectedDateEl.textContent = `Has seleccionado: ${selectedDateString}`;
                    franjaDia.textContent = `el día ${selectedDateString}`;

                    // Limpiar selección de franja horaria previa al cambiar de día
                    if (selectedTimeSlotElement) {
                        selectedTimeSlotElement.classList.remove("slot-seleccionado");
                        selectedTimeSlotElement = null;
                    }
                    selectedTimeSlotString = null;

                    cargarFranjas(selectedDateString); // Cargar franjas para el día seleccionado
                    updateReservationSummary(); // Actualizar el resumen
                },
                dayCellDidMount: function (info) {
                    const fecha = new Date(info.date);
                    const hoy = new Date();
                    hoy.setHours(0, 0, 0, 0);
                    fecha.setHours(0, 0, 0, 0);

                    if (fecha < hoy) {
                        info.el.style.backgroundColor = "#eee"; // gris para días pasados
                        info.el.setAttribute("title", "Día pasado");
                        // Eliminar cualquier estilo de "ocupado" o "disponible" si la fecha es pasada
                        info.el.classList.remove("slot-ocupado", "slot-disponible");
                    } else {
                        // Aquí, la disponibilidad del día en el calendario (fondo de celda)
                        // sigue siendo aleatoria, no vinculada al doctor específico.
                        // Para vincularla, necesitarías una API que devuelva la disponibilidad
                        // diaria de cada doctor. Por ahora, nos enfocamos en los slots.
                        const ocupado = Math.random() > 0.6; // Simulación simple de ocupación del día
                        info.el.style.backgroundColor = ocupado ? "#f8c6cc" : "#c5f7d3";
                        info.el.setAttribute("title", ocupado ? "Día lleno" : "Citas disponibles");
                        info.el.classList.add(ocupado ? "slot-ocupado-calendar-cell" : "slot-disponible-calendar-cell");
                    }

                    // Estilo específico para el día de hoy
                    if (fecha.getFullYear() === hoy.getFullYear() &&
                        fecha.getMonth() === hoy.getMonth() &&
                        fecha.getDate() === hoy.getDate()) {
                        info.el.style.backgroundColor = "rgba(194, 200, 211, 0.8)"; // azul claro para hoy
                        info.el.style.color = "rgba(161, 22, 22, 0.8)"; // rojo
                        info.el.style.fontWeight = "bold"; // negrita
                        info.el.setAttribute("title", "Hoy");
                    }

                    new bootstrap.Tooltip(info.el);
                }
            });
            calendar.render();
        } else {
            // Si el calendario ya está inicializado, solo necesitamos re-renderizarlo
            // para que las tooltips y los estilos de día se actualicen si es necesario.
            // Aunque para la disponibilidad de slots, eso se maneja en cargarFranjas.
            calendar.refetchEvents(); // Si tuvieras eventos, los recargaría
            calendar.render(); // Re-renderiza para aplicar posibles cambios de dayCellDidMount si los hubiere
        }
    });

    // Función para cargar y mostrar las franjas horarias según el doctor seleccionado
    function cargarFranjas(fecha) {
        if (!selectedDoctorId) {
            morningSlots.innerHTML = "";
            afternoonSlots.innerHTML = "";
            return; // No cargar franjas si no hay doctor seleccionado
        }

        const doctor = doctors.find(d => d.id === selectedDoctorId);
        if (!doctor) {
            console.error("Doctor no encontrado para el ID:", selectedDoctorId);
            morningSlots.innerHTML = "";
            afternoonSlots.innerHTML = "";
            return;
        }

        const doctorBusyMorningSlots = doctor.busySlots.morning || [];
        const doctorBusyAfternoonSlots = doctor.busySlots.afternoon || [];

        morningSlots.innerHTML = "";
        afternoonSlots.innerHTML = "";

        const createSlotDiv = (slot, isOccupied) => {
            const div = document.createElement("div");
            div.className = isOccupied ? "slot-ocupado" : "slot-disponible";
            div.innerText = slot;

            if (!isOccupied) {
                div.addEventListener("click", () => {
                    // Quitar la clase de selección del slot previamente seleccionado
                    if (selectedTimeSlotElement) {
                        selectedTimeSlotElement.classList.remove("slot-seleccionado");
                    }
                    // Asignar y aplicar la clase al nuevo slot seleccionado
                    selectedTimeSlotElement = div;
                    selectedTimeSlotElement.classList.add("slot-seleccionado");
                    selectedTimeSlotString = slot; // Guardar la franja horaria

                    updateReservationSummary(); // Actualizar el resumen
                });
            }
            return div;
        };

        allMorningSlots.forEach((slot) => {
            const ocupado = doctorBusyMorningSlots.includes(slot); // La ocupación depende del doctor
            morningSlots.appendChild(createSlotDiv(slot, ocupado));
        });

        allAfternoonSlots.forEach((slot) => {
            const ocupado = doctorBusyAfternoonSlots.includes(slot); // La ocupación depende del doctor
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

        // Mostrar el modal de confirmación con el resumen
        confirmReservationModalBody.innerHTML = `
            ¿Estás seguro de que quieres reservar tu cita con el Doctor
            <span class="fw-bold text-primary">${selectedDoctorName}</span> para el día
            <span class="fw-bold text-primary">${selectedDateString}</span>
            a las <span class="fw-bold text-primary">${selectedTimeSlotString}</span>?
        `;
        confirmReservationModal.show();
    });

    // Event listener para el botón "Confirmar" dentro del modal de confirmación
    btnConfirmarReserva.addEventListener("click", () => {
        // Aquí iría la lógica real para guardar la cita en una base de datos o API
        console.log(`Cita confirmada para ${selectedDateString} a las ${selectedTimeSlotString} con el Dr. ${selectedDoctorName}`);

        // Ocultar el modal de confirmación
        confirmReservationModal.hide();

        // Mostrar un mensaje de éxito usando el modal general
        showMessage(`¡Cita reservada correctamente con el Dr. ${selectedDoctorName} para el ${selectedDateString} a las ${selectedTimeSlotString}!`);

        // Opcional: Resetear la interfaz después de la reserva exitosa
        // calendar.render(); // Para refrescar el calendario si es necesario
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

    // --- Inicialización al cargar la página ---
    populateDoctorsDropdown(); // Cargar los doctores en el dropdown
    // El calendario y las franjas horarias están ocultos por defecto hasta que se seleccione un doctor.
});