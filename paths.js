const path = require('path');

// This is a helper file to ensure consistent path resolution
// between different build tools and environments

const resolvePath = (p) => path.resolve(__dirname, p);

module.exports = {
  src: resolvePath('./src'),
  components: resolvePath('./src/components'),
  // Add other path aliases as needed
};
