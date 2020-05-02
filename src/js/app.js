import {settings, select, classNames} from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import {Booking} from './components/Booking.js';

const app = {
  initPages: function (){
    const thisApp = this;
    const idFromHash = window.location.hash.replace['#/', ''];

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
        
    let pagesMatchingHash = thisApp.pages[0].id;

    for(let page of thisApp.pages){
      if(page.id == idFromHash) {
        pagesMatchingHash = page.id;
        break;
      }
    }  
    thisApp.activatePage(pagesMatchingHash); 
    
    for(let link of thisApp.navLinks){
      link.addEventListener('click', function(event){
        event.preventDefault();
        const clickedElement = this;
        const id = clickedElement.getAttribute('href').replace('#', '');                                                /* get page id from href arrtibute */
       
        thisApp.activatePage(id);                                                                                       /* run thisApp.activatePage with that id */        
        window.location.hash = '#/' + id;                                                                               /* change URL hash */

      });
    }
  },

  activatePage: function (pageId){
    const thisApp = this;
    
    for(let page of thisApp.pages){                                                                                     /* add classs "active" to matching page, remove from non-matching page */
      page.classList.toggle(classNames.pages.active, page.id == pageId);
    }

    for(let link of thisApp.navLinks){                                                                                  /* add classs "active" to matching link, remove from non-matching link */
      link.classList.toggle(
        classNames.nav.active, 
        link.getAttribute('href') == '#' + pageId
      );
    }

  },

  initMenu: function () {
    const thisApp = this;

    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },

  initCart: function () {
    const thisApp = this;
    const cartElem = document.querySelector(select.containerOf.cart);

    thisApp.cart = new Cart(cartElem);
    thisApp.productList = document.querySelector(select.containerOf.menu);
    thisApp.productList.addEventListener('add-to-cart', function(event) {
      app.cart.add(event.detail.product);
    });
  },


  
  initData: function () {
    const thisApp = this;
    const url = settings.db.url + '/' + settings.db.product;

    thisApp.data = {};

    fetch(url)
      .then(function (rawResponse) {
        return rawResponse.json();
      })
      .then(function (parsedResponse) {
        thisApp.data.products = parsedResponse;
        thisApp.initMenu();
      });
  },

  initBooking: function(){
    const thisApp = this;

    thisApp.widget = document.querySelector(select.containerOf.booking);
    thisApp.booking = new Booking (thisApp.widget);
  },

  init: function () {
    const thisApp = this;

    thisApp.initData();
    thisApp.initCart();
    thisApp.initPages();
    thisApp.initBooking();
  },
};

app.init();

