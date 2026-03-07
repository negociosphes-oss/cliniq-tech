import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#1e3a8a', paddingBottom: 10, marginBottom: 15 },
  title: { fontSize: 14, fontWeight: 'heavy', color: '#1e3a8a', textTransform: 'uppercase' },
  subtitle: { fontSize: 8, color: '#64748b' },
  
  sectionTitle: { fontSize: 10, fontWeight: 'heavy', backgroundColor: '#f1f5f9', padding: 6, color: '#1e3a8a', marginBottom: 8, marginTop: 10, borderLeftWidth: 2, borderLeftColor: '#1e3a8a' },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { fontSize: 8, fontWeight: 'heavy', color: '#475569', width: 120 },
  value: { fontSize: 8, color: '#0f172a', flex: 1 },
  
  table: { width: '100%', borderWidth: 0.5, borderColor: '#cbd5e1', marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e3a8a', color: 'white', padding: 6, fontSize: 8, fontWeight: 'heavy' },
  tableRow: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#cbd5e1', padding: 6, fontSize: 7, alignItems: 'center' },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  
  col1: { width: '15%' }, 
  col2: { width: '20%' }, 
  col3: { width: '45%' }, 
  col4: { width: '20%', textAlign: 'right' }
});

export const EquipamentoDossiePDF = ({ equipamento, historico, configEmpresa, custoTotal, valorAquisicao, valorAtual }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
         <View>
            <Text style={styles.title}>{configEmpresa?.nome_fantasia || 'Engenharia Clínica'}</Text>
            <Text style={styles.subtitle}>Dossiê de Vida Útil e Custos do Equipamento Médico</Text>
         </View>
         <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.subtitle}>Data Emissão: {format(new Date(), 'dd/MM/yyyy')}</Text>
            <Text style={styles.subtitle}>TAG: {equipamento.tag}</Text>
         </View>
      </View>

      <Text style={styles.sectionTitle}>1. IDENTIFICAÇÃO DO EQUIPAMENTO</Text>
      <View style={styles.row}><Text style={styles.label}>Nome / Tecnologia:</Text><Text style={styles.value}>{equipamento.nome || equipamento.tecnologia?.nome}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Fabricante / Modelo:</Text><Text style={styles.value}>{equipamento.fabricante} / {equipamento.modelo}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Nº de Série / Patrimônio:</Text><Text style={styles.value}>{equipamento.n_serie || '-'} / {equipamento.patrimonio || '-'}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Classe de Risco (ANVISA):</Text><Text style={styles.value}>{equipamento.classe_risco || 'Não Informado'}</Text></View>

      <Text style={styles.sectionTitle}>2. ANÁLISE FINANCEIRA E DEPRECIAÇÃO</Text>
      <View style={styles.row}><Text style={styles.label}>Valor de Aquisição:</Text><Text style={styles.value}>R$ {valorAquisicao.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Valor Atual Estimado:</Text><Text style={styles.value}>R$ {valorAtual.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Custo Total em Manutenção:</Text><Text style={[styles.value, { color: '#dc2626', fontWeight: 'heavy' }]}>R$ {custoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</Text></View>

      <Text style={styles.sectionTitle}>3. HISTÓRICO DE ORDENS DE SERVIÇO ({historico.length} Registros)</Text>
      <View style={styles.table}>
         <View style={styles.tableHeader}>
            <Text style={styles.col1}>Data</Text>
            <Text style={styles.col2}>Tipo</Text>
            <Text style={styles.col3}>Defeito Relatado / Status</Text>
            <Text style={styles.col4}>Custo (R$)</Text>
         </View>
         {historico.map((os: any, i: number) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowAlt : {}]}>
               <Text style={styles.col1}>{format(new Date(os.created_at), 'dd/MM/yyyy')}</Text>
               <Text style={styles.col2}>{os.tipo}</Text>
               <Text style={styles.col3}>{os.defeito_relatado || 'Procedimento Normativo'} ({os.status})</Text>
               <Text style={styles.col4}>{(Number(os.valor_total)||0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</Text>
            </View>
         ))}
         {historico.length === 0 && (
             <View style={styles.tableRow}>
                 <Text style={{ padding: 4 }}>Nenhuma manutenção registrada para este equipamento.</Text>
             </View>
         )}
      </View>
    </Page>
  </Document>
);