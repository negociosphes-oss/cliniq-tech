import { useState, useEffect } from 'react';
import { X, Printer, Loader2, AlertCircle, Download } from 'lucide-react';
import { PDFViewer, Document, Page, Text, View, StyleSheet, Image, pdf } from '@react-pdf/renderer';
import { CertificadoService } from '../../services/CertificadoService';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 8, color: '#222' },
  mainContainer: { borderWidth: 1, borderColor: '#000', height: '100%', padding: 10 },
  header: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 10, marginBottom: 10 },
  logoBox: { width: 70, height: 50, marginRight: 10, justifyContent: 'center' },
  logo: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  headerInfo: { flex: 1, justifyContent: 'center' },
  companyName: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  qrBox: { width: 60, height: 60, marginLeft: 10, alignItems: 'center', justifyContent: 'center' },
  qrImage: { width: 55, height: 55 },
  statusBox: { marginBottom: 10, padding: 8, textAlign: 'center', borderWidth: 2, borderRadius: 2, alignSelf: 'center', width: '100%' },
  statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#f3f4f6', padding: 3, marginBottom: 3, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: '#999' },
  techNoteTitle: { fontSize: 7, fontWeight: 'bold', marginTop: 4, marginBottom: 1, color: '#333' },
  techNoteText: { fontSize: 7, textAlign: 'justify', lineHeight: 1.2, color: '#444', marginBottom: 3 },
  row: { flexDirection: 'row', marginBottom: 2 },
  label: { fontWeight: 'bold', fontSize: 7, color: '#444', width: 85 },
  value: { fontSize: 8, flex: 1 },
  table: { width: '100%', borderTopWidth: 1, borderTopColor: '#000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#000' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 3 },
  cellHead: { fontSize: 7, fontWeight: 'bold', textAlign: 'center' },
  cell: { fontSize: 7, textAlign: 'center' },
  footer: { marginTop: 'auto', paddingTop: 10 },
  footerLine: { borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 5, marginTop: 5 },
  footerText: { fontSize: 6, textAlign: 'center', color: '#666' },
  
  // Estilos Adicionados para as Assinaturas
  sigImage: { height: 40, objectFit: 'contain', marginBottom: 2 },
  sigPlaceholder: { height: 40 }, // Espaço vazio caso não tenha assinatura cadastrada
  sigLine: { borderBottomWidth: 1, borderBottomColor: '#000', width: '100%', marginBottom: 5 }
});

