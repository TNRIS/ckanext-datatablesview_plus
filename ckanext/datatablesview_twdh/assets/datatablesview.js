var table_rows_per_page = 10;

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

        // turn on desired visible dom components
        // dom: 'BQlfrtip',
        // dom: 'QBlfrtip',
        // dom: 'QBipfrt',

        // turn on search highlighting
        mark: true,

        // turn on row selection
        select: true,

        // turn on row searchBuilder
        searchBuilder: {
          depthLimit: 2
        },
        
        // turn on column reordering
        colReorder: false,

        // Set search placeholder text
        language: {
          search: "",
          searchPlaceholder: "Search..."
        },

        // turn on state saving
        stateSave: true,

        // ajax: "/datatables/ajax/c0c41b19-8373-4bef-8482-d1d1cd214514",

        /*

        "ajax": {
          "url": "/datatables/ajax/c0c41b19-8373-4bef-8482-d1d1cd214514",
          "type": "POST",
          "data": ""
        },
        */

        // turn on scroller
        scrollY:        "50vh",
        deferRender:    true,
        scrollCollapse: true,
        scroller:       true,

        // buttons:['copy','colvis','print','createState', 'savedStates'],
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
          /*
          {
            extend: 'searchBuilder',
            config: {
                depthLimit: 2
            }
          }
          */

        ],
        // buttons:['colvis','excel','print','searchBuilder'],
        // buttons:['colvis','print','createState', 'savedStates'],
        // buttons:['colvis','print'],

        // "sPaginationType": "extStyle",
        pagingType: 'full_numbers',
        "pageLength": table_rows_per_page,


        "initComplete": function(settings, json) {
          console.log( 'DataTables has finished its initialisation.' );
        },

        search: {
          "smart": true,
          "regex": false,
          "return": false
        },
      

        // turn on table metadata display
        infoCallback: function( settings, start, end, max, total, pre ) {
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

        // "bAutoWidth": false,

        /*
        // truncate cell text to 50 characters and add tooltip for remainder
        columnDefs: [ {
          targets: '_all',
          render: $.fn.dataTable.render.ellipsis( 50, true, true )
        } ],
        */

        /*
        columnDefs: [
          {
              targets: 1,
              render: DataTable.render.datetime('MMM Do YYYY'),
          },
        ],
        */

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



      /* set event listeners */

      /*
      var resizeTO;
      $( window ).on( 'resize' , function () {


        // send message to parent window to set frame height
        clearTimeout( resizeTO );
        resizeTO = setTimeout(function() { 
          // console.log( 'DataTable window resize postMessage occurred at: '+new Date().getTime() );
          // console.log( $( '#dtprv_wrapper' ).height() );
          window.parent.postMessage({ frameHeight: $( '#dtprv_wrapper' ).height() }, '*'); 
        }, 1000 );

        // send another message 1 second later to clean up because sometimes the first height is a miscalculation
        // setTimeout(function() { window.parent.postMessage({ frameHeight: $( '#dtprv_wrapper' ).height() }, '*'); }, 1000 );
        
      });
      */

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

          $( '#dtprv' ).height( new_table_height );


        }, 1000 );

        // send another message 1 second later to clean up because sometimes the first height is a miscalculation
        // setTimeout(function() { window.parent.postMessage({ frameHeight: $( '#dtprv_wrapper' ).height() }, '*'); }, 1000 );
        
      });




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

/**
* This pagination plug-in provides pagination controls for DataTables which
* match the style and interaction of the ExtJS library's grid component.
*
*  @name ExtJS style
*  @summary Pagination in the styling of ExtJS
*  @author [Zach Curtis](http://zachariahtimothy.wordpress.com/)
*
*  @example
*    $(document).ready(function() {
*        $('#example').dataTable( {
*            "sPaginationType": "extStyle"
*        } );
*    } );
*/

$.fn.dataTableExt.oApi.fnExtStylePagingInfo = function ( oSettings )
{
  return {
    "iStart":         oSettings._iDisplayStart,
    "iEnd":           oSettings.fnDisplayEnd(),
    "iLength":        oSettings._iDisplayLength,
    "iTotal":         oSettings.fnRecordsTotal(),
    "iFilteredTotal": oSettings.fnRecordsDisplay(),
    "iPage":          oSettings._iDisplayLength === -1 ?
      0 : Math.ceil( oSettings._iDisplayStart / oSettings._iDisplayLength ),
    "iTotalPages":    oSettings._iDisplayLength === -1 ?
      0 : Math.ceil( oSettings.fnRecordsDisplay() / oSettings._iDisplayLength )
  };
};

