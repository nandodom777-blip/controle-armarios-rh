const BASE='https://cfcqsmlqxwedjwkywjne.supabase.co',KEY='sb_publishable_k7fa0F3DiUt2oSxC80ekjg_QY4nrH_G',STORE='rh_armarios_sessao';
const $=id=>document.getElementById(id);
let session,me;
function leave(){sessionStorage.removeItem(STORE);location.replace('/login.html')}
async function token(){
 session=JSON.parse(sessionStorage.getItem(STORE)||'null');
 if(!session?.refresh_token)throw Error('Sessão ausente');
 if(Date.now()>Number(session.expires_at||0)-60000){
  const r=await fetch(BASE+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
  if(!r.ok)throw Error('Sessão expirada');
  const d=await r.json();session={...session,access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Date.now()+d.expires_in*1000};sessionStorage.setItem(STORE,JSON.stringify(session));
 }
 return session.access_token;
}
async function rpc(action,params={}){
 const jwt=await token();
 const r=await fetch(BASE+'/rest/v1/rpc/rh_armarios_admin_usuarios',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+jwt,'Content-Type':'application/json'},body:JSON.stringify({p_acao:action,p_email:params.email??null,p_perfil:params.perfil??null,p_usuario_id:params.id??null,p_ativo:params.ativo??null})});
 const d=await r.json();if(!r.ok)throw Error(d.message||'Permissão negada');return d;
}
function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
function selectRole(value){const s=el('select');for(const [id,label] of [['admin','Administrador'],['rh','RH'],['prevencao','Prevenção'],['gerencia','Gerência'],['consulta','Consulta']]){const o=el('option',label);o.value=id;s.append(o)}s.value=value;return s}
async function load(){
 const data=await rpc('listar');$('users').replaceChildren();
 for(const u of data.usuarios){
  const tr=el('tr'),role=selectRole(u.perfil),cell=el('td'),actions=el('td'),save=el('button','Salvar'),toggle=el('button',u.ativo?'Bloquear':'Ativar');
  cell.append(role);actions.append(save,el('span',' '),toggle);
  tr.append(el('td',u.email),cell,el('td',u.ativo?'Ativo':'Bloqueado'),actions);$('users').append(tr);
  if(u.id===me){role.disabled=true;save.disabled=true;toggle.disabled=true}
  save.onclick=async()=>{try{await rpc('alterar',{id:u.id,perfil:role.value});$('msg').textContent='Perfil salvo';await load()}catch(e){$('msg').textContent=e.message}};
  toggle.onclick=async()=>{if(!confirm('Alterar acesso de '+u.email+'?'))return;try{await rpc('alterar',{id:u.id,ativo:!u.ativo});await load()}catch(e){$('msg').textContent=e.message}}
 }
 $('invites').replaceChildren();
 for(const c of data.convites){const tr=el('tr'),td=el('td'),b=el('button','Cancelar convite');b.onclick=async()=>{try{await rpc('cancelar',{email:c.email});await load()}catch(e){$('msg').textContent=e.message}};td.append(b);tr.append(el('td',c.email),el('td',c.perfil),el('td',new Date(c.expira_em).toLocaleDateString('pt-BR')),td);$('invites').append(tr)}
}
$('form').onsubmit=async e=>{e.preventDefault();try{await rpc('convidar',{email:$('email').value.trim().toLowerCase(),perfil:$('perfil').value});$('msg').textContent='Convite autorizado. Envie o link de cadastro.';$('form').reset();await load()}catch(err){$('msg').textContent=err.message}};
(async()=>{try{const jwt=await token();const r=await fetch(BASE+'/auth/v1/user',{headers:{apikey:KEY,Authorization:'Bearer '+jwt}});if(!r.ok)throw Error('Sessão inválida');me=(await r.json()).id;await rpc('listar');$('app').hidden=false;await load();$('msg').textContent='Administrador autenticado.'}catch(e){leave()}})();