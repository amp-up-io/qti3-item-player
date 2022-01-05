<template>
  <div class="qti-custom-operator">
    <component :is="customOperatorTemplate" v-on:customOperatorReady="handleCustomOperatorReady">
      <slot></slot>
    </component>
  </div>
</template>

<script>
/*
 * The custom operator provides an extension mechanism for defining operations or
 * expressions not currently supported by the QTI 3 specification.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'
import { getCustomOperatorSubType, customOperatorAdapter } from './custom/custom-operator-adapter'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiCustomOperator',

  props: {
    /*
     * Typically used to provide additional information or parameters
     * to the custom operator.
     */
    definition: {
      type: String,
      required: false,
      default: ''
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: null,
      valueCardinality: null,
      // This resolves to the child component node which MUST contain an evaluate method.
      expression: null,
      operatorSubType: null,
      isQtiValid: true
    }
  },

  computed: {
    /**
     * @description Compute a template - according to the operatorSubType.
     */
    customOperatorTemplate () {
      return customOperatorAdapter(this.operatorSubType, this.$props)
    }
  },

  methods: {

    getValue () {
      return this.value
    },

    setValue (value) {
      this.value = value
    },

    isNull () {
      return qtiProcessing.isNullValue(this.value)
    },

    getBaseType () {
      return this.valueBaseType
    },

    setBaseType (baseType) {
      this.valueBaseType = baseType
    },

    getCardinality () {
      return this.valueCardinality
    },

    setCardinality (cardinality) {
      this.valueCardinality = cardinality
    },

    /**
     * @description attempt to parse the operator component
     * from the staticClass property of this $vnode.
     * Throws an exception if none found.
     * @param staticClass property of the $vnode.data object
     */
    detectOperatorSubType (staticClass) {
      return getCustomOperatorSubType(staticClass)
    },

    handleCustomOperatorReady (node) {
      this.setBaseType(node.baseType)
      this.setCardinality(node.cardinality)
      // This gives us a handle on the custom operator child's evaluate method
      this.expression = node
    },

    evaluate () {
      try {

        // Bail if we somehow get here and the operatorSubType is null.
        if (this.operatorSubType === null) {
          this.setValue(qtiProcessing.nullValue())
          console.log('[CustomOperator][UNSUPORTED_CUSTOM_OPERATOR][Value]', this.getValue())
          return this.getValue()
        }

        const value = this.expression !== null ? this.expression.evaluate() : qtiProcessing.nullValue()
        this.setValue(value)
        console.log('[CustomOperator][' + this.operatorSubType + '][Value]', this.getValue())
        return this.getValue()
      } catch (err) {
        if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }
  },

  created () {
    try {
      this.operatorSubType = this.detectOperatorSubType(this.$vnode.data.staticClass)
      if (this.operatorSubType === null) {
        throw new QtiValidationException('Unsupported Custom Operator [' + this.$vnode.data.staticClass + ']')
      }
    } catch (err) {
      this.isQtiValid = false
      throw new QtiValidationException(err.message)
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        // TODO ??
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
