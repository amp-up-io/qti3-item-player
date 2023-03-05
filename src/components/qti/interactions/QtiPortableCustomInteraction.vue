<template>
  <div ref="root" class="qti-portable-custom-interaction">

    <slot name="prompt"/>

    <div ref="pcigroup" class="qti3-player-pci-group">
      <slot name="default"></slot>
    </div>

    <div ref="ic" class="qti3-player-pci-iframe-container">
    </div>

  </div>
</template>

<script>
/*
 * The PortableCustom Interaction (PCI) is a container that enables the placement 
 * of PCIs in the assessment activity. The supplied information enables the launch 
 * and collection of state information from the actual PCI as defined by the PCI 
 * specification [PCI, 20].
 * 
 * The PCI container has 5 possible child elements:
 * 
 * qti-prompt [0..1]
 * qti-interaction-modules [0..1]
 * qti-interaction-markup [1]
 * qti-template-variable [0..unbounded]
 * qti-context-variable [0..unbounded]
 */
import Vue from 'vue'
import { store } from '@/store/store'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiPrompt from '@/components/qti/interactions/QtiPrompt'
import QtiInteractionModules from '@/components/qti/interactions/pci/QtiInteractionModules'
import QtiInteractionMarkup from '@/components/qti/interactions/pci/QtiInteractionMarkup'

