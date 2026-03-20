import { useState, useEffect } from 'react';
import { X, Save, Scale, Activity, Loader2, UserCheck, User, Plus, Trash2, Thermometer, Droplets, Info } from 'lucide-react'; 
import { supabase } from '../../supabaseClient';
import { format, parseISO, isValid } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  osId: number; 
  equipamentoId: number;
}

export function MetrologiaFormModal({ isOpen, onClose, onSuccess, osId, equipamentoId }: Props) {
  const [loading, setLoading] = useState(false);
  
  // Header
  const [temperatura, setTemperatura] = useState('22');
  const [umidade, setUmidade] = useState('55');
  const [responsavelId, setResponsavelId] = useState('');
  const [executorId, setExecutorId] = useState('');

  // Listas
  const [listaPadroes, setListaPadroes] = useState<any[]>([]);
  const [listaPops, setListaPops] = useState<any[]>([]);
  const [listaTecnicos, setListaTecnicos] = useState<any[]>([]);

  // Estado Local
  const [padroesSelecionados, setPadroesSelecionados] = useState<any[]>([]);
  const [padraoInputId, setPadraoInputId] = useState('');
  const [itens, setItens] = useState<any[]>([]);
  const [observacoes, setObservacoes] = useState('');

  const formatDateSafe = (d: any) => isValid(parseISO(d)) ? format(parseISO(d), 'dd/MM/yyyy') : '-';

  useEffect(() => {
    if (isOpen) carregarDadosIniciais();
  }, [isOpen]);

  const carregarDadosIniciais = async () => {
    try {
      const [tecs, pops, padroes] = await Promise.all([
        supabase.from('equipe_tecnica').select('*').order('nome'), 
        supabase.from('metrologia_procedimentos').select('*').eq('status', 'ATIVO'),
        supabase.from('padroes').select('*').neq('status', 'Excluido')
      ]);

      setListaTecnicos(tecs.data || []);
      setListaPops(pops.data || []);
      setListaPadroes(padroes.data || []);

      if (osId) {
        const { data: execucao } = await supabase
          .from('os_metrologia_execucoes')
          .select('*, itens:os_metrologia_itens(*)')
          .eq('ordem_servico_id', osId)
          .maybeSingle();

        if (execucao) {
          setTemperatura('22');
          setUmidade('55');
          setObservacoes(execucao.observacoes_gerais || '');
          setResponsavelId(String(execucao.id_tecnico_responsavel || ''));
          setExecutorId(String(execucao.id_tecnico_executor || ''));

          const { data: links } = await supabase
            .from('os_metrologia_padroes')
            .select('padrao_id')
            .eq('execucao_id', execucao.id);
          
          if (links && links.length > 0 && padroes.data) {
             const ids = links.map((l: any) => l.padrao_id);
             const selecionados = padroes.data.filter((p: any) => ids.includes(p.id));
             setPadroesSelecionados(selecionados);
          }

          if (execucao.itens) {
            const itensFormat = execucao.itens.sort((a: any, b: any) => a.ordem - b.ordem).map((i: any) => ({
              secao: 'Geral',
              descricao: i.descricao_teste,
              unidade: i.unidade,
              valor_referencia: i.valor_referencia_numeric,
              limite_min: i.limite_minimo,
              limite_max: i.limite_maximo,
              lido: i.valor_medido ?? '',
              conforme: i.resultado === 'APROVADO',
              erro: (i.valor_medido && i.valor_referencia_numeric) ? (i.valor_medido - i.valor_referencia_numeric) : 0
            }));
            setItens(itensFormat);
          }
        } else if (equipamentoId) {
           sugerirPop(equipamentoId, pops.data || []);
        }
      }
    } catch (e) { console.error(e); }
  };

  const sugerirPop = async (eqId: number, todosPops: any[]) => {
    const { data: equip } = await supabase.from('equipamentos').select('tecnologia_id').eq('id', eqId).maybeSingle();
    if (equip?.tecnologia_id) {
      const popSugerido = todosPops.find(p => p.tecnologia_id === equip.tecnologia_id);
      if (popSugerido) adicionarItensDoPop(popSugerido.id);
    }
  };

  const adicionarPadrao = (e?: any) => {
    if(e) e.preventDefault();
    if (!padraoInputId) return;
    const p = listaPadroes.find(x => x.id === Number(padraoInputId));
    if (p && !padroesSelecionados.find(x => x.id === p.id)) {
      setPadroesSelecionados([...padroesSelecionados, p]);
    }
    setPadraoInputId('');
  };

  const adicionarItensDoPop = async (idPop: number) => {
    const { data } = await supabase.from('metrologia_procedimento_itens').select('*').eq('procedimento_id', idPop).order('ordem');
    if (data) {
      setItens(prev => [...prev, ...data.map((i: any) => ({
        secao: i.secao || 'Geral', 
        descricao: i.titulo_item, 
        unidade: i.unidade,
        valor_referencia: Number(i.valor_referencia),
        limite_min: Number(i.valor_referencia) - Number(i.tolerancia_menos),
        limite_max: Number(i.valor_referencia) + Number(i.tolerancia_mais),
        incerteza_k: 2, 
        lido: '', 
        conforme: true, 
        erro: 0
      }))]);
    }
  };

  const handleValorChange = (idx: number, val: string) => {
    const novos = [...itens];
    novos[idx].lido = val;
    if (val !== '' && !isNaN(Number(val))) {
      const v = Number(val);
      const ref = Number(novos[idx].valor_referencia);
      novos[idx].erro = v - ref;
      if (novos[idx].limite_min !== null) {
        novos[idx].conforme = v >= novos[idx].limite_min && v <= novos[idx].limite_max;
      }
    }
    setItens(novos);
  };

  const safeNum = (val: any) => {
    if (val === '' || val === null || val === undefined) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  const handleSubmit = async () => {
    if (padroesSelecionados.length === 0) return alert("ERRO: Selecione os Analisadores.");
    if (!responsavelId || !executorId) return alert("ERRO: Selecione a equipe técnica.");
    
    setLoading(true);
    try {
      let statusCalculado = 'FINALIZADO';
      const temLeitura = itens.some(i => i.lido !== '' && i.lido !== null);
      if (temLeitura) {
          const temFalha = itens.some(i => !i.conforme);
          statusCalculado = temFalha ? 'REPROVADO' : 'APROVADO';
      }

      const header = {
        ordem_servico_id: osId,
        id_tecnico_responsavel: safeNum(responsavelId),
        id_tecnico_executor: safeNum(executorId),
        data_inicio: new Date().toISOString(),
        data_conclusao: new Date().toISOString(),
        status_execucao: statusCalculado,
        observacoes_gerais: observacoes
      };

      const { data: existing } = await supabase.from('os_metrologia_execucoes').select('id').eq('ordem_servico_id', osId).maybeSingle();
      let execId = existing?.id;

      if (execId) {
        await supabase.from('os_metrologia_execucoes').update(header).eq('id', execId);
        await supabase.from('os_metrologia_itens').delete().eq('execucao_id', execId);
        await supabase.from('os_metrologia_padroes').delete().eq('execucao_id', execId);
      } else {
        const { data: novo, error: errH } = await supabase.from('os_metrologia_execucoes').insert(header).select().single();
        if(errH) throw new Error("Erro Cabeçalho: " + errH.message);
        execId = novo.id;
      }

      if (padroesSelecionados.length > 0) {
        const padroesPayload = padroesSelecionados.map(p => ({ 
            execucao_id: execId, 
            padrao_id: p.id,
            data_validade_no_uso: p.data_vencimento || null 
        }));
        
        await supabase.from('os_metrologia_padroes').insert(padroesPayload);
      }
      
      if (itens.length > 0) {
          const itensPayload = itens.map((i, idx) => ({
            execucao_id: execId,
            ordem: idx + 1,
            descricao_teste: i.descricao,
            unidade: i.unidade,
            valor_referencia_numeric: safeNum(i.valor_referencia),
            limite_minimo: safeNum(i.limite_min),
            limite_maximo: safeNum(i.limite_max),
            valor_medido: safeNum(i.lido),
            resultado: i.conforme ? 'APROVADO' : 'REPROVADO'
          }));

          const { error: errI } = await supabase.from('os_metrologia_itens').insert(itensPayload);
          if(errI) throw new Error("Erro Itens: " + errI.message);
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      alert('Erro ao salvar: ' + e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[5000] flex items-center justify-center sm:p-4">
      {/* 🚀 MOBILE: Ocupa toda a tela | DESKTOP: Modal centralizado com bordas arredondadas */}
      <div className="bg-slate-50 dark:bg-slate-900 w-full h-full sm:h-auto sm:max-w-6xl sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[95vh] overflow-hidden border border-slate-200 dark:border-slate-800 animate-slideUp">
        
        {/* HEADER FIXO */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-indigo-600 text-white rounded-xl shadow-lg"><Scale size={20} className="sm:w-6 sm:h-6" /></div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">ATLAS 1 <span className="text-indigo-600">Enterprise</span></h2>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execução de Calibração</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-100 hover:text-rose-600 rounded-full text-slate-400 transition-colors active:scale-90"><X size={24}/></button>
        </div>

        {/* ÁREA DE ROLAGEM */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-100 dark:bg-black/20 custom-scrollbar pb-32 sm:pb-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            
            {/* ANALISADORES */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-wider"><Activity size={14}/> Analisadores Utilizados</label>
              <div className="flex gap-2 mb-4">
                <select value={padraoInputId} onChange={e => setPadraoInputId(e.target.value)} className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">+ Selecionar Padrão...</option>
                  {listaPadroes.map(p => (<option key={p.id} value={p.id}>{p.nome} (SN: {p.n_serie})</option>))}
                </select>
                <button onClick={adicionarPadrao} className="px-4 sm:px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-transform active:scale-95"><Plus size={20}/></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {padroesSelecionados.length === 0 && <span className="text-xs text-slate-400 italic p-2">Nenhum analisador vinculado.</span>}
                {padroesSelecionados.map(p => (
                  <div key={p.id} className="flex items-center justify-between w-full sm:w-auto gap-3 bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-sm font-bold text-indigo-800 shadow-sm">
                    <span className="flex flex-col">
                        <span>{p.nome}</span>
                        <span className="text-[10px] text-indigo-500 uppercase tracking-wider mt-0.5">Val: {formatDateSafe(p.data_vencimento)}</span>
                    </span>
                    <button onClick={() => setPadroesSelecionados(prev => prev.filter(x => x.id !== p.id))} className="text-indigo-400 hover:text-rose-500 transition-colors sm:ml-2"><X size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* AMBIENTE */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-wider">Ambiente</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1"><Thermometer size={12} className="text-rose-500"/> Temp (°C)</label>
                    <input type="number" value={temperatura} onChange={e => setTemperatura(e.target.value)} className="w-full h-12 sm:h-14 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-indigo-600 text-lg outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"/>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1"><Droplets size={12} className="text-blue-500"/> Umid (%)</label>
                    <input type="number" value={umidade} onChange={e => setUmidade(e.target.value)} className="w-full h-12 sm:h-14 bg-slate-50 border border-slate-200 rounded-xl text-center font-black text-blue-600 text-lg outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"/>
                </div>
              </div>
            </div>
          </div>

          {/* EQUIPE */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><User size={14}/> Técnico Executante</label>
              <select value={executorId} onChange={e => setExecutorId(e.target.value)} className="w-full h-12 border border-slate-200 rounded-xl px-4 bg-slate-50 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                <option value="">Selecione na lista...</option>
                {listaTecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><UserCheck size={14}/> Responsável Técnico</label>
              <select value={responsavelId} onChange={e => setResponsavelId(e.target.value)} className="w-full h-12 border border-slate-200 rounded-xl px-4 bg-slate-50 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                <option value="">Selecione na lista...</option>
                {listaTecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          </div>

          {/* PROCEDIMENTOS (POP) E TABELA */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
               <div className="w-full sm:flex-1">
                 <select onChange={e => { if(e.target.value) adicionarItensDoPop(Number(e.target.value)); e.target.value=''; }} className="w-full h-12 border border-slate-200 rounded-xl px-4 bg-slate-50 text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">+ Adicionar Procedimento (POP)...</option>
                    {listaPops.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                 </select>
               </div>
               {itens.length > 0 && (
                   <button onClick={() => setItens([])} className="w-full sm:w-auto text-rose-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-rose-50 px-4 py-3 rounded-xl transition-colors border border-rose-100 sm:border-transparent sm:hover:border-rose-200">
                       <Trash2 size={16}/> Limpar Testes
                   </button>
               )}
            </div>

            {itens.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* 🚀 O SEGREDO DO MOBILE ESTÁ AQUI: overflow-x-auto */}
                <div className="overflow-x-auto w-full custom-scrollbar">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-slate-50 font-black uppercase text-slate-400 text-[10px] tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="p-4 pl-6 border-r border-slate-100 w-1/2">Descrição do Teste</th>
                                <th className="p-4 text-center border-r border-slate-100">Referência</th>
                                <th className="p-4 text-center w-48 border-r border-slate-100">Valor Lido</th>
                                <th className="p-4 text-center w-32">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {itens.map((i, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-6 font-bold text-slate-800 border-r border-slate-50">{i.descricao}</td>
                                <td className="p-4 text-center border-r border-slate-50">
                                    <div className="font-mono bg-slate-100 inline-block px-3 py-1.5 rounded-lg text-slate-600 font-black border border-slate-200 text-base">{i.valor_referencia}</div>
                                </td>
                                <td className="p-4 border-r border-slate-50">
                                    {/* 🚀 Input gigante para o dedo do técnico não errar */}
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={i.lido} 
                                        onChange={e => handleValorChange(idx, e.target.value)} 
                                        placeholder="Digitar..."
                                        className={`w-full border-2 rounded-2xl text-center h-14 font-black text-xl outline-none focus:ring-4 transition-all shadow-inner ${i.conforme ? 'border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-indigo-500/10' : 'border-rose-300 bg-rose-50 text-rose-600 focus:border-rose-500 focus:ring-rose-500/20 focus:bg-white'}`}
                                    />
                                </td>
                                <td className="p-4 text-center">
                                    {i.lido && (i.conforme ? 
                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> OK</span> 
                                        : <span className="bg-rose-100 text-rose-700 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Falha</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Dica para o técnico no mobile */}
                <div className="p-3 bg-indigo-50 text-center sm:hidden border-t border-indigo-100">
                    <p className="text-[10px] text-indigo-500 font-black uppercase flex items-center justify-center gap-2"><Info size={14}/> Deslize a tabela para os lados</p>
                </div>
                
                </div>
            )}
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">Observações Finais</label>
            <textarea 
                className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-inner transition-all" 
                value={observacoes} 
                onChange={e => setObservacoes(e.target.value)} 
                placeholder="Anotações adicionais sobre o serviço realizado..."
            />
          </div>
        </div>

        {/* 🚀 FOOTER FIXO (Bottom Bar) PARA O BOTÃO NUNCA SUMIR */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-end gap-3 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-20">
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-colors text-sm order-2 sm:order-1">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-transform active:scale-95 text-sm order-1 sm:order-2">
            {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} CONFIRMAR E SALVAR
          </button>
        </div>
      </div>
    </div>
  );
}