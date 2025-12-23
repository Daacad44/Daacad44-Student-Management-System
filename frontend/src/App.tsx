import type React from "react";
import {
  Bell,
  BookOpen,
  CalendarClock,
  ClipboardList,
  GraduationCap,
  Briefcase,
  LayoutDashboard,
  Megaphone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { cn } from "./lib/utils";
import { apiDeleteAuth, apiDownload, apiGetAuth, apiPost, apiPostAuth, apiPutAuth } from "./lib/api";
import ClassesPage from "./pages/ClassesPage";

type NavItem = { label: string; path: string; icon: React.ReactNode };
type NavSection = { title: string; items: NavItem[] };

type StudentForm = {
  firstName: string;
  lastName: string;
  email: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  status: "Active" | "Inactive" | "Graduated";
  classId: number;
  sectionId: number;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;
  address: string;
  notes: string;
};

type UserProfile = { id: number; name: string; email: string; roles: string[] };

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Students", path: "/students", icon: <Users className="h-4 w-4" /> },
      { label: "Staff", path: "/staff", icon: <ShieldCheck className="h-4 w-4" /> },
      { label: "Classes", path: "/classes", icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
  {
    title: "Academic",
    items: [
      { label: "Timetable", path: "/timetable", icon: <CalendarClock className="h-4 w-4" /> },
      { label: "Attendance", path: "/attendance", icon: <BookOpen className="h-4 w-4" /> },
      { label: "Exams", path: "/exams", icon: <GraduationCap className="h-4 w-4" /> },
      { label: "Subjects", path: "/subjects", icon: <Megaphone className="h-4 w-4" /> },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Finance", path: "/finance", icon: <Wallet className="h-4 w-4" /> },
      { label: "Announcements", path: "/announcements", icon: <Megaphone className="h-4 w-4" /> },
      { label: "Settings", path: "/settings", icon: <Settings className="h-4 w-4" /> },
      { label: "Users", path: "/settings/users", icon: <UserPlus className="h-4 w-4" /> },
    ],
  },
];

const StatCard = ({
  title,
  value,
  subtitle,
  tone = "brand",
}: {
  title: string;
  value: string;
  subtitle: string;
  tone?: "brand" | "green" | "orange" | "slate";
}) => {
  const colors: Record<string, string> = {
    brand: "from-brand-500/90 to-brand-600",
    green: "from-emerald-500/90 to-emerald-600",
    orange: "from-orange-500/90 to-orange-600",
    slate: "from-slate-500/90 to-slate-700",
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-3xl font-semibold text-slate-900">{value}</span>
        <span
          className={cn(
            "rounded-full bg-gradient-to-r px-2 py-1 text-[11px] font-semibold text-white",
            colors[tone],
          )}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
};

const ProgressBar = ({ value, max }: { value: number; max: number }) => {
  const pct = Math.min(Math.max(value / max, 0), 1) * 100;
  return (
    <div className="h-2 rounded-full bg-slate-200">
      <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
};

const WeeklyAttendance = ({
  data,
}: {
  data?: { day: string; present: number; total?: number }[];
}) => {
  const fallback = [
    { day: "Mon", present: 92 },
    { day: "Tue", present: 90 },
    { day: "Wed", present: 95 },
    { day: "Thu", present: 91 },
    { day: "Fri", present: 88 },
  ];
  const rows = data && data.length ? data : fallback;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-slate-900">Weekly Attendance</p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-brand-500" /> Present
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> Absent
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-4">
        {rows.map((item) => {
          const label =
            item.day.length > 3
              ? new Date(item.day).toLocaleDateString("en-US", { weekday: "short" })
              : item.day;
          return (
          <div key={item.day} className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 p-3">
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-semibold text-slate-900">{item.present}%</span>
              <span className="text-xs text-slate-500">present</span>
            </div>
            <div className="h-20 w-10 rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-b from-brand-500 to-brand-600"
                style={{ height: `${item.present}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-600">{label}</span>
          </div>
          );
        })}
      </div>
    </div>
  );
};

const FeeCollection = ({
  totalBilled,
  collected,
  pending,
  paidCount,
  partialCount,
  overdueCount,
}: {
  totalBilled: number;
  collected: number;
  pending: number;
  paidCount: number;
  partialCount: number;
  overdueCount: number;
}) => (
  <div className="rounded-2xl bg-white p-5 shadow-card">
    <div className="flex items-center justify-between">
      <p className="text-base font-semibold text-slate-900">Fee Collection Overview</p>
      <span className="text-xs font-semibold text-emerald-600">+$18% this month</span>
    </div>
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>Total Billed</span>
      <span className="font-semibold text-slate-900">${totalBilled.toLocaleString()}</span>
    </div>
    <div className="mt-2">
      <ProgressBar value={collected} max={totalBilled || 1} />
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>Collected: ${collected.toLocaleString()}</span>
        <span>Pending: ${pending.toLocaleString()}</span>
      </div>
    </div>
    <div className="mt-6 grid grid-cols-3 gap-3 text-center">
      {[
        { value: paidCount, label: "Paid", tone: "text-emerald-600" },
        { value: partialCount, label: "Partial", tone: "text-orange-500" },
        { value: overdueCount, label: "Overdue", tone: "text-rose-500" },
      ].map((item) => (
        <div key={item.label} className="rounded-xl bg-slate-50 p-3">
          <p className={cn("text-2xl font-semibold", item.tone)}>{item.value}</p>
          <p className="text-xs text-slate-500">{item.label}</p>
        </div>
      ))}
    </div>
  </div>
);

const RealDashboardPage = () => {
  const [summary, setSummary] = useState<{
    students: { total: number; newThisYear: number };
    staff: { total: number; newThisMonth: number };
    attendance: { todayPercent: number | null; weekly: { day: string; present: number; total?: number }[] };
    finance: { totalBilled: number; collected: number; pending: number; paidCount: number; partialCount: number; overdueCount: number };
  }>({
    students: { total: 0, newThisYear: 0 },
    staff: { total: 0, newThisMonth: 0 },
    attendance: { todayPercent: null, weekly: [] },
    finance: { totalBilled: 0, collected: 0, pending: 0, paidCount: 0, partialCount: 0, overdueCount: 0 },
  });

  useEffect(() => {
    apiGetAuth<typeof summary>("/dashboard/summary")
      .then((res) => setSummary(res))
      .catch(() => {});
  }, []);

  const stats = [
    {
      title: "Total Students",
      value: summary.students.total.toString(),
      subtitle: `+${summary.students.newThisYear} this year`,
      tone: "brand" as const,
    },
    {
      title: "Total Staff",
      value: summary.staff.total.toString(),
      subtitle: `+${summary.staff.newThisMonth} this month`,
      tone: "green" as const,
    },
    {
      title: "Today's Attendance",
      value: summary.attendance.todayPercent !== null ? `${summary.attendance.todayPercent}%` : "N/A",
      subtitle: summary.attendance.todayPercent !== null ? "Today" : "No data",
      tone: "orange" as const,
    },
    {
      title: "Fee Collection",
      value: `$${summary.finance.collected.toLocaleString()}`,
      subtitle: `Pending $${summary.finance.pending.toLocaleString()}`,
      tone: "slate" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lg font-semibold text-slate-900">Dashboard</p>
        <p className="text-sm text-slate-500">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyAttendance data={summary.attendance.weekly} />
        </div>
        <FeeCollection
          totalBilled={summary.finance.totalBilled}
          collected={summary.finance.collected}
          pending={summary.finance.pending}
          paidCount={summary.finance.paidCount}
          partialCount={summary.finance.partialCount}
          overdueCount={summary.finance.overdueCount}
        />
      </div>
    </div>
  );
};

// (Removed unused DashboardPage — RealDashboardPage is used in routes)

const StudentsPage = () => <StudentFormSection />;

type ClassOption = {
  id: number;
  name: string;
  sections?: { id: number; name: string }[];
};

const StudentFormSection = () => {
  const initialForm: StudentForm = {
    firstName: "",
    lastName: "",
    email: "",
    gender: "Male",
    dob: "",
    status: "Active",
    classId: 0,
    sectionId: 0,
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianAddress: "",
    address: "",
    notes: "",
  };

  const [form, setForm] = useState<StudentForm>(initialForm);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [summary, setSummary] = useState<{ total: number; active: number; graduated: number; newThisYear: number }>({
    total: 0,
    active: 0,
    graduated: 0,
    newThisYear: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: "idle" | "error" | "success"; text?: string }>({ kind: "idle" });
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchStudents = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter) params.append("status", statusFilter);
    if (classFilter) params.append("classId", String(classFilter));
    apiGetAuth<{ data: any[]; total: number; page: number; pageSize: number }>(`/students?${params.toString()}`)
      .then((res) => setStudents(res.data))
      .catch(() => setMessage({ kind: "error", text: "Failed to load students" }));
  };

  const fetchClasses = () => {
    apiGetAuth<{ data: ClassOption[] }>("/classes")
      .then((res) => setClasses(res.data))
      .catch(() => {});
  };

  const fetchSummary = () => {
    apiGetAuth<{ total: number; active: number; graduated: number; newThisYear: number }>("/students/summary")
      .then((res) => setSummary(res))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStudents();
    fetchSummary();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!form.classId && classes.length && !editingId) {
      setForm((prev) => ({ ...prev, classId: classes[0].id }));
    }
  }, [classes, editingId, form.classId]);

  const handleChange = (key: keyof StudentForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => setForm(initialForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && !form.classId) {
      setMessage({ kind: "error", text: "Class is required" });
      return;
    }
    setLoading(true);
    setMessage({ kind: "idle" });
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      gender: form.gender,
      dob: form.dob,
      status: form.status.toLowerCase(),
      address: form.address,
      guardianName: form.guardianName || undefined,
      guardianPhone: form.guardianPhone || undefined,
      guardianEmail: form.guardianEmail || undefined,
      guardianAddress: form.guardianAddress || undefined,
      classId: form.classId || undefined,
      sectionId: form.sectionId || undefined,
    };
    const request = editingId
      ? apiPutAuth(`/students/${editingId}`, payload)
      : apiPostAuth("/students", payload);

    request
      .then(() => {
        setMessage({ kind: "success", text: editingId ? "Student updated" : "Student created" });
        handleReset();
        setEditingId(null);
        setShowDrawer(false);
        fetchStudents();
        fetchSummary();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }))
      .finally(() => setLoading(false));
  };

  const handleDelete = (id: number) => {
    apiDeleteAuth(`/students/${id}`)
      .then(() => {
        setMessage({ kind: "success", text: "Student deleted" });
        fetchStudents();
        fetchSummary();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  const handleExport = (format: "csv" | "xlsx") => {
    apiDownload(`/students/export?format=${format}`)
      .then(({ blob, filename }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  const selectedClass = classes.find((c) => c.id === form.classId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Add New Student</p>
          <p className="text-sm text-slate-500">Capture student details, guardian info, and placement.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-card md:grid-cols-4">
        {[
          { label: "Total Students", value: summary.total, tone: "text-brand-600" },
          { label: "Active", value: summary.active, tone: "text-emerald-600" },
          { label: "New This Year", value: summary.newThisYear, tone: "text-brand-600" },
          { label: "Graduated", value: summary.graduated, tone: "text-orange-600" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            handleReset();
            setShowDrawer(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add Student
        </button>
      </div>

      {message.kind === "error" && <p className="text-sm font-semibold text-rose-600">{message.text}</p>}
      {message.kind === "success" && <p className="text-sm font-semibold text-emerald-600">{message.text}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleExport("csv")}
          className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          Export CSV
        </button>
        <button
          onClick={() => handleExport("xlsx")}
          className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          Export Excel
        </button>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700">Import CSV</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const formData = new FormData();
              formData.append("file", file);
              setMessage({ kind: "idle" });
              fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1"}/students/upload-csv`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("sms_access_token") || ""}`,
                },
                body: formData,
              })
                .then(async (res) => {
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err?.message || "Import failed");
                  }
                  setMessage({ kind: "success", text: "CSV imported" });
                  fetchStudents();
                  fetchSummary();
                })
                .catch((err) => setMessage({ kind: "error", text: err.message }));
            }}
            className="text-xs"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-card">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={fetchStudents}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                fetchStudents();
              }
            }}
            placeholder="Search students..."
            className="w-48 text-sm outline-none"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(Number(e.target.value));
            setTimeout(fetchStudents, 0);
          }}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-card"
        >
          <option value={0}>All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setTimeout(fetchStudents, 0);
          }}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-card"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
        </select>
      </div>

      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setShowDrawer(false)}>
          <div
            className="h-full w-full max-w-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">{editingId ? "Edit Student" : "Add Student"}</p>
                <p className="text-sm text-slate-500">Fill the student registration fields.</p>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="rounded-full px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100%-64px)] overflow-y-auto px-5 py-4">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <LabeledInput
                    label="First Name *"
                    value={form.firstName}
                    onChange={(v) => handleChange("firstName", v)}
                    placeholder="Jane"
                    required
                  />
                  <LabeledInput
                    label="Last Name *"
                    value={form.lastName}
                    onChange={(v) => handleChange("lastName", v)}
                    placeholder="Doe"
                    required
                  />
                  <LabeledInput
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => handleChange("email", v)}
                    placeholder="jane.doe@example.com"
                  />
                  <SelectField
                    label="Gender *"
                    value={form.gender}
                    options={["Male", "Female", "Other"]}
                    onChange={(v) => handleChange("gender", v as StudentForm["gender"])}
                  />
                  <LabeledInput label="Date of Birth" type="date" value={form.dob} onChange={(v) => handleChange("dob", v)} />
                  <SelectField
                    label="Status"
                    value={form.status}
                    options={["Active", "Inactive", "Graduated"]}
                    onChange={(v) => handleChange("status", v as StudentForm["status"])}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Class *
                    <select
                      value={form.classId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          classId: Number(e.target.value),
                          sectionId: 0,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      required
                    >
                      <option value={0}>Select class</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Section
                    <select
                      value={form.sectionId}
                      onChange={(e) => setForm((prev) => ({ ...prev, sectionId: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      disabled={!form.classId || (selectedClass?.sections?.length ?? 0) === 0}
                    >
                      <option value={0}>Select section</option>
                      {(selectedClass?.sections || []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <LabeledInput
                    label="Guardian Name"
                    value={form.guardianName}
                    onChange={(v) => handleChange("guardianName", v)}
                    placeholder="Parent/Guardian"
                  />
                  <LabeledInput
                    label="Guardian Phone"
                    value={form.guardianPhone}
                    onChange={(v) => handleChange("guardianPhone", v)}
                    placeholder="+1 555 123 4567"
                  />
                  <LabeledInput
                    label="Guardian Email"
                    type="email"
                    value={form.guardianEmail}
                    onChange={(v) => handleChange("guardianEmail", v)}
                    placeholder="parent@example.com"
                  />
                  <LabeledInput
                    label="Guardian Address"
                    value={form.guardianAddress}
                    onChange={(v) => handleChange("guardianAddress", v)}
                    placeholder="Street, City"
                  />
                  <LabeledInput
                    label="Student Address"
                    value={form.address}
                    onChange={(v) => handleChange("address", v)}
                    placeholder="Street, City"
                  />
                </div>

                <LabeledTextarea
                  label="Notes"
                  value={form.notes}
                  onChange={(v) => handleChange("notes", v)}
                  placeholder="Additional info, documents, medical notes..."
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      handleReset();
                      setShowDrawer(false);
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700 disabled:opacity-60",
                    )}
                  >
                    {loading ? "Please wait..." : (
                      <>
                        <Plus className="h-4 w-4" /> {editingId ? "Update Student" : "Add Student"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Student", "ID", "Status", "Actions"].map((label) => (
                <th
                  key={label}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  <div className="flex flex-col">
                    <span>
                      {s.firstName} {s.lastName}
                    </span>
                    <span className="text-xs text-slate-500">{s.gender || "-"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{s.studentCode || "-"}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-semibold",
                      s.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : s.status === "graduated"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {s.status || "-"}
                  </span>
                </td>
                <td className="relative px-4 py-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                    className="rounded-full px-2 py-1 text-slate-600 hover:bg-slate-100"
                  >
                    ...
                  </button>
                  {openMenuId === s.id && (
                    <div className="absolute right-4 z-10 mt-2 w-40 rounded-xl border border-slate-200 bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDrawer(true);
                          setEditingId(s.id);
                          const enrollment = s.enrollments?.[0];
                          setForm({
                            firstName: s.firstName || "",
                            lastName: s.lastName || "",
                            email: "",
                            gender: (s.gender as "Male" | "Female" | "Other") || "Male",
                            dob: s.dob ? s.dob.split("T")[0] : "",
                            status:
                              (s.status === "graduated"
                                ? "Graduated"
                                : s.status === "inactive"
                                  ? "Inactive"
                                  : "Active") as "Active" | "Inactive" | "Graduated",
                            classId: enrollment?.classId || enrollment?.class?.id || 0,
                            sectionId: enrollment?.sectionId || enrollment?.section?.id || 0,
                            guardianName: s.guardians?.[0]?.guardian?.name || "",
                            guardianPhone: s.guardians?.[0]?.guardian?.phone || "",
                            guardianEmail: s.guardians?.[0]?.guardian?.email || "",
                            guardianAddress: s.guardians?.[0]?.guardian?.address || "",
                            address: s.address || "",
                            notes: "",
                          });
                          setOpenMenuId(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          alert("Attendance view is coming soon.");
                        }}
                        className="block w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View Attendance
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          alert("Grades view is coming soon.");
                        }}
                        className="block w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View Grades
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          handleDelete(s.id);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-sm text-slate-500" colSpan={4}>
                  No students yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LabeledInput = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
    <span>{label}</span>
    <input
      required={required}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
    />
  </label>
);

const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
    <span>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </label>
);

const LabeledTextarea = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
    <span>{label}</span>
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
    />
  </label>
);

const AuthPage = () => {
  const roles = [
    "Super Admin",
    "School Admin",
    "Academic Officer",
    "Finance Officer",
    "HR Officer",
    "Teacher",
    "Student",
    "Parent/Guardian",
    "Librarian",
    "Accountant",
  ];

  const [mode, setMode] = useState<"login" | "register">("login");
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: roles[0],
  });
  const [status, setStatus] = useState<{ kind: "idle" | "error" | "success"; message?: string }>({
    kind: "idle",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ kind: "idle" });
    const action = mode === "login" ? "/auth/login" : "/auth/register";
    const payload =
      mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: form.role };

    apiPost<typeof payload, { accessToken: string; refreshToken?: string; user?: unknown }>(action, payload)
      .then((resp) => {
        setStatus({ kind: "success", message: "Success! Tokens received. You can now navigate to the dashboard." });
        if (resp.accessToken) {
          localStorage.setItem("sms_access_token", resp.accessToken);
        }
        if (resp.refreshToken) {
          localStorage.setItem("sms_refresh_token", resp.refreshToken);
        }
        navigate("/dashboard");
      })
      .catch((err: Error & { issues?: string[] }) => {
        const detail = err.issues?.join("; ");
        setStatus({ kind: "error", message: detail ? `${err.message}: ${detail}` : err.message });
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="w-full max-w-3xl rounded-3xl bg-white/90 p-8 shadow-card">
      <div className="flex flex-col gap-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">School Management Login</h1>
        <p className="text-sm text-slate-500">
          Sign in or create an account. Super Admins can invite other roles.
        </p>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        <button
          onClick={() => setMode("login")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold",
            mode === "login" ? "bg-brand-600 text-white shadow-card" : "bg-slate-100 text-slate-600",
          )}
        >
          Login
        </button>
        <button
          onClick={() => setMode("register")}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold",
            mode === "register" ? "bg-brand-600 text-white shadow-card" : "bg-slate-100 text-slate-600",
          )}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {mode === "register" && (
          <LabeledInput label="Full Name" value={form.name} onChange={(v) => handleChange("name", v)} required />
        )}
        <LabeledInput
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => handleChange("email", v)}
          required
        />
        <LabeledInput
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => handleChange("password", v)}
          required
        />
        {mode === "register" && (
          <SelectField label="Role" value={form.role} options={roles} onChange={(v) => handleChange("role", v)} />
        )}
        <div className="md:col-span-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-card hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70",
            )}
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
          {status.kind === "error" && (
            <p className="text-sm font-semibold text-rose-600" role="alert">
              {status.message}
            </p>
          )}
          {status.kind === "success" && (
            <p className="text-sm font-semibold text-emerald-600" role="status">
              {status.message}
            </p>
          )}
          <p className="text-xs text-slate-500">
            Default roles: Super Admin, School Admin, Academic Officer, Finance Officer, HR Officer, Teacher, Student,
            Parent/Guardian, Librarian, Accountant.
          </p>
        </div>
      </form>
    </div>
  );
};

const FinancePage = () => {
  const [invoiceForm, setInvoiceForm] = useState({ studentId: "", total: "", dueDate: "" });
  const [paymentForm, setPaymentForm] = useState({ invoiceId: "", amount: "", method: "CASH", reference: "" });
  const [summary, setSummary] = useState<{
    finance: {
      totalBilled: number;
      collected: number;
      pending: number;
      paidCount: number;
      partialCount: number;
      overdueCount: number;
    };
  }>({
    finance: {
      totalBilled: 0,
      collected: 0,
      pending: 0,
      paidCount: 0,
      partialCount: 0,
      overdueCount: 0,
    },
  });

  useEffect(() => {
    apiGetAuth<typeof summary>("/dashboard/summary")
      .then((res) => setSummary(res))
      .catch(() => {});
  }, []);

  const createInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    apiPostAuth("/finance/invoices", {
      studentId: Number(invoiceForm.studentId),
      total: Number(invoiceForm.total),
      dueDate: invoiceForm.dueDate || undefined,
    })
      .then(() => {
        setInvoiceForm({ studentId: "", total: "", dueDate: "" });
        apiGetAuth<typeof summary>("/dashboard/summary").then((res) => setSummary(res));
      })
      .catch((err) => alert(err.message));
  };

  const createPayment = (e: React.FormEvent) => {
    e.preventDefault();
    apiPostAuth("/finance/payments", {
      invoiceId: Number(paymentForm.invoiceId),
      amount: Number(paymentForm.amount),
      method: paymentForm.method,
      reference: paymentForm.reference || undefined,
    })
      .then(() => {
        setPaymentForm({ invoiceId: "", amount: "", method: "CASH", reference: "" });
        apiGetAuth<typeof summary>("/dashboard/summary").then((res) => setSummary(res));
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Finance</p>
          <p className="text-sm text-slate-500">Manage fees, invoices and payments</p>
        </div>
      </div>
      <FeeCollection
        totalBilled={summary.finance.totalBilled}
        collected={summary.finance.collected}
        pending={summary.finance.pending}
        paidCount={summary.finance.paidCount}
        partialCount={summary.finance.partialCount}
        overdueCount={summary.finance.overdueCount}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form onSubmit={createInvoice} className="rounded-2xl bg-white p-4 shadow-card space-y-3">
          <p className="text-sm font-semibold text-slate-900">Create Invoice</p>
          <LabeledInput label="Student ID" value={invoiceForm.studentId} onChange={(v) => setInvoiceForm((p) => ({ ...p, studentId: v }))} required />
          <LabeledInput label="Total Amount" type="number" value={invoiceForm.total} onChange={(v) => setInvoiceForm((p) => ({ ...p, total: v }))} required />
          <LabeledInput label="Due Date" type="date" value={invoiceForm.dueDate} onChange={(v) => setInvoiceForm((p) => ({ ...p, dueDate: v }))} />
          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700">
              <Plus className="h-4 w-4" /> Save Invoice
            </button>
          </div>
        </form>

        <form onSubmit={createPayment} className="rounded-2xl bg-white p-4 shadow-card space-y-3">
          <p className="text-sm font-semibold text-slate-900">Record Payment</p>
          <LabeledInput label="Invoice ID" value={paymentForm.invoiceId} onChange={(v) => setPaymentForm((p) => ({ ...p, invoiceId: v }))} required />
          <LabeledInput label="Amount" type="number" value={paymentForm.amount} onChange={(v) => setPaymentForm((p) => ({ ...p, amount: v }))} required />
          <label className="text-sm font-medium text-slate-700">
            Method
            <select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {["CASH", "BANK", "MOBILE"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <LabeledInput label="Reference" value={paymentForm.reference} onChange={(v) => setPaymentForm((p) => ({ ...p, reference: v }))} />
          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-emerald-700">
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SubjectsPage = () => {
  type SubjectItem = { id: number; name: string; code: string; department?: string };
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [form, setForm] = useState({ name: "", code: "", department: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: "idle" | "error" | "success"; text?: string }>({ kind: "idle" });

  const load = () => {
    apiGetAuth<{ data: SubjectItem[] }>("/subjects")
      .then((res) => setSubjects(res.data))
      .catch(() => setMessage({ kind: "error", text: "Failed to load subjects" }));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ kind: "idle" });
    const payload = { ...form };
    const request = editingId ? apiPutAuth(`/subjects/${editingId}`, payload) : apiPostAuth("/subjects", payload);
    request
      .then(() => {
        setMessage({ kind: "success", text: editingId ? "Subject updated" : "Subject created" });
        setForm({ name: "", code: "", department: "" });
        setEditingId(null);
        load();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  const handleDelete = (id: number) => {
    apiDeleteAuth(`/subjects/${id}`)
      .then(() => {
        setMessage({ kind: "success", text: "Subject deleted" });
        load();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Subjects</p>
          <p className="text-sm text-slate-500">Create and manage academic subjects.</p>
        </div>
      </div>

      {message.kind === "error" && <p className="text-sm font-semibold text-rose-600">{message.text}</p>}
      {message.kind === "success" && <p className="text-sm font-semibold text-emerald-600">{message.text}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-5 shadow-card md:grid-cols-3">
        <LabeledInput label="Subject Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} required />
        <LabeledInput label="Code" value={form.code} onChange={(v) => setForm((p) => ({ ...p, code: v }))} required />
        <LabeledInput label="Department" value={form.department} onChange={(v) => setForm((p) => ({ ...p, department: v }))} />
        <div className="md:col-span-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", code: "", department: "" });
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
          >
            {editingId ? "Update Subject" : "Add Subject"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Name", "Code", "Department", "Actions"].map((label) => (
                <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{s.code}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{s.department || "-"}</td>
                <td className="px-4 py-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(s.id);
                      setForm({ name: s.name, code: s.code, department: s.department || "" });
                    }}
                    className="mr-3 text-brand-600 hover:text-brand-700"
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(s.id)} className="text-rose-600 hover:text-rose-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-sm text-slate-500" colSpan={4}>
                  No subjects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TimetablePage = () => {
  type SubjectOption = { id: number; name: string };
  type StaffOption = { id: number; name: string; roles?: string[] };
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(0);
  const [timetable, setTimetable] = useState<any | null>(null);
  const [form, setForm] = useState({ dayOfWeek: 1, period: 1, subjectId: 0, teacherId: 0 });
  const [message, setMessage] = useState<{ kind: "idle" | "error" | "success"; text?: string }>({ kind: "idle" });

  const days = [
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
  ];

  const periods = [1, 2, 3, 4, 5, 6, 7];

  const loadTimetable = () => {
    if (!selectedClassId) return;
    apiGetAuth<{ data: any }>(`/timetable?classId=${selectedClassId}`)
      .then((res) => setTimetable(res.data))
      .catch(() => setMessage({ kind: "error", text: "Failed to load timetable" }));
  };

  useEffect(() => {
    apiGetAuth<{ data: ClassOption[] }>("/classes").then((res) => setClasses(res.data));
    apiGetAuth<{ data: SubjectOption[] }>("/subjects").then((res) => setSubjects(res.data));
    apiGetAuth<{ data: StaffOption[] }>("/staff").then((res) => setStaff(res.data));
  }, []);

  useEffect(() => {
    if (!selectedClassId && classes.length) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (!form.subjectId && subjects.length) {
      setForm((p) => ({ ...p, subjectId: subjects[0].id }));
    }
  }, [subjects, form.subjectId]);

  useEffect(() => {
    loadTimetable();
  }, [selectedClassId]);

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !form.subjectId) {
      setMessage({ kind: "error", text: "Class and subject are required" });
      return;
    }
    setMessage({ kind: "idle" });
    apiPostAuth("/timetable/slots", {
      classId: selectedClassId,
      dayOfWeek: form.dayOfWeek,
      period: form.period,
      subjectId: form.subjectId,
      teacherId: form.teacherId || undefined,
    })
      .then(() => {
        setMessage({ kind: "success", text: "Slot added" });
        loadTimetable();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  const slots = timetable?.slots || [];
  const slotMap = new Map<string, any>();
  slots.forEach((slot: any) => {
    slotMap.set(`${slot.dayOfWeek}-${slot.period}`, slot);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Timetable</p>
          <p className="text-sm text-slate-500">Build class schedules and avoid conflicts.</p>
        </div>
      </div>

      {message.kind === "error" && <p className="text-sm font-semibold text-rose-600">{message.text}</p>}
      {message.kind === "success" && <p className="text-sm font-semibold text-emerald-600">{message.text}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <form onSubmit={handleAddSlot} className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-slate-900">Add Timetable Slot</p>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <label className="text-sm font-medium text-slate-700">
              Class
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                required
              >
                <option value={0}>Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Day
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm((p) => ({ ...p, dayOfWeek: Number(e.target.value) }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {days.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Period
              <select
                value={form.period}
                onChange={(e) => setForm((p) => ({ ...p, period: Number(e.target.value) }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {periods.map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Subject
              <select
                value={form.subjectId}
                onChange={(e) => setForm((p) => ({ ...p, subjectId: Number(e.target.value) }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                required
              >
                <option value={0}>Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Teacher (optional)
              <select
                value={form.teacherId}
                onChange={(e) => setForm((p) => ({ ...p, teacherId: Number(e.target.value) }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value={0}>Unassigned</option>
                {staff.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" /> Add Slot
              </button>
            </div>
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl bg-white shadow-card">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Period</th>
                {days.map((d) => (
                  <th key={d.value} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periods.map((p) => (
                <tr key={p}>
                  <td className="px-4 py-3 font-semibold text-slate-600">Period {p}</td>
                  {days.map((d) => {
                    const slot = slotMap.get(`${d.value}-${p}`);
                    return (
                      <td key={d.value} className="px-4 py-3 text-slate-700">
                        {slot ? (
                          <div className="rounded-lg bg-slate-50 p-2">
                            <p className="font-semibold text-slate-900">{slot.subject?.name || "Subject"}</p>
                            <p className="text-xs text-slate-500">{slot.teacher?.user?.name || "Unassigned"}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AttendancePage = () => {
  const [tab, setTab] = useState<"mark" | "reports">("mark");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(0);
  const [selectedSectionId, setSelectedSectionId] = useState(0);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<{ studentId: number; status: string }[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: "idle" | "error" | "success"; text?: string }>({ kind: "idle" });
  const [reportRange, setReportRange] = useState({ from: "", to: "" });
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    apiGetAuth<{ data: ClassOption[] }>("/classes")
      .then((res) => setClasses(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClassId && classes.length) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    setSessionId(null);
    setStudents([]);
    setRecords([]);
  }, [date, selectedClassId, selectedSectionId]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const loadStudents = async () => {
    if (!selectedClassId) return;
    const res = await apiGetAuth<{ data: any[] }>(`/students?classId=${selectedClassId}&pageSize=200`);
    let data = res.data;
    if (selectedSectionId) {
      data = data.filter((s) => s.enrollments?.some((e: any) => e.sectionId === selectedSectionId));
    }
    setStudents(data);
    setRecords(data.map((s) => ({ studentId: s.id, status: "PRESENT" })));
  };

  const startSession = async () => {
    if (!selectedClassId) {
      setMessage({ kind: "error", text: "Class is required" });
      return;
    }
    setMessage({ kind: "idle" });
    try {
      const res = await apiPostAuth<
        { date: string; classId: number; sectionId?: number },
        { data: { id: number } }
      >("/attendance/sessions", {
        date,
        classId: selectedClassId,
        sectionId: selectedSectionId || undefined,
      });
      setSessionId(res.data.id);
      await loadStudents();
    } catch (err: any) {
      setMessage({ kind: "error", text: err.message });
    }
  };

  const updateStatus = (studentId: number, status: string) => {
    setRecords((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
  };

  const markAll = (status: string) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const saveAttendance = async () => {
    if (!sessionId) {
      setMessage({ kind: "error", text: "Start a session first" });
      return;
    }
    setMessage({ kind: "idle" });
    try {
      await apiPostAuth(`/attendance/sessions/${sessionId}/records`, { records });
      setMessage({ kind: "success", text: "Attendance saved" });
    } catch (err: any) {
      setMessage({ kind: "error", text: err.message });
    }
  };

  const loadReport = async () => {
    if (!selectedClassId) {
      setMessage({ kind: "error", text: "Select a class to view reports" });
      return;
    }
    const params = new URLSearchParams();
    params.append("classId", String(selectedClassId));
    if (reportRange.from) params.append("from", reportRange.from);
    if (reportRange.to) params.append("to", reportRange.to);
    const res = await apiGetAuth<{ data: any[] }>(`/attendance/reports?${params.toString()}`);
    setReportData(res.data);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Attendance</p>
          <p className="text-sm text-slate-500">Mark and track daily attendance.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(["mark", "reports"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              tab === t ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600",
            )}
          >
            {t === "mark" ? "Mark Attendance" : "Reports"}
          </button>
        ))}
      </div>

      {message.kind === "error" && <p className="text-sm font-semibold text-rose-600">{message.text}</p>}
      {message.kind === "success" && <p className="text-sm font-semibold text-emerald-600">{message.text}</p>}

      {tab === "mark" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-card md:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Class
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(Number(e.target.value));
                  setSelectedSectionId(0);
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value={0}>Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Section
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                disabled={!selectedClassId || (selectedClass?.sections?.length ?? 0) === 0}
              >
                <option value={0}>All Sections</option>
                {(selectedClass?.sections || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={startSession}
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" /> Load Students
              </button>
            </div>
          </div>

          {students.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markAll("PRESENT")}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => markAll("ABSENT")}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                onClick={saveAttendance}
                className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
              >
                Save Attendance
              </button>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl bg-white shadow-card">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Student", "Status"].map((label) => (
                    <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={records.find((r) => r.studentId === s.id)?.status || "PRESENT"}
                        onChange={(e) => updateStatus(s.id, e.target.value)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700"
                      >
                        {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-500" colSpan={2}>
                      No students loaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-card md:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">
              Class
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value={0}>Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              From
              <input
                type="date"
                value={reportRange.from}
                onChange={(e) => setReportRange((p) => ({ ...p, from: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              To
              <input
                type="date"
                value={reportRange.to}
                onChange={(e) => setReportRange((p) => ({ ...p, to: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={loadReport}
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
              >
                View Report
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-card">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Date", "Present", "Total", "Percent"].map((label) => (
                    <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((r) => (
                  <tr key={r.sessionId}>
                    <td className="px-4 py-3 text-sm text-slate-700">{new Date(r.date).toISOString().split("T")[0]}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{r.present}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{r.total}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{r.percent}%</td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-500" colSpan={4}>
                      No report data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const ExamsPage = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [examForm, setExamForm] = useState({ name: "", date: "", status: "SCHEDULED" });
  const [subjectForm, setSubjectForm] = useState({
    examId: 0,
    classId: 0,
    subjectId: 0,
    maxMarks: 100,
    passMarks: 40,
  });
  const [message, setMessage] = useState<{ kind: "idle" | "error" | "success"; text?: string }>({ kind: "idle" });

  const load = () => {
    apiGetAuth<{ data: any[] }>("/exams")
      .then((res) => setExams(res.data))
      .catch(() => setMessage({ kind: "error", text: "Failed to load exams" }));
  };

  useEffect(() => {
    load();
    apiGetAuth<{ data: ClassOption[] }>("/classes").then((res) => setClasses(res.data));
    apiGetAuth<{ data: { id: number; name: string }[] }>("/subjects").then((res) => setSubjects(res.data));
  }, []);

  const createExam = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ kind: "idle" });
    apiPostAuth("/exams", examForm)
      .then(() => {
        setMessage({ kind: "success", text: "Exam created" });
        setExamForm({ name: "", date: "", status: "SCHEDULED" });
        load();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  const addExamSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.examId || !subjectForm.classId || !subjectForm.subjectId) {
      setMessage({ kind: "error", text: "Exam, class, and subject are required" });
      return;
    }
    apiPostAuth(`/exams/${subjectForm.examId}/subjects`, subjectForm)
      .then(() => {
        setMessage({ kind: "success", text: "Exam subject added" });
        setSubjectForm({ examId: 0, classId: 0, subjectId: 0, maxMarks: 100, passMarks: 40 });
        load();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Exams</p>
          <p className="text-sm text-slate-500">Create exams and manage subjects.</p>
        </div>
      </div>

      {message.kind === "error" && <p className="text-sm font-semibold text-rose-600">{message.text}</p>}
      {message.kind === "success" && <p className="text-sm font-semibold text-emerald-600">{message.text}</p>}

      <form onSubmit={createExam} className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-card md:grid-cols-4">
        <LabeledInput label="Exam Name" value={examForm.name} onChange={(v) => setExamForm((p) => ({ ...p, name: v }))} required />
        <LabeledInput label="Date" type="date" value={examForm.date} onChange={(v) => setExamForm((p) => ({ ...p, date: v }))} />
        <SelectField
          label="Status"
          value={examForm.status}
          options={["SCHEDULED", "COMPLETED", "PUBLISHED"]}
          onChange={(v) => setExamForm((p) => ({ ...p, status: v }))}
        />
        <div className="flex items-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Create Exam
          </button>
        </div>
      </form>

      <form onSubmit={addExamSubject} className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-card md:grid-cols-5">
        <label className="text-sm font-medium text-slate-700">
          Exam
          <select
            value={subjectForm.examId}
            onChange={(e) => setSubjectForm((p) => ({ ...p, examId: Number(e.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value={0}>Select exam</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Class
          <select
            value={subjectForm.classId}
            onChange={(e) => setSubjectForm((p) => ({ ...p, classId: Number(e.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value={0}>Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Subject
          <select
            value={subjectForm.subjectId}
            onChange={(e) => setSubjectForm((p) => ({ ...p, subjectId: Number(e.target.value) }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value={0}>Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <LabeledInput
          label="Max Marks"
          value={String(subjectForm.maxMarks)}
          onChange={(v) => setSubjectForm((p) => ({ ...p, maxMarks: Number(v) }))}
        />
        <LabeledInput
          label="Pass Marks"
          value={String(subjectForm.passMarks)}
          onChange={(v) => setSubjectForm((p) => ({ ...p, passMarks: Number(v) }))}
        />
        <div className="md:col-span-5 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
          >
            Add Exam Subject
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Name", "Term", "Status", "Subjects"].map((label) => (
                <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exams.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{e.name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {e.term?.name ? `${e.term.name} ${e.term.academicYear?.name || ""}`.trim() : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{e.status}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{e.subjects?.length || 0}</td>
              </tr>
            ))}
            {exams.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-sm text-slate-500" colSpan={4}>
                  No exams yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// (Removed unused PlaceholderPage component)

const AnnouncementsPage = () => {
  type Announcement = { id: number; title: string; content: string; audienceType?: string; createdAt?: string; createdBy?: { name: string } };
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState({ title: "", content: "", audienceType: "All" });
  const [message, setMessage] = useState<{ kind: "idle" | "error" | "success"; text?: string }>({ kind: "idle" });

  const load = () => {
    apiGetAuth<{ data: Announcement[] }>("/announcements")
      .then((res) => setAnnouncements(res.data))
      .catch(() => setMessage({ kind: "error", text: "Failed to load announcements" }));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ kind: "idle" });
    apiPostAuth("/announcements", form)
      .then(() => {
        setMessage({ kind: "success", text: "Announcement posted" });
        setForm({ title: "", content: "", audienceType: "All" });
        load();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  const handleDelete = (id: number) => {
    apiDeleteAuth(`/announcements/${id}`)
      .then(() => {
        setMessage({ kind: "success", text: "Announcement deleted" });
        load();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Announcements</p>
          <p className="text-sm text-slate-500">Create and manage school-wide announcements.</p>
        </div>
      </div>

      {message.kind === "error" && <p className="text-sm font-semibold text-rose-600">{message.text}</p>}
      {message.kind === "success" && <p className="text-sm font-semibold text-emerald-600">{message.text}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-5 shadow-card">
        <LabeledInput label="Title" value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} required />
        <label className="text-sm font-medium text-slate-700">
          Content
          <textarea
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            rows={3}
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Audience
          <select
            value={form.audienceType}
            onChange={(e) => setForm((p) => ({ ...p, audienceType: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {["All", "Students", "Staff", "Parents"].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
          >
            <Megaphone className="h-4 w-4" /> Post Announcement
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-500">
                  {a.audienceType || "All"} • {a.createdBy?.name || "Unknown"}{" "}
                  {a.createdAt ? `• ${new Date(a.createdAt).toLocaleString()}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Delete
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{a.content}</p>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-card">No announcements yet.</div>
        )}
      </div>
    </div>
  );
};

const StaffPage = () => {
  type StaffForm = {
    name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    joinDate: string;
    role: string;
  };

  const [staff, setStaff] = useState<any[]>([]);
  const [form, setForm] = useState<StaffForm>({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    joinDate: "",
    role: "Teacher",
  });
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: "idle" | "error" | "success"; text?: string }>({ kind: "idle" });

  const fetchStaff = () => {
    apiGetAuth<{ data: any[] }>("/staff")
      .then((res) => setStaff(res.data))
      .catch(() => setMessage({ kind: "error", text: "Failed to load staff" }));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ kind: "idle" });
    const payload = { ...form };
    const request = editingId ? apiPutAuth(`/staff/${editingId}`, payload) : apiPostAuth("/staff", payload);
    request
      .then(() => {
        setMessage({ kind: "success", text: editingId ? "Staff updated" : "Staff created" });
        setForm({ name: "", email: "", phone: "", department: "", position: "", joinDate: "", role: "Teacher" });
        setEditingId(null);
        setOpen(false);
        fetchStaff();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  const handleDelete = (id: number) => {
    apiDeleteAuth(`/staff/${id}`)
      .then(() => {
        setMessage({ kind: "success", text: "Staff deleted" });
        fetchStaff();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Staff</p>
          <p className="text-sm text-slate-500">Manage staff profiles and assignments.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ name: "", email: "", phone: "", department: "", position: "", joinDate: "", role: "Teacher" });
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
        >
          <Briefcase className="h-4 w-4" /> Add Staff
        </button>
      </div>

      {message.kind === "error" && <p className="text-sm font-semibold text-rose-600">{message.text}</p>}
      {message.kind === "success" && <p className="text-sm font-semibold text-emerald-600">{message.text}</p>}

      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Name", "Email", "Staff Code", "Department", "Position", "Join Date", "Roles", "Actions"].map((label) => (
                <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{s.email}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{s.staffCode}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{s.department || "-"}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{s.position || "-"}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {s.joinDate ? new Date(s.joinDate).toISOString().split("T")[0] : "-"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">{(s.roles || []).join(", ") || "-"}</td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => {
                      setEditingId(s.id);
                      setForm({
                        name: s.name || "",
                        email: s.email || "",
                        phone: s.phone || "",
                        department: s.department || "",
                        position: s.position || "",
                        joinDate: s.joinDate ? new Date(s.joinDate).toISOString().split("T")[0] : "",
                        role: s.roles?.[0] || "Teacher",
                      });
                      setOpen(true);
                    }}
                    className="text-brand-600 hover:text-brand-700 mr-3"
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-rose-600 hover:text-rose-700"
                    type="button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-sm text-slate-500" colSpan={8}>
                  No staff yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setOpen(false)}>
          <div className="h-full w-full max-w-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">{editingId ? "Edit Staff" : "Add Staff"}</p>
                <p className="text-sm text-slate-500">Fill the staff details.</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100%-64px)] overflow-y-auto px-5 py-4">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                <LabeledInput label="Full Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} required />
                <LabeledInput label="Email" type="email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} required />
                <LabeledInput label="Phone" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
                <LabeledInput label="Department" value={form.department} onChange={(v) => setForm((p) => ({ ...p, department: v }))} />
                <LabeledInput label="Position" value={form.position} onChange={(v) => setForm((p) => ({ ...p, position: v }))} />
                <LabeledInput label="Join Date" type="date" value={form.joinDate} onChange={(v) => setForm((p) => ({ ...p, joinDate: v }))} />
                <SelectField
                  label="Role"
                  value={form.role}
                  options={["Teacher", "HR Officer", "Finance Officer", "School Admin", "Super Admin", "Academic Officer"]}
                  onChange={(v) => setForm((p) => ({ ...p, role: v }))}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
                  >
                    {editingId ? "Update Staff" : "Add Staff"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UsersPage = () => {
  const roles = [
    "Super Admin",
    "School Admin",
    "Academic Officer",
    "Finance Officer",
    "HR Officer",
    "Teacher",
    "Student",
    "Parent/Guardian",
    "Librarian",
    "Accountant",
  ];

  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: roles[1] });
  const [message, setMessage] = useState<{ kind: "idle" | "error" | "success"; text?: string }>({ kind: "idle" });

  const fetchUsers = () => {
    apiGetAuth<{ data: any[] }>("/users")
      .then((res) => setUsers(res.data))
      .catch(() => setMessage({ kind: "error", text: "Failed to load users" }));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ kind: "idle" });
    apiPostAuth("/users", form)
      .then(() => {
        setMessage({ kind: "success", text: "User created" });
        setForm({ name: "", email: "", password: "", role: roles[1] });
        fetchUsers();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">User Management</p>
          <p className="text-sm text-slate-500">Super Admins can manage all users and roles.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-5 shadow-card md:grid-cols-2">
        <LabeledInput label="Full Name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} required />
        <LabeledInput label="Email" type="email" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} required />
        <LabeledInput
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => setForm((p) => ({ ...p, password: v }))}
          required
        />
        <SelectField label="Role" value={form.role} options={roles} onChange={(v) => setForm((p) => ({ ...p, role: v }))} />
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
          >
            <UserPlus className="h-4 w-4" /> Add User
          </button>
        </div>
      </form>

      {message.kind === "error" && <p className="text-sm font-semibold text-rose-600">{message.text}</p>}
      {message.kind === "success" && <p className="text-sm font-semibold text-emerald-600">{message.text}</p>}

      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Name", "Email", "Roles"].map((label) => (
                <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{u.name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{u.email}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{(u.roles || []).join(", ")}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-sm text-slate-500" colSpan={3}>
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const [profile, setProfile] = useState<{ name?: string; email?: string; roles?: string[] }>({});
  useEffect(() => {
    apiGetAuth<{ name: string; email: string; roles: string[] }>("/auth/me")
      .then((res) => setProfile(res))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-semibold text-slate-900">Settings</p>
        <p className="text-sm text-slate-500">Account overview.</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="text-sm font-semibold text-slate-900">Profile</p>
        <p className="text-sm text-slate-700">Name: {profile.name || "-"}</p>
        <p className="text-sm text-slate-700">Email: {profile.email || "-"}</p>
        <p className="text-sm text-slate-700">Roles: {(profile.roles || []).join(", ") || "-"}</p>
      </div>
    </div>
  );
};

const Sidebar = ({ profile, onLogout }: { profile: UserProfile | null; onLogout: () => void }) => {
  const location = useLocation();

  return (
    <aside className="hidden min-h-screen w-72 flex-col gap-6 bg-white/95 px-4 py-6 shadow-card md:flex">
      <div className="flex items-center gap-3 px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-700">EduManage</p>
          <p className="text-xs text-slate-500">School Management</p>
        </div>
      </div>

      <div className="space-y-6">
        {navSections.map((section) => {
          const roles = profile?.roles || [];
          const hasRole = (role: string) => roles.includes(role);
          const canSee = (path: string) => {
            if (hasRole("Super Admin") || hasRole("School Admin")) return true;
            if (hasRole("Teacher")) {
              return ["/dashboard", "/students", "/staff", "/classes", "/timetable", "/attendance", "/exams", "/subjects"].some((p) =>
                path.startsWith(p),
              );
            }
            if (hasRole("Student")) {
              return ["/dashboard", "/students", "/staff", "/classes", "/timetable", "/attendance", "/exams", "/subjects"].some((p) =>
                path.startsWith(p),
              );
            }
            return false;
          };

          const visible = section.items.filter((item) => canSee(item.path));
          if (!visible.length) return null;

          return (
            <div key={section.title} className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{section.title}</p>
              <div className="space-y-1">
                {visible.map((item) => {
                  const active = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                  return (
                    <NavLink
                      key={item.label}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                        active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      <span className={cn("text-brand-600", active ? "text-brand-700" : "text-slate-500")}>{item.icon}</span>
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-3 text-white shadow-card">
        <p className="text-sm font-semibold">{profile?.name || "User"}</p>
        <p className="text-xs text-brand-50/90">{(profile?.roles && profile.roles[0]) || "Role"}</p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white hover:bg-white/30"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

const Topbar = ({ profile, onLogout }: { profile: UserProfile | null; onLogout: () => void }) => (
  <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white/90 px-6 py-4 shadow-sm backdrop-blur">
    <div className="flex flex-1 items-center gap-3">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          className="w-full rounded-full border border-slate-200 bg-slate-50/60 px-4 py-2 pl-10 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:bg-white"
          placeholder="Search students, staff, classes..."
        />
      </div>
      {!(profile?.roles || []).includes("Student") && (
        <button className="hidden items-center gap-2 rounded-full bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-card hover:bg-brand-700 md:inline-flex">
          <Plus className="h-4 w-4" /> Add Student
        </button>
      )}
    </div>
    <div className="flex items-center gap-4">
      <div className="relative">
        <Bell className="h-5 w-5 text-slate-500" />
        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
          3
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
          {(profile?.name || "U").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{profile?.name || "User"}</p>
          <p className="text-xs text-slate-500">{(profile?.roles && profile.roles.join(", ")) || "Role"}</p>
        </div>
        <button
          onClick={onLogout}
          className="ml-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          type="button"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
);

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const logout = () => {
    localStorage.removeItem("sms_access_token");
    localStorage.removeItem("sms_refresh_token");
    fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1"}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("sms_access_token") || ""}`,
      },
    }).finally(() => {
      navigate("/");
    });
  };

  useEffect(() => {
    if (location.pathname !== "/") {
      apiGetAuth<UserProfile>("/auth/me")
        .then((res) => setProfile(res))
        .catch(() => setProfile(null));
    }
  }, [location.pathname]);

  if (location.pathname === "/") {
    return (
      <div className="min-h-screen bg-surface text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">
          <AuthPage />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-slate-900">
      <div className="mx-auto flex max-w-[1400px]">
        <Sidebar profile={profile} onLogout={logout} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar profile={profile} onLogout={logout} />
          <main className="flex-1 px-6 py-6">
            <Routes>
              <Route path="/dashboard" element={<RealDashboardPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/users" element={<UsersPage />} />
              <Route path="/timetable" element={<TimetablePage />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
