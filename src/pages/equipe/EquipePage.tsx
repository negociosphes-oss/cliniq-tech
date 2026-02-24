import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Users, ShieldCheck, FileSignature, Trash2, Edit3, Briefcase, User, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { EquipeHub } from './EquipeHub';

// 🚀 FAREJADOR DE SUBDOMÍNIO
const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') {
      return parts[0];
  }
  return 'admin'; 
};

export function EquipePage() {
  const [equipe, setEquipe] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState<any>(null);
  const [tenantId, setTenantId] = useState<number | null>(null);

  useEffect(() => {
      const init = async () => {
          const slug = getSubdomain();
          
          // 1. Tenta buscar a empresa pelo slug da URL
          let { data } = await supabase
            .from('empresas_inquilinas')
            .select('id')
            .eq('slug_subdominio', slug)
            .maybeSingle();

          // 2. BLINDAGEM: Se não achar (Ex: estamos no localhost como 'admin'), 
          // puxa a primeira empresa cadastrada (Master) para não travar a tela.
          if (!data) {
              const { data: fallbackData } = await supabase
                .from('empresas_inquilinas')
                .select('id')
                .order('id', { ascending: true })
                .limit(1)
                .maybeSingle();
              data = fallbackData;
          }

          if (data) {
              setTenantId(data.id);
              fetchEquipe(data.id);
          } else {
              // Se o banco de empresas estiver totalmente vazio
              setTenantId(-1); 
              setLoading(false);
          }
      };
      init();
  }, []);

  const fetchEquipe = async (tId: number) => {
    if (tId === -1) return; // Trava de segurança
    try {
      setLoading(true);
      // 🔒 BLINDAGEM: Traz apenas técnicos desta empresa
      const { data, error } = await supabase.from('equipe_tecnica').select('*').eq('tenant_id', tId).order('nome');
      if (error) throw error;
      setEquipe(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar equipe:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ATENÇÃO: Remover este técnico apagará também seus certificados. Continuar?')) return;
    await supabase.from('equipe_tecnica').delete().eq('id', id);
    if (tenantId) fetchEquipe(tenantId);
  };

  const handleEdit = (tech: any) => {
    setSelectedTech(tech);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedTech(null);
    setIsModalOpen(true);
  };

  const filtered = useMemo(() => {
    return equipe.filter(t => t.nome?.toLowerCase().includes(busca.toLowerCase()));
  }, [equipe, busca]);

  if (!tenantId) return <div className="p-8 text-center"><Loader2 className="animate-spin text-primary-theme mx-auto" size={32}/></div>;

  return (
    <div className="p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-theme pb-6">
        <div>
          <h2 className="text-3xl font-black text-theme-main flex items-center gap-3">
            <span className="p-3 bg-primary-theme rounded-xl shadow-lg"><Users size={24} className="text-white"/></span>
            Equipe Técnica
          </h2>
          <p className="text-theme-muted font-medium mt-2">Gerenciamento de RH e Certificações.</p>
        </div>
        <button onClick={handleNew} className="h-12 px-6 bg-primary-theme text-white rounded-xl font-black flex items-center gap-2 shadow-lg hover:opacity-90 transition active:scale-95">
            <Plus size={20}/> Novo Técnico
        </button>
      </div>

      {/* BUSCA */}
      <div className="bg-theme-card p-2 rounded-2xl border border-theme shadow-sm mb-8 flex gap-2 items-center max-w-lg">
        <Search className="ml-3 text-theme-muted" size={20}/>
        <input 
            className="w-full h-10 bg-transparent outline-none text-theme-main font-bold placeholder:text-theme-muted" 
            placeholder="Buscar técnico por nome..." 
            value={busca} 
            onChange={e => setBusca(e.target.value)} 
        />
      </div>

      {loading ? (
          <div className="text-center py-12"><Loader2 className="animate-spin text-primary-theme mx-auto" size={40}/></div>
      ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-theme-muted font-bold border-2 border-dashed border-theme rounded-xl bg-theme-page/50">
              Nenhum técnico cadastrado para esta base.
          </div>
      ) : (
          /* GRID DE CARDS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(tech => (
                <div key={tech.id} className="bg-theme-card rounded-3xl border border-theme shadow-sm hover:border-primary-theme transition-all group overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1">
                    
                    <div className="p-6 flex-1 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-2xl bg-theme-page border-4 border-theme flex items-center justify-center text-theme-muted font-black text-2xl shadow-inner mb-4 overflow-hidden relative">
                            {tech.nome ? tech.nome.charAt(0).toUpperCase() : <User/>}
                        </div>
                        
                        <h3 className="font-black text-xl text-theme-main mb-1">{tech.nome}</h3>
                        <span className="px-3 py-1 bg-theme-page text-primary-theme text-[10px] font-black uppercase rounded-lg border border-theme mb-6">
                            {tech.cargo || 'Técnico de Campo'}
                        </span>

                        <div className="w-full space-y-2 mb-6">
                            <div className="flex items-center gap-3 text-xs font-bold text-theme-muted bg-theme-page p-3 rounded-xl border border-theme">
                                <ShieldCheck size={14} className="text-emerald-500"/> 
                                <span className="flex-1 text-left">CREA: {tech.registro_profissional || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-theme-muted bg-theme-page p-3 rounded-xl border border-theme">
                                <FileSignature size={14} className={tech.assinatura_url ? "text-blue-500" : "text-amber-500"}/> 
                                <span className="flex-1 text-left">Assinatura: {tech.assinatura_url ? 'OK' : 'Pendente'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                            <button onClick={() => handleEdit(tech)} className="py-3 bg-theme-page hover:bg-primary-theme hover:text-white text-theme-muted rounded-xl border border-theme font-bold text-xs transition-colors flex items-center justify-center gap-2">
                                <Edit3 size={14}/> EDITAR
                            </button>
                            <button onClick={() => handleDelete(tech.id)} className="py-3 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 rounded-xl border border-rose-100 font-bold text-xs transition-colors flex items-center justify-center gap-2">
                                <Trash2 size={14}/> EXCLUIR
                            </button>
                        </div>
                    </div>

                    {tech.assinatura_url && (
                        <div className="bg-theme-page p-2 border-t border-theme flex justify-center h-16 opacity-50 group-hover:opacity-100 transition-opacity">
                            <img src={tech.assinatura_url} alt="Assinatura" className="h-full object-contain mix-blend-multiply dark:invert"/>
                        </div>
                    )}
                </div>
            ))}
          </div>
      )}

      {isModalOpen && (
        <EquipeHub 
            key={selectedTech ? selectedTech.id : 'new'} 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => { setIsModalOpen(false); if(tenantId) fetchEquipe(tenantId); }} 
            techToEdit={selectedTech}
            tenantId={tenantId} // 🚀 Passando a chave da empresa pro Hub
        />
      )}
    </div>
  );
}