var table_rows_per_page = 100;

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

this.ckan.module('datatablesview_plus', function (jQuery) {
  return {
    initialize: function() {

      // Initialize datatable. To set options on DataTable, use data- attribute 
      // tags in templates/datatables/datatables_view.html
      var datatable = jQuery('#dtprv').DataTable({

        // Setup search highlighting
        mark: true,

        // Setup row selection
        select: true,

        order: [[ 0, 'asc' ]],

        // Setup searchBuilder
        searchBuilder: {
          depthLimit: 2
        },

        // Set column reordering
        colReorder: false,

        // Set strings
        language: {
          paginate: {
            first: '<i class="fa fa-angle-double-left" aria-hidden="true"></i>',
            previous: '<i class="fa fa-angle-left" aria-hidden="true"></i>',
            next: '<i class="fa fa-angle-right" aria-hidden="true"></i>',
            last: '<i class="fa fa-angle-double-right" aria-hidden="true"></i>'
          },
          search: '',
          searchPlaceholder: 'Search...',
          searchBuilder: {
              title: '',
              add: 'Add Filter',
              data: 'Field'

          }
        },

        // turn on state saving
        stateSave: true,

        lengthMenu: [
          [ 10, 100, 1000 ],
          [ '10', '100', '1,000' ]
        ],

        deferRender:    true,

        // turn on scroller
        paging: false,
        scrollX:        true,
        scrollY:        "60vh",

        columnDefs: [
          { 
            width: '20px', 
            targets: 0
          }
        ],
        
        buttons:[
          // 'createState', 'savedStates',
          {
            extend: 'csvHtml5',
            text: 'CSV <i class="fa fa-download" aria-hidden="true"></i>',
            fieldSeparator: ',',
            filename: $( '#dtprv' ).attr( 'data-filename' ),
            extension: '.csv',
            exportOptions: {
              format: {
                header: function ( data, columnIdx ) {
                  return get_export_header( columnIdx );
                }
              },
              columns: [ function ( idx, data, node ) {
                return idx === 0 ?
                  false : true;
                } 
              ] 
            }
          },
          {
            extend: 'csvHtml5',
            text: 'TSV <i class="fa fa-download" aria-hidden="true"></i>',
            fieldSeparator: '\t',
            filename: $( '#dtprv' ).attr( 'data-filename' ),
            extension: '.tsv',
            exportOptions: {
              format: {
                header: function ( data, columnIdx ) {
                  return get_export_header( columnIdx );                }
              },
              columns: [ function ( idx, data, node ) {
                return idx === 0 ?
                  false : true;
                } 
              ] 
            }
          },
          {
            extend: 'copy',
            text: 'COPY <i class="fa fa-copy" aria-hidden="true"></i>',
            title: null,
            exportOptions: {
              format: {
                header: function ( data, columnIdx ) {
                  return get_export_header( columnIdx );                }
              },
              columns: [ function ( idx, data, node ) {
                return idx === 0 ?
                  false : true;
                } 
              ] 
            }
          },
          {
            extend: 'print',
            text: 'PRINT <i class="fa fa-print" aria-hidden="true"></i>',
            title: "",
            exportOptions: {
              format: {
                header: function ( data, columnIdx ) {
                  return get_export_header( columnIdx );
                }
              },
              columns: [ function ( idx, data, node ) {
                return idx === 0 ?
                  false : true;
                } 
              ] 
            }
          },
        ],

        pagingType: 'full_numbers',
        "pageLength": table_rows_per_page,

        "initComplete": function(settings, json) {

          console.log( 'DataTables has finished its initialisation.' );
          update_select_buttons();
          update_filenames();

        },

        search: {
          "smart": true,
          "regex": false,
          "return": false
        },
      
        // turn on table metadata display
        infoCallback: function( settings, start, end, max, total, pre ) {

          var rows_per_page = $('select[name="dtprv_length"]').val();

          if( total <= rows_per_page ) {

            // console.log( 'hide pagination' );
            $( '.dataTables_paginate' ).hide();

          } else {

            // console.log( 'show pagination' );
            $( '.dataTables_paginate' ).show();

          }
          // console.log( settings );
          
          return "Showing " + start.toLocaleString("en-US") + "-" + end.toLocaleString("en-US") + " of " +  total.toLocaleString("en-US") + "  row" + ( total != 1 ? 's' : '' );
        },

        headerCallback: function( thead, data, start, end, display ) {

          $(thead).find('th').eq(0).html( '' );

          // replace column header labels with those from the data dictionary if available
          var datadict = JSON.parse( $('#dtprv_wrapper table').attr( 'data-datadictionary' ) );
          $( datadict ).each( function( i ) {
            if( 'info' in datadict[i] && datadict[i].info.label != '' ) {
              
              var label = datadict[i].info.label;
              if( datadict[i].id != datadict[i].info.label ) {
                label = '<div class="dtlabel">' + label + '</div>' + '<span class="small dim">' + datadict[i].id + '</span>';
              }
              $(thead).find('th').eq(i+1).html( label );
            }

            // Stash the original term as an attribute so that we can use it when exporting data
            $(thead).find('th').eq(i+1).attr('data-term', datadict[i].id );

          });


          // set column widths based on information in summary statistics
          var data_summary_json = $('#dtprv_wrapper table').attr( 'data-summary-statistics' );
          if (typeof data_summary_json !== 'undefined' && data_summary_json !== false) {
            var data_summary = JSON.parse( data_summary_json );
            $( data_summary ).each( function( i ) {
              var column_class = '';
              if( 'type' in data_summary[i] && data_summary[i].type == 'String' ) {
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



      /* Update header based on whether DataTable is a preview or a full dataset */
      var dtprv_is_preview = $( '#dtprv_is_preview' ).val();
      var dtprv_preview_rows = parseInt( $( '#dtprv_preview_rows' ).val() );
      var dtprv_total_record_count = parseInt( $( '#dtprv_total_record_count' ).val() );
      var dtprv_date_modified = $( '#dtprv_metadata_modified' ).val();
      var dtprv_status = $( '' );

      if( dtprv_is_preview == 'True' ) {

        dtprv_status = $( 
          '<div id="dtprv_status">' + 
          '<p class="warning"><span title="" class="error-icon"></span> ' + 
          'Only the first ' + dtprv_preview_rows.toLocaleString("en-US") + ' records of this dataset are shown in the data viewer due to storage restrictions. ' + 
          'Download the full dataset to access all ' + dtprv_total_record_count.toLocaleString("en-US") + ' records.' + 
          '</p>' + 
          '</div>' 
        );
        dtprv_status.insertBefore( '#dtprv_processing' );
      } else {
        // var dtprv_status = $( '<div id="dtprv_status"><p class="">This data was last updated on ' + dtprv_date_modified + '.</p></div>' );
        // dtprv_status.insertBefore( '#dtprv_processing' );
      }

      /* Replace built in rotating ellipsis animation with TWDH preferred FontAwesome circle-o-notch animation */
      $( 'div.dataTables_processing' ).html( '<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>' );

      /* 
      
        Observe iframe body height and post message to parent on resize
        window.onmessage in the theme js should catch this and resize the iframe as desired
      
      */
      const resizeObserver = new ResizeObserver((entries) => {
        // console.log( 'resizeObserver' );
        // console.log( entries );
        for (const entry of entries) {
          if (entry.contentBoxSize) {
            const contentBoxSize = entry.contentBoxSize[0];
            // console.log( 'resizeObserver: ' + contentBoxSize.blockSize );
            window.parent.postMessage({ frameHeight: contentBoxSize.blockSize }, '*'); 
          }
        }
      });
      resizeObserver.observe( document.querySelector("#dtprv_wrapper") );


      /* select button show/hide etc. */

      var selectTimeout;

      function update_filenames() {

        console.log(  );

      }

      function update_select_buttons() {

        // console.log( 'Updating select buttons' );
        var count = datatable.rows( { selected: true } ).count();

        // console.log( count + " rows selected" );

        if( count > 0 ) {

          if( !dtprv_is_preview ) {

            // console.log( 'showing select buttons' );
            $( '  .dt-buttons' ).fadeIn();

          }

        } else {

          // console.log( 'hiding select buttons' );
          $( '#dtprv_wrapper .dt-buttons' ).fadeOut();

        }

      }

      datatable.on( 'select', function ( e, dt, type, indexes ) {

        // console.log( 'select happened' );
        update_select_buttons();

      } );

      datatable.on( 'deselect', function ( e, dt, type, indexes ) {

        // console.log( 'deselect happened' );
        /* Use this timeout sequence to avoid 'flashing effect' when deselecting/reselecting in one click */
        clearTimeout( selectTimeout ) ;
        selectTimeout = setTimeout(() => { update_select_buttons(); }, 100);

      } );

      function get_export_header( i ) {

        return $( '#dtprv thead').find('th').eq(i).attr('data-term' );
      
      }
  
    }

  }
});
