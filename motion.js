/* Native, interruptible UI motion. No dependencies, continuous JS loop or network calls. */
(() => {
  'use strict';
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const full=()=>!preference.matches;
  const ease='cubic-bezier(.16,1,.3,1)', spring='cubic-bezier(.18,1.08,.28,1)';
  const channels=new WeakMap(), swaps=new WeakMap(), disclosures=new WeakMap(), active=new Set();
  const visible=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;};
  function stop(el,channel='ui') { const map=channels.get(el);map?.get(channel)?.cancel();map?.delete(channel); }
  function run(el,frames,options={},channel='ui') {
    if(!el?.animate)return Promise.resolve(true);
    stop(el,channel);
    const map=channels.get(el)||new Map();channels.set(el,map);
    const animation=el.animate(frames,{duration:full()?460:220,easing:ease,fill:'backwards',...options});
    map.set(channel,animation);active.add(animation);
    return animation.finished.then(()=>true,()=>false).finally(()=>{active.delete(animation);if(map.get(channel)===animation&&options.fill!=='both')map.delete(channel);});
  }
  function reveal(el,{delay=0,duration=580,distance=18,scale=1}={}) {
    if(!el)return Promise.resolve(false);
    return run(el,full()?[{opacity:0,translate:`0 ${distance}px`,scale},{opacity:1,translate:'0 0',scale:1}]:[{opacity:.25},{opacity:1}],{duration:full()?duration:240,delay:full()?delay:Math.min(delay*.25,75)},'reveal');
  }
  function stagger(elements,{step=45,delay=0,distance=12,duration=460}={}) {
    [...elements].forEach((el,i)=>reveal(el,{delay:delay+Math.min(i,7)*step,distance,duration}));
  }
  function navigation() {stagger([...document.querySelectorAll('.category-item')].filter(visible),{step:28,delay:90,distance:8,duration:520});}
  function intro() {
    if(document.body.dataset.motionIntro)return;
    document.body.dataset.motionIntro='ready';
    const selectors=['.sidebar-brand','.sidebar-caption','.main-nav','.sidebar-bottom','.topbar','.login-top','.login-editorial>.eyebrow','.login-editorial h1','.login-description','.login-metrics','.login-card','.login-footer'];
    stagger(selectors.flatMap(s=>[...document.querySelectorAll(s)]).filter(visible),{step:38,distance:16,duration:800});
    hero();
    stagger([...document.querySelectorAll('.start-strip,.library-heading,.filter-row')].filter(visible),{step:65,delay:140,distance:18,duration:700});
  }
  function hero() {
    stagger([...document.querySelectorAll('.hero-copy>* ,.hero-caption,.hero-index')].filter(visible),{step:65,delay:90,distance:23,duration:850});
  }
  function cancelSwap(el) {
    const job=swaps.get(el);if(job)job.cancelled=true;stop(el,'view');el.removeAttribute('data-transitioning');
  }
  async function swap(el,paint) {
    const opacity=getComputedStyle(el).opacity;cancelSwap(el);
    const job={cancelled:false};swaps.set(el,job);el.dataset.transitioning='true';
    const completed=await run(el,[{opacity},{opacity:.08}],{duration:full()?130:95,easing:'ease-out'},'view');
    if(!completed||job.cancelled)return false;
    paint();el.removeAttribute('data-transitioning');
    run(el,[{opacity:.18},{opacity:1}],{duration:full()?380:230},'view');
    stagger(document.querySelectorAll('.library-heading>div>*,.sort,.result-count'),{step:30,distance:full()?10:0,duration:480});
    return true;
  }
  function resetDisclosure(panel) {
    const job=disclosures.get(panel);if(job)job.cancelled=true;
    stop(panel,'disclosure');panel.style.removeProperty('height');panel.style.removeProperty('overflow');panel.inert=false;delete panel.dataset.motionState;
  }
  async function disclose(panel,open) {
    const hidden=panel.hidden,from=hidden?0:panel.getBoundingClientRect().height,opacity=hidden?0:Number(getComputedStyle(panel).opacity);
    resetDisclosure(panel);const job={cancelled:false};disclosures.set(panel,job);
    panel.dataset.motionState=open?'opening':'closing';
    panel.hidden=false;panel.inert=!open;
    const target=open?panel.scrollHeight:0;
    panel.style.overflow='clip';
    if(open)stagger(panel.querySelectorAll('.custom-field'),{step:24,delay:60,distance:full()?7:0,duration:320});
    const complete=await run(panel,[{height:`${from}px`,opacity},{height:`${target}px`,opacity:open?1:0}],{duration:full()?(open?510:340):260,easing:full()?spring:ease,fill:'both'},'disclosure');
    if(!complete||job.cancelled)return;
    panel.hidden=!open;panel.inert=!open;
    panel.dataset.motionState=open?'open':'closed';
    panel.style.removeProperty('height');panel.style.removeProperty('overflow');
    stop(panel,'disclosure');
  }
  function dialogIn(dialog) {
    stop(dialog,'dialog');
    if(!dialog.dataset.motionAnchored){
      const gap=innerWidth<=650?16:22,top=Math.max(gap,dialog.getBoundingClientRect().top);
      dialog.style.marginTop=`${top}px`;dialog.style.marginBottom='auto';dialog.style.maxHeight=`calc(100dvh - ${top+gap}px)`;dialog.dataset.motionAnchored='true';
    }
    const x=parseFloat(dialog.style.getPropertyValue('--origin-x'))||0,y=parseFloat(dialog.style.getPropertyValue('--origin-y'))||0;
    if(dialog.id==='prompt-dialog'){
      dialog.dataset.popupMotion=full()?'expressive-pop':'expressive-soft-pop';
      const bounds=dialog.getBoundingClientRect();
      const available=Math.min((innerWidth-8)/bounds.width,1+Math.max(0,Math.min(bounds.top,innerHeight-bounds.bottom)-4)*2/bounds.height);
      const peak=Math.max(1,Math.min(full()?1.045:1.028,available));
      const frames=full()?[
        {opacity:0,transform:`translate(${x*.035}px,${y*.035+22}px) scale(.74)`,filter:'blur(3px)',offset:0,easing:'cubic-bezier(.2,.75,.25,1)'},
        {opacity:1,transform:`translate(0,-2px) scale(${peak})`,filter:'blur(0)',offset:.6,easing:'ease-in-out'},
        {opacity:1,transform:'translate(0,1px) scale(.982)',filter:'blur(0)',offset:.83,easing:'ease-out'},
        {opacity:1,transform:'translate(0,0) scale(1)',filter:'blur(0)',offset:1}
      ]:[
        {opacity:0,transform:'scale(.82)',offset:0,easing:'cubic-bezier(.2,.75,.25,1)'},
        {opacity:1,transform:`scale(${peak})`,offset:.65,easing:'ease-in-out'},
        {opacity:1,transform:'scale(.992)',offset:.86,easing:'ease-out'},
        {opacity:1,transform:'scale(1)',offset:1}
      ];
      run(dialog,frames,{duration:full()?650:500,easing:'linear'},'dialog');
    }else run(dialog,full()?[{opacity:0,transform:`translate(${x*.055}px,${y*.055}px) scale(.955)`,filter:'blur(3px)'},{opacity:1,transform:'translate(0,0) scale(1)',filter:'blur(0)'}]:[{opacity:0,scale:.996},{opacity:1,scale:1}],{duration:full()?590:260,easing:ease},'dialog');
    stagger([...dialog.querySelectorAll('.prompt-kicker,#prompt-title,.prompt-summary,.prompt-meta,.prompt-references,.guide-dialog>.eyebrow,.guide-dialog>h2,.guide-intro,.guide-steps>li,.guide-tip')].filter(el=>!el.hidden),{step:32,delay:full()?80:0,distance:full()?10:0,duration:460});
  }
  function dialogOut(dialog) {
    const style=getComputedStyle(dialog),opacity=style.opacity,transform=style.transform==='none'?'scale(1)':style.transform;
    if(dialog.id==='prompt-dialog'){
      const current=style.transform==='none'?1:new DOMMatrixReadOnly(style.transform).a;
      const target=Math.min(full()?.94:.97,current*.97);
      return run(dialog,[{opacity,transform,filter:style.filter},{opacity:0,transform:`translateY(${full()?8:0}px) scale(${target})`,filter:full()?'blur(2px)':'none'}],{duration:full()?210:170,easing:'cubic-bezier(.4,0,.8,.4)',fill:'both'},'dialog');
    }
    return run(dialog,full()?[{opacity,transform,filter:style.filter},{opacity:0,transform:'translateY(9px) scale(.98)',filter:'blur(2px)'}]:[{opacity},{opacity:0}],{duration:full()?210:170,easing:'cubic-bezier(.4,0,.8,.4)',fill:'both'},'dialog');
  }
  function dialogClosed(dialog) {stop(dialog,'dialog');dialog.querySelectorAll('*').forEach(el=>stop(el,'reveal'));const panel=dialog.querySelector('#personalizer-panel');if(panel){resetDisclosure(panel);panel.hidden=true;}dialog.style.removeProperty('margin-top');dialog.style.removeProperty('margin-bottom');dialog.style.removeProperty('max-height');delete dialog.dataset.motionAnchored;delete dialog.dataset.popupMotion;}
  function loadedPrompt() {reveal(document.querySelector('#personalizer'),{distance:9,duration:450});reveal(document.querySelector('#prompt-text'),{distance:0,duration:300});}
  function pulse(el,amount=1.16) {run(el,full()?[{scale:1},{scale:amount,offset:.38},{scale:1}]:[{scale:1},{scale:Math.min(amount,1.025),offset:.4},{scale:1}],{duration:full()?430:260,easing:ease},'pulse');}
  function changed(el) {run(el,[{opacity:.45},{opacity:1}],{duration:230},'change');}
  function toast(el) {run(el,full()?[{opacity:0,translate:'0 10px',scale:.97},{opacity:1,translate:'0 0',scale:1}]:[{opacity:0},{opacity:1}],{duration:full()?430:220},'toast');}
  function imageLoaded(img) {
    const frame=img.closest('.card-image');frame?.classList.remove('image-pending');frame?.classList.add('image-ready');
    run(img,full()?[{opacity:0,scale:1.045},{opacity:1,scale:1}]:[{opacity:0},{opacity:1}],{duration:full()?620:260},'image');
  }
  function drawer(panel,overlay,open) {
    const current=getComputedStyle(panel).transform;
    const from=open?'translateX(-102%)':current==='none'?'translateX(0)':current;
    run(overlay,[{opacity:open?0:1},{opacity:open?1:0}],{duration:open?330:230,fill:'both'},'drawer');
    return run(panel,full()?[{transform:from},{transform:open?'translateX(0)':'translateX(-102%)'}]:[{opacity:open?0:1,translate:open?'-6px 0':'0 0'},{opacity:open?1:0,translate:open?'0 0':'-6px 0'}],{duration:full()?(open?480:320):240,easing:ease,fill:'both'},'drawer');
  }
  function drawerDone(panel,overlay) {stop(panel,'drawer');stop(overlay,'drawer');}
  document.body.classList.add('fluid-ui');
  document.addEventListener('visibilitychange',()=>document.body.classList.toggle('motion-suspended',document.hidden));
  preference.addEventListener('change',()=>{if(!full())for(const animation of active){try{animation.finish();}catch{animation.cancel();}}});
  if(document.body.classList.contains('login-page')){
    const messages=document.querySelectorAll('.msg');
    const observer=new MutationObserver(entries=>{for(const entry of entries){const el=entry.target.closest?.('.msg')||entry.target.parentElement?.closest('.msg');if(el&&getComputedStyle(el).display!=='none')reveal(el,{distance:6,duration:350});}});
    messages.forEach(el=>observer.observe(el,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']}));
    document.addEventListener('invalid',e=>{if(e.target.matches('input'))run(e.target,full()?[{translate:'0 0'},{translate:'-3px 0',offset:.25},{translate:'3px 0',offset:.55},{translate:'0 0'}]:[{opacity:.65},{opacity:1}],{duration:280},'invalid');},true);
  }
  window.CriaMotion={run,stop,reveal,stagger,intro,hero,navigation,swap,cancelSwap,disclose,resetDisclosure,dialogIn,dialogOut,dialogClosed,loadedPrompt,pulse,changed,toast,imageLoaded,drawer,drawerDone,full};
  intro();
})();
