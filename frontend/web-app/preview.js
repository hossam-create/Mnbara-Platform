import { preview } from 'vite';

async function startPreview() {
  try {
    const server = await preview({
      preview: {
        port: 3000,
        host: '0.0.0.0'
      }
    });
    console.log('Preview server started at http://localhost:3000');
  } catch (error) {
    console.error('Preview failed:', error);
    process.exit(1);
  }
}

startPreview();