export const cleaningReportPage = () => ({

	render: () => {

		return `

<div class="view cleaning-report-view">

	<div class="page-container">

		<div class="header-banner">
			<div class="header-icon">R</div>

			<div class="header-content">
				<h1 class="header-title">Ruta Clara</h1>
				<p class="header-subtitle">Reporte de limpieza</p>
			</div>
		</div>

		<div class="container">

			<div class="active-zone">

				<div class="active-zone-label">Zona Activa</div>

				<h3 class="active-zone-title" id="zone-name">Cargando...</h3>

				<div class="zone-tags">
					<div class="zone-tag">📍 Belabs</div>
					<div class="zone-tag" id="zone-tag-name">...</div>
				</div>

			</div>

			<div class="form-section">

				<div class="form-section-header">
					<div class="form-section-icon">👤</div>
					<span class="form-section-title">Responsable</span>
				</div>

				<div class="form-group">

					<label>Nombre de quien limpia</label>

					<input 
						id="clean-user"
						type="text"
						class="form-control"
						readonly
					>

					<p style="font-size:12px;color:#9CA3AF;margin-top:6px;">
						Personal de aseo
					</p>

				</div>

			</div>


			<div class="form-section">

				<div class="form-section-header">
					<div class="form-section-icon">📅</div>
					<span class="form-section-title">Fecha y hora</span>
				</div>

				<div class="form-row">

					<div class="form-group">
						<label>Fecha</label>

						<input
							id="clean-date"
							type="text"
							class="form-control"
							readonly
						>
					</div>

					<div class="form-group">
						<label>Hora</label>

						<input
							id="clean-time"
							type="text"
							class="form-control"
							readonly
						>
					</div>

				</div>

			</div>


			<div class="form-section">

				<div class="form-section-header">
					<div class="form-section-icon">📝</div>
					<span class="form-section-title">Descripción</span>
				</div>

				<div class="form-group">

					<textarea
						id="clean-description"
						class="form-control"
						style="min-height:100px;resize:vertical;"
						placeholder="Ej. Se barrió y trapeo. Mesas desinfectadas..."
					></textarea>

				</div>

			</div>


			<div class="button-group">

				<button class="btn btn-secondary" id="cancel-clean">
					Cancelar
				</button>

				<button class="btn btn-primary" id="submit-clean">
					Registrar limpieza ✓
				</button>

			</div>

		</div>

	</div>

</div>

`
	},

	loadRender: async () => {

		const dateInput = document.getElementById("clean-date")
		const timeInput = document.getElementById("clean-time")

		const updateDateTime = () => {

			const now = new Date()
			const date = now.toLocaleDateString("es-CO")
			const time = now.toLocaleTimeString("es-CO")

			if (dateInput) dateInput.value = date
			if (timeInput) timeInput.value = time

		}

		updateDateTime()
		setInterval(updateDateTime, 1000)

		let zone_id = null
		let user_name = null

		try {

			// Leer usuario desde localStorage (guardado por persistence.saveSession en el login)
			const session = JSON.parse(localStorage.getItem("user-data"));

			if (!session) {
				throw new Error("No hay sesión activa. Inicia sesión primero.");
			}

			// El name viene directo del localStorage, no del backend
			user_name = session.name;
			document.getElementById("clean-user").value = session.name;

			// Lee el codigo_qr desde la URL: /cleaning-report?qr=SALA3-P1
			const urlParams = new URLSearchParams(window.location.search);
			const codigo_qr = urlParams.get("qr") || "SALA3-P1";

			const res = await fetch(`http://localhost:4000/api/cleanings/info?codigo_qr=${codigo_qr}`);

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || `Error HTTP ${res.status}`);
			}

			const data = await res.json();

			zone_id = data.zone_id;
			document.getElementById("zone-name").textContent     = data.zone_name;
			document.getElementById("zone-tag-name").textContent = data.zone_name;

		} catch (error) {

			console.error("Error cargando datos de limpieza:", error.message);
			document.getElementById("zone-name").textContent = "Error al cargar zona";
			document.getElementById("clean-user").value = "Error al cargar usuario";

		}


		const cancelBtn = document.getElementById("cancel-clean")

		if (cancelBtn) {
			cancelBtn.addEventListener("click", () => {
				console.log("Cancelar limpieza")
			})
		}


		const submitBtn = document.getElementById("submit-clean")

		if (submitBtn) {

			submitBtn.addEventListener("click", async () => {

				const descriptions = document
					.getElementById("clean-description")
					.value

				if (!descriptions) {
					alert("Debe escribir una descripción")
					return
				}

				// Validar que los datos de zona/usuario se cargaron antes de enviar
				if (!zone_id || !user_name) {
					alert("No se pudieron cargar los datos de zona o usuario. Recarga la página.")
					return
				}

				try {

					const res = await fetch("http://localhost:4000/api/cleaning", {

						method: "POST",

						headers: {
							"Content-Type": "application/json"
						},

						body: JSON.stringify({
							zone_id,
							user_name,
							descriptions
						})

					})

					if (!res.ok) {
						const err = await res.json();
						throw new Error(err.error || `Error HTTP ${res.status}`);
					}

					const result = await res.json()

					alert("Limpieza registrada correctamente")

					document.getElementById("clean-description").value = ""

					console.log(result)

				} catch (error) {

					console.error("Error registrando limpieza:", error.message)
					alert("Error al registrar limpieza: " + error.message)

				}

			})

		}

	}

})