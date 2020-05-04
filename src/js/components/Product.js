import { select, classNames, templates } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';

export class Product {
  constructor(id, data) {
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }

  renderInMenu() {
    const thisProduct = this;
    const generatedHTML = templates.menuProduct(thisProduct.data);                                                    /* generate HTML based on template */
    const menuContainer = document.querySelector(select.containerOf.menu);                                            /* find menu container */

    thisProduct.element = utils.createDOMFromHTML(generatedHTML);                                                     /* create element using utils.createElementFromHTML */
    menuContainer.appendChild(thisProduct.element);                                                                   /* add element to menu */
  }

  getElements() {
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion() {
    const thisProduct = this;

    thisProduct.accordionTrigger.addEventListener('click', function (event) {                                         /* START: click event listener to trigger */
      const activeProducts = document.querySelectorAll('article.active');                                             /* find all active products */
      event.preventDefault();                                                                                         /* prevent default action for event */

      thisProduct.element.classList.toggle('active');                                                                 /* toggle active class on element of thisProduct */

      for (let activeProduct of activeProducts) {                                                                     /* START LOOP: for each active product */
        if (activeProduct !== thisProduct.element) {                                                                  /* START: if the active product isn't the element of thisProduct */
          activeProduct.classList.remove('active');                                                                   /* remove class active for the active product */
        }                                                                                                             /* END: if the active product isn't the element of thisProduct */
      }                                                                                                               /* END LOOP: for each active product */
    });                                                                                                               /* END: click event listener to trigger */
  }

  initOrderForm() {
    const thisProduct = this;

    thisProduct.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
    });

    for (let input of thisProduct.formInputs) {
      input.addEventListener('change', function () {
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function () {
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder() {
    const thisProduct = this;
    const formData = utils.serializeFormToObject(thisProduct.form);                                                   /* read all data from the form (using utils.serializeFormToObject) and save it to const formData */
    let price = thisProduct.data.price;                                                                               /* set variable price to equal thisProduct.data.price */

    thisProduct.params = {};

    for (let paramId in thisProduct.data.params) {                                                                    /* START LOOP: for each paramId in thisProduct.data.params */
      const param = thisProduct.data.params[paramId];                                                                 /* save the element in thisProduct.data.params with key paramId as const param */

      for (let optionId in param.options) {                                                                           /* START LOOP: for each optionId in param.options */
        const option = param.options[optionId];                                                                       /* save the element in param.options with key optionId as const option */
        const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;          /* START IF: if option is selected and option is not default */
        const ingredientImages = thisProduct.imageWrapper.querySelectorAll('.' + paramId + '-' + optionId);           /* find all images */

        if (optionSelected && !option.default) {
          price += option.price;                                                                                      /* add price of option to variable price */
        }                                                                                                             /* END IF: if option is selected and option is not default */
        else if (!optionSelected && option.default) {                                                                 /* START ELSE IF: if option is not selected and option is default */
          price -= option.price;                                                                                      /* deduct price of option from price */
        }                                                                                                             /* END ELSE IF: if option is not selected and option is default */

        for (let ingredient of ingredientImages) {
          if (!optionSelected) {
            ingredient.classList.remove(classNames.menuProduct.imageVisible);
          }
          else if (optionSelected) {
            if (!thisProduct.params[paramId]) {
              thisProduct.params[paramId] = {
                label: param.label,
                options: {},
              };
            }
            thisProduct.params[paramId].options[optionId] = option.label;
            ingredient.classList.add(classNames.menuProduct.imageVisible);
          }
        }
      }                                                                                                               /* END LOOP: for each optionId in param.options */
    }                                                                                                                 /* END LOOP: for each paramId in thisProduct.data.params */

    thisProduct.priceSingle = price;
    thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;                                     /* multiply price by amount */
    thisProduct.priceElem.innerHTML = thisProduct.price;                                                              /* set the contents of thisProduct.priceElem to be the value of variable price */
  }

  initAmountWidget() {
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function () {
      thisProduct.processOrder();
    });
  }

  addToCart() {
    const thisProduct = this;

    thisProduct.name = thisProduct.data.name;
    thisProduct.amount = thisProduct.amountWidget.value;

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);
  }
}

export default Product;