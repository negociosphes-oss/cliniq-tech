import { useState } from 'react';
import { X, UploadCloud, Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: number;
}

export function ImportCsvModal({ isOpen, onClose, onSuccess, tenantId }: Props) {
  const [loading, setLoading] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Gera uma planilha de exemplo para o usuário saber o formato
  const downloadTemplate = () => {
    const headers = "nome;codigo_sku;fabricante;categoria;unidade;estoque_minimo;estoque_atual;custo_medio;valor_venda\n";
    const example1 = "Sensor SpO2 Adulto Reutilizavel;SPO2-AD;Mindray;Acessório;Un;5;20;150.00;300.00\n";
    const example2 = "Filtro Bacteriano HMEF;FILT-HMEF;Drager;Material de Consumo;Un;100;500;8.50;15.00\n";
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + example1 + example2;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Modelo_Importacao_Estoque.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) throw new Error("O arquivo parece estar vazio.");

      const payload = [];

      // Começa da linha 1 (pula o cabeçalho)
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';'); // Padrão de separação do Excel Brasileiro
        if (cols.length < 2) continue; // Pula linhas defeituosas

        payload.push({
          tenant_id: tenantId,
          nome: cols[0]?.trim() || 'Item Sem Nome',
          codigo_sku: cols[1]?.trim() || '',
          fabricante: cols[2]?.trim() || '',
          categoria: cols[3]?.trim() || 'Acessório',
          unidade_medida: cols[4]?.trim() || 'Un',
          estoque_minimo: Number(cols[5]?.trim()) || 0,
          estoque_atual: Number(cols[6]?.trim()) || 0,
          custo_medio: Number(cols[7]?.trim().replace(',','.')) || 0,
          valor_venda: Number(cols[8]?.trim().replace(',','.')) || 0,
        });
      }

      // Salva no banco de dados em lotes (Para não travar caso você importe 10.000 peças)
      for (let i = 0; i < payload.length; i += 500) {
          const batch = payload.slice(i, i + 500);
          const { error } = await supabase.from('estoque_itens').insert(batch);
          if (error) throw error;
      }

      setSuccessCount(payload.length);
      onSuccess();
    } catch (err: any) {
      alert("Erro ao importar: Verifique se o arquivo está no formato correto (separado por Ponto e Vírgula ';').");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><FileSpreadsheet size={20}/></div>
            <h2 className="text-lg font-bold text-slate-800">Importação em Massa</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
        </div>

        <div className="p-6 text-center space-y-6">
          
          {successCount !== null ? (
             <div className="py-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <UploadCloud size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800">Carga Concluída!</h3>
                <p className="text-slate-500 mt-2"><b>{successCount}</b> itens foram cadastrados no seu almoxarifado com sucesso.</p>
                <button onClick={onClose} className="mt-6 w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Ir para o Estoque</button>
             </div>
          ) : (
             <>
                <p className="text-sm text-slate-600">
                  Cadastre milhares de peças e acessórios de uma só vez usando uma planilha <b>.CSV (separada por ponto-e-vírgula)</b>.
                </p>

                <button onClick={downloadTemplate} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors border border-slate-300">
                   <Download size={18}/> Baixar Planilha de Exemplo
                </button>

                <div className="relative group">
                   <div className="w-full h-32 border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-400 transition-colors cursor-pointer">
                      {loading ? (
                         <Loader2 size={32} className="text-indigo-600 animate-spin" />
                      ) : (
                         <>
                            <UploadCloud size={32} className="text-indigo-400 mb-2"/>
                            <span className="text-sm font-bold text-indigo-700">Clique para anexar o CSV preenchido</span>
                         </>
                      )}
                   </div>
                   <input 
                      type="file" 
                      accept=".csv" 
                      onChange={processFile}
                      disabled={loading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                   />
                </div>
             </>
          )}

        </div>
      </div>
    </div>
  );
}