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
        this.setModules(this.getInteractionModules())

        let configuration = null
        
        // Check the happy path first.  This occurs when there is no 
        // qti-interaction-modules element and there is a non-empty modules attribute.
        if ((this.moduleAttribute.length > 0) && (this.modulesNode === null)) {

            // Load the PCI from the module_resolution.js file found at the
            // URL in the primaryconfiguration or the secondaryconfiguration
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

        // If no primary-configuration attribute exists in qti-interaction-modules, try
        // to build and resolve a primary configuration from scratch.
        if (typeof modules.primaryconfiguration === 'undefined') {

            // TODO:  should we try to load a module_resolution.js at the default URL
            // which is itemPathUri/modules/module_resolution.js  ??

            for (let i=0; i<modules.module.length; i++) {

                if (typeof modules.module[i].primarypath === 'undefined') {
                    // When there is no primaryconfiguration in qti-interaction-modules
                    // AND there is no primary-path on the module, then we cannot resolve
                    // the primaryconfiguration.  Bail.
                    return null
                }

                primaryUrls.push(this.addPathJs(modules.module[i].primarypath))
                // Remove .js from primary path when building a config
                baseConfig.paths[modules.module[i].id] = this.stripPathJs(modules.module[i].primarypath)
            }
            
            let areModulesResolved = await this.resolveConfigurationModules(primaryUrls)

            return (areModulesResolved ? baseConfig : null)
        
        }
        
        // A primary-configuration attribute exists in qti-interaction-modules.
        // Try and resolve this configuration, then use it as the base configuration 
        // with nested module definitions overriding or supplementing the paths.
        const configuration = await this.fetchConfiguration(modules.primaryconfiguration, true, true)

        // No configuration found at the URL for modules.primaryconfiguration.  Bail.
        if (configuration === null) return null

        // Some put ".js" on their configuration paths.  Remove it.
        for (const property in configuration.paths) {
            configuration.paths[property] = this.stripPathJs(configuration.paths[property])
        }

        for (let i=0; i<modules.module.length; i++) {
            if (typeof modules.module[i].primarypath !== 'undefined') {
                // Override the path if one exists.  Create a new path if one does not exist.
                configuration.paths[modules.module[i].id] = this.stripPathJs(this.addPathJs(modules.module[i].primarypath))
            }
        }

        // Now loop through the configuration paths and resolve each path
        let areModulesResolved = await this.resolveConfigurationPathUrls(configuration.paths)

        // If everything resolved, return the configuration
        return (areModulesResolved ? configuration : null)
    }

    async resolveSecondaryConfigurationModules (baseConfig, modules) {

        let fallbackUrls = []

        if (typeof modules.secondaryconfiguration === 'undefined') {

            // TODO:  should we try to load a module_resolution.js at the default URL
            // which is itemPathUri/modules/fallback_module_resolution.js  ??
            
            for (let i=0; i<modules.module.length; i++) {

                if (typeof modules.module[i].fallbackpath === 'undefined') {
                    // If there is no secondaryconfiguration in qti-interaction-modules
                    // AND there is no fallback-path on the module, then we cannot resolve
                    // the secondaryconfiguration.  Bail.
                    return null
                }

                fallbackUrls.push(this.addPathJs(modules.module[i].fallbackpath))
                // Remove .js from fallback path when building a config
                baseConfig.paths[modules.module[i].id] = this.stripPathJs(modules.module[i].fallbackpath)
            }
            
            let areModulesResolved = await this.resolveConfigurationModules(fallbackUrls)

            return (areModulesResolved ? baseConfig : null)
        
        }
        
        // A secondary-configuration attribute exists in qti-interaction-modules.
        // Try and resolve this configuration, then use it as the base configuration 
        // with nested module definitions overriding or supplementing the paths.
        const configuration = await this.fetchConfiguration(modules.secondaryconfiguration, false, true)

        // No configuration found at the URL for modules.primaryconfiguration.  Bail.
        if (configuration === null) return null

        // Some put ".js" on their configuration paths.  Remove it.
        for (const property in configuration.paths) {
            configuration.paths[property] = this.stripPathJs(configuration.paths[property])
        }

        for (let i=0; i<modules.module.length; i++) {
            if (typeof modules.module[i].fallbackpath !== 'undefined') {
                // Override the path if one exists.  Create a new path if one does not exist.
                configuration.paths[modules.module[i].id] = this.stripPathJs(this.addPathJs(modules.module[i].fallbackpath))
            }
        }

        // Now loop through the configuration paths and resolve each path
        let areModulesResolved = await this.resolveConfigurationPathUrls(configuration.paths)

        // If everything resolved, return the configuration
        return (areModulesResolved ? configuration : null)
    }

    async resolveConfigurationPathUrls (paths) {
        let urls = []
        // Now loop through the configuration paths and resolve each path
        for (let i=0; i<paths.length; i++) {
            urls.push(paths[i])
        }

        let areModulesResolved = await this.resolveConfigurationModules(urls)
        return areModulesResolved
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
            configuration = await this.fetchConfiguration(modules.primaryconfiguration, true, false)
        }

        // Bail if we found a pimaryconfiguration
        if (configuration !== null) return configuration

        // Unable to find a primaryconfiguration.  Try to fetch the fallbackconfiguration.
        if (typeof modules.secondaryconfiguration !== 'undefined') {
            configuration = await this.fetchConfiguration(modules.secondaryconfiguration, false, false)
        }

        return configuration
    }

    async fetchConfiguration (url, isPrimary, isConfigurationRelative) {
        try {
            const response = await fetch(url)
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`)
            }

            // Get the config json
            const configuration = await response.json()

            // Adjust relative paths to absolute paths
            let paths = configuration.paths
            for (let path in paths) {
                if (paths[path] !== null && !paths[path].startsWith('http')) {

                    if (isConfigurationRelative)
                        // Paths should be relative to the URL of the configuration
                        paths[path] = `${this.getConfigurationRelativePath(url)}${paths[path]}`
                    else
                        // Paths should be relative to the URL of the item
                        paths[path] = `${this.getItemPathUri()}${paths[path]}`

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
        if (this.modulesNode === null) {
            modules = {
                primaryconfiguration: 'modules/module_resolution.js',
                secondaryconfiguration: 'modules/fallback_module_resolution.js'
            }
            return this.addPackagePath(modules)
        }
        
        //
        // A qti-interaction-modules Node is present in the XML
        //
        const primaryConfiguration = this.modulesNode.getPrimaryConfiguration()
        if (primaryConfiguration.length > 0) {
            modules.primaryconfiguration = primaryConfiguration
        }
        
        const secondaryConfiguration = this.modulesNode.getSecondaryConfiguration()
        if (secondaryConfiguration.length > 0) {
            modules.secondaryconfiguration = secondaryConfiguration
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
        for (let property in { primaryconfiguration: '', secondaryconfiguration: ''}) {
            if ((property in modules) && modules[property] !== null && !modules[property].startsWith('http') ) {
                modules[property] = this.getAbsolutePath(this.getItemPathUri(), modules[property])
            }
        }

        let mods = modules.module

        if (mods !== undefined && mods!== null) {
            for (let i = 0; i < mods.length; i++) {
                let mod = mods[i]
                for (let property in { primarypath: '', fallbackpath: ''}) {
                    if ((property in mod) && mod[property] !== null && !mod[property].startsWith('http') ) {

                        mod[property] = this.getAbsolutePath(this.getItemPathUri(), mod[property])
                    }
                }
            }
        }

        return modules
    }

    getAbsolutePath (base, rel) {
        let st = base.split('/')
        let arr = rel.split('/')
        st.pop()
        // ignore the current file name (or no string)
        // (ignore if "base" is the current folder without having slash in trail)
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == '.') continue

            if (arr[i] == '..') {
                st.pop()
            } else {
                st.push(arr[i])
            }
        }
        return st.join('/')
    }

    getConfigurationRelativePath (path) {
        if (path === null) return ''
        if (path.length === 0) return ''

        const pathLastSlashPos = path.lastIndexOf('/')
        if (pathLastSlashPos < 0) return ''

        // Get everything up to, and including, the last '/'
        return path.substring(0,pathLastSlashPos+1)
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
  