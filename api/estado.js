module.exports=async function(req,res){
res.setHeader('Cache-Control','no-store');
if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Método não permitido'});
const url=process.env.SUPABASE_URL,token=process.env.RH_ARMS_TOKEN,anon=process.env.SUPABASE_ANON_KEY;
if(!url||!token||!anon)return res.status(503).json({error:'Conexão indisponível'});
try{
let input=req.method==='POST'?req.body:{};
if(req.method==='POST'&&JSON.stringify(input).length>2000000)return res.status(413).json({error:'Arquivo muito grande'});
const payload={p_token:token,p_metodo:req.method==='GET'?'ler':'gravar',p_dados:input.dados??null,p_revisao:input.revisao??null};
const response=await fetch(url+'/rest/v1/rpc/rh_armarios_sync',{method:'POST',headers:{'Content-Type':'application/json','apikey':anon,'Authorization':'Bearer '+anon},body:JSON.stringify(payload)});
const value=await response.json();
if(!response.ok){const msg=value.message||'Erro no banco';return res.status(msg.includes('CONFLITO')?409:400).json({error:msg})}
return res.status(200).json(value);
}catch(e){return res.status(500).json({error:'Falha de comunicação com o banco'})}
}