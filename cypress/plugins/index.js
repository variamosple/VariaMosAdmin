const path = require('path');

/**
 * Cypress Plugin Configuration File (Cypress v9)
 * 
 * This is a generic bridge loader. It allows individual test modules
 * (like the admin module) to define their own isolated database helpers
 * and run Node.js tasks without polluting the global Cypress configuration.
 */
module.exports = (on, config) => {
  on('task', {
    /**
     * Dynamically executes a function from a specific module database helper.
     * 
     * @param {Object} options
     * @param {string} options.scriptPath - Relative path from this file to the helper script
     * @param {string} options.functionName - Name of the function to execute
     * @param {any} options.args - Arguments to pass to the function
     */
    async runModuleDbScript({ scriptPath, functionName, args }) {
      const absolutePath = path.resolve(__dirname, scriptPath);
      
      try {
        // Clear Node.js require cache for this file to ensure any changes are picked up instantly
        delete require.cache[require.resolve(absolutePath)];
        // Dynamically require the module helper
        const moduleHelper = require(absolutePath);
        
        if (typeof moduleHelper[functionName] !== 'function') {
          throw new Error(`Function "${functionName}" not found in database helper at: ${absolutePath}`);
        }
        
        // Execute the database helper function and return the result
        const result = await moduleHelper[functionName](args);
        return result !== undefined ? result : null;
      } catch (error) {
        console.error(`Error executing database task "${functionName}" on script "${scriptPath}":`, error);
        throw error;
      }
    }
  });

  return config;
};
