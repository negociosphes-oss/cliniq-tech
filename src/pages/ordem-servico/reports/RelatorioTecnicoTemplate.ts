/**
 * ============================================================================
 * MOTOR DE RELATÓRIO TÉCNICO OS - TEMA VISUAL NANO (AZUL & VERDE)
 * ============================================================================
 */

const gerarCorpoDaOS = (arg1: any, arg2?: any, arg3?: any) => {
  const os = arg1.os ? arg1.os : arg1;
  const apontamentos = arg1.apontamentos ? arg1.apontamentos : (arg2 || []);
  const pecas = arg1.pecas ? arg1.pecas : (os.pecas || []);
  const checklistData = arg1.checklistData ? arg1.checklistData : os.checklistData;
  
  const config = arg3 || {};
  const logoUrl = arg1.logoUrl || config.logo_url;
  const nomeEmpresa = arg1.nomeEmpresa || config.nome_empresa || config.nome_fantasia;

  const eq = os?.equipamentos || os?.equipamento || {};
  const cli = eq?.clientes || eq?.cliente || os?.clientes || os?.cliente || {};
  const tec = eq?.tecnologias || eq?.tecnologia || os?.tecnologias || os?.tecnologia || {};

  const equipNome = os?.equipamento_nome || tec?.nome || eq?.nome || 'Equipamento Hospitalar';
  const equipTag = eq?.tag || os?.equipamento_tag || 'S/ TAG';
  const equipModelo = eq?.modelo || tec?.modelo || os?.equipamento_modelo || '-';
  const equipSerie = eq?.numero_serie || eq?.n_serie || os?.equipamento_serie || '-';
  const clienteNome = cli?.nome_fantasia || cli?.razao_social || cli?.nome || 'Unidade não identificada';

  const dataAbertura = os?.created_at || os?.data_abertura ? new Date(os.created_at || os.data_abertura).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
  const dataFechamento = os?.data_fechamento ? new Date(os.data_fechamento).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
  const statusOS = os?.status || 'Pendente';
  
  const corStatus = statusOS === 'Concluída' || statusOS === 'Finalizada' ? 'background:#dcfce7; color:#166534; border-color:#bbf7d0;' : 'background:#fef08a; color:#854d0e; border-color:#fde047;';

  const tipoOS = os?.tipo || 'Manutenção';
  const nomeTecnicoFallback = (apontamentos && apontamentos.length > 0) ? apontamentos[0].tecnico_nome : 'Executor não identificado';
  const nomeTecnicoFinal = os.tecnico_nome || nomeTecnicoFallback;

  let sectionCounter = 3;

  let pecasHtml = '';
  if (pecas && pecas.length > 0) {
    let valorTotalPecas = 0;

    const rowsPecas = pecas.map((p: any) => {
      const item = p.estoque_itens || {};
      const isServico = item.categoria === 'Serviço';
      const badge = isServico ? `<span style="background:#e0e7ff; color:#3730a3; padding:2px 6px; border-radius:4px; font-size:6.5pt; margin-right:6px; font-weight:bold; letter-spacing:0.5px;">SERVIÇO</span>` : '';
      
      const valUnit = item.valor_venda || 0;
      const valTot = valUnit * p.quantidade;
      valorTotalPecas += valTot;

      return `<tr class="tr-stripe">
                <td>${item.codigo_sku || '-'}</td>
                <td>${badge}${item.nome || 'Item não identificado'}</td>
                <td style="text-align:center; font-weight:bold;">${p.quantidade} ${item.unidade_medida || 'Un'}</td>
                <td style="text-align:right;">R$ ${Number(valUnit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right; font-weight:bold; color:#0f172a;">R$ ${Number(valTot).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>`;
    }).join('');
    
    pecasHtml = `
    <div class="box box-blue">
      <div class="box-h h-blue">${sectionCounter}. Serviços Adicionais e Peças Aplicadas</div>
      <div class="box-b" style="padding:0">
        <table>
          <thead>
             <tr>
                <th class="th-blue" style="width:15%">Cód / Ref</th>
                <th class="th-blue">Descrição do Serviço / Material</th>
                <th class="th-blue" style="text-align:center; width:8%">Qtd</th>
                <th class="th-blue" style="text-align:right; width:15%">V. Unit</th>
                <th class="th-blue" style="text-align:right; width:15%">V. Total</th>
             </tr>
          </thead>
          <tbody>
             ${rowsPecas}
             <tr>
                <td colspan="4" style="text-align:right; font-weight:900; font-size:9pt; padding:10px;">SUBTOTAL MATERIAIS/SERVIÇOS:</td>
                <td style="text-align:right; font-weight:900; font-size:10pt; color:#1e3a8a; padding:10px; background:#f0f9ff;">R$ ${Number(valorTotalPecas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
             </tr>
          </tbody>
        </table>
      </div>
    </div>`;
    sectionCounter++;
  }

  let checklistHtml = '';
  if (checklistData && checklistData.perguntas && checklistData.perguntas.length > 0) {
    const rows = checklistData.perguntas.map((p: any, i: number) => {
      let respStr = 'N/A';
      if (Array.isArray(checklistData.respostas)) {
         const respObj = checklistData.respostas.find((r:any) => r.perguntaIndex === i || r.pergunta_id === p.id);
         if (respObj) respStr = respObj.resposta;
         else if (typeof checklistData.respostas[i] === 'string') respStr = checklistData.respostas[i];
      }
      const corResposta = respStr === 'Conforme' || respStr === 'OK' ? 'color:#16a34a;' : (respStr === 'Não Conforme' || respStr === 'Falha' ? 'color:#dc2626;' : 'color:#64748b;');
      return `<tr class="tr-stripe"><td style="width:80%">${p.texto}</td><td style="text-align:center; font-weight:900; ${corResposta}">${respStr}</td></tr>`;
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
          ${logoUrl ? `<img src="${logoUrl}" onerror="this.style.display='none'" />` : '<div style="color:#000; font-weight:bold">ATLAS</div>'}
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

      <div class="grid-3">
        <div class="box box-blue">
          <div class="box-h h-blue">Ordem de Serviço</div>
          <div class="box-b b-blue">
            <div class="row"><span class="lbl">Abertura:</span> <div class="val">${dataAbertura}</div></div>
            <div class="row"><span class="lbl">Fechamento:</span> <div class="val">${dataFechamento}</div></div>
            <div class="row"><span class="lbl">Status:</span> <div class="val" style="${corStatus}">${statusOS}</div></div>
          </div>
        </div>
        
        <div class="box box-blue">
          <div class="box-h h-blue">Local / Contato</div>
          <div class="box-b b-blue">
            <div class="row"><span class="lbl">Unidade:</span> <div class="val">${clienteNome}</div></div>
            <div class="row"><span class="lbl">Contato:</span> <div class="val">${os.solicitante_nome || '-'}</div></div>
            <div class="row"><span class="lbl">Setor:</span> <div class="val">${os.solicitante_setor || eq.setor || '-'}</div></div>
          </div>
        </div>
        
        <div class="box box-blue">
          <div class="box-h h-blue">Ativo Hospitalar</div>
          <div class="box-b b-blue">
            <div class="row"><span class="lbl">Equipam.:</span> <div class="val val-green">${equipNome}</div></div>
            <div class="row"><span class="lbl">Mod/Sér:</span> <div class="val val-green">${equipModelo} | ${equipSerie}</div></div>
            <div class="row"><span class="lbl">TAG:</span> <div class="val val-green">${equipTag}</div></div>
          </div>
        </div>
      </div>

      <div class="box box-blue">
        <div class="box-h h-blue">1. Diagnóstico e Intervenção</div>
        <div class="box-b">
          <span class="lbl-section" style="color:#64748b">Descrição do Problema / Motivo do Chamado:</span>
          <div class="txt-block">${os.descricao_problema || os.descricao || 'Não informado'}</div>
          <div style="margin-top:12px">
            <span class="lbl-section" style="color:#16a34a">Solução Técnica Aplicada:</span>
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

      ${pecasHtml} 
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

    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }

    .box { border-radius: 8px; overflow: hidden; margin-bottom: 12px; border: 1.5px solid #cbd5e1; }
    .box-blue { border-color: #3b82f6; }
    .box-green { border-color: #22c55e; }
    .box-h { padding: 6px 10px; font-weight: 900; font-size: 8pt; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
    .h-blue { background: #0284c7; }
    .h-green { background: #16a34a; }
    .box-b { padding: 8px 10px; background: #fff; }
    .b-blue { background: #f0f9ff; }

    .row { display: flex; align-items: center; margin-bottom: 4px; }
    .lbl { width: 65px; font-weight: 900; color: #334155; font-size: 6.5pt; text-transform: uppercase; }
    .lbl-section { font-weight: 900; font-size: 7.5pt; text-transform: uppercase; }
    .val { flex: 1; background: #e0f2fe; color: #0f172a; padding: 3px 6px; border-radius: 4px; font-weight: 800; font-size: 6.5pt; border: 1px solid #bae6fd; text-transform: uppercase; line-height: 1.2;}
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

export const imprimirRelatorio = (arg1: any, arg2?: any, arg3?: any, existingWin?: any) => {
  const win = existingWin || window.open('', '_blank');
  if (!win) return;
  const os = arg1.os || arg1;
  win.document.open();
  win.document.write(`<html><head><title>OS #${os.id}</title>${styles}</head><body>${gerarCorpoDaOS(arg1, arg2, arg3)}<script>setTimeout(()=>window.print(),800)</script></body></html>`);
  win.document.close();
};

export const imprimirRelatoriosEmLote = (lista: any[], config?: any, existingWin?: any) => {
  const win = existingWin || window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(`<html><head><title>Lote Atlas</title>${styles}</head><body>`);
  lista.forEach(d => win.document.write(gerarCorpoDaOS(d, d.apontamentos, config)));
  win.document.write(`<script>setTimeout(()=>window.print(),1500)</script></body></html>`);
  win.document.close();
};