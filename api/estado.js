module.exports=async function(req,res){
res.setHeader('Cache-Control','no-store');
res.setHeader('Vary','Authorization');
if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Método não permitido'});
const base=process.env.SUPABASE_URL,key=process.env.SUPABASE_ANON_KEY,secret=process.env.RH_ARMS_TOKEN;
if(!base||!key||!secret)return res.status(503).json({error:'Conexão indisponível'});
const bearer=/^Bearer\s+([A-Za-z0-9_.-]+)$/.exec(req.headers.authorization||'');
if(!bearer)return res.status(401).json({error:'Sessão obrigatória'});
const access=bearer[1];
try{
const auth=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+access}});
if(!auth.ok)return res.status(401).json({error:'Sessão inválida ou expirada'});
const user=await auth.json();
if(!user.id)return res.status(401).json({error:'Sessão inválida'});
const profileRes=await fetch(base+'/rest/v1/rh_armarios_perfis?select=perfil,ativo&usuario_id=eq.'+encodeURIComponent(user.id),{headers:{apikey:key,Authorization:'Bearer '+access}});
if(!profileRes.ok)return res.status(403).json({error:'Não foi possível verificar o perfil'});
const [profile]=await profileRes.json();
if(!profile?.ativo)return res.status(403).json({error:'Usuário sem acesso autorizado'});
if(req.method==='POST'&&!['admin','rh','prevencao'].includes(profile.perfil))return res.status(403).json({error:'Perfil somente consulta'});
const input=req.method==='POST'?(req.body||{}):{};
if(req.method==='POST'&&JSON.stringify(input).length>2000000)return res.status(413).json({error:'Arquivo muito grande'});
const payload={p_token:secret,p_metodo:req.method==='GET'?'ler':'gravar',p_dados:input.dados??null,p_revisao:input.revisao??null};
const response=await fetch(base+'/rest/v1/rpc/rh_armarios_sync',{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key},body:JSON.stringify(payload)});
const value=await response.json();
if(!response.ok)return res.status((value.message||'').includes('CONFLITO')?409:400).json({error:value.message||'Erro no banco'});
return res.status(200).json(value);
}catch(e){return res.status(500).json({error:'Falha de comunicação com o banco'});}
}