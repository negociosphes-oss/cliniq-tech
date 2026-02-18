import React from 'react';
import { Check, Zap, Building2, Users, ShieldAlert } from 'lucide-react';

export function Pricing() {
  const whatsappNumber = "5585991647349"; // LEMBRE-SE DE COLOCAR SEU NÚMERO AQUI

  const plans = [
    {
      name: "Individual",
      price: "Sob Consulta",
      description: "Para profissionais autônomos que buscam profissionalismo e agilidade.",
      features: ["OS Digitais Ilimitadas", "Relatórios em PDF", "Histórico de Equipamentos", "Suporte via Ticket"],
      icon: <Zap className="h-6 w-6" />,
      highlight: false,
      cta: `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de saber os valores do Plano Individual do Atlasum.`
    },
    {
      name: "Business",
      price: "Sob Consulta",
      description: "O motor definitivo para empresas de manutenção em crescimento.",
      features: ["Até 5 Técnicos", "Dashboard de Produtividade", "Alertas de Preventivas", "Gestão de Estoque Base", "Suporte Prioritário"],
      icon: <Users className="h-6 w-6" />,
      highlight: true, // Plano em destaque
      cta: `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de receber uma proposta para o Plano Business do Atlasum.`
    },
    {
      name: "Corporate",
      price: "Sob Consulta",
      description: "Controle absoluto para grandes frotas e múltiplos contratos.",
      features: ["Técnicos Ilimitados", "Multi-unidades / Clientes", "Gestão de Contratos", "API para Integração", "Gerente de Conta"],
      icon: <Building2 className="h-6 w-6" />,
      highlight: false,
      cta: `https://wa.me/${whatsappNumber}?text=Olá! Gostaria de agendar uma reunião sobre o Plano Corporate do Atlasum.`
    }
  ];

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden" id="precos">
      {/* Detalhe de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,#0891b2_0%,transparent_70%)] opacity-[0.05] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter">
            Planos feitos para <span className="text-cyan-500">escalar sua operação.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Descubra a estrutura ideal para o seu momento. Fale com nossos consultores para um orçamento personalizado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative p-8 rounded-3xl border ${
                plan.highlight 
                ? 'border-cyan-500 bg-slate-900 shadow-2xl shadow-cyan-500/10 scale-105 z-20' 
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
              } transition-all duration-300 flex flex-col`}
            >
              {plan.highlight && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                  Mais Escolhido
                </span>
              )}
              
              <div className="text-cyan-500 mb-6">{plan.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-slate-400 text-sm mb-6 min-h-[40px]">{plan.description}</p>
              
              {/* Preço Oculto / Sob Consulta */}
              <div className="mb-8">
                <span className="text-3xl font-black text-white">{plan.price}</span>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-3 text-slate-300 text-sm">
                    <Check className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a 
                href={plan.cta}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-4 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 ${
                  plan.highlight
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                Falar com Consultor
              </a>
            </div>
          ))}
        </div>

        {/* Card Adicional para Hospitais (O "Em Breve") */}
        <div className="mt-12 p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-slate-800 p-3 rounded-xl text-slate-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">Hospitalar & Enterprise</h4>
              <p className="text-slate-500 text-sm text-balance">Módulos exclusivos de conformidade RBC, integração com ERP e gestão de leitos.</p>
            </div>
          </div>
          <span className="px-6 py-2 rounded-full border border-slate-700 text-slate-400 text-xs font-bold uppercase tracking-widest">
            Em Breve
          </span>
        </div>
      </div>
    </section>
  );
}