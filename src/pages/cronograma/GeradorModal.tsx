import { useState, useEffect, useMemo } from 'react'
import { 
  X, Filter, Calendar, CheckSquare, 
  ArrowRight, ArrowLeft, Save, Briefcase, Clock, AlertTriangle
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import type { Equipamento, Cliente } from '../../types'

interface GeradorModalProps {
  onClose: () => void;
  onGenerated: () => void;
  initialPlanName?: string;
  initialPlanId?: number;
  tenantId: number; // 🚀 INJETADO PELA PAGE
}

export function GeradorModal({ onClose, onGenerated, initialPlanName, initialPlanId, tenantId }: GeradorModalProps) {
  const [step, setStep] = useState(1); 
  const [loading, setLoading] = useState(false);
  const [loadingEquip, setLoadingEquip] = useState(false);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);

  // PASSO 1
  const [form, setForm] = useState({
    nome_cronograma: initialPlanName || '',
    cliente_id: 0,
    solicitante: '',
    tipo_servico: 'Preventiva',
    observacao: ''
  });

  // PASSO 2
  const [filtros, setFiltros] = useState({
    tecnologia: '', modelo: '', tag: '', ns: '', setor: ''
  });
  const [selectedEquipIds, setSelectedEquipIds] = useState<number[]>([]);

  // PASSO 3
  const [regras, setRegras] = useState({
    data_inicio: new Date().toISOString().split('T')[0],
    frequencia: 'Mensal', 
    ocorrencias: 12,
    prazo_dias: 7,
    gerar_os_auto: true
  });

  // Carga Inicial de Clientes BLINDADA
  useEffect(() => {
    const fetchClientes = async () => {
      const { data } = await supabase.from('clientes').select('*').eq('tenant_id', tenantId).order('nome_fantasia');
      if (data) setClientes(data);
    };
    if(tenantId) fetchClientes();
  }, [tenantId]);

  // BUSCA EQUIPAMENTOS BLINDADA E COM HIDRATAÇÃO MANUAL
  useEffect(() => {
    if (form.cliente_id && tenantId) {
      const fetchEquip = async () => {
        setLoadingEquip(true);
        
        // 1. Busca Equipamentos daquele cliente e daquele inquilino
        const { data: eqData } = await supabase
          .from('equipamentos')
          .select('*')
          .eq('cliente_id', form.cliente_id)
          .eq('tenant_id', tenantId);
        
        // 2. Busca Tecnologias do inquilino
        const { data: tecData } = await supabase
          .from('tecnologias')
          .select('id, nome')
          .eq('tenant_id', tenantId);

        if (eqData) {
            // 3. Cruza os dados
            const equipamentosCompletos = eqData.map((eq: any) => ({
                ...eq,
                tecnologias: tecData?.find((t: any) => t.id === eq.tecnologia_id) || { nome: 'N/A' }
            }));
            setEquipamentos(equipamentosCompletos);
        } else {
            setEquipamentos([]);
        }
        setLoadingEquip(false);
      };
      fetchEquip();
    } else {
      setEquipamentos([]);
      setSelectedEquipIds([]);
    }
  }, [form.cliente_id, tenantId]);

  // Filtros em Memória
  const equipamentosFiltrados = useMemo(() => {
    return equipamentos.filter(eq => {
      const tecNome = eq.tecnologias?.nome?.toLowerCase() || '';
      const matchTec = !filtros.tecnologia || tecNome.includes(filtros.tecnologia.toLowerCase());
      const matchMod = !filtros.modelo || eq.modelo?.toLowerCase().includes(filtros.modelo.toLowerCase());
      const matchTag = !filtros.tag || eq.tag?.toLowerCase().includes(filtros.tag.toLowerCase());
      const matchNs  = !filtros.ns || eq.serie?.toLowerCase().includes(filtros.ns.toLowerCase());
      const matchSetor = !filtros.setor || eq.setor?.toLowerCase().includes(filtros.setor.toLowerCase());
      return matchTec && matchMod && matchTag && matchNs && matchSetor;
    });
  }, [equipamentos, filtros]);

  const handleSelectAll = () => {
    if (selectedEquipIds.length === equipamentosFiltrados.length) setSelectedEquipIds([]);
    else setSelectedEquipIds(equipamentosFiltrados.map(e => e.id));
  };

  const toggleSelect = (id: number) => {
    if (selectedEquipIds.includes(id)) setSelectedEquipIds(prev => prev.filter(x => x !== id));
    else setSelectedEquipIds(prev => [...prev, id]);
  };

  const handleGenerate = async () => {
    if (!regras.data_inicio) return alert('Selecione a data de início.');
    if (selectedEquipIds.length === 0) return alert('Selecione pelo menos um equipamento.');
    if (!tenantId) return alert('Erro de sessão.');
    
    setLoading(true);
    try {
      let finalPlanId = initialPlanId;

      if (!finalPlanId) {
         const { data: novoPlano, error: erroPlano } = await supabase
            .from('cronograma_planos')
            .insert([{
               nome: form.nome_cronograma,
               cliente_id: form.cliente_id,
               descricao: `Gerado em ${new Date().toLocaleDateString()}`,
               ativo: true,
               tenant_id: tenantId // 🚀 CARIMBO DO INQUILINO
            }])
            .select()
            .single();

         if (erroPlano) throw new Error(`Erro ao criar Plano: ${erroPlano.message}`);
         finalPlanId = novoPlano.id;
      }

      const payloadBatch = [];
      const hoje = new Date();
      hoje.setHours(0,0,0,0);
      let countOS = 0;

      for (const equipId of selectedEquipIds) {
        let currentDate = new Date(regras.data_inicio);
        currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());

        for (let i = 0; i < regras.ocorrencias; i++) {
          let osGeradaId = null;
          let statusInicial = 'Pendente';

          if (regras.gerar_os_auto && currentDate <= hoje) {
             const { data: novaOS, error: errOS } = await supabase.from('ordens_servico').insert([{
                 equipamento_id: equipId,
                 tipo: form.tipo_servico,
                 status: 'Aberta',
                 prioridade: 'Média',
                 descricao: `[AUTO] Plano: ${form.nome_cronograma}.`,
                 solicitante_nome: form.solicitante || 'Sistema',
                 created_at: new Date().toISOString(),
                 tenant_id: tenantId // 🚀 CARIMBO DO INQUILINO NA OS
             }]).select().single();
             
             if (!errOS && novaOS) {
                osGeradaId = novaOS.id;
                statusInicial = 'Realizada';
                countOS++;
             }
          }

          payloadBatch.push({
            plano_id: finalPlanId,
            equipamento_id: equipId,
            data_programada: currentDate.toISOString().split('T')[0],
            tipo_servico: form.tipo_servico,
            status: statusInicial,
            observacao: `Resp: ${form.solicitante}`,
            prazo_dias: regras.prazo_dias,
            frequencia: regras.frequencia,
            os_gerada_id: osGeradaId,
            tenant_id: tenantId // 🚀 CARIMBO DO INQUILINO NA LINHA DO CRONOGRAMA
          });

          // Avança Data
          switch (regras.frequencia) {
            case 'Diário': currentDate.setDate(currentDate.getDate() + 1); break;
            case 'Semanal': currentDate.setDate(currentDate.getDate() + 7); break;
            case 'Mensal': currentDate.setMonth(currentDate.getMonth() + 1); break;
            case 'Bimestral': currentDate.setMonth(currentDate.getMonth() + 2); break;
            case 'Trimestral': currentDate.setMonth(currentDate.getMonth() + 3); break;
            case 'Quadrimestral': currentDate.setMonth(currentDate.getMonth() + 4); break;
            case 'Semestral': currentDate.setMonth(currentDate.getMonth() + 6); break;
            case 'Anual': currentDate.setFullYear(currentDate.getFullYear() + 1); break;
            case 'Bianual': currentDate.setFullYear(currentDate.getFullYear() + 2); break;
          }
        }
      }

      const { error } = await supabase.from('cronogramas').insert(payloadBatch);
      if (error) throw error;
      
      alert(`Sucesso! ${payloadBatch.length} agendamentos criados.`);
      onGenerated();
      onClose();

    } catch (err: any) {
      alert('ERRO: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn">
        
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="text-blue-600"/> {initialPlanName ? 'Adicionar ao Plano' : 'Gerador de Cronograma'}
            </h2>
            <p className="text-sm text-slate-500">Passo {step} de 3</p>
          </div>
          <button onClick={onClose}><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-900">
          
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="label-bold">Nome do Plano</label>
                     <input className={`input-form ${initialPlanName ? 'bg-slate-100' : ''}`} placeholder="Ex: Preventiva 2025" value={form.nome_cronograma} onChange={e => setForm({...form, nome_cronograma: e.target.value})} disabled={!!initialPlanName} />
                  </div>
                  <div className="space-y-2">
                     <label className="label-bold">Cliente</label>
                     <select className="input-form" value={form.cliente_id} onChange={e => setForm({...form, cliente_id: Number(e.target.value)})}>
                        <option value={0}>Selecione...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="label-bold">Tipo de Serviço</label>
                     <select className="input-form" value={form.tipo_servico} onChange={e => setForm({...form, tipo_servico: e.target.value})}>
                        <option>Preventiva</option><option>Calibração</option><option>Qualificação</option><option>Teste de Segurança</option><option>Corretiva</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="label-bold">Solicitante</label>
                     <input className="input-form" value={form.solicitante} onChange={e => setForm({...form, solicitante: e.target.value})} />
                  </div>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
               <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Filter size={14}/> Filtros Avançados</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                     <input className="input-form text-xs" placeholder="Tecnologia..." value={filtros.tecnologia} onChange={e => setFiltros({...filtros, tecnologia: e.target.value})} />
                     <input className="input-form text-xs" placeholder="Modelo..." value={filtros.modelo} onChange={e => setFiltros({...filtros, modelo: e.target.value})} />
                     <input className="input-form text-xs" placeholder="TAG..." value={filtros.tag} onChange={e => setFiltros({...filtros, tag: e.target.value})} />
                     <input className="input-form text-xs" placeholder="Nº Série..." value={filtros.ns} onChange={e => setFiltros({...filtros, ns: e.target.value})} />
                     <input className="input-form text-xs" placeholder="Setor..." value={filtros.setor} onChange={e => setFiltros({...filtros, setor: e.target.value})} />
                  </div>
               </div>

               <div className="border rounded-xl overflow-hidden dark:border-slate-700 flex flex-col h-80">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 flex justify-between items-center border-b dark:border-slate-700 sticky top-0 z-10">
                     <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{selectedEquipIds.length} selecionados</span>
                     <button onClick={handleSelectAll} className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase">{selectedEquipIds.length === equipamentosFiltrados.length && equipamentosFiltrados.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos'}</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
                     {loadingEquip ? <div className="flex justify-center p-10 text-slate-400">Buscando...</div> : 
                      equipamentosFiltrados.length === 0 ? <div className="p-10 text-center text-slate-400">Nenhum equipamento encontrado.</div> : (
                        <table className="w-full text-sm text-left">
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                              {equipamentosFiltrados.map(eq => (
                                 <tr key={eq.id} onClick={() => toggleSelect(eq.id)} className={`cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition ${selectedEquipIds.includes(eq.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                                    <td className="p-3 w-10 text-center"><div className={`w-4 h-4 rounded border flex items-center justify-center mx-auto ${selectedEquipIds.includes(eq.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>{selectedEquipIds.includes(eq.id) && <CheckSquare size={12} className="text-white"/>}</div></td>
                                    <td className="p-3"><div className="font-bold text-slate-700 dark:text-slate-200">{eq.tecnologias?.nome}</div><div className="text-xs text-slate-400">{eq.modelo}</div></td>
                                    <td className="p-3 text-xs font-mono text-slate-500">TAG: {eq.tag}<br/>NS: {eq.serie}</td>
                                    <td className="p-3 text-xs text-slate-500">{eq.setor || '-'}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     )}
                  </div>
               </div>
            </div>
          )}

          {step === 3 && (
             <div className="space-y-6 animate-fadeIn">
                <div className="bg-blue-50 dark:bg-slate-800/50 p-6 rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col md:flex-row gap-8">
                   <div className="space-y-4 flex-1">
                      <h4 className="font-bold text-slate-700 dark:text-white flex items-center gap-2"><Clock size={18}/> Frequência</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1"><label className="label-bold">Data Início</label><input type="date" className="input-form" value={regras.data_inicio} onChange={e => setRegras({...regras, data_inicio: e.target.value})} /></div>
                         <div className="space-y-1"><label className="label-bold">Ocorrências</label><input type="number" className="input-form" value={regras.ocorrencias} onChange={e => setRegras({...regras, ocorrencias: Number(e.target.value)})} /></div>
                      </div>
                      <div className="space-y-1"><label className="label-bold">Periodicidade</label><select className="input-form" value={regras.frequencia} onChange={e => setRegras({...regras, frequencia: e.target.value})}><option>Mensal</option><option>Bimestral</option><option>Trimestral</option><option>Semestral</option><option>Anual</option></select></div>
                   </div>
                   <div className="w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                   <div className="space-y-4 flex-1">
                      <h4 className="font-bold text-slate-700 dark:text-white flex items-center gap-2"><Briefcase size={18}/> Automação</h4>
                      <div className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${regras.gerar_os_auto ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-sm ring-1 ring-blue-200' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 opacity-70'}`} onClick={() => setRegras({...regras, gerar_os_auto: !regras.gerar_os_auto})}>
                         <input type="checkbox" className="w-5 h-5 accent-blue-600 mt-1" checked={regras.gerar_os_auto} readOnly />
                         <div><span className="font-bold text-sm block text-slate-800 dark:text-white">Abertura Automática</span><span className="text-xs text-slate-500 mt-1 block">Cria a O.S. automaticamente se a data for hoje ou passada.</span></div>
                      </div>
                   </div>
                </div>
             </div>
          )}

        </div>

        <div className="p-6 border-t dark:border-slate-800 flex justify-between bg-slate-50 dark:bg-slate-800 rounded-b-2xl">
           {step > 1 ? <button onClick={() => setStep(step - 1)} className="btn-secondary flex items-center gap-2 px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors font-bold text-slate-600"><ArrowLeft size={18}/> Voltar</button> : <div></div>}
           {step < 3 ? <button onClick={() => { if(step === 1 && (!form.nome_cronograma || !form.cliente_id)) return alert('Preencha os campos obrigatórios'); if(step === 2 && selectedEquipIds.length === 0) return alert('Selecione pelo menos um equipamento'); setStep(step + 1); }} className="btn-primary bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg px-6 py-2 transition-colors flex items-center gap-2">Próximo <ArrowRight size={18}/></button> : <button onClick={handleGenerate} disabled={loading} className="btn-primary bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 px-8 py-2 rounded-lg transition-colors shadow-lg">{loading ? 'Gerando...' : <><Save size={18}/> CONFIRMAR</>}</button>}
        </div>
      </div>
      <style>{`.label-bold { @apply text-xs font-bold uppercase text-slate-500 block mb-1 } .input-form { @apply w-full border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 }`}</style>
    </div>
  )
}