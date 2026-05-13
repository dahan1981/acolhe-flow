const fs = require('fs');
let c = fs.readFileSync('server/src/index.ts', 'utf8');
c = c.replace('import { config, isProduction } from "./config.js";', 'import { config, isProduction } from "./config.js";\nimport { isValidCPF } from "./lib/cpf.js";');
c = c.replace(/cpf: z\.string\(\)\.min\(11\)\.max\(14\),/g, 'cpf: z.string().min(11).max(14).refine(isValidCPF, { message: "CPF inválido" }),');
fs.writeFileSync('server/src/index.ts', c);
