// KIDS EDUVERSE application JavaScript
window.onerror=function(m){var b=document.getElementById('errBanner');if(b){b.style.display='block';b.textContent='Oops: '+m;}};

(function(){
'use strict';
/* ===== helpers ===== */
function $(s){return document.querySelector(s);}
function $$(s){return Array.prototype.slice.call(document.querySelectorAll(s));}
function el(h){var t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild;}
function rand(a,b){return a+Math.random()*(b-a);}
function ri(a,b){return Math.floor(rand(a,b+1));}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function rep(s,n){var o='';while(n-->0)o+=s;return o;}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function ic(n,s){return '<svg width="'+(s||18)+'" height="'+(s||18)+'" style="flex:none"><use href="#i-'+n+'"/></svg>';}
function stopSpeech(){try{if(window.speechSynthesis)speechSynthesis.cancel();}catch(e){}}
function setWide(on){var b=$('#zoneBody');if(b)b.classList.toggle('wide',!!on);}
var PRAISE=['Great job!','Wonderful!','You did it!','Amazing!','Super!','Fantastic!','Brilliant!'];
/* ===== state ===== */
var KEY='eduverse-kids-v1';
var isLocalDev=/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
var API_BASE=window.EDUVERSE_API_BASE||localStorage.getItem('ke-api-base')||(isLocalDev?'http://localhost:5000/api':'/api');
var cloudToken=localStorage.getItem('ke-api-token')||'';
var cloudChild=localStorage.getItem('ke-child-id')||'';
function api(path,method,data){return fetch(API_BASE+path,{method:method||'GET',headers:Object.assign({'Content-Type':'application/json'},cloudToken?{Authorization:'Bearer '+cloudToken}:{}),body:data?JSON.stringify(data):undefined}).catch(function(){throw new Error('Cannot reach the signup server. Start the backend and check its MongoDB connection, then try again.');}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.message||'Request failed');return j;});});}
var cloudSyncTimer=null;function syncCloud(){if(!cloudToken||!cloudChild)return;if(cloudSyncTimer)clearTimeout(cloudSyncTimer);cloudSyncTimer=setTimeout(function(){api('/progress/'+cloudChild,'POST',{activity:'Overall Learning Progress',completed:true,score:Math.min(100,State.xp)}).catch(function(e){console.warn('Cloud sync:',e.message);});},700);}
function syncBadge(id){if(cloudToken&&cloudChild)api('/rewards/'+cloudChild+'/badges','POST',{badge:id}).catch(function(e){console.warn('Badge sync:',e.message);});}
function deepMerge(b,s){for(var k in s){if(s[k]&&typeof s[k]==='object'&&!(s[k] instanceof Array)&&b[k])deepMerge(b[k],s[k]);else b[k]=s[k];}return b;}
var State=(function(){var s={};try{s=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
 return deepMerge({xp:0,muted:false,badges:{},streak:{n:0,last:''},
  stats:{seen:{},traced:{},counted:0,sums:0,colored:0,animals:{},shapesSeen:{},quizRounds:0,rhymes:{},visited:{},memoryLevel:0,memStars:{},patternLevel:0,patStars:{},letterQuizBest:0}},s);})();
function save(){try{localStorage.setItem(KEY,JSON.stringify(State));}catch(e){} syncCloud();}
var TITLES=['Little Sprout','Curious Cub','Bright Star','Brave Explorer','Clever Climber','Super Scholar','Kids Eduverse Champ'];
function levelInfo(xp){var lvl=1,base=0,need=120;while(xp>=base+need){base+=need;lvl++;need=100+lvl*40;}
 return {lvl:lvl,cur:xp-base,need:need,title:TITLES[Math.min(lvl-1,TITLES.length-1)]};}
/* ===== audio ===== */
var Sfx={ctx:null,
 ac:function(){if(!this.ctx){var A=window.AudioContext||window.webkitAudioContext;if(!A)return null;try{this.ctx=new A();}catch(e){return null;}}
  if(this.ctx.state==='suspended'){try{this.ctx.resume();}catch(e){}}return this.ctx;},
 tone:function(o){var c=this.ac();if(!c||State.muted)return;
  try{var os=c.createOscillator(),g=c.createGain(),s=c.currentTime+(o.t||0),d=o.d||.15;
  os.type=o.type||'sine';os.frequency.setValueAtTime(o.f||440,s);
  if(o.f2)os.frequency.exponentialRampToValueAtTime(Math.max(o.f2,1),s+d);
  g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(o.v||.2,s+.015);g.gain.exponentialRampToValueAtTime(.0001,s+d);
  os.connect(g);g.connect(c.destination);os.start(s);os.stop(s+d+.05);}catch(e){}},
 noise:function(o){var c=this.ac();if(!c||State.muted)return;
  try{var d=o.d||.3,len=Math.max(1,Math.floor(c.sampleRate*d)),buf=c.createBuffer(1,len,c.sampleRate),ch=buf.getChannelData(0);
  for(var i=0;i<len;i++)ch[i]=Math.random()*2-1;
  var src=c.createBufferSource();src.buffer=buf;
  var f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=o.fq||600;
  var g=c.createGain(),s=c.currentTime+(o.t||0);g.gain.setValueAtTime(o.v||.25,s);g.gain.exponentialRampToValueAtTime(.0001,s+d);
  src.connect(f);f.connect(g);g.connect(c.destination);src.start(s);}catch(e){}},
 play:function(n){if(State.muted||!this.ac())return;var T=this.tone.bind(this);
  if(n==='click')T({f:620,f2:900,d:.07,type:'triangle',v:.14});
  else if(n==='pop')T({f:430,f2:95,d:.12,v:.28});
  else if(n==='flip')T({f:300,f2:520,d:.08,type:'triangle',v:.12});
  else if(n==='boing')T({f:140,f2:330,d:.2,v:.2});
  else if(n==='correct'){T({f:523.25,d:.2,type:'triangle',v:.2});T({f:659.25,t:.09,d:.2,type:'triangle',v:.2});T({f:783.99,t:.18,d:.2,type:'triangle',v:.2});}
  else if(n==='wrong'){T({f:311,f2:233,d:.28,v:.16});T({f:233,f2:190,t:.13,d:.3,v:.13});}
  else if(n==='fanfare'){T({f:523.25,d:.26,type:'triangle',v:.2});T({f:659.25,t:.12,d:.26,type:'triangle',v:.2});T({f:783.99,t:.24,d:.26,type:'triangle',v:.2});T({f:1046.5,t:.36,d:.3,type:'triangle',v:.2});}
  else if(n==='sparkle'){T({f:1250,f2:1625,d:.12,v:.09});T({f:1650,f2:2145,t:.06,d:.12,v:.09});T({f:2150,f2:2795,t:.12,d:.12,v:.09});}},
 sound:function(k){if(State.muted||!this.ac())return;var T=this.tone.bind(this),N=this.noise.bind(this);
  if(k==='roar'){N({d:.9,v:.3,fq:320});T({f:110,f2:62,d:.9,type:'sawtooth',v:.16});}
  else if(k==='trumpet'){T({f:340,f2:720,d:.32,type:'sawtooth',v:.14});T({f:720,f2:270,t:.32,d:.5,type:'sawtooth',v:.14});}
  else if(k==='moo'){T({f:175,f2:92,d:.65,type:'sawtooth',v:.2});T({f:95,f2:78,t:.22,d:.6,type:'sawtooth',v:.12});}
  else if(k==='bark'){T({f:520,f2:150,d:.1,type:'sawtooth',v:.24});T({f:470,f2:135,t:.17,d:.12,type:'sawtooth',v:.24});}
  else if(k==='meow'){T({f:470,f2:760,d:.24,type:'triangle',v:.2});T({f:760,f2:290,t:.24,d:.36,type:'triangle',v:.2});}
  else if(k==='quack'){T({f:330,f2:205,d:.12,type:'square',v:.1});T({f:315,f2:205,t:.17,d:.12,type:'square',v:.1});T({f:300,f2:205,t:.34,d:.12,type:'square',v:.1});}
  else if(k==='croak'){T({f:112,f2:135,d:.1,type:'square',v:.11});T({f:121,f2:135,t:.14,d:.1,type:'square',v:.11});T({f:130,f2:135,t:.28,d:.1,type:'square',v:.11});}
  else if(k==='tweet'){T({f:2200,f2:3100,d:.09,v:.14});T({f:2600,f2:1750,t:.12,d:.1,v:.14});T({f:2400,f2:3300,t:.26,d:.09,v:.11});}
  else if(k==='oink'){T({f:280,f2:150,d:.13,type:'square',v:.16});T({f:265,f2:140,t:.2,d:.13,type:'square',v:.16});}
  else if(k==='baa'){T({f:300,f2:250,d:.55,type:'sawtooth',v:.18});T({f:310,f2:240,t:.28,d:.45,type:'sawtooth',v:.12});}
  else if(k==='neigh'){T({f:760,f2:220,d:.55,type:'sawtooth',v:.16});T({f:600,f2:180,t:.25,d:.3,type:'sawtooth',v:.1});}
  else if(k==='cluck'){T({f:640,f2:320,d:.07,type:'square',v:.14});T({f:600,f2:300,t:.14,d:.07,type:'square',v:.14});T({f:660,f2:330,t:.3,d:.09,type:'square',v:.14});}
  else if(k==='squeak'){T({f:900,f2:1500,d:.12,type:'sine',v:.14});T({f:1000,f2:1600,t:.18,d:.12,type:'sine',v:.12});}
  else if(k==='chatter'){T({f:700,f2:500,d:.06,type:'square',v:.12});T({f:900,f2:600,t:.09,d:.06,type:'square',v:.12});T({f:750,f2:520,t:.18,d:.06,type:'square',v:.12});T({f:950,f2:640,t:.27,d:.06,type:'square',v:.12});}
  else if(k==='growl'){N({d:.8,v:.26,fq:260});T({f:90,f2:58,d:.8,type:'sawtooth',v:.15});}
  else if(k==='howl'){T({f:300,f2:640,d:.5,type:'sine',v:.16});T({f:640,f2:260,t:.5,d:.6,type:'sine',v:.16});}
  else if(k==='yip'){T({f:760,f2:420,d:.09,type:'square',v:.15});T({f:700,f2:390,t:.16,d:.09,type:'square',v:.15});}
  else if(k==='bleat'){T({f:380,f2:320,d:.5,type:'sawtooth',v:.16});}
  else if(k==='hiss'){N({d:1,v:.16,fq:2600});}
  else if(k==='hoot'){T({f:392,d:.32,type:'sine',v:.2});T({f:330,t:.38,d:.42,type:'sine',v:.2});}
  else if(k==='honk'){T({f:230,f2:180,d:.4,type:'square',v:.12});}
  else if(k==='gruff'){T({f:130,f2:80,d:.4,type:'sawtooth',v:.15});N({d:.3,v:.1,fq:300});}
  else if(k==='pop2'){T({f:500,f2:130,d:.1,v:.22});}
  else if(k==='chirp2'){T({f:1200,f2:1650,d:.12,type:'sine',v:.12});T({f:1250,f2:1700,t:.2,d:.12,type:'sine',v:.1});}
  else if(k==='whistle2'){T({f:700,f2:1500,d:.35,type:'sine',v:.14});T({f:800,f2:1600,t:.4,d:.25,type:'sine',v:.1});}
  else if(k==='splash2'){N({d:.45,v:.2,fq:1200});T({f:300,f2:80,d:.4,v:.12});}
  else if(k==='whoosh2'){T({f:160,f2:520,d:.7,type:'sine',v:.14});}
  else if(k==='squawk2'){T({f:520,f2:760,d:.18,type:'sawtooth',v:.15});T({f:700,f2:320,t:.2,d:.3,type:'sawtooth',v:.13});}
  else if(k==='buzz'){T({f:185,f2:160,d:.85,type:'sawtooth',v:.1});}
  else if(k==='clicky'){T({f:900,f2:600,d:.05,type:'square',v:.1});T({f:860,f2:560,t:.1,d:.05,type:'square',v:.1});T({f:920,f2:620,t:.2,d:.05,type:'square',v:.1});}}
};
window.addEventListener('pointerdown',function(){Sfx.ac();},{once:true});
var Voice={say:function(txt,lang){if(State.muted||!txt)return;
 try{if(!window.speechSynthesis)return;speechSynthesis.cancel();
 var u=new SpeechSynthesisUtterance(txt);u.lang=lang||'en-US';u.rate=.9;u.pitch=1.12;
 var vs=speechSynthesis.getVoices(),v=null,i;
 for(i=0;i<vs.length;i++){if(vs[i].lang===u.lang){v=vs[i];break;}}
 if(!v)for(i=0;i<vs.length;i++){if(vs[i].lang&&vs[i].lang.indexOf(u.lang.slice(0,2))===0){v=vs[i];break;}}
 if(v)u.voice=v;speechSynthesis.speak(u);}catch(e){}}};
try{if(window.speechSynthesis)speechSynthesis.getVoices();}catch(e){}
/* ===== essential wiring first ===== */
function paintSnd(){var w=$('#sndIcWrap');if(w)w.innerHTML='<use href="#i-'+(State.muted?'mute':'vol')+'"/>';}
 $('#btnSound').addEventListener('click',function(){State.muted=!State.muted;save();paintSnd();Sfx.play('click');if(!State.muted)Voice.say('Sound is on!');});
 $('#btnStart').addEventListener('click',function(){Sfx.ac();Sfx.play('fanfare');
 $('#splash').classList.add('gone');
 setTimeout(function(){Voice.say('Welcome to Kids Eduverse! Tap a place on the map to start exploring!');
  if(State.streak.n>1)toast('Welcome back! Day '+State.streak.n+' of your streak!','flame');},650);});
 $('#btnHome').addEventListener('click',function(){Sfx.play('click');
 if($('#zone').classList.contains('open'))closeZone();else window.scrollTo(0,0);});
 $('#btnMap').addEventListener('click',closeZone);
window.addEventListener('keydown',function(e){if(e.key==='Escape'){
 if($('#modalRoot').classList.contains('open'))closeModal();
 else if($('#zone').classList.contains('open'))closeZone();}});
paintSnd();
/* ===== confetti / toast / modal / xp ===== */
var Confetti=(function(){
 var c=document.createElement('canvas');c.id='confetti';document.body.appendChild(c);
 var x=c.getContext('2d'),P=[],raf=null;
 function size(){c.width=innerWidth;c.height=innerHeight;}window.addEventListener('resize',size);size();
 var COLS=['#FF6B57','#FFC93C','#2EC4B6','#58B368','#F15BB5','#4A90D9'];
 function burst(px,py,n){n=n||90;for(var i=0;i<n;i++){var a=Math.random()*Math.PI*2,s=4+Math.random()*9;
  P.push({x:px,y:py,vx:Math.cos(a)*s,vy:Math.sin(a)*s-7,g:.24+Math.random()*.16,r:3+Math.random()*5,c:COLS[i%6],rot:Math.random()*6,vr:rand(-.3,.3),sh:i%3,life:80+Math.random()*40});}
  if(!raf)loop();}
 function loop(){raf=requestAnimationFrame(loop);x.clearRect(0,0,c.width,c.height);
  P=P.filter(function(p){return p.life>0&&p.y<c.height+30;});
  if(!P.length){cancelAnimationFrame(raf);raf=null;return;}
  P.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=.985;p.rot+=p.vr;p.life--;
   x.save();x.translate(p.x,p.y);x.rotate(p.rot);x.globalAlpha=Math.min(1,p.life/30);x.fillStyle=p.c;
   if(p.sh===0)x.fillRect(-p.r,-p.r*.6,p.r*2,p.r*1.2);
   else if(p.sh===1){x.beginPath();x.arc(0,0,p.r*.7,0,7);x.fill();}
   else{x.beginPath();x.moveTo(0,-p.r);x.lineTo(p.r,p.r);x.lineTo(-p.r,p.r);x.closePath();x.fill();}
   x.restore();});}
 return {burst:burst};})();
function celebrate(){Confetti.burst(innerWidth/2,innerHeight*.38,110);}
function toast(msg,icn){var t=el('<div class="toast">'+ic(icn||'star',18)+'<span>'+msg+'</span></div>');
 $('#toastRoot').appendChild(t);setTimeout(function(){t.style.opacity='0';},2400);setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},2900);}
function floatXP(txt,x,y){var f=el('<span class="xpFloat">'+txt+'</span>');
 f.style.left=(x-20)+'px';f.style.top=(y-20)+'px';document.body.appendChild(f);setTimeout(function(){if(f.parentNode)f.parentNode.removeChild(f);},1100);}
function openModal(html){$('#modalCard').innerHTML='<button class="btn modalX" aria-label="Close">'+ic('x',18)+'</button>'+html;
 $('#modalRoot').classList.add('open');$('#modalCard .modalX').addEventListener('click',closeModal);}
function closeModal(){$('#modalRoot').classList.remove('open');}
 $('#modalRoot').addEventListener('click',function(e){if(e.target.id==='modalRoot')closeModal();});
var BADGES={
 'first-steps':['First Steps','star','Play your very first activity.'],
 'letter-fan':['Letter Fan','abc','Meet 10 letters in Letter Land.'],
 'letter-hero':['Letter Hero','crown','Score 25+ first-try in the big quiz.'],
 'trace-star':['Trace Star','pencil','Trace 5 letters beautifully.'],
 'count-pro':['Counting Pro','hash','Finish 10 counting games.'],
 'math-whiz':['Math Whiz','star','Get 15 sums right.'],
 'color-artist':['Color Artist','palette','Paint 8 parts of the pictures.'],
 'shape-master':['Shape Master','shapes','Match a whole round of shapes.'],
 'animal-friend':['Animal Friend','paw','Meet all 50 animal friends.'],
 'memory-champ':['Memory Champ','cards','Win a memory game.'],
 'quiz-knight':['Quiz Knight','trophy','Finish a quiz at the castle.'],
 'rhyme-singer':['Rhyme Singer','note','Sing a whole rhyme.'],
 'on-fire':['On Fire','flame','Get 7 answers right in a row.'],
 'sun-shiner':['Sun Shiner','star','Play 3 days in a row.'],
 'explorer':['World Explorer','puzzle','Visit all nine lands.']};
function updateHUD(){var L=levelInfo(State.xp);
 $('#hudXP').textContent=State.xp;$('#hudStreak').textContent=State.streak.n;$('#hudLvl').textContent='Lv '+L.lvl;}
function addXP(n,x,y){var before=levelInfo(State.xp).lvl;State.xp+=n;save();updateHUD();
 if(x!==undefined)floatXP('+'+n,x,y);
 var after=levelInfo(State.xp).lvl;
 if(after>before){Sfx.play('fanfare');celebrate();
  openModal('<h3 style="font-size:32px">Level up!</h3>'+
  '<p style="font-weight:800;font-size:19px;margin:6px 0">You are now <b style="color:var(--zw)">Level '+after+' - '+levelInfo(State.xp).title+'</b>!</p>'+
  '<button class="btn" style="background:var(--zw);color:#fff" id="luOk">'+ic('sparkle')+' Keep going!</button>');
  $('#luOk').addEventListener('click',closeModal);}
 awardBadge('first-steps');}
function awardBadge(id){if(State.badges[id])return;State.badges[id]=1;save();syncBadge(id);
 Sfx.play('fanfare');Confetti.burst(innerWidth/2,innerHeight*.5,60);
 toast('Badge earned: <b>&nbsp;'+BADGES[id][0]+'!</b>',BADGES[id][1]);}
(function(){var today=new Date().toDateString();
 if(State.streak.last!==today){var y=new Date(Date.now()-864e5).toDateString();
  State.streak.n=(State.streak.last===y)?State.streak.n+1:1;State.streak.last=today;
  if(State.streak.n>=3)awardBadge('sun-shiner');save();}})();
/* ===== art data ===== */
var INK='#3A2E39';
var SHAPES2D={
 circle:'#2EC4B6',square:'#FF6B57',triangle:'#FFC93C',star:'#F15BB5',heart:'#E23E57',diamond:'#58B368',
 rectangle:'#4A90D9',oval:'#FF9F1C',pentagon:'#8656C1',hexagon:'#A4C639',crescent:'#8FBFE8',
 parallelogram:'#E8863A',trapezoid:'#9B7EB8',rhombus:'#F2909F',arrow:'#4A4E57',cross:'#E23E57',
 semicircle:'#D9A05B',flower:'#F15BB5'};
var SHAPES3D={cube:'#E8863A',sphere:'#2EC4B6',cone:'#FFC93C',cylinder:'#4A90D9',pyramid:'#FF9F1C'};
var SHAPES=SHAPES2D;
var SHAPE_INFO={
 circle:{pet:'Cleo the Circle',fact:'A circle is perfectly round, with no corners at all!'},
 square:{pet:'Sammy the Square',fact:'A square has 4 equal sides and 4 corners.'},
 triangle:{pet:'Tilly the Triangle',fact:'A triangle has 3 straight sides and 3 pointy corners.'},
 star:{pet:'Stella the Star',fact:'A star has 5 points. Try counting them!'},
 heart:{pet:'Hugo the Heart',fact:'A heart has two round bumps on top and one point below.'},
 diamond:{pet:'Daisy the Diamond',fact:'A diamond stands on its point, just like a kite!'},
 rectangle:{pet:'Ricky the Rectangle',fact:'A rectangle has 4 sides: two long and two short.'},
 oval:{pet:'Ozzy the Oval',fact:'An oval is a squished circle, just like an egg!'},
 pentagon:{pet:'Penny the Pentagon',fact:'A pentagon has 5 sides. It looks like a little house!'},
 hexagon:{pet:'Hexa the Hexagon',fact:'A hexagon has 6 sides. Bees build honeycombs with them!'},
 crescent:{pet:'Coco the Crescent',fact:'A crescent is the curly shape of the moon!'},
 parallelogram:{pet:'Perry the Parallelogram',fact:'A parallelogram leans over, but its sides stay parallel!'},
 trapezoid:{pet:'Toby the Trapezoid',fact:'A trapezoid has two parallel sides and two slanted ones!'},
 rhombus:{pet:'Ruby the Rhombus',fact:'A rhombus is a leaning square — all 4 sides are equal!'},
 arrow:{pet:'Ava the Arrow',fact:'An arrow points the way, like on a treasure map!'},
 cross:{pet:'Coco the Cross',fact:'A cross has 4 equal arms sticking out!'},
 semicircle:{pet:'Sam the Semi-Circle',fact:'A semi-circle is half a circle, like a rainbow or a dome!'},
 flower:{pet:'Lily the Flower Shape',fact:'A flower shape has petals all around a center!'},
 cube:{pet:'Cube Carl',fact:'A cube has 6 flat square faces, just like a dice!'},
 sphere:{pet:'Sphere Sadie',fact:'A sphere is round all over, like a ball or a bubble!'},
 cone:{pet:'Connie the Cone',fact:'A cone has a round base and one pointy top, like ice cream!'},
 cylinder:{pet:'Cylinder Cy',fact:'A cylinder has two round ends, like a can of juice!'},
 pyramid:{pet:'Pyramid Pip',fact:'A pyramid has a flat base and a pointy top, like in Egypt!'}};
function shape3DInner(name,c){
 if(name==='cube')return '<path d="M10 26 22 12 56 12 42 26Z" fill="'+c+'"/><path d="M42 26 56 12 56 42 42 56Z" fill="'+c+'"/><path d="M10 26h32v30H10Z" fill="'+c+'"/><path d="M10 26 22 12 56 12 42 26Z" fill="#fff" opacity=".35" stroke="none"/><path d="M42 26 56 12 56 42 42 56Z" fill="#000" opacity=".14" stroke="none"/><path d="M10 26 22 12 56 12 56 42 42 56 10 56Z" fill="none"/><path d="M10 26h32M42 26 56 12M42 26v30" fill="none"/>';
 if(name==='sphere')return '<circle cx="32" cy="34" r="22" fill="'+c+'"/><ellipse cx="24" cy="26" rx="8" ry="6" fill="#fff" opacity=".5" stroke="none"/><path d="M11 36a21 9 0 0 0 42 0" fill="none" stroke-width="2" opacity=".45"/>';
 if(name==='cone')return '<path d="M32 8 12 46a20 8 0 0 0 40 0Z" fill="'+c+'"/><ellipse cx="32" cy="46" rx="20" ry="8" fill="#000" opacity=".14" stroke="none"/><path d="M25 17 18 41" stroke="#fff" opacity=".5" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="46" rx="20" ry="8" fill="none"/>';
 if(name==='cylinder')return '<path d="M12 16v32a20 8 0 0 0 40 0V16" fill="'+c+'"/><ellipse cx="32" cy="48" rx="20" ry="8" fill="#000" opacity=".12" stroke="none"/><ellipse cx="32" cy="16" rx="20" ry="8" fill="#fff" opacity=".4" stroke="none"/><ellipse cx="32" cy="16" rx="20" ry="8" fill="none"/>';
 if(name==='pyramid')return '<path d="M32 8 8 50 38 57Z" fill="'+c+'"/><path d="M32 8 38 57 58 46Z" fill="'+c+'"/><path d="M32 8 38 57 58 46Z" fill="#000" opacity=".14" stroke="none"/>';
 return '';}
function shapeSVG(name,color,s){
 var two={
  circle:'<circle cx="32" cy="32" r="24"/>',
  square:'<rect x="10" y="10" width="44" height="44" rx="6"/>',
  triangle:'<path d="M32 8 56 52H8z"/>',
  star:'<path d="M32 6 38.5 23.1 56.7 24 42.5 35.4 47.3 53 32 43 16.7 53 21.5 35.4 7.3 24 25.5 23.1z"/>',
  heart:'<path d="M32 54C18 44 10 35 10 25a11 11 0 0 1 22-3 11 11 0 0 1 22 3c0 10-8 19-22 29z"/>',
  diamond:'<path d="M32 6 56 32 32 58 8 32z"/>',
  rectangle:'<rect x="6" y="16" width="52" height="32" rx="6"/>',
  oval:'<ellipse cx="32" cy="32" rx="25" ry="18"/>',
  pentagon:'<path d="M32 6 56.7 24 47.3 53 16.7 53 7.3 24z"/>',
  hexagon:'<path d="M58 32 45 54.5 19 54.5 6 32 19 9.5 45 9.5z"/>',
  crescent:'<path d="M42 8A25 25 0 1 0 42 56 40 40 0 0 1 42 8z"/>',
  parallelogram:'<path d="M18 12 56 12 46 52 8 52z"/>',
  trapezoid:'<path d="M20 12 50 12 58 52 6 52z"/>',
  rhombus:'<path d="M32 5 55 32 32 59 9 32z" transform="rotate(0)"/><path d="M32 5 55 32 32 59 9 32z" fill="none"/>',
  arrow:'<path d="M20 26h14V12l20 20-20 20V38H20z"/>',
  cross:'<path d="M24 8h16v16h16v16H40v16H24V40H8V24h16z"/>',
  semicircle:'<path d="M6 46a26 26 0 0 1 52 0z"/>',
  flower:(function(){var pts='',k;
   for(k=0;k<6;k++){var a=k*60*Math.PI/180;
    pts+='<circle cx="'+(32+Math.cos(a)*14).toFixed(1)+'" cy="'+(32+Math.sin(a)*14).toFixed(1)+'" r="11"/>';}
   return '<g>'+pts+'<circle cx="32" cy="32" r="9"/></g>';})()
  }[name];
 var inner;
 if(two){inner='<g fill="'+color+'" stroke="'+INK+'" stroke-width="3" stroke-linejoin="round">'+two+'</g>';}
 else{inner='<g stroke="'+INK+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+shape3DInner(name,color)+'</g>';}
 return '<svg viewBox="0 0 64 64" width="'+s+'" height="'+s+'">'+inner+'</svg>';}
