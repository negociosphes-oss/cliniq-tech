import { useState, useEffect } from 'react'
import { X, FileText, Download, Calendar, Filter, Printer } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Tipagem simples para o select
interface PlanoOption {
  id: number;
  nome: string;
  cliente_nome: string;
}

interface RelatorioConfigModalProps {
  onClose: () => void;
  tenantId: number; // 🚀 INJETADO PELA PAGE
}

export function RelatorioConfigModal({ onClose, tenantId }: RelatorioConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [planos, setPlanos] = useState<PlanoOption[]>([]);
  
  // Configurações do Sistema (Logo)
  const [config, setConfig] = useState<{ nome_empresa: string, logo_url: string } | null>(null);
  
  // Filtros
  const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('');
  const [status, setStatus] = useState('Todos');
  const [orientacao, setOrientacao] = useState<'portrait' | 'landscape'>('portrait');

  // Carrega Planos e Configurações BLINDADO
  useEffect(() => {
    const loadData = async () => {
      if (!tenantId) return;

      // 1. Carregar Planos do Inquilino Atual
      const { data: planosData } = await supabase
        .from('cronograma_planos')
        .select('id, nome, clientes(nome_fantasia)')
        .eq('tenant_id', tenantId) // 🚀 Trava
        .order('created_at', { ascending: false });
      
      if (planosData) {
        setPlanos(planosData.map(p => ({
          id: p.id,
          nome: p.nome,
          cliente_nome: p.clientes?.nome_fantasia || 'Cliente Geral'
        })));
      }

      // 2. Carregar Configuração da Empresa (Logo)
      const { data: configData } = await supabase
        .from('configuracoes_empresa') // 🚀 Usando a tabela que você me mostrou no video
        .select('nome_fantasia, logo_url')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      
      if (configData) {
        setConfig({
          nome_empresa: configData.nome_fantasia || 'Atlasum',
          logo_url: configData.logo_url
        });
      }
    };
    loadData();
  }, [tenantId]);

  // Função auxiliar para converter imagem URL em Base64 para o PDF
  const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = error => reject(error);
      img.src = url;
    });
  };

  const handleGerarPDF = async () => {
    if (!tenantId) return alert('Erro de sessão');
    setLoading(true);
    try {
      // 1. Constrói a Query BLINDADA
      let query = supabase
        .from('cronogramas')
        .select(`
          data_programada, 
          tipo_servico, 
          status, 
          observacao,
          equipamentos (
            tag, 
            tecnologias (nome),
            setor
          ),
          cronograma_planos (nome, clientes(nome_fantasia))
        `)
        .eq('tenant_id', tenantId) // 🚀 Trava Principal
        .order('data_programada', { ascending: true });

      // Aplica Filtros
      if (selectedPlanId) query = query.eq('plano_id', selectedPlanId);
      if (status !== 'Todos') query = query.eq('status', status);

      const { data: itens, error } = await query;
      
      if (error) throw new Error(`Erro no banco: ${error.message}`);

      if (!itens || itens.length === 0) {
        alert('Nenhum dado encontrado para os filtros selecionados.');
        setLoading(false);
        return;
      }

      // 2. Configura o PDF
      const doc = new jsPDF({ orientation: orientacao });
      const planoInfo = itens[0].cronograma_planos;
      
      const clienteNome = planoInfo?.clientes?.nome_fantasia || 'Cliente Diversos';
      const planoNome = planoInfo?.nome || 'Relatório Geral';
      const empresaNome = config?.nome_empresa || 'Engenharia Clínica';
      
      // --- CABEÇALHO ---
      doc.setFillColor(41, 128, 185); // Azul Profissional
      doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
      
      // Tenta adicionar LOGO se existir
      if (config?.logo_url) {
        try {
           const logoBase64 = await getBase64ImageFromURL(config.logo_url);
           doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30);
        } catch (e) {
           console.warn('Não foi possível carregar a logo:', e);
        }
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      const textX = config?.logo_url ? 50 : 14;
      
      doc.text(empresaNome, textX, 15);
      doc.setFontSize(10);
      doc.text("Relatório de Manutenção e Cronograma", textX, 22);
      
      // Dados do Relatório (Direita)
      doc.setFontSize(10);
      const rightX = doc.internal.pageSize.width - 14;
      doc.text(`Plano: ${planoNome}`, rightX, 15, { align: 'right' });
      doc.text(`Cliente: ${clienteNome}`, rightX, 20, { align: 'right' });
      doc.text(`Data: ${new Date().toLocaleDateString()}`, rightX, 25, { align: 'right' });

      // --- TABELA DE DADOS ---
      const tableData = itens.map(item => [
        new Date(item.data_programada).toLocaleDateString(),
        // @ts-ignore
        item.equipamentos?.tecnologias?.nome || 'Equipamento',
        // @ts-ignore
        item.equipamentos?.tag || '-',
        // @ts-ignore
        item.equipamentos?.setor || '-',
        item.tipo_servico || '-',
        item.status || '-'
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Data', 'Equipamento', 'TAG', 'Setor', 'Serviço', 'Status']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [52, 73, 94], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      // --- RODAPÉ ---
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Sistema de Gestão - ${empresaNome} | Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }

      // 3. Salva
      const nomeSafe = clienteNome.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`Relatorio_${nomeSafe}.pdf`);

    } catch (err: any) {
      console.error(err);
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-fadeIn">
        
        {/* Header */}
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
           <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Printer className="text-blue-600"/> Exportar Relatório
           </h2>
           <button onClick={onClose}><X size={20}/></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
           <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                 <FileText size={14}/> Selecione o Plano
              </label>
              <select 
                 className="w-full p-3 rounded-lg border bg-slate-50 border-slate-200 outline-none focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700"
                 value={selectedPlanId}
                 onChange={e => setSelectedPlanId(Number(e.target.value))}
              >
                 <option value="">-- Todos os Planos --</option>
                 {planos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} ({p.cliente_nome})</option>
                 ))}
              </select>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Filter size={14}/> Status
                 </label>
                 <select 
                    className="w-full p-3 rounded-lg border bg-slate-50 border-slate-200 outline-none focus:border-blue-500"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                 >
                    <option>Todos</option>
                    <option>Pendente</option>
                    <option>Realizada</option>
                    <option>Atrasada</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Calendar size={14}/> Orientação
                 </label>
                 <select 
                    className="w-full p-3 rounded-lg border bg-slate-50 border-slate-200 outline-none focus:border-blue-500"
                    value={orientacao}
                    onChange={e => setOrientacao(e.target.value as any)}
                 >
                    <option value="portrait">Retrato (A4)</option>
                    <option value="landscape">Paisagem</option>
                 </select>
              </div>
           </div>

           <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded border border-blue-100 flex gap-2">
              <Printer size={16}/>
              <div>
                <strong>Configuração de Impressão:</strong>
                <p>O relatório usará automaticamente a logo e o nome da sua empresa definidos nas configurações do sistema.</p>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-2xl flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold transition">Cancelar</button>
           <button 
              onClick={handleGerarPDF} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
           >
              {loading ? 'Gerando...' : <><Download size={18}/> Baixar PDF</>}
           </button>
        </div>
      </div>
    </div>
  )
}