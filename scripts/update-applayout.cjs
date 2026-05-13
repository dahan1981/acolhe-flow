const fs = require('fs');

let layout = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf8');

if (!layout.includes('import { PanicButton }')) {
  // Add import
  layout = layout.replace('import { useAuthStore } from "@/stores/auth-store";', 'import { useAuthStore } from "@/stores/auth-store";\nimport { PanicButton } from "@/components/PanicButton";');
  
  // Inject component before final closing tag of main wrapper
  layout = layout.replace('</SidebarProvider>', '  {currentUser?.perfil === "mulher" && <PanicButton />}\n    </SidebarProvider>');
}

fs.writeFileSync('src/components/layout/AppLayout.tsx', layout);
