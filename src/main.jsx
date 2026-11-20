import React,{useEffect,useState} from 'react';import{createRoot}from'react-dom/client';import{createClient}from'@supabase/supabase-js';import './style.css';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY;
const db=url&&key?createClient(url,key):null;

const trackerAppStyles = `
.tracker-app-shell {max-width:none !important; width:100%; min-height:100vh; padding:0 !important; margin:0 !important; background:#f3f5f9; color:#16243c;}
.tracker-app-shell > header {margin:0 !important; padding:18px 30px !important; background:#fff; border-bottom:1px solid #e5eaf1; display:flex; align-items:center; justify-content:space-between; gap:12px;}
.tracker-app-shell > header h1 {font-size:21px; margin:3px 0;}
.tracker-layout {display:grid; grid-template-columns:230px minmax(0,1fr); min-height:calc(100vh - 95px);}
.tracker-sidebar {background:#fff; border-right:1px solid #e5eaf1; padding:24px 15px; min-width:0;}
.tracker-sidebar-brand {font-size:16px; display:flex; align-items:center; gap:8px; padding:8px 10px; white-space:nowrap;}
.tracker-sidebar-caption {color:#7b8798; font-size:11px; font-weight:700; letter-spacing:.08em; margin:24px 10px 12px;}
.tracker-sidebar nav {display:flex !important; flex-direction:column; gap:7px; padding:0 !important; margin:0 !important; background:transparent !important; border:0 !important;}
.tracker-sidebar nav button {width:100%; display:flex; align-items:center; justify-content:flex-start; gap:10px; text-align:left; border-radius:10px; padding:12px 13px; font-weight:600; box-shadow:none;}
.tracker-sidebar nav button span {font-size:20px; width:23px; text-align:center;}
.tracker-sidebar nav button.active {background:#eaf1ff; color:#0756b9; border-color:#dce9ff;}
.tracker-content {min-width:0; padding:26px 30px 40px;}
.tracker-content > h2 {margin-top:20px;}
.tracker-content .container-dashboard-grid {display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:16px !important; align-items:start;}
.tracker-container-card {height:440px !important; min-height:440px; max-height:440px; overflow:hidden; background:#fff; border:1px solid #e5eaf1; border-radius:13px; box-shadow:0 3px 12px rgba(28,48,83,.05);}
.tracker-container-card .tracker-article-scroll {min-height:0 !important; max-height:none !important; overflow-y:auto !important; scrollbar-width:thin;}
.tracker-container-card > div:last-child {flex-shrink:0;}
.tracker-card-header {display:grid; grid-template-columns:minmax(112px,1fr) minmax(0,1.65fr); gap:5px; align-items:center; min-width:0;}
.tracker-card-header h3 {font-size:clamp(11px,1vw,16px) !important; letter-spacing:-.3px; line-height:1.2;}
.tracker-card-actions {display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:2px; min-width:0;}
.tracker-card-actions a,.tracker-card-actions button {display:flex; justify-content:center; align-items:center; text-align:center; min-width:0; min-height:23px; padding:2px 1px !important; font-size:8px !important; line-height:1.15; font-weight:650; border-radius:7px; border:1px solid #cddced; background:#f4f8ff; color:#0756b9; text-decoration:none; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; box-shadow:none;}
.tracker-card-actions .tracker-small-copy {min-width:0;display:flex;}
.tracker-card-actions .tracker-small-copy button {width:100%;}
.tracker-card-actions a:hover,.tracker-card-actions button:hover:not(:disabled) {background:#e8f1ff;}
.tracker-card-actions a[aria-disabled="true"],.tracker-card-actions button:disabled {opacity:.43;cursor:not-allowed;}

@media (max-width:1150px) {.tracker-content .container-dashboard-grid {grid-template-columns:repeat(2,minmax(0,1fr)) !important;} .tracker-layout {grid-template-columns:195px minmax(0,1fr);}}
@media (max-width:740px) {.tracker-layout {display:block;} .tracker-sidebar {padding:10px 12px; border-right:0; border-bottom:1px solid #e5eaf1;} .tracker-sidebar-brand,.tracker-sidebar-caption {display:none;} .tracker-sidebar nav {flex-direction:row; overflow-x:auto; gap:5px;} .tracker-sidebar nav button {width:auto; flex:0 0 auto; padding:9px; font-size:12px;} .tracker-content {padding:18px 12px 30px;} .tracker-app-shell > header {padding:14px 12px !important;} .tracker-content .container-dashboard-grid {grid-template-columns:1fr !important;} }
`;


