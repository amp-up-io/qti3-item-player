<template>
  <div class="qti-inside">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The inside operator takes a single sub-expression which must have a base-type of 'point'. 
 * The result is a single boolean with a value of 'true' if the given point is inside the 
 * area defined by shape and coords. If the sub-expression is a container the result is 'true' 
 * if any of the points are inside the area. 
 * If the sub-expression is NULL then the operator results in NULL.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import QtiEvaluationException from '@/components/qti/exceptions/QtiEvaluationException'
import QtiProcessing from '@/components/qti/processing/utils/QtiProcessing'

const qtiAttributeValidation = new QtiAttributeValidation()
const qtiProcessing = new QtiProcessing()

export default {
  name: 'QtiInside',

  props: {
    /*
     * [1] Multiplicity
     * The shape of the area { circle | default | ellipse | poly | rect }
     */
    shape: {
      type: String,
      required: true
    },
    /*
     * [1] Multiplicity
     * The size and position of the area, interpreted in conjunction with the shape.
     */
    coords: {
      type: String,
      required: true
    },
  },

  data () {
    return {
      value: null,
      valueBaseType: 'boolean',
      valueCardinality: 'single',
      expression: null,
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

    getShape () {
      return this.shape
    },

    getCoordsData () {
      return this.coordsData
    },

    setCoordsData (coordsData) {
      this.coordsData = coordsData
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

    validateCoordsAttribute (coords) {
      let data = coords.split(',')

      switch (this.shape) {
        case 'circle':
          if (data.length != 3) {
            throw new QtiValidationException(`Invalid number of coordinates for ${this.shape} shape. Expected 3, but found: ${data.length}`)
          }
          break

        case 'rect':
          if (data.length != 4) {
            throw new QtiValidationException(`Invalid number of coordinates for ${this.shape} shape. Expected 4, but found: ${data.length}`)
          }
          break

        case 'poly':
          this.validatePolyCoords(data)
          break

        case 'ellipse':
          throw new QtiValidationException(`Ellipse is a deprecated shape.  Not supported.`)

        case 'default':
          // This signifies that the entire image is a target.
          if (data.length != 0) {
            throw new QtiValidationException(`Invalid number of coordinates for ${this.shape} shape. Expected 0, but found: ${data.length}`)
          }
          break
      }

      this.validatePositiveCoords(data)
      return data
    },
    
    validatePolyCoords(coords) {
      const MINIMUM_COORDS_LENGTH = 6

      let sameLastPoint = false
      if ((coords.length > 1) && 
          (coords[0] == coords[coords.length - 2]) && 
          (coords[1] == coords[coords.length - 1])) {
        sameLastPoint = true
      }
      
      let minimumCoordsLength = MINIMUM_COORDS_LENGTH
      if (sameLastPoint) {
        minimumCoordsLength += 2
      }
      
      if (coords.length < minimumCoordsLength) {
        throw new QtiValidationException(`Invalid number of coordinates for ${this.shape} shape. Expected at least: ${minimumCoordsLength}, but found: ${coords.length}`)
      }
      
      if (coords.length >= minimumCoordsLength) {
        if (coords.length % 2 != 0) {
          throw new QtiValidationException(`Invalid number of coordinates for ${this.shape} shape. Expected even number of coordinates, but found: ${coords.length}`)
        }
      }
    },
    
    validatePositiveCoords (coords) {
      for (let i = 0; i < coords.length; i++) {
        if (coords[i] < 0) {
          throw new QtiValidationException(`Coordinate (${coords[i]}) at (${(i + 1)}) cannot be negative.`)
        }
      }
    },

    /**
     * Validate the child node:
     * expressions (1)
     */
    validateChildren: function () {
      let countExpressions = 0

      this.$slots.default.forEach((slot) => {
        if (this.isValidSlot(slot)) {
          // Detect an expression
          if (qtiProcessing.isExpressionNode(slot.componentOptions.tag)) {
            countExpressions += 1
          } else {
            throw new QtiValidationException('Node is not an Expression: "' + slot.componentOptions.tag + '"')
          }
        }
      })

      if (countExpressions !== 1) {
        throw new QtiValidationException('Must have exactly one Expression node')
      }
      // Perform extra semantic validations on the expressions
      this.validateExpressions()
      // All good.  Save off our children.
      this.processChildren()
    },

    validateExpressions () {
      this.$children.forEach((expression) => {
        if (expression.getBaseType() !== 'point') {
          throw new QtiValidationException('Expression must be base-type="point"')
        }
      })
    },

    /**
     * Get the child node:
     * expressions (1)
     */
    processChildren () {
      this.expression = this.$children[0]
    },

    isPointInside (point) {
      return qtiProcessing.isPointInside(this.getShape(), this.getCoordsData(), point)
    },

    evaluate () {
      try {
        let value = this.expression.evaluate()

        if (qtiProcessing.isNullValue(value)) {
          console.log('[Inside] value:', null)
          this.setValue(qtiProcessing.nullValue())
          return this.getValue()
        }

        if (this.expression.getCardinality() === 'single') {
          this.setValue(this.isPointInside(qtiProcessing.toPointObject(value)))

        } else {
          // value is array with format ["x1 y1", "x2 y2", ... "xn yn"]
          this.setValue(false)
          for (let i = 0; i < value.length; i++) {
            // If any point is inside then result is true
            if (this.isPointInside(qtiProcessing.toPointObject(value[i]))) {
              this.setValue(true)
              break // no need to examine more points
            }
          }
        }

        console.log('[Inside] value:', this.getValue())
        return this.getValue()
      } catch (err) {
        if (err.name === 'QtiValidationException') {
          throw new QtiValidationException(err.message)
        } else if (err.nae === 'QtiEvaluationException') {
          throw new QtiEvaluationException(err.message)
        } else {
          throw new Error(err.message)
        }
      }
    }
  },

  created () {
    try {
      qtiAttributeValidation.validateShapeAttribute(this.shape)
      this.setCoordsData(this.validateCoordsAttribute(this.coords))
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      } else {
        throw new Error(err.message)
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