function shapeColor(n){return SHAPES2D[n]||SHAPES3D[n]||'#999';}
function art(inner){return '<svg viewBox="0 0 64 64" style="width:100%;height:100%"><g stroke="'+INK+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+inner+'</g></svg>';}
function memPetals(cx,cy,rIn,n,rx,ry,color){var s='',k;
 for(k=0;k<n;k++){var deg=k*360/n,a=deg*Math.PI/180,
  x=(cx+Math.cos(a)*rIn).toFixed(1),y=(cy+Math.sin(a)*rIn).toFixed(1);
  s+='<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+color+'" transform="rotate('+(deg+90)+' '+x+' '+y+')"/>';}
 return s;}
var ICONS={
apple:art('<circle cx="32" cy="38" r="16" fill="#FF6B57"/><path d="M32 22c1-6 5-9 10-10-1 6-4 9-10 10z" fill="#58B368"/><path d="M32 22v-7" fill="none"/>'),
ball:art('<circle cx="32" cy="32" r="17" fill="#FFC93C"/><path d="M15 32a17 17 0 0 0 34 0z" fill="#FF6B57" stroke="none"/><circle cx="32" cy="32" r="17" fill="none"/>'),
banana:art('<path d="M14 15c-2 17 8 31 25 34 9 2 15-3 12-8-2-4-7-2-11-3-11-3-17-11-18-23-1-6-7-6-8 0z" fill="#FFD24C"/>'),
watermelon:art('<path d="M7 26a25 25 0 0 0 50 0z" fill="#58B368"/><path d="M13 26a19 19 0 0 0 38 0z" fill="#FF6B57" stroke="none"/><ellipse cx="24" cy="33" rx="1.6" ry="2.6" fill="#3A2E39" stroke="none"/><ellipse cx="32" cy="38" rx="1.6" ry="2.6" fill="#3A2E39" stroke="none"/><ellipse cx="40" cy="33" rx="1.6" ry="2.6" fill="#3A2E39" stroke="none"/>'),
strawberry:art('<path d="M32 55C21 48 15 39 15 30c0-7 5-11 10-11 3 0 5 1 7 3 2-2 4-3 7-3 5 0 10 4 10 11 0 9-6 18-17 25z" fill="#E23E57"/><path d="M24 19c2-4 5-6 8-6s6 2 8 6c-3 2-5 5-8 5s-5-3-8-5z" fill="#58B368"/><circle cx="25" cy="32" r="1.4" fill="#FFD24C" stroke="none"/><circle cx="32" cy="38" r="1.4" fill="#FFD24C" stroke="none"/><circle cx="39" cy="32" r="1.4" fill="#FFD24C" stroke="none"/>'),
cherry:art('<path d="M32 12c-6 4-10 10-12 18M32 12c6 3 10 9 13 16" fill="none"/><path d="M32 12c3-3 7-4 10-3-1 4-4 6-8 6z" fill="#58B368"/><circle cx="19" cy="41" r="10" fill="#E23E57"/><circle cx="46" cy="39" r="10" fill="#E23E57"/><circle cx="16" cy="38" r="2.5" fill="#fff" opacity=".55" stroke="none"/><circle cx="43" cy="36" r="2.5" fill="#fff" opacity=".55" stroke="none"/>'),
pineapple:art('<ellipse cx="32" cy="40" rx="15" ry="19" fill="#FFC93C"/><path d="M20 32c8-4 16-4 24 0M19 40c8-4 17-4 26 0M21 48c7-4 15-4 22 0M26 25l-3 30M32 23v34M38 25l3 30" fill="none" stroke-width="2"/><path d="M32 21c-8-2-12-8-12-14 6 0 11 3 13 8 1-6 5-10 11-11 0 7-4 13-12 17z" fill="#58B368"/>'),
rose:art('<path d="M32 36v20" fill="none"/><path d="M32 46c-6 0-10-3-12-8 7-1 11 3 12 8zM32 51c6 0 10-3 12-8-7-1-11 3-12 8z" fill="#58B368" stroke-width="2.4"/><circle cx="24" cy="20" r="8.5" fill="#E23E57"/><circle cx="40" cy="20" r="8.5" fill="#E23E57"/><circle cx="32" cy="27" r="9.5" fill="#E23E57"/><circle cx="32" cy="22" r="5" fill="#B3261E" stroke-width="2.4"/>'),
tulip:art('<path d="M32 36v18" fill="none"/><path d="M32 47c-6 0-10-3-12-8 7-1 11 3 12 8z" fill="#58B368" stroke-width="2.4"/><path d="M19 12v9c0 10 5 17 13 17s13-7 13-17v-9l-6.5 7L32 10l-6.5 9z" fill="#F15BB5"/>'),
sunflower:art('<path d="M32 40v18" fill="none"/><path d="M32 49c-6 0-10-3-12-8 7-1 11 3 12 8z" fill="#58B368" stroke-width="2.4"/>'+memPetals(32,23,15,10,5.5,9,'#FFC93C')+'<circle cx="32" cy="23" r="8.5" fill="#7A4E2D"/>'),
daisy:art('<path d="M32 40v18" fill="none"/><path d="M32 49c6 0 10-3 12-8-7-1-11 3-12 8z" fill="#58B368" stroke-width="2.4"/>'+memPetals(32,23,15,10,5,9,'#FFFFFF')+'<circle cx="32" cy="23" r="7.5" fill="#FFC93C"/>'),
sakura:art(memPetals(32,28,13,5,8,11,'#F7A1C4')+'<circle cx="32" cy="28" r="6" fill="#FF6B57" stroke-width="2.4"/>'),
lotus:art('<path d="M32 12c5 6 8 13 8 21H24c0-8 3-15 8-21z" fill="#F7A1C4"/><path d="M13 18c7 1 13 8 15 15H13z" fill="#F7A1C4"/><path d="M51 18c-7 1-13 8-15 15h15z" fill="#F7A1C4"/><path d="M6 32c9 7 17 9 26 9s17-2 26-9c-3 11-14 15-26 15S9 43 6 32z" fill="#F15BB5"/>'),
star5:art('<path d="M32 6 38.5 23.1 56.7 24 42.5 35.4 47.3 53 32 43 16.7 53 21.5 35.4 7.3 24 25.5 23.1z" fill="#FFD24C"/>'),
bee:art('<ellipse cx="24" cy="21" rx="9" ry="6" fill="#BEE9E8" transform="rotate(-24 24 21)"/><ellipse cx="40" cy="21" rx="9" ry="6" fill="#BEE9E8" transform="rotate(24 40 21)"/><ellipse cx="32" cy="38" rx="15" ry="11" fill="#FFD24C"/><path d="M27 28.5v19M33 27.5v21M39 29v17" stroke-width="2.4"/><circle cx="22" cy="35" r="1.8" fill="'+INK+'" stroke="none"/><circle cx="28" cy="35" r="1.8" fill="'+INK+'" stroke="none"/>'),
butterfly:art('<ellipse cx="20" cy="25" rx="12" ry="10" fill="#F7A1C4" transform="rotate(-20 20 25)"/><ellipse cx="44" cy="25" rx="12" ry="10" fill="#F7A1C4" transform="rotate(20 44 25)"/><ellipse cx="23" cy="42" rx="8" ry="7" fill="#BEE9E8"/><ellipse cx="41" cy="42" rx="8" ry="7" fill="#BEE9E8"/><ellipse cx="32" cy="33" rx="3.5" ry="12" fill="'+INK+'" stroke="none"/><path d="M30 22c-2-4-5-6-8-6M34 22c2-4 5-6 8-6" fill="none" stroke-width="2.2"/>'),
chick:art('<circle cx="32" cy="34" r="16" fill="#FFD24C"/><circle cx="26" cy="30" r="2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="30" r="2" fill="'+INK+'" stroke="none"/><path d="M29 35h6l-3 4z" fill="#FF9F1C"/><path d="M20 26c-3-5-1-9 3-9M44 26c3-5 1-9-3-9" fill="none" stroke-width="2.2"/><path d="M26 50v4M38 50v4" stroke="#FF9F1C" stroke-width="3"/>'),
mushroom:art('<path d="M10 34c0-14 10-24 22-24s22 10 22 24z" fill="#E23E57"/><circle cx="22" cy="24" r="4" fill="#fff" stroke="none"/><circle cx="36" cy="20" r="3.4" fill="#fff" stroke="none"/><circle cx="42" cy="28" r="3" fill="#fff" stroke="none"/><path d="M24 34h16l-2 18c-.4 3-11.6 3-12 0z" fill="#F6E8D8"/>'),
ladybug:art('<circle cx="32" cy="36" r="17" fill="#E23E57"/><path d="M32 19v34" stroke-width="2.2"/><circle cx="25" cy="30" r="3" fill="#3A2E39" stroke="none"/><circle cx="39" cy="30" r="3" fill="#3A2E39" stroke="none"/><circle cx="24" cy="42" r="2.6" fill="#3A2E39" stroke="none"/><circle cx="40" cy="42" r="2.6" fill="#3A2E39" stroke="none"/><path d="M32 19c-2-4-6-6-9-5 1 4 4 6 9 5zM32 19c2-4 6-6 9-5-1 4-4 6-9 5z" fill="#3A2E39" stroke-width="2.4"/>'),
balloon:art('<path d="M32 8c9 0 15 7 15 15 0 10-9 17-15 22-6-5-15-12-15-22 0-8 6-15 15-15z" fill="#FF6B57"/><path d="M22 15c-3 4-4 8-4 12" stroke="#FFC93C" stroke-width="4" fill="none"/><path d="M32 45v4l-3 3" fill="none"/><path d="M29 52h6" stroke-width="2.4"/>'),
snail:art('<path d="M8 50c0-6 6-9 12-9h8c8 0 14 4 14 9z" fill="#C68B59"/><path d="M12 41c-3-4-2-8 1-10" fill="none" stroke-width="2.2"/><circle cx="12" cy="29" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="36" cy="30" r="14" fill="#E0A458"/><path d="M36 30c-4 0-7 3-7 6s3 5 6 5 6-2 6-6c0-5-4-9-9-9" fill="none" stroke="#A9713B" stroke-width="2.4"/>'),
blossom:art(memPetals(32,30,13,6,7,10,'#F7A1C4')+'<circle cx="32" cy="30" r="6.5" fill="#FFC93C"/>'),
leaf:art('<path d="M32 54C18 44 14 28 20 12c14 2 24 14 22 30-1 6-5 10-10 12z" fill="#58B368"/><path d="M26 48C30 38 34 28 40 20" fill="none" stroke-width="2.2"/>'),
cat:art('<path d="M20 25 16 10l13 7z" fill="#FFB84C"/><path d="M44 25 48 10 35 17z" fill="#FFB84C"/><circle cx="32" cy="37" r="17" fill="#FFB84C"/><circle cx="26" cy="34" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="34" r="2.2" fill="'+INK+'" stroke="none"/><path d="M29.5 40h5l-2.5 3z" fill="#F15BB5" stroke-width="2.2"/><path d="M12 36h8M12 42h8M44 36h8M44 42h8" stroke-width="2.2"/>'),
dog:art('<ellipse cx="16" cy="30" rx="6" ry="11" fill="#8A5A33" transform="rotate(14 16 30)"/><ellipse cx="48" cy="30" rx="6" ry="11" fill="#8A5A33" transform="rotate(-14 48 30)"/><circle cx="32" cy="34" r="16" fill="#C68B59"/><ellipse cx="32" cy="41" rx="9" ry="7" fill="#F3D9B8"/><circle cx="32" cy="38" r="3" fill="'+INK+'" stroke="none"/><circle cx="26" cy="30" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="30" r="2.2" fill="'+INK+'" stroke="none"/><path d="M32 42v3M32 45q-2.5 2.5-5 0M32 45q2.5 2.5 5 0" fill="none" stroke-width="2.2"/>'),
elephant:art('<ellipse cx="37" cy="38" rx="19" ry="16" fill="#8FB8DE"/><circle cx="19" cy="30" r="13" fill="#8FB8DE"/><ellipse cx="24" cy="29" rx="9" ry="10.5" fill="#6E9CC9"/><path d="M10 30c-4 4-4 12 1 16 3 2 6 0 5-3-2-4-2-8 1-11z" fill="#8FB8DE"/><circle cx="15" cy="26" r="2.1" fill="'+INK+'" stroke="none"/><path d="M30 52v6M44 52v6" fill="none"/>'),
fish:art('<ellipse cx="29" cy="34" rx="16" ry="11" fill="#2EC4B6"/><path d="M44 34 56 25v18z" fill="#2EC4B6"/><circle cx="22" cy="31" r="2.1" fill="'+INK+'" stroke="none"/><circle cx="52" cy="17" r="2.4" fill="none" stroke-width="2.2"/>'),
grapes:art('<circle cx="25" cy="27" r="6.5" fill="#A06CD5"/><circle cx="39" cy="27" r="6.5" fill="#A06CD5"/><circle cx="18" cy="38" r="6.5" fill="#A06CD5"/><circle cx="32" cy="38" r="6.5" fill="#A06CD5"/><circle cx="46" cy="38" r="6.5" fill="#A06CD5"/><circle cx="25" cy="49" r="6.5" fill="#A06CD5"/><circle cx="39" cy="49" r="6.5" fill="#A06CD5"/><path d="M32 20c0-6 3-9 8-11-1 6-3 9-8 11z" fill="#58B368"/>'),
hat:art('<path d="M21 42c0-15 4-25 11-25s11 10 11 25" fill="#FFC93C"/><path d="M22 33c6 4 14 4 20 0l1.4 7c-7 4-15.4 4-22.8 0z" fill="#FF6B57"/><ellipse cx="32" cy="43" rx="22" ry="7.5" fill="#FFC93C"/>'),
icecream:art('<path d="M22 31h20L32 56z" fill="#E0A458"/><circle cx="32" cy="22" r="11" fill="#F7A1C4"/><circle cx="32" cy="8.5" r="3.6" fill="#E23E57"/>'),
juice:art('<path d="M22 14h20l-3 38H25z" fill="#BEE9E8"/><path d="M24.5 26h15l-2.3 26H26.8z" fill="#FF9F1C" stroke="none"/><path d="M37 14 45 4" stroke="#E23E57" stroke-width="4"/>'),
kite:art('<path d="M32 6 50 26 32 46 14 26z" fill="#FF6B57"/><path d="M32 6v40M14 26h36" fill="none" stroke-width="2.2"/><path d="M32 46c-3 5 3 7 0 14" fill="none"/><rect x="23" y="49" width="7" height="7" rx="1.5" fill="#2EC4B6" transform="rotate(40 26.5 52.5)"/>'),
lion:art('<circle cx="49" cy="34" r="7" fill="#E8863A"/><circle cx="44" cy="46" r="7" fill="#E8863A"/><circle cx="32" cy="51" r="7" fill="#E8863A"/><circle cx="20" cy="46" r="7" fill="#E8863A"/><circle cx="15" cy="34" r="7" fill="#E8863A"/><circle cx="20" cy="22" r="7" fill="#E8863A"/><circle cx="32" cy="17" r="7" fill="#E8863A"/><circle cx="44" cy="22" r="7" fill="#E8863A"/><circle cx="32" cy="34" r="14" fill="#FFC069"/><circle cx="27" cy="31" r="2.1" fill="'+INK+'" stroke="none"/><circle cx="37" cy="31" r="2.1" fill="'+INK+'" stroke="none"/><ellipse cx="32" cy="39" rx="7" ry="5.2" fill="#FFF3DE"/><path d="M29.4 37h5.2L32 40.2z" fill="'+INK+'" stroke="none"/>'),
moon:art('<path d="M42 8A25 25 0 1 0 42 56 40 40 0 0 1 42 8z" fill="#FFE08A"/>'),
nest:art('<ellipse cx="26" cy="31" rx="6" ry="8" fill="#BEE9E8"/><ellipse cx="38" cy="31" rx="6" ry="8" fill="#DFF3F1"/><path d="M13 36h38c0 13-8.5 19-19 19S13 49 13 36z" fill="#B98A5E"/>'),
orange:art('<circle cx="32" cy="36" r="17" fill="#FF9F1C"/><path d="M34 19c1-5 5-8 10-8-1 5-4 8-10 8z" fill="#58B368"/>'),
penguin:art('<ellipse cx="32" cy="34" rx="16" ry="20" fill="#3A2E39"/><ellipse cx="32" cy="38" rx="10" ry="14" fill="#fff" stroke="none"/><circle cx="27" cy="23" r="3.2" fill="#fff" stroke="none"/><circle cx="37" cy="23" r="3.2" fill="#fff" stroke="none"/><path d="M27.5 28h9L32 33.5z" fill="#FF9F1C"/><path d="M26 55l-3 3M38 55l3 3" stroke="#FF9F1C" stroke-width="4"/>'),
queen:art('<path d="M15 45 11.5 21l10.5 8L32 15l10 14 10.5-8L49 45z" fill="#FFC93C"/><rect x="15" y="45" width="34" height="8" rx="3.5" fill="#FFC93C"/><circle cx="32" cy="36" r="3" fill="#E23E57" stroke-width="2.2"/>'),
rainbow:art('<path d="M8 47a24 24 0 0 1 48 0" stroke="#E23E57" stroke-width="6" fill="none"/><path d="M15 47a17 17 0 0 1 34 0" stroke="#FF9F1C" stroke-width="6" fill="none"/><path d="M22 47a10 10 0 0 1 20 0" stroke="#58B368" stroke-width="6" fill="none"/>'),
sun:art('<circle cx="32" cy="32" r="15" fill="#FFD24C"/><path d="M32 17V7M32 47v10M17 32H7M47 32h10M21.5 21.5 14.5 14.5M42.5 21.5l7-7M21.5 42.5l-7 7M42.5 42.5l7 7" fill="none"/><circle cx="27.5" cy="30" r="1.8" fill="'+INK+'" stroke="none"/><circle cx="36.5" cy="30" r="1.8" fill="'+INK+'" stroke="none"/><path d="M27 35c3 3 7 3 10 0" fill="none" stroke-width="2.4"/>'),
tree:art('<path d="M29 40h6v18h-6z" fill="#A9713B"/><circle cx="32" cy="22" r="14" fill="#58B368"/><circle cx="20" cy="31" r="10.5" fill="#6FC27C"/><circle cx="44" cy="31" r="10.5" fill="#6FC27C"/>'),
umbrella:art('<path d="M8 33a24 24 0 0 1 48 0z" fill="#2EC4B6"/><path d="M32 33v18a5 5 0 0 1-10 0" fill="none"/><path d="M32 9V5"/>'),
violin:art('<circle cx="32" cy="42" r="11.5" fill="#C1663B"/><circle cx="32" cy="29" r="8" fill="#C1663B"/><path d="M32 21V6" fill="none"/><path d="M32 25v27" stroke="#FFF7E8" stroke-width="1.7"/>'),
watch:art('<rect x="26" y="5" width="12" height="15" rx="3.5" fill="#FF6B57"/><rect x="26" y="44" width="12" height="15" rx="3.5" fill="#FF6B57"/><circle cx="32" cy="32" r="13" fill="#fff"/><path d="M32 32V24M32 32l5.5 3.5" fill="none" stroke-width="2.4"/>'),
xylophone:art('<rect x="11" y="12" width="34" height="8" rx="3.5" fill="#E23E57"/><rect x="13" y="24" width="32" height="8" rx="3.5" fill="#FFC93C"/><rect x="15" y="36" width="30" height="8" rx="3.5" fill="#2EC4B6"/><rect x="17" y="48" width="28" height="8" rx="3.5" fill="#58B368"/>'),
yarn:art('<circle cx="29" cy="33" r="18" fill="#F15BB5"/><path d="M14 28c9-6 20-6 29 1M12 36c10-7 25-7 35 1M17 44c8-5 17-5 25 0" fill="none" stroke="#C94A9B" stroke-width="2.4"/>'),
zebra:art('<path d="M26 15c4-4 8-4 12 0l-2 6H28z" fill="#3A2E39" stroke="none"/><ellipse cx="32" cy="35" rx="15" ry="18" fill="#F6F3EC"/><path d="M22 30h7M35 27h7M23 39h6" stroke-width="2.6"/><ellipse cx="32" cy="47" rx="9.5" ry="7.5" fill="#3A2E39" stroke="none"/><circle cx="26" cy="29" r="2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="29" r="2" fill="'+INK+'" stroke="none"/>'),
cow:art('<ellipse cx="13" cy="27" rx="6.5" ry="4.5" fill="#fff" transform="rotate(-22 13 27)"/><ellipse cx="51" cy="27" rx="6.5" ry="4.5" fill="#fff" transform="rotate(22 51 27)"/><ellipse cx="32" cy="33" rx="17" ry="15" fill="#fff"/><ellipse cx="32" cy="44" rx="11.5" ry="8" fill="#F6B8C1"/><circle cx="25" cy="29" r="2" fill="'+INK+'" stroke="none"/><circle cx="39" cy="29" r="2" fill="'+INK+'" stroke="none"/>'),
duck:art('<ellipse cx="28" cy="38" rx="17" ry="13" fill="#FFD24C"/><circle cx="42" cy="23" r="10" fill="#FFD24C"/><path d="M51 21h8l-8 5z" fill="#FF9F1C"/><circle cx="44" cy="21" r="1.9" fill="'+INK+'" stroke="none"/>'),
frog:art('<circle cx="22" cy="24" r="8" fill="#58B368"/><circle cx="42" cy="24" r="8" fill="#58B368"/><ellipse cx="32" cy="38" rx="19" ry="15" fill="#58B368"/><circle cx="22" cy="24" r="3.4" fill="'+INK+'" stroke="none"/><circle cx="42" cy="24" r="3.4" fill="'+INK+'" stroke="none"/><path d="M21 38c7 5 15 5 22 0" fill="none"/>'),
bird:art('<circle cx="30" cy="34" r="16" fill="#4A90D9"/><path d="M45 31l10 3.5-10 4z" fill="#FF9F1C"/><circle cx="38" cy="28" r="2" fill="'+INK+'" stroke="none"/><path d="M27 18c1-4 4-6 7-6" fill="none"/>'),
heart:art('<path d="M32 54C18 44 10 35 10 25a11 11 0 0 1 22-3 11 11 0 0 1 22 3c0 10-8 19-22 29z" fill="#E23E57"/>'),
pig:art('<circle cx="32" cy="36" r="17" fill="#F9B8C4"/><path d="M17 24 12 12l14 6z" fill="#F9B8C4"/><path d="M47 24 52 12 38 18z" fill="#F9B8C4"/><ellipse cx="32" cy="40" rx="9" ry="7" fill="#F2909F"/><circle cx="29" cy="40" r="1.6" fill="'+INK+'" stroke="none"/><circle cx="35" cy="40" r="1.6" fill="'+INK+'" stroke="none"/><circle cx="25" cy="31" r="2" fill="'+INK+'" stroke="none"/><circle cx="39" cy="31" r="2" fill="'+INK+'" stroke="none"/>'),
sheep:art('<circle cx="20" cy="24" r="9" fill="#F6F3EC"/><circle cx="32" cy="19" r="10" fill="#F6F3EC"/><circle cx="44" cy="24" r="9" fill="#F6F3EC"/><circle cx="24" cy="32" r="8" fill="#F6F3EC"/><circle cx="40" cy="32" r="8" fill="#F6F3EC"/><ellipse cx="32" cy="33" rx="10" ry="11" fill="#F3D9B8" stroke="none"/><circle cx="28.5" cy="30" r="2" fill="'+INK+'" stroke="none"/><circle cx="35.5" cy="30" r="2" fill="'+INK+'" stroke="none"/><ellipse cx="32" cy="38" rx="3" ry="2.4" fill="#F6B8C1" stroke="none"/>'),
horse:art('<path d="M24 12c-2-5 0-9 4-11 1 4 3 6 6 7z" fill="#3A2E39" stroke="none"/><circle cx="32" cy="34" r="16" fill="#B0763B"/><path d="M18 20c-6 2-9 8-8 14l6-2z" fill="#3A2E39" stroke="none"/><ellipse cx="32" cy="42" rx="10" ry="7" fill="#F3D9B8"/><circle cx="26" cy="30" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="30" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="29" cy="41" r="1.6" fill="'+INK+'" stroke="none"/><circle cx="35" cy="41" r="1.6" fill="'+INK+'" stroke="none"/>'),
chicken:art('<path d="M24 16c-1-5 2-8 5-8M32 14c0-5 4-7 8-6" fill="none" stroke="#E23E57" stroke-width="4"/><circle cx="32" cy="34" r="16" fill="#FFF3DC"/><path d="M32 22c-2-4 0-7 3-8" fill="none" stroke="#E23E57" stroke-width="3.4"/><circle cx="26" cy="30" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="30" r="2.2" fill="'+INK+'" stroke="none"/><path d="M30 36h10l-5 5z" fill="#FF9F1C"/><path d="M32 46q0 3-3 3M32 46q0 3 3 3" fill="none" stroke="#E23E57" stroke-width="2.4"/>'),
rabbit:art('<ellipse cx="24" cy="14" rx="5" ry="12" fill="#F6F3EC"/><ellipse cx="40" cy="14" rx="5" ry="12" fill="#F6F3EC"/><ellipse cx="24" cy="14" rx="2.4" ry="8" fill="#F6B8C1" stroke="none"/><ellipse cx="40" cy="14" rx="2.4" ry="8" fill="#F6B8C1" stroke="none"/><circle cx="32" cy="40" r="15" fill="#F6F3EC"/><circle cx="27" cy="37" r="2" fill="'+INK+'" stroke="none"/><circle cx="37" cy="37" r="2" fill="'+INK+'" stroke="none"/><path d="M30 43h4l-2 2.6z" fill="#F2909F"/><path d="M30 47v3M34 47v3" fill="none" stroke-width="2"/>'),
mouse:art('<circle cx="13" cy="20" r="8.5" fill="#C9CCD3"/><circle cx="13" cy="20" r="4" fill="#F6B8C1" stroke="none"/><circle cx="51" cy="20" r="8.5" fill="#C9CCD3"/><circle cx="51" cy="20" r="4" fill="#F6B8C1" stroke="none"/><circle cx="32" cy="38" r="14" fill="#C9CCD3"/><circle cx="27" cy="34" r="2" fill="'+INK+'" stroke="none"/><circle cx="37" cy="34" r="2" fill="'+INK+'" stroke="none"/><circle cx="32" cy="40" r="2.6" fill="#F2909F" stroke="none"/><path d="M12 44c-5 2-7 6-6 10" fill="none" stroke-width="2.4"/>'),
monkey:art('<circle cx="14" cy="30" r="7" fill="#A9713B"/><circle cx="50" cy="30" r="7" fill="#A9713B"/><circle cx="14" cy="30" r="3.4" fill="#F3D9B8" stroke="none"/><circle cx="50" cy="30" r="3.4" fill="#F3D9B8" stroke="none"/><circle cx="32" cy="34" r="16" fill="#A9713B"/><ellipse cx="32" cy="33" rx="11" ry="12" fill="#F3D9B8" stroke="none"/><circle cx="26" cy="29" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="29" r="2.2" fill="'+INK+'" stroke="none"/><path d="M29 37q3 3 6 0" fill="none" stroke-width="2.2"/>'),
bear:art('<circle cx="17" cy="20" r="8" fill="#A9713B"/><circle cx="47" cy="20" r="8" fill="#A9713B"/><circle cx="17" cy="20" r="4" fill="#F3D9B8" stroke="none"/><circle cx="47" cy="20" r="4" fill="#F3D9B8" stroke="none"/><circle cx="32" cy="36" r="17" fill="#A9713B"/><ellipse cx="32" cy="42" rx="9" ry="7" fill="#F3D9B8"/><circle cx="27" cy="31" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="37" cy="31" r="2.2" fill="'+INK+'" stroke="none"/><path d="M29.4 40h5.2L32 43.2z" fill="'+INK+'" stroke="none"/>'),
wolf:art('<path d="M16 22 12 8l13 7z" fill="#8A8D93"/><path d="M48 22 52 8 39 15z" fill="#8A8D93"/><circle cx="32" cy="36" r="16" fill="#8A8D93"/><ellipse cx="32" cy="42" rx="9" ry="7" fill="#E8E6E1"/><circle cx="26" cy="31" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="31" r="2.2" fill="'+INK+'" stroke="none"/><path d="M29.4 40h5.2L32 43.2z" fill="'+INK+'" stroke="none"/>'),
fox:art('<path d="M16 22 12 8l13 7z" fill="#FF9F1C"/><path d="M48 22 52 8 39 15z" fill="#FF9F1C"/><circle cx="32" cy="36" r="16" fill="#FF9F1C"/><path d="M32 54c-7 0-12-5-12-11h24c0 6-5 11-12 11z" fill="#FFF3DE"/><circle cx="26" cy="31" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="31" r="2.2" fill="'+INK+'" stroke="none"/><path d="M29.4 40h5.2L32 43.2z" fill="'+INK+'" stroke="none"/>'),
deer:art('<path d="M22 14c-4-6-10-8-14-6 3 2 5 5 5 8M42 14c4-6 10-8 14-6-3 2-5 5-5 8" fill="none"/><path d="M20 16V6M44 16V6" fill="none"/><path d="M20 10l-5-3M44 10l5-3" fill="none" stroke-width="2.4"/><circle cx="32" cy="36" r="15" fill="#D9A05B"/><ellipse cx="32" cy="43" rx="8" ry="6" fill="#F6E8D8"/><circle cx="26" cy="32" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="32" r="2.2" fill="'+INK+'" stroke="none"/><path d="M29.6 41h4.8L32 44z" fill="'+INK+'" stroke="none"/>'),
tiger:art('<circle cx="17" cy="20" r="8" fill="#FF9F1C"/><circle cx="47" cy="20" r="8" fill="#FF9F1C"/><circle cx="32" cy="36" r="17" fill="#FF9F1C"/><path d="M22 22h8M34 22h8M20 30h6M38 30h6M21 38h5M38 38h5" stroke-width="2.4"/><ellipse cx="32" cy="43" rx="8" ry="6" fill="#FFF3DE"/><circle cx="26" cy="32" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="32" r="2.2" fill="'+INK+'" stroke="none"/><path d="M29.6 42h4.8L32 45z" fill="'+INK+'" stroke="none"/>'),
panda:art('<circle cx="16" cy="19" r="7.5" fill="#3A2E39" stroke="none"/><circle cx="48" cy="19" r="7.5" fill="#3A2E39" stroke="none"/><circle cx="32" cy="36" r="17" fill="#F6F3EC"/><ellipse cx="25" cy="31" rx="6" ry="7.5" fill="#3A2E39" stroke="none"/><ellipse cx="39" cy="31" rx="6" ry="7.5" fill="#3A2E39" stroke="none"/><circle cx="25.5" cy="30.5" r="2.4" fill="#fff" stroke="none"/><circle cx="39.5" cy="30.5" r="2.4" fill="#fff" stroke="none"/><ellipse cx="32" cy="42" rx="6" ry="4.6" fill="#3A2E39" stroke="none"/><path d="M29.6 41h4.8L32 44.4z" fill="#3A2E39" stroke="none"/>'),
koala:art('<circle cx="14" cy="24" r="10" fill="#8A8D93"/><circle cx="50" cy="24" r="10" fill="#8A8D93"/><circle cx="14" cy="24" r="5" fill="#C9CCD3" stroke="none"/><circle cx="50" cy="24" r="5" fill="#C9CCD3" stroke="none"/><circle cx="32" cy="36" r="16" fill="#8A8D93"/><ellipse cx="32" cy="41" rx="6.5" ry="8" fill="#3A2E39" stroke="none"/><circle cx="25" cy="30" r="2.4" fill="'+INK+'" stroke="none"/><circle cx="39" cy="30" r="2.4" fill="'+INK+'" stroke="none"/>'),
kangaroo:art('<ellipse cx="20" cy="18" rx="5" ry="11" fill="#D9A05B" transform="rotate(-16 20 18)"/><ellipse cx="44" cy="18" rx="5" ry="11" fill="#D9A05B" transform="rotate(16 44 18)"/><circle cx="32" cy="36" r="15" fill="#D9A05B"/><ellipse cx="32" cy="44" rx="8" ry="6" fill="#F6E8D8"/><circle cx="26" cy="32" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="32" r="2.2" fill="'+INK+'" stroke="none"/><path d="M29.6 43h4.8L32 46z" fill="'+INK+'" stroke="none"/>'),
giraffe:art('<path d="M24 12c-1-5 0-8 2-10M40 12c1-5 0-8-2-10" fill="none"/><circle cx="26" cy="3" r="3" fill="#D9A05B"/><circle cx="38" cy="3" r="3" fill="#D9A05B"/><circle cx="32" cy="36" r="16" fill="#EED9A8"/><circle cx="24" cy="26" r="2.4" fill="#B0763B" stroke="none"/><circle cx="36" cy="24" r="2.2" fill="#B0763B" stroke="none"/><ellipse cx="32" cy="44" rx="9" ry="6.5" fill="#F6E8D8"/><circle cx="26" cy="32" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="32" r="2.2" fill="'+INK+'" stroke="none"/><path d="M29.6 43h4.8L32 46z" fill="'+INK+'" stroke="none"/>'),
camel:art('<ellipse cx="18" cy="16" rx="4.6" ry="9" fill="#E0A458" transform="rotate(-18 18 16)"/><ellipse cx="46" cy="16" rx="4.6" ry="9" fill="#E0A458" transform="rotate(18 46 16)"/><circle cx="32" cy="36" r="15" fill="#E0A458"/><ellipse cx="32" cy="43" rx="9" ry="6.5" fill="#F6E8D8"/><circle cx="25" cy="30" r="2.4" fill="'+INK+'" stroke="none"/><circle cx="39" cy="30" r="2.4" fill="'+INK+'" stroke="none"/><path d="M27 27q-4-4-7-3M37 27q4-4 7-3" fill="none" stroke-width="2"/>'),
hippo:art('<circle cx="17" cy="20" r="6.5" fill="#9B7EB8" stroke="none"/><circle cx="47" cy="20" r="6.5" fill="#9B7EB8" stroke="none"/><ellipse cx="32" cy="38" rx="19" ry="16" fill="#9B7EB8"/><circle cx="24" cy="32" r="2.4" fill="'+INK+'" stroke="none"/><circle cx="40" cy="32" r="2.4" fill="'+INK+'" stroke="none"/><ellipse cx="32" cy="44" rx="12" ry="8" fill="#C3A6E8" stroke="none"/><circle cx="27" cy="44" r="1.8" fill="'+INK+'" stroke="none"/><circle cx="37" cy="44" r="1.8" fill="'+INK+'" stroke="none"/>'),
rhino:art('<circle cx="32" cy="36" r="17" fill="#A9AAB0"/><path d="M30 22 34 6 40 24z" fill="#E8E6E1"/><circle cx="25" cy="32" r="2.4" fill="'+INK+'" stroke="none"/><circle cx="39" cy="32" r="2.4" fill="'+INK+'" stroke="none"/><ellipse cx="32" cy="44" rx="10" ry="7" fill="#C9CCD3" stroke="none"/><circle cx="29" cy="43" r="1.8" fill="'+INK+'" stroke="none"/><circle cx="35" cy="43" r="1.8" fill="'+INK+'" stroke="none"/>'),
turtle:art('<path d="M12 42a20 18 0 0 1 40 0z" fill="#58B368"/><path d="M20 42h24M16 34h32M22 28h20" fill="none" stroke-width="2.2"/><circle cx="32" cy="14" r="7" fill="#8FCF7C"/><circle cx="30" cy="13" r="1.6" fill="'+INK+'" stroke="none"/><circle cx="34" cy="13" r="1.6" fill="'+INK+'" stroke="none"/><path d="M30 17h4l-2 2z" fill="'+INK+'" stroke="none"/>'),
crocodile:art('<ellipse cx="30" cy="36" rx="20" ry="12" fill="#6FC27C"/><path d="M10 40h40" stroke-width="2.4"/><path d="M14 43l3 4 3-4 3 4 3-4 3 4 3-4 3 4 3-4 3 4 3-4 3 4 3-4" fill="none" stroke-width="2"/><circle cx="30" cy="26" r="9" fill="#6FC27C"/><circle cx="27" cy="25" r="2" fill="'+INK+'" stroke="none"/><circle cx="33" cy="25" r="2" fill="'+INK+'" stroke="none"/><path d="M50 34l8 2-8 4z" fill="#6FC27C"/>'),
snake:art('<path d="M12 48c-4-8 4-14 11-12s12 8 7 12-13 1-10-6c3-6 13-4 22-14 4-4 8-4 10 1" fill="none" stroke-width="7"/><circle cx="53" cy="27" r="5" fill="#58B368"/><circle cx="55" cy="25" r="1.6" fill="'+INK+'" stroke="none"/><path d="M58 31l5 2M58 31l5-1" stroke="#E23E57" stroke-width="2" fill="none"/>'),
bat:art('<circle cx="32" cy="34" r="13" fill="#4A4E57"/><path d="M19 28 8 18c2 8 0 12-4 14 6 2 9 6 10 10zM45 28 56 18c-2 8 0 12 4 14-6 2-9 6-10 10z" fill="#4A4E57"/><path d="M22 16 26 8l4 8M38 16 42 8l4 8" fill="none" stroke-width="2.4"/><circle cx="27" cy="31" r="2.2" fill="#FFC93C" stroke="none"/><circle cx="37" cy="31" r="2.2" fill="#FFC93C" stroke="none"/><path d="M30 40v3M34 40v3" stroke="#fff" stroke-width="2"/>'),
flamingo:art('<path d="M26 54c-6-2-8-10-2-14" fill="none" stroke-width="5"/><circle cx="32" cy="20" r="10" fill="#F98BA4"/><path d="M32 30c-2 8 0 14-4 20" fill="none" stroke-width="5"/><path d="M41 18c5 0 8 2 9 5l-9 2z" fill="#3A2E39"/><circle cx="34" cy="17" r="1.8" fill="'+INK+'" stroke="none"/>'),
peacock:art('<path d="M26 12c-2-5 0-9 4-11 1 4 3 6 5 7z" fill="#2EC4B6"/><circle cx="26" cy="14" r="3" fill="#FFC93C"/><circle cx="33" cy="9" r="3" fill="#2EC4B6"/><circle cx="33" cy="9" r="1.4" fill="'+INK+'" stroke="none"/><circle cx="32" cy="32" r="13" fill="#4A90D9"/><circle cx="28" cy="30" r="2" fill="#fff" stroke="none"/><circle cx="36" cy="30" r="2" fill="#fff" stroke="none"/><circle cx="28" cy="30.6" r="1" fill="'+INK+'" stroke="none"/><circle cx="36" cy="30.6" r="1" fill="'+INK+'" stroke="none"/><path d="M38 34l6 2-6 3z" fill="#FF9F1C"/>'),
seal:art('<ellipse cx="32" cy="40" rx="18" ry="15" fill="#BEE9E8"/><path d="M22 27c2-5 8-7 12-5" fill="none" stroke-width="2.4"/><circle cx="32" cy="26" r="8" fill="#BEE9E8"/><circle cx="29" cy="25" r="1.8" fill="'+INK+'" stroke="none"/><circle cx="35" cy="25" r="1.8" fill="'+INK+'" stroke="none"/><ellipse cx="32" cy="30" rx="3" ry="2.2" fill="'+INK+'" stroke="none"/><path d="M24 34h4M36 34h4M25 37h3M36 37h3" stroke-width="1.8"/>'),
dolphin:art('<path d="M10 36c8-14 26-20 40-14 4 2 8 6 8 10-6-2-10 0-14 4-8 8-24 8-34 0z" fill="#8FB8DE"/><path d="M30 22c0-5 3-8 7-9-1 4-2 6-4 8z" fill="#8FB8DE"/><circle cx="46" cy="32" r="2" fill="'+INK+'" stroke="none"/><path d="M44 40q-4 3-8 2" fill="none" stroke-width="2.2"/>'),
whale:art('<path d="M8 38c2-14 16-22 30-20 12 2 18 10 18 18 0 8-8 14-24 14S9 46 8 38z" fill="#4A90D9"/><path d="M52 20c3-3 7-4 10-3-1 4-3 6-6 7z" fill="#4A90D9"/><path d="M18 20c-2-6 0-11 4-14 0 5 2 8 5 10z" fill="#4A90D9"/><circle cx="20" cy="34" r="2.4" fill="'+INK+'" stroke="none"/><path d="M14 42q5 4 10 2" fill="none" stroke-width="2.2"/>'),
octopus:art('<path d="M14 34a18 16 0 0 1 36 0z" fill="#A06CD5"/><path d="M14 34c0 5-3 7-6 8M22 36c0 6-4 8-6 12M32 37v13M42 36c0 6 4 8 6 12M50 34c0 5 3 7 6 8" fill="none" stroke-width="4"/><circle cx="25" cy="30" r="2.4" fill="#fff" stroke="none"/><circle cx="39" cy="30" r="2.4" fill="#fff" stroke="none"/><circle cx="25" cy="30.6" r="1.2" fill="'+INK+'" stroke="none"/><circle cx="39" cy="30.6" r="1.2" fill="'+INK+'" stroke="none"/>'),
crab:art('<circle cx="32" cy="36" r="14" fill="#E23E57"/><path d="M18 28 8 20M46 28 56 20" fill="none" stroke-width="4"/><circle cx="7" cy="17" r="5" fill="#E23E57"/><circle cx="57" cy="17" r="5" fill="#E23E57"/><path d="M22 20V12M42 20V12" fill="none" stroke-width="2.6"/><circle cx="22" cy="10" r="3.4" fill="#fff"/><circle cx="42" cy="10" r="3.4" fill="#fff"/><circle cx="22" cy="10" r="1.5" fill="'+INK+'" stroke="none"/><circle cx="42" cy="10" r="1.5" fill="'+INK+'" stroke="none"/><path d="M26 40h4M34 40h4" stroke-width="2.2"/><path d="M20 48l-4 4M44 48l4 4M26 50l-2 4M38 50l2 4" fill="none" stroke-width="2.2"/>'),
jellyfish:art('<path d="M12 34a20 18 0 0 1 40 0z" fill="#F7A1C4"/><path d="M16 34c-1 6 1 10-2 14M24 36c0 7 1 10-1 16M32 36v17M40 36c0 7-1 10 1 16M48 34c1 6-1 10 2 14" fill="none" stroke-width="3"/><circle cx="25" cy="27" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="39" cy="27" r="2.2" fill="'+INK+'" stroke="none"/>'),
spider:art('<circle cx="32" cy="36" r="11" fill="#4A4E57"/><path d="M22 30 10 24M22 36H8M22 42 12 48M42 30l12-6M42 36h14M42 42l10 6" fill="none" stroke-width="2.6"/><circle cx="28" cy="32" r="2.2" fill="#fff" stroke="none"/><circle cx="36" cy="32" r="2.2" fill="#fff" stroke="none"/><circle cx="28" cy="32.6" r="1.1" fill="'+INK+'" stroke="none"/><circle cx="36" cy="32.6" r="1.1" fill="'+INK+'" stroke="none"/>'),
ant:art('<circle cx="32" cy="14" r="7" fill="#8B5A33"/><path d="M29 8 24 2M35 8l5-6" fill="none" stroke-width="2"/><ellipse cx="32" cy="30" rx="8" ry="7" fill="#8B5A33"/><ellipse cx="32" cy="46" rx="10" ry="8" fill="#8B5A33"/><path d="M24 28l-8-4M40 28l8-4M24 32H14M40 32h10M25 36l-9 6M39 36l9 6" fill="none" stroke-width="2.2"/><circle cx="29" cy="12" r="1.6" fill="#fff" stroke="none"/><circle cx="35" cy="12" r="1.6" fill="#fff" stroke="none"/>'),
squirrel:art('<path d="M18 22 14 8l13 7z" fill="#D9A05B"/><path d="M46 22 50 8 37 15z" fill="#D9A05B"/><circle cx="32" cy="36" r="16" fill="#D9A05B"/><path d="M26 44h12l-2 6h-8z" fill="#F6E8D8" stroke="none"/><circle cx="26" cy="32" r="2.2" fill="'+INK+'" stroke="none"/><circle cx="38" cy="32" r="2.2" fill="'+INK+'" stroke="none"/><ellipse cx="32" cy="40" rx="7" ry="5" fill="#F6E8D8"/><path d="M30 42h4l-2 2.6z" fill="'+INK+'" stroke="none"/>'),
hedgehog:art('<path d="M12 44 20 32 14 30 24 20 20 18 32 12 30 20 42 16 38 26 50 26 44 32 52 38 42 40 46 46z" fill="#A9713B"/><circle cx="44" cy="40" r="11" fill="#F3D9B8"/><circle cx="44" cy="36" r="2" fill="'+INK+'" stroke="none"/><ellipse cx="49" cy="42" rx="3.2" ry="2.4" fill="'+INK+'" stroke="none"/>'),
owl2:'<svg viewBox="0 0 64 64" style="width:100%;height:100%"><use href="#owl"/></svg>'};
var LETTER_WORDS=[['A','Apple','apple'],['B','Ball','ball'],['C','Cat','cat'],['D','Dog','dog'],['E','Elephant','elephant'],
['F','Fish','fish'],['G','Grapes','grapes'],['H','Hat','hat'],['I','Ice cream','icecream'],['J','Juice','juice'],
['K','Kite','kite'],['L','Lion','lion'],['M','Moon','moon'],['N','Nest','nest'],['O','Orange','orange'],
['P','Penguin','penguin'],['Q','Queen','queen'],['R','Rainbow','rainbow'],['S','Sun','sun'],['T','Tree','tree'],
['U','Umbrella','umbrella'],['V','Violin','violin'],['W','Watch','watch'],['X','Xylophone','xylophone'],
['Y','Yarn','yarn'],['Z','Zebra','zebra']];
var ABC='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var TRACE={
A:[[[50,12],[28,88]],[[50,12],[72,88]],[[35,60],[65,60]]],B:[[[32,10],[32,90]],[[32,10],[56,10],[65,19],[65,31],[56,40],[32,40]],[[32,40],[60,40],[70,52],[70,76],[58,90],[32,90]]],
C:[[[74,26],[62,13],[48,10],[32,15],[22,29],[18,50],[22,71],[32,85],[48,90],[62,87],[74,74]]],D:[[[32,10],[32,90]],[[32,10],[54,10],[68,22],[73,50],[68,78],[54,90],[32,90]]],
E:[[[32,10],[32,90]],[[32,10],[72,10]],[[32,50],[64,50]],[[32,90],[72,90]]],F:[[[32,10],[32,90]],[[32,10],[72,10]],[[32,50],[64,50]]],
G:[[[74,26],[62,13],[48,10],[32,15],[22,29],[18,50],[22,71],[32,85],[48,90],[62,87],[72,76]],[[72,76],[72,62],[56,62]]],H:[[[28,10],[28,90]],[[72,10],[72,90]],[[28,50],[72,50]]],
I:[[[50,10],[50,90]],[[32,10],[68,10]],[[32,90],[68,90]]],J:[[[64,10],[64,64],[58,82],[44,90],[30,84],[26,68]]],
K:[[[30,10],[30,90]],[[70,10],[30,52]],[[42,42],[72,90]]],L:[[[30,10],[30,88],[72,88]]],
M:[[[26,90],[26,10],[50,58],[74,10],[74,90]]],N:[[[28,90],[28,10],[72,88],[72,10]]],
O:[[[50,10],[31,14],[20,30],[18,50],[22,70],[33,86],[50,90],[67,86],[78,70],[82,50],[78,30],[67,14],[50,10]]],P:[[[32,10],[32,90]],[[32,10],[58,10],[68,20],[68,40],[58,50],[32,50]]],
Q:[[[50,10],[31,14],[20,30],[18,50],[22,70],[33,86],[50,90],[67,86],[78,70],[82,50],[78,30],[67,14],[50,10]],[[60,68],[82,92]]],R:[[[32,10],[32,90]],[[32,10],[58,10],[68,20],[68,40],[58,50],[32,50]],[[46,50],[72,90]]],
S:[[[70,20],[62,11],[46,10],[33,16],[30,27],[34,37],[46,44],[58,50],[66,59],[68,72],[60,84],[45,89],[32,84],[27,74]]],T:[[[22,10],[78,10]],[[50,10],[50,90]]],
U:[[[26,10],[26,58],[31,78],[44,90],[56,90],[69,78],[74,58],[74,10]]],V:[[[26,10],[50,88],[74,10]]],
W:[[[20,10],[32,88],[50,34],[68,88],[80,10]]],X:[[[26,10],[74,90]],[[74,10],[26,90]]],
Y:[[[26,10],[50,48]],[[74,10],[50,48],[50,90]]],Z:[[[26,10],[74,10],[26,88],[74,88]]]};
/* 50 animals */
var ANIMALS=[
 {id:'lion',name:'Lion',habitat:'the sunny savanna',food:'meat',fact:'A lion roar can be heard 8 kilometres away!',icon:'lion',snd:'roar'},
 {id:'elephant',name:'Elephant',habitat:'grasslands and forests',food:'leaves and fruit',fact:'Elephants sip water with their trunk!',icon:'elephant',snd:'trumpet'},
 {id:'cow',name:'Cow',habitat:'the green farm',food:'fresh grass',fact:'Cows have four tummies to digest all that grass!',icon:'cow',snd:'moo'},
 {id:'dog',name:'Dog',habitat:'a cosy home',food:'dog food and treats',fact:'A dog nose can smell 10,000 times better than yours!',icon:'dog',snd:'bark'},
 {id:'cat',name:'Cat',habitat:'a cosy home',food:'fish',fact:'Cats sleep for 16 hours almost every day!',icon:'cat',snd:'meow'},
 {id:'duck',name:'Duck',habitat:'the pond',food:'plants and insects',fact:'Duck feathers are waterproof. Rain slides right off!',icon:'duck',snd:'quack'},
 {id:'frog',name:'Frog',habitat:'the pond and reeds',food:'flies and insects',fact:'Frogs can breathe through their skin!',icon:'frog',snd:'croak'},
 {id:'bird',name:'Bird',habitat:'the tall trees',food:'seeds and berries',fact:'Birds sing in the morning to say hello to the sun!',icon:'bird',snd:'tweet'},
 {id:'pig',name:'Pig',habitat:'the farmyard',food:'corn and veggies',fact:'Pigs are super smart and love belly rubs!',icon:'pig',snd:'oink'},
 {id:'sheep',name:'Sheep',habitat:'green meadows',food:'grass',fact:'Sheep wool is cut once a year and made into sweaters!',icon:'sheep',snd:'baa'},
 {id:'horse',name:'Horse',habitat:'stables and fields',food:'hay and apples',fact:'Horses can sleep standing up!',icon:'horse',snd:'neigh'},
 {id:'chicken',name:'Chicken',habitat:'the farmyard',food:'seeds and grains',fact:'A hen can lay an egg almost every day!',icon:'chicken',snd:'cluck'},
 {id:'rabbit',name:'Rabbit',habitat:'burrows and meadows',food:'carrots and greens',fact:'Rabbit teeth never stop growing. Chewing keeps them just right!',icon:'rabbit',snd:'squeak'},
 {id:'mouse',name:'Mouse',habitat:'cozy little holes',food:'cheese and seeds',fact:'A mouse can squeeze through a hole as small as a coin!',icon:'mouse',snd:'squeak'},
 {id:'monkey',name:'Monkey',habitat:'jungle trees',food:'bananas and fruit',fact:'Monkeys use their tails like an extra hand!',icon:'monkey',snd:'chatter'},
 {id:'bear',name:'Bear',habitat:'deep forests',food:'berries and fish',fact:'Bears sleep all winter. It is called hibernation!',icon:'bear',snd:'growl'},
 {id:'wolf',name:'Wolf',habitat:'snowy forests',food:'meat',fact:'Wolves live in family packs and howl to talk to each other!',icon:'wolf',snd:'howl'},
 {id:'fox',name:'Fox',habitat:'forests and fields',food:'berries and mice',fact:'A fox can hear a mouse squeak from far, far away!',icon:'fox',snd:'yip'},
 {id:'deer',name:'Deer',habitat:'quiet forests',food:'leaves and grass',fact:'Male deer grow a brand new set of antlers every year!',icon:'deer',snd:'bleat'},
 {id:'tiger',name:'Tiger',habitat:'jungles',food:'meat',fact:'No two tigers have the same stripes!',icon:'tiger',snd:'roar'},
 {id:'panda',name:'Panda',habitat:'bamboo forests',food:'bamboo',fact:'A panda munches bamboo for 12 hours every day!',icon:'panda',snd:'chirp2'},
 {id:'koala',name:'Koala',habitat:'eucalyptus trees',food:'eucalyptus leaves',fact:'Koalas sleep up to 20 hours a day!',icon:'koala',snd:'chirp2'},
 {id:'kangaroo',name:'Kangaroo',habitat:'the sunny outback',food:'grass and plants',fact:'A baby kangaroo is called a joey and rides in its mum pouch!',icon:'kangaroo',snd:'gruff'},
 {id:'giraffe',name:'Giraffe',habitat:'the savanna',food:'leaves from tall trees',fact:'A giraffe tongue is 50 cm long, and purple!',icon:'giraffe',snd:'gruff'},
 {id:'camel',name:'Camel',habitat:'hot deserts',food:'desert plants',fact:'A camel hump stores fat, not water!',icon:'camel',snd:'gruff'},
 {id:'hippo',name:'Hippo',habitat:'rivers and lakes',food:'grass',fact:'Hippos can close their ears and nose underwater!',icon:'hippo',snd:'gruff'},
 {id:'rhino',name:'Rhino',habitat:'grasslands',food:'grass',fact:'A rhino horn is made of the same stuff as your fingernails!',icon:'rhino',snd:'gruff'},
 {id:'turtle',name:'Turtle',habitat:'ponds and oceans',food:'water plants',fact:'Some turtles live for more than 100 years!',icon:'turtle',snd:'pop2'},
 {id:'crocodile',name:'Crocodile',habitat:'rivers',food:'fish',fact:'Crocodiles have 60 teeth and grow new ones!',icon:'crocodile',snd:'growl'},
 {id:'snake',name:'Snake',habitat:'grass and rocks',food:'eggs and mice',fact:'Snakes smell with their tongue!',icon:'snake',snd:'hiss'},
 {id:'bat',name:'Bat',habitat:'dark caves',food:'fruit and insects',fact:'Bats are the only mammals that can truly fly!',icon:'bat',snd:'squeak'},
 {id:'owl',name:'Owl',habitat:'forests at night',food:'mice and insects',fact:'An owl can turn its head almost all the way around!',icon:'owl',snd:'hoot'},
 {id:'penguin',name:'Penguin',habitat:'icy Antarctica',food:'fish',fact:'Penguins slide on their bellies. It is called tobogganing!',icon:'penguin',snd:'honk'},
 {id:'flamingo',name:'Flamingo',habitat:'warm lagoons',food:'tiny shrimp',fact:'Flamingos are pink because of the shrimp they eat!',icon:'flamingo',snd:'honk'},
 {id:'peacock',name:'Peacock',habitat:'gardens and forests',food:'seeds and berries',fact:'A peacock tail has over 200 shimmering feathers!',icon:'peacock',snd:'squawk2'},
 {id:'seal',name:'Seal',habitat:'icy shores',food:'fish',fact:'Seals clap their flippers when they are happy!',icon:'seal',snd:'bark'},
 {id:'dolphin',name:'Dolphin',habitat:'warm oceans',food:'fish',fact:'Dolphins call each other by special whistle names!',icon:'dolphin',snd:'whistle2'},
 {id:'whale',name:'Whale',habitat:'the deep ocean',food:'tiny krill',fact:'A blue whale heart is as big as a small car!',icon:'whale',snd:'whoosh2'},
 {id:'octopus',name:'Octopus',habitat:'coral reefs',food:'crabs and shells',fact:'An octopus has three hearts and blue blood!',icon:'octopus',snd:'splash2'},
 {id:'crab',name:'Crab',habitat:'sandy beaches',food:'seaweed',fact:'Crabs walk sideways. It is faster for them!',icon:'crab',snd:'clicky'},
 {id:'jellyfish',name:'Jellyfish',habitat:'warm seas',food:'tiny plankton',fact:'Jellyfish have no brain, heart or bones!',icon:'jellyfish',snd:'splash2'},
 {id:'bee',name:'Bee',habitat:'flower fields',food:'flower nectar',fact:'Bees dance to tell friends where the flowers are!',icon:'bee',snd:'buzz'},
 {id:'butterfly',name:'Butterfly',habitat:'gardens',food:'flower nectar',fact:'Butterflies taste with their feet!',icon:'butterfly',snd:'tweet'},
 {id:'ladybug',name:'Ladybug',habitat:'gardens and leaves',food:'tiny aphids',fact:'A ladybug can eat 5,000 aphids in its life!',icon:'ladybug',snd:'buzz'},
 {id:'snail',name:'Snail',habitat:'damp gardens',food:'leaves',fact:'A snail carries its house on its back everywhere!',icon:'snail',snd:'pop2'},
 {id:'spider',name:'Spider',habitat:'gardens and corners',food:'insects',fact:'Spider silk is stronger than steel of the same thickness!',icon:'spider',snd:'hiss'},
 {id:'ant',name:'Ant',habitat:'underground tunnels',food:'seeds and crumbs',fact:'Ants can carry 50 times their own weight!',icon:'ant',snd:'clicky'},
 {id:'squirrel',name:'Squirrel',habitat:'forests',food:'nuts and acorns',fact:'Squirrels plant trees by forgetting where they buried nuts!',icon:'squirrel',snd:'chatter'},
 {id:'hedgehog',name:'Hedgehog',habitat:'hedges and gardens',food:'bugs and beetles',fact:'A hedgehog has about 5,000 spines on its back!',icon:'hedgehog',snd:'gruff'},
 {id:'penguin',name:'Penguin Pal',habitat:'icy shores',food:'fish',fact:'Penguin dads keep the egg warm on their feet!',icon:'penguin',snd:'honk'}];
