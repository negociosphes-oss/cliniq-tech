import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  // 🚀 Ajustado o paddingBottom para proteger o rodapé e evitar que a assinatura atropele a frase
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', paddingTop: 30, paddingLeft: 30, paddingRight: 30, paddingBottom: 65, fontFamily: 'Helvetica', fontSize: 8, color: '#1e293b' },
  
  // Header Principal (Azul Marinho)
  headerCard: { backgroundColor: '#1e3a8a', borderRadius: 8, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', width: '60%' },
  logoBox: { backgroundColor: '#ffffff', padding: 4, borderRadius: 6, marginRight: 12, height: 46, width: 90, justifyContent: 'center', alignItems: 'center' },
  headerRightWrapper: { flexDirection: 'row', alignItems: 'center', width: '40%', justifyContent: 'flex-end', gap: 10 },
  headerRight: { textAlign: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, flex: 1 },
  qrCode: { width: 50, height: 50, backgroundColor: '#ffffff', padding: 2, borderRadius: 4 },
  
  title: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase' },
  subtitle: { fontSize: 8, color: '#64748b', marginTop: 2, fontWeight: 'bold' },
  emissao: { fontSize: 7, marginTop: 4, color: '#475569', fontWeight: 'bold' },
  companyName: { fontSize: 13, fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase' },
  companySub: { fontSize: 7, color: '#93c5fd', marginTop: 2 },
  
  // Grids e Caixas
  grid2: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  box: { flex: 1, borderWidth: 1, borderColor: '#3b82f6', borderRadius: 6, overflow: 'hidden' },
  
  // Títulos das Caixas (Azul Claro)
  boxHeader: { backgroundColor: '#0284c7', padding: 6, paddingHorizontal: 10, color: '#ffffff', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' },
  boxBody: { padding: 10, backgroundColor: '#f0f9ff' },
  
  // Campos estilo "Pílula"
  row: { flexDirection: 'row', marginBottom: 4, alignItems: 'center' },
  lbl: { width: 85, fontWeight: 'bold', color: '#334155', fontSize: 7, textTransform: 'uppercase' },
  valBox: { flex: 1, backgroundColor: '#e0f2fe', paddingVertical: 4, paddingHorizontal: 6, borderRadius: 4, borderWidth: 1, borderColor: '#bae6fd' },
  valText: { color: '#0f172a', fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase' },

  // Seção Tabela Resultados
  section: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, overflow: 'hidden', marginBottom: 15 },
  table: { width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#bae6fd', borderBottomWidth: 2, borderBottomColor: '#ffffff' },
  tableHeaderCell: { padding: 6, fontSize: 7, fontWeight: 'bold', color: '#0369a1', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'center', minHeight: 20 },
  tableCell: { padding: 6, fontSize: 7, color: '#334155' },

  col1: { width: '30%' }, col2: { width: '10%', textAlign: 'center' }, col3: { width: '15%', textAlign: 'center' }, col5: { width: '15%', textAlign: 'center' }, col6: { width: '15%', textAlign: 'center' }, col7: { width: '15%', textAlign: 'center' },

  // Estilos da Rastreabilidade (Blocos Empilhados)
  padraoBlock: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#ffffff' },
  padraoRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
  pLabel: { fontWeight: 'bold', color: '#0f172a', fontSize: 7, marginRight: 4, width: 70 },
  pValue: { color: '#334155', fontSize: 7, flex: 1, textTransform: 'uppercase' },
  pLabelShort: { fontWeight: 'bold', color: '#0f172a', fontSize: 7, marginRight: 4 },
  pValueShort: { color: '#334155', fontSize: 7, width: 60, textTransform: 'uppercase' },

  // Notas Técnicas e Normativas
  noteTitle: { fontSize: 8, fontWeight: 'bold', color: '#0369a1', marginTop: 8, marginBottom: 2, textTransform: 'uppercase' },
  noteText: { fontSize: 7.5, color: '#334155', textAlign: 'justify', lineHeight: 1.4 },

  // Parecer Final
  conclusionBox: { marginTop: 10, padding: 15, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#22c55e', borderRadius: 6, textAlign: 'center' },
  conclusionText: { fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', color: '#166534', marginTop: 4 },

  // Assinaturas e Rodapé
  sigs: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30, pageBreakInside: 'avoid' },
  sigBox: { width: '40%', alignItems: 'center' },
  sigLine: { borderTopWidth: 1, borderTopColor: '#64748b', paddingTop: 5, width: '100%', alignItems: 'center' },
  sigImg: { height: 45, objectFit: 'contain', marginBottom: 4 },
  sigName: { fontWeight: 'bold', fontSize: 9, color: '#0f172a', textTransform: 'uppercase' },
  sigLabel: { fontSize: 7, color: '#64748b', marginTop: 2, textTransform: 'uppercase' },

  // 🚀 Rodapé colado no final da página, distante das assinaturas
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, textAlign: 'center', fontSize: 7, color: '#94a3b8', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 },
});

// 🚀 A MÁGICA DA ASSINATURA: O 'encodeURI' quebrava imagens em Base64. Agora ele as ignora e carrega limpo.
const safeUrl = (url: any) => {
  if (!url || typeof url !== 'string') return undefined;
  if (url.startsWith('data:image')) return url; // Passa direto pro PDF
  try { return encodeURI(url); } catch { return undefined; }
};

export const CertificadoUnico = ({ data }: { data: any }) => {
  const urlExecutor = safeUrl(data.assinaturas?.executor_assinatura);
  const urlResponsavel = safeUrl(data.assinaturas?.responsavel_assinatura);
  const urlLogo = safeUrl(data.cabecalho?.logo);

  return (
    <View>
      {/* 1. DADOS DO LABORATÓRIO / HEADER ENTERPRISE */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          {urlLogo && (
              <View style={styles.logoBox}>
                  <Image src={urlLogo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </View>
          )}
          <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>{data.cabecalho?.empresa || 'ATLAS SYSTEM MEDICAL'}</Text>
              <Text style={styles.companySub}>CNPJ: {data.cabecalho?.cnpj || '-'} | {data.cabecalho?.contato || '-'}</Text>
              <Text style={styles.companySub}>{data.cabecalho?.endereco || '-'}</Text>
          </View>
        </View>
        <View style={styles.headerRightWrapper}>
          <View style={styles.headerRight}>
            <Text style={styles.title}>Certificado RBC</Text>
            <Text style={styles.subtitle}>Nº {data.numero}</Text>
            <Text style={styles.emissao}>Emissão: {data.emissao}</Text>
          </View>
          {data.qr_code && <Image src={data.qr_code} style={styles.qrCode} />}
        </View>
      </View>

      {/* 2. IDENTIFICAÇÃO DETALHADA DO EQUIPAMENTO MÉDICO & CLIENTE */}
      <View style={styles.grid2}>
        <View style={styles.box}>
          <Text style={styles.boxHeader}>Dados do Cliente</Text>
          <View style={styles.boxBody}>
             <View style={styles.row}><Text style={styles.lbl}>Unidade:</Text><View style={styles.valBox}><Text style={styles.valText}>{data.cliente?.nome || '-'}</Text></View></View>
             <View style={styles.row}><Text style={styles.lbl}>Documento:</Text><View style={styles.valBox}><Text style={styles.valText}>{data.cliente?.doc || '-'}</Text></View></View>
          </View>
        </View>
        <View style={styles.box}>
          <Text style={styles.boxHeader}>Objeto de Ensaio</Text>
          <View style={styles.boxBody}>
             <View style={styles.row}><Text style={styles.lbl}>Equipamento:</Text><View style={[styles.valBox, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}><Text style={[styles.valText, { color: '#166534' }]}>{data.equipamento?.nome || '-'}</Text></View></View>
             <View style={styles.row}><Text style={styles.lbl}>Modelo/Fab:</Text><View style={[styles.valBox, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}><Text style={[styles.valText, { color: '#166534' }]}>{data.equipamento?.modelo} / {data.equipamento?.fabricante}</Text></View></View>
             <View style={styles.row}><Text style={styles.lbl}>Série/TAG:</Text><View style={[styles.valBox, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}><Text style={[styles.valText, { color: '#166534' }]}>{data.equipamento?.serie} / {data.equipamento?.tag}</Text></View></View>
          </View>
        </View>
      </View>

      {/* 3. RASTREABILIDADE METROLÓGICA */}
      <View style={styles.section}>
        <Text style={styles.boxHeader}>Rastreabilidade Metrológica (Padrões Utilizados)</Text>
        <View style={{ backgroundColor: '#f8fafc' }}>
            {(data.padroes || []).map((p: any, i: number) => (
              <View key={i} style={[styles.padraoBlock, { backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#f8fafc' }]}>
                  <View style={styles.padraoRow}>
                      <Text style={styles.pLabel}>{p.index} - Padrão:</Text>
                      <Text style={[styles.pValue, { fontWeight: 'bold' }]}>{p.nome}</Text>
                      
                      <Text style={styles.pLabelShort}>TAG:</Text>
                      <Text style={styles.pValueShort}>{p.tag}</Text>
                      
                      <Text style={styles.pLabelShort}>Série:</Text>
                      <Text style={styles.pValueShort}>{p.serie}</Text>
                  </View>

                  <View style={styles.padraoRow}>
                      <Text style={styles.pLabel}>Emissor:</Text>
                      <Text style={styles.pValue}>{p.emissor}</Text>

                      <Text style={styles.pLabelShort}>Emissão:</Text>
                      <Text style={[styles.pValueShort, { width: 50 }]}>{p.emissao}</Text>

                      <Text style={styles.pLabelShort}>Validade:</Text>
                      <Text style={[styles.pValueShort, { width: 50 }]}>{p.validade}</Text>

                      <Text style={styles.pLabelShort}>Certificado:</Text>
                      <Text style={styles.pValueShort}>{p.certificado}</Text>
                  </View>

                  <View style={styles.padraoRow}>
                      <Text style={styles.pLabel}>Rastreabilidade:</Text>
                      <Text style={styles.pValue}>{p.rastreabilidade}</Text>
                  </View>
              </View>
            ))}
        </View>
      </View>

      {/* 5. RESULTADOS DE MEDIÇÃO */}
      <View style={styles.section}>
        <Text style={styles.boxHeader}>Resultados da Calibração</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>Parâmetro Avaliado</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Unid.</Text>
            <Text style={[styles.tableHeaderCell, styles.col3]}>Ref.</Text>
            <Text style={[styles.tableHeaderCell, styles.col5]}>Lido</Text>
            <Text style={[styles.tableHeaderCell, styles.col6]}>Incerteza</Text>
            <Text style={[styles.tableHeaderCell, styles.col7]}>Status</Text>
          </View>
          {(data.resultados || []).map((item: any, idx: number) => (
            <View key={idx} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#f8fafc' }]}>
              <Text style={[styles.tableCell, styles.col1]}>{item.teste}</Text>
              <Text style={[styles.tableCell, styles.col2]}>{item.unidade}</Text>
              <Text style={[styles.tableCell, styles.col3]}>{item.ref}</Text>
              <Text style={[styles.tableCell, styles.col5, { fontWeight: 'bold' }]}>{item.lido}</Text>
              <Text style={[styles.tableCell, styles.col6]}>{item.incerteza || '-'}</Text>
              <Text style={[styles.tableCell, styles.col7, { color: item.status === 'OK' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }]}>{item.status}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 4 E 8. NOTAS TÉCNICAS E NORMATIVAS */}
      <View style={styles.section}>
        <Text style={styles.boxHeader}>Notas Técnicas & Metodologia</Text>
        <View style={[styles.boxBody, { backgroundColor: '#f8fafc' }]}>
           <Text style={styles.noteTitle}>1. Método de Calibração:</Text>
           <Text style={styles.noteText}>{data.notas_tecnicas?.metodologia}</Text>

           <Text style={styles.noteTitle}>2. Condições Ambientais:</Text>
           <Text style={styles.noteText}>{data.notas_tecnicas?.condicoes}</Text>

           <Text style={styles.noteTitle}>3. Declaração de Incerteza (k=2, 95%):</Text>
           <Text style={styles.noteText}>{data.notas_tecnicas?.incerteza}</Text>

           <Text style={styles.noteTitle}>4. Declaração de Rastreabilidade e Regra de Decisão:</Text>
           <Text style={styles.noteText}>
              Os resultados apresentados referem-se exclusivamente ao equipamento calibrado nas condições especificadas. 
              A rastreabilidade metrológica é garantida através de padrões calibrados por laboratórios acreditados à RBC/Inmetro ou órgãos internacionais equivalentes. 
              A regra de decisão adotada para a declaração de conformidade baseia-se na comparação do Erro de Medição somado à Incerteza (U) contra as tolerâncias estabelecidas em normas técnicas vigentes e manuais do fabricante.
           </Text>

           <Text style={styles.noteTitle}>5. Observações:</Text>
           <Text style={styles.noteText}>{data.notas_tecnicas?.obs || 'Sem observações adicionais.'}</Text>
        </View>
      </View>

      {/* 🚀 6. CONFORMIDADE E VALIDADE RESTRUTURADA CONFORME SOLICITADO */}
      <View style={[styles.conclusionBox, { borderColor: data.status === 'REPROVADO' ? '#dc2626' : '#22c55e', backgroundColor: data.status === 'REPROVADO' ? '#fef2f2' : '#f0fdf4' }]} wrap={false}>
        <Text style={{ fontSize: 8, marginBottom: 4, color: '#334155' }}>PARECER TÉCNICO FINAL E CONFORMIDADE</Text>
        <Text style={[styles.conclusionText, { color: data.status === 'REPROVADO' ? '#dc2626' : '#16a34a' }]}>
          {data.status === 'REPROVADO' ? 'REPROVADO - NÃO VÁLIDO' : `APROVADO - VÁLIDO ATÉ ${data.validade}`}
        </Text>
      </View>

      {/* 7. ASSINATURAS */}
      <View style={styles.sigs} wrap={false}>
         <View style={styles.sigBox}>
            {urlExecutor ? <Image src={urlExecutor} style={styles.sigImg} /> : <View style={{height: 45}}/>}
            <View style={styles.sigLine}>
              <Text style={styles.sigName}>{data.assinaturas?.executor || 'Executor'}</Text>
              <Text style={styles.sigLabel}>Técnico Responsável</Text>
            </View>
         </View>
         <View style={styles.sigBox}>
            {urlResponsavel ? <Image src={urlResponsavel} style={styles.sigImg} /> : <View style={{height: 45}}/>}
            <View style={styles.sigLine}>
              <Text style={styles.sigName}>{data.assinaturas?.responsavel || 'Responsável'}</Text>
              <Text style={styles.sigLabel}>Engenheiro Clínico (CREA: {data.assinaturas?.responsavel_reg || '-'})</Text>
            </View>
         </View>
      </View>

      {/* 🚀 RODAPÉ E FIXO */}
      <View style={styles.footer} fixed>
        <Text>Documento oficial emitido digitalmente pela plataforma ATLAS SYSTEM MEDICAL | Autenticação Única: {data.id_doc}</Text>
      </View>
    </View>
  );
};

export const MetrologiaCertificadoPDF: React.FC<{ data: any }> = ({ data }) => (
  <Document><Page size="A4" style={styles.page}><CertificadoUnico data={data} /></Page></Document>
);

export const LoteCertificadosPDF: React.FC<{ lista: any[] }> = ({ lista }) => (
  <Document>
    {lista.map((d, i) => (
      <Page key={i} size="A4" style={styles.page}><CertificadoUnico data={d} /></Page>
    ))}
  </Document>
);