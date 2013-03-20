define([
  'jquery',
], function($){
  var hook = function(){
    //Test if we have Local Storage
    if(localStorage){
    function init(){
      $.each($('.stored'), function (){
        input_name = $(this).attr('name');
        if(localStorage[input_name]){
          $(this).val(localStorage[input_name]);
        }
      });
    }
    init();

    $('.stored').keyup(function(){
      localStorage[$(this).attr('name')] = $(this).val();
    });
    }
  }
  return {hook:hook}
});

