import { identity, denied, fail } from "@/lib/academy";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { callClaude, parseClaudeJson, SONNET, HAIKU } from "@/lib/agents/claude";

export const dynamic = "force-dynamic";

const str = (x: unknown, max = 3000) =>
  typeof x === "string" ? x.trim().slice(0, max) : "";

type LessonRef = { trackId: string; index: number; title: string };

/** Sanitize the client-supplied lesson catalog before it enters any prompt. */
function sanitizeLessons(input: unknown): LessonRef[] {
  if (!Array.isArray(input)) return [];
  const out: LessonRef[] = [];
  for (const item of input.slice(0, 200)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const trackId = str(o.trackId, 200);
    const title = str(o.title, 200);
    const index = Number(o.index);
    if (!trackId || !title || !Number.isInteger(index) || index < 0) continue;
    out.push({ trackId, index, title });
  }
  return out;
}

function lessonsBlock(lessons: LessonRef[]) {
  return lessons
    .map((l) => `- trackId="${l.trackId}" index=${l.index} title="${l.title}"`)
    .join("\n");
}

/** Only trust a recommended/planned lesson if it truly exists in the given catalog. */
function findRealLesson(lessons: LessonRef[], trackId: unknown, index: unknown) {
  const idx = Number(index);
  return (
    lessons.find((l) => l.trackId === trackId && l.index === idx) || null
  );
}

// ---------------------------------------------------------------------------
// Mode 1: "المدرب الذكي" — critique -> rewrite -> recommend, three agents in a row.
// ---------------------------------------------------------------------------

type CritiqueResult = { score: number; issues: string[] };
type RewriteResult = { rewrite: string };
type RecommendResult = { trackId: string; index: number; title: string; reason: string } | null;

async function runCoach(rawPrompt: unknown, rawLessons: unknown) {
  const prompt = str(rawPrompt, 2000);
  const lessons = sanitizeLessons(rawLessons);
  if (!prompt) {
    return Response.json({ error: "اكتب طلبك أولًا." }, { status: 400 });
  }

  // Agent 1: Critique.
  const critiqueRaw = await callClaude({
    model: SONNET,
    maxTokens: 500,
    system:
      "أنت مقيّم خبير في صياغة الطلبات الموجهة إلى أدوات الذكاء الاصطناعي داخل شركة تدريب. " +
      "قيّم وضوح طلب المتعلم وفق أربعة معايير: الهدف، الجمهور المستهدف، السياق المتوفر، وشكل النتيجة المطلوب. " +
      "أعد فقط JSON خام دون أي شرح إضافي ودون علامات ```، بالضبط بهذا الشكل: " +
      '{"score": رقم صحيح من 1 إلى 5, "issues": ["ملاحظة عربية موجزة وقابلة للتنفيذ", ...]}. ' +
      "أعد 4 ملاحظات كحد أقصى، وإن كان الطلب واضحًا وممتازًا أعد issues كمصفوفة فارغة وscore عاليًا.",
    prompt: `طلب المتعلم:\n"""${prompt}"""`,
  });
  const critiqueParsed = parseClaudeJson<Partial<CritiqueResult>>(critiqueRaw);
  const score = Math.max(1, Math.min(5, Math.round(Number(critiqueParsed.score) || 1)));
  const issues = Array.isArray(critiqueParsed.issues)
    ? critiqueParsed.issues.map((s) => str(s, 300)).filter(Boolean).slice(0, 4)
    : [];
  const critique: CritiqueResult = { score, issues };

  // Agent 2: Rewrite — takes the critique's issues as input.
  const rewriteRaw = await callClaude({
    model: SONNET,
    maxTokens: 600,
    system:
      "أنت مساعد كتابة خبير. مهمتك إعادة صياغة طلب المستخدم ليصبح أوضح وأكثر فاعلية عند توجيهه لأداة ذكاء اصطناعي، " +
      "مع الحفاظ على نية المستخدم الأصلية وعدم اختلاق تفاصيل جديدة لم يذكرها. " +
      'أعد فقط JSON خام بهذا الشكل: {"rewrite": "النص المحسَّن الكامل بالعربية"}.',
    prompt:
      `الطلب الأصلي:\n"""${prompt}"""\n\n` +
      `الملاحظات التي رصدها المقيّم:\n${issues.length ? issues.map((i) => `- ${i}`).join("\n") : "لا توجد ملاحظات جوهرية."}`,
  });
  const rewriteParsed = parseClaudeJson<Partial<RewriteResult>>(rewriteRaw);
  const rewrite = str(rewriteParsed.rewrite, 2000) || prompt;

  // Agent 3: Recommender — picks a real lesson from the catalog (haiku is enough here).
  let recommendation: RecommendResult = null;
  if (lessons.length) {
    const recRaw = await callClaude({
      model: HAIKU,
      maxTokens: 300,
      system:
        "أنت موجّه تعليمي داخل أكاديمية تدريب. لديك أضعف نقطة في طلب أحد المتعلمين، وقائمة دروس حقيقية متاحة في المنصة. " +
        "اختر درسًا واحدًا فقط الأنسب لمعالجة أضعف نقطة، من القائمة المُعطاة حصرًا (لا تخترع عنوانًا أو trackId أو index غير موجود في القائمة). " +
        'أعد فقط JSON خام: {"trackId": "...", "index": رقم, "title": "...", "reason": "جملة قصيرة بالعربية توضح سبب الاختيار"}. ' +
        "إن لم يوجد أي درس مناسب فعلًا أعد null حرفيًا (بدون علامات اقتباس).",
      prompt:
        `أضعف نقاط طلب المتعلم:\n${issues.length ? issues.map((i) => `- ${i}`).join("\n") : "لا توجد ملاحظات محددة."}\n\n` +
        `الدروس المتاحة:\n${lessonsBlock(lessons)}`,
    });
    const recParsed = parseClaudeJson<RecommendResult | null>(recRaw);
    if (recParsed && typeof recParsed === "object") {
      const real = findRealLesson(lessons, recParsed.trackId, recParsed.index);
      if (real) {
        recommendation = {
          trackId: real.trackId,
          index: real.index,
          title: real.title,
          reason: str(recParsed.reason, 300) || "هذا الدرس يعالج نقطة الضعف المذكورة أعلاه.",
        };
      }
    }
  }

  return Response.json({ critique, rewrite, recommendation });
}

