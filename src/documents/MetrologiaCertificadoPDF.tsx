import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { CertificadoPayload } from '../types/index';

// ==========================================
// 1. ESTILIZAÇÃO (LAYOUT A4 PROFISSIONAL)
// ==========================================
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30, // Margem de impressão
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.3,
  },
  // Cabeçalho
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    textAlign: 'right',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b', // Slate-800
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  // Seções Gerais
  section: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#F1F5F9',
    padding: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
    color: '#0f172a',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 90,
    fontWeight: 'bold',
    color: '#475569',
  },
  value: {
    flex: 1,
    color: '#0f172a',
  },
  // Tabelas
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    minHeight: 24,
  },
  tableHeader: {
    backgroundColor: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 8,
    color: '#475569',
  },
  tableCell: {
    padding: 5,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  // Larguras das colunas (Soma = 100%)
  col1: { width: '35%' }, // Descrição
  col2: { width: '10%', textAlign: 'center' }, // Unid
  col3: { width: '10%', textAlign: 'center' }, // Ref
  col4: { width: '15%', textAlign: 'center' }, // Faixa
  col5: { width: '10%', textAlign: 'center' }, // Lido
  col6: { width: '10%', textAlign: 'center' }, // Erro
  col7: { width: '10%', textAlign: 'center', borderRightWidth: 0 }, // Status

  // Rodapé e Assinaturas
  conclusionBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F0FDFA', // Verde bem claro
    borderWidth: 1,
    borderColor: '#14B8A6',
    borderRadius: 4,
    textAlign: 'center',
  },
  conclusionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D9488',
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
});

interface PDFProps {
  data: CertificadoPayload;
}

