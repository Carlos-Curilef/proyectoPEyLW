// ==========================================
// 1. CAPA DE PERSISTENCIA
// ==========================================

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

// ==========================================
// 2. CAPA DE NEGOCIO Y MODELOS
// ==========================================

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
    return ingresos.reduce((total, unIngreso) => total + unIngreso.monto, 0);
  }

  static darTodosLosIngresos() {
    const ingresos = Almacenamiento.get("ingresos", []);
    return ingresos.map((item) => ({ ...item, tipo: "ingreso" }));
  }

  static eliminar(id) {
    let ingresos = Almacenamiento.get("ingresos", []);
    ingresos = ingresos.filter((item) => item.id !== id);
    Almacenamiento.set("ingresos", ingresos);
  }
}

class Gasto {
  static guardarGasto(monto, categoria, fecha, metodoPago, descripcion) {
    const gastos = Almacenamiento.get("gastos", []);
    const nuevoGasto = {
      id: crypto.randomUUID(),
      monto: Number(monto),
      categoria,
      fecha,
      metodoPago,
      descripcion,
    };
    gastos.push(nuevoGasto);
    Almacenamiento.set("gastos", gastos);
  }

  static calcularMontoTotal() {
    const gastos = Almacenamiento.get("gastos", []);
    return gastos.reduce((total, unGasto) => total + unGasto.monto, 0);
  }

