import { useState, useEffect } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, LineChart as LineChartIcon,
  Plus, Trash2, ArrowRight, Sparkles, CheckCircle2, Target, Lightbulb, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts';

// Todos los movimientos se guardan bajo una sola clave en el storage
// personal del usuario (no compartido) como un arreglo JSON.
const STORAGE_KEY = 'movimientos';

const BRAND = {
  ink: '#16233F',
  gold: '#B8902E',
  goldLight: '#E3C878',
};

const TIPOS = {
  ingreso: { label: 'Ingreso', color: '#2E8B57', icon: TrendingUp },
  egreso: { label: 'Egreso', color: '#B3452F', icon: TrendingDown },
  ahorro: { label: 'Ahorro', color: '#3D5A80', icon: PiggyBank },
  inversion: { label: 'Inversión', color: '#5B4A82', icon: LineChartIcon },
};

const SYSTEM_PROMPT_ANALISIS = `Eres un analista financiero que ayuda a un estudiante universitario colombiano a entender sus finanzas personales. Vas a recibir un resumen de sus movimientos (ingresos, egresos, ahorros e inversiones) en JSON.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin markdown ni backticks, con exactamente esta forma:

{
  "resumen": "1-2 frases con tu evaluación general, tono cercano y honesto",
  "fortalezas": ["punto breve", "punto breve"],
  "mejorar": ["punto breve", "punto breve"],
  "sugerencias": ["sugerencia específica basada en sus datos", "sugerencia específica basada en sus datos"],
  "nota": "una frase breve aclarando que esto es orientación general, no asesoría financiera certificada"
}

Reglas:
- Basa todo en los datos reales que recibas; evita consejos genéricos que no se conecten con sus números.
- Como referencia general (no regla fija), apartar entre 10% y 20% del ingreso en ahorro e inversión suele considerarse saludable.
- Nunca recomiendes acciones, fondos o instrumentos específicos para invertir; eso lo debe decidir con un asesor certificado. Si aplica, puedes mencionar conceptos generales (diversificación, horizonte de tiempo, fondo de emergencia).
- Si hay muy pocos movimientos registrados, dilo en el resumen y ajusta las sugerencias hacia registrar más datos.
- Sé honesto pero constructivo: nunca condescendiente, nunca alarmista.
- fortalezas y mejorar: 2 a 3 elementos cada uno. sugerencias: 2 a 3 elementos.
- Todo el texto en español, tono cercano pero informado.`;

const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

