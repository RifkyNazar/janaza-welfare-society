"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

export function useFormSubmission<T>(response: T, pending: boolean) {
  const submitted = useRef(false);
  const [dismissedResponse, setDismissedResponse] = useState<T>();

  useEffect(() => {
    if (!pending) submitted.current = false;
  }, [pending, response]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (event.defaultPrevented) return;
    if (submitted.current || pending) {
      event.preventDefault();
      return;
    }
    submitted.current = true;
    setDismissedResponse(() => response);
  }

  return {
    onSubmit,
    onChange: () => setDismissedResponse(() => response),
    showFeedback: !pending && response !== dismissedResponse,
  };
}