Vue.component('qti-prompt', QtiPrompt)
Vue.component('qti-interaction-modules', QtiInteractionModules)
Vue.component('qti-interaction-markup', QtiInteractionMarkup)

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiPortableCustomInteraction',

  props: {
    responseIdentifier: {
      required: true,
      type: String
    },
    /*
     * This identifies the particular custom interaction type this 
     * qti-portable-custom-interaction-instance represents. It is recommended 
     * that a Federated Content URN [RFC 4198] is used as the value of this URI 
     * to prevent namespace collisions across implementations.
     */
    customInteractionTypeIdentifier: {
      required: true,
      type: String
    },
    /*
     * This optional attribute may be used to provide the Module Id which would be 
     * passed at runtime to the PCI API to dynamically load the Javascript module which 
     * implements the functionality of this custom interaction. If this characteristic 
     * is provided the qti-interaction-modules child attribute is not required, if 
     * omitted then the modules child element is mandatory.
     */
    module: {
      required: false,
      type: String,
      default: ''
    },
    /*
     * Note: This is a custom attribute to permit QTI 3 Item Player to locate modules.
     * Use this to define the Storage location of the item and the PCI's modules.
     */
    dataItemPathUri: {
      required: false,
      type: String,
      default: ''
    }
  },

  inheritAttrs: true,

  data () {
    return {
      response: null,
      state: null,
      baseType: null,
      cardinality: null,
      isValidResponse: false,
      isQtiValid: true,

      classAttribute: '',
      modulesNode: null,
      modules: null,
      moduleResolution: null,
      uniqueId: null,
      pciIframe: null,
      initialWidth: 0,

      // Use this to determine if we can remove listeners in beforeDestroy
      hasPciListener: false,

      // If we are restoring, this is where we save the prior variable state
      priorState: null
    }
  },

  methods: {

    /**
     * @description Get this interaction's response.
     * @return {Generic} response - depending on baseType and cardinality
     */
    getResponse () {
      return this.response
    },

    /**
     * @description Set this interaction's response
     * @param {Generic} response - depending on baseType and cardinality
     */
    setResponse (response) {
      this.response = response
    },

    /**
     * @description Get this interaction's state.
     * @return {Object} state
     */
    getState () {
      return this.state
    },

    /**
     * @description Set/restore this interaction's state.
     * @param {Object} state
     */
    setState (state) {
      this.state = state
    },

    /**
     * @description Get this interaction's response validity.
     * @return {Boolean} isValidResponse
     */
    getIsValid () {
      return this.isValidResponse
    },

    /**
     * @description Set this interaction's response validity.
     * @param {Boolean} isValid
     */
    setIsValid (isValid) {
      this.isValidResponse = isValid
    },

    /**
     * @description Get this interaction's invalid response message.
     * @return {String} custom message
     */
    getInvalidResponseMessage () {
      return ''
    },

    /**
     * @description Reset this interaction's response and UI.
     */
    resetValue () {
      console.log('[ResetValue][identifier]', this.responseIdentifier)

      // When a new template, smoke the priorState
      this.priorState = null
    },

    /**
     * @description Restores this interaction's response.  Also
     * restores this interaction's response validity.
     * @param {Generic} response
     */
    restoreValue (response) {
      if (response === null) return

      this.setResponse(response)
      this.setState(this.computeState())
      // When restoring, manually update validity
      this.updateValidity(this.computeIsValid())
    },

    /**
     * @description Computes this interaction's cardinality.
     * Side effect: sets the model's cardinality property.
     * @return {String} - cardinality of the response variable
     */
    getCardinality () {
      let rv = store.getResponseDeclaration(this.responseIdentifier)
      this.cardinality = rv.getCardinality()
      return this.cardinality
    },

    /**
     * @description Computes this interaction's baseType.
     * Side effect: sets the model's baseType property.
     * @return {String} - baseType of the response variable
     */
     getBaseType () {
      let rv = store.getResponseDeclaration(this.responseIdentifier)
      this.baseType = rv.getBaseType()
      return this.cardinality
    },

    /**
     * @description Iterate through $slots. Finds the first (if any) qti-prompt component.
     * @param {Array} slots
     * @return {Array} prompt component(s)
     */
    getPrompt (slots) {
      let prompt = []

      if (!('default' in slots)) return prompt

      slots.default.forEach((vnode, index, defaultSlots) => {
        // Only check for qti-prompt, skipping text nodes.
        if (typeof vnode.componentOptions !== 'undefined') {
          if (vnode.componentOptions.tag === 'qti-prompt') {
            prompt.push(vnode)
            defaultSlots.splice(index, 1)
            return // bail out of loop
          }
        }
      })

      return prompt
    },

    /**
     * @description Return an empty object as we do not track any other 
     * state properties as of 1/5/2023.
     * @return {Object} state object
     */
    computeState () {
      const state = {}
      return state
    },

    /**
     * @description The determines an interaction's validity status.
     * @return {Boolean} (true if valid, false if invalid)
     */
    computeIsValid () {
      return true
    },

    /**
     * @description Evaluate the interaction's response validity.
     * Update the interaction's validity if there is a change.
     */
    evaluateValidity () {
      // Save old validity value
      const priorValidity = this.getIsValid()
      // Compute new validity value
      const currentValidity = this.computeIsValid()
      // Bail if no change
      if (priorValidity === currentValidity) return
      // There is a change.
      this.updateValidity(currentValidity)
    },

    /**
     * @description Update the interaction's validity.
     * @param {Boolean} isValid
     */
    updateValidity (isValid) {
      this.setIsValid(isValid)
      store.setInteractionIsValidResponse({
          identifier: this.responseIdentifier,
          isValidResponse: isValid
        })
    },

    validateChildren () {
      // No validation.  Save off our children.
      this.processChildren()

      // Restore priorState - if any
      if (this.priorState !== null) {
        this.restoreValue(this.priorState.value)
      }

      this.initialize()
    },

    processChildren () {
      this.$children.forEach((node) => {
        if (node.$vnode.componentOptions.tag === 'qti-interaction-markup') {
          this.markup = node.getMarkup()
        } else if (node.$vnode.componentOptions.tag === 'qti-interaction-modules') {
          this.modulesNode = node
        }
      })
    },

    disable () {
    },

    /**
     * @description Retrieve this interaction's prior state.
     * When not null, has this schema:
     * {
     *   identifier: [String],
     *   value: <Generic>
     *   state: <Generic>
     * }
     * @param {String} identifier - of a response variable
     * @return {Object} - a prior state or null
     */
    getPriorState (identifier) {
      const priorState = store.getItemContextStateVariable(identifier)

      // If priorState is null, we are not restoring anything
      if (priorState === null) return null

      // Perform basic consistency checking on this priorState
      if (!('value' in priorState)) {
        throw new QtiEvaluationException('PCI State Invalid.  "value" property not found.')
      }
      if (!('state' in priorState)) {
        throw new QtiEvaluationException('PCI State Invalid.  "state" property not found.')
      }

      return priorState
    },

    createId () {
      return 'pci_' + qtiAttributeValidation.randomString (5, 'a')
    },

    initialize () {
      this.initialWidth = this.$refs.root.clientWidth
      const resolvedModules = this.getInteractionModules(this.getItemPathUri())
      this.setModules(resolvedModules)
      this.bindWindowMessageListener()

      if (this.module.length > 0) {

        // If we have a named module; i.e., a module attribute, load the PCI from
        // the module_resolution.js file found at the URL in the primaryconfiguration.
        this.loadPciFromResolutionUrl(this.getModules(), true)

      } else {

        // No module attribute.  Resolve the modules from primary and secondary configs
        this.resolveModules(this.getModules(), function(moduleResolution) {
            if (moduleResolution != null) {
              this.loadPciFromResolutionJson(moduleResolution)
              return
            }
            
            // Unable to resolve primary and secondary configuration modules
            // What should we do?  Throw error?

          }.bind(this))

      }
    },

    resolveModules (modules, callback) {
      let that = this

      const baseConfig = {
        waitSeconds: 60,
        paths: {}
      }

      this.resolvePrimaryConfigurationModules(baseConfig, modules, function(config) {
        if (config != null) {
          callback(config)
          return
        }
        
        // Unable to resolve primary config modules.  Attempt to resolve secondary config modules
        that.resolveSecondaryConfigurationModules (baseConfig, modules, function(config) {
          callback(config)
        })
      })
    },

    resolvePrimaryConfigurationModules (baseConfig, modules, callback) {

      let primaryUrls = []

      if (!('primaryconfiguration' in modules)) {
        for (let i=0; i<modules.module.length; i++) {
          primaryUrls.push(this.addPathJs(modules.module[i].primarypath))
          // Remove .js from fallback path when building a config
          baseConfig.paths[modules.module[i].id] = this.stripPathJs(modules.module[i].primarypath)
        }

        this.resolveConfigurationModules(primaryUrls, function(isModulesResolved) {
          if (isModulesResolved) {
            callback(baseConfig)
          } else {
            callback(null)
          }
        })

      } else {
        // fetch modules primaryconfiguration
      }
    },

    resolveSecondaryConfigurationModules (baseConfig, modules, callback) {

      let fallbackUrls = []

      if (!('secondaryconfiguration' in modules)) {
        for (let i=0; i<modules.module.length; i++) {
          fallbackUrls.push(this.addPathJs(modules.module[i].fallbackpath))
          // Remove .js from fallback path when building a config
          baseConfig.paths[modules.module[i].id] = this.stripPathJs(modules.module[i].fallbackpath)
        }

        this.resolveConfigurationModules(fallbackUrls, function(isModulesResolved) {
          if (isModulesResolved) {
            callback(baseConfig)
          } else {
            callback(null)
          }
        })

      } else {
        // fetch modules secondaryconfiguration
      }

    },

    async resolveConfigurationModules (urls, callback) {
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

      if (data === null)
        callback(false)
      else
        callback(true)
    },

    resolveModule (module) {

      // Fetch module_resolution.
      fetch(module)
        .then(this.checkFetchStatus)
        .then(response => {
          if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          } else {
            console.log(`module found: ${module}`)
          }
        })
        .catch(function(error) {
          console.log( 'module Fetch error:', error)
        })

    },

    onModuleLoaded (response) {
      let that = this

      response
        .then(function(moduleResolution) {
          // Adjust relative paths to absolute paths
          let paths = moduleResolution.paths
          for (let path in paths) {
            if (paths[path] !== null && !paths[path].startsWith("http")) {
              paths[path] = that.getItemPathUri() + paths[path]
            }
          }
          that.setModuleResolution(moduleResolution)
          that.loadPciIframe(that.initialWidth)
        })
    },

    loadPciFromResolutionJson (moduleResolutionJson) {
      this.setModuleResolution(moduleResolutionJson)
      this.loadPciIframe(this.initialWidth)
    },

    loadPciFromResolutionUrl (modules, isPrimary) {
      const moduleResolutionUrl = 
        (isPrimary ? modules.primaryconfiguration : modules.fallbackconfiguration)

      // Fetch module_resolution.
      fetch(moduleResolutionUrl)
        .then(this.checkFetchStatus)
        .then(this.onModuleResolutionLoaded.bind(this))
        .catch(function(error) {
          console.log((isPrimary ? 'Primary' : 'Fallback') + 'module_resolution Fetch error:', error)
          
          // If we die during the primary config fetch, try the fallback config fetch
          if (isPrimary) {
            this.loadPciFromResolutionUrl(modules, false)
          }
        })
    },

    checkFetchStatus (response) {
      if (response.status >= 200 && response.status < 300) {
        return response
      }

      let error = new Error(response.statusText)
      error.response = response
      throw error
    },

    onModuleResolutionLoaded (response) {
      let that = this

      response
        .json()
        .then(function(moduleResolution) {
          // Adjust relative paths to absolute paths
          let paths = moduleResolution.paths
          for (let path in paths) {
            if (paths[path] !== null && !paths[path].startsWith("http")) {
              paths[path] = that.getItemPathUri() + paths[path]
            }
          }
          that.setModuleResolution(moduleResolution)
          that.loadPciIframe(that.initialWidth)
        })
    },

    loadPciIframe (width) {
      let iframe = document.createElement('iframe')
      iframe.name = this.uniqueId
      iframe.id = this.uniqueId
      iframe.setAttribute('scrolling', 'no')
      iframe.style.border = 'none'
      iframe.style.width = `${width}px`
      // bind before set src attribute!
      iframe.onload = this.handleLoadIframe.bind(this)
      iframe.src = `./assets/pci/pci.html?identifier=${this.responseIdentifier}`

      // Inject the frame into the container
      this.$refs.ic.appendChild(iframe)
    },

    handleLoadIframe (event) {
      // Save off the iframe element
      this.pciIframe = event.target
    },

    resizePciIframe (height, width) {
      this.pciIframe.style.height = `${height}px`
      this.pciIframe.style.width = `${width}px`
    },

    getItemPathUri () {
      return this.dataItemPathUri
    },

    getProperties (pci) {
      const properties = {};
      for (let key in pci.dataset) {
        if ('uniqueId' !== key) {
          properties[key] = pci.dataset[key]
        }
      }

      return properties
    },

    getModules () {
      return this.modules
    },

    setModules (modules) {
      this.modules = modules
    },

    getInteractionModules () {
      let modules = {}

      if (this.modulesNode != null) {

        if (this.modulesNode.getPrimaryConfiguration().length > 0) {
          modules.primaryconfiguration = this.modulesNode.getPrimaryConfiguration()
        }
        if (this.modulesNode.getSecondaryConfiguration().length > 0) {
          modules.secondaryconfiguration = this.modulesNode.getSecondaryConfiguration()
        }

        modules.module = []
        let moduleNodes = this.modulesNode.getModules()
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
      } else {
        // No qti-interaction-modules present, so apply the default
        modules = {
          primaryconfiguration: 'modules/module_resolution.js',
          fallbackconfiguration: 'modules/fallback_module_resolution.js'
        }
      }

      return this.addPackagePath(modules)
    },

    getModuleResolution () {
      return this.moduleResolution
    },

    setModuleResolution (moduleResolution) {
      this.moduleResolution = moduleResolution
    },

    getClassAttribute () {
      return this.classAttribute
    },

    setClassAttribute (classAttribute) {
      this.classAttribute = classAttribute
    },
    
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
    },

    copyAttributes (attributes, collection, element) {
      attributes.forEach(function(name) {
        let identifier = name.replace('-', '')
        collection[identifier] = element.getAttribute(name)
      })
      return collection
    },

    stripPathJs (path) {
      if (path === null) return null
      if (path.endsWith('.js')) return path.slice(0, path.lastIndexOf('.'))
      return path
    },

    addPathJs (path) {
      if (path === null) return null
      if ((path.length > 0) && !path.endsWith('.js')) return `${path}.js`
      return path
    },

    bindWindowMessageListener () {
      window.addEventListener('message', this.windowMessageListener.bind(this))
      // Set this so we can be sure to remove the listener on destroy
      this.hasPciListener = true
    },
    
    windowMessageListener (event) {
      // Ignore all messages not from our pci_iframe
      if (event.source.name !== this.uniqueId) return
      
      switch (event.data.message) {
        case 'PciChildLoaded':
          // Message we receive from the child frame once the child frame loads
          console.log('[PCI Parent] PCI Frame Loaded: ' + event.data.identifier)
          this.pciInitialize()
          break

        case 'PciReady':
          // Message we receive from the PCI at the end of a getInstance.
          // This message includes a PCI's rendered width and height.
          console.log('[PCI Parent] PCI Ready: ' + event.data.identifier + ', height: '+event.data.height + ', width: '+event.data.width)
          this.resizePciIframe(event.data.height, this.initialWidth)
          break

        case 'PciResize':
          console.log('[PCI Parent] PCI Resize: ', + event.data.identifier + ', height:' + event.data.height + ', width:' + event.data.width)
          // Resize the iframe
          this.resizePciIframe(event.data.height, event.data.width)
          break

        default:
          console.log('[PCI Parent] Unknown Message: ' + event.data.message)
      }
    },

    pciInitialize () {
      // Create an object representing this qti-portable-interaction instance
      let pci = {
        typeIdentifier: this.customInteractionTypeIdentifier,
        classAttribute: this.getClassAttribute(),
        markup: this.markup,
        properties: this.getProperties(this.$refs.root),
        module: this.module,
        modules: this.getModules(),
        moduleResolution: this.getModuleResolution()
      }
      
      this.pciIframe.contentWindow.postMessage({ 
          message: 'PciLoadInteraction', 
          pci: JSON.stringify(pci) 
        }, '*')
    }

  },

  created () {
    try {
      this.responseDeclaration = qtiAttributeValidation.validateResponseIdentifierAttribute(store, this.responseIdentifier)

      const staticClass = (typeof this.$vnode.data.staticClass !== 'undefined') ? this.$vnode.data.staticClass : ''
      this.setClassAttribute(staticClass)

      // Pull any prior interaction state.
      this.priorState = this.getPriorState(this.responseIdentifier)

      this.$slots.prompt = this.getPrompt(this.$slots)

      this.uniqueId = this.createId()
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else if (err.name === 'QtiParseException') {
        throw new QtiParseException(err.message)
      } else {
        throw new Error(err.message)
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.validateChildren()

        // Notify store of our new interaction
        store.defineInteraction({
            identifier: this.responseIdentifier,
            interactionType: 'PortableCustom',
            node: this,
            resetValue: this.resetValue,
            disable: this.disable,
            isValidResponse: this.getIsValid(),
            invalidResponseMessage: this.getInvalidResponseMessage(),
            maxSelectionsMessage: ''
          })

        console.log('[' + this.$options.name + '][Identifier]', this.responseIdentifier)
      } catch (err) {
        this.isQtiValid = false
        console.log('[' + this.$options.name + '][ValidationError]', err.name, err.message)
        throw new QtiValidationException(err.message)
      }
    }
  },

  beforeDestroy () {
    if (this.hasPciListener) {
      window.removeEventListener('message', this.windowMessageListener)
      this.pciIframe.removeEventListener('load', this.handleLoadIframe)
    }
  }
}
</script>

<style>
div.qti-portable-custom-interaction {
  display: inline-block;
  width: 100%;
}

div.qti3-player-pci-group {
  display: none;
}

div.qti3-player-pci-iframe-container {
  display: inline-block;
  width: 100%;
  overflow: hidden;
}
</style>
