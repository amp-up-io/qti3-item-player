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
import { PciModuleResolver } from '@/components/qti/interactions/pci/PciModuleResolver'
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiPrompt from '@/components/qti/interactions/QtiPrompt'
import QtiInteractionModules from '@/components/qti/interactions/pci/QtiInteractionModules'
import QtiInteractionMarkup from '@/components/qti/interactions/pci/QtiInteractionMarkup'
import QtiTemplateVariable from '@/components/qti/interactions/pci/QtiTemplateVariable'
import QtiContextVariable from '@/components/qti/interactions/pci/QtiContextVariable'

Vue.component('qti-prompt', QtiPrompt)
Vue.component('qti-interaction-modules', QtiInteractionModules)
Vue.component('qti-interaction-markup', QtiInteractionMarkup)
Vue.component('qti-template-variable', QtiTemplateVariable)
Vue.component('qti-context-variable', QtiContextVariable)

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
      pciModuleResolver: null,

      classAttribute: '',
      properties: {},
      modulesNode: null,
      modules: null,
      configuration: null,
      templateVariables: [],
      contextVariables: [],
      uniqueId: null,
      pciIframe: null,
      isReady: false,
      initialWidth: 0,

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
     * @description Initiate an async PciGetState_Request.  When the PCI has 
     * a reply it will send a PciGetState_Reply message containing the 
     * state and response.
     */
    getStateRequest () {
      this.pciIframe.contentWindow.postMessage({ 
          message: 'PciGetState_Request'
        }, '*')
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
     * @description Restores this interaction's response and state.
     * @param {Generic} response
     * @param {Generic} state
     */
    restoreValue (response, state) {
      this.setResponse(response)
      this.setState(state)
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
        this.restoreValue(this.priorState.value, this.priorState.state)
      }

      this.initialWidth = this.$refs.root.clientWidth
    },

    processChildren () {
      this.$children.forEach((node) => {
        if (node.$vnode.componentOptions.tag === 'qti-interaction-markup') {
          this.markup = node.getMarkup()
        } else if (node.$vnode.componentOptions.tag === 'qti-interaction-modules') {
          this.modulesNode = node
        } else if (node.$vnode.componentOptions.tag === 'qti-template-variable') {
          this.templateVariables.push(node)
        } else if (node.$vnode.componentOptions.tag === 'qti-context-variable') {
          this.contextVariables.push(node)
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
      // Get properties
      this.setProperties(this.getPciProperties())
      // Set up the PciModuleResolver
      this.pciModuleResolver = new PciModuleResolver(this.module, this.modulesNode, this.dataItemPathUri)
      // Get the PCI's configuration
      this.pciModuleResolver.getConfiguration(function(configuration) {
        // Save it for later
        this.setConfiguration(configuration)

        console.log('[PCI Parent] PCI Configuration:', configuration)

        // Bail if we were unable to resolve a good configuration
        // TODO: Throw an exception?
        if (configuration === null) return

        // Launch!
        this.loadPciIframe(this.initialWidth)
      }.bind(this))
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

    getItemPathUri () {
      return this.dataItemPathUri
    },

    getPciProperties () {
      let pci = this.$refs.root

      const properties = {}
      for (let key in pci.dataset) {
        if ('uniqueId' !== key) {
          properties[key] = pci.dataset[key]
        }
      }

      return properties
    },

    getProperties () {
      return this.properties
    },

    setProperties (properties) {
      this.properties = properties
    },

    getContextVariables () {
      let contextVariablesObject = {}
      for (let i=0; i<this.contextVariables.length; i++) {
        contextVariablesObject[this.contextVariables[i].getIdentifier()] = this.contextVariables[i].evaluate()
      }
      return contextVariablesObject
    },

    getTemplateVariables () {
      let templateVariablesObject = {}
      for (let i=0; i<this.templateVariables.length; i++) {
        templateVariablesObject[this.templateVariables[i].getIdentifier()] = this.templateVariables[i].evaluate()
      }
      return templateVariablesObject
    },

    getModules () {
      return this.modules
    },

    setModules (modules) {
      this.modules = modules
    },

    getConfiguration () {
      return this.configuration
    },

    setConfiguration (configuration) {
      this.configuration = configuration
    },

    getClassAttribute () {
      return this.classAttribute
    },

    setClassAttribute (classAttribute) {
      this.classAttribute = classAttribute
    },

    copyAttributes (attributes, collection, element) {
      attributes.forEach(function(name) {
        let identifier = name.replace('-', '')
        collection[identifier] = element.getAttribute(name)
      })
      return collection
    },

    /**
     * @description Build a PciLoadInteraction message payload and send the
     * message to the pciIframe.  Optionally, include a priorState in the 
     * message payload.
     */
    pciInitialize () {
      // Create an object representing this qti-portable-interaction instance
      let pci = {
        typeIdentifier: this.customInteractionTypeIdentifier,
        classAttribute: this.getClassAttribute(),
        markup: this.markup,
        properties: this.getProperties(),
        templateVariables: this.getTemplateVariables(),
        contextVariables: this.getContextVariables(),
        module: this.module,
        modules: this.getModules(),
        moduleResolution: this.getConfiguration()
      }

      // Initialize the PciLoadInteraction message
      let message = { 
        message: 'PciLoadInteraction', 
        pci: JSON.stringify(pci)
      }

      // Add state to the PciLoadInteraction message 
      // if there is a priorState.
      if (this.priorState !== null) {
        message.state = JSON.stringify({
            response: this.getResponse(),
            state: this.getState()
          })
      }
      
      this.pciIframe.contentWindow.postMessage(message, '*')
    },

    /**
     * @description Set pciIframe's height and width.
     * @param {*} height 
     * @param {*} width 
     */
    pciResizeIframe (height, width) {
      if (this.pciIframe === null) return
      this.pciIframe.style.height = `${height}px`
      this.pciIframe.style.width = `${width}px`
    },

    /**
     * @description Persist the state passed in the state parameter.
     * @param {String} state containing two stringified properties: response and state
     */
    pciSaveState (state) {
      const stateObject = JSON.parse(state)
      if (typeof stateObject.response !== 'undefined') {
        this.setResponse(stateObject.response)
      } else {
        this.setResponse(null)
      }

      if (typeof stateObject.state !== 'undefined') {
        this.setState(stateObject.state)
      } else {
        this.setState(null)
      }

      // Notify store that we have completed our state saving
      this.notifyInteractionStateReady()
    },

    pciSetReady () {
      this.isReady = true
    },

    pciIsReady () {
      return (this.pciIframe !== null && this.isReady)
    },

    /**
     * @description Notify the item that this PCI's state has been retrieved
     * and persisted. Prior to calling this method, be sure to save the 
     * interaction's state via the pciSaveState method.
     */
    notifyInteractionStateReady () {
      // Pass this interaction's responseIdentifier
      store.NotifyInteractionStateReady({ identifier: this.responseIdentifier })
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

        // Build a configuration and load the PCI
        this.initialize()

        console.log('[' + this.$options.name + '][Identifier]', this.responseIdentifier)
      } catch (err) {
        this.isQtiValid = false
        console.log('[' + this.$options.name + '][ValidationError]', err.name, err.message)
        throw new QtiValidationException(err.message)
      }
    }
  },

  beforeDestroy () {
    if (this.pciIframe !== null) {
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
