"use client";

import Link from "next/link";
import {
  LayoutGrid,
  Zap,
  MousePointerClick,
  Users,
  Activity,
  ArrowLeft,
  Check,
} from "lucide-react";

// Arabic, RTL landing page. The app itself stays in English; this page is the
// public front door so visitors understand the product before signing up.

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "لوحات كانبان",
    desc: "نظّم مهامك عبر أعمدة (قيد الانتظار، قيد التنفيذ، منجز) أو أنشئ أعمدتك الخاصة.",
  },
  {
    icon: Zap,
    title: "تعاون لحظي",
    desc: "لمّا يحرّك زميلك مهمة، تشوفها تتحرك عندك فوراً — بدون أي تحديث للصفحة.",
  },
  {
    icon: MousePointerClick,
    title: "سحب وإفلات",
    desc: "حرّك المهام بين الأعمدة بسلاسة، مع تحديث فوري للواجهة قبل ما يوصل للخادم.",
  },
  {
    icon: Users,
    title: "حضور مباشر",
    desc: "شوف صور الأعضاء الموجودين على اللوحة الآن، واعرف منو يشتغل وياك.",
  },
  {
    icon: Activity,
    title: "سجل النشاط",
    desc: "تابع كل حركة: منو أنشأ مهمة، منو نقلها، ومتى — في لوحة جانبية واضحة.",
  },
  {
    icon: Check,
    title: "أولويات وتصنيفات",
    desc: "حدّد أولوية كل مهمة (منخفضة/متوسطة/عالية)، أضف تواريخ استحقاق وتصنيفات ملوّنة.",
  },
];

export function LandingPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-bg text-fg">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-bg">
              <LayoutGrid size={18} />
            </span>
            <span className="text-lg font-semibold">TaskFlow</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover"
            >
              ابدأ مجاناً
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 text-center sm:pt-24">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-subtle px-3 py-1 text-xs text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            تعاون لحظي بين الفريق
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            نظّم مهام فريقك في
            <span className="text-accent"> لوحة واحدة</span>
            <br />
            وشوف التحديثات تصير{" "}
            <span className="text-accent">لحظياً</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-fg-muted">
            لوحة مهام تعاونية بأسلوب كانبان — اسحب المهام، تابع التقدّم، وتعاون مع
            فريقك في الوقت الفعلي.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-hover sm:w-auto"
            >
              جرّب بدون تسجيل
              <ArrowLeft size={18} />
            </Link>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-md border border-border bg-bg-subtle px-6 py-3 font-medium text-fg transition-colors hover:bg-bg-muted sm:w-auto"
            >
              إنشاء حساب مجاني
            </Link>
          </div>
          <p className="mt-3 text-xs text-fg-subtle">
            التجربة لا تحتاج بريد إلكتروني ولا بطاقة — جرّب فوراً.
          </p>
        </div>

        {/* App preview mockup */}
        <div className="mx-auto mt-16 max-w-4xl animate-fade-in">
          <BoardPreview />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-bg-subtle/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            كل اللي تحتاجه لإدارة مهامك
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-fg-muted">
            أدوات بسيطة وسريعة، مصمّمة لتركّز على الشغل مو على الأداة.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-border bg-bg-subtle p-6 transition-colors hover:border-accent/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <f.icon size={20} />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">جاهز تبدأ؟</h2>
          <p className="mt-3 text-fg-muted">
            جرّب اللوحة التجريبية الآن، أو أنشئ حسابك المجاني واحفظ شغلك للأبد.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-hover sm:w-auto"
            >
              جرّب اللوحة التجريبية
              <ArrowLeft size={18} />
            </Link>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-md border border-border bg-bg-subtle px-6 py-3 font-medium text-fg transition-colors hover:bg-bg-muted sm:w-auto"
            >
              إنشاء حساب
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-fg-subtle">
          TaskFlow — لوحة مهام تعاونية لحظية.
        </div>
      </footer>
    </div>
  );
}

// A static, decorative preview of the kanban board (LTR inside, since the app
// is English) so visitors see what they're getting.
function BoardPreview() {
  const cols = [
    {
      name: "To Do",
      color: "#58A6FF",
      tasks: [
        { t: "Design landing page", p: "high", pc: "#F85149" },
        { t: "Set up CI pipeline", p: "medium", pc: "#D29922" },
      ],
    },
    {
      name: "In Progress",
      color: "#D29922",
      tasks: [{ t: "Build auth flow", p: "high", pc: "#F85149" }],
    },
    {
      name: "Done",
      color: "#3FB950",
      tasks: [
        { t: "Project scaffold", p: "low", pc: "#3FB950" },
        { t: "Database schema", p: "medium", pc: "#D29922" },
      ],
    },
  ];
  return (
    <div
      dir="ltr"
      className="overflow-hidden rounded-xl border border-border bg-bg-subtle p-4 shadow-2xl"
    >
      <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
        <span className="h-3 w-3 rounded-full bg-danger/70" />
        <span className="h-3 w-3 rounded-full bg-warning/70" />
        <span className="h-3 w-3 rounded-full bg-success/70" />
        <span className="ms-2 text-xs text-fg-subtle">TaskFlow — Sprint Board</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {cols.map((c) => (
          <div key={c.name}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-xs font-semibold text-fg">{c.name}</span>
              <span className="rounded-full bg-bg-muted px-1.5 text-[10px] text-fg-subtle">
                {c.tasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {c.tasks.map((task) => (
                <div
                  key={task.t}
                  className="rounded-md border border-border bg-bg-elevated p-2.5 text-start"
                >
                  <p className="text-xs font-medium text-fg">{task.t}</p>
                  <span
                    className="mt-1.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                    style={{
                      backgroundColor: `${task.pc}22`,
                      color: task.pc,
                      border: `1px solid ${task.pc}55`,
                    }}
                  >
                    {task.p}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
