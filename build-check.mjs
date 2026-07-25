import { execSync } from 'child_process';
const result = execSync('npx vite build 2>&1', { encoding: 'utf8', shell: 'powershell' });
console.log(result);