// ---------------------------------------------------------------------------
// Mode 2: "اسأل عن الدرس" — scope-guard -> tutor, per-lesson Q&A grounded in DB content.
// ---------------------------------------------------------------------------

async function runLessonQna(rawLessonId: unknown, rawQuestion: unknown, isAdmin: boolean) {
  const lessonId = str(rawLessonId, 200);
  const question = str(rawQuestion, 800);
  if (!lessonId || !question) {
    return Response.json({ error: "اكتب سؤالك أولًا." }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  const { data: lesson } = await db
    .from("lessons")
    .select("title, lead, points, example, course_id, courses(published)")
    .eq("id", lessonId)
    .maybeSingle();

  const courseInfo =
    (lesson as unknown as { courses: { published: boolean } | null }) || null;
  const published = courseInfo?.courses?.published;
  if (!lesson || (!published && !isAdmin)) {
    return Response.json({ error: "الدرس غير متاح" }, { status: 404 });
  }

  const lessonContent =
    `العنوان: ${lesson.title}\n` +
    `الشرح: ${lesson.lead}\n` +
    `النقاط التعليمية:\n${(lesson.points || []).map((p: string) => `- ${p}`).join("\n")}\n` +
    `المثال التطبيقي: ${lesson.example}`;

  // Agent 1: Scope-guard (haiku) — is the question actually about this lesson?
  const guardRaw = await callClaude({
    model: HAIKU,
    maxTokens: 100,
    system:
      "أنت مصنّف يحدد فقط هل سؤال المتعلم متعلق فعليًا بموضوع درس مُعطى أم لا. " +
      'أعد فقط JSON خام: {"inScope": true} أو {"inScope": false}.',
    prompt: `محتوى الدرس:\n${lessonContent}\n\nسؤال المتعلم:\n"""${question}"""`,
  });
  const guardParsed = parseClaudeJson<{ inScope?: boolean }>(guardRaw);
  const inScope = guardParsed.inScope === true;

  if (!inScope) {
    return Response.json({
      inScope: false,
      answer:
        "هذا السؤال خارج نطاق هذا الدرس تحديدًا — جرّب صياغته بشكل متعلق بموضوع الدرس، " +
        "أو استخدم صفحة «مخطط الوكلاء» للأسئلة العامة عن خطة تعلّمك.",
    });
  }

  // Agent 2: Tutor (sonnet) — answers using ONLY the lesson content as ground truth.
  const tutorRaw = await callClaude({
    model: SONNET,
    maxTokens: 700,
    system:
      "أنت معلّم داخل أكاديمية تدريب داخلي. أجب على سؤال المتعلم مستخدمًا فقط محتوى الدرس المُعطى كمصدر حقيقة وحيد، " +
      "بالعربية وبأسلوب دافئ يشبه معلّمًا متعاونًا. إن كان الدرس لا يغطي جزءًا من السؤال فقل ذلك بوضوح بدل اختلاق معلومات. " +
      'أعد فقط JSON خام: {"answer": "الإجابة الكاملة بالعربية"}.',
    prompt: `محتوى الدرس:\n${lessonContent}\n\nسؤال المتعلم:\n"""${question}"""`,
  });
  const tutorParsed = parseClaudeJson<{ answer?: string }>(tutorRaw);
  const answer =
    str(tutorParsed.answer, 3000) || "تعذّر توليد إجابة الآن، حاول مرة أخرى.";

  return Response.json({ inScope: true, answer });
}

// ---------------------------------------------------------------------------
// Mode 4: "مساعد تعليمي داخل الدرس" — simplify -> (optional) check-understanding.
// Both fetch the lesson fresh from Supabase, exactly like runLessonQna, so the
// AI is always grounded in the real published content rather than trusting
// anything the client claims about the lesson.
// ---------------------------------------------------------------------------

type LessonContentRow = {
  title: string;
  lead: string;
  points: string[];
  example: string;
  course_id: string;
};

async function loadPublishedLesson(lessonId: string, isAdmin: boolean) {
  const db = createSupabaseServiceClient();
  const { data: lesson } = await db
    .from("lessons")
    .select("title, lead, points, example, course_id, courses(published)")
    .eq("id", lessonId)
    .maybeSingle();

  const courseInfo =
    (lesson as unknown as { courses: { published: boolean } | null }) || null;
  const published = courseInfo?.courses?.published;
  if (!lesson || (!published && !isAdmin)) return null;
  return lesson as unknown as LessonContentRow;
}

function lessonContentBlock(lesson: LessonContentRow) {
  return (
    `العنوان: ${lesson.title}\n` +
    `الشرح: ${lesson.lead}\n` +
    `النقاط التعليمية:\n${(lesson.points || []).map((p: string) => `- ${p}`).join("\n")}\n` +
    `المثال التطبيقي: ${lesson.example}`
  );
}

async function runSimplify(rawLessonId: unknown, isAdmin: boolean) {
  const lessonId = str(rawLessonId, 200);
  if (!lessonId) {
    return Response.json({ error: "الدرس غير محدد." }, { status: 400 });
  }

  const lesson = await loadPublishedLesson(lessonId, isAdmin);
  if (!lesson) {
    return Response.json({ error: "الدرس غير متاح" }, { status: 404 });
  }

  const raw = await callClaude({
    model: SONNET,
    maxTokens: 700,
    system:
      "أنت معلّم داخل أكاديمية تدريب داخلي متخصص في تبسيط المفاهيم. بناءً على محتوى الدرس المُعطى فقط: " +
      "1) اشرح الفكرة الأساسية بلغة أبسط بكثير وبجمل قصيرة، كأنك تشرحها لشخص يسمع عنها لأول مرة. " +
      "2) أعط مثالًا تطبيقيًا إضافيًا مختلفًا عن المثال الأصلي في الدرس ومرتبطًا ببيئة عمل مكتبية. " +
      "3) صغ سؤالًا قصيرًا واحدًا مفتوحًا (وليس اختيار من متعدد) يتحقق من فهم المتعلم للفكرة الأساسية. " +
      'أعد فقط JSON خام دون أي شرح إضافي ودون علامات ```، بالضبط بهذا الشكل: ' +
      '{"explanation": "الشرح المبسّط بالعربية", "example": "المثال الإضافي بالعربية", "checkQuestion": "سؤال التحقق بالعربية"}.',
    prompt: `محتوى الدرس:\n${lessonContentBlock(lesson)}`,
  });
  const parsed = parseClaudeJson<{
    explanation?: string;
    example?: string;
    checkQuestion?: string;
  }>(raw);
  const explanation = str(parsed.explanation, 1500) || "تعذر توليد شرح مبسّط الآن، حاول مرة أخرى.";
  const example = str(parsed.example, 800);
  const checkQuestion = str(parsed.checkQuestion, 300);

  return Response.json({ explanation, example, checkQuestion });
}

async function runSimplifyCheck(
  rawLessonId: unknown,
  rawQuestion: unknown,
  rawAnswer: unknown,
  isAdmin: boolean,
) {
  const lessonId = str(rawLessonId, 200);
  const question = str(rawQuestion, 300);
  const answer = str(rawAnswer, 1000);
  if (!lessonId || !question || !answer) {
    return Response.json({ error: "اكتب إجابتك أولًا." }, { status: 400 });
  }

  const lesson = await loadPublishedLesson(lessonId, isAdmin);
  if (!lesson) {
    return Response.json({ error: "الدرس غير متاح" }, { status: 404 });
  }

  const raw = await callClaude({
    model: SONNET,
    maxTokens: 400,
    system:
      "أنت معلّم متعاون. أمامك محتوى درس، وسؤال تحقق من الفهم، وإجابة المتعلم عليه. " +
      "قيّم هل الإجابة تدل على فهم صحيح للفكرة الأساسية (لا تشترط الحرفية، اقبل الصياغات المختلفة الصحيحة)، " +
      "ثم اكتب ملاحظة قصيرة داعمة بالعربية: إن كانت الإجابة صحيحة أو قريبة اشرح لماذا هي صحيحة مع تشجيع، " +
      "وإن كانت غير دقيقة صحّح الفهم الخاطئ بلطف ووضوح دون تحقير. " +
      'أعد فقط JSON خام: {"understood": true أو false, "feedback": "الملاحظة بالعربية"}.',
    prompt:
      `محتوى الدرس:\n${lessonContentBlock(lesson)}\n\n` +
      `سؤال التحقق:\n${question}\n\nإجابة المتعلم:\n${answer}`,
  });
  const parsed = parseClaudeJson<{ understood?: boolean; feedback?: string }>(raw);
  const understood = parsed.understood === true;
  const feedback = str(parsed.feedback, 800) || "شكرًا على إجابتك.";

  return Response.json({ understood, feedback });
}

// ---------------------------------------------------------------------------
// Mode 3: "مخطط التعلم بالوكلاء" — router -> planner -> critic -> finalizer.
// ---------------------------------------------------------------------------

type PlanStep = { trackId: string; index: number; title: string; note: string };
type TimelineStep = { agent: string; label: string; output: string };

function sanitizePlanSteps(raw: unknown, lessons: LessonRef[]): PlanStep[] {
  if (!Array.isArray(raw)) return [];
  const out: PlanStep[] = [];
  for (const item of raw.slice(0, 30)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const real = findRealLesson(lessons, o.trackId, o.index);
    if (!real) continue;
    out.push({
      trackId: real.trackId,
      index: real.index,
      title: real.title,
      note: str(o.note, 300),
    });
  }
  return out;
}

async function runPlan(rawGoal: unknown, rawLessons: unknown) {
  const goal = str(rawGoal, 500);
  const lessons = sanitizeLessons(rawLessons);
  if (!goal) {
    return Response.json({ error: "اكتب هدفك التعليمي أولًا." }, { status: 400 });
  }
  if (!lessons.length) {
    return Response.json({ error: "لا توجد دروس متاحة لبناء خطة." }, { status: 400 });
  }

  const timeline: TimelineStep[] = [];

  // Agent 1: Router (haiku) — plain-text restatement of the real need, not JSON.
  const routerText = str(
    await callClaude({
      model: HAIKU,
      maxTokens: 150,
      system:
        "أنت موجّه تعليمي. أعد سطرًا واحدًا فقط بالعربية يعيد صياغة ما يحتاجه المتعلم فعليًا بناءً على هدفه، " +
        "بإيجاز شديد ودون أي مقدمات أو علامات تنسيق.",
      prompt: `هدف المتعلم:\n"""${goal}"""`,
    }),
    300,
  ) || "يحتاج خطة تعلّم مناسبة لهدفه.";
  timeline.push({ agent: "router", label: "الموجّه", output: routerText });

  // Agent 2: Planner (sonnet) — drafts a plan using ONLY real lesson titles.
  const plannerRaw = await callClaude({
    model: SONNET,
    maxTokens: 900,
    system:
      "أنت مخطِّط تعليمي. بناءً على احتياج المتعلم وقائمة دروس حقيقية متاحة في المنصة، ضع خطة تعلّم مرتبة خطوة بخطوة " +
      "باستخدام عناوين الدروس الحقيقية من القائمة حصرًا (لا تخترع أي درس أو trackId أو index غير موجود). " +
      'أعد فقط JSON خام: {"steps": [{"trackId": "...", "index": رقم, "title": "...", "note": "سبب إدراج هذا الدرس ضمن الخطة، جملة قصيرة"}]}.',
    prompt: `احتياج المتعلم:\n${routerText}\n\nالدروس المتاحة:\n${lessonsBlock(lessons)}`,
  });
  const plannerParsed = parseClaudeJson<{ steps?: unknown }>(plannerRaw);
  const draftPlan = sanitizePlanSteps(plannerParsed.steps, lessons);
  timeline.push({
    agent: "planner",
    label: "المخطِّط",
    output: `اقترح خطة أولية من ${draftPlan.length} ${draftPlan.length === 1 ? "خطوة" : "خطوات"} مستندة إلى دروس المنصة الحقيقية.`,
  });

  // Agent 3: Critic (sonnet) — one concrete improvement suggestion.
  const criticRaw = await callClaude({
    model: SONNET,
    maxTokens: 300,
    system:
      "أنت ناقد خطط تعليمية. راجع الخطة المقترحة مقارنة بهدف المتعلم الأصلي، واقترح تحسينًا واحدًا محددًا فقط " +
      "(مثل إعادة ترتيب خطوة، أو إضافة درس أساسي ناقص من القائمة، أو تقليص الخطة إن كانت طويلة جدًا). " +
      'أعد فقط JSON خام: {"suggestion": "جملة أو جملتين بالعربية"}.',
    prompt:
      `هدف المتعلم الأصلي:\n"""${goal}"""\n\n` +
      `الخطة المقترحة:\n${draftPlan.map((s, i) => `${i + 1}. ${s.title} — ${s.note}`).join("\n")}\n\n` +
      `الدروس المتاحة (للمرجعية إن احتجت اقتراح درس ناقص):\n${lessonsBlock(lessons)}`,
  });
  const criticParsed = parseClaudeJson<{ suggestion?: string }>(criticRaw);
  const suggestion = str(criticParsed.suggestion, 400) || "الخطة مناسبة كما هي.";
  timeline.push({ agent: "critic", label: "الناقد", output: suggestion });

  // Agent 4: Finalizer (sonnet) — applies the suggestion if sensible, produces the final plan.
  const finalRaw = await callClaude({
    model: SONNET,
    maxTokens: 900,
    system:
      "أنت مسؤول تجميع نهائي لخطة تعلّم. أمامك خطة أولية وملاحظة ناقد واحدة. طبّق الملاحظة إن كانت منطقية، " +
      "واستخدم عناوين الدروس الحقيقية من القائمة حصرًا (لا تخترع أي درس). أضف أيضًا جملة ختامية تشجيعية قصيرة. " +
      'أعد فقط JSON خام: {"plan": [{"trackId": "...", "index": رقم, "title": "...", "note": "..."}], "closing": "جملة تشجيعية قصيرة بالعربية"}.',
    prompt:
      `الخطة الأولية:\n${draftPlan.map((s, i) => `${i + 1}. trackId="${s.trackId}" index=${s.index} title="${s.title}" — ${s.note}`).join("\n")}\n\n` +
      `ملاحظة الناقد:\n${suggestion}\n\n` +
      `الدروس المتاحة:\n${lessonsBlock(lessons)}`,
  });
  const finalParsed = parseClaudeJson<{ plan?: unknown; closing?: string }>(finalRaw);
  let finalPlan = sanitizePlanSteps(finalParsed.plan, lessons);
  if (!finalPlan.length) finalPlan = draftPlan;
  const closing =
    str(finalParsed.closing, 300) || "خطوة بخطوة ستصل إلى هدفك — بالتوفيق في رحلتك!";
  timeline.push({
    agent: "finalizer",
    label: "التجميع النهائي",
    output: `أنتج الخطة النهائية المكوّنة من ${finalPlan.length} ${finalPlan.length === 1 ? "خطوة" : "خطوات"}، بعد تطبيق ملاحظة الناقد عند الحاجة.`,
  });

  return Response.json({ steps: timeline, plan: finalPlan, closing });
}

// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const user = await identity();
    if (!user) return denied();

    const body = (await req.json()) as Record<string, unknown>;
    const mode = str(body.mode, 40);

    switch (mode) {
      case "coach":
        return await runCoach(body.prompt, body.lessons);
      case "lesson_qna":
        return await runLessonQna(body.lessonId, body.question, user.isAdmin);
      case "plan":
        return await runPlan(body.goal, body.lessons);
      case "simplify":
        return await runSimplify(body.lessonId, user.isAdmin);
      case "simplify_check":
        return await runSimplifyCheck(body.lessonId, body.question, body.answer, user.isAdmin);
      default:
        return Response.json({ error: "طلب غير صالح" }, { status: 400 });
    }
  } catch (e) {
    return fail(e);
  }
}
