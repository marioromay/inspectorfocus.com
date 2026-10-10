(() => {
 let serial=0,current=null,previousFocus=null;
 const popup=document.createElement('dialog');popup.className='processing-popup';popup.setAttribute('aria-labelledby','processing-title');popup.setAttribute('aria-describedby','processing-detail');
 popup.innerHTML='<div class="processing-heading"><span class="processing-mascot" aria-hidden="true"><img src="/brand/inspector-focus.png" alt="" width="88" height="88"></span><h2 id="processing-title">Processing</h2></div><p id="processing-detail" role="status" aria-live="polite"></p><progress aria-label="Processing progress"></progress><p class="processing-count" aria-live="off"></p><p class="processing-local">Working on your device. Your photographs stay local.</p><button class="secondary" type="button" hidden>Cancel</button>';
 document.body.append(popup);const title=popup.querySelector('h2'),detail=popup.querySelector('#processing-detail'),bar=popup.querySelector('progress'),count=popup.querySelector('.processing-count'),button=popup.querySelector('button');
 function cancel(){if(!current?.cancel)return;const action=current.cancel;current.cancel=null;button.disabled=true;detail.textContent='Stopping…';action();}
 button.onclick=cancel;popup.addEventListener('cancel',e=>{e.preventDefault();cancel();});
 function update(id,text,done,total){if(current?.id!==id)return;detail.textContent=text;if(Number.isFinite(total)&&total>0){bar.max=total;bar.value=Math.min(total,Math.max(0,done||0));count.textContent=(done||0)+' / '+total;}else{bar.removeAttribute('value');count.textContent='';}}
 function finish(id){if(current?.id!==id)return;current=null;if(popup.open)popup.close();previousFocus?.focus?.();previousFocus=null;}
 window.processingProgress={start({title:heading='Processing',detail:text='Working locally…',total,cancel:action,cancelLabel='Cancel'}={}){const id=++serial;current={id,cancel:action};title.textContent=heading;button.hidden=!action;button.disabled=false;button.textContent=cancelLabel;update(id,text,0,total);if(!popup.open){previousFocus=document.activeElement;popup.showModal();}return id;},update,finish,reset(){if(current)finish(current.id);},paint:()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)))};
 window.addEventListener('pagehide',()=>window.processingProgress.reset());
})();
