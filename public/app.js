(function(){
let tracks=[];let people=[];let currentUser={};let state={completed:[],goal:null};
let assessmentQuestions=[];let assessmentResult=null;let assessmentAnswers=[];
const main=document.getElementById('main'),nav=[...document.querySelectorAll('.nav')];let current={view:'home'},selectedOption=null;const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const key=(t,l)=>t.lessons[l]?.id;const done=(t,l)=>state.completed.includes(key(t,l));let total=tracks.reduce((n,t)=>n+t.lessons.length,0);const percent=t=>t.lessons.length?Math.round(t.lessons.filter((_,i)=>done(t,i)).length/t.lessons.length*100):0;const save=()=>{};const notify=msg=>{const el=document.getElementById('toast');el.textContent=msg;el.style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.style.display='none',2800)};
function trackCard(t){let p=percent(t);return `<article class="card track"><span class="track-icon">${t.icon}</span><div><h3>${t.title}</h3><div class="meta">${t.level} · ${t.duration} · ${t.lessons.length} دروس</div></div><p>${t.description}</p><div class="progressbar" aria-label="الإنجاز ${p}%"><i style="width:${p}%"></i></div><footer><span class="meta">${p}% مكتمل</span><button data-go="lesson" data-track="${t.id}" data-index="${t.lessons.findIndex((_,i)=>!done(t,i))<0?0:t.lessons.findIndex((_,i)=>!done(t,i))}">${p?'متابعة':'ابدأ المسار'} ←</button></footer></article>`}
function home(){let completed=state.completed.length,goal=tracks.find(t=>t.id===state.goal),target=(goal?.lessons.length?goal:tracks.find(t=>t.lessons.length)),next=target.lessons.findIndex((_,i)=>!done(target,i));if(next<0)next=0;let assessmentBanner=assessmentResult?'':`<section class="card assessment-banner"><div><span class="eyebrow">قبل أن تبدأ</span><h3>خذ تقييم تحديد المستوى (10 أسئلة)</h3><p class="muted">يساعدنا نقترح لك أنسب مسار بداية حسب مستواك الحالي في الذكاء الاصطناعي.</p></div><button class="primary" data-go="assessment">ابدأ التقييم ←</button></section>`;return `${assessmentBanner}<section class="hero"><div><div class="eyebrow">تعلّم بالخطوات، وطبّق في عملك</div><h1>ماذا تريد أن تتعلم اليوم؟</h1><p>اختر مسارًا قصيرًا، اقرأ درسًا عمليًا، ثم اختبر فهمك. احفظ تقدمك على هذا المتصفح وتابع من حيث توقفت.</p><button class="primary" data-go="tracks">استكشف المسارات <span>←</span></button></div><div class="hero-visual"><div class="orbit"><b>AI</b></div></div></section><div class="stats"><div class="stat"><span class="stat-icon">▦</span><div><strong>${tracks.length}</strong><small>مسارات تعليمية</small></div></div><div class="stat"><span class="stat-icon">✓</span><div><strong>${completed}/${total}</strong><small>دروس مكتملة</small></div></div><div class="stat"><span class="stat-icon">◷</span><div><strong>${Math.round(completed/total*100)}%</strong><small>نسبة التقدم</small></div></div></div><div class="grid2"><section><div class="heading"><div><span class="eyebrow">خطوتك التالية</span><h2>أكمل رحلتك</h2></div></div><div class="card resume"><span class="track-icon">${target.icon}</span><div style="flex:1"><h3>${target.title}</h3><p class="muted">${target.lessons[next].title} · ${target.lessons[next].minutes} دقائق</p><div class="progressbar"><i style="width:${percent(target)}%"></i></div></div><button class="secondary" data-go="lesson" data-track="${target.id}" data-index="${next}">ابدأ الدرس</button></div></section><section class="card aside-card"><span class="eyebrow">تعلّم بالطريقة المناسبة لك</span><h3>اختر هدفك التعليمي</h3><p>عند اختيار مسار، سيظهر درسه التالي في الرئيسية.</p><button class="outline" data-go="tracks">اختيار مسار ←</button></section></div>`}
function tracksView(){return `<div class="heading"><div><span class="eyebrow">مسارات الأكاديمية</span><h1>اختر ما تريد تعلمه</h1><p class="muted">كل مسار يحتوي على دروس قصيرة وأسئلة تطبيقية. يمكنك التبديل في أي وقت.</p></div></div><div class="track-grid">${tracks.map(trackCard).join('')}</div><section class="section card"><h2>دروس الأكاديمية</h2><div class="all-lessons">${tracks.flatMap(t=>t.lessons.map((l,i)=>`<div class="lesson-row"><div><strong>${l.title} ${done(t,i)?'✓':''}</strong><small>${t.title} · ${l.minutes} دقائق</small></div><button class="textlink" data-go="lesson" data-track="${t.id}" data-index="${i}">فتح الدرس ←</button></div>`)).join('')}</div></section>`}
function lessonView(t,i){let l=t.lessons[i],selected=selectedOption;if(!l)return '<div class="empty">هذا المسار لا يحتوي على دروس بعد.</div>';return `<button class="back" data-go="tracks">→ العودة إلى المسارات</button><div class="lesson-layout"><article class="lesson-content"><span class="pill">${t.title} · الدرس ${i+1} من ${t.lessons.length}</span><h1>${l.title}</h1><p>${l.lead}</p><h2>ما الذي ستتعلمه؟</h2><ul>${l.points.map(p=>`<li>${p}</li>`).join('')}</ul><h2>مثال تطبيقي</h2><div class="example">${l.example}</div><div class="lesson-qna"><span class="eyebrow">اسأل عن هذا الدرس</span><h2>لديك سؤال حول هذا الدرس؟</h2><div class="qna-row"><input type="text" id="qnaInput" maxlength="500" placeholder="اكتب سؤالك عن محتوى هذا الدرس..."><button class="secondary" id="qnaAsk" type="button">اسأل ←</button></div><div id="qnaResult" role="status"></div></div><div class="quiz"><span class="eyebrow">تحقق من فهمك</span><h2>${l.question}</h2>${l.options.map((o,j)=>`<button class="quiz-option ${selected===j?'selected':''}" data-option="${j}" aria-pressed="${selected===j}">${o}</button>`).join('')}<button class="primary" id="checkAnswer">تحقق من الإجابة</button><div id="answerFeedback" role="status"></div></div></article><aside class="card outline-list"><h3>محتويات المسار</h3>${t.lessons.map((x,j)=>`<button class="${i===j?'current':''}" data-go="lesson" data-track="${t.id}" data-index="${j}">${done(t,j)?'✓':'○'} ${j+1}. ${x.title}</button>`).join('')}<p class="muted">أكملت ${t.lessons.filter((_,j)=>done(t,j)).length} من ${t.lessons.length} دروس</p><div class="progressbar"><i style="width:${percent(t)}%"></i></div></aside></div>`}
function coach(){
  return `<div class="heading"><div><span class="eyebrow">تدريب عملي بالذكاء الاصطناعي</span><h1>المدرب الذكي لكتابة الطلبات</h1><p class="muted">اكتب طلبًا تريد استخدامه في عملك. فريق من ثلاثة وكلاء ذكاء اصطناعي يقيّم وضوحه، يعيد صياغته، ثم يقترح لك درسًا مناسبًا من الأكاديمية.</p></div></div>
  <div class="coach-box">
    <label for="prompt">طلبك للتدريب</label>
    <textarea id="prompt" placeholder="مثال: لخص ملاحظات الاجتماع في خمس نقاط للإدارة، مع توضيح القرارات والمهام..."></textarea>
    <div class="coach-example">
      <button data-example="اكتب تقريرًا">مثال قصير</button>
      <button data-example="قارن بين ثلاثة خيارات لتدريب الموظفين في جدول يوضح الفائدة والتكلفة والمخاطر، وقدّم توصية لمدير الموارد البشرية في خمس نقاط مع ذكر البيانات الناقصة">مثال مفصل</button>
    </div>
    <div class="coach-actions">
      <button class="primary" id="reviewPrompt" type="button">قيّم طلبي بوكلاء الذكاء الاصطناعي ←</button>
      <button class="outline" id="quickCheck" type="button">فحص فوري سريع (بدون ذكاء اصطناعي)</button>
    </div>
    <div id="quickResult"></div>
    <div id="coachResult" role="status"></div>
  </div>
  <section class="section card" style="max-width:880px">
    <h2>قالب يساعدك على البدء</h2>
    <div class="example">«[الفعل المطلوب] لـ[الجمهور] بناءً على [السياق أو المادة]. اعرض النتيجة بصيغة [الشكل والطول]، واذكر أي معلومات ناقصة.»</div>
    <p class="muted">«قيّم طلبي بوكلاء الذكاء الاصطناعي» يشغّل ثلاثة وكلاء متتالين: وكيل يقيّم وضوح الطلب، ثم وكيل يعيد صياغته، ثم وكيل يوصي بدرس مناسب من الأكاديمية. أما «الفحص الفوري» فتحقق آلي بقواعد ثابتة دون أي اتصال بالذكاء الاصطناعي.</p>
  </section>`;
}
function progress(){let n=state.completed.length;return `<div class="heading"><div><span class="eyebrow">سجل التعلم</span><h1>تقدمي وإنجازاتي</h1><p class="muted">تُحفظ نتائجك على هذا المتصفح.</p></div></div><div class="stats"><div class="stat"><span class="stat-icon">✓</span><div><strong>${n}</strong><small>دروس مكتملة</small></div></div><div class="stat"><span class="stat-icon">▦</span><div><strong>${tracks.filter(t=>percent(t)===100).length}</strong><small>مسارات مكتملة</small></div></div><div class="stat"><span class="stat-icon">◷</span><div><strong>${Math.round(n/total*100)}%</strong><small>التقدم الكلي</small></div></div></div><div class="heading"><h2>المسارات</h2></div><div class="track-grid">${tracks.map(trackCard).join('')}</div><section class="section"><div class="heading"><h2>شارات الإنجاز</h2></div><div class="track-grid"><div class="badge ${n<1?'locked':''}"><div class="symbol">✦</div><h3>أول خطوة</h3><span class="muted">إكمال أول درس</span></div><div class="badge ${n<3?'locked':''}"><div class="symbol">★</div><h3>متعلم مثابر</h3><span class="muted">إكمال ثلاثة دروس</span></div><div class="badge ${n<total?'locked':''}"><div class="symbol">✺</div><h3>إتمام الأكاديمية</h3><span class="muted">إكمال جميع الدروس</span></div></div></section>`}
function render(view='home',trackId,index=0){let t=tracks.find(x=>x.id===trackId)||tracks[0];if(!t){main.innerHTML='<div class="empty">لا توجد مسارات متاحة حاليًا.</div>';return}index=Math.max(0,Math.min(Number(index)||0,t.lessons.length-1));current={view,trackId:t.id,index};selectedOption=null;main.innerHTML=view==='home'?home():view==='tracks'?tracksView():view==='coach'?coach():view==='planner'?planner():view==='assessment'?assessmentView():view==='progress'?progress():view==='admin'?adminView():lessonView(t,index);nav.forEach(b=>b.classList.toggle('active',b.dataset.view===(view==='lesson'?'tracks':view)));document.querySelectorAll('.nav[data-view=admin]').forEach(b=>b.hidden=!currentUser.isAdmin);document.getElementById('sidebar').classList.remove('open');document.getElementById('menuBtn').setAttribute('aria-expanded','false');window.scrollTo(0,0);history.replaceState(null,'',view==='home'?'./':`#${view}${view==='lesson'?'/'+t.id+'/'+index:''}`)}
function quickCheck(){let value=document.getElementById('prompt').value.trim(),result=document.getElementById('quickResult');if(!value){result.innerHTML='<div class="feedback bad">اكتب طلبك أولًا لتظهر الملاحظات.</div>';return}let notes=[];if(value.length<45)notes.push('أضف سياقًا أكثر: ما المهمة وما المعلومات المتاحة؟');if(!/(لـ|إلى|للمدير|للموظف|للإدارة|للعميل|الجمهور|الفريق|الإدارة|الموظفين)/.test(value))notes.push('حدد لمن ستقدم النتيجة حتى تناسبه اللغة والتفاصيل.');if(!/(جدول|نقاط|كلمات|صفحة|فقرة|خطوات|بنود|موجز|صيغة|عمود|سطر)/.test(value))notes.push('حدد شكل النتيجة أو طولها، مثل جدول أو خمس نقاط.');if(!/(لخص|لخّص|قارن|اكتب|أنشئ|اعد|أعد|اقترح|حلل|حلّل|صغ|اشرح|ضع)/.test(value))notes.push('ابدأ بفعل واضح يصف المهمة المطلوبة.');result.innerHTML=`<div class="coach-result"><h3>${notes.length===0?'طلبك واضح ومحدد':'ملاحظات لتحسين طلبك'}</h3>${notes.length?`<ul>${notes.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<p>حددت عناصر أساسية جيدة. راجع صحة المعلومات في الناتج النهائي قبل استخدامه.</p>'}<small>فحص فوري آلي بقواعد ثابتة، بدون اتصال بالذكاء الاصطناعي.</small></div>`}

// --- AI agent helpers (Claude-powered features) --------------------------

async function agent(payload){
  return api('/api/agent', payload);
}

function lessonsCatalog(){
  return tracks.flatMap(t => t.lessons.map((l, i) => ({ trackId: t.id, index: i, title: l.title })));
}

let lastRewrite = '';

async function runCoachAgent(){
  const value = document.getElementById('prompt').value.trim();
  const result = document.getElementById('coachResult');
  if (!value) {
    result.innerHTML = '<div class="feedback bad">اكتب طلبك أولًا لتظهر ملاحظات الوكلاء.</div>';
    return;
  }
  result.innerHTML = '<div class="agent-loading muted">الوكلاء يحللون طلبك…</div>';
  try {
    const data = await agent({ mode: 'coach', prompt: value, lessons: lessonsCatalog() });
    lastRewrite = data.rewrite || '';
    const issuesHtml = data.critique.issues.length
      ? `<ul>${data.critique.issues.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`
      : '<p>لا توجد ملاحظات جوهرية — طلبك واضح ومحدد.</p>';
    const recHtml = data.recommendation
      ? `<p>${esc(data.recommendation.reason)}</p><button class="secondary" data-go="lesson" data-track="${esc(data.recommendation.trackId)}" data-index="${data.recommendation.index}">فتح الدرس: ${esc(data.recommendation.title)} ←</button>`
      : '<p class="muted">لا توجد توصية بدرس محدد هذه المرة.</p>';
    result.innerHTML = `
      <div class="coach-result"><h3>تقييم الوكيل الأول</h3><p>الدرجة: ${esc(String(data.critique.score))} / 5</p>${issuesHtml}</div>
      <div class="coach-result"><h3>نسخة محسّنة من وكيل الصياغة</h3><div class="example">${esc(data.rewrite).replace(/\n/g, '<br>')}</div><button class="textlink" id="copyRewrite" type="button">نسخ النص المحسّن</button></div>
      <div class="coach-result"><h3>توصية وكيل التعلّم</h3>${recHtml}</div>
    `;
  } catch (err) {
    result.innerHTML = `<div class="feedback bad">${esc(err.message)}</div>`;
  }
}

async function copyRewriteText(){
  try {
    await navigator.clipboard.writeText(lastRewrite);
    notify('تم نسخ النص المحسّن');
  } catch {
    notify('تعذر النسخ تلقائيًا، انسخ النص يدويًا.');
  }
}

async function askLessonQna(){
  const input = document.getElementById('qnaInput');
  const result = document.getElementById('qnaResult');
  const question = input.value.trim();
  if (!question) {
    result.innerHTML = '<div class="feedback bad">اكتب سؤالك أولًا.</div>';
    return;
  }
  const t = tracks.find(x => x.id === current.trackId);
  const l = t && t.lessons[current.index];
  if (!l) return;
  result.innerHTML = '<div class="agent-loading muted">جارٍ البحث عن إجابة داخل هذا الدرس…</div>';
  try {
    const data = await agent({ mode: 'lesson_qna', lessonId: l.id, question });
    result.innerHTML = `<div class="feedback ${data.inScope ? 'good' : 'bad'}">${esc(data.answer).replace(/\n/g, '<br>')}</div>`;
  } catch (err) {
    result.innerHTML = `<div class="feedback bad">${esc(err.message)}</div>`;
  }
}

function planner(){
  return `<div class="heading"><div><span class="eyebrow">تعاون بين وكلاء الذكاء الاصطناعي</span><h1>مخطط التعلم بالوكلاء</h1><p class="muted">فريق من أربعة وكلاء يتعاونون لبناء خطة تعلّم لك: موجّه يفهم احتياجك، مخطِّط يقترح خطوات من دروس المنصة الحقيقية، ناقد يراجع الخطة، ومجمّع نهائي يصدر الخطة الجاهزة.</p></div></div>
  <div class="coach-box">
    <label for="plannerGoal">ما هدفك التعليمي؟</label>
    <textarea id="plannerGoal" placeholder="مثال: أريد أن أصبح أفضل في كتابة أوامر للذكاء الاصطناعي خلال أسبوع واحد"></textarea>
    <button class="primary" id="plannerSubmit" type="button">ابنِ خطتي بالوكلاء ←</button>
    <div id="plannerResult" role="status"></div>
  </div>`;
}

async function runPlanner(){
  const goal = document.getElementById('plannerGoal').value.trim();
  const result = document.getElementById('plannerResult');
  if (!goal) {
    result.innerHTML = '<div class="feedback bad">اكتب هدفك التعليمي أولًا.</div>';
    return;
  }
  result.innerHTML = '<div class="agent-loading muted">أربعة وكلاء يتعاونون على خطتك…</div>';
  try {
    const data = await agent({ mode: 'plan', goal, lessons: lessonsCatalog() });
    const timelineHtml = data.steps.map((s, i) => `
      <div class="agent-step"><span class="agent-step-num">${i + 1}</span><div><strong>${esc(s.label)}</strong><p>${esc(s.output)}</p></div></div>
    `).join('');
    const planHtml = data.plan.map((p, i) => `
      <li class="lesson-row"><div><strong>${i + 1}. ${esc(p.title)}</strong><small>${esc(p.note || '')}</small></div><button class="textlink" data-go="lesson" data-track="${esc(p.trackId)}" data-index="${p.index}">فتح الدرس ←</button></li>
    `).join('');
    result.innerHTML = `
      <div class="agent-timeline">${timelineHtml}</div>
      <section class="section card"><h2>الخطة النهائية</h2><ol class="all-lessons plan-list">${planHtml}</ol><p class="feedback good">${esc(data.closing)}</p></section>
    `;
  } catch (err) {
    result.innerHTML = `<div class="feedback bad">${esc(err.message)}</div>`;
  }
}

function assessmentView(){
  if (assessmentResult) {
    const prefs = assessmentResult.trackPreference || [];
    const matched = prefs.map(id => tracks.find(t => t.id === id)).find(Boolean);
    const recHtml = matched
      ? `<button class="primary" data-go="lesson" data-track="${esc(matched.id)}" data-index="0">ابدأ مسار "${esc(matched.title)}" ←</button>`
      : `<button class="primary" data-go="tracks">استكشف المسارات ←</button>`;
    return `<div class="heading"><div><span class="eyebrow">نتيجة التقييم</span><h1>تقييم تحديد المستوى</h1><p class="muted">${assessmentResult.assessedAt ? 'أجريت هذا التقييم بتاريخ ' + esc(String(assessmentResult.assessedAt).slice(0, 10)) + '.' : ''}</p></div></div>
      <section class="card assessment-result">
        <span class="eyebrow">مستواك الحالي</span>
        <h2>${esc(assessmentResult.level)}</h2>
        <p class="muted">أجبت بشكل صحيح على ${esc(String(assessmentResult.score))} من ${assessmentQuestions.length} أسئلة.</p>
        <div class="assessment-actions">
          ${recHtml}
          <button class="outline" id="assessmentRetake" type="button">إعادة التقييم</button>
        </div>
      </section>`;
  }
  if (!assessmentQuestions.length) {
    return `<div class="heading"><div><span class="eyebrow">قبل أن تبدأ</span><h1>تقييم تحديد المستوى</h1></div></div><div class="empty">تعذر تحميل أسئلة التقييم الآن، حاول إعادة تحميل الصفحة.</div>`;
  }
  return `<div class="heading"><div><span class="eyebrow">قبل أن تبدأ</span><h1>تقييم تحديد المستوى</h1><p class="muted">10 أسئلة مختصرة عن الذكاء الاصطناعي تساعدنا نقترح لك أنسب نقطة بداية بين مسارات الأكاديمية.</p></div></div>
    <div class="card assessment-box">
      ${assessmentQuestions.map((q, qi) => `
        <div class="assessment-q">
          <h3>${qi + 1}. ${esc(q.question)}</h3>
          <div class="assessment-options">
            ${q.options.map((o, oi) => `<button type="button" class="quiz-option assessment-option ${assessmentAnswers[qi] === oi ? 'selected' : ''}" data-q="${qi}" data-o="${oi}" aria-pressed="${assessmentAnswers[qi] === oi}">${esc(o)}</button>`).join('')}
          </div>
        </div>
      `).join('')}
      <button class="primary" id="assessmentSubmit" type="button">إرسال الإجابات ←</button>
      <div id="assessmentFeedback" role="status"></div>
    </div>`;
}

async function submitAssessment(){
  const result = document.getElementById('assessmentFeedback');
  if (assessmentAnswers.length !== assessmentQuestions.length || assessmentAnswers.some(a => a === null || a === undefined)) {
    result.innerHTML = '<div class="feedback bad">أجب على كل الأسئلة العشرة قبل الإرسال.</div>';
    return;
  }
  result.innerHTML = '<div class="agent-loading muted">جارٍ احتساب النتيجة…</div>';
  try {
    const data = await api('/api/assessment', { answers: assessmentAnswers });
    assessmentResult = {
      level: data.level,
      score: data.score,
      assessedAt: new Date().toISOString(),
      trackPreference: data.trackPreference || [],
    };
    currentUser.level = data.level;
    render('assessment');
  } catch (err) {
    result.innerHTML = `<div class="feedback bad">${esc(err.message)}</div>`;
  }
}

async function generateDraft(){
  const courseId = document.getElementById('draftCourseId').value;
  const topic = document.getElementById('draftTopic').value.trim();
  const result = document.getElementById('draftResult');
  if (!topic) {
    result.innerHTML = '<div class="feedback bad">اكتب موضوع الدرس أولًا.</div>';
    return;
  }
  result.innerHTML = '<div class="agent-loading muted">فريق الإنتاج يعمل: بحث ثم كتابة ثم مراجعة…</div>';
  try {
    const data = await api('/api/admin/agent-draft', { courseId, topic });
    const warningsHtml = data.warnings.length
      ? `<ul>${data.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>`
      : '<p class="muted">لا توجد ملاحظات تحتاج مراجعة يدوية.</p>';
    result.innerHTML = `
      <div class="coach-result"><h3>مخطط البحث</h3><ul>${data.outline.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>
      <div class="coach-result"><h3>ملاحظات المراجع</h3>${warningsHtml}</div>
      <div class="feedback good">تم تعبئة نموذج «إضافة درس» أدناه بمسودة الوكلاء — راجعها وعدّلها ثم اضغط «حفظ الدرس».</div>
    `;
    const form = document.getElementById('lessonForm');
    form.courseId.value = courseId;
    form.title.value = data.lesson.title;
    form.lead.value = data.lesson.lead;
    form.points.value = data.lesson.points.join('\n');
    form.example.value = data.lesson.example;
    form.question.value = data.lesson.question;
    form.options.value = data.lesson.options.join('\n');
    form.answer.value = String(data.lesson.answer);
    form.minutes.value = String(data.lesson.minutes);
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    result.innerHTML = `<div class="feedback bad">${esc(err.message)}</div>`;
  }
}
document.addEventListener('click',async e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.go){render(b.dataset.go,b.dataset.track,b.dataset.index);return}if(b.dataset.view){render(b.dataset.view);return}if(b.dataset.option!==undefined){selectedOption=Number(b.dataset.option);document.querySelectorAll('.quiz-option').forEach((x,i)=>{x.classList.toggle('selected',i===selectedOption);x.setAttribute('aria-pressed',i===selectedOption)});return}if(b.dataset.q!==undefined){let qi=Number(b.dataset.q),oi=Number(b.dataset.o);assessmentAnswers[qi]=oi;document.querySelectorAll(`.assessment-option[data-q="${qi}"]`).forEach(x=>{let sel=Number(x.dataset.o)===oi;x.classList.toggle('selected',sel);x.setAttribute('aria-pressed',sel)});return}if(b.id==='checkAnswer'){let t=tracks.find(x=>x.id===current.trackId),l=t.lessons[current.index],el=document.getElementById('answerFeedback');if(selectedOption===null){el.innerHTML='<div class="feedback bad">اختر إجابة أولًا.</div>';return}try{let response=await api('/api/progress',{lessonId:l.id,answerIndex:selectedOption});if(response.correct){if(!done(t,current.index)){state.completed.push(l.id);state.goal=t.id}el.innerHTML=`<div class="feedback good">إجابة صحيحة. ${l.reason||'أحسنت، أكملت الدرس.'}</div><button class="secondary" data-go="${current.index<t.lessons.length-1?'lesson':'tracks'}" data-track="${t.id}" data-index="${current.index+1}">${current.index<t.lessons.length-1?'الدرس التالي ←':'العودة إلى المسارات ←'}</button>`;notify('أحسنت! تم حفظ تقدمك في حسابك')}else{el.innerHTML='<div class="feedback bad">الإجابة غير صحيحة. راجع الدرس وحاول مرة أخرى.</div>'}}catch(err){el.innerHTML=`<div class="feedback bad">${esc(err.message)}</div>`}return}if(b.id==='reviewPrompt'){runCoachAgent();return}if(b.id==='quickCheck'){quickCheck();return}if(b.id==='qnaAsk'){askLessonQna();return}if(b.id==='plannerSubmit'){runPlanner();return}if(b.id==='copyRewrite'){copyRewriteText();return}if(b.id==='generateDraft'){generateDraft();return}if(b.id==='assessmentSubmit'){submitAssessment();return}if(b.id==='assessmentRetake'){assessmentResult=null;assessmentAnswers=new Array(assessmentQuestions.length).fill(null);render('assessment');return}if(b.dataset.example){document.getElementById('prompt').value=b.dataset.example;document.getElementById('prompt').focus();return}if(b.dataset.publish){try{await api('/api/admin/course',{id:b.dataset.publish,published:b.dataset.status!=='true'},'PATCH');await loadData();render('admin');notify('تم تحديث حالة المسار')}catch(err){notify(err.message)}return}if(b.id==='challengeBtn'){render('coach');return}if(b.id==='signOutBtn'){try{await fetch('/api/auth/signout',{method:'POST'})}catch{}location.href='/login';return}if(b.id==='menuBtn'){let side=document.getElementById('sidebar');side.classList.toggle('open');b.setAttribute('aria-expanded',side.classList.contains('open'))}});
document.getElementById('date').textContent=new Intl.DateTimeFormat('ar',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
async function api(url,body,method='POST'){let response=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'تعذر حفظ البيانات. حاول مرة أخرى.');return data}
async function loadData(){let response=await fetch('/api/bootstrap',{cache:'no-store'});if(!response.ok)throw new Error('تعذر تحميل بيانات الأكاديمية. أعد المحاولة.');let data=await response.json();currentUser=data.user;tracks=data.tracks.map(t=>({...t,title:esc(t.title),description:esc(t.description),level:esc(t.level),lessons:t.lessons.map(l=>({...l,title:esc(l.title),lead:esc(l.lead),example:esc(l.example),question:esc(l.question),points:l.points.map(esc),options:l.options.map(esc)}))}));people=data.people||[];state.completed=data.completed;total=tracks.reduce((n,t)=>n+t.lessons.length,0);document.getElementById('accountName').textContent=data.user.name;let adminNav=document.querySelector('.nav[data-view=admin]');adminNav.hidden=!data.user.isAdmin;try{let a=await fetch('/api/assessment',{cache:'no-store'});if(a.ok){let ad=await a.json();assessmentQuestions=(ad.questions||[]).map(q=>({question:q.question,options:q.options}));assessmentAnswers=new Array(assessmentQuestions.length).fill(null);assessmentResult=ad.result||null}}catch{}}
function adminView(){if(!currentUser.isAdmin)return '<p>هذه الصفحة للإدارة فقط.</p>';let learners=people.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.email)}</td><td>${Number(p.completed)}</td><td>${esc(p.joined_at?.slice(0,10)||'')}</td></tr>`).join('');return `<div class="heading"><div><span class="eyebrow">إدارة الأكاديمية</span><h1>المسارات والمتعلمون</h1><p class="muted">أنشئ مسارًا، أضف درسًا واختبارًا، ثم انشره للمتعلمين.</p></div></div><div class="stats"><div class="stat"><span class="stat-icon">▦</span><div><strong>${tracks.length}</strong><small>مسارات</small></div></div><div class="stat"><span class="stat-icon">✦</span><div><strong>${people.length}</strong><small>متعلمون دخلوا المنصة</small></div></div><div class="stat"><span class="stat-icon">✓</span><div><strong>${people.reduce((n,p)=>n+Number(p.completed),0)}</strong><small>دروس مكتملة</small></div></div></div><div class="grid2"><section class="card admin-card"><h2>إنشاء مسار</h2><form id="courseForm"><label>عنوان المسار<input name="title" required minlength="3" maxlength="100" placeholder="مثل: مهارات القيادة"></label><label>وصف مختصر<textarea name="description" rows="3" maxlength="300" placeholder="ما الذي سيتعلمه الموظف؟"></textarea></label><label>المستوى<select name="level"><option>مبتدئ</option><option>متوسط</option></select></label><button class="primary">إنشاء المسار</button></form></section><section class="card admin-card"><h2>إضافة درس</h2><form id="lessonForm"><label>المسار<select name="courseId" required>${tracks.map(t=>`<option value="${t.id}">${t.title}</option>`).join('')}</select></label><label>عنوان الدرس<input name="title" required></label><label>الشرح المختصر<textarea name="lead" required></textarea></label><label>النقاط التعليمية (كل نقطة في سطر)<textarea name="points" required></textarea></label><label>مثال تطبيقي<textarea name="example" required></textarea></label><label>سؤال التحقق<input name="question" required></label><label>خيارات الإجابة (كل خيار في سطر)<textarea name="options" required placeholder="الخيار الأول
الخيار الثاني"></textarea></label><div class="form-pair"><label>رقم الإجابة الصحيحة<select name="answer"><option value="0">الأولى</option><option value="1">الثانية</option><option value="2">الثالثة</option><option value="3">الرابعة</option></select></label><label>المدة بالدقائق<input name="minutes" type="number" min="1" max="120" value="10" required></label></div><button class="primary">حفظ الدرس</button></form></section></div><section class="section card admin-card" id="draftCard"><h2>فريق إنتاج المحتوى بالذكاء الاصطناعي</h2><p class="muted">ثلاثة وكلاء (بحث، كتابة، مراجعة) يولّدون مسودة درس كاملة — لا يُحفظ شيء في قاعدة البيانات تلقائيًا؛ المسودة تُعبّأ في نموذج «إضافة درس» أعلاه لمراجعتها وتعديلها، ثم تضغط «حفظ الدرس» بنفسك.</p><div class="form-pair"><label>المسار<select id="draftCourseId">${tracks.map(t=>`<option value="${t.id}">${t.title}</option>`).join('')}</select></label><label>موضوع الدرس<input id="draftTopic" maxlength="200" placeholder="مثال: أساسيات هندسة الأوامر"></label></div><button class="primary" id="generateDraft" type="button">توليد مسودة بالذكاء الاصطناعي ←</button><div id="draftResult"></div></section><section class="section card"><h2>حالة المسارات</h2><div class="all-lessons">${tracks.map(t=>`<div class="lesson-row"><div><strong>${t.title}</strong><small>${t.lessons.length} دروس · ${t.published?'منشور':'مسودة'}</small></div><button class="outline" data-publish="${t.id}" data-status="${t.published}">${t.published?'إيقاف النشر':'نشر المسار'}</button></div>`).join('')}</div></section><section class="section card"><h2>المتعلمون</h2><div class="table-wrap"><table><thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>الدروس المكتملة</th><th>تاريخ الانضمام</th></tr></thead><tbody>${learners||'<tr><td colspan="4">لا يوجد متعلمون بعد.</td></tr>'}</tbody></table></div></section>`}
document.addEventListener('submit',async e=>{if(!['courseForm','lessonForm'].includes(e.target.id))return;e.preventDefault();let f=e.target,v=Object.fromEntries(new FormData(f));try{if(f.id==='courseForm')await api('/api/admin/course',v);else await api('/api/admin/lesson',{...v,points:String(v.points).split('\n').map(x=>x.trim()).filter(Boolean),options:String(v.options).split('\n').map(x=>x.trim()).filter(Boolean),answer:Number(v.answer),minutes:Number(v.minutes)});await loadData();render('admin');notify('تم الحفظ بنجاح')}catch(err){notify(err.message)}});
(async()=>{try{await loadData();let old;try{old=JSON.parse(localStorage.getItem('ai-academy-v1')||'null')}catch{}if(old?.completed?.length){for(let t of tracks)for(let [i,l] of t.lessons.entries())if(old.completed.includes(`${t.id}-${i}`)&&!state.completed.includes(l.id)){try{await api('/api/progress',{lessonId:l.id,answerIndex:l.answer});state.completed.push(l.id)}catch{}}localStorage.removeItem('ai-academy-v1')}let h=decodeURIComponent(location.hash.slice(1)).split('/');render(['home','tracks','coach','planner','assessment','progress','lesson','admin'].includes(h[0])?h[0]:'home',h[1],h[2])}catch(e){main.innerHTML=`<div class="card empty"><h2>تعذر تحميل الأكاديمية</h2><p>${esc(e.message)}</p><button class="primary" onclick="location.reload()">إعادة المحاولة</button></div>`}})();window.addEventListener('hashchange',()=>{let x=decodeURIComponent(location.hash.slice(1)).split('/');if(x[0]!==current.view||x[1]!==current.trackId||Number(x[2]||0)!==current.index)render(x[0]||'home',x[1],x[2])});

})();
