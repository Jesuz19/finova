import { calcularFinanzas } from "./finovaEngine.js";

const movimientos = [
  { tipo: "ingreso", valor: 4200000 },
  { tipo: "gasto", valor: 2100000 },
  { tipo: "ahorro", valor: 1400000 },
  { tipo: "inversion", valor: 300000 }
];

const resultado = calcularFinanzas(movimientos);

console.log("Resultado Finova Engine:");
console.log(resultado);
