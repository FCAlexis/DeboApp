class PaymentEngine {
  static distribuirPago(personaId, montoPagoCentavos, deudas) {
    if (montoPagoCentavos <= 0) {
      throw new Error("El monto del pago debe ser mayor a cero");
    }

    const now = new Date();
    
    let pendientes = deudas.filter(d => d.montoTotalCentavos > d.montoPagadoCentavos);

    pendientes.sort((a, b) => {
      const aVencido = a.fechaVencimiento && a.fechaVencimiento < now;
      const bVencido = b.fechaVencimiento && b.fechaVencimiento < now;
      if (aVencido !== bVencido) return aVencido ? -1 : 1;

      if (a.fechaVencimiento && b.fechaVencimiento) {
        if (a.fechaVencimiento.getTime() !== b.fechaVencimiento.getTime()) {
          return a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime();
        }
      } else if (a.fechaVencimiento) return -1;
      else if (b.fechaVencimiento) return 1;

      if (a.tipo !== b.tipo) {
        return a.tipo === 'AJUSTE' ? -1 : 1;
      }

      if (a.createdAt.getTime() !== b.createdAt.getTime()) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }

      return a.id.localeCompare(b.id);
    });

    let restante = montoPagoCentavos;
    const allocations = [];

    for (const deuda of pendientes) {
      if (restante <= 0) break;
      const saldo = deuda.montoTotalCentavos - deuda.montoPagadoCentavos;
      const aplicado = Math.min(restante, saldo);
      allocations.push({ deudaId: deuda.id, montoCentavos: aplicado });
      restante -= aplicado;
    }

    return {
      aplicadoTotal: montoPagoCentavos - restante,
      restante: restante,
      allocations: allocations
    };
  }
}

function createDebt(id, tipo, total, pagado, vence, created = Date.now()) {
  const now = new Date();
  let fechaVencimiento = null;
  if (vence === 'ayer') fechaVencimiento = new Date(now.getTime() - 86400000);
  if (vence === 'hace2') fechaVencimiento = new Date(now.getTime() - 172800000);
  if (vence === 'futuro') fechaVencimiento = new Date(now.getTime() + 86400000);

  return {
    id, tipo, personaId: 'p1',
    fechaVencimiento,
    createdAt: new Date(created),
    montoTotalCentavos: total,
    montoPagadoCentavos: pagado
  };
}

const tests = [
  {
    name: "TEST 1 - Pago justo de cuota vencida",
    deudas: [createDebt("c1", "CUOTA", 500000, 0, "ayer")],
    pago: 500000,
    expected: { aplicadoTotal: 500000, restante: 0, allocations: [{ deudaId: "c1", montoCentavos: 500000 }] }
  },
  {
    name: "TEST 2 - Pago parcial típico",
    deudas: [createDebt("c1", "CUOTA", 2000000, 0, "ayer")],
    pago: 1000000,
    expected: { aplicadoTotal: 1000000, restante: 0, allocations: [{ deudaId: "c1", montoCentavos: 1000000 }] }
  },
  {
    name: "TEST 3 - Impuesto primero (AFIP te mira)",
    deudas: [
      createDebt("a1", "AJUSTE", 200000, 0, "ayer"),
      createDebt("c1", "CUOTA", 500000, 0, "ayer")
    ],
    pago: 300000,
    expected: { aplicadoTotal: 300000, restante: 0, allocations: [{ deudaId: "a1", montoCentavos: 200000 }, { deudaId: "c1", montoCentavos: 100000 }] }
  },
  {
    name: "TEST 4 - Respeta orden de vencimiento",
    deudas: [
      createDebt("c1", "CUOTA", 300000, 0, "hace2"),
      createDebt("c2", "CUOTA", 300000, 0, "ayer")
    ],
    pago: 300000,
    expected: { aplicadoTotal: 300000, restante: 0, allocations: [{ deudaId: "c1", montoCentavos: 300000 }] }
  },
  {
    name: "TEST 5 - Distribuye en múltiples deudas",
    deudas: [
      createDebt("a1", "AJUSTE", 100000, 0, "ayer"),
      createDebt("c1", "CUOTA", 200000, 0, "ayer"),
      createDebt("c2", "CUOTA", 300000, 0, "futuro")
    ],
    pago: 400000,
    expected: { aplicadoTotal: 400000, restante: 0, allocations: [{ deudaId: "a1", montoCentavos: 100000 }, { deudaId: "c1", montoCentavos: 200000 }, { deudaId: "c2", montoCentavos: 100000 }] }
  },
  {
    name: "TEST 6 - Sobrepago",
    deudas: [createDebt("c1", "CUOTA", 100000, 0, "ayer")],
    pago: 200000,
    expected: { aplicadoTotal: 100000, restante: 100000, allocations: [{ deudaId: "c1", montoCentavos: 100000 }] }
  },
  {
    name: "TEST 7 - Deudas sin fecha al final",
    deudas: [
      createDebt("c1", "CUOTA", 200000, 0, "ayer"),
      createDebt("a1", "AJUSTE", 100000, 0, "null")
    ],
    pago: 200000,
    expected: { aplicadoTotal: 200000, restante: 0, allocations: [{ deudaId: "c1", montoCentavos: 200000 }] }
  },
  {
    name: "TEST 8 - Orden estable determinístico",
    deudas: [
      createDebt("c1", "CUOTA", 100000, 0, "ayer", 1000),
      createDebt("c2", "CUOTA", 100000, 0, "ayer", 2000)
    ],
    pago: 100000,
    expected: { aplicadoTotal: 100000, restante: 0, allocations: [{ deudaId: "c1", montoCentavos: 100000 }] }
  },
  {
    name: "TEST 9 - Completa cuota parcialmente pagada",
    deudas: [createDebt("c1", "CUOTA", 200000, 50000, "ayer")],
    pago: 100000,
    expected: { aplicadoTotal: 100000, restante: 0, allocations: [{ deudaId: "c1", montoCentavos: 100000 }] }
  },
  {
    name: "TEST 10 - Caso argentino real completo",
    deudas: [
      createDebt("a1", "AJUSTE", 30000, 0, "ayer"),
      createDebt("c1", "CUOTA", 100000, 0, "ayer"),
      createDebt("c2", "CUOTA", 100000, 0, "futuro")
    ],
    pago: 120000,
    expected: { aplicadoTotal: 120000, restante: 0, allocations: [{ deudaId: "a1", montoCentavos: 30000 }, { deudaId: "c1", montoCentavos: 90000 }] }
  },
  {
    name: "BONUS - Sin deudas",
    deudas: [],
    pago: 100000,
    expected: { aplicadoTotal: 0, restante: 100000, allocations: [] }
  }
];

console.log("🚀 Ejecutando Suite de Tests (JS Mode): Motor de Distribución de Pagos\n");

let pasados = 0;
tests.forEach(t => {
  try {
    const res = PaymentEngine.distribuirPago('p1', t.pago, t.deudas);
    const success = JSON.stringify(res) === JSON.stringify(t.expected);
    if (success) {
      console.log(`✅ ${t.name}`);
      pasados++;
    } else {
      console.log(`❌ ${t.name}\n   Esperado: ${JSON.stringify(t.expected)}\n   Obtenido: ${JSON.stringify(res)}`);
    }
  } catch (e) {
    console.log(`💥 ${t.name} falló con error: ${e.message}`);
  }
});

console.log(`\n🏆 Resultado final: ${pasados}/${tests.length} tests pasaron.`);
process.exit(pasados === tests.length ? 0 : 1);
