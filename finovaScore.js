// Finova Score
// Evaluación financiera basada en datos objetivos

export function calcularFinovaScore(finanzas) {
  let score = 0;

  // 1. Capacidad de ahorro: hasta 30 puntos
  const tasaAhorro = finanzas.tasaAhorro || 0;

  if (tasaAhorro >= 20) {
    score += 30;
  } else if (tasaAhorro >= 10) {
    score += 20;
  } else if (tasaAhorro > 0) {
    score += 10;
  }

  // 2. Control de gastos: hasta 25 puntos
  const ingresos = finanzas.ingresos || 0;
  const gastos = finanzas.gastos || 0;

  if (ingresos > 0) {
    const porcentajeGastos = (gastos / ingresos) * 100;

    if (porcentajeGastos <= 50) {
      score += 25;
    } else if (porcentajeGastos <= 70) {
      score += 20;
    } else if (porcentajeGastos <= 90) {
      score += 10;
    }
  }

  // 3. Disponible positivo: hasta 20 puntos
  if (finanzas.disponible > 0) {
    score += 20;
  }

  // 4. Ahorro registrado: hasta 15 puntos
  if (finanzas.ahorros > 0) {
    score += 15;
  }

  // 5. Inversión registrada: hasta 10 puntos
  if (finanzas.inversiones > 0) {
    score += 10;
  }

  return Math.min(score, 100);
}
