// CLASES

class Almacenamiento {
  static set(clave, valor) {
    localStorage.setItem(clave, JSON.stringify(valor));
  }

  static get(clave, valorPorDefecto = null) {
    const item = localStorage.getItem(clave);
    return item !== null ? JSON.parse(item) : valorPorDefecto;
  }

  static remove(clave) {
    localStorage.removeItem(clave);
  }

  static clear() {
    localStorage.clear();
  }
}

class Ingreso {
  static guardarIngreso(monto, categoria, fecha, frecuencia, descripcion) {
    const ingresos = Almacenamiento.get("ingresos", []);

    const nuevoIngreso = {
      id: crypto.randomUUID(),
      monto: Number(monto),
      categoria,
      fecha,
      frecuencia,
      descripcion,
    };

    ingresos.push(nuevoIngreso);
    Almacenamiento.set("ingresos", ingresos);
  }

  static calcularMontoTotal() {
    const ingresos = Almacenamiento.get("ingresos", []);
    let montoTotal = 0;
    ingresos.forEach((unIngreso) => {
      montoTotal += unIngreso.monto;
    });
    return montoTotal;
  }

  static darTodosLosIngresos() {
    const ingresos = Almacenamiento.get("ingresos", []);
    // CORRECCIÓN: Se cambió "ingresos" a "ingreso" (en singular)
    const tipoIngresos = ingresos.map((item) => ({
      ...item,
      tipo: "ingreso",
    }));
    return tipoIngresos;
  }

  static eliminar(id) {
    let ingresos = Almacenamiento.get("ingresos", []);
    ingresos = ingresos.filter((item) => item.id !== id);
    Almacenamiento.set("ingresos", ingresos);
  }
}

class Gasto {
  static guardarGasto(monto, categoria, fecha, frecuencia, descripcion) {
    const gastos = Almacenamiento.get("gastos", []);

    const nuevoGasto = {
      id: crypto.randomUUID(),
      monto: Number(monto),
      categoria,
      fecha,
      frecuencia,
      descripcion,
    };

    gastos.push(nuevoGasto);
    Almacenamiento.set("gastos", gastos);
  }

  static calcularMontoTotal() {
    const gastos = Almacenamiento.get("gastos", []);
    let gastoTotal = 0;
    gastos.forEach((unGasto) => {
      gastoTotal += unGasto.monto;
    });
    return gastoTotal;
  }

  static darTodosLosGastos() {
    const gastos = Almacenamiento.get("gastos", []);
    // CORRECCIÓN: Se cambió "gastos" a "gasto" (en singular)
    const tipoGastos = gastos.map((item) => ({ ...item, tipo: "gasto" }));
    return tipoGastos;
  }

  static eliminar(id) {
    let gastos = Almacenamiento.get("gastos", []);
    gastos = gastos.filter((item) => item.id !== id);
    Almacenamiento.set("gastos", gastos);
  }
}

class Meta {
  static guardarMeta(monto) {
    Almacenamiento.set("meta", Number(monto));
  }

  static obtenerMeta() {
    return Almacenamiento.get("meta", 0);
  }
}

// EVENTOS
function inicializarEventosHistorial() {
  const selectFiltro = document.getElementById("filtro-tipo");
  const cuerpoTabla = document.getElementById("tabla-historial-body");

  if (selectFiltro) {
    // CORRECCIÓN: Evento "change" vinculado de forma reactiva al select
    selectFiltro.addEventListener("change", () => {
      iniciarModuloHistoria();
    });
  }

  if (cuerpoTabla) {
    // Delegación de eventos para los botones de eliminar dentro de la tabla
    cuerpoTabla.addEventListener("click", (e) => {
      const botonEliminar = e.target.closest("button[data-id]");
      if (!botonEliminar) return;

      const id = botonEliminar.getAttribute("data-id");
      const tipo = botonEliminar.getAttribute("data-tipo");

      if (tipo === "ingreso") {
        Ingreso.eliminar(id);
      } else if (tipo === "gasto") {
        Gasto.eliminar(id);
      }

      // Refrescamos la tabla tras eliminar
      iniciarModuloHistoria();
    });
  }
}

