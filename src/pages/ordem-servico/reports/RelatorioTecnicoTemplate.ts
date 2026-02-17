/**
 * ============================================================================
 * MOTOR DE RELATÓRIO TÉCNICO OS - TEMA VISUAL NANO (AZUL & VERDE)
 * ============================================================================
 * Auditoria: Correção do posicionamento das Assinaturas (evita sobreposição).
 */

const gerarCorpoDaOS = (dados: any) => {
  const { os, apontamentos, checklistData, logoUrl, nomeEmpresa } = dados;

  const eq = os?.equipamentos || os?.equipamento || {};
  const cli = eq?.clientes || eq?.cliente || os?.clientes || os?.cliente || {};
  const tec = eq?.tecnologias || eq?.tecnologia || {};

  const equipNome = os?.equipamento_nome || tec?.nome || eq?.nome || 'Equipamento Hospitalar';
  const equipTag = eq?.tag || os?.equipamento_tag || 'S/ TAG';
  const equipModelo = eq?.modelo || os?.equipamento_modelo || '-';
  const equipSerie = eq?.numero_serie || eq?.n_serie || os?.equipamento_serie || '-';
  const clienteNome = cli?.nome_fantasia || cli?.nome || 'Unidade não identificada';

  const nomeTecnicoFallback = (apontamentos && apontamentos.length > 0) ? apontamentos[0].tecnico_nome : 'Executor não identificado';
  const nomeTecnicoFinal = os.tecnico_nome || nomeTecnicoFallback;

  let sectionCounter = 3;

  let checklistHtml = '';
  if (checklistData && checklistData.perguntas && checklistData.perguntas.length > 0) {
    const rows = checklistData.perguntas.map((p: any, i: number) => {
      const resp = checklistData.respostas?.[i] || 'N/A';
      return `<tr class="tr-stripe"><td style="width:80%">${p.texto}</td><td style="text-align:center; font-weight:bold;">${resp}</td></tr>`;
    }).join('');
    
    checklistHtml = `
      <div class="box box-green">
        <div class="box-h h-green">${sectionCounter}. Checklist de Inspeção e Conformidade</div>
        <div class="box-b" style="padding:0">
          <table>
            <thead><tr><th class="th-green">Parâmetro / Requisito Avaliado</th><th class="th-green" style="text-align:center">Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
    sectionCounter++;
  }

  let imagensHtml = '';
  try {
    const anexosRaw = os?.anexos;
    const lista = typeof anexosRaw === 'string' ? JSON.parse(anexosRaw) : (Array.isArray(anexosRaw) ? anexosRaw : []);
    
    if (lista.length > 0) {
      const imagensProcessadas = lista.map((u: any) => {
          const urlStr = typeof u === 'string' ? u : (u?.url || u?.path || '');
          if (!urlStr || typeof urlStr !== 'string') return '';
          const fullUrl = urlStr.startsWith('http') ? urlStr : `https://dnimxqxgtvltgvrrabur.supabase.co/storage/v1/object/public/os-imagens/evidências/${urlStr}`;
          return `<div class="ev-item"><img src="${fullUrl}" /><div class="ev-cap">Evidência Fotográfica</div></div>`;
      }).filter(Boolean).join('');
      
      if (imagensProcessadas) {
        imagensHtml = `
        <div class="box box-blue" style="page-break-inside:avoid">
          <div class="box-h h-blue">${sectionCounter}. Evidências Fotográficas</div>
          <div class="box-b"><div class="gallery">${imagensProcessadas}</div></div>
        </div>`;
      }
    }
  } catch (e) { console.error("Erro render fotos:", e); }

  const processSignature = (sigStr: any) => {
    if (!sigStr || typeof sigStr !== 'string' || sigStr === 'null' || sigStr === 'undefined' || sigStr.trim() === '') return null;
    if (sigStr.startsWith('data:image')) return sigStr;
    if (sigStr.startsWith('http')) return sigStr;
    return `https://dnimxqxgtvltgvrrabur.supabase.co/storage/v1/object/public/os-imagens/assinaturas/${sigStr}`;
  };

  const sigTecnico = processSignature(os.assinatura_tecnico);
  const sigCliente = processSignature(os.assinatura_cliente);

  const rowsMO = (apontamentos || []).map((apt: any) => {
    const d1 = new Date(apt.data_inicio);
    const d2 = new Date(apt.data_fim);
    const h = Math.floor((d2.getTime() - d1.getTime()) / 3600000);
    const m = Math.floor(((d2.getTime() - d1.getTime()) % 3600000) / 60000);
    return `<tr class="tr-stripe"><td>${d1.toLocaleString('pt-BR')}</td><td>${apt.tecnico_nome || 'Técnico'}</td><td>${apt.descricao || apt.tipo}</td><td style="text-align:center; font-weight:bold;">${h}h ${m}m</td></tr>`;
  }).join('');

  const authHash = `OS-${new Date().getFullYear()}-${String(os.id).padStart(6, '0')}`;

  return `
    <div class="os-page">
      <div class="header-card">
        <div class="logo-container">
          ${logoUrl ? `<img src="${logoUrl}" />` : '<div style="color:#000; font-weight:bold">ATLAS</div>'}
        </div>
        <div class="header-titles">
          <h1>${nomeEmpresa || 'ATLAS SYSTEM MEDICAL'}</h1>
          <p>Laudo Técnico de Engenharia Clínica</p>
        </div>
        <div class="os-badge">
          <div class="num">OS #${os.id}</div>
          <div class="date">Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="box box-blue">
          <div class="box-h h-blue">Unidade / Solicitante</div>
          <div class="box-b b-blue">
            <div class="row"><span class="lbl">Unidade:</span> <div class="val">${clienteNome}</div></div>
            <div class="row"><span class="lbl">Solicitante:</span> <div class="val">${os.solicitante_nome || '-'}</div></div>
            <div class="row"><span class="lbl">Setor:</span> <div class="val">${os.solicitante_setor || eq.setor || '-'}</div></div>
          </div>
        </div>
        
        <div class="box box-blue">
          <div class="box-h h-blue">Ativo Hospitalar</div>
          <div class="box-b b-blue">
            <div class="row"><span class="lbl">Equipamento:</span> <div class="val val-green">${equipNome}</div></div>
            <div class="row"><span class="lbl">Modelo/Sér:</span> <div class="val val-green">${equipModelo} | ${equipSerie}</div></div>
            <div class="row"><span class="lbl">TAG:</span> <div class="val val-green">${equipTag}</div></div>
          </div>
        </div>
      </div>

      <div class="box box-blue">
        <div class="box-h h-blue">1. Diagnóstico e Intervenção</div>
        <div class="box-b">
          <span class="lbl" style="color:#64748b">Descrição do Problema / Motivo do Chamado:</span>
          <div class="txt-block">${os.descricao_problema || os.descricao || 'Não informado'}</div>
          <div style="margin-top:12px">
            <span class="lbl" style="color:#16a34a">Solução Técnica Aplicada:</span>
            <div class="txt-block" style="background:#f0fdf4; border-color:#bbf7d0; color:#166534; font-weight:bold;">${os.solucao_aplicada || 'Serviço em execução'}</div>
          </div>
        </div>
      </div>

      <div class="box box-blue">
        <div class="box-h h-blue">2. Registro de Mão de Obra e Deslocamento</div>
        <div class="box-b" style="padding:0">
          <table>
            <thead><tr><th class="th-blue">Data/Hora</th><th class="th-blue">Profissional</th><th class="th-blue">Atividade</th><th class="th-blue" style="text-align:center">Duração</th></tr></thead>
            <tbody>${rowsMO || '<tr><td colspan="4" style="text-align:center; padding:15px; color:#64748b;">Sem registros de atividades.</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      ${checklistHtml}
      ${imagensHtml}

      <div class="sigs">
        <div class="sig-box">
          <div class="sig-wrapper">
             ${sigTecnico ? `<img src="${sigTecnico}" class="sig-img"/>` : ''}
          </div>
          <div class="sig-line"></div>
          <div class="sig-name">${nomeTecnicoFinal}</div>
          <div class="sig-label">Responsável Técnico / Executor</div>
        </div>
        <div class="sig-box">
          <div class="sig-wrapper">
             ${sigCliente ? `<img src="${sigCliente}" class="sig-img"/>` : ''}
          </div>
          <div class="sig-line"></div>
          <div class="sig-name">${os.solicitante_nome || 'Responsável Local'}</div>
          <div class="sig-label">Aceite da Unidade (Cliente)</div>
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-content">
           <div class="footer-left">
              <strong>${nomeEmpresa || 'ATLAS SYSTEM MEDICAL'}</strong><br/>
              Gestão e Engenharia Clínica
           </div>
           <div class="footer-center">
              Laudo com validade digital<br/>
              <span class="auth-hash">CHAVE: ${authHash}</span>
           </div>
           <div class="footer-right">
              Página 1<br/>
              Impresso em: ${new Date().toLocaleDateString('pt-BR')}
           </div>
        </div>
      </div>
    </div>
  `;
};