  static darTodosLosGastos() {
    const gastos = Almacenamiento.get("gastos", []);
    return gastos.map((item) => ({ ...item, tipo: "gasto" }));
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

class DashboardServicio {
  static obtenerDatosDashboard() {
    const montoIngresos = Ingreso.calcularMontoTotal();
    const montoGastos = Gasto.calcularMontoTotal();
    const balance = montoIngresos - montoGastos;
    const metaObjetivo = Meta.obtenerMeta();
    const ahorroActual = Math.max(0, balance);
    const porcentaje =
      metaObjetivo > 0 ? (ahorroActual / metaObjetivo) * 100 : 0;

    return {
      montoIngresos,
      montoGastos,
      balance,
      metaObjetivo,
      ahorroActual,
      porcentaje,
    };
  }
}

class ReporteServicio {
  static obtenerResumenPeriodo(periodo) {
    const transacciones = filtrarDistribucion(periodo);
    const gastos = transacciones.filter((t) => t.tipo === "gasto");
    const ingresos = transacciones.filter((t) => t.tipo === "ingreso");

    const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
    const totalIngresos = ingresos.reduce((acc, i) => acc + i.monto, 0);

    let dias = 30;
    if (periodo === "este-mes") dias = new Date().getDate();
    else if (periodo === "anio-actual") dias = 365;

    const promedioDiario = dias > 0 ? totalGastos / dias : 0;

    let tasaAhorro = 0;
    if (totalIngresos > 0) {
      tasaAhorro = Math.max(
        0,
        ((totalIngresos - totalGastos) / totalIngresos) * 100,
      );
    }

    const categoriasGastos = {};
    gastos.forEach((g) => {
      categoriasGastos[g.categoria] =
        (categoriasGastos[g.categoria] || 0) + g.monto;
    });

    let categoriaMayor = "Sin gastos";
    let maxMonto = 0;
    for (const [cat, monto] of Object.entries(categoriasGastos)) {
      if (monto > maxMonto) {
        maxMonto = monto;
        categoriaMayor = cat;
      }
    }

    return {
      promedioDiario,
      tasaAhorro,
      categoriaMayor,
      totalGastos,
      categoriasGastos,
    };
  }
}

// ==========================================
// 3. FUNCIONES AUXILIARES Y DE FILTRADO
// ==========================================

const validadores = {
  montoPositivo: (valor) => Number.isFinite(Number(valor)) && Number(valor) > 0,
  numeroNoNegativo: (valor) =>
    valor === "" || (Number.isFinite(Number(valor)) && Number(valor) >= 0),
  enteroNoNegativo: (valor) =>
    valor === "" || (Number.isInteger(Number(valor)) && Number(valor) >= 0),
  requerido: (valor) => String(valor ?? "").trim() !== "",
  fecha: (valor) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const fecha = new Date(`${valor}T00:00:00`);
    const [anio, mes, dia] = valor.split("-").map(Number);
    return (
      !Number.isNaN(fecha.getTime()) &&
      fecha.getFullYear() === anio &&
      fecha.getMonth() + 1 === mes &&
      fecha.getDate() === dia
    );
  },
  fechaAnterior: (valor) => {
    if (!validadores.fecha(valor)) return false;
    const fecha = new Date(`${valor}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha <= hoy;
  },
  unoDe: (opciones) => (valor) => opciones.includes(valor),
};

const reglasMeta = {
  monto: {
    validar: validadores.montoPositivo,
    mensaje: "La meta debe ser mayor que cero.",
  },
};

const reglasIngreso = {
  monto: [
    { validar: validadores.requerido, mensaje: "El monto es obligatorio." },
    {
      validar: validadores.montoPositivo,
      mensaje: "El monto debe ser mayor que cero.",
    },
  ],
  categoria: [
    { validar: validadores.requerido, mensaje: "La categoría es obligatoria." },
    {
      validar: validadores.unoDe([
        "salario",
        "freelance",
        "inversiones",
        "ventas",
        "otros",
      ]),
      mensaje: "Seleccioná una categoría válida.",
    },
  ],
  fecha: [
    { validar: validadores.requerido, mensaje: "La fecha es obligatoria." },
    { validar: validadores.fecha, mensaje: "Ingresá una fecha válida." },
    {
      validar: validadores.fechaAnterior,
      mensaje: "Ingresá una fecha anterior o actual.",
    },
  ],
  frecuencia: [
    {
      validar: validadores.requerido,
      mensaje: "La frecuencia es obligatoria.",
    },
    {
      validar: validadores.unoDe(["puntual", "mensual", "quincenal"]),
      mensaje: "Seleccioná una frecuencia válida.",
    },
  ],
};

const reglasGasto = {
  monto: {
    validar: validadores.montoPositivo,
    mensaje: "El monto debe ser mayor que cero.",
  },
  categoria: {
    validar: validadores.unoDe([
      "alimentacion",
      "vivienda",
      "transporte",
      "salud",
      "entretenimiento",
      "suscripciones",
      "educacion",
      "otros",
    ]),
    mensaje: "Seleccioná una categoría válida.",
  },
  fecha: {
    validar: validadores.fecha,
    mensaje: "Ingresá una fecha válida.",
    validar: validadores.fechaAnterior,
    mensaje: "Ingresá una fecha anterior o actual.",
  },
  metodoPago: {
    validar: validadores.unoDe([
      "debito",
      "credito",
      "efectivo",
      "transferencia",
    ]),
    mensaje: "Seleccioná un método de pago válido.",
  },
};

const reglasSimulador = {
  montoInicial: [
    {
      validar: validadores.requerido,
      mensaje: "El monto inicial es obligatorio.",
    },
    {
      validar: validadores.numeroNoNegativo,
      mensaje: "El monto inicial no puede ser negativo.",
    },
  ],
  aporteMensual: {
    validar: validadores.numeroNoNegativo,
    mensaje: "El aporte mensual no puede ser negativo.",
  },
  tasaAnual: [
    {
      validar: validadores.requerido,
      mensaje: "La tasa de interés es obligatoria.",
    },
    {
      validar: validadores.numeroNoNegativo,
      mensaje: "La tasa no puede ser negativa.",
    },
  ],
  plazoMeses: [
    { validar: validadores.requerido, mensaje: "El plazo es obligatorio." },
    {
      validar: validadores.enteroNoNegativo,
      mensaje: "El plazo debe ser un número entero igual o mayor que cero.",
    },
  ],
};

function validarDatos(datos, reglas) {
  const errores = {};

  for (const [campo, reglasCampo] of Object.entries(reglas)) {
    const listaReglas = Array.isArray(reglasCampo)
      ? reglasCampo
      : [reglasCampo];

    for (const regla of listaReglas) {
      if (typeof regla.validar === "function" && !regla.validar(datos[campo])) {
        errores[campo] = regla.mensaje;
        break;
      }
    }
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
  };
}

function notificarErroresValidacion(resultado, formulario) {
  formulario.querySelectorAll("[data-error-for]").forEach((mensaje) => {
    mensaje.textContent = resultado.errores[mensaje.dataset.errorFor] || "";
  });

  return resultado.valido;
}

function establecerFechaActual() {
  return new Date().toLocaleDateString("es-AR");
}

function filtrarHistoria(criterio) {
  const transacciones = [
    ...Ingreso.darTodosLosIngresos(),
    ...Gasto.darTodosLosGastos(),
  ];
  transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (criterio === "ingreso")
    return transacciones.filter((t) => t.tipo === "ingreso");
  if (criterio === "gasto")
    return transacciones.filter((t) => t.tipo === "gasto");
  return transacciones;
}

function filtrarDistribucion(periodo) {
  const transacciones = [
    ...Ingreso.darTodosLosIngresos(),
    ...Gasto.darTodosLosGastos(),
  ];
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth();

  return transacciones.filter((t) => {
    if (!t.fecha) return false;
    const fechaT = new Date(t.fecha);
    if (isNaN(fechaT)) return false;

    const anioT = fechaT.getFullYear();
    const mesT = fechaT.getMonth();

    if (periodo === "este-mes")
      return anioT === anioActual && mesT === mesActual;
    if (periodo === "mes-anterior") {
      let mesAnterior = mesActual - 1;
      let anioAnterior = anioActual;
      if (mesAnterior < 0) {
        mesAnterior = 11;
        anioAnterior--;
      }
      return anioT === anioAnterior && mesT === mesAnterior;
    }
    if (periodo === "ultimo-trimestre") {
      const diffMeses = (anioActual - anioT) * 12 + (mesActual - mesT);
      return diffMeses >= 0 && diffMeses < 3;
    }
    if (periodo === "anio-actual") return anioT === anioActual;
    return true;
  });
}

// ==========================================
// 4. CAPA DE VISTA / RENDERIZADO
// ==========================================

function renderizarDashboard(datos) {
  const fechaActual = document.getElementById("fecha");
  if (fechaActual) fechaActual.textContent = establecerFechaActual();

  const totalIngresosEl = document.getElementById("total-ingresos");
  const totalGastosEl = document.getElementById("total-gastos");
  const balanceTotalEl = document.getElementById("balance-total");

  if (totalIngresosEl)
    totalIngresosEl.textContent = datos.montoIngresos.toFixed(2);
  if (totalGastosEl) totalGastosEl.textContent = datos.montoGastos.toFixed(2);
  if (balanceTotalEl) {
    balanceTotalEl.textContent = datos.balance.toFixed(2);
    balanceTotalEl.className = `monto ${datos.balance >= 0 ? "positivo" : "negativo"}`;
  }

  const spanPorcentaje = document.getElementById("meta-porcentaje");
  const spanActual = document.getElementById("meta-actual");
  const spanObjetivo = document.getElementById("meta-objetivo");
  const barraMeta = document.getElementById("meta-barra");

  if (spanPorcentaje)
    spanPorcentaje.textContent = `${datos.porcentaje.toFixed(0)}%`;
  if (spanActual) spanActual.textContent = datos.ahorroActual.toFixed(2);
  if (spanObjetivo) spanObjetivo.textContent = datos.metaObjetivo.toFixed(2);
  if (barraMeta) barraMeta.value = Math.min(datos.porcentaje, 100);
}

function renderizarHistorial(transacciones) {
  const cuerpoTabla = document.getElementById("tabla-historial-body");
  if (!cuerpoTabla) return;

  cuerpoTabla.innerHTML = "";

  if (transacciones.length === 0) {
    cuerpoTabla.innerHTML = `<tr><td colspan="6" style="text-align: center;">No hay movimientos registrados.</td></tr>`;
    return;
  }

  transacciones.forEach((item) => {
    const fila = document.createElement("tr");
    const esIngreso = item.tipo === "ingreso";
    const signo = esIngreso ? "+" : "-";
    const claseBadge = esIngreso ? "ingreso" : "gasto";
    const claseMonto = esIngreso ? "positivo" : "negativo";

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

function renderizarReportes(resumen) {
  const elPromedioDiario = document.getElementById("reporte-promedio-diario");
  const elTasaAhorro = document.getElementById("reporte-tasa-ahorro");
  const elCategoriaTop = document.getElementById("reporte-categoria-top");
  const listaDesglose = document.getElementById("lista-desglose");

  if (elPromedioDiario)
    elPromedioDiario.textContent = `$${resumen.promedioDiario.toFixed(2)}`;
  if (elTasaAhorro)
    elTasaAhorro.textContent = `${resumen.tasaAhorro.toFixed(1)}%`;
  if (elCategoriaTop) elCategoriaTop.textContent = resumen.categoriaMayor;

  if (!listaDesglose) return;
  listaDesglose.innerHTML = "";

  const categoriasOrdenadas = Object.entries(resumen.categoriasGastos).sort(
    (a, b) => b[1] - a[1],
  );

  if (categoriasOrdenadas.length === 0) {
    listaDesglose.innerHTML = `<li style="text-align: center; padding: 1rem; color: #6b7280;">No hay datos de gastos para mostrar en este período.</li>`;
    return;
  }

  categoriasOrdenadas.forEach(([cat, monto]) => {
    const porcentaje =
      resumen.totalGastos > 0 ? (monto / resumen.totalGastos) * 100 : 0;
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <span>${cat}</span>
        <span>$${monto.toFixed(2)} (${porcentaje.toFixed(0)}%)</span>
      </div>
      <progress value="${porcentaje.toFixed(0)}" max="100"></progress>
    `;
    listaDesglose.appendChild(li);
  });
}

// ==========================================
// 5. CAPA DE CONTROLADORES Y EVENTOS
// ==========================================

function iniciarModuloDashboard() {
  const datosIniciales = DashboardServicio.obtenerDatosDashboard();
  renderizarDashboard(datosIniciales);

  const formularioMeta = document.getElementById("form-meta");
  if (formularioMeta) {
    formularioMeta.addEventListener("submit", function (evento) {
      evento.preventDefault();
      const inputNuevaMeta = document.getElementById("input-nueva-meta");
      const datos = { monto: inputNuevaMeta.value };
      const resultado = validarDatos(datos, reglasMeta);

      if (!notificarErroresValidacion(resultado, formularioMeta)) return;

      Meta.guardarMeta(Number(datos.monto));
      renderizarDashboard(DashboardServicio.obtenerDatosDashboard());

      alert("¡Meta guardada correctamente!");
      formularioMeta.reset();
    });
  }

  const btnLimpiarMeta = document.getElementById("btn-limpiar-meta");
  if (btnLimpiarMeta) {
    btnLimpiarMeta.addEventListener("click", function () {
      Almacenamiento.remove("meta");
      renderizarDashboard(DashboardServicio.obtenerDatosDashboard());
      alert("¡La meta ha sido restablecida!");
    });
  }
}

function iniciarModuloIngresos() {
  const formulario = document.getElementById("form-ingreso");
  if (!formulario) return;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const datos = {
      monto: document.getElementById("monto").value,
      categoria: document.getElementById("categoria").value,
      fecha: document.getElementById("fecha").value,
      frecuencia: document.getElementById("frecuencia").value,
      descripcion: document.getElementById("descripcion").value,
    };
    const resultado = validarDatos(datos, reglasIngreso);
    if (!notificarErroresValidacion(resultado, formulario)) return;

    Ingreso.guardarIngreso(
      datos.monto,
      datos.categoria,
      datos.fecha,
      datos.frecuencia,
      datos.descripcion,
    );
    alert("¡Ingreso guardado correctamente!");
    formulario.reset();
  });
}