// FUNCIONES AUXILIARES

function establecerFechaActual() {
  const objFecha = new Date();
  return objFecha.toLocaleDateString("es-AR");
}

function filtarHistoria(criterio) {
  const ingresos = Ingreso.darTodosLosIngresos();
  const gastos = Gasto.darTodosLosGastos();

  let transacciones = [...ingresos, ...gastos];
  transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  let resultado = transacciones;

  if (criterio === "ingreso") {
    resultado = transacciones.filter((t) => t.tipo === "ingreso");
  } else if (criterio === "gasto") {
    resultado = transacciones.filter((t) => t.tipo === "gasto");
  }

  return resultado;
}

function obtenerPorcentaje(meta, montoActual) {
  if (meta <= 0) return 0;
  return (montoActual / meta) * 100;
}

// MÓDULOS

function iniciarModuloDashboard() {
  const fecha = document.getElementById("fecha");
  if (fecha) fecha.textContent = establecerFechaActual();

  const totalIngresos = document.getElementById("total-ingresos");
  const totalGastos = document.getElementById("total-gastos");
  const balanceTotal = document.getElementById("balance-total");

  const montoTotalIngresos = Ingreso.calcularMontoTotal();
  if (totalIngresos) totalIngresos.textContent = montoTotalIngresos;

  const montoTotalGastos = Gasto.calcularMontoTotal();
  if (totalGastos) totalGastos.textContent = montoTotalGastos;

  const balance = montoTotalIngresos - montoTotalGastos;
  if (balanceTotal) balanceTotal.textContent = balance;

  // --- LÓGICA DE LA META ---
  const metaActual = Meta.obtenerMeta();
  const porcentaje =
    metaActual > 0 ? (montoTotalIngresos / metaActual) * 100 : 0;

  const spanPorcentaje = document.getElementById("meta-porcentaje");
  const spanActual = document.getElementById("meta-actual");
  const spanObjetivo = document.getElementById("meta-objetivo");
  const barraMeta = document.getElementById("meta-barra");

  // Mostrar valores iniciales al cargar el dashboard
  if (spanPorcentaje) spanPorcentaje.textContent = `${porcentaje.toFixed(0)}%`;
  if (spanActual) spanActual.textContent = montoTotalIngresos.toFixed(2);
  if (spanObjetivo) spanObjetivo.textContent = metaActual.toFixed(2);
  if (barraMeta) barraMeta.value = porcentaje;

  // Evento del formulario de la meta
  const formularioMeta = document.getElementById("form-meta");
  if (!formularioMeta) return;

  formularioMeta.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const montoMeta = document.getElementById("input-nueva-meta").value;

    Meta.guardarMeta(montoMeta);
    const nuevaMeta = Meta.obtenerMeta();
    const nuevoPorcentaje =
      nuevaMeta > 0 ? (montoTotalIngresos / nuevaMeta) * 100 : 0;

    if (spanPorcentaje)
      spanPorcentaje.textContent = `${nuevoPorcentaje.toFixed(0)}%`;
    if (spanActual) spanActual.textContent = montoTotalIngresos.toFixed(2);
    if (spanObjetivo) spanObjetivo.textContent = nuevaMeta.toFixed(2);
    if (barraMeta) barraMeta.value = nuevoPorcentaje;

    alert("¡Meta guardada correctamente!");
    formularioMeta.reset();
  });
}

function iniciarModuloIngresos() {
  const formulario = document.getElementById("form-ingreso");
  if (!formulario) return;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const monto = document.getElementById("monto").value;
    const categoria = document.getElementById("categoria").value;
    const fecha = document.getElementById("fecha").value;
    const frecuencia = document.getElementById("frecuencia").value;
    const descripcion = document.getElementById("descripcion").value;

    Ingreso.guardarIngreso(monto, categoria, fecha, frecuencia, descripcion);
    alert("¡Ingreso guardado correctamente!");
    formulario.reset();
  });
}

