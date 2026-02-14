import { FileText, Printer, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'
import { Equipamento, OrdemServico } from '../types'

interface RelatoriosPageProps {
  equipamentos: Equipamento[];
  ordens: OrdemServico[];
}

export function RelatoriosPage({ equipamentos, ordens }: RelatoriosPageProps) {
  
  // Cálculos Simples (Baseado no vídeo)
  const totalOrdens = ordens.length;
  const concluidas = ordens.filter(o => o.status === 'Concluída').length;
  const abertas = ordens.filter(o => o.status !== 'Concluída').length;

  const handlePrint = () => {
    const win = window.open('', '', 'width=900,height=800');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Relatório Gerencial - TronIQ</title>
            <style>
              body { font-family: sans-serif; padding: 40px; }
              h1 { color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
              .stat-box { border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
              .big-number { font-size: 40px; font-weight: bold; color: #2563eb; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f8fafc; }
            </style>
          </head>
          <body>
            <h1>Relatório Geral de Manutenção</h1>
            <p>Gerado em: ${new Date().toLocaleString()}</p>
            
            <div style="display: flex; gap: 20px;">
                <div class="stat-box">
                    <div>Total de Equipamentos</div>
                    <div class="big-number">${equipamentos.length}</div>
                </div>
                <div class="stat-box">
                    <div>Total de Chamados</div>
                    <div class="big-number">${totalOrdens}</div>
                </div>
                <div class="stat-box">
                    <div>Pendentes</div>
                    <div class="big-number" style="color: #ea580c">${abertas}</div>
                </div>
            </div>

            <h2>Resumo de Ativos</h2>
            <p>Este documento é um resumo oficial do sistema TronIQ Health.</p>
            
            <script>window.print()</script>
          </body>
        </html>
      `);
      win.document.close();
    }
  }

  return (
    <div className="p-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <FileText className="text-blue-500" /> Relatórios Gerenciais
        </h2>
        <button 
          onClick={handlePrint}
          className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-lg"
        >
          <Printer size={18} /> Imprimir Resumo
        </button>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card Total */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                <TrendingUp size={32} />
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">Total de Ordens</p>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white">{totalOrdens}</h3>
            </div>
        </div>

        {/* Card Abertas */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl text-orange-600">
                <AlertCircle size={32} />
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">Abertas / Pendentes</p>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white">{abertas}</h3>
            </div>
        </div>

        {/* Card Concluídas */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600">
                <CheckCircle2 size={32} />
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">Finalizadas</p>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white">{concluidas}</h3>
            </div>
        </div>

      </div>

      <div className="bg-blue-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-blue-100 dark:border-slate-700 text-center">
        <p className="text-slate-500 dark:text-slate-400">Mais gráficos e métricas detalhadas serão implementados na próxima fase.</p>
      </div>

    </div>
  )
}