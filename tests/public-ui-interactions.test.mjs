import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadServerModule } from './load-server-module.mjs';

test('service form category/service progression retains its submission fields and resets incompatible selection', () => {
  const values = [];
  let hook = 0;
  const { ServiceRequestForm } = loadServerModule('components/service-request-form.tsx', {
    react: { ...React,
      useState: initial => { const index = hook++; if (!(index in values)) values[index] = initial; return [values[index], next => { values[index] = typeof next === 'function' ? next(values[index]) : next; }]; },
      useActionState: () => [{}, () => { throw new Error('No server submission is permitted in this UI test'); }, false],
    },
    '@/components/use-form-submission': { useFormSubmission: () => ({ showFeedback: true, onChange() {} }) },
    '@/components/public-language': { T: ({ text }) => text },
    'next/link': ({ href, children }) => React.createElement('a', { href }, children),
    'next/dynamic': () => () => null,
    '@/app/actions/service-request': { submitServiceRequest() { throw new Error('No database access'); } },
    '@/components/copy-request-code': { CopyRequestCode: () => null },
    '@/components/download-request-pdf': { DownloadRequestPdf: () => null },
    '@/lib/service-options': loadServerModule('lib/service-options.ts'),
  });
  const render = () => { hook = 0; return ServiceRequestForm(); };
  function all(element, type) {
    if (!element || typeof element !== 'object') return [];
    return [...(element.type === type ? [element] : []), ...React.Children.toArray(element.props?.children).flatMap(child => all(child, type))];
  }
  let tree = render();
  assert.ok(!renderToStaticMarkup(tree).includes('name="requesterName"'));
  all(tree, 'button')[1].props.onClick(); // Vehicle category
  tree = render();
  const vehicleChoices = all(tree, 'input').filter(input => input.props.name === 'serviceCodes');
  assert.ok(vehicleChoices.length > 0);
  assert.ok(vehicleChoices.every(input => input.props.type === 'radio'));
  vehicleChoices[0].props.onChange();
  tree = render();
  const markup = renderToStaticMarkup(tree);
  for (const name of ['serviceCategory', 'requesterName', 'mobileNumber', 'area', 'note', 'latitude', 'longitude']) assert.ok(markup.includes('name="' + name + '"'));
  assert.ok(all(tree, 'button').some(button => button.props.type === 'submit'));
  all(tree, 'button')[0].props.onClick(); // Janazah category resets vehicle selection
  tree = render();
  assert.ok(!renderToStaticMarkup(tree).includes('name="requesterName"'));
  const janazahChoices = all(tree, 'input').filter(input => input.props.name === 'serviceCodes');
  assert.ok(janazahChoices.every(input => input.props.type === 'checkbox' && input.props.checked === false));
});