var NOTE={C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33};
var RHYMES=[
 {id:'twinkle',title:'Twinkle, Twinkle, Little Star',lang:'en',tag:'English',icon:'star',tempo:96,lines:[
  {notes:[['C4',1],['C4',1],['G4',1],['G4',1],['A4',1],['A4',1],['G4',2]],tokens:[['Twin-',1],['kle',1],['twin-',1],['kle',1],['lit-',1],['tle',1],['star',2]]},
  {notes:[['F4',1],['F4',1],['E4',1],['E4',1],['D4',1],['D4',1],['C4',2]],tokens:[['How',1],['I',1],['won-',1],['der',1],['what',1],['you',1],['are.',2]]},
  {notes:[['G4',1],['G4',1],['F4',1],['F4',1],['E4',1],['E4',1],['D4',2]],tokens:[['Up',1],['a-',1],['bove',1],['the',1],['world',1],['so',1],['high,',2]]},
  {notes:[['G4',1],['G4',1],['F4',1],['F4',1],['E4',1],['E4',1],['D4',2]],tokens:[['Like',1],['a',1],['dia-',1],['mond',1],['in',1],['the',1],['sky.',2]]},
  {notes:[['C4',1],['C4',1],['G4',1],['G4',1],['A4',1],['A4',1],['G4',2]],tokens:[['Twin-',1],['kle',1],['twin-',1],['kle',1],['lit-',1],['tle',1],['star,',2]]},
  {notes:[['F4',1],['F4',1],['E4',1],['E4',1],['D4',1],['D4',1],['C4',2]],tokens:[['How',1],['I',1],['won-',1],['der',1],['what',1],['you',1],['are.',2]]}]},
 {id:'rain',title:'Rain, Rain, Go Away',lang:'en',tag:'English',icon:'umbrella',tempo:100,lines:[
  {notes:[['E4',1],['E4',1],['E4',1],['E4',1],['G4',1],['G4',1],['E4',2]],tokens:[['Rain,',2],['rain,',2],['go',1],['a-',1],['way.',2]]},
  {notes:[['E4',1],['E4',1],['E4',1],['E4',1],['G4',1],['G4',1],['E4',2]],tokens:[['Lit-',2],['tle',2],['wants',1],['to',1],['play.',2]]},
  {notes:[['A4',1],['A4',1],['B4',2],['C5',1],['B4',1],['A4',1],['G4',2]],tokens:[['Come',1],['a-',1],['gain',2],['some',1],['o-',1],['ther',1],['day.',2]]},
  {notes:[['E4',1],['E4',1],['E4',1],['E4',1],['G4',1],['G4',1],['E4',2]],tokens:[['Rain,',2],['rain,',2],['go',1],['a-',1],['way!',2]]}]},
 {id:'chandmama',title:'\u099A\u09BE\u0981\u09A6 \u09AE\u09BE\u09AE\u09BE',lang:'bn',tag:'Bangla',icon:'moon',tempo:84,lines:[
  {notes:[['G4',1],['A4',1],['B4',1],['B4',1],['A4',1],['G4',1],['A4',1],['B4',1],['D5',1],['B4',2]],tokens:[['\u099A\u09BE\u0981\u09A6',1],['\u09AE\u09BE',1],['\u09AE\u09BE',1],['\u09A4\u09C1',1],['\u09AE\u09BF',1],['\u09AF\u09C7',1],['\u099C\u09C7\u09A8-',1],['\u09A6\u09BE',1],['\u09AE\u09BE',1],['\u09AE\u09BE',2]]},
  {notes:[['E4',1],['G4',1],['A4',1],['B4',1],['A4',1],['G4',1],['E4',2]],tokens:[['\u0986',1],['\u099C\u09BF-',1],['\u0995\u09C7',1],['\u099C\u09C7\u09A8-',1],['\u09A6\u09BE',1],['\u0995\u09CB',1],['\u09A8\u09BE\u0964',2]]},
  {notes:[['B4',1],['B4',1],['C5',1],['C5',1],['B4',1],['A4',1],['G4',1],['A4',1],['G4',1],['E4',2]],tokens:[['\u09AA\u09C1',1],['\u09AC',1],['\u09B9\u09BE',1],['\u0993',1],['\u09AF\u09BC\u09BE\u09B0',1],['\u09A6\u09C1',1],['\u09B2',1],['\u0995\u09BF',1],['\u09B2\u09BE\u0999-',1],['\u09B2\u09C7',2]]},
  {notes:[['A4',1],['B4',1],['C5',1],['B4',1],['A4',1],['G4',1],['E4',1],['D4',1],['C4',2]],tokens:[['\u0989',1],['\u09A0\u09CB',2],['\u0986',1],['\u09AE\u09BE',1],['\u09B0',1],['\u0995\u09BE',1],['\u09A8',1],['\u09A8\u09C7\u0964',2]]}]},
{id:'mary',title:'Mary Had a Little Lamb',lang:'en',tag:'English',icon:'lamb',tempo:104,lines:[
  {notes:[['E4',1],['D4',1],['C4',1],['D4',1],['E4',1],['E4',1],['E4',2]],tokens:[['Ma-',1],['ry',1],['had',1],['a',1],['lit-',1],['tle',1],['lamb.',2]]},
  {notes:[['D4',1],['D4',1],['D4',2],['E4',1],['G4',1],['G4',2]],tokens:[['lit-',1],['tle',1],['lamb,',2],['lit-',1],['tle',1],['lamb!',2]]},
  {notes:[['E4',1],['D4',1],['C4',1],['D4',1],['E4',1],['E4',1],['E4',1],['E4',1],['D4',1],['D4',1],['E4',1],['D4',1],['C4',2]],tokens:[['Ma-',1],['ry',1],['had',1],['a',1],['lit-',1],['tle',1],['lamb,',1],['whose',1],['fleece',1],['was',1],['white',1],['as',1],['snow.',2]]}]},
 {id:'rowboat',title:'Row, Row, Row Your Boat',lang:'en',tag:'English',icon:'boat',tempo:96,lines:[
  {notes:[['C4',1],['C4',1],['C4',1],['D4',1],['E4',2]],tokens:[['Row,',1],['row,',1],['row',1],['your',1],['boat,',2]]},
  {notes:[['E4',1],['D4',1],['E4',1],['F4',1],['G4',2]],tokens:[['Gen-',1],['tly',1],['down',1],['the',1],['stream,',2]]},
  {notes:[['C5',1],['C5',1],['C5',1],['G4',1],['G4',1],['G4',1],['E4',1],['E4',1],['E4',1],['C4',1],['C4',1],['C4',1]],tokens:[['Mer-',1],['ri-',1],['ly,',1],['mer-',1],['ri-',1],['ly,',1],['mer-',1],['ri-',1],['ly,',1],['mer-',1],['ri-',1],['ly',1]]},
  {notes:[['G4',1],['F4',1],['E4',1],['D4',1],['C4',2]],tokens:[['life',1],['is',1],['but',1],['a',1],['dream.',2]]}]},
 {id:'london',title:'London Bridge Is Falling Down',lang:'en',tag:'English',icon:'bridge',tempo:108,lines:[
  {notes:[['G4',1],['A4',1],['G4',1],['F4',1],['E4',1],['F4',1],['G4',2]],tokens:[['Lon-',1],['don',1],['Bridge',1],['is',1],['fal-',1],['ling',1],['down,',2]]},
  {notes:[['D4',1],['E4',1],['F4',2],['E4',1],['F4',1],['G4',2]],tokens:[['fal-',1],['ling',1],['down,',2],['fal-',1],['ling',1],['down',2]]},
  {notes:[['G4',1],['A4',1],['G4',1],['F4',1],['E4',1],['F4',1],['G4',2]],tokens:[['Lon-',1],['don',1],['Bridge',1],['is',1],['fal-',1],['ling',1],['down,',2]]},
  {notes:[['D4',1],['G4',1],['E4',1],['C4',2]],tokens:[['My',1],['fair',1],['la-',1],['dy!',2]]}]},
 {id:'notbor',title:'\u09A8\u099F\u09AC\u09B0 \u09B9\u09BE\u09A4\u09C7 \u09A1\u09C1\u09AE\u09C1',lang:'bn',tag:'Bangla',icon:'leaf',tempo:92,lines:[
  {notes:[['G4',1],['A4',1],['B4',1],['A4',1],['G4',1],['B4',2]],tokens:[['\u09A8\u099F-',1],['\u09AC\u09B0',1],['\u09B9\u09BE-',1],['\u09A4\u09C7',1],['\u09A1\u09C1-',1],['\u09AE\u09C1',2]]},
  {notes:[['B4',1],['B4',1],['A4',1],['G4',1],['A4',1],['B4',1],['D5',2]],tokens:[['\u09A1\u09C1-',1],['\u09AE\u09C1\u09B0',1],['\u09AA\u09BE-',1],['\u09A4\u09BE\u09AF\u09BC',1],['\u09AD\u09C1-',1],['\u09A4\u09C1\u09AE',1],['\u09AD\u09BE\u0987',2]]},
  {notes:[['D5',1],['B4',1],['B4',1],['A4',1],['G4',1],['A4',1],['B4',2]],tokens:[['\u09AD\u09C1-',1],['\u09A4\u09C1\u09AE',1],['\u09AD\u09BE\u0987-',1],['\u09AF\u09BC\u09C7\u09B0',1],['\u09A1\u09BF\u0997-',1],['\u09AC\u09BE-',1],['\u099C\u09BF',2]]},
  {notes:[['B4',1],['C5',1],['D5',1],['D5',1],['B4',1],['G4',1],['A4',1],['B4',1],['G4',2]],tokens:[['\u09A1\u09BF\u0997-',1],['\u09AC\u09BE-',1],['\u099C\u09BF',1],['\u09A6\u09C7-',1],['\u0996\u09C7',1],['\u0989-',1],['\u09A4\u09C7\u09B0',1],['\u09AC\u09BF-',1],['\u09AF\u09BC\u09C7',2]]},
  {notes:[['G4',1],['A4',1],['B4',1],['B4',1],['A4',1],['G4',1],['E4',1],['G4',2]],tokens:[['\u0989-',1],['\u09A4\u09C7\u09B0',1],['\u09AC\u09BF-',1],['\u09AF\u09BC\u09C7',1],['\u09A8\u09BE-',1],['\u099A\u09BE',1],['\u09A8\u09BE-',1],['\u099A\u09BF',2]]},
  {notes:[['E4',1],['G4',1],['G4',1],['A4',1],['B4',1],['B4',1],['A4',1],['G4',2]],tokens:[['\u09B8\u09C7',1],['\u0995\u09BF',1],['\u09A8\u09BE-',1],['\u099A\u09C7',1],['\u09AC\u09BE\u0981-',1],['\u09B6\u09C7\u09B0',1],['\u0996\u09C1\u0981-',1],['\u099F\u09BF',2]]},
  {notes:[['B4',1],['B4',1],['C5',1],['D5',1],['D5',1],['B4',1],['A4',1],['G4',2]],tokens:[['\u09AC\u09BE\u0981-',1],['\u09B6\u09C7\u09B0',1],['\u0996\u09C1\u0981-',1],['\u099F\u09BF\u09B0',1],['\u09A4\u09C7-',1],['\u09A4\u09C1\u09B2',1],['\u09AA\u09BE-',1],['\u09A4\u09BE',2]]},
  {notes:[['A4',1],['B4',1],['C5',1],['C5',1],['B4',1],['A4',1],['G4',1],['A4',2]],tokens:[['\u09A4\u09C7-',1],['\u09A4\u09C1\u09B2',1],['\u09AA\u09BE-',1],['\u09A4\u09BE\u09AF\u09BC',1],['\u098F\u0995-',1],['\u099F\u09BE',1],['\u099B\u09BE-',1],['\u09A8\u09BE',2]]},
  {notes:[['B4',1],['A4',1],['G4',1],['G4',1],['E4',1],['D4',1],['C4',1],['D4',2]],tokens:[['\u099B\u09BE-',1],['\u09A8\u09BE\u09B0',1],['\u09AE\u09BE-',1],['\u09A5\u09BE\u09AF\u09BC',1],['\u0995\u09C1-',1],['\u09A4\u09C1\u09AE',1],['\u0995\u09BE-',1],['\u099F\u09BE',2]]}]},
 {id:'brishti',title:'\u09AC\u09C3\u09B7\u09CD\u099F\u09BF \u09AA\u09A1\u09BC\u09C7 \u099F\u09BE\u09AA \u099F\u09BE\u09AA',lang:'bn',tag:'Bangla',icon:'cloud',tempo:112,lines:[
  {notes:[['C4',2],['D4',1],['E4',1],['C4',2]],tokens:[['\u09AC\u09C3\u09B7\u09CD\u099F\u09BF',2],['\u09AA\u09A1\u09BC\u09C7',1],['\u099F\u09BE\u09AA',1],['\u099F\u09BE\u09AA',2]]},
  {notes:[['E4',1],['D4',1],['E4',1],['C4',2]],tokens:[['\u09A8\u09C1\u09A8',1],['\u0996\u09BE\u0987',1],['\u099A\u09BE\u09AA',1],['\u099A\u09BE\u09AA',2]]},
  {notes:[['E4',1],['G4',1],['G4',1],['A4',1],['G4',1],['E4',1],['D4',2]],tokens:[['\u0986',1],['\u09AE\u09BE\u09B0',1],['\u09A6\u09BF-',1],['\u09A6\u09BF\u09B0',1],['\u09AC\u09BF-',1],['\u09AF\u09BC\u09C7',1],['\u09B9\u09AC\u09C7',2]]},
  {notes:[['C4',1],['D4',1],['E4',1],['C4',2]],tokens:[['\u099A\u09BE\u09B2',1],['\u0995\u09C1\u09AE-',1],['\u09A1\u09BC\u09BE',1],['\u09AA\u09BE\u09AA,',2]]},
  {notes:[['D4',1],['E4',1],['F4',1],['E4',1],['D4',1],['C4',2]],tokens:[['\u09A6\u09C1\u09A7',1],['\u09AD\u09BE-',1],['\u09A4\u09C7',1],['\u0996\u09BE\u09AC',1],['\u09AC\u09BE-',1],['\u09B8\u09BF,',2]]},
  {notes:[['E4',1],['G4',1],['A4',1],['G4',1],['E4',1],['D4',1],['C4',2]],tokens:[['\u09AA\u09BE-',1],['\u09A8\u09BF',1],['\u0996\u09BE-',1],['\u09AC\u09BE\u09B0',1],['\u099C\u09BE\u09AF\u09BC-',1],['\u0997\u09BE',1],['\u09A8\u09BE\u0987\u0964',2]]},
  {notes:[['C5',1],['C5',1],['A4',1],['A4',1],['G4',1],['G4',1],['E4',1],['G4',2]],tokens:[['\u09AC\u09BE-',1],['\u099C\u09C7',1],['\u09AC\u09BE-',1],['\u099C\u09C7',1],['\u09AC\u09BE\u0981-',1],['\u09B6\u09BF',1],['\u09AC\u09BE-',1],['\u099C\u09C7,',2]]},
  {notes:[['G4',1],['A4',1],['B4',1],['B4',1],['A4',1],['G4',1],['C4',2]],tokens:[['\u09AC\u09BE\u0981-',1],['\u09B6\u09BF',1],['\u09AC\u09BE-',1],['\u099C\u09BE\u09AF\u09BC',1],['\u09AD\u09CB-',1],['\u09B2\u09BE-',1],['\u09A8\u09BE\u09A5\u0964',2]]}]},
 {id:'ahatutu',title:'\u0986 \u09B9\u09BE \u099F\u09C1 \u099F\u09C1',lang:'bn',tag:'Bangla',icon:'mango',tempo:118,lines:[
  {notes:[['C4',1],['D4',1],['E4',1],['C4',2]],tokens:[['\u0986',1],['\u09B9\u09BE',1],['\u099F\u09C1',1],['\u099F\u09C1,',2]]},
  {notes:[['E4',1],['G4',2]],tokens:[['\u09A4\u09C1\u0987',1],['\u0995\u0987?',2]]},
  {notes:[['G4',1],['A4',1],['G4',1],['E4',1],['D4',1],['E4',1],['C4',2]],tokens:[['\u0986',1],['\u09AE\u09BF',1],['\u09AE\u09BE-',1],['\u09A4\u09BF\u09B0',1],['\u09A8\u09BF-',1],['\u099A\u09C7',1],['\u0997\u09B0\u09CD\u09A4\u09C7\u0964',2]]},
  {notes:[['D4',1],['E4',1],['G4',2]],tokens:[['\u0995\u09C0',1],['\u0995\u09CB-',1],['\u09B0\u09BF\u09B8?',2]]},
  {notes:[['C4',2]],tokens:[['\u0996\u09BE\u0987\u0964',2]]},
  {notes:[['E4',1],['G4',2]],tokens:[['\u0995\u09C0',1],['\u0996\u09BE\u0993?',2]]},
  {notes:[['E4',2]],tokens:[['\u0986\u09AE\u0964',2]]},
  {notes:[['E4',1],['G4',2]],tokens:[['\u0986\u09AE',1],['\u0995\u0987?',2]]},
  {notes:[['G4',1],['E4',2]],tokens:[['\u09AC\u09BE\u0998',1],['\u0996\u09BE\u0987\u099B\u09C7\u0964',2]]},
  {notes:[['E4',1],['G4',2]],tokens:[['\u09AC\u09BE\u0998',1],['\u0995\u0987?',2]]},
  {notes:[['G4',1],['G4',1],['A4',1],['E4',2]],tokens:[['\u09AA\u09BE-',1],['\u09A8\u09BF-',1],['\u09A4\u09C7',1],['\u09A1\u09C1\u09AC\u099B\u09C7\u0964',2]]},
  {notes:[['E4',1],['G4',1],['G4',2]],tokens:[['\u09AA\u09BE-',1],['\u09A8\u09BF',1],['\u0995\u0987?',2]]},
  {notes:[['G4',1],['E4',2]],tokens:[['\u0997\u09B0\u09C1',1],['\u0996\u09BE\u0987\u099B\u09C7\u0964',2]]},
  {notes:[['E4',1],['G4',2]],tokens:[['\u0997\u09B0\u09C1',1],['\u0995\u0987?',2]]},
  {notes:[['G4',1],['A4',1],['C5',2]],tokens:[['\u09AA\u09BE-',1],['\u09B9\u09BE\u09A1\u09BC\u09C7',1],['\u0989\u09A0\u099B\u09C7\u0964',2]]},
  {notes:[['E4',1],['G4',1],['G4',2]],tokens:[['\u09AA\u09BE-',1],['\u09B9\u09BE\u09A1\u09BC',1],['\u0995\u0987?',2]]},
  {notes:[['A4',1],['G4',1],['E4',2]],tokens:[['\u09A7\u09CB\u0981-',1],['\u09AF\u09BC\u09BE\u09AF\u09BC',1],['\u09A2\u09BE\u0995\u099B\u09C7\u0964',2]]},
  {notes:[['E4',1],['G4',1],['G4',2]],tokens:[['\u09A7\u09CB\u0981-',1],['\u09AF\u09BC\u09BE',1],['\u0995\u0987?',2]]},
  {notes:[['G4',1],['E4',2]],tokens:[['\u09AE\u09C7\u0998\u09C7',1],['\u0996\u09BE\u0987\u099B\u09C7\u0964',2]]},
  {notes:[['E4',1],['G4',2]],tokens:[['\u09AE\u09C7\u0998',1],['\u0995\u0987?',2]]},
  {notes:[['A4',1],['G4',1],['C4',2]],tokens:[['\u09B9\u09BE-',1],['\u0993\u09AF\u09BC\u09BE\u09AF\u09BC',1],['\u0989\u09A1\u09BC\u099B\u09C7!',2]]}]},

 {id:'sunnyday',title:'Hello, Sunny Day',lang:'en',tag:'English',icon:'sun',tempo:104,lines:[
  {notes:[['C4',1],['D4',1],['E4',1],['G4',1],['E4',1],['D4',1]],tokens:[['Hel-',1],['lo,',1],['sun-',1],['ny',1],['day,',1],['shine',1]]},
  {notes:[['E4',1],['F4',1],['G4',1],['A4',1],['G4',1],['E4',1]],tokens:[['Birds',1],['are',1],['sing-',1],['ing',1],['in',1],['the',1]]},
  {notes:[['G4',1],['E4',1],['D4',1],['D4',1],['C4',2]],tokens:[['Come',1],['and',1],['dance',1],['with',1],['me!',2]]}]},
 {id:'littlebunny',title:'Little Bunny',lang:'en',tag:'English',icon:'leaf',tempo:98,lines:[
  {notes:[['C4',1],['E4',1],['G4',1],['E4',1],['F4',1],['A4',1]],tokens:[['Lit-',1],['tle',1],['bun-',1],['ny',1],['hop-',1],['ping',1]]},
  {notes:[['G4',1],['A4',1],['G4',1],['E4',1],['D4',1],['C4',1]],tokens:[['Through',1],['the',1],['grass',1],['so',1],['green',1],['and',1]]},
  {notes:[['E4',1],['D4',1],['C4',2]],tokens:[['soft',1],['and',1],['sweet!',2]]}]},
 {id:'littlecloud',title:'Little Cloud',lang:'en',tag:'English',icon:'cloud',tempo:92,lines:[
  {notes:[['G4',1],['G4',1],['A4',1],['G4',1],['E4',1],['D4',1]],tokens:[['Lit-',1],['tle',1],['cloud',1],['up',1],['in',1],['the',1]]},
  {notes:[['E4',1],['G4',1],['A4',1],['G4',1],['E4',1],['D4',1]],tokens:[['Float-',1],['ing',1],['slow-',1],['ly',1],['through',1],['the',1]]},
  {notes:[['C4',1],['D4',1],['E4',1],['G4',2]],tokens:[['blue',1],['sky,',1],['bring',1],['rain!',2]]}]},
 {id:'ronginghuri',title:'রঙিন ঘুড়ি',lang:'bn',tag:'Bangla',icon:'star',tempo:96,lines:[
  {notes:[['C4',1],['D4',1],['E4',1],['G4',1],['E4',1]],tokens:[['রঙিন',1],['ঘুড়ি',1],['ওড়ে',1],['নীল',1],['আকাশে',1]]},
  {notes:[['E4',1],['G4',1],['A4',1],['G4',1],['E4',1]],tokens:[['লাল',1],['নীল',1],['হলুদ',1],['রং',1],['হাসে',1]]},
  {notes:[['G4',1],['A4',1],['G4',1],['E4',2]],tokens:[['সুতো',1],['ধরে',1],['আমি',1],['দৌড়াই!',2]]}]},
 {id:'chotopakhi',title:'ছোট্ট পাখি',lang:'bn',tag:'Bangla',icon:'leaf',tempo:100,lines:[
  {notes:[['E4',1],['G4',1],['A4',1],['G4',1],['E4',1]],tokens:[['ছোট্ট',1],['পাখি',1],['ডাকে',1],['ভোরের',1],['আলোয়',1]]},
  {notes:[['C4',1],['D4',1],['E4',1],['G4',1],['E4',1]],tokens:[['ডানা',1],['মেলে',1],['উড়ে',1],['যায়',1],['নীল',1]]},
  {notes:[['G4',1],['E4',1],['D4',2]],tokens:[['আকাশে',1],['মিষ্টি',1],['সুরে!',2]]}]},
 {id:'brishtirgaan',title:'বৃষ্টির গান',lang:'bn',tag:'Bangla',icon:'cloud',tempo:90,lines:[
  {notes:[['C4',1],['E4',1],['G4',1],['E4',1],['D4',1]],tokens:[['টুপটাপ',1],['বৃষ্টি',1],['পড়ে',1],['ছাদের',1],['গায়ে',1]]},
  {notes:[['E4',1],['G4',1],['A4',1],['G4',1],['E4',1]],tokens:[['ছোট্ট',1],['ব্যাঙ',1],['লাফায়',1],['সবুজ',1],['ঘাসে',1]]},
  {notes:[['G4',1],['A4',1],['G4',1],['E4',2]],tokens:[['রংধনু',1],['হাসে',1],['নীল',1],['আকাশে!',2]]}]}

];
var MEM_DECKS=[
 {name:'Yummy Fruits',icons:['apple','banana','strawberry','grapes','orange','watermelon']},
 {name:'Pretty Flowers',icons:['rose','tulip','sunflower','daisy','lotus','sakura']},
 {name:'Animal Pals',icons:['cat','dog','elephant','lion','cow','duck']},
 {name:'Sky & Garden',icons:['sun','moon','rainbow','tree','fish','nest']},
 {name:'Playtime Fun',icons:['ball','kite','hat','icecream','juice','umbrella']},
 {name:'Cute Characters',icons:['penguin','queen','owl','frog','bird','zebra']}];
