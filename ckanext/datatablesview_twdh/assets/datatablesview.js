var table_rows_per_page = 100;
var resizeTO;

var run_query = function(params, format) {

  var form = $('#filtered-datatables-download');

  /* remove hidden inputs if they exist */
  form.find( 'input[name="params"]').remove();
  form.find( 'input[name="format"]').remove();

  /* add current version of hidden inputs */
  var p = $('<input name="params" type="hidden"/>');
  p.attr("value", JSON.stringify(params));
  form.append(p);
  var f = $('<input name="format" type="hidden"/>');
  f.attr("value", format);
  form.append(f);
  form.submit();
}

this.ckan.module('datatablesview_twdh', function (jQuery) {
  return {
    initialize: function() {

      // Initialize datatable. To set options on DataTable, use data- attribute 
      // tags in templates/datatables/datatables_view.html
      var datatable = jQuery('#dtprv').DataTable({

        // Setup search highlighting
        mark: true,

        // Setup row selection
        select: true,

        order: [[ 1, 'asc' ]],

        // Setup searchBuilder
        searchBuilder: {
          depthLimit: 2
        },

        // Set column reordering
        colReorder: false,

        // Set search placeholder text
        language: {
          search: "",
          searchPlaceholder: "Search..."
        },

        // turn on state saving
        stateSave: true,


        lengthMenu: [
          [ 10, 100, 1000 ],
          [ '10', '100', '1,000' ]
        ],

        // turn on scroller
        scrollY:        "60vh",
        deferRender:    true,
        scrollCollapse: true,
        scroller:       true,

        buttons:[
          'copy',
          'csvHtml5',
          {
            extend: 'csvHtml5',
            text: 'TSV',
            fieldSeparator: '\t',
            filename: 'my-tsv',
            extension: '.tsv'
          },
          'excelHtml5',
          'colvis',
          'print',

        ],

        pagingType: 'full_numbers',
        "pageLength": table_rows_per_page,


        "initComplete": function(settings, json) {
          console.log( 'DataTables has finished its initialisation.' );
          fit_datatable_to_window();
        },

        search: {
          "smart": true,
          "regex": false,
          "return": false
        },
      

        // turn on table metadata display
        infoCallback: function( settings, start, end, max, total, pre ) {

          var api = this.api();
 
          // Output the data for the visible rows to the browser's console
          console.log( api.rows( {page:'current'} ).data() );
          console.log( api.rows( {page:'current'} ).data().length );
          console.log( table_rows_per_page );

          console.log( $('select[name="dtprv_length"]').val() );

          var rows_per_page = $('select[name="dtprv_length"]').val();

          if( total <= rows_per_page ) {

            console.log( 'hide pagination' );
            $( '.dataTables_paginate' ).hide();

          } else {

            console.log( 'show pagination' );
            $( '.dataTables_paginate' ).show();

          }



          return total + " record" + ( total != 1 ? 's' : '' );
        },

        headerCallback: function( thead, data, start, end, display ) {



          $(thead).find('th').eq(0).html( '' );

          // replace column header labels with those from the data dictionary if available
          var datadict = JSON.parse( $('#dtprv_wrapper table').attr( 'data-datadictionary' ) );
          $( datadict ).each( function( i ) {
            if( 'info' in datadict[i] && datadict[i].info.label != '' ) {
              $(thead).find('th').eq(i+1).html( datadict[i].info.label );
            }
          });


          // set column widths based on information in summary statistics
          var data_summary_json = $('#dtprv_wrapper table').attr( 'data-summary-statistics' );
          if (typeof data_summary_json !== 'undefined' && data_summary_json !== false) {
            var data_summary = JSON.parse( data_summary_json );
            $( data_summary ).each( function( i ) {
              var column_class = '';
              if( 'type' in data_summary[i] && data_summary[i].type == 'String' ) {
                console.log( data_summary[i].type )
                if( 'max_length' in data_summary[i] ) {
                  if( data_summary[i].max_length > 1000 ) {
                    column_class = 'gt1000';
                  } else if( data_summary[i].max_length > 500 ) {
                    column_class = 'gt500';
                  } else if( data_summary[i].max_length > 100 ) {
                    column_class = 'gt100';
                  }
                }
                if( 'field' in data_summary[i] && data_summary[i].field != '' ) {
                    $(thead).find('th#'+data_summary[i].field).addClass( column_class );
                }
              }
            });
          }

        },

        /* 
          stateSaveCallback and stateLoadCallback are configured here in order to allow us to have a 'share' link for table state
          Inspired by this helpful stackexchange post:
          https://stackoverflow.com/questions/55446923/datatables-1-10-using-savestate-to-remember-filtering-and-order-but-need-to-upd/60708638#60708638
        */
        stateSaveCallback: function (settings, data) {
          //encode current state to base64
          const state = btoa(JSON.stringify(data));
          //get query part of the url
          let searchParams = new URLSearchParams(window.location.search);
          //add encoded state into query part
          searchParams.set($(this).attr('id') + '_state', state);
          //form url with new query parameter
          const newRelativePathQuery = window.location.pathname + '?' + searchParams.toString() + window.location.hash;
          //push new url into history object, this will change the current url without need of reload
          history.pushState(null, '', newRelativePathQuery);
        },
        stateLoadCallback: function (settings) {
          const url = new URL(window.location.href);
          let state = url.searchParams.get($(this).attr('id') + '_state');
      
          //check the current url to see if we've got a state to restore
          if (!state) {
              return null;
          }
      
          //if we got the state, decode it and add current timestamp
          state = JSON.parse(atob(state));
          state['time'] = Date.now();
      
          return state;
      }

      });

      var dtprv_is_preview = $( '#dtprv_is_preview' ).val();
      var dtprv_preview_rows = $( '#dtprv_preview_rows' ).val();
      var dtprv_total_record_count = $( '#dtprv_total_record_count' ).val();
      var dtprv_date_modified = $( '#dtprv_metadata_modified' ).val();

      if( dtprv_is_preview == 'True' ) {
        var dtprv_status = $( '<div id="dtprv_status"><p class="warning"><span title="" class="error-icon"></span>Data shown below reflects a snapshot of the full dataset. This preview includes the first ' + dtprv_preview_rows + ' records out of ' + dtprv_total_record_count + ' records and was last updated on ' + dtprv_date_modified + '.</p></div>' );
      dtprv_status.insertBefore( '#dtprv_processing' );
      } else {
        var dtprv_status = $( '<div id="dtprv_status"><p class="">This data was last updated on ' + dtprv_date_modified + '.</p></div>' );
      dtprv_status.insertBefore( '#dtprv_processing' );
      }

      // Adds download dropdown to buttons menu
      datatable.button().add(0, {
        text: 'Download Preview',
        extend: 'collection',
        className: 'btn-primary dropdown-toggle btn-download-toggle',
        buttons: [
          {
            text: 'CSV',
            action: function (e, dt, button, config) {
              var params = datatable.ajax.params();
              params.visible = datatable.columns().visible().toArray();
              run_query(params, 'csv');
            }
          }, 
          {
            text: 'TSV',
            action: function (e, dt, button, config) {
              var params = datatable.ajax.params();
              params.visible = datatable.columns().visible().toArray();
              run_query(params, 'tsv');
            }
          }, 
          {
            text: 'JSON',
            action: function (e, dt, button, config) {
              var params = datatable.ajax.params();
              params.visible = datatable.columns().visible().toArray();
              run_query(params, 'json');
            }
          }, 
          {
            text: 'XML',
            action: function (e, dt, button, config) {
              var params = datatable.ajax.params();
              params.visible = datatable.columns().visible().toArray();
              run_query(params, 'xml');
            }
          }]
        }
      );
      /*
      */



      datatable.columns( '.select-filter' ).every( function () {
        var that = this;
     
        console.log( this );
        
        // Create the select list and search operation
        var select = $('<select />')
            .appendTo(
                this.footer()
            )
            .on( 'change', function () {
                that
                    .search( $(this).val() )
                    .draw();
            } );
     
        // Get the search data for the first column and add to the select list
        this
            .cache( 'search' )
            .sort()
            .unique()
            .each( function ( d ) {
                select.append( $('<option value="'+d+'">'+d+'</option>') );
            } );
    } );


    function fit_datatable_to_window() {

      clearTimeout( resizeTO );
      resizeTO = setTimeout(function() { 


        console.log( 'DT resize' );

        var tools_height = 
          $( '#dtprv_wrapper .dtsb-searchBuilder' ).height()
          + $( '#dtprv_wrapper .dt-buttons' ).height()
          + $( '#dtprv_wrapper #dtprv_status' ).height()
          + $( '#dtprv_wrapper .dataTables_paginate' ).height()
          + $( '#dtprv_wrapper .dataTables_scrollHead' ).height()
        ;
  
        var iframe_height = 
          $( window ).height();
  
        var table_height = iframe_height - tools_height - 18;

        /*
        console.log( tools_height );
        console.log( iframe_height );
        console.log( table_height );
        */
       
        $( '.dataTables_scrollBody' ).css( 'max-height', '100vh' );
        $( '.dataTables_scrollBody' ).height( table_height );
  
      }, 1000 );

    }

      /* set event listeners */

      $( window ).on( 'resize' , function () {

        fit_datatable_to_window()
        
      });

      /*
      var resizeTO;
      $( window ).on( 'resize' , function () {

        // send message to parent window to set frame height
        clearTimeout( resizeTO );
        resizeTO = setTimeout(function() { 

          // console.log( 'DataTable window resize postMessage occurred at: '+new Date().getTime() );
          // console.log( $( '#dtprv_wrapper' ).height() );
          // window.parent.postMessage({ frameHeight: $( '#dtprv_wrapper' ).height() }, '*'); 
          console.log( $( document ).height() );
          var document_height = $( document ).height();

          console.log( $( '#twdh_dtprv_wrapper' ).height() );
          var wrapper_height = $( '#twdh_dtprv_wrapper' ).height();

          console.log( $( '#dtprv_wrapper' ).height() );
          var table_height = $( '#dtprv_wrapper' ).height();

          var new_table_height = table_height + ( document_height - wrapper_height );
          console.log( new_table_height );

          // $( '#dtprv' ).height( new_table_height );
          $( '#dtprv' ).height( 300 );

        }, 1000 );

        // send another message 1 second later to clean up because sometimes the first height is a miscalculation
        // setTimeout(function() { window.parent.postMessage({ frameHeight: $( '#dtprv_wrapper' ).height() }, '*'); }, 1000 );
        
      });
      */




      datatable.on( 'draw.dt', function () {

        // console.log( 'DataTable redraw occurred at: '+new Date().getTime() );

        // set bootstrap tooltips on truncated cells
        jQuery('[data-toggle="tooltip"]').tooltip()
  
        // send message to parent window to set frame height
        window.parent.postMessage({ frameHeight: $( 'html' ).height() }, '*');

        // send another message 1 second later to clean up because sometimes the first height is a miscalculation
        setTimeout(function() { window.parent.postMessage({ frameHeight: $( 'html' ).height() }, '*'); }, 1000 );

      });
              
      datatable.on('init.dt', function() {

        // console.log( 'DataTable initialized occurred at: '+new Date().getTime() );

        // send message to parent window to set frame height
        window.parent.postMessage({ frameHeight: $( 'html' ).height() }, '*');

        // send another message 1 second later to clean up because sometimes the first height is a miscalculation
        setTimeout(function() { window.parent.postMessage({ frameHeight: $( 'html' ).height() }, '*'); }, 1000 );


      });

      /* Replace built in rotating ellipsis animation with TWDH preferred FontAwesome circle-o-notch animation */
      $( 'div.dataTables_processing' ).html( '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>' );

    }

  }
});
