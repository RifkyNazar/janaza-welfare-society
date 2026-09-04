"use client";

import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
};

export function PasswordField({ id, name, label, autoComplete }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-foreground">{label}</label>
      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          className="employee-form-input pr-20"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={`${isVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          className="absolute inset-y-0 right-0 rounded-r-xl px-4 text-sm font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
