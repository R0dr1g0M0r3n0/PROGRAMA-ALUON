import{n as e}from"./rolldown-runtime-WkwZ5CU-.js";import{b as t,v as n,x as r}from"./index-D2eGnVBT.js";import{t as i}from"./dashboardTheme-yxmd-cum.js";var a=t(),o=n(),s=({open:e,title:t,subtitle:n,onClose:r,headerVariant:s=`dark`,children:c,footer:l,primaryActionLabel:u,onPrimaryAction:d,primaryActionDisabled:f,secondaryActionLabel:p,onSecondaryAction:m,secondaryActionDisabled:h})=>{if(!e)return null;let g=typeof document<`u`?document.getElementById(`main-layout`):null,_=s===`light`,v=s!==`none`,y=(0,o.jsxs)(`div`,{className:`absolute inset-0 z-[70] flex items-center justify-center p-4 sm:p-6`,style:{background:`rgba(16,24,40,0.46)`,backdropFilter:`blur(6px)`},role:`dialog`,"aria-modal":`true`,children:[(0,o.jsx)(`div`,{className:`absolute inset-0`,onClick:r}),(0,o.jsxs)(`div`,{className:`relative w-full max-w-5xl rounded-2xl flex flex-col overflow-hidden animate-fade-up`,style:{background:i.surface,maxHeight:`calc(100vh - 48px)`,boxShadow:i.shadow,border:`1px solid ${i.border}`},children:[v?(0,o.jsxs)(`div`,{className:`flex items-center justify-between px-7 py-5`,style:{background:i.surface,borderBottom:`1px solid ${i.border}`},children:[(0,o.jsxs)(`div`,{className:`flex items-center gap-3.5`,children:[(0,o.jsx)(`div`,{className:`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`,style:{background:_?`#eff6ff`:i.surfaceSoft},children:(0,o.jsx)(`svg`,{className:`w-5 h-5`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`,style:{color:i.tab.active},children:(0,o.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,strokeWidth:`2`,d:`M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6v2m0 16v2m8-10h2M2 12H4m12.95-6.95l1.41 1.41M5.64 18.36l1.41-1.41m0-10.3L5.64 5.64m12.72 12.72-1.41-1.41`})})}),(0,o.jsxs)(`div`,{children:[(0,o.jsx)(`h2`,{style:{fontSize:14,fontWeight:700,color:_?`#111827`:i.text,letterSpacing:`-0.01em`},children:t}),(0,o.jsx)(`p`,{style:{fontSize:10,fontWeight:700,color:_?`#6b7280`:i.muted,textTransform:`uppercase`,letterSpacing:`0.12em`,marginTop:3},children:n})]})]}),(0,o.jsx)(`button`,{onClick:r,className:`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200`,style:{color:_?`#6b7280`:i.muted},onMouseEnter:e=>{e.currentTarget.style.backgroundColor=_?`#eff6ff`:i.surfaceSoft,e.currentTarget.style.color=_?`#111827`:i.text},onMouseLeave:e=>{e.currentTarget.style.backgroundColor=`transparent`,e.currentTarget.style.color=_?`#6b7280`:i.muted},"aria-label":`Cerrar`,type:`button`,children:(0,o.jsx)(`svg`,{className:`w-4 h-4`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`,children:(0,o.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,strokeWidth:`2`,d:`M6 18L18 6M6 6l12 12`})})})]}):null,(0,o.jsx)(`div`,{className:`flex-1 overflow-y-auto p-0`,children:c}),l||u||p?(0,o.jsxs)(`div`,{className:`flex items-center justify-between gap-4 px-7 py-5`,style:{borderTop:`1px solid ${i.border}`,background:i.surfaceSoft},children:[l||(0,o.jsx)(`div`,{}),!l&&(u||p)?(0,o.jsxs)(`div`,{className:`flex items-center gap-3 ml-auto`,children:[p&&m?(0,o.jsx)(`button`,{type:`button`,onClick:m,className:`btn-ghost`,disabled:h,children:p}):null,u&&d?(0,o.jsx)(`button`,{type:`button`,onClick:d,className:`btn-primary`,disabled:f,style:{opacity:f?.5:1,cursor:f?`not-allowed`:`pointer`},children:u}):null]}):null]}):null]})]});return g?(0,a.createPortal)(y,g):y},c=`rounded-[18px] border bg-white shadow-[0_18px_40px_rgba(16,24,40,0.08)]`,l=({title:e,subtitle:t,tone:n=`transactions`,children:r,className:a=``})=>(0,o.jsxs)(`section`,{className:`${c} ${a}`.trim(),children:[(0,o.jsx)(`div`,{className:`px-5 pt-4 pb-3 flex items-center justify-between gap-4`,children:(0,o.jsxs)(`div`,{children:[(0,o.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,o.jsx)(`span`,{className:`h-5 w-[3px] rounded-full`,style:{backgroundColor:i.accentBars[n]},"aria-hidden":`true`}),(0,o.jsx)(`h3`,{className:`text-[14px] leading-none font-semibold`,style:{color:i.text},children:e})]}),t?(0,o.jsx)(`p`,{className:`mt-2 text-[11px] font-medium uppercase tracking-[0.12em]`,style:{color:i.muted},children:t}):null]})}),(0,o.jsx)(`div`,{className:`px-5 pb-5`,children:r})]}),u=({label:e,value:t,hint:n})=>(0,o.jsxs)(`div`,{className:`rounded-[16px] border bg-white px-4 py-4`,style:{borderColor:i.border,boxShadow:i.shadowSoft},children:[(0,o.jsx)(`div`,{className:`text-[10px] font-black uppercase tracking-[0.16em]`,style:{color:i.muted},children:e}),(0,o.jsx)(`div`,{className:`mt-2 text-[14px] font-black tracking-tight`,style:{color:i.text},children:t}),n?(0,o.jsx)(`div`,{className:`mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]`,style:{color:i.muted},children:n}):null]}),d=({label:e,value:t})=>(0,o.jsxs)(`div`,{className:`flex items-start justify-between gap-4 text-sm`,children:[(0,o.jsx)(`span`,{className:`text-[11px] font-semibold uppercase tracking-[0.08em]`,style:{color:i.muted},children:e}),(0,o.jsx)(`span`,{className:`text-right font-medium`,style:{color:i.text},children:t||`—`})]}),f={background:`linear-gradient(180deg, ${i.surfaceSoft} 0%, ${i.surface} 34%)`},p=e(r(),1),m={PRESUPUESTO:`Presupuesto`,PEDIDO:`Pedido`,ALBARAN:`Albarán`,FACTURA:`Factura`,ABONO:`Abono`},h={PRESUPUESTO:{bg:`#eff6ff`,color:`#1d4ed8`},PEDIDO:{bg:`#fef3c7`,color:`#b45309`},ALBARAN:{bg:`#ecfeff`,color:`#0e7490`},FACTURA:{bg:`#f3e8ff`,color:`#7c3aed`},ABONO:{bg:`#ecfdf5`,color:`#047857`}},g=({documentKind:e,documentNumber:t,onClose:n})=>{let r=h[e],a=m[e];return(0,o.jsxs)(`div`,{className:`flex items-center justify-between px-7 py-5 shrink-0`,style:{background:i.surface,borderBottom:`1px solid ${i.border}`},children:[(0,o.jsxs)(`div`,{className:`flex items-center gap-3.5`,children:[(0,o.jsx)(`div`,{className:`w-9 h-9 rounded-xl flex items-center justify-center shrink-0`,style:{background:r.bg},children:(0,o.jsx)(`svg`,{className:`w-5 h-5`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`,style:{color:r.color},children:(0,o.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,strokeWidth:`2`,d:`M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z`})})}),(0,o.jsxs)(`div`,{children:[(0,o.jsx)(`h2`,{style:{fontSize:14,fontWeight:700,color:i.text,letterSpacing:`-0.01em`},children:a}),(0,o.jsx)(`p`,{style:{fontSize:10,fontWeight:700,color:i.muted,textTransform:`uppercase`,letterSpacing:`0.12em`,marginTop:3},children:t})]})]}),(0,o.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,o.jsx)(`div`,{className:`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]`,style:{background:r.bg,color:r.color},children:a}),(0,o.jsx)(`button`,{onClick:n,className:`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200`,style:{color:i.muted},onMouseEnter:e=>{e.currentTarget.style.backgroundColor=i.surfaceSoft,e.currentTarget.style.color=i.text},onMouseLeave:e=>{e.currentTarget.style.backgroundColor=`transparent`,e.currentTarget.style.color=i.muted},"aria-label":`Cerrar`,type:`button`,children:(0,o.jsx)(`svg`,{className:`w-4 h-4`,fill:`none`,stroke:`currentColor`,viewBox:`0 0 24 24`,children:(0,o.jsx)(`path`,{strokeLinecap:`round`,strokeLinejoin:`round`,strokeWidth:`2`,d:`M6 18L18 6M6 6l12 12`})})})]})]})},_=({onClose:e,onPrint:t,onSendEmail:n})=>(0,o.jsxs)(`div`,{className:`flex items-center justify-center gap-3 px-7 py-5 shrink-0`,style:{background:i.surfaceSoft,borderTop:`1px solid ${i.border}`},children:[(0,o.jsx)(`button`,{type:`button`,onClick:e,className:`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200`,style:{background:i.surface,color:i.text,border:`1px solid ${i.border}`,boxShadow:i.shadowSoft},onMouseEnter:e=>{e.currentTarget.style.borderColor=`#cbd5e1`},onMouseLeave:e=>{e.currentTarget.style.borderColor=i.border},children:`Cerrar`}),(0,o.jsx)(`button`,{type:`button`,onClick:t,className:`px-5 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all duration-200`,style:{background:i.tab.active,border:`1px solid ${i.tab.active}`,boxShadow:`0 4px 14px rgba(240,68,56,0.25)`},onMouseEnter:e=>{e.currentTarget.style.opacity=`0.9`},onMouseLeave:e=>{e.currentTarget.style.opacity=`1`},children:`Imprimir`}),n?(0,o.jsx)(`button`,{type:`button`,onClick:n,className:`px-5 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all duration-200`,style:{background:`#4f46e5`,border:`1px solid #4f46e5`,boxShadow:`0 4px 14px rgba(79,70,229,0.25)`},onMouseEnter:e=>{e.currentTarget.style.opacity=`0.9`},onMouseLeave:e=>{e.currentTarget.style.opacity=`1`},children:`Enviar por mail`}):null]}),v=({printHtml:e})=>{let t=(0,p.useRef)(null);return(0,p.useEffect)(()=>{let n=t.current;if(!n)return;let r=n.contentDocument??n.contentWindow?.document;r&&(r.open(),r.write(e),r.close())},[e]),(0,o.jsx)(`iframe`,{ref:t,title:`Vista previa del documento`,className:`w-full border-0`,style:{background:`#ffffff`,height:`100%`,minHeight:0},sandbox:`allow-same-origin`})},y=({open:e,documentKind:t,documentNumber:n,printHtml:r,onClose:s,onPrint:c,onSendEmail:l})=>{let u=(0,p.useCallback)(()=>{s()},[s]);if((0,p.useEffect)(()=>{if(!e)return;let t=e=>{e.key===`Escape`&&s()};return window.addEventListener(`keydown`,t),()=>window.removeEventListener(`keydown`,t)},[e,s]),!e)return null;let d=typeof document<`u`?document.getElementById(`main-layout`):null,f=(0,o.jsxs)(`div`,{className:`absolute inset-0 z-[80] flex items-center justify-center p-4 sm:p-6`,style:{background:`rgba(16,24,40,0.46)`,backdropFilter:`blur(6px)`},role:`dialog`,"aria-modal":`true`,"aria-label":`Vista previa: ${m[t]} ${n}`,children:[(0,o.jsx)(`div`,{className:`absolute inset-0`,onClick:u}),(0,o.jsxs)(`div`,{className:`relative w-full max-w-5xl rounded-2xl flex flex-col overflow-hidden animate-fade-up`,style:{background:i.surface,height:`calc(100vh - 64px)`,maxHeight:`calc(100vh - 64px)`,boxShadow:i.shadow,border:`1px solid ${i.border}`},children:[(0,o.jsx)(g,{documentKind:t,documentNumber:n,onClose:s}),(0,o.jsx)(`div`,{className:`flex-1 min-h-0 overflow-hidden`,style:{background:i.surfaceSoft},children:(0,o.jsx)(v,{printHtml:r})}),(0,o.jsx)(_,{onClose:s,onPrint:c,onSendEmail:l})]})]});return d?(0,a.createPortal)(f,d):f},b=e=>{let t=window.open(``,`_blank`,`width=900,height=700`);t&&(t.document.write(e),t.document.close(),t.focus(),setTimeout(()=>{t.print()},500))},x=()=>{let[e,t]=(0,p.useState)(null),n=(0,p.useCallback)(e=>{t(e)},[]),r=(0,p.useCallback)(()=>{t(null)},[]),i=(0,p.useCallback)(()=>{e&&b(e.printHtml)},[e]),a=(0,p.useCallback)(()=>{if(!e)return;let t=encodeURIComponent(e.emailSubject??`Documento ${e.documentNumber}`),n=encodeURIComponent(e.emailBody??`Adjunto ${e.documentKind} ${e.documentNumber}.`),r=e.emailTo??``;window.location.href=`mailto:${r}?subject=${t}&body=${n}`},[e]);return{isOpen:e!==null,state:e,open:n,close:r,print:i,sendEmail:a}},S={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`},C=e=>e.replace(/[&<>"']/g,e=>S[e]??e),w=(e,t=`—`)=>{let n=(e??``).trim();return n?C(n):t},T=e=>e?e.endsWith(`/`)?e:`${e}/`:`/`,E=e=>e.split(`/`).map(e=>encodeURIComponent(e)).join(`/`),D=e=>`${T(`/`)}${E(e.startsWith(`/`)?e.slice(1):e)}`,O=`
  :root { --ink: #111827; --muted: #6b7280; --border: #e5e7eb; --bg: #ffffff; --soft: #f9fafb; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: var(--ink); margin: 0; background: #fff; }
  .page {
    position: relative;
    width: 210mm;
    min-height: 297mm;
    padding: 16mm 14mm;
    margin: 0 auto;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .watermark {
    position: absolute;
    inset: 0;
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    opacity: 1;
    pointer-events: none;
  }
  .content { position: relative; z-index: 1; flex: 1 1 auto; }
  .page-footer { position: relative; z-index: 1; margin-top: auto; }
  .row { display: flex; justify-content: space-between; gap: 18px; }
  .small { font-size: 11px; color: var(--muted); line-height: 1.35; }
  .title { font-weight: 900; letter-spacing: 0.14em; text-transform: uppercase; }
  .doc-pill {
    display: inline-block;
    padding: 8px 12px;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--soft);
  }
  .meta { margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
  .meta strong { font-size: 12px; }
  .box {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 12px;
    background: #fff;
  }
  .table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
  .table th, .table td { border: 1px solid var(--border); padding: 7px 8px; vertical-align: top; }
  .table th { background: var(--soft); color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; font-weight: 900; }
  .right { text-align: right; }
  .totals { margin-top: 14px; display: flex; justify-content: flex-end; }
  .totals table { border-collapse: collapse; font-size: 11px; min-width: 280px; }
  .totals td { border: 1px solid var(--border); padding: 8px 10px; }
  .totals tr:first-child td { background: var(--soft); color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; font-weight: 900; }
  .note { margin-top: 14px; }
  .footer { margin-top: 18px; display: flex; justify-content: space-between; gap: 24px; }
  .sig { height: 54px; border: 1px dashed var(--border); border-radius: 12px; margin-top: 8px; }
  @page { size: A4; margin: 0; }
  @media print {
    body { margin: 0; }
    .page { box-shadow: none; }
  }
`,k=e=>new Intl.NumberFormat(`es-ES`,{style:`currency`,currency:`EUR`}).format(e),A=e=>new Intl.NumberFormat(`es-ES`,{maximumFractionDigits:3}).format(e),j=(e,t)=>`
    <table class="table">
      <thead><tr>${[`<th style="width:38px;">#</th>`,`<th>Descripción</th>`,`<th class="right" style="width:70px;">Cant.</th>`,`<th style="width:56px;">Ud.</th>`,...t?[`<th class="right" style="width:84px;">Precio</th>`,`<th class="right" style="width:90px;">Importe</th>`]:[]].join(``)}</tr></thead>
      <tbody>${e.map(e=>{let n=[`<td class="right">${w(String(e.position),``)}</td>`,`<td>${w(e.description)}</td>`,`<td class="right">${w(A(e.quantity),``)}</td>`,`<td>${w(e.unitLabel??`ud.`,``)}</td>`];if(t){let t=e.unitPriceEur==null?`—`:w(k(e.unitPriceEur),``),r=e.totalEur==null?`—`:w(k(e.totalEur),``);n.push(`<td class="right">${t}</td>`,`<td class="right"><strong>${r}</strong></td>`)}return`<tr>${n.join(``)}</tr>`}).join(``)}</tbody>
    </table>
  `,M=e=>{let t=[];return e.subtotalEur!=null&&t.push({label:`Base imponible`,value:k(e.subtotalEur)}),e.vatPercent!=null&&e.vatAmountEur!=null&&t.push({label:`IVA (${e.vatPercent}%)`,value:k(e.vatAmountEur)}),t.push({label:`Total`,value:k(e.totalEur)}),`
    <div class="totals">
      <table>
        <tr><td colspan="2">Totales</td></tr>
        ${t.map(e=>`<tr><td>${w(e.label)}</td><td class="right"><strong>${w(e.value,``)}</strong></td></tr>`).join(``)}
      </table>
    </div>
  `},N={PRESUPUESTO:`Presupuesto`,PEDIDO:`Pedido`,ALBARAN:`Albarán`,FACTURA:`Factura`},P=e=>{let t=D(`assets/template.png`),n=e.kind!==`ALBARAN`,r=e.lines.length?e.lines:[{position:1,description:``,quantity:1,unitLabel:`ud.`,unitPriceEur:null,totalEur:null}],i=e.company.addressLines.filter(Boolean).map(e=>w(e)).join(` | `),a=[e.company.taxId?`CIF: ${w(e.company.taxId)}`:null,i].filter(Boolean),o=a.length?`<div class="small">${a.join(` | `)}</div>`:``,s=[e.company.phone?`Telf. ${w(e.company.phone)}`:null,e.company.email?w(e.company.email):null,e.company.website?w(e.company.website):null].filter(Boolean),c=s.length?`<div class="small">${s.join(` | `)}</div>`:``,l=e.customer.addressLines.filter(Boolean).map(e=>w(e)).join(` | `),u=[e.customer.taxId?w(e.customer.taxId):null,l].filter(Boolean),d=u.length?`<div class="small">${u.join(` | `)}</div>`:``,f=[e.customer.phone?`Telf. ${w(e.customer.phone)}`:null,e.customer.email?`Email ${w(e.customer.email)}`:null].filter(Boolean),p=f.length?`<div class="small">${f.join(` | `)}</div>`:``,m=(e.footerLines??[]).filter(Boolean).map(e=>`<div class="small">${w(e)}</div>`).join(``);return`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <base href="${typeof window<`u`?window.location.origin:``}/" />
  <title>${N[e.kind]} ${w(e.documentNumber)}</title>
  <style>${O}</style>
</head>
<body>
  <div class="page">
    <div class="watermark" style="background-image:url('${t}');"></div>
    <div class="content">
      <div class="row">
        <div class="box" style="flex:1;">
          <img src="${D(`images/logo.png`)}" alt="${w(e.company.name,``)}" style="height: 40px; object-fit: contain; margin-bottom: 8px;" />
          ${o}
          ${c}
        </div>
        <div class="box" style="flex:1;">
          <div class="doc-pill">${w(N[e.kind],``)}</div>
          <div class="meta">
            <div class="small">
              <div><strong>${w(e.documentNumber)}</strong></div>
              <div>${w(e.documentDate)}</div>
            </div>
          </div>
          <div style="margin-top:10px;">
            <div class="small" style="font-weight:900; letter-spacing:0.08em; text-transform:uppercase; color:var(--muted);">Cliente</div>
            <div style="margin-top:4px; font-weight:700;">${w(e.customer.name)}</div>
            ${d}
            ${p}
          </div>
        </div>
      </div>

      ${j(r,n)}
    </div>

    <div class="page-footer">
      ${e.totals?M(e.totals):``}

      ${e.notes?`<div class="note box"><div class="small" style="font-weight:900; letter-spacing:0.08em; text-transform:uppercase;">Notas</div><div style="margin-top:6px; font-size:11px;">${w(e.notes,``)}</div></div>`:``}

      ${m?`<div class="note box">${m}</div>`:``}

      <div class="footer">
        <div style="flex:1;">
          <div class="small" style="font-weight:900; letter-spacing:0.08em; text-transform:uppercase;">Conforme el cliente</div>
          <div class="sig"></div>
        </div>
        <div style="flex:1;">
          <div class="small" style="font-weight:900; letter-spacing:0.08em; text-transform:uppercase;">Conforme la empresa</div>
          <div class="sig"></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`};export{l as a,s as c,d as i,x as n,u as o,y as r,f as s,P as t};