function megaDeck(){var all=[];MEM_DECKS.forEach(function(d){all=all.concat(d.icons);});
 return {name:'Mega Mix',icons:shuffle(all).slice(0,8)};}
/* ===== zone router ===== */
var cleanups=[];
function onCleanup(f){cleanups.push(f);}
function runCleanups(){while(cleanups.length){try{cleanups.pop()();}catch(e){}}}
var curZone=null;
var ZONES={
 letters:{name:'Letter Land',color:'#FF6B57',tag:'Meet A to Z, trace letters, and play the big quiz',icon:'abc',
  tabs:[['Meet Letters',function(b){renderMeet(b);}],['Trace',function(b){renderTraceTab(b);}],['Letter Quiz',function(b){renderLetterQuiz(b);}]]},
 numbers:{name:'Number Valley',color:'#1FA9A0',tag:'Count to 20 with 18 friends, add and subtract up to 20, explore 1 to 100',icon:'hash',
  tabs:[['Counting',function(b){renderCounting(b);}],['Math Machine',function(b){renderMath(b);}],['1 to 100',function(b){renderNumGrid(b);}]]},
 colors:{name:'Color Studio',color:'#F15BB5',tag:'30 scenes to paint with 50 named colors',icon:'palette',
  tabs:[['Coloring',function(b){renderColoring(b);}]]},
 shapes:{name:'Shape Safari',color:'#3FA7D6',tag:'23 shapes on playcards, then match them',icon:'shapes',
  tabs:[['Shape Playcards',function(b){renderMeetShapes(b);}],['Flat Match (2D)',function(b){renderShapeMatchGame(b,SHAPES2D,'flat');}],['Solid Match (3D)',function(b){renderShapeMatchGame(b,SHAPES3D,'solid');}]]},
 animals:{name:'Animal Forest',color:'#58B368',tag:'Meet 50 animal friends and their sounds',icon:'paw',
  tabs:[['Meet Animals',function(b){renderAnimals(b);}],['Sound Quiz',function(b){renderSoundQuiz(b);}]]},
 puzzle:{name:'Puzzle Island',color:'#FF9F1C',tag:'Memory levels, pattern levels and number order',icon:'puzzle',
  tabs:[['Memory Match',function(b){renderMemory(b);}],['Pattern Path',function(b){renderPattern(b);}],['Number Order',function(b){renderOrder(b);}]]},
 rhymes:{name:'Rhyme Room',color:'#8656C1',tag:'15 sing-along rhymes in English and Bangla',icon:'note',
  tabs:[['Sing Along',function(b){renderRhymes(b);}]]},
 quiz:{name:'Quiz Castle',color:'#5C4DDB',tag:'The castle quiz gets harder as you get smarter!',icon:'quest',
  tabs:[['Play',function(b){renderQuizCastle(b);}]]},
 rewards:{name:'Reward Castle',color:'#E8A200',tag:'Your stars, levels, badges and streak',icon:'trophy',
  tabs:[['My Rewards',function(b){renderRewards(b);}]]}};
function openZone(id){var z=ZONES[id];if(!z)return;curZone=id;Sfx.play('click');
 State.stats.visited[id]=1;save();checkExplorer();refreshVisited();
 var oz=$('#zone');oz.style.setProperty('--acc',z.color);
 $('#zoneTitle').textContent=z.name;$('#zoneTag').textContent=z.tag;
 var tb=$('#zoneTabs');tb.innerHTML='';
 z.tabs.forEach(function(t,i){var b=el('<button class="tab">'+t[0]+'</button>');
  b.addEventListener('click',function(){activateTab(i);});tb.appendChild(b);});
 activateTab(0);oz.classList.add('open');document.body.style.overflow='hidden';}
function activateTab(i){runCleanups();setWide(false);var z=ZONES[curZone];
 $$('#zoneTabs .tab').forEach(function(b,j){b.classList.toggle('on',j===i);});
 var body=$('#zoneBody');body.innerHTML='';z.tabs[i][1](body);$('#zone').scrollTop=0;}
function closeZone(){runCleanups();setWide(false);stopSpeech();$('#zone').classList.remove('open');document.body.style.overflow='';curZone=null;refreshVisited();}
function checkExplorer(){var all=true;for(var k in ZONES){if(!State.stats.visited[k])all=false;}if(all)awardBadge('explorer');}
function refreshVisited(){$$('.loc').forEach(function(g){g.classList.toggle('visited',!!State.stats.visited[g.getAttribute('data-zone')]);});}
document.addEventListener('click',function(e){
 var t=e.target,d=0;
 while(t&&d<10){if(t.getAttribute&&t.getAttribute('data-zone')){openZone(t.getAttribute('data-zone'));return;}t=t.parentNode;d++;}});
 $$('.loc').forEach(function(g){g.addEventListener('keydown',function(e){
 if(e.key==='Enter'||e.key===' '){e.preventDefault();openZone(g.getAttribute('data-zone'));}});});
 $('#sunG').addEventListener('click',function(){Sfx.play('sparkle');Voice.say('That is me, Mister Sun!');});
 $('#balloonG').addEventListener('click',function(){Sfx.play('boing');Voice.say('Up, up and away!');});
 $('#ollieG').addEventListener('click',function(){Sfx.play('pop');Voice.say('Tap a place on the map to start exploring!');});
(function(){var g=$('#mapFlowers'),pts=[[70,480],[930,540],[60,680],[935,820],[545,960],[70,1100],[935,1190],[545,1350],[60,1500],[910,1530],[250,640],[780,880],[450,1030],[620,1200],[300,1420],[820,1460]],cols=['#F15BB5','#FF9F1C','#FF6B57','#4A90D9','#58B368'],h='';
 for(var i=0;i<pts.length;i++){var c=cols[i%5];
  h+='<g class="windy" style="animation-delay:-'+(i*0.7).toFixed(1)+'s" transform="translate('+pts[i][0]+','+pts[i][1]+')"><path d="M0 0v-14" fill="none" stroke="#4E9E44" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-18" r="5.5" fill="'+c+'"/><circle cx="-5.5" cy="-13" r="5.5" fill="'+c+'"/><circle cx="5.5" cy="-13" r="5.5" fill="'+c+'"/><circle cx="0" cy="-13.5" r="3" fill="#FFC93C"/></g>';}
 /* extra trees + mushrooms */
 h+='<g class="windy w2" transform="translate(90,880)"><path d="M0 0v-24" stroke="#A9713B" stroke-width="8" fill="none" stroke-linecap="round"/><circle cy="-38" r="20" fill="#58B368" stroke="#3A2E39" stroke-width="3"/><circle cx="-15" cy="-26" r="13" fill="#6FC27C" stroke="#3A2E39" stroke-width="3"/><circle cx="15" cy="-26" r="13" fill="#6FC27C" stroke="#3A2E39" stroke-width="3"/></g>';
 h+='<g class="windy w3" transform="translate(920,930) scale(.85)"><path d="M0 0v-24" stroke="#A9713B" stroke-width="8" fill="none" stroke-linecap="round"/><circle cy="-38" r="20" fill="#58B368" stroke="#3A2E39" stroke-width="3"/><circle cx="-15" cy="-26" r="13" fill="#6FC27C" stroke="#3A2E39" stroke-width="3"/><circle cx="15" cy="-26" r="13" fill="#6FC27C" stroke="#3A2E39" stroke-width="3"/></g>';
 h+='<g class="windy" transform="translate(140,1330) scale(.9)"><path d="M0 0v-20" stroke="#A9713B" stroke-width="7" fill="none" stroke-linecap="round"/><circle cy="-32" r="17" fill="#58B368" stroke="#3A2E39" stroke-width="3"/></g>';
 h+='<g class="bobber b2" transform="translate(860,1400)"><path d="M12 0c0-7-5-12-12-12S-12-7-12 0c0 4 3 8 7 9v4h10v-4c4-1 7-5 7-9z" fill="#E23E57" stroke="#3A2E39" stroke-width="3"/><circle cx="-4" cy="-9" r="2.4" fill="#fff" stroke="#3A2E39" stroke-width="2"/><circle cx="4" cy="-7" r="2" fill="#fff" stroke="#3A2E39" stroke-width="2"/></g>';
 g.innerHTML=h;
 Array.prototype.forEach.call(g.querySelectorAll('.windy,.bobber'),function(f){f.addEventListener('click',function(ev){ev.stopPropagation();Sfx.play('pop');});});})();
function bubble(t){return '<div class="bubble"><svg viewBox="0 0 64 64"><use href="#owl"/></svg><span>'+t+'</span></div>';}
/* ===== LETTER LAND ===== */
function renderMeet(root){
 root.innerHTML=bubble('Tap a letter to meet it! Press the buttons to hear it out loud.')+
  '<div class="row2"><div class="panel"><div class="lgrid" id="lgrid"></div></div><div class="panel detailCard" id="ldetail"></div></div>';
 var cur=0,grid=$('#lgrid');
 LETTER_WORDS.forEach(function(w,i){
  var b=el('<button class="ltile'+(State.stats.seen[w[0]]?' seen':'')+'">'+w[0]+'<span class="mini">'+ICONS[w[2]]+'</span></button>');
  b.addEventListener('click',function(){cur=i;select();});grid.appendChild(b);});
 function select(){var w=LETTER_WORDS[cur];
  $$('#lgrid .ltile').forEach(function(t,i){t.classList.toggle('sel',i===cur);});
  State.stats.seen[w[0]]=1;save();
  if(Object.keys(State.stats.seen).length>=10)awardBadge('letter-fan');
  $$('#lgrid .ltile').forEach(function(t,i){t.classList.toggle('seen',!!State.stats.seen[LETTER_WORDS[i][0]]);});
  $('#ldetail').innerHTML='<div class="big-letter">'+w[0]+'</div><div class="art pop">'+ICONS[w[2]]+'</div>'+
   '<div style="font-family:\'Baloo 2\';font-weight:700;font-size:23px;margin:6px 0"><b style="color:var(--zl)">'+w[0]+'</b> is for '+w[1]+'</div>'+
   '<div class="btnRow"><button class="btn primary" id="hearL">'+ic('vol')+' Hear letter</button>'+
   '<button class="btn soft" id="hearW">'+ic('vol')+' Hear word</button>'+
   '<button class="btn" id="prevL">'+ic('back')+'</button><button class="btn" id="nextL" aria-label="Next"><span style="display:inline-block;transform:scaleX(-1)">'+ic('back',18)+'</span></button>'+
   '<button class="btn" id="goTrace">'+ic('pencil')+' Trace it</button></div>';
  $('#hearL').addEventListener('click',function(){Sfx.play('click');Voice.say(w[0]+'!');});
  $('#hearW').addEventListener('click',function(){Sfx.play('click');Voice.say(w[0]+' for '+w[1]+'!');});
  $('#prevL').addEventListener('click',function(){cur=(cur+25)%26;select();});
  $('#nextL').addEventListener('click',function(){cur=(cur+1)%26;select();});
  $('#goTrace').addEventListener('click',function(){TraceState.current=w[0];activateTab(1);});
  Sfx.play('pop');Voice.say(w[0]+'! '+w[0]+' for '+w[1]+'!');}
 select();}
