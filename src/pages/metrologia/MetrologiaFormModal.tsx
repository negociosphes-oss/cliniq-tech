import { useState, useEffect } from 'react';
import { X, Save, Scale, Activity, Loader2, UserCheck, User, Plus, Trash2 } from 'lucide-react'; 
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
      // Carrega dependências apontando para a tabela correta 'equipe_tecnica'
      const [tecs, pops, padroes] = await Promise.all([
        supabase.from('equipe_tecnica').select('*').order('nome'), 
        supabase.from('metrologia_procedimentos').select('*').eq('status', 'ATIVO'),
        supabase.from('padroes').select('*').neq('status', 'Excluido')
      ]);

      setListaTecnicos(tecs.data || []);
      setListaPops(pops.data || []);
      setListaPadroes(padroes.data || []);

      if (osId) {
        // Carrega Execução com a estrutura nova
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

          // Busca Vínculos dos Padrões (Analisadores)
          const { data: links } = await supabase
            .from('os_metrologia_padroes')
            .select('padrao_id')
            .eq('execucao_id', execucao.id);
          
          if (links && links.length > 0 && padroes.data) {
             const ids = links.map((l: any) => l.padrao_id);
             const selecionados = padroes.data.filter((p: any) => ids.includes(p.id));
             setPadroesSelecionados(selecionados);
          }

          // Mapeia os itens do banco para o formato de tela do React
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

      // 1. PACOTE CABEÇALHO (Ajustado perfeitamente para o novo Banco de Dados)
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
        // Atualiza e limpa os itens velhos para inserir os novos
        await supabase.from('os_metrologia_execucoes').update(header).eq('id', execId);
        await supabase.from('os_metrologia_itens').delete().eq('execucao_id', execId);
        await supabase.from('os_metrologia_padroes').delete().eq('execucao_id', execId);
      } else {
        // Cria uma nova execução
        const { data: novo, error: errH } = await supabase.from('os_metrologia_execucoes').insert(header).select().single();
        if(errH) throw new Error("Erro Cabeçalho: " + errH.message);
        execId = novo.id;
      }

      // Salva os Padrões (Analisadores)
      if (padroesSelecionados.length > 0) {
        const padroesPayload = padroesSelecionados.map(p => ({ 
            execucao_id: execId, 
            padrao_id: p.id,
            data_validade_no_uso: p.data_vencimento || null 
        }));
        
        await supabase.from('os_metrologia_padroes').insert(padroesPayload);
      }
      
      // 2. PACOTE ITENS (Ajustado com os nomes exatos das colunas do DB)
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
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl rounded-2xl shadow-2xl flex flex-col max-h-[98vh] overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* HEADER MODAL */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg"><Scale size={24}/></div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">ATLAS 1 <span className="text-indigo-600">Enterprise</span></h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Execução de Calibração</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X size={24}/></button>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-100 dark:bg-black/20 custom-scrollbar">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-wider"><Activity size={14}/> Analisadores Utilizados</label>
              <div className="flex gap-2 mb-4">
                <select value={padraoInputId} onChange={e => setPadraoInputId(e.target.value)} className="flex-1 h-12 bg-slate-50 border border-slate-300 rounded-xl px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">+ Selecionar Padrão...</option>
                  {listaPadroes.map(p => (<option key={p.id} value={p.id}>{p.nome} (SN: {p.n_serie})</option>))}
                </select>
                <button onClick={adicionarPadrao} className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors"><Plus size={20}/></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {padroesSelecionados.length === 0 && <span className="text-xs text-slate-400 italic p-2">Nenhum analisador vinculado.</span>}
                {padroesSelecionados.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-sm font-bold text-indigo-800 shadow-sm">
                    <span className="flex flex-col">
                        <span>{p.nome}</span>
                        <span className="text-[10px] text-indigo-500 uppercase tracking-wider mt-0.5">Val: {formatDateSafe(p.data_vencimento)}</span>
                    </span>
                    <button onClick={() => setPadroesSelecionados(prev => prev.filter(x => x.id !== p.id))} className="text-indigo-400 hover:text-rose-500 transition-colors ml-2"><X size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-wider"><Activity size={14}/> Ambiente</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Temp (°C)</label>
                    <input type="number" value={temperatura} onChange={e => setTemperatura(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-300 rounded-xl text-center font-black text-indigo-600 text-lg outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"/>
                </div>
                <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Umid (%)</label>
                    <input type="number" value={umidade} onChange={e => setUmidade(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-300 rounded-xl text-center font-black text-indigo-600 text-lg outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"/>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><User size={14}/> Técnico Executante</label>
              <select value={executorId} onChange={e => setExecutorId(e.target.value)} className="w-full h-12 border border-slate-300 rounded-xl px-4 bg-slate-50 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                <option value="">Selecione na lista...</option>
                {listaTecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><UserCheck size={14}/> Responsável Técnico</label>
              <select value={responsavelId} onChange={e => setResponsavelId(e.target.value)} className="w-full h-12 border border-slate-300 rounded-xl px-4 bg-slate-50 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                <option value="">Selecione na lista...</option>
                {listaTecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
               <div className="flex-1">
                 <select onChange={e => { if(e.target.value) adicionarItensDoPop(Number(e.target.value)); e.target.value=''; }} className="w-full h-12 border border-slate-300 rounded-xl px-4 bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">+ Adicionar Procedimento (POP)...</option>
                    {listaPops.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                 </select>
               </div>
               {itens.length > 0 && (
                   <button onClick={() => setItens([])} className="text-rose-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-rose-50 px-4 py-3 rounded-xl transition-colors border border-transparent hover:border-rose-200">
                       <Trash2 size={16}/> Limpar Testes
                   </button>
               )}
            </div>

            {itens.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-900 font-bold uppercase text-slate-500 text-[11px] tracking-wider border-b border-slate-200">
                        <tr>
                            <th className="p-4 pl-6 border-r border-slate-200 w-1/2">Descrição do Teste</th>
                            <th className="p-4 text-center border-r border-slate-200">Referência</th>
                            <th className="p-4 text-center w-40 border-r border-slate-200">Valor Lido</th>
                            <th className="p-4 text-center w-32">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {itens.map((i, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-800 border-r border-slate-100">{i.descricao}</td>
                            <td className="p-4 text-center border-r border-slate-100">
                                <div className="font-mono bg-slate-100 inline-block px-3 py-1 rounded text-slate-600 font-bold border border-slate-200">{i.valor_referencia}</div>
                            </td>
                            <td className="p-4 border-r border-slate-100">
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    value={i.lido} 
                                    onChange={e => handleValorChange(idx, e.target.value)} 
                                    className={`w-full border rounded-lg text-center h-10 font-black text-base outline-none focus:ring-4 transition-all shadow-inner ${i.conforme ? 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10' : 'border-rose-400 bg-rose-50 text-rose-600 focus:border-rose-500 focus:ring-rose-500/20'}`}
                                />
                            </td>
                            <td className="p-4 text-center">
                                {i.lido && (i.conforme ? 
                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest border border-emerald-200">Aprovado</span> 
                                    : <span className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest border border-rose-200">Reprovado</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-3">Observações Finais</label>
            <textarea 
                className="w-full min-h-[80px] bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner" 
                value={observacoes} 
                onChange={e => setObservacoes(e.target.value)} 
                placeholder="Anotações adicionais sobre o serviço realizado..."
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-200 bg-white dark:bg-slate-900 flex justify-end gap-3 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-10">
          <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancelar Operação</button>
          <button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-transform active:scale-95 text-sm">
            {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Confirmar e Salvar
          </button>
        </div>
      </div>
    </div>
  );
}