function iniciarModuloGastos() {
  const formulario = document.getElementById("form-gasto");
  if (!formulario) return;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const datos = {
      monto: document.getElementById("monto").value,
      categoria: document.getElementById("categoria").value,
      fecha: document.getElementById("fecha").value,
      metodoPago: document.getElementById("metodo-pago").value,
      descripcion: document.getElementById("descripcion").value,
    };
    const resultado = validarDatos(datos, reglasGasto);
    if (!notificarErroresValidacion(resultado, formulario)) return;

    Gasto.guardarGasto(
      datos.monto,
      datos.categoria,
      datos.fecha,
      datos.metodoPago,
      datos.descripcion,
    );
    alert("¡Gasto guardado correctamente!");
    formulario.reset();
  });
}

function iniciarModuloSimulador() {
  const formulario = document.getElementById("form-simulador");
  if (!formulario) return;

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const datos = {
      montoInicial: document.getElementById("sim-monto-inicial").value,
      aporteMensual: document.getElementById("sim-aporte-mensual").value,
      tasaAnual: document.getElementById("sim-interes").value,
      plazoMeses: document.getElementById("sim-plazo").value,
    };
    const resultado = validarDatos(datos, reglasSimulador);
    if (!notificarErroresValidacion(resultado, formulario)) return;

    const montoInicial = Number(datos.montoInicial) || 0;
    const aporteMensual = Number(datos.aporteMensual) || 0;
    const tasaAnual = Number(datos.tasaAnual) || 0;
    const plazoMeses = Number(datos.plazoMeses) || 0;

    const tasaMensual = tasaAnual / 100 / 12;
    let saldoActual = montoInicial;
    let totalDepositado = montoInicial + aporteMensual * plazoMeses;

    for (let i = 0; i < plazoMeses; i++) {
      saldoActual = saldoActual * (1 + tasaMensual) + aporteMensual;
    }

    if (plazoMeses === 0) {
      saldoActual = montoInicial;
      totalDepositado = montoInicial;
    }

    const interesesGenerados = Math.max(0, saldoActual - totalDepositado);

    const elDepositado = document.getElementById("sim-resultado-depositado");
    const elIntereses = document.getElementById("sim-resultado-intereses");
    const elTotal = document.getElementById("sim-resultado-total");

    if (elDepositado)
      elDepositado.textContent = `$${totalDepositado.toFixed(2)}`;
    if (elIntereses)
      elIntereses.textContent = `$${interesesGenerados.toFixed(2)}`;
    if (elTotal) elTotal.textContent = `$${saldoActual.toFixed(2)}`;
  });
}

