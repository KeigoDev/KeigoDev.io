'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function motion(el, frames, duration=350){if(!reducedMotion.matches && el.animate)el.animate(frames,{duration,easing:'cubic-bezier(.22,1,.36,1)'});}
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const menu = $('#navLinks'), toggle = $('#navToggle');
function closeMenu(){menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');}
toggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
$$('.nav-links a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();}});
$$('.proj-more').forEach((button,index)=>{const panel=button.nextElementSibling;panel.id='detail-'+index;panel.hidden=true;button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',panel.id);button.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;button.setAttribute('aria-expanded',String(open));button.firstChild.textContent=open?'Hide details ':'Details ';if(open)motion(panel,[{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}]);});});
$$('.filter-btn').forEach(button=>{button.setAttribute('aria-pressed',String(button.classList.contains('active')));button.addEventListener('click',()=>{let count=0;$$('.filter-btn').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});$$('.proj-card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&!card.dataset.tags.split(' ').includes(button.dataset.filter);if(!card.hidden){count++;card.classList.add('visible');motion(card,[{opacity:.3,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],400);}});$('#filterStatus').textContent=`${count} projects shown`;});});
$('#galleryToggle').addEventListener('click',()=>{const gallery=$('#educationGallery');gallery.hidden=!gallery.hidden;$('#galleryToggle').setAttribute('aria-expanded',String(!gallery.hidden));$('#galleryToggle').innerHTML=(gallery.hidden?'View graduation photos':'Hide graduation photos')+' <span aria-hidden="true">'+(gallery.hidden?'+':'−')+'</span>';});
const dialog=$('.gallery-lightbox');$$('.gallery-item, .career-photo-trigger').forEach(button=>button.addEventListener('click',()=>{dialog.querySelector('img').src=button.dataset.full;dialog.querySelector('img').alt=button.querySelector('img').alt;dialog.showModal();}));$('.gallery-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('#copyEmail').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('matthew.p.ferrer@gmail.com');$('#copyStatus').textContent='Email copied.';}catch{$('#copyStatus').textContent='Copy this address: matthew.p.ferrer@gmail.com';}});
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.06});$$('.section-head,.proj-card,.exp-card,.cert-card,.about-grid').forEach(el=>{el.classList.add('reveal-ready');if(el.parentElement.matches('.proj-grid,.cert-grid'))el.style.setProperty('--reveal-delay',`${([...el.parentElement.children].indexOf(el)%3)*70}ms`);observer.observe(el);});const navObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)$$('.nav-links a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}),{rootMargin:'-15% 0px -60% 0px'});$$('section[id]').forEach(s=>navObserver.observe(s));}

// Scroll updates run at most once per animation frame.
const progress = $('.reading-progress'), header = $('.site-nav');
let scrollQueued=false;
function updateScroll(){
 const range=document.documentElement.scrollHeight-window.innerHeight;
 progress.style.transform=`scaleX(${range>0?Math.min(1,Math.max(0,window.scrollY/range)):0})`;
 header.classList.toggle('scrolled',window.scrollY>24);
 scrollQueued=false;
}
function queueScroll(){if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);}}
window.addEventListener('scroll',queueScroll,{passive:true});
window.addEventListener('resize',queueScroll,{passive:true});
if('ResizeObserver' in window)new ResizeObserver(queueScroll).observe(document.body);
updateScroll();
// Menus close naturally when moving to desktop or choosing another control.
window.matchMedia('(min-width: 781px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.site-nav'))closeMenu();});
menu.addEventListener('focusout',()=>{requestAnimationFrame(()=>{if(!header.contains(document.activeElement))closeMenu();});});
// Reveal focused content immediately for keyboard navigation.
document.addEventListener('focusin',e=>{const item=e.target.closest('.reveal-ready');if(item)item.classList.add('visible');});