const DOCUMENT_BUCKET='container-documenten';
const DOCUMENT_TYPES=['Bill of Lading','Factuur','Order','Betalingsbewijs','Overig'];
const DOCUMENT_EXTENSIONS=['pdf','doc','docx','xls','xlsx','png','jpg','jpeg','webp'];
function ContainerDocuments({containerId}){
  const [documents,setDocuments]=useState([]);
  const [documentType,setDocumentType]=useState('Bill of Lading');
  const [file,setFile]=useState(null);
  const [busy,setBusy]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const [message,setMessage]=useState('');
  const [documentError,setDocumentError]=useState('');
  const [inputKey,setInputKey]=useState(0);
  async function refresh(){
    if(!containerId)return;
    setRefreshing(true);
    const {data,error}=await db.storage.from(DOCUMENT_BUCKET).list(containerId,{limit:1000,sortBy:{column:'created_at',order:'desc'}});
    if(error)setDocumentError('Documenten ophalen mislukt: '+error.message);
    else {setDocuments((data||[]).filter(item=>item.name&&!item.name.startsWith('.')));setDocumentError('')}
    setRefreshing(false);
  }
  useEffect(()=>{setDocuments([]);setFile(null);setMessage('');setDocumentError('');refresh()},[containerId]);
  function info(name){
    const match=name.match(/^([0-4])_([0-9]{13})_([a-z0-9-]+)_(.+)$/i);
    if(!match)return {type:'Overig',name};
    return {type:DOCUMENT_TYPES[Number(match[1])]||'Overig',name:match[4]};
  }
  async function upload(e){
    e.preventDefault();if(!file||busy)return;
    const extension=(file.name.split('.').pop()||'').toLowerCase();
    if(!DOCUMENT_EXTENSIONS.includes(extension)){setDocumentError('Kies een PDF, Word-, Excel- of afbeeldingsbestand.');return}
    if(file.size>10*1024*1024){setDocumentError('Het bestand mag maximaal 10 MB zijn.');return}
    setBusy(true);setDocumentError('');setMessage('');
    try{
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,130);
      const randomPart=globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);
      const path=containerId+'/'+DOCUMENT_TYPES.indexOf(documentType)+'_'+Date.now()+'_'+randomPart+'_'+safeName;
      const {error}=await db.storage.from(DOCUMENT_BUCKET).upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});
      if(error)throw error;
      setFile(null);setInputKey(k=>k+1);setMessage('Document succesvol geüpload.');await refresh();
    }catch(err){setDocumentError('Upload mislukt: '+err.message)}finally{setBusy(false)}
  }
  async function openDocument(name,download=false){
    setDocumentError('');
    const path=containerId+'/'+name;
    const {data,error}=await db.storage.from(DOCUMENT_BUCKET).createSignedUrl(path,60,download?{download:info(name).name}:undefined);
    if(error||!data?.signedUrl){setDocumentError('Bestand openen mislukt: '+(error?.message||'Geen link ontvangen'));return}
    const a=document.createElement('a');a.href=data.signedUrl;a.target='_blank';a.rel='noopener noreferrer';
    if(download)a.download=info(name).name;
    document.body.appendChild(a);a.click();a.remove();
  }
  async function removeDocument(name){
    if(busy||!window.confirm('Document "'+info(name).name+'" definitief verwijderen?'))return;
    setBusy(true);setDocumentError('');setMessage('');
    try{
      const {error}=await db.storage.from(DOCUMENT_BUCKET).remove([containerId+'/'+name]);
      if(error)throw error;
      setMessage('Document verwijderd.');await refresh();
    }catch(err){setDocumentError('Verwijderen mislukt: '+err.message)}finally{setBusy(false)}
  }
  return <article className="tracker-documents">
    <h3 style={{marginTop:0}}>📁 Documenten</h3>
    <p style={{fontSize:13,color:'#52697c'}}>Bestanden worden privé bij deze container opgeslagen. Maximaal 10 MB per bestand.</p>
    <form onSubmit={upload} style={{display:'flex',flexWrap:'wrap',gap:12,alignItems:'end',marginBottom:18}}>
      <label style={{flex:'1 1 170px'}}>Documenttype<select value={documentType} onChange={e=>setDocumentType(e.target.value)}>{DOCUMENT_TYPES.map(type=><option key={type} value={type}>{type}</option>)}</select></label>
      <label style={{flex:'2 1 230px'}}>Bestand kiezen<input key={inputKey} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp" required onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
      <button type="submit" disabled={!file||busy}>{busy?'Bezig...':'Bestand uploaden'}</button>
    </form>
    {documentError&&<p className="error" role="alert">{documentError}</p>}
    {message&&<p style={{color:'#176b4d'}} role="status">{message}</p>}
    <div className="between" style={{marginBottom:8}}><strong>Opgeslagen documenten ({documents.length})</strong><button type="button" className="secondary" disabled={refreshing||busy} onClick={refresh}>{refreshing?'Laden...':'Vernieuwen'}</button></div>
    {!refreshing&&documents.length===0&&<p style={{fontSize:13,color:'#66788a'}}>Nog geen documenten geüpload.</p>}
    {documents.length>0&&<div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Type</th><th>Bestandsnaam</th><th>Datum</th><th>Acties</th></tr></thead><tbody>{documents.map(item=><tr key={item.name}><td>{info(item.name).type}</td><td style={{overflowWrap:'anywhere'}}>{info(item.name).name}</td><td>{item.created_at?new Date(item.created_at).toLocaleDateString('nl-NL'):'—'}</td><td><div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button type="button" className="secondary" onClick={()=>openDocument(item.name)}>Bekijken</button><button type="button" className="secondary" onClick={()=>openDocument(item.name,true)}>Downloaden</button><button type="button" className="secondary" disabled={busy} style={{color:'#b42318'}} onClick={()=>removeDocument(item.name)}>Verwijderen</button></div></td></tr>)}</tbody></table></div>}
  </article>;
}

