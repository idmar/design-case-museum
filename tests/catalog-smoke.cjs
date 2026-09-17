// Dependency-free interaction smoke test: a minimal DOM adapter, not browser visual QA.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
class Element{
 constructor(id=''){this.id=id;this.dataset={};this.handlers={};this.classList={add(){},remove(){}};this.style={};this.isConnected=true;this.innerHTML='';this.value='';this.tagName='DIV'}
 addEventListener(n,f){this.handlers[n]=f}setAttribute(k,v){this[k]=v}showModal(){this.open=true}close(){this.open=false}focus(){context.document.activeElement=this}scrollIntoView(){}querySelectorAll(){return[]}querySelector(){return null}
}
const nodes={};const get=id=>nodes[id]??(nodes[id]=new Element(id));
const listeners={};const context={document:{getElementById:get,querySelector:()=>get('progress'),querySelectorAll:()=>[],activeElement:new Element(),body:new Element(),documentElement:{scrollHeight:1000}},window:{},location:{pathname:'/',search:'',hash:''},history:{pushState(a,b,p){context.location.hash=p.includes('#')?'#'+p.split('#')[1]:''},replaceState(a,b,p){this.pushState(a,b,p)}},URLSearchParams,innerHeight:800,scrollY:0,addEventListener(){},requestAnimationFrame:f=>f(),matchMedia:()=>({matches:true}),clearTimeout(){},setTimeout(){},console};context.window.addEventListener=(n,f)=>listeners[n]=f;
vm.createContext(context);vm.runInContext(fs.readFileSync(root+'/dist/data.js','utf8'),context);vm.runInContext(fs.readFileSync(root+'/dist/app.js','utf8'),context);
const data=context.window.MUSEUM_CASES;assert.equal(data.length,277);assert.equal(new Set(data.map(c=>c.source_index)).size,277);assert.equal(new Set(data.map(c=>c.id)).size,277);
assert.equal(data.filter(c=>c.preview_status==='recovered-web').length,12);assert(data.every(c=>c.asset));
const original=JSON.parse(require('child_process').execFileSync('git',['show','HEAD:dist/cases.json'],{cwd:root,encoding:'utf8'}));
for(const c of original.filter(c=>c.id<=12))assert.equal(data.find(x=>x.id===c.id).url,c.url,'Preserve original deep-link identities');
assert.equal((get('gallery').innerHTML.match(/<article/g)||[]).length,24);
const allPageIds=[];
for(let p=1;p<=12;p++){vm.runInContext(`page=${p};render()`,context);allPageIds.push(...[...get('gallery').innerHTML.matchAll(/data-id="(\d+)"/g)].map(m=>Number(m[1])))}
assert.equal(allPageIds.length,277);assert.equal(new Set(allPageIds).size,277);assert.equal(allPageIds.at(-1),277);assert.equal((get('gallery').innerHTML.match(/<article/g)||[]).length,13);
for(const category of ['沉浸體驗','品牌敘事','字體實驗','產品介面','視覺藝術','設計閱讀']){get('filters').handlers.click({target:{closest:()=>({dataset:{filter:category}})}});const count=vm.runInContext('filtered().length',context);assert.equal(count,data.filter(c=>c.category===category).length)}
vm.runInContext("category='全部';query='';page=1;render()",context);
for(const c of data){vm.runInContext(`showCase(${c.id})`,context);const body=get('detail-body').innerHTML;assert(body.includes(c.preview_status==='missing-in-source'?'原附件未保存預覽':c.asset),c.name);assert(!body.includes('undefined'),c.name);assert(body.includes(`第 ${c.pdf_page} 頁`));if(c.preview_status==='recovered-web'){assert(body.includes(c.preview_source_label));assert(body.includes(c.preview_retrieved_at));assert(!body.includes('原附件未保存預覽'));}}
assert.equal(get('next').disabled,true);get('prev').onclick();assert(get('detail-number').textContent.includes('276'));get('detail').handlers.cancel({preventDefault(){}});assert.equal(get('detail').open,false);
get('search').value='Rams';get('search-form').handlers.submit({preventDefault(){}});assert.equal(vm.runInContext('filtered().length',context),1);assert(get('gallery').innerHTML.includes('Rams System Icons'));
get('search').value='zzzz_no_match_641';get('search-form').handlers.submit({preventDefault(){}});assert(get('gallery').innerHTML.includes('清除搜尋與分類'));assert.equal(get('pagination').hidden,true);
get('gallery').handlers.click({target:{closest:s=>s==='#reset-results'?{}:null}});assert.equal(vm.runInContext('filtered().length',context),277);
context.location.hash='#case=277';listeners.popstate();assert.equal(get('detail').open,true);assert(get('detail-body').innerHTML.includes('DES'));assert.equal(vm.runInContext('page',context),12);
context.location.hash='#category='+encodeURIComponent('產品介面')+'&q=Rams';listeners.popstate();assert.equal(get('detail').open,false);assert(get('gallery').innerHTML.includes('Rams System Icons'));
context.location.hash='#page=999999';listeners.popstate();assert.equal(vm.runInContext('page',context),12);
for(const c of data){assert(c.url.startsWith('http'));if(c.asset)assert(fs.existsSync(root+'/dist/'+c.asset));assert(c.analysis&&c.lesson&&c.summary&&c.headline&&c.tags.length)}
console.log('PASS: 277 unique source records; original 12 IDs preserved; 12 pages without omissions or repeats; six category totals; every detail/preview/source page; missing-image state; search and no results; deep links and browser-history restoration; navigation boundaries.');
