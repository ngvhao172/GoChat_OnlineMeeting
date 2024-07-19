const Handlebars = require('handlebars');

Handlebars.registerHelper('ifEqual', function (value1, value2, options) {
    console.log(value1, value2)
    if (value1 === value2) {
        return options.fn(this); 
    } else {
        return options.inverse(this);
    }
});