this.ckan.module('datatablesview_plus', function (jQuery) {

  // pager variables
  var table_rows_per_page = 1000;

  // 'Share Search' status variables
  var is_sharesearch = false;
  var is_failedsharesearch = false;
  var is_advancedsearch = false;
  var is_stateloaded = false;


  return {
    initialize: function () {

      $.fn.dataTable.ext.errMode = 'throw';
      
      // Initialize datatable. To set options on DataTable, use data-attribute 
      // tags in templates/datatables/datatables_view.html
      var datatable = jQuery('#dtprv').DataTable({

        // turn on search highlighting
        mark: true,

        // turn on stateSave
        stateSave: true,

        //  column order
        order: [[0, 'asc']],

        // disallow column reordering
        colReorder: false,

        // turn on searchBuilder
        searchBuilder: {
          depthLimit: 2,
          liveSearch: true
        },

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
        
        // We are not currently using the pager, but when we do these settings will be relevant
        lengthMenu: [
          [10, 100, 1000],
          ['10', '100', '1,000']
        ],
        pagingType: 'full_numbers',
        pageLength: table_rows_per_page,

        // We may want to turn this on? https://datatables.net/reference/option/deferRender
        deferRender: false,

        // turn on scroller
        paging: false,
        scrollX: true,
        scrollY: "60vh",
        scrollCollapse: true,

        search: {

          "smart": true,
          "regex": false,
          "return": false

        },

        columnDefs: [

          // make sure id column on far left stays narrow
          {
            width: '20px',
            targets: 0
          },

          // make sure all text is rendered as text in case tables have HTML in them
          {
            targets: '_all',
            //  render: DataTable.render.text();
            render: function(data, type, row){
              const regex1 = /T00:00:00$/;
              const regex2 = / 00:00:00$/;
              const regex3 = /^1899-12-31T/;
              const regex4 = /^1899-12-31 /;

              if( data.match(regex1) ||  data.match(regex2) ||  data.match(regex3) ||  data.match(regex4) ) {
                return data.replace( regex1, '' ).replace( regex2, '' ).replace( regex3, '' ).replace( regex4, '' );
              } else {
                return escapeHtml( data );
              }
              
            }

          }

        ],

        buttons: [

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

              var state = datatable.state();

              if( _inIframe() ) {

                if( _sameOrigin() ) {

                  // In an iFrame on the same domain
                  // Post message to parent window to show ShareSearch modal
                  // Parent window needs to be set up to catch this message and act accordingly.
                  // Currently this is accomplished by adding code to the theme extension, but 
                  // it would be better to move that code into this extension if we can figure 
                  // out how to do that.

                  window.parent.postMessage({ shareSearch: state }, '*');

                } else {

                  // In an iFrame not on the same domain
                  // Do nothing, we don't want Share Search capability on embedded tables because 
                  // thanks to CORS we can't do the required interwindow communication beteen the 
                  // iframe and the parent

                }

              } else {

                // Not in an iFrame, aka in 'Fullscreen' mode
                // Do nothing, we don't want Share Search capability on fullscreen tables
                // We could implement this - would need to set up the modal code to work in this case

              }
              
            }
          },

        ],

        initComplete: function (settings, json) {

          setup_select_buttons();
          setup_searchbuilder_buttons();
          add_advanced_search_button();

          // if this is a shared search that is in 'advanced' mode, update the display
          if( is_advancedsearch ) {

            toggle_search( 'advanced' );
  
          }

          // Disable ShareSearch if we are in fullscreen mode or embedded on a third party site
          if( ! _inIframe() || ! _sameOrigin() ) {

            $('.dt-buttons button.btn-sharesearch.btn-tertiary').css('display', 'none');
            $('.dt-buttons button.btn-sharesearch.btn-disabled').css('display', 'none');
  
          }


          // console.log( 'initComplete' );

        },

        drawCallback: function( settings ) {

          // console.log( 'drawCallback' );

          update_sharesearch();

          if( ! _inIframe() || ! _sameOrigin() ) {

            $('.dt-buttons button.btn-sharesearch.btn-tertiary').css('display', 'none');
            $('.dt-buttons button.btn-sharesearch.btn-disabled').css('display', 'none');
  
          }

          if( $('#dtprv_filter input[type=search]').val() != '' ) {

            $('#dtprv_filter .dt-search-cancel').css('display', 'block');

          }
          
        },

        infoCallback: function (settings, start, end, max, total, pre) {

          var rows_per_page = $('select[name="dtprv_length"]').val();

          if (total <= rows_per_page) {

            $('.dataTables_paginate').hide();

          } else {

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

          var label = '';
          var column = '';
          var unit = '';

          $(datadict).each(function (i) {

            label = escapeHtml( datadict[i].id );

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
          /* This is breaking the way columns render, turning off until we can figure out the problem
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
          */
        },

        rowCallback: function( row, data ) {

          var count = 0;
          for (const d of data) {
            if( d == 'None' ){ $('td:eq('+count+')', row).html( '' ); }
            count++;
          }

        },

        stateSaveCallback: function (settings, data) {

            const state = btoa(JSON.stringify(data));
            $('#dtprv_state').val( state );

            delete data.time;
            const search = JSON.stringify(data)
            // const search = btoa(json);
            $('#dtprv_search_current').val( search );


        },

        stateLoadCallback: function (settings) {

          let params = new URLSearchParams(document.location.search);
          let uuid = params.get( 'search' );
          let json = {};
          
          if( uuid != null ) {

            json = _getShareSearchUUID( uuid );
            if( json ) {
              if( json.search.search != '' ) {

                is_advancedsearch = false;

              } else if( json.searchBuilder !== undefined && json.searchBuilder.criteria !== undefined ) {
              
                is_advancedsearch = true;

              }

              is_sharesearch = true;

              if( ! is_stateloaded ) {

                delete json.time;
                const search = JSON.stringify(json)
                $('#dtprv_search_orig').val( search );

              }
              
              json['time'] = Date.now();
              
              is_stateloaded = true;

            } else {

              is_failedsharesearch = true;    

            }
                      
          }

          return json;

        },

        stateLoaded: function(settings, data) {

        }

      });
      // End of DataTable initilization

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
            toggle_search( 'simple' );
          });
          $( element ).addClass( 'btn btn-secondary' );
        });

        /* Add click callback to handle when the Search Builder is activated */
        onElementInserted('.dtsb-searchBuilder', '.dtsb-add', function (element) {

          $(element).click(function () {
            toggle_search( 'advanced' );
          });

          // Set class to style SB buttons
          $( element ).addClass( 'btn btn-secondary' );
          $('#dtprv_wrapper .dtsb-left').addClass('btn-secondary');
          $('#dtprv_wrapper .dtsb-right').addClass('btn-secondary');
          $('#dtprv_wrapper .dtsb-delete').addClass('btn-secondary');

        });

        /* Add input callback to monitor criteria settings and add/remove warning class for empty criteria */
        /*
        onElementInserted('.dtsb-searchBuilder', '.dtsb-value', function (element) {
          $(element).on('input', function () {
          });
        });
        */

        /* Add click callback to display free text search input when 
          Search Builder is deactivated by removing the last filter 
          criteria 
        */
        onElementInserted('.dtsb-searchBuilder', '.dtsb-delete', function (element) {
          $(element).click(function () {
            var conditions = $('.dtsb-searchBuilder').find('.dtsb-delete');
            if (conditions.length == 0) {
              toggle_search( 'simple' );
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
              toggle_search( 'simple' );
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
    
      /* Replace built in rotating ellipsis animation with TWDH preferred FontAwesome circle-o-notch animation */
      $('div.dataTables_processing').html('<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i>');

      /* 
        Observe iframe body height and post message to parent on resize
        window.onmessage in the theme js should catch this and resize the iframe as desired
      */
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentBoxSize) {
            const contentBoxSize = entry.contentBoxSize[0];
            window.parent.postMessage({ frameHeight: contentBoxSize.blockSize }, '*');
          }
        }
      });
      resizeObserver.observe(document.querySelector("#dtplus_dtprv_wrapper"));

      var selectTimeout;

      function setup_searchbuilder_buttons() {
      }

      function setup_select_buttons() {

        // TWDH doesn't want the btn-group styling
        $('.dt-buttons').removeClass('btn-group');

        $('.dt-buttons button').addClass('btn-tertiary');
        $('.dt-buttons button.btn-rowselect.btn-tertiary').css('display', 'none');
        $('.dt-buttons button.btn-sharesearch.btn-tertiary').css('display', 'none');

        $('<button class="btn btn-sharesearch btn-disabled" tabindex="-1"><span><i class="fa fa-link" aria-hidden="true"></i> SHARE SEARCH</span></button> ').insertBefore( $('.dt-buttons .btn-sharesearch') );
        $('<button class="btn btn-rowselect btn-disabled" tabindex="-1"><span><i class="fa fa-print" aria-hidden="true"></i> PRINT SELECTED</span></button> ').insertBefore( $('.dt-buttons .buttons-print') );
        $('<button class="btn btn-rowselect btn-disabled" tabindex="-1"><span><i class="fa fa-copy" aria-hidden="true"></i> COPY SELECTED</span></button> ').insertBefore( $('.dt-buttons .buttons-copy') );

      }

      function update_sharesearch_status() {

        // console.log( 'update_sharesearch_status' );

        if( is_failedsharesearch ) {

          // console.log( 'is_failedsharesearch' );

          $( '#sharesearch_status' ).html('<div class="warning"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i> Unable to find requested Share Search</div>');

      
        } else if( is_sharesearch ) {

          // console.log( 'is_sharesearch' );

          if( has_sharesearch_changed() ) {


            // console.log( 'sharesearch has changed' );

            $( '#sharesearch_status' ).html(
              '<div class="warning"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i> This search was loaded from a Share Search link, but has been modified.' +
              '<div class="reload"><button class="btn btn-secondary"  onclick="parent.location.reload();">Reload original Share Search</button></div>'
            );

          } else {

            // console.log( 'sharesearch has not changed' );

            $( '#sharesearch_status' ).html( 
              '<div class="notice"><i class="fa fa-info-circle" aria-hidden="true"></i> This search was loaded from a Share Search link.</div>'
            );

          }

        }

      }

      function has_sharesearch_changed() {

        // console.log( 'has_sharesearch_changed' );

        // console.log( $( '#dtprv_search_orig' ).val() );
        // console.log( $( '#dtprv_search_current' ).val() );

        return $( '#dtprv_search_orig' ).val() != $( '#dtprv_search_current' ).val()

      }

      /* Show/Hide Share Search button */
      function update_sharesearch() {

        update_sharesearch_status();

        var activate = false;
        var state = datatable.state();

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

          toggle_search( 'advanced' );
        
          if( $('#dtprv_wrapper .dtsb-searchBuilder').find('.dtsb-criteria').length == 0 ) {

            $( '#dtprv_wrapper .dtsb-searchBuilder > .dtsb-group > .dtsb-add' ).click();

          }

        });

      }

      function toggle_search( type ) {

        // console.log( 'Setting search to ' + type );

        if( type == 'simple' ) {

          if( $('.dt-free-text-search').css('display') != 'block' ) {

            // Cancel the current simple search so that it doesn't conflict with advanced search
            cancel_search( 'advanced' );
          
            $('.dt-free-text-search').css('display', 'block');
            $('.dtsb-searchBuilder').css('display', 'none');

          }

        }

        if( type == 'advanced' ) {

          if( $('.dt-free-text-search').css('display') != 'none' ) {

            // Cancel the current simple search so that it doesn't conflict with advanced search
            cancel_search( 'simple');

            $('.dt-free-text-search').css('display', 'none');
            $('.dtsb-searchBuilder').css('display', 'block');

          }

        }

      }

      function cancel_search( type ) {

        // console.log( 'Cancel ' + type + ' search' );

        if( type == 'simple' ) {

          datatable.search('').draw();
          $('#dtprv_filter .dt-search-cancel').css('display', 'none');
  
        } else if( type == 'advanced' ) {
        
        } else {

          // console.log( 'I don\'t know how to cancel a ' + type + ' search' );

        }

      }

      datatable.on( 'stateSaveParams.dt', function (e, settings, data) {
        
        update_sharesearch_status();

      });


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

        deactivate_select();

      } );

      /* React to click of search clear button */
      $('#dtprv_filter .dt-search-cancel').click(function () {

          cancel_search( 'simple' );

      });

      /* Get column header with 'true' label for export files */
      function get_export_header(i) {

        return $('#dtprv thead').find('th').eq(i).attr('data-term');

      }

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

      function _getShareSearchUUID( uuid ) {

        var query = 'uuid=' + uuid;

        var response = $.ajax({

          type:'POST',
          url: '/datatables/sharesearch/get/',
          data: query,
          cache: false,
          async: false,

          success: function(response, status, xhr) {

          },

          error: function (xhr, ajaxOptions, thrownError) {

            console.log( 'AJAX sharesearch retrieval error' );
            console.log( thrownError );

          },

        });

        if( response.responseJSON != undefined ) {

          return JSON.parse( response.responseJSON );

        } else {

          return false;

        }
  
      }

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
    }

  }
  
});
