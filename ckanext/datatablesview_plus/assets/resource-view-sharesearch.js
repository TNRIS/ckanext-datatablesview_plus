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

    console.log( '_updateShareSearchURL()' );
    console.log( details );

    if( details.search['search'] != '' ) {

      $('.sharesearch-details', modal).html('Search: ' + details.search['search'] );

    } else if( details.searchBuilder ) {

      $('.sharesearch-details', modal).html('Advanced Search: <br/><ul>' + searchbuilder_criteria_display( details.searchBuilder ) + '</ul>');

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

  function searchbuilder_criteria_display( state ) {

    if( state.criteria !== undefined  ) {

      return _criteria_display( state.criteria, state.logic );
    
    }

  }

  function _criteria_display( criteria, logic ) {

    var html = '';

    for(var c = 0; c < criteria.length; c++) {
      
      if( criteria[c].criteria !== undefined  ) {

        html = html + _criteria_display( criteria[c].criteria, criteria[c].logic );

      } else {

        html = html + '<li>' + criteria[c]['data'] + ' ' + criteria[c]['condition'] + ' ' + criteria[c]['value'][0] + '</li>';

      }

      if( c+1 != criteria.length ) {
        html = html + '<li>' + logic + '</li>';
      }
    
    }

    return '<ul>' + html + '</ul>';

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
