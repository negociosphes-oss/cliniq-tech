import React from 'react';
import { QrCode, Calculator, ClipboardList, MonitorSmartphone, ArrowRight } from 'lucide-react';

export function Arsenal() {
  return (
    <section className="py-24 bg-slate-50" id="funcionalidades">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-16 md:w-2/3">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter">
            O arsenal completo para <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">dominar sua operação.</span>
          </h2>
          <p className="text-lg text-slate-600">
            Esqueça os softwares genéricos. O Atlasum foi forjado com as ferramentas exatas que um prestador de serviços de engenharia clínica precisa para escalar.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
          
          {/* Card 1: QR Code (Ocupa 2 colunas no desktop) */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100 rounded-full blur-[80px] -mr-20 -mt-20 transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6">
                <QrCode className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Rastreabilidade via QR Code</h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                  Gere etiquetas inteligentes. O técnico ou o cliente escaneia o equipamento pelo celular e acessa instantaneamente todo o histórico de OS, manuais e certificados de calibração.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Orçamentos */}
          <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-[50px] transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-cyan-400 mb-6">
                <Calculator className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Orçamentos Integrados</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Aprove orçamentos e controle o faturamento diretamente na Ordem de Serviço. Sem retrabalho, sem perder dinheiro.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Checklists */}
          <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6">
              <ClipboardList className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Checklists Dinâmicos</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Crie rotinas de manutenção preventiva com checklists de validação obrigatória. Garanta o rigor técnico da sua equipe em campo.
            </p>
          </div>

          {/* Card 4: Portal do Cliente (Ocupa 2 colunas no desktop) */}
          <div className="md:col-span-2 p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-[60px] transition-transform group-hover:scale-110"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 h-full">
              <div className="flex-1">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                  <MonitorSmartphone className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Portal do Cliente</h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-md mb-6">
                  Entregue uma área VIP para seus clientes (hospitais e clínicas) abrirem chamados, aprovarem propostas e baixarem relatórios em tempo real.
                </p>
                <a href="#precos" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors">
                  Ver planos compatíveis <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}