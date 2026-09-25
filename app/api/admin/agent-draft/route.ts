import { identity, denied, forbidden, fail } from "@/lib/academy";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { callClaude, parseClaudeJson, SONNET } from "@/lib/agents/claude";

export const dynamic = "force-dynamic";

const AI_SOURCE_LABEL = "مُولَّد بمساعدة الذكاء الاصطناعي — يتطلب مراجعة بشرية";

const str = (x: unknown, max = 3000) =>
  typeof x === "string" ? x.trim().slice(0, max) : "";
const strArr = (x: unknown, max: number, itemMax = 500) =>
  Array.isArray(x) ? x.map((v) => str(v, itemMax)).filter(Boolean).slice(0, max) : [];

type DraftLesson = {
  title: string;
  minutes: number;
  lead: string;
  points: string[];
  example: string;
  question: string;
  options: string[];
  answer: number;
  reason: string;
  source: string;
};

/** Defensively coerce a Claude-produced lesson object into the platform's exact shape. */
function sanitizeLesson(raw: unknown): DraftLesson {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const options = strArr(o.options, 5, 300);
  let answer = Number(o.answer);
  if (!Number.isInteger(answer) || answer < 0 || answer >= (options.length || 1)) {
    answer = 0;
  }

  let minutes = Number(o.minutes);
  if (!Number.isInteger(minutes) || minutes < 8 || minutes > 20) minutes = 12;

  return {
    title: str(o.title, 120) || "درس جديد",
    minutes,
    lead: str(o.lead, 2000),
    points: strArr(o.points, 5, 500),
    example: str(o.example, 2000),
    question: str(o.question, 500),
    options,
    answer,
    reason: str(o.reason, 2000),
    source: AI_SOURCE_LABEL,
  };
}

export async function POST(req: Request) {
  try {
    const user = await identity();
    if (!user) return denied();
    if (!user.isAdmin) return forbidden();

    const v = (await req.json()) as { courseId?: string; topic?: string };
    const courseId = typeof v.courseId === "string" ? v.courseId.trim() : "";
    const topic = str(v.topic, 200);

    if (!courseId || !topic) {
      return Response.json(
        { error: "اختر المسار واكتب موضوع الدرس أولًا." },
        { status: 400 },
      );
    }

    const db = createSupabaseServiceClient();
    const { data: course } = await db
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .maybeSingle();
    if (!course) return Response.json({ error: "المسار غير موجود" }, { status: 404 });

    // Agent 1: Research — a short factual outline for the lesson.
    const researchRaw = await callClaude({
      model: SONNET,
      maxTokens: 500,
      system:
        "أنت باحث تعليمي يضع مخططًا (outline) لدرس تدريبي قصير داخل أكاديمية تدريب على الذكاء الاصطناعي. " +
        "أنتج 4 إلى 6 نقاط واقعية ومحددة تشكّل هيكل الدرس، بالعربية، بأسلوب رسمي وسهل الفهم. " +
        'أعد فقط JSON خام: {"outline": ["نقطة 1", "نقطة 2", ...]}.',
      prompt: `موضوع الدرس المطلوب:\n"""${topic}"""`,
    });
    const researchParsed = parseClaudeJson<{ outline?: unknown }>(researchRaw);
    const outline = strArr(researchParsed.outline, 6, 400);

    // Agent 2: Writer — the full lesson content, in the exact platform shape.
    const writerRaw = await callClaude({
      model: SONNET,
      maxTokens: 1400,
      system:
        "أنت كاتب محتوى تعليمي داخل أكاديمية تدريب داخلية على الذكاء الاصطناعي (أكاديمية AI). " +
        "اكتب درسًا كاملًا بالعربية، بأسلوب رسمي لكنه سهل التناول، مع أمثلة عملية ملموسة، بنفس روح دروس المنصة الحالية. " +
        "أعد فقط JSON خام بالضبط بهذا الشكل، بدون أي نص أو شرح خارج الكائن: " +
        '{"title": "عنوان قصير", "minutes": رقم صحيح بين 8 و20, "lead": "فقرة تمهيدية غنية", ' +
        '"points": ["نقطة تعليمية 1", "...", "(4 إلى 5 نقاط)"], "example": "فقرة مثال تطبيقي واحد ملموس", ' +
        '"question": "سؤال تحقق من الفهم", "options": ["خيار 1", "خيار 2", "خيار 3"], ' +
        '"answer": رقم فهرس الإجابة الصحيحة في options (يبدأ من 0), "reason": "فقرة توضح لماذا هذه الإجابة صحيحة"}.',
      prompt:
        `موضوع الدرس:\n"""${topic}"""\n\n` +
        `المخطط الذي وضعه الباحث (استخدمه كأساس لكتابة الدرس):\n${outline.map((o) => `- ${o}`).join("\n")}`,
    });
    const writerParsed = parseClaudeJson<Record<string, unknown>>(writerRaw);
    const draft = sanitizeLesson(writerParsed);

    // Agent 3: Reviewer — checks the answer is really correct, polishes wording, flags facts to verify.
    const reviewerRaw = await callClaude({
      model: SONNET,
      maxTokens: 1400,
      system:
        "أنت مراجع محتوى تعليمي دقيق. أمامك مسودة درس. تحقق أن فهرس answer يطابق فعلًا الإجابة الصحيحة عن question بناءً على " +
        "options وlead وexample، وصحّح أي خطأ في الصياغة أو النحو، وحافظ على نفس الحقول والبنية. " +
        "إن ورد في المسودة أي رقم أو إحصائية أو تاريخ محدد ينبغي التحقق منه يدويًا قبل النشر، أضفه إلى warnings كجملة عربية قصيرة. " +
        "أعد فقط JSON خام بالضبط بهذا الشكل: " +
        '{"lesson": {"title": "...", "minutes": رقم, "lead": "...", "points": ["..."], "example": "...", ' +
        '"question": "...", "options": ["..."], "answer": رقم, "reason": "..."}, "warnings": ["..."]} ' +
        "(warnings يمكن أن تكون مصفوفة فارغة إن لم توجد ملاحظات).",
      prompt: `مسودة الدرس (JSON):\n${JSON.stringify(draft)}`,
    });
    const reviewerParsed = parseClaudeJson<{ lesson?: unknown; warnings?: unknown }>(reviewerRaw);
    const lesson = sanitizeLesson(reviewerParsed.lesson ?? writerParsed);
    const warnings = strArr(reviewerParsed.warnings, 8, 300);

    return Response.json({ outline, warnings, lesson });
  } catch (e) {
    return fail(e);
  }
}
