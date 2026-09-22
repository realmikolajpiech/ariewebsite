// Replace these two values with the verified store listings at launch.
const STORE_URLS = { android: null, ios: null };
const dialog = document.querySelector('#download-dialog');
document.querySelector('#footer-downloads').innerHTML = document.querySelector('#hero-downloads').innerHTML;
document.querySelectorAll('[data-platform]').forEach(button => button.addEventListener('click', () => {
  const platform = button.dataset.platform;
  if (STORE_URLS[platform]) { window.location.assign(STORE_URLS[platform]); return; }
  document.querySelector('#dialog-title').textContent = `Arie for ${platform === 'ios' ? 'iOS' : 'Android'}`;
  document.querySelector('#dialog-description').textContent = 'The download link will be available when Arie launches.';
  dialog.showModal();
}));
document.querySelectorAll('.dialog-close,.dialog-done').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', e => { if(e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
const scenarios = {
  home: { quote: '“Tell Alex I’m on my way.\nTake me home. Put my music on.”', actions: [['Message Alex','Sent','✓'],['Open your route home','Opened','↗'],['Play your drive mix','Playing','✓']] },
  plan: { quote: '“That appointment in my messages?\nAdd it to my calendar.”', actions: [['Find the appointment details','Found','✓'],['Add the time and place','Saved','✓'],['Set a reminder','Set','✓']] },
  catchup: { quote: '“What did I miss\nwhile I was at the gym?”', actions: [['Review recent notifications','Reviewed','✓'],['Bring the important ones together','Ready','✓'],['Read your catch-up aloud','Playing','✓']] }
};
const tabs = [...document.querySelectorAll('[role=tab]')];
function selectTab(tab) {
  tabs.forEach(t => {t.setAttribute('aria-selected',String(t===tab)); t.tabIndex=t===tab?0:-1;});
  const data=scenarios[tab.dataset.scenario];
  document.querySelector('#scenario-panel').setAttribute('aria-labelledby',tab.id);
  const quote=document.querySelector('#scenario-quote'); quote.textContent=data.quote; quote.style.whiteSpace='pre-line';
  const list=document.querySelector('#scenario-actions'); list.replaceChildren();
  data.actions.forEach(([action,state,icon])=>{const li=document.createElement('li'); const name=document.createElement('span');name.textContent=action;const outcome=document.createElement('span');outcome.className='outcome';outcome.textContent=state+' ';const i=document.createElement('i');i.textContent=icon;outcome.append(i);li.append(name,outcome);list.append(li);});
}
tabs.forEach((tab,index) => {tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowDown')next=(index+1)%tabs.length;if(e.key==='ArrowUp')next=(index+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();selectTab(tabs[next]);tabs[next].focus();}});});
let demoTimers=[];
document.querySelector('#replay').addEventListener('click',()=>{
  demoTimers.forEach(clearTimeout); demoTimers=[];
  const items=[...document.querySelectorAll('#demo-results>span')];items.forEach(i=>i.classList.add('pending'));
  document.querySelector('#demo-status').textContent='Running example…';
  window.dispatchEvent(new CustomEvent('arie-working',{detail:true}));
  items.forEach((item,index)=>demoTimers.push(setTimeout(()=>item.classList.remove('pending'),650+index*750)));
  demoTimers.push(setTimeout(()=>{document.querySelector('#demo-status').textContent='Example complete';window.dispatchEvent(new CustomEvent('arie-working',{detail:false}));},2600));
});
document.querySelector('#year').textContent=new Date().getFullYear();
