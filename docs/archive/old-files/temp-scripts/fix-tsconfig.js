const fs = require('fs');
const path = require('path');

const content = `{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}`;

fs.writeFileSync(path.join('services', 'api-gateway', 'tsconfig.json'), content, 'utf8');
console.log('tsconfig.json written successfully');
