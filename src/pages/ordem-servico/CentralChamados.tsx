import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Zap, CheckCircle2, UserPlus, Play } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export function CentralChamados({ ordens, equipamentos, tecnicos, configEmpresa, clientes, fetchAll, showToast }: any) {
  const [chamadosAbertos, setChamadosAbertos] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState<Record<number, string>>({});

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const abertas = (ordens || []).filter((o: any) => o.status === 'Aberta').map((os: any) => {
        const eq = equipamentos.find((e: any) => e.id === os.equipamento_id) || {};
        const cli = clientes?.find((c: any) => c.id === eq.cliente_id || c.id === os.cliente_id) || {};
        const prioridade = os.prioridade || eq.tecnologia?.prioridade || 'Média';
        
        let horasSLA = 24; 
        
        if (prioridade === 'Crítica') {
            horasSLA = cli.sla_critica_horas || configEmpresa?.sla_critica_horas || 2;
        } else if (prioridade === 'Alta') {
            horasSLA = cli.sla_alta_horas || configEmpresa?.sla_alta_horas || 6;
        } else if (prioridade === 'Média') {
            horasSLA = cli.sla_media_horas || configEmpresa?.sla_media_horas || 24;
        } else if (prioridade === 'Baixa') {
            horasSLA = cli.sla_baixa_horas || configEmpresa?.sla_baixa_horas || 48;
        }

        const dataCriacao = new Date(os.created_at);
        const prazoMaximo = new Date(dataCriacao.getTime() + (horasSLA * 60 * 60 * 1000));
        const diffMinutos = Math.floor((prazoMaximo.getTime() - now.getTime()) / 60000);
        
        return { ...os, equipamento: eq, cliente: cli, prazoMaximo, diffMinutos, horasSLA, dataCriacao };
    }).sort((a: any, b: any) => a.diffMinutos - b.diffMinutos); 

    setChamadosAbertos(abertas);
  }, [ordens, equipamentos, clientes, configEmpresa, now]);

  const handleDespachar = async (os: any) => {
      const tecnicoId = tecnicoSelecionado[os.id];
      if (!tecnicoId) return showToast("Selecione um técnico para despachar a O.S.", "error");

      const tecnicoObj = tecnicos.find((t: any) => String(t.id) === String(tecnicoId));

      try {
          // 🚀 FORÇANDO A CONVERSÃO PARA NÚMERO (Resolve o Erro 400 Bad Request)
          const payloadToUpdate: any = {
              status: 'Em Execução',
              tecnico_id: Number(tecnicoId) 
          };
          
          // Adiciona o nome caso a coluna exista (Evita outro erro 400)
          if (tecnicoObj?.nome) {
              payloadToUpdate.tecnico_nome = tecnicoObj.nome;
          }

          const { error } = await supabase.from('ordens_servico')
              .update(payloadToUpdate)
              .eq('id', os.id);
          
          // 🚀 SE DER ERRO NO BANCO, ELE PULA PRO CATCH E NÃO MOSTRA MENSAGEM FALSA!
          if (error) {
              console.error("ERRO DO SUPABASE:", error);
              throw error;
          }
          
          showToast(`O.S. #${os.id} despachada para ${tecnicoObj?.nome}!`, "success");
          
          // Limpa a seleção após o sucesso
          const newSelecionados = {...tecnicoSelecionado};
          delete newSelecionados[os.id];
          setTecnicoSelecionado(newSelecionados);

          fetchAll(); 
      } catch (err: any) {
          // Se ainda der erro, agora a gente descobre qual é exatamente!
          showToast("Erro ao despachar: " + (err.message || "Verifique o console"), "error");
      }
  };

  const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (chamadosAbertos.length === 0) {
      return (
          <div className="h-[80vh] flex flex-col items-center justify-center animate-fadeIn">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-500 shadow-inner">
                  <CheckCircle2 size={48}/>
              </div>
              <h2 className="text-2xl font-black text-slate-800">Fila Limpa!</h2>
              <p className="text-slate-500 font-medium mt-2">Não há nenhum chamado pendente de triagem no momento.</p>
          </div>
      );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-fadeIn pb-32">
        <div className="mb-8 flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <Zap className="text-amber-500"/> Central de Chamados (Helpdesk)
                </h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Triagem, análise de SLA e despacho de equipes em tempo real.</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Fila Ativa: </span>
                <span className="text-lg font-black text-indigo-600">{chamadosAbertos.length}</span>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap min-w-[1200px]">
                <thead>
                   <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">OS # / Abertura</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status SLA</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Local / Solicitante</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo / Relato</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Despachar Atendimento</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {chamadosAbertos.map(os => {
                        const estourado = os.diffMinutos < 0;
                        const critico = os.diffMinutos >= 0 && os.diffMinutos <= 120;
                        
                        let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        let rowBg = 'hover:bg-slate-50';

                        if (estourado) {
                            badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                            rowBg = 'bg-rose-50/30 hover:bg-rose-50/50';
                        } else if (critico) {
                            badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                        }

                        const horasFormatadas = Math.abs(Math.floor(os.diffMinutos / 60));
                        const minutosFormatados = Math.abs(os.diffMinutos % 60);
                        const tempoTexto = estourado 
                            ? `Atraso: ${horasFormatadas}h ${minutosFormatados}m` 
                            : `Restam: ${horasFormatadas}h ${minutosFormatados}m`;

                        return (
                            <tr key={os.id} className={`transition-colors ${rowBg}`}>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-black text-slate-800">#{os.id}</div>
                                    <div className="text-[11px] font-bold text-slate-500 mt-1">{formatDate(os.dataCriacao)}</div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex flex-col items-start gap-1.5">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border flex items-center gap-1.5 ${badgeColor}`}>
                                            {estourado ? <AlertTriangle size={12}/> : <Clock size={12}/>}
                                            {estourado ? 'EM ATRASO' : 'NO PRAZO'}
                                        </span>
                                        <div className="text-[11px] font-bold text-slate-600">{tempoTexto}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase">Acordo: {os.horasSLA}h | Limite: {formatDate(os.prazoMaximo)}</div>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{os.equipamento?.nome || os.equipamento?.tecnologia?.nome || 'Equipamento'}</div>
                                    <div className="text-[11px] font-bold text-blue-600 uppercase mt-1">TAG: {os.equipamento?.tag || '-'}</div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{os.cliente?.nome_fantasia || 'Hospital Interno'}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{os.solicitante_nome || 'Sem solicitante'}</div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="text-xs font-medium text-slate-600 max-w-[250px] truncate" title={os.defeito_relatado}>
                                        "{os.defeito_relatado || 'Sem descrição.'}"
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-slate-400 mt-1 flex items-center gap-1">
                                        <AlertTriangle size={10} className={os.prioridade === 'Crítica' ? 'text-rose-500' : ''}/> 
                                        PRIORIDADE: <span className={os.prioridade === 'Crítica' ? 'text-rose-600' : 'text-slate-600'}>{os.prioridade || 'Média'}</span>
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-right pr-6">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="relative">
                                            <UserPlus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                            <select 
                                                className="w-48 h-10 pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 shadow-sm"
                                                value={tecnicoSelecionado[os.id] || ''}
                                                onChange={(e) => setTecnicoSelecionado({...tecnicoSelecionado, [os.id]: e.target.value})}
                                            >
                                                <option value="">Atribuir Técnico...</option>
                                                {tecnicos.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                            </select>
                                        </div>
                                        <button 
                                            onClick={() => handleDespachar(os)}
                                            className="h-10 px-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                                        >
                                            <Play size={14}/> INICIAR
                                        </button>
                                    </div>
                                </td>

                            </tr>
                        )
                   })}
                </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}