function App(){const[session,setSession]=useState(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[data,setData]=useState([]),[selected,setSelected]=useState(null),[view,setView]=useState('dashboard'),[error,setError]=useState(''),[loading,setLoading]=useState(false),[deletingSupplier,setDeletingSupplier]=useState(null),[editingArticle,setEditingArticle]=useState(null),[articleEdit,setArticleEdit]=useState(null),[savingArticle,setSavingArticle]=useState(false),[deletingArticle,setDeletingArticle]=useState(null),[archivingId,setArchivingId]=useState(null),[dashboardPage,setDashboardPage]=useState(0),[dashboardQuery,setDashboardQuery]=useState(''),[draft,setDraft]=useState({container_number:'',vessel:'',bl_number:'',eta:'',etd:''}),[supplier,setSupplier]=useState(''),[supplierQuery,setSupplierQuery]=useState(''),[supplierOptions,setSupplierOptions]=useState([]),[articleOptions,setArticleOptions]=useState([]),[articleLookup,setArticleLookup]=useState(''),[line,setLine]=useState({container_supplier_id:'',article_number:'',order_number:'',description:'',quantity:''}),[addingForSupplier,setAddingForSupplier]=useState(null),[addingArticle,setAddingArticle]=useState(false);
useEffect(()=>{if(!db)return;db.auth.getSession().then(({data})=>setSession(data.session));const{data:{subscription}}=db.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[]);
async function load(){if(!db||!session)return;setLoading(true);const r=await db.from('containers').select('*,container_suppliers(*,article_lines(*))').order('eta',{ascending:true,nullsFirst:false});if(r.error)setError(r.error.message);else{setData(r.data);setError('')}setLoading(false)}useEffect(()=>{if(session){load();loadCatalogs()}else setData([])},[session]);
async function loadCatalogs(){
  // Supabase hanteert doorgaans een maximum van 1000 rijen per verzoek.
  // Haal daarom alle leveranciers op in pagina's, zodat zoeken overal in de naam werkt.
  const all=[];
  const pageSize=1000;
  for(let start=0;start<100000;start+=pageSize){
    const {data:page,error:catalogError}=await db.from('supplier_catalog')
      .select('supplier_code,supplier_name')
      .order('supplier_name').order('supplier_code')
      .range(start,start+pageSize-1);
    if(catalogError){setError('Leverancierslijst: '+catalogError.message);return}
    all.push(...(page||[]));
    if(!page||page.length<pageSize)break;
  }
  setSupplierOptions(all);
}
useEffect(()=>{if(!session||!line.article_number.trim()){setArticleOptions([]);return}let cancelled=false;const t=setTimeout(async()=>{const q=line.article_number.trim();const {data,error}=await db.from('article_catalog').select('article_code,description,execution').ilike('article_code',q+'%').order('article_code').limit(12);if(!cancelled){setArticleOptions(error?[]:(data||[]));if(!error){const exact=(data||[]).find(a=>a.article_code.toLocaleLowerCase('nl')===q.toLocaleLowerCase('nl'));if(exact)setLine(v=>v.article_number.trim()===q?{...v,description:exact.description||v.description}:v)}if(error)setError('Artikelzoekfunctie: '+error.message)}},250);return()=>{cancelled=true;clearTimeout(t)}},[line.article_number,session]);
async function act(p){setError('');try{await p;await load()}catch(e){setError(e.message)}}
async function insert(table,row){const{error}=await db.from(table).insert(row);if(error)throw error}
async function update(table,id,patch){const{error}=await db.from(table).update(patch).eq('id',id);if(error)throw error}

 function toggleSupplierArticleForm(id){
   setError('');setArticleOptions([]);
   if(addingForSupplier===id){setAddingForSupplier(null);setLine({container_supplier_id:'',article_number:'',order_number:'',description:'',quantity:''});return}
   setAddingForSupplier(id);
   setLine({container_supplier_id:id,article_number:'',order_number:'',description:'',quantity:''});
 }
 async function addArticleToSupplier(e,supplierId){
   e.preventDefault();if(addingArticle)return;
   const article_number=line.article_number.trim(),quantity=Number(line.quantity);
   if(!article_number||line.quantity.trim()===''||!Number.isFinite(quantity)||quantity<0){setError('Vul een artikelnummer en een geldig aantal in.');return}
   setAddingArticle(true);setError('');
   try{
     const {data:created,error:insertError}=await db.from('article_lines').insert({container_supplier_id:supplierId,article_number,order_number:line.order_number.trim(),description:line.description,quantity}).select('id');
     if(insertError)throw insertError;
     if(!created?.length)throw new Error('Artikel niet toegevoegd. Controleer de INSERT-rechten in Supabase (RLS).');
     setAddingForSupplier(null);setLine({container_supplier_id:'',article_number:'',order_number:'',description:'',quantity:''});setArticleOptions([]);
     await load();
   }catch(e){setError('Artikel toevoegen mislukt: '+e.message)}
   finally{setAddingArticle(false)}
 }
async function removeSupplier(s){
  if(deletingSupplier)return;
  const count=s.article_lines?.length||0;
  const message=`Weet je zeker dat je leverancier "${s.supplier_name}" uit container ${current.container_number} wilt verwijderen?`+(count?`\n\nLet op: ook ${count} gekoppelde artikelregel(s) worden definitief verwijderd.`:'\n\nDeze leverancier heeft geen gekoppelde artikelen.');
  if(!window.confirm(message))return;
  setDeletingSupplier(s.id);
  setError('');
  try{
    // Verwijder eerst de artikelen, zodat dit ook werkt zonder ON DELETE CASCADE.
    const {data:deletedArticles,error:articleError}=await db.from('article_lines').delete().eq('container_supplier_id',s.id).select('id');
    if(articleError)throw new Error('Artikelen verwijderen mislukt: '+articleError.message);
    if((deletedArticles?.length||0)!==count)throw new Error('Niet alle artikelen konden worden verwijderd. Controleer de DELETE-rechten in Supabase (RLS) en vernieuw de pagina.');
    const {data:removed,error:supplierError}=await db.from('container_suppliers').delete().eq('id',s.id).eq('container_id',current.id).select('id');
    if(supplierError)throw new Error('Leverancier verwijderen mislukt: '+supplierError.message);
    if(!removed?.length)throw new Error('De leverancier kon niet worden verwijderd. Controleer de DELETE-rechten in Supabase (RLS).');
    if(line.container_supplier_id===s.id)setLine(v=>({...v,container_supplier_id:''}));
    await load();
  }catch(e){setError(e.message);await load()}
  finally{setDeletingSupplier(null)}
}

function beginArticleEdit(i){
  setError('');setEditingArticle(i.id);
  setArticleEdit({article_number:i.article_number||'',order_number:i.order_number||'',description:i.description||'',quantity:String(i.quantity??'')});
}
async function saveArticleEdit(i){
  if(!articleEdit||savingArticle||deletingArticle)return;
  const number=articleEdit.article_number.trim();
  const quantity=Number(articleEdit.quantity);
  if(!number||articleEdit.quantity.trim()===''||!Number.isFinite(quantity)||quantity<0){setError('Vul een artikelnummer en een geldig aantal in.');return}
  setSavingArticle(true);setError('');
  try{
    const {data:changed,error:saveError}=await db.from('article_lines').update({article_number:number,order_number:articleEdit.order_number.trim(),description:articleEdit.description,quantity}).eq('id',i.id).select('id');
    if(saveError)throw saveError;
    if(!changed?.length)throw new Error('Artikel niet gewijzigd. Controleer de UPDATE-rechten (RLS).');
    setEditingArticle(null);setArticleEdit(null);await load();
  }catch(e){setError('Artikel aanpassen mislukt: '+e.message)}
  finally{setSavingArticle(false)}
}
async function removeArticle(i){
  if(deletingArticle||savingArticle||editingArticle!==null)return;
  if(!window.confirm(`Artikel ${i.article_number||''} (order ${i.order_number||'—'}) definitief verwijderen?\n\nAlleen deze artikelregel wordt verwijderd.`))return;
  setDeletingArticle(i.id);setError('');
  try{
    const {data:removed,error:deleteError}=await db.from('article_lines').delete().eq('id',i.id).select('id');
    if(deleteError)throw deleteError;
    if(!removed?.length)throw new Error('Artikel niet verwijderd. Controleer de DELETE-rechten (RLS).');
    if(editingArticle===i.id){setEditingArticle(null);setArticleEdit(null)}
    await load();
  }catch(e){setError('Artikel verwijderen mislukt: '+e.message)}
  finally{setDeletingArticle(null)}
}
async function lookupEditedArticle(value){
  setArticleEdit(v=>v?{...v,article_number:value}:v);
  if(!value.trim())return;
  // Een exacte artikelcode vult de omschrijving aan, zonder andere velden te veranderen.
  const {data:found,error:lookupError}=await db.from('article_catalog').select('article_code,description').ilike('article_code',value.trim()).limit(1);
  if(lookupError)return;
  const match=found?.find(x=>x.article_code.toLocaleLowerCase('nl')===value.trim().toLocaleLowerCase('nl'));
  if(match)setArticleEdit(v=>v&&v.article_number===value?{...v,description:match.description||''}:v);
}
async function changeArchive(c, archived){
  if(archivingId)return;
  const question=archived
    ? `Container ${c.container_number} archiveren?\n\nDe leveranciers, artikelen en statussen blijven bewaard en je kunt de container later terugzetten.`
    : `Container ${c.container_number} terugzetten naar actieve containers?`;
  if(!window.confirm(question))return;
  setArchivingId(c.id);setError('');
  try{
    const {data:changed,error:archiveError}=await db.from('containers').update({archived}).eq('id',c.id).select('id,archived');
    if(archiveError)throw archiveError;
    if(!changed?.length||changed[0].archived!==archived)throw new Error('De archiefstatus is niet gewijzigd. Controleer de UPDATE-rechten in Supabase (RLS).');
    await load();
  }catch(e){setError('Archiveren/terugzetten mislukt: '+e.message)}
  finally{setArchivingId(null)}
}
function vesselFinderLink(name){
  const ship=String(name||'').trim();
  return ship?'https://www.vesselfinder.com/vessels?name='+encodeURIComponent(ship):null;
}
function VesselFinderLink({name}){
  const href=vesselFinderLink(name);
  return href?<a href={href} target="_blank" rel="noopener noreferrer" style={{fontSize:12,fontWeight:600,color:'#075bb8',textDecoration:'underline',marginLeft:6,whiteSpace:'nowrap'}} title={'Zoek '+name+' op VesselFinder'}>VF ↗</a>:null;
}
function contents(c){return <div style={{marginTop:14}}>{(c.container_suppliers||[]).length===0?<p style={{color:'#66788a'}}>Nog geen leveranciers of artikelen toegevoegd.</p>:(c.container_suppliers||[]).map(s=><section key={s.id} style={{marginTop:12,padding:'12px 0',borderTop:'1px solid #dbe5ec'}}><div className="between" style={{gap:12,flexWrap:'wrap',marginBottom:8}}><strong>Leverancier: {s.supplier_name}</strong><span style={{fontSize:13,color:'#52697c'}}>Aanbetaald: {s.deposit_paid?'Ja':'Nee'} · Volledig betaald: {s.fully_paid?'Ja':'Nee'}</span></div>{(s.article_lines||[]).length===0?<p style={{color:'#66788a',fontSize:13}}>Geen artikelen toegevoegd</p>:<div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Artikel</th><th>Order</th><th>Omschrijving</th><th>Aantal</th></tr></thead><tbody>{s.article_lines.map(i=><tr key={i.id}><td>{i.article_number||'—'}</td><td>{i.order_number||'—'}</td><td>{i.description||'—'}</td><td>{i.quantity==null?'—':Number(i.quantity).toLocaleString('nl-NL')}</td></tr>)}</tbody></table></div>}</section>)}</div>}
// De eerste vier tekens zijn een eigenaarscode, geen gegarandeerde vervoerder.
const CARRIERS={MSC:'MSC',MAERSK:'Maersk',CMACGM:'CMA CGM',HAPAG:'Hapag-Lloyd',OOCL:'OOCL',COSCO:'COSCO',EVERGREEN:'Evergreen',ONE:'ONE (Ocean Network Express)'};
const OWNER_HINTS={MSCU:'MSC',MEDU:'MSC',MAEU:'MAERSK',MRKU:'MAERSK',CMAU:'CMACGM',HLCU:'HAPAG',OOLU:'OOCL',COSU:'COSCO',EGLV:'EVERGREEN',ONEU:'ONE'};
const TRACKING_URLS={MSC:'https://www.msc.com/en/track-a-shipment',MAERSK:'https://www.maersk.com/tracking/',CMACGM:'https://www.cma-cgm.com/ebusiness/tracking',HAPAG:'https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html',OOCL:'https://www.oocl.com/eng/ourservices/eservices/cargotracking/Pages/cargotracking.aspx',COSCO:'https://elines.coscoshipping.com/ebusiness/cargoTracking',EVERGREEN:'https://www.shipmentlink.com/servlet/TDB1_CargoTracking.do',ONE:'https://www.one-line.com/one-ecom/schedule/vessel-schedule'};
function carrierHint(number){return OWNER_HINTS[String(number||'').trim().toUpperCase().slice(0,4)]||''}
function chosenCarrier(c){return c.carrier_override||carrierHint(c.container_number)}
function CarrierTracking({container}){
  const carrier=chosenCarrier(container);
  if(!carrier)return null;
  return <a href={TRACKING_URLS[carrier]} target="_blank" rel="noopener noreferrer" title={carrier==='ONE'?'Open het vaarschema van ONE; zoek daar op de bootnaam':'Open de trackingpagina van '+CARRIERS[carrier]+'; controleer daar het containernummer'} style={{fontSize:12,fontWeight:600,color:'#075bb8',textDecoration:'underline'}}>{carrier==='ONE'?'Vaarschema ONE (zoek op bootnaam) ↗':'Track via '+CARRIERS[carrier]+' ↗'}</a>;
}
function CopyContainerNumber({number,compact=false}){
  const [copied,setCopied]=useState(false);
  async function copy(){
    try{
      await navigator.clipboard.writeText(String(number||''));
      setCopied(true);
      window.setTimeout(()=>setCopied(false),2000);
    }catch(e){
      window.prompt('Kopieer het containernummer met Ctrl+C:',String(number||''));
    }
  }
  return <button type="button" className="secondary" onClick={copy} style={{fontSize:12,padding:'6px 10px'}} title="Containernummer kopiëren">{copied?'Gekopieerd ✓':compact?'Nr.':'Containernummer kopiëren'}</button>;
}
function CopyVesselName({name,compact=false}){
  const [copied,setCopied]=useState(false);
  async function copy(){
    const ship=String(name||'').trim();
    if(!ship)return;
    try{
      await navigator.clipboard.writeText(ship);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),2000);
    }catch(e){
      window.prompt('Kopieer de bootnaam met Ctrl+C:',ship);
    }
  }
  return <button type="button" className="secondary" disabled={!String(name||'').trim()} onClick={copy} style={{fontSize:12,padding:'6px 10px'}} title="Bootnaam kopiëren">{copied?'Gekopieerd ✓':compact?'Boot':'Bootnaam kopiëren'}</button>;
}
function DashboardTrackingActions({container}){
  const carrier=chosenCarrier(container);
  const shipLink=vesselFinderLink(container.vessel);
  const carrierLink=carrier?TRACKING_URLS[carrier]:null;
  return <div className="tracker-card-actions" aria-label="Tracking en kopieren">
    {shipLink?<a href={shipLink} target="_blank" rel="noopener noreferrer" title="Open VesselFinder in nieuw tabblad">VF ↗</a>:<a aria-disabled="true" title="Vul eerst een bootnaam in">VF</a>}
    {carrierLink?<a href={carrierLink} target="_blank" rel="noopener noreferrer" title={carrier==='ONE'?'Zoek op bootnaam in ONE vaarschema':'Track container bij '+CARRIERS[carrier]}>Rederij ↗</a>:<a aria-disabled="true" title="Kies eerst een rederij in Details">Rederij</a>}
    <span className="tracker-small-copy"><CopyContainerNumber number={container.container_number} compact/></span>
    <span className="tracker-small-copy"><CopyVesselName name={container.vessel} compact/></span>
  </div>;
}
function StatusIndicator({label,checked}){return <span title={label+': '+(checked?'Ja':'Nee')} style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,color:checked?'#176b4d':'#65758a',whiteSpace:'nowrap'}}><span aria-hidden="true" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:16,height:16,borderRadius:4,border:'1px solid '+(checked?'#2c946d':'#a9b7c6'),background:checked?'#e2f5eb':'#f6f8fb',fontWeight:800,fontSize:12}}>{checked?'✓':'–'}</span>{label}</span>}
function dashboardCard(c){return <article key={c.id} className="tracker-container-card" style={{margin:0,padding:15,minWidth:0,display:'flex',flexDirection:'column',gap:9}}><div className="tracker-card-header"><h3 style={{margin:0,fontSize:16,overflowWrap:'anywhere'}}>{c.container_number}</h3><DashboardTrackingActions container={c}/></div><div style={{fontSize:12,lineHeight:1.55}}><div><b>BL:</b> {c.bl_number||'—'}</div><div><b>Boot:</b> {c.vessel||'—'}</div><div><b>Losdatum:</b> {c.unloading_planned&&c.unloading_date?new Date(c.unloading_date+'T12:00:00').toLocaleDateString('nl-NL'):'—'}</div><div><b>ETA:</b> {c.eta?new Date(c.eta+'T12:00:00').toLocaleDateString('nl-NL'):'—'}</div></div><div style={{display:'flex',flexWrap:'wrap',gap:'5px 11px',padding:'7px 0',borderTop:'1px solid #dbe5ec',borderBottom:'1px solid #dbe5ec'}}><StatusIndicator label="Vrijgegeven" checked={!!c.released}/><StatusIndicator label="Documenten EMQ" checked={!!c.documents_emq}/><StatusIndicator label="Lossen ingepland" checked={!!c.unloading_planned}/></div><div className="tracker-article-scroll" style={{flex:1,minHeight:0,overflowY:'auto',paddingTop:7}}>{(c.container_suppliers||[]).length===0?<small>Geen leveranciers</small>:c.container_suppliers.map(s=><div key={s.id} style={{marginBottom:10}}><strong style={{fontSize:13}}>{s.supplier_name}</strong>{(s.article_lines||[]).length===0?<div style={{fontSize:12,color:'#66788a'}}>Geen artikelen</div>:s.article_lines.map(i=><div key={i.id} style={{fontSize:12,borderBottom:'1px solid #edf1f5',padding:'5px 0',overflowWrap:'anywhere'}}><b>{i.article_number||'—'}</b></div>)}</div>)}</div><div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button type="button" className="secondary" style={{flex:1,fontSize:12,padding:'8px 10px'}} onClick={()=>{setSelected(c.id);setView('detail')}}>Details</button><button type="button" className="secondary" style={{flex:1,fontSize:12,padding:'8px 10px'}} disabled={archivingId!==null} onClick={()=>changeArchive(c,true)}>Archiveren</button></div></article>}
function containerOverview(c, archived=false){return <article key={c.id} style={{marginBottom:16}}><div className="between" style={{gap:16,flexWrap:'wrap',alignItems:'flex-start'}}><div><h3 style={{margin:'0 0 12px'}}>{c.container_number}</h3><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12}}><div><small>BL-nummer</small><div><strong>{c.bl_number||'Niet ingevuld'}</strong></div></div><div><small>Boot</small><div><strong>{c.vessel||'Niet ingevuld'}</strong><VesselFinderLink name={c.vessel}/></div></div><div><small>ETA</small><div><strong>{c.eta?new Date(c.eta+'T12:00:00').toLocaleDateString('nl-NL'):'Niet ingevuld'}</strong></div></div></div></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" className="secondary" onClick={()=>{setSelected(c.id);setView('detail')}}>Details openen</button>{archiveButton(c,!archived)}</div></div>{contents(c)}</article>}
function archiveButton(c, archived){return <button type="button" className="secondary" disabled={archivingId!==null} onClick={()=>changeArchive(c,archived)}>{archivingId===c.id?'Bezig...':archived?'Archiveren':'Terugzetten'}</button>}
const current=data.find(x=>x.id===selected),active=data.filter(c=>!c.archived).sort((a,b)=>{const date=c=>c.unloading_planned&&c.unloading_date?c.unloading_date:c.eta||'9999-12-31';return date(a).localeCompare(date(b))||String(a.container_number).localeCompare(String(b.container_number),'nl')});const searchTerm=dashboardQuery.trim().toLocaleLowerCase('nl');
const dashboardResults=searchTerm?active.filter(c=>{
  const fields=[c.container_number,c.bl_number,c.vessel];
  for(const supplier of (c.container_suppliers||[])){
    for(const article of (supplier.article_lines||[])){
      fields.push(article.article_number,article.order_number);
    }
  }
  return fields.some(value=>String(value??'').toLocaleLowerCase('nl').includes(searchTerm));
}):active;
const dashboardPages=Math.max(1,Math.ceil(dashboardResults.length/16));
const safeDashboardPage=Math.min(dashboardPage,dashboardPages-1);
const supplierMatches=supplierOptions.filter(x=>(x.supplier_name+' '+x.supplier_code).toLocaleLowerCase('nl').includes(supplierQuery.trim().toLocaleLowerCase('nl'))).slice(0,40);const open=active.reduce((n,c)=>n+(!c.released)+(!c.documents_emq)+(!c.unloading_planned)+c.container_suppliers.reduce((v,s)=>v+(!s.deposit_paid)+(!s.fully_paid),0),0);
if(!db)return <main><h1>Container Tracker</h1><p>Vul eerst VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in via je .env-bestand of GitHub-instellingen.</p></main>;
if(!session)return <main className="login"><h1>🚢 Container Tracker</h1><p>Log in met je goedgekeurde account.</p><form onSubmit={async e=>{e.preventDefault();const{error}=await db.auth.signInWithPassword({email,password});setError(error?.message||'')}}><input type="email" required placeholder="E-mailadres" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" required placeholder="Wachtwoord" value={password} onChange={e=>setPassword(e.target.value)}/><button>Inloggen</button></form>{error&&<p className="error">{error}</p>}</main>;
return <main className="tracker-app-shell"><style>{trackerAppStyles}</style><header><div><small>INKOOP VERPAKKINGEN</small><h1>🚢 Container Tracker</h1><div style={{fontSize:12,fontWeight:700,color:"#176b4d",marginTop:4}}>Versie DOCUMENTEN-UPLOAD-20261120</div></div><button className="secondary" onClick={()=>db.auth.signOut()}>Uitloggen</button></header><div className="tracker-layout"><aside className="tracker-sidebar"><div className="tracker-sidebar-brand">🚢 <strong>Container Tracker</strong></div><div className="tracker-sidebar-caption">INKOOP VERPAKKINGEN</div><nav aria-label="Hoofdnavigatie">{[['dashboard','▦','Dashboard'],['containers','▤','Containers'],['archived','▣','Gearchiveerd'],['detail','◫','Details']].map(([k,ico,v])=><button type="button" className={view===k?'active':'secondary'} onClick={()=>setView(k)} key={k}><span aria-hidden="true">{ico}</span> {v}</button>)}</nav></aside><div className="tracker-content">{error&&<p className="error">{error}</p>}{loading&&<p>Laden...</p>}
{view==='dashboard'&&<><div style={{margin:'16px 0',padding:16,background:'#f4f8fb',border:'1px solid #dbe5ec',borderRadius:10}}><label htmlFor="dashboard-search" style={{display:'block',fontWeight:700,marginBottom:8}}>Zoeken op dashboard</label><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><input id="dashboard-search" type="search" style={{flex:'1 1 260px',minWidth:0}} placeholder="Artikelnummer, containernummer, BL, schip of ordernummer" value={dashboardQuery} onChange={e=>{setDashboardQuery(e.target.value);setDashboardPage(0)}}/>{dashboardQuery&&<button type="button" className="secondary" onClick={()=>{setDashboardQuery('');setDashboardPage(0)}}>Wissen</button>}</div><p style={{margin:'8px 0 0',fontSize:13,color:'#52697c'}}>{searchTerm?`${dashboardResults.length} van ${active.length} actieve containers gevonden`:'Typ een paar letters of cijfers; zoeken werkt ook midden in een nummer of naam.'}</p></div>{active.length===0&&<p>Geen actieve containers.</p>}{active.length>0&&dashboardResults.length===0&&<p>Geen containers gevonden voor deze zoekopdracht. Probeer een ander deel van de naam of het nummer.</p>}<div className="container-dashboard-grid">{dashboardResults.slice(safeDashboardPage*16,(safeDashboardPage+1)*16).map(dashboardCard)}</div>{dashboardResults.length>16&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginTop:18}}><button className="secondary" disabled={safeDashboardPage===0} onClick={()=>setDashboardPage(p=>Math.max(0,p-1))}>Vorige 16</button><span>Pagina {safeDashboardPage+1} van {dashboardPages}</span><button className="secondary" disabled={(safeDashboardPage+1)>=dashboardPages} onClick={()=>setDashboardPage(p=>p+1)}>Volgende 16</button></div>}</>}
{view==='containers'&&<><h2>Nieuwe container</h2><form className="grid" onSubmit={e=>{e.preventDefault();act(insert('containers',{...draft,eta:draft.eta||null,etd:draft.etd||null}));setDraft({container_number:'',vessel:'',bl_number:'',eta:'',etd:''})}}>{[['container_number','Containernummer'],['vessel','Bootnaam'],['bl_number','BL-nummer'],['eta','ETA'],['etd','ETD']].map(([k,l])=><label key={k}>{l}<input required={k==='container_number'} type={k==='eta'||k==='etd'?'date':'text'} value={draft[k]} onChange={e=>setDraft({...draft,[k]:e.target.value})}/></label>)}<button>Container toevoegen</button></form><h2>Actieve containers</h2>{active.length===0&&<p>Geen actieve containers.</p>}{active.map(c=><article key={c.id}><div className="between" style={{gap:12,flexWrap:'wrap'}}><div><b>{c.container_number}</b> · {c.vessel||'Boot onbekend'} · {c.container_suppliers.length} leveranciers</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="secondary" onClick={()=>{setSelected(c.id);setView('detail')}}>Details</button>{archiveButton(c,true)}</div></div></article>)}</>}
{view==='archived'&&<><h2>Gearchiveerde containers</h2><p>Gearchiveerde containers blijven bewaard en kunnen worden teruggezet.</p>{data.filter(c=>c.archived).length===0&&<p>Het archief is nog leeg.</p>}{data.filter(c=>c.archived).map(c=>containerOverview(c,true))}</>}
{view==='detail'&&(!current?<p>Kies eerst een container op het dashboard.</p>:<><div className="between"><h2>{current.container_number}</h2><button className="secondary" onClick={()=>setView('containers')}>Terug</button></div><article><details><summary style={{cursor:"pointer",fontWeight:700,fontSize:18,padding:"8px 0"}}>Transportgegevens — klik om te openen of sluiten</summary><div style={{paddingTop:12}}><div className="grid">{[['vessel','Bootnaam'],['bl_number','BL-nummer'],['eta','ETA'],['etd','ETD'],['actual_arrival','Werkelijke aankomst'],['unloading_date','Geplande losdatum']].map(([k,l])=><label key={k}>{l}<input type={['eta','etd','actual_arrival','unloading_date'].includes(k)?'date':'text'} defaultValue={current[k]||''} key={current.id+k} onBlur={e=>{const v=e.target.value||null;if(v!==current[k])act(update('containers',current.id,{[k]:v}))}}/></label>)}</div>{current.vessel?.trim()&&<p style={{marginTop:10,fontSize:13}}>Schip opzoeken: <VesselFinderLink name={current.vessel}/></p>}<div style={{marginTop:14,padding:12,background:'#f4f8fb',border:'1px solid #dbe5ec',borderRadius:8}}><label style={{display:'block',fontWeight:700,marginBottom:6}}>Rederij voor containertracking</label><p style={{fontSize:12,color:'#52697c',margin:'0 0 8px'}}>Herkenning op basis van de eigenaarscode is slechts een voorstel. Controleer de vervoerder op de boeking of Bill of Lading.</p><select aria-label="Rederij kiezen" value={current.carrier_override||''} onChange={e=>act(update('containers',current.id,{carrier_override:e.target.value||null}))} style={{maxWidth:320}}><option value="">Automatisch voorstel{carrierHint(current.container_number)?' ('+CARRIERS[carrierHint(current.container_number)]+')':' (onbekend)'}</option>{Object.entries(CARRIERS).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select><div style={{marginTop:9,fontSize:13,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>{chosenCarrier(current)?<CarrierTracking container={current}/>:<span style={{color:'#52697c'}}>Geen rederij herkend. Kies er hierboven handmatig een.</span>}<CopyContainerNumber number={current.container_number}/><CopyVesselName name={current.vessel}/></div>{chosenCarrier(current)==='ONE'&&<p style={{fontSize:12,color:'#52697c',margin:'9px 0 0'}}>Bij ONE zoek je op de bootnaam via het vaarschema. Gebruik hiervoor de knop Bootnaam kopiëren.</p>}</div><p style={{fontSize:13,color:'#52697c'}}>Voor de dashboardvolgorde telt de geplande losdatum alleen mee als ‘Lossen ingepland’ is aangevinkt. Anders gebruiken we ETA.</p></div></details><h3>Containerstatus</h3>{[['released','Released'],['documents_emq','Documenten bij EMQ'],['unloading_planned','Lossen ingepland'],['archived','Gearchiveerd']].map(([k,l])=><label className="check" key={k}><input type="checkbox" checked={current[k]} onChange={e=>act(update('containers',current.id,{[k]:e.target.checked}))}/>{l}</label>)}</article><ContainerDocuments key={current.id} containerId={current.id}/><h3>Leveranciers en artikelen</h3>{current.container_suppliers.map(s=><article key={s.id}><div className="between"><h3>{s.supplier_name}</h3><button type="button" className="secondary" disabled={deletingSupplier!==null||editingArticle!==null||savingArticle||deletingArticle!==null} style={{color:'#b42318',borderColor:'#f2b8b5'}} onClick={()=>removeSupplier(s)}>{deletingSupplier===s.id?'Verwijderen...':'Verwijderen'}</button></div>{[['deposit_paid','Aanbetaald'],['fully_paid','Volledig betaald']].map(([k,l])=><label className="check" key={k}><input type="checkbox" checked={s[k]} onChange={e=>act(update('container_suppliers',s.id,{[k]:e.target.checked}))}/>{l}</label>)}<div style={{overflowX:'auto'}}><table><thead><tr><th>Artikel</th><th>Order</th><th>Omschrijving</th><th>Aantal</th><th style={{minWidth:200}}>Acties (artikel)</th></tr></thead><tbody>{s.article_lines.map(i=>editingArticle===i.id&&articleEdit?<tr key={i.id}><td><input aria-label="Artikelnummer aanpassen" value={articleEdit.article_number} onChange={e=>setArticleEdit(v=>({...v,article_number:e.target.value}))} onBlur={e=>{if(e.target.value.trim()!==i.article_number)lookupEditedArticle(e.target.value)}} style={{minWidth:125}}/></td><td><input aria-label="Ordernummer aanpassen" value={articleEdit.order_number} onChange={e=>setArticleEdit(v=>({...v,order_number:e.target.value}))} style={{minWidth:115}}/></td><td><input aria-label="Omschrijving aanpassen" value={articleEdit.description} onChange={e=>setArticleEdit(v=>({...v,description:e.target.value}))} style={{minWidth:190}}/></td><td><input aria-label="Aantal aanpassen" type="number" min="0" required value={articleEdit.quantity} onChange={e=>setArticleEdit(v=>({...v,quantity:e.target.value}))} style={{minWidth:85}}/></td><td><div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button type="button" disabled={savingArticle} onClick={()=>saveArticleEdit(i)}>{savingArticle?'Opslaan...':'Opslaan'}</button><button type="button" className="secondary" disabled={savingArticle} onClick={()=>{setEditingArticle(null);setArticleEdit(null)}}>Annuleren</button></div></td></tr>:<tr key={i.id}><td>{i.article_number}</td><td>{i.order_number}</td><td>{i.description}</td><td>{Number(i.quantity).toLocaleString('nl-NL')}</td><td><div style={{display:'flex',gap:6,flexWrap:'wrap'}}><button type="button" className="secondary" disabled={savingArticle||deletingArticle!==null||editingArticle!==null} onClick={()=>beginArticleEdit(i)}>Aanpassen</button><button type="button" className="secondary" style={{color:'#b42318',borderColor:'#f2b8b5'}} disabled={savingArticle||deletingArticle!==null} onClick={()=>removeArticle(i)}>{deletingArticle===i.id?'Verwijderen...':'Verwijderen'}</button></div></td></tr>)}</tbody></table></div><div style={{marginTop:12}}><button type="button" className="secondary" disabled={addingArticle||savingArticle||editingArticle!==null||deletingArticle!==null} onClick={()=>toggleSupplierArticleForm(s.id)}>{addingForSupplier===s.id?"Invoerveld sluiten":"+ Artikel toevoegen"}</button></div>{addingForSupplier===s.id&&<div style={{marginTop:16,padding:16,border:'1px solid #dbe5ec',borderRadius:10,background:'#f4f8fb'}}><h4 style={{margin:'0 0 12px'}}>Nieuw artikel voor {s.supplier_name}</h4><form className="grid" onSubmit={e=>addArticleToSupplier(e,s.id)}><label>Artikelnummer<input required value={line.article_number} onChange={e=>setLine(v=>({...v,article_number:e.target.value}))} placeholder="Typ artikelcode"/>{articleOptions.length>0&&<select size={Math.min(6,articleOptions.length+1)} value="" onChange={e=>{const a=articleOptions.find(x=>x.article_code===e.target.value);if(a){setLine(v=>({...v,article_number:a.article_code,description:a.description||''}));setArticleOptions([])}}}><option value="">Kies gevonden artikel...</option>{articleOptions.map(a=><option key={a.article_code} value={a.article_code}>{a.article_code} — {a.description}</option>)}</select>}</label><label>Ordernummer<input value={line.order_number} onChange={e=>setLine(v=>({...v,order_number:e.target.value}))}/></label><label>Omschrijving<input value={line.description} onChange={e=>setLine(v=>({...v,description:e.target.value}))} placeholder="Automatisch bij keuze artikel, ook aanpasbaar"/></label><label>Aantal<input required type="number" min="0" value={line.quantity} onChange={e=>setLine(v=>({...v,quantity:e.target.value}))}/></label><div style={{display:'flex',gap:8,alignItems:'end',flexWrap:'wrap'}}><button type="submit" disabled={addingArticle}>{addingArticle?'Opslaan...':'Artikel opslaan'}</button><button type="button" className="secondary" disabled={addingArticle} onClick={()=>toggleSupplierArticleForm(s.id)}>Annuleren</button></div></form></div>}</article>)}<article><h3>Leverancier toevoegen</h3><form onSubmit={e=>{e.preventDefault();if(!supplier)return;act(insert('container_suppliers',{container_id:current.id,supplier_name:supplier}));setSupplier('');setSupplierQuery('')}}><label>Zoek leverancier<input placeholder="Typ enkele letters uit de naam of de leverancierscode" value={supplierQuery} onChange={e=>{setSupplierQuery(e.target.value);setSupplier('')}} /></label><label>Kies leverancier<select required value={supplier} onChange={e=>setSupplier(e.target.value)}><option value="">Selecteer een leverancier</option>{supplierMatches.map(x=><option key={x.supplier_code} value={x.supplier_name}>{x.supplier_name} ({x.supplier_code})</option>)}{supplier&&!supplierMatches.some(x=>x.supplier_name===supplier)&&<option value={supplier}>{supplier}</option>}</select></label><button disabled={!supplier}>Toevoegen</button></form></article></>)}<footer>Container Tracker · Eerste databaseversie</footer></div></div></main>}
createRoot(document.getElementById('root')).render(<App/>);
