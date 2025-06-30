const fs = require('fs');
const path = require('path');

// Get all TypeScript/JavaScript files in the project
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !['node_modules', '.next', '.git'].includes(file)) {
      getFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update imports in a file
function updateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Find all @/components/ui/ imports
    const importRegex = /from\s+['"]@\/components\/ui\/([^'"\/]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[0];
      const componentName = match[1];
      const lowercaseComponent = componentName.toLowerCase();
      
      // Only update if the component name has uppercase letters
      if (componentName !== lowercaseComponent) {
        const newImport = importPath.replace(
          `@/components/ui/${componentName}`,
          `@/components/ui/${lowercaseComponent}`
        );
        
        content = content.replace(importPath, newImport);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated imports in ${path.relative(process.cwd(), filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Main function
function main() {
  console.log('🚀 Starting to update imports...');
  
  // Get all files in the src directory
  const files = getFiles(path.join(__dirname, 'src'));
  
  console.log(`🔍 Found ${files.length} files to process`);
  
  // Update imports in each file
  files.forEach(updateImports);
  
  console.log('✨ All imports have been updated!');
}

// Run the script
main();
