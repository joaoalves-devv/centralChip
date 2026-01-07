export function calcularStatus(
  saldo: number,
  diasSemRecarga: number
) {
  if (saldo <= 0 || diasSemRecarga > 75) return "RISCO";
  return "ATIVO";
}
