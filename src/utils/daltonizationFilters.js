/**
 * Génère des filtres SVG pour la daltonisation (correction des couleurs pour daltoniens).
 * Basé sur l'algorithme LMS Daltonization (daltonize.org) et SVG-Daltonizer (MIT).
 * Types : protanomaly, deuteranomaly, tritanomaly.
 */

const DaltonizerTypes = { PROTANOMALY: 0, DEUTERANOMALY: 1, TRITANOMALY: 2 };

const RGB2LMS = [
  0.31399022, 0.63951294, 0.04649755, 0, 0,
  0.15537241, 0.75789446, 0.08670142, 0, 0,
  0.01775239, 0.10944209, 0.87255922, 0, 0,
  0, 0, 0, 1, 0,
];

const LMS2RGB = [
  5.47221206, -4.6419601, 0.16963708, 0, 0,
  -1.1252419, 2.29317094, -0.1678952, 0, 0,
  0.02980165, -0.19318073, 1.16364789, 0, 0,
  0, 0, 0, 1, 0,
];

const VisibleShift = [
  0, 0, 0, 0, 0,
  0.7, 1, 0, 0, 0,
  0.7, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

const VisibleShift2 = [
  0, 0, 0, 0, 0,
  0.7, 1, 0, 0, 0,
  0.7, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

const Identity = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

// Machado matrices (strength 1.0) pour protanopia, deuteranopia, tritanopia
const MachadoFull = [
  [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
  [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.011820, 0.042940, 0.968881],
  [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.303900],
];

function mult3x3(m1, m2) {
  const out = Identity.slice();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        sum += m1[i * 5 + k] * m2[k * 5 + j];
      }
      out[i * 5 + j] = sum;
    }
  }
  return out;
}

function addMatrix(m1, m2) {
  const out = m1.slice();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      out[i * 5 + j] += m2[i * 5 + j];
    }
  }
  return out;
}

function subMatrix(m1, m2) {
  const out = m1.slice();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      out[i * 5 + j] -= m2[i * 5 + j];
    }
  }
  return out;
}

function getCorrectiveMatrix(type) {
  const cvd = Identity.slice();
  const m = MachadoFull[type];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      cvd[i * 5 + j] = m[i * 3 + j];
    }
  }
  const shift = type === DaltonizerTypes.TRITANOMALY ? VisibleShift2 : VisibleShift;
  const cvdApplied = mult3x3(shift, cvd);
  const shiftPlusI = addMatrix(shift, Identity);
  return subMatrix(shiftPlusI, cvdApplied);
}

function matrixToFeColorMatrixValues(matrix) {
  return [
    matrix[0], matrix[1], matrix[2], 0, 0,
    matrix[5], matrix[6], matrix[7], 0, 0,
    matrix[10], matrix[11], matrix[12], 0, 0,
    0, 0, 0, 1, 0,
  ]
    .map((v) => Math.round(v * 1e4) / 1e4)
    .join(' ');
}

/**
 * Génère le SVG contenant les filtres de daltonisation.
 * @returns {string} HTML string du SVG
 */
export function getDaltonizationSVG() {
  const filters = [
    { id: 'daltonize-protanomaly', type: DaltonizerTypes.PROTANOMALY },
    { id: 'daltonize-deuteranomaly', type: DaltonizerTypes.DEUTERANOMALY },
    { id: 'daltonize-tritanomaly', type: DaltonizerTypes.TRITANOMALY },
  ];

  const defs = filters
    .map(({ id, type }) => {
      const m = getCorrectiveMatrix(type);
      const values = matrixToFeColorMatrixValues(m);
      return `<filter id="${id}" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">
  <feColorMatrix type="matrix" in="SourceGraphic" values="${values}"/>
</filter>`;
    })
    .join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0" aria-hidden="true">
  <defs>
  ${defs}
  </defs>
</svg>`;
}

export const FILTER_IDS = {
  normal: null,
  protanopia: 'daltonize-protanomaly',
  deuteranopia: 'daltonize-deuteranomaly',
  tritanopia: 'daltonize-tritanomaly',
  achromatopsia: 'achromatopsia', // CSS filter, not SVG
};
