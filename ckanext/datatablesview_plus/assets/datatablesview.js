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
        "language": {
          search: "",
          searchPlaceholder: "Search..."
        },
        "sPaginationType": "extStyle",
        "pageLength": 20,
        "infoCallback": function( settings, start, end, max, total, pre ) {
          return total + " records";
        },
        "headerCallback": function( thead, data, start, end, display ) {

          $(thead).find('th').eq(0).html( 'ID' );

          // replace column header labels with those from the data dictionary if available
          var datadict = JSON.parse( $('#dtprv_wrapper table').attr( 'data-datadictionary' ) );
          $( datadict ).each( function( i ) {
            if( 'info' in datadict[i] && datadict[i].info.label != '' ) {
              $(thead).find('th').eq(i+1).html( datadict[i].info.label );
            }
          });
        }
      });




      var dtprv_status = $( '<div id="dtprv_status"><p class="warning"><span title="" class="error-icon"></span>Data shown below reflects a snapshot of the full dataset. This preview includes the first XXXX records out of ZZZZZ records and was last updated on DD/MM/YYYY. Use the DOWNLOAD ALL button at the top of this page to access the full dataset.</p></div>' );
      dtprv_status.insertBefore( '#dtprv_processing' );

      datatable.on('draw.dt', function() {
        // console.log( 'datatable redraw' );
        window.parent.postMessage({ frameHeight: $( 'html' ).height() }, '*');
      });

      datatable.on('init.dt', function() {
        console.log( 'datatable initialized' );
        window.parent.postMessage({ frameHeight: $( 'html' ).height() }, '*');
      });

      // Adds download dropdown to buttons menu
      datatable.button().add(2, {
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

    // nFirst = $('<span/>', { 'class': 'paginate_button first' , text : "" }).append('<i class="fa fa-angle-double-left" aria-hidden="true"></i>');
    nPrevious = $('<span/>', { 'class': 'paginate_button previous' , text : "" }).append('<i class="fa fa-angle-left" aria-hidden="true"></i>');
    nNext = $('<span/>', { 'class': 'paginate_button next' , text : "" }).append('<i class="fa fa-angle-right" aria-hidden="true"></i>');
    // nLast = $('<span/>', { 'class': 'paginate_button last' , text : "" }).append('<i class="fa fa-angle-double-right" aria-hidden="true"></i>');
    // nPageTxt = $("<span />", { text: '' });

    // nPageNumBox = $('<input />', { type: 'text', val: 1, 'size': 4, 'class': 'paginate_input_box' });

    
    nStartRowBox = $('<input />', { type: 'text', val: 1, 'size': 4, 'class': 'start_row_input_box' });
    nRowHyphen = $('<span />', { text: '-', 'class': 'range_separator' });
    nEndRowBox = $('<input />', { type: 'text', val: oPaging.iLength, 'size': 4, 'class': 'end_row_input_box' });


    // nPageOf = $('<span />', { text: '/' });
    // nTotalPages = $('<span />', { class :  "paginate_total" , text : oPaging.iTotalPages });


    $(nPaging)
      // .append(nFirst)
      .append(nPrevious)
      // .append(nPageTxt)
      // .append(nPageNumBox)
      .append(nStartRowBox)
      .append(nRowHyphen)
      .append(nEndRowBox)
      // .append(nPageOf)
      // .append(nTotalPages)
      .append(nNext)
      // .append(nLast)
      ;

    /*
    nFirst.click(function () {
      if( $(this).hasClass("disabled") )
        return;
      oSettings.oApi._fnPageChange(oSettings, "first");
      fnCallbackDraw(oSettings);
    }).bind('selectstart', function () { return false; });
    */

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

    /*
    nLast.click(function () {
      if( $(this).hasClass("disabled") )
        return;
      oSettings.oApi._fnPageChange(oSettings, "last");
      fnCallbackDraw(oSettings);
    }).bind('selectstart', function () { return false; });
    */

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

    $(an).find('.start_row_input_box').val( ( oPaging.iPage * oPaging.iLength ) +1);

    $(an).find('.end_row_input_box').val( 
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
