// Shows an "Install app" button when Chrome says the app is installable.
let deferred;
function btn(){
  if(document.getElementById('bb-install'))return;
  const b=document.createElement('button');
  b.id='bb-install';b.textContent='⬇ Install app';
  b.style.cssText='position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:99;padding:12px 18px;border:0;border-radius:24px;background:#6366f1;color:#fff;font:600 15px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.4)';
  b.onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;b.remove()};
  document.body.appendChild(b);
}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;btn()});
addEventListener('appinstalled',()=>{const b=document.getElementById('bb-install');if(b)b.remove()});
