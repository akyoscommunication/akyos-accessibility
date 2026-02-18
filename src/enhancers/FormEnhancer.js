import { BaseEnhancer } from './BaseEnhancer.js';
import { generateId } from '../utils/generateId.js';

const FORM_CONTROL_SELECTOR =
  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea';

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
 * - Audit : champs sans label, fieldset sans legend, autocomplete, optgroup
 */
export class FormEnhancer extends BaseEnhancer {
  run() {
    const items = [];
    this.associateLabels(items);
    this.addAriaRequired(items);
    this.addAriaInvalid(items);
    this.auditUnlabeledFields(items);
    this.auditFieldsetLegend(items);
    this.auditAutocomplete(items);
    this.auditOptgroup(items);
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
   * Audit : champs sans label, aria-label, aria-labelledby ou title.
   */
  auditUnlabeledFields(items) {
    const controls = document.querySelectorAll(FORM_CONTROL_SELECTOR);

    controls.forEach((control) => {
      const hasLabel = this.findAssociatedLabel(control) || document.querySelector(`label[for="${control.id}"]`);
      const hasAriaLabel = control.getAttribute('aria-label')?.trim().length > 0;
      const hasAriaLabelledby = control.getAttribute('aria-labelledby')?.trim().length > 0;
      const hasTitle = control.getAttribute('title')?.trim().length > 0;

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
        const name = control.name || control.placeholder || control.id || 'Champ';
        items.push({
          message: `Champ sans étiquette : ${String(name).substring(0, 25)}`,
          element: control,
          type: 'suggestion',
          severity: 'error',
        });
      }
    });
  }

  /**
   * Audit : groupes de radio/checkbox sans fieldset+legend ou role="group"+aria-label.
   */
  auditFieldsetLegend(items) {
    const radioGroups = document.querySelectorAll('input[type="radio"]');
    const processed = new Set();

    radioGroups.forEach((radio) => {
      const name = radio.getAttribute('name');
      if (!name || processed.has(name)) return;

      const group = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
      if (group.length < 2) return;

      const first = group[0];
      const fieldset = first.closest('fieldset');
      const roleGroup = first.closest('[role="group"]');
      const roleRadiogroup = first.closest('[role="radiogroup"]');

      const hasLegend = fieldset?.querySelector('legend');
      const hasAriaLabel = (fieldset || roleGroup || roleRadiogroup)?.getAttribute('aria-label');
      const hasAriaLabelledby = (fieldset || roleGroup || roleRadiogroup)?.getAttribute('aria-labelledby');

      if (!hasLegend && !hasAriaLabel && !hasAriaLabelledby) {
        items.push({
          message: `Groupe de boutons radio sans légende (fieldset/legend ou aria-label)`,
          element: first,
          type: 'suggestion',
          severity: 'warning',
        });
        processed.add(name);
      }
    });
  }

  /**
   * Audit : champs utilisateur sans autocomplete.
   */
  auditAutocomplete(items) {
    const userFields = document.querySelectorAll(
      'input[type="email"], input[type="tel"], input[name*="email" i], input[name*="tel" i], input[name*="name" i]'
    );

    userFields.forEach((input) => {
      if (input.hasAttribute('autocomplete')) return;

      const type = input.getAttribute('type') || 'text';
      const name = (input.getAttribute('name') || '').toLowerCase();

      if (type === 'email' || name.includes('email')) {
        items.push({
          message: 'Champ email sans attribut autocomplete',
          element: input,
          type: 'suggestion',
          severity: 'info',
        });
      } else if (type === 'tel' || name.includes('tel')) {
        items.push({
          message: 'Champ téléphone sans attribut autocomplete',
          element: input,
          type: 'suggestion',
          severity: 'info',
        });
      }
    });
  }

  /**
   * Audit : optgroup sans label.
   */
  auditOptgroup(items) {
    document.querySelectorAll('optgroup').forEach((og) => {
      if (!og.getAttribute('label') || og.getAttribute('label').trim() === '') {
        items.push({
          message: 'Élément optgroup sans attribut label',
          element: og,
          type: 'suggestion',
          severity: 'warning',
        });
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