function iniciarModuloGastos() {
  const formulario = document.getElementById("form-gasto");
  if (!formulario) return;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const monto = document.getElementById("monto").value;
    const categoria = document.getElementById("categoria").value;
    const metodoPago = document.getElementById("metodo-pago").value;
    const fecha = document.getElementById("fecha").value;
    const descripcion = document.getElementById("descripcion").value;

    Gasto.guardarGasto(monto, categoria, fecha, metodoPago, descripcion);
    alert("¡Gasto guardado correctamente!");
    formulario.reset();
  });
}

function iniciarModuloDashboard() {
  // 1. Mostrar fecha actual
  const fechaEl = document.getElementById("fecha");
  if (fechaEl) fechaEl.textContent = establecerFechaActual();

  // 2. Obtener referencias del DOM (elementos <p>)
  const totalIngresosEl = document.getElementById("total-ingresos");
  const totalGastosEl = document.getElementById("total-gastos");
  const balanceTotalEl = document.getElementById("balance-total");

  // 3. Calcular montos desde la lógica de clases
  const montoIngresos = Ingreso.calcularMontoTotal();
  const montoGastos = Gasto.calcularMontoTotal();
  const balance = montoIngresos - montoGastos;

  // 4. Renderizar montos en las tarjetas KPI
  if (totalIngresosEl) totalIngresosEl.textContent = montoIngresos.toFixed(2);
  if (totalGastosEl) totalGastosEl.textContent = montoGastos.toFixed(2);
  if (balanceTotalEl) {
    balanceTotalEl.textContent = balance.toFixed(2);
    // Cambiar dinámicamente la clase según si el balance es positivo o negativo
    balanceTotalEl.className = `monto ${balance >= 0 ? "positivo" : "negativo"}`;
  }

  // 5. Renderizar progreso de la Meta de Ahorro
  const metaObjetivo = Meta.obtenerMeta();
  // El ahorro real equivale al balance (Ingresos - Gastos)
  const ahorroActual = Math.max(0, balance);
  const porcentaje = obtenerPorcentaje(metaObjetivo, ahorroActual);

  const spanPorcentaje = document.getElementById("meta-porcentaje");
  const spanActual = document.getElementById("meta-actual");
  const spanObjetivo = document.getElementById("meta-objetivo");
  const barraMeta = document.getElementById("meta-barra");

  if (spanPorcentaje) spanPorcentaje.textContent = `${porcentaje.toFixed(0)}%`;
  if (spanActual) spanActual.textContent = ahorroActual.toFixed(2);
  if (spanObjetivo) spanObjetivo.textContent = metaObjetivo.toFixed(2);
  if (barraMeta) barraMeta.value = Math.min(porcentaje, 100);

  // 6. Asignar evento al formulario de nueva meta (#form-meta)
  const formularioMeta = document.getElementById("form-meta");
  if (!formularioMeta) return;

  formularioMeta.onsubmit = function (evento) {
    evento.preventDefault();
    const inputNuevaMeta = document.getElementById("input-nueva-meta");
    const nuevoMontoMeta = Number(inputNuevaMeta.value);

    if (isNaN(nuevoMontoMeta) || nuevoMontoMeta <= 0) return;

    // Guardar y recalcular
    Meta.guardarMeta(nuevoMontoMeta);
    const nuevaMeta = Meta.obtenerMeta();
    const nuevoPorcentaje = obtenerPorcentaje(nuevaMeta, ahorroActual);

    // Actualizar vista
    if (spanPorcentaje)
      spanPorcentaje.textContent = `${nuevoPorcentaje.toFixed(0)}%`;
    if (spanActual) spanActual.textContent = ahorroActual.toFixed(2);
    if (spanObjetivo) spanObjetivo.textContent = nuevaMeta.toFixed(2);
    if (barraMeta) barraMeta.value = Math.min(nuevoPorcentaje, 100);

    alert("¡Meta guardada correctamente!");
    formularioMeta.reset();
  };
  // Agrega este bloque dentro de iniciarModuloDashboard():

  const btnLimpiarMeta = document.getElementById("btn-limpiar-meta");

  if (btnLimpiarMeta) {
    btnLimpiarMeta.addEventListener("click", function () {
      // 1. Borrar la clave de localStorage
      Almacenamiento.remove("meta"); // Usa el método static de tu clase Almacenamiento

      // 2. Recalcular los valores visuales
      const metaObjetivo = Meta.obtenerMeta(); // Retornará 0 por defecto
      const montoIngresos = Ingreso.calcularMontoTotal();
      const montoGastos = Gasto.calcularMontoTotal();
      const ahorroActual = Math.max(0, montoIngresos - montoGastos);
      const porcentaje = obtenerPorcentaje(metaObjetivo, ahorroActual);

      // 3. Actualizar la interfaz
      if (spanPorcentaje)
        spanPorcentaje.textContent = `${porcentaje.toFixed(0)}%`;
      if (spanActual) spanActual.textContent = ahorroActual.toFixed(2);
      if (spanObjetivo) spanObjetivo.textContent = metaObjetivo.toFixed(2);
      if (barraMeta) barraMeta.value = Math.min(porcentaje, 100);

      alert("¡La meta ha sido restablecida!");
    });
  }
}

