export class PciModuleResolver {

    /*
     * module attribute on the 
     * qti-pci-portable-interaction element
     */
    moduleAttribute = ''
    /*
     * Node of qti-interaction-modules element
     */
    modulesNode = null
    /*
     * data-item-path-uri attribute on the 
     * qti-pci-portable-interaction element.
     */
    itemPathUri = ''
    /*
     * It's complicated :)
     */
    modules = null

    /**
     * 
     * @param {String} moduleAttribute - module attribute on the 
     *                                   qti-pci-portable-interaction element
     * @param {Node} modulesNode       - Node of qti-interaction-modules element
     * @param {String} itemPathUri     - data-item-path-uri attribute on the 
     *                                   qti-pci-portable-interaction element
     * @returns this
     */
    constructor (moduleAttribute, modulesNode, itemPathUri) {
        this.moduleAttribute = moduleAttribute
        this.modulesNode = modulesNode
        this.itemPathUri = itemPathUri
        return this
    }
  
    constants = {
        BASE_CONFIG: {
            waitSeconds: 60,
            paths: {}
        }
    }

    async getConfiguration (callback) {
        const resolvedModules = this.getInteractionModules()
        this.setModules(resolvedModules)

        let configuration = null
        
        if (this.moduleAttribute.length > 0) {
            
            // If we have a named module; i.e., a module attribute, load the PCI from
            // the module_resolution.js file found at the URL in the primaryconfiguration
            // or the fallbackconfiguration
            configuration = await this.getConfigurationFromUrl(this.getModules())

        } else {

            // No module attribute.  Resolve the modules from primary and secondary configs
            configuration = await this.resolveModules(this.getModules())
            
        }

        if (callback) callback(configuration)
    }

    async resolveModules (modules) {
        let configuration = null
        if (modules === null) return configuration

        const baseConfig = this.constants.BASE_CONFIG

        // Attempt to resolve primary config modules
        configuration = await this.resolvePrimaryConfigurationModules(baseConfig, modules)
        
        // Bail if we found a pimaryconfiguration
        if (configuration !== null) return configuration

        // Unable to resolve primary config modules.  Attempt to resolve secondary config modules
        configuration = await this.resolveSecondaryConfigurationModules(baseConfig, modules)

        return configuration
    }

    async resolvePrimaryConfigurationModules (baseConfig, modules) {

        let primaryUrls = []

        if (!('primaryconfiguration' in modules)) {

            for (let i=0; i<modules.module.length; i++) {
                primaryUrls.push(this.addPathJs(modules.module[i].primarypath))
                // Remove .js from primary path when building a config
                baseConfig.paths[modules.module[i].id] = this.stripPathJs(modules.module[i].primarypath)
            }
            
            let areModulesResolved = await this.resolveConfigurationModules(primaryUrls)

            return (areModulesResolved ? baseConfig : null)
        
        } else {
          // fetch modules primaryconfiguration
        }
    }

    async resolveSecondaryConfigurationModules (baseConfig, modules) {

        let fallbackUrls = []

        if (!('secondaryconfiguration' in modules)) {
            
            for (let i=0; i<modules.module.length; i++) {
                fallbackUrls.push(this.addPathJs(modules.module[i].fallbackpath))
                // Remove .js from fallback path when building a config
                baseConfig.paths[modules.module[i].id] = this.stripPathJs(modules.module[i].fallbackpath)
            }
            
            let areModulesResolved = await this.resolveConfigurationModules(fallbackUrls)

            return (areModulesResolved ? baseConfig : null)
        
        } else {
          // fetch modules secondaryconfiguration
        }
    }

    async resolveConfigurationModules (urls) {
        // Any problem with resolution will result in a null result
        const data = await Promise.all(
            urls.map(url =>
                fetch(url)
                    .then(response => {
                        if (response.ok) {
                            console.log('[PCI Parent] Module Loader Success:', url)
                            return response
                        }
                        throw new Error(url)
                    })
            )
        )
        .catch((err) => {
            console.log('[PCI Parent] Module Loader Failure:', err.message)
            return null
        })
  
        return (data === null ? false : true)
    }

