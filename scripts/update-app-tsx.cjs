const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add lazy and Suspense to React import if needed
if (!app.includes('import { Suspense, lazy }')) {
  app = app.replace('import { useEffect } from "react";', 'import React, { useEffect, Suspense, lazy } from "react";');
}

// 2. Replace static imports with lazy imports
const pageImports = [
  'Login', 'MulherDashboard', 'MulherCaseDetail', 'MulherAjuda', 'MulherHistorico',
  'ProfissionalDashboard', 'CaseList', 'CaseDetail', 'NovoAtendimento', 'NovoEncaminhamento',
  'ProfissionalWorkspace', 'GestoraDashboard', 'Relatorios', 'GestoraAdmin', 'ProfessionalsPage',
  'ProfilePage', 'ConfigPage', 'NotificationsPage', 'InstitutionalPage', 'AccessOverviewPage',
  'NovoProtocolo', 'ChatPage', 'ArticlePage', 'ProfileEditPage', 'ResetPassword', 'NotFound'
];

pageImports.forEach(page => {
  const importRegex = new RegExp(`import ${page} from "\\./pages/(.*?)";`);
  app = app.replace(importRegex, `const ${page} = lazy(() => import("./pages/$1"));`);
});

// 3. Wrap Routes in Suspense
const suspenseFallback = `<Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">Carregando...</div>}>\n          <Routes>`;
app = app.replace('<Routes>', suspenseFallback);
app = app.replace('</Routes>', '</Routes>\n        </Suspense>');

fs.writeFileSync('src/App.tsx', app);
