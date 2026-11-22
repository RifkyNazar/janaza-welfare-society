"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "@/components/public-language";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isField(target: EventTarget): target is Field {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
}

function messageFor(field: Field) {
  const { validity, type } = field;
  if (validity.valueMissing) {
    if (type === "checkbox") return "Select this checkbox to continue.";
    if (type === "file") return "Choose a file.";
    if (type === "radio" || field instanceof HTMLSelectElement) return "Select an option.";
    return "Complete this required field.";
  }
  if (validity.typeMismatch) return type === "email" ? "Enter a valid email address." : "Enter a valid URL.";
  if (validity.badInput && type === "number") return "Enter a valid number.";
  if (validity.rangeOverflow || validity.rangeUnderflow || validity.stepMismatch) return "Enter a value within the allowed range.";
  if (validity.tooLong || validity.tooShort) return "Check the allowed length for this field.";
  return "Enter a value in the required format.";
}

export function PortalValidation({ children }: { children: ReactNode }) {
  const { locale, t } = useTranslation();
  const translated = useRef(new Set<Field>());

  useEffect(() => {
    const fields = translated.current;
    return () => {
      for (const field of fields) field.setCustomValidity("");
      fields.clear();
    };
  }, [locale]);

  function clear(target: EventTarget) {
    if (isField(target) && translated.current.delete(target)) target.setCustomValidity("");
  }

  return (
    <div onInvalidCapture={({ target }) => {
      clear(target);
      if (locale === "ta" && isField(target) && !target.validity.valid && !target.validity.customError) {
        target.setCustomValidity(t(messageFor(target)));
        translated.current.add(target);
      }
    }} onInputCapture={({ target }) => {
      if (target instanceof HTMLInputElement && target.type === "radio" && target.form) {
        for (const field of translated.current) {
          if (field.form === target.form && field.name === target.name) clear(field);
        }
      } else {
        clear(target);
      }
    }}>
      {children}
    </div>
  );
}
