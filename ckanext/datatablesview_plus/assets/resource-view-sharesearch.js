this.ckan.module('resource-view-sharesearch', function ($) {
  var modal;
  var self;

  function initialize() {
    self = this;
    modal = $('#sharesearch-'+this.options.id)
    $('body').append(modal);
    this.el.on('click', _onClick);
    $('input', modal).on('focus', _selectAllCode).on('mouseup', _preventClick);
    $('input', modal).attr('readonly', true);
    // $('input', modal).on('keyup change', _updateValues);
    _updateShareSearchURL();
  }

  function _onClick (event) {
    event.preventDefault();
    _updateValues();
    modal.modal('show');
  }

  function _selectAllCode () {
    $('input', modal).select();
  }

  function _updateValues () {
    _updateShareSearchURL();
  }

  function _updateShareSearchURL () {

    var state = _getState();
    var details = _getState(true);


    if( details.search['search'] != '' ) {
      $('.sharesearch-details', modal).html('Search: ' + details.search['search'] + details);
    }

    if( details.search['searchBuilder'] != '' ) {

      var html = '';

      for (const c of details.searchBuilder.criteria ) {

        console.log( c );

        html = html + '<li>' + c['data'] + ' ' + c['condition'] + ' ' + c['value'][0] + '</li>';

      }

      $('.sharesearch-details', modal).html('Search: <br/><ul>' + html + '</ul>');
    }

    
    //get query part of the url
    let searchParams = new URLSearchParams(window.location.search);

    //add encoded state into query part
    searchParams.set('dtprv_state', state);
    
    //form url with new query parameter
    const newURL = window.location.origin + window.location.pathname + '?' + searchParams.toString() + window.location.hash;

    $('[name="code"]', modal).val(newURL);
    $('#sharesearch-copy', modal).attr( 'data-url', newURL);
  }

  function _preventClick (event) {
    event.preventDefault();
  }

  function _getState (decoded=false) {
    var state = $("#resource-viewer").contents().find("#dtprv_state").val();  
    // var state = 'eyJ0aW1lIjoxNjk0MTA4NjM3Nzc5LCJzdGFydCI6MCwibGVuZ3RoIjoxMDAwLCJvcmRlciI6W1swLCJhc2MiXV0sInNlYXJjaCI6eyJzZWFyY2giOiJhY2lkIiwic21hcnQiOnRydWUsInJlZ2V4IjpmYWxzZSwiY2FzZUluc2Vuc2l0aXZlIjp0cnVlfSwiY29sdW1ucyI6W3sidmlzaWJsZSI6dHJ1ZSwic2VhcmNoIjp7InNlYXJjaCI6IiIsInNtYXJ0Ijp0cnVlLCJyZWdleCI6ZmFsc2UsImNhc2VJbnNlbnNpdGl2ZSI6dHJ1ZX19LHsidmlzaWJsZSI6dHJ1ZSwic2VhcmNoIjp7InNlYXJjaCI6IiIsInNtYXJ0Ijp0cnVlLCJyZWdleCI6ZmFsc2UsImNhc2VJbnNlbnNpdGl2ZSI6dHJ1ZX19LHsidmlzaWJsZSI6dHJ1ZSwic2VhcmNoIjp7InNlYXJjaCI6IiIsInNtYXJ0Ijp0cnVlLCJyZWdleCI6ZmFsc2UsImNhc2VJbnNlbnNpdGl2ZSI6dHJ1ZX19LHsidmlzaWJsZSI6dHJ1ZSwic2VhcmNoIjp7InNlYXJjaCI6IiIsInNtYXJ0Ijp0cnVlLCJyZWdleCI6ZmFsc2UsImNhc2VJbnNlbnNpdGl2ZSI6dHJ1ZX19XSwic2VsZWN0Ijp7InJvd3MiOlsiI3VuZGVmaW5lZCJdLCJjb2x1bW5zIjpbXSwiY2VsbHMiOltdfSwiY2hpbGRSb3dzIjpbXSwic2VhcmNoQnVpbGRlciI6e30sInBhZ2UiOjB9';
    // console.log( state );
    if( decoded && state != '' ) {
      state = JSON.parse(atob(state));
      // console.log( state );
    }
    return state;
  }

  return {
    initialize: initialize,
    options: {
      id: 0,
      url: '#',
      width: 700,
      height: 400
    }
  }
});
