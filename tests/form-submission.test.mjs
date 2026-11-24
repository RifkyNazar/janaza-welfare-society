import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadServerModule } from "./load-server-module.mjs";

test("a form accepts one submit before pending renders and unlocks for the next response", () => {
  const ref = { current: false };
  let dismissed;
  let effect;
  const { useFormSubmission } = loadServerModule("components/use-form-submission.ts", {
    react: {
      useRef: () => ref,
      useState: () => [dismissed, update => { dismissed = update(); }],
      useEffect: run => { effect = run; },
    },
  });
  const event = () => ({
    defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; },
  });

  const initial = {};
  let form = useFormSubmission(initial, false);
  effect();
  const first = event();
  form.onSubmit(first);
  assert.equal(first.defaultPrevented, false);

  const repeated = event();
  form.onSubmit(repeated);
  assert.equal(repeated.defaultPrevented, true);

  form = useFormSubmission(initial, true);
  effect();
  assert.equal(form.showFeedback, false);
  const during = event();
  form.onSubmit(during);
  assert.equal(during.defaultPrevented, true);

  const invalid = { error: "Check the uploaded image." };
  form = useFormSubmission(invalid, false);
  effect();
  assert.equal(form.showFeedback, true);
  form.onChange();
  form = useFormSubmission(invalid, false);
  assert.equal(form.showFeedback, false);
  const retry = event();
  form.onSubmit(retry);
  assert.equal(retry.defaultPrevented, false);
});

test("a canceled submit leaves the form available", () => {
  const ref = { current: false };
  const { useFormSubmission } = loadServerModule("components/use-form-submission.ts", {
    react: { useRef: () => ref, useState: () => [undefined, () => {}], useEffect() {} },
  });
  const form = useFormSubmission({}, false);
  form.onSubmit({ defaultPrevented: true, preventDefault() { assert.fail("Already canceled"); } });
  assert.equal(ref.current, false);
});

test("advertisement preview and filename belong only to the matching response", () => {
  let response = {};
  const selected = { response, name: "temporary.webp", url: "blob:temporary" };
  const { AdvertisementForm } = loadServerModule("components/admin/advertisement-form.tsx", {
    react: { ...React, useActionState: () => [response, () => {}, false], useState: () => [selected, () => {}] },
    "next/image": ({ src, alt }) => React.createElement("img", { src, alt }),
    "next/link": ({ href, children }) => React.createElement("a", { href }, children),
    "@/components/public-language": { T: ({ text }) => text, useTranslation: () => ({ t: text => text }) },
    "@/components/use-form-submission": { useFormSubmission: () => ({ showFeedback: true }) },
    "@/lib/image-upload-limits": {},
  });
  const render = () => renderToStaticMarkup(React.createElement(AdvertisementForm, {
    action() {},
    initial: { title: "Notice", description: "", startsAt: "", endsAt: "", hasImage: true, imageUrl: "/advertisement-images/saved.webp" },
  }));
  assert.match(render(), /temporary\.webp/);
  assert.match(render(), /blob:temporary/);
  response = { error: "Choose an image." };
  const html = render();
  assert.doesNotMatch(html, /temporary/);
  assert.match(html, /\/advertisement-images\/saved\.webp/);
});
