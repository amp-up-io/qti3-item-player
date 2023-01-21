<template>
  <div ref="hotspotchoice" class="qti-hotspot-choice">
    <slot></slot>
  </div>
</template>

<script>
/*
 * The definition of a hotspot choice that can be selected by the candidate. If the delivery system 
 * does not support pointer-based selection then the order in which the choices are given must be the 
 * order in which they are offered to the candidate for selection. For example, the 'tab order' in simple 
 * keyboard navigation. If hotspots overlap then those listed first hide overlapping hotspots that appear 
 * later. The default hotspot, if defined, must appear last.
 */
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiHotspotChoice',

  props: {
    identifier: {
      required: true,
      type: String
    },
    /*
     * The identifier of a template variable that must have a base-type of identifier and be either 
     * single of multiple cardinality. When the associated interaction is part of an Item Template the 
     * value of the identified template variable is used to control the visibility of the choice. When 
     * a choice is hidden it is not selectable and its content is not visible to the candidate unless 
     * otherwise stated.
     */
    templateIdentifier: {
      required: false,
      type: String
    },
    /*
     * The showHide characteristic determines how the visibility of the choice is controlled. If set
     * to 'show' then the choice is hidden by default and shown only if the associated template variable
     * matches, or contains, the identifier of the choice. If set to 'hide' then the choice is shown by
     * default and hidden if the associated template variable matches, or contains, the choice's identifier.
     */
    showHide: {
      required: false,
      type: String,
      default: 'show'
    },
    /*
     * The shape of the hotspot. 
     * Enumerated value set of: { circle | default | ellipse | poly | rect }
     * The default shape refers to the entire area of the associated image.
     */
    shape: {
      required: true,
      type: String
    },
    /*
     * The size and position of the hotspot, interpreted in conjunction with the shape.
     */
    coords: {
      required: true,
      type: String
    },
    /*
     * The alternative text for this (hot) area of the image, if specified it must be treated in the same way 
     * as alternative text for 'img'. For hidden hotspots this label is ignored.
     */
    hotspotLabel: {
      required: false,
      type: String,
      default: ''
    },
    /*
     * Modern way to specify alternative text for this (hot) area of the image
     */    
    ariaLabel: {
      required: false,
      type: String,
      default: ''
    },    

  },

  data () {
    return {
      shapeData: null,
      shapeColorProperties: null,
      checked: 'false',
      isRadio: true,
      isQtiValid: true
    }
  },

  inheritAttrs: true,

  methods: {

    getIdentifier () {
      return this.identifier
    },

    getShape () {
      return this.shape
    },

    getChecked () {
      return this.checked
    },

    setChecked (checked) {
      this.checked = (checked ? 'true' : 'false')
    },

    isChecked () {
      return (this.checked === 'true')
    },

    toggleChecked () {
      this.checked = this.checked === 'true' ? 'false' : 'true'
    },

    getRole () {
      return (this.isRadio ? 'radio' : 'checkbox')
    },

    /**
     * @description Compute an aria label.  First examine the real aria-label attribute.
     * If aria-label is empty, examine the old-school hotspotLabel attribute.
     * @return {String} aria-label or hotspot-label
     */
    getAriaLabel () {
      if (this.ariaLabel.length > 0) return this.ariaLabel
      return this.hotspotLabel
    },

    getShapeColorProperties () {
      return this.shapeColorProperties
    },

    setShapeColorProperties (shapeColorProperties) {
      this.shapeColorProperties = shapeColorProperties
    },

    getShapeData () {
      return this.shapeData
    },

    setShapeData () {
      const data = this.coords.split(',')

      switch (this.shape) {
        case 'circle':
          if (data.length != 3) return

          this.shapeData = data
          return

        case 'rect':
          if (data.length !== 4) return

					data[2] = parseInt(data[2]) - parseInt(data[0]);
					data[3] = parseInt(data[3]) - parseInt(data[1]);
          this.shapeData = data
          return

        case 'poly':
          this.shapeData = this.computePolyShapeData(this.transformPolyCoords(data))
          return

        case 'ellipse':
          // Ellipse is deprecated
          if (data.length != 4) return
          
          this.shapeData = data
          return

        case 'default':
          // This signifies (I think?) that the entire image is a hotspot.
          // Do we ignore the coords?  For now, parse the coords as if
          // this is a rectangle.
          // TODO:
          if (data.length !== 4) return
          
          data[2] = parseInt(data[2]) - parseInt(data[0]);
          data[3] = parseInt(data[3]) - parseInt(data[1]);
          this.shapeData = data
          return
      }
    },

    /**
     * @description Transform QTI poly coords; e.g., an  array with
     * format ["x1","y1","x2","y2","x3","y3"] into a string format where
     * a space separates the points; e.g., "x1,y1 x2,y2, x3,y3"
     * @param {Array} coords ["x1","y1","x2","y2","x3","y3"]
     * @result {String} result "x1,y1 x2,y2, x3,y3"
     */
    transformPolyCoords (coords) {
      
      let result = ''

      // Check for even number of pairs
      if ((coords.length % 2) != 0) return result

      for (let i = 0; i < coords.length; i += 2) {
        result += `${coords[i]},${coords[i+1]}`

        if ((i + 2) < coords.length) {
          result += ' '
        }
      }

      return result
    },

    /**
     * @description Final transform of coordinates into an SVG path.
     * @param {String} coords x1,y1 x2,y2, x3,y3...
     */
    computePolyShapeData (coords) {
      const pos = coords.indexOf(' ')
			const path = [coords.slice(0, pos), 'L', coords.slice(pos)].join(' ')
      return 'M ' + path + ' z'
    },

    /**
     * @description Create an SVG DOM element from component properties
     * plus color theme properties.  
     * Supported shapes are: circle | rect | path | ellipse
     */
    getShapeElement () {
      let element = null

      const shapeData = this.getShapeData()

      if (shapeData == null) return null
  
      switch (this.getShape()) {
        case 'circle':
          element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          element.setAttribute('cx', shapeData[0])
          element.setAttribute('cy', shapeData[1])
          element.setAttribute('r',  shapeData[2])
          break

        case 'rect':
        case 'default':
          element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          element.setAttribute('x', shapeData[0])
          element.setAttribute('y', shapeData[1])
          element.setAttribute('width', shapeData[2])
          element.setAttribute('height', shapeData[3])
          break

        case 'poly':
          element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          element.setAttribute('d', shapeData)
          break

        case 'ellipse':
          // Ellipse is deprecated
          element = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
          element.setAttribute('cx', shapeData[0])
          element.setAttribute('cy', shapeData[1])
          element.setAttribute('rx', shapeData[2])
          element.setAttribute('ry', shapeData[3])
          break

        default:
      }

      if (element !== null) {
        element.setAttribute('class', 'qti3-player-hotspot-choice')
        element.setAttribute('tabindex', '0')
        element.setAttribute('data-identifier', this.getIdentifier())
        element.setAttribute('role', this.getRole())
        element.setAttribute('aria-checked', 'false')
        element.setAttribute('aria-label', this.getAriaLabel())
        element.setAttribute('fill', `${this.shapeColorProperties.fillColor}`)
        element.setAttribute('fill-opacity', `${this.shapeColorProperties.fillOpacity}`)
        element.setAttribute('opacity', `${this.shapeColorProperties.unselectedOpacity}`)
        element.setAttribute('stroke', `${this.shapeColorProperties.strokeColor}`)
        element.setAttribute('stroke-width', `${this.shapeColorProperties.strokeWidth}`)
      }

      return element
    },

    initialize () {
      qtiAttributeValidation.validateShapeAttribute(this.shape)
      
      switch (this.$parent.cardinality) {
        case 'multiple':
          this.isRadio = false
          break
        default:
          // Default to radio.
          this.isRadio = true
          break
      }

      this.setShapeData()
      this.setShapeColorProperties(this.$parent.getShapeColorProperties())
    }
  },

  created () {
    try {
      this.initialize()
    } catch (err) {
      this.isQtiValid = false
      if (err.name === 'QtiValidationException') {
        throw new QtiValidationException(err.message)
      }
    }
  },

  mounted () {
    if (this.isQtiValid) {
      try {
        console.log('[' + this.$options.name + '][Identifier]', this.identifier)
      } catch (err) {
        this.isQtiValid = false
        console.log('[' + this.$options.name + '][ValidationError]', err.name, err.message)
        throw new QtiValidationException(err.message)
      }
    }
  }
}
</script>

<style>
div.qti-hotspot-choice {
  display: none;
}
</style>
