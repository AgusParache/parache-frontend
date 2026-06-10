import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client'; 
import { CheckCircle, Clock, PlusCircle, FileText, Calendar, AlertTriangle } from 'lucide-react';

const socket = io('https://parache-backend-production.up.railway.app');

function App() {
  const [facturas, setFacturas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [form, setForm] = useState({ id_factura: '', nombre_proveedor: '', monto: '', fecha_a_realizar: '', detalle: '' });

const API_URL = 'https://parache-backend-production.up.railway.app/api/facturas';

  const obtenerFacturas = async () => {
    try {
      const res = await axios.get(API_URL);
      setFacturas(res.data);
    } catch (err) {
      console.error("Error al obtener facturas:", err);
    }
  };

  useEffect(() => { 
    obtenerFacturas(); 

    socket.on('facturas_actualizadas', () => {
      console.log('⚡ Cambio detectado en la Base de Datos. Actualizando panel...');
      obtenerFacturas();
    });

    return () => {
      socket.off('facturas_actualizadas');
    };
  }, []);

  const guardarFactura = async (e) => {
    e.preventDefault();
    if (!form.id_factura || !form.nombre_proveedor || !form.monto || !form.fecha_a_realizar) {
      alert("Por favor, completa todos los campos obligatorios.");
      return;
    }
    try {
      await axios.post(API_URL, form);
      setForm({ id_factura: '', nombre_proveedor: '', monto: '', fecha_a_realizar: '', detalle: '' });

    } catch (err) {
      console.error("Error al guardar:", err);
    }
  };

  const marcarPagado = async (id) => {
    try {
      await axios.put(`${API_URL}/${id}`);
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  const obtenerFacturasAlertadas = () => {
    const hoyStr = new Date().toLocaleDateString('sv-SE'); 
    return facturas.filter(f => f.estado === 'pendiente' && f.fecha_a_realizar <= hoyStr);
  };

  const facturasAlertadas = obtenerFacturasAlertadas();
  const facturasFiltradas = facturas.filter(f => {
    if (filtro === 'pendiente') return f.estado === 'pendiente';
    if (filtro === 'pagado') return f.estado === 'pagado';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-slate-100 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-6 border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-extrabold text-blue-500 tracking-tight">Control de Facturas Personal</h1>
        <p className="text-sm text-gray-400 mt-1">Gestión de alertas de pago — Parache Herramientas — En Tiempo Real ⚡</p>
      </header>

      <div className="max-w-6xl mx-auto mb-6">
        {facturasAlertadas.length > 0 ? (
          <div className="bg-red-950/40 border-2 border-red-500/40 p-4 rounded-xl shadow-lg flex flex-col gap-3 animate-pulse">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm tracking-wide uppercase">
              <AlertTriangle size={18} className="text-red-500" />
              <span>¡Atención! Tenés {facturasAlertadas.length} pagos pendientes para realizar hoy</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {facturasAlertadas.map(f => (
                <div key={f.id_factura} className="bg-gray-900/90 border border-red-900/60 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-400 font-mono">Factura: {f.id_factura}</div>
                    <div className="font-bold text-white text-sm">{f.nombre_proveedor}</div>
                    <div className="text-xs text-red-400 font-semibold mt-0.5">
                      Debía pagarse: {new Date(f.fecha_a_realizar + 'T00:00:00').toLocaleDateString('es-AR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-red-400 text-sm">${Number(f.monto).toLocaleString('es-AR')}</div>
                    <button onClick={() => marcarPagado(f.id_factura)} className="mt-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-extrabold px-2 py-1 rounded uppercase transition-all cursor-pointer">
                      PAGAR YA
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-xl text-center text-xs text-emerald-400 font-medium">
            ✅ Al día: No tenés alertas de pago pendientes para la fecha de hoy.
          </div>
        )}
      </div>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <section className="bg-gray-900 p-6 rounded-xl border border-gray-800 h-fit shadow-xl">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-blue-400">
            <PlusCircle size={18}/> Cargar Factura
          </h2>
          <form onSubmit={guardarFactura} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">N° Factura (ID)</label>
              <input type="text" className="bg-gray-950 p-2.5 rounded border border-gray-800 text-white focus:border-blue-500 outline-none transition text-sm" value={form.id_factura} onChange={e => setForm({...form, id_factura: e.target.value})} required />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">Proveedor</label>
              <input type="text" className="bg-gray-950 p-2.5 rounded border border-gray-800 text-white focus:border-blue-500 outline-none transition text-sm" value={form.nombre_proveedor} onChange={e => setForm({...form, nombre_proveedor: e.target.value})} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-400">Monto ($)</label>
                <input type="number" step="0.01" className="bg-gray-950 p-2.5 rounded border border-gray-800 text-white focus:border-blue-500 outline-none transition text-sm" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} required />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <Calendar size={12}/> Fecha Alerta
                </label>
                <input type="date" className="bg-gray-950 p-2.5 rounded border border-amber-900/60 text-amber-300 focus:border-blue-500 outline-none transition text-sm" value={form.fecha_a_realizar} onChange={e => setForm({...form, fecha_a_realizar: e.target.value})} required />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1"><FileText size={13}/> Detalle</label>
              <textarea rows="2" className="bg-gray-950 p-2.5 rounded border border-gray-800 text-white focus:border-blue-500 outline-none transition text-sm resize-none" value={form.detalle} onChange={e => setForm({...form, detalle: e.target.value})} />
            </div>

            <button type="submit" className="mt-2 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-950/50 cursor-pointer text-center">
              Registrar Pago
            </button>
          </form>
        </section>

        {/* Listado */}
        <section className="lg:col-span-2 bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
              <Clock size={18}/> Pendientes y Pagos
            </h2>
            <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 self-start">
              {['todas', 'pendiente', 'pagado'].map((op) => (
                <button key={op} type="button" onClick={() => setFiltro(op)} className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${filtro === op ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>
                  {op}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase font-semibold tracking-wider">
                  <th className="pb-3 px-3">Factura</th>
                  <th className="pb-3 px-3">Fecha Alerta</th>
                  <th className="pb-3 px-3 text-right">Monto</th>
                  <th className="pb-3 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {facturasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-sm text-gray-500 italic">No hay registros para mostrar</td>
                  </tr>
                ) : (
                  facturasFiltradas.map(f => (
                    <tr key={f.id_factura} className={`hover:bg-gray-800/10 transition-colors ${f.estado === 'pagado' ? 'bg-emerald-950/5 opacity-60' : ''}`}>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-blue-400 text-sm">{f.id_factura}</span>
                        <div className="text-xs text-gray-300 font-medium mt-0.5">{f.nombre_proveedor}</div>
                        {f.detalle && <div className="text-[11px] text-gray-500 italic mt-0.5">{f.detalle}</div>}
                      </td>
                      <td className="py-3.5 px-3 text-sm text-amber-400/90 font-mono">
                        {f.fecha_a_realizar ? new Date(f.fecha_a_realizar + 'T00:00:00').toLocaleDateString('es-AR') : '-'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-blue-300 text-sm">
                        ${Number(f.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {f.estado === 'pendiente' ? (
                          <button type="button" onClick={() => marcarPagado(f.id_factura)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 px-3.5 rounded-md text-[11px] font-extrabold tracking-wider transition-all shadow-md shadow-emerald-950/30 cursor-pointer">
                            PAGAR
                          </button>
                        ) : (
                          <div className="flex items-center justify-center text-emerald-400 gap-1 text-xs font-bold">
                            <CheckCircle size={16} /> <span className="hidden sm:inline">PAGADO</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;