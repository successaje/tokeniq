import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ABI_DIR = path.join(__dirname, '../src/abis');
const OUTPUT_DIR = path.join(__dirname, '../src/abis/types');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Get all ABI files
const abiFiles = fs.readdirSync(ABI_DIR).filter(file => file.endsWith('.json'));

// Generate type files
for (const abiFile of abiFiles) {
  const contractName = path.basename(abiFile, '.json');
  const outputFile = path.join(OUTPUT_DIR, `${contractName}.ts`);
  const abiPath = path.join(ABI_DIR, abiFile);
  
  // Use typechain to generate types
  try {
    execSync(`npx typechain --target=ethers-v6 --out-dir ${OUTPUT_DIR} ${abiPath}`, { stdio: 'inherit' });
    
    // Rename the generated file to .ts
    const generatedFile = path.join(OUTPUT_DIR, `${abiFile.replace('.json', '.ts')}`);
    if (fs.existsSync(generatedFile)) {
      fs.renameSync(generatedFile, outputFile);
    }
    
    console.log(`Generated types for ${contractName}`);
  } catch (error) {
    console.error(`Failed to generate types for ${contractName}:`, error);
  }
}

// Create index.ts
try {
  const indexContent = abiFiles
    .map(file => `export * from './${path.basename(file, '.json')}';`)
    .join('\n');
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
  console.log('Generated index.ts');
} catch (error) {
  console.error('Failed to generate index.ts:', error);
}
