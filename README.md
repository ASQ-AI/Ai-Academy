# أكاديمية AI

منصة تدريب داخلية لموظفي Opentech: مسارات ودروس تفاعلية عن الذكاء الاصطناعي، مدرب لكتابة الأوامر، تتبع تقدم كل متعلم، ولوحة إدارة لإنشاء المسارات ونشرها.

Next.js (App Router) + Supabase (قاعدة بيانات Postgres وتسجيل الدخول عبر رابط سحري بالبريد الإلكتروني). جاهزة للنشر على Vercel.

## 1) إعداد Supabase

1. أنشئ مشروعًا جديدًا على [supabase.com](https://supabase.com).
2. من `SQL Editor` نفّذ محتوى الملف [`supabase/schema.sql`](./supabase/schema.sql) كاملًا (ينشئ الجداول ويزرع المسارات والدروس الثلاثة تلقائيًا).
3. من `Authentication -> Providers` تأكد أن مزوّد `Email` مفعّل (مفعّل افتراضيًا). هذا يكفي لتسجيل الدخول برابط سحري بلا كلمة مرور.
4. من `Authentication -> URL Configuration` أضف:
   - `Site URL`: رابط موقعك بعد نشره على Vercel (مثال: `https://ai-academy.vercel.app`).
   - `Redirect URLs`: أضف `https://<رابط موقعك>/auth/callback` (وأثناء التطوير المحلي أضف أيضًا `http://localhost:3000/auth/callback`).
5. من `Project Settings -> API` انسخ ثلاث قيم ستحتاجها في خطوة Vercel:
   - `Project URL`
   - `anon public` key
   - `service_role` key (سرّي — لا تضعه إلا في متغيرات بيئة الخادم)

## 2) رفع الكود إلى GitHub

```bash
git init
git add .
git commit -m "أكاديمية AI: نسخة Next.js + Supabase"
git branch -M main
git remote add origin https://github.com/<اسم-حسابك>/<اسم-المستودع>.git
git push -u origin main
```

## 3) النشر على Vercel

1. من [vercel.com](https://vercel.com) اختر `Add New -> Project` واستورد المستودع من GitHub.
2. أضف متغيرات البيئة التالية (Project -> Settings -> Environment Variables)، وطبّقها على كل من Production وPreview وDevelopment:

   | المتغير | القيمة |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL من Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (سرّي) |
   | `ADMIN_EMAIL` | `asq-ai@opentech.ae` (أو أي بريد تريده مسؤولًا) |
   | `NEXT_PUBLIC_SITE_URL` | رابط موقعك النهائي على Vercel |

3. اضغط Deploy. بعد اكتمال النشر، ارجع لخطوة Supabase (البند 4 أعلاه) وتأكد أن `Site URL` و`Redirect URLs` تطابقان الرابط النهائي فعليًا.

## 4) تسجيل الدخول

افتح الموقع، أدخل بريدك الإلكتروني، وستصلك رسالة فيها رابط دخول (بدون كلمة مرور). عند الدخول بالبريد المحدد في `ADMIN_EMAIL` تظهر لك تلقائيًا لوحة "إدارة الأكاديمية" لإنشاء مسارات ودروس جديدة ونشرها ومتابعة المتعلمين.

## البنية

```
app/
  page.tsx              الصفحة الرئيسية (تتحقق من الجلسة ثم تحمّل public/app.js)
  login/page.tsx         صفحة تسجيل الدخول بالرابط السحري
  auth/callback/route.ts استقبال رابط الدخول من Supabase
  api/
    bootstrap/route.ts   بيانات المستخدم + المسارات + التقدم
    progress/route.ts    تصحيح الإجابة وحفظ إكمال الدرس
    admin/course/route.ts   إنشاء مسار ونشره/إخفاؤه (للإدارة فقط)
    admin/lesson/route.ts   إضافة درس (للإدارة فقط)
lib/
  academy.ts             منطق الهوية والصلاحيات وجلب المسارات
  supabase/*.ts          عملاء Supabase (خادم، متصفح، خدمة، وسيط الجلسة)
public/
  app.js, style.css      واجهة المستخدم (تطبيق صفحة واحدة بالجافاسكربت)
supabase/schema.sql       الجداول + سياسات RLS + بيانات البذر
```

## التطوير محليًا

```bash
npm install
cp .env.example .env.local   # ثم عبّئ القيم من Supabase
npm run dev
```