var TraceState={current:'A'};
function renderTraceTab(root){
 var L=TraceState.current||'A';
 root.innerHTML=bubble('Watch first, then use your finger to follow the dots from one end to the other!')+
  '<div class="panel"><div class="strip" id="tstrip"></div>'+
  '<svg class="traceStage" id="tsvg" viewBox="0 0 100 104"></svg>'+
  '<div class="btnRow mt" id="tbtns"></div><div class="center mt" id="tdone"></div></div>';
 var strip=$('#tstrip');
 for(var i=0;i<26;i++)(function(ch){
  var b=el('<button'+(ch===L?' class="sel"':'')+'>'+ch+'</button>');
  if(State.stats.traced[ch])b.classList.add('done');
  b.addEventListener('click',function(){TraceState.current=ch;renderTraceTab(root);});
  strip.appendChild(b);})(ABC[i]);
 var svg=$('#tsvg'),strokes=TRACE[L]||TRACE.A,NS='http://www.w3.org/2000/svg';
 function mk(t,at){var n=document.createElementNS(NS,t);for(var k in at)n.setAttribute(k,at[k]);return n;}
 var bg=mk('text',{x:50,y:92,'text-anchor':'middle','font-size':110,'font-family':'Baloo 2, cursive','font-weight':800,fill:INK,opacity:.07});
 bg.textContent=L;svg.appendChild(bg);
 strokes.forEach(function(s){svg.appendChild(mk('polyline',{points:s.map(function(p){return p[0]+','+p[1];}).join(' '),fill:'none',stroke:'#D9CDE0','stroke-width':4,'stroke-dasharray':'1 7','stroke-linecap':'round','stroke-linejoin':'round'}));});
 var prog=mk('path',{fill:'none',stroke:'#FF6B57','stroke-width':9,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.92});
 var demo=mk('path',{fill:'none',stroke:'#FFB199','stroke-width':9,'stroke-linecap':'round','stroke-linejoin':'round',opacity:.92});
 var pen=mk('circle',{r:4,fill:'#FF6B57',stroke:INK,'stroke-width':2,visibility:'hidden'});
 var target=mk('circle',{r:5.5,fill:'#fff',stroke:INK,'stroke-width':2.4});
 svg.appendChild(prog);svg.appendChild(demo);svg.appendChild(pen);svg.appendChild(target);
 var si=0,pi=0,visited=strokes.map(function(s){return [s[0]];}),done=false,demoOn=false,demoRaf=null,drawing=false;
 function pathD(list){return list.map(function(pts){return pts.map(function(p,i){return (i?'L':'M')+p[0]+' '+p[1];}).join(' ');}).join(' ');}
 function redraw(){prog.setAttribute('d',pathD(visited));tgt();}
 function tgt(){if(done||si>=strokes.length){target.setAttribute('visibility','hidden');return;}
  var t=strokes[si][pi];target.setAttribute('cx',t[0]);target.setAttribute('cy',t[1]);target.setAttribute('visibility','visible');}
 function handle(cx,cy){if(done||demoOn||si>=strokes.length)return;
  var r=svg.getBoundingClientRect(),ux=(cx-r.left)/r.width*100,uy=(cy-r.top)/r.height*104;
  pen.setAttribute('cx',ux);pen.setAttribute('cy',uy);pen.setAttribute('visibility','visible');
  var t=strokes[si][pi],dx=ux-t[0],dy=uy-t[1];
  if(dx*dx+dy*dy<130){visited[si].push([t[0],t[1]]);pi++;
   if(pi>=strokes[si].length){si++;pi=0;if(si>=strokes.length){finish();return;}}
   Sfx.play('click');}
  redraw();}
 var active=false;
 function getP(e){if(e.touches&&e.touches.length===1)return e.touches[0];
  if(e.changedTouches&&e.changedTouches.length===1)return e.changedTouches[0];return e;}
 function down(e){var p=getP(e);active=true;handle(p.clientX,p.clientY);if(e.cancelable)e.preventDefault();}
 function move(e){if(!active)return;var p=getP(e);handle(p.clientX,p.clientY);if(e.cancelable)e.preventDefault();}
 function up(){if(!active)return;active=false;pen.setAttribute('visibility','hidden');}
 if(window.PointerEvent){svg.addEventListener('pointerdown',down);svg.addEventListener('pointermove',move);svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);}
 else{svg.addEventListener('touchstart',down,{passive:false});svg.addEventListener('touchmove',move,{passive:false});
  svg.addEventListener('touchend',up);svg.addEventListener('touchcancel',up);
  svg.addEventListener('mousedown',function(e){down(e);var mm=function(ev){move(ev);},mu=function(){up();document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
  document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);});}
 function finish(){done=true;redraw();Sfx.play('fanfare');celebrate();
  Voice.say(pick(PRAISE)+' You traced the letter '+L+'!');
  State.stats.traced[L]=1;save();
  if(Object.keys(State.stats.traced).length>=5)awardBadge('trace-star');
  addXP(15,innerWidth/2,innerHeight/2);
  var bi=ABC.indexOf(L);if(strip.children[bi])strip.children[bi].classList.add('done');
  $('#tdone').innerHTML='<button class="btn primary" style="background:var(--zl)" id="nextL2">'+ic('sparkle')+' Next letter</button>';
  $('#nextL2').addEventListener('click',function(){TraceState.current=ABC[(ABC.indexOf(L)+1)%26];renderTraceTab(root);});}
 function reset(){if(demoRaf)cancelAnimationFrame(demoRaf);demoRaf=null;demoOn=false;done=false;si=0;pi=0;
  visited=strokes.map(function(s){return [s[0]];});demo.setAttribute('d','');pen.setAttribute('visibility','hidden');redraw();$('#tdone').innerHTML='';}
 function playDemo(){reset();demoOn=true;target.setAttribute('visibility','hidden');
  var flat=[];
  strokes.forEach(function(s){for(var i2=0;i2<s.length-1;i2++){var a=s[i2],b=s[i2+1];
   var dx=b[0]-a[0],dy=b[1]-a[1],d=Math.sqrt(dx*dx+dy*dy),n=Math.max(2,Math.ceil(d/2));
   for(var k=(i2===0?0:1);k<=n;k++)flat.push([a[0]+dx*k/n,a[1]+dy*k/n]);}});
  var idx=0,last=0,pts=[];
  function step(ts){if(!demoOn)return;
   if(ts-last>14){last=ts;
    for(var r2=0;r2<2&&idx<flat.length;r2++){pts.push(flat[idx]);idx++;}
    demo.setAttribute('d',pathD([pts]));
    if(idx<flat.length){var p=flat[idx-1];pen.setAttribute('cx',p[0]);pen.setAttribute('cy',p[1]);pen.setAttribute('visibility','visible');demoRaf=requestAnimationFrame(step);}
    else{demoRaf=null;setTimeout(function(){demoOn=false;demo.setAttribute('d','');pen.setAttribute('visibility','hidden');tgt();Voice.say('Now you try!');},500);}}
   else demoRaf=requestAnimationFrame(step);}
  demoRaf=requestAnimationFrame(step);}
 $('#tbtns').innerHTML='<button class="btn primary" style="background:var(--zl)" id="tWatch">'+ic('eye')+' Watch</button>'+
  '<button class="btn" id="tReset">'+ic('reset')+' Try again</button>';
 $('#tWatch').addEventListener('click',playDemo);
 $('#tReset').addEventListener('click',function(){Sfx.play('click');reset();});
 onCleanup(function(){if(demoRaf)cancelAnimationFrame(demoRaf);});
 tgt();}
/* ---- Letter Quiz: the BIG 30-question challenge ---- */
var LQ_CONFUSABLE={b:['d','p','q'],d:['b','q','p'],p:['q','b','g'],q:['p','g','d'],
 m:['n','w'],n:['m','h'],u:['v','y'],v:['u','w'],w:['v','m'],
 i:['j','l'],j:['i','l'],l:['i','j'],f:['t','s'],t:['f','l'],
 s:['z','c'],z:['s','x'],c:['e','o'],o:['c','a'],e:['c','a'],
 a:['o','e'],g:['q','j'],h:['n','k'],k:['x','y'],r:['n','v'],x:['k','y'],y:['v','x']};
function renderLetterQuiz(root){
 var TOTAL=30;
 root.innerHTML=bubble('The BIG quiz — <b>30 questions</b>! Six kinds of challenges. Tap a question to hear it again. Good luck!')+
  '<div class="panel center">'+
  '<div class="btnRow" style="justify-content:space-between;margin:0 0 8px">'+
   '<span class="qNum" id="lqNum"></span>'+
   '<span class="qNum" id="lqScore" style="color:var(--zl)"></span></div>'+
  '<div style="height:14px;border:3px solid var(--ink);border-radius:999px;background:#fff;overflow:hidden;margin:0 0 6px">'+
   '<i id="lqBar" style="display:block;height:100%;background:var(--zl);width:0%;transition:width .4s"></i></div>'+
  '<div id="lqQ" style="cursor:pointer"><div class="qPrompt" id="lqP"></div>'+
  '<div class="qVis" id="lqV"></div></div>'+
  '<div class="opts" id="lqO"></div></div>';
 var qn=0,firstTry=0,streak=0,locked=false,lastLetter=-1,wrongPicks=0;
 function bigCh(ch,color){return '<span style="font-family:\'Baloo 2\';font-weight:800;font-size:60px;color:'+(color||'var(--zl)')+'">'+ch+'</span>';}
 function distractors(ch,n){
  var pool=LQ_CONFUSABLE[ch.toLowerCase()]||[],out=[],i;
  var cand=shuffle(pool);
  for(i=0;i<cand.length&&out.length<n;i++){if(cand[i]!==ch.toLowerCase()&&out.indexOf(cand[i])<0)out.push(cand[i]);}
  while(out.length<n){var r=ABC[ri(0,25)].toLowerCase();
   if(r!==ch.toLowerCase()&&out.indexOf(r)<0)out.push(r);}
  return out;}
 function nextLetterIndex(){var i;do{i=ri(0,25);}while(i===lastLetter);lastLetter=i;return i;}
 function updateBar(){$('#lqBar').style.width=Math.round(qn/TOTAL*100)+'%';}
 function nextQ(){locked=false;wrongPicks=0;
  var type=['starts','pickLetter','next','missing','match','find'][qn%6];
  var li=nextLetterIndex(),w=LETTER_WORDS[li],ch=ABC[li];
  $('#lqNum').innerHTML=ic('sparkle',14)+' Question '+(qn+1)+' of '+TOTAL;
  $('#lqScore').innerHTML=ic('star',14)+' '+firstTry+' first-try';
  updateBar();
  var box=$('#lqO');box.innerHTML='';$('#lqV').innerHTML='';
  var say='';
  if(type==='starts'){
   say='Which one starts with the letter '+ch+'?';
   $('#lqP').innerHTML='Which one starts with <span style="color:var(--zl)">'+ch+'</span>?';
   var others=shuffle(LETTER_WORDS.filter(function(x,i2){return i2!==li;})).slice(0,2);
   shuffle([w].concat(others)).forEach(function(o){
    var b=el('<button class="opt"><span style="width:74px;height:74px">'+ICONS[o[2]]+'</span><span class="optWord">'+o[1]+'</span></button>');
    b.addEventListener('click',function(e){answer(b,o[0]===ch,e);});
    box.appendChild(b);});}
  else if(type==='pickLetter'){
   say='Which letter does '+w[1]+' start with?';
   $('#lqP').textContent='Which letter does it start with?';
   $('#lqV').innerHTML='<span class="pop" style="width:110px;height:110px;display:block;margin:0 auto">'+ICONS[w[2]]+'</span>';
   var ds=distractors(ch,2);
   shuffle(ds.concat([ch.toLowerCase()])).forEach(function(c){
    var b=el('<button class="opt" style="font-size:38px">'+c.toUpperCase()+'</button>');
    b.addEventListener('click',function(e){answer(b,c===ch.toLowerCase(),e);});
    box.appendChild(b);});}
  else if(type==='next'){
   say='What letter comes after '+ch+'?';
   $('#lqP').innerHTML='What comes <span style="color:var(--zl)">after</span> '+ch+'?';
   var ans=ABC[(li+1)%26],dset=[],cands=shuffle([ABC[(li+2)%26],ABC[(li+3)%26],ABC[(li+25)%26]]);
   cands.forEach(function(c){if(c!==ans&&dset.length<2&&dset.indexOf(c)<0)dset.push(c);});
   while(dset.length<2){var rc=ABC[ri(0,25)];if(rc!==ans&&dset.indexOf(rc)<0)dset.push(rc);}
   shuffle(dset.concat([ans])).forEach(function(c){
    var b=el('<button class="opt" style="font-size:38px">'+c+'</button>');
    b.addEventListener('click',function(e){answer(b,c===ans,e);});
    box.appendChild(b);});}
  else if(type==='missing'){
   var start=ri(0,22),hide=ri(1,2),seq=[],k2;
   for(k2=0;k2<4;k2++)seq.push(ABC[start+k2]);
   var missCh=seq[hide];seq[hide]='?';
   say='Which letter is missing?';
   $('#lqP').textContent='Which letter is missing?';
   $('#lqV').innerHTML='<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;align-items:center">'+
    seq.map(function(c2){return c2==='?'?'<span class="qNum" style="font-size:30px;padding:2px 18px;animation:qbob 1.2s ease-in-out infinite">?</span>':bigCh(c2);}).join('')+'</div>';
   var ds2=distractors(missCh,2);
   shuffle(ds2.concat([missCh.toLowerCase()])).forEach(function(c){
    var b=el('<button class="opt" style="font-size:38px">'+c.toUpperCase()+'</button>');
    b.addEventListener('click',function(e){answer(b,c===missCh.toLowerCase(),e);});
    box.appendChild(b);});}
  else if(type==='match'){
   say='Which small letter matches '+ch+'?';
   $('#lqP').textContent='Which small letter matches?';
   $('#lqV').innerHTML=bigCh(ch);
   var ds3=distractors(ch,2);
   shuffle(ds3.concat([ch.toLowerCase()])).forEach(function(c){
    var b=el('<button class="opt" style="font-size:44px">'+c+'</button>');
    b.addEventListener('click',function(e){answer(b,c===ch.toLowerCase(),e);});
    box.appendChild(b);});}
  else{
   say='Tap the letter '+ch+'!';
   $('#lqP').innerHTML='Tap the letter <span style="color:var(--zl)">'+ch+'</span>!';
   var ds4=distractors(ch,2);
   shuffle(ds4.map(function(c){return c.toUpperCase();}).concat([ch])).forEach(function(c){
    var b=el('<button class="opt" style="font-size:44px">'+c+'</button>');
    b.addEventListener('click',function(e){answer(b,c===ch,e);});
    box.appendChild(b);});}
  $('#lqQ').onclick=function(){Voice.say(say);};
  if(!State.muted)Voice.say(say);}
 function answer(btn,ok,e){
  if(locked)return;
  if(ok){locked=true;btn.classList.add('good');Sfx.play('correct');
   streak++;
   if(wrongPicks===0){firstTry++;
    Voice.say(pick(PRAISE));
    if(streak>0&&streak%5===0)toast(streak+' in a row! On fire!','flame');
    if(streak>=7)awardBadge('on-fire');}
   else{Voice.say('Yes! That is right!');streak=0;}
   $('#lqScore').innerHTML=ic('star',14)+' '+firstTry+' first-try';
   addXP(wrongPicks===0?5:2,e.clientX,e.clientY);
   $('#lqBar').style.width=Math.round((qn+1)/TOTAL*100)+'%';
   setTimeout(function(){qn++;if(qn<TOTAL)nextQ();else end();},1000);}
  else{wrongPicks++;streak=0;btn.classList.add('bad','dim');
   Sfx.play('wrong');}}
 function end(){updateHUD();
  var stars=firstTry>=25?3:(firstTry>=20?2:1);
  var isRecord=false;
  if(firstTry>State.stats.letterQuizBest){State.stats.letterQuizBest=firstTry;isRecord=true;}
  save();
  var xp=firstTry*2+(stars===3?20:0);
  addXP(xp);
  if(firstTry>=25)awardBadge('letter-hero');
  if(stars===3)setTimeout(celebrate,300);
  $('#lqBar').style.width='100%';
  $('#lqQ').onclick=null;
  $('#lqO').innerHTML='<div class="pop"><h3 style="font-size:30px">Big quiz done!</h3>'+
   '<p style="font-size:44px;color:var(--zw);letter-spacing:6px">'+rep('\u2605',stars)+rep('\u2606',3-stars)+'</p>'+
   '<p style="font-weight:800;font-size:18px;margin:4px 0">You got <b style="color:var(--zl)">'+firstTry+'</b> of '+TOTAL+' on the first try!'+
   (isRecord?' <b style="color:var(--zn)">New best!</b>':'')+'</p>'+
   '<p style="font-weight:700;font-size:14px;color:#8a7a6a">Best score: '+State.stats.letterQuizBest+' of '+TOTAL+'</p>'+
   '<div class="btnRow mt"><button class="btn primary" style="background:var(--zl)" id="lqAgain">'+ic('reset')+' Play the big quiz again</button></div></div>';
  $('#lqP').textContent='';$('#lqV').innerHTML='';$('#lqNum').textContent='';
  $('#lqAgain').addEventListener('click',function(){renderLetterQuiz(root);});}
 nextQ();}
/* ===== NUMBER VALLEY ===== */
var COUNT_KINDS=[
 {id:'apple',name:'apples'},{id:'banana',name:'bananas'},{id:'strawberry',name:'strawberries'},
 {id:'watermelon',name:'watermelon slices'},{id:'sun',name:'suns'},{id:'star5',name:'stars'},
 {id:'heart',name:'hearts'},{id:'bee',name:'bees'},{id:'butterfly',name:'butterflies'},
 {id:'chick',name:'chicks'},{id:'mushroom',name:'mushrooms'},{id:'ladybug',name:'ladybugs'},
 {id:'balloon',name:'balloons'},{id:'snail',name:'snails'},{id:'blossom',name:'blossoms'},
 {id:'leaf',name:'leaves'},{id:'fish',name:'fishes'},{id:'duck',name:'ducks'}];
function renderCounting(root){
 root.innerHTML=bubble('Counting time — <b>10 to 20</b> things, and a brand-new friend every round! Tap each one to count out loud, then pick the right number.')+
  '<div class="panel center"><span class="qNum" id="cqNum"></span><div class="cntStage" id="cStage"></div><div class="opts" id="cOpts"></div></div>';
 var n=0,kind=null,counted=0,round=0,locked=false,total=12,lastKind='';
 function nextKind(){var k;do{k=pick(COUNT_KINDS);}while(k.id===lastKind);lastKind=k.id;return k;}
 function next(){locked=false;counted=0;round++;
  kind=nextKind();
  $('#cqNum').innerHTML=ic('sparkle',14)+' Round '+round+' of '+total+' — counting <b>'+kind.name+'</b>!';
  $('#cOpts').innerHTML='';
  n=ri(10,20);
  var st=$('#cStage');
  st.innerHTML='<div class="cntGrid" id="cGrid"></div>';
  var grid=$('#cGrid');
  for(var i=0;i<n;i++)(function(){
   var b=el('<button class="cnt-obj"><span class="cnt-badge"></span><span style="width:52px;height:52px;display:block">'+ICONS[kind.id]+'</span></button>');
   b.addEventListener('click',function(){
    if(b.classList.contains('counted')||locked)return;
    counted++;b.classList.add('counted');
    b.querySelector('.cnt-badge').textContent=String(counted);
    Sfx.play('pop');Voice.say(String(counted));
    if(counted===n)ask();});
   grid.appendChild(b);})();}
 function ask(){locked=false;var correct=n;
  var pool=shuffle([correct-2,correct-1,correct+1,correct+2].filter(function(v){return v>0&&v!==correct;})).slice(0,2).concat([correct]);
  var box=$('#cOpts');
  box.innerHTML='<p style="width:100%;font-family:\'Baloo 2\';font-weight:800;font-size:22px">How many '+kind.name+' did you count?</p>';
  pool.forEach(function(v){
   var b=el('<button class="opt" style="min-width:76px">'+v+'</button>');
   b.addEventListener('click',function(e){if(locked)return;
    if(v===correct){locked=true;b.classList.add('good');Sfx.play('correct');
     Voice.say(pick(PRAISE)+' There are '+n+' '+kind.name+'!');addXP(5,e.clientX,e.clientY);
     State.stats.counted++;save();if(State.stats.counted>=10)awardBadge('count-pro');
     setTimeout(function(){if(round<total)next();else end();},1100);}
    else{b.classList.add('bad');Sfx.play('wrong');setTimeout(function(){b.classList.remove('bad');},450);}});
   box.appendChild(b);});}
 function end(){celebrate();
  $('#cStage').innerHTML='<div style="display:grid;place-items:center;height:100%"><div class="center"><h3 style="font-size:28px">Great counting!</h3><p style="font-weight:800">'+total+' rounds finished!</p></div></div>';
  $('#cOpts').innerHTML='<button class="btn primary" style="background:var(--zn)" id="cAgain">'+ic('reset')+' Count more</button>';
  $('#cAgain').addEventListener('click',function(){round=0;renderCounting(root);});}
 next();}
function renderMath(root){
 root.innerHTML=bubble('The Math Machine makes big sums, up to <b>20</b>! Pick a mode below, look at the dots and tap the answer.')+
  '<div class="panel center">'+
  '<div class="btnRow" style="margin:0 0 10px" id="mMode"></div>'+
  '<span class="qNum" id="mBadge">Mode: Adding +</span>'+
  '<div class="qVis" id="mVis" style="min-height:100px;margin-top:10px"></div>'+
  '<div class="qPrompt" id="mEq" style="font-size:38px"></div>'+
  '<div class="opts" id="mOpts"></div></div>';
 var mode='add',lastOp='';
 var MODES=[['add','Adding +'],['sub','Taking away −'],['mix','Mixed!']];
 var modeBtns={},modeNames={add:'Adding +',sub:'Taking away −',mix:'Mixed!'};
 MODES.forEach(function(m){
  var b=el('<button class="btn small">'+m[1]+'</button>');
  b.addEventListener('click',function(){
   Sfx.play('click');
   mode=m[0];
   paintModes();
   next();});
  modeBtns[m[0]]=b;
  $('#mMode').appendChild(b);});
 function paintModes(){
  MODES.forEach(function(m){
   var on=(m[0]===mode);
   modeBtns[m[0]].style.background=on?'var(--zn)':'#fff';
   modeBtns[m[0]].style.color=on?'#fff':'var(--ink)';});
  $('#mBadge').textContent='Mode: '+modeNames[mode];}
 function dots(cnt,color,off){
  var s='<span class="dotG" style="max-width:380px">',d=cnt>10?20:26,i;
  for(i=0;i<cnt;i++){
   var crossed=(off!==undefined&&i>=cnt-off);
   s+='<i style="background:'+color+';width:'+d+'px;height:'+d+'px'+(crossed?' class="off"':'')+'"></i>';}
  return s+'</span>';}
 function next(){
  var op=mode;
  if(mode==='mix'){op=(lastOp==='add')?'sub':'add';}
  lastOp=op;
  var a,b;
  if(op==='add'){var tot=ri(10,20);a=ri(1,tot-1);b=tot-a;}
  else{a=ri(10,20);b=ri(1,a-1);}
  var correct=(op==='add')?a+b:a-b;
  $('#mVis').innerHTML=(op==='add')
   ?dots(a,'#FFB199')+dots(b,'#9BE0DA')
   :dots(a,'#B5E3A0',b);
  $('#mEq').innerHTML=a+' '+(op==='add'?'+':'−')+' '+b+' = <span style="color:var(--zn)">?</span>';
  Voice.say(a+' '+(op==='add'?'plus':'minus')+' '+b+'. How many?');
  var opts=shuffle([correct-2,correct-1,correct+1,correct+2].filter(function(v){return v>=0&&v!==correct;})).slice(0,2).concat([correct]);
  opts=shuffle(opts);
  var box=$('#mOpts');box.innerHTML='';var locked=false;
  opts.forEach(function(v){
   var bt=el('<button class="opt" style="min-width:80px">'+v+'</button>');
   bt.addEventListener('click',function(e){if(locked)return;
    if(v===correct){locked=true;bt.classList.add('good');Sfx.play('correct');
     Voice.say('Yes! '+a+' '+(op==='add'?'plus':'minus')+' '+b+' is '+correct+'!');
     State.stats.sums++;save();if(State.stats.sums>=15)awardBadge('math-whiz');
     addXP(5,e.clientX,e.clientY);setTimeout(next,1200);}
    else{bt.classList.add('bad');Sfx.play('wrong');setTimeout(function(){bt.classList.remove('bad');},450);}});
   box.appendChild(bt);});}
 paintModes();
 next();}
function renderNumGrid(root){
 root.innerHTML=bubble('Tap any number to hear it! Pick a pattern, then press <b>Play</b> — you can <b>Pause</b> or <b>Stop</b> any time.')+
  '<div class="panel"><div class="patRow" id="pRow"></div><div class="numGrid" id="nGrid"></div>'+
  '<div class="btnRow mt" id="pCtl">'+
  '<button class="btn primary" style="background:var(--zn)" id="pPlay">'+ic('play')+' Play the pattern</button>'+
  '<button class="btn small" id="pPause" style="display:none">'+ic('pause')+' Pause</button>'+
  '<button class="btn small" id="pStop" style="display:none">'+ic('x')+' Stop</button>'+
  '</div></div>';
 var pat=null,patBtns=[];
 var PATTERNS=[['2','By 2s'],['3','By 3s'],['5','By 5s'],['10','By 10s'],['ev','Even numbers'],['od','Odd numbers']];
 var grid=$('#nGrid');
 for(var i=1;i<=100;i++)(function(n){
  var b=el('<button>'+n+'</button>');
  b.addEventListener('click',function(){Sfx.play('click');Voice.say(String(n));
   b.classList.add('say');setTimeout(function(){b.classList.remove('say');},600);});
  grid.appendChild(b);})(i);
 var player={timer:null,nums:[],idx:0,playing:false,paused:false};
 function clearFlash(){Array.prototype.forEach.call(grid.children,function(b){b.classList.remove('say');});}
 function patLabel(){for(var i=0;i<PATTERNS.length;i++){if(PATTERNS[i][0]===pat)return PATTERNS[i][1];}return '';}
 function setButtons(){
  var play=$('#pPlay'),pause=$('#pPause'),stop=$('#pStop');
  if(player.playing&&!player.paused){
   play.style.display='none';pause.style.display='';
   pause.innerHTML=ic('pause')+' Pause';stop.style.display='';}
  else if(player.playing&&player.paused){
   play.style.display='none';pause.style.display='';
   pause.innerHTML=ic('play')+' Resume';stop.style.display='';}
  else{
   play.style.display='';pause.style.display='none';stop.style.display='none';}}
 function speakNum(n){if(!State.muted){try{if(window.speechSynthesis){
  var u=new SpeechSynthesisUtterance(String(n));u.rate=1;speechSynthesis.speak(u);}}catch(e){}}}
 function step(){
  if(!player.playing||player.paused)return;
  if(player.idx>=player.nums.length){finishPlay();return;}
  var n=player.nums[player.idx];
  clearFlash();
  var bt=grid.children[n-1];
  if(bt)bt.classList.add('say');
  speakNum(n);
  player.idx++;
  player.timer=setTimeout(step,560);}
 function finishPlay(){player.playing=false;player.paused=false;player.idx=0;
  clearFlash();stopSpeech();setButtons();
  toast('Pattern finished — '+patLabel()+'!','star');}
 function stopPlayer(silent){if(player.timer)clearTimeout(player.timer);
  player.playing=false;player.paused=false;player.idx=0;
  clearFlash();stopSpeech();setButtons();
  if(!silent)Sfx.play('click');}
 function pausePlayer(){
  if(!player.playing)return;
  if(player.paused){
   player.paused=false;setButtons();
   if(player.idx>0)player.idx--;
   step();}
  else{
   if(player.timer)clearTimeout(player.timer);
   player.paused=true;
   stopSpeech();
   if(player.idx>0)player.idx--;
   setButtons();Sfx.play('click');}}
 PATTERNS.forEach(function(p){
  var b=el('<button class="btn small">'+p[1]+'</button>');
  b.addEventListener('click',function(){
   stopPlayer(true);
   pat=(pat===p[0]?null:p[0]);
   patBtns.forEach(function(x){x[0].style.background=(x[1]===pat?'var(--zn)':'');x[0].style.color=(x[1]===pat?'#fff':'');});
   paint();});
  patBtns.push([b,p[0]]);$('#pRow').appendChild(b);});
 function paint(){Array.prototype.forEach.call(grid.children,function(b,idx){var n=idx+1;b.className='';
  if(pat==='2'&&n%2===0)b.classList.add('p2');
  if(pat==='3'&&n%3===0)b.classList.add('p3');
  if(pat==='5'&&n%5===0)b.classList.add('p5');
  if(pat==='10'&&n%10===0)b.classList.add('p10');
  if(pat==='ev'&&n%2===0)b.classList.add('pev');
  if(pat==='od'&&n%2===1)b.classList.add('pod');});}
 $('#pPlay').addEventListener('click',function(){
  if(pat===null){toast('Pick a pattern first!','hash');return;}
  stopPlayer(true);
  var nums=[],k;
  if(pat==='2'||pat==='ev'){for(k=2;k<=100;k+=2)nums.push(k);}
  else if(pat==='3'){for(k=3;k<=100;k+=3)nums.push(k);}
  else if(pat==='5'){for(k=5;k<=100;k+=5)nums.push(k);}
  else if(pat==='10'){for(k=10;k<=100;k+=10)nums.push(k);}
  else if(pat==='od'){for(k=1;k<=100;k+=2)nums.push(k);}
  nums=nums.slice(0,20);
  player.nums=nums;player.idx=0;player.playing=true;player.paused=false;
  setButtons();step();});
 $('#pPause').addEventListener('click',pausePlayer);
 $('#pStop').addEventListener('click',function(){stopPlayer(false);});
 onCleanup(function(){if(player.timer)clearTimeout(player.timer);stopSpeech();});
 paint();setButtons();}
