// Finova Engine
// Motor financiero básico de Finova

export function calcularFinanzas(movimientos) {
  let ingresos = 0;
  let gastos = 0;
  let ahorros = 0;
  let inversiones = 0;

  movimientos.forEach((movimiento) => {
    const valor = Number(movimiento.valor) || 0;

    if (movimiento.tipo === "ingreso") {
      ingresos += valor;
    }

    if (movimiento.tipo === "gasto") {
      gastos += valor;
    }

    if (movimiento.tipo === "ahorro") {
      ahorros += valor;
    }

    if (movimiento.tipo === "inversion") {
      inversiones += valor;
    }
  });

  const disponible = ingresos - gastos - ahorros - inversiones;

const patrimonio = ahorros + inversiones;

  const tasaAhorro =
    ingresos > 0
      ? (ahorros / ingresos) * 100
      : 0;

  return {
  ingresos,
  gastos,
  ahorros,
  inversiones,
  disponible,
  patrimonio,
  tasaAhorro
};
}
