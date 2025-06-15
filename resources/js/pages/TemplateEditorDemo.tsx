import React from 'react';
import { Head } from '@inertiajs/react';
import { TemplateEditorDemo } from '@/components/ui/template-editor-demo';
import AppLayout from '@/layouts/app-layout';

export default function TemplateEditorDemoPage() {
  return (
    <AppLayout>
      <Head title="Template Editor Demo" />
      <TemplateEditorDemo />
    </AppLayout>
  );
} 