/* ===== COLOR STUDIO ===== */
var COLORS50=[
['Cherry Red','#D7263D'],['Ladybug Red','#E23E57'],['Coral','#FF8A7A'],['Salmon','#FA9A85'],['Tangerine','#FF7A29'],
['Pumpkin','#F77F00'],['Carrot','#F4A259'],['Mango','#FFB627'],['Sunshine','#FFD24C'],['Butter','#FFF1B8'],
['Lemon Cream','#FFF7D6'],['Olive','#A4C639'],['Lime','#9BE564'],['Grass Green','#58B368'],['Fern','#3E9E5B'],
['Forest Green','#2E6E4E'],['Mint','#A8E6CF'],['Teal','#2EC4B6'],['Aqua','#7FD8D8'],['Sky Blue','#8FCFEA'],
['Baby Blue','#BDE3FF'],['Ocean Blue','#4A90D9'],['Royal Blue','#3F51B5'],['Midnight','#2B3A8F'],['Periwinkle','#8C9EE8'],
['Lavender','#C3A6E8'],['Grape','#8656C1'],['Plum','#6A3FA0'],['Berry','#9B4F8F'],['Magenta','#E052A6'],
['Bubblegum','#F7A1C4'],['Cotton Candy','#FBC4D8'],['Flamingo','#F98BA4'],['Rose','#E75480'],['Hot Pink','#F15BB5'],
['Peach','#FFCBA4'],['Apricot','#FFB570'],['Chocolate','#8B5A33'],['Cocoa','#A9713B'],['Caramel','#D9A05B'],
['Sandy Beach','#EED9A8'],['Cream','#FFF3DC'],['Snow White','#FFFFFF'],['Cloud Grey','#E8E6E1'],['Silver','#C9CCD3'],
['Stormy Grey','#8A8D93'],['Charcoal','#4A4E57'],['Black Cat','#2B2B2B'],['Gold Star','#E8A200'],['Bronze','#B0763B']];
var CF='#F7F1E4';
function fr(x,y,w,h,rx){return '<rect class="fillable" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'"'+(rx?' rx="'+rx+'"':'')+' fill="'+CF+'"/>';}
function fc(cx,cy,r){return '<circle class="fillable" cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+CF+'"/>';}
function fe(cx,cy,rx,ry,rot){return '<ellipse class="fillable" cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'"'+(rot?' transform="rotate('+rot+' '+cx+' '+cy+')"':'')+' fill="'+CF+'"/>';}
function fp(d){return '<path class="fillable" d="'+d+'" fill="'+CF+'"/>';}
function fpoly(pts){return '<polygon class="fillable" points="'+pts+'" fill="'+CF+'"/>';}
function fstar(cx,cy,rO,rI){var pts='',k;
 for(k=0;k<10;k++){var r=(k%2===0)?rO:rI,a=(Math.PI/5)*k-Math.PI/2;
  pts+=(cx+Math.cos(a)*r).toFixed(1)+','+(cy+Math.sin(a)*r).toFixed(1)+' ';}
 return fpoly(pts.trim());}
function det(inner){return '<g fill="none" stroke="'+INK+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+inner+'</g>';}
var SCENES=[
{n:'Happy House',s:function(){return fr(0,0,480,340)+fr(0,240,480,100)+fc(70,60,30)+fr(120,170,170,110,4)+fp('M100 180 205 95 310 180Z')+fr(170,220,44,60,3)+fr(230,190,44,36,3)+fc(395,200,44)+fr(386,240,16,60,4)+
 det('<path d="M230 190v36M252 190v36M230 208h44"/><circle cx="204" cy="250" r="3" fill="'+INK+'" stroke="none"/>');}},
{n:'Rainbow Sky',s:function(){return fr(0,0,480,340)+fc(60,60,26)+
 fp('M50 260 A190 190 0 0 1 430 260 L400 260 A160 160 0 0 0 80 260Z')+
 fp('M82 260 A158 158 0 0 1 398 260 L372 260 A132 132 0 0 0 108 260Z')+
 fp('M112 260 A128 128 0 0 1 368 260 L346 260 A106 106 0 0 0 134 260Z')+
 fe(120,292,45,22)+fe(165,284,32,18)+fe(370,292,45,22)+fe(325,284,32,18);}},
{n:'Flower Garden',s:function(){var s=fr(0,0,480,340)+fr(0,230,480,110)+fc(420,55,26),xs=[120,240,360],i,x;
 for(i=0;i<3;i++){x=xs[i];
  s+=fr(x-4,180,8,62,4)+fc(x,164,13)+fc(x-16,180,13)+fc(x+16,180,13)+fc(x,196,13)+fc(x,180,9);}
 return s;}},
{n:'Butterfly Meadow',s:function(){return fr(0,0,480,340)+fr(0,272,480,68)+
 fe(190,130,55,40)+fe(290,130,55,40)+fe(205,185,35,28)+fe(275,185,35,28)+fe(240,152,11,46)+
 fr(96,250,7,32,3)+fc(100,242,10)+fc(92,242,10)+fc(100,232,10)+fc(100,242,6)+
 fr(376,250,7,32,3)+fc(380,242,10)+fc(372,242,10)+fc(380,232,10)+fc(380,242,6)+
 det('<path d="M232 108c-6-12-16-18-24-18M248 108c6-12 16-18 24-18" fill="none"/>');}},
{n:'Under the Sea',s:function(){return fr(0,0,480,340)+fp('M0 300q120-30 240-10t240 5v45H0Z')+
 fe(150,150,46,28)+fp('M192 150 228 126 228 174Z')+fe(360,248,13,46)+fe(392,252,12,40)+fe(300,285,22,10)+fc(280,100,10)+fc(300,72,7)+
 det('<circle cx="136" cy="144" r="3.4" fill="'+INK+'" stroke="none"/><path d="M124 162q8 6 16 0" fill="none"/>');}},
{n:'Space Trip',s:function(){return fr(0,0,480,340)+fc(80,70,7)+fc(150,45,5)+fc(55,150,6)+
 fc(390,80,38)+fe(230,175,36,62)+fc(230,158,13)+
 fp('M198 210 168 250 206 236Z')+fp('M262 210 292 250 254 236Z')+fp('M212 234 230 286 248 234Z')+
 det('<ellipse cx="390" cy="80" rx="56" ry="12" fill="none"/>');}},
{n:'Ice Cream Stand',s:function(){return fr(0,0,480,340)+fr(60,244,360,58,10)+fp('M200 158 244 158 222 252Z')+fc(222,132,27)+fc(200,152,20)+fc(245,152,20)+fc(222,98,9)+
 det('<path d="M210 176l12 14M234 176l-12 14" fill="none" stroke-width="2"/><path d="M84 272h312" fill="none" stroke-width="2"/>');}},
{n:'Birthday Cake',s:function(){return fr(0,0,480,340)+fr(40,282,400,20,6)+fe(240,280,120,15)+
 fr(140,204,200,68,10)+fr(170,144,140,60,10)+fr(170,144,140,18,8)+
 fr(204,106,10,36,4)+fr(234,102,10,40,4)+fr(264,106,10,36,4)+fc(209,96,7)+fc(239,92,7)+fc(269,96,7)+
 det('<path d="M150 238h180M180 172h120" fill="none" stroke-width="2"/>');}},
{n:'Little Car',s:function(){return fr(0,0,480,340)+fr(0,252,480,58)+fc(60,60,26)+
 fr(70,182,300,68,18)+fr(140,132,160,60,14)+fr(156,142,54,40,8)+fr(230,142,54,40,8)+
 fc(132,254,27)+fc(318,254,27)+det('<circle cx="132" cy="254" r="10" fill="'+INK+'" stroke="none"/><circle cx="318" cy="254" r="10" fill="'+INK+'" stroke="none"/>');}},
{n:'Sailboat',s:function(){return fr(0,0,480,340)+fr(0,232,480,108)+fc(60,60,26)+
 fp('M110 232 370 232 330 282 150 282Z')+fr(236,92,10,140,3)+
 fp('M252 100 252 218 352 218Z')+fp('M230 116 230 208 162 208Z')+fp('M246 92 246 68 288 80Z')+
 det('<path d="M0 252q60 8 120 0t120 0 120 0 120 0" fill="none" stroke-width="2"/>');}},
{n:'Hot Air Balloon',s:function(){return fr(0,0,480,340)+
 fe(90,80,42,20)+fe(132,70,30,17)+fe(390,120,36,18)+fe(424,112,26,14)+
 fe(240,140,70,85)+fe(240,140,22,85)+fr(215,256,50,42,8)+
 det('<path d="M222 224l-6 32M258 224l6 32" fill="none"/>');}},
{n:'Robot',s:function(){return fr(0,0,480,340)+fr(237,40,6,30,2)+fc(240,36,9)+
 fr(180,70,120,90,12)+fc(215,110,14)+fc(265,110,14)+fr(215,136,50,10,5)+
 fr(160,170,160,100,12)+fr(120,180,30,80,10)+fr(330,180,30,80,10)+
 fr(190,276,30,42,8)+fr(260,276,30,42,8)+fr(178,316,54,14,6)+fr(248,316,54,14,6)+
 det('<path d="M200 220h80M200 244h80" fill="none" stroke-width="2"/>');}},
{n:'Teddy Bear',s:function(){return fr(0,0,480,340)+fr(0,300,480,40)+fc(200,80,20)+fc(280,80,20)+
 fc(240,122,48)+fe(240,140,23,16)+fe(240,215,56,48)+
 fe(184,202,21,38)+fe(296,202,21,38)+fc(210,272,24)+fc(270,272,24)+
 det('<circle cx="226" cy="112" r="3.6" fill="'+INK+'" stroke="none"/><circle cx="254" cy="112" r="3.6" fill="'+INK+'" stroke="none"/><ellipse cx="240" cy="140" rx="7" ry="5" fill="'+INK+'" stroke="none"/>');}},
{n:'Cat & Fishbowl',s:function(){return fr(0,0,480,340)+fr(0,262,480,78)+
 fe(180,222,60,42)+fc(180,162,37)+fp('M158 138 156 102 188 126Z')+fp('M202 138 204 102 172 126Z')+fe(252,206,11,30,42)+
 fc(378,216,44)+fe(378,226,34,26)+fc(372,190,6)+
 det('<circle cx="168" cy="156" r="3.4" fill="'+INK+'" stroke="none"/><circle cx="192" cy="156" r="3.4" fill="'+INK+'" stroke="none"/><path d="M172 170q8 6 16 0" fill="none"/><path d="M300 130c-4 5-4 10 0 15M320 130c-4 5-4 10 0 15" fill="none" stroke-width="2"/>');}},
{n:'Big Tree & Swing',s:function(){return fr(0,0,480,340)+fr(0,272,480,68)+
 fr(212,180,40,100,6)+fc(190,152,55)+fc(256,136,48)+fc(216,96,45)+
 fr(300,212,62,12,5)+
 det('<path d="M306 212V156M356 212V156" fill="none"/><path d="M306 158q25-14 50-2" fill="none" stroke-width="2"/>');}},
{n:'Kite Park',s:function(){return fr(0,0,480,340)+fr(0,282,480,58)+fc(420,55,26)+
 fe(80,90,44,22)+fe(122,80,30,17)+
 fpoly('240,58 302,120 240,182 178,120')+
 fpoly('330,200 344,214 330,228 316,214')+fpoly('352,236 366,250 352,264 338,250')+
 det('<path d="M240 58v124M178 120h124" fill="none" stroke-width="2"/><path d="M240 182q50 10 76 18" fill="none" stroke-dasharray="4 8"/>');}},
{n:'Snail Trail',s:function(){return fr(0,0,480,340)+fr(0,282,480,58)+
 fc(300,222,52)+fr(118,238,184,38,18)+fc(126,226,22)+
 fc(110,182,6)+fc(138,174,6)+fp('M376 254a42 42 0 0 1 84 0Z')+fr(404,254,26,28,6)+
 det('<path d="M300 222c-4 0-7 3-7 6s3 5 6 5 6-2 6-6c0-5-4-9-9-9" fill="none" stroke-width="2"/><path d="M112 186v-6M136 178v-6" fill="none" stroke-width="2"/>');}},
{n:'Night Owl',s:function(){return fr(0,0,480,340)+fc(392,70,32)+fc(80,62,6)+fc(150,120,5)+fc(60,180,5)+
 fr(60,240,300,14,7)+fe(190,196,46,58)+fc(172,178,16)+fc(208,178,16)+fp('M190 194 182 206 198 206Z')+
 det('<circle cx="172" cy="178" r="6" fill="'+INK+'" stroke="none"/><circle cx="208" cy="178" r="6" fill="'+INK+'" stroke="none"/><path d="M172 226q18 10 36 0" fill="none" stroke-width="2"/>');}},
{n:'Fruit Basket',s:function(){return fr(0,0,480,340)+fr(40,272,400,18,8)+
 fp('M150 192h180l-22 82H172Z')+fc(210,176,21)+fc(252,172,20)+
 fc(286,164,10)+fc(298,174,10)+fc(290,182,10)+
 det('<path d="M172 194q68-62 136 0" fill="none"/><path d="M160 224h160M165 246h150" fill="none" stroke-width="2"/>');}},
{n:'Tea Time',s:function(){return fr(0,0,480,340)+fr(40,272,400,18,8)+
 fe(180,264,56,12)+fr(146,208,70,50,10)+fp('M300 242l9 24h44l9-24Z')+fe(331,240,34,18)+fc(331,214,8)+
 det('<path d="M218 216q10 10 0 20t0 20" fill="none" stroke-width="2"/><path d="M244 216q10 10 0 20t0 20" fill="none" stroke-width="2"/><path d="M216 224q-16 4-14 26" fill="none"/>');}},
{n:'Choo Choo Train',s:function(){return fr(0,0,480,340)+fr(0,274,480,66)+
 fr(90,172,180,102,10)+fr(228,122,84,152,10)+fr(220,110,100,16,6)+fr(120,130,26,44,6)+fc(134,108,15)+
 fc(132,276,22)+fc(192,276,22)+fc(272,276,22)+
 det('<path d="M0 276h480" fill="none" stroke-width="4"/><path d="M118 200h124M244 150h52" fill="none" stroke-width="2"/>');}},
{n:'Hill Castle',s:function(){return fr(0,0,480,340)+fp('M0 340q240-120 480 0Z')+
 fr(150,192,180,88,4)+fr(118,142,52,138,6)+fr(310,142,52,138,6)+
 fp('M114 148 144 102 174 148Z')+fp('M306 148 336 102 366 148Z')+
 fp('M216 280v-38a24 24 0 0 1 48 0v38Z')+fr(332,84,5,26,2)+fp('M337 84 372 94 337 104Z')+
 det('<path d="M150 236h180" fill="none" stroke-width="2"/>');}},
{n:'Duck Pond',s:function(){return fr(0,0,480,340)+fc(60,60,26)+fe(240,268,150,44)+
 fe(218,228,46,30)+fc(258,192,22)+fp('M278 186 302 194 278 202Z')+fe(206,224,22,14)+
 fe(120,262,34,12)+fe(352,268,30,11)+
 det('<circle cx="252" cy="186" r="3.2" fill="'+INK+'" stroke="none"/><path d="M96 240q6-24-4-34M116 244q6-20-2-30" fill="none" stroke-width="2"/>');}},
{n:'Holiday Tree',s:function(){return fr(0,0,480,340)+fr(0,282,480,58)+
 fr(224,250,32,32,4)+fp('M240 62 302 142 178 142Z')+fp('M240 112 322 202 158 202Z')+fp('M240 172 346 258 134 258Z')+
 fstar(240,44,20,8)+fc(206,190,11)+fc(268,176,11)+fc(240,230,11)+
 det('<path d="M180 150h120M158 210h164" fill="none" stroke-width="2"/>');}},
{n:'Egg Hunt',s:function(){return fr(0,0,480,340)+fr(0,252,480,88)+
 fp('M168 182h144l-17 66H185Z')+fe(200,160,17,23)+fe(240,148,17,23)+fe(280,160,17,23)+
 det('<path d="M20 316q6-16 0-28M44 318q6-14 0-26" fill="none" stroke="#4E9E44"/><path d="M178 192q66-56 124 0" fill="none"/><path d="M192 152q8-6 16 0M232 140q8-6 16 0" fill="none" stroke-width="2"/>');}},
{n:'Book Nook',s:function(){return fr(0,0,480,340)+fr(30,272,420,18,8)+
 fr(140,148,200,112,8)+fr(152,160,176,88,4)+fr(304,148,18,42,3)+
 fc(108,252,24)+fr(352,240,84,10,4)+fp('M436 240 458 245 436 250Z')+
 det('<path d="M152 176h176M152 196h176M152 216h176" fill="none" stroke-width="2"/><path d="M100 244c1-6 1-10 0-14" fill="none" stroke="#4E9E44"/>');}},
{n:'Rainy Day',s:function(){return fr(0,0,480,340)+
 fe(240,74,70,30)+fe(190,64,40,24)+fe(290,64,40,24)+
 fe(176,150,7,16)+fe(240,160,7,16)+fe(304,150,7,16)+
 fp('M150 212a90 90 0 0 1 180 0Z')+fr(236,212,9,52,4)+fe(240,318,90,14)+
 det('<path d="M240 122v90M186 206q54 14 108 0" fill="none" stroke-width="2"/>');}},
{n:'Ladybug Leaf',s:function(){return fr(0,0,480,340)+
 '<ellipse class="fillable" cx="240" cy="200" rx="140" ry="62" transform="rotate(-14 240 200)" fill="'+CF+'"/>'+
 fc(240,196,42)+fc(240,152,20)+
 fc(224,186,7)+fc(258,182,7)+fc(230,214,6)+fc(262,208,6)+
 det('<path d="M240 156v82" fill="none" stroke-width="2"/><path d="M120 216q120 26 240-16" fill="none" stroke-width="2" opacity=".5"/><path d="M228 138c-2-8-8-12-14-12M252 138c2-8 8-12 14-12" fill="none" stroke-width="2"/>');}},
{n:'Balloon Pup',s:function(){return fr(0,0,480,340)+fr(0,282,480,58)+
 fe(230,182,56,38)+fe(312,160,30,28)+fe(297,132,11,22)+fe(327,132,11,22)+
 fr(196,214,14,62,7)+fr(226,218,14,58,7)+fr(252,218,14,58,7)+fr(280,212,14,62,7)+
 '<ellipse class="fillable" cx="330" cy="128" rx="11" ry="26" transform="rotate(38 330 128)" fill="'+CF+'"/>'+
 det('<circle cx="322" cy="152" r="3.2" fill="'+INK+'" stroke="none"/><ellipse cx="336" cy="164" rx="5" ry="4" fill="'+INK+'" stroke="none"/><path d="M274 200q20 26 8 44" fill="none" stroke-dasharray="3 7"/>');}},
{n:'Snow Friend',s:function(){return fr(0,0,480,340)+fr(0,282,480,58)+
 fc(240,254,60)+fc(240,186,45)+fc(240,124,35)+
 fr(214,88,52,12,4)+fr(228,58,24,32,4)+fp('M240 122 272 128 240 136Z')+
 fr(134,156,72,9,4)+fr(274,156,72,9,4)+
 det('<circle cx="240" cy="176" r="4.4" fill="'+INK+'" stroke="none"/><circle cx="240" cy="194" r="4.4" fill="'+INK+'" stroke="none"/><circle cx="240" cy="212" r="4.4" fill="'+INK+'" stroke="none"/><circle cx="230" cy="116" r="3.2" fill="'+INK+'" stroke="none"/><circle cx="250" cy="116" r="3.2" fill="'+INK+'" stroke="none"/>');}}
];
function renderColoring(root){
 setWide(true);
 onCleanup(function(){setWide(false);});
 var curIdx=ri(0,SCENES.length-1);
 root.innerHTML=bubble('Scenes on the left, canvas in the middle, <b>50 named colors</b> on the right. Paint away!')+
  '<div class="csLayout">'+
  '<div><div class="sideTitle">🎨 Scenes</div>'+
   '<div class="sceneList" id="sceneList"></div>'+
   '<div class="center mt"><button class="btn small soft" id="btnLucky">'+ic('sparkle',15)+' Surprise me!</button></div></div>'+
  '<div class="center">'+
   '<div class="sceneWrap"><svg viewBox="0 0 480 340" id="scene"></svg></div>'+
   '<div class="btnRow mt"><button class="btn" id="clrReset">'+ic('reset')+' Start over</button></div></div>'+
  '<div><div class="sideTitle">🌈 Colors</div>'+
   '<div class="palCol"><div class="palGridV" id="palGrid"></div></div>'+
   '<div class="center mt"><span class="palBadge"><i id="palDot"></i><span id="palName"></span></span></div></div>'+
  '</div>';
 var curColor=COLORS50[8];
 var sceneBtns=[];
 var sl=$('#sceneList');
 SCENES.forEach(function(sc,i){
  var b=el('<button>'+sc.n+'</button>');
  b.addEventListener('click',function(){Sfx.play('click');loadScene(i);
   sl.scrollTop=b.offsetTop-sl.clientHeight/2;});
  sceneBtns.push(b);sl.appendChild(b);});
 $('#btnLucky').addEventListener('click',function(){Sfx.play('sparkle');loadScene(ri(0,SCENES.length-1));});
 function loadScene(i){curIdx=i;
  sceneBtns.forEach(function(b,j){b.classList.toggle('on',j===i);});
  var sc=SCENES[i];
  $('#scene').innerHTML='<g stroke="'+INK+'" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">'+sc.s()+'</g>';
  wirePaint();}
 var pg=$('#palGrid');
 COLORS50.forEach(function(c){
  var b=el('<button class="palV" style="background:'+c[1]+'" title="'+c[0]+'" aria-label="'+c[0]+'"></button>');
  b.addEventListener('click',function(){
   curColor=c;
   $$('#palGrid .palV').forEach(function(x){x.classList.remove('sel');});
   b.classList.add('sel');
   $('#palDot').style.background=c[1];
   $('#palName').textContent=c[0];
   Sfx.play('click');Voice.say(c[0]);});
  pg.appendChild(b);});
 function paintName(){var b=pg.children[COLORS50.indexOf(curColor)];
  if(b)b.classList.add('sel');
  $('#palDot').style.background=curColor[1];
  $('#palName').textContent=curColor[0];}
 function wirePaint(){
  $$('#scene .fillable').forEach(function(f){
   f.addEventListener('click',function(e){
    f.style.fill=curColor[1];Sfx.play('pop');Voice.say(curColor[0]);
    if(!f.getAttribute('data-p')){f.setAttribute('data-p','1');
     State.stats.colored++;save();
     if(State.stats.colored>=8)awardBadge('color-artist');
     addXP(3,e.clientX,e.clientY);}});});}
 $('#clrReset').addEventListener('click',function(){Sfx.play('click');loadScene(curIdx);});
 paintName();
 loadScene(curIdx);}
/* ===== SHAPE SAFARI: name list LEFT + playcard RIGHT ===== */
var FACE_OFF={
 circle:[0,0],square:[0,1],triangle:[0,7],star:[0,2],heart:[0,5],diamond:[0,0],
 rectangle:[0,0],oval:[0,0],pentagon:[0,2],hexagon:[0,0],crescent:[-9,0],
 parallelogram:[0,1],trapezoid:[0,1],rhombus:[0,0],arrow:[2,0],cross:[0,1],
 semicircle:[0,6],flower:[0,0],
 cube:[0,8],sphere:[0,4],cone:[-1,9],cylinder:[0,8],pyramid:[0,10]};
function faceLayer(dx,dy){
 return '<svg class="fcFaceSvg" viewBox="0 0 64 64"><g transform="translate('+dx+','+dy+')">'+
  '<g class="fcBlink">'+
  '<ellipse cx="25" cy="30" rx="6.5" ry="7.5" fill="#fff" stroke="'+INK+'" stroke-width="2.4"/>'+
  '<ellipse cx="39" cy="30" rx="6.5" ry="7.5" fill="#fff" stroke="'+INK+'" stroke-width="2.4"/>'+
  '<circle class="fcPupil" cx="26.5" cy="31" r="3" fill="'+INK+'"/>'+
  '<circle class="fcPupil" cx="40.5" cy="31" r="3" fill="'+INK+'"/></g>'+
  '<path d="M25 41q7 6 14 0" fill="none" stroke="'+INK+'" stroke-width="2.8" stroke-linecap="round"/>'+
  '<circle cx="17" cy="38" r="3" fill="#F7A1C4" opacity=".55" stroke="none"/>'+
  '<circle cx="47" cy="38" r="3" fill="#F7A1C4" opacity=".55" stroke="none"/>'+
  '</g></svg>';}
function sparkAt(l,t,s,d){
 return '<span class="fcSpark" style="left:'+l+';top:'+t+';animation-delay:'+d+'s">'+
  '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24"><path d="M12 2l2.2 7.3L22 12l-7.8 2.7L12 22l-2.2-7.3L2 12l7.8-2.7z" fill="#FFD24C" stroke="#3A2E39" stroke-width="1.6" stroke-linejoin="round"/></svg></span>';}
function renderMeetShapes(root){
 setWide(true);
 onCleanup(function(){setWide(false);});
 var DECK=[];
 Object.keys(SHAPES2D).forEach(function(n){DECK.push({n:n,dim:'2D'});});
 Object.keys(SHAPES3D).forEach(function(n){DECK.push({n:n,dim:'3D'});});
 var order=shuffle(DECK);
 var idx=0,autoTimer=null;
 if(!State.stats.shapesSeen)State.stats.shapesSeen={};
 root.innerHTML=bubble('All <b>'+(Object.keys(SHAPES2D).length+Object.keys(SHAPES3D).length)+' shapes</b> are listed on the <b>left</b>! The silly shape friend lives on the <b>right</b> — tap it to make it <b>BOING</b>, or press <b>Auto tour</b> and just watch!')+
  '<div class="shLayout">'+
  '<div><div class="sideTitle">🔷 Shapes</div>'+
  '<div class="shList" id="shList"></div></div>'+
  '<div>'+
   '<div class="fcCard" id="fcCard"></div>'+
   '<div class="center" style="max-width:560px;margin:14px auto 0">'+
    '<div class="btnRow" style="justify-content:space-between">'+
     '<span class="qNum" id="fcCount"></span>'+
     '<button class="btn small" id="fcShuffle">'+ic('reset',15)+' Shuffle</button></div>'+
    '<div class="fcNameBig" id="fcName"></div>'+
    '<div class="fcPet" id="fcPet"></div>'+
    '<p class="fcFact" id="fcFact"></p>'+
    '<button class="btn primary" id="fcSay" style="font-size:19px">'+ic('vol')+' Hear it</button>'+
    '<div class="btnRow mt" style="margin-top:18px">'+
     '<button class="btn" id="fcPrev" aria-label="Previous" style="padding:12px;border-radius:50%">'+ic('back',22)+'</button>'+
     '<button class="btn primary" id="fcAuto" style="background:var(--zs);font-size:19px">'+ic('play')+' Auto tour</button>'+
     '<button class="btn" id="fcNext" aria-label="Next" style="padding:12px;border-radius:50%"><span style="display:inline-block;transform:scaleX(-1)">'+ic('back',22)+'</span></button>'+
    '</div>'+
    '<div class="fcDots" id="fcDots"></div>'+
   '</div>'+
  '</div></div>';
 var cardEl=$('#fcCard');
 function speakCard(){var it=order[idx],info=SHAPE_INFO[it.n];
  Voice.say(cap(it.n)+'. '+info.pet+'. '+info.fact);}
 function paintCard(dir){
  var it=order[idx],n=it.n,col=shapeColor(n),info=SHAPE_INFO[n];
  var anim=pick(['fcWob','fcBob','fcPulse','fcSway']);
  cardEl.style.borderColor=col;
  cardEl.innerHTML='<span class="fcTag" style="background:'+col+'">'+(it.dim==='2D'?'2D Flat':'3D Solid')+'</span>'+
   '<div class="fcStage">'+
    sparkAt('12%','14%',24,0)+sparkAt('80%','10%',17,.6)+sparkAt('86%','68%',22,1.1)+sparkAt('10%','70%',16,1.5)+
    '<span class="'+anim+'"><span class="fcShapeWrap" id="fcShapeBtn" role="button" tabindex="0" title="Boing!">'+
     shapeSVG(n,col,175)+faceLayer(FACE_OFF[n]?FACE_OFF[n][0]:0,FACE_OFF[n]?FACE_OFF[n][1]:0)+
    '</span></span>'+
   '</div>';
  var nameEl=$('#fcName');
  nameEl.textContent=cap(n);
  nameEl.style.color=col;
  var petEl=$('#fcPet');
  petEl.textContent=info.pet;
  petEl.style.color=col;
  $('#fcFact').textContent=info.fact;
  $('#fcCount').innerHTML=ic('sparkle',14)+' Card '+(idx+1)+' of '+order.length;
  $$('#shList button').forEach(function(b,j){b.classList.toggle('on',j===idx);});
  var dots=$('#fcDots');dots.innerHTML='';
  order.forEach(function(o,i){
   var d=el('<button'+(i===idx?' class="on"':'')+' style="'+(i===idx?'background:'+shapeColor(o.n):'')+'" aria-label="Card '+(i+1)+'"></button>');
   d.addEventListener('click',function(){Sfx.play('click');stopAuto();idx=i;paintCard(1);});
   dots.appendChild(d);});
  cardEl.classList.remove('fcInR','fcInL');void cardEl.offsetWidth;
  cardEl.classList.add(dir<0?'fcInL':'fcInR');
  $('#fcSay').style.background=col;
  $('#fcSay').onclick=function(){Sfx.play('click');speakCard();};
  var sb=$('#fcShapeBtn');
  function boing(){Sfx.play('boing');
   sb.classList.remove('fcBigHop');void sb.offsetWidth;sb.classList.add('fcBigHop');
   Voice.say(pick(['Boing!','Whee!','Hop hop!','Boing boing!']));}
  sb.addEventListener('click',boing);
  sb.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();boing();}});
  if(!State.stats.shapesSeen[n]){State.stats.shapesSeen[n]=1;save();addXP(2);}
  speakCard();}
 function go(d){idx=(idx+d+order.length)%order.length;paintCard(d);}
 function stopAuto(){if(autoTimer){clearInterval(autoTimer);autoTimer=null;}
  var b=$('#fcAuto');if(b){b.innerHTML=ic('play')+' Auto tour';b.style.background='var(--zs)';}}
 var sl=$('#shList');
 DECK.forEach(function(o,i){
  var b=el('<button>'+cap(o.n)+'</button>');
  b.addEventListener('click',function(){Sfx.play('click');stopAuto();idx=i;paintCard(1);
   sl.scrollTop=b.offsetTop-sl.clientHeight/2;});
  sl.appendChild(b);});
 $('#fcNext').addEventListener('click',function(){stopAuto();go(1);Sfx.play('flip');});
 $('#fcPrev').addEventListener('click',function(){stopAuto();go(-1);Sfx.play('flip');});
 $('#fcShuffle').addEventListener('click',function(){Sfx.play('sparkle');stopAuto();
  order=shuffle(DECK);idx=0;paintCard(1);toast('Cards shuffled!','cards');});
 $('#fcAuto').addEventListener('click',function(){
  if(autoTimer){stopAuto();Sfx.play('click');return;}
  this.innerHTML=ic('pause')+' Pause tour';
  this.style.background='var(--zl)';
  speakCard();
  autoTimer=setInterval(function(){
   if(idx>=order.length-1){stopAuto();toast('Tour finished — you met every shape!','crown');return;}
   idx++;paintCard(1);},5200);});
 (function(){var sx=null;
  cardEl.addEventListener('touchstart',function(e){if(e.touches.length===1)sx=e.touches[0].clientX;},{passive:true});
  cardEl.addEventListener('touchend',function(e){if(sx===null)return;
   var dx=e.changedTouches[0].clientX-sx;
   if(Math.abs(dx)>46){stopAuto();go(dx<0?1:-1);Sfx.play('flip');}
   sx=null;},{passive:true});})();
 onCleanup(function(){stopAuto();stopSpeech();});
 paintCard(1);}
