import { identity, denied, fail } from "@/lib/academy";
import { callClaude, parseClaudeJson, SONNET } from "@/lib/agents/claude";
import { publicSimulations, findSimulation } from "@/lib/simulations";

export const dynamic = "force-dynamic";

const str = (x: unknown, max = 3000) =>
  typeof x === "string" ? x.trim().slice(0, max) : "";

/** The scenario list — any signed-in employee, not admin-only. */
export async function GET() {
  try {
    const user = await identity();
    if (!user) return denied();
    return Response.json({ simulations: publicSimulations() });
  } catch (e) {
    return fail(e);
  }
}

/** Grades one attempt against a scenario's server-only rubric. */
export async function POST(req: Request) {
  try {
    const user = await identity();
    if (!user) return denied();

    const body = (await req.json()) as Record<string, unknown>;
    const simulationId = str(body.simulationId, 100);
    const response = str(body.response, 2500);

    const sim = findSimulation(simulationId);
    if (!sim) {
      return Response.json({ error: "الموقف التدريبي غير موجود" }, { status: 404 });
    }
    if (!response) {
      return Response.json({ error: "اكتب محاولتك أولًا." }, { status: 400 });
    }

    const raw = await callClaude({
      model: SONNET,
      maxTokens: 700,
      system:
        "أنت مقيّم خبير يدرّب موظفين على التعامل العملي مع الذكاء الاصطناعي في بيئة العمل. " +
        "أمامك موقف تدريبي، ومعايير تقييم داخلية، ومحاولة الموظف. " +
        "قيّم المحاولة وفق المعايير المُعطاة فقط، بإنصاف وبأسلوب بنّاء ومشجّع. " +
        'أعد فقط JSON خام دون أي شرح إضافي ودون علامات ```، بالضبط بهذا الشكل: ' +
        '{"score": رقم صحيح من 1 إلى 5, "metCriteria": ["معيار تحقق بصياغة عربية موجزة", ...], ' +
        '"improvements": ["ملاحظة تحسين عربية واحدة قابلة للتنفيذ", ...], "feedback": "جملتان تلخّصان التقييم بأسلوب مشجّع"}. ' +
        "أعد 4 عناصر كحد أقصى في كل من metCriteria وimprovements، وأعد improvements كمصفوفة فارغة فقط إن كانت المحاولة ممتازة فعلًا.",
      prompt:
        `الموقف:\n${sim.brief}\n\n` +
        `المطلوب من الموظف:\n${sim.task}\n\n` +
        `معايير التقييم الداخلية:\n${sim.criteria.map((c) => `- ${c}`).join("\n")}\n\n` +
        `محاولة الموظف:\n"""${response}"""`,
    });

    const parsed = parseClaudeJson<{
      score?: number;
      metCriteria?: unknown;
      improvements?: unknown;
      feedback?: string;
    }>(raw);

    const score = Math.max(1, Math.min(5, Math.round(Number(parsed.score) || 3)));
    const metCriteria = Array.isArray(parsed.metCriteria)
      ? parsed.metCriteria.map((s) => str(s, 300)).filter(Boolean).slice(0, 4)
      : [];
    const improvements = Array.isArray(parsed.improvements)
      ? parsed.improvements.map((s) => str(s, 300)).filter(Boolean).slice(0, 4)
      : [];
    const feedback = str(parsed.feedback, 600) || "تم تقييم محاولتك.";

    return Response.json({ score, metCriteria, improvements, feedback });
  } catch (e) {
    return fail(e);
  }
}
