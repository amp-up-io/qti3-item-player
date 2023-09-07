<template>
  <div ref="gap"
    :data-identifier="identifier"
    :data-match-max="matchMax"
    :data-match-min="matchMin"
    class="ggm-gap">
  </div>
</template>

<script>
import QtiValidationException from '@/components/qti/exceptions/QtiValidationException'
import QtiAttributeValidation from '@/components/qti/validation/QtiAttributeValidation'

const qtiAttributeValidation = new QtiAttributeValidation()

export default {
  name: 'QtiAssociableHotspot',

  props: {
    identifier: {
      required: true,
      type: String
    },
    /*
     * The identifier of a template variable that must have a base-type of identifier and be either single
     * of multiple cardinality. When the associated interaction is part of an Item Template the value of the
     * identified template variable is used to control the visibility of the choice. When a choice is hidden
     * it is not selectable and its content is not visible to the candidate unless otherwise stated.
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
     * This is used to identify the set of entities that can be matched with this choice. This is used to 
     * enable the author to constrain the set of objects that can be matched with the target choice. This 
     * is a list of the identifiers for the objects that can be matched with this choice.
     */
    matchGroup: {
      required: false,
      type: String,
      default: ''
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
    /*
     * The maximum number of choices this choice may be associated with. If match-max is 0 then there is 
     * no restriction.
     */
    matchMax: {
      required: true,
      type: String
    },
    /*
     * The minimum number of choices this choice must be associated with to form a valid response. 
     * If match-min is 0 then the candidate is not required to associate this choice with any others at 
     * all. match-min must be less than or equal to the limit imposed by match-max.
     */
    matchMin: {
      required: false,
      type: String,
      default: '0'
    }
  },

  data () {
    return {
      shapeData: null,
      shapeColorProperties: null,
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

    getShapeData () {
      return this.shapeData
    },

    setShapeData () {
      const data = this.coords.split(',')

      switch (this.getShape()) {
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
          this.shapeData = this.transformPolyCoords(data)
          return

        case 'ellipse':
          // Ellipse is deprecated
          if (data.length != 4) return
          
          this.shapeData = data
          return

        case 'default':
          // This signifies that the entire image is a hotspot.
          // We ignore the coords
          this.shapeData = ''
          return
      }
    },

    /**
     * @description Transform QTI poly coords; e.g., an  array with
     * format ["x1","y1","x2","y2","x3","y3"] into a string format where
     * a space separates the points; e.g., "x1,y1 x2,y2, x3,y3"
     * @param {Array} coords ["x1","y1","x2","y2","x3","y3"]
     * @result {Array} result ["x1 y1","x2 y2","x3 y3"]
     */
    transformPolyCoords (coords) {
      let result = []

      // Check for even number of pairs
      if ((coords.length % 2) != 0) return result

      for (let i = 0; i < coords.length; i += 2) {
        result.push(`${coords[i]} ${coords[i+1]}`)
      }

      return result
    },

    initialize () {
      qtiAttributeValidation.validateShapeAttribute(this.shape)
      this.setShapeData()
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
.ggm-gap {
  position: absolute; 
  border: 1px transparent;
  margin: 0;
  padding: 0;
  z-index: auto;
}

.ggm-gap.target-active {
  background-color: var(--order-target-active-bgc);
  border: 1px dashed;
  opacity: .8;
}

.ggm-gap.target-active.active {
  background-color: var(--order-placeholder-color);
  border: 1px dashed;
  opacity: .8;
}

/* ggm-dragger-placeholder has default .15rem bottom margin.
   Remove the margin-bottom when inside a gap. */
.ggm-gap .ggm-dragger-placeholder {
  margin-bottom: 0;
}

.ggm-gap > .gap-choice-img.draggable {
  display: inline;
  float: left;
  width: auto;
  margin: 0;
  padding: 0;
}

.ggm-gap > .gap-choice-text.draggable {
  display: inline;
  float: left;
  margin: 0 1px 2px 0;
}

.ggm-gap.qti-selections-dark {
  border: 1px solid var(--choice-ctrlh-color);
}

.ggm-gap.qti-selections-light {
  border: 1px solid orange;
}
</style>
