import { useEffect, useState } from "react";
import { apiGetAuth, apiPostAuth } from "../lib/api";
import { Plus } from "lucide-react";

type ClassItem = {
  id: number;
  name: string;
  level?: string;
  branch?: string;
  _count?: { enrollments: number };
  sections?: { id: number; name: string }[];
  classSubjects?: { id: number; subject: { name: string }; teacher?: { user: { name: string } } }[];
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [staff, setStaff] = useState<{ id: number; name: string; roles?: string[] }[]>([]);
  const [form, setForm] = useState({ name: "", level: "", branch: "" });
  const [sectionForm, setSectionForm] = useState({ classId: 0, name: "" });
  const [subjectForm, setSubjectForm] = useState({ classId: 0, subjectId: 0, teacherId: 0 });
  const [message, setMessage] = useState<{ kind: "idle" | "error" | "success"; text?: string }>({ kind: "idle" });

  const load = () => {
    apiGetAuth<{ data: ClassItem[] }>("/classes")
      .then((res) => setClasses(res.data))
      .catch(() => setMessage({ kind: "error", text: "Failed to load classes" }));
  };

  useEffect(() => {
    load();
    apiGetAuth<{ data: { id: number; name: string }[] }>("/subjects")
      .then((res) => setSubjects(res.data))
      .catch(() => {});
    apiGetAuth<{ data: { id: number; name: string; roles?: string[] }[] }>("/staff")
      .then((res) => setStaff(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!subjectForm.classId && classes.length) {
      setSubjectForm((prev) => ({ ...prev, classId: classes[0].id }));
    }
  }, [classes, subjectForm.classId]);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ kind: "idle" });
    apiPostAuth("/classes", form)
      .then(() => {
        setMessage({ kind: "success", text: "Class created" });
        setForm({ name: "", level: "", branch: "" });
        load();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.classId) return;
    setMessage({ kind: "idle" });
    apiPostAuth("/classes/sections", { classId: sectionForm.classId, name: sectionForm.name })
      .then(() => {
        setMessage({ kind: "success", text: "Section added" });
        setSectionForm({ classId: 0, name: "" });
        load();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  const handleAssignSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.classId || !subjectForm.subjectId) {
      setMessage({ kind: "error", text: "Class and subject are required" });
      return;
    }
    setMessage({ kind: "idle" });
    apiPostAuth("/classes/subjects", {
      classId: subjectForm.classId,
      subjectId: subjectForm.subjectId,
      teacherId: subjectForm.teacherId || undefined,
    })
      .then(() => {
        setMessage({ kind: "success", text: "Subject assigned" });
        setSubjectForm({ classId: 0, subjectId: 0, teacherId: 0 });
        load();
      })
      .catch((err) => setMessage({ kind: "error", text: err.message }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Classes & Sections</p>
          <p className="text-sm text-slate-500">Manage classes, sections, and allocations.</p>
        </div>
      </div>

      {message.kind === "error" && <p className="text-sm font-semibold text-rose-600">{message.text}</p>}
      {message.kind === "success" && <p className="text-sm font-semibold text-emerald-600">{message.text}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <form onSubmit={handleCreateClass} className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-slate-900">Create Class</p>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Level
              <input
                value={form.level}
                onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Branch
              <input
                value={form.branch}
                onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" /> Add Class
              </button>
            </div>
          </div>
        </form>

        <form onSubmit={handleAddSection} className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-slate-900">Add Section</p>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <label className="text-sm font-medium text-slate-700">
              Class
              <select
                value={sectionForm.classId}
                onChange={(e) => setSectionForm((p) => ({ ...p, classId: Number(e.target.value) }))}
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
              Section Name
              <input
                value={sectionForm.name}
                onChange={(e) => setSectionForm((p) => ({ ...p, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" /> Add Section
              </button>
            </div>
          </div>
        </form>

        <form onSubmit={handleAssignSubject} className="rounded-2xl bg-white p-4 shadow-card">
          <p className="text-sm font-semibold text-slate-900">Assign Subject</p>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <label className="text-sm font-medium text-slate-700">
              Class
              <select
                value={subjectForm.classId}
                onChange={(e) => setSubjectForm((p) => ({ ...p, classId: Number(e.target.value) }))}
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
              Subject
              <select
                value={subjectForm.subjectId}
                onChange={(e) => setSubjectForm((p) => ({ ...p, subjectId: Number(e.target.value) }))}
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
                value={subjectForm.teacherId}
                onChange={(e) => setSubjectForm((p) => ({ ...p, teacherId: Number(e.target.value) }))}
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
                <Plus className="h-4 w-4" /> Assign Subject
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {["Class", "Level", "Branch", "Students", "Sections", "Subjects"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classes.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{c.level || "-"}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{c.branch || "-"}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{c._count?.enrollments ?? 0}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {(c.sections || []).map((s) => s.name).join(", ") || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {(c.classSubjects || [])
                    .map((cs) => `${cs.subject.name}${cs.teacher ? ` (${cs.teacher.user.name})` : ""}`)
                    .join(", ") || "-"}
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-sm text-slate-500" colSpan={6}>
                  No classes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