$.fn.dataTableExt.oPagination.extStyle = {

  "fnInit": function (oSettings, nPaging, fnCallbackDraw) {

    var oPaging = oSettings.oInstance.fnExtStylePagingInfo();

    var nFirst = $('<span/>', { 'class': 'paginate_button first' , text : "" }).append('<i class="fa fa-angle-double-left" aria-hidden="true"></i>');
    var nPrevious = $('<span/>', { 'class': 'paginate_button previous' , text : "" }).append('<i class="fa fa-angle-left" aria-hidden="true"></i>');
    var nNext = $('<span/>', { 'class': 'paginate_button next' , text : "" }).append('<i class="fa fa-angle-right" aria-hidden="true"></i>');
    var nLast = $('<span/>', { 'class': 'paginate_button last' , text : "" }).append('<i class="fa fa-angle-double-right" aria-hidden="true"></i>');
    // nPageTxt = $("<span />", { text: '' });

    // nPageNumBox = $('<input />', { type: 'text', val: 1, 'size': 4, 'class': 'paginate_input_box' });

    
    var nStartRowBox = $('<span />', { type: 'text', text: 1, 'size': 4, 'class': 'start_row_input_box' });
    var nRowHyphen = $('<span />', { text: '-', 'class': 'range_separator' });
    var nEndRowBox = $('<span />', { type: 'text', text: oPaging.iLength, 'size': 4, 'class': 'end_row_input_box' });


    // console.log( oPaging );
    // nPageOf = $('<span />', { text: '/' });
    // nTotalPages = $('<span />', { class :  "paginate_total" , text : oPaging.iTotalPages });

    // check to make sure the pager is necessary
    // if( oPaging.iTotal > oPaging.iLength ) {
      $(nPaging)
        .append(nFirst)
        .append(nPrevious)
        // .append(nPageTxt)
        // .append(nPageNumBox)
        .append(nStartRowBox)
        .append(nRowHyphen)
        .append(nEndRowBox)
        // .append(nPageOf)
        // .append(nTotalPages)
        .append(nNext)
        .append(nLast)
        ;
    /*
    } else {
      // if not hide the container
      $( '#dtprv_paginate' ).css( 'display', 'none' );

    }
    */

    nFirst.click(function () {
      if( $(this).hasClass("disabled") )
        return;
      oSettings.oApi._fnPageChange(oSettings, "first");
      fnCallbackDraw(oSettings);
    }).bind('selectstart', function () { return false; });

    nPrevious.click(function () {
      if( $(this).hasClass("disabled") )
        return;
      oSettings.oApi._fnPageChange(oSettings, "previous");
      fnCallbackDraw(oSettings);
    }).bind('selectstart', function () { return false; });

    nNext.click(function () {
      if( $(this).hasClass("disabled") )
        return;
      oSettings.oApi._fnPageChange(oSettings, "next");
      fnCallbackDraw(oSettings);
    }).bind('selectstart', function () { return false; });

    nLast.click(function () {
      if( $(this).hasClass("disabled") )
        return;
      oSettings.oApi._fnPageChange(oSettings, "last");
      fnCallbackDraw(oSettings);
    }).bind('selectstart', function () { return false; });

    /*
    nPageNumBox.change(function () {
      var pageValue = parseInt($(this).val(), 10) - 1 ; // -1 because pages are 0 indexed, but the UI is 1
      var oPaging = oSettings.oInstance.fnPagingInfo();

      if(pageValue === NaN || pageValue<0 ){
        pageValue = 0;
      }else if(pageValue >= oPaging.iTotalPages ){
        pageValue = oPaging.iTotalPages -1;
      }
      oSettings.oApi._fnPageChange(oSettings, pageValue);
      fnCallbackDraw(oSettings);
    });
    */

  },


  "fnUpdate": function (oSettings, fnCallbackDraw) {
    if (!oSettings.aanFeatures.p) {
      return;
    }

    var oPaging = oSettings.oInstance.fnExtStylePagingInfo();

    /* Loop over each instance of the pager */
    var an = oSettings.aanFeatures.p;

    $(an).find('span.paginate_total').html(oPaging.iTotalPages);
    $(an).find('.paginate_input_box').val(oPaging.iPage+1);

    $(an).find('.start_row_input_box').html( ( oPaging.iPage * oPaging.iLength ) +1);

    $(an).find('.end_row_input_box').html( 
      ( oPaging.iPage * oPaging.iLength ) + oPaging.iLength > oPaging.iFilteredTotal ?
        oPaging.iFilteredTotal : ( oPaging.iPage * oPaging.iLength ) + oPaging.iLength
    
    );

    $(an).each(function(index,item) {

      var $item = $(item);

      if (oPaging.iPage == 0) {
        var prev = $item.find('span.paginate_button.first').add($item.find('span.paginate_button.previous'));
        prev.addClass("disabled");
      } else {
        var prev = $item.find('span.paginate_button.first').add($item.find('span.paginate_button.previous'));
        prev.removeClass("disabled");
      }

      if (oPaging.iPage+1 == oPaging.iTotalPages) {
        var next = $item.find('span.paginate_button.last').add($item.find('span.paginate_button.next'));
        next.addClass("disabled");
      } else {
        var next = $item.find('span.paginate_button.last').add($item.find('span.paginate_button.next'));
        next.removeClass("disabled");
      }
    });
  }
};

