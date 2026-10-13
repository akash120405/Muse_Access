(() => {
  const KEY = 'muse-access-review-v1';
  const now = new Date();
  const dateISO = (daysAgo) => { const d = new Date(now); d.setDate(d.getDate() - daysAgo); return d.toISOString().slice(0, 10); };
  const samples = [
    {id:'drive',name:'Google Drive',category:'Storage',owner:'Priya S.',ownerColor:'pink',purpose:'Shared project files and working documents',scope:'View and edit files in selected folders',actions:'Read, edit, share files',auth:'OAuth',lastUsed:dateISO(2),lastReviewed:'Sep 24, 2026',risk:'review',nextReview:'2026-12-30',exception:'None',exceptionExpiry:'Not applicable',authExpiry:'Not observable',data:'Team documents and project files',workflow:'Design handoff and shared project work',logo:'G',logoClass:'gdrive',reviewReason:'Folder sharing and editor access need reconfirmation.'},
    {id:'slack',name:'Slack',category:'Communication',owner:'Akash V.',ownerColor:'blue',purpose:'Team communication and incident updates',scope:'Read channels and send messages',actions:'Read, send messages',auth:'OAuth',lastUsed:dateISO(0),lastReviewed:'Sep 25, 2026',risk:'high',nextReview:'2026-10-15',exception:'None',exceptionExpiry:'Not applicable',authExpiry:'Not observable',data:'Channel messages and member names',workflow:'Team collaboration',logo:'S',logoClass:'slack',reviewReason:'Can send messages to workspace channels.'},
    {id:'github',name:'GitHub',category:'Development',owner:'Akash V.',ownerColor:'blue',purpose:'Source control and project automation',scope:'Repository contents and pull requests',actions:'Read, create branches, open pull requests',auth:'OAuth app',lastUsed:dateISO(1),lastReviewed:'Sep 24, 2026',risk:'review',nextReview:'2026-12-30',exception:'Repository write access approved',exceptionExpiry:'Dec 31, 2026',authExpiry:'Not observable',data:'Code, issues, pull requests',workflow:'Development and deployment review',logo:'⌘',logoClass:'github',reviewReason:'Write access spans more repositories than the listed project workflow.'},
    {id:'notion',name:'Notion',category:'Productivity',owner:'Meera K.',ownerColor:'',purpose:'Team wiki and project notes',scope:'Read and update selected pages',actions:'Read, edit pages',auth:'OAuth',lastUsed:dateISO(6),lastReviewed:'Sep 20, 2026',risk:'safe',nextReview:'2026-12-30',exception:'None',expiry:'Not applicable',data:'Team wiki and project notes',workflow:'Knowledge sharing',logo:'N',logoClass:'notion'},
    {id:'figma',name:'Figma',category:'Productivity',owner:'Priya S.',ownerColor:'pink',purpose:'Design files and developer handoff',scope:'View and comment on project files',actions:'Read, comment',auth:'SSO',lastUsed:dateISO(4),lastReviewed:'Sep 22, 2026',risk:'safe',nextReview:'2026-12-30',exception:'None',expiry:'Not applicable',data:'Design files and comments',workflow:'Design review',logo:'F',logoClass:'figma'},
    {id:'dropbox',name:'Dropbox',category:'Storage',owner:'Not assigned',ownerColor:'',purpose:'Legacy archive storage',scope:'Read and write all team folders',actions:'Read, edit, share, delete files',auth:'OAuth',lastUsed:dateISO(108),lastReviewed:'Jun 18, 2026',risk:'high',nextReview:'2026-10-10',exception:'None',expiry:'Not observable',data:'Archived team files',workflow:'Legacy archive access',logo:'D',logoClass:'dropbox',reviewReason:'Broad file access has not been used for 108 days and has no accountable owner.'},
    {id:'stripe',name:'Stripe',category:'Finance',owner:'Devon R.',ownerColor:'',purpose:'Review billing metrics for monthly reporting',scope:'Read balances, customers, and transactions',actions:'Read account and customer records',auth:'Restricted API key',lastUsed:dateISO(1),lastReviewed:'Sep 25, 2026',risk:'safe',nextReview:'2026-12-30',exception:'None',expiry:'Not observable',data:'Customer billing metadata',workflow:'Finance reporting',logo:'S',logoClass:'stripe'},
    {id:'zoom',name:'Zoom',category:'Communication',owner:'Meera K.',ownerColor:'',purpose:'Schedule and host team meetings',scope:'Read calendar and create meetings',actions:'Read calendar, create meetings',auth:'OAuth',lastUsed:dateISO(3),lastReviewed:'Sep 23, 2026',risk:'safe',nextReview:'2026-12-30',exception:'None',expiry:'Not applicable',data:'Meeting metadata and calendar availability',workflow:'Team meetings',logo:'Z',logoClass:'zoom'}
  ];
  const labels = {safe:'Safe to leave',review:'Review soon',high:'High priority'};
  const read = () => { try { const saved = localStorage.getItem(KEY); return saved ? JSON.parse(saved) : samples; } catch { return samples; } };
  let connections = read();
  let activeRisk = 'all';
  let currentPage = 'overview';
  let toastTimer;
  let preferences = (()=>{ try { return JSON.parse(localStorage.getItem(`${KEY}-settings`)||'{}'); } catch { return {}; } })();
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const escapeHTML = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = (name='') => name.split(/[\s.]+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || '—';
  const safeDate = (iso) => { if (!iso || iso === 'Not observable') return iso || 'Not observable'; const d = new Date(`${iso}T12:00:00`); return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); };
  const persist = () => { localStorage.setItem(KEY, JSON.stringify(connections)); $('.saved-indicator').innerHTML='<i></i> All changes saved'; render(); };
  const showToast = (message) => { $('#toastText').textContent=message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400); };
  const riskBadge = risk => `<span class="risk-badge risk-${escapeHTML(risk)}">${labels[risk] || 'Not rated'}</span>`;
  const filtered = () => {
    const query = ($('#searchInput')?.value || '').trim().toLowerCase();
    return connections.filter(c => (activeRisk==='all'||c.risk===activeRisk) && (!query||[c.name,c.category,c.owner,c.scope,c.purpose,c.actions].join(' ').toLowerCase().includes(query)));
  };
  const formatAgo = iso => { if (!iso || iso==='Not observable') return 'Not observable'; const days=Math.max(0,Math.floor((Date.now()-new Date(`${iso}T12:00:00`).getTime())/86400000)); return days===0?'Today':days===1?'Yesterday':`${days} days ago`; };
  const connectionRow = c => `<tr data-id="${escapeHTML(c.id)}"><td><div class="connection-name-cell" data-open="${escapeHTML(c.id)}"><span class="app-logo ${escapeHTML(c.logoClass||'')}">${escapeHTML(c.logo||initials(c.name))}</span><span><span class="connection-name">${escapeHTML(c.name)}</span><small class="connection-sub">${escapeHTML(c.category||'Other')}</small></span></div></td><td><span class="owner-cell"><span class="owner-avatar ${escapeHTML(c.ownerColor||'')}">${escapeHTML(initials(c.owner||'Not observable'))}</span>${escapeHTML(c.owner||'Not observable')}</span></td><td><span class="access-type"><svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>${escapeHTML(c.auth||'Not observable')}</span></td><td>${escapeHTML(c.lastReviewed||'Not observable')}</td><td>${riskBadge(c.risk)}</td><td><button class="row-menu" aria-label="View ${escapeHTML(c.name)} details" data-open="${escapeHTML(c.id)}">···</button></td></tr>`;
  const renderRows = () => {
    const rows=filtered();
    $('#connectionRows').innerHTML=rows.slice(0,8).map(connectionRow).join('');
    $('#emptyState').classList.toggle('hidden',rows.length!==0);
    $('.connection-table-wrap').classList.toggle('hidden',rows.length===0);
    $('.table-footer').classList.toggle('hidden',rows.length===0);
    $('#tableCount').textContent=`Showing ${Math.min(rows.length,8)} of ${rows.length} connection${rows.length===1?'':'s'}`;
  };
  const attentionMarkup = () => {
    const items=connections.filter(c=>c.risk==='high'||c.risk==='review').slice(0,3);
    $('#attentionList').innerHTML=items.length?items.map(c=>`<div class="attention-item"><span class="attention-app app-logo ${escapeHTML(c.logoClass||'')}">${escapeHTML(c.logo||initials(c.name))}</span><span class="attention-copy"><b>${escapeHTML(c.name)}</b><small>${escapeHTML(c.reviewReason||labels[c.risk])}</small></span><button class="attention-arrow" aria-label="Review ${escapeHTML(c.name)}" data-open="${escapeHTML(c.id)}">›</button></div>`).join(''):'<div class="empty-state"><b>You’re all caught up</b><p>No open review items.</p></div>';
    const count=items.length; $('.side-panel-title p').textContent=`${count} item${count===1?'':'s'} to review`;
  };
  const renderAll = () => {
    $('#allConnectionsList').innerHTML=connections.map(c=>`<div class="inventory-row"><div class="connection-name-cell" data-open="${escapeHTML(c.id)}"><span class="app-logo ${escapeHTML(c.logoClass||'')}">${escapeHTML(c.logo||initials(c.name))}</span><span><span class="connection-name">${escapeHTML(c.name)}</span><small class="connection-sub">${escapeHTML(c.category||'Other')}</small></span></div><span>${escapeHTML(c.owner||'Not observable')}</span><span>${escapeHTML(c.auth||'Not observable')}</span><span>${escapeHTML(c.lastReviewed||'Not observable')}</span><span>${riskBadge(c.risk)}</span></div>`).join('')||'<div class="empty-state"><b>Your inventory is empty</b><p>Add your first connection to begin.</p></div>';
    $('#inventoryCount').textContent=`${String(connections.length).padStart(2,'0')} connection${connections.length===1?'':'s'}`;
  };
  const renderStats = () => {
    const count=r=>connections.filter(c=>c.risk===r).length;
    $('#metricTotal').textContent=String(connections.length).padStart(2,'0');
    $('#metricSafe').textContent=String(count('safe')).padStart(2,'0');
    $('#metricReview').textContent=String(count('review')).padStart(2,'0');
    $('#metricHigh').textContent=String(count('high')).padStart(2,'0');
    $('#navConnectionCount').textContent=String(connections.length).padStart(2,'0');
  };
  const renderOwners = () => {
    const map=new Map();
    connections.forEach(c=>{const name=c.owner||'Not observable';map.set(name,(map.get(name)||0)+1);});
    $('#ownerGrid').innerHTML=[...map.entries()].map(([name,count])=>`<div class="owner-card"><span class="owner-avatar">${escapeHTML(initials(name))}</span><span><b>${escapeHTML(name)}</b><small>${count} connection${count===1?'':'s'} · accountable owner</small></span></div>`).join('');
  };
  const renderTimeline = () => {
    const data=[{title:'Quarterly access review scheduled',detail:'Next review is set for December 30, 2026.',date:'Today'},...connections.filter(c=>c.risk==='high').map(c=>({title:`${c.name} marked high priority`,detail:c.reviewReason||'Action permissions need review.',date:c.lastReviewed||'Date not observable'})),{title:'Workspace inventory created',detail:'Sample entries loaded for the first review.',date:'Sep 18, 2026'}];
    $('#timelineList').innerHTML=data.map((e,i)=>`<div class="timeline-item"><div class="timeline-rail"><i class="timeline-point"></i><i class="timeline-line"></i></div><div class="timeline-copy"><b>${escapeHTML(e.title)}</b><p>${escapeHTML(e.detail)}</p></div><span class="timeline-date">${escapeHTML(e.date)}</span></div>`).join('');
  };
  function render(){renderStats();renderRows();attentionMarkup();renderAll();renderOwners();renderTimeline();}

  const riskDescription = risk => risk==='high'?'High priority: access can send, buy, delete, publish, change permissions, or expose sensitive data.':risk==='review'?'Review soon: access may be broader than needed, dormant, or shared across workflows.':'Safe to leave: the recorded access appears justified and limited to the listed workflow.';
  const openDetails = id => {
    const c=connections.find(x=>x.id===id); if(!c)return;
    $('#drawerContent').innerHTML=`<div class="drawer-hero"><span class="app-logo ${escapeHTML(c.logoClass||'')}">${escapeHTML(c.logo||initials(c.name))}</span><div><h2 id="drawerTitle">${escapeHTML(c.name)}</h2><p>${escapeHTML(c.category||'Other')} · ${escapeHTML(c.auth||'Authentication not observable')}</p></div>${riskBadge(c.risk)}</div>
      <div class="drawer-section"><h3>ACCESS AT A GLANCE</h3><div class="detail-grid"><div class="detail-item"><label>Accountable owner</label><b>${escapeHTML(c.owner||'Not observable')}</b></div><div class="detail-item"><label>Last used</label><b>${escapeHTML(formatAgo(c.lastUsed))}</b></div><div class="detail-item full"><label>Granted scope</label><span>${escapeHTML(c.scope||'Not observable')}</span></div><div class="detail-item full"><label>Actions allowed</label><span>${escapeHTML(c.actions||'Not observable')}</span></div></div></div>
      <div class="drawer-section"><h3>BUSINESS CONTEXT</h3><div class="detail-grid"><div class="detail-item full"><label>Purpose</label><span>${escapeHTML(c.purpose||'Not observable')}</span></div><div class="detail-item"><label>Workflow</label><span>${escapeHTML(c.workflow||'Not observable')}</span></div><div class="detail-item"><label>Data involved</label><span>${escapeHTML(c.data||'Not observable')}</span></div></div></div>
      <div class="drawer-section"><h3>REVIEW RECORD</h3><div class="detail-grid"><div class="detail-item"><label>Last reviewed</label><b>${escapeHTML(c.lastReviewed||'Not observable')}</b></div><div class="detail-item"><label>Next review</label><b>${escapeHTML(safeDate(c.nextReview)||'Not observable')}</b></div><div class="detail-item"><label>Authorization expiry</label><span>${escapeHTML(c.authExpiry||c.expiry||'Not observable')}</span></div><div class="detail-item"><label>Approved exception</label><span>${escapeHTML(c.exception||'Not observable')}</span></div><div class="detail-item full"><label>Exception expiry</label><span>${escapeHTML(c.exceptionExpiry||'Not observable')}</span></div></div><div class="proposal-box"><b>Why this rating</b><p>${escapeHTML(c.reviewReason||riskDescription(c.risk))}</p></div></div>
      <div class="drawer-actions"><button class="button button-secondary" id="editConnection">Edit record</button><button class="button button-primary" id="proposeChange">Propose a change</button></div><div id="proposalArea"></div>`;
    $('#drawerBackdrop').classList.remove('hidden');
    $('#editConnection').addEventListener('click',()=>{closeDrawer();openModal(c);});
    $('#proposeChange').addEventListener('click',()=>showProposal(c));
  };
  function showProposal(c){
    const suggestion=c.risk==='high'?'Remove send, delete, publish, and permission-change actions unless this workflow requires them.':c.risk==='review'?'Limit the scope to named folders, repositories, or workflows and assign an accountable owner.':'Keep the current scope and verify it at the next scheduled review.';
    $('#proposalArea').innerHTML=`<div class="proposal-box"><b>Proposed change · draft only</b><p><strong>Change:</strong> ${escapeHTML(suggestion)}</p><p><strong>Workflow impact:</strong> ${escapeHTML(c.workflow||'Not observable')} may lose access to the removed actions or scope.</p><p><strong>Recovery:</strong> restore the previous provider permission and re-test the workflow if a required task fails. Confirm the exact provider setting before applying.</p><p><strong>Approval:</strong> pending — no change has been made.</p></div>`;
  }
  const closeDrawer=()=>$('#drawerBackdrop').classList.add('hidden');
  const openModal = (existing=null) => {
    const form=$('#connectionForm'); form.reset(); form.dataset.editId=existing?.id||'';
    $('#modalTitle').textContent=existing?'Edit connection':'Add a connection';
    if(existing) Object.entries(existing).forEach(([key,val])=>{const field=form.elements[key];if(field)field.value=val??'';});
    $('#modalBackdrop').classList.remove('hidden');
    setTimeout(()=>form.elements.name.focus(),50);
  };
  const closeModal=()=>$('#modalBackdrop').classList.add('hidden');
  const bindOpenModal = id => {$(id)?.addEventListener('click',()=>openModal());};
  ['#addConnectionBtn','#connectionsAddBtn','#emptyAddBtn','#ownersAddBtn'].forEach(bindOpenModal);
  $('#closeModal').addEventListener('click',closeModal); $('#cancelModal').addEventListener('click',closeModal);
  $('#modalBackdrop').addEventListener('click',e=>{if(e.target===$('#modalBackdrop'))closeModal();});
  $('#closeDrawer').addEventListener('click',closeDrawer); $('#drawerBackdrop').addEventListener('click',e=>{if(e.target===$('#drawerBackdrop'))closeDrawer();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeDrawer();$('#filterMenu').classList.add('hidden');}});

  $('#connectionForm').addEventListener('submit',e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);const editId=e.currentTarget.dataset.editId;
    const previous=connections.find(c=>c.id===editId);
    const entry={...(previous||{}),id:editId||`c-${Date.now()}`,name:f.get('name').trim(),category:f.get('category'),owner:f.get('owner').trim()||'Not observable',purpose:f.get('purpose').trim()||'Not observable',scope:f.get('scope').trim()||'Not observable',auth:f.get('auth'),lastUsed:f.get('lastUsed').trim()||'Not observable',lastReviewed:f.get('lastReviewed').trim()||'Not observable',risk:f.get('risk'),nextReview:f.get('nextReview')||'Not observable',exception:f.get('exception').trim()||'None',exceptionExpiry:f.get('exceptionExpiry').trim()||'Not observable',authExpiry:f.get('authExpiry').trim()||'Not observable',actions:f.get('actions').trim()||'Not observable',data:previous?.data||'Not observable',workflow:previous?.workflow||f.get('purpose').trim()||'Not observable',logo:previous?.logo||initials(f.get('name')),logoClass:previous?.logoClass||'',reviewReason:previous?.reviewReason||''};
    if(previous) connections=connections.map(c=>c.id===editId?entry:c); else connections.unshift(entry);
    persist();closeModal();showToast(previous?'Connection updated':'Connection added');
  });
  $('#searchInput').addEventListener('input',renderRows);
  $('#riskFilter').addEventListener('click',()=>$('#filterMenu').classList.toggle('hidden'));
  $$('#filterMenu button').forEach(b=>b.addEventListener('click',()=>{activeRisk=b.dataset.risk;$('#riskFilter').innerHTML=`<svg viewBox="0 0 20 20"><path d="M3 5h14M5.5 10h9M8 15h4"/></svg> Risk: ${activeRisk==='all'?'all':labels[activeRisk]}<span class="filter-caret">⌄</span>`;$('#filterMenu').classList.add('hidden');renderRows();}));
  document.addEventListener('click',e=>{const opener=e.target.closest('[data-open]');if(opener)openDetails(opener.dataset.open);});
  const setPage = name => { if(!$('#page-'+name))return; currentPage=name; $$('.page-view').forEach(p=>p.classList.toggle('active',p.id===`page-${name}`)); $$('.nav-link').forEach(a=>a.classList.toggle('active',a.dataset.page===name)); $('#breadcrumbCurrent').textContent=name==='overview'?'Overview':name==='reviews'?'Review history':name[0].toUpperCase()+name.slice(1); location.hash=name==='overview'?'overview':name; $('.sidebar').classList.remove('open'); };
  $$('.nav-link,[data-page]').forEach(a=>a.addEventListener('click',e=>{const page=a.dataset.page;if(page){e.preventDefault();setPage(page);}}));
  window.addEventListener('hashchange',()=>setPage(location.hash.slice(1)||'overview'));
  $('#mobileMenu').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
  $('#dismissDemo').addEventListener('click',()=>$('.demo-banner').classList.add('hidden'));
  $('#guideLink').addEventListener('click',e=>{e.preventDefault();showToast('Start with owners, purposes, and the actions each app can take.');});
  $('#helpButton').addEventListener('click',()=>showToast('Muse stores a manual inventory in this browser only.'));
  $('#seeReviewBtn').addEventListener('click',()=>{setPage('connections');activeRisk='all';$('#riskFilter').innerHTML='<svg viewBox="0 0 20 20"><path d="M3 5h14M5.5 10h9M8 15h4"/></svg> Risk: all<span class="filter-caret">⌄</span>';renderRows();});
  $('#startReviewBtn').addEventListener('click',()=>{setPage('connections');showToast('Review started — confirm each provider permission.');});
  $('#startReviewBtn2').addEventListener('click',()=>{setPage('connections');showToast('Review started — confirm each provider permission.');});
  $('#saveSettings').addEventListener('click',()=>{preferences={cadence:$('#cadenceSelect').value,nextDate:$('#nextDate').value};localStorage.setItem(`${KEY}-settings`,JSON.stringify(preferences));showToast('Review schedule saved on this device');});
  $('#resetDemo').addEventListener('click',()=>{if(confirm('Restore the original sample inventory? This replaces your local entries.')){connections=JSON.parse(JSON.stringify(samples));persist();showToast('Sample inventory restored');}});
  const exportCSV=()=>{
    const header=['Connection','Category','Owner','Business purpose','Granted scope','Actions allowed','Authentication','Last used','Last reviewed','Risk','Authorization expiry','Next review','Exception','Exception expiry'];
    const rows=connections.map(c=>[c.name,c.category,c.owner,c.purpose,c.scope,c.actions,c.auth,c.lastUsed,c.lastReviewed,labels[c.risk],c.authExpiry||c.expiry,c.nextReview,c.exception,c.exceptionExpiry]);
    const csvCell=value=>{let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text=`'${text}`;return `"${text.replaceAll('"','""')}"`;};
    const csv=[header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='muse-access-review.csv';a.click();URL.revokeObjectURL(a.href);showToast('Report downloaded');
  };
  ['#exportBtn','#connectionsExportBtn','#settingsExport'].forEach(id=>$(id).addEventListener('click',exportCSV));
  $('#cadenceSelect').value=preferences.cadence||'Quarterly';$('#nextDate').value=preferences.nextDate||'2026-12-30';
  const today=new Date();$('#nextDate').min=today.toISOString().slice(0,10);
  const eyebrow=$('.page-view.active .eyebrow'); if(eyebrow){const d=new Date();eyebrow.innerHTML=`<span class="eyebrow-dot"></span> ${d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).toUpperCase()}`;}
  render();setPage(location.hash.slice(1)||'overview');
})();
