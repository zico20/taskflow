// Translation dictionaries. `en` is the reference shape; `ar` must match its keys.
// A missing/extra Arabic key is a compile-time error (see the `Dictionary` type).
//
// Values may contain {param} placeholders, replaced at render time by t(key, params).
// Activity-feed sentences are whole-sentence templates per action so word order is
// correct in each language.

export const en = {
  // --- Common ---
  "common.appName": "TaskFlow",
  "common.tagline": "Real-time collaborative kanban",
  "common.cancel": "Cancel",
  "common.create": "Create",
  "common.save": "Save changes",
  "common.delete": "Delete",
  "common.add": "Add",
  "common.loading": "Loading…",
  "common.home": "Home",
  "common.logout": "Log out",
  "common.optional": "optional",

  // --- Language switcher ---
  "lang.switchTo": "العربية", // shows the OTHER language's name to switch to
  "lang.label": "Language",

  // --- Landing ---
  "landing.nav.login": "Log in",
  "landing.nav.start": "Get started",
  "landing.hero.badge": "Real-time team collaboration",
  "landing.hero.title": "Organize your team's tasks on one board",
  "landing.hero.titleAccent": "and watch updates happen instantly",
  "landing.hero.subtitle":
    "A collaborative kanban-style task board — drag tasks, track progress, and collaborate with your team in real time.",
  "landing.hero.tryDemo": "Try without signing up",
  "landing.hero.createAccount": "Create a free account",
  "landing.hero.noCard": "No email or card required — try it right now.",
  "landing.features.heading": "Everything you need to manage your tasks",
  "landing.features.subheading":
    "Simple, fast tools designed to keep you focused on the work, not the tool.",
  "landing.feature.kanban.title": "Kanban boards",
  "landing.feature.kanban.desc":
    "Organize tasks across columns (To Do, In Progress, Done) or create your own columns.",
  "landing.feature.realtime.title": "Real-time collaboration",
  "landing.feature.realtime.desc":
    "When a teammate moves a task, you see it move instantly — no page refresh.",
  "landing.feature.dnd.title": "Drag and drop",
  "landing.feature.dnd.desc":
    "Move tasks between columns smoothly, with an instant UI update before it reaches the server.",
  "landing.feature.presence.title": "Live presence",
  "landing.feature.presence.desc":
    "See the avatars of members currently viewing the board, and know who's working with you.",
  "landing.feature.activity.title": "Activity log",
  "landing.feature.activity.desc":
    "Track every move: who created a task, who moved it, and when — in a clear side panel.",
  "landing.feature.priorities.title": "Priorities & labels",
  "landing.feature.priorities.desc":
    "Set each task's priority (low/medium/high), add due dates and colored labels.",
  "landing.cta.heading": "Ready to start?",
  "landing.cta.subtitle":
    "Try the demo board now, or create your free account and keep your work forever.",
  "landing.cta.tryDemo": "Try the demo board",
  "landing.cta.createAccount": "Create account",
  "landing.footer": "TaskFlow — real-time collaborative kanban.",

  // --- Auth ---
  "auth.login.title": "Welcome back",
  "auth.login.subtitle": "Log in to your account",
  "auth.login.submit": "Log in",
  "auth.login.noAccount": "Don't have an account?",
  "auth.login.signupLink": "Sign up",
  "auth.signup.title": "Create account",
  "auth.signup.subtitle": "Start organizing your work",
  "auth.signup.submit": "Create account",
  "auth.signup.haveAccount": "Already have an account?",
  "auth.signup.loginLink": "Log in",
  "auth.field.name": "Name",
  "auth.field.email": "Email",
  "auth.field.password": "Password",
  "auth.placeholder.email": "you@example.com",
  "auth.placeholder.password": "••••••••",
  "auth.placeholder.name": "Zain Mawla",
  "auth.placeholder.newPassword": "At least 8 characters",
  "auth.error.invalidEmail": "Enter a valid email",
  "auth.error.passwordRequired": "Password is required",
  "auth.error.nameRequired": "Name is required",
  "auth.error.passwordMin": "At least 8 characters",
  "auth.error.generic": "Something went wrong. Try again.",

  // --- Boards list ---
  "boards.title": "Your boards",
  "boards.count": "{count} boards",
  "boards.count_one": "{count} board",
  "boards.new": "New board",
  "boards.empty.title": "No boards yet",
  "boards.empty.desc":
    "Create your first board to start organizing tasks across columns.",
  "boards.empty.cta": "Create a board",
  "boards.card.tasks": "{count} tasks",
  "boards.card.tasks_one": "{count} task",
  "boards.role.owner": "owner",
  "boards.role.editor": "editor",
  "boards.role.viewer": "viewer",

  // --- Create board dialog ---
  "createBoard.title": "Create board",
  "createBoard.name": "Name",
  "createBoard.namePlaceholder": "Product Roadmap",
  "createBoard.description": "Description (optional)",
  "createBoard.descriptionPlaceholder": "What is this board for?",
  "createBoard.color": "Color",
  "createBoard.submit": "Create board",
  "createBoard.nameRequired": "Board name is required",
  "createBoard.success": "Board created",
  "createBoard.error": "Couldn't create the board",

  // --- Delete board ---
  "deleteBoard.title": "Delete board",
  "deleteBoard.message":
    "Delete \"{name}\"? This permanently removes all its columns, tasks, and activity. This cannot be undone.",
  "deleteBoard.confirm": "Delete board",
  "deleteBoard.success": "Board deleted",
  "deleteBoard.error": "Couldn't delete the board",

  // --- Board view ---
  "board.notFound.title": "Board not found",
  "board.notFound.desc":
    "This board doesn't exist or you don't have access to it.",
  "board.notFound.back": "Back to boards",
  "board.search": "Search tasks… ( / )",
  "board.addColumn": "Add column",
  "board.empty.title": "No columns yet",
  "board.empty.desc": "Add a column to start tracking tasks.",
  "board.activity.toggleShow": "Show activity",
  "board.activity.toggleHide": "Hide activity",

  // --- Column ---
  "column.addTask": "Add task",
  "column.noTasks": "No tasks",
  "column.rename": "Rename",
  "column.delete": "Delete",
  "column.options": "Column options",
  "column.created": "Column added",
  "column.createError": "Couldn't add the column",

  // --- Add column dialog ---
  "addColumn.title": "Add column",
  "addColumn.name": "Column name",
  "addColumn.placeholder": "e.g. Backlog",

  // --- Task dialog ---
  "task.new": "New task",
  "task.edit": "Edit task",
  "task.title": "Title",
  "task.titlePlaceholder": "What needs to be done?",
  "task.titleRequired": "Title is required",
  "task.description": "Description",
  "task.descriptionHint": "(markdown supported)",
  "task.descriptionPlaceholder": "Add more detail…",
  "task.dueDate": "Due date",
  "task.priority": "Priority",
  "task.labels": "Labels",
  "task.delete": "Delete task",
  "task.create": "Create task",
  "task.created": "Task created",
  "task.createError": "Couldn't create the task",
  "task.updated": "Task updated",
  "task.updateError": "Couldn't update the task",
  "task.deleted": "Task deleted",
  "priority.low": "Low",
  "priority.medium": "Medium",
  "priority.high": "High",

  // --- Activity feed ---
  "activity.title": "Activity",
  "activity.empty.title": "No activity yet",
  "activity.empty.desc": "Actions on this board will show up here.",
  "activity.someone": "Someone",
  // Whole-sentence templates (mirror backend human_action). {user},{title},{name},{column},{member}
  "activity.task.created": "{user} created task '{title}'",
  "activity.task.updated": "{user} updated task '{title}'",
  "activity.task.deleted": "{user} deleted task '{title}'",
  "activity.task.moved": "{user} moved '{title}' to {column}",
  "activity.column.created": "{user} added column '{name}'",
  "activity.column.renamed": "{user} renamed a column to '{name}'",
  "activity.column.deleted": "{user} deleted column '{name}'",
  "activity.column.reordered": "{user} reordered columns",
  "activity.board.created": "{user} created board '{name}'",
  "activity.board.updated": "{user} updated board '{name}'",
  "activity.member.added": "{user} added {member}",

  // --- Demo ---
  "demo.signupToSave": "Sign up to save your work",
  "demo.banner":
    "You're in demo mode — try drag-and-drop and add tasks freely. Changes are NOT saved after you close the page.",
  "demo.bannerCta": "Create an account to keep your boards →",
  "demo.title": "Demo board",
  "demo.subtitle": "Drag tasks between columns, or add a new task.",
  "demo.addTask": "Add task",
  "demo.taskPlaceholder": "Task title…",
  "demo.noTasks": "No tasks",
  "demo.delete": "Delete",

  // --- Top bar / presence ---
  "presence.live": "Live",
  "presence.disconnected": "Disconnected",
} as const;