// ==========================================
// 2. COMPONENTE DOCUMENTO
// ==========================================
export const MetrologiaCertificadoPDF: React.FC<PDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* --- CABEÇALHO --- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* LOGO DA EMPRESA (Substitua src pelo base64 ou URL pública) */}
          {/* <Image src="https://sua-url-logo.com/logo.png" style={{ width: 100, marginBottom: 5 }} /> */}
          <Text style={{ fontSize: 18, fontWeight: 'heavy', color: '#4F46E5' }}>CLINIQ TECH</Text>
          <Text style={{ fontSize: 8, color: '#64748b' }}>Soluções em Engenharia Clínica</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.title}>Certificado de Calibração</Text>
          <Text style={styles.subtitle}>Nº {data.numero_certificado}</Text>
          <Text style={{ fontSize: 8, marginTop: 5 }}>Emissão: {data.data_emissao}</Text>
          <Text style={{ fontSize: 7, color: '#94a3b8' }}>UUID: {data.uuid_certificado.slice(0, 8)}...</Text>
        </View>
      </View>

      {/* --- DADOS DO CLIENTE E EQUIPAMENTO --- */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        {/* Lado Esquerdo: Cliente */}
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Dados do Cliente</Text>
          <View style={styles.row}><Text style={styles.label}>Razão Social:</Text><Text style={styles.value}>{data.cliente.razao_social}</Text></View>
          <View style={styles.row}><Text style={styles.label}>CNPJ/CPF:</Text><Text style={styles.value}>{data.cliente.cnpj}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Endereço:</Text><Text style={styles.value}>{data.cliente.endereco}</Text></View>
        </View>

        {/* Lado Direito: Equipamento */}
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Objeto de Ensaio</Text>
          <View style={styles.row}><Text style={styles.label}>Equipamento:</Text><Text style={styles.value}>{data.equipamento.nome}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Fabricante:</Text><Text style={styles.value}>{data.equipamento.fabricante} / {data.equipamento.modelo}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Nº Série:</Text><Text style={styles.value}>{data.equipamento.numero_serie}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Patrimônio:</Text><Text style={styles.value}>{data.equipamento.patrimonio}</Text></View>
        </View>
      </View>

      {/* --- METODOLOGIA E PADRÕES --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rastreabilidade Metrológica</Text>
        
        <View style={{ marginBottom: 10 }}>
          <View style={styles.row}><Text style={styles.label}>Procedimento:</Text><Text style={styles.value}>{data.metodologia.procedimento_nome} (Versão {data.metodologia.procedimento_versao})</Text></View>
          <View style={styles.row}><Text style={styles.label}>Data Execução:</Text><Text style={styles.value}>{data.metodologia.data_execucao}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Técnico:</Text><Text style={styles.value}>{data.metodologia.tecnico}</Text></View>
        </View>

        {/* Tabela de Padrões */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Padrão Utilizado</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Nº Série</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Certificado Origem</Text>
            <Text style={[styles.tableCell, { flex: 1, borderRightWidth: 0 }]}>Validade no Uso</Text>
          </View>
          {data.padroes.map((p, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{p.nome}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{p.numero_serie}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{p.certificado_rbc}</Text>
              <Text style={[styles.tableCell, { flex: 1, borderRightWidth: 0 }]}>{p.validade_no_uso}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* --- RESULTADOS DE MEDIÇÃO (A GRANDE TABELA) --- */}
      <View>
        <Text style={[styles.sectionTitle, { backgroundColor: 'transparent', paddingLeft: 0, color: '#334155' }]}>
          Resultados Obtidos
        </Text>
        
        <View style={styles.table}>
          {/* Header da Tabela */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.col1]}>Descrição do Teste</Text>
            <Text style={[styles.tableCell, styles.col2]}>Unid.</Text>
            <Text style={[styles.tableCell, styles.col3]}>Ref.</Text>
            <Text style={[styles.tableCell, styles.col4]}>Faixa Aceitável</Text>
            <Text style={[styles.tableCell, styles.col5]}>Valor Lido</Text>
            <Text style={[styles.tableCell, styles.col6]}>Erro</Text>
            <Text style={[styles.tableCell, styles.col7]}>Status</Text>
          </View>

          {/* Linhas de Dados */}
          {data.resultados.map((item, idx) => (
            <View key={idx} style={[
              styles.tableRow, 
              { backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' } // Efeito Zebrado
            ]}>
              <Text style={[styles.tableCell, styles.col1]}>{item.descricao}</Text>
              <Text style={[styles.tableCell, styles.col2]}>{item.unidade}</Text>
              <Text style={[styles.tableCell, styles.col3]}>{item.valor_referencia}</Text>
              <Text style={[styles.tableCell, styles.col4]}>{item.limite_min} a {item.limite_max}</Text>
              <Text style={[styles.tableCell, styles.col5, { fontWeight: 'bold' }]}>{item.valor_lido}</Text>
              <Text style={[styles.tableCell, styles.col6]}>{item.erro}</Text>
              
              {/* Coluna Status com Cor Condicional (Texto apenas, PDF não suporta className) */}
              <Text style={[
                styles.tableCell, styles.col7, 
                { color: item.conforme ? '#10B981' : '#EF4444', fontWeight: 'bold' }
              ]}>
                {item.conforme ? 'APROVADO' : 'FALHA'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* --- CONCLUSÃO --- */}
      <View style={styles.conclusionBox}>
        <Text>PARECER TÉCNICO FINAL</Text>
        <Text style={[
          styles.conclusionText,
          { color: data.resultado_final === 'REPROVADO' ? '#EF4444' : '#0D9488' }
        ]}>
          {data.resultado_final.replace('_', ' ')}
        </Text>
      </View>

      <View style={[styles.section, { marginTop: 10, minHeight: 40 }]}>
        <Text style={styles.sectionTitle}>Observações / Ressalvas</Text>
        <Text style={{ fontSize: 8, fontStyle: 'italic' }}>{data.observacoes}</Text>
      </View>

      {/* --- RODAPÉ --- */}
      <View style={styles.footer}>
        <Text>Este certificado não exime a responsabilidade do usuário quanto à verificação diária do equipamento.</Text>
        <Text>A reprodução deste documento só é permitida na íntegra. | CLINIQ TECH - Sistema de Gestão Enterprise</Text>
        <Text>Página 1 de 1 (Geração Automática: {data.data_emissao})</Text>
      </View>

    </Page>
  </Document>
);