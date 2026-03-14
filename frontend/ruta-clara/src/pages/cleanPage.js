import '../assets/clean.css'
import maintenanceService from '../api/maintenance.service.js'
import { toast } from '../util/ux.js'
import { headerView } from '../components/Header.js'
import { persistence } from '../util/persistence.js'

export const cleaningReportPage = (zoneId) => {
	const header = headerView({ zona: 'Cargando...' })
	return {

	render: () => {

		return `

<div class="view cleaning-report-view">

	<div class="page-container">

			${header.render()}


		<!-- Main Container -->
		<div class="container">

			<!-- Active Zone Info -->
			<div class="active-zone">

				<div class="active-zone-label">Zona Activa</div>

				<h3 id="clean-zone-title" class="active-zone-title">Cargando...</h3>

				<div id="clean-zone-tags" class="zone-tags">
					<div class="zone-tag">Cargando...</div>
				</div>

			</div>


			<!-- Responsable: autocompletado desde sesión -->
			<div class="form-section">
				<div class="form-section-header">
					<div class="form-section-icon">👤</div>
					<span class="form-section-title">Responsable</span>
				</div>
				<div class="form-group">
					<input
						id="clean-responsable"
						type="text"
						class="form-control"
						placeholder="Nombre de quien limpia..."
						readonly
					>
				</div>
			</div>

			<div class="section-divider section-divider--strong"></div>



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

			<div class="section-divider section-divider--strong"></div>

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

			// Inicializar header reutilizable
			try { header.loadRender() } catch (e) { console.warn('[cleanPage] header load error', e) }

			// Si se pasó zoneId en la ruta (#/clean/{id}), traer info de la zona
			(async function cargarZona() {
				try {
					if (!zoneId) return
					const resp = await maintenanceService.getZoneByQR(encodeURIComponent(zoneId))
					const info = resp.info_zona || {}
					const titleEl = document.getElementById('clean-zone-title')
					const tagsEl = document.getElementById('clean-zone-tags')
					if (titleEl) titleEl.textContent = `${info.nombre || 'Zona'} — Piso ${info.piso ?? ''}`
					if (tagsEl) tagsEl.innerHTML = `<div class="zone-tag">📍 ${info.nombre || ''}</div><div class="zone-tag">🏪 ${info.id || ''}</div>`
					try { header.setZona && header.setZona(info.nombre || '') } catch (e) { /* ignore */ }
				} catch (err) {
					console.warn('No se pudo cargar info de zona para limpieza:', err)
					toast('No se pudo cargar la zona activa', 'error')
				}
			})()


		const dateInput = document.getElementById("clean-date")
		const timeInput = document.getElementById("clean-time")

		// Autocompletar responsable desde sesión
		const user = persistence.getUser() || {}
		const responsableInput = document.getElementById('clean-responsable')
		if (responsableInput) {
			responsableInput.value = user.name || user.fullName || user.username || user.usuario || user.email || 'Usuario'
		}

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
					// Por ahora no guardamos localmente ni redirigimos: esperar endpoint backend
					toast('Registro en espera del backend. Se enviará cuando exista el endpoint.', 'info')
				})
		}

	}

}
}