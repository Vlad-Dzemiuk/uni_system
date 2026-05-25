"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type FacultyInfo = {
  id: string;
  code: string;
  name: string;
  slug: string;
  deanName: string;
  deanEmail: string;
};

type FacultyMember = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  groupName: string;
  specialty: string;
  birthDate: string;
  badge: string;
  disciplines: string[];
};

type CandidateUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readObjectId(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  if (typeof record.$oid === "string") return record.$oid;
  if (typeof record.id === "string") return record.id;
  if (typeof record._id === "string") return record._id;

  return "";
}

function extractArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.data)) return record.data as T[];
  if (Array.isArray(record.results)) return record.results as T[];

  return [];
}

function mapFaculty(payload: unknown): FacultyInfo {
  const obj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const dean = obj.deanUser && typeof obj.deanUser === "object" ? (obj.deanUser as Record<string, unknown>) : {};

  return {
    id: readObjectId(obj._id),
    code: readString(obj.code, "—"),
    name: readString(obj.name, "—"),
    slug: readString(obj.slug, "—"),
    deanName: readString(dean.fullName, "—"),
    deanEmail: readString(dean.email, "—"),
  };
}

function mapMembers(payload: unknown): FacultyMember[] {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const list = extractArray<Record<string, unknown>>(root.items ?? payload);

  return list.map((item, index) => ({
    id: readObjectId(item._id) || `member-${index + 1}`,
    fullName: readString(item.fullName, "—"),
    email: readString(item.email, "—"),
    role: readString(item.role, "—"),
    groupName: readString(item.groupName, ""),
    specialty: readString(item.specialty, ""),
    birthDate: readString(item.birthDate, ""),
    badge: readString(item.badge, ""),
    disciplines: extractArray<string>(item.disciplines).filter((x) => typeof x === "string"),
  }));
}

function mapCandidates(payload: unknown): CandidateUser[] {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const list = extractArray<Record<string, unknown>>(root.items ?? payload);

  return list.map((item, index) => ({
    id: readObjectId(item._id) || `candidate-${index + 1}`,
    fullName: readString(item.fullName, "—"),
    email: readString(item.email, "—"),
    role: readString(item.role, "—"),
  }));
}

function roleBadge(role: string) {
  if (role === "Student") return "pending" as const;
  if (role === "Teacher") return "default" as const;
  if (role === "Dean") return "approved" as const;
  return "cancelled" as const;
}

function toDisciplineString(values: string[]) {
  return values.join(", ");
}