// The dictionary shape is fixed by `en`. `ar` MUST provide exactly these keys.
export type MessageKey = keyof typeof en;
export type Dictionary = Record<MessageKey, string>;

export const ar: Dictionary = {
  // --- Common ---
  "common.appName": "TaskFlow",
  "common.tagline": "لوحة مهام تعاونية لحظية",
  "common.cancel": "إلغاء",
  "common.create": "إنشاء",
  "common.save": "حفظ التغييرات",
  "common.delete": "حذف",
  "common.add": "إضافة",
  "common.loading": "جارٍ التحميل…",
  "common.home": "الرئيسية",
  "common.logout": "تسجيل الخروج",
  "common.optional": "اختياري",

  // --- Language switcher ---
  "lang.switchTo": "English",
  "lang.label": "اللغة",

  // --- Landing ---
  "landing.nav.login": "تسجيل الدخول",
  "landing.nav.start": "ابدأ مجاناً",
  "landing.hero.badge": "تعاون لحظي بين الفريق",
  "landing.hero.title": "نظّم مهام فريقك في لوحة واحدة",
  "landing.hero.titleAccent": "وشوف التحديثات تصير لحظياً",
  "landing.hero.subtitle":
    "لوحة مهام تعاونية بأسلوب كانبان — اسحب المهام، تابع التقدّم، وتعاون مع فريقك في الوقت الفعلي.",
  "landing.hero.tryDemo": "جرّب بدون تسجيل",
  "landing.hero.createAccount": "إنشاء حساب مجاني",
  "landing.hero.noCard": "التجربة لا تحتاج بريد إلكتروني ولا بطاقة — جرّب فوراً.",
  "landing.features.heading": "كل اللي تحتاجه لإدارة مهامك",
  "landing.features.subheading":
    "أدوات بسيطة وسريعة، مصمّمة لتركّز على الشغل مو على الأداة.",
  "landing.feature.kanban.title": "لوحات كانبان",
  "landing.feature.kanban.desc":
    "نظّم مهامك عبر أعمدة (قيد الانتظار، قيد التنفيذ، منجز) أو أنشئ أعمدتك الخاصة.",
  "landing.feature.realtime.title": "تعاون لحظي",
  "landing.feature.realtime.desc":
    "لمّا يحرّك زميلك مهمة، تشوفها تتحرك عندك فوراً — بدون أي تحديث للصفحة.",
  "landing.feature.dnd.title": "سحب وإفلات",
  "landing.feature.dnd.desc":
    "حرّك المهام بين الأعمدة بسلاسة، مع تحديث فوري للواجهة قبل ما يوصل للخادم.",
  "landing.feature.presence.title": "حضور مباشر",
  "landing.feature.presence.desc":
    "شوف صور الأعضاء الموجودين على اللوحة الآن، واعرف منو يشتغل وياك.",
  "landing.feature.activity.title": "سجل النشاط",
  "landing.feature.activity.desc":
    "تابع كل حركة: منو أنشأ مهمة، منو نقلها، ومتى — في لوحة جانبية واضحة.",
  "landing.feature.priorities.title": "أولويات وتصنيفات",
  "landing.feature.priorities.desc":
    "حدّد أولوية كل مهمة (منخفضة/متوسطة/عالية)، أضف تواريخ استحقاق وتصنيفات ملوّنة.",
  "landing.cta.heading": "جاهز تبدأ؟",
  "landing.cta.subtitle":
    "جرّب اللوحة التجريبية الآن، أو أنشئ حسابك المجاني واحفظ شغلك للأبد.",
  "landing.cta.tryDemo": "جرّب اللوحة التجريبية",
  "landing.cta.createAccount": "إنشاء حساب",
  "landing.footer": "TaskFlow — لوحة مهام تعاونية لحظية.",

  // --- Auth ---
  "auth.login.title": "مرحباً بعودتك",
  "auth.login.subtitle": "سجّل الدخول إلى حسابك",
  "auth.login.submit": "تسجيل الدخول",
  "auth.login.noAccount": "ما عندك حساب؟",
  "auth.login.signupLink": "أنشئ حساباً",
  "auth.signup.title": "إنشاء حساب",
  "auth.signup.subtitle": "ابدأ بتنظيم شغلك",
  "auth.signup.submit": "إنشاء حساب",
  "auth.signup.haveAccount": "عندك حساب بالفعل؟",
  "auth.signup.loginLink": "تسجيل الدخول",
  "auth.field.name": "الاسم",
  "auth.field.email": "البريد الإلكتروني",
  "auth.field.password": "كلمة المرور",
  "auth.placeholder.email": "you@example.com",
  "auth.placeholder.password": "••••••••",
  "auth.placeholder.name": "زين الموسوي",
  "auth.placeholder.newPassword": "٨ أحرف على الأقل",
  "auth.error.invalidEmail": "أدخل بريداً إلكترونياً صحيحاً",
  "auth.error.passwordRequired": "كلمة المرور مطلوبة",
  "auth.error.nameRequired": "الاسم مطلوب",
  "auth.error.passwordMin": "٨ أحرف على الأقل",
  "auth.error.generic": "صار خطأ ما. حاول مرة ثانية.",

  // --- Boards list ---
  "boards.title": "لوحاتك",
  "boards.count": "{count} لوحات",
  "boards.count_one": "لوحة واحدة",
  "boards.new": "لوحة جديدة",
  "boards.empty.title": "ما عندك لوحات بعد",
  "boards.empty.desc": "أنشئ أول لوحة لتبدأ بتنظيم المهام عبر الأعمدة.",
  "boards.empty.cta": "أنشئ لوحة",
  "boards.card.tasks": "{count} مهام",
  "boards.card.tasks_one": "مهمة واحدة",
  "boards.role.owner": "مالك",
  "boards.role.editor": "محرّر",
  "boards.role.viewer": "مشاهد",

  // --- Create board dialog ---
  "createBoard.title": "إنشاء لوحة",
  "createBoard.name": "الاسم",
  "createBoard.namePlaceholder": "خارطة طريق المنتج",
  "createBoard.description": "الوصف (اختياري)",
  "createBoard.descriptionPlaceholder": "شنو الغرض من هاي اللوحة؟",
  "createBoard.color": "اللون",
  "createBoard.submit": "إنشاء لوحة",
  "createBoard.nameRequired": "اسم اللوحة مطلوب",
  "createBoard.success": "تم إنشاء اللوحة",
  "createBoard.error": "تعذّر إنشاء اللوحة",

  // --- Delete board ---
  "deleteBoard.title": "حذف اللوحة",
  "deleteBoard.message":
    "حذف \"{name}\"؟ هذا يحذف نهائياً كل أعمدتها ومهامها ونشاطها. لا يمكن التراجع.",
  "deleteBoard.confirm": "حذف اللوحة",
  "deleteBoard.success": "تم حذف اللوحة",
  "deleteBoard.error": "تعذّر حذف اللوحة",

  // --- Board view ---
  "board.notFound.title": "اللوحة غير موجودة",
  "board.notFound.desc": "هاي اللوحة غير موجودة أو ما عندك صلاحية الوصول إليها.",
  "board.notFound.back": "الرجوع إلى اللوحات",
  "board.search": "ابحث في المهام… ( / )",
  "board.addColumn": "إضافة عمود",
  "board.empty.title": "ما في أعمدة بعد",
  "board.empty.desc": "أضف عموداً لتبدأ بتتبّع المهام.",
  "board.activity.toggleShow": "إظهار النشاط",
  "board.activity.toggleHide": "إخفاء النشاط",

  // --- Column ---
  "column.addTask": "إضافة مهمة",
  "column.noTasks": "لا توجد مهام",
  "column.rename": "إعادة تسمية",
  "column.delete": "حذف",
  "column.options": "خيارات العمود",
  "column.created": "تمت إضافة العمود",
  "column.createError": "تعذّر إضافة العمود",

  // --- Add column dialog ---
  "addColumn.title": "إضافة عمود",
  "addColumn.name": "اسم العمود",
  "addColumn.placeholder": "مثلاً: قائمة الانتظار",

  // --- Task dialog ---
  "task.new": "مهمة جديدة",
  "task.edit": "تعديل المهمة",
  "task.title": "العنوان",
  "task.titlePlaceholder": "شنو المطلوب إنجازه؟",
  "task.titleRequired": "العنوان مطلوب",
  "task.description": "الوصف",
  "task.descriptionHint": "(يدعم Markdown)",
  "task.descriptionPlaceholder": "أضف تفاصيل أكثر…",
  "task.dueDate": "تاريخ الاستحقاق",
  "task.priority": "الأولوية",
  "task.labels": "التصنيفات",
  "task.delete": "حذف المهمة",
  "task.create": "إنشاء مهمة",
  "task.created": "تم إنشاء المهمة",
  "task.createError": "تعذّر إنشاء المهمة",
  "task.updated": "تم تحديث المهمة",
  "task.updateError": "تعذّر تحديث المهمة",
  "task.deleted": "تم حذف المهمة",
  "priority.low": "منخفضة",
  "priority.medium": "متوسطة",
  "priority.high": "عالية",

  // --- Activity feed ---
  "activity.title": "النشاط",
  "activity.empty.title": "لا يوجد نشاط بعد",
  "activity.empty.desc": "الإجراءات على هاي اللوحة راح تظهر هنا.",
  "activity.someone": "أحدهم",
  "activity.task.created": "أنشأ {user} المهمة '{title}'",
  "activity.task.updated": "حدّث {user} المهمة '{title}'",
  "activity.task.deleted": "حذف {user} المهمة '{title}'",
  "activity.task.moved": "نقل {user} '{title}' إلى {column}",
  "activity.column.created": "أضاف {user} العمود '{name}'",
  "activity.column.renamed": "غيّر {user} اسم عمود إلى '{name}'",
  "activity.column.deleted": "حذف {user} العمود '{name}'",
  "activity.column.reordered": "أعاد {user} ترتيب الأعمدة",
  "activity.board.created": "أنشأ {user} اللوحة '{name}'",
  "activity.board.updated": "حدّث {user} اللوحة '{name}'",
  "activity.member.added": "أضاف {user} العضو {member}",

  // --- Demo ---
  "demo.signupToSave": "سجّل لحفظ شغلك",
  "demo.banner":
    "أنت في الوضع التجريبي — جرّب السحب والإفلات وأضف مهام بحرية. التغييرات لا تُحفظ بعد إغلاق الصفحة.",
  "demo.bannerCta": "أنشئ حساباً لتحفظ لوحاتك ←",
  "demo.title": "لوحة تجريبية",
  "demo.subtitle": "اسحب المهام بين الأعمدة، أو أضف مهمة جديدة.",
  "demo.addTask": "إضافة مهمة",
  "demo.taskPlaceholder": "عنوان المهمة…",
  "demo.noTasks": "لا توجد مهام",
  "demo.delete": "حذف",

  // --- Top bar / presence ---
  "presence.live": "متصل",
  "presence.disconnected": "غير متصل",
};

export const dictionaries: Record<"en" | "ar", Dictionary> = { en, ar };
