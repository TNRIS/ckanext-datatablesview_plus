var table_rows_per_page = 1000;
var show_sharesearch_banner = true;

var run_query = function (params, format) {

  var form = $('#filtered-datatables-download');

  /* remove hidden inputs if they exist */
  form.find('input[name="params"]').remove();
  form.find('input[name="format"]').remove();

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

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
      return entityMap[s];
    });
  }


  return {
    initialize: function () {

      // Initialize datatable. To set options on DataTable, use data- attribute 
      // tags in templates/datatables/datatables_view.html
      var datatable = jQuery('#dtprv').DataTable({

        // Setup search highlighting
        mark: true,

        // define default column order
        order: [[0, 'asc']],

        // Setup searchBuilder
        searchBuilder: {
          depthLimit: 2
        },

        // Set column reordering
        colReorder: false,

        // Set language strings
        language: {
          emptyTable: 'No matching rows found',
          zeroRecords: 'No matching records found',
          lengthMenu: '_MENU_ rows per page',
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
            add: '<i class="fa fa-plus" aria-hidden="true"></i> Add Filter',
            clearAll: '<i class="fa fa-times" aria-hidden="true"></i> CLEAR ALL',
            delete: '<i class="fa fa-times" aria-hidden="true"></i>',
            right: '<i class="fa fa-chevron-right" aria-hidden="true"></i>',
            left: '<i class="fa fa-chevron-left" aria-hidden="true"></i>',
            data: 'Field'

          }
        },

        lengthMenu: [
          [10, 100, 1000],
          ['10', '100', '1,000']
        ],

        deferRender: true,

        // turn on scroller
        paging: false,
        scrollX: true,
        scrollY: "60vh",
        scrollCollapse: true,

        columnDefs: [
          {
            width: '20px',
            targets: 0
          },
          {
            targets: '_all',
            render: DataTable.render.text()
          }
        ],

        buttons: [
          /*
          Temporarily turning download buttons off
          
          {
            extend: 'csvHtml5',
            text: 'CSV <i class="fa fa-download" aria-hidden="true"></i>',
            fieldSeparator: ',',
            filename: $('#dtprv').attr('data-filename'),
            extension: '.csv',
            exportOptions: {
              format: {
                header: function (data, columnIdx) {
                  return get_export_header(columnIdx);
                }
              },
              columns: [function (idx, data, node) {
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
            filename: $('#dtprv').attr('data-filename'),
            extension: '.tsv',
            exportOptions: {
              format: {
                header: function (data, columnIdx) {
                  return get_export_header(columnIdx);
                }
              },
              columns: [function (idx, data, node) {
                return idx === 0 ?
                  false : true;
              }
              ]
            }
          },
          */
          {
            extend: 'copy',
            text: '<i class="fa fa-copy" aria-hidden="true"></i> COPY SELECTED',
            title: 'Copy Selected',
            className: 'btn-rowselect',
            exportOptions: {
              format: {
                header: function (data, columnIdx) {
                  return get_export_header(columnIdx);
                }
              },
              columns: [function (idx, data, node) {
                return idx === 0 ?
                  false : true;
              }
              ]
            }
          },
          {
            extend: 'print',
            text: '<i class="fa fa-print" aria-hidden="true"></i> PRINT SELECTED',
            title: 'Print Selected',
            className: 'btn-rowselect',
            exportOptions: {
              format: {
                header: function (data, columnIdx) {
                  return get_export_header(columnIdx);
                }
              },
              columns: [function (idx, data, node) {
                return idx === 0 ?
                  false : true;
              }
              ]
            }
          },
          {
            text: '<i class="fa fa-link" aria-hidden="true"></i> Share Search',
            title: "",
            className: 'btn-sharesearch',
            action: function ( e, dt, node, config ) {
              var state = datatable.stateRestore.state.add("Share Search " + Date.now() );
              const url = new URL(window.location.href);
              let dtprv_state = url.searchParams.get('dtprv_state');
              $( '#dtprv_state' ).val( dtprv_state );

              if( _inIframe() ) {
                if( _sameOrigin() ) {
                  // In an iFrame on the same domain
                  console.log( 'In an iframe on the same domain')
                  window.parent.postMessage({ shareSearch: dtprv_state }, '*');
                } else {
                  // In an iFrame not on the same domain
                  console.log( 'In an iframe not on the same domain')
                }
              } else {
                console.log( 'Not in an iframe, aka in "Fullscreen" mode')
                // Not in an iFrame, aka in 'Fullscreen' mode
              }
              
            }
          },
        ],

        pagingType: 'full_numbers',
        "pageLength": table_rows_per_page,

        /* 
        Trying to remove the _id option from the Term filter in SearchBuilder. 
        Need to figure out how to do this generically for all columns instead 
        of having to code it column-by-column which is untenable for our needs 
        since we don't know the columns beforehand
        https://datatables.net/extensions/searchbuilder/examples/customisation/plugin.html

        init: function(that, fn, preDefined = null) {

          alert( 'hello' );
          let el = $('.dtsb-data');

          $(el).on('dtsb-inserted', function(){
            alert( 'hello' );
          });

        },

        */

        "initComplete": function (settings, json) {

          // console.log('DataTables has finished init.');
          setup_select_buttons();
          setup_searchbuilder_buttons();
          update_filenames();
          add_advanced_search_button();

        },

        search: {
          "smart": true,
          "regex": false,
          "return": false
        },

        "drawCallback": function( settings ) {

          console.log( 'DataTables has redrawn the table' );
          
          update_sharesearch();

        },

        // turn on table metadata display
        infoCallback: function (settings, start, end, max, total, pre) {

          var rows_per_page = $('select[name="dtprv_length"]').val();

          if (total <= rows_per_page) {

            // console.log( 'hide pagination' );
            $('.dataTables_paginate').hide();

          } else {

            // console.log( 'show pagination' );
            $('.dataTables_paginate').show();

          }

          if( total == 0 ) {

            // return "0 rows found";
            return "";

          } else {

            return "Showing " + start.toLocaleString("en-US") + "-" + end.toLocaleString("en-US") + " of " + total.toLocaleString("en-US") + "  row" + (total != 1 ? 's' : '');

          }
          
        },

        headerCallback: function (thead, data, start, end, display) {

          $(thead).find('th').eq(0).html('');

          // replace column header labels with those from the data dictionary if available
          var datadict = JSON.parse($('#dtprv_wrapper table').attr('data-datadictionary'));

          $(datadict).each(function (i) {

            var label = escapeHtml( datadict[i].id );

            if (
              'info' in datadict[i] && 
              typeof datadict[i].info.label !== 'undefined' && 
              datadict[i].info.label !== false && 
              datadict[i].info.label !== '' 

            ) {

              label = escapeHtml( datadict[i].info.label );
              column = escapeHtml( datadict[i].id );

              if (datadict[i].id != datadict[i].info.label) {
                label = '<div class="dtlabel">' + column + '</div>' + 
                  '<div class="small dim">' + label + '</div>';
              }

            }

            if (
              'info' in datadict[i] && 
              typeof datadict[i].info.unit !== 'undefined' && 
              datadict[i].info.unit !== false && 
              datadict[i].info.unit !== '' 
            ) {

              unit = escapeHtml( datadict[i].info.unit );
              label = label + '<div class="small dim">(' + unit + ')</div>';
              
            }

            if( label != '' ) {

              $(thead).find('th').eq(i + 1).html(label);

            }

            // Stash the original term as an attribute so that we can use it when exporting data
            $(thead).find('th').eq(i + 1).attr('data-term', datadict[i].id);

          });

          // set column widths based on information in summary statistics
          var data_summary_json = $('#dtprv_wrapper table').attr('data-summary-statistics');
          if (typeof data_summary_json !== 'undefined' && data_summary_json !== false && data_summary_json !== '' ) {
            var data_summary = JSON.parse(data_summary_json);
            $(data_summary).each(function (i) {
              var column_class = '';
              if ('type' in data_summary[i] && data_summary[i].type == 'String') {
                if ('max_length' in data_summary[i]) {
                  if (data_summary[i].max_length > 1000) {
                    column_class = 'gt1000';
                  } else if (data_summary[i].max_length > 500) {
                    column_class = 'gt500';
                  } else if (data_summary[i].max_length > 100) {
                    column_class = 'gt100';
                  }
                }
                if ('field' in data_summary[i] && data_summary[i].field != '') {
                  $(thead).find('th#' + data_summary[i].field).addClass(column_class);
                }
              }
            });
          }

        },

        "rowCallback": function( row, data ) {

          var count = 0;
          for (const d of data) {
            if( d == 'None' ){ $('td:eq('+count+')', row).html( '' ); }
            count++;
          }
          /*
          if ( data.grade == "A" ) {
            $('td:eq(4)', row).html( '<b>A</b>' );
          }
          */
        },


        // turn on state saving
        stateSave: true,


        /* 
          stateSaveCallback and stateLoadCallback are configured here in order to allow us to have a 'share' link for table state
          Inspired by this helpful stackexchange post:
          https://stackoverflow.com/questions/55446923/datatables-1-10-using-savestate-to-remember-filtering-and-order-but-need-to-upd/60708638#60708638
        */

        // This URL correctly restores state
        // http://192.168.7.200:5000/dataset/springs-monitoring-program-flow-measurements/resource/c85caaa8-f16e-43c8-9cda-25d86e88d3a6/view/9bef11ef-c705-4589-a0b9-d89f0043162d?dtprv_state=eyJ0aW1lIjoxNjk0MDUzMTcwNzczLCJzdGFydCI6MCwibGVuZ3RoIjoxMDAwLCJvcmRlciI6W1swLCJhc2MiXV0sInNlYXJjaCI6eyJzZWFyY2giOiJIdWRzcGV0aCIsInNtYXJ0Ijp0cnVlLCJyZWdleCI6ZmFsc2UsImNhc2VJbnNlbnNpdGl2ZSI6dHJ1ZX0sImNvbHVtbnMiOlt7InZpc2libGUiOnRydWUsInNlYXJjaCI6eyJzZWFyY2giOiIiLCJzbWFydCI6dHJ1ZSwicmVnZXgiOmZhbHNlLCJjYXNlSW5zZW5zaXRpdmUiOnRydWV9fSx7InZpc2libGUiOnRydWUsInNlYXJjaCI6eyJzZWFyY2giOiIiLCJzbWFydCI6dHJ1ZSwicmVnZXgiOmZhbHNlLCJjYXNlSW5zZW5zaXRpdmUiOnRydWV9fSx7InZpc2libGUiOnRydWUsInNlYXJjaCI6eyJzZWFyY2giOiIiLCJzbWFydCI6dHJ1ZSwicmVnZXgiOmZhbHNlLCJjYXNlSW5zZW5zaXRpdmUiOnRydWV9fSx7InZpc2libGUiOnRydWUsInNlYXJjaCI6eyJzZWFyY2giOiIiLCJzbWFydCI6dHJ1ZSwicmVnZXgiOmZhbHNlLCJjYXNlSW5zZW5zaXRpdmUiOnRydWV9fSx7InZpc2libGUiOnRydWUsInNlYXJjaCI6eyJzZWFyY2giOiIiLCJzbWFydCI6dHJ1ZSwicmVnZXgiOmZhbHNlLCJjYXNlSW5zZW5zaXRpdmUiOnRydWV9fSx7InZpc2libGUiOnRydWUsInNlYXJjaCI6eyJzZWFyY2giOiIiLCJzbWFydCI6dHJ1ZSwicmVnZXgiOmZhbHNlLCJjYXNlSW5zZW5zaXRpdmUiOnRydWV9fSx7InZpc2libGUiOnRydWUsInNlYXJjaCI6eyJzZWFyY2giOiIiLCJzbWFydCI6dHJ1ZSwicmVnZXgiOmZhbHNlLCJjYXNlSW5zZW5zaXRpdmUiOnRydWV9fSx7InZpc2libGUiOnRydWUsInNlYXJjaCI6eyJzZWFyY2giOiIiLCJzbWFydCI6dHJ1ZSwicmVnZXgiOmZhbHNlLCJjYXNlSW5zZW5zaXRpdmUiOnRydWV9fSx7InZpc2libGUiOnRydWUsInNlYXJjaCI6eyJzZWFyY2giOiIiLCJzbWFydCI6dHJ1ZSwicmVnZXgiOmZhbHNlLCJjYXNlSW5zZW5zaXRpdmUiOnRydWV9fSx7InZpc2libGUiOnRydWUsInNlYXJjaCI6eyJzZWFyY2giOiIiLCJzbWFydCI6dHJ1ZSwicmVnZXgiOmZhbHNlLCJjYXNlSW5zZW5zaXRpdmUiOnRydWV9fSx7InZpc2libGUiOnRydWUsInNlYXJjaCI6eyJzZWFyY2giOiIiLCJzbWFydCI6dHJ1ZSwicmVnZXgiOmZhbHNlLCJjYXNlSW5zZW5zaXRpdmUiOnRydWV9fV0sInNlbGVjdCI6eyJyb3dzIjpbXSwiY29sdW1ucyI6W10sImNlbGxzIjpbXX0sImNoaWxkUm93cyI6W10sInNlYXJjaEJ1aWxkZXIiOnt9LCJwYWdlIjowfQ%3D%3D
        
        stateSaveCallback: function (settings, data) {

          //encode current state to base64

          // console.log( 'start stateLoadCallback +=-=+=-=+=-=+=-=+=-=+=-=+=-=+=-=' );

          // console.log( data );
          var json = JSON.stringify(data)
          // console.log( json );
          const state = btoa(json);
          // console.log( state )


          // console.log( data );
          // console.log( state );

          //get query part of the url
          let searchParams = new URLSearchParams(window.location.search);

          //add encoded state into query part
          searchParams.set($(this).attr('id') + '_state', state);

          //form url with new query parameter
          const newRelativePathQuery = window.location.pathname + '?' + searchParams.toString() + window.location.hash;

          //push new url into history object, this will change the current url without need of reload
          history.pushState(null, '', newRelativePathQuery);
          
          // console.log( 'end stateLoadCallback +=-=+=-=+=-=+=-=+=-=+=-=+=-=+=-=' );

        },
        stateLoadCallback: function (settings) {
          // console.log( 'stateLoadCallback' );

          // DO NOT use URL: searchParams.get() for retrieving the dtprv_state param because it is base64 encoded and searchParams will URL decode this which corrupts the base64 encoding
          // https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams
          
          var params = _getUrlVars()
          let state = params['dtprv_state'];

          // console.log( params['dtprv_state'] );


          //check the current url to see if we've got a state to restore
          if (!state) {
            return null;
          }
          //if we got the state, decode it and add current timestamp
          

          // console.log( state );
          var tmp = atob(state)
          // console.log( tmp );
          state = JSON.parse(tmp);
          // console.log( state );
          state['time'] = Date.now();

          $( '#dtprv_state' ).val( state );

          // console.log( state );

          return state;

        },
        stateLoaded: function(settings, data) {

          console.log( 'Saved filter was: '+data.search.search );

        }

      });

      // Add a button to the search box to allow users to clear the search
      $('#dtprv_filter input[type="search"]').after('<button class="dt-search-cancel"><i class="fa fa-times-circle" aria-hidden="true"></i></button>');

      /* Update header based on whether DataTable is a preview or a full dataset */
      var dtprv_is_preview = $('#dtprv_is_preview').val();
      var dtprv_preview_rows = parseInt($('#dtprv_preview_rows').val());
      var dtprv_total_record_count = parseInt($('#dtprv_total_record_count').val());
      var dtprv_date_modified = $('#dtprv_metadata_modified').val();
      var dtprv_status = $('');

      if (dtprv_is_preview == 'True') {

        dtprv_status = $(
          '<div id="dtprv_status">' +
          '<p class="warning"><span title="" class="error-icon"></span> ' +
          'Only the first ' + dtprv_preview_rows.toLocaleString("en-US") + ' rows of this dataset are shown in the data viewer due to storage restrictions. ' +
          'Download the full dataset to access all ' + dtprv_total_record_count.toLocaleString("en-US") + ' rows.' +
          '</p>' +
          '</div>'
        );
        dtprv_status.insertBefore('#dtprv_processing');
        $('.dt-buttons').css('display', 'none');

      } else {

        // Show pointer cursor when hovering over selectable body of table
        $('#dtprv tbody').css('cursor', 'pointer');

        // var dtprv_status = $( '<div id="dtprv_status"><p class="">This data was last updated on ' + dtprv_date_modified + '.</p></div>' );
        // dtprv_status.insertBefore( '#dtprv_processing' );

        /* Add click callback to handle when the clear all button is clicked in Search Builder */
        onElementInserted('.dtsb-searchBuilder', '.dtsb-clearAll', function (element) {
          $(element).click(function () {
            $('.dt-free-text-search').css('display', 'block');
            $('#dtprv_wrapper .dtsb-searchBuilder').css('display', 'none');
          });
          $( element ).addClass( 'btn btn-secondary' );
        });

        /* Add click callback to handle when the Search Builder is activated */
        onElementInserted('.dtsb-searchBuilder', '.dtsb-add', function (element) {
          $(element).click(function () {
            $('.dt-free-text-search').css('display', 'none');
            $('#dtprv_wrapper .dtsb-searchBuilder').css('display', 'block');
            cancel_simple_search();
          });

          // Set class to style SB buttons
          $( element ).addClass( 'btn btn-secondary' );
          $('#dtprv_wrapper .dtsb-left').addClass('btn-secondary');
          $('#dtprv_wrapper .dtsb-right').addClass('btn-secondary');
          $('#dtprv_wrapper .dtsb-delete').addClass('btn-secondary');

        });

        /* Add input callback to monitor criteria settings and add/remove warning class for empty criteria */
        onElementInserted('.dtsb-searchBuilder', '.dtsb-value', function (element) {
          // console.log(element);
          $(element).on('input', function () {
            // console.log('.dtsb-value edited');
          });
        });

        /* Add click callback to display free text search input when 
          Search Builder is deactivated by removing the last filter 
          criteria 
        */
        onElementInserted('.dtsb-searchBuilder', '.dtsb-delete', function (element) {
          $(element).click(function () {
            var conditions = $('.dtsb-searchBuilder').find('.dtsb-delete');
            if (conditions.length == 0) {
              $('.dt-free-text-search').css('display', 'block');
              $('#dtprv_wrapper .dtsb-searchBuilder').css('display', 'none');
            }
          });
        });

        /* Add callback to display free text search input when
          Search Builder is deactivated by removing the last filter group
        */         
        onElementInserted('.dtsb-searchBuilder', '.dtsb-clearGroup', function (element) {
          $(element).click(function () {
            var conditions = $('.dtsb-searchBuilder').find('.dtsb-clearGroup');
            if (conditions.length == 0) {
              $('.dt-free-text-search').css('display', 'block');
              $('#dtprv_wrapper .dtsb-searchBuilder').css('display', 'none');
            }
          });
        });

      }


      // Detect whether the window is in an iframe
      function _inIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
      }

      // Detect whether an iframe is from the same origin as the parent window
      // Returns true if called from a parent window (i.e. not an iframe)
      function _sameOrigin() {

        if( window.self !== window.top ) {

          const self = new URL(document.referrer);
          const frame = new URL(document.location.href);

          return self.origin === frame.origin;

        } else {

          return true;

        }

      }
    

      // Read a page's GET URL variables and return them as an associative array WITHOUT any url decoding.
      function _getUrlVars()
      {
          var vars = [], hash;
          var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
          for(var i = 0; i < hashes.length; i++)
          {
              hash = hashes[i].split('=');
              vars.push(hash[0]);
              vars[hash[0]] = hash[1];
          }
          return vars;
      }


      /* Replace built in rotating ellipsis animation with TWDH preferred FontAwesome circle-o-notch animation */
      $('div.dataTables_processing').html('<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>');

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
      resizeObserver.observe(document.querySelector("#dtplus_dtprv_wrapper"));

      /* select button show/hide */

      var selectTimeout;

      function update_filenames() {

        // console.log();

      }

      function setup_searchbuilder_buttons() {


      }

      function setup_select_buttons() {

        // We don't want the btn-group styling
        $('.dt-buttons').removeClass('btn-group');

        $('.dt-buttons button').addClass('btn-tertiary');
        $('.dt-buttons button.btn-rowselect.btn-tertiary').css('display', 'none');
        $('.dt-buttons button.btn-sharesearch.btn-tertiary').css('display', 'none');

        $('<button class="btn btn-sharesearch btn-disabled"><span><i class="fa fa-link" aria-hidden="true"></i> SHARE SEARCH</span></button> ').insertBefore( $('.dt-buttons .btn-sharesearch') );
        $('<button class="btn btn-rowselect btn-disabled"><span><i class="fa fa-print" aria-hidden="true"></i> PRINT SELECTED</span></button> ').insertBefore( $('.dt-buttons .buttons-print') );
        $('<button class="btn btn-rowselect btn-disabled"><span><i class="fa fa-copy" aria-hidden="true"></i> COPY SELECTED</span></button> ').insertBefore( $('.dt-buttons .buttons-copy') );



      }

      function update_sharesearch_banner() {

        var params = _getUrlVars()
        let sharesearch = params['sharesearch'];
        console.log( show_sharesearch_banner );

        if( show_sharesearch_banner && sharesearch == 1 ) {

          $( '#dtprv_wrapper' ).prepend( '<div id="sharesearch_status">This search was loaded from a Share Search link.</div>' );
          // only show once upon arrival
          show_sharesearch_banner = false;

        } else {

          $( '#sharesearch_status' ).remove();

        }

      }


      /* Show/Hide Share Search button */
      function update_sharesearch() {

        update_sharesearch_banner();

        var activate = false;
        var state = datatable.state();
        console.log( state );

        if( state.searchBuilder !== undefined && state.searchBuilder.criteria !== undefined ) {
          for (const c of state.searchBuilder.criteria) {
            if (
              c.condition !== undefined &&
              c.data !== undefined &&
              c.value.length > 0
            ) {
              activate = true;
              break;
            }

          }
        }
        
        if( 
          state.search['search'].trim().length > 0  ||
          ( state.searchBuilder && state.searchBuilder.length > 0 )
        ) {

          activate = true;

        }

        if( activate ) {

          $('.dt-buttons button.btn-sharesearch.btn-tertiary').css('display', 'inline-block');
          $('.dt-buttons button.btn-sharesearch.btn-disabled').css('display', 'none');

        } else {

          $('.dt-buttons button.btn-sharesearch.btn-tertiary').css('display', 'none');
          $('.dt-buttons button.btn-sharesearch.btn-disabled').css('display', 'inline-block');

        }

      }

      /* Show/Hide selection toolbar */
      function update_select_buttons() {

        var count = datatable.rows({ selected: true }).count();

        if (count > 0) {

          if (dtprv_is_preview == 'False') {

            $('.dt-buttons button.btn-rowselect').css('display', 'inline-block');
            $('.dt-buttons button.btn-rowselect.btn-disabled').css('display', 'none');
    
          }

        } else {

          $('.dt-buttons button.btn-rowselect').css('display', 'none');
          $('.dt-buttons button.btn-rowselect.btn-disabled').css('display', 'inline-block');
  
        }

      }

      /* Deactivate select */
      function deactivate_select() {

        $('.dt-buttons button.btn-tertiary').css('display', 'none');
        $('.dt-buttons button.btn-disabled').css('display', 'inline-block');
        
      }

      function add_advanced_search_button() {

        // Add button
        var container = $('#dtprv_wrapper').find('.advanced-search');
        container.append( '<button class="btn btn-default btn-secondary"><i class="fa fa-filter" aria-hidden="true"></i> Advanced Filters</button>' );

        // Set click event on button
        var button = $('#dtprv_wrapper .advanced-search').find('button');
        $(button).click(function () {

          $('.dt-free-text-search').css('display', 'none');
          // console.log( 'advanced search button clicked' );
        
          $( '#dtprv_wrapper .dtsb-searchBuilder > .dtsb-group > .dtsb-add' ).click();


        });

      }

      datatable.on('select', function (e, dt, type, indexes) {

        update_select_buttons();

      });

      datatable.on('deselect', function (e, dt, type, indexes) {

        /* Use this timeout sequence to avoid 'flashing' effect when deselecting/reselecting in one click */
        clearTimeout(selectTimeout);
        selectTimeout = setTimeout(() => { update_select_buttons(); }, 100);

      });


      /* Toggle button on the search box allowing users to clear the search */
      $('#dtprv_filter input[type=search]').on('input', function () {

        if ($(this).val() == '') {

          $('#dtprv_filter .dt-search-cancel').css('display', 'none');

        } else {

          $('#dtprv_filter .dt-search-cancel').css('display', 'block');

        }

      });

      /* React to search event */
      datatable.on( 'search.dt', function () {

        // console.log('search happened');
        deactivate_select();

      } );

      /* React to click of search clear button */
      $('#dtprv_filter .dt-search-cancel').click(function () {

          cancel_simple_search();

      });

      function cancel_simple_search() {

        datatable.search('').draw();
        $('#dtprv_filter .dt-search-cancel').css('display', 'none');


      }

      /* Get column header with 'true' label for export files */
      function get_export_header(i) {

        return $('#dtprv thead').find('th').eq(i).attr('data-term');

      }

      /*
      const observer = new MutationObserver(function(mutations_list) {
        mutations_list.forEach(function(mutation) {
          console.log( 'removed nodes' );
          mutation.removedNodes.forEach(function(removed_node) {
            if( $( removed_node ).hasClass( 'dtsb-clearAll' ) ) {

              console.log(removed_node);
              $('#dtprv_filter').css( 'display', 'block' );
              // observer.disconnect();
            }
          });
        });
      });
      
      observer.observe(document.querySelector("#dtprv_wrapper"), { subtree: true, childList: true });
      */


      /* Set up a callback function when an element is inserted into the dom */
      function onElementInserted(containerSelector, elementSelector, callback) {
        /*
          containerSelector: element under which to watch for a new element
          elementSelector:   the element to watch for
          callback:         the function to call when elementSelector is found
        */

        var onMutationsObserved = function (mutations) {
          mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length) {
              var elements = $(containerSelector).find(elementSelector);
              for (var i = 0, len = elements.length; i < len; i++) {
                callback(elements[i]);
              }
            }
          });
        };

        var target = $(containerSelector)[0];
        var config = { attributes: true, characterData: true, childList: true, subtree: true };
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        var observer = new MutationObserver(onMutationsObserved);
        observer.observe(target, config);

      }

    }

  }
  
});
