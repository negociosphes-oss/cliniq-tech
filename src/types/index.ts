// ==============================================================================
// 1. USUÁRIOS E CONFIGURAÇÃO (LEGADO MANTIDO)
// ==============================================================================
export type Usuario = { 
  id: number; 
  email: string; 
  nome: string; 
  cargo: 'admin' | 'tecnico' | 'cliente';
  senha?: string;
}

export type Config = { 
  id: number; 
  nome_empresa: string; 
  logo_url: string; 
  cor_primaria: string; 
  cor_secundaria: string; 
}

// ==============================================================================
// 2. CLIENTES E TÉCNICOS (LEGADO MANTIDO)
// ==============================================================================
export type Cliente = { 
  id: number; 
  nome_fantasia: string; 
  responsavel: string; 
  email: string; 
  telefone: string; 
  doc_id: string; 
  dados_bancarios: string; 
  tipo_contrato: string; 
  contrato_url: string; 
  obs_contrato: string; 
}

export type Tecnico = { 
  id: number; 
  nome: string; 
  registro_profissional: string; 
  contato: string; 
  cpf: string; 
  cargo: string; 
  assinatura_url?: string; 
}

// ==============================================================================
// 3. EQUIPAMENTOS E TECNOLOGIA (LEGADO MANTIDO)
// ==============================================================================
export type Tecnologia = { 
  id: number; 
  nome: string; 
  fabricante: string; 
  modelo: string; 
  registro_anvisa: string; 
  criticidade: string; 
}

export type Equipamento = { 
  id: number; 
  tecnologia_id: number; 
  cliente_id?: number | null; 
  serie: string; 
  tag: string; 
  data_aquisicao: string; 
  tipo_aquisicao: string; 
  status: string; 
  setor: string; 
  proprietario: string; 
  situacao_locacao: string; 
  tecnologias?: Tecnologia; 
  clientes?: Cliente; 
}

// ==============================================================================
// 4. CRONOGRAMA DE MANUTENÇÃO (LEGADO MANTIDO)
// ==============================================================================
export type CronogramaPlano = {
  id: number;
  nome: string;
  cliente_id?: number;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  clientes?: Cliente;
  total_itens?: number;
  concluidos?: number;
}

export type Cronograma = { 
  id: number; 
  equipamento_id: number; 
  plano_id?: number | null; 
  data_programada: string; 
  tipo_servico: string; 
  status: string; 
  observacao: string; 
  prazo_dias: number; 
  frequencia: string; 
  os_gerada_id?: number | null; 
  equipamentos?: Equipamento; 
  cronograma_planos?: CronogramaPlano; 
  selecionado?: boolean; 
}

export type PlanWithStats = CronogramaPlano & {
  total: number;
  concluidos: number;
  pendentes: number;
  atrasados: number;
  highRiskCount: number;
  proximaData: string | null;
  progresso: number;
}

// ==============================================================================
// 5. ORDENS DE SERVIÇO (LEGADO MANTIDO)
// ==============================================================================
export type OrdemServico = {
  id: number; 
  equipamento_id: number; 
  tecnico: string; 
  tecnico_responsavel: string; 
  tipo: string; 
  descricao: string; 
  checklist: string; 
  pecas: string; 
  custo_pecas?: number; 
  custo_mao_obra?: number; 
  anexos: string; 
  status: string; 
  prioridade: string; 
  assinatura_tecnico: string; 
  assinatura_cliente: string; 
  created_at: string; 
  solicitante_nome: string; 
  solicitante_whatsapp: string; 
  solicitante_email: string; 
  equipamentos?: Equipamento; 
}

// ==============================================================================
// 6. OUTROS / UTILITÁRIOS (LEGADO MANTIDO)
// ==============================================================================
export type Apontamento = { id: number; os_id: number; tecnico_nome: string; data_inicio: string; data_fim: string; descricao: string }
export type TipoServico = { id: number; nome: string }
export type ModeloChecklist = { id: number; tipo_servico_id: number; titulo: string; itens: any } 
export type Manual = { id: number; tecnologia_id?: number; titulo: string; arquivo_url: string; categoria: string; tecnologias?: Tecnologia }
export type Padrao = { id: number; nome: string; fabricante: string; modelo: string; n_serie: string; data_calibracao: string; data_vencimento: string; certificado_url: string; status: string }
export type LogAuditoria = { id: number; acao: string; usuario_nome: string; data: string; cliente_nome: string }