const MetrologiaPDF = ({ data }: { data: any }) => {
  const statusUpper = String(data.status).toUpperCase();
  const isApproved = statusUpper === 'APROVADO';
  const isRejected = statusUpper === 'REPROVADO';
  
  let statusColor = '#334155';
  let statusBg = '#f1f5f9';
  let statusBorder = '#cbd5e1';
  let statusMsg = data.status;

  if (isApproved) {
      statusColor = '#166534'; statusBg = '#dcfce7'; statusBorder = '#166534';
      statusMsg = `APROVADO - VÁLIDO ATÉ ${data.validade}`;
  } else if (isRejected) {
      statusColor = '#991b1b'; statusBg = '#fef2f2'; statusBorder = '#b91c1c';
      statusMsg = `REPROVADO - IMPRÓPRIO PARA USO - REQUER MANUTENÇÃO`;
  } else {
      statusColor = '#d97706'; statusBg = '#fef3c7'; statusBorder = '#d97706';
      statusMsg = `STATUS: ${data.status}`;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.mainContainer}>
          <View style={styles.header}>
            <View style={styles.logoBox}>
               {data.cabecalho.logo ? <Image src={data.cabecalho.logo} style={styles.logo} /> : <Text style={{fontSize:16, fontWeight:'bold'}}>ATLAS</Text>}
            </View>
            <View style={styles.headerInfo}>
               <Text style={styles.companyName}>{data.cabecalho.empresa}</Text>
               <Text style={{fontSize: 7}}>{data.cabecalho.endereco}</Text>
               <Text style={{fontSize: 7}}>CNPJ: {data.cabecalho.cnpj} | {data.cabecalho.contato}</Text>
               <Text style={{fontSize: 12, fontWeight: 'bold', marginTop: 4}}>CERTIFICADO Nº {data.numero}</Text>
            </View>
            <View style={styles.qrBox}>{data.qr_code && <Image src={data.qr_code} style={styles.qrImage} />}</View>
          </View>

          <View style={styles.section}>
             <Text style={styles.sectionTitle}>Identificação do Equipamento & Proprietário</Text>
             <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                    <View style={styles.row}><Text style={styles.label}>Proprietário (Cliente):</Text><Text style={styles.value}>{data.cliente.nome}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>CNPJ / CPF:</Text><Text style={styles.value}>{data.cliente.doc}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Equipamento:</Text><Text style={styles.value}>{data.equipamento.nome}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Fabricante / Modelo:</Text><Text style={styles.value}>{data.equipamento.fabricante} {data.equipamento.modelo !== '-' ? ` / ${data.equipamento.modelo}` : ''}</Text></View>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.row}><Text style={styles.label}>TAG / Identificação:</Text><Text style={styles.value}>{data.equipamento.tag}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Nº de Série:</Text><Text style={styles.value}>{data.equipamento.serie}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Patrimônio:</Text><Text style={styles.value}>{data.equipamento.patrimonio}</Text></View>
                    <View style={styles.row}><Text style={styles.label}>Emissão do Laudo:</Text><Text style={styles.value}>{data.emissao}</Text></View>
                </View>
             </View>
          </View>

          <View style={styles.section}>
             <Text style={styles.sectionTitle}>Rastreabilidade Metrológica</Text>
             <View style={styles.table}>
               <View style={styles.tableHeader}>
                  <Text style={[styles.cellHead, { flex: 2, textAlign: 'left' }]}>Analisador Padrão</Text>
                  <Text style={[styles.cellHead, { flex: 1 }]}>Nº Série</Text>
                  <Text style={[styles.cellHead, { flex: 1 }]}>Certificado</Text>
                  <Text style={[styles.cellHead, { flex: 1 }]}>Validade</Text>
               </View>
               {data.padroes.length > 0 ? data.padroes.map((p: any, i: number) => (
                  <View key={i} style={styles.tableRow}>
                     <Text style={[styles.cell, { flex: 2, textAlign: 'left' }]}>{p.nome}</Text>
                     <Text style={[styles.cell, { flex: 1 }]}>{p.serie}</Text>
                     <Text style={[styles.cell, { flex: 1 }]}>{p.certificado}</Text>
                     <Text style={[styles.cell, { flex: 1 }]}>{p.validade}</Text>
                  </View>
               )) : (
                  <Text style={{ padding: 5, fontSize: 8, fontStyle: 'italic', textAlign:'center', color: '#dc2626' }}>-- Nenhum padrão vinculado --</Text>
               )}
             </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resultados Encontrados</Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.cellHead, { flex: 2, textAlign: 'left' }]}>Parâmetro</Text>
                    <Text style={[styles.cellHead, { flex: 1 }]}>Ref.</Text>
                    <Text style={[styles.cellHead, { flex: 1 }]}>Lido</Text>
                    <Text style={[styles.cellHead, { flex: 1 }]}>Erro</Text>
                    <Text style={[styles.cellHead, { flex: 1 }]}>Incerteza</Text>
                    <Text style={[styles.cellHead, { flex: 1 }]}>Status</Text>
                </View>
                {data.resultados.map((r: any, i: number) => (
                    <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? 'white' : '#f9fafb' }]}>
                        <Text style={[styles.cell, { flex: 2, textAlign: 'left' }]}>{r.teste} ({r.unidade})</Text>
                        <Text style={[styles.cell, { flex: 1 }]}>{r.ref}</Text>
                        <Text style={[styles.cell, { flex: 1 }]}>{r.lido}</Text>
                        <Text style={[styles.cell, { flex: 1 }]}>{r.erro}</Text>
                        <Text style={[styles.cell, { flex: 1 }]}>{r.incerteza}</Text>
                        <Text style={[styles.cell, { flex: 1, fontWeight: 'bold', color: r.status === 'OK' ? '#166534' : '#dc2626' }]}>{r.status}</Text>
                    </View>
                ))}
            </View>
          </View>

          <View style={styles.section}>
             <Text style={styles.sectionTitle}>Notas Técnicas & Metodologia</Text>
             <Text style={styles.techNoteTitle}>1. Método de Calibração:</Text>
             <Text style={styles.techNoteText}>{data.notas_tecnicas.metodologia}</Text>
             <Text style={styles.techNoteTitle}>2. Condições Ambientais:</Text>
             <Text style={styles.techNoteText}>{data.notas_tecnicas.condicoes}</Text>
             <Text style={styles.techNoteTitle}>3. Declaração de Incerteza (k=2, 95%):</Text>
             <Text style={styles.techNoteText}>{data.notas_tecnicas.incerteza}</Text>
             <Text style={styles.techNoteTitle}>4. Observações:</Text>
             <Text style={styles.techNoteText}>{data.notas_tecnicas.obs}</Text>
          </View>

          <View style={[styles.statusBox, { borderColor: statusBorder, backgroundColor: statusBg }]}>
             <Text style={{ fontSize: 8, color: statusColor, marginBottom: 2 }}>PARECER TÉCNICO FINAL</Text>
             <Text style={[styles.statusText, { color: statusColor }]}>{statusMsg}</Text>
          </View>

          {/* RODAPÉ E ASSINATURAS (AUDITADO PARA IMAGENS) */}
          <View style={styles.footer}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 5 }}>
                
                {/* TÉCNICO EXECUTOR */}
                <View style={{ alignItems: 'center', width: '40%' }}>
                   {data.assinaturas.executor_assinatura ? (
                       <Image src={data.assinaturas.executor_assinatura} style={styles.sigImage} />
                   ) : (
                       <View style={styles.sigPlaceholder}></View>
                   )}
                   <View style={styles.sigLine}></View>
                   <Text style={{ fontWeight: 'bold', fontSize: 8 }}>{data.assinaturas.executor}</Text>
                   <Text style={{ fontSize: 7 }}>Técnico Executor</Text>
                </View>
                
                {/* RESPONSÁVEL TÉCNICO */}
                <View style={{ alignItems: 'center', width: '40%' }}>
                   {data.assinaturas.responsavel_assinatura ? (
                       <Image src={data.assinaturas.responsavel_assinatura} style={styles.sigImage} />
                   ) : (
                       <View style={styles.sigPlaceholder}></View>
                   )}
                   <View style={styles.sigLine}></View>
                   <Text style={{ fontWeight: 'bold', fontSize: 8 }}>{data.assinaturas.responsavel}</Text>
                   <Text style={{ fontSize: 7 }}>Engenheiro Resp. (CREA: {data.assinaturas.responsavel_reg || 'N/A'})</Text>
                </View>

             </View>
             <View style={styles.footerLine}>
                <Text style={styles.footerText}>Documento gerado digitalmente via ATLAS System | Autenticação: {data.id_doc}</Text>
             </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export function VisualizarCertificadoModal({ isOpen, onClose, osId }: { isOpen: boolean; onClose: () => void; osId: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && osId) loadData();
  }, [isOpen, osId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const payload = await CertificadoService.gerarPayload(osId);
      setData(payload);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!data) return;
    const blob = await pdf(<MetrologiaPDF data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.numero}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex flex-col items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white w-full max-w-5xl rounded-t-2xl flex justify-between items-center p-4 shadow-md z-10">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Printer size={20} className="text-indigo-600"/> Laudo Técnico RBC</h2>
        <div className="flex gap-2 items-center">
             {!loading && !error && (
                <button onClick={handleDownload} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                    <Download size={16}/> Baixar PDF
                </button>
             )}
             <button onClick={onClose} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-colors flex items-center justify-center">
                 <X size={24} strokeWidth={3}/>
             </button>
        </div>
      </div>

      <div className="bg-slate-100 w-full max-w-5xl h-[85vh] rounded-b-2xl shadow-2xl overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-white">
              <Loader2 size={40} className="animate-spin text-indigo-600 mb-4"/><p className="font-medium animate-pulse">Compilando laudo técnico...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-white">
              <AlertCircle size={48} className="mb-4"/><p className="font-bold">Erro: {error}</p>
          </div>
        ) : (
          <PDFViewer width="100%" height="100%" className="border-none" showToolbar={false}>
              <MetrologiaPDF data={data} />
          </PDFViewer>
        )}
      </div>
    </div>
  );
}