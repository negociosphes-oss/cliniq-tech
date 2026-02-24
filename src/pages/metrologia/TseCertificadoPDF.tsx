import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#1e3a8a', paddingBottom: 15, marginBottom: 20 },
  logoBox: { width: '25%' },
  logo: { width: 100, maxHeight: 50, objectFit: 'contain' },
  
  companyInfoBox: { width: '45%', alignItems: 'center', textAlign: 'center', paddingTop: 5 },
  companyName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a', marginBottom: 3, textTransform: 'uppercase' },
  companyDetails: { fontSize: 7, color: '#475569', lineHeight: 1.4 },
  
  headerRightBox: { width: '30%', alignItems: 'flex-end', paddingTop: 5 },
  title: { fontSize: 12, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4, textAlign: 'right' },
  subtitle: { fontSize: 9, color: '#64748b' },
  
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', backgroundColor: '#f1f5f9', padding: 5, color: '#334155', marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#1e3a8a' },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { fontSize: 9, fontWeight: 'bold', color: '#475569', width: 130 },
  value: { fontSize: 9, color: '#0f172a', flex: 1 },

  table: { width: '100%', borderWidth: 1, borderColor: '#cbd5e1', marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a8a', color: 'white' },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#cbd5e1', alignItems: 'center' },
  tableRowSection: { backgroundColor: '#f1f5f9', borderTopWidth: 1, borderTopColor: '#cbd5e1', padding: 6 },
  
  tableColDesc: { width: '40%', padding: 6, fontSize: 9 },
  tableColValue: { width: '20%', padding: 6, fontSize: 9, textAlign: 'center' },
  tableColLimit: { width: '20%', padding: 6, fontSize: 9, textAlign: 'center' },
  tableColResult: { width: '20%', padding: 6, fontSize: 9, textAlign: 'center', fontWeight: 'bold' },
  
  sectionText: { fontSize: 9, fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase' },

  pass: { color: '#16a34a' },
  fail: { color: '#dc2626' },

  conclusionBox: { marginTop: 20, padding: 15, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, backgroundColor: '#f8fafc', alignItems: 'center' },
  conclusionText: { fontSize: 12, fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 40, left: 40, right: 40 },
  signatureSection: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30 },
  signatureBox: { alignItems: 'center', width: '40%' },
  signatureImage: { width: 120, height: 50, objectFit: 'contain', marginBottom: 5 },
  signatureLine: { width: '100%', borderTopWidth: 1, borderTopColor: '#94a3b8', marginTop: 5, paddingTop: 5, alignItems: 'center' },
  signatureName: { fontSize: 9, fontWeight: 'bold', color: '#0f172a' },
  signatureRole: { fontSize: 8, color: '#64748b' },
  pageNumber: { position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', fontSize: 8, color: '#94a3b8' },

  traceBox: { marginTop: 10, padding: 8, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#cbd5e1' },
  traceRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'center' },
  traceLabel: { fontSize: 8, fontWeight: 'bold', color: '#1e293b' },
  traceValue: { fontSize: 8, color: '#475569' }
});

const safeText = (text: any) => {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/Ω/g, 'Ohms')
    .replace(/µ/g, 'u') 
    .replace(/μ/g, 'u') 
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/</g, '<')
    .replace(/>/g, '>');
};

interface TsePDFProps { data: any; empresaConfig: any; }

