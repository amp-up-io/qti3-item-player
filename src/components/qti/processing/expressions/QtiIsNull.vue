<template>
  <div class="qti-is-null">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The isNull operator takes a sub-expression with any base-type and cardinality. The result is a single
 * boolean with a value of true if the sub-expression is NULL and false otherwise. Note that empty containers
 * and empty strings are both treated as NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiIsNull',

  data () {
    return {
      value: null,
      valueBaseType: 'boolean',
      valueCardinality: 'single',
      child: null,
      isQtiValid: true
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

    getCardinality () {
      return this.valueCardinality
    },

    isValidSlot (slot) {
      if (typeof slot.componentOptions !== 'undefined') {
        return true
      } else {
        // check if text is something not empty
        if ((typeof slot.text !== 'undefined') && (slot.text.trim().length > 0)) {
          // not an empty text slot.  this is an error.
          throw new QtiValidationException('Invalid Child Node: "' + slot.text.trim() + '"')
        } else {
          // empty text slot.  not a component, but not an error
          return false
        }
      }
    },

    /**
     * Iterate through the children nodes:
     * children (1)
     */
    validateChildren: function () {
      let countChildren = 0
      this.$slots.default.forEach((slot) => {
        if (this.isValidSlot(slot)) {
          // Detect a child
          if (qtiProcessing.isExpressionNode(slot.componentOptions.tag)) {
            countChildren += 1
          } else {
            throw new QtiValidationException('Node is not an Expression: "' + slot.componentOptions.tag + '"')
          }
        }
      })
      if (countChildren !== 1) {
        throw new QtiValidationException('Must have exactly one child node')
      }
      // All good.  Save off our child.
      this.processChildren()
    },

    processChildren () {
      this.child = this.$children[0]
    },

    evaluate () {
      try {
        this.child.evaluate()
        this.setValue(this.child.isNull())
        return this.getValue()
      } catch (err) {
        this.value = null
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.name === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        this.validateChildren()
      } catch (err) {
        this.isQtiValid = false
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>