// ==============================================================================
// 7. METROLOGIA 2.0 (LIMS - ENGENHARIA CLÍNICA AVANÇADA)
// ==============================================================================

export type MetrologiaStats = {
  total: number;
  vigentes: number;
  alertas: number;
  vencidos: number;
  pendentes: number;
}

export type MetrologiaPlano = {
  id: number;
  nome: string;
  cliente_id: number;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at?: string;
  clientes?: Cliente;
}

export interface PlanoMetrologiaWithStats extends MetrologiaPlano {
  stats: MetrologiaStats;
}

// Configuração de uma linha de teste (Template)
export type PontoTesteConfig = {
  id: string; 
  descricao: string; 
  unidade: string; 
  valor_referencia: number; 
  tolerancia_tipo: '%' | 'abs'; // % = Percentual, abs = Absoluto (Fixo)
  tolerancia_valor: number; 
}

// O Resultado de uma linha de teste (Execução)
export type PontoTesteResultado = PontoTesteConfig & {
  valor_lido: number;
  erro: number;
  incerteza_k?: number;
  aprovado: boolean;
}

// O Template de Teste (Ex: "Teste de Fluxo - Ventilador")
export type MetrologiaProcedimento = {
  id: number;
  titulo: string;
  tipo_equipamento: string; 
  pontos_config: PontoTesteConfig[]; // JSONB com os pontos a testar
  ativo: boolean;
  created_at: string;
}

// Padrão de Referência (Analisadores)
export type MetrologiaPadrao = {
  id: number;
  nome: string;
  fabricante: string;
  modelo: string;
  n_serie: string;
  data_vencimento: string;
  ativo: boolean;
  certificado_url?: string;
  data_calibracao?: string;
}

/**
 * Entidade Filha: O registro da calibração LIMS.
 */
export type MetrologiaItem = {
  id: number;
  plano_id: number;
  equipamento_id: number;
  
  // Header Técnico
  tipo_calibracao: string; 
  laboratorio: string;
  norma_referencia?: string;
  numero_certificado?: string;
  condicoes_ambientais?: string;
  
  // Engenharia
  metodo_calculo?: string; // Ex: Comparação Direta
  fator_k?: number; // Ex: 2.00
  incerteza_padrao?: number; // Ex: 0.05
  
  // Datas e Status
  data_calibracao: string;
  data_vencimento: string;
  status: 'Vigente' | 'Vencida' | 'Alerta' | 'Pendente' | 'Arquivada';
  
  observacoes?: string;
  created_at: string;

  // LIMS Data (JSONB no Banco)
  padroes_utilizados_ids?: number[]; 
  dados_medicao?: PontoTesteResultado[]; 
  conclusao_final?: 'Aprovado' | 'Reprovado' | 'Restrito';

  // Joins
  equipamentos?: any; 
  metrologia_planos?: any;
  metrologia_certificados?: MetrologiaCertificado[];
}

export type MetrologiaCertificado = {
  id: number;
  metrologia_item_id: number;
  titulo: string;
  arquivo_url: string;
  tipo_arquivo: string;
  uploaded_at: string;
}

// ==============================================================================
// 8. CHECKLISTS
// ==============================================================================
export type ChecklistItemType = 'sim_nao' | 'texto' | 'numero' | 'foto' | 'cabecalho';
export interface ChecklistItemConfig { id: string; ordem: number; texto: string; tipo: ChecklistItemType; obrigatorio: boolean; opcoes?: string[]; }
export interface ChecklistModelo { id: number; titulo: string; descricao: string; itens_configuracao: ChecklistItemConfig[]; ativo: boolean; created_at: string; }
export interface ChecklistRegra { id: number; tipo_servico: string; tecnologia_id: number; checklist_id: number; ativo: boolean; tecnologias?: Tecnologia; checklists_biblioteca?: ChecklistModelo; }
export interface ChecklistExecucao { id: number; ordem_servico_id: number; checklist_id: number; respostas_json: Record<string, any>; status: 'Rascunho' | 'Finalizado'; tecnico_responsavel: string; data_preenchimento: string; }