function iniciarModuloHistoria() {
  const selectFiltro = document.getElementById("filtro-tipo");
  const filtro = selectFiltro ? selectFiltro.value : "todos";
  const cuerpoTabla = document.getElementById("tabla-historial-body");

  if (!cuerpoTabla) return;
  cuerpoTabla.innerHTML = "";

  const transacciones = filtarHistoria(filtro);

  if (transacciones.length === 0) {
    // CORRECCIÓN: Colspan ajustado a 6 para alinearse con los <th> del HTML
    cuerpoTabla.innerHTML = `<tr><td colspan="6" style="text-align: center;">No hay movimientos registrados.</td></tr>`;
    return;
  }

  transacciones.forEach((item) => {
    const fila = document.createElement("tr");
    const esIngreso = item.tipo === "ingreso";
    const signo = esIngreso ? "+" : "-";
    const claseBadge = esIngreso ? "ingreso" : "gasto";
    const claseMonto = esIngreso ? "positivo" : "negativo";

    // CORRECCIÓN: Estructura de 6 columnas idéntica al orden de los <th> del HTML
    fila.innerHTML = `
      <td>${item.fecha}</td>
      <td><span class="badge ${claseBadge}">${item.tipo.toUpperCase()}</span></td>
      <td>${item.categoria}</td>
      <td>${item.descripcion || "-"}</td>
      <td class="${claseMonto}">${signo}$${Number(item.monto).toFixed(2)}</td>
      <td>
        <button type="button" class="btn btn-secundario" data-id="${item.id}" data-tipo="${item.tipo}" title="Eliminar">🗑️</button>
      </td>
    `;

    cuerpoTabla.appendChild(fila);
  });
}

function iniciarApp() {
  const paginaActiva = document.querySelector("a.activo");

  if (!paginaActiva) {
    console.log("La página no se encuentra activa");
    return;
  }

  const pagina = paginaActiva.getAttribute("href");

  switch (pagina) {
    case "dashboard.html":
      iniciarModuloDashboard();
      break;
    case "ingresos.html":
      iniciarModuloIngresos();
      break;
    case "gastos.html":
      iniciarModuloGastos();
      break;
    case "simulador.html":
      iniciarModuloSimulador();
      break;
    case "historial.html":
      // CORRECCIÓN: Inicializamos tanto la tabla como los eventos de filtrado al cargar la vista de historial
      iniciarModuloHistoria();
      inicializarEventosHistorial();
      break;
    default:
      console.log("Página no encontrada");
  }
}

document.addEventListener("DOMContentLoaded", iniciarApp);
