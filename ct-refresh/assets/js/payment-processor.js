(function() {
  var cardFromNumber, cardFromType, cards, defaultFormat, formatBackCardNumber, formatBackExpiry, formatCardNumber, formatExpiry, formatForwardExpiry, formatForwardSlashAndSpace, hasTextSelected, luhnCheck, reFormatCVC, reFormatCardNumber, reFormatExpiry, reFormatNumeric, restrictCVC, restrictCardNumber, restrictExpiry, restrictNumeric, setCardType,
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $.paymentProcessor = {};
  
  $.paymentProcessor.fn = {};

  $.fn.paymentProcessor = function() {
    var method = arguments[0];
    var args = (2 <= arguments.length ? __slice.call(arguments, 1) : []);
    return $.paymentProcessor.fn[method].apply(this, args);
  };

  defaultFormat = /(\d{1,4})/g;

  $.paymentProcessor.provider = {};
  
  $.paymentProcessor.errors = [];
  
  $.paymentProcessor.addError = function(error) {
    $.paymentProcessor.errors.push(error);
  };
  
  $.paymentProcessor.cleanErrors = function() {
    $.paymentProcessor.errors = [];
  }
  $.paymentProcessor.init = function(q, provider, providerConfig, publicKeys) {
    this.q = q;
    this.currentProvider = provider;
    if(provider == "stripe") {
      this.provider[provider] = new PaymentProcessor_Stripe(q);
    } else if(provider == "test") {
      this.provider[provider] = new PaymentProcessor_Test(q, providerConfig, publicKeys);
    } else if (provider == "adyen") {
      this.provider[provider] = new PaymentProcessor_Adyen(q);
    } else if (provider == "adyen_eu") {
      this.provider[provider] = new PaymentProcessor_Adyen(q);
    } else if (provider == "adyen_mx") {
      this.provider[provider] = new PaymentProcessor_Adyen(q);
    } else {
      throw "Invalid provider specified.";
    }
    this.provider[provider].init(publicKeys, providerConfig);
  };
  
  $.paymentProcessor.changePublicKeys = function(publicKeys) {
    this.provider[this.currentProvider].setPublicKeys(publicKeys);
  };

  $.paymentProcessor.createToken = function(data, name, isOnsite) {
    return this.provider[this.currentProvider].createToken(data, name,isOnsite);
  };
  
  $.paymentProcessor.setupElements = function(data) {
    return this.provider[this.currentProvider].setupElements();
  };

  $.paymentProcessor.setupOnsiteElements = function(data) {
    return this.provider[this.currentProvider].setupOnsiteElements();
  };

  function PaymentProcessor_Adyen(q) {
    
    this.q = q;
    this.testCard = "";
    this.publicKeys = {};
    this.providerConfig = null;
    
    this.init = function(publicKeys, providerConfig) {
      this.publicKeys     = publicKeys;
      this.providerConfig = providerConfig;
    }
    
    this.setPublicKeys = function(publicKeys) {
      this.publicKeys = publicKeys;
    }
    
    this.createToken = function(data) {
      var responseData = {};
      var d = $.paymentProcessor.q.defer();
      if(data.isAdyenCC) {
        var config        = this.providerConfig;
        var publicKeys    = this.publicKeys;
        var key     =   publicKeys; 
        var options = {};
        options.enableValidations = false;
        var cseInstance = adyen.encrypt.createEncryption(key, options);
 
        var cardExpires = data.cardExpires.split("/");
        var expDate = cardExpires[1];

        var year = parseInt(expDate);
        if(year < 100) {
          expDate = (parseInt(year, 10) + 2000).toString();
        }

        data.cardNumber = data.cardNumber.replace(/\s/g,'');

        var cardData = {
            number : data.cardNumber,
            cvc : data.cardCode,
            holderName : data.billingName,
            expiryMonth : cardExpires[0],
            expiryYear : expDate,
            generationtime : data.generationTime
        };

        if(!$.paymentProcessor.validateCardData(d,cardData)) { 
          var encryptedData = cseInstance.encrypt(cardData);
          responseData = {"token": encryptedData, "config": config};
        }
        
      } 
      
      d.resolve(responseData);
      return d.promise;
    };
    
    this.setupElements       = function() {}
    this.setupOnsiteElements = function() {}
  }
  
  function PaymentProcessor_Stripe(q) {
    
    this.q = q;
    this.testCard = "4012888888881881";
    this.publicKeys = {};
    this.providerConfig = null;
    
    this.init = function(publicKeys, providerConfig) {
      this.publicKeys     = publicKeys;
      this.providerConfig = providerConfig;
    }
    
    this.object = null;

    this.setupElements = function() {
      var config        = this.providerConfig;
      var publicKeys    = JSON.parse(this.publicKeys);
      var publicKey     = publicKeys[config];
      var stripe        = Stripe(publicKey);
      this.object       = stripe;
      var elements      = stripe.elements();
      var fontSize      = '16px';
      var opts = {
        style: {
          base: {
           fontSize: fontSize,
           color: '#555555',
             '::placeholder': {
            color: '#fff',
             },
          },
          invalid: {
            iconColor: '#e85746',
            color: '#e85746',
          }
        },
        classes: {
          focus: 'is-focused',
          empty: 'is-empty',
        },
      };
      
       var optsExpiry = {
        style: {
          base: {
           fontSize: fontSize,
           color: '#555555',
             '::placeholder': {
            color: '#99999f',
             },
          },
          invalid: {
            iconColor: '#e85746',
            color: '#e85746',
          }
        },
        classes: {
          focus: 'is-focused',
          empty: 'is-empty',
        },
      };

      var card       = elements.create('cardNumber', opts);
      var cardExpiry = elements.create('cardExpiry', optsExpiry);
      var cardCVC    = elements.create('cardCvc', opts);
      var cardPostal = elements.create('postalCode', opts);
      card.mount('#only-card');
      cardExpiry.mount('#only-card-expiry');
      cardCVC.mount('#only-card-cvc');
      cardPostal.mount('#only-card-postal');
      return card;
    }
    
    this.setupOnsiteElements = function() {
      var config        = this.providerConfig;
      var publicKeys    = JSON.parse(this.publicKeys);
      var publicKey     = publicKeys[config];
      var stripe        = Stripe(publicKey);
      this.object       = stripe;
      var elements      = stripe.elements();

      var opts = {
        style: {
          base: {
            color: '#000',
            fontFamily: 'Lucida Grande',
            fontSize: '24px'
          },
          invalid: {
            iconColor: '#e85746',
            color: '#e85746',
          }
        },
        classes: {
          focus: 'is-focused',
          empty: 'is-empty',
        },
      };
      var card       = elements.create('cardNumber', opts);
      var cardExpiry = elements.create('cardExpiry', opts);
      var cardCVC    = elements.create('cardCvc', opts);
      
      card.mount('#only-card');
      cardExpiry.mount('#only-card-expiry');
      cardCVC.mount('#only-card-cvc');
      return card;
    }
    
    this.setPublicKeys = function(publicKeys) {
      this.publicKeys = publicKeys;
    }
    
    this.createToken = function(card, name, isOnsite) {
      if($('#stripeTestEnv').length && $('#stripeTestEnv').is(":checked")) {
        this.providerConfig = "test";      
      }
      $.paymentProcessor.cleanErrors();
      var config        = this.providerConfig;
      var publicKeys    = JSON.parse(this.publicKeys);
      var publicKey = publicKeys[config];
      
      var d = $.paymentProcessor.q.defer();
  
      this.object.createToken(card, {name: name}).then(function(result) {
          
      if(!$.paymentProcessor.validateCardHolder(d,name)) {          
        if (result.token) {
          var responseData = {"token": result.token.id, "config": config,"postal_code":result.token.card.address_zip};
          d.resolve(responseData);
        }
        else {
          var elID = isOnsite ? 'forerror' : 'name';
          switch(result.error.code) {
              case "incomplete_number":
                d.reject({param: elID, message: gt.gettext('Your card number is incomplete.')});
                break;
                
              case "incomplete_expiry":
                d.reject({param: elID, message: gt.gettext("Your card's expiration date is incomplete.")});
                break;
                
              case "incomplete_cvc":
                d.reject({param: elID, message: gt.gettext("Your card's security code is incomplete.")});
                break;
                
              case "incomplete_zip":
                d.reject({param: elID, message: gt.gettext("Your postal code is incomplete.")});
                break;
                
              case "invalid_expiry_year_past":
                d.reject({param: elID, message: gt.gettext("Your card's expiration year is in the past.")});
                break;  
                
              case "invalid_number":
                d.reject({param: elID, message: gt.gettext("Your card number is invalid.")});
                break;
                
              case "invalid_expiry_month":
                d.reject({param: elID, message: gt.gettext("The card's expiration month is invalid.")});
                break;
              
              case "invalid_expiry_year":
                d.reject({param: elID, message: gt.gettext("The card's expiration year is invalid.")});
                break;
                
              case "invalid_cvc":
                d.reject({param: elID, message: gt.gettext("The card's security code is invalid.")});
                break;
                
              case "incorrect_number":
                d.reject({param: elID, message: gt.gettext("The card number is incorrect.")});
                break;
                
              case "expired_card":
                d.reject({param: elID, message: gt.gettext("The card has expired.")});
                break;
                
              case "incorrect_cvc":
                d.reject({param: elID, message: gt.gettext("The card's security code is incorrect.")});
                break;
                
              case "incorrect_zip":
                d.reject({param: elID, message: gt.gettext("The card's zip code failed validation.")});
                break;
                
              case "card_declined":
                d.reject({param: elID, message: gt.gettext("The card was declined.")});
                break;  
                
              case "processing_error":
                d.reject({param: elID, message: gt.gettext("An error occurred while processing the card.")});
                break; 
                
              default:
                d.reject({param: elID, message: gt.gettext("There was an error processing your request.")});
                break;
            } 
         }
      } else {
        d.reject($.paymentProcessor.errors[0]);
      }
      });
      
      return d.promise;
    }
    
    
  }
      
  function PaymentProcessor_Test(publicKey) {
    this.publicKey = publicKey;
    
    this.init = function() {
    }
    
    this.setPublicKeys = function(publicKeys) {}
    
    this.createToken = function(data, deferred) {
      $.paymentProcessor.validatePayment(data);
      try {
        deferred.resolve(JSON.stringify(data));
      } catch(e) {
        deferred.reject(e);
        return false;
      }
      return deferred.promise;
    };
  };
  
  $.paymentProcessor.q = null;
  
  $.paymentProcessor.prepareTokenData = function(data) {
    
    var tokenData = {};
    
    for(var i in data) {
      var object = data[i];
      var name = object.name;
      
      if(/(cc)?cardName/i.test(name)) {
        tokenData.name = object.value;
      }
      
      if(/(cc)?cardNumber/i.test(name)) {
        tokenData.number = object.value;
      }
      
      if(/(cardExpires|(cc)?cardExpiration)/i.test(name)) {
        var cardExpiration = object.value;
        var cardExpArray = cardExpiration.split("/");
        var cardExpMonth = cardExpArray[0];
        var cardExpYear = cardExpArray[1];
        tokenData.exp_month = cardExpMonth;
        tokenData.exp_year = cardExpYear;
      }
      
      if(/(cardCode|cardID|securityCode)/.test(name)) {
        tokenData.cvc = object.value;
      }
      
      if(/cardZip/.test(name)) {
        tokenData.address_zip = object.value;
      }    
    }
    return tokenData;
  };
  
  $.paymentProcessor.cleanDataForSubmit = function(data) {
    
    var returnData = [];
    
    for(var i in data) {
      var object = data[i];
      var name = object.name;
      if(!/(cc)?(cardName|cardNumber|cardExpires|cardExpiration|cardCode|cardID|cardZip|securityCode)/i.test(name)) {
        returnData.push(object);
      }
    }
    return returnData;
  };
  
  $.paymentProcessor.addTokenToData = function(data, token) {
    

    var missing = true;
    for(var i in data) {
      var object = data[i];
      if(/(paymentToken)/.test(object.name)) {
        data[i] = {name: object.name, value: token};
        missing = false;
      }
    }
    // If there is no payment token field we add one.
    if (missing) {
      data.push({name: 'paymentToken', value: token});
    }
    return data;
  };
  
  $.paymentProcessor.addConfigToData = function(data, config, name) {
    

    var missing = true;
    for(var i in data) {
      var object = data[i];
      if(/(processorConfig)/.test(object.name)) {
        data[i] = {name: object.name, value: config};
        missing = false;
      }
    }
    // If there is no payment token field we add one.
    if (missing) {
      data.push({name: name, value: config});
    }
    return data;
  };
  
  $.paymentProcessor.cards = cards = [
    {
      type: 'visaelectron',
      pattern: /^4(026|17500|405|508|844|91[37])/,
      format: defaultFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'maestro',
      pattern: /^(5(018|0[23]|[68])|6(39|7))/,
      format: defaultFormat,
      length: [12, 13, 14, 15, 16, 17, 18, 19],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'forbrugsforeningen',
      pattern: /^600/,
      format: defaultFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'dankort',
      pattern: /^5019/,
      format: defaultFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'visa',
      pattern: /^4/,
      format: defaultFormat,
      length: [13, 16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'mastercard',
      pattern: /^5[0-5]/,
      format: defaultFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'amex',
      pattern: /^3[47]/,
      format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
      length: [15],
      cvcLength: [3, 4],
      luhn: true
    }, {
      type: 'dinersclub',
      pattern: /^3[0689]/,
      format: defaultFormat,
      length: [14],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'discover',
      pattern: /^6([045]|22)/,
      format: defaultFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'unionpay',
      pattern: /^(62|88)/,
      format: defaultFormat,
      length: [16, 17, 18, 19],
      cvcLength: [3],
      luhn: false
    }, {
      type: 'jcb',
      pattern: /^35/,
      format: defaultFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }
  ];
  
  cardFromNumber = function(num) {
    var card, _i, _len;
    num = (num + '').replace(/\D/g, '');
    for (_i = 0, _len = cards.length; _i < _len; _i++) {
      card = cards[_i];
      if (card.pattern.test(num)) {
        return card;
      }
    }
  };

  cardFromType = function(type) {
    var card, _i, _len;
    for (_i = 0, _len = cards.length; _i < _len; _i++) {
      card = cards[_i];
      if (card.type === type) {
        return card;
      }
    }
  };

  luhnCheck = function(num) {
    var digit, digits, odd, sum, _i, _len;
    odd = true;
    sum = 0;
    digits = (num + '').split('').reverse();
    for (_i = 0, _len = digits.length; _i < _len; _i++) {
      digit = digits[_i];
      digit = parseInt(digit, 10);
      if ((odd = !odd)) {
        digit *= 2;
      }
      if (digit > 9) {
        digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  };
  
  $.paymentProcessor.validateCardHolder = function(d,cardName) {
      var error = false;
      
      if(typeof cardName == 'undefined' || cardName == '') {
        error = true;
        var errorObject = {param: 'name', message: gt.gettext("You need to provide the cardholder's name.")};
        $.paymentProcessor.addError(errorObject);
        return error; 
      }
      if(cardName != '' && cardName.length < 5) {
        error = true;
        var errorObject = {param: 'name', message: gt.gettext("Name must be at least 5 chars long.")};
        $.paymentProcessor.addError(errorObject);
        return error;
      }
      return error;
  };
  
  $.paymentProcessor.validateCVC = function(d, cvc) {
    var error = false;
    var regExp = new RegExp('[0-9]{3,4}');
    if(typeof cvc == 'undefined' || cvc == '') {
        error = true;
        $.paymentProcessor.addError({param: 'cvc', message: gt.gettext("You need to provide the CVC code.")});
        return error;
    }
    if(!regExp.test(cvc)) {
        error = true;
        $.paymentProcessor.addError({param: 'cvc', message: gt.gettext("Invalid CVC code")});
        return error;
    }
    return error;
  };
  
  $.paymentProcessor.validateCreditCard = function(d,cardNumber) {
    var CREDIT_CARD_NUMBER = /\b(?:3[47]\d{2}([\ \-]?)\d{6}\1\d|(?:(?:4\d|5[1-5]|65)\d{2}|6011)([\ \-]?)\d{4}\2\d{4}\2)\d{4}\b/;
    var error = false;

    if(typeof cardNumber == 'undefined' || cardNumber == '') {
      error = true;
      $.paymentProcessor.addError({param: 'number', message: gt.gettext("You need to provide the credit card number.")});
      return error;
    }
    if(!cardFromNumber(cardNumber) || !CREDIT_CARD_NUMBER.test(cardNumber)) {
      error = true;
      $.paymentProcessor.addError({param: 'number', message: gt.gettext('Invalid credit card number')});
      return error;
    }
    return error;
  };
  
  $.paymentProcessor.validateExpDate = function(d, expMonth, expYear) {
    var CREDIT_CARD_EXP_DATE = /^(1[0-2]|0[1-9]|\d)\/((2[0-9])?[2-9]\d[1-9]\d|[1-9]\d)$/;
    var error = false;

    if(typeof expMonth == 'undefined' || expMonth == '') {
      error = true;
      $.paymentProcessor.addError({param: 'exp_year', message: gt.gettext("You need to provide the expiry date.")});
      return error;
    }
    if(typeof expYear == 'undefined' || expYear == '') {
      error = true;
      $.paymentProcessor.addError({param: 'exp_year', message: gt.gettext("Invalid expiry date.")});
      return error;
    }
    var month = expMonth;
    var year = expYear;

    var fullDate = expMonth + '/' + expYear;
    var match = fullDate.match(CREDIT_CARD_EXP_DATE);
    if (match === null) {
      error = true;
    }
    if (year < 100) {
      year = parseInt(year, 10) + 2000;
    }
    var now = new Date();
    var curYear = now.getFullYear();
    var curMonth = now.getMonth() + 1; // js 0 indexes months!
    if (year < curYear) {
      error = true;
    }
    if (year == curYear && month < curMonth) {
      error = true;
    }
    if(error) {
      $.paymentProcessor.addError({param: 'exp_year', message: gt.gettext("Invalid expiry date.")});
    }
    return error;
  };
  
  $.paymentProcessor.validateCardData = function(d, cardData) {
    $.paymentProcessor.cleanErrors();
    var error = false;

    $.paymentProcessor.validateCardHolder(d,cardData.holderName);
    $.paymentProcessor.validateCreditCard(d,cardData.number);
    $.paymentProcessor.validateCVC(d,cardData.cvc);
    $.paymentProcessor.validateExpDate(d, cardData.expiryMonth, cardData.expiryYear);
    
    if($.paymentProcessor.errors.length > 0) {
      error = true;
      d.reject($.paymentProcessor.errors);
    }
    return error;
  };
  
  
  
}).call(this);