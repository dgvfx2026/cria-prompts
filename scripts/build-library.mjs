/* Rebuild lightweight delivery files after editing data/catalog.json. Node only. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const data=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const keys=['id','number','title','category','summary','duration','aspect','origin','references','preview','thumbnails'];
const ids=new Set();
for(const p of data.prompts){
  if(ids.has(p.id)||!/^cria-\d{3,}$/.test(p.id)||!p.personalization||p.duration>15)throw Error(`Invalid prompt: ${p.id}`);
  ids.add(p.id);
}
const library={...data,total:data.prompts.length,prompts:data.prompts.map(p=>Object.fromEntries(keys.map(k=>[k,p[k]])))};
library.categories=data.categories.map(c=>({...c,count:data.prompts.filter(p=>p.category===c.id).length}));
const write=(name,value)=>fs.writeFileSync(path.join(root,'data',name),JSON.stringify(value),'utf8');
fs.mkdirSync(path.join(root,'data/prompts'),{recursive:true});
for(const p of data.prompts)write(`prompts/${p.id}.json`,p);
write('library.json',library);
write('search.json',Object.fromEntries(data.prompts.map(p=>[p.id,normalize(p.prompt)])));
console.log(`Built library, search index and ${data.prompts.length} individual prompts.`);