export const TseCertificadoPDF: React.FC<TsePDFProps> = ({ data, empresaConfig }) => {
  if (!data) return <Document><Page><Text>Erro: Dados não encontrados</Text></Page></Document>;

  const equip = data.equipamentos || {};
  const cliente = equip.clientes || {};
  const tecnico = data.equipe_tecnica || {};
  const perfil = data.metrologia_tse_normas || {}; 
  
  const numeroSerieEquipamento = equip.numero_serie || equip.n_serie || equip.serie || 'N/A';
  
  const resultados = typeof data.resultados_json === 'string' ? JSON.parse(data.resultados_json) : (data.resultados_json || []);

  let padraoInfo: any = null;
  let padraoString = data.analisador_utilizado || 'Não Informado';

  try {
     if (data.analisador_utilizado && data.analisador_utilizado.startsWith('{')) {
        padraoInfo = JSON.parse(data.analisador_utilizado);
     }
  } catch(e) {}

  // 🚀 TRADUTORES DAS COLUNAS VISTAS NO VÍDEO
  const nomeEmpresaOficial = empresaConfig?.razao_social || empresaConfig?.nome_empresa || empresaConfig?.nome_fantasia || 'NOME DA EMPRESA NÃO CADASTRADO';
  const enderecoOficial = empresaConfig?.endereco_completo || empresaConfig?.endereco;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.header}>
          
          <View style={styles.logoBox}>
            {empresaConfig?.logo_url ? (
              <Image src={empresaConfig.logo_url} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' }}>{empresaConfig?.nome_fantasia || 'Atlasum'}</Text>
            )}
          </View>

          <View style={styles.companyInfoBox}>
             <Text style={styles.companyName}>
                {nomeEmpresaOficial}
             </Text>
             
             {empresaConfig?.cnpj && (
                <Text style={styles.companyDetails}>CNPJ: {empresaConfig.cnpj}</Text>
             )}
             
             {(empresaConfig?.telefone || empresaConfig?.email) && (
                <Text style={styles.companyDetails}>
                  {empresaConfig.telefone ? `Tel: ${empresaConfig.telefone} ` : ''}
                  {(empresaConfig.telefone && empresaConfig.email) ? ' | ' : ''}
                  {empresaConfig.email ? `E-mail: ${empresaConfig.email}` : ''}
                </Text>
             )}

             {enderecoOficial && (
                <Text style={styles.companyDetails}>{enderecoOficial}</Text>
             )}
          </View>

          <View style={styles.headerRightBox}>
            <Text style={styles.title}>LAUDO DE SEGURANÇA ELÉTRICA</Text>
            <Text style={styles.subtitle}>Certificado Nº: TSE-{data.id.toString().padStart(5, '0')}</Text>
            <Text style={styles.subtitle}>Data: {format(new Date(data.data_ensaio), 'dd/MM/yyyy')}</Text>
          </View>
          
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. IDENTIFICAÇÃO DO EQUIPAMENTO E PROPRIETÁRIO</Text>
          <View style={styles.row}><Text style={styles.label}>Cliente/Unidade:</Text><Text style={styles.value}>{cliente.nome_fantasia || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Equipamento:</Text><Text style={styles.value}>{equip.tecnologias?.nome || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Fabricante / Modelo:</Text><Text style={styles.value}>{equip.fabricante || 'N/A'} / {equip.modelo || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Nº de Série / TAG:</Text><Text style={styles.value}>{numeroSerieEquipamento} / {equip.tag || 'N/A'}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. PADRÃO E RASTREABILIDADE METROLÓGICA</Text>
          <View style={styles.row}><Text style={styles.label}>Norma de Referência:</Text><Text style={styles.value}>{data.norma_aplicada}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Classe / Peça Aplicada:</Text><Text style={styles.value}>{perfil.classe_equipamento || 'N/A'} / {perfil.tipo_peca_aplicada || 'N/A'}</Text></View>

          <View style={styles.traceBox}>
            {padraoInfo ? (
              <>
                <View style={styles.traceRow}>
                   <Text style={[styles.traceLabel, { width: '15%' }]}>1 - Padrão:</Text>
                   <Text style={[styles.traceValue, { width: '45%', fontWeight: 'bold', color: '#0f172a' }]}>
                     {padraoInfo.nome} {padraoInfo.fabricante} {padraoInfo.modelo}
                   </Text>
                   <Text style={[styles.traceLabel, { width: '10%' }]}>TAG:</Text>
                   <Text style={[styles.traceValue, { width: '10%' }]}>{padraoInfo.codigo_interno || '-'}</Text>
                   <Text style={[styles.traceLabel, { width: '8%' }]}>Série:</Text>
                   <Text style={[styles.traceValue, { width: '12%' }]}>{padraoInfo.n_serie || padraoInfo.numero_serie || '-'}</Text>
                </View>

                <View style={styles.traceRow}>
                   <Text style={[styles.traceLabel, { width: '15%' }]}>Emissor:</Text>
                   <Text style={[styles.traceValue, { width: '35%' }]}>{padraoInfo.laboratorio_calibrador || padraoInfo.orgao_calibrador || '-'}</Text>
                   <Text style={[styles.traceLabel, { width: '10%' }]}>Emissão:</Text>
                   <Text style={[styles.traceValue, { width: '10%' }]}>{padraoInfo.data_ultima_calibracao ? format(new Date(padraoInfo.data_ultima_calibracao), 'dd/MM/yyyy') : '-'}</Text>
                   <Text style={[styles.traceLabel, { width: '10%' }]}>Validade:</Text>
                   <Text style={[styles.traceValue, { width: '10%' }]}>{padraoInfo.data_vencimento ? format(new Date(padraoInfo.data_vencimento), 'dd/MM/yyyy') : '-'}</Text>
                </View>

                <View style={styles.traceRow}>
                   <Text style={[styles.traceLabel, { width: '15%' }]}>Certificado:</Text>
                   <Text style={[styles.traceValue, { width: '85%' }]}>{padraoInfo.n_certificado || padraoInfo.certificado || '-'}</Text>
                </View>

                <View style={[styles.traceRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#e2e8f0' }]}>
                   <Text style={[styles.traceLabel, { width: '15%' }]}>Rastreabilidade:</Text>
                   <Text style={[styles.traceValue, { width: '85%' }]}>
                     PADRÕES UTILIZADOS COM RASTREABILIDADE RBC/INMETRO. CERTIFICADO ORIGEM: {padraoInfo.n_certificado || padraoInfo.certificado || '-'} - VALIDADE: {padraoInfo.data_vencimento ? format(new Date(padraoInfo.data_vencimento), 'dd/MM/yyyy') : '-'}
                   </Text>
                </View>
              </>
            ) : (
              <View style={styles.traceRow}>
                 <Text style={[styles.traceLabel, { width: '15%' }]}>Padrão:</Text>
                 <Text style={[styles.traceValue, { width: '85%' }]}>{padraoString}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. EXECUÇÃO DOS ENSAIOS E INSPEÇÕES</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableColDesc}>Parâmetro Avaliado</Text>
              <Text style={styles.tableColValue}>Medição / Resultado</Text>
              <Text style={styles.tableColLimit}>Limite / Requisito</Text>
              <Text style={styles.tableColResult}>Avaliação</Text>
            </View>

            {resultados.map((item: any, idx: number) => {
              const tipo = item.tipo_campo || 'medicao';

              if (tipo === 'secao') {
                 return (
                   <View style={styles.tableRowSection} key={idx}>
                     <Text style={styles.sectionText}>{item.nome}</Text>
                   </View>
                 );
              }

              if (tipo === 'booleano') {
                 return (
                   <View style={styles.tableRow} key={idx}>
                     <Text style={styles.tableColDesc}>{item.nome}</Text>
                     <Text style={styles.tableColValue}>{item.aprovado ? 'Conforme' : 'Não Conforme'}</Text>
                     <Text style={styles.tableColLimit}>Integridade Visual</Text>
                     <Text style={[styles.tableColResult, item.aprovado ? styles.pass : styles.fail]}>
                       {item.aprovado === true ? 'PASSA' : item.aprovado === false ? 'FALHA' : '-'}
                     </Text>
                   </View>
                 );
              }

              return (
                <View style={styles.tableRow} key={idx}>
                  <Text style={styles.tableColDesc}>{item.nome}</Text>
                  <Text style={styles.tableColValue}>{item.valor_medido ? `${item.valor_medido} ${safeText(item.unidade)}` : '-'}</Text>
                  <Text style={styles.tableColLimit}>{safeText(item.operador)} {item.limite} {safeText(item.unidade)}</Text>
                  <Text style={[styles.tableColResult, item.aprovado === true ? styles.pass : item.aprovado === false ? styles.fail : {}]}>
                    {item.aprovado === true ? 'PASSA' : item.aprovado === false ? 'FALHA' : '-'}
                  </Text>
                </View>
              );
            })}
            
            {resultados.length === 0 && ( <View style={styles.tableRow}><Text style={{padding: 6, fontSize: 9}}>Nenhum ponto registrado.</Text></View> )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. OBSERVAÇÕES E PARECER TÉCNICO</Text>
          <Text style={{ fontSize: 9, color: '#475569', minHeight: 30 }}>{data.observacoes_gerais || 'Equipamento ensaiado não apresentou não conformidades relativas à segurança elétrica durante a inspeção.'}</Text>
          <View style={[styles.conclusionBox, data.resultado === 'APROVADO' ? { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' } : { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Text style={[styles.conclusionText, data.resultado === 'APROVADO' ? styles.pass : styles.fail]}>SITUAÇÃO DO EQUIPAMENTO: {data.resultado}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              {tecnico.assinatura_url ? <Image src={tecnico.assinatura_url} style={styles.signatureImage} /> : <View style={{ height: 50 }} />}
              <View style={styles.signatureLine}><Text style={styles.signatureName}>{tecnico.nome || 'Técnico Não Identificado'}</Text><Text style={styles.signatureRole}>{tecnico.cargo || 'Engenharia Clínica'}</Text></View>
            </View>
          </View>
        </View>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (`Página ${pageNumber} de ${totalPages}`)} fixed />
      </Page>
    </Document>
  );
};