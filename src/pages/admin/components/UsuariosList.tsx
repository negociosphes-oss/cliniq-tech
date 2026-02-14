import { useState } from 'react';
import { ShieldCheck, MoreHorizontal, Mail, Plus, UserPlus, Key } from 'lucide-react';
import { UsuarioFormModal } from './UsuarioFormModal';

export function UsuariosList() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="animate-fadeIn space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
                <h3 className="font-bold text-lg text-slate-800">Equipe Logada</h3>
                <p className="text-xs text-slate-500 mt-0.5">Gerencie quem tem acesso ao painel do sistema.</p>
            </div>
            <div className="flex gap-2">
                <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                    Exportar Lista
                </button>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <UserPlus size={16}/> Convidar Usuário
                </button>
            </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        <tr>
                            <th className="p-4 pl-6">Nome / E-mail</th>
                            <th className="p-4">Nível de Acesso</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        
                        <tr className="hover:bg-slate-50 transition-colors group">
                            <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">PE</div>
                                    <div>
                                        <p className="font-bold text-slate-800">Pedro Euclides</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10}/> pedro@atlas.com</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-md w-max border border-indigo-100">
                                    <Key size={12}/> Administrador Master
                                </span>
                            </td>
                            <td className="p-4">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md w-max border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                                </span>
                            </td>
                            <td className="p-4 text-right"><button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><MoreHorizontal size={18}/></button></td>
                        </tr>

                        <tr className="hover:bg-slate-50 transition-colors group">
                            <td className="p-4 pl-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-sm shadow-sm">PS</div>
                                    <div>
                                        <p className="font-bold text-slate-800">Pedro Santana</p>
                                        <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10}/> psantana@atlas.com</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-md w-max border border-slate-200">
                                    <ShieldCheck size={12}/> Técnico / Gestor
                                </span>
                            </td>
                            <td className="p-4">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md w-max border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                                </span>
                            </td>
                            <td className="p-4 text-right"><button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><MoreHorizontal size={18}/></button></td>
                        </tr>

                    </tbody>
                </table>
            </div>
        </div>

        <p className="text-center text-xs text-slate-400 pt-4">A conexão real de envio de e-mails será feita via API Supabase Auth na fase de Integração Backend.</p>

        {/* Renderiza o Modal */}
        <UsuarioFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}