import { useState, useEffect } from 'react';
import { Scale, AlertTriangle, CheckCircle, FlaskConical, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { differenceInDays, parseISO, isValid } from 'date-fns';

interface Props {
  onChangeTab: (tab: 'dashboard' | 'padroes' | 'procedimentos') => void;
}

export function MetrologiaDashboard({ onChangeTab }: Props) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPadroes: 0,
    vencidos: 0,
    aVencer: 0,
    totalProcs: 0
  });

  useEffect(() => {
    carregarIndicadores();
  }, []);

  const carregarIndicadores = async () => {
    try {
      setLoading(true);
      
      // 1. Busca Padrões (Contagem Real de Ativos)
      const { data: padroes, error } = await supabase
        .from('padroes')
        .select('*')
        .neq('status', 'Arquivado') // Ignora apenas os arquivados explicitamente
        .neq('status', 'Excluido'); 

      // 2. Busca Procedimentos
      const { count: procsCount } = await supabase
        .from('metrologia_procedimentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ATIVO');

      let vencidos = 0;
      let aVencer = 0;
      const hoje = new Date();

      padroes?.forEach(p => {
        if (p.data_vencimento) {
          const dt = parseISO(p.data_vencimento);
          if (isValid(dt)) {
            const dias = differenceInDays(dt, hoje);
            if (dias < 0) vencidos++;
            else if (dias <= 30) aVencer++;
          }
        }
      });

      setStats({
        totalPadroes: padroes?.length || 0,
        vencidos,
        aVencer,
        totalProcs: procsCount || 0
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-lg font-black text-slate-700 dark:text-white mb-4">Panorama do Laboratório</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div onClick={() => onChangeTab('padroes')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instrumentos Ativos</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.totalPadroes}</h3>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                <Scale size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-blue-600">
              Gerenciar Inventário <ArrowRight size={12}/>
            </div>
          </div>

          <div onClick={() => onChangeTab('padroes')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden cursor-pointer hover:border-red-200">
            {stats.vencidos > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full m-3 animate-ping"/>}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Certificados Vencidos</p>
                <h3 className={`text-3xl font-black mt-1 ${stats.vencidos > 0 ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>{stats.vencidos}</h3>
              </div>
              <div className={`p-3 rounded-xl transition-colors ${stats.vencidos > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                <AlertTriangle size={24} />
              </div>
            </div>
            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase">
                {stats.vencidos > 0 ? 'Bloqueia emissão de laudos' : 'Conformidade OK'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vencem em 30 dias</p>
                <h3 className="text-3xl font-black text-amber-500 mt-1">{stats.aVencer}</h3>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-500">
                <CheckCircle size={24} />
              </div>
            </div>
            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase">Agendar Calibração Externa</p>
          </div>

          <div onClick={() => onChangeTab('procedimentos')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">POPs Cadastrados</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stats.totalProcs}</h3>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                <FlaskConical size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t dark:border-slate-700 flex items-center gap-2 text-xs font-bold text-purple-600">
              Configurar Matrizes <ArrowRight size={12}/>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}