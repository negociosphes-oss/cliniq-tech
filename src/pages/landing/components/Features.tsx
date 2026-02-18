import React from 'react';
import { ClipboardList, Wrench, BarChart3, ShieldCheck } from 'lucide-react';

export function Features() {
  return (
    <section className="py-24 bg-slate-50 border-t border-slate-200" id="solucoes">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-cyan-600 font-bold tracking-widest uppercase text-sm mb-4 block">Nossas Soluções</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">Controle total da sua operação técnica</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all">
            <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6">
              <ClipboardList className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Gestão de OS Inteligente</h3>
            <p className="text-slate-600 leading-relaxed">Abertura, acompanhamento e encerramento de Ordens de Serviço em tempo real. Digitalize relatórios, colete assinaturas e padronize o seu fluxo de atendimento.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all">
            <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6">
              <Wrench className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Controle de Ativos e Metrologia</h3>
            <p className="text-slate-600 leading-relaxed">Cadastro completo de equipamentos, histórico de intervenções e alertas automáticos para calibrações e manutenções preventivas, garantindo segurança RBC.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all">
            <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Conformidade e Auditoria</h3>
            <p className="text-slate-600 leading-relaxed">Rastreabilidade completa das ações executadas. Esteja sempre preparado para auditorias e certifique-se de que a sua operação cumpre as normas de saúde.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all">
            <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6">
              <BarChart3 className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Métricas e Financeiro</h3>
            <p className="text-slate-600 leading-relaxed">Indicadores de desempenho e faturamento integrados à operação. Transforme dados técnicos em decisões financeiras lucrativas para a sua empresa.</p>
          </div>
        </div>
      </div>
    </section>
  );
}