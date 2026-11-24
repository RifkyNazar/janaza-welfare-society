export type OperationActionState = { error?: string; success?: string; values?: { title: string; description: string } };

export function operationFields(form: FormData) {
  const text = (name: string) => {
    const field = form.get(name);
    return typeof field === "string" ? field.trim() : "";
  };
  return { title: text("title"), description: text("description") };
}
