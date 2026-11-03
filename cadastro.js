const BASE='https://cfcqsmlqxwedjwkywjne.supabase.co';
const KEY='sb_publishable_k7fa0F3DiUt2oSxC80ekjg_QY4nrH_G';
const $=id=>document.getElementById(id);
$('f').onsubmit=async e=>{
 e.preventDefault();const email=$('email').value.trim().toLowerCase(),password=$('password').value;
 if(password!==$('confirm').value){$('msg').textContent='As senhas não coincidem.';return}
 $('submit').disabled=true;$('msg').textContent='Criando conta...';
 try{
  const url=BASE+'/auth/v1/signup?redirect_to='+encodeURIComponent(location.origin+'/login.html');
  const r=await fetch(url,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  const d=await r.json();
  if(!r.ok)throw Error(d.msg||d.message||'Não foi possível criar a conta');
  $('f').reset();$('msg').textContent='Se o cadastro foi aceito, você receberá um e-mail de confirmação. Depois entre no login para ativar o convite autorizado pelo administrador.';
 }catch(err){$('msg').textContent=err.message}finally{$('submit').disabled=false}
};