jQuery.fn.dataTableExt.oApi.fnPagingInfo = function ( oSettings )
{
  return {
    "iStart":         oSettings._iDisplayStart,
    "iEnd":           oSettings.fnDisplayEnd(),
    "iLength":        oSettings._iDisplayLength,
    "iTotal":         oSettings.fnRecordsTotal(),
    "iFilteredTotal": oSettings.fnRecordsDisplay(),
    "iPage":          oSettings._iDisplayLength === -1 ?
      0 : Math.ceil( oSettings._iDisplayStart / oSettings._iDisplayLength ),
    "iTotalPages":    oSettings._iDisplayLength === -1 ?
      0 : Math.ceil( oSettings.fnRecordsDisplay() / oSettings._iDisplayLength )
  };
};



/**
 * This data rendering helper method can be useful for cases where you have
 * potentially large data strings to be shown in a column that is restricted by
 * width. The data for the column is still fully searchable and sortable, but if
 * it is longer than a give number of characters, it will be truncated and
 * shown with ellipsis. A browser provided tooltip will show the full string
 * to the end user on mouse hover of the cell.
 *
 * This function should be used with the `dt-init columns.render` configuration
 * option of DataTables.
 *
 * It accepts three parameters:
 *
 * 1. `-type integer` - The number of characters to restrict the displayed data
 *    to.
 * 2. `-type boolean` (optional - default `false`) - Indicate if the truncation
 *    of the string should not occur in the middle of a word (`true`) or if it
 *    can (`false`). This can allow the display of strings to look nicer, at the
 *    expense of showing less characters.
 * 2. `-type boolean` (optional - default `false`) - Escape HTML entities
 *    (`true`) or not (`false` - default).
 *
 *  @name ellipsis
 *  @summary Restrict output data to a particular length, showing anything
 *      longer with ellipsis and a browser provided tooltip on hover.
 *  @author [Allan Jardine](http://datatables.net)
 *  @requires DataTables 1.10+
 *
 * @returns {Number} Calculated average
 *
 *  @example
 *    // Restrict a column to 17 characters, don't split words
 *    $('#example').DataTable( {
 *      columnDefs: [ {
 *        targets: 1,
 *        render: $.fn.dataTable.render.ellipsis( 17, true )
 *      } ]
 *    } );
 *
 *  @example
 *    // Restrict a column to 10 characters, do split words
 *    $('#example').DataTable( {
 *      columnDefs: [ {
 *        targets: 2,
 *        render: $.fn.dataTable.render.ellipsis( 10 )
 *      } ]
 *    } );
 */

 jQuery.fn.dataTable.render.ellipsis = function ( cutoff, wordbreak, escapeHtml ) {
	var esc = function ( t ) {
		return t
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
			.replace( /"/g, '&quot;' );
	};

	return function ( d, type, row ) {
		// Order, search and type get the original data
		if ( type !== 'display' ) {
			return d;
		}

		if ( typeof d !== 'number' && typeof d !== 'string' ) {
			return d;
		}

		d = d.toString(); // cast numbers

    // d = d.replace("\n", "<br/>"); // HTML encode newline characters

		if ( d.length <= cutoff ) {
			return d;
		}

		var shortened = d.substr(0, cutoff-1);

		// Find the last white space character in the string
		if ( wordbreak ) {
			shortened = shortened.replace(/\s([^\s]*)$/, '');
		}

		// Protect against uncontrolled HTML input
		if ( escapeHtml ) {
			shortened = esc( shortened );
		}

    /* 
    Set up tooltips so that the first 50% of rows in a page have the tooltipon the bottom and the second 50% of rows have the tooltip on the top.
    This is necessary because otherwise there are cases where a tooltip falls outside the iframe and is invisible in either the first or last row.
    This could be set up so that only the first (or last) row changes tooltip direction, but it 'feels' better on the page to have it switch locations at the mid-point
    */

    var tooltip_location = '';
    var tooltip_class = '';

    if ( ( row[0] % table_rows_per_page ) / table_rows_per_page > 0.5 | ( row[0] % table_rows_per_page ) == 0  ) {

      tooltip_location = 'top';
      tooltip_class = 'tooltip-top';

    } else {

      tooltip_location = 'bottom';
      tooltip_class = 'tooltip-bottom';

    }
    
    return '<div class="ellipsis ' + tooltip_class + '" data-toggle="tooltip" data-placement="' + tooltip_location + '" title="'+esc(d)+'">'+shortened+'&#8230;</div>';

	};

};
