"use client";

import { useMemo, useState } from "react";
import type {
  CertificateAudience,
  CertificateField,
  CertificateType,
  FieldType,
} from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Save } from "lucide-react";

function slugifyKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9а-яіїєґ\s-]/gi, "")
    .replace(/\s+/g, "_")
    .slice(0, 32);
}

const typeOptions: { value: FieldType; label: string }[] = [
  { value: "text", label: "Текст" },
  { value: "number", label: "Число" },
  { value: "date", label: "Дата" },
  { value: "textarea", label: "Великий текст" },
  { value: "select", label: "Випадаючий список" },
  { value: "checkbox", label: "Прапорець" },
];

const defaultField: CertificateField = {
  key: "full_name",
  label: "ПІБ",
  type: "text",
  required: true,
  placeholder: "Іваненко Іван Іванович",
};

const audienceOptions: { value: CertificateAudience; label: string }[] = [
  { value: "all", label: "Усі" },
  { value: "student", label: "Тільки студенти" },
  { value: "teacher", label: "Тільки викладачі" },
];

function optionsToString(options?: string[]) {
  return (options ?? []).join(", ");
}

function stringToOptions(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

type EditorCertificatePayload = Omit<CertificateType, "id"> & {
  audience: CertificateAudience;
};

type EditableCertificateField = CertificateField & {
  optionsInput?: string;
};

function toEditableField(field: CertificateField): EditableCertificateField {
  return {
    ...field,
    optionsInput: optionsToString(field.options),
  };
}

export function CertificateEditor({
  mode,
  initial,
  onSave,
  onCancel,
}: {
  mode: "create" | "edit";
  initial?: CertificateType;
  onSave: (payload: EditorCertificatePayload) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [audience, setAudience] = useState<CertificateAudience>(initial?.audience ?? "all");
  const [saving, setSaving] = useState(false);

  const [fields, setFields] = useState<EditableCertificateField[]>(
    (initial?.fields ?? [defaultField]).map(toEditableField)
  );

  const canSave = useMemo(() => {
    if (name.trim().length < 3) return false;
    if (fields.length === 0) return false;
    const keys = fields.map((field) => field.key.trim()).filter(Boolean);
    if (keys.length !== fields.length) return false;
    if (new Set(keys).size !== keys.length) return false;
    if (fields.some((field) => !field.label.trim())) return false;

    return fields.every((field) => {
      if (field.type !== "select") return true;
      return (field.options ?? []).length > 0;
    });
  }, [name, fields]);

  const updateField = (index: number, patch: Partial<EditableCertificateField>) => {
    setFields((prev) => prev.map((field, idx) => (idx === index ? { ...field, ...patch } : field)));
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      toEditableField({
        key: `field_${prev.length + 1}`,
        label: "Нове поле",
        type: "text",
        required: false,
        placeholder: "",
      }),
    ]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const submit = async () => {
    if (!canSave || saving) return;

    const normalized = fields.map((field, index) => ({
      ...field,
      order: index + 1,
      options: field.type === "select" ? field.options ?? [] : [],
    }));

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        audience,
        fields: normalized,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="fade-in">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Створення довідки" : "Редагування довідки"}</CardTitle>
        <CardDescription>Налаштуйте поля форми, які заповнюватиме студент або викладач.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Назва</Label>
            <Input
              className="mt-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Напр. Довідка з місця навчання"
            />
          </div>

          <div>
            <Label>Опис</Label>
            <Input
              className="mt-2"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Для подання за місцем вимоги"
            />
          </div>

          <div>
            <Label>Доступно для</Label>
            <div className="mt-2">
              <Select value={audience} onValueChange={(value) => setAudience(value as CertificateAudience)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audienceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Поля форми</div>
              <div className="text-xs text-muted-foreground">Ключі мають бути унікальними.</div>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={addField}>
              <Plus className="h-4 w-4" />
              Додати поле
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {fields.map((field, index) => (
              <div key={`${field.key}-${index}`} className="grid gap-3 rounded-2xl border p-3 md:grid-cols-12">
                <div className="md:col-span-3">
                  <Label>Назва поля</Label>
                  <Input
                    className="mt-2"
                    value={field.label}
                    onChange={(event) => {
                      const label = event.target.value;
                      updateField(index, { label });
                      if (!field.key || field.key.startsWith("field_")) {
                        updateField(index, { key: slugifyKey(label) || `field_${index + 1}` });
                      }
                    }}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Ключ</Label>
                  <Input
                    className="mt-2"
                    value={field.key}
                    onChange={(event) => updateField(index, { key: slugifyKey(event.target.value) })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Тип</Label>
                  <div className="mt-2">
                    <Select
                      value={field.type}
                      onValueChange={(value) =>
                        updateField(index, {
                          type: value as FieldType,
                          options: value === "select" ? field.options ?? [] : [],
                        })
                      }
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <Label>Placeholder</Label>
                  <Input
                    className="mt-2"
                    value={field.placeholder ?? ""}
                    onChange={(event) => updateField(index, { placeholder: event.target.value })}
                  />
                </div>

                <div className="md:col-span-1">
                  <Label>Обов.</Label>
                  <div className="mt-3 flex h-10 items-center">
                    <input
                      type="checkbox"
                      checked={!!field.required}
                      onChange={(event) => updateField(index, { required: event.target.checked })}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </div>
                </div>

                <div className="md:col-span-1 flex items-end justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => removeField(index)}
                    aria-label="Видалити поле"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="md:col-span-12">
                  <Label>Підказка для користувача</Label>
                  <Textarea
                    className="mt-2"
                    value={field.helpText ?? ""}
                    onChange={(event) => updateField(index, { helpText: event.target.value })}
                    placeholder="Коротка підказка для користувача"
                  />
                </div>

                {field.type === "select" ? (
                  <div className="md:col-span-12">
                    <Label>Опції (через кому)</Label>
                    <Input
                      className="mt-2"
                      value={field.optionsInput ?? optionsToString(field.options)}
                      onChange={(event) =>
                        updateField(index, {
                          optionsInput: event.target.value,
                          options: stringToOptions(event.target.value),
                        })
                      }
                      placeholder="1, 2, 3, 4"
                    />
                  </div>
                ) : null}

                {field.type === "number" ? (
                  <div className="md:col-span-12 grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Мін.</Label>
                      <Input
                        className="mt-2"
                        type="number"
                        value={typeof field.min === "number" ? field.min : ""}
                        onChange={(event) =>
                          updateField(index, { min: event.target.value === "" ? undefined : Number(event.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label>Макс.</Label>
                      <Input
                        className="mt-2"
                        type="number"
                        value={typeof field.max === "number" ? field.max : ""}
                        onChange={(event) =>
                          updateField(index, { max: event.target.value === "" ? undefined : Number(event.target.value) })
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {!canSave ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Перевірте: назва (мін. 3 символи), унікальні ключі, для select має бути хоча б одна опція.
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onCancel} disabled={saving}>
            Скасувати
          </Button>
          <Button className="rounded-xl" onClick={() => void submit()} disabled={!canSave || saving}>
            <Save className="h-4 w-4" />
            {saving ? "Збереження..." : "Зберегти"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
