import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';

const CARGOS = ['administrativo', 'gestor', 'tecnico', 'usuario', 'cliente'];
const MODULOS = [
    { id: 'indicadores', label: 'BI & Analytics' },
    { id: 'financeiro', label: 'Fluxo de Caixa' },
    { id: 'metrologia', label: 'LIMS Metrologia' },
    { id: 'orcamentos', label: 'Vendas & Propostas' },
    { id: 'equipe', label: 'Gestão de Equipe' },
    { id: 'configuracoes', label: 'Configurações de Sistema' },
    { id: 'tecnologias', label: 'Padrões & Modelos' },
    { id: 'checklists', label: 'Smart Checklists' }
];

export function PermissoesCargos() {
    const [permissoes, setPermissoes] = useState<any[]>([]);
    const [tenantId, setTenantId] = useState<number | null>(null);

    // Fareja a URL para achar o Inquilino Atual
    useEffect(() => {
        const getTenant = async () => {
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            let slug = 'admin';
            if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') {
                slug = parts[0];
            }
            const { data } = await supabase.from('empresas_inquilinas').select('id').eq('slug_subdominio', slug).maybeSingle();
            if (data) setTenantId(data.id);
        };
        getTenant();
    }, []);

    useEffect(() => {
        if (tenantId) fetchPerms();
    }, [tenantId]);

    const fetchPerms = async () => {
        const { data } = await supabase.from('tenant_permissoes').select('*').eq('tenant_id', tenantId);
        setPermissoes(data || []);
    };

    const togglePermissao = async (cargo: string, modulo: string, atual: boolean) => {
        if (!tenantId) return;
        
        const { error } = await supabase.from('tenant_permissoes').upsert({
            tenant_id: tenantId,
            nivel_acesso: cargo,
            modulo_id: modulo,
            permitido: !atual
        }, { onConflict: 'tenant_id,nivel_acesso,modulo_id' });

        if (!error) fetchPerms();
    };

    if (!tenantId) return <div className="p-8 text-center text-theme-muted">Carregando módulo de segurança...</div>;

    return (
        <div className="bg-theme-card rounded-3xl border border-theme shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-theme flex items-center justify-between bg-theme-page/50">
                <div>
                    <h3 className="text-lg font-black text-theme-main flex items-center gap-2">
                        <Shield className="text-primary-theme" size={20}/> Matriz de Acessos por Cargo
                    </h3>
                    <p className="text-xs text-theme-muted font-medium uppercase tracking-wider mt-1">Defina quais módulos cada nível de acesso pode visualizar no menu</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-theme-page">
                            <th className="p-4 text-[10px] font-black uppercase text-theme-muted tracking-widest border-b border-theme">Módulo / Função</th>
                            {CARGOS.map(cargo => (
                                <th key={cargo} className="p-4 text-[10px] font-black uppercase text-theme-main tracking-widest border-b border-theme text-center">{cargo}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {MODULOS.map(mod => (
                            <tr key={mod.id} className="hover:bg-theme-page/50 transition-colors border-b border-theme/50 last:border-0">
                                <td className="p-4">
                                    <span className="text-sm font-bold text-theme-main">{mod.label}</span>
                                </td>
                                {CARGOS.map(cargo => {
                                    const perm = permissoes.find(p => p.nivel_acesso === cargo && p.modulo_id === mod.id);
                                    const isAllowed = perm?.permitido || false;
                                    return (
                                        <td key={cargo} className="p-4 text-center">
                                            <button 
                                                onClick={() => togglePermissao(cargo, mod.id, isAllowed)}
                                                className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${isAllowed ? 'bg-emerald-500/10 text-emerald-500 shadow-sm' : 'bg-theme-page text-theme-muted opacity-40 hover:opacity-100 hover:text-rose-500'}`}
                                            >
                                                {isAllowed ? <CheckCircle2 size={20} strokeWidth={2.5} /> : <XCircle size={20} />}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}