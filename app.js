import { calcularFinanzas } from "./finovaEngine.js";
import { calcularFinovaScore } from "./finovaScore.js";
import { movimientos } from "./movimientos.js";
import { metas } from "./metas.js";

const finanzas = calcularFinanzas(movimientos);

const score = calcularFinovaScore(finanzas);

function formatoPesos(valor) {
  return "$" + valor.toLocaleString("es-CO");
}

// ========================
// DASHBOARD
// ========================

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

// ========================
// MOVIMIENTOS
// ========================

const listaMovimientos = document.querySelectorAll(".movement");

movimientos.forEach((movimiento, index) => {

  if (listaMovimientos[index]) {

    const nombre =
      listaMovimientos[index].querySelector(".movement-name");

    const valor =
      listaMovimientos[index].querySelector(".positive, .negative");

    nombre.textContent =
      movimiento.descripcion;

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

// ========================
// METAS
// ========================

const listaMetas = document.querySelectorAll(".goal");

metas.forEach((meta, index) => {

  if (listaMetas[index]) {

    const porcentaje =
      meta.objetivo > 0
        ? Math.round((meta.actual / meta.objetivo) * 100)
        : 0;

    const nombre =
      listaMetas[index].querySelector(".goal-name");

    const porcentajeElemento =
      listaMetas[index].querySelector(".goal-percent");

    const barra =
      listaMetas[index].querySelector(".progress-bar");

    const detalle =
      listaMetas[index].querySelector(".goal-detail");

    nombre.textContent =
      meta.nombre;

    porcentajeElemento.textContent =
      porcentaje + "%";

    barra.style.width =
      Math.min(porcentaje, 100) + "%";

    detalle.textContent =
      formatoPesos(meta.actual) +
      " de " +
      formatoPesos(meta.objetivo);
  }

});

console.log("Finova Engine:", finanzas);
console.log("Finova Score:", score);
console.log("Metas:", metas);
