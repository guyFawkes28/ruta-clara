export const cleaningReportPage = () => ({

	render: () => {

		return `

<div class="view cleaning-report-view">

	<div class="page-container">

		<!-- Header -->
		<div class="header-banner">
			<div class="header-icon">R</div>

			<div class="header-content">
				<h1 class="header-title">Ruta Clara</h1>
				<p class="header-subtitle">Reporte de limpieza</p>
			</div>
		</div>


		<!-- Main Container -->
		<div class="container">

			<!-- Active Zone Info -->
			<div class="active-zone">

				<div class="active-zone-label">Zona Activa</div>

				<h3 class="active-zone-title">Sala 2</h3>

				<div class="zone-tags">
					<div class="zone-tag">📍 Belabs</div>
					<div class="zone-tag">🏪 Sala 2</div>
				</div>

			</div>


			<!-- Responsable -->
			<div class="form-section">

				<div class="form-section-header">
					<div class="form-section-icon">👤</div>
					<span class="form-section-title">Responsable</span>
				</div>

				<div class="form-group">

					<label>Nombre de quien limpia</label>

					<input 
						type="text"
						class="form-control"
						placeholder="Nombre de quien limpia..."
						value="Mariana"
					>

					<p style="font-size:12px;color:#9CA3AF;margin-top:6px;">
						Personal de aseo - Sala 2
					</p>

				</div>

			</div>


			<!-- Fecha y Hora -->
			<div class="form-section">

				<div class="form-section-header">
					<div class="form-section-icon">📅</div>
					<span class="form-section-title">Fecha y hora</span>
				</div>

				<div class="form-row">

					<div class="form-group">
						<label>Fecha <span class="input-badge">Auto</span></label>

						<input
							id="clean-date"
							type="text"
							class="form-control"
							readonly
						>
					</div>

					<div class="form-group">
						<label>Hora <span class="input-badge">En vivo</span></label>

						<input
							id="clean-time"
							type="text"
							class="form-control"
							readonly
						>
					</div>

				</div>

			</div>


			<!-- Descripción -->
			<div class="form-section">

				<div class="form-section-header">
					<div class="form-section-icon">📝</div>
					<span class="form-section-title">Descripción</span>
				</div>

				<div class="form-group">

					<textarea
						class="form-control"
						style="min-height:100px;resize:vertical;"
						placeholder="Ej. Se barrió y trapeo. Mesas desinfectadas..."
					>Todo limpio</textarea>

				</div>

			</div>


			<!-- Botones -->
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

	loadRender: () => {

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


		const cancelBtn = document.getElementById("cancel-clean")

		if (cancelBtn) {
			cancelBtn.addEventListener("click", () => {
				console.log("Cancelar limpieza")
			})
		}


		const submitBtn = document.getElementById("submit-clean")

		if (submitBtn) {
			submitBtn.addEventListener("click", () => {
				console.log("Registrar limpieza")
			})
		}

	}

})