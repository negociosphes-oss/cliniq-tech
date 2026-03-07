import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  // Margem reduzida para caber mais conteúdo e dar aspecto profissional
  page: { padding: 30, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  
  // Cabeçalho mais enxuto
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: '#1e3a8a', paddingBottom: 10, marginBottom: 15 },
  logoBox: { width: '25%' },
  logo: { width: 100, maxHeight: 45, objectFit: 'contain' },
  
  companyInfoBox: { width: '45%', alignItems: 'center', textAlign: 'center' },
  companyName: { fontSize: 10, fontWeight: 'bold', color: '#0f172a', marginBottom: 2, textTransform: 'uppercase' },
  companyDetails: { fontSize: 6.5, color: '#475569', lineHeight: 1.3 },
  
  headerRightBox: { width: '30%', alignItems: 'flex-end' },
  title: { fontSize: 10.5, fontWeight: 'heavy', color: '#1e3a8a', marginBottom: 3, textAlign: 'right' },
  subtitle: { fontSize: 7.5, color: '#64748b' },
  
  // Seções mais compactas
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 8.5, fontWeight: 'bold', backgroundColor: '#f1f5f9', paddingVertical: 4, paddingHorizontal: 6, color: '#1e3a8a', marginBottom: 6, borderLeftWidth: 2, borderLeftColor: '#1e3a8a', textTransform: 'uppercase' },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { fontSize: 7.5, fontWeight: 'bold', color: '#475569', width: 110 },
  value: { fontSize: 7.5, color: '#0f172a', flex: 1, fontWeight: 'bold' },

  // Tabela Refinada (Padrão Laboratório)
  table: { width: '100%', borderWidth: 0.5, borderColor: '#cbd5e1', marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a8a', color: 'white', alignItems: 'center' },
  tableRow: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#cbd5e1', alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f8fafc' }, // Efeito Zebra
  tableRowSection: { backgroundColor: '#e2e8f0', borderTopWidth: 0.5, borderTopColor: '#cbd5e1', paddingVertical: 4, paddingHorizontal: 6 },
  
  tableColDesc: { width: '45%', paddingVertical: 4, paddingHorizontal: 6, fontSize: 7.5 },
  tableColValue: { width: '20%', paddingVertical: 4, paddingHorizontal: 6, fontSize: 7.5, textAlign: 'center' },
  tableColLimit: { width: '20%', paddingVertical: 4, paddingHorizontal: 6, fontSize: 7.5, textAlign: 'center' },
  tableColResult: { width: '15%', paddingVertical: 4, paddingHorizontal: 6, fontSize: 7.5, textAlign: 'center', fontWeight: 'bold' },
  
  sectionText: { fontSize: 7.5, fontWeight: 'heavy', color: '#0f172a', textTransform: 'uppercase' },

  pass: { color: '#16a34a' },
  fail: { color: '#dc2626' },

  // Caixas de texto de apoio
  conclusionBox: { marginTop: 8, padding: 8, borderWidth: 0.5, borderColor: '#cbd5e1', borderRadius: 4, backgroundColor: '#f0fdf4', alignItems: 'center' },
  conclusionBoxFail: { marginTop: 8, padding: 8, borderWidth: 0.5, borderColor: '#fca5a5', borderRadius: 4, backgroundColor: '#fef2f2', alignItems: 'center' },
  conclusionText: { fontSize: 9.5, fontWeight: 'heavy', textTransform: 'uppercase' },

  normativeBox: { marginTop: 8, padding: 6, backgroundColor: '#f1f5f9', borderRadius: 4, borderWidth: 0.5, borderColor: '#cbd5e1' },
  normativeTitle: { fontSize: 7.5, fontWeight: 'heavy', color: '#1e3a8a', marginBottom: 3, textTransform: 'uppercase' },
  normativeText: { fontSize: 6.5, color: '#475569', lineHeight: 1.4, marginBottom: 1.5, textAlign: 'justify' },

  // Rodapé
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30 },
  signatureSection: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  signatureBox: { alignItems: 'center', width: '40%' },
  signatureImage: { width: 100, height: 35, objectFit: 'contain', marginBottom: 4 },
  signatureLine: { width: '100%', borderTopWidth: 0.5, borderTopColor: '#94a3b8', marginTop: 4, paddingTop: 4, alignItems: 'center' },
  signatureName: { fontSize: 8, fontWeight: 'heavy', color: '#0f172a' },
  signatureRole: { fontSize: 7, color: '#64748b' },
  pageNumber: { position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', fontSize: 6.5, color: '#94a3b8' },

  // Rastreabilidade Compacta
  traceBox: { marginTop: 6, padding: 6, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 0.5, borderColor: '#cbd5e1' },
  traceRow: { flexDirection: 'row', marginBottom: 3, alignItems: 'center' },
  traceLabel: { fontSize: 7, fontWeight: 'heavy', color: '#1e293b' },
  traceValue: { fontSize: 7, color: '#475569' }
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

  const nomeEmpresaOficial = empresaConfig?.razao_social || empresaConfig?.nome_empresa || empresaConfig?.nome_fantasia || 'NOME DA EMPRESA NÃO CADASTRADO';
  const enderecoOficial = empresaConfig?.endereco_completo || empresaConfig?.endereco;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* CABEÇALHO */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            {empresaConfig?.logo_url ? (
              <Image src={empresaConfig.logo_url} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: 'heavy', color: '#1e3a8a' }}>{empresaConfig?.nome_fantasia || 'Atlasum'}</Text>
            )}
          </View>
          <View style={styles.companyInfoBox}>
             <Text style={styles.companyName}>{nomeEmpresaOficial}</Text>
             {empresaConfig?.cnpj && <Text style={styles.companyDetails}>CNPJ: {empresaConfig.cnpj}</Text>}
             {(empresaConfig?.telefone || empresaConfig?.email) && (
                <Text style={styles.companyDetails}>
                  {empresaConfig.telefone ? `Tel: ${empresaConfig.telefone} ` : ''}
                  {(empresaConfig.telefone && empresaConfig.email) ? ' | ' : ''}
                  {empresaConfig.email ? `E-mail: ${empresaConfig.email}` : ''}
                </Text>
             )}
             {enderecoOficial && <Text style={styles.companyDetails}>{enderecoOficial}</Text>}
          </View>
          <View style={styles.headerRightBox}>
            <Text style={styles.title}>LAUDO DE SEGURANÇA ELÉTRICA</Text>
            <Text style={styles.subtitle}>Certificado Nº: TSE-{data.id.toString().padStart(5, '0')}</Text>
            <Text style={styles.subtitle}>Data: {format(new Date(data.data_ensaio), 'dd/MM/yyyy')}</Text>
          </View>
        </View>

        {/* IDENTIFICAÇÃO DO EQUIPAMENTO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. IDENTIFICAÇÃO DO EQUIPAMENTO E PROPRIETÁRIO</Text>
          <View style={styles.row}><Text style={styles.label}>Cliente / Unidade:</Text><Text style={styles.value}>{cliente.nome_fantasia || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Equipamento:</Text><Text style={styles.value}>{equip.tecnologias?.nome || equip.nome || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Fabricante / Modelo:</Text><Text style={styles.value}>{equip.fabricante || 'N/A'} / {equip.modelo || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Nº de Série / TAG:</Text><Text style={styles.value}>{numeroSerieEquipamento} / {equip.tag || 'N/A'}</Text></View>
        </View>

        {/* METODOLOGIA E RASTREABILIDADE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. METODOLOGIA NORMATIVA E RASTREABILIDADE</Text>
          <View style={styles.row}><Text style={styles.label}>Diretriz / Norma Base:</Text><Text style={styles.value}>{data.norma_aplicada || 'ABNT NBR IEC 62353 - Ensaios Recorrentes'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Classe / Peça Aplicada:</Text><Text style={styles.value}>{perfil.classe_equipamento || 'N/A'} / {perfil.tipo_peca_aplicada || 'N/A'}</Text></View>

          <View style={styles.traceBox}>
            {padraoInfo ? (
              <>
                <View style={styles.traceRow}>
                   <Text style={[styles.traceLabel, { width: '15%' }]}>Analisador TSE:</Text>
                   <Text style={[styles.traceValue, { width: '45%', fontWeight: 'heavy', color: '#0f172a' }]}>{padraoInfo.nome} {padraoInfo.fabricante} {padraoInfo.modelo}</Text>
                   <Text style={[styles.traceLabel, { width: '10%' }]}>TAG:</Text>
                   <Text style={[styles.traceValue, { width: '10%' }]}>{padraoInfo.codigo_interno || '-'}</Text>
                   <Text style={[styles.traceLabel, { width: '8%' }]}>Série:</Text>
                   <Text style={[styles.traceValue, { width: '12%' }]}>{padraoInfo.n_serie || padraoInfo.numero_serie || '-'}</Text>
                </View>
                <View style={styles.traceRow}>
                   <Text style={[styles.traceLabel, { width: '15%' }]}>Laboratório (RBC):</Text>
                   <Text style={[styles.traceValue, { width: '35%' }]}>{padraoInfo.laboratorio_calibrador || padraoInfo.orgao_calibrador || '-'}</Text>
                   <Text style={[styles.traceLabel, { width: '10%' }]}>Emissão:</Text>
                   <Text style={[styles.traceValue, { width: '10%' }]}>{padraoInfo.data_ultima_calibracao ? format(new Date(padraoInfo.data_ultima_calibracao), 'dd/MM/yyyy') : '-'}</Text>
                   <Text style={[styles.traceLabel, { width: '10%' }]}>Validade:</Text>
                   <Text style={[styles.traceValue, { width: '10%' }]}>{padraoInfo.data_vencimento ? format(new Date(padraoInfo.data_vencimento), 'dd/MM/yyyy') : '-'}</Text>
                </View>
                <View style={styles.traceRow}>
                   <Text style={[styles.traceLabel, { width: '15%' }]}>Certificado Ref.:</Text>
                   <Text style={[styles.traceValue, { width: '85%' }]}>{padraoInfo.n_certificado || padraoInfo.certificado || '-'}</Text>
                </View>
              </>
            ) : (
              <View style={styles.traceRow}><Text style={[styles.traceLabel, { width: '15%' }]}>Padrão Utilizado:</Text><Text style={[styles.traceValue, { width: '85%' }]}>{padraoString}</Text></View>
            )}
          </View>
        </View>

        {/* TABELA DE RESULTADOS (COM EFEITO ZEBRA) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. EXECUÇÃO DOS ENSAIOS ELÉTRICOS</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableColDesc}>Parâmetro Normativo Avaliado</Text>
              <Text style={styles.tableColValue}>Valor Medido</Text>
              <Text style={styles.tableColLimit}>Limite Exigido</Text>
              <Text style={styles.tableColResult}>Parecer</Text>
            </View>

            {resultados.map((item: any, idx: number) => {
              const tipo = item.tipo_campo || 'medicao';
              const isEven = idx % 2 === 0; // Para o efeito zebra

              if (tipo === 'secao') {
                 return (
                   <View style={styles.tableRowSection} key={idx}>
                     <Text style={styles.sectionText}>{item.nome}</Text>
                   </View>
                 );
              }

              if (tipo === 'booleano') {
                 return (
                   <View style={[styles.tableRow, isEven ? styles.tableRowAlt : {}]} key={idx}>
                     <Text style={styles.tableColDesc}>{item.nome}</Text>
                     <Text style={styles.tableColValue}>{item.aprovado ? 'Conforme' : 'Não Conforme'}</Text>
                     <Text style={styles.tableColLimit}>Integridade Visual</Text>
                     <Text style={[styles.tableColResult, item.aprovado ? styles.pass : styles.fail]}>
                       {item.aprovado === true ? 'APROVADO' : item.aprovado === false ? 'REPROVADO' : '-'}
                     </Text>
                   </View>
                 );
              }

              return (
                <View style={[styles.tableRow, isEven ? styles.tableRowAlt : {}]} key={idx}>
                  <Text style={styles.tableColDesc}>{item.nome}</Text>
                  <Text style={styles.tableColValue}>{item.valor_medido ? `${item.valor_medido} ${safeText(item.unidade)}` : '-'}</Text>
                  <Text style={styles.tableColLimit}>{safeText(item.operador)} {item.limite} {safeText(item.unidade)}</Text>
                  <Text style={[styles.tableColResult, item.aprovado === true ? styles.pass : item.aprovado === false ? styles.fail : {}]}>
                    {item.aprovado === true ? 'APROVADO' : item.aprovado === false ? 'REPROVADO' : '-'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* NOTAS NORMATIVAS (TEXTO MENOR E COMPACTO) */}
        <View style={styles.normativeBox}>
           <Text style={styles.normativeTitle}>Notas Normativas e Legenda (ABNT NBR IEC 62353 / ANVISA)</Text>
           <Text style={styles.normativeText}>• <Text style={{fontWeight: 'heavy'}}>Condição Normal (NORMAL):</Text> Equipamento operando sob condições nominais com todas as proteções ativas.</Text>
           <Text style={styles.normativeText}>• <Text style={{fontWeight: 'heavy'}}>Falha Única (SFC):</Text> Condição em que um único meio de proteção está defeituoso (Ex: Falha no Terra ou Neutro Aberto). A norma exige que a fuga não exceda o dobro do limite normal em caso de falha.</Text>
           <Text style={styles.normativeText}>• <Text style={{fontWeight: 'heavy'}}>Polaridade Reversa:</Text> Teste executado invertendo as conexões de Fase e Neutro da rede para simular instalações elétricas incorretas.</Text>
           <Text style={styles.normativeText}>• <Text style={{fontWeight: 'heavy'}}>Limites (Peça Aplicada):</Text> Tipo B e BF (Máx. admissível: 5000 µA). Tipo CF - Aplicação Cardíaca Direta (Máx. admissível: 50 µA em condição normal).</Text>
           <Text style={styles.normativeText}>• O equipamento é considerado SEGURO para uso clínico apenas se todos os parâmetros visuais e elétricos forem aprovados simultaneamente.</Text>
        </View>

        {/* CONCLUSÃO (VERDE SE PASSOU, VERMELHO SE REPROVOU) */}
        <View style={styles.section}>
          <View style={data.resultado === 'APROVADO' ? styles.conclusionBox : styles.conclusionBoxFail}>
            <Text style={[styles.conclusionText, data.resultado === 'APROVADO' ? styles.pass : styles.fail]}>SITUAÇÃO DO EQUIPAMENTO: {data.resultado}</Text>
          </View>
        </View>

        {/* RODAPÉ E ASSINATURA */}
        <View style={styles.footer}>
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              {tecnico.assinatura_url ? <Image src={tecnico.assinatura_url} style={styles.signatureImage} /> : <View style={{ height: 35 }} />}
              <View style={styles.signatureLine}>
                 <Text style={styles.signatureName}>{tecnico.nome || 'Técnico Executor'}</Text>
                 <Text style={styles.signatureRole}>{tecnico.cargo || 'Engenharia Clínica'}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* NÚMERO DA PÁGINA */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (`Página ${pageNumber} de ${totalPages} - Documento restrito e auditável.`)} fixed />
      </Page>
    </Document>
  );
};