    async getConfigurationFromUrl (modules) {
        let configuration = null
        if (modules === null) return configuration

        if (typeof modules.primaryconfiguration !== 'undefined') {
            configuration = await this.fetchConfiguration(modules.primaryconfiguration, true)
        }

        // Bail if we found a pimaryconfiguration
        if (configuration !== null) return configuration

        // Unable to find a primaryconfiguration.  Try to fetch
        // the fallbackconfiguration
        if (typeof modules.fallbackconfiguration !== 'undefined') {
            configuration = await this.fetchConfiguration(modules.fallbackconfiguration, false)
        }

        return configuration
    }

    async fetchConfiguration (url, isPrimary) {
        try {
            const response = await fetch(url)
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`)
            }
            const configuration = await response.json();
            // Adjust relative paths to absolute paths
            let paths = configuration.paths
            for (let path in paths) {
                if (paths[path] !== null && !paths[path].startsWith("http")) {
                    paths[path] = this.getItemPathUri() + paths[path]
                }
            }
            return configuration
        } catch (error) {
            console.log((isPrimary ? 'Primary' : 'Fallback') + 'configuration Fetch error:', error)
            return null
        }        
    }

    getItemPathUri () {
        return this.itemPathUri
    }

    getModules () {
        return this.modules
    }

    setModules (modules) {
        this.modules = modules
    }
    
    getInteractionModules () {
        let modules = {}
        
        // If no qti-interaction-modules present, apply the default
        if (this.modulesNode == null) {
            modules = {
                primaryconfiguration: 'modules/module_resolution.js',
                fallbackconfiguration: 'modules/fallback_module_resolution.js'
            }
            return this.addPackagePath(modules)
        }
        
        //
        // A qti-interaction-modules Node is present in the XML
        //
        if (this.modulesNode.getPrimaryConfiguration().length > 0) {
            modules.primaryconfiguration = this.modulesNode.getPrimaryConfiguration()
        }
        
        if (this.modulesNode.getSecondaryConfiguration().length > 0) {
            modules.secondaryconfiguration = this.modulesNode.getSecondaryConfiguration()
        }

        modules.module = []
        let moduleNodes = this.modulesNode.getModules()
        
        // The specification says that there must be at least one
        // qti-interaction-module element in a qti-interaction-modules element.
        //
        // Loop through all of the qti-interaction-module elements, pulling any
        // primary and fallback paths along the way.
        for (let i=0; i<moduleNodes.length; i++) {
            let m = {
                id: moduleNodes[i].getId()
            }
            
            if (moduleNodes[i].getPrimaryPath().length > 0) {
                m.primarypath = moduleNodes[i].getPrimaryPath()
            }
            
            if (moduleNodes[i].getFallbackPath().length > 0) {
                m.fallbackpath = moduleNodes[i].getFallbackPath()
            }
            
            modules.module.push(m)
        }

        return this.addPackagePath(modules)
    }

    addPackagePath (modules) {
        for (let property in { primaryconfiguration: '', fallbackconfiguration: ''}) {
            if ((property in modules) && modules[property] !== null && !modules[property].startsWith("http") ) {
                modules[property] = this.getItemPathUri() + modules[property]
            }
        }

        let mods = modules.module

        if (mods !== undefined && mods!== null) {
            for (let i = 0; i < mods.length; i++) {
                let mod = mods[i]
                for (let property in { primarypath: '', fallbackpath: ''}) {
                    if ((property in mod) && mod[property] !== null && !mod[property].startsWith("http") ) {
                        mod[property] = this.getItemPathUri() + mod[property]
                    }
                }
            }
        }

        return modules
    }

    stripPathJs (path) {
        if (path === null) return null
        if (path.endsWith('.js')) return path.slice(0, path.lastIndexOf('.'))
        return path
    }

    addPathJs (path) {
        if (path === null) return null
        if ((path.length > 0) && !path.endsWith('.js')) return `${path}.js`
        return path
    }

  }
  