const styles = `
  <style>
    @page { size: A4; margin: 0; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .os-page { page-break-after: always; } }
    
    body { font-family: 'Helvetica', sans-serif; color: #1e293b; font-size: 9pt; margin: 0; padding: 0; background: #e2e8f0; }
    
    .os-page { padding: 10mm 10mm 25mm 10mm; min-height: 297mm; box-sizing: border-box; position: relative; background: #fff; margin: 0 auto; }
    
    .header-card { background: #1e3a8a; border-radius: 8px; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .logo-container { background: #fff; padding: 5px; border-radius: 6px; width: 120px; height: 50px; display: flex; justify-content: center; align-items: center; }
    .logo-container img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .header-titles { flex: 1; padding: 0 15px; }
    .header-titles h1 { margin: 0; font-size: 15pt; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
    .header-titles p { margin: 2px 0 0 0; font-size: 8.5pt; color: #bfdbfe; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
    .os-badge { background: #fff; padding: 6px 12px; border-radius: 6px; text-align: center; border: 2px solid #cbd5e1; }
    .os-badge .num { font-size: 16pt; font-weight: 900; color: #1e3a8a; line-height: 1; }
    .os-badge .date { font-size: 7pt; color: #64748b; margin-top: 2px; font-weight: bold; text-transform: uppercase; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }

    .box { border-radius: 8px; overflow: hidden; margin-bottom: 12px; border: 1.5px solid #cbd5e1; }
    .box-blue { border-color: #3b82f6; }
    .box-green { border-color: #22c55e; }
    .box-h { padding: 6px 12px; font-weight: 900; font-size: 8.5pt; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
    .h-blue { background: #0284c7; }
    .h-green { background: #16a34a; }
    .box-b { padding: 10px 12px; background: #fff; }
    .b-blue { background: #f0f9ff; }

    .row { display: flex; align-items: center; margin-bottom: 5px; }
    .lbl { width: 95px; font-weight: 900; color: #334155; font-size: 7.5pt; text-transform: uppercase; }
    .val { flex: 1; background: #e0f2fe; color: #0f172a; padding: 4px 8px; border-radius: 4px; font-weight: 800; font-size: 8pt; border: 1px solid #bae6fd; text-transform: uppercase; }
    .val-green { background: #dcfce7; border-color: #bbf7d0; color: #166534; }
    .txt-block { padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; margin-top: 4px; white-space: pre-wrap; font-size: 8.5pt; color: #0f172a; line-height: 1.5; }

    table { width: 100%; border-collapse: collapse; }
    th { padding: 8px 10px; font-size: 7.5pt; font-weight: 900; text-align: left; text-transform: uppercase; border-bottom: 2px solid #fff; }
    .th-blue { background: #bae6fd; color: #0369a1; }
    .th-green { background: #bbf7d0; color: #166534; }
    td { padding: 7px 10px; font-size: 8pt; font-weight: 500; border-bottom: 1px solid #e2e8f0; color: #334155; }
    .tr-stripe:nth-child(even) { background: #f1f5f9; }

    .gallery { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .ev-item { border: 1px solid #cbd5e1; padding: 5px; text-align: center; background: #fff; border-radius: 6px; }
    .ev-item img { width: 100%; height: 160px; object-fit: contain; border-radius: 4px; background: #f8fafc; }
    .ev-cap { font-size: 7pt; font-weight: bold; margin-top: 6px; text-transform: uppercase; color: #64748b; }

    /* CSS CORRIGIDO DAS ASSINATURAS */
    .sigs { display: flex; justify-content: space-around; margin-top: 40px; page-break-inside: avoid; }
    .sig-box { width: 42%; text-align: center; }
    .sig-wrapper { height: 70px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 4px; }
    .sig-img { max-height: 70px; max-width: 100%; object-fit: contain; }
    .sig-line { border-bottom: 1.5px solid #94a3b8; margin-bottom: 6px; }
    .sig-name { font-weight: 900; font-size: 9.5pt; text-transform: uppercase; color: #0f172a; padding-top: 4px; }
    .sig-label { font-size: 7pt; color: #64748b; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
    
    .footer { position: absolute; bottom: 10mm; left: 10mm; right: 10mm; font-size: 7.5pt; color: #64748b; }
    .footer-content { display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #cbd5e1; padding-top: 10px; }
    .footer-left { text-align: left; line-height: 1.4; }
    .footer-left strong { color: #0f172a; font-size: 8pt; text-transform: uppercase; }
    .footer-center { text-align: center; line-height: 1.4; }
    .auth-hash { display: inline-block; margin-top: 4px; font-family: 'Courier New', Courier, monospace; font-size: 8pt; color: #0369a1; background: #f0f9ff; border: 1px solid #bae6fd; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
    .footer-right { text-align: right; line-height: 1.4; }
  </style>
`;

export const imprimirRelatorio = (dados: any) => {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<html><head><title>OS #${dados.os.id}</title>${styles}</head><body>${gerarCorpoDaOS(dados)}<script>setTimeout(()=>window.print(),800)</script></body></html>`);
  win.document.close();
};

export const imprimirRelatoriosEmLote = (lista: any[]) => {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<html><head><title>Lote Atlas</title>${styles}</head><body>`);
  lista.forEach(d => win.document.write(gerarCorpoDaOS(d)));
  win.document.write(`<script>setTimeout(()=>window.print(),1500)</script></body></html>`);
  win.document.close();
};