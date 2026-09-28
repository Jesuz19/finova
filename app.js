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
  formatoPesos(finanzas.patrimonio);

document.querySelector(".balance-sub").textContent =
  "Patrimonio: " + formatoPesos(finanzas.patrimonio);

document.querySelector(".score-number").textContent =
  score;

console.log("Finova Engine:", finanzas);
console.log("Finova Score:", score);

const listaMovimientos = document.querySelectorAll(".movement");

movimientos.forEach((movimiento, index) => {
  if (listaMovimientos[index]) {
    const nombre =
      listaMovimientos[index].querySelector(".movement-name");

    const valor =
      listaMovimientos[index].querySelector(".positive, .negative");

    nombre.textContent = movimiento.descripcion;

    const signo =
      movimiento.tipo === "gasto" ? "-" : "+";

    valor.textContent =
      signo + formatoPesos(movimiento.valor);

    valor.className =
      movimiento.tipo === "gasto"
        ? "negative"
        : "positive";
  }
});
