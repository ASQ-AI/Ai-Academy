/**
 * The 10-question AI placement assessment shown before a learner starts the
 * tracks. The correct answers live ONLY here (server-side) — the public
 * question list exposed to the browser never includes them, so a learner
 * can't read the answer key from the network tab the way lesson quizzes
 * (which do send their answer index to the client) currently allow.
 */

export type AssessmentQuestion = {
  question: string;
  options: string[];
  answer: number;
};

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    question: "ما التعريف الأقرب للذكاء الاصطناعي؟",
    options: [
      "برامج أو أنظمة تحاكي سلوكيات ذكية كالتعلم وحل المشكلات واتخاذ القرار",
      "أي برنامج حاسوبي يعمل تلقائيًا دون أي تدخل بشري",
      "نوع من أنواع الفيروسات أو البرمجيات الخبيثة",
    ],
    answer: 0,
  },
  {
    question:
      "ما الفرق الأساسي بين الذكاء الاصطناعي التوليدي (Generative AI) ومحرك بحث تقليدي؟",
    options: [
      "لا يوجد فرق حقيقي بينهما، كلاهما يعيد نفس النتائج",
      "التوليدي ينشئ محتوى جديدًا (نصًا أو صورة) بناءً على أنماط تعلّمها، بينما محرك البحث يعيد نتائج موجودة مسبقًا فقط",
      "محرك البحث أحدث تقنيًا من الذكاء الاصطناعي التوليدي",
    ],
    answer: 1,
  },
  {
    question:
      "أي نوع من تعلّم الآلة يعتمد على بيانات تدريب لكل مدخل فيها مخرج صحيح معروف مسبقًا؟",
    options: [
      "التعلم غير الموجّه (Unsupervised Learning)",
      "التعلم المعزز (Reinforcement Learning)",
      "التعلم الموجّه (Supervised Learning)",
    ],
    answer: 2,
  },
  {
    question:
      "ماذا يعني مصطلح \"الهلوسة\" (Hallucination) عند الحديث عن نماذج الذكاء الاصطناعي التوليدي؟",
    options: [
      "توقف النموذج بالكامل عن العمل",
      "توليد النموذج معلومات تبدو منطقية وواثقة لكنها غير صحيحة أو غير موجودة فعليًا",
      "قدرة النموذج الجديدة على تحليل الصور",
    ],
    answer: 1,
  },
  {
    question:
      "عند كتابة طلب (Prompt) لأداة ذكاء اصطناعي، أي مما يلي يحسّن جودة الإجابة غالبًا؟",
    options: [
      "ترك الطلب عامًا وغامضًا قدر الإمكان",
      "تحديد الهدف والجمهور والسياق المتاح وشكل النتيجة المطلوبة",
      "تكرار الكلمة نفسها عدة مرات داخل الطلب",
    ],
    answer: 1,
  },
  {
    question: "الشبكات العصبية التلافيفية (CNN) هي الأنسب غالبًا لأي مهمة؟",
    options: [
      "تصنيف الصور والتعرف عليها",
      "تحليل نصوص طويلة جدًا فقط",
      "حساب معادلات رياضية بسيطة",
    ],
    answer: 0,
  },
  {
    question: "ما المقصود بـ\"التحيّز الخوارزمي\" (Algorithmic Bias)؟",
    options: [
      "خطأ برمجي بسيط يمكن إصلاحه بسطر كود واحد",
      "بطء أداء النموذج عند معالجة بيانات كبيرة الحجم",
      "ميل النظام لإعطاء نتائج غير عادلة تجاه فئة معينة بسبب انحياز كامن في بيانات التدريب",
    ],
    answer: 2,
  },
  {
    question:
      "في سياق \"وكلاء الذكاء الاصطناعي\" (AI Agents)، ما المقصود بـ\"استدعاء الدوال\" (Function/Tool Calling)؟",
    options: [
      "طريقة لتصغير حجم النموذج اللغوي المستخدم",
      "قدرة الوكيل على طلب تنفيذ إجراء فعلي أو جلب بيانات من نظام خارجي بدل الاعتماد فقط على معرفته الداخلية",
      "عملية إعادة تشغيل النظام تلقائيًا عند حدوث أي خطأ",
    ],
    answer: 1,
  },
  {
    question:
      "ما الفرق الجوهري بين الذكاء الاصطناعي المحدود (Narrow AI) والذكاء الاصطناعي العام (AGI)؟",
    options: [
      "لا فرق، المصطلحان مترادفان تمامًا",
      "المحدود يؤدي مهمة أو مهامًا محددة فقط (وهو كل الموجود حاليًا)، بينما العام قادر نظريًا على أي مهمة فكرية بشرية وهو غير موجود بعد",
      "الذكاء الاصطناعي العام أبطأ في المعالجة من المحدود فقط",
    ],
    answer: 1,
  },
  {
    question:
      "ما الهدف الرئيسي من أطر حوكمة الذكاء الاصطناعي مثل NIST AI RMF أو مبادئ OECD.AI؟",
    options: [
      "زيادة سرعة تدريب النماذج الكبيرة فقط",
      "حظر استخدام الذكاء الاصطناعي بالكامل في المؤسسات",
      "وضع مبادئ وتوصيات لاستخدام مسؤول وآمن وشفاف للذكاء الاصطناعي",
    ],
    answer: 2,
  },
];

export type AssessmentLevel = "مبتدئ" | "متوسط" | "متقدم";

/** Preference order of real track ids to recommend for each level — the
 * frontend picks the first one that actually exists in the learner's
 * loaded track list, so this works whether or not the extra tracks have
 * been added to a given deployment yet. */
export const LEVEL_TRACK_PREFERENCE: Record<AssessmentLevel, string[]> = {
  "مبتدئ": ["ai-foundations", "basics"],
  "متوسط": ["prompts", "ai-applied", "reports"],
  "متقدم": ["ai-advanced", "ai-agents", "ai-governance"],
};

export function levelForScore(score: number): AssessmentLevel {
  if (score <= 3) return "مبتدئ";
  if (score <= 7) return "متوسط";
  return "متقدم";
}

/** The question list exposed to the browser — answers stripped out on purpose. */
export function publicQuestions() {
  return ASSESSMENT_QUESTIONS.map((q) => ({
    question: q.question,
    options: q.options,
  }));
}
