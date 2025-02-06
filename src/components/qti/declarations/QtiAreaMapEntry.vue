<template>
  <div class="qti-area-map-entry">
    <div class="amp-areamapentry__container">
      <slot></slot>
    </div>
  </div>
</template>

<script>
/*
 * An area mapping is defined by a set of qti-area-map-entry objects, each of which maps an area 
 * of the coordinate space onto a single float. When mapping points each area is tested in 
 * turn, with those listed first taking priority in the case where areas overlap and a point 
 * falls in the intersection.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiParseException from '@/components/qti/exceptions/QtiParseException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'
import BigNumber from 'bignumber.js'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiAreaMapEntry',

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
    /*
     * [1] Multiplicity
     * The mapped value.
     */
    mappedValue: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      value: null,
      valueBaseType: 'float',
      valueCardinality: 'single',
      valueMappedValue: null,
      coordsData: [], // transformed value of coords attribute
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
      return this.value === null
    },

    getBaseType () {
      return this.valueBaseType
    },

    getCardinality () {
      return this.valueCardinality
    },

    setMappedValue (mappedValue) {
      this.valueMappedValue = mappedValue
    },

    getMappedValue () {
      return this.valueMappedValue
    },

    computeMappedValue (textContent) {
      let value = null
      try {
        value = new BigNumber(textContent)
      } catch (err) {
        throw new QtiParseException(err.message)
      }
      return value.toNumber()
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
     * qti-area-map-entry is not supposed to contain any children.
     */
    validateChildren: function () {
      if (this.$slots.default) {
        this.$slots.default.forEach((slot) => {
          if (this.isValidSlot(slot)) {
            throw new QtiValidationException('Invalid Child Node: "' + slot.componentOptions.tag + '"')
          }
        })
      }
      // All good.  Save off our area map entry object.
      this.setValue({
        mapShape: this.getShape(),
        mapCoords: this.getCoordsData(),
        mappedValue: this.getMappedValue(),
      })
    }

  },

  created () {
    try {
      qtiAttributeValidation.validateShapeAttribute(this.shape)
      this.setCoordsData(this.validateCoordsAttribute(this.coords))
      this.setMappedValue(this.computeMappedValue(qtiAttributeValidation.FloatValue(this.mappedValue)))
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
    let node = this.$el.querySelector(`.amp-areamapentry__container`)
    if (this.isQtiValid) {
      this.validateChildren()
      console.log('[' + this.$options.name + '][Value]', this.getValue())
    }
    node.remove()
  }
}
</script>
