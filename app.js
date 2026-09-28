import { calcularFinanzas } from "./finovaEngine.js";
import { calcularFinovaScore } from "./finovaScore.js";

import { movimientos } from "./movimientos.js";

const finanzas = calcularFinanzas(movimientos);

const score = calcularFinovaScore(finanzas);

function formatoPesos(valor) {
  return "$" + valor.toLocaleString("es-CO");
}

document.querySelector(".income").textContent =
  "+" + formatoPesos(finanzas.ingresos);

document.querySelector(".expense").textContent =
  "-" + formatoPesos(finanzas.gastos);

document.querySelector(".saving").textContent =
  formatoPesos(finanzas.ahorros);

document.querySelector(".investment").textContent =
  formatoPesos(finanzas.inversiones);

document.querySelector(".balance-value").textContent =
  formatoPesos(finanzas.disponible);

document.querySelector(".score-number").textContent =
  score;

console.log("Finova Engine:", finanzas);
console.log("Finova Score:", score);