export default function MisFinanzas() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('resumen');
  const [saveError, setSaveError] = useState(false);
  const [form, setForm] = useState({
    tipo: 'ingreso',
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
  });
  const [analisis, setAnalisis] = useState(null);
  const [analizando, setAnalizando] = useState(false);
  const [errorAnalisis, setErrorAnalisis] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (mounted && result && result.value) {
          setMovimientos(JSON.parse(result.value));
        }
      } catch (e) {
        // Todavía no hay datos guardados, se empieza vacío
      }
      try {
        const resultAnalisis = await window.storage.get('ultimo_analisis');
        if (mounted && resultAnalisis && resultAnalisis.value) {
          setAnalisis(JSON.parse(resultAnalisis.value));
        }
      } catch (e) {
        // Sin análisis previo
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const persistir = async (lista) => {
    try {
      const result = await window.storage.set(STORAGE_KEY, JSON.stringify(lista));
      setSaveError(!result);
    } catch (e) {
      setSaveError(true);
    }
  };

  const agregarMovimiento = async (e) => {
    e.preventDefault();
    const montoNum = parseFloat(form.monto);
    if (!form.descripcion.trim() || !montoNum || montoNum <= 0) return;

    const nuevo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tipo: form.tipo,
      descripcion: form.descripcion.trim(),
      monto: montoNum,
      fecha: form.fecha,
    };

    const nuevaLista = [nuevo, ...movimientos];
    setMovimientos(nuevaLista);
    setForm((f) => ({ ...f, descripcion: '', monto: '' }));
    await persistir(nuevaLista);
  };

  const eliminarMovimiento = async (id) => {
    const nuevaLista = movimientos.filter((m) => m.id !== id);
    setMovimientos(nuevaLista);
    await persistir(nuevaLista);
  };

  const totales = movimientos.reduce((acc, m) => {
    acc[m.tipo] = (acc[m.tipo] || 0) + m.monto;
    return acc;
  }, {});
  const totalIngresos = totales.ingreso || 0;
  const totalEgresos = totales.egreso || 0;
  const totalAhorros = totales.ahorro || 0;
  const totalInversiones = totales.inversion || 0;
  const balance = totalIngresos - totalEgresos - totalAhorros - totalInversiones;

  const dataBarras = Object.entries(TIPOS).map(([key, cfg]) => ({
    nombre: cfg.label,
    valor: totales[key] || 0,
    color: cfg.color,
  }));

  const movimientosOrdenados = [...movimientos].sort((a, b) => {
    if (a.fecha === b.fecha) return a.id.localeCompare(b.id);
    return a.fecha < b.fecha ? -1 : 1;
  });
  let acumulado = 0;
  const dataEvolucion = movimientosOrdenados.map((m) => {
    acumulado += m.tipo === 'ingreso' ? m.monto : -m.monto;
    return { fecha: m.fecha.slice(5), balance: acumulado };
  });

  const analizarFinanzas = async () => {
    setAnalizando(true);
    setErrorAnalisis(false);
    try {
      const datos = {
        balance_disponible: balance,
        total_ingresos: totalIngresos,
        total_egresos: totalEgresos,
        total_ahorros: totalAhorros,
        total_inversiones: totalInversiones,
        numero_movimientos: movimientos.length,
        movimientos_recientes: movimientos.slice(0, 60).map((m) => ({
          tipo: m.tipo,
          descripcion: m.descripcion,
          monto: m.monto,
          fecha: m.fecha,
        })),
      };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT_ANALISIS,
          messages: [
            { role: 'user', content: `Mis datos financieros:\n${JSON.stringify(datos)}` },
          ],
        }),
      });

      const data = await response.json();
      const textoBloque = (data.content || []).find((b) => b.type === 'text');
      if (!textoBloque) throw new Error('Sin respuesta de texto');

      const limpio = textoBloque.text.replace(/```json|```/g, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(limpio);
      } catch (err) {
        const inicio = limpio.indexOf('{');
        const fin = limpio.lastIndexOf('}');
        parsed = JSON.parse(limpio.slice(inicio, fin + 1));
      }

      const resultado = { ...parsed, generadoEl: new Date().toISOString() };
      setAnalisis(resultado);
      await window.storage.set('ultimo_analisis', JSON.stringify(resultado));
    } catch (e) {
      setErrorAnalisis(true);
    } finally {
      setAnalizando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 pb-16">
        <header className="pt-8 pb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: BRAND.ink }}>
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-semibold text-slate-900 leading-tight">Mis Finanzas</h1>
            <p className="text-xs text-slate-400">Tu registro personal</p>
          </div>
        </header>

        {saveError && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            No se pudo guardar el último cambio. Revisa tu conexión e intenta de nuevo.
          </div>
        )}

        <div className="flex gap-1 mb-5 p-1 bg-slate-200 rounded-xl">
          <button
            onClick={() => setTab('resumen')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'resumen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setTab('movimientos')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'movimientos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Movimientos
          </button>
          <button
            onClick={() => setTab('analisis')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'analisis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Análisis
          </button>
        </div>

        {tab === 'resumen' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5 text-white" style={{ backgroundColor: BRAND.ink }}>
              <p className="text-xs uppercase tracking-wider mb-1.5 font-medium" style={{ color: BRAND.goldLight }}>
                Balance disponible
              </p>
              <p className="text-3xl font-serif font-semibold tabular-nums">{formatCOP(balance)}</p>
              {dataEvolucion.length > 1 && (
                <div className="h-10 mt-3 -mx-1">
                  <ResponsiveContainer width="100%" height={40}>
                    <LineChart data={dataEvolucion.slice(-14)} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                      <Line type="monotone" dataKey="balance" stroke={BRAND.goldLight} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(TIPOS).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={key} className="rounded-lg bg-white shadow-sm border-l-4 p-3" style={{ borderLeftColor: cfg.color }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                      <span className="text-xs font-medium text-slate-500">{cfg.label}</span>
                    </div>
                    <p className="text-sm font-mono font-semibold text-slate-800">
                      {formatCOP(totales[key] || 0)}
                    </p>
                  </div>
                );
              })}
            </div>

            {movimientos.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400 text-sm mb-3">
                  Aquí verás tus gráficas en cuanto registres tu primer movimiento.
                </p>
                <button
                  onClick={() => setTab('movimientos')}
                  className="text-sm font-medium inline-flex items-center gap-1"
                  style={{ color: BRAND.ink }}
                >
                  Agregar movimiento <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-white border border-slate-200 p-4">
                  <p className="text-sm font-serif font-medium text-slate-700 mb-3">Resumen general</p>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={dataBarras}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
                      <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        width={36}
                      />
                      <Tooltip formatter={(v) => formatCOP(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                      <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                        {dataBarras.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {dataEvolucion.length > 1 && (
                  <div className="rounded-xl bg-white border border-slate-200 p-4">
                    <p className="text-sm font-serif font-medium text-slate-700 mb-3">Evolución del balance</p>
                    <ResponsiveContainer width="100%" height={170}>
                      <LineChart data={dataEvolucion}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
                        <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#94A3B8' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          width={36}
                        />
                        <Tooltip formatter={(v) => formatCOP(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }} />
                        <Line type="monotone" dataKey="balance" stroke={BRAND.ink} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'movimientos' && (
          <div className="space-y-4">
            <form onSubmit={agregarMovimiento} className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(TIPOS).map(([key, cfg]) => {
                  const activo = form.tipo === key;
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setForm((f) => ({ ...f, tipo: key }))}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                        activo ? 'text-white border-transparent' : 'bg-white text-slate-400 border-slate-200'
                      }`}
                      style={activo ? { backgroundColor: cfg.color } : {}}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                placeholder="Descripción"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Monto"
                  value={form.monto}
                  onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                  className="w-1/2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                />
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                  className="w-1/2 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ backgroundColor: BRAND.ink }}
              >
                <Plus className="w-4 h-4" /> Agregar movimiento
              </button>
            </form>

            {movimientos.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">
                Todavía no hay movimientos. Agrega el primero arriba.
              </p>
            ) : (
              <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                        <th className="text-left font-medium py-2 px-3">Fecha</th>
                        <th className="text-left font-medium py-2 px-3">Detalle</th>
                        <th className="text-right font-medium py-2 px-3">Monto</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientos.map((m) => {
                        const cfg = TIPOS[m.tipo];
                        const signo = m.tipo === 'ingreso' ? '+' : '−';
                        return (
                          <tr key={m.id} className="border-b border-slate-50 last:border-0">
                            <td className="py-2.5 px-3 text-slate-400 text-xs whitespace-nowrap align-top">
                              {m.fecha.slice(5)}
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="text-slate-800 text-sm leading-tight">{m.descripcion}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: cfg.color }} />
                                {cfg.label}
                              </p>
                            </td>
                            <td
                              className="py-2.5 px-3 text-right font-mono text-sm font-medium whitespace-nowrap align-top"
                              style={{ color: cfg.color }}
                            >
                              {signo}{formatCOP(m.monto)}
                            </td>
                            <td className="py-2.5 pr-3 align-top">
                              <button
                                onClick={() => eliminarMovimiento(m.id)}
                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                aria-label="Eliminar movimiento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'analisis' && (
          <div className="space-y-4">
            {movimientos.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400 text-sm mb-3">
                  Registra algunos movimientos para que pueda analizar tus finanzas.
                </p>
                <button
                  onClick={() => setTab('movimientos')}
                  className="text-sm font-medium inline-flex items-center gap-1"
                  style={{ color: BRAND.ink }}
                >
                  Agregar movimiento <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={analizarFinanzas}
                  disabled={analizando}
                  className="w-full py-2.5 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: BRAND.ink }}
                >
                  {analizando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Analizando tus finanzas…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> {analisis ? 'Actualizar análisis' : 'Analizar mis finanzas'}
                    </>
                  )}
                </button>

                {errorAnalisis && (
                  <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    No se pudo generar el análisis. Intenta de nuevo en un momento.
                  </div>
                )}

                {analisis && (
                  <div className="space-y-3">
                    <div className="rounded-xl p-4 text-white" style={{ backgroundColor: BRAND.ink }}>
                      <p className="text-xs uppercase tracking-wider mb-1.5 font-medium" style={{ color: BRAND.goldLight }}>
                        Evaluación general
                      </p>
                      <p className="text-sm leading-relaxed">{analisis.resumen}</p>
                    </div>

                    {analisis.fortalezas?.length > 0 && (
                      <div className="rounded-xl bg-white border border-slate-200 p-4">
                        <p className="text-sm font-serif font-medium text-slate-700 mb-2.5">Lo que haces bien</p>
                        <ul className="space-y-2">
                          {analisis.fortalezas.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: TIPOS.ingreso.color }} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analisis.mejorar?.length > 0 && (
                      <div className="rounded-xl bg-white border border-slate-200 p-4">
                        <p className="text-sm font-serif font-medium text-slate-700 mb-2.5">Para mejorar</p>
                        <ul className="space-y-2">
                          {analisis.mejorar.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: TIPOS.egreso.color }} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analisis.sugerencias?.length > 0 && (
                      <div className="rounded-xl bg-white border border-slate-200 p-4">
                        <p className="text-sm font-serif font-medium text-slate-700 mb-2.5">Sugerencias</p>
                        <ul className="space-y-2">
                          {analisis.sugerencias.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BRAND.gold }} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analisis.nota && (
                      <p className="text-xs text-slate-400 leading-relaxed px-1">{analisis.nota}</p>
                    )}
                  </div>
                )}

                {!analisis && !analizando && !errorAnalisis && (
                  <p className="text-center text-slate-400 text-sm py-6">
                    Toca el botón para recibir una evaluación de tus finanzas.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
