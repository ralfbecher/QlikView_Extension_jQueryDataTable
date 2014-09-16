/*
Created by Ralf Becher - ralf.becher@tiq-solutions.de - TIQ Solutions, Leipzig, Germany
Tested on QV 11.2 SR5

TIQ Solutions takes no responsibility for any code.
Use at your own risk. 
*/

// This checks if the console is present, and if not it 
// sets it to an object with a blank function called log to
// prevent any error. Remove logging for production.
if(!window.console){ window.console = {log: function(){} }; } 

(function ($) {
	//own context, avoiding conflicts with other libraries, $=jQuery
	var _extension = 'jQueryDataTable';
    var _path = 'Extensions/' + _extension + '/';
	var _pathLong = Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only&name=' + _path;
	// detect WebView mode (QlikView Desktop)
	var _webview = window.location.host === 'qlikview';
	var _files = [];
	// create array with all need libraries
    _files.push(_path + 'js/jquery.dataTables.min.js');
    _files.push(_path + 'js/dataTables.responsive.js');
    _files.push(_path + 'js/jquery.format-1.3.min.js');

	// load all libraries as array, don't use nested Qva.LoadScript() calls
	Qv.LoadExtensionScripts(_files, 
		function () {
			// load css file
			Qva.LoadCSS((_webview ? _path : _pathLong) + 'css/jquery.dataTables.min.css');
			Qva.LoadCSS((_webview ? _path : _pathLong) + 'css/dataTables.responsive.css');
			Qva.LoadCSS((_webview ? _path : _pathLong) + 'css/jqdt-custom.css');

			Qv.AddExtension(_extension,
				function () {
					
					//console.log(this);
					
					//get dimension cell css class
					var pageSize = this.Layout.Text0.text.toString() * 1;

					//get dimension cell css class
					var dimensionCellClass = this.Layout.Text1.text.toString()
					
					//get dimension cell css class
					var measureCellClass = this.Layout.Text2.text.toString()

					//get labels for Measures
					var measureLabels = [];
					if (this.Layout.Text3.text.toString().length > 0)
						measureLabels = this.Layout.Text3.text.toString().split(',');

					//get text box value for Measure number format
					var numFormat = '#,##0';
					if (this.Layout.Text4.text.toString().length > 0)
						numFormat = this.Layout.Text4.text.toString();
					
					//get responsive checkbox
					var useResponsive = ((this.Layout.Text5.text.toString() * 1) == 1);

					// need a unique id to render table
					var _this = this;
					
					// Create new div element inside existing (QvContent)
					// set some additional css styles..
					var myDiv = $('<div />').css({
									height: this.GetHeight(),
									width: this.GetWidth(),
									overflow: 'auto',
									'font-family': 'Helvetica',
									'font-size': '0.8em'
								}).appendTo($(this.Element).empty());

					// How many rows do we have? Log it to console (see Firebug extension)
					console.log('Rows: '+this.Data.Rows.length);
					
					if (this.Data.Rows.length > 0) {
						// do something	with the div

						// get amount of Dimensions
						var nDimensions = this.Data.Rows[0].filter(function(col){return !(col.color == undefined);}).length;
						
						var myTable = $('<table />').attr({class: "display"}).appendTo(myDiv);
						var headerSet = $.map(this.Data.HeaderRows[0], function( column, index ){ 
											if(index < nDimensions) {
												return { 
														title: column.text, 
														targets: index, 
														className: "jqdtdimension-" + index + " " + dimensionCellClass
													};
											} else {
												if(measureLabels.length > 0 && index +1 - nDimensions <= measureLabels.length) {
													return { 
															title: measureLabels[index - nDimensions], 
															targets: index, 
															className: "jqdtmeasure-" + (index - nDimensions) + " " + measureCellClass
														};
												} else {
													return { 
															title: column.text, 
															targets: index, 
															className: "jqdtmeasure-" + (index - nDimensions) + " " + measureCellClass
														};
												}
											}
										});
						var dataSet = this.Data.Rows.map(function( row ){ 
											return $.map(row, function( column, index ){ 									
													if(index < nDimensions) {
														return column.text;
													} else {
														return $.format.number(Number(column.text), numFormat);
													}
												});
										});
						// render jQuery DataTable
						var myDataTable = myTable.DataTable({ 
							data: dataSet,
							pageLength: pageSize,
							columnDefs: headerSet, 
							dom: '<"toolbar">frtip',
							responsive: useResponsive
						});
						
						// gather cell click
						myTable.on( 'click', 'td', function () {
							if (myTable.attr('class').split(' ').filter(function (el){ return (el === 'collapsed')}).length == 1) {
								//resposive design collapsed view (plus icon left column)
								console.log("collapsed");
							} else {
								var classArr = $(this).attr('class').split(' ').filter(function (el){ return (el.indexOf('jqdtdimension-') >= 0);});
								if (classArr.length > 0) {
									var dimIdx = classArr[0].split('-')[1] * 1;
									// make selection
									_this.Data.SelectTextsInColumn(dimIdx, true, [myDataTable.cell( this ).data()]);
								} else {
									alert("Please make a selection in the first "+(nDimensions)+" columns (dimensions)..");
								}
							}
						});
					} else {
						myDiv.html('<p align="center"><b>No resulting rows to display..</b></p>');
					}
				});
		});
})(jQuery);

// helper code needed for html select element in config dialog
// remove if no select element needed
if (Qva.Mgr.mySelect == undefined) {
    Qva.Mgr.mySelect = function(owner, elem, name, prefix) {
        if (!Qva.MgrSplit(this, name, prefix)) return;
        owner.AddManager(this);
        this.Element = elem;
        this.ByValue = true;

        elem.binderid = owner.binderid;
        elem.Name = this.Name;

        elem.onchange = Qva.Mgr.mySelect.OnChange;
        elem.onclick = Qva.CancelBubble;
   }
   Qva.Mgr.mySelect.OnChange = function() {
    var binder = Qva.GetBinder(this.binderid);
    if (!binder.Enabled) return;
    if (this.selectedIndex < 0) return;
    var opt = this.options [this.selectedIndex];
    binder.Set (this.Name, 'text', opt.value, true);    
    }
    Qva.Mgr.mySelect.prototype.Paint = function(mode, node) {
        this.Touched = true;
        var element = this.Element;
        var currentValue = node.getAttribute("value");
        if (currentValue == null) currentValue = "";
        var optlen = element.options.length;
        element.disabled = mode != 'e';
        //element.value = currentValue;
        for (var ix = 0; ix < optlen; ++ix) {
             if(element.options[ix].value === currentValue){
                element.selectedIndex = ix;
             }
        }    
        element.style.display = Qva.MgrGetDisplayFromMode(this, mode);
        
   }
}