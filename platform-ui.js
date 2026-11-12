/* CRIA library. API routes, purchase webhook and login token contract are unchanged. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = (key, fallback) => { try { const value=JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Session remains usable without optional storage. */ } };
  const state = { data:null, view:'inicio', query:'', sort:'curated', favorites:new Set(read('cria_favorites_v2',[])), recent:read('cria_recent_v2',[]), current:null, renderedPrompt:'', searchIndex:null };
  const engine=window.CriaPersonalizer, promptCache=new Map(), promptRequests=new Map(), drafts=new Map();
  const ui=window.CriaMotion;
  let revealObserver, imageObserver, returnTarget, toastTimer, copyVersion=0, openVersion=0, closing=false, drawerReturn, currentValues={}, searchRequest, drawerVersion=0, navigationVersion=0, painted=false, lastContent='';
  const motion = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icon = name => `<img src="assets/${name}" alt="" loading="lazy">`;
  const category = id => state.data.categories.find(c => c.id===id);
  const prompt = id => state.data.prompts.find(p => p.id===id);

  function thumbnail(p,index) {
    const t=p.thumbnails;
    if(!t)return `<img data-src="${p.preview}" alt="${escape(p.summary)}" width="1280" height="720" decoding="async">`;
    const sizes='(max-width:650px) 52vw, (max-width:900px) 31vw, (max-width:1200px) 22vw, 280px';
    return `<picture><source type="image/avif" data-srcset="${t.avif[384]} 384w, ${t.avif[640]} 640w" sizes="${sizes}"><img data-src="${t.webp[384]}" data-srcset="${t.webp[384]} 384w, ${t.webp[640]} 640w" sizes="${sizes}" alt="${escape(p.summary)}" width="1280" height="720" decoding="async" fetchpriority="${index<4?'auto':'low'}"></picture>`;
  }

  function loadPrompt(id) {
    if(promptCache.has(id))return Promise.resolve(promptCache.get(id));
    if(promptRequests.has(id))return promptRequests.get(id);
    const request=fetch(`data/prompts/${encodeURIComponent(id)}.json?v=20261111.500.custom1`).then(response=>{
      if(!response.ok)throw new Error('Prompt unavailable');return response.json();
    }).then(p=>{if(p.id!==id||!p.prompt||!p.personalization)throw new Error('Invalid prompt');promptCache.set(id,p);return p;}).finally(()=>promptRequests.delete(id));
    promptRequests.set(id,request);return request;
  }

  function loadSearchIndex() {
    if(state.searchIndex)return Promise.resolve();
    if(!searchRequest)searchRequest=fetch('data/search.json?v=20261111.500.custom1').then(r=>{if(!r.ok)throw new Error('Search unavailable');return r.json();}).then(data=>{state.searchIndex=data;}).catch(()=>{searchRequest=null;});
    return searchRequest;
  }

  function notify(message) {
    $('toast').textContent=message; $('toast').classList.add('visible');
    ui.toast($('toast'));
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2300);
  }

  async function setDrawer(open) {
    const version=++drawerVersion,panel=$('sidebar'),overlay=$('menu-overlay');
    if(window.innerWidth>900){ui.drawerDone(panel,overlay);document.body.classList.remove('menu-open');overlay.hidden=true;$('page-shell').inert=false;$('menu-toggle').setAttribute('aria-expanded','false');return;}
    if(open&&!document.body.classList.contains('menu-open'))drawerReturn=document.activeElement;
    $('menu-toggle').setAttribute('aria-expanded',String(open));
    if(open){
      document.body.classList.add('menu-open');overlay.hidden=false;$('page-shell').inert=true;$('menu-close').focus();
      ui.drawer(panel,overlay,true);ui.stagger([...panel.querySelectorAll('.nav-item')].slice(0,12),{step:22,delay:70,distance:8,duration:430});
    }else{
      await ui.drawer(panel,overlay,false);if(version!==drawerVersion)return;
      document.body.classList.remove('menu-open');overlay.hidden=true;$('page-shell').inert=false;ui.drawerDone(panel,overlay);
      if(drawerReturn?.isConnected)drawerReturn.focus({preventScroll:true});
    }
  }
  $('menu-toggle').addEventListener('click',()=>setDrawer(true));
  $('menu-close').addEventListener('click',()=>setDrawer(false));
  $('menu-overlay').addEventListener('click',()=>setDrawer(false));
  window.addEventListener('resize',()=>{if(window.innerWidth>900 && document.body.classList.contains('menu-open'))setDrawer(false);});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && document.body.classList.contains('menu-open')) { e.preventDefault(); setDrawer(false); }
    if(document.body.classList.contains('menu-open') && e.key==='Tab') {
      const focusable=[...$('sidebar').querySelectorAll('a,button')].filter(el=>el.getClientRects().length);
      const first=focusable[0],last=focusable.at(-1);
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
    if(e.key==='/' && !e.metaKey && !e.ctrlKey && !e.altKey && !document.querySelector('dialog[open]') && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      e.preventDefault(); $('search').focus();
    }
  });

  function renderNavigation() {
    $('library-total').textContent=state.data.total;
    $('category-nav').innerHTML=state.data.categories.map(c=>`<button class="nav-item category-item" data-view="${c.id}">${icon(c.icon)}<span>${escape(c.name)}</span><span class="nav-count">${c.count}</span></button>`).join('');
    $('category-chips').innerHTML=`<button class="chip" data-view="inicio">Todos os universos</button>`+state.data.categories.map(c=>`<button class="chip" data-view="${c.id}">${escape(c.name)}</button>`).join('');
    $('favorites-count').textContent=state.favorites.size;
    ui.navigation();
  }

  function card(p, index=0) {
    const cat=category(p.category), saved=state.favorites.has(p.id);
    return `<article class="prompt-card reveal" data-card="${p.id}" style="--stagger:${Math.min(index%5,4)*65}ms;--float-delay:${(index%7)*180}ms">
      <button class="card-open" data-open="${p.id}" aria-label="Abrir prompt: ${escape(cat.name)} — ${escape(p.title)}">
        <div class="card-image">${thumbnail(p,index)}<div class="card-image-shade"></div><span class="card-number">${String(p.number).padStart(3,'0')}</span>${p.origin==='novo'?'<span class="new-badge">NOVA IDEIA</span>':''}<span class="card-format">${p.duration}s <span>·</span> ${p.aspect}</span></div>
        <div class="card-copy"><span class="card-category">${escape(cat.name)}</span><h3>${escape(p.title)}</h3><p class="card-summary">${escape(p.summary)}</p><span class="card-bottom">Abrir prompt <span aria-hidden="true">↗</span></span></div>
      </button><button class="card-save ${saved?'saved':''}" data-save="${p.id}" aria-label="${saved?'Remover dos favoritos':'Salvar nos favoritos'}: ${escape(p.title)}" aria-pressed="${saved}">${saved?'♥':'♡'}</button><div class="card-shine" aria-hidden="true"></div>
    </article>`;
  }

  function sorted(list) {
    if(state.sort==='az')return [...list].sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));
    if(state.sort==='new')return [...list].sort((a,b)=>(b.origin==='novo')-(a.origin==='novo') || a.number-b.number);
    return list;
  }

  function collection(c, list, index) {
    return `<section class="collection" aria-labelledby="collection-${c.id}"><div class="collection-heading reveal"><div><p class="collection-index">${String(index+1).padStart(2,'0')} <span>/ UNIVERSO CRIA</span></p><h3 id="collection-${c.id}">${escape(c.name)}</h3><p>${escape(c.description)}</p></div><div class="collection-actions"><button class="see-all" data-view="${c.id}">Ver todos <span>${list.length}</span> ↗</button><button class="rail-arrow" data-rail="${c.id}" data-direction="-1" aria-label="Voltar em ${escape(c.name)}">←</button><button class="rail-arrow" data-rail="${c.id}" data-direction="1" aria-label="Avançar em ${escape(c.name)}">→</button></div></div><div class="card-rail" id="rail-${c.id}" tabindex="0" aria-label="Prompts de ${escape(c.name)}">${list.map(card).join('')}</div></section>`;
  }

  function observeCards() {
    revealObserver?.disconnect();
    imageObserver?.disconnect();
    const loadImage = img => {
      img.closest('.card-image')?.classList.add('image-pending');
      const source=img.parentElement.querySelector('source');
      if(source?.dataset.srcset){source.srcset=source.dataset.srcset;delete source.dataset.srcset;}
      if(img.dataset.srcset){img.srcset=img.dataset.srcset;delete img.dataset.srcset;}
      if(img.dataset.src){img.src=img.dataset.src;delete img.dataset.src;}
    };
    if('IntersectionObserver' in window){
      imageObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){loadImage(entry.target);imageObserver.unobserve(entry.target);}}),{rootMargin:'280px 80px',threshold:0});
      document.querySelectorAll('.card-image img').forEach(img=>imageObserver.observe(img));
    }else document.querySelectorAll('.card-image img').forEach(loadImage);
    const reveal = el => {
      el.classList.add('revealed');
      const complete = () => { if(el.isConnected && el.classList.contains('motion-visible')) el.classList.add('in-viewport'); };
      if(!el.animate) { complete(); return; }
      const full = motion();
      const frames = full
        ? [{opacity:0,translate:'0 30px',scale:'.965',filter:'blur(3px)'},{opacity:1,translate:'0 0',scale:'1',filter:'blur(0)'}]
        : [{opacity:.15},{opacity:1}];
      ui.run(el,frames,{duration:full?950:340,delay:full?parseFloat(el.style.getPropertyValue('--stagger'))||0:0,easing:full?'cubic-bezier(.16,1,.3,1)':'ease-out',fill:'backwards'},'card-entry').then(finished=>{if(finished)complete();});
    };
    if('IntersectionObserver' in window) {
      revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
        const el=entry.target;
        el.classList.toggle('motion-visible',entry.isIntersecting);
        if(entry.isIntersecting) {
          if(!el.classList.contains('revealed')) reveal(el);
          else el.classList.add('in-viewport');
          if(!el.classList.contains('prompt-card')) revealObserver.unobserve(el);
        } else el.classList.remove('in-viewport');
      }),{rootMargin:'0px 0px -24px',threshold:0.12});
      document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));
    } else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('revealed'));
    document.querySelectorAll('.card-image img').forEach(img=>img.addEventListener('error',()=>{
      const source=img.parentElement.querySelector('source');
      if(source?.hasAttribute('srcset')){source.removeAttribute('srcset');return;}
      img.hidden=true;
      const image=img.closest('.card-image');
      image.classList.remove('image-pending');
      if(!image.querySelector('.image-unavailable')){const fallback=document.createElement('span');fallback.className='image-unavailable';fallback.textContent='Prévia indisponível';image.prepend(fallback);}
    }));
    document.querySelectorAll('.card-image img').forEach(img=>{
      img.addEventListener('load',()=>{img.classList.add('is-loaded');ui.imageLoaded(img);});
      if(img.complete&&img.naturalWidth)img.classList.add('is-loaded');
    });
  }

  function paint() {
    if(!state.data)return;
    const cat=category(state.view), q=normalize(state.query);
    const overview=state.view==='inicio'&&!q&&state.sort==='curated';
    let list=state.data.prompts;
    if(cat)list=list.filter(p=>p.category===cat.id);
    if(state.view==='favoritos')list=list.filter(p=>state.favorites.has(p.id));
    if(state.view==='recentes')list=state.recent.map(prompt).filter(Boolean);
    if(q)list=list.filter(p=>p.searchText.includes(q)||state.searchIndex?.[p.id]?.includes(q));
    list=sorted(list);
    const title=cat?cat.name:state.view==='favoritos'?'Suas ideias favoritas':state.view==='recentes'?'Continue de onde parou':q?'Encontre sua próxima ideia':'Explore a biblioteca';
    $('library-title').textContent=title;
    const dot=document.createElement('span');dot.className='title-dot';dot.textContent='.';$('library-title').append(dot);
    $('library-description').textContent=cat?cat.description:state.view==='favoritos'?'As cenas que você guardou para criar depois.':state.view==='recentes'?'Seus últimos prompts abertos, na ordem mais recente.':'Referências para despertar ideias. Prompts para dar direção.';
    $('library-eyebrow').textContent=cat?'UM UNIVERSO DE POSSIBILIDADES':state.view==='favoritos'?'SUA CURADORIA PESSOAL':state.view==='recentes'?'IDEIAS QUE VOCÊ JÁ EXPLOROU':'ESCOLHA O SEU PONTO DE PARTIDA';
    $('breadcrumb-current').textContent=cat?cat.name:state.view==='favoritos'?'Meus favoritos':state.view==='recentes'?'Recentes':'Biblioteca de vídeo';
    $('result-count').textContent=`${list.length} ${list.length===1?'prompt':'prompts'}`;
    $('hero').hidden=!overview;
    document.querySelector('.start-strip').hidden=!overview;
    $('category-chips').hidden=state.view==='favoritos'||state.view==='recentes';
    $('active-query').hidden=!q;
    $('active-query').querySelector('span').textContent=`Buscando por “${state.query}”`;
    document.querySelectorAll('[data-view]').forEach(el=>{
      const active=el.dataset.view===state.view;
      el.classList.toggle('active',active);
      if(el.classList.contains('chip'))el.setAttribute('aria-pressed',String(active));
      else if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
    });
    $('favorites-count').textContent=state.favorites.size;
    $('empty-state').hidden=list.length>0;
    $('empty-description').textContent=q?'Tente outro termo ou limpe a busca para encontrar mais cenas.':state.view==='favoritos'?'Toque no coração de um card para guardar a ideia aqui.':state.view==='recentes'?'Abra um prompt da biblioteca. Ele vai aparecer aqui para você voltar depois.':'Explore outro universo para encontrar uma nova direção.';
    let content;
    if(overview) {
      const picks=[301,331,351,366,304,342,357,382].map(n=>prompt(`cria-${String(n).padStart(3,'0')}`));
      const featured={id:'destaques',name:'Ideias para a sua próxima campanha',description:'Lançamentos, demonstrações e produtos com uma direção que a sua marca pode adaptar.'};
      content=collection(featured,picks,0).replace('data-view="destaques"','data-view="inicio"')+state.data.categories.map((c,i)=>collection(c,list.filter(p=>p.category===c.id),i+1)).join('');
    } else content=`<div class="card-grid">${list.map(card).join('')}</div>`;
    const changed=content!==lastContent;
    if(changed){$('collection-content').innerHTML=content;lastContent=content;if(overview)$('collection-content').querySelector('.see-all').hidden=true;}
    $('collection-content').dataset.view=state.view;
    $('collection-content').setAttribute('aria-busy','false');
    if(changed)observeCards();
  }

  function render({instant=false}={}) {
    if(!state.data)return Promise.resolve(false);
    if(!painted||instant||document.querySelector('dialog[open]')){ui.cancelSwap($('collection-content'));paint();painted=true;return Promise.resolve(true);}
    return ui.swap($('collection-content'),paint);
  }

  async function setView(view, {scroll=true, history=true}={}) {
    if(!state.data)return;
    const version=++navigationVersion;
    const wasOverview=!$('hero').hidden;
    state.view=['inicio','favoritos','recentes',...state.data.categories.map(c=>c.id)].includes(view)?view:'inicio';
    if(history)window.history.replaceState(null,'',`#${state.view}`);
    const update=render();
    if(document.body.classList.contains('menu-open'))setDrawer(false);
    const complete=await update;if(!complete||version!==navigationVersion)return;
    const chip=$('category-chips').querySelector('.chip.active');
    if(chip)$('category-chips').scrollTo({left:chip.offsetLeft-$('category-chips').offsetLeft-($('category-chips').clientWidth-chip.offsetWidth)/2,behavior:motion()?'smooth':'instant'});
    if(!wasOverview&&!$('hero').hidden)ui.hero();
    if(scroll)requestAnimationFrame(()=>$('library').scrollIntoView({behavior:motion()?'smooth':'instant',block:'start'}));
  }

  function toggleFavorite(id) {
    if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);
    write('cria_favorites_v2',[...state.favorites]);
    document.querySelectorAll('[data-save]').forEach(btn=>{if(btn.dataset.save!==id)return;const saved=state.favorites.has(id);btn.classList.toggle('saved',saved);btn.setAttribute('aria-pressed',String(saved));btn.setAttribute('aria-label',`${saved?'Remover dos favoritos':'Salvar nos favoritos'}: ${prompt(id).title}`);btn.textContent=saved?'♥':'♡';ui.pulse(btn);});
    $('favorites-count').textContent=state.favorites.size;
    ui.pulse($('favorites-count'),1.08);
    syncModalFavorite();
    if(state.view==='favoritos')render();
    notify(state.favorites.has(id)?'Ideia salva nos seus favoritos.':'Ideia removida dos favoritos.');
  }

  function syncModalFavorite() {
    if(!state.current)return;
    const saved=state.favorites.has(state.current.id);
    $('modal-favorite').setAttribute('aria-pressed',String(saved));
    $('modal-favorite').textContent=saved?'♥ Salvo':'♡ Salvar';
  }

  function rememberedProfile() {
    try {const p=JSON.parse(localStorage.getItem('cria_brand_profile_v1'));return p&&typeof p==='object'&&!Array.isArray(p)?p:{};}catch{return {};}
  }
  function rememberProfile() {
    try {
      if($('remember-brand').checked){
        const values={};for(const field of engine.fields(state.current))if(['brand','grade','contrast'].includes(field.id)){const value=engine.clean(field,currentValues[field.id]);if(value)values[field.id]=value;}
        if(Object.keys(values).length)localStorage.setItem('cria_brand_profile_v1',JSON.stringify(values));else localStorage.removeItem('cria_brand_profile_v1');
      }else localStorage.removeItem('cria_brand_profile_v1');
      $('remember-status').textContent=$('remember-brand').checked?'Salvo apenas neste navegador.':'Não salvar as preferências neste navegador.';
    }catch{$('remember-status').textContent='O navegador não permitiu salvar. Você pode continuar personalizando.';}
  }
  function renderPersonalizerFields() {
    $('personalizer-fields').innerHTML=engine.fields(state.current).map(field=>{
      const value=engine.clean(field,currentValues[field.id]),id=`custom-${field.id}`;
      const control=field.options
        ? `<select id="${id}" data-custom-field="${field.id}" aria-describedby="${id}-help"><option value="">Original da cena</option>${field.options.map(o=>`<option value="${o.value}" ${o.value===value?'selected':''}>${escape(o.label)}</option>`).join('')}</select>`
        : `<input id="${id}" data-custom-field="${field.id}" type="text" maxlength="${field.maxLength||160}" value="${escape(value)}" placeholder="${escape(field.placeholder||'Opcional')}" autocomplete="off" aria-describedby="${id}-help">`;
      return `<div class="custom-field ${field.essential?'essential-field':''}"><label for="${id}">${escape(field.label)}${field.essential?'<span>Preencher</span>':''}</label>${control}<small id="${id}-help">${escape(field.help||'Opcional. A ação e as referências da cena são preservadas.')}</small></div>`;
    }).join('');
  }
  function updatePersonalizedPrompt() {
    if(!state.current)return;
    const result=engine.compose(state.current,currentValues);state.renderedPrompt=result.text;copyVersion++;
    drafts.set(state.current.id,{...currentValues});
    $('prompt-text').textContent=result.text;
    $('prompt-fields').hidden=!result.unresolved.length;
    $('prompt-fields').textContent=result.unresolved.length?`Preencha no personalizador ou no texto copiado: ${result.unresolved.join(' · ')}`:'';
    $('prompt-mode').textContent=result.applied.length?'SUA VERSÃO':'PROMPT ORIGINAL';
    const count=result.applied.length?`${result.applied.length} ${result.applied.length===1?'ajuste aplicado':'ajustes aplicados'}`:'Sua assinatura, nesta cena';
    if($('personalizer-count').textContent!==count){$('personalizer-count').textContent=count;ui.changed($('personalizer-count'));}
    $('personalizer-fields').querySelectorAll('[data-custom-field]').forEach(el=>el.closest('.custom-field').classList.toggle('is-edited',!!currentValues[el.dataset.customField]));
    $('personalizer-status').textContent=result.applied.length?'O texto abaixo já está atualizado com as suas escolhas.':'Escolha o que deseja adaptar. Deixe os outros campos como estão.';
    $('copy-status').textContent='';$('copy-prompt').querySelector('span').textContent=result.applied.length?'Copiar minha versão':'Copiar prompt completo';
    $('copy-prompt').classList.remove('is-copied');
    $('reset-personalization').disabled=!result.applied.length;
  }
  function setupPersonalizer(p) {
    const profile=rememberedProfile();currentValues={...(drafts.get(p.id)||profile)};
    $('remember-brand').checked=Object.keys(profile).length>0;
    $('remember-status').textContent=$('remember-brand').checked?'Salvo apenas neste navegador.':'Se preferir, reutilize sua marca e acabamento em outros prompts.';
    renderPersonalizerFields();updatePersonalizedPrompt();
    $('personalizer').hidden=false;$('personalizer').setAttribute('aria-busy','false');$('personalizer-toggle').disabled=false;
  }
  $('personalizer-toggle').addEventListener('click',()=>{
    const panel=$('personalizer-panel'),open=$('personalizer-toggle').getAttribute('aria-expanded')!=='true';
    $('personalizer-toggle').setAttribute('aria-expanded',String(open));$('prompt-dialog').classList.toggle('is-personalizing',open);
    ui.disclose(panel,open);
  });
  $('personalizer-fields').addEventListener('input',e=>{
    const field=engine.fields(state.current).find(f=>f.id===e.target.dataset.customField);if(!field)return;
    currentValues[field.id]=engine.clean(field,e.target.value);updatePersonalizedPrompt();if($('remember-brand').checked)rememberProfile();
  });
  $('remember-brand').addEventListener('change',rememberProfile);
  $('reset-personalization').addEventListener('click',()=>{currentValues={};renderPersonalizerFields();updatePersonalizedPrompt();$('personalizer-status').textContent='Prompt original restaurado. Suas preferências salvas continuam disponíveis para outras cenas.';});
  $('retry-prompt').addEventListener('click',()=>{if($('prompt-dialog').dataset.promptId)openPrompt($('prompt-dialog').dataset.promptId,returnTarget);});

  async function openPrompt(id, trigger) {
    const p=prompt(id);if(!p)return;
    const request=++openVersion;state.current=null;state.renderedPrompt='';returnTarget=trigger||document.activeElement;closing=false;copyVersion++;
    const cat=category(p.category),dialog=$('prompt-dialog');
    dialog.dataset.promptId=id;
    $('prompt-title').textContent=p.title;
    $('prompt-category').textContent=cat.name;
    $('prompt-language').textContent=p.category==='fooh'?'EN · SEM FALAS':'EN · ATÉ 15s';
    $('prompt-number').textContent=`CRIA / ${String(p.number).padStart(3,'0')}`;
    $('prompt-summary').textContent=p.summary;
    $('prompt-meta').innerHTML=`<span>${p.duration}s de vídeo final</span><span>${p.aspect}</span><span>${p.origin==='novo'?'Nova ideia':'Direção revisada'}</span>`;
    $('prompt-references').innerHTML=p.references.length?`<strong>Seus anexos</strong>`+p.references.map(r=>`<span><code>${r.token}</code> ${escape(r.label)}</span>`).join(''):'<span>Crie sem anexo obrigatório. Personalize a cena como quiser.</span>';
    $('prompt-text').textContent='Preparando a direção desta cena...';$('prompt-text').scrollTop=0;
    $('prompt-fields').hidden=true;$('retry-prompt').hidden=true;$('copy-prompt').disabled=true;
    ui.resetDisclosure($('personalizer-panel'));$('personalizer').hidden=false;$('personalizer').setAttribute('aria-busy','true');$('personalizer-toggle').disabled=true;$('personalizer-count').textContent='Preparando esta cena...';$('personalizer-panel').hidden=true;$('personalizer-toggle').setAttribute('aria-expanded','false');dialog.classList.remove('is-personalizing');
    $('copy-status').textContent='';$('copy-prompt').querySelector('span').textContent='Copiar prompt completo';
    const rect=trigger?.getBoundingClientRect();
    if(rect){dialog.style.setProperty('--origin-x',`${rect.left+rect.width/2-window.innerWidth/2}px`);dialog.style.setProperty('--origin-y',`${rect.top+rect.height/2-window.innerHeight/2}px`);}
    dialog.classList.remove('is-closing');if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
    document.body.classList.add('dialog-open');
    ui.dialogIn(dialog);
    dialog.querySelector('[data-close]').focus({preventScroll:true});
    try{
      const full=await loadPrompt(id);if(request!==openVersion||!dialog.open)return;
      state.current=full;setupPersonalizer(full);syncModalFavorite();$('copy-prompt').disabled=false;ui.loadedPrompt();
      state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,40);write('cria_recent_v2',state.recent);
    }catch{
      if(request!==openVersion||!dialog.open)return;
      $('prompt-text').textContent='Não foi possível carregar este prompt. Confira sua conexão e tente novamente.';$('retry-prompt').hidden=false;$('personalizer').setAttribute('aria-busy','false');$('personalizer-count').textContent='Tente carregar esta cena novamente.';
    }
  }

  async function closeDialog(dialog) {
    if(!dialog.open||closing)return;
    closing=true;dialog.classList.add('is-closing');
    await ui.dialogOut(dialog);if(!dialog.open)return;
    dialog.close();dialog.classList.remove('is-closing');closing=false;
  }
  document.querySelectorAll('dialog').forEach(dialog=>{
    dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog(dialog);});
    dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(dialog);});
    dialog.addEventListener('close',()=>{
      ui.dialogClosed(dialog);
      if(dialog.id==='prompt-dialog')openVersion++;
      document.body.classList.remove('dialog-open');
      if(dialog.id==='prompt-dialog'){
        const lastId=state.current?.id;copyVersion++;
        if(state.view==='recentes')render();
        const target=returnTarget?.isConnected?returnTarget:document.querySelector(`[data-open="${lastId}"]`);
        target?.focus({preventScroll:true});
      }
    });
  });
  function openGuide(){closing=false;$('guide-dialog').showModal();document.body.classList.add('dialog-open');ui.dialogIn($('guide-dialog'));$('guide-dialog').querySelector('[data-close]').focus();}
  ['open-guide','strip-guide','footer-guide'].forEach(id=>$(id).addEventListener('click',openGuide));
  $('modal-favorite').addEventListener('click',()=>state.current&&toggleFavorite(state.current.id));

  $('copy-prompt').addEventListener('click',async()=>{
    if(!state.current)return;
    const value=state.renderedPrompt,version=copyVersion;
    let copied=false;
    try {if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);copied=true;}} catch { /* Try a selected textarea inside the native dialog. */ }
    if(!copied){const area=document.createElement('textarea');area.value=value;area.style.cssText='position:fixed;opacity:0;top:0;left:0';$('prompt-dialog').append(area);area.select();try{copied=document.execCommand('copy');}catch{}area.remove();$('copy-prompt').focus({preventScroll:true});}
    if(version!==copyVersion)return;
    if(copied){$('copy-prompt').querySelector('span').textContent='Prompt copiado!';$('copy-prompt').classList.add('is-copied');ui.pulse($('copy-prompt'),1.035);ui.changed($('copy-status'));$('copy-status').textContent='Pronto. Agora é só colar e dar a sua direção.';}
    else{const range=document.createRange();range.selectNodeContents($('prompt-text'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);$('prompt-text').focus();$('copy-status').textContent='O navegador bloqueou a cópia. O texto está selecionado: use Ctrl+C ou a opção Copiar.';}
  });

  document.addEventListener('click',e=>{
    const close=e.target.closest('[data-close]');if(close){closeDialog($(close.dataset.close));return;}
    const save=e.target.closest('[data-save]');if(save){toggleFavorite(save.dataset.save);return;}
    const open=e.target.closest('[data-open]');if(open&&state.data){openPrompt(open.dataset.open,open);return;}
    const view=e.target.closest('[data-view]');if(view){setView(view.dataset.view);return;}
    const rail=e.target.closest('[data-rail]');if(rail){const el=$(`rail-${rail.dataset.rail}`);el?.scrollBy({left:Number(rail.dataset.direction)*el.clientWidth*.85,behavior:motion()?'smooth':'instant'});}
  });
  document.querySelectorAll('a[href="#inicio"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();state.query='';$('search').value='';state.sort='curated';$('sort').value='curated';setView('inicio',{scroll:false});window.scrollTo({top:0,behavior:motion()?'smooth':'instant'});}));
  $('search-form').addEventListener('submit',e=>{e.preventDefault();$('library').scrollIntoView({behavior:motion()?'smooth':'instant'});});
  let searchTimer;
  $('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.query=$('search').value.trim();render({instant:true});if(state.query&&!state.searchIndex)loadSearchIndex().then(()=>{if(state.query)render({instant:true});});},110);});
  $('clear-search').addEventListener('click',()=>{state.query='';$('search').value='';render();$('search').focus();});
  $('sort').addEventListener('change',()=>{state.sort=$('sort').value;render();});
  $('reset-view').addEventListener('click',()=>{state.query='';$('search').value='';state.sort='curated';$('sort').value='curated';setView('inicio');});
  $('hero-cta').addEventListener('click',()=>$('library').scrollIntoView({behavior:motion()?'smooth':'instant'}));
  $('logout').addEventListener('click',()=>{localStorage.removeItem('cria_access');window.location.href='/';});
  window.addEventListener('hashchange',()=>state.data&&setView(location.hash.slice(1),{history:false}));
  let pointerFrame=0,pointer=null;
  document.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse')return;pointer={target:e.target,x:e.clientX,y:e.clientY};
    if(pointerFrame)return;
    pointerFrame=requestAnimationFrame(()=>{
      pointerFrame=0;if(!pointer?.target.isConnected)return;
      const glass=pointer.target.closest('dialog'),card=pointer.target.closest('.prompt-card'),target=glass||card;if(!target)return;
      const r=target.getBoundingClientRect(),x=Math.max(0,Math.min(1,(pointer.x-r.left)/r.width)),y=Math.max(0,Math.min(1,(pointer.y-r.top)/r.height));
      if(glass){glass.style.setProperty('--glass-x',`${x*100}%`);glass.style.setProperty('--glass-y',`${y*100}%`);return;}
      card.style.setProperty('--pointer-x',`${x*100}%`);card.style.setProperty('--pointer-y',`${y*100}%`);
      if(motion()){card.style.setProperty('--rotate-x',`${(0.5-y)*7}deg`);card.style.setProperty('--rotate-y',`${(x-0.5)*9}deg`);}
    });
  },{passive:true});
  document.addEventListener('pointerout',e=>{const card=e.target.closest('.prompt-card');if(card&&!card.contains(e.relatedTarget)){pointer=null;card.style.setProperty('--rotate-x','0deg');card.style.setProperty('--rotate-y','0deg');}},{passive:true});
  document.addEventListener('pointerover',e=>{const button=e.target.closest('[data-open]');if(button&&e.pointerType==='mouse')loadPrompt(button.dataset.open).catch(()=>{});},{passive:true});
  document.addEventListener('focusin',e=>{const button=e.target.closest('[data-open]');if(button)loadPrompt(button.dataset.open).catch(()=>{});});

  async function loadCatalog(){
    $('load-error').hidden=true;$('collection-content').setAttribute('aria-busy','true');
    try{
      const response=await fetch('data/library.json?v=20261111.500.custom1');if(!response.ok)throw new Error('Catalog unavailable');
      state.data=await response.json();
      const valid=new Set(state.data.prompts.map(p=>p.id));state.favorites=new Set([...state.favorites].filter(id=>valid.has(id)));state.recent=state.recent.filter(id=>valid.has(id));
      state.data.prompts.forEach(p=>p.searchText=normalize(`${p.title} ${p.summary} ${category(p.category).name}`));
      renderNavigation();await setView(location.hash.slice(1)||'inicio',{scroll:false,history:false});
    }catch(error){$('collection-content').innerHTML='';$('collection-content').setAttribute('aria-busy','false');$('load-error').hidden=false;$('result-count').textContent='Biblioteca indisponível';}
  }
  $('retry-load').addEventListener('click',loadCatalog);
  loadCatalog();
})();
