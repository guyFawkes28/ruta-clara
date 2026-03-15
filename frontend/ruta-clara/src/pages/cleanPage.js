import '../assets/clean.css'
import maintenance_service from '../api/maintenance.service.js'
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
						id="clean-description"
						class="form-control"
						style="min-height:100px;resize:vertical;"
						placeholder="Ej. Se barrió y trapeo. Mesas desinfectadas..."
					></textarea>

				</div>

			</div>


			<!-- Botones -->
			<div class="button-group">

				<button class="btn btn-secondary" id="cancel-clean">
					Cancelar
				</button>

				<button class="btn btn-primary" id="submit-clean">
					Registrar limpieza 
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

		// Datos de zona cargados desde el backend
		let zone_id = null

		// Si se pasó zoneId en la ruta (#/clean/{id}), traer info de la zona
		;(async function cargarZona() {
			try {
				if (!zoneId) return
				const resp = await maintenance_service.get_zone_by_qr(encodeURIComponent(zoneId))
				const info = resp.info_zona || {}

				// Guardar zone_id para usarlo al registrar la limpieza
				zone_id = info.id_zona ?? info.id ?? zoneId

				const titleEl = document.getElementById('clean-zone-title')
				const tagsEl  = document.getElementById('clean-zone-tags')
				if (titleEl) titleEl.textContent = `${info.nombre || 'Zona'} — Piso ${info.piso ?? ''}`
				if (tagsEl)  tagsEl.innerHTML   = `<div class="zone-tag">📍 ${info.nombre || ''}</div><div class="zone-tag">🏪 ${info.id || ''}</div>`
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
		const user_name = user.name || user.fullName || user.username || user.usuario || user.email || 'Usuario'
		const responsableInput = document.getElementById('clean-responsable')
		if (responsableInput) {
			responsableInput.value = user_name
		}

		const updateDateTime = () => {
			const now  = new Date()
			const date = now.toLocaleDateString("es-CO")
			const time = now.toLocaleTimeString("es-CO")
			if (dateInput) dateInput.value = date
			if (timeInput) timeInput.value = time
		}


		// Capturar hora de inicio cuando se carga la página
		const hora_inicio = new Date().toLocaleTimeString("es-CO", { timeZone: "America/Bogota" })
		updateDateTime()
		setInterval(updateDateTime, 1000)

		const cancelBtn = document.getElementById("cancel-clean")
		if (cancelBtn) {
			cancelBtn.addEventListener("click", () => {
				window.history.back()
			})
		}

		const submitBtn = document.getElementById("submit-clean")
		if (submitBtn) {
			submitBtn.addEventListener("click", async () => {

				const descriptions = document.getElementById("clean-description")?.value?.trim()

				if (!descriptions) {
					toast("Debe escribir una descripción", "error")
					return
				}

				if (!zone_id) {
					toast("No se pudo obtener la zona. Intenta de nuevo.", "error")
					return
				}

				try {
					submitBtn.disabled = true
					submitBtn.textContent = "Registrando..."

					// Capturar hora de fin al momento de enviar
					const hora_fin = new Date().toLocaleTimeString("es-CO", { timeZone: "America/Bogota" })
					console.log("[cleanPage] Hora fin:", hora_fin)

					const res = await fetch("http://localhost:4000/api/cleaning", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ zone_id, user_name, descriptions, hora_inicio, hora_fin })
					})

					if (!res.ok) {
						const err = await res.json()
						throw new Error(err.error || `Error HTTP ${res.status}`)
					}

				// Leer el registro completo creado del backend
				const created = await res.json()
				console.log("[cleanPage] Registro creado:", created)
				toast(" Limpieza registrada correctamente", "success")
				document.getElementById("clean-description").value = ""
				
				// Notificar al Dashboard en tiempo real
				window.dispatchEvent(new CustomEvent('cleaning:created', { 
					detail: {
						...created,
						user_name: user_name,
						zone_id: zone_id
					}
				}))
				console.log("[cleanPage] Evento 'cleaning:created' emitido")

			} catch (error) {
				console.error("Error registrando limpieza:", error.message)
				toast("Error al registrar: " + error.message, "error")
			} finally {
				submitBtn.disabled = false
				submitBtn.textContent = "Registrar limpieza "
			}

			})
		}

	}

}
}