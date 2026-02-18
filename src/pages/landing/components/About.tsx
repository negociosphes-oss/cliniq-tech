import React from 'react';
import { Target, Eye, ShieldCheck } from 'lucide-react';

export function About() {
  return (
    <section className="py-24 bg-white border-t border-slate-100" id="sobre">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <span className="text-cyan-600 font-bold tracking-[0.2em] uppercase text-sm mb-4 block">Manifesto Atlasum</span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">
            A inteligência por trás de operações que <span className="text-cyan-600">não podem parar.</span>
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed font-medium">
            A Atlasum nasceu para eliminar a complexidade na gestão de ativos de saúde. Em um setor onde a precisão salva vidas, nossa plataforma transforma o caos das planilhas em um fluxo de trabalho orquestrado e estratégico.
          </p>
        </div>

        {/* Grid de Propósito, Visão e Valores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          
          {/* Propósito */}
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-cyan-600 mb-6 shadow-sm group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-wide">Propósito</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Garantir a máxima disponibilidade e segurança dos ativos tecnológicos através de uma gestão digital impecável e rastreabilidade absoluta.
            </p>
          </div>

          {/* Visão */}
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-cyan-600 mb-6 shadow-sm group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-wide">Visão</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Ser o ecossistema padrão ouro para o gerenciamento de engenharia hospitalar na América Latina, unificando tecnologia e conformidade normativa.
            </p>
          </div>

          {/* DNA */}
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-cyan-600 mb-6 shadow-sm group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-wide">DNA e Valores</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Rigor técnico inegociável, transparência radical e compromisso inabalável com o sucesso e a rentabilidade dos nossos parceiros.
            </p>
          </div>
        </div>

        {/* Diferencial Comercial */}
        <div className="mt-20 p-8 md:p-12 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="text-center md:text-left flex-1">
              <p className="italic text-slate-400 text-lg mb-4">"Diferente de sistemas genéricos, o Atlasum entende a linguagem da manutenção."</p>
              <h4 className="text-2xl font-bold">Da calibração à gestão financeira: escala sem perda de controle.</h4>
            </div>
            <a href="#contato" className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors whitespace-nowrap">
              Ver na prática
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}