function toDisciplines(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function FacultyWorkspace() {
  const [faculty, setFaculty] = useState<FacultyInfo | null>(null);

  const [members, setMembers] = useState<FacultyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [candidates, setCandidates] = useState<CandidateUser[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [birthDateFilter, setBirthDateFilter] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [qFilter, setQFilter] = useState("");

  const [candidateRoleFilter, setCandidateRoleFilter] = useState("all");
  const [candidateQuery, setCandidateQuery] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<FacultyMember | null>(null);
  const [editRole, setEditRole] = useState("Student");
  const [editGroup, setEditGroup] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [editDisciplines, setEditDisciplines] = useState("");
  const [savingMember, setSavingMember] = useState(false);

  const membersQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "200");
    if (roleFilter !== "all") params.set("role", roleFilter);
    if (groupFilter.trim()) params.set("groupName", groupFilter.trim());
    if (specialtyFilter.trim()) params.set("specialty", specialtyFilter.trim());
    if (birthDateFilter) params.set("birthDate", birthDateFilter);
    if (disciplineFilter.trim()) params.set("discipline", disciplineFilter.trim());
    if (qFilter.trim()) params.set("q", qFilter.trim());
    return params.toString();
  }, [roleFilter, groupFilter, specialtyFilter, birthDateFilter, disciplineFilter, qFilter]);

  const candidatesQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "200");
    if (candidateRoleFilter !== "all") params.set("role", candidateRoleFilter);
    if (candidateQuery.trim()) params.set("q", candidateQuery.trim());
    return params.toString();
  }, [candidateRoleFilter, candidateQuery]);

  const loadFaculty = async () => {
    const payload = await api<unknown>("/api/admission/faculty/me");
    setFaculty(mapFaculty(payload));
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const payload = await api<unknown>(`/api/admission/faculty/members?${membersQuery}`);
      setMembers(mapMembers(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити користувачів факультету");
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const payload = await api<unknown>(`/api/admission/faculty/candidates?${candidatesQuery}`);
      setCandidates(mapCandidates(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити кандидатів");
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    setError(null);
    void Promise.all([loadFaculty(), loadMembers(), loadCandidates()]);
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [membersQuery]);

  useEffect(() => {
    void loadCandidates();
  }, [candidatesQuery]);

  const attachCandidate = async (candidate: CandidateUser) => {
    setError(null);
    setSuccess(null);

    try {
      await api("/api/admission/faculty/members/attach", {
        method: "POST",
        body: JSON.stringify({ userId: candidate.id }),
      });

      setSuccess(`Користувача ${candidate.fullName} приєднано до факультету`);
      await Promise.all([loadMembers(), loadCandidates()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося приєднати користувача");
    }
  };

  const openEditor = (member: FacultyMember) => {
    setEditing(member);
    setEditRole(member.role === "Teacher" ? "Teacher" : "Student");
    setEditGroup(member.groupName);
    setEditSpecialty(member.specialty);
    setEditBirthDate(member.birthDate ? member.birthDate.slice(0, 10) : "");
    setEditBadge(member.badge);
    setEditDisciplines(toDisciplineString(member.disciplines));
    setEditorOpen(true);
  };

  const saveMember = async () => {
    if (!editing || savingMember) return;

    setError(null);
    setSuccess(null);
    setSavingMember(true);
    try {
      await api(`/api/admission/faculty/members/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          role: editRole,
          groupName: editGroup.trim(),
          specialty: editSpecialty.trim(),
          birthDate: editBirthDate || undefined,
          badge: editBadge.trim(),
          disciplines: toDisciplines(editDisciplines),
        }),
      });

      setSuccess(`Профіль ${editing.fullName} оновлено`);
      setEditorOpen(false);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося оновити профіль користувача");
    } finally {
      setSavingMember(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Мій факультет</CardTitle>
          <CardDescription>Користувачі факультету, фільтри і приєднання нових студентів/викладачів.</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Код</div>
            <div className="text-sm font-semibold">{faculty?.code ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Назва</div>
            <div className="text-sm font-semibold">{faculty?.name ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Декан</div>
            <div className="text-sm font-semibold">{faculty?.deanName ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Email декана</div>
            <div className="text-sm font-semibold">{faculty?.deanEmail ?? "—"}</div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
      ) : null}

      <Card className="fade-in">
        <CardHeader>
          <CardTitle>Користувачі факультету</CardTitle>
          <CardDescription>Фільтр за роллю, групою, дисципліною або пошуком.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-6">
            <div>
              <Label>Роль</Label>
              <div className="mt-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Усі</SelectItem>
                    <SelectItem value="Student">Студент</SelectItem>
                    <SelectItem value="Teacher">Викладач</SelectItem>
                    <SelectItem value="Dean">Декан</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Група</Label>
              <Input className="mt-2" value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} />
            </div>

            <div>
              <Label>Спеціальність</Label>
              <Input className="mt-2" value={specialtyFilter} onChange={(event) => setSpecialtyFilter(event.target.value)} />
            </div>

            <div>
              <Label>Дата народження</Label>
              <Input className="mt-2" type="date" value={birthDateFilter} onChange={(event) => setBirthDateFilter(event.target.value)} />
            </div>

            <div>
              <Label>Дисципліна</Label>
              <Input
                className="mt-2"
                value={disciplineFilter}
                onChange={(event) => setDisciplineFilter(event.target.value)}
              />
            </div>

            <div>
              <Label>Пошук</Label>
              <Input className="mt-2" value={qFilter} onChange={(event) => setQFilter(event.target.value)} />
            </div>
          </div>

          <div className="data-table-shell">
            <Table className="min-w-[1180px]">
              <THead>
              <TR>
                <TH>ПІБ</TH>
                <TH>Роль</TH>
                <TH>Група</TH>
                <TH>Спеціальність</TH>
                <TH>Дата народження</TH>
                <TH>Бейдж</TH>
                <TH>Дисципліни</TH>
                <TH></TH>
                </TR>
              </THead>
              <TBody>
                {loadingMembers ? (
                  <TR>
                    <TD colSpan={8} className="text-center text-muted-foreground">
                      Завантаження користувачів...
                    </TD>
                  </TR>
                ) : null}

                {!loadingMembers
                  ? members.map((member) => (
                      <TR key={member.id}>
                        <TD>
                          <div className="font-medium">{member.fullName}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </TD>
                        <TD>
                          <Badge variant={roleBadge(member.role)}>{member.role}</Badge>
                        </TD>
                        <TD>{member.groupName || "—"}</TD>
                        <TD>{member.specialty || "—"}</TD>
                        <TD>{member.birthDate ? member.birthDate.slice(0, 10) : "—"}</TD>
                        <TD>{member.badge || "—"}</TD>
                        <TD className="max-w-[260px] text-muted-foreground">{member.disciplines.join(", ") || "—"}</TD>
                        <TD>
                          {member.role === "Student" || member.role === "Teacher" ? (
                            <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => openEditor(member)}>
                              Редагувати
                            </Button>
                          ) : null}
                        </TD>
                      </TR>
                    ))
                  : null}

                {!loadingMembers && members.length === 0 ? (
                  <TR>
                    <TD colSpan={8} className="text-center text-muted-foreground">
                      Користувачі не знайдені за поточними фільтрами.
                    </TD>
                  </TR>
                ) : null}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="fade-in">
        <CardHeader>
          <CardTitle>Приєднання користувачів</CardTitle>
          <CardDescription>Доступні користувачі без факультету.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
            <div>
              <Label>Роль</Label>
              <div className="mt-2">
                <Select value={candidateRoleFilter} onValueChange={setCandidateRoleFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Усі</SelectItem>
                    <SelectItem value="Student">Студент</SelectItem>
                    <SelectItem value="Teacher">Викладач</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Пошук</Label>
              <Input
                className="mt-2"
                value={candidateQuery}
                onChange={(event) => setCandidateQuery(event.target.value)}
                placeholder="ПІБ або email"
              />
            </div>
          </div>

          <div className="data-table-shell">
            <Table className="min-w-[760px]">
              <THead>
                <TR>
                  <TH>ПІБ</TH>
                  <TH>Email</TH>
                  <TH>Роль</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {loadingCandidates ? (
                  <TR>
                    <TD colSpan={4} className="text-center text-muted-foreground">
                      Завантаження кандидатів...
                    </TD>
                  </TR>
                ) : null}

                {!loadingCandidates
                  ? candidates.map((candidate) => (
                      <TR key={candidate.id}>
                        <TD className="font-medium">{candidate.fullName}</TD>
                        <TD className="text-muted-foreground">{candidate.email}</TD>
                        <TD>
                          <Badge variant={roleBadge(candidate.role)}>{candidate.role}</Badge>
                        </TD>
                        <TD>
                          <Button
                            size="sm"
                            className="rounded-lg"
                            onClick={() => void attachCandidate(candidate)}
                          >
                            Приєднати
                          </Button>
                        </TD>
                      </TR>
                    ))
                  : null}

                {!loadingCandidates && candidates.length === 0 ? (
                  <TR>
                    <TD colSpan={4} className="text-center text-muted-foreground">
                      Вільні користувачі відсутні.
                    </TD>
                  </TR>
                ) : null}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Редагування профілю</SheetTitle>
            <SheetDescription>{editing ? `${editing.fullName} • ${editing.email}` : "—"}</SheetDescription>
          </SheetHeader>

          {editing ? (
            <div className="space-y-4">
              <div>
                <Label>Роль</Label>
                <div className="mt-2">
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Student">Студент</SelectItem>
                      <SelectItem value="Teacher">Викладач</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Група</Label>
                <Input className="mt-2" value={editGroup} onChange={(event) => setEditGroup(event.target.value)} />
              </div>

              <div>
                <Label>Спеціальність</Label>
                <Input className="mt-2" value={editSpecialty} onChange={(event) => setEditSpecialty(event.target.value)} />
              </div>

              <div>
                <Label>Дата народження</Label>
                <Input className="mt-2" type="date" value={editBirthDate} onChange={(event) => setEditBirthDate(event.target.value)} />
              </div>

              <div>
                <Label>Бейдж</Label>
                <Input className="mt-2" value={editBadge} onChange={(event) => setEditBadge(event.target.value)} />
              </div>

              <div>
                <Label>Дисципліни (через кому)</Label>
                <Input
                  className="mt-2"
                  value={editDisciplines}
                  onChange={(event) => setEditDisciplines(event.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button className="rounded-xl" onClick={() => void saveMember()} disabled={savingMember}>
                  {savingMember ? "Збереження..." : "Зберегти"}
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
