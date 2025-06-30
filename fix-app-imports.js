const fs = require('fs');
const path = require('path');

// Define UI components that might be imported with different casings
const uiComponents = [
  'Button', 'Input', 'Label', 'Card', 'Tabs', 'TabsContent', 'TabsList', 'TabsTrigger',
  'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue', 'Textarea'
];

// Function to update imports in a file
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Update imports from @/components/ui/*
    for (const component of uiComponents) {
      const lowercaseComponent = component.toLowerCase();
      
      // Handle both single and multiple imports
      const importPatterns = [
        new RegExp(`from\s+['"]@/components/ui/${component}['"]`, 'g'),
        new RegExp(`import\s*\{[^}]*\b${component}\b[^}]*\}\s*from\s*['"]@/components/ui/[A-Za-z]+['"]`, 'g')
      ];
      
      for (const pattern of importPatterns) {
        if (pattern.test(content)) {
          content = content.replace(
            pattern,
            (match) => match.replace(new RegExp(`@/components/ui/${component}(?=['"])`), `@/components/ui/${lowercaseComponent}`)
          );
          updated = true;
        }
      }
    }

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated imports in ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Find all TypeScript/JavaScript files in the src/app directory
function processDirectory(directory) {
  try {
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
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error);
  }
}

// Start processing from the src/app directory
processDirectory(path.join(__dirname, 'src/app'));
console.log('Import updates complete!');
