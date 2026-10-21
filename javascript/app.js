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

function iniciarModuloSimulador() {
  const formulario = document.getElementById("form-simulador");
  if (!formulario) return;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const monto = document.getElementById("monto").value;
    const plazo = document.getElementById("plazo").value;
    const tasaInteres = document.getElementById("tasa-interes").value;

    const resultado = (monto * (1 + (tasaInteres / 100) * plazo)).toFixed(2);
    const resultadoElemento = document.getElementById("resultado");
    if (resultadoElemento) {
      resultadoElemento.textContent = `El monto final después de ${plazo} años será: $${resultado}`;
    }
  });
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
