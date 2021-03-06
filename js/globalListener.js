// Variable holding the canvas for tools (e.g. selection)
var canvasTools;
// Variable holding context of tool canvas
var ctxTools;
// Variable holding information about current select-rectangle
var rectTools;
// True if view-mode is on, false if selection mode isn on
var dragTools=false;
// Variable holdung top layer of tools
var containerTools;
// Current selected menu node id
var currentMenuNodeId=1;
// Current mouse x
var currentMouseX=0;
// Current mouse y
var currentMouseY=0;
// Variable holding data sent by parent frame
var recievedDataJSON="";

var widthTreeBefore=350;

// addEventListener support for IE8
function bindEvent(element, eventName, eventHandler) 
{
	if (element.addEventListener)
	{
		element.addEventListener(eventName, eventHandler, false);
	} 
	else if (element.attachEvent) 
	{
		element.attachEvent('on' + eventName, eventHandler);
	}
}

bindEvent(window, 'message', function (e) 
{
    recievedDataJSON = e.data;
});

$(function () 
{ 
    document.onmousemove = handleMouseMove;

    // Update variables whenever the mouse moves
    function handleMouseMove(event) 
	{
		var dot, eventDoc, doc, body, pageX, pageY;
        event = event || window.event; // IE-ism

        // If pageX/Y aren't available and clientX/Y are,
        // calculate pageX/Y - logic taken from jQuery.
        // (This is to support old IE)
        if (event.pageX == null && event.clientX != null) 
		{
            eventDoc = (event.target && event.target.ownerDocument) || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            event.pageX = event.clientX +
              (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
              (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
              (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
              (doc && doc.clientTop  || body && body.clientTop  || 0 );
        }

		currentMouseX = event.pageX;
		currentMouseY = event.pageY;
    }
	
	// Initialize left-side menu
	$('#theory_tree').jstree(
	{
		'core' : 
		{
			"check_callback" : true,
			"themes" : { "stripes" : false,"icons":false },
		},	
		"types" : 
		{
			"default" : 
			{
			  "valid_children" : ["default","file"]
			}
		 },

		"plugins" : 
		[
			"contextmenu", "dnd", "search",
			"state", "types", "wholerow"
		]
	}); 
	 
	var jsonURL="http://neuralocean.de/graph/test/menu.json";
	//var jsonURL=menuEntriesURL;
	lazyParent="#";
	$.get(jsonURL, addTreeNodes);

	// If menu-node was selected
	$("#theory_tree").on("select_node.jstree",
		function(evt, data)
		{
			lastGraphDataUsed=data.node.original.graphdata;
			var y = currentMouseY - 16;
            var x = currentMouseX + 4;

			$(".custom-menu-side").finish().show(10).
			// In the right position (the mouse)
			css({
				top: y + "px",
				left: x + "px",
			});
			evt.preventDefault();
		}
	);
	
	// If the menu element is clicked
	$(".custom-menu-side li").click(function()
	{
		var type=$(this).attr("data-action");
		
		if(type!="close")
		{
			createNewGraph(type, lastGraphDataUsed);
		}
			
		// Hide it AFTER the action was triggered
		$(".custom-menu-side").hide(10);
	});

	// If left-menu node is opened
	$("#theory_tree").on("open_node.jstree",
		function(evt, data)
		{
			$(".custom-menu-side").hide(10);
			lazyParent=data.node.original.id;
			var nodeServerId=data.node.original.serverId;
			data.node.children=[];
			if(alreadyAdded[nodeServerId]!=true)
			{
				var jsonURL=menuEntriesURL+data.node.original.serverId;
				alreadyAdded[nodeServerId]=true;
				$.get(jsonURL, addTreeNodes);
			}
		}
	);
});

$(document).bind("contextmenu", function (event) 
{
	// Avoid the real menu
	event.preventDefault();
});


$(document).ready(function() 
{
	//$('button').button();
	// Accordion
	$(".accordion").accordion({ header: "h3" });
	// Tabs
	$('#tabs').tabs();
	// Button Set
	$("#radio1").buttonset();
	$( "#methodCluster" ).selectmenu();
		
	canvasTools=document.getElementById('toolCanvas');
	ctxTools=canvasTools.getContext('2d');
	rectTools = {};
	containerTools = $("#toolCanvas");

	var canvasOffset=containerTools.offset();
    var offsetX=canvasOffset.left;
    var offsetY=canvasOffset.top;
	
    containerTools.on("mousemove", function(e) 
	{

        if (dragTools==true && selectionMode==true) 
		{ 
			rectTools.w = e.offsetX  - rectTools.startX;
			rectTools.h = e.offsetY  - rectTools.startY ;

			ctxTools.clearRect(0, 0, canvasTools.width, canvasTools.height);
            ctxTools.setLineDash([5]);
            ctxTools.strokeStyle = "rgb(0, 102, 0)";
            ctxTools.strokeRect(rectTools.startX, rectTools.startY, rectTools.w, rectTools.h);
            ctxTools.setLineDash([]);
            ctxTools.fillStyle = "rgba(0, 255, 0, 0.2)";
            ctxTools.fillRect(rectTools.startX, rectTools.startY, rectTools.w, rectTools.h);
        }
    });

    containerTools.on("mousedown", function(e) 
	{
        if (selectionMode==true) 
		{ 
			rectTools.w=0;
			rectTools.h=0;
            rectTools.startX = e.offsetX ;
            rectTools.startY = e.offsetY ;
            dragTools = true;   
        }
    }); 

    containerTools.on("mouseup", function(e) 
	{
        if (dragTools==true) 
		{ 
            dragTools = false;
            theoryGraph.selectNodesInRect(rectTools);
			ctxTools.clearRect(0, 0, canvasTools.width, canvasTools.height);
			switchSelectionMode();
        }
    });
});

// Resize Section //
var divW = 0;
jQuery(document).ready(function()
{
	checkResize();
});

// Do resizing of canvas to always fit whole screen
function checkResize()
{
	var w = jQuery("#theory_tree_div").width();
	//if (w != divW) 
	{
		divW = w;
		
		var treeDiv = jQuery('#theory_tree_div');
		
		var htmlCanvas = document.getElementById('toolCanvas');
		htmlCanvas.width = (window.innerWidth-36)|0;
		htmlCanvas.height = (window.innerHeight-74)|0;
		htmlCanvas.style.width=htmlCanvas.width+"px";
		htmlCanvas.style.height=htmlCanvas.height+"px";

		htmlCanvas = document.getElementById('mainbox');
		htmlCanvas.width = (window.innerWidth-36)|0;
		htmlCanvas.style.width=htmlCanvas.width+"px";
		
		htmlCanvas = document.getElementById('wholeNetwork');
		htmlCanvas.width = (window.innerWidth-36)|0;
		htmlCanvas.height = (window.innerHeight-74)|0;
		htmlCanvas.style.width=htmlCanvas.width+"px";
		htmlCanvas.style.height=htmlCanvas.height+"px";
	}
}
jQuery(window).resize(checkResize);
//var timer = setInterval(checkResize, 250);


function resizeMenuDiv()
{ 
	var sideNav=document.getElementById("mySidenav");
	var tree=document.getElementById("theory_tree_div");

	var currWidth=tree.offsetWidth;

	if(widthTreeBefore!=currWidth)
	{
		widthTreeBefore=currWidth;
		sideNav.style.width=(widthTreeBefore+16)+"px";
	}
}

window.setInterval(resizeMenuDiv, 200);
