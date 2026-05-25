"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Building2, Pencil, Plus, ShieldPlus, Trash2, Users } from "lucide-react";

type TabKey = "faculties" | "deans" | "users";
type ManageableUserRole = "Student" | "Teacher" | "Dean" | "Admin";
type EditableUserRole = "Student" | "Teacher" | "Admin";

type FacultyItem = {
  id: string;
  code: string;
  name: string;
  slug: string;
  isActive: boolean;
  deanId: string;
  deanName: string;
  deanEmail: string;
};

type UserItem = {
  id: string;
  fullName: string;
  email: string;
  role: ManageableUserRole;
  isActive: boolean;
  facultyId: string;
  facultyName: string;
  facultyCode: string;
  groupName: string;
  specialty: string;
  birthDate: string;
  badge: string;
  disciplines: string[];
};

type FacultyFormState = {
  id: string | null;
  code: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type UserFormState = {
  id: string | null;
  fullName: string;
  email: string;
  password: string;
  role: ManageableUserRole;
  facultyId: string;
  isActive: boolean;
  groupName: string;
  specialty: string;
  birthDate: string;
  badge: string;
  disciplines: string;
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
  if (Array.isArray(record.users)) return record.users as T[];

  return [];
}

function mapFaculties(payload: unknown): FacultyItem[] {
  const list = extractArray<Record<string, unknown>>(payload);

  return list.map((item, index) => {
    const dean =
      item.deanUser && typeof item.deanUser === "object"
        ? (item.deanUser as Record<string, unknown>)
        : {};

    return {
      id: readObjectId(item._id) || `faculty-${index + 1}`,
      code: readString(item.code, "—"),
      name: readString(item.name, "—"),
      slug: readString(item.slug, "—"),
      isActive: item.isActive !== false,
      deanId: readObjectId(dean._id),
      deanName: readString(dean.fullName, "—"),
      deanEmail: readString(dean.email, "—"),
    };
  });
}

function mapUsers(payload: unknown): UserItem[] {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const list = extractArray<Record<string, unknown>>(root.items ?? root.users ?? payload);

  return list.map((item, index) => {
    const faculty =
      item.faculty && typeof item.faculty === "object"
        ? (item.faculty as Record<string, unknown>)
        : {};

    return {
      id: readObjectId(item._id) || `user-${index + 1}`,
      fullName: readString(item.fullName, "—"),
      email: readString(item.email, "—"),
      role: (readString(item.role, "Student") as ManageableUserRole),
      isActive: item.isActive !== false,
      facultyId: readObjectId(item.faculty),
      facultyName: readString(faculty.name),
      facultyCode: readString(faculty.code),
      groupName: readString(item.groupName),
      specialty: readString(item.specialty),
      birthDate: readString(item.birthDate),
      badge: readString(item.badge),
      disciplines: extractArray<string>(item.disciplines).filter((value) => typeof value === "string"),
    };
  });
}

function roleBadge(role: ManageableUserRole) {
  if (role === "Student") return "pending" as const;
  if (role === "Teacher") return "default" as const;
  if (role === "Dean") return "approved" as const;
  return "cancelled" as const;
}

function facultyLabel(faculty: Pick<FacultyItem, "code" | "name">) {
  return `${faculty.code} • ${faculty.name}`;
}

function userFacultyLabel(user: Pick<UserItem, "facultyCode" | "facultyName">) {
  if (!user.facultyName) return "—";
  return user.facultyCode ? `${user.facultyCode} • ${user.facultyName}` : user.facultyName;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50);
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

function emptyFacultyForm(): FacultyFormState {
  return {
    id: null,
    code: "",
    name: "",
    slug: "",
    isActive: true,
  };
}

function emptyUserForm(defaultFacultyId = ""): UserFormState {
  return {
    id: null,
    fullName: "",
    email: "",
    password: "",
    role: "Student",
    facultyId: defaultFacultyId,
    isActive: true,
    groupName: "",
    specialty: "",
    birthDate: "",
    badge: "",
    disciplines: "",
  };
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AdminFacultiesWorkspace() {
  const [tab, setTab] = useState<TabKey>("faculties");

  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [deanCandidates, setDeanCandidates] = useState<UserItem[]>([]);

  const [loadingFaculties, setLoadingFaculties] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDeanCandidates, setLoadingDeanCandidates] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [facultySheetOpen, setFacultySheetOpen] = useState(false);
  const [facultyForm, setFacultyForm] = useState<FacultyFormState>(emptyFacultyForm());
  const [savingFaculty, setSavingFaculty] = useState(false);

  const [userSheetOpen, setUserSheetOpen] = useState(false);
  const [userForm, setUserForm] = useState<UserFormState>(emptyUserForm());
  const [savingUser, setSavingUser] = useState(false);

  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [selectedDeanId, setSelectedDeanId] = useState("");
  const [assigningDean, setAssigningDean] = useState(false);

  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userFacultyFilter, setUserFacultyFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userQuery, setUserQuery] = useState("");

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const usersQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "200");
    if (userRoleFilter !== "all") params.set("role", userRoleFilter);
    if (userFacultyFilter !== "all") params.set("facultyId", userFacultyFilter);
    if (userStatusFilter === "active") params.set("isActive", "true");
    if (userStatusFilter === "inactive") params.set("isActive", "false");
    if (userQuery.trim()) params.set("q", userQuery.trim());
    return params.toString();
  }, [userRoleFilter, userFacultyFilter, userStatusFilter, userQuery]);

  const loadFaculties = useCallback(async () => {
    setLoadingFaculties(true);
    try {
      const payload = await api<unknown>("/api/admission/faculties");
      setFaculties(mapFaculties(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити факультети");
    } finally {
      setLoadingFaculties(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const payload = await api<unknown>(`/api/users?${usersQuery}`);
      setUsers(mapUsers(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити користувачів");
    } finally {
      setLoadingUsers(false);
    }
  }, [usersQuery]);

  const loadDeanCandidates = useCallback(async () => {
    setLoadingDeanCandidates(true);
    try {
      const payload = await api<unknown>("/api/users?role=Teacher&isActive=true&limit=200");
      setDeanCandidates(mapUsers(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити кандидатів у декани");
    } finally {
      setLoadingDeanCandidates(false);
    }
  }, []);

  useEffect(() => {
    void loadFaculties();
  }, [loadFaculties]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadDeanCandidates();
  }, [loadDeanCandidates]);

  useEffect(() => {
    if (faculties.length === 0) {
      setSelectedFacultyId("");
      return;
    }

    if (!selectedFacultyId || !faculties.some((faculty) => faculty.id === selectedFacultyId)) {
      setSelectedFacultyId(faculties[0].id);
    }
  }, [faculties, selectedFacultyId]);

  useEffect(() => {
    if (deanCandidates.length === 0) {
      setSelectedDeanId("");
      return;
    }

    if (!selectedDeanId || !deanCandidates.some((candidate) => candidate.id === selectedDeanId)) {
      setSelectedDeanId(deanCandidates[0].id);
    }
  }, [deanCandidates, selectedDeanId]);

  const canSaveFaculty =
    facultyForm.code.trim().length >= 2 &&
    facultyForm.name.trim().length >= 3 &&
    facultyForm.slug.trim().length >= 2;

  const isEditingDean = userForm.role === "Dean";
  const canSaveUser =
    userForm.fullName.trim().length >= 3 &&
    looksLikeEmail(userForm.email) &&
    (userForm.id !== null || userForm.password.trim().length >= 8);

  const canAssignDean = selectedFacultyId.length > 0 && selectedDeanId.length > 0;

  const openCreateFaculty = () => {
    resetMessages();
    setFacultyForm(emptyFacultyForm());
    setFacultySheetOpen(true);
  };

  const openEditFaculty = (faculty: FacultyItem) => {
    resetMessages();
    setFacultyForm({
      id: faculty.id,
      code: faculty.code,
      name: faculty.name,
      slug: faculty.slug,
      isActive: faculty.isActive,
    });
    setFacultySheetOpen(true);
  };

  const saveFaculty = async () => {
    if (!canSaveFaculty || savingFaculty) return;

    resetMessages();
    setSavingFaculty(true);
    try {
      const body = JSON.stringify({
        code: facultyForm.code.trim().toUpperCase(),
        name: facultyForm.name.trim(),
        slug: facultyForm.slug.trim(),
        isActive: facultyForm.isActive,
      });

      if (facultyForm.id) {
        await api(`/api/admission/faculties/${encodeURIComponent(facultyForm.id)}`, {
          method: "PATCH",
          body,
        });
        setSuccess("Факультет оновлено");
      } else {
        await api("/api/admission/faculties", {
          method: "POST",
          body,
        });
        setSuccess("Факультет створено");
      }

      setFacultySheetOpen(false);
      await Promise.all([loadFaculties(), loadUsers()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося зберегти факультет");
    } finally {
      setSavingFaculty(false);
    }
  };

  const deleteFaculty = async (faculty: FacultyItem) => {
    const ok = confirm(`Видалити факультет "${faculty.name}"?`);
    if (!ok) return;

    resetMessages();
    try {
      await api(`/api/admission/faculties/${encodeURIComponent(faculty.id)}`, {
        method: "DELETE",
        body: JSON.stringify({}),
      });
      setSuccess(`Факультет ${faculty.name} видалено`);
      await Promise.all([loadFaculties(), loadUsers()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося видалити факультет");
    }
  };

  const openCreateUser = () => {
    resetMessages();
    const defaultFacultyId = userFacultyFilter !== "all" ? userFacultyFilter : selectedFacultyId;
    setUserForm(emptyUserForm(defaultFacultyId));
    setUserSheetOpen(true);
  };

  const openEditUser = (user: UserItem) => {
    resetMessages();
    setUserForm({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      password: "",
      role: user.role,
      facultyId: user.facultyId,
      isActive: user.isActive,
      groupName: user.groupName,
      specialty: user.specialty,
      birthDate: user.birthDate ? user.birthDate.slice(0, 10) : "",
      badge: user.badge,
      disciplines: toDisciplineString(user.disciplines),
    });
    setUserSheetOpen(true);
  };

  const saveUser = async () => {
    if (!canSaveUser || savingUser) return;

    resetMessages();
    setSavingUser(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        isActive: userForm.isActive,
        groupName: userForm.groupName.trim() || null,
        specialty: userForm.specialty.trim() || null,
        birthDate: userForm.birthDate || null,
        badge: userForm.badge.trim() || null,
        disciplines: toDisciplines(userForm.disciplines),
      };

      if (userForm.password.trim()) {
        payload.password = userForm.password.trim();
      }

      if (!isEditingDean) {
        payload.role = userForm.role;
        payload.facultyId =
          userForm.role === "Admin" ? null : userForm.facultyId || null;
      }

      if (userForm.id) {
        await api(`/api/users/${encodeURIComponent(userForm.id)}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSuccess(`Користувача ${userForm.fullName.trim()} оновлено`);
      } else {
        await api("/api/users", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            password: userForm.password.trim(),
            role: userForm.role as EditableUserRole,
            facultyId: userForm.role === "Admin" ? null : userForm.facultyId || null,
          }),
        });
        setSuccess(`Користувача ${userForm.fullName.trim()} створено`);
      }

      setUserSheetOpen(false);
      await Promise.all([loadUsers(), loadDeanCandidates(), loadFaculties()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося зберегти користувача");
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = async (user: UserItem) => {
    const ok = confirm(`Видалити користувача "${user.fullName}"?`);
    if (!ok) return;

    resetMessages();
    try {
      await api(`/api/users/${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });
      setSuccess(`Користувача ${user.fullName} видалено`);
      await Promise.all([loadUsers(), loadDeanCandidates(), loadFaculties()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося видалити користувача");
    }
  };

  const assignDean = async () => {
    if (!canAssignDean || assigningDean) return;

    resetMessages();
    setAssigningDean(true);
    try {
      await api("/api/admin/assign-dean", {
        method: "POST",
        body: JSON.stringify({
          userId: selectedDeanId,
          facultyId: selectedFacultyId,
        }),
      });

      setSuccess("Декана призначено");
      await Promise.all([loadFaculties(), loadDeanCandidates(), loadUsers()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося призначити декана");
    } finally {
      setAssigningDean(false);
    }
  };

  const removeDean = async (faculty: FacultyItem) => {
    const ok = confirm(`Зняти декана з факультету "${faculty.name}"?`);
    if (!ok) return;

    resetMessages();
    try {
      await api(`/api/admin/deans/${encodeURIComponent(faculty.id)}`, {
        method: "DELETE",
      });
      setSuccess(`Декана з факультету ${faculty.name} знято`);
      await Promise.all([loadFaculties(), loadDeanCandidates(), loadUsers()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося зняти декана");
    }
  };

  const focusDeanEditor = (faculty: FacultyItem) => {
    setTab("deans");
    setSelectedFacultyId(faculty.id);
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Керування університетом</CardTitle>
              <CardDescription>Факультети, декани та користувачі без прямого редагування через БД.</CardDescription>
            </div>

            <div className="flex rounded-xl border p-1">
              <Button
                variant={tab === "faculties" ? "default" : "ghost"}
                size="sm"
                className="rounded-lg"
                onClick={() => setTab("faculties")}
              >
                Факультети
              </Button>
              <Button
                variant={tab === "deans" ? "default" : "ghost"}
                size="sm"
                className="rounded-lg"
                onClick={() => setTab("deans")}
              >
                Декани
              </Button>
              <Button
                variant={tab === "users" ? "default" : "ghost"}
                size="sm"
                className="rounded-lg"
                onClick={() => setTab("users")}
              >
                Користувачі
              </Button>
            </div>
          </CardHeader>
        </Card>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        {tab === "faculties" ? (
          <Card className="fade-in">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Факультети
                </CardTitle>
                <CardDescription>Створення, редагування та безпечне видалення факультетів.</CardDescription>
              </div>

              <Button className="rounded-xl" onClick={openCreateFaculty}>
                <Plus className="h-4 w-4" />
                Додати факультет
              </Button>
            </CardHeader>

            <CardContent>
              <div className="data-table-shell">
                <Table className="min-w-[920px]">
                  <THead>
                    <TR>
                      <TH>Код</TH>
                      <TH>Назва</TH>
                      <TH>Адреса</TH>
                      <TH>Статус</TH>
                      <TH>Декан</TH>
                      <TH className="text-right">Дії</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {loadingFaculties ? (
                      <TR>
                        <TD colSpan={6} className="text-center text-muted-foreground">
                          Завантаження факультетів...
                        </TD>
                      </TR>
                    ) : null}

                    {!loadingFaculties
                      ? faculties.map((faculty) => (
                          <TR key={faculty.id}>
                            <TD className="font-semibold">{faculty.code}</TD>
                            <TD>{faculty.name}</TD>
                            <TD className="text-muted-foreground">{faculty.slug}</TD>
                            <TD>
                              <Badge variant={faculty.isActive ? "approved" : "cancelled"}>
                                {faculty.isActive ? "Активний" : "Вимкнений"}
                              </Badge>
                            </TD>
                            <TD>
                              <div className="font-medium">{faculty.deanName}</div>
                              <div className="text-xs text-muted-foreground">{faculty.deanEmail}</div>
                            </TD>
                            <TD className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => openEditFaculty(faculty)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  Редагувати
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => void deleteFaculty(faculty)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Видалити
                                </Button>
                              </div>
                            </TD>
                          </TR>
                        ))
                      : null}

                    {!loadingFaculties && faculties.length === 0 ? (
                      <TR>
                        <TD colSpan={6} className="text-center text-muted-foreground">
                          Факультети відсутні.
                        </TD>
                      </TR>
                    ) : null}
                  </TBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {tab === "deans" ? (
          <Card className="fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldPlus className="h-5 w-5" />
                Керування деканами
              </CardTitle>
              <CardDescription>Призначайте, змінюйте та знімайте деканів через інтерфейс.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
                <div>
                  <Label>Факультет</Label>
                  <div className="mt-2">
                    <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Оберіть факультет" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.id}>
                            {facultyLabel(faculty)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Кандидат у декани</Label>
                  <div className="mt-2">
                    <Select value={selectedDeanId} onValueChange={setSelectedDeanId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Оберіть користувача" />
                      </SelectTrigger>
                      <SelectContent>
                        {deanCandidates.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.fullName} • {candidate.email}
                            {candidate.facultyName ? ` • ${userFacultyLabel(candidate)}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-end justify-end">
                  <Button
                    onClick={() => void assignDean()}
                    disabled={!canAssignDean || assigningDean || loadingDeanCandidates}
                    className="rounded-xl"
                  >
                    {assigningDean ? "Збереження..." : "Призначити / змінити декана"}
                  </Button>
                </div>
              </div>

              <div className="data-table-shell">
                <Table className="min-w-[760px]">
                  <THead>
                    <TR>
                      <TH>Факультет</TH>
                      <TH>Поточний декан</TH>
                      <TH>Статус</TH>
                      <TH className="text-right">Дії</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {loadingFaculties ? (
                      <TR>
                        <TD colSpan={4} className="text-center text-muted-foreground">
                          Завантаження деканів...
                        </TD>
                      </TR>
                    ) : null}

                    {!loadingFaculties
                      ? faculties.map((faculty) => (
                          <TR key={faculty.id}>
                            <TD className="font-medium">{facultyLabel(faculty)}</TD>
                            <TD>
                              <div className="font-medium">{faculty.deanName}</div>
                              <div className="text-xs text-muted-foreground">{faculty.deanEmail}</div>
                            </TD>
                            <TD>
                              <Badge variant={faculty.deanId ? "approved" : "pending"}>
                                {faculty.deanId ? "Призначено" : "Не призначено"}
                              </Badge>
                            </TD>
                            <TD className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => focusDeanEditor(faculty)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  Редагувати
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => void removeDean(faculty)}
                                  disabled={!faculty.deanId}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Видалити
                                </Button>
                              </div>
                            </TD>
                          </TR>
                        ))
                      : null}

                    {!loadingFaculties && faculties.length === 0 ? (
                      <TR>
                        <TD colSpan={4} className="text-center text-muted-foreground">
                          Факультети відсутні.
                        </TD>
                      </TR>
                    ) : null}
                  </TBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {tab === "users" ? (
          <Card className="fade-in">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Користувачі
                </CardTitle>
                <CardDescription>Створення, редагування та видалення користувачів без роботи з БД.</CardDescription>
              </div>

              <Button className="rounded-xl" onClick={openCreateUser}>
                <Plus className="h-4 w-4" />
                Додати користувача
              </Button>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4">
                <div>
                  <Label>Роль</Label>
                  <div className="mt-2">
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Усі</SelectItem>
                        <SelectItem value="Student">Студенти</SelectItem>
                        <SelectItem value="Teacher">Викладачі</SelectItem>
                        <SelectItem value="Dean">Декани</SelectItem>
                        <SelectItem value="Admin">Адміністратори</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Факультет</Label>
                  <div className="mt-2">
                    <Select value={userFacultyFilter} onValueChange={setUserFacultyFilter}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Усі</SelectItem>
                        {faculties.map((faculty) => (
                          <SelectItem key={faculty.id} value={faculty.id}>
                            {facultyLabel(faculty)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Статус</Label>
                  <div className="mt-2">
                    <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Усі</SelectItem>
                        <SelectItem value="active">Активні</SelectItem>
                        <SelectItem value="inactive">Вимкнені</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Пошук</Label>
                  <Input
                    className="mt-2"
                    value={userQuery}
                    onChange={(event) => setUserQuery(event.target.value)}
                    placeholder="ПІБ, email, група..."
                  />
                </div>
              </div>

              <div className="data-table-shell">
                <Table className="min-w-[1120px]">
                  <THead>
                    <TR>
                      <TH>Користувач</TH>
                      <TH>Роль</TH>
                      <TH>Факультет</TH>
                      <TH>Статус</TH>
                      <TH>Додатково</TH>
                      <TH className="text-right">Дії</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {loadingUsers ? (
                      <TR>
                        <TD colSpan={6} className="text-center text-muted-foreground">
                          Завантаження користувачів...
                        </TD>
                      </TR>
                    ) : null}

                    {!loadingUsers
                      ? users.map((user) => (
                          <TR key={user.id}>
                            <TD>
                              <div className="font-medium">{user.fullName}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </TD>
                            <TD>
                              <Badge variant={roleBadge(user.role)}>{user.role}</Badge>
                            </TD>
                            <TD>{userFacultyLabel(user)}</TD>
                            <TD>
                              <Badge variant={user.isActive ? "approved" : "cancelled"}>
                                {user.isActive ? "Активний" : "Вимкнений"}
                              </Badge>
                            </TD>
                            <TD className="max-w-[260px] text-muted-foreground">
                              {user.groupName || user.specialty || user.badge
                                ? [user.groupName, user.specialty, user.badge].filter(Boolean).join(" • ")
                                : "—"}
                            </TD>
                            <TD className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => openEditUser(user)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  Редагувати
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="rounded-xl"
                                  onClick={() => void deleteUser(user)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Видалити
                                </Button>
                              </div>
                            </TD>
                          </TR>
                        ))
                      : null}

                    {!loadingUsers && users.length === 0 ? (
                      <TR>
                        <TD colSpan={6} className="text-center text-muted-foreground">
                          Користувачів за вибраними фільтрами не знайдено.
                        </TD>
                      </TR>
                    ) : null}
                  </TBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Sheet open={facultySheetOpen} onOpenChange={setFacultySheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{facultyForm.id ? "Редагування факультету" : "Новий факультет"}</SheetTitle>
            <SheetDescription>Оновіть параметри факультету та його доступність у системі.</SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            <div>
              <Label>Код</Label>
              <Input
                className="mt-2"
                value={facultyForm.code}
                onChange={(event) =>
                  setFacultyForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                }
                placeholder="FCS"
              />
            </div>

            <div>
              <Label>Назва</Label>
              <Input
                className="mt-2"
                value={facultyForm.name}
                onChange={(event) =>
                  setFacultyForm((prev) => {
                    const nextName = event.target.value;
                    return {
                      ...prev,
                      name: nextName,
                      slug: prev.slug ? prev.slug : slugify(nextName),
                    };
                  })
                }
                placeholder="Факультет комп'ютерних наук"
              />
            </div>

            <div>
              <Label>Адреса</Label>
              <Input
                className="mt-2"
                value={facultyForm.slug}
                onChange={(event) =>
                  setFacultyForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))
                }
                placeholder="fcs"
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border bg-slate-50 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={facultyForm.isActive}
                onChange={(event) =>
                  setFacultyForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
                className="h-4 w-4 accent-sky-600"
              />
              Факультет активний
            </label>

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setFacultySheetOpen(false)}>
                Скасувати
              </Button>
              <Button
                className="rounded-xl"
                onClick={() => void saveFaculty()}
                disabled={!canSaveFaculty || savingFaculty}
              >
                {savingFaculty ? "Збереження..." : "Зберегти"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={userSheetOpen} onOpenChange={setUserSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{userForm.id ? "Редагування користувача" : "Новий користувач"}</SheetTitle>
            <SheetDescription>
              {isEditingDean
                ? "Профіль декана можна редагувати тут, а зміну факультету або зняття ролі виконуйте у вкладці «Декани»."
                : "Створення та редагування користувачів університету."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            <div>
              <Label>ПІБ</Label>
              <Input
                className="mt-2"
                value={userForm.fullName}
                onChange={(event) => setUserForm((prev) => ({ ...prev, fullName: event.target.value }))}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                className="mt-2"
                value={userForm.email}
                onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>

            <div>
              <Label>{userForm.id ? "Новий пароль (необов'язково)" : "Пароль"}</Label>
              <Input
                className="mt-2"
                type="password"
                value={userForm.password}
                onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder={userForm.id ? "Залиште порожнім, щоб не змінювати" : "Мінімум 8 символів"}
              />
            </div>

            <div>
              <Label>Роль</Label>
              <div className="mt-2">
                <Select
                  value={userForm.role}
                  onValueChange={(value) =>
                    setUserForm((prev) => ({
                      ...prev,
                      role: value as ManageableUserRole,
                      facultyId: value === "Admin" ? "" : prev.facultyId,
                    }))
                  }
                  disabled={isEditingDean}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Студент</SelectItem>
                    <SelectItem value="Teacher">Викладач</SelectItem>
                    {isEditingDean ? <SelectItem value="Dean">Декан</SelectItem> : null}
                    <SelectItem value="Admin">Адміністратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Факультет</Label>
              <div className="mt-2">
                <Select
                  value={userForm.facultyId || "__none__"}
                  onValueChange={(value) =>
                    setUserForm((prev) => ({
                      ...prev,
                      facultyId: value === "__none__" ? "" : value,
                    }))
                  }
                  disabled={userForm.role === "Admin" || isEditingDean}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Без факультету</SelectItem>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {facultyLabel(faculty)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border bg-slate-50 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={userForm.isActive}
                onChange={(event) => setUserForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                className="h-4 w-4 accent-sky-600"
              />
              Користувач активний
            </label>

            <div>
              <Label>Група</Label>
              <Input
                className="mt-2"
                value={userForm.groupName}
                onChange={(event) => setUserForm((prev) => ({ ...prev, groupName: event.target.value }))}
              />
            </div>

            <div>
              <Label>Спеціальність</Label>
              <Input
                className="mt-2"
                value={userForm.specialty}
                onChange={(event) => setUserForm((prev) => ({ ...prev, specialty: event.target.value }))}
              />
            </div>

            <div>
              <Label>Дата народження</Label>
              <Input
                className="mt-2"
                type="date"
                value={userForm.birthDate}
                onChange={(event) => setUserForm((prev) => ({ ...prev, birthDate: event.target.value }))}
              />
            </div>

            <div>
              <Label>Бейдж</Label>
              <Input
                className="mt-2"
                value={userForm.badge}
                onChange={(event) => setUserForm((prev) => ({ ...prev, badge: event.target.value }))}
              />
            </div>

            <div>
              <Label>Дисципліни (через кому)</Label>
              <Input
                className="mt-2"
                value={userForm.disciplines}
                onChange={(event) => setUserForm((prev) => ({ ...prev, disciplines: event.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setUserSheetOpen(false)}>
                Скасувати
              </Button>
              <Button
                className="rounded-xl"
                onClick={() => void saveUser()}
                disabled={!canSaveUser || savingUser}
              >
                {savingUser ? "Збереження..." : "Зберегти"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
