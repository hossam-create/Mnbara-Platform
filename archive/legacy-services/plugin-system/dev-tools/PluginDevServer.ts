import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Plugin Development Server
 * Development server for plugin development with hot reload
 */
export class PluginDevServer {
  private pluginPath: string;
  private port: number;
  private server: any;
  private watchers: fs.FSWatcher[] = [];
  private isRunning = false;

  constructor(pluginPath: string, port = 3000) {
    this.pluginPath = path.resolve(pluginPath);
    this.port = port;
  }

  /**
   * Start development server
   */
  async start() {
    if (this.isRunning) {
      console.log('🔄 Development server is already running');
      return;
    }

    console.log(`🚀 Starting plugin development server on port ${this.port}`);

    // Validate plugin
    await this.validatePlugin();

    // Setup file watchers
    this.setupFileWatchers();

    // Start HTTP server
    this.startHttpServer();

    this.isRunning = true;
    console.log('✅ Development server started');
    console.log(`🌐 Plugin available at: http://localhost:${this.port}`);
    console.log('📁 Watching for file changes...');
  }

  /**
   * Stop development server
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping development server...');

    // Close file watchers
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];

    // Close HTTP server
    if (this.server) {
      this.server.close();
      this.server = null;
    }

    this.isRunning = false;
    console.log('✅ Development server stopped');
  }

  /**
   * Validate plugin structure
   */
  private async validatePlugin() {
    const manifestPath = path.join(this.pluginPath, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error('manifest.json not found');
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Validate required fields
    const requiredFields = ['name', 'version', 'main', 'type'];
    for (const field of requiredFields) {
      if (!manifest[field]) {
        throw new Error(`Missing required field in manifest: ${field}`);
      }
    }

    // Check main entry point
    const mainFile = path.join(this.pluginPath, manifest.main);
    if (!fs.existsSync(mainFile)) {
      throw new Error(`Main entry point not found: ${manifest.main}`);
    }

    console.log(`✅ Plugin validated: ${manifest.name} v${manifest.version}`);
  }

  /**
   * Setup file watchers for hot reload
   */
  private setupFileWatchers() {
    const watchPaths = [
      path.join(this.pluginPath, 'src'),
      path.join(this.pluginPath, 'manifest.json'),
      path.join(this.pluginPath, 'package.json'),
    ];

    watchPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
          if (filename && !filename.includes('node_modules')) {
            console.log(`🔄 File changed: ${filename}`);
            this.handleFileChange(eventType, filename);
          }
        });

        this.watchers.push(watcher);
      }
    });
  }

  /**
   * Handle file changes
   */
  private async handleFileChange(eventType: string, filename: string) {
    console.log(`🔄 Reloading plugin due to ${eventType}: ${filename}`);

    try {
      // Rebuild plugin
      await this.rebuildPlugin();

      // Reload plugin in memory
      await this.reloadPlugin();

      console.log('✅ Plugin reloaded successfully');
    } catch (error) {
      console.error('❌ Plugin reload failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Rebuild plugin
   */
  private async rebuildPlugin() {
    console.log('🔨 Rebuilding plugin...');

    // Check for build script
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (packageJson.scripts?.build) {
      try {
        execSync('npm run build', { 
          cwd: this.pluginPath,
          stdio: 'pipe' 
        });
        console.log('✅ Plugin rebuilt');
      } catch (error) {
        throw new Error('Build failed');
      }
    } else {
      console.log('⚠️  No build script found, skipping build');
    }
  }

  /**
   * Reload plugin in memory
   */
  private async reloadPlugin() {
    console.log('🔄 Reloading plugin...');

    // Clear module cache
    const manifest = JSON.parse(fs.readFileSync(path.join(this.pluginPath, 'manifest.json'), 'utf8'));
    const mainFile = path.join(this.pluginPath, manifest.main);
    
    // Clear require cache
    delete require.cache[require.resolve(mainFile)];

    // Reload plugin
    const plugin = require(mainFile);
    
    // Validate plugin exports
    if (typeof plugin.init !== 'function') {
      throw new Error('Plugin must export an init function');
    }

    console.log('✅ Plugin reloaded');
  }

  /**
   * Start HTTP server
   */
  private startHttpServer() {
    const express = require('express');
    const cors = require('cors');
    
    const app = express();
    
    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.static(this.pluginPath));

    // Health check endpoint
    app.get('/health', (req: any, res: any) => {
      res.json({ 
        status: 'ok', 
        plugin: this.getPluginInfo(),
        timestamp: new Date().toISOString()
      });
    });

    // Plugin info endpoint
    app.get('/plugin-info', (req: any, res: any) => {
      res.json(this.getPluginInfo());
    });

    // Plugin API proxy
    app.use('/api', (req: any, res: any) => {
      this.handlePluginApiRequest(req, res);
    });

    // Start server
    this.server = app.listen(this.port, () => {
      console.log(`🌐 Development server listening on port ${this.port}`);
    });
  }

  /**
   * Handle plugin API requests
   */
  private async handlePluginApiRequest(req: any, res: any) {
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(this.pluginPath, 'manifest.json'), 'utf8'));
      const mainFile = path.join(this.pluginPath, manifest.main);
      
      // Load plugin
      delete require.cache[require.resolve(mainFile)];
      const plugin = require(mainFile);

      // Check if plugin has API handler
      if (typeof plugin.handleApiRequest !== 'function') {
        return res.status(404).json({ 
          error: 'Plugin does not support API requests',
          message: 'This plugin does not implement handleApiRequest function'
        });
      }

      // Forward request to plugin
      const result = await plugin.handleApiRequest(req.method, req.path, req.body, req.query);
      
      res.json(result);
    } catch (error) {
      console.error('❌ Plugin API request failed:', error instanceof Error ? error.message : 'Unknown error');
      res.status(500).json({ 
        error: 'Plugin API request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get plugin information
   */
  private getPluginInfo() {
    const manifestPath = path.join(this.pluginPath, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    return {
      name: manifest.name,
      version: manifest.version,
      type: manifest.type,
      description: manifest.description,
      author: manifest.author,
      status: 'running',
      server: {
        port: this.port,
        url: `http://localhost:${this.port}`
      }
    };
  }

  /**
   * Get development server status
   */
  getStatus() {
    return {
      running: this.isRunning,
      port: this.port,
      pluginPath: this.pluginPath,
      watchers: this.watchers.length,
      pluginInfo: this.isRunning ? this.getPluginInfo() : null
    };
  }
}