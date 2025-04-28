import Vue from 'vue'
// Rules
import QtiResponseCondition from './rules/QtiResponseCondition'
import QtiResponseProcessingFragment from './rules/QtiResponseProcessingFragment'
import QtiSetOutcomeValue from './rules/QtiSetOutcomeValue'
import QtiExitResponse from './rules/QtiExitResponse'
import QtiLookupOutcomeValue from './rules/QtiLookupOutcomeValue'
import QtiResponseIf from './rules/QtiResponseIf'
import QtiResponseElse from './rules/QtiResponseElse'
import QtiResponseElseIf from './rules/QtiResponseElseIf'
import QtiSetTemplateValue from './rules/QtiSetTemplateValue'
import QtiTemplateCondition from './rules/QtiTemplateCondition'
import QtiTemplateIf from './rules/QtiTemplateIf'
import QtiTemplateElse from './rules/QtiTemplateElse'
import QtiTemplateElseIf from './rules/QtiTemplateElseIf'
import QtiTemplateConstraint from './rules/QtiTemplateConstraint'
import QtiSetCorrectResponse from './rules/QtiSetCorrectResponse'
import QtiSetDefaultValue from './rules/QtiSetDefaultValue'
// Expressions
import QtiBaseValue from './expressions/QtiBaseValue'
import QtiContainerSize from './expressions/QtiContainerSize'
import QtiContains from './expressions/QtiContains'
import QtiCorrect from './expressions/QtiCorrect'
import QtiDefault from './expressions/QtiDefault'
import QtiVariable from './expressions/QtiVariable'
import QtiMatch from './expressions/QtiMatch'
import QtiMapResponse from './expressions/QtiMapResponse'
import QtiMapResponsePoint from './expressions/QtiMapResponsePoint'
import QtiIsNull from './expressions/QtiIsNull'
import QtiAnd from './expressions/QtiAnd'
import QtiOr from './expressions/QtiOr'
import QtiNot from './expressions/QtiNot'
import QtiSubtract from './expressions/QtiSubtract'
import QtiSum from './expressions/QtiSum'
import QtiRandom from './expressions/QtiRandom'
import QtiMultiple from './expressions/QtiMultiple'
import QtiOrdered from './expressions/QtiOrdered'
import QtiEqual from './expressions/QtiEqual'
import QtiEqualRounded from './expressions/QtiEqualRounded'
import QtiFieldValue from './expressions/QtiFieldValue'
import QtiRandomFloat from './expressions/QtiRandomFloat'
import QtiRandomInteger from './expressions/QtiRandomInteger'
import QtiIntegerDivide from './expressions/QtiIntegerDivide'
import QtiIntegerModulus from './expressions/QtiIntegerModulus'
import QtiIntegerToFloat from './expressions/QtiIntegerToFloat'
import QtiProduct from './expressions/QtiProduct'
import QtiIndex from './expressions/QtiIndex'
import QtiInside from './expressions/QtiInside'
import QtiMember from './expressions/QtiMember'
import QtiDelete from './expressions/QtiDelete'
import QtiSubstring from './expressions/QtiSubstring'
import QtiStringMatch from './expressions/QtiStringMatch'
import QtiPatternMatch from './expressions/QtiPatternMatch'
import QtiRound from './expressions/QtiRound'
import QtiRoundTo from './expressions/QtiRoundTo'
import QtiTruncate from './expressions/QtiTruncate'
import QtiDivide from './expressions/QtiDivide'
import QtiGt from './expressions/QtiGt'
import QtiGte from './expressions/QtiGte'
import QtiLt from './expressions/QtiLt'
import QtiLte from './expressions/QtiLte'
import QtiMax from './expressions/QtiMax'
import QtiMin from './expressions/QtiMin'
import QtiCustomOperator from './expressions/QtiCustomOperator'
import QtiMathOperator from './expressions/QtiMathOperator'
import QtiMathConstant from './expressions/QtiMathConstant'
import QtiRepeat from './expressions/QtiRepeat'
import QtiStatsOperator from './expressions/QtiStatsOperator'
import QtiGcd from './expressions/QtiGcd'
import QtiLcm from './expressions/QtiLcm'
import QtiPower from './expressions/QtiPower'
import QtiAnyN from './expressions/QtiAnyN'
// Rules
Vue.component('qti-response-condition', QtiResponseCondition)
Vue.component('qti-response-processing-fragment', QtiResponseProcessingFragment)
Vue.component('qti-set-outcome-value', QtiSetOutcomeValue)
Vue.component('qti-exit-response', QtiExitResponse)
Vue.component('qti-lookup-outcome-value', QtiLookupOutcomeValue)
Vue.component('qti-response-if', QtiResponseIf)
Vue.component('qti-response-else', QtiResponseElse)
Vue.component('qti-response-else-if', QtiResponseElseIf)
Vue.component('qti-set-template-value', QtiSetTemplateValue)
Vue.component('qti-template-condition', QtiTemplateCondition)
Vue.component('qti-template-if', QtiTemplateIf)
Vue.component('qti-template-else', QtiTemplateElse)
Vue.component('qti-template-else-if', QtiTemplateElseIf)
Vue.component('qti-template-constraint', QtiTemplateConstraint)
Vue.component('qti-set-correct-response', QtiSetCorrectResponse)
Vue.component('qti-set-default-value', QtiSetDefaultValue)
// Expressions
Vue.component('qti-base-value', QtiBaseValue)
Vue.component('qti-container-size', QtiContainerSize)
Vue.component('qti-contains', QtiContains)
Vue.component('qti-correct', QtiCorrect)
Vue.component('qti-default', QtiDefault)
Vue.component('qti-variable', QtiVariable)
Vue.component('qti-match', QtiMatch)
Vue.component('qti-map-response', QtiMapResponse)
Vue.component('qti-map-response-point', QtiMapResponsePoint)
Vue.component('qti-is-null', QtiIsNull)
Vue.component('qti-and', QtiAnd)
Vue.component('qti-or', QtiOr)
Vue.component('qti-not', QtiNot)
Vue.component('qti-subtract', QtiSubtract)
Vue.component('qti-sum', QtiSum)
Vue.component('qti-random', QtiRandom)
Vue.component('qti-multiple', QtiMultiple)
Vue.component('qti-ordered', QtiOrdered)
Vue.component('qti-equal', QtiEqual)
Vue.component('qti-equal-rounded', QtiEqualRounded)
Vue.component('qti-field-value', QtiFieldValue)
Vue.component('qti-random-float', QtiRandomFloat)
Vue.component('qti-random-integer', QtiRandomInteger)
Vue.component('qti-inside', QtiInside)
Vue.component('qti-integer-divide', QtiIntegerDivide)
Vue.component('qti-integer-modulus', QtiIntegerModulus)
Vue.component('qti-integer-to-float', QtiIntegerToFloat)
Vue.component('qti-product', QtiProduct)
Vue.component('qti-index', QtiIndex)
Vue.component('qti-member', QtiMember)
Vue.component('qti-delete', QtiDelete)
Vue.component('qti-substring', QtiSubstring)
Vue.component('qti-string-match', QtiStringMatch)
Vue.component('qti-pattern-match', QtiPatternMatch)
Vue.component('qti-round', QtiRound)
Vue.component('qti-round-to', QtiRoundTo)
Vue.component('qti-truncate', QtiTruncate)
Vue.component('qti-divide', QtiDivide)
Vue.component('qti-gt', QtiGt)
Vue.component('qti-gte', QtiGte)
Vue.component('qti-lt', QtiLt)
Vue.component('qti-lte', QtiLte)
Vue.component('qti-max', QtiMax)
Vue.component('qti-min', QtiMin)
Vue.component('qti-custom-operator', QtiCustomOperator)
Vue.component('qti-math-operator', QtiMathOperator)
Vue.component('qti-math-constant', QtiMathConstant)
Vue.component('qti-repeat', QtiRepeat)
Vue.component('qti-stats-operator', QtiStatsOperator)
Vue.component('qti-gcd', QtiGcd)
Vue.component('qti-lcm', QtiLcm)
Vue.component('qti-power', QtiPower)
Vue.component('qti-any-n', QtiAnyN)
