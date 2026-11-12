/* Local, deterministic customization. No external API or user-data transmission. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CriaPersonalizer=api;})(typeof window!=='undefined'?window:this,()=>{
  'use strict';
  const colors=[['blue','Azul claro','pale blue'],['lilac','Lilás','lilac'],['white','Branco','white'],['black','Preto','black'],['gold','Dourado','muted gold'],['green','Verde sálvia','sage green'],['coral','Coral','coral red'],['silver','Prateado','silver']].map(([value,label,english])=>({value,label,english}));
  const shared={
    grade:{id:'grade',label:'Acabamento de cor',type:'select',options:[
      {value:'warm',label:'Quente e acolhedor',instruction:'Use restrained warm color finishing on the environment and non-reference surfaces. Keep motivated light sources, the original time of day, accurate skin tones and all reference colors unchanged.'},
      {value:'cool',label:'Frio e sofisticado',instruction:'Use restrained cool color finishing on the environment and non-reference surfaces. Keep motivated light sources, the original time of day, accurate skin tones and all reference colors unchanged.'},
      {value:'clean',label:'Neutro e limpo',instruction:'Use clean, restrained color finishing. Retain the original lighting motivation and any essential practical color casts; preserve reference colors, skin tones and the scene\'s visual identity.'}
    ]},
    contrast:{id:'contrast',label:'Contraste',type:'select',options:[
      {value:'soft',label:'Suave',instruction:'Use gentle tonal contrast and organic highlight roll-off without flattening depth, changing the weather or moving any light source.'},
      {value:'defined',label:'Mais definido',instruction:'Use slightly more defined tonal separation, retaining shadow detail, highlight texture and the original lighting logic; avoid crushed blacks or over-sharpening.'}
    ]}
  };
  function fields(p){return (p.personalization?.fields||[]).map(f=>f.shared?shared[f.shared]:f.type==='color'?{...f,options:colors}:f);}
  function clean(field,value){
    const text=String(value??'').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,field.maxLength||160);
    return field.options&&!field.options.some(o=>o.value===text)?'':text;
  }
  function compose(p,values={}){
    let text=p.prompt;const instructions=[],applied=[];
    for(const field of fields(p)){
      const value=clean(field,values[field.id]);if(!value)continue;
      const option=field.options?.find(o=>o.value===value);
      if(field.target){
        if(!text.includes(field.target))continue;
        text=text.split(field.target).join(field.replacement?field.replacement.replace('{{value}}',option?.english||value):option?.replacement||value);
      }else if(field.kind==='brand')instructions.push(`Brand/project name: ${JSON.stringify(value)}. Use this as context only; do not invent a logo, printed text, overlay, claim or spoken line.`);
      else if(field.kind==='reference')instructions.push(`The name assigned to ${field.reference} is ${JSON.stringify(value)}. The attached reference remains authoritative for identity, product type, geometry, materials, colors and any real printed branding; keep the original scene and actions.`);
      else if(option?.instruction)instructions.push(option.instruction);
      applied.push(field.id);
    }
    if(instructions.length){
      const block=`PERSONALIZED CREATIVE BRIEF\n${instructions.join('\n')}\nAll original timing, aspect ratio, attachment assignments, scene actions, continuity and audio restrictions remain in force.\n\n`;
      const marker='DIRECTION & CINEMATOGRAPHY\n';
      text=text.includes(marker)?text.replace(marker,block+marker):text+'\n\n'+block.trim();
    }
    const unresolved=[...new Set(text.match(/\[[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ _Í]+\]/g)||[])];
    return {text,applied,unresolved};
  }
  return {fields,clean,compose,colors};
});
