const fs = require('fs');
const path = require('path');

// Define the components directory and the mapping of uppercase to lowercase component names
const componentsDir = path.join(__dirname, 'src/components/ui');
const componentFiles = fs.readdirSync(componentsDir);

// Create a mapping of component names (e.g., 'Button' -> 'button')
const componentMap = componentFiles.reduce((acc, file) => {
  if (file.endsWith('.tsx')) {
    const componentName = file.replace(/\.tsx$/, '');
    acc[componentName] = componentName.toLowerCase();
  }
  return acc;
}, {});

// Function to update imports in a file
function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Update imports from @/components/ui/*
  for (const [original, lowercase] of Object.entries(componentMap)) {
    if (original === lowercase) continue;
    
    const importPattern = new RegExp(
      `from\s+['"]@/components/ui/${original}['"]`,
      'g'
    );
    
    if (importPattern.test(content)) {
      content = content.replace(
        importPattern,
        `from '@/components/ui/${lowercase}'`
      );
      updated = true;
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${path.relative(process.cwd(), filePath)}`);
  }
}

// Find all TypeScript/JavaScript files in the src directory
function processDirectory(directory) {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      // Skip node_modules and .next directories
      if (file.name === 'node_modules' || file.name === '.next') {
        continue;
      }
      processDirectory(fullPath);
    } else if (file.name.match(/\.(ts|tsx|js|jsx)$/)) {
      updateImports(fullPath);
    }
  }
}

// Start processing from the src directory
processDirectory(path.join(__dirname, 'src/app'));
console.log('Import updates complete!');
