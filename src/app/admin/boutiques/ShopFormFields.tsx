export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  hint,
  minLength,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  minLength?: number;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && " *"}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        defaultValue={defaultValue}
        className="rounded border px-3 py-2"
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function ColorField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="color"
        defaultValue={defaultValue}
        className="h-10 w-16 rounded border"
      />
    </div>
  );
}
