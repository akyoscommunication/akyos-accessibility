import { BaseEnhancer } from './BaseEnhancer.js';
import { generateId } from '../utils/generateId.js';

const FORM_CONTROL_SELECTOR = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea';

/** Classes couramment utilisées par les frameworks pour indiquer une erreur de validation */
const ERROR_CLASS_PATTERNS = [
  'error',
  'invalid',
  'is-invalid',
  'has-error',
  'field-error',
  'form-error',
  'ng-invalid',
  'is-error',
];

/**
 * Améliore l'accessibilité des formulaires :
 * - Associe les <label> aux <input> via for/id si manquant
 * - Ajoute aria-required sur les champs requis
 * - Ajoute aria-invalid quand un champ est en erreur (classes d'erreur courantes)
 */
export class FormEnhancer extends BaseEnhancer {
  run() {
    const items = [];
    this.associateLabels(items);
    this.addAriaRequired(items);
    this.addAriaInvalid(items);
    return items;
  }

  /**
   * Associe les labels aux contrôles de formulaire via for/id.
   */
  associateLabels(items) {
    const controls = document.querySelectorAll(FORM_CONTROL_SELECTOR);

    controls.forEach((control) => {
      const hasId = control.id && control.id.trim() !== '';
      const labelWithFor = hasId ? document.querySelector(`label[for="${control.id}"]`) : null;

      if (labelWithFor) {
        return;
      }

      const label = this.findAssociatedLabel(control);

      if (!label) return;

      if (!hasId) {
        control.id = control.id || generateId('form');
      }

      if (!label.getAttribute('for') || label.getAttribute('for') !== control.id) {
        label.setAttribute('for', control.id);
        const labelText = label.textContent?.trim().substring(0, 30) || 'Champ';
        items.push({
          message: `Label associé : ${labelText}${(label.textContent?.trim().length || 0) > 30 ? '…' : ''}`,
          element: control,
          type: 'enhancement',
        });
      }
    });
  }

  /**
   * Trouve le label associé à un contrôle (implicite ou voisin).
   */
  findAssociatedLabel(control) {
    const parent = control.parentElement;
    if (!parent) return null;

    if (parent.tagName === 'LABEL') {
      return parent;
    }

    const prev = control.previousElementSibling;
    if (prev?.tagName === 'LABEL') {
      return prev;
    }

    const labelInParent = parent.querySelector(':scope > label');
    if (labelInParent) {
      return labelInParent;
    }

    let sibling = control.previousElementSibling;
    while (sibling) {
      const label = sibling.tagName === 'LABEL' ? sibling : sibling.querySelector('label');
      if (label) return label;
      if (sibling.tagName !== 'LABEL' && !sibling.matches?.('div, span, p')) break;
      sibling = sibling.previousElementSibling;
    }

    return null;
  }

  /**
   * Ajoute aria-required="true" sur les champs ayant l'attribut required.
   */
  addAriaRequired(items) {
    const requiredControls = document.querySelectorAll(
      `${FORM_CONTROL_SELECTOR}[required]:not([aria-required="true"])`
    );

    requiredControls.forEach((control) => {
      control.setAttribute('aria-required', 'true');
      const name = control.name || control.placeholder || control.id || 'Champ';
      items.push({
        message: `aria-required ajouté : ${String(name).substring(0, 25)}`,
        element: control,
        type: 'enhancement',
      });
    });
  }

  /**
   * Ajoute aria-invalid="true" sur les champs en erreur (détectés via classes).
   */
  addAriaInvalid(items) {
    const controls = document.querySelectorAll(FORM_CONTROL_SELECTOR);

    controls.forEach((control) => {
      const hasError = this.hasErrorState(control);
      const currentInvalid = control.getAttribute('aria-invalid');

      if (hasError && currentInvalid !== 'true') {
        control.setAttribute('aria-invalid', 'true');
        const name = control.name || control.placeholder || control.id || 'Champ';
        items.push({
          message: `aria-invalid ajouté (erreur détectée) : ${String(name).substring(0, 25)}`,
          element: control,
          type: 'enhancement',
        });
      } else if (!hasError && currentInvalid === 'true') {
        control.removeAttribute('aria-invalid');
      }
    });
  }

  /**
   * Vérifie si l'élément ou un parent proche a une classe d'erreur.
   */
  hasErrorState(element) {
    const check = (el) => {
      if (!el || !el.classList) return false;
      const classes = Array.from(el.classList);
      return ERROR_CLASS_PATTERNS.some((pattern) =>
        classes.some((c) => c.toLowerCase().includes(pattern.toLowerCase()))
      );
    };

    if (check(element)) return true;

    const parent = element.parentElement;
    if (parent && check(parent)) return true;

    const grandparent = parent?.parentElement;
    if (grandparent && check(grandparent)) return true;

    return false;
  }
}