function renderShapeMatchGame(root,SET,kindLabel){
 var ALL=Object.keys(SET);
 var take=Math.min(6,ALL.length);
 var picked=shuffle(ALL).slice(0,take);
 if(kindLabel==='flat'&&picked.indexOf('star')<0)picked[0]='star';
 var queue=shuffle(picked),qi=0,matched=0,locked=false;
 var intro=(kindLabel==='flat')?'One flat shape at a time!':'One puffy solid shape at a time!';
 root.innerHTML=bubble(intro+' Look at the big shape up top and <b>tap its matching outline</b> below!')+
  '<div class="panel center">'+
  '<div class="btnRow" style="justify-content:space-between;margin:0 0 6px">'+
   '<span class="qNum" id="smProg"></span>'+
   '<button class="btn small" id="smNew">'+ic('reset')+' New round</button></div>'+
  '<div id="smTarget" style="margin:6px 0 2px"></div>'+
  '<div class="smSlots" id="slots"></div>'+
  '<div class="center" id="smMsg" style="font-weight:800;min-height:26px;color:var(--za)"></div></div>';
 $('#smNew').addEventListener('click',function(){Sfx.play('click');renderShapeMatchGame(root,SET,kindLabel);});
 function slotHTML(n){
  return '<button class="smSlotWrap" data-shape="'+n+'">'+
   '<span class="smSlot">'+shapeSVG(n,'#EFE6D6',56)+'</span>'+
   '<span class="smName">'+cap(n)+'</span></button>';}
 function paintTarget(){
  if(qi>=queue.length)return;
  var n=queue[qi],col=SET[n];
  $('#smTarget').innerHTML='<div class="pop" style="display:inline-flex;flex-direction:column;align-items:center;gap:4px">'+
   shapeSVG(n,col,84)+
   '<span style="font-family:\'Baloo 2\';font-weight:800;font-size:24px;color:'+col+'">'+cap(n)+'</span>'+
   '<span style="font-weight:800;font-size:14px;color:#8a7a6a">'+SHAPE_INFO[n].pet+'</span></div>';
  $('#smProg').innerHTML=ic('sparkle',14)+' Matched '+matched+' of '+queue.length;
  if(!State.muted)Voice.say('Find the '+n+'!');}
 function build(){
  matched=0;qi=0;locked=false;
  $('#smMsg').textContent='';
  $('#slots').innerHTML=picked.map(slotHTML).join('');
  $$('#slots .smSlotWrap').forEach(function(w){
   w.addEventListener('click',function(){
    if(locked||w.classList.contains('done'))return;
    var n=w.getAttribute('data-shape');
    if(n===queue[qi]){
     locked=true;
     w.classList.add('done');
     w.querySelector('.smSlot').innerHTML=shapeSVG(n,SET[n],56);
     Sfx.play('correct');
     $('#smMsg').textContent=cap(n)+' matched! '+pick(PRAISE);
     Voice.say(cap(n)+'. '+pick(PRAISE)+'!');
     addXP(4);
     matched++;qi++;
     if(qi>=queue.length){paintTarget();setTimeout(endRound,800);}
     else{setTimeout(function(){paintTarget();locked=false;},900);}}
    else{
     locked=true;
     w.classList.add('bad');
     Sfx.play('wrong');
     $('#smMsg').textContent='That is the '+n+'. Try again!';
     setTimeout(function(){w.classList.remove('bad');locked=false;},600);}});
  });
  paintTarget();}
 function endRound(){
  locked=true;
  Sfx.play('fanfare');celebrate();
  awardBadge('shape-master');
  addXP(20,innerWidth/2,innerHeight/2);
  $('#smMsg').textContent='All shapes matched!';
  var title=(kindLabel==='flat')?'All flat shapes matched!':'All solid shapes matched!';
  setTimeout(function(){
   openModal('<h3 style="font-size:28px">'+title+'</h3>'+
    '<p style="font-size:44px;color:var(--zw);letter-spacing:6px">\u2605\u2605\u2605</p>'+
    '<p style="font-weight:800">'+queue.length+' shapes, one by one!</p>'+
    '<div class="btnRow"><button class="btn primary" style="background:var(--zs);color:#fff" id="smAgain">'+ic('play')+' New round</button></div>');
   $('#smAgain').addEventListener('click',function(){closeModal();renderShapeMatchGame(root,SET,kindLabel);});
  },600);}
 build();}
/* ===== ANIMAL FOREST ===== */
function renderAnimals(root){
 setWide(true);
 onCleanup(function(){setWide(false);});
 var idx=ri(0,ANIMALS.length-1);
 root.innerHTML=bubble('50 animal friends! Names on the <b>left</b>, meet the animal on the <b>right</b> — every pick plays its voice!')+
  '<div class="anLayout">'+
  '<div><div class="sideTitle">🐾 Animal friends</div>'+
  '<div class="anList" id="anList"></div></div>'+
  '<div class="panel center" id="anCard" style="max-width:560px;margin:0 auto"></div></div>';
 var list=$('#anList');
 ANIMALS.forEach(function(a,i){
  var b=el('<button>'+a.name+'</button>');
  b.addEventListener('click',function(){Sfx.play('click');show(i);
   list.scrollTop=b.offsetTop-list.clientHeight/2;});
  list.appendChild(b);});
 function show(i){idx=i;
  var a=ANIMALS[i];
  $$('#anList button').forEach(function(b,j){b.classList.toggle('on',j===i);});
  $('#anCard').innerHTML=
   '<div class="qNum" style="margin-bottom:6px">'+ic('sparkle',14)+' Animal '+(i+1)+' of '+ANIMALS.length+'</div>'+
   '<div class="fcBob" style="width:170px;height:170px;margin:4px auto">'+ICONS[a.icon]+'</div>'+
   '<h3 style="font-size:34px;color:var(--za);margin:2px 0">'+a.name+'</h3>'+
   '<div class="factRow"><span class="lbl">Lives in</span><span>'+a.habitat+'</span></div>'+
   '<div class="factRow"><span class="lbl">Loves to eat</span><span>'+a.food+'</span></div>'+
   '<div class="factRow"><span class="lbl">Fun fact</span><span>'+a.fact+'</span></div>'+
   '<div class="btnRow"><button class="btn primary" id="anSnd" style="background:var(--za)">'+ic('vol')+' Hear me!</button>'+
   '<button class="btn" id="anPrev" aria-label="Previous" style="padding:10px;border-radius:50%">'+ic('back',18)+'</button>'+
   '<button class="btn" id="anNext" aria-label="Next" style="padding:10px;border-radius:50%"><span style="display:inline-block;transform:scaleX(-1)">'+ic('back',18)+'</span></button></div>';
  State.stats.animals[a.id]=1;save();
  if(Object.keys(State.stats.animals).length>=ANIMALS.length)awardBadge('animal-friend');
  addXP(2);
  $('#anSnd').addEventListener('click',function(){Sfx.sound(a.snd);setTimeout(function(){Voice.say(a.name);},650);});
  $('#anPrev').addEventListener('click',function(){Sfx.play('flip');show((idx-1+ANIMALS.length)%ANIMALS.length);});
  $('#anNext').addEventListener('click',function(){Sfx.play('flip');show((idx+1)%ANIMALS.length);});
  Sfx.sound(a.snd);
  setTimeout(function(){Voice.say(a.name+'! '+a.fact);},550);}
 show(idx);}
function renderSoundQuiz(root){
 root.innerHTML=bubble('Who is making this sound? Listen, then tap the animal!')+
  '<div class="panel center"><span class="qNum" id="sqNum"></span>'+
  '<div class="btnRow"><button class="btn primary" style="background:var(--za)" id="sqPlay">'+ic('vol')+' Play the sound</button></div>'+
  '<div class="opts" id="sqOpts"></div></div>';
 var ans=null,round=0,locked=false,total=6;
 function next(){locked=false;round++;
  $('#sqNum').innerHTML=ic('sparkle',14)+' Round '+round+' of '+total;
  var opts=shuffle(ANIMALS).slice(0,4);ans=pick(opts);
  var box=$('#sqOpts');box.innerHTML='';
  opts.forEach(function(a){
   var b=el('<button class="opt"><span style="width:64px;height:64px">'+ICONS[a.icon]+'</span><span class="optWord">'+a.name+'</span></button>');
   b.addEventListener('click',function(e){if(locked)return;
    if(a.id===ans.id){locked=true;b.classList.add('good');Sfx.play('correct');
     Voice.say(pick(PRAISE)+' That is the '+a.name+'!');addXP(5,e.clientX,e.clientY);
     setTimeout(function(){if(round<total)next();else end();},1100);}
    else{b.classList.add('bad','dim');Sfx.play('wrong');}});
   box.appendChild(b);});
  setTimeout(function(){Sfx.sound(ans.snd);},400);}
 $('#sqPlay').addEventListener('click',function(){if(ans)Sfx.sound(ans.snd);});
 function end(){celebrate();
  $('#sqOpts').innerHTML='<div><h3 style="font-size:26px">Super listening!</h3><button class="btn primary mt" style="background:var(--za)" id="sqAgain">'+ic('reset')+' Play again</button></div>';
  $('#sqAgain').addEventListener('click',function(){renderSoundQuiz(root);});}
 next();}
/* ===== PUZZLE ISLAND ===== */
function renderMemory(root){
 if(!State.stats.memStars)State.stats.memStars={};
 var lvl=State.stats.memoryLevel;
 function start(li){
  var deck=(li<MEM_DECKS.length)?MEM_DECKS[li]:megaDeck();
  var pairs=deck.icons.length;
  root.innerHTML=bubble('Level '+(li+1)+' — <b>'+deck.name+'</b>! Flip the cards and find the matching pairs!')+
   '<div class="panel center">'+
   '<div class="btnRow" style="margin:0 0 12px" id="mmLevels"></div>'+
   '<div class="btnRow" style="margin:0 0 4px"><span class="qNum" id="mmMoves">Moves: 0</span></div>'+
   '<div class="memBoard" id="memBoard"></div></div>';
  var lp=$('#mmLevels'),maxOpen=Math.min(lvl,MEM_DECKS.length),i;
  for(i=0;i<=maxOpen;i++){
   var st=State.stats.memStars['m'+i]||0;
   var b=el('<button class="btn small'+(i===li?' primary" style="background:var(--zp);color:#fff':'')+'">L'+(i+1)+(st?' \u2605'+st:'')+'</button>');
   b.addEventListener('click',function(idx){return function(){Sfx.play('click');start(idx);};}(i));
   lp.appendChild(b);}
  if(lvl>=MEM_DECKS.length){
   var mg=el('<button class="btn small'+(li>=MEM_DECKS.length?' primary" style="background:var(--zp);color:#fff':'')+'">\u221E Mega</button>');
   mg.addEventListener('click',function(){Sfx.play('click');start(MEM_DECKS.length);});
   lp.appendChild(mg);}
  var board=$('#memBoard');
  var cards=shuffle(deck.icons.concat(deck.icons));
  var openCards=[],lock=false,moves=0,found=0;
  cards.forEach(function(c){
   var face=ICONS[c]||('<b style="font-size:30px">'+(c.charAt(0)||'?').toUpperCase()+'</b>');
   var b=el('<button class="mem" data-n="'+c+'">'+
    '<span class="memIn"><span class="mFace mBack">?</span>'+
    '<span class="mFace mFront">'+face+'</span></span></button>');
   b.addEventListener('click',function(){
    if(lock||b.classList.contains('flip'))return;
    b.classList.add('flip');Sfx.play('flip');openCards.push(b);
    if(openCards.length===2){lock=true;moves++;$('#mmMoves').textContent='Moves: '+moves;
     var a=openCards[0],d=openCards[1];
     if(a.getAttribute('data-n')===d.getAttribute('data-n')){
      a.classList.add('done');d.classList.add('done');
      Sfx.play('correct');found++;openCards=[];lock=false;
      if(found===pairs)win();}
     else{setTimeout(function(){
      a.classList.remove('flip');d.classList.remove('flip');
      openCards=[];lock=false;Sfx.play('wrong');},750);}}});
   board.appendChild(b);});
  function win(){Sfx.play('fanfare');celebrate();
   awardBadge('memory-champ');
   var stars=moves<=Math.round(pairs*1.5)?3:(moves<=Math.round(pairs*2.2)?2:1);
   var key='m'+li;
   if(!State.stats.memStars[key]||stars>State.stats.memStars[key])State.stats.memStars[key]=stars;
   if(li===State.stats.memoryLevel)State.stats.memoryLevel=li+1;
   save();addXP(15+pairs*2,innerWidth/2,innerHeight/2);
   setTimeout(function(){
    openModal('<h3 style="font-size:28px">'+deck.name+' cleared!</h3>'+
     '<p style="font-size:44px;color:var(--zw);letter-spacing:6px">'+rep('\u2605',stars)+rep('\u2606',3-stars)+'</p>'+
     '<p style="font-weight:800">'+pairs+' pairs in '+moves+' moves'+(stars>=3?' — perfect!':'')+'</p>'+
     '<div class="btnRow"><button class="btn" id="mmAgain">'+ic('reset')+' Same level</button>'+
     '<button class="btn primary" style="background:var(--zp);color:#fff" id="mmNext">'+ic('play')+' Next level</button></div>');
    $('#mmAgain').addEventListener('click',function(){closeModal();start(li);});
    $('#mmNext').addEventListener('click',function(){closeModal();
     start(Math.min(State.stats.memoryLevel,MEM_DECKS.length));});
   },550);}
 }
 start(lvl);}
var PAT_COLORS=['#FF6B57','#2EC4B6','#FFC93C','#F15BB5','#58B368','#4A90D9','#FF9F1C','#8656C1'];
var PAT_SHAPES=['circle','square','triangle','star','heart','diamond','rectangle','oval','pentagon','hexagon','parallelogram','trapezoid','rhombus','cross','semicircle','flower'];
var PAT_LEVELS=[
 {name:'First Patterns',kind:'ab',rounds:4,hint:'Two colors take turns.'},
 {name:'Clever Twos',kind:'abb',rounds:4,hint:'One, then two of the same!'},
 {name:'Three Friends',kind:'abc',rounds:4,hint:'Three colors round and round.'},
 {name:'Shape Show',kind:'shape',rounds:4,hint:'Now the shapes make the pattern.'},
 {name:'Long Chains',kind:'abcd',rounds:5,hint:'Four colors in a long chain!'},
 {name:'Mind the Gap',kind:'middle',rounds:4,hint:'Something is missing in the MIDDLE.'},
 {name:'Double Trouble',kind:'double',rounds:4,hint:'Shape AND color both matter!'},
 {name:'Size & Count',kind:'sizecount',rounds:4,hint:'Patterns can grow and count!'}];
function patChoices(kind){
 if(kind==='ab')return 2;
 if(kind==='abcd'||kind==='double')return 4;
 return 3;}
function patItem(desc){
 if(!desc)return {bg:'#fff',html:''};
 if(desc.t==='c')return {bg:desc.color,html:''};
 if(desc.t==='s')return {bg:'#fff',html:shapeSVG(desc.shape,SHAPES2D[desc.shape],36)};
 if(desc.t==='sc')return {bg:'#fff',html:shapeSVG(desc.shape,desc.color,36)};
 if(desc.t==='size')return {bg:'#fff',html:shapeSVG(desc.shape,desc.color,desc.size)};
 if(desc.t==='count'){var h='<span style="display:flex;flex-wrap:wrap;gap:2px;justify-content:center;max-width:50px">';
  for(var i=0;i<desc.n;i++)h+='<span style="width:15px;height:15px">'+shapeSVG(desc.shape,desc.color,15)+'</span>';
  return {bg:'#FFF1D6',html:h+'</span>'};}
 return {bg:'#fff',html:''};}
function patGen(kind){
 if(kind==='sizecount')kind=pick(['size','count']);
 var seq=[],qIndex,correct,dpool=[];
 if(kind==='ab'){
  var cs=shuffle(PAT_COLORS).slice(0,2),n=ri(5,6),i;
  for(i=0;i<n;i++)seq.push({t:'c',color:cs[i%2],id:'c'+cs[i%2]});
  qIndex=seq.length;
  correct={t:'c',color:cs[seq.length%2],id:'c'+cs[seq.length%2]};
  dpool=[{t:'c',color:cs[1-(seq.length%2)],id:'c'+cs[1-(seq.length%2)]}];}
 else if(kind==='abb'){
  var c2=shuffle(PAT_COLORS).slice(0,2),j;
  for(j=0;j<6;j++){var cc=(j%3===0)?c2[0]:c2[1];seq.push({t:'c',color:cc,id:'c'+cc});}
  qIndex=6;
  correct={t:'c',color:c2[0],id:'c'+c2[0]};
  dpool=[{t:'c',color:c2[1],id:'c'+c2[1]}];}
 else if(kind==='abc'){
  var c3=shuffle(PAT_COLORS).slice(0,3),k;
  for(k=0;k<6;k++)seq.push({t:'c',color:c3[k%3],id:'c'+c3[k%3]});
  qIndex=6;
  correct={t:'c',color:c3[0],id:'c'+c3[0]};
  dpool=c3.slice(1).map(function(c){return {t:'c',color:c,id:'c'+c};});}
 else if(kind==='shape'){
  var ss=shuffle(PAT_SHAPES).slice(0,3),m;
  for(m=0;m<6;m++)seq.push({t:'s',shape:ss[m%3],id:'s'+ss[m%3]});
  qIndex=6;
  correct={t:'s',shape:ss[0],id:'s'+ss[0]};
  dpool=ss.slice(1).map(function(s){return {t:'s',shape:s,id:'s'+s};});}
 else if(kind==='abcd'){
  var c4=shuffle(PAT_COLORS).slice(0,4),p;
  for(p=0;p<8;p++)seq.push({t:'c',color:c4[p%4],id:'c'+c4[p%4]});
  qIndex=8;
  correct={t:'c',color:c4[0],id:'c'+c4[0]};
  dpool=c4.slice(1).map(function(c){return {t:'c',color:c,id:'c'+c};});}
 else if(kind==='middle'){
  var c5=shuffle(PAT_COLORS).slice(0,3),q;
  for(q=0;q<6;q++)seq.push({t:'c',color:c5[q%3],id:'c'+c5[q%3]});
  qIndex=ri(2,4);
  correct=seq[qIndex];
  dpool=c5.filter(function(c){return c!==correct.color;}).map(function(c){return {t:'c',color:c,id:'c'+c};});}
 else if(kind==='double'){
  var s1=pick(PAT_SHAPES),s2=pick(PAT_SHAPES.filter(function(x){return x!==s1;}));
  var dc=shuffle(PAT_COLORS).slice(0,2),w;
  for(w=0;w<4;w++){var sh=(w%2===0)?s1:s2,cl=(w%2===0)?dc[0]:dc[1];
   seq.push({t:'sc',shape:sh,color:cl,id:'sc'+sh+cl});}
  qIndex=4;
  correct={t:'sc',shape:s1,color:dc[0],id:'sc'+s1+dc[0]};
  dpool=[{t:'sc',shape:s1,color:dc[1],id:'trap1'},{t:'sc',shape:s2,color:dc[0],id:'trap2'}];
  var s3=pick(PAT_SHAPES.filter(function(x){return x!==s1&&x!==s2;}));
  dpool.push({t:'sc',shape:s3,color:dc[1],id:'trap3'});}
 else if(kind==='size'){
  var sh2=pick(PAT_SHAPES),col=pick(PAT_COLORS),sizes=[20,36,52],z;
  for(z=0;z<4;z++)seq.push({t:'size',shape:sh2,color:col,size:sizes[z%3],id:'z'+sizes[z%3]});
  qIndex=4;
  correct={t:'size',shape:sh2,color:col,size:sizes[1],id:'z'+sizes[1]};
  dpool=[{t:'size',shape:sh2,color:col,size:sizes[0],id:'z'+sizes[0]},
         {t:'size',shape:sh2,color:col,size:sizes[2],id:'z'+sizes[2]}];}
 else if(kind==='count'){
  var col2=pick(PAT_COLORS),sh3=pick(['star','heart','circle']),y;
  for(y=0;y<4;y++)seq.push({t:'count',n:(y%3)+1,color:col2,shape:sh3,id:'n'+((y%3)+1)});
  qIndex=4;
  correct={t:'count',n:2,color:col2,shape:sh3,id:'n2'};
  dpool=[{t:'count',n:1,color:col2,shape:sh3,id:'n1'},
         {t:'count',n:3,color:col2,shape:sh3,id:'n3'}];}
 return {seq:seq,qIndex:qIndex,correct:correct,dpool:dpool};}
function renderPattern(root){
 if(typeof State.stats.patternLevel!=='number')State.stats.patternLevel=0;
 if(!State.stats.patStars)State.stats.patStars={};
 var lvl=State.stats.patternLevel;
 function start(li){
  var isEndless=(li>=PAT_LEVELS.length);
  var L=isEndless?{name:'Endless Challenge',kind:'endless',rounds:5,hint:'Every round is a surprise!'}:PAT_LEVELS[li];
  root.innerHTML=bubble('Level '+(li+1)+' — <b>'+L.name+'</b>! '+L.hint+' Tap what comes next.')+
   '<div class="panel center">'+
   '<div class="btnRow" style="margin:0 0 12px" id="ptLevels"></div>'+
   '<div class="btnRow" style="margin:0 0 2px"><span class="qNum" id="ptNum"></span></div>'+
   '<div class="ptiles" id="ptSeq"></div><div class="ptiles" id="ptOpts"></div></div>';
  var lp=$('#ptLevels'),maxOpen=Math.min(lvl,PAT_LEVELS.length),i;
  for(i=0;i<=maxOpen;i++){
   var st=State.stats.patStars['p'+i]||0;
   var b=el('<button class="btn small'+(i===li?' primary" style="background:var(--zp);color:#fff':'')+'">L'+(i+1)+(st?' \u2605'+st:'')+'</button>');
   b.addEventListener('click',function(idx){return function(){Sfx.play('click');start(idx);};}(i));
   lp.appendChild(b);}
  if(lvl>=PAT_LEVELS.length){
   var eg=el('<button class="btn small'+(isEndless?' primary" style="background:var(--zp);color:#fff':'')+'">\u221E Endless</button>');
   eg.addEventListener('click',function(){Sfx.play('click');start(PAT_LEVELS.length);});
   lp.appendChild(eg);}
  var r=0,mistakes=0;
  function next(){
   var kind=isEndless?pick(['abb','abc','shape','abcd','middle','double','size','count']):L.kind;
   var nCh=patChoices(kind);
   var g=patGen(kind);
   $('#ptNum').innerHTML=ic('sparkle',14)+' Round '+(r+1)+' of '+L.rounds;
   var sq=$('#ptSeq');sq.innerHTML='';
   var shown=g.seq.slice(0,g.qIndex).concat([{q:1}],g.seq.slice(g.qIndex));
   shown.forEach(function(it){
    if(it.q){sq.appendChild(el('<div class="ptile q">?</div>'));return;}
    var d=patItem(it),t=el('<div class="ptile">'+d.html+'</div>');
    t.style.background=d.bg;sq.appendChild(t);});
   var seen={},dists=[];
   g.dpool.forEach(function(d){
    if(!seen[d.id]&&dists.length<nCh-1&&d.id!==g.correct.id){seen[d.id]=1;dists.push(d);}});
   while(dists.length<nCh-1){
    var f=(g.correct.t==='s'||g.correct.t==='sc')?
      {t:'s',shape:pick(PAT_SHAPES),id:'fx'+Math.random()}:
      {t:'c',color:pick(PAT_COLORS),id:'fx'+Math.random()};
    if(f.id!==g.correct.id){seen[f.id]=1;dists.push(f);}}
   var choices=shuffle([{v:g.correct,ok:true}].concat(dists.map(function(d){return {v:d,ok:false};})));
   var op=$('#ptOpts');op.innerHTML='';
   var locked=false;
   choices.forEach(function(ch){
    var d=patItem(ch.v);
    var t=el('<div class="ptile choice">'+d.html+'</div>');
    t.style.background=d.bg;
    t.addEventListener('click',function(e){
     if(locked)return;
     if(ch.ok){locked=true;Sfx.play('correct');
      addXP(5,e.clientX,e.clientY);Voice.say(pick(PRAISE));
      var qt=sq.querySelector('.ptile.q');
      if(qt){qt.classList.remove('q');qt.innerHTML=d.html;qt.style.background=d.bg;}
      setTimeout(function(){r++;if(r<L.rounds)next();else end();},900);}
     else{locked=true;mistakes++;Sfx.play('wrong');
      t.classList.add('bad');
      setTimeout(function(){t.classList.remove('bad');locked=false;},450);}});
    op.appendChild(t);});}
  function end(){Sfx.play('fanfare');celebrate();
   var stars=mistakes===0?3:(mistakes<=2?2:1);
   if(!isEndless){
    var key='p'+li;
    if(!State.stats.patStars[key]||stars>State.stats.patStars[key])State.stats.patStars[key]=stars;
    if(li===State.stats.patternLevel)State.stats.patternLevel=li+1;
    save();}
   addXP(10+L.rounds*2,innerWidth/2,innerHeight/2);
   setTimeout(function(){
    openModal('<h3 style="font-size:28px">'+L.name+' cleared!</h3>'+
     '<p style="font-size:44px;color:var(--zw);letter-spacing:6px">'+rep('\u2605',stars)+rep('\u2606',3-stars)+'</p>'+
     '<p style="font-weight:800">'+L.rounds+' patterns solved'+(mistakes===0?' with no mistakes!':' with '+mistakes+' mistake'+(mistakes>1?'s':''))+'</p>'+
     '<div class="btnRow"><button class="btn" id="ptAgain">'+ic('reset')+' '+(isEndless?'Again':'Same level')+'</button>'+
     (isEndless?'':'<button class="btn primary" style="background:var(--zp);color:#fff" id="ptNext">'+ic('play')+' Next level</button>')+'</div>');
    $('#ptAgain').addEventListener('click',function(){closeModal();start(li);});
    if(!isEndless)$('#ptNext').addEventListener('click',function(){closeModal();
     start(Math.min(State.stats.patternLevel,PAT_LEVELS.length));});
   },550);}
  next();}
 start(lvl);}
function renderOrder(root){
 root.innerHTML=bubble('Tap the numbers from the <b>SMALLEST</b> to the <b>BIGGEST</b>! Follow the hint at the top.')+
  '<div class="panel"><div class="center" style="margin-bottom:10px"><span class="qNum" id="ordHint"></span></div>'+
  '<div class="orderLine" id="ordLine"></div><div class="orderArea" id="ordArea"></div></div>';
 var SETS=[[3,1,5,2,4],[9,6,8,7,10],[13,11,15,12,14],[20,16,18,17,19],[27,24,29,25,28],[40,44,41,45,43]];
 var s=0;
 function next(){var set=SETS[s];
  var sorted=set.slice().sort(function(a,b){return a-b;});
  var expect=0;
  var line=$('#ordLine');line.innerHTML='';
  set.forEach(function(){line.appendChild(el('<span class="slotChip"></span>'));});
  var area=$('#ordArea');area.innerHTML='';
  $('#ordHint').innerHTML=ic('sparkle',14)+' Set '+(s+1)+' of '+SETS.length+' — find <b>'+sorted[0]+'</b> first!';
  var spots=[],i;
  for(i=0;i<set.length;i++)spots.push({x:6+(i%3)*30+rand(-3,3),y:8+Math.floor(i/3)*34+rand(-3,3)});
  spots=shuffle(spots);
  shuffle(set).forEach(function(n,i2){
   var t=el('<button class="orderTile" style="left:'+spots[i2].x+'%;top:'+spots[i2].y+'%">'+n+'</button>');
   t.addEventListener('click',function(){
    if(+t.textContent===sorted[expect]){
     t.style.transition='transform .3s,opacity .3s';
     t.style.transform='scale(0)';t.style.opacity='0';
     t.style.pointerEvents='none';
     setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},330);
     var slot=$$('#ordLine .slotChip')[expect];
     slot.textContent=n;slot.classList.add('fill');
     Sfx.play('pop');Voice.say(String(n));expect++;
     if(expect>=sorted.length){
      Sfx.play('correct');Voice.say(pick(PRAISE));addXP(10,innerWidth/2,innerHeight/2);
      setTimeout(function(){s++;if(s<SETS.length)next();else end();},900);}
     else{$('#ordHint').innerHTML=ic('sparkle',14)+' Great! Now find <b>'+sorted[expect]+'</b>';}}
    else{t.classList.add('bad');Sfx.play('wrong');setTimeout(function(){t.classList.remove('bad');},450);}});
   area.appendChild(t);});}
 function end(){celebrate();
  $('#ordArea').innerHTML='<div style="display:grid;place-items:center;height:100%"><div class="center"><h3 style="font-size:26px">All in order!</h3>'+
  '<button class="btn primary mt" style="background:var(--zp)" id="ordAgain">'+ic('reset')+' Play again</button></div></div>';
  $('#ordAgain').addEventListener('click',function(){s=0;renderOrder(root);});}
 next();}
