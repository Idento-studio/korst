import {buildLegacyTheme} from 'sanity'

/** Kleuren uit het KORST-brandbook. */
const korst = {
  tomato: '#E8462C',
  tomatoDark: '#C9351D',
  chili: '#661A1A',
  flour: '#FFF1E1',
  white: '#FFFFFF',
  grey: '#8A7268',
  olive: '#6B7A4A',
  amber: '#E8A33D',
}

export const korstTheme = buildLegacyTheme({
  '--black': korst.chili,
  '--white': korst.white,

  '--gray': korst.grey,
  '--gray-base': korst.grey,

  '--component-bg': korst.white,
  '--component-text-color': korst.chili,

  '--brand-primary': korst.tomato,

  '--default-button-color': korst.grey,
  '--default-button-primary-color': korst.tomato,
  '--default-button-success-color': korst.olive,
  '--default-button-warning-color': korst.amber,
  '--default-button-danger-color': korst.tomatoDark,

  '--state-info-color': korst.tomato,
  '--state-success-color': korst.olive,
  '--state-warning-color': korst.amber,
  '--state-danger-color': korst.tomatoDark,

  '--main-navigation-color': korst.chili,
  '--main-navigation-color--inverted': korst.flour,

  '--focus-color': korst.tomato,
})
