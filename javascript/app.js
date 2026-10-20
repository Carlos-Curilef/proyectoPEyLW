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
    const ingresos = Almacenamiento.get('ingresos', []);

    const nuevoIngreso = {
      id: crypto.randomUUID(),
      monto: Number(monto),
      categoria,
      fecha,
      frecuencia,
      descripcion
    };

    ingresos.push(nuevoIngreso);
    Almacenamiento.set('ingresos', ingresos);
  }

  static calcularMontoTotal(){
    const ingresos = Almacenamiento.get('ingresos', []);
    let montoTotal = 0;
    ingresos.forEach(unIngreso => {
      montoTotal+=unIngreso.monto;
    });
    return montoTotal;
  }
}

class Gasto {
  static guardarGasto(monto, categoria, fecha, frecuencia, descripcion) {
    const gastos = Almacenamiento.get('gastos', []);

    const nuevoGasto = {
      id: crypto.randomUUID(),
      monto: Number(monto),
      categoria,
      fecha,
      frecuencia,
      descripcion
    };

    gastos.push(nuevoGasto);
    Almacenamiento.set('gastos', gastos);
  }

  static calcularMontoTotal(){
    const gastos = Almacenamiento.get('gastos', []);
    let gastoTotal = 0;
    gastos.forEach(unGasto => {
      gastoTotal+=unGasto.monto;
    });
    return gastoTotal;
  }
}

// FUNCIONES AUXILIARES

function establecerFechaActual() {
  const objFecha = new Date();

  return objFecha.toLocaleDateString('es-AR');
}

// MÓDULOS

function iniciarModuloDashboard() {
  const fecha = document.getElementById('fecha');
  const fechaActual = establecerFechaActual();

  fecha.textContent = fechaActual;

  const totalIngresos = document.getElementById('total-ingresos');
  const totalGastos  = document.getElementById('total-gastos');
  const balanceTotal = document.getElementById('balance-total');

  const montoTotalIngresos = Ingreso.calcularMontoTotal();
  totalIngresos.textContent = montoTotalIngresos;

  const montoTotalGastos = Gasto.calcularMontoTotal();
  totalGastos.textContent = montoTotalGastos;

  const balance = montoTotalIngresos - montoTotalGastos;
  balanceTotal.textContent = balance;
}

function iniciarModuloIngresos() {
  const formulario = document.getElementById('form-ingreso');

  formulario.addEventListener('submit', function(evento) {
    // Evitamos que la página se recargue
    evento.preventDefault();

    // Obtenemos los valores del formulario
    const monto = document.getElementById('monto').value;
    const categoria = document.getElementById('categoria').value;
    const fecha = document.getElementById('fecha').value;
    const frecuencia = document.getElementById('frecuencia').value;
    const descripcion = document.getElementById('descripcion').value;

    // Guardamos el ingreso
    Ingreso.guardarIngreso(
      monto,
      categoria,
      fecha,
      frecuencia,
      descripcion
    );

    alert('¡Ingreso guardado correctamente!');

    formulario.reset();
  });
}

function iniciarModuloGastos() {
  const formulario = document.getElementById('form-gasto');

  formulario.addEventListener('submit', function(evento) {
    // Evitamos que la página se recargue
    evento.preventDefault();

    // Obtenemos los valores del formulario
    const monto = document.getElementById('monto').value;
    const categoria = document.getElementById('categoria').value;
    const metodoPago = document.getElementById('metodo-pago').value;
    const fecha = document.getElementById('fecha').value;
    const descripcion = document.getElementById('descripcion').value;

    // Guardamos el gasto
    Gasto.guardarGasto(
      monto,
      categoria,
      fecha,
      metodoPago,
      descripcion
    );

    alert('¡Gasto guardado correctamente!');

    formulario.reset();
  });
}

function iniciarModuloSimulador() {
  const formulario = document.getElementById('form-simulador');

  formulario.addEventListener('submit', function(evento) {
    // Evitamos que la página se recargue
    evento.preventDefault();

    // Obtenemos los valores del formulario
    const monto = document.getElementById('monto').value;
    const plazo = document.getElementById('plazo').value;
    const tasaInteres = document.getElementById('tasa-interes').value;

    // Calculamos el resultado del simulador
    const resultado = (monto * (1 + (tasaInteres / 100) * plazo)).toFixed(2);

    // Mostramos el resultado en la página
    const resultadoElemento = document.getElementById('resultado');
    resultadoElemento.textContent = `El monto final después de ${plazo} años será: $${resultado}`;
  });
}

function iniciarApp() {
  const paginaActiva = document.querySelector('a.activo');

  if (!paginaActiva) {
    console.log("La página no se encuentra activa");
    return;
  }

  const pagina = paginaActiva.getAttribute('href');

  switch (pagina) {
    case 'dashboard.html':
      iniciarModuloDashboard();
      break;
    case 'ingresos.html':
      iniciarModuloIngresos();
      break;
    case 'gastos.html':
      iniciarModuloGastos();
      break;

    default:
      console.log("Página no encontrada");
  }
}

document.addEventListener('DOMContentLoaded', iniciarApp);