/* ===== RHYME ROOM ===== */
function renderRhymes(root,flt){
 flt=flt||'all';
 var rows=[];RHYMES.forEach(function(r,i){if(flt==='all'||r.lang===flt)rows.push(i);});
 root.innerHTML=bubble('Pick a rhyme! I can play the tune while you sing along with the ball.')+
  '<div id="rhFilters" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:2px 0 12px">'+
  '<button class="tab'+(flt==='all'?' on':'')+'" data-f="all">All '+RHYMES.length+'</button>'+
  '<button class="tab'+(flt==='en'?' on':'')+'" data-f="en">English</button>'+
  '<button class="tab'+(flt==='bn'?' on':'')+'" data-f="bn" style="font-family:\'Noto Sans Bengali\',sans-serif">\u09AC\u09BE\u0982\u09B2\u09BE</button></div>'+
  '<div id="rhList">'+rows.map(function(i){var r=RHYMES[i];
   return '<div class="rhymeRow" data-i="'+i+'"><span class="artWrap">'+ic(r.icon,30)+'</span>'+
   '<div><h3 style="font-size:21px"'+(r.lang==='bn'?' class="bn"':'')+'>'+r.title+'</h3>'+
   '<span class="langTag'+(r.lang==='bn'?' bn':'')+'">'+r.tag+'</span></div>'+
   '<span style="margin-left:auto;color:var(--zr)">'+ic('play',26)+'</span></div>';}).join('')+'</div><div id="rhPlayer"></div>';
 $$('#rhFilters .tab').forEach(function(b){
  b.addEventListener('click',function(){renderRhymes(root,b.getAttribute('data-f'));});});
 $$('#rhList .rhymeRow').forEach(function(row){
  row.addEventListener('click',function(){openPlayer(+row.getAttribute('data-i'));});});
 function openPlayer(i){var r=RHYMES[i];Sfx.play('click');
  $('#rhList').innerHTML='';
  $('#rhPlayer').innerHTML='<div class="panel" style="max-width:700px;margin:0 auto">'+
   '<div class="center"><h3 style="font-size:28px"'+(r.lang==='bn'?' class="bn"':'')+'>'+r.title+'</h3>'+
   '<span class="langTag'+(r.lang==='bn'?' bn':'')+'">'+r.tag+' - sing along!</span></div>'+
   '<div class="lyrics'+(r.lang==='bn'?' bn':'')+'" id="lyrics"><span id="singBall"></span></div>'+
   '<div class="rhCtl"><button class="btn primary" style="background:var(--zr)" id="rhPlay">'+ic('play')+' Sing</button>'+
   '<button class="btn" id="rhStop">'+ic('reset')+' Stop</button>'+
   '<button class="btn" id="rhSlow">'+ic('sparkle')+' Slow / Fast</button>'+
   '<button class="btn soft" id="rhRead">'+ic('vol')+' Read to me</button>'+
   '<button class="btn" id="rhBack">'+ic('back')+' All rhymes</button></div></div>';
  var lyr=$('#lyrics'),ball=$('#singBall');
  var flat=[],lineStart=[];
  r.lines.forEach(function(line,li2){lineStart[li2]=flat.length;
   line.tokens.forEach(function(t){flat.push({t:t[0],line:li2,el:null});});});
  flat.forEach(function(f){var s=el('<span class="tok">'+f.t+'</span>');
   lyr.appendChild(s);lyr.appendChild(document.createTextNode(' '));f.el=s;});
  var li=0,playing=false,slow=false,timeouts=[],oscs=[];
  function clearT(){timeouts.forEach(clearTimeout);timeouts=[];}
  function stopOscs(){oscs.forEach(function(o){try{o.stop();}catch(e){}});oscs=[];}
  function clearMarks(){flat.forEach(function(f){if(f.el)f.el.classList.remove('active','done');});ball.style.display='none';}
  function setActive(i2){flat.forEach(function(f){if(f.el)f.el.classList.remove('active');});
   for(var k=0;k<i2;k++){if(flat[k].el)flat[k].el.classList.add('done');}
   if(i2>=flat.length)return;
   var f=flat[i2];f.el.classList.add('active');
   ball.style.display='block';
   ball.style.left=(f.el.offsetLeft+f.el.offsetWidth/2-10)+'px';
   ball.style.top=(f.el.offsetTop-24)+'px';}
  function note(freq,at,dur){var c=Sfx.ac();if(!c)return;
   try{
    var o=c.createOscillator(),g=c.createGain();
    o.type='triangle';o.frequency.value=freq;
    g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.22,at+.02);
    g.gain.setValueAtTime(.2,at+dur*.7);g.gain.linearRampToValueAtTime(.0001,at+dur);
    o.connect(g);g.connect(c.destination);o.start(at);o.stop(at+dur+.05);oscs.push(o);
    var o2=c.createOscillator(),g2=c.createGain();
    o2.type='sine';o2.frequency.value=freq*2;
    g2.gain.setValueAtTime(0,at);g2.gain.linearRampToValueAtTime(.05,at+.02);
    g2.gain.exponentialRampToValueAtTime(.0001,at+dur*.9);
    o2.connect(g2);g2.connect(c.destination);o2.start(at);o2.stop(at+dur+.05);oscs.push(o2);
   }catch(e){}}
  function startLine(lineIdx){if(!playing)return;li=lineIdx;
   var line=r.lines[lineIdx],beat=60/(slow?r.tempo*.68:r.tempo);
   var delay0=0,endDelay;
   var c=Sfx.ac();
   if(c){var t=c.currentTime+.15,tt=t;
    line.notes.forEach(function(n){note(NOTE[n[0]],tt,n[1]*beat);tt+=n[1]*beat;});
    delay0=(t-c.currentTime)*1000;endDelay=(tt-c.currentTime)*1000+beat*600;}
   else{var beats=0;line.tokens.forEach(function(t){beats+=t[1];});endDelay=beats*beat*1000+beat*600;}
   var bi=0;
   line.tokens.forEach(function(tok,ti){
    timeouts.push(setTimeout(function(){setActive(lineStart[lineIdx]+ti);},delay0+bi*beat*1000));
    bi+=tok[1];});
   timeouts.push(setTimeout(function(){if(!playing)return;
    if(lineIdx+1<r.lines.length)startLine(lineIdx+1);else finishSong();},endDelay));}
  function finishSong(){playing=false;ball.style.display='none';clearT();stopOscs();
   $('#rhPlay').innerHTML=ic('play')+' Sing';Sfx.play('fanfare');celebrate();
   if(!State.stats.rhymes[r.id]){State.stats.rhymes[r.id]=1;save();addXP(15);}
   awardBadge('rhyme-singer');Voice.say(pick(PRAISE)+' You sang the whole rhyme!');}
  $('#rhPlay').addEventListener('click',function(){
   if(playing){playing=false;clearT();stopOscs();ball.style.display='none';
    this.innerHTML=ic('play')+' Sing';}
   else{playing=true;Sfx.play('click');this.innerHTML=ic('pause')+' Pause';
    if(li>=r.lines.length)li=0;startLine(li);}});
  $('#rhStop').addEventListener('click',function(){playing=false;clearT();stopOscs();li=0;clearMarks();
   $('#rhPlay').innerHTML=ic('play')+' Sing';});
  $('#rhSlow').addEventListener('click',function(){slow=!slow;
   this.style.background=slow?'var(--zr)':'';this.style.color=slow?'#fff':'';
   if(playing){playing=false;clearT();stopOscs();playing=true;startLine(li);}});
  $('#rhRead').addEventListener('click',function(){
   playing=false;clearT();stopOscs();clearMarks();stopSpeech();
   var lang=r.lang==='bn'?'bn-IN':'en-US';
   r.lines.forEach(function(line,li2){
    timeouts.push(setTimeout(function(){
     var k;for(k=lineStart[li2];k<lineStart[li2]+line.tokens.length;k++){flat[k].el.classList.add('active');}
     if(li2>0){for(k=0;k<lineStart[li2];k++)flat[k].el.classList.add('done');}
     if(!State.muted){try{if(window.speechSynthesis){
      var txt=line.tokens.map(function(t){return t[0];}).join(' ').split('-').join('');
      var u=new SpeechSynthesisUtterance(txt);u.lang=lang;u.rate=.85;speechSynthesis.speak(u);}}catch(e){}}},li2*2600));});});
  $('#rhBack').addEventListener('click',function(){playing=false;clearT();stopOscs();stopSpeech();renderRhymes(root);});
  onCleanup(function(){playing=false;clearT();stopOscs();stopSpeech();});}}
/* ===== QUIZ CASTLE ===== */
function renderQuizCastle(root){
 root.innerHTML='<div class="panel castleIntro">'+
  '<div style="width:110px;height:110px;margin:0 auto 8px;color:var(--zq)"><svg width="110" height="110"><use href="#i-trophy"/></svg></div>'+
  '<h3 style="font-size:30px">Welcome, brave learner!</h3>'+
  '<p style="font-weight:800;margin:10px 0">10 questions. The castle watches how you do. Answer well and the questions get bigger and braver!</p>'+
  '<p style="color:var(--zl);font-weight:800;margin-bottom:14px">'+ic('flame',18)+' Chain 7 correct answers for the On Fire badge!</p>'+
  '<button class="btn primary" style="background:var(--zq);font-size:20px" id="qStart">'+ic('play')+' Begin the challenge</button></div>';
 $('#qStart').addEventListener('click',startRound);
 function startRound(){Sfx.play('fanfare');
  root.innerHTML='<div class="panel qCard" id="qCard">'+
   '<div class="scoreDots" id="qDots">'+rep('<i></i>',10)+'</div>'+
   '<div class="btnRow" style="justify-content:space-between;margin:4px 0 10px">'+
   '<span class="qNum" id="qLvl"></span><span class="qNum" id="qStreak" style="color:var(--zl)"></span></div>'+
   '<div class="qPrompt" id="qP"></div><div class="qVis" id="qV"></div><div class="opts" id="qO"></div></div>';
  var qn=0,correct=0,streak=0,miss=0,lvl=1,locked=false,lastTopic='',total=10;
  var shapeNames=Object.keys(SHAPES2D);
  var colorNames={red:'#E23E57',orange:'#FF9F1C',yellow:'#FFD24C',green:'#58B368',blue:'#4A90D9',pink:'#F7A1C4'};
  function pool(){var g1=[
    function(){var L=pick('ABCDEFGHIJ'.split(''));return {topic:'letter',say:'Tap the letter '+L,
     vis:'<div class="q-big">'+L+'</div>',
     opts:shuffle([L].concat(shuffle('KLMNOP'.split('')).slice(0,2))).map(function(x){return {h:x,ok:x===L};})};},
    function(){var n=ri(2,6),d='';for(var i=0;i<n;i++)d+='<i style="background:#FFD24C">\u2605</i>';
     return {topic:'count',say:'How many stars do you see?',vis:'<span class="dotG">'+d+'</span>',
     opts:shuffle([n,n+1,n-1]).map(function(x){return {h:String(x),ok:x===n};})};},
    function(){var c=shuffle(Object.keys(colorNames)).slice(0,3),a=c[0];
     return {topic:'color',say:'What color is this?',vis:'<span class="swatch" style="background:'+colorNames[a]+'"></span>',
     opts:shuffle(c).map(function(x){return {h:cap(x),ok:x===a};})};},
    function(){var s=shuffle(shapeNames).slice(0,3),a=s[0];
     return {topic:'shape',say:'Which flat shape is this?',vis:shapeSVG(a,SHAPES2D[a],96),
     opts:shuffle(s).map(function(x){return {h:cap(x),ok:x===a};})};}];
   var g2=[
    function(){var n=ri(2,19),after=Math.random()<.5,ans=after?n+1:n-1;
     return {topic:'seq',say:'What number comes '+(after?'after':'before')+' '+n+'?',
     vis:'<div class="q-big" style="font-size:64px">'+n+'</div>',
     opts:shuffle([ans,after?n+2:n-2,n+3]).map(function(x){return {h:String(x),ok:x===ans};})};},
    function(){var a=ri(1,9),b=ri(1,10-a);
     return {topic:'sum',say:'How much is '+a+' plus '+b+'?',
     vis:'<div style="font-family:\'Baloo 2\';font-weight:800;font-size:40px;color:var(--zq)">'+a+' + '+b+' = ?</div>',
     opts:shuffle([a+b,a+b+1,a+b-1]).map(function(x){return {h:String(x),ok:x===a+b};})};},
    function(){var w=shuffle(LETTER_WORDS).slice(0,3),a=w[0];
     return {topic:'sound',say:'Which one starts with the letter '+a[0]+'?',
     vis:'<div class="q-big" style="font-size:56px">'+a[0]+'?</div>',
     opts:shuffle(w).map(function(x){return {h:'<span style="width:58px;height:58px">'+ICONS[x[2]]+'</span>',word:x[1],ok:x===a};})};},
    function(){var s3=Object.keys(SHAPES3D),ss=shuffle(s3).slice(0,3),a=ss[0];
     return {topic:'solid',say:'Which solid shape is this?',
     vis:shapeSVG(a,SHAPES3D[a],96),
     opts:shuffle(ss).map(function(x){return {h:cap(x),ok:x===a};})};}];
   var g3=[
    function(){var n=ri(20,98),after=Math.random()<.5,ans=after?n+1:n-1;
     return {topic:'seq',say:'What number comes '+(after?'after':'before')+' '+n+'?',
     vis:'<div class="q-big" style="font-size:64px">'+n+'</div>',
     opts:shuffle([ans,after?n+2:n-2,n+5]).map(function(x){return {h:String(x),ok:x===ans};})};},
    function(){var a=ri(6,20),b=ri(1,a-1),ans=a-b;
     var d='';for(var i=0;i<a;i++)d+='<i style="background:#B5E3A0"'+(i>=ans?' class="off"':'')+'></i>';
     return {topic:'sub',say:'How much is '+a+' minus '+b+'?',
     vis:'<span class="dotG">'+d+'</span>',
     opts:shuffle([ans,ans+1,ans-1]).map(function(x){return {h:String(x),ok:x===ans};})};},
    function(){var step=pick([2,5,10]),st=ri(1,4)*step;
     return {topic:'skip',say:'Count by '+step+'s. What comes next?',
     vis:'<div style="font-family:\'Baloo 2\';font-weight:800;font-size:30px">'+st+', '+(st+step)+', '+(st+step*2)+', <span style="color:var(--zq)">?</span></div>',
     opts:shuffle([st+step*3,st+step*4,st+step]).map(function(x){return {h:String(x),ok:x===st+step*3};})};}];
  return (lvl===1)?g1:((lvl===2)?g2:g3);}
  function ask(){locked=false;
   var g,tries=0;
   do{g=pick(pool())();tries++;}while(g.topic===lastTopic&&tries<5);
   lastTopic=g.topic;
   $('#qLvl').textContent='Castle level '+lvl;
   $('#qStreak').textContent=streak+' in a row';
   var dotList=$$('#qDots i');if(dotList[qn])dotList[qn].style.background='#FFF1D6';
   $('#qP').textContent=g.say;$('#qV').innerHTML=g.vis;
   if(!State.muted)Voice.say(g.say);
   var box=$('#qO');box.innerHTML='';
   var stamp=$('.stamp');if(stamp&&stamp.parentNode)stamp.parentNode.removeChild(stamp);
   g.opts.forEach(function(o){
    var b=el('<button class="opt">'+o.h+(o.word?'<span class="optWord">'+o.word+'</span>':'')+'</button>');
    b.addEventListener('click',function(e){if(locked)return;
     if(o.ok){locked=true;correct++;streak++;miss=0;b.classList.add('good');
      var st2=el('<span class="stamp" style="background:#8FD974;color:#fff">'+pick(PRAISE)+'</span>');
      $('#qCard').appendChild(st2);
      if(dotList[qn])dotList[qn].classList.add('ok');
      Sfx.play('correct');addXP(5,e.clientX,e.clientY);
      if(streak>=7)awardBadge('on-fire');
      if(streak>=2&&lvl<3){lvl++;toast('The castle is impressed. Harder questions!','trophy');}
      setTimeout(function(){qn++;if(qn<total)ask();else end();},1000);}
     else{miss++;streak=0;b.classList.add('bad','dim');
      if(dotList[qn])dotList[qn].classList.add('no');
      Sfx.play('wrong');
      var st3=$('.stamp');if(st3&&st3.parentNode)st3.parentNode.removeChild(st3);
      $('#qCard').appendChild(el('<span class="stamp" style="background:#FFC93C">Almost! Try again</span>'));
      if(miss>=2&&lvl>1){lvl--;miss=0;toast('Let us try some easier ones.','back');}
      setTimeout(function(){b.classList.remove('dim');},600);}});
    box.appendChild(b);});}
  function end(){State.stats.quizRounds++;save();awardBadge('quiz-knight');
   var stars=(correct>=9?3:(correct>=7?2:(correct>=4?1:0)));
   var xp=correct*5+(stars===3?25:0);
   addXP(xp);if(stars===3)setTimeout(celebrate,300);
   $('#qCard').innerHTML='<h3 style="font-size:30px">Challenge complete!</h3>'+
    '<p style="font-size:44px;color:var(--zw);letter-spacing:6px">'+rep('\u2605',stars)+rep('\u2606',3-stars)+'</p>'+
    '<p style="font-weight:800;font-size:18px">'+correct+' of '+total+' right. '+xp+' stars earned!</p>'+
    '<div class="btnRow mt"><button class="btn primary" style="background:var(--zq)" id="qAgain">'+ic('reset')+' Challenge again</button></div>';
   $('#qAgain').addEventListener('click',startRound);}
  ask();}}
/* ===== REWARDS ===== */
function renderRewards(root){
 var L=levelInfo(State.xp),pct=Math.min(100,Math.round(L.cur/L.need*100));
 var C=2*Math.PI*58;
 var html='<div class="panel rwHero">'+
  '<div style="width:150px;height:150px"><svg viewBox="0 0 140 140">'+
  '<circle cx="70" cy="70" r="58" fill="#fff" stroke="'+INK+'" stroke-width="4"/>'+
  '<circle cx="70" cy="70" r="58" fill="none" stroke="#E8A200" stroke-width="9" stroke-linecap="round" stroke-dasharray="'+(C*pct/100)+' '+C+'" transform="rotate(-90 70 70)"/>'+
  '<text x="70" y="66" text-anchor="middle" font-family="Baloo 2, cursive" font-weight="800" font-size="34" fill="'+INK+'">'+L.lvl+'</text>'+
  '<text x="70" y="90" text-anchor="middle" font-family="Baloo 2, cursive" font-weight:700;font-size="14" fill="#8a7a6a">LEVEL</text></svg></div>'+
  '<div style="min-width:230px"><div class="rwLevelT">'+L.title+'</div><div class="rwTitle">Level '+L.lvl+'</div>'+
  '<div class="xpBar"><i style="width:'+pct+'%"></i></div>'+
  '<p style="font-weight:800;font-size:14px">'+L.cur+' / '+L.need+' stars to level '+(L.lvl+1)+'</p>'+
  '<p style="font-weight:800;margin-top:8px;color:var(--zl)">'+ic('flame',22)+' '+State.streak.n+' day streak!</p></div></div>'+
  '<h3 class="center mt" style="font-size:24px">Badge Collection ('+Object.keys(State.badges).length+'/'+Object.keys(BADGES).length+')</h3><div class="badgeGrid">';
 Object.keys(BADGES).forEach(function(id){
  var has=!!State.badges[id];
  html+='<button class="bdg'+(has?'':' locked')+'" data-b="'+id+'">'+
   '<span class="artWrap"><svg width="28" height="28"><use href="#i-'+(has?BADGES[id][1]:'lock')+'"/></svg></span>'+BADGES[id][0]+'</button>';});
 html+='</div>';
 root.innerHTML=html;
 $$('.bdg').forEach(function(b){
  b.addEventListener('click',function(){
   var id=b.getAttribute('data-b');
   toast(BADGES[id][0]+' - '+BADGES[id][2],State.badges[id]?BADGES[id][1]:'lock');});});}
/* ===== grown-ups ===== */
 $('#btnParents').addEventListener('click',function(){Sfx.play('click');
 openModal('<h3>For grown-ups</h3>'+
  '<p style="font-weight:700;font-size:15px;line-height:1.6">KIDS EDUVERSE stores activity locally while you play. Sign in with a parent account to sync a learning summary and badges to the secure backend.</p>'+
  '<ul style="font-weight:700;font-size:15px;margin:12px 0;text-align:left;line-height:1.8;padding-left:20px">'+
  '<li>Tap any land on the map to begin. The castle quiz adapts to answers.</li>'+
  '<li>Voice features use the built-in speech of your device.</li><li>Parent accounts require a valid email and a password of at least 8 characters.</li><li>Progress saves in this browser and syncs to the cloud when a parent is signed in. When the tab is closed there is one gentle exit reminder, so nobody loses stars by accident.</li></ul>'+
  '<button class="btn" id="btnResetAll" style="border-color:#C0392B;color:#C0392B;box-shadow:0 4px 0 #C0392B">'+ic('reset')+' Reset all progress</button>');
 var armed=false;
 $('#btnResetAll').addEventListener('click',function(){
  if(!armed){armed=true;this.innerHTML=ic('x')+' Tap again to erase everything';return;}
  try{localStorage.removeItem(KEY);}catch(e){}
  window.location.reload();});});
/* ===== login / sign up ===== */
var AUTH_USERS='kids-eduverse-users-v1',AUTH_SESSION='kids-eduverse-session-v1';
var AV_COLORS=['#FF6B57','#1FA9A0','#F15BB5','#58B368','#FF9F1C','#8656C1','#3FA7D6'];
function aUsers(){try{return JSON.parse(localStorage.getItem(AUTH_USERS)||'[]');}catch(e){return[];}}
function aSaveUsers(u){try{localStorage.setItem(AUTH_USERS,JSON.stringify(u));}catch(e){}}
function aSession(){try{return localStorage.getItem(AUTH_SESSION)||'';}catch(e){return'';}}
function aSetSession(em){try{if(em)localStorage.setItem(AUTH_SESSION,em);else localStorage.removeItem(AUTH_SESSION);}catch(e){}}
function aColor(em){var h=0,i;for(i=0;i<em.length;i++)h=(h*31+em.charCodeAt(i))>>>0;return AV_COLORS[h%AV_COLORS.length];}
function aEsc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function currentUser(){var em=aSession(),us=aUsers(),i;for(i=0;i<us.length;i++){if(us[i].email===em)return us[i];}var saved=localStorage.getItem('ke-user');try{return saved?JSON.parse(saved):null;}catch(e){return null;}}
function establishCloudSession(data){cloudToken=data.token;localStorage.setItem('ke-api-token',cloudToken);localStorage.setItem('ke-user',JSON.stringify(data.user));return api('/children','GET').then(function(r){if(r.children.length){cloudChild=r.children[0]._id;}else{return api('/children','POST',{nickname:(data.user.name||'Child').split(' ')[0]}).then(function(c){cloudChild=c.child._id;});}}).then(function(){localStorage.setItem('ke-child-id',cloudChild);syncCloud();});}
function paintAuth(){var b=$('#btnAuth'),u=currentUser();if(!b)return;
 if(u){b.classList.add('logged');
  b.innerHTML='<span class="avatar" style="background:'+aColor(u.email)+'">'+aEsc(u.name.charAt(0).toUpperCase())+'</span><b>'+aEsc(u.name.split(' ')[0])+'</b>';
  b.setAttribute('aria-label','Profile: '+u.name);}
 else{b.classList.remove('logged');b.innerHTML=ic('user',18)+'<b>Log in</b>';b.setAttribute('aria-label','Log in or sign up');}}
function authErr(m){var box=$('#authErr');if(box){box.innerHTML=m;box.style.display='block';}}
function authField(lbl,type,id,ph,ac){return '<div style="margin:10px 0;text-align:left">'+
 '<label for="'+id+'" style="font-family:\'Baloo 2\';font-weight:700;font-size:14px;display:block;margin-bottom:4px">'+lbl+'</label>'+
 '<input id="'+id+'" type="'+type+'" placeholder="'+ph+'" autocomplete="'+ac+'" style="width:100%;border:3px solid var(--ink);border-radius:14px;padding:10px 14px;font:800 16px \'Nunito\';background:#FFFDF7;box-shadow:0 3px 0 var(--ink);box-sizing:border-box"></div>';}
function openAuth(){var u=currentUser();Sfx.play('click');if(u)openProfile();else openAuthForm('signup');}
function openAuthForm(mode){var isUp=mode==='signup';
 var html='<h3 style="font-size:28px">'+(isUp?'Join Kids Eduverse!':'Welcome back!')+'</h3>'+
  '<p style="font-weight:700;font-size:14px;color:#8a7a6a;margin-bottom:6px">Create a parent account to save learning progress online.</p>'+
  '<div style="display:flex;gap:8px;justify-content:center;margin:12px 0">'+
  '<button class="tab'+(isUp?' on':'')+'" id="tabUp">Sign Up</button>'+
  '<button class="tab'+(isUp?'':' on')+'" id="tabIn">Log In</button></div>'+
  '<div id="authErr" style="display:none;background:#FFE3DD;border:3px solid #C0392B;color:#C0392B;border-radius:14px;padding:8px 12px;font-weight:800;font-size:14px;margin-bottom:4px"></div>'+
  '<form id="authForm" style="max-width:340px;margin:0 auto">';
 if(isUp)html+=authField('Your name','text','afName','e.g. Aarav','name');
 html+=authField('Email','email','afEmail','you@example.com','email')+
  authField('Password','password','afPass','At least 8 characters','current-password')+
  '<button class="btn primary" type="submit" style="background:'+(isUp?'var(--za)':'var(--zq)')+';font-size:19px;margin-top:6px">'+ic(isUp?'sparkle':'user',18)+' '+(isUp?'Create my profile':'Log in')+'</button></form>'+
  '<p style="font-weight:700;font-size:12.5px;color:#a0917f;margin-top:12px">Your parent account saves progress to the KIDS EDUVERSE database.</p>';
 openModal(html);
 $('#tabUp').addEventListener('click',function(){openAuthForm('signup');});
 $('#tabIn').addEventListener('click',function(){openAuthForm('login');});
 $('#authForm').addEventListener('submit',function(ev){ev.preventDefault();
  var name=isUp?($('#afName').value.trim()||''):'',email=($('#afEmail').value.trim()||'').toLowerCase(),pass=$('#afPass').value;
  $('#authErr').style.display='none';
  if(isUp&&name.length<2){authErr('Please enter your name (at least 2 letters).');return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){authErr('Please enter a valid email.');return;}
  if(pass.length<8){authErr('Password must have at least 8 characters.');return;}
  var submit=$('#authForm button[type=submit]'),submitLabel=$('#authForm button[type=submit]').textContent;submit.disabled=true;submit.textContent='Please wait�';
  api('/auth/'+(isUp?'register':'login'),'POST',isUp?{name:name,email:email,password:pass}:{email:email,password:pass})
   .then(establishCloudSession).then(function(){aSetSession(email);paintAuth();closeModal();Sfx.play('fanfare');
    toast((isUp?'Welcome, ':'Welcome back, ')+aEsc((name||email).split(' ')[0])+'! Progress sync is on.','user');})
   .catch(function(err){authErr(aEsc(err.message));Sfx.play('wrong');})
   .finally(function(){if(submit){submit.disabled=false;submit.textContent=submitLabel;}});
 });}
function openProfile(){var u=currentUser();if(!u){openAuthForm('login');return;}
 var L=levelInfo(State.xp),first=u.name.split(' ')[0];
 var html='<span class="avatar" style="background:'+aColor(u.email)+';width:74px;height:74px;font-size:34px;border-width:3.5px;margin:0 auto 8px">'+aEsc(u.name.charAt(0).toUpperCase())+'</span>'+
  '<h3 style="font-size:28px;margin:2px 0">'+aEsc(u.name)+'</h3>'+
  '<p style="font-weight:700;font-size:14px;color:#8a7a6a;margin-bottom:10px">'+aEsc(u.email)+(u.joined?' &middot; joined '+u.joined:'')+'</p>'+
  '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px 0 16px">'+
  '<span class="chip">'+ic('crown',17)+' Lv '+L.lvl+' &middot; '+L.title+'</span>'+
  '<span class="chip">'+ic('star',17)+' <b>'+State.xp+'</b> stars</span>'+
  '<span class="chip">'+ic('trophy',17)+' <b>'+Object.keys(State.badges).length+'/'+Object.keys(BADGES).length+'</b> badges</span></div>'+
  '<button class="btn" id="btnLogout" style="border-color:#C0392B;color:#C0392B;box-shadow:0 4px 0 #C0392B">'+ic('back',18)+' Log out</button>'+
  '<p style="font-weight:700;font-size:12.5px;color:#a0917f;margin-top:12px">Your stars and badges stay saved on this device even after logging out.</p>';
 openModal(html);
 $('#btnLogout').addEventListener('click',function(){aSetSession('');cloudToken='';cloudChild='';localStorage.removeItem('ke-api-token');localStorage.removeItem('ke-child-id');localStorage.removeItem('ke-user');paintAuth();closeModal();Sfx.play('pop');
  toast('Logged out. See you soon, '+aEsc(first)+'!','back');});}
$('#btnAuth').addEventListener('click',openAuth);
/* ===== save reminder on exit ===== */
window.addEventListener('beforeunload',function(e){
 var hasProgress=State.xp>0||Object.keys(State.badges).length>0;
 if(hasProgress){try{save();}catch(err){}
  e.preventDefault();
  e.returnValue='Your stars, badges and progress are saved on this device. Are you sure you want to leave?';
  return e.returnValue;}});
/* ===== init ===== */
updateHUD();refreshVisited();paintAuth();
})();
