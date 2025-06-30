const fs = require('fs');
const path = require('path');

// Define the public directory
const publicDir = path.join(__dirname, '../public');

// Define the icon mappings for tokens and chains
const iconMappings = {
  tokens: {
    // Token mappings (original path -> new path)
    'ethereum.png': 'ethereum.png',
    'eth.svg': 'ethereum.svg',
    'usdc.png': 'usdc.png',
    'usdc.svg': 'usdc.svg',
    'usdt.png': 'usdt.png',
    'usdt.svg': 'usdt.svg',
    'wbtc.svg': 'wbtc.svg',
    'aave.png': 'aave.png',
    'chainlink.png': 'chainlink.png',
    'arbitrum.png': 'arbitrum.png',
    'avalanche.png': 'avalanche.png',
    'base.png': 'base.png',
    'polygon.png': 'polygon.png',
    'default.png': 'default.png',
  },
  chains: {
    // Chain mappings (original path -> new path)
    'ethereum.svg': 'ethereum.svg',
    'ethereum.png': 'ethereum.png',
    'arbitrum-arb-logo.png': 'arbitrum.png',
    'arbitrum.png': 'arbitrum.png',
    'avalanche-avax-logo.png': 'avalanche.png',
    'avalanche.png': 'avalanche.png',
    'avalanche.svg': 'avalanche.svg',
    'base.png': 'base.png',
    'base.svg': 'base.svg',
    'bnb-bnb-logo.png': 'binance.png',
    'chainlink.png': 'chainlink.png',
    'polygon-matic-logo.png': 'polygon.png',
    'polygon.png': 'polygon.png',
    'polygon.svg': 'polygon.svg',
    'tether-usdt-logo.png': 'tether.png',
    'usd-coin-usdc-logo.png': 'usdc.png',
    'optimism.svg': 'optimism.svg',
    'default.svg': 'default.svg',
  }
};

// Create necessary directories
Object.keys(iconMappings).forEach(dir => {
  const dirPath = path.join(publicDir, 'icons', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Function to create a symlink if it doesn't exist
function createSymlink(target, linkPath) {
  if (fs.existsSync(linkPath)) {
    return; // Skip if link already exists
  }
  
  // Ensure the target exists
  if (!fs.existsSync(target)) {
    console.warn(`Target does not exist: ${target}`);
    return;
  }
  
  // Create relative symlink
  const relativeTarget = path.relative(path.dirname(linkPath), target);
  
  try {
    fs.symlinkSync(relativeTarget, linkPath);
    console.log(`Created symlink: ${linkPath} -> ${relativeTarget}`);
  } catch (error) {
    console.error(`Error creating symlink ${linkPath}:`, error);
  }
}

// Process each icon type (tokens, chains)
Object.entries(iconMappings).forEach(([iconType, mappings]) => {
  const sourceDir = path.join(publicDir, 'icons', iconType);
  const destDir = path.join(publicDir, 'icons', iconType);
  
  // Create symlinks for each mapping
  Object.entries(mappings).forEach(([source, dest]) => {
    const sourcePath = path.join(publicDir, source);
    const destPath = path.join(destDir, dest);
    
    // If source exists in the root, create a symlink
    if (fs.existsSync(sourcePath)) {
      createSymlink(sourcePath, destPath);
    }
    
    // Also check in the icons directory
    const altSourcePath = path.join(publicDir, 'icons', source);
    if (fs.existsSync(altSourcePath)) {
      createSymlink(altSourcePath, destPath);
    }
    
    // Check in the logos directory
    const logosSourcePath = path.join(publicDir, 'logos', source);
    if (fs.existsSync(logosSourcePath)) {
      createSymlink(logosSourcePath, destPath);
    }
  });
});

// Create a default token icon if it doesn't exist
const defaultTokenIcon = path.join(publicDir, 'icons', 'tokens', 'default.png');
if (!fs.existsSync(defaultTokenIcon)) {
  try {
    // Create a simple default token icon
    const defaultSvg = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" rx="12" fill="#E5E7EB"/>
        <path d="M12 6V18M6 12H18" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    
    // Convert SVG to PNG using a simple approach
    // Note: For a production app, you might want to use a proper SVG to PNG converter
    fs.writeFileSync(defaultTokenIcon.replace('.png', '.svg'), defaultSvg);
    console.log('Created default token icon');
  } catch (error) {
    console.error('Error creating default token icon:', error);
  }
}

console.log('Icon setup completed!');
