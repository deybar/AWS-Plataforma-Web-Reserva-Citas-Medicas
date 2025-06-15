document.addEventListener("DOMContentLoaded", function () {
    // Referencias a los elementos DOM
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");
    const confirmForm = document.getElementById("confirm-form");
    const completeForm = document.getElementById("complete-form");
    const bienvenidaDiv = document.getElementById("bienvenida");
    const formTitle = document.getElementById("form-title");

    const showLoginFormLink = document.getElementById("show-login-form");
    const showSignupFormLink = document.getElementById("show-signup-form");
    const resendCodeLink = document.getElementById("resend-code-link");
    const forgotPasswordLink = document.getElementById("forgot-password-link"); // Placeholder for future functionality

    // Modales de Bootstrap
    const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    const messageModalBody = document.getElementById('messageModalBody');

    // Configuración de Cognito
    const poolData = {
        UserPoolId: 'us-east-1_lomR014UE',  // Reemplaza con tu UserPoolId
        ClientId: '2p69kk7ggfu7lutsonsffc86af' // Reemplaza con tu App Client ID
    };

    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    let cognitoUser;
    let savedEmail = "";
    let savedUsername = ""; // El username generado para Cognito, que no será el email

    // --- Funciones de utilidad ---

    // Función para mostrar mensajes usando el modal de Bootstrap
    function showMessage(message, title = "Mensaje") {
        document.getElementById('messageModalLabel').textContent = title;
        messageModalBody.textContent = message;
        messageModal.show();
    }

    // Función para mostrar un formulario específico y ocultar los demás
    function showForm(formToShow, title) {
        signupForm.classList.add("d-none");
        loginForm.classList.add("d-none");
        confirmForm.classList.add("d-none");
        completeForm.classList.add("d-none");
        bienvenidaDiv.classList.add("d-none");

        formToShow.classList.remove("d-none");
        formTitle.textContent = title;
    }

    // --- Event Listeners para alternar formularios ---

    showLoginFormLink.addEventListener("click", function (e) {
        e.preventDefault();
        showForm(loginForm, "Iniciar Sesión");
    });

    showSignupFormLink.addEventListener("click", function (e) {
        e.preventDefault();
        showForm(signupForm, "Registro de Paciente");
    });

    resendCodeLink.addEventListener("click", function (e) {
        e.preventDefault();
        if (cognitoUser) {
            cognitoUser.resendConfirmationCode(function (err, result) {
                if (err) {
                    showMessage(err.message || JSON.stringify(err), "Error al reenviar código");
                    return;
                }
                showMessage("Código reenviado exitosamente. Revisa tu email.", "Código Reenviado");
            });
        } else {
            showMessage("No hay un usuario para reenviar el código. Por favor, regístrate primero.", "Error");
        }
    });

    // --- Lógica de Cognito y Formularios ---

    // 1. Formulario de Registro (Signup)
    signupForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        savedEmail = email; // Guardar email para uso posterior

        // Generar un username único que NO sea el email
        // Puedes usar un UUID o un timestamp, por ejemplo.
        // Aquí usaremos un prefijo + un timestamp para simplicidad.
        const usernameForCognito = 'user_' + Date.now(); // Example: user_1678888888888

        const attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: email
        });
        const attributeName = new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'name',
            Value: name
        });

        const attributeList = [attributeEmail, attributeName];

        userPool.signUp(usernameForCognito, password, attributeList, null, function (err, result) {
            if (err) {
                showMessage(err.message || JSON.stringify(err), "Error de Registro");
                return;
            }
            cognitoUser = result.user;
            savedUsername = result.user.getUsername(); // Guardar el username generado por Cognito
            showMessage("¡Registro exitoso! Revisa tu correo para el código de confirmación.", "Registro Exitoso");
            showForm(confirmForm, "Confirmar Cuenta"); // Mostrar formulario de confirmación
        });
    });

    // 2. Formulario de Login
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const loginUsernameOrEmail = document.getElementById("login-username").value; // Ahora puede ser username o email
        const loginPassword = document.getElementById("login-password").value;

        const authenticationData = {
            Username: loginUsernameOrEmail, // Cognito autenticará con el alias (email) si está configurado
            Password: loginPassword,
        };
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

        const userData = {
            Username: loginUsernameOrEmail, // Importante: usar el mismo valor para buscar el usuario
            Pool: userPool
        };
        const user = new AmazonCognitoIdentity.CognitoUser(userData);

        user.authenticateUser(authenticationDetails, {
            onSuccess: function (session) {
                const idToken = session.getIdToken().decodePayload();
                const idCognito = idToken.sub; // ID único del usuario en Cognito
                const userEmail = idToken.email; // Email del usuario (si está en el ID Token)
                const userName = idToken.name; // Nombre del usuario (si está en el ID Token)

                console.log("ID Cognito:", idCognito);
                console.log("Email del usuario:", userEmail);
                console.log("Nombre del usuario:", userName);

                // Puedes guardar estos datos en localStorage o sessionStorage si los necesitas globalmente
                localStorage.setItem("emailConfirmado", userEmail);
                localStorage.setItem("idCognito", idCognito);
                localStorage.setItem("userName", userName); // Guardar nombre si lo usas en el navbar

                showMessage("¡Inicio de sesión exitoso! Redirigiendo...", "Bienvenido");
                // Redirigir a la página principal de citas
                setTimeout(() => {
                    window.location.href = "reservar_citas.html";
                }, 1500); // Pequeño retraso para que el usuario vea el mensaje
            },
            onFailure: function (err) {
                showMessage(err.message || JSON.stringify(err), "Error de Inicio de Sesión");
            },
            newPasswordRequired: function (userAttributes, requiredAttributes) {
                // Si el usuario debe cambiar su contraseña
                // Puedes mostrar un formulario para cambiar la contraseña aquí
                showMessage("Debes cambiar tu contraseña para continuar.", "Cambio de Contraseña Requerido");
                // Guarda userAttributes y requiredAttributes si los necesitas para el formulario de cambio de contraseña
                cognitoUser = user; // Guarda el usuario de Cognito para la siguiente acción
                // Aquí podrías mostrar un nuevo formulario para la nueva contraseña.
            }
        });
    });


    // 3. Formulario de Confirmación
    confirmForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const code = document.getElementById("code").value;

        // Asegurarse de que cognitoUser esté disponible (del signup exitoso)
        // Opcional: Si el usuario cerró la página y volvió, necesitarías recuperar el cognitoUser
        // Aquí asumimos que 'savedUsername' se mantiene si el flujo es continuo.
        if (!savedUsername) {
            showMessage("No se encontró un usuario para confirmar. Por favor, regístrate de nuevo o inicia sesión si ya tienes cuenta.", "Error de Confirmación");
            return;
        }

        const userData = {
            Username: savedUsername, // Usar el username que se usó en el signup
            Pool: userPool
        };
        const user = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser = user; // Asegurarse de que cognitoUser esté actualizado para reenvío de código, etc.

        cognitoUser.confirmRegistration(code, true, function (err, result) {
            if (err) {
                showMessage(err.message || JSON.stringify(err), "Error de Confirmación");
                return;
            }
            showMessage("¡Usuario confirmado! Iniciando sesión automáticamente...", "Confirmación Exitosa");

            // Login automático después de la confirmación
            // Es crucial usar el mismo username que se generó y la contraseña que se ingresó inicialmente
            const passwordFromSignup = document.getElementById("password").value; // Asume que la contraseña está aún en el campo de signup
            if (!passwordFromSignup) {
                 showMessage("Error: Contraseña no disponible para el login automático. Por favor, inicia sesión manualmente.", "Error de Login Automático");
                 showForm(loginForm, "Iniciar Sesión");
                 return;
            }

            const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
                Username: savedUsername, // Usar el username generado
                Password: passwordFromSignup
            });

            cognitoUser.authenticateUser(authDetails, {
                onSuccess: function (session) {
                    const idToken = session.getIdToken().decodePayload();
                    const idCognito = idToken.sub;
                    const userEmail = idToken.email; // Email del usuario
                    const userName = idToken.name; // Nombre del usuario

                    localStorage.setItem("emailConfirmado", userEmail);
                    localStorage.setItem("idCognito", idCognito);
                    localStorage.setItem("userName", userName);

                    // Mostrar formulario para completar los datos
                    showMessage("Credenciales confirmadas. Por favor, completa tus datos.", "Datos Adicionales");
                    showForm(completeForm, "Completar Datos del Paciente");
                },
                onFailure: function (err) {
                    showMessage("Error al iniciar sesión automáticamente: " + (err.message || JSON.stringify(err)), "Error de Login Automático");
                }
            });
        });
    });

    // 4. Formulario para Completar Datos del Paciente
    completeForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const nombre = document.getElementById("nombre").value;
        const apellido = document.getElementById("apellido").value;
        const documento = document.getElementById("documento").value;
        const fechaNacimiento = document.getElementById("fecha_nacimiento").value;
        const telefono = document.getElementById("telefono").value;
        const direccion = document.getElementById("direccion").value;
        const correo = localStorage.getItem("emailConfirmado");
        const idCognito = localStorage.getItem("idCognito");

        const datos = {
            nombre, apellido, documento, fechaNacimiento, telefono, direccion, correo, id_cognito: idCognito
        };

        try {
            const respuesta = await fetch("http://44.199.251.29:5000/api/guardar_paciente", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });


            const resultado = await respuesta.json(); // Leer la respuesta JSON

            if (respuesta.ok) {
                showMessage("¡Tus datos han sido guardados exitosamente!", "Datos Guardados");
                showForm(bienvenidaDiv, "Bienvenido al Portal");
            } else {
                console.error("Error al guardar los datos:", resultado);
                // Manejar errores de la API de guardar_paciente
                showMessage(`Error al guardar los datos: ${resultado.message || JSON.stringify(resultado)}`, "Error al Guardar");
            }
        } catch (error) {
            console.error("Error en la comunicación con el servidor:", error);
            showMessage(`Error en la comunicación con el servidor: ${error.message}`, "Error de Red");
        }
    });

    // --- Manejo del estado inicial ---
    // Se asume que al cargar la página, se muestra el formulario de registro por defecto
    showForm(signupForm, "Registro de Paciente");
});