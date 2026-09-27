-- ترحيل: مكتبة القوالب + أسماء عنصري القائمة الجديدين
-- شغّله مرة واحدة في Supabase: SQL Editor -> New query. آمن لإعادة التشغيل.

-- 1) جدول مكتبة القوالب (يديره المدير فقط عبر /api/admin/template)
create table if not exists public.templates (
  id text primary key,
  category text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists templates_category_idx on public.templates (category);
alter table public.templates enable row level security;

-- 2) أسماء عنصري «مكتبة القوالب» و«مختبر المحاكاة» في إعدادات المنصة
alter table if exists public.settings add column if not exists nav_templates text;
alter table if exists public.settings add column if not exists nav_simulation text;
