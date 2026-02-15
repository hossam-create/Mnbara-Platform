"use strict";
/**
 * Plugin System Integration Layer
 *
 * Provides a unified interface for the plugin system components.
 * This is a simplified integration layer that re-exports core functionality.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HookSystem = exports.PluginRegistry = exports.PluginLoader = void 0;
// Re-export core components
var PluginLoader_1 = require("../plugin-loader/src/PluginLoader");
Object.defineProperty(exports, "PluginLoader", { enumerable: true, get: function () { return PluginLoader_1.PluginLoader; } });
var PluginRegistry_1 = require("../plugin-registry/src/PluginRegistry");
Object.defineProperty(exports, "PluginRegistry", { enumerable: true, get: function () { return PluginRegistry_1.PluginRegistry; } });
var HookSystem_1 = require("../hook-system/src/HookSystem");
Object.defineProperty(exports, "HookSystem", { enumerable: true, get: function () { return HookSystem_1.HookSystem; } });
//# sourceMappingURL=index.js.map