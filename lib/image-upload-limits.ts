export const MAX_UPLOAD_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageSelection(input: HTMLInputElement, sizeError: string) {
  input.setCustomValidity((input.files?.[0]?.size ?? 0) > MAX_UPLOAD_IMAGE_BYTES ? sizeError : "");
  if (!input.validity.valid && input.files?.length) input.reportValidity();
}
