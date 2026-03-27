const { exec } = require('child_process');

console.log('Compiling contracts...');

// Use the direct path to hardhat bootstrap
exec('node ./node_modules/hardhat/internal/cli/bootstrap.js compile', 
  { cwd: __dirname },
  (error, stdout, stderr) => {
    if (error) {
      console.error('Compilation error:', error);
      console.error('stderr:', stderr);
      return;
    }
    console.log('stdout:', stdout);
    console.log('Compilation completed successfully!');
  }
);