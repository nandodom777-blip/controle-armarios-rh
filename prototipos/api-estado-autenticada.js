// API de autenticação em preparação — não substituir a API de produção antes do bootstrap do administrador.
const AUTH_ROLES = new Set(['admin','rh','prevencao','gerencia','consulta']);
const WRITE_ROLES = new Set(['admin','rh','prevencao']);
module.exports = async (req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Método não permitido'});
 const base=process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_ANON_KEY;
 const privateToken=process.env.RH_ARMS_TOKEN;
 if(!base||!key||!privateToken)return res.status(503).json({error:'Configuração indisponível'});
 const bearer=(req.headers.authorization||'').match(/^Bearer (.+)$/i)?.[1];
 if(!bearer)return res.status(401).json({error:'Faça login'});
 try{
  const headers={apikey:key,Authorization:'Bearer '+bearer};
  const auth=await fetch(base+'/auth/v1/user',{headers});
  if(!auth.ok)return res.status(401).json({error:'Sessão inválida'});
  const user=await auth.json();
  if(!user.id||!user.email_confirmed_at)return res.status(403).json({error:'Confirme seu e-mail'});
  const filter=new URLSearchParams({usuario_id:'eq.'+user.id,select:'perfil,ativo'});
  const p=await fetch(base+'/rest/v1/rh_armarios_perfis?'+filter,{headers});
  if(!p.ok)return res.status(503).json({error:'Não foi possível verificar seu perfil'});
  const rows=await p.json(),profile=rows[0];
  if(!profile?.ativo||!AUTH_ROLES.has(profile.perfil))return res.status(403).json({error:'Conta não autorizada'});
  if(req.method==='POST'&&!WRITE_ROLES.has(profile.perfil))return res.status(403).json({error:'Perfil somente leitura'});
  const body=req.method==='POST'?req.body||{}:{};
  if(req.method==='POST'&&JSON.stringify(body).length>2000000)return res.status(413).json({error:'Dados muito grandes'});
  const request={p_token:privateToken,p_metodo:req.method==='GET'?'ler':'gravar',p_dados:body.dados??null,p_revisao:body.revisao??null};
  const upstream=await fetch(base+'/rest/v1/rpc/rh_armarios_sync',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(request)});
  const response=await upstream.json();
  if(!upstream.ok)return res.status(response.message==='CONFLITO_DE_VERSAO'?409:400).json({error:response.message||'Falha ao salvar'});
  return res.status(200).json(response);
 }catch{return res.status(500).json({error:'Falha de comunicação'})}
};
