-- أكاديمية AI — Supabase schema + seed data
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Safe to re-run: tables use "if not exists" and the seed rows use ON CONFLICT DO NOTHING.

create table if not exists public.people (
  id uuid primary key,
  email text not null,
  name text not null,
  joined_at timestamptz not null default now()
);

create table if not exists public.courses (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null default '✦',
  level text not null default 'مبتدئ',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  position integer not null default 0,
  title text not null,
  minutes integer not null default 10,
  lead text not null,
  points jsonb not null default '[]'::jsonb,
  example text not null,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  answer integer not null,
  reason text not null default ''
);
create index if not exists lessons_course_id_idx on public.lessons (course_id);

create table if not exists public.progress (
  user_id uuid not null references public.people(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- Row Level Security: every table is only ever touched by the Next.js API
-- routes using the service_role key (which bypasses RLS after the route has
-- already checked identity()/isAdmin itself). No policies are defined, so a
-- direct call using the anon or an authenticated user's key is refused —
-- exactly like the original app, where only the server could reach D1.
alter table public.people enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.progress enable row level security;

-- Seed data: the three original courses, all published, with their nine lessons.
insert into public.courses (id, title, description, icon, level, published, created_at) values
  ('basics', 'أساسيات الذكاء الاصطناعي', 'افهم المفاهيم الأساسية واستخداماتها وحدودها في العمل.', '✦', 'مبتدئ', true, now()),
  ('prompts', 'كتابة الأوامر الفعالة', 'حوّل فكرتك إلى طلب واضح يعطيك مخرجًا قابلًا للاستخدام.', '⌘', 'مبتدئ', true, now()),
  ('reports', 'التقارير والعروض الذكية', 'نظم البيانات والملاحظات في تقرير واضح وعرض موجز.', '▤', 'متوسط', true, now())
on conflict (id) do nothing;

insert into public.lessons (id, course_id, position, title, minutes, lead, points, example, question, options, answer, reason) values
('basics-0','basics',0,'ما الذكاء الاصطناعي التوليدي؟',10,
 'تتعلم هنا كيف تنشئ النماذج إجابات جديدة من الأنماط التي تعلمتها، ومتى تحتاج إلى التحقق من النتيجة.',
 '["يمكنه صياغة النصوص وتلخيص المعلومات واقتراح أفكار أو خطوات.","قد يقدم معلومات غير دقيقة بثقة؛ راجع الحقائق والأرقام والمراجع.","ابدأ بمهمة واضحة ثم قيّم الناتج وعدّل الطلب حسب الحاجة."]'::jsonb,
 'مثال: اطلب تلخيص محضر اجتماع في ثلاث نقاط، ثم طابق القرارات مع المحضر الأصلي.',
 'ما التصرف الأفضل عند ظهور رقم مهم في إجابة النموذج؟',
 '["اعتماده مباشرة","مقارنته بالمصدر الأصلي","إعادة صياغته فقط"]'::jsonb, 1,
 'الأرقام والوقائع المهمة تحتاج مراجعة المصدر قبل استخدامها.'),

('basics-1','basics',1,'اختيار المهمة المناسبة',10,
 'تنجح الأدوات عندما تختار مهمة مناسبة وتحدد ما الذي ستراجعه بنفسك.',
 '["المهام المناسبة: مسودة رسالة، تلخيص وثيقة، توليد بدائل، تنظيم أفكار.","في القرارات الحساسة، استخدم النموذج للمساندة والتحليل مع مراجعة بشرية.","تجنب مشاركة بيانات سرية أو شخصية في خدمة غير معتمدة لدى جهتك."]'::jsonb,
 'مثال: أنشئ مسودة جدول أعمال، ثم عدّل البنود لتناسب أهداف الاجتماع الفعلية.',
 'أي مهمة مناسبة كبداية؟',
 '["اعتماد قرار توظيف تلقائيًا","كتابة مسودة جدول أعمال ومراجعتها","رفع ملفات سرية إلى أداة عامة"]'::jsonb, 1,
 'المسودة قابلة للمراجعة، وتبقى مسؤولية القرار لدى الإنسان.'),

('basics-2','basics',2,'التحقق وتحسين المخرجات',10,
 'حسن جودة الإجابة بطلب واضح ومراجعة منهجية قبل مشاركة المخرج.',
 '["تحقق من الدقة والتاريخ والمصدر والملاءمة للسياق.","اطلب من النموذج إظهار الافتراضات والمواضع غير المؤكدة.","اختبر النتيجة على مثال صغير ثم حسّن الطلب."]'::jsonb,
 'مثال: «حدد الافتراضات في هذا الملخص، واذكر ما يحتاج تحققًا من الوثيقة».',
 'إذا كانت الإجابة عامة جدًا، فما الخطوة المفيدة؟',
 '["إضافة سياق ومعايير وطلب نتيجة محددة","نسخ الإجابة كما هي","حذف السؤال"]'::jsonb, 0,
 'زيادة السياق والتحديد تساعد على الحصول على نتيجة أقرب لاحتياجك.'),

('prompts-0','prompts',0,'صياغة الهدف والسياق',10,
 'الطلب الجيد يوضح المطلوب ولمن سيستخدم الناتج وما المعلومات المتاحة.',
 '["ابدأ بفعل واضح: لخّص، قارن، اقترح، أو أعد صياغة.","اذكر الجمهور والسياق والمواد التي يستند إليها الرد.","حدد حدود المهمة كي لا يفترض النموذج تفاصيل ناقصة."]'::jsonb,
 '«لخّص هذه الملاحظات لمدير الإدارة في خمس نقاط، مع إبراز القرارات والمهام».',
 'أي عنصر يجعل الطلب أوضح؟',
 '["ذكر الهدف والجمهور","إضافة كلمات أكثر بلا معنى","إخفاء السياق"]'::jsonb, 0,
 'الهدف والجمهور يوجهان شكل الإجابة ومستوى التفصيل.'),

('prompts-1','prompts',1,'تحديد شكل النتيجة',10,
 'حدد التنسيق والطول والمعايير التي ستراجع بها الإجابة.',
 '["اطلب جدولًا عند المقارنة، أو نقاطًا عند التلخيص.","حدد عدد العناصر أو الطول التقريبي إذا كان مهمًا.","اطلب تمييز المعلومات الناقصة بدل ملئها بالتخمين."]'::jsonb,
 '«قارن البدائل في جدول من ثلاثة أعمدة: الفائدة، التكلفة، المخاطر. اذكر المعلومات الناقصة».',
 'ما أفضل طلب لمقارنة ثلاثة حلول؟',
 '["قل شيئًا عنها","جدول بمعايير مقارنة محددة","اختر واحدًا دون أسباب"]'::jsonb, 1,
 'المعايير الواضحة تجعل المقارنة أسهل مراجعة.'),

('prompts-2','prompts',2,'التحسين على مراحل',10,
 'ابدأ بمسودة، راجعها، ثم اطلب تعديلًا محددًا بدل إعادة المهمة من الصفر.',
 '["حدد ما أعجبك في المسودة وما يحتاج تعديلًا.","اطلب مثالًا تطبيقيًا عند غموض الشرح.","قارن النسخة المعدلة بمتطلباتك الأصلية."]'::jsonb,
 '«اجعل اللغة أكثر رسمية، واختصر المقدمة إلى سطرين، واحتفظ بنقاط القرار».',
 'ما الطلب الأفضل بعد مسودة طويلة؟',
 '["غيرها","اختصرها إلى 150 كلمة مع إبقاء القرارات","لا يهم"]'::jsonb, 1,
 'التعديل المحدد يعطي توجيهًا قابلًا للتنفيذ.'),

('reports-0','reports',0,'هيكل التقرير',10,
 'تبدأ التقارير الجيدة بسؤال وهدف واضحين، ثم تعرض الأدلة والتوصية.',
 '["حدد القارئ والقرار المطلوب من التقرير.","اجمع الحقائق في أقسام: خلفية، نتائج، بدائل، توصية.","افصل الرأي عن الوقائع والمصادر."]'::jsonb,
 '«ابنِ مخطط تقرير من صفحة واحدة عن تحسين خدمة العملاء، مع موضع للمؤشرات والمصادر».',
 'ما الذي يجب تحديده أولًا؟',
 '["لون الغلاف","القارئ والقرار المطلوب","عدد الصور"]'::jsonb, 1,
 'القارئ والقرار يحددان مستوى التفاصيل وطريقة العرض.'),

('reports-1','reports',1,'تحويل البيانات إلى رسالة',10,
 'اعرض أهم نتيجة، ثم الدليل الداعم لها، ثم ما تعنيه للقارئ.',
 '["تأكد من صحة الأرقام والفترة الزمنية ووحدة القياس.","اعرض مقارنة مفهومة بدل قائمة أرقام مجردة.","اذكر ما لا توضحه البيانات لتجنب استنتاج زائد."]'::jsonb,
 '«انخفض متوسط زمن الاستجابة من 4 أيام إلى يومين خلال الربع الأخير؛ راجع طريقة القياس قبل النشر».',
 'ماذا تفعل قبل استخدام رقم في شريحة؟',
 '["تتحقق من مصدره وفترته","تكبر الخط فقط","تحذفه دائمًا"]'::jsonb, 0,
 'السياق والمصدر ضروريان لتفسير الرقم بدقة.'),

('reports-2','reports',2,'الملخص التنفيذي',10,
 'اكتب خلاصة قصيرة تتيح للقارئ فهم القرار المقترح دون قراءة التقرير كاملًا.',
 '["ابدأ بالنتيجة الأساسية، ثم سببها، ثم القرار المطلوب.","استخدم لغة مباشرة وتجنب التفاصيل الثانوية.","تأكد أن الملخص يعكس متن التقرير بدقة."]'::jsonb,
 '«نوصي بتجربة الحل في إدارة واحدة لمدة شهر، لقياس الأثر قبل التوسع».',
 'ماذا يتضمن الملخص التنفيذي؟',
 '["كل الجداول التفصيلية","النتيجة والسبب والقرار المقترح","مقدمة طويلة فقط"]'::jsonb, 1,
 'الملخص يوضح ما يجب فهمه واتخاذه من قرار.')
on conflict (id) do nothing;