function iniciarModuloHistoria() {
  const selectFiltro = document.getElementById("filtro-tipo");
  const cuerpoTabla = document.getElementById("tabla-historial-body");

  const filtroActual = selectFiltro ? selectFiltro.value : "todos";
  renderizarHistorial(filtrarHistoria(filtroActual));

  if (selectFiltro && !selectFiltro.dataset.listener) {
    selectFiltro.dataset.listener = "true";
    selectFiltro.addEventListener("change", () => {
      renderizarHistorial(filtrarHistoria(selectFiltro.value));
    });
  }

  if (cuerpoTabla && !cuerpoTabla.dataset.listener) {
    cuerpoTabla.dataset.listener = "true";
    cuerpoTabla.addEventListener("click", (e) => {
      const botonEliminar = e.target.closest("button[data-id]");
      if (!botonEliminar) return;

      const id = botonEliminar.getAttribute("data-id");
      const tipo = botonEliminar.getAttribute("data-tipo");

      if (tipo === "ingreso") Ingreso.eliminar(id);
      else if (tipo === "gasto") Gasto.eliminar(id);

      renderizarHistorial(
        filtrarHistoria(selectFiltro ? selectFiltro.value : "todos"),
      );
    });
  }
}

function iniciarModuloReportes() {
  const filtroPeriodo = document.getElementById("filtro-periodo");

  const actualizarReportes = () => {
    const periodo = filtroPeriodo ? filtroPeriodo.value : "este-mes";
    const resumen = ReporteServicio.obtenerResumenPeriodo(periodo);
    renderizarReportes(resumen);
  };

  actualizarReportes();

  if (filtroPeriodo && !filtroPeriodo.dataset.listener) {
    filtroPeriodo.dataset.listener = "true";
    filtroPeriodo.addEventListener("change", actualizarReportes);
  }
}

// ==========================================
// 6. ENRUTADOR GLOBAL
// ==========================================

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
      iniciarModuloHistoria();
      break;
    case "reportes.html":
      iniciarModuloReportes();
      break;
    default:
      console.log("Página no encontrada");
  }
}

document.addEventListener("DOMContentLoaded", iniciarApp);
