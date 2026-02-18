import React from 'react';
import { ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react';

export function Hero() {
  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden relative bg-slate-900 min-h-screen flex items-center">
      {/* Fundo escuro com ruído e gradiente */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')] opacity-5 bg-cover bg-center mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/80"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* LADO ESQUERDO: Textos e Botões */}
          <div className="flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-cyan-900/50 text-cyan-400 text-xs font-bold mb-8 uppercase tracking-widest backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
              O Futuro da Engenharia Clínica
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-[1.1]">
              Controle total da sua operação em uma <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">única tela.</span>
            </h1>
            
            <p className="max-w-xl text-lg md:text-xl text-slate-400 mb-10 leading-relaxed font-medium">
              Automatize ordens de serviço, rastreabilidade de ativos e indicadores de desempenho com a plataforma mais moderna do mercado.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href="#contato" className="px-8 py-4 text-base font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 hover:-translate-y-1">
                Agendar Demonstração <ArrowRight className="h-5 w-5" />
              </a>
              <div className="flex items-center gap-3 px-6 py-4 text-sm font-bold text-slate-300">
                <ShieldCheck className="h-5 w-5 text-cyan-500" />
                Adequado às normas RBC
              </div>
            </div>
          </div>

          {/* LADO DIREITO: Mockup do Sistema e KPIs */}
          <div className="relative mt-12 lg:mt-0 w-full max-w-2xl mx-auto lg:ml-auto">
            {/* Efeito de Brilho no Fundo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none"></div>
            
            {/* Imagem do Dashboard (Substitua depois pelo print do SEU sistema) */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-cyan-900/50 transform transition-transform hover:scale-[1.02] duration-500">
              <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000" 
                alt="Dashboard do Sistema" 
                className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Card de KPI Flutuante */}
            <div className="absolute -bottom-6 -left-6 lg:-left-12 bg-white p-5 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4 animate-bounce-in hidden sm:flex">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">OS Concluídas</p>
                <p className="text-2xl font-black text-slate-900">+4.200</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}