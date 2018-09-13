/** 5c2e2b0e5be94000c1682f9cd38a4095cf609e9f - ChronoTrack Systems Corp. admin.js built 2016-07-25T16:59:49+0200
 * Code not otherwise copyrighted is (C)opyright 2016, ChronoTrack Systems Corp. All rights reserved.
 */
/*mleibman-SlickGrid/lib/jquery.event.drop-2.2.js*/
/*! 
 * jquery.event.drop - v 2.2
 * Copyright (c) 2010 Three Dub Media - http://threedubmedia.com
 * Open Source MIT License - http://threedubmedia.com/code/license
 */
// Created: 2008-06-04 
// Updated: 2012-05-21
// REQUIRES: jquery 1.7.x, event.drag 2.2

;(function($){ // secure $ jQuery alias

// Events: drop, dropstart, dropend

// add the jquery instance method
$.fn.drop = function( str, arg, opts ){
  // figure out the event type
  var type = typeof str == "string" ? str : "",
  // figure out the event handler...
  fn = $.isFunction( str ) ? str : $.isFunction( arg ) ? arg : null;
  // fix the event type
  if ( type.indexOf("drop") !== 0 ) 
    type = "drop"+ type;
  // were options passed
  opts = ( str == fn ? arg : opts ) || {};
  // trigger or bind event handler
  return fn ? this.bind( type, opts, fn ) : this.trigger( type );
};

// DROP MANAGEMENT UTILITY
// returns filtered drop target elements, caches their positions
$.drop = function( opts ){ 
  opts = opts || {};
  // safely set new options...
  drop.multi = opts.multi === true ? Infinity : 
    opts.multi === false ? 1 : !isNaN( opts.multi ) ? opts.multi : drop.multi;
  drop.delay = opts.delay || drop.delay;
  drop.tolerance = $.isFunction( opts.tolerance ) ? opts.tolerance : 
    opts.tolerance === null ? null : drop.tolerance;
  drop.mode = opts.mode || drop.mode || 'intersect';
};

// local refs (increase compression)
var $event = $.event, 
$special = $event.special,
// configure the drop special event
drop = $.event.special.drop = {

  // these are the default settings
  multi: 1, // allow multiple drop winners per dragged element
  delay: 20, // async timeout delay
  mode: 'overlap', // drop tolerance mode
    
  // internal cache
  targets: [], 
  
  // the key name for stored drop data
  datakey: "dropdata",
    
  // prevent bubbling for better performance
  noBubble: true,
  
  // count bound related events
  add: function( obj ){ 
    // read the interaction data
    var data = $.data( this, drop.datakey );
    // count another realted event
    data.related += 1;
  },
  
  // forget unbound related events
  remove: function(){
    $.data( this, drop.datakey ).related -= 1;
  },
  
  // configure the interactions
  setup: function(){
    // check for related events
    if ( $.data( this, drop.datakey ) ) 
      return;
    // initialize the drop element data
    var data = { 
      related: 0,
      active: [],
      anyactive: 0,
      winner: 0,
      location: {}
    };
    // store the drop data on the element
    $.data( this, drop.datakey, data );
    // store the drop target in internal cache
    drop.targets.push( this );
  },
  
  // destroy the configure interaction  
  teardown: function(){ 
    var data = $.data( this, drop.datakey ) || {};
    // check for related events
    if ( data.related ) 
      return;
    // remove the stored data
    $.removeData( this, drop.datakey );
    // reference the targeted element
    var element = this;
    // remove from the internal cache
    drop.targets = $.grep( drop.targets, function( target ){ 
      return ( target !== element ); 
    });
  },
  
  // shared event handler
  handler: function( event, dd ){ 
    // local vars
    var results, $targets;
    // make sure the right data is available
    if ( !dd ) 
      return;
    // handle various events
    switch ( event.type ){
      // draginit, from $.event.special.drag
      case 'mousedown': // DROPINIT >>
      case 'touchstart': // DROPINIT >>
        // collect and assign the drop targets
        $targets =  $( drop.targets );
        if ( typeof dd.drop == "string" )
          $targets = $targets.filter( dd.drop );
        // reset drop data winner properties
        $targets.each(function(){
          var data = $.data( this, drop.datakey );
          data.active = [];
          data.anyactive = 0;
          data.winner = 0;
        });
        // set available target elements
        dd.droppable = $targets;
        // activate drop targets for the initial element being dragged
        $special.drag.hijack( event, "dropinit", dd ); 
        break;
      // drag, from $.event.special.drag
      case 'mousemove': // TOLERATE >>
      case 'touchmove': // TOLERATE >>
        drop.event = event; // store the mousemove event
        if ( !drop.timer )
          // monitor drop targets
          drop.tolerate( dd ); 
        break;
      // dragend, from $.event.special.drag
      case 'mouseup': // DROP >> DROPEND >>
      case 'touchend': // DROP >> DROPEND >>
        drop.timer = clearTimeout( drop.timer ); // delete timer  
        if ( dd.propagates ){
          $special.drag.hijack( event, "drop", dd ); 
          $special.drag.hijack( event, "dropend", dd ); 
        }
        break;
        
    }
  },
    
  // returns the location positions of an element
  locate: function( elem, index ){ 
    var data = $.data( elem, drop.datakey ),
    $elem = $( elem ), 
    posi = $elem.offset() || {}, 
    height = $elem.outerHeight(), 
    width = $elem.outerWidth(),
    location = { 
      elem: elem, 
      width: width, 
      height: height,
      top: posi.top, 
      left: posi.left, 
      right: posi.left + width, 
      bottom: posi.top + height
    };
    // drag elements might not have dropdata
    if ( data ){
      data.location = location;
      data.index = index;
      data.elem = elem;
    }
    return location;
  },
  
  // test the location positions of an element against another OR an X,Y coord
  contains: function( target, test ){ // target { location } contains test [x,y] or { location }
    return ( ( test[0] || test.left ) >= target.left && ( test[0] || test.right ) <= target.right
      && ( test[1] || test.top ) >= target.top && ( test[1] || test.bottom ) <= target.bottom ); 
  },
  
  // stored tolerance modes
  modes: { // fn scope: "$.event.special.drop" object 
    // target with mouse wins, else target with most overlap wins
    'intersect': function( event, proxy, target ){
      return this.contains( target, [ event.pageX, event.pageY ] ) ? // check cursor
        1e9 : this.modes.overlap.apply( this, arguments ); // check overlap
    },
    // target with most overlap wins  
    'overlap': function( event, proxy, target ){
      // calculate the area of overlap...
      return Math.max( 0, Math.min( target.bottom, proxy.bottom ) - Math.max( target.top, proxy.top ) )
        * Math.max( 0, Math.min( target.right, proxy.right ) - Math.max( target.left, proxy.left ) );
    },
    // proxy is completely contained within target bounds 
    'fit': function( event, proxy, target ){
      return this.contains( target, proxy ) ? 1 : 0;
    },
    // center of the proxy is contained within target bounds  
    'middle': function( event, proxy, target ){
      return this.contains( target, [ proxy.left + proxy.width * .5, proxy.top + proxy.height * .5 ] ) ? 1 : 0;
    }
  },  
  
  // sort drop target cache by by winner (dsc), then index (asc)
  sort: function( a, b ){
    return ( b.winner - a.winner ) || ( a.index - b.index );
  },
    
  // async, recursive tolerance execution
  tolerate: function( dd ){   
    // declare local refs
    var i, drp, drg, data, arr, len, elem,
    // interaction iteration variables
    x = 0, ia, end = dd.interactions.length,
    // determine the mouse coords
    xy = [ drop.event.pageX, drop.event.pageY ],
    // custom or stored tolerance fn
    tolerance = drop.tolerance || drop.modes[ drop.mode ];
    // go through each passed interaction...
    do if ( ia = dd.interactions[x] ){
      // check valid interaction
      if ( !ia )
        return; 
      // initialize or clear the drop data
      ia.drop = [];
      // holds the drop elements
      arr = []; 
      len = ia.droppable.length;
      // determine the proxy location, if needed
      if ( tolerance )
        drg = drop.locate( ia.proxy ); 
      // reset the loop
      i = 0;
      // loop each stored drop target
      do if ( elem = ia.droppable[i] ){ 
        data = $.data( elem, drop.datakey );
        drp = data.location;
        if ( !drp ) continue;
        // find a winner: tolerance function is defined, call it
        data.winner = tolerance ? tolerance.call( drop, drop.event, drg, drp ) 
          // mouse position is always the fallback
          : drop.contains( drp, xy ) ? 1 : 0; 
        arr.push( data ); 
      } while ( ++i < len ); // loop 
      // sort the drop targets
      arr.sort( drop.sort );      
      // reset the loop
      i = 0;
      // loop through all of the targets again
      do if ( data = arr[ i ] ){
        // winners...
        if ( data.winner && ia.drop.length < drop.multi ){
          // new winner... dropstart
          if ( !data.active[x] && !data.anyactive ){
            // check to make sure that this is not prevented
            if ( $special.drag.hijack( drop.event, "dropstart", dd, x, data.elem )[0] !== false ){  
              data.active[x] = 1;
              data.anyactive += 1;
            }
            // if false, it is not a winner
            else
              data.winner = 0;
          }
          // if it is still a winner
          if ( data.winner )
            ia.drop.push( data.elem );
        }
        // losers... 
        else if ( data.active[x] && data.anyactive == 1 ){
          // former winner... dropend
          $special.drag.hijack( drop.event, "dropend", dd, x, data.elem ); 
          data.active[x] = 0;
          data.anyactive -= 1;
        }
      } while ( ++i < len ); // loop    
    } while ( ++x < end ) // loop
    // check if the mouse is still moving or is idle
    if ( drop.last && xy[0] == drop.last.pageX && xy[1] == drop.last.pageY ) 
      delete drop.timer; // idle, don't recurse
    else  // recurse
      drop.timer = setTimeout(function(){ 
        drop.tolerate( dd ); 
      }, drop.delay );
    // remember event, to compare idleness
    drop.last = drop.event; 
  }
  
};

// share the same special event configuration with related events...
$special.dropinit = $special.dropstart = $special.dropend = drop;

})(jQuery); // confine scope  
/*mleibman-SlickGrid/lib/jquery.event.drag-2.2.js*/
/*! 
 * jquery.event.drag - v 2.2
 * Copyright (c) 2010 Three Dub Media - http://threedubmedia.com
 * Open Source MIT License - http://threedubmedia.com/code/license
 */
// Created: 2008-06-04 
// Updated: 2012-05-21
// REQUIRES: jquery 1.7.x

;(function( $ ){

// add the jquery instance method
$.fn.drag = function( str, arg, opts ){
  // figure out the event type
  var type = typeof str == "string" ? str : "",
  // figure out the event handler...
  fn = $.isFunction( str ) ? str : $.isFunction( arg ) ? arg : null;
  // fix the event type
  if ( type.indexOf("drag") !== 0 ) 
    type = "drag"+ type;
  // were options passed
  opts = ( str == fn ? arg : opts ) || {};
  // trigger or bind event handler
  return fn ? this.bind( type, opts, fn ) : this.trigger( type );
};

// local refs (increase compression)
var $event = $.event, 
$special = $event.special,
// configure the drag special event 
drag = $special.drag = {
  
  // these are the default settings
  defaults: {
    which: 1, // mouse button pressed to start drag sequence
    distance: 0, // distance dragged before dragstart
    not: ':input', // selector to suppress dragging on target elements
    handle: null, // selector to match handle target elements
    relative: false, // true to use "position", false to use "offset"
    drop: true, // false to suppress drop events, true or selector to allow
    click: false // false to suppress click events after dragend (no proxy)
  },
  
  // the key name for stored drag data
  datakey: "dragdata",
  
  // prevent bubbling for better performance
  noBubble: true,
  
  // count bound related events
  add: function( obj ){ 
    // read the interaction data
    var data = $.data( this, drag.datakey ),
    // read any passed options 
    opts = obj.data || {};
    // count another realted event
    data.related += 1;
    // extend data options bound with this event
    // don't iterate "opts" in case it is a node 
    $.each( drag.defaults, function( key, def ){
      if ( opts[ key ] !== undefined )
        data[ key ] = opts[ key ];
    });
  },
  
  // forget unbound related events
  remove: function(){
    $.data( this, drag.datakey ).related -= 1;
  },
  
  // configure interaction, capture settings
  setup: function(){
    // check for related events
    if ( $.data( this, drag.datakey ) ) 
      return;
    // initialize the drag data with copied defaults
    var data = $.extend({ related:0 }, drag.defaults );
    // store the interaction data
    $.data( this, drag.datakey, data );
    // bind the mousedown event, which starts drag interactions
    $event.add( this, "touchstart mousedown", drag.init, data );
    // prevent image dragging in IE...
    if ( this.attachEvent ) 
      this.attachEvent("ondragstart", drag.dontstart ); 
  },
  
  // destroy configured interaction
  teardown: function(){
    var data = $.data( this, drag.datakey ) || {};
    // check for related events
    if ( data.related ) 
      return;
    // remove the stored data
    $.removeData( this, drag.datakey );
    // remove the mousedown event
    $event.remove( this, "touchstart mousedown", drag.init );
    // enable text selection
    drag.textselect( true ); 
    // un-prevent image dragging in IE...
    if ( this.detachEvent ) 
      this.detachEvent("ondragstart", drag.dontstart ); 
  },
    
  // initialize the interaction
  init: function( event ){ 
    // sorry, only one touch at a time
    if ( drag.touched ) 
      return;
    // the drag/drop interaction data
    var dd = event.data, results;
    // check the which directive
    if ( event.which != 0 && dd.which > 0 && event.which != dd.which ) 
      return; 
    // check for suppressed selector
    if ( $( event.target ).is( dd.not ) ) 
      return;
    // check for handle selector
    if ( dd.handle && !$( event.target ).closest( dd.handle, event.currentTarget ).length ) 
      return;

    drag.touched = event.type == 'touchstart' ? this : null;
    dd.propagates = 1;
    dd.mousedown = this;
    dd.interactions = [ drag.interaction( this, dd ) ];
    dd.target = event.target;
    dd.pageX = event.pageX;
    dd.pageY = event.pageY;
    dd.dragging = null;
    // handle draginit event... 
    results = drag.hijack( event, "draginit", dd );
    // early cancel
    if ( !dd.propagates )
      return;
    // flatten the result set
    results = drag.flatten( results );
    // insert new interaction elements
    if ( results && results.length ){
      dd.interactions = [];
      $.each( results, function(){
        dd.interactions.push( drag.interaction( this, dd ) );
      });
    }
    // remember how many interactions are propagating
    dd.propagates = dd.interactions.length;
    // locate and init the drop targets
    if ( dd.drop !== false && $special.drop ) 
      $special.drop.handler( event, dd );
    // disable text selection
    drag.textselect( false ); 
    // bind additional events...
    if ( drag.touched )
      $event.add( drag.touched, "touchmove touchend", drag.handler, dd );
    else 
      $event.add( document, "mousemove mouseup", drag.handler, dd );
    // helps prevent text selection or scrolling
    if ( !drag.touched || dd.live )
      return false;
  },  
  
  // returns an interaction object
  interaction: function( elem, dd ){
    var offset = $( elem )[ dd.relative ? "position" : "offset" ]() || { top:0, left:0 };
    return {
      drag: elem, 
      callback: new drag.callback(), 
      droppable: [],
      offset: offset
    };
  },
  
  // handle drag-releatd DOM events
  handler: function( event ){ 
    // read the data before hijacking anything
    var dd = event.data;  
    // handle various events
    switch ( event.type ){
      // mousemove, check distance, start dragging
      case !dd.dragging && 'touchmove': 
        event.preventDefault();
      case !dd.dragging && 'mousemove':
        //  drag tolerance, x≤ + y≤ = distance≤
        if ( Math.pow(  event.pageX-dd.pageX, 2 ) + Math.pow(  event.pageY-dd.pageY, 2 ) < Math.pow( dd.distance, 2 ) ) 
          break; // distance tolerance not reached
        event.target = dd.target; // force target from "mousedown" event (fix distance issue)
        drag.hijack( event, "dragstart", dd ); // trigger "dragstart"
        if ( dd.propagates ) // "dragstart" not rejected
          dd.dragging = true; // activate interaction
      // mousemove, dragging
      case 'touchmove':
        event.preventDefault();
      case 'mousemove':
        if ( dd.dragging ){
          // trigger "drag"   
          drag.hijack( event, "drag", dd );
          if ( dd.propagates ){
            // manage drop events
            if ( dd.drop !== false && $special.drop )
              $special.drop.handler( event, dd ); // "dropstart", "dropend"             
            break; // "drag" not rejected, stop   
          }
          event.type = "mouseup"; // helps "drop" handler behave
        }
      // mouseup, stop dragging
      case 'touchend': 
      case 'mouseup': 
      default:
        if ( drag.touched )
          $event.remove( drag.touched, "touchmove touchend", drag.handler ); // remove touch events
        else 
          $event.remove( document, "mousemove mouseup", drag.handler ); // remove page events 
        if ( dd.dragging ){
          if ( dd.drop !== false && $special.drop )
            $special.drop.handler( event, dd ); // "drop"
          drag.hijack( event, "dragend", dd ); // trigger "dragend" 
        }
        drag.textselect( true ); // enable text selection
        // if suppressing click events...
        if ( dd.click === false && dd.dragging )
          $.data( dd.mousedown, "suppress.click", new Date().getTime() + 5 );
        dd.dragging = drag.touched = false; // deactivate element 
        break;
    }
  },
    
  // re-use event object for custom events
  hijack: function( event, type, dd, x, elem ){
    // not configured
    if ( !dd ) 
      return;
    // remember the original event and type
    var orig = { event:event.originalEvent, type:event.type },
    // is the event drag related or drog related?
    mode = type.indexOf("drop") ? "drag" : "drop",
    // iteration vars
    result, i = x || 0, ia, $elems, callback,
    len = !isNaN( x ) ? x : dd.interactions.length;
    // modify the event type
    event.type = type;
    // remove the original event
    event.originalEvent = null;
    // initialize the results
    dd.results = [];
    // handle each interacted element
    do if ( ia = dd.interactions[ i ] ){
      // validate the interaction
      if ( type !== "dragend" && ia.cancelled )
        continue;
      // set the dragdrop properties on the event object
      callback = drag.properties( event, dd, ia );
      // prepare for more results
      ia.results = [];
      // handle each element
      $( elem || ia[ mode ] || dd.droppable ).each(function( p, subject ){
        // identify drag or drop targets individually
        callback.target = subject;
        // force propagtion of the custom event
        event.isPropagationStopped = function(){ return false; };
        // handle the event 
        result = subject ? $event.dispatch.call( subject, event, callback ) : null;
        // stop the drag interaction for this element
        if ( result === false ){
          if ( mode == "drag" ){
            ia.cancelled = true;
            dd.propagates -= 1;
          }
          if ( type == "drop" ){
            ia[ mode ][p] = null;
          }
        }
        // assign any dropinit elements
        else if ( type == "dropinit" )
          ia.droppable.push( drag.element( result ) || subject );
        // accept a returned proxy element 
        if ( type == "dragstart" )
          ia.proxy = $( drag.element( result ) || ia.drag )[0];
        // remember this result 
        ia.results.push( result );
        // forget the event result, for recycling
        delete event.result;
        // break on cancelled handler
        if ( type !== "dropinit" )
          return result;
      }); 
      // flatten the results  
      dd.results[ i ] = drag.flatten( ia.results ); 
      // accept a set of valid drop targets
      if ( type == "dropinit" )
        ia.droppable = drag.flatten( ia.droppable );
      // locate drop targets
      if ( type == "dragstart" && !ia.cancelled )
        callback.update(); 
    }
    while ( ++i < len )
    // restore the original event & type
    event.type = orig.type;
    event.originalEvent = orig.event;
    // return all handler results
    return drag.flatten( dd.results );
  },
    
  // extend the callback object with drag/drop properties...
  properties: function( event, dd, ia ){    
    var obj = ia.callback;
    // elements
    obj.drag = ia.drag;
    obj.proxy = ia.proxy || ia.drag;
    // starting mouse position
    obj.startX = dd.pageX;
    obj.startY = dd.pageY;
    // current distance dragged
    obj.deltaX = event.pageX - dd.pageX;
    obj.deltaY = event.pageY - dd.pageY;
    // original element position
    obj.originalX = ia.offset.left;
    obj.originalY = ia.offset.top;
    // adjusted element position
    obj.offsetX = obj.originalX + obj.deltaX; 
    obj.offsetY = obj.originalY + obj.deltaY;
    // assign the drop targets information
    obj.drop = drag.flatten( ( ia.drop || [] ).slice() );
    obj.available = drag.flatten( ( ia.droppable || [] ).slice() );
    return obj; 
  },
  
  // determine is the argument is an element or jquery instance
  element: function( arg ){
    if ( arg && ( arg.jquery || arg.nodeType == 1 ) )
      return arg;
  },
  
  // flatten nested jquery objects and arrays into a single dimension array
  flatten: function( arr ){
    return $.map( arr, function( member ){
      return member && member.jquery ? $.makeArray( member ) : 
        member && member.length ? drag.flatten( member ) : member;
    });
  },
  
  // toggles text selection attributes ON (true) or OFF (false)
  textselect: function( bool ){ 
    $( document )[ bool ? "unbind" : "bind" ]("selectstart", drag.dontstart )
      .css("MozUserSelect", bool ? "" : "none" );
    // .attr("unselectable", bool ? "off" : "on" )
    document.unselectable = bool ? "off" : "on"; 
  },
  
  // suppress "selectstart" and "ondragstart" events
  dontstart: function(){ 
    return false; 
  },
  
  // a callback instance contructor
  callback: function(){}
  
};

// callback methods
drag.callback.prototype = {
  update: function(){
    if ( $special.drop && this.available.length )
      $.each( this.available, function( i ){
        $special.drop.locate( this, i );
      });
  }
};

// patch $.event.$dispatch to allow suppressing clicks
var $dispatch = $event.dispatch;
$event.dispatch = function( event ){
  if ( $.data( this, "suppress."+ event.type ) - new Date().getTime() > 0 ){
    $.removeData( this, "suppress."+ event.type );
    return;
  }
  return $dispatch.apply( this, arguments );
};

// event fix hooks for touch events...
var touchHooks = 
$event.fixHooks.touchstart = 
$event.fixHooks.touchmove = 
$event.fixHooks.touchend =
$event.fixHooks.touchcancel = {
  props: "clientX clientY pageX pageY screenX screenY".split( " " ),
  filter: function( event, orig ) {
    if ( orig ){
      var touched = ( orig.touches && orig.touches[0] )
        || ( orig.changedTouches && orig.changedTouches[0] )
        || null; 
      // iOS webkit: touchstart, touchmove, touchend
      if ( touched ) 
        $.each( touchHooks.props, function( i, prop ){
          event[ prop ] = touched[ prop ];
        });
    }
    return event;
  }
};

// share the same special event configuration with related events...
$special.draginit = $special.dragstart = $special.dragend = drag;

})( jQuery );
/*mleibman-SlickGrid/slick.core.js*/
(function(c){c.extend(true,window,{Slick:{Event:h,EventData:g,EventHandler:i,Range:b,NonDataRow:e,Group:f,GroupTotals:d,EditorLock:a,GlobalEditorLock:new a()}});function g(){var j=false;var k=false;this.stopPropagation=function(){j=true};this.isPropagationStopped=function(){return j};this.stopImmediatePropagation=function(){k=true};this.isImmediatePropagationStopped=function(){return k}}function h(){var j=[];this.subscribe=function(k){j.push(k)};this.unsubscribe=function(l){for(var k=j.length-1;k>=0;k--){if(j[k]===l){j.splice(k,1)}}};this.notify=function(k,o,n){o=o||new g();n=n||this;var m;for(var l=0;l<j.length&&!(o.isPropagationStopped()||o.isImmediatePropagationStopped());l++){m=j[l].call(n,o,k)}return m}}function i(){var j=[];this.subscribe=function(l,k){j.push({event:l,handler:k});l.subscribe(k);return this};this.unsubscribe=function(m,l){var k=j.length;while(k--){if(j[k].event===m&&j[k].handler===l){j.splice(k,1);m.unsubscribe(l);return}}return this};this.unsubscribeAll=function(){var k=j.length;while(k--){j[k].event.unsubscribe(j[k].handler)}j=[];return this}}function b(k,j,l,m){if(l===undefined&&m===undefined){l=k;m=j}this.fromRow=Math.min(k,l);this.fromCell=Math.min(j,m);this.toRow=Math.max(k,l);this.toCell=Math.max(j,m);this.isSingleRow=function(){return this.fromRow==this.toRow};this.isSingleCell=function(){return this.fromRow==this.toRow&&this.fromCell==this.toCell};this.contains=function(o,n){return o>=this.fromRow&&o<=this.toRow&&n>=this.fromCell&&n<=this.toCell};this.toString=function(){if(this.isSingleCell()){return"("+this.fromRow+":"+this.fromCell+")"}else{return"("+this.fromRow+":"+this.fromCell+" - "+this.toRow+":"+this.toCell+")"}}}function e(){this.__nonDataRow=true}function f(){this.__group=true;this.level=0;this.count=0;this.value=null;this.title=null;this.collapsed=false;this.totals=null;this.rows=[];this.groups=null;this.groupingKey=null}f.prototype=new e();f.prototype.equals=function(j){return this.value===j.value&&this.count===j.count&&this.collapsed===j.collapsed};function d(){this.__groupTotals=true;this.group=null}d.prototype=new e();function a(){var j=null;this.isActive=function(l){return(l?j===l:j!==null)};this.activate=function(l){if(l===j){return}if(j!==null){throw"SlickGrid.EditorLock.activate: an editController is still active, can't activate another editController"}if(!l.commitCurrentEdit){throw"SlickGrid.EditorLock.activate: editController must implement .commitCurrentEdit()"}if(!l.cancelCurrentEdit){throw"SlickGrid.EditorLock.activate: editController must implement .cancelCurrentEdit()"}j=l};this.deactivate=function(l){if(j!==l){throw"SlickGrid.EditorLock.deactivate: specified editController is not the currently active one"}j=null};this.commitCurrentEdit=function(){return(j?j.commitCurrentEdit():true)};this.cancelCurrentEdit=function k(){return(j?j.cancelCurrentEdit():true)}}})(jQuery);
/*mleibman-SlickGrid/slick.grid.js*/
if(typeof jQuery==="undefined"){throw"SlickGrid requires jquery module to be loaded"}if(!jQuery.fn.drag){throw"SlickGrid requires jquery.event.drag module to be loaded"}if(typeof Slick==="undefined"){throw"slick.core.js not loaded"}(function($){$.extend(true,window,{Slick:{Grid:SlickGrid}});var scrollbarDimensions;var maxSupportedCssHeight;function SlickGrid(container,data,columns,options){var defaults={explicitInitialization:false,rowHeight:25,defaultColumnWidth:80,enableAddRow:false,leaveSpaceForNewRows:false,editable:false,autoEdit:true,enableCellNavigation:true,enableColumnReorder:true,asyncEditorLoading:false,asyncEditorLoadDelay:100,forceFitColumns:false,enableAsyncPostRender:false,asyncPostRenderDelay:50,autoHeight:false,editorLock:Slick.GlobalEditorLock,showHeaderRow:false,headerRowHeight:25,showTopPanel:false,topPanelHeight:25,formatterFactory:null,editorFactory:null,cellFlashingCssClass:"flashing",selectedCellCssClass:"selected",multiSelect:true,enableTextSelectionOnCells:false,dataItemColumnValueExtractor:null,fullWidthRows:false,multiColumnSort:false,defaultFormatter:defaultFormatter,forceSyncScrolling:false};var columnDefaults={name:"",resizable:true,sortable:false,minWidth:30,rerenderOnResize:false,headerCssClass:null,defaultSortAsc:true,focusable:true,selectable:true};var th;var h;var ph;var n;var cj;var page=0;var offset=0;var vScrollDir=1;var initialized=false;var $container;var uid="slickgrid_"+Math.round(1000000*Math.random());var self=this;var $focusSink,$focusSink2;var $headerScroller;var $headers;var $headerRow,$headerRowScroller,$headerRowSpacer;var $topPanelScroller;var $topPanel;var $viewport;var $canvas;var $style;var $boundAncestors;var stylesheet,columnCssRulesL,columnCssRulesR;var viewportH,viewportW;var canvasWidth;var viewportHasHScroll,viewportHasVScroll;var headerColumnWidthDiff=0,headerColumnHeightDiff=0,cellWidthDiff=0,cellHeightDiff=0;var absoluteColumnMinWidth;var numberOfRows=0;var tabbingDirection=1;var activePosX;var activeRow,activeCell;var activeCellNode=null;var currentEditor=null;var serializedEditorValue;var editController;var rowsCache={};var renderedRows=0;var numVisibleRows;var prevScrollTop=0;var scrollTop=0;var lastRenderedScrollTop=0;var lastRenderedScrollLeft=0;var prevScrollLeft=0;var scrollLeft=0;var selectionModel;var selectedRows=[];var plugins=[];var cellCssClasses={};var columnsById={};var sortColumns=[];var columnPosLeft=[];var columnPosRight=[];var h_editorLoader=null;var h_render=null;var h_postrender=null;var postProcessedRows={};var postProcessToRow=null;var postProcessFromRow=null;var counter_rows_rendered=0;var counter_rows_removed=0;function init(){$container=$(container);if($container.length<1){throw new Error("SlickGrid requires a valid container, "+container+" does not exist in the DOM.")}maxSupportedCssHeight=maxSupportedCssHeight||getMaxSupportedCssHeight();scrollbarDimensions=scrollbarDimensions||measureScrollbar();options=$.extend({},defaults,options);validateAndEnforceOptions();columnDefaults.width=options.defaultColumnWidth;columnsById={};for(var i=0;i<columns.length;i++){var m=columns[i]=$.extend({},columnDefaults,columns[i]);columnsById[m.id]=i;if(m.minWidth&&m.width<m.minWidth){m.width=m.minWidth}if(m.maxWidth&&m.width>m.maxWidth){m.width=m.maxWidth}}if(options.enableColumnReorder&&!$.fn.sortable){throw new Error("SlickGrid's 'enableColumnReorder = true' option requires jquery-ui.sortable module to be loaded")}editController={commitCurrentEdit:commitCurrentEdit,cancelCurrentEdit:cancelCurrentEdit};$container.empty().css("overflow","hidden").css("outline",0).addClass(uid).addClass("ui-widget");if(!/relative|absolute|fixed/.test($container.css("position"))){$container.css("position","relative")}$focusSink=$("<div tabIndex='0' hideFocus style='position:fixed;width:0;height:0;top:0;left:0;outline:0;'></div>").appendTo($container);$headerScroller=$("<div class='slick-header ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);$headers=$("<div class='slick-header-columns' style='left:-1000px' />").appendTo($headerScroller);$headers.width(getHeadersWidth());$headerRowScroller=$("<div class='slick-headerrow ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);$headerRow=$("<div class='slick-headerrow-columns' />").appendTo($headerRowScroller);$headerRowSpacer=$("<div style='display:block;height:1px;position:absolute;top:0;left:0;'></div>").css("width",getCanvasWidth()+scrollbarDimensions.width+"px").appendTo($headerRowScroller);$topPanelScroller=$("<div class='slick-top-panel-scroller ui-state-default' style='overflow:hidden;position:relative;' />").appendTo($container);$topPanel=$("<div class='slick-top-panel' style='width:10000px' />").appendTo($topPanelScroller);if(!options.showTopPanel){$topPanelScroller.hide()}if(!options.showHeaderRow){$headerRowScroller.hide()}$viewport=$("<div class='slick-viewport' style='width:100%;overflow:auto;outline:0;position:relative;;'>").appendTo($container);$viewport.css("overflow-y",options.autoHeight?"hidden":"auto");$canvas=$("<div class='grid-canvas' />").appendTo($viewport);$focusSink2=$focusSink.clone().appendTo($container);if(!options.explicitInitialization){finishInitialization()}}function finishInitialization(){if(!initialized){initialized=true;viewportW=parseFloat($.css($container[0],"width",true));measureCellPaddingAndBorder();disableSelection($headers);if(!options.enableTextSelectionOnCells){$viewport.bind("selectstart.ui",function(event){return $(event.target).is("input,textarea")})}updateColumnCaches();createColumnHeaders();setupColumnSort();createCssRules();resizeCanvas();bindAncestorScrollEvents();$container.bind("resize.slickgrid",resizeCanvas);$viewport.bind("scroll",handleScroll);$headerScroller.bind("contextmenu",handleHeaderContextMenu).bind("click",handleHeaderClick).delegate(".slick-header-column","mouseenter",handleHeaderMouseEnter).delegate(".slick-header-column","mouseleave",handleHeaderMouseLeave);$headerRowScroller.bind("scroll",handleHeaderRowScroll);$focusSink.add($focusSink2).bind("keydown",handleKeyDown);$canvas.bind("keydown",handleKeyDown).bind("click",handleClick).bind("dblclick",handleDblClick).bind("contextmenu",handleContextMenu).bind("draginit",handleDragInit).bind("dragstart",{distance:3},handleDragStart).bind("drag",handleDrag).bind("dragend",handleDragEnd).delegate(".slick-cell","mouseenter",handleMouseEnter).delegate(".slick-cell","mouseleave",handleMouseLeave)}}function registerPlugin(plugin){plugins.unshift(plugin);plugin.init(self)}function unregisterPlugin(plugin){for(var i=plugins.length;i>=0;i--){if(plugins[i]===plugin){if(plugins[i].destroy){plugins[i].destroy()}plugins.splice(i,1);break}}}function setSelectionModel(model){if(selectionModel){selectionModel.onSelectedRangesChanged.unsubscribe(handleSelectedRangesChanged);if(selectionModel.destroy){selectionModel.destroy()}}selectionModel=model;if(selectionModel){selectionModel.init(self);selectionModel.onSelectedRangesChanged.subscribe(handleSelectedRangesChanged)}}function getSelectionModel(){return selectionModel}function getCanvasNode(){return $canvas[0]}function measureScrollbar(){var $c=$("<div style='position:absolute; top:-10000px; left:-10000px; width:100px; height:100px; overflow:scroll;'></div>").appendTo("body");var dim={width:$c.width()-$c[0].clientWidth,height:$c.height()-$c[0].clientHeight};$c.remove();return dim}function getHeadersWidth(){var headersWidth=0;for(var i=0,ii=columns.length;i<ii;i++){var width=columns[i].width;headersWidth+=width}headersWidth+=scrollbarDimensions.width;return Math.max(headersWidth,viewportW)+1000}function getCanvasWidth(){var availableWidth=viewportHasVScroll?viewportW-scrollbarDimensions.width:viewportW;var rowWidth=0;var i=columns.length;while(i--){rowWidth+=columns[i].width}return options.fullWidthRows?Math.max(rowWidth,availableWidth):rowWidth}function updateCanvasWidth(forceColumnWidthsUpdate){var oldCanvasWidth=canvasWidth;canvasWidth=getCanvasWidth();if(canvasWidth!=oldCanvasWidth){$canvas.width(canvasWidth);$headerRow.width(canvasWidth);$headers.width(getHeadersWidth());viewportHasHScroll=(canvasWidth>viewportW-scrollbarDimensions.width)}$headerRowSpacer.width(canvasWidth+(viewportHasVScroll?scrollbarDimensions.width:0));if(canvasWidth!=oldCanvasWidth||forceColumnWidthsUpdate){applyColumnWidths()}}function disableSelection($target){if($target&&$target.jquery){$target.attr("unselectable","on").css("MozUserSelect","none").bind("selectstart.ui",function(){return false})}}function getMaxSupportedCssHeight(){var supportedHeight=1000000;var testUpTo=navigator.userAgent.toLowerCase().match(/firefox/)?6000000:1000000000;var div=$("<div style='display:none' />").appendTo(document.body);while(true){var test=supportedHeight*2;div.css("height",test);if(test>testUpTo||div.height()!==test){break}else{supportedHeight=test}}div.remove();return supportedHeight}function bindAncestorScrollEvents(){var elem=$canvas[0];while((elem=elem.parentNode)!=document.body&&elem!=null){if(elem==$viewport[0]||elem.scrollWidth!=elem.clientWidth||elem.scrollHeight!=elem.clientHeight){var $elem=$(elem);if(!$boundAncestors){$boundAncestors=$elem}else{$boundAncestors=$boundAncestors.add($elem)}$elem.bind("scroll."+uid,handleActiveCellPositionChange)}}}function unbindAncestorScrollEvents(){if(!$boundAncestors){return}$boundAncestors.unbind("scroll."+uid);$boundAncestors=null}function updateColumnHeader(columnId,title,toolTip){if(!initialized){return}var idx=getColumnIndex(columnId);if(idx==null){return}var columnDef=columns[idx];var $header=$headers.children().eq(idx);if($header){if(title!==undefined){columns[idx].name=title}if(toolTip!==undefined){columns[idx].toolTip=toolTip}trigger(self.onBeforeHeaderCellDestroy,{node:$header[0],column:columnDef});$header.attr("title",toolTip||"").children().eq(0).html(title);trigger(self.onHeaderCellRendered,{node:$header[0],column:columnDef})}}function getHeaderRow(){return $headerRow[0]}function getHeaderRowColumn(columnId){var idx=getColumnIndex(columnId);var $header=$headerRow.children().eq(idx);return $header&&$header[0]}function createColumnHeaders(){function onMouseEnter(){$(this).addClass("ui-state-hover")}function onMouseLeave(){$(this).removeClass("ui-state-hover")}$headers.find(".slick-header-column").each(function(){var columnDef=$(this).data("column");if(columnDef){trigger(self.onBeforeHeaderCellDestroy,{node:this,column:columnDef})}});$headers.empty();$headers.width(getHeadersWidth());$headerRow.find(".slick-headerrow-column").each(function(){var columnDef=$(this).data("column");if(columnDef){trigger(self.onBeforeHeaderRowCellDestroy,{node:this,column:columnDef})}});$headerRow.empty();for(var i=0;i<columns.length;i++){var m=columns[i];var header=$("<div class='ui-state-default slick-header-column' />").html("<span class='slick-column-name'>"+m.name+"</span>").width(m.width-headerColumnWidthDiff).attr("id",""+uid+m.id).attr("title",m.toolTip||"").data("column",m).addClass(m.headerCssClass||"").appendTo($headers);if(options.enableColumnReorder||m.sortable){header.on("mouseenter",onMouseEnter).on("mouseleave",onMouseLeave)}if(m.sortable){header.addClass("slick-header-sortable");header.append("<span class='slick-sort-indicator' />")}trigger(self.onHeaderCellRendered,{node:header[0],column:m});if(options.showHeaderRow){var headerRowCell=$("<div class='ui-state-default slick-headerrow-column l"+i+" r"+i+"'></div>").data("column",m).appendTo($headerRow);trigger(self.onHeaderRowCellRendered,{node:headerRowCell[0],column:m})}}setSortColumns(sortColumns);setupColumnResize();if(options.enableColumnReorder){setupColumnReorder()}}function setupColumnSort(){$headers.click(function(e){e.metaKey=e.metaKey||e.ctrlKey;if($(e.target).hasClass("slick-resizable-handle")){return}var $col=$(e.target).closest(".slick-header-column");if(!$col.length){return}var column=$col.data("column");if(column.sortable){if(!getEditorLock().commitCurrentEdit()){return}var sortOpts=null;var i=0;for(;i<sortColumns.length;i++){if(sortColumns[i].columnId==column.id){sortOpts=sortColumns[i];sortOpts.sortAsc=!sortOpts.sortAsc;break}}if(e.metaKey&&options.multiColumnSort){if(sortOpts){sortColumns.splice(i,1)}}else{if((!e.shiftKey&&!e.metaKey)||!options.multiColumnSort){sortColumns=[]}if(!sortOpts){sortOpts={columnId:column.id,sortAsc:column.defaultSortAsc};sortColumns.push(sortOpts)}else{if(sortColumns.length==0){sortColumns.push(sortOpts)}}}setSortColumns(sortColumns);if(!options.multiColumnSort){trigger(self.onSort,{multiColumnSort:false,sortCol:column,sortAsc:sortOpts.sortAsc},e)}else{trigger(self.onSort,{multiColumnSort:true,sortCols:$.map(sortColumns,function(col){return{sortCol:columns[getColumnIndex(col.columnId)],sortAsc:col.sortAsc}})},e)}}})}function setupColumnReorder(){$headers.filter(":ui-sortable").sortable("destroy");$headers.sortable({containment:"parent",distance:3,axis:"x",cursor:"default",tolerance:"intersection",helper:"clone",placeholder:"slick-sortable-placeholder ui-state-default slick-header-column",forcePlaceholderSize:true,start:function(e,ui){$(ui.helper).addClass("slick-header-column-active")},beforeStop:function(e,ui){$(ui.helper).removeClass("slick-header-column-active")},stop:function(e){if(!getEditorLock().commitCurrentEdit()){$(this).sortable("cancel");return}var reorderedIds=$headers.sortable("toArray");var reorderedColumns=[];for(var i=0;i<reorderedIds.length;i++){reorderedColumns.push(columns[getColumnIndex(reorderedIds[i].replace(uid,""))])}setColumns(reorderedColumns);trigger(self.onColumnsReordered,{});e.stopPropagation();setupColumnResize()}})}function setupColumnResize(){var $col,j,c,pageX,columnElements,minPageX,maxPageX,firstResizable,lastResizable;columnElements=$headers.children();columnElements.find(".slick-resizable-handle").remove();columnElements.each(function(i,e){if(columns[i].resizable){if(firstResizable===undefined){firstResizable=i}lastResizable=i}});if(firstResizable===undefined){return}columnElements.each(function(i,e){if(i<firstResizable||(options.forceFitColumns&&i>=lastResizable)){return}$col=$(e);$("<div class='slick-resizable-handle' />").appendTo(e).bind("dragstart",function(e,dd){if(!getEditorLock().commitCurrentEdit()){return false}pageX=e.pageX;$(this).parent().addClass("slick-header-column-active");var shrinkLeewayOnRight=null,stretchLeewayOnRight=null;columnElements.each(function(i,e){columns[i].previousWidth=$(e).outerWidth()});if(options.forceFitColumns){shrinkLeewayOnRight=0;stretchLeewayOnRight=0;for(j=i+1;j<columnElements.length;j++){c=columns[j];if(c.resizable){if(stretchLeewayOnRight!==null){if(c.maxWidth){stretchLeewayOnRight+=c.maxWidth-c.previousWidth}else{stretchLeewayOnRight=null}}shrinkLeewayOnRight+=c.previousWidth-Math.max(c.minWidth||0,absoluteColumnMinWidth)}}}var shrinkLeewayOnLeft=0,stretchLeewayOnLeft=0;for(j=0;j<=i;j++){c=columns[j];if(c.resizable){if(stretchLeewayOnLeft!==null){if(c.maxWidth){stretchLeewayOnLeft+=c.maxWidth-c.previousWidth}else{stretchLeewayOnLeft=null}}shrinkLeewayOnLeft+=c.previousWidth-Math.max(c.minWidth||0,absoluteColumnMinWidth)}}if(shrinkLeewayOnRight===null){shrinkLeewayOnRight=100000}if(shrinkLeewayOnLeft===null){shrinkLeewayOnLeft=100000}if(stretchLeewayOnRight===null){stretchLeewayOnRight=100000}if(stretchLeewayOnLeft===null){stretchLeewayOnLeft=100000}maxPageX=pageX+Math.min(shrinkLeewayOnRight,stretchLeewayOnLeft);minPageX=pageX-Math.min(shrinkLeewayOnLeft,stretchLeewayOnRight)}).bind("drag",function(e,dd){var actualMinWidth,d=Math.min(maxPageX,Math.max(minPageX,e.pageX))-pageX,x;if(d<0){x=d;for(j=i;j>=0;j--){c=columns[j];if(c.resizable){actualMinWidth=Math.max(c.minWidth||0,absoluteColumnMinWidth);if(x&&c.previousWidth+x<actualMinWidth){x+=c.previousWidth-actualMinWidth;c.width=actualMinWidth}else{c.width=c.previousWidth+x;x=0}}}if(options.forceFitColumns){x=-d;for(j=i+1;j<columnElements.length;j++){c=columns[j];if(c.resizable){if(x&&c.maxWidth&&(c.maxWidth-c.previousWidth<x)){x-=c.maxWidth-c.previousWidth;c.width=c.maxWidth}else{c.width=c.previousWidth+x;x=0}}}}}else{x=d;for(j=i;j>=0;j--){c=columns[j];if(c.resizable){if(x&&c.maxWidth&&(c.maxWidth-c.previousWidth<x)){x-=c.maxWidth-c.previousWidth;c.width=c.maxWidth}else{c.width=c.previousWidth+x;x=0}}}if(options.forceFitColumns){x=-d;for(j=i+1;j<columnElements.length;j++){c=columns[j];if(c.resizable){actualMinWidth=Math.max(c.minWidth||0,absoluteColumnMinWidth);if(x&&c.previousWidth+x<actualMinWidth){x+=c.previousWidth-actualMinWidth;c.width=actualMinWidth}else{c.width=c.previousWidth+x;x=0}}}}}applyColumnHeaderWidths();if(options.syncColumnCellResize){applyColumnWidths()}}).bind("dragend",function(e,dd){var newWidth;$(this).parent().removeClass("slick-header-column-active");for(j=0;j<columnElements.length;j++){c=columns[j];newWidth=$(columnElements[j]).outerWidth();if(c.previousWidth!==newWidth&&c.rerenderOnResize){invalidateAllRows()}}updateCanvasWidth(true);render();trigger(self.onColumnsResized,{})})})}function getVBoxDelta($el){var p=["borderTopWidth","borderBottomWidth","paddingTop","paddingBottom"];var delta=0;$.each(p,function(n,val){delta+=parseFloat($el.css(val))||0});return delta}function measureCellPaddingAndBorder(){var el;var h=["borderLeftWidth","borderRightWidth","paddingLeft","paddingRight"];var v=["borderTopWidth","borderBottomWidth","paddingTop","paddingBottom"];el=$("<div class='ui-state-default slick-header-column' style='visibility:hidden'>-</div>").appendTo($headers);headerColumnWidthDiff=headerColumnHeightDiff=0;$.each(h,function(n,val){headerColumnWidthDiff+=parseFloat(el.css(val))||0});$.each(v,function(n,val){headerColumnHeightDiff+=parseFloat(el.css(val))||0});el.remove();var r=$("<div class='slick-row' />").appendTo($canvas);el=$("<div class='slick-cell' id='' style='visibility:hidden'>-</div>").appendTo(r);cellWidthDiff=cellHeightDiff=0;$.each(h,function(n,val){cellWidthDiff+=parseFloat(el.css(val))||0});$.each(v,function(n,val){cellHeightDiff+=parseFloat(el.css(val))||0});r.remove();absoluteColumnMinWidth=Math.max(headerColumnWidthDiff,cellWidthDiff)}function createCssRules(){$style=$("<style type='text/css' rel='stylesheet' />").appendTo($("head"));var rowHeight=(options.rowHeight-cellHeightDiff);var rules=["."+uid+" .slick-header-column { left: 1000px; }","."+uid+" .slick-top-panel { height:"+options.topPanelHeight+"px; }","."+uid+" .slick-headerrow-columns { height:"+options.headerRowHeight+"px; }","."+uid+" .slick-cell { height:"+rowHeight+"px; }","."+uid+" .slick-row { height:"+options.rowHeight+"px; }"];for(var i=0;i<columns.length;i++){rules.push("."+uid+" .l"+i+" { }");rules.push("."+uid+" .r"+i+" { }")}if($style[0].styleSheet){$style[0].styleSheet.cssText=rules.join(" ")}else{$style[0].appendChild(document.createTextNode(rules.join(" ")))}}function getColumnCssRules(idx){if(!stylesheet){var sheets=document.styleSheets;for(var i=0;i<sheets.length;i++){if((sheets[i].ownerNode||sheets[i].owningElement)==$style[0]){stylesheet=sheets[i];break}}if(!stylesheet){throw new Error("Cannot find stylesheet.")}columnCssRulesL=[];columnCssRulesR=[];var cssRules=(stylesheet.cssRules||stylesheet.rules);var matches,columnIdx;for(var i=0;i<cssRules.length;i++){var selector=cssRules[i].selectorText;if(matches=/\.l\d+/.exec(selector)){columnIdx=parseInt(matches[0].substr(2,matches[0].length-2),10);columnCssRulesL[columnIdx]=cssRules[i]}else{if(matches=/\.r\d+/.exec(selector)){columnIdx=parseInt(matches[0].substr(2,matches[0].length-2),10);columnCssRulesR[columnIdx]=cssRules[i]}}}}return{left:columnCssRulesL[idx],right:columnCssRulesR[idx]}}function removeCssRules(){$style.remove();stylesheet=null}function destroy(){getEditorLock().cancelCurrentEdit();trigger(self.onBeforeDestroy,{});var i=plugins.length;while(i--){unregisterPlugin(plugins[i])}if(options.enableColumnReorder){$headers.filter(":ui-sortable").sortable("destroy")}unbindAncestorScrollEvents();$container.unbind(".slickgrid");removeCssRules();$canvas.unbind("draginit dragstart dragend drag");$container.empty().removeClass(uid)}function trigger(evt,args,e){e=e||new Slick.EventData();args=args||{};args.grid=self;return evt.notify(args,e,self)}function getEditorLock(){return options.editorLock}function getEditController(){return editController}function getColumnIndex(id){return columnsById[id]}function autosizeColumns(){var i,c,widths=[],shrinkLeeway=0,total=0,prevTotal,availWidth=viewportHasVScroll?viewportW-scrollbarDimensions.width:viewportW;for(i=0;i<columns.length;i++){c=columns[i];widths.push(c.width);total+=c.width;if(c.resizable){shrinkLeeway+=c.width-Math.max(c.minWidth,absoluteColumnMinWidth)}}prevTotal=total;while(total>availWidth&&shrinkLeeway){var shrinkProportion=(total-availWidth)/shrinkLeeway;for(i=0;i<columns.length&&total>availWidth;i++){c=columns[i];var width=widths[i];if(!c.resizable||width<=c.minWidth||width<=absoluteColumnMinWidth){continue}var absMinWidth=Math.max(c.minWidth,absoluteColumnMinWidth);var shrinkSize=Math.floor(shrinkProportion*(width-absMinWidth))||1;shrinkSize=Math.min(shrinkSize,width-absMinWidth);total-=shrinkSize;shrinkLeeway-=shrinkSize;widths[i]-=shrinkSize}if(prevTotal==total){break}prevTotal=total}prevTotal=total;while(total<availWidth){var growProportion=availWidth/total;for(i=0;i<columns.length&&total<availWidth;i++){c=columns[i];if(!c.resizable||c.maxWidth<=c.width){continue}var growSize=Math.min(Math.floor(growProportion*c.width)-c.width,(c.maxWidth-c.width)||1000000)||1;total+=growSize;widths[i]+=growSize}if(prevTotal==total){break}prevTotal=total}var reRender=false;for(i=0;i<columns.length;i++){if(columns[i].rerenderOnResize&&columns[i].width!=widths[i]){reRender=true}columns[i].width=widths[i]}applyColumnHeaderWidths();updateCanvasWidth(true);if(reRender){invalidateAllRows();render()}}function applyColumnHeaderWidths(){if(!initialized){return}var h;for(var i=0,headers=$headers.children(),ii=headers.length;i<ii;i++){h=$(headers[i]);if(h.width()!==columns[i].width-headerColumnWidthDiff){h.width(columns[i].width-headerColumnWidthDiff)}}updateColumnCaches()}function applyColumnWidths(){var x=0,w,rule;for(var i=0;i<columns.length;i++){w=columns[i].width;rule=getColumnCssRules(i);rule.left.style.left=x+"px";rule.right.style.right=(canvasWidth-x-w)+"px";x+=columns[i].width}}function setSortColumn(columnId,ascending){setSortColumns([{columnId:columnId,sortAsc:ascending}])}function setSortColumns(cols){sortColumns=cols;var headerColumnEls=$headers.children();headerColumnEls.removeClass("slick-header-column-sorted").find(".slick-sort-indicator").removeClass("slick-sort-indicator-asc slick-sort-indicator-desc");$.each(sortColumns,function(i,col){if(col.sortAsc==null){col.sortAsc=true}var columnIndex=getColumnIndex(col.columnId);if(columnIndex!=null){headerColumnEls.eq(columnIndex).addClass("slick-header-column-sorted").find(".slick-sort-indicator").addClass(col.sortAsc?"slick-sort-indicator-asc":"slick-sort-indicator-desc")}})}function getSortColumns(){return sortColumns}function handleSelectedRangesChanged(e,ranges){selectedRows=[];var hash={};for(var i=0;i<ranges.length;i++){for(var j=ranges[i].fromRow;j<=ranges[i].toRow;j++){if(!hash[j]){selectedRows.push(j);hash[j]={}}for(var k=ranges[i].fromCell;k<=ranges[i].toCell;k++){if(canCellBeSelected(j,k)){hash[j][columns[k].id]=options.selectedCellCssClass}}}}setCellCssStyles(options.selectedCellCssClass,hash);trigger(self.onSelectedRowsChanged,{rows:getSelectedRows()},e)}function getColumns(){return columns}function updateColumnCaches(){columnPosLeft=[];columnPosRight=[];var x=0;for(var i=0,ii=columns.length;i<ii;i++){columnPosLeft[i]=x;columnPosRight[i]=x+columns[i].width;x+=columns[i].width}}function setColumns(columnDefinitions){columns=columnDefinitions;columnsById={};for(var i=0;i<columns.length;i++){var m=columns[i]=$.extend({},columnDefaults,columns[i]);columnsById[m.id]=i;if(m.minWidth&&m.width<m.minWidth){m.width=m.minWidth}if(m.maxWidth&&m.width>m.maxWidth){m.width=m.maxWidth}}updateColumnCaches();if(initialized){invalidateAllRows();createColumnHeaders();removeCssRules();createCssRules();resizeCanvas();applyColumnWidths();handleScroll()}}function getOptions(){return options}function setOptions(args){if(!getEditorLock().commitCurrentEdit()){return}makeActiveCellNormal();if(options.enableAddRow!==args.enableAddRow){invalidateRow(getDataLength())}options=$.extend(options,args);validateAndEnforceOptions();$viewport.css("overflow-y",options.autoHeight?"hidden":"auto");render()}function validateAndEnforceOptions(){if(options.autoHeight){options.leaveSpaceForNewRows=false}}function setData(newData,scrollToTop){data=newData;invalidateAllRows();updateRowCount();if(scrollToTop){scrollTo(0)}}function getData(){return data}function getDataLength(){if(data.getLength){return data.getLength()}else{return data.length}}function getDataItem(i){if(data.getItem){return data.getItem(i)}else{return data[i]}}function getTopPanel(){return $topPanel[0]}function setTopPanelVisibility(visible){if(options.showTopPanel!=visible){options.showTopPanel=visible;if(visible){$topPanelScroller.slideDown("fast",resizeCanvas)}else{$topPanelScroller.slideUp("fast",resizeCanvas)}}}function setHeaderRowVisibility(visible){if(options.showHeaderRow!=visible){options.showHeaderRow=visible;if(visible){$headerRowScroller.slideDown("fast",resizeCanvas)}else{$headerRowScroller.slideUp("fast",resizeCanvas)}}}function getContainerNode(){return $container.get(0)}function getRowTop(row){return options.rowHeight*row-offset}function getRowFromPosition(y){return Math.floor((y+offset)/options.rowHeight)}function scrollTo(y){y=Math.max(y,0);y=Math.min(y,th-viewportH+(viewportHasHScroll?scrollbarDimensions.height:0));var oldOffset=offset;page=Math.min(n-1,Math.floor(y/ph));offset=Math.round(page*cj);var newScrollTop=y-offset;if(offset!=oldOffset){var range=getVisibleRange(newScrollTop);cleanupRows(range);updateRowPositions()}if(prevScrollTop!=newScrollTop){vScrollDir=(prevScrollTop+oldOffset<newScrollTop+offset)?1:-1;$viewport[0].scrollTop=(lastRenderedScrollTop=scrollTop=prevScrollTop=newScrollTop);trigger(self.onViewportChanged,{})}}function defaultFormatter(row,cell,value,columnDef,dataContext){if(value==null){return""}else{return(value+"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}}function getFormatter(row,column){var rowMetadata=data.getItemMetadata&&data.getItemMetadata(row);var columnOverrides=rowMetadata&&rowMetadata.columns&&(rowMetadata.columns[column.id]||rowMetadata.columns[getColumnIndex(column.id)]);return(columnOverrides&&columnOverrides.formatter)||(rowMetadata&&rowMetadata.formatter)||column.formatter||(options.formatterFactory&&options.formatterFactory.getFormatter(column))||options.defaultFormatter}function getEditor(row,cell){var column=columns[cell];var rowMetadata=data.getItemMetadata&&data.getItemMetadata(row);var columnMetadata=rowMetadata&&rowMetadata.columns;if(columnMetadata&&columnMetadata[column.id]&&columnMetadata[column.id].editor!==undefined){return columnMetadata[column.id].editor}if(columnMetadata&&columnMetadata[cell]&&columnMetadata[cell].editor!==undefined){return columnMetadata[cell].editor}return column.editor||(options.editorFactory&&options.editorFactory.getEditor(column))}function getDataItemValueForColumn(item,columnDef){if(options.dataItemColumnValueExtractor){return options.dataItemColumnValueExtractor(item,columnDef)}return item[columnDef.field]}function appendRowHtml(stringArray,row,range,dataLength){var d=getDataItem(row);var dataLoading=row<dataLength&&!d;var rowCss="slick-row"+(dataLoading?" loading":"")+(row===activeRow?" active":"")+(row%2==1?" odd":" even");var metadata=data.getItemMetadata&&data.getItemMetadata(row);if(metadata&&metadata.cssClasses){rowCss+=" "+metadata.cssClasses}stringArray.push("<div class='ui-widget-content "+rowCss+"' row='"+row+"' style='top:"+getRowTop(row)+"px'>");var colspan,m;for(var i=0,ii=columns.length;i<ii;i++){m=columns[i];colspan=1;if(metadata&&metadata.columns){var columnData=metadata.columns[m.id]||metadata.columns[i];colspan=(columnData&&columnData.colspan)||1;if(colspan==="*"){colspan=ii-i}}if(columnPosRight[Math.min(ii-1,i+colspan-1)]>range.leftPx){if(columnPosLeft[i]>range.rightPx){break}appendCellHtml(stringArray,row,i,colspan,d)}if(colspan>1){i+=(colspan-1)}}stringArray.push("</div>")}function appendCellHtml(stringArray,row,cell,colspan,item){var m=columns[cell];var cellCss="slick-cell l"+cell+" r"+Math.min(columns.length-1,cell+colspan-1)+(m.cssClass?" "+m.cssClass:"");if(row===activeRow&&cell===activeCell){cellCss+=(" active")}for(var key in cellCssClasses){if(cellCssClasses[key][row]&&cellCssClasses[key][row][m.id]){cellCss+=(" "+cellCssClasses[key][row][m.id])}}stringArray.push("<div class='"+cellCss+"'>");if(item){var value=getDataItemValueForColumn(item,m);stringArray.push(getFormatter(row,m)(row,cell,value,m,item))}stringArray.push("</div>");rowsCache[row].cellRenderQueue.push(cell);rowsCache[row].cellColSpans[cell]=colspan}function cleanupRows(rangeToKeep){for(var i in rowsCache){if(((i=parseInt(i,10))!==activeRow)&&(i<rangeToKeep.top||i>rangeToKeep.bottom)){removeRowFromCache(i)}}}function invalidate(){updateRowCount();invalidateAllRows();render()}function invalidateAllRows(){if(currentEditor){makeActiveCellNormal()}for(var row in rowsCache){removeRowFromCache(row)}}function removeRowFromCache(row){var cacheEntry=rowsCache[row];if(!cacheEntry){return}$canvas[0].removeChild(cacheEntry.rowNode);delete rowsCache[row];delete postProcessedRows[row];renderedRows--;counter_rows_removed++}function invalidateRows(rows){var i,rl;if(!rows||!rows.length){return}vScrollDir=0;for(i=0,rl=rows.length;i<rl;i++){if(currentEditor&&activeRow===rows[i]){makeActiveCellNormal()}if(rowsCache[rows[i]]){removeRowFromCache(rows[i])}}}function invalidateRow(row){invalidateRows([row])}function updateCell(row,cell){var cellNode=getCellNode(row,cell);if(!cellNode){return}var m=columns[cell],d=getDataItem(row);if(currentEditor&&activeRow===row&&activeCell===cell){currentEditor.loadValue(d)}else{cellNode.innerHTML=d?getFormatter(row,m)(row,cell,getDataItemValueForColumn(d,m),m,d):"";invalidatePostProcessingResults(row)}}function updateRow(row){var cacheEntry=rowsCache[row];if(!cacheEntry){return}ensureCellNodesInRowsCache(row);var d=getDataItem(row);for(var columnIdx in cacheEntry.cellNodesByColumnIdx){if(!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)){continue}columnIdx=columnIdx|0;var m=columns[columnIdx],node=cacheEntry.cellNodesByColumnIdx[columnIdx];if(row===activeRow&&columnIdx===activeCell&&currentEditor){currentEditor.loadValue(d)}else{if(d){node.innerHTML=getFormatter(row,m)(row,columnIdx,getDataItemValueForColumn(d,m),m,d)}else{node.innerHTML=""}}}invalidatePostProcessingResults(row)}function getViewportHeight(){return parseFloat($.css($container[0],"height",true))-parseFloat($.css($container[0],"paddingTop",true))-parseFloat($.css($container[0],"paddingBottom",true))-parseFloat($.css($headerScroller[0],"height"))-getVBoxDelta($headerScroller)-(options.showTopPanel?options.topPanelHeight+getVBoxDelta($topPanelScroller):0)-(options.showHeaderRow?options.headerRowHeight+getVBoxDelta($headerRowScroller):0)}function resizeCanvas(){if(!initialized){return}if(options.autoHeight){viewportH=options.rowHeight*(getDataLength()+(options.enableAddRow?1:0))}else{viewportH=getViewportHeight()}numVisibleRows=Math.ceil(viewportH/options.rowHeight);viewportW=parseFloat($.css($container[0],"width",true));if(!options.autoHeight){$viewport.height(viewportH)}if(options.forceFitColumns){autosizeColumns()}updateRowCount();handleScroll();render()}function updateRowCount(){var dataLength=getDataLength();if(!initialized){return}numberOfRows=dataLength+(options.enableAddRow?1:0)+(options.leaveSpaceForNewRows?numVisibleRows-1:0);var oldViewportHasVScroll=viewportHasVScroll;viewportHasVScroll=!options.autoHeight&&(numberOfRows*options.rowHeight>viewportH);var l=options.enableAddRow?dataLength:dataLength-1;for(var i in rowsCache){if(i>=l){removeRowFromCache(i)}}if(activeCellNode&&activeRow>l){resetActiveCell()}var oldH=h;th=Math.max(options.rowHeight*numberOfRows,viewportH-scrollbarDimensions.height);if(th<maxSupportedCssHeight){h=ph=th;n=1;cj=0}else{h=maxSupportedCssHeight;ph=h/100;n=Math.floor(th/ph);cj=(th-h)/(n-1)}if(h!==oldH){$canvas.css("height",h);scrollTop=$viewport[0].scrollTop}var oldScrollTopInRange=(scrollTop+offset<=th-viewportH);if(th==0||scrollTop==0){page=offset=0}else{if(oldScrollTopInRange){scrollTo(scrollTop+offset)}else{scrollTo(th-viewportH)}}if(h!=oldH&&options.autoHeight){resizeCanvas()}if(options.forceFitColumns&&oldViewportHasVScroll!=viewportHasVScroll){autosizeColumns()}updateCanvasWidth(false)}function getVisibleRange(viewportTop,viewportLeft){if(viewportTop==null){viewportTop=scrollTop}if(viewportLeft==null){viewportLeft=scrollLeft}return{top:getRowFromPosition(viewportTop),bottom:getRowFromPosition(viewportTop+viewportH)+1,leftPx:viewportLeft,rightPx:viewportLeft+viewportW}}function getRenderedRange(viewportTop,viewportLeft){var range=getVisibleRange(viewportTop,viewportLeft);var buffer=Math.round(viewportH/options.rowHeight);var minBuffer=3;if(vScrollDir==-1){range.top-=buffer;range.bottom+=minBuffer}else{if(vScrollDir==1){range.top-=minBuffer;range.bottom+=buffer}else{range.top-=minBuffer;range.bottom+=minBuffer}}range.top=Math.max(0,range.top);range.bottom=Math.min(options.enableAddRow?getDataLength():getDataLength()-1,range.bottom);range.leftPx-=viewportW;range.rightPx+=viewportW;range.leftPx=Math.max(0,range.leftPx);range.rightPx=Math.min(canvasWidth,range.rightPx);return range}function ensureCellNodesInRowsCache(row){var cacheEntry=rowsCache[row];if(cacheEntry){if(cacheEntry.cellRenderQueue.length){var lastChild=cacheEntry.rowNode.lastChild;while(cacheEntry.cellRenderQueue.length){var columnIdx=cacheEntry.cellRenderQueue.pop();cacheEntry.cellNodesByColumnIdx[columnIdx]=lastChild;lastChild=lastChild.previousSibling}}}}function cleanUpCells(range,row){var totalCellsRemoved=0;var cacheEntry=rowsCache[row];var cellsToRemove=[];for(var i in cacheEntry.cellNodesByColumnIdx){if(!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(i)){continue}i=i|0;var colspan=cacheEntry.cellColSpans[i];if(columnPosLeft[i]>range.rightPx||columnPosRight[Math.min(columns.length-1,i+colspan-1)]<range.leftPx){if(!(row==activeRow&&i==activeCell)){cellsToRemove.push(i)}}}var cellToRemove;while((cellToRemove=cellsToRemove.pop())!=null){cacheEntry.rowNode.removeChild(cacheEntry.cellNodesByColumnIdx[cellToRemove]);delete cacheEntry.cellColSpans[cellToRemove];delete cacheEntry.cellNodesByColumnIdx[cellToRemove];if(postProcessedRows[row]){delete postProcessedRows[row][cellToRemove]}totalCellsRemoved++}}function cleanUpAndRenderCells(range){var cacheEntry;var stringArray=[];var processedRows=[];var cellsAdded;var totalCellsAdded=0;var colspan;for(var row=range.top,btm=range.bottom;row<=btm;row++){cacheEntry=rowsCache[row];if(!cacheEntry){continue}ensureCellNodesInRowsCache(row);cleanUpCells(range,row);cellsAdded=0;var metadata=data.getItemMetadata&&data.getItemMetadata(row);metadata=metadata&&metadata.columns;var d=getDataItem(row);for(var i=0,ii=columns.length;i<ii;i++){if(columnPosLeft[i]>range.rightPx){break}if((colspan=cacheEntry.cellColSpans[i])!=null){i+=(colspan>1?colspan-1:0);continue}colspan=1;if(metadata){var columnData=metadata[columns[i].id]||metadata[i];colspan=(columnData&&columnData.colspan)||1;if(colspan==="*"){colspan=ii-i}}if(columnPosRight[Math.min(ii-1,i+colspan-1)]>range.leftPx){appendCellHtml(stringArray,row,i,colspan,d);cellsAdded++}i+=(colspan>1?colspan-1:0)}if(cellsAdded){totalCellsAdded+=cellsAdded;processedRows.push(row)}}if(!stringArray.length){return}var x=document.createElement("div");x.innerHTML=stringArray.join("");var processedRow;var node;while((processedRow=processedRows.pop())!=null){cacheEntry=rowsCache[processedRow];var columnIdx;while((columnIdx=cacheEntry.cellRenderQueue.pop())!=null){node=x.lastChild;cacheEntry.rowNode.appendChild(node);cacheEntry.cellNodesByColumnIdx[columnIdx]=node}}}function renderRows(range){var parentNode=$canvas[0],stringArray=[],rows=[],needToReselectCell=false,dataLength=getDataLength();for(var i=range.top,ii=range.bottom;i<=ii;i++){if(rowsCache[i]){continue}renderedRows++;rows.push(i);rowsCache[i]={rowNode:null,cellColSpans:[],cellNodesByColumnIdx:[],cellRenderQueue:[]};appendRowHtml(stringArray,i,range,dataLength);if(activeCellNode&&activeRow===i){needToReselectCell=true}counter_rows_rendered++}if(!rows.length){return}var x=document.createElement("div");x.innerHTML=stringArray.join("");for(var i=0,ii=rows.length;i<ii;i++){rowsCache[rows[i]].rowNode=parentNode.appendChild(x.firstChild)}if(needToReselectCell){activeCellNode=getCellNode(activeRow,activeCell)}}function startPostProcessing(){if(!options.enableAsyncPostRender){return}clearTimeout(h_postrender);h_postrender=setTimeout(asyncPostProcessRows,options.asyncPostRenderDelay)}function invalidatePostProcessingResults(row){delete postProcessedRows[row];postProcessFromRow=Math.min(postProcessFromRow,row);postProcessToRow=Math.max(postProcessToRow,row);startPostProcessing()}function updateRowPositions(){for(var row in rowsCache){rowsCache[row].rowNode.style.top=getRowTop(row)+"px"}}function render(){if(!initialized){return}var visible=getVisibleRange();var rendered=getRenderedRange();cleanupRows(rendered);if(lastRenderedScrollLeft!=scrollLeft){cleanUpAndRenderCells(rendered)}renderRows(rendered);postProcessFromRow=visible.top;postProcessToRow=Math.min(options.enableAddRow?getDataLength():getDataLength()-1,visible.bottom);startPostProcessing();lastRenderedScrollTop=scrollTop;lastRenderedScrollLeft=scrollLeft;h_render=null}function handleHeaderRowScroll(){var scrollLeft=$headerRowScroller[0].scrollLeft;if(scrollLeft!=$viewport[0].scrollLeft){$viewport[0].scrollLeft=scrollLeft}}function handleScroll(){scrollTop=$viewport[0].scrollTop;scrollLeft=$viewport[0].scrollLeft;var vScrollDist=Math.abs(scrollTop-prevScrollTop);var hScrollDist=Math.abs(scrollLeft-prevScrollLeft);if(hScrollDist){prevScrollLeft=scrollLeft;$headerScroller[0].scrollLeft=scrollLeft;$topPanelScroller[0].scrollLeft=scrollLeft;$headerRowScroller[0].scrollLeft=scrollLeft}if(vScrollDist){vScrollDir=prevScrollTop<scrollTop?1:-1;prevScrollTop=scrollTop;if(vScrollDist<viewportH){scrollTo(scrollTop+offset)}else{var oldOffset=offset;if(h==viewportH){page=0}else{page=Math.min(n-1,Math.floor(scrollTop*((th-viewportH)/(h-viewportH))*(1/ph)))}offset=Math.round(page*cj);if(oldOffset!=offset){invalidateAllRows()}}}if(hScrollDist||vScrollDist){if(h_render){clearTimeout(h_render)}if(Math.abs(lastRenderedScrollTop-scrollTop)>20||Math.abs(lastRenderedScrollLeft-scrollLeft)>20){if(options.forceSyncScrolling||(Math.abs(lastRenderedScrollTop-scrollTop)<viewportH&&Math.abs(lastRenderedScrollLeft-scrollLeft)<viewportW)){render()}else{h_render=setTimeout(render,50)}trigger(self.onViewportChanged,{})}}trigger(self.onScroll,{scrollLeft:scrollLeft,scrollTop:scrollTop})}function asyncPostProcessRows(){while(postProcessFromRow<=postProcessToRow){var row=(vScrollDir>=0)?postProcessFromRow++:postProcessToRow--;var cacheEntry=rowsCache[row];if(!cacheEntry||row>=getDataLength()){continue}if(!postProcessedRows[row]){postProcessedRows[row]={}}ensureCellNodesInRowsCache(row);for(var columnIdx in cacheEntry.cellNodesByColumnIdx){if(!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)){continue}columnIdx=columnIdx|0;var m=columns[columnIdx];if(m.asyncPostRender&&!postProcessedRows[row][columnIdx]){var node=cacheEntry.cellNodesByColumnIdx[columnIdx];if(node){m.asyncPostRender(node,row,getDataItem(row),m)}postProcessedRows[row][columnIdx]=true}}h_postrender=setTimeout(asyncPostProcessRows,options.asyncPostRenderDelay);return}}function updateCellCssStylesOnRenderedRows(addedHash,removedHash){var node,columnId,addedRowHash,removedRowHash;for(var row in rowsCache){removedRowHash=removedHash&&removedHash[row];addedRowHash=addedHash&&addedHash[row];if(removedRowHash){for(columnId in removedRowHash){if(!addedRowHash||removedRowHash[columnId]!=addedRowHash[columnId]){node=getCellNode(row,getColumnIndex(columnId));if(node){$(node).removeClass(removedRowHash[columnId])}}}}if(addedRowHash){for(columnId in addedRowHash){if(!removedRowHash||removedRowHash[columnId]!=addedRowHash[columnId]){node=getCellNode(row,getColumnIndex(columnId));if(node){$(node).addClass(addedRowHash[columnId])}}}}}}function addCellCssStyles(key,hash){if(cellCssClasses[key]){throw"addCellCssStyles: cell CSS hash with key '"+key+"' already exists."}cellCssClasses[key]=hash;updateCellCssStylesOnRenderedRows(hash,null);trigger(self.onCellCssStylesChanged,{key:key,hash:hash})}function removeCellCssStyles(key){if(!cellCssClasses[key]){return}updateCellCssStylesOnRenderedRows(null,cellCssClasses[key]);delete cellCssClasses[key];trigger(self.onCellCssStylesChanged,{key:key,hash:null})}function setCellCssStyles(key,hash){var prevHash=cellCssClasses[key];cellCssClasses[key]=hash;updateCellCssStylesOnRenderedRows(hash,prevHash);trigger(self.onCellCssStylesChanged,{key:key,hash:hash})}function getCellCssStyles(key){return cellCssClasses[key]}function flashCell(row,cell,speed){speed=speed||100;if(rowsCache[row]){var $cell=$(getCellNode(row,cell));function toggleCellClass(times){if(!times){return}setTimeout(function(){$cell.queue(function(){$cell.toggleClass(options.cellFlashingCssClass).dequeue();toggleCellClass(times-1)})},speed)}toggleCellClass(4)}}function handleDragInit(e,dd){var cell=getCellFromEvent(e);if(!cell||!cellExists(cell.row,cell.cell)){return false}var retval=trigger(self.onDragInit,dd,e);if(e.isImmediatePropagationStopped()){return retval}return false}function handleDragStart(e,dd){var cell=getCellFromEvent(e);if(!cell||!cellExists(cell.row,cell.cell)){return false}var retval=trigger(self.onDragStart,dd,e);if(e.isImmediatePropagationStopped()){return retval}return false}function handleDrag(e,dd){return trigger(self.onDrag,dd,e)}function handleDragEnd(e,dd){trigger(self.onDragEnd,dd,e)}function handleKeyDown(e){trigger(self.onKeyDown,{row:activeRow,cell:activeCell},e);var handled=e.isImmediatePropagationStopped();if(!handled){if(!e.shiftKey&&!e.altKey&&!e.ctrlKey){if(e.which==27){if(!getEditorLock().isActive()){return}cancelEditAndSetFocus()}else{if(e.which==37){handled=navigateLeft()}else{if(e.which==39){handled=navigateRight()}else{if(e.which==38){handled=navigateUp()}else{if(e.which==40){handled=navigateDown()}else{if(e.which==9){handled=navigateNext()}else{if(e.which==13){if(options.editable){if(currentEditor){if(activeRow===getDataLength()){navigateDown()}else{commitEditAndSetFocus()}}else{if(getEditorLock().commitCurrentEdit()){makeActiveCellEditable()}}}handled=true}}}}}}}}else{if(e.which==9&&e.shiftKey&&!e.ctrlKey&&!e.altKey){handled=navigatePrev()}}}if(handled){e.stopPropagation();e.preventDefault();try{e.originalEvent.keyCode=0}catch(error){}}}function handleClick(e){if(!currentEditor){if(e.target!=document.activeElement||$(e.target).hasClass("slick-cell")){setFocus()}}var cell=getCellFromEvent(e);if(!cell||(currentEditor!==null&&activeRow==cell.row&&activeCell==cell.cell)){return}trigger(self.onClick,{row:cell.row,cell:cell.cell},e);if(e.isImmediatePropagationStopped()){return}if((activeCell!=cell.cell||activeRow!=cell.row)&&canCellBeActive(cell.row,cell.cell)){if(!getEditorLock().isActive()||getEditorLock().commitCurrentEdit()){scrollRowIntoView(cell.row,false);setActiveCellInternal(getCellNode(cell.row,cell.cell),(cell.row===getDataLength())||options.autoEdit)}}}function handleContextMenu(e){var $cell=$(e.target).closest(".slick-cell",$canvas);if($cell.length===0){return}if(activeCellNode===$cell[0]&&currentEditor!==null){return}trigger(self.onContextMenu,{},e)}function handleDblClick(e){var cell=getCellFromEvent(e);if(!cell||(currentEditor!==null&&activeRow==cell.row&&activeCell==cell.cell)){return}trigger(self.onDblClick,{row:cell.row,cell:cell.cell},e);if(e.isImmediatePropagationStopped()){return}if(options.editable){gotoCell(cell.row,cell.cell,true)}}function handleHeaderMouseEnter(e){trigger(self.onHeaderMouseEnter,{column:$(this).data("column")},e)}function handleHeaderMouseLeave(e){trigger(self.onHeaderMouseLeave,{column:$(this).data("column")},e)}function handleHeaderContextMenu(e){var $header=$(e.target).closest(".slick-header-column",".slick-header-columns");var column=$header&&$header.data("column");trigger(self.onHeaderContextMenu,{column:column},e)}function handleHeaderClick(e){var $header=$(e.target).closest(".slick-header-column",".slick-header-columns");var column=$header&&$header.data("column");if(column){trigger(self.onHeaderClick,{column:column},e)}}function handleMouseEnter(e){trigger(self.onMouseEnter,{},e)}function handleMouseLeave(e){trigger(self.onMouseLeave,{},e)}function cellExists(row,cell){return !(row<0||row>=getDataLength()||cell<0||cell>=columns.length)}function getCellFromPoint(x,y){var row=getRowFromPosition(y);var cell=0;var w=0;for(var i=0;i<columns.length&&w<x;i++){w+=columns[i].width;cell++}if(cell<0){cell=0}return{row:row,cell:cell-1}}function getCellFromNode(cellNode){var cls=/l\d+/.exec(cellNode.className);if(!cls){throw"getCellFromNode: cannot get cell - "+cellNode.className}return parseInt(cls[0].substr(1,cls[0].length-1),10)}function getRowFromNode(rowNode){for(var row in rowsCache){if(rowsCache[row].rowNode===rowNode){return row|0}}return null}function getCellFromEvent(e){var $cell=$(e.target).closest(".slick-cell",$canvas);if(!$cell.length){return null}var row=getRowFromNode($cell[0].parentNode);var cell=getCellFromNode($cell[0]);if(row==null||cell==null){return null}else{return{row:row,cell:cell}}}function getCellNodeBox(row,cell){if(!cellExists(row,cell)){return null}var y1=getRowTop(row);var y2=y1+options.rowHeight-1;var x1=0;for(var i=0;i<cell;i++){x1+=columns[i].width}var x2=x1+columns[cell].width;return{top:y1,left:x1,bottom:y2,right:x2}}function resetActiveCell(){setActiveCellInternal(null,false)}function setFocus(){if(tabbingDirection==-1){$focusSink[0].focus()}else{$focusSink2[0].focus()}}function scrollCellIntoView(row,cell,doPaging){scrollRowIntoView(row,doPaging);var colspan=getColspan(row,cell);var left=columnPosLeft[cell],right=columnPosRight[cell+(colspan>1?colspan-1:0)],scrollRight=scrollLeft+viewportW;if(left<scrollLeft){$viewport.scrollLeft(left);handleScroll();render()}else{if(right>scrollRight){$viewport.scrollLeft(Math.min(left,right-$viewport[0].clientWidth));handleScroll();render()}}}function setActiveCellInternal(newCell,editMode){if(activeCellNode!==null){makeActiveCellNormal();$(activeCellNode).removeClass("active");if(rowsCache[activeRow]){$(rowsCache[activeRow].rowNode).removeClass("active")}}var activeCellChanged=(activeCellNode!==newCell);activeCellNode=newCell;if(activeCellNode!=null){activeRow=getRowFromNode(activeCellNode.parentNode);activeCell=activePosX=getCellFromNode(activeCellNode);$(activeCellNode).addClass("active");$(rowsCache[activeRow].rowNode).addClass("active");if(options.editable&&editMode&&isCellPotentiallyEditable(activeRow,activeCell)){clearTimeout(h_editorLoader);if(options.asyncEditorLoading){h_editorLoader=setTimeout(function(){makeActiveCellEditable()},options.asyncEditorLoadDelay)}else{makeActiveCellEditable()}}}else{activeRow=activeCell=null}if(activeCellChanged){trigger(self.onActiveCellChanged,getActiveCell())}}function clearTextSelection(){if(document.selection&&document.selection.empty){try{document.selection.empty()}catch(e){}}else{if(window.getSelection){var sel=window.getSelection();if(sel&&sel.removeAllRanges){sel.removeAllRanges()}}}}function isCellPotentiallyEditable(row,cell){if(row<getDataLength()&&!getDataItem(row)){return false}if(columns[cell].cannotTriggerInsert&&row>=getDataLength()){return false}if(!getEditor(row,cell)){return false}return true}function makeActiveCellNormal(){if(!currentEditor){return}trigger(self.onBeforeCellEditorDestroy,{editor:currentEditor});currentEditor.destroy();currentEditor=null;if(activeCellNode){var d=getDataItem(activeRow);$(activeCellNode).removeClass("editable invalid");if(d){var column=columns[activeCell];var formatter=getFormatter(activeRow,column);activeCellNode.innerHTML=formatter(activeRow,activeCell,getDataItemValueForColumn(d,column),column,d);invalidatePostProcessingResults(activeRow)}}if(navigator.userAgent.toLowerCase().match(/msie/)){clearTextSelection()}getEditorLock().deactivate(editController)}function makeActiveCellEditable(editor){if(!activeCellNode){return}if(!options.editable){throw"Grid : makeActiveCellEditable : should never get called when options.editable is false"}clearTimeout(h_editorLoader);if(!isCellPotentiallyEditable(activeRow,activeCell)){return}var columnDef=columns[activeCell];var item=getDataItem(activeRow);if(trigger(self.onBeforeEditCell,{row:activeRow,cell:activeCell,item:item,column:columnDef})===false){setFocus();return}getEditorLock().activate(editController);$(activeCellNode).addClass("editable");if(!editor){activeCellNode.innerHTML=""}currentEditor=new (editor||getEditor(activeRow,activeCell))({grid:self,gridPosition:absBox($container[0]),position:absBox(activeCellNode),container:activeCellNode,column:columnDef,item:item||{},commitChanges:commitEditAndSetFocus,cancelChanges:cancelEditAndSetFocus});if(item){currentEditor.loadValue(item)}serializedEditorValue=currentEditor.serializeValue();if(currentEditor.position){handleActiveCellPositionChange()}}function commitEditAndSetFocus(){if(getEditorLock().commitCurrentEdit()){setFocus();if(options.autoEdit){navigateDown()}}}function cancelEditAndSetFocus(){if(getEditorLock().cancelCurrentEdit()){setFocus()}}function absBox(elem){var box={top:elem.offsetTop,left:elem.offsetLeft,bottom:0,right:0,width:$(elem).outerWidth(),height:$(elem).outerHeight(),visible:true};box.bottom=box.top+box.height;box.right=box.left+box.width;var offsetParent=elem.offsetParent;while((elem=elem.parentNode)!=document.body&&elem!=null){if(box.visible&&elem.scrollHeight!=elem.offsetHeight&&$(elem).css("overflowY")!="visible"){box.visible=box.bottom>elem.scrollTop&&box.top<elem.scrollTop+elem.clientHeight}if(box.visible&&elem.scrollWidth!=elem.offsetWidth&&$(elem).css("overflowX")!="visible"){box.visible=box.right>elem.scrollLeft&&box.left<elem.scrollLeft+elem.clientWidth}box.left-=elem.scrollLeft;box.top-=elem.scrollTop;if(elem===offsetParent){box.left+=elem.offsetLeft;box.top+=elem.offsetTop;offsetParent=elem.offsetParent}box.bottom=box.top+box.height;box.right=box.left+box.width}return box}function getActiveCellPosition(){return absBox(activeCellNode)}function getGridPosition(){return absBox($container[0])}function handleActiveCellPositionChange(){if(!activeCellNode){return}trigger(self.onActiveCellPositionChanged,{});if(currentEditor){var cellBox=getActiveCellPosition();if(currentEditor.show&&currentEditor.hide){if(!cellBox.visible){currentEditor.hide()}else{currentEditor.show()}}if(currentEditor.position){currentEditor.position(cellBox)}}}function getCellEditor(){return currentEditor}function getActiveCell(){if(!activeCellNode){return null}else{return{row:activeRow,cell:activeCell}}}function getActiveCellNode(){return activeCellNode}function scrollRowIntoView(row,doPaging){var rowAtTop=row*options.rowHeight;var rowAtBottom=(row+1)*options.rowHeight-viewportH+(viewportHasHScroll?scrollbarDimensions.height:0);if((row+1)*options.rowHeight>scrollTop+viewportH+offset){scrollTo(doPaging?rowAtTop:rowAtBottom);render()}else{if(row*options.rowHeight<scrollTop+offset){scrollTo(doPaging?rowAtBottom:rowAtTop);render()}}}function scrollRowToTop(row){scrollTo(row*options.rowHeight);render()}function getColspan(row,cell){var metadata=data.getItemMetadata&&data.getItemMetadata(row);if(!metadata||!metadata.columns){return 1}var columnData=metadata.columns[columns[cell].id]||metadata.columns[cell];var colspan=(columnData&&columnData.colspan);if(colspan==="*"){colspan=columns.length-cell}else{colspan=colspan||1}return colspan}function findFirstFocusableCell(row){var cell=0;while(cell<columns.length){if(canCellBeActive(row,cell)){return cell}cell+=getColspan(row,cell)}return null}function findLastFocusableCell(row){var cell=0;var lastFocusableCell=null;while(cell<columns.length){if(canCellBeActive(row,cell)){lastFocusableCell=cell}cell+=getColspan(row,cell)}return lastFocusableCell}function gotoRight(row,cell,posX){if(cell>=columns.length){return null}do{cell+=getColspan(row,cell)}while(cell<columns.length&&!canCellBeActive(row,cell));if(cell<columns.length){return{row:row,cell:cell,posX:cell}}return null}function gotoLeft(row,cell,posX){if(cell<=0){return null}var firstFocusableCell=findFirstFocusableCell(row);if(firstFocusableCell===null||firstFocusableCell>=cell){return null}var prev={row:row,cell:firstFocusableCell,posX:firstFocusableCell};var pos;while(true){pos=gotoRight(prev.row,prev.cell,prev.posX);if(!pos){return null}if(pos.cell>=cell){return prev}prev=pos}}function gotoDown(row,cell,posX){var prevCell;while(true){if(++row>=getDataLength()+(options.enableAddRow?1:0)){return null}prevCell=cell=0;while(cell<=posX){prevCell=cell;cell+=getColspan(row,cell)}if(canCellBeActive(row,prevCell)){return{row:row,cell:prevCell,posX:posX}}}}function gotoUp(row,cell,posX){var prevCell;while(true){if(--row<0){return null}prevCell=cell=0;while(cell<=posX){prevCell=cell;cell+=getColspan(row,cell)}if(canCellBeActive(row,prevCell)){return{row:row,cell:prevCell,posX:posX}}}}function gotoNext(row,cell,posX){if(row==null&&cell==null){row=cell=posX=0;if(canCellBeActive(row,cell)){return{row:row,cell:cell,posX:cell}}}var pos=gotoRight(row,cell,posX);if(pos){return pos}var firstFocusableCell=null;while(++row<getDataLength()+(options.enableAddRow?1:0)){firstFocusableCell=findFirstFocusableCell(row);if(firstFocusableCell!==null){return{row:row,cell:firstFocusableCell,posX:firstFocusableCell}}}return null}function gotoPrev(row,cell,posX){if(row==null&&cell==null){row=getDataLength()+(options.enableAddRow?1:0)-1;cell=posX=columns.length-1;if(canCellBeActive(row,cell)){return{row:row,cell:cell,posX:cell}}}var pos;var lastSelectableCell;while(!pos){pos=gotoLeft(row,cell,posX);if(pos){break}if(--row<0){return null}cell=0;lastSelectableCell=findLastFocusableCell(row);if(lastSelectableCell!==null){pos={row:row,cell:lastSelectableCell,posX:lastSelectableCell}}}return pos}function navigateRight(){return navigate("right")}function navigateLeft(){return navigate("left")}function navigateDown(){return navigate("down")}function navigateUp(){return navigate("up")}function navigateNext(){return navigate("next")}function navigatePrev(){return navigate("prev")}function navigate(dir){if(!options.enableCellNavigation){return false}if(!activeCellNode&&dir!="prev"&&dir!="next"){return false}if(!getEditorLock().commitCurrentEdit()){return true}setFocus();var tabbingDirections={up:-1,down:1,left:-1,right:1,prev:-1,next:1};tabbingDirection=tabbingDirections[dir];var stepFunctions={up:gotoUp,down:gotoDown,left:gotoLeft,right:gotoRight,prev:gotoPrev,next:gotoNext};var stepFn=stepFunctions[dir];var pos=stepFn(activeRow,activeCell,activePosX);if(pos){var isAddNewRow=(pos.row==getDataLength());scrollCellIntoView(pos.row,pos.cell,!isAddNewRow);setActiveCellInternal(getCellNode(pos.row,pos.cell),isAddNewRow||options.autoEdit);activePosX=pos.posX;return true}else{setActiveCellInternal(getCellNode(activeRow,activeCell),(activeRow==getDataLength())||options.autoEdit);return false}}function getCellNode(row,cell){if(rowsCache[row]){ensureCellNodesInRowsCache(row);return rowsCache[row].cellNodesByColumnIdx[cell]}return null}function setActiveCell(row,cell){if(!initialized){return}if(row>getDataLength()||row<0||cell>=columns.length||cell<0){return}if(!options.enableCellNavigation){return}scrollCellIntoView(row,cell,false);setActiveCellInternal(getCellNode(row,cell),false)}function canCellBeActive(row,cell){if(!options.enableCellNavigation||row>=getDataLength()+(options.enableAddRow?1:0)||row<0||cell>=columns.length||cell<0){return false}var rowMetadata=data.getItemMetadata&&data.getItemMetadata(row);if(rowMetadata&&typeof rowMetadata.focusable==="boolean"){return rowMetadata.focusable}var columnMetadata=rowMetadata&&rowMetadata.columns;if(columnMetadata&&columnMetadata[columns[cell].id]&&typeof columnMetadata[columns[cell].id].focusable==="boolean"){return columnMetadata[columns[cell].id].focusable}if(columnMetadata&&columnMetadata[cell]&&typeof columnMetadata[cell].focusable==="boolean"){return columnMetadata[cell].focusable}return columns[cell].focusable}function canCellBeSelected(row,cell){if(row>=getDataLength()||row<0||cell>=columns.length||cell<0){return false}var rowMetadata=data.getItemMetadata&&data.getItemMetadata(row);if(rowMetadata&&typeof rowMetadata.selectable==="boolean"){return rowMetadata.selectable}var columnMetadata=rowMetadata&&rowMetadata.columns&&(rowMetadata.columns[columns[cell].id]||rowMetadata.columns[cell]);if(columnMetadata&&typeof columnMetadata.selectable==="boolean"){return columnMetadata.selectable}return columns[cell].selectable}function gotoCell(row,cell,forceEdit){if(!initialized){return}if(!canCellBeActive(row,cell)){return}if(!getEditorLock().commitCurrentEdit()){return}scrollCellIntoView(row,cell,false);var newCell=getCellNode(row,cell);setActiveCellInternal(newCell,forceEdit||(row===getDataLength())||options.autoEdit);if(!currentEditor){setFocus()}}function commitCurrentEdit(){var item=getDataItem(activeRow);var column=columns[activeCell];if(currentEditor){if(currentEditor.isValueChanged()){var validationResults=currentEditor.validate();if(validationResults.valid){if(activeRow<getDataLength()){var editCommand={row:activeRow,cell:activeCell,editor:currentEditor,serializedValue:currentEditor.serializeValue(),prevSerializedValue:serializedEditorValue,execute:function(){this.editor.applyValue(item,this.serializedValue);updateRow(this.row)},undo:function(){this.editor.applyValue(item,this.prevSerializedValue);updateRow(this.row)}};if(options.editCommandHandler){makeActiveCellNormal();options.editCommandHandler(item,column,editCommand)}else{editCommand.execute();makeActiveCellNormal()}trigger(self.onCellChange,{row:activeRow,cell:activeCell,item:item})}else{var newItem={};currentEditor.applyValue(newItem,currentEditor.serializeValue());makeActiveCellNormal();trigger(self.onAddNewRow,{item:newItem,column:column})}return !getEditorLock().isActive()}else{$(activeCellNode).removeClass("invalid");$(activeCellNode).width();$(activeCellNode).addClass("invalid");trigger(self.onValidationError,{editor:currentEditor,cellNode:activeCellNode,validationResults:validationResults,row:activeRow,cell:activeCell,column:column});currentEditor.focus();return false}}makeActiveCellNormal()}return true}function cancelCurrentEdit(){makeActiveCellNormal();return true}function rowsToRanges(rows){var ranges=[];var lastCell=columns.length-1;for(var i=0;i<rows.length;i++){ranges.push(new Slick.Range(rows[i],0,rows[i],lastCell))}return ranges}function getSelectedRows(){if(!selectionModel){throw"Selection model is not set"}return selectedRows}function setSelectedRows(rows){if(!selectionModel){throw"Selection model is not set"}selectionModel.setSelectedRanges(rowsToRanges(rows))}this.debug=function(){var s="";s+=("\ncounter_rows_rendered:  "+counter_rows_rendered);s+=("\ncounter_rows_removed:  "+counter_rows_removed);s+=("\nrenderedRows:  "+renderedRows);s+=("\nnumVisibleRows:  "+numVisibleRows);s+=("\nmaxSupportedCssHeight:  "+maxSupportedCssHeight);s+=("\nn(umber of pages):  "+n);s+=("\n(current) page:  "+page);s+=("\npage height (ph):  "+ph);s+=("\nvScrollDir:  "+vScrollDir);alert(s)};this.eval=function(expr){return eval(expr)};$.extend(this,{slickGridVersion:"2.1",onScroll:new Slick.Event(),onSort:new Slick.Event(),onHeaderMouseEnter:new Slick.Event(),onHeaderMouseLeave:new Slick.Event(),onHeaderContextMenu:new Slick.Event(),onHeaderClick:new Slick.Event(),onHeaderCellRendered:new Slick.Event(),onBeforeHeaderCellDestroy:new Slick.Event(),onHeaderRowCellRendered:new Slick.Event(),onBeforeHeaderRowCellDestroy:new Slick.Event(),onMouseEnter:new Slick.Event(),onMouseLeave:new Slick.Event(),onClick:new Slick.Event(),onDblClick:new Slick.Event(),onContextMenu:new Slick.Event(),onKeyDown:new Slick.Event(),onAddNewRow:new Slick.Event(),onValidationError:new Slick.Event(),onViewportChanged:new Slick.Event(),onColumnsReordered:new Slick.Event(),onColumnsResized:new Slick.Event(),onCellChange:new Slick.Event(),onBeforeEditCell:new Slick.Event(),onBeforeCellEditorDestroy:new Slick.Event(),onBeforeDestroy:new Slick.Event(),onActiveCellChanged:new Slick.Event(),onActiveCellPositionChanged:new Slick.Event(),onDragInit:new Slick.Event(),onDragStart:new Slick.Event(),onDrag:new Slick.Event(),onDragEnd:new Slick.Event(),onSelectedRowsChanged:new Slick.Event(),onCellCssStylesChanged:new Slick.Event(),registerPlugin:registerPlugin,unregisterPlugin:unregisterPlugin,getColumns:getColumns,setColumns:setColumns,getColumnIndex:getColumnIndex,updateColumnHeader:updateColumnHeader,setSortColumn:setSortColumn,setSortColumns:setSortColumns,getSortColumns:getSortColumns,autosizeColumns:autosizeColumns,getOptions:getOptions,setOptions:setOptions,getData:getData,getDataLength:getDataLength,getDataItem:getDataItem,setData:setData,getSelectionModel:getSelectionModel,setSelectionModel:setSelectionModel,getSelectedRows:getSelectedRows,setSelectedRows:setSelectedRows,getContainerNode:getContainerNode,render:render,invalidate:invalidate,invalidateRow:invalidateRow,invalidateRows:invalidateRows,invalidateAllRows:invalidateAllRows,updateCell:updateCell,updateRow:updateRow,getViewport:getVisibleRange,getRenderedRange:getRenderedRange,resizeCanvas:resizeCanvas,updateRowCount:updateRowCount,scrollRowIntoView:scrollRowIntoView,scrollRowToTop:scrollRowToTop,scrollCellIntoView:scrollCellIntoView,getCanvasNode:getCanvasNode,focus:setFocus,getCellFromPoint:getCellFromPoint,getCellFromEvent:getCellFromEvent,getActiveCell:getActiveCell,setActiveCell:setActiveCell,getActiveCellNode:getActiveCellNode,getActiveCellPosition:getActiveCellPosition,resetActiveCell:resetActiveCell,editActiveCell:makeActiveCellEditable,getCellEditor:getCellEditor,getCellNode:getCellNode,getCellNodeBox:getCellNodeBox,canCellBeSelected:canCellBeSelected,canCellBeActive:canCellBeActive,navigatePrev:navigatePrev,navigateNext:navigateNext,navigateUp:navigateUp,navigateDown:navigateDown,navigateLeft:navigateLeft,navigateRight:navigateRight,gotoCell:gotoCell,getTopPanel:getTopPanel,setTopPanelVisibility:setTopPanelVisibility,setHeaderRowVisibility:setHeaderRowVisibility,getHeaderRow:getHeaderRow,getHeaderRowColumn:getHeaderRowColumn,getGridPosition:getGridPosition,flashCell:flashCell,addCellCssStyles:addCellCssStyles,setCellCssStyles:setCellCssStyles,removeCellCssStyles:removeCellCssStyles,getCellCssStyles:getCellCssStyles,init:finishInitialization,destroy:destroy,getEditorLock:getEditorLock,getEditController:getEditController});init()}}(jQuery));
/*mleibman-SlickGrid/slick.editors.js*/
(function(f){f.extend(true,window,{Slick:{Editors:{Text:h,Integer:b,Date:c,YesNoSelect:d,Checkbox:e,PercentComplete:a,LongText:g}}});function h(j){var l;var i;var k=this;this.init=function(){l=f("<INPUT type=text class='editor-text' />").appendTo(j.container).bind("keydown.nav",function(m){if(m.keyCode===f.ui.keyCode.LEFT||m.keyCode===f.ui.keyCode.RIGHT){m.stopImmediatePropagation()}}).focus().select()};this.destroy=function(){l.remove()};this.focus=function(){l.focus()};this.getValue=function(){return l.val()};this.setValue=function(m){l.val(m)};this.loadValue=function(m){i=m[j.column.field]||"";l.val(i);l[0].defaultValue=i;l.select()};this.serializeValue=function(){return l.val()};this.applyValue=function(m,n){m[j.column.field]=n};this.isValueChanged=function(){return(!(l.val()==""&&i==null))&&(l.val()!=i)};this.validate=function(){if(j.column.validator){var m=j.column.validator(l.val());if(!m.valid){return m}}return{valid:true,msg:null}};this.init()}function b(j){var l;var i;var k=this;this.init=function(){l=f("<INPUT type=text class='editor-text' />");l.bind("keydown.nav",function(m){if(m.keyCode===f.ui.keyCode.LEFT||m.keyCode===f.ui.keyCode.RIGHT){m.stopImmediatePropagation()}});l.appendTo(j.container);l.focus().select()};this.destroy=function(){l.remove()};this.focus=function(){l.focus()};this.loadValue=function(m){i=m[j.column.field];l.val(i);l[0].defaultValue=i;l.select()};this.serializeValue=function(){return parseInt(l.val(),10)||0};this.applyValue=function(m,n){m[j.column.field]=n};this.isValueChanged=function(){return(!(l.val()==""&&i==null))&&(l.val()!=i)};this.validate=function(){if(isNaN(l.val())){return{valid:false,msg:"Please enter a valid integer"}}return{valid:true,msg:null}};this.init()}function c(j){var m;var i;var k=this;var l=false;this.init=function(){m=f("<INPUT type=text class='editor-text' />");m.appendTo(j.container);m.focus().select();m.datepicker({showOn:"button",buttonImageOnly:true,buttonImage:"../images/calendar.gif",beforeShow:function(){l=true},onClose:function(){l=false}});m.width(m.width()-18)};this.destroy=function(){f.datepicker.dpDiv.stop(true,true);m.datepicker("hide");m.datepicker("destroy");m.remove()};this.show=function(){if(l){f.datepicker.dpDiv.stop(true,true).show()}};this.hide=function(){if(l){f.datepicker.dpDiv.stop(true,true).hide()}};this.position=function(n){if(!l){return}f.datepicker.dpDiv.css("top",n.top+30).css("left",n.left)};this.focus=function(){m.focus()};this.loadValue=function(n){i=n[j.column.field];m.val(i);m[0].defaultValue=i;m.select()};this.serializeValue=function(){return m.val()};this.applyValue=function(n,o){n[j.column.field]=o};this.isValueChanged=function(){return(!(m.val()==""&&i==null))&&(m.val()!=i)};this.validate=function(){return{valid:true,msg:null}};this.init()}function d(k){var j;var i;var l=this;this.init=function(){j=f("<SELECT tabIndex='0' class='editor-yesno'><OPTION value='yes'>Yes</OPTION><OPTION value='no'>No</OPTION></SELECT>");j.appendTo(k.container);j.focus()};this.destroy=function(){j.remove()};this.focus=function(){j.focus()};this.loadValue=function(m){j.val((i=m[k.column.field])?"yes":"no");j.select()};this.serializeValue=function(){return(j.val()=="yes")};this.applyValue=function(m,n){m[k.column.field]=n};this.isValueChanged=function(){return(j.val()!=i)};this.validate=function(){return{valid:true,msg:null}};this.init()}function e(k){var j;var i;var l=this;this.init=function(){j=f("<INPUT type=checkbox value='true' class='editor-checkbox' hideFocus>");j.appendTo(k.container);j.focus()};this.destroy=function(){j.remove()};this.focus=function(){j.focus()};this.loadValue=function(m){i=!!m[k.column.field];if(i){j.attr("checked","checked")}else{j.removeAttr("checked")}};this.serializeValue=function(){return !!j.attr("checked")};this.applyValue=function(m,n){m[k.column.field]=n};this.isValueChanged=function(){return(this.serializeValue()!==i)};this.validate=function(){return{valid:true,msg:null}};this.init()}function a(j){var m,l;var i;var k=this;this.init=function(){m=f("<INPUT type=text class='editor-percentcomplete' />");m.width(f(j.container).innerWidth()-25);m.appendTo(j.container);l=f("<div class='editor-percentcomplete-picker' />").appendTo(j.container);l.append("<div class='editor-percentcomplete-helper'><div class='editor-percentcomplete-wrapper'><div class='editor-percentcomplete-slider' /><div class='editor-percentcomplete-buttons' /></div></div>");l.find(".editor-percentcomplete-buttons").append("<button val=0>Not started</button><br/><button val=50>In Progress</button><br/><button val=100>Complete</button>");m.focus().select();l.find(".editor-percentcomplete-slider").slider({orientation:"vertical",range:"min",value:i,slide:function(n,o){m.val(o.value)}});l.find(".editor-percentcomplete-buttons button").bind("click",function(n){m.val(f(this).attr("val"));l.find(".editor-percentcomplete-slider").slider("value",f(this).attr("val"))})};this.destroy=function(){m.remove();l.remove()};this.focus=function(){m.focus()};this.loadValue=function(n){m.val(i=n[j.column.field]);m.select()};this.serializeValue=function(){return parseInt(m.val(),10)||0};this.applyValue=function(n,o){n[j.column.field]=o};this.isValueChanged=function(){return(!(m.val()==""&&i==null))&&((parseInt(m.val(),10)||0)!=i)};this.validate=function(){if(isNaN(parseInt(m.val(),10))){return{valid:false,msg:"Please enter a valid positive number"}}return{valid:true,msg:null}};this.init()}function g(j){var m,l;var i;var k=this;this.init=function(){var n=f("body");l=f("<DIV style='z-index:10000;position:absolute;background:white;padding:5px;border:3px solid gray; -moz-border-radius:10px; border-radius:10px;'/>").appendTo(n);m=f("<TEXTAREA hidefocus rows=5 style='backround:white;width:250px;height:80px;border:0;outline:0'>").appendTo(l);f("<DIV style='text-align:right'><BUTTON>Save</BUTTON><BUTTON>Cancel</BUTTON></DIV>").appendTo(l);l.find("button:first").bind("click",this.save);l.find("button:last").bind("click",this.cancel);m.bind("keydown",this.handleKeyDown);k.position(j.position);m.focus().select()};this.handleKeyDown=function(n){if(n.which==f.ui.keyCode.ENTER&&n.ctrlKey){k.save()}else{if(n.which==f.ui.keyCode.ESCAPE){n.preventDefault();k.cancel()}else{if(n.which==f.ui.keyCode.TAB&&n.shiftKey){n.preventDefault();j.grid.navigatePrev()}else{if(n.which==f.ui.keyCode.TAB){n.preventDefault();j.grid.navigateNext()}}}}};this.save=function(){j.commitChanges()};this.cancel=function(){m.val(i);j.cancelChanges()};this.hide=function(){l.hide()};this.show=function(){l.show()};this.position=function(n){l.css("top",n.top-5).css("left",n.left-5)};this.destroy=function(){l.remove()};this.focus=function(){m.focus()};this.loadValue=function(n){m.val(i=n[j.column.field]);m.select()};this.serializeValue=function(){return m.val()};this.applyValue=function(n,o){n[j.column.field]=o};this.isValueChanged=function(){return(!(m.val()==""&&i==null))&&(m.val()!=i)};this.validate=function(){return{valid:true,msg:null}};this.init()}})(jQuery);
/*mleibman-SlickGrid/slick.formatters.js*/
(function(e){e.extend(true,window,{Slick:{Formatters:{PercentComplete:d,PercentCompleteBar:c,YesNo:a,Checkmark:b}}});function d(j,g,i,h,f){if(i==null||i===""){return"-"}else{if(i<50){return"<span style='color:red;font-weight:bold;'>"+i+"%</span>"}else{return"<span style='color:green'>"+i+"%</span>"}}}function c(k,g,j,i,f){if(j==null||j===""){return""}var h;if(j<30){h="red"}else{if(j<70){h="silver"}else{h="green"}}return"<span class='percent-complete-bar' style='background:"+h+";width:"+j+"%'></span>"}function a(j,g,i,h,f){return i?"Yes":"No"}function b(j,g,i,h,f){return i=="1"?"<img src='/img/admin/tick.png'>":""}})(jQuery);
/*mleibman-SlickGrid/slick.dataview.js*/
(function(d){d.extend(true,window,{Slick:{Data:{DataView:f,Aggregators:{Avg:c,Min:b,Max:a,Sum:e}}}});function f(Z){var at=this;var L={groupItemMetadataProvider:null,inlineFilters:false};var q="id";var au=[];var V=[];var aA={};var av=null;var v=null;var ar=null;var E=false;var k=true;var aN;var y;var af={};var N={};var aG;var n=[];var G;var z;var ak=[];var aC={getter:null,formatter:null,comparer:function(aS,aR){return aS.value-aR.value},predefinedValues:[],aggregators:[],aggregateEmpty:false,aggregateCollapsed:false,aggregateChildGroups:false,collapsed:false,displayTotalsRow:true};var aq=[];var h=[];var j=[];var aJ=":|:";var C=0;var D=0;var g=0;var aE=new Slick.Event();var M=new Slick.Event();var aO=new Slick.Event();Z=d.extend(true,{},L,Z);function p(){E=true}function r(){E=false;aw()}function ay(aR){af=aR}function O(aR){aG=aR}function aH(aT){aT=aT||0;var aU;for(var aS=aT,aR=au.length;aS<aR;aS++){aU=au[aS][q];if(aU===undefined){throw"Each data element must implement a unique 'id' property"}aA[aU]=aS}}function F(){var aT;for(var aS=0,aR=au.length;aS<aR;aS++){aT=au[aS][q];if(aT===undefined||aA[aT]!==aS){throw"Each data element must implement a unique 'id' property"}}}function aP(){return au}function T(aS,aR){if(aR!==undefined){q=aR}au=n=aS;aA={};aH();F();aw()}function A(aR){if(aR.pageSize!=undefined){C=aR.pageSize;D=C?Math.min(D,Math.max(0,Math.ceil(g/C)-1)):0}if(aR.pageNum!=undefined){D=Math.min(aR.pageNum,Math.max(0,Math.ceil(g/C)-1))}aO.notify(al(),null,at);aw()}function al(){var aR=C?Math.max(1,Math.ceil(g/C)):1;return{pageSize:C,pageNum:D,totalRows:g,totalPages:aR}}function H(aS,aR){k=aR;y=aS;aN=null;if(aR===false){au.reverse()}au.sort(aS);if(aR===false){au.reverse()}aA={};aH();aw()}function aI(aT,aS){k=aS;aN=aT;y=null;var aR=Object.prototype.toString;Object.prototype.toString=(typeof aT=="function")?aT:function(){return this[aT]};if(aS===false){au.reverse()}au.sort();Object.prototype.toString=aR;if(aS===false){au.reverse()}aA={};aH();aw()}function x(){if(y){H(y,k)}else{if(aN){aI(aN,k)}}}function ab(aR){v=aR;if(Z.inlineFilters){G=aj();z=B()}aw()}function ag(){return aq}function J(aU){if(!Z.groupItemMetadataProvider){Z.groupItemMetadataProvider=new Slick.Data.GroupItemMetadataProvider()}h=[];j=[];aU=aU||[];aq=(aU instanceof Array)?aU:[aU];for(var aT=0;aT<aq.length;aT++){var aS=aq[aT]=d.extend(true,{},aC,aq[aT]);aS.getterIsAFn=typeof aS.getter==="function";aS.compiledAccumulators=[];var aR=aS.aggregators.length;while(aR--){aS.compiledAccumulators[aR]=an(aS.aggregators[aR])}j[aT]={}}aw()}function ac(aR,aS,aT){if(aR==null){J([]);return}J({getter:aR,formatter:aS,comparer:aT})}function aL(aS,aR){if(!aq.length){throw new Error("At least one grouping must be specified before calling setAggregators().")}aq[0].aggregators=aS;aq[0].aggregateCollapsed=aR;J(aq)}function az(aR){return au[aR]}function I(aR){return aA[aR]}function u(){if(!av){av={};for(var aS=0,aR=V.length;aS<aR;aS++){av[V[aS][q]]=aS}}}function ah(aR){u();return av[aR]}function X(aR){return au[aA[aR]]}function aF(aS){var aT=[];u();for(var aR=0;aR<aS.length;aR++){var aU=av[aS[aR]];if(aU!=null){aT[aT.length]=aU}}return aT}function S(aT){var aS=[];for(var aR=0;aR<aT.length;aR++){if(aT[aR]<V.length){aS[aS.length]=V[aT[aR]][q]}}return aS}function m(aS,aR){if(aA[aS]===undefined||aS!==aR[q]){throw"Invalid or non-matching id"}au[aA[aS]]=aR;if(!ar){ar={}}ar[aS]=true;aw()}function aK(aR,aS){au.splice(aR,0,aS);aH(aR);aw()}function ao(aR){au.push(aR);aH(au.length-1);aw()}function aQ(aS){var aR=aA[aS];if(aR===undefined){throw"Invalid id"}delete aA[aS];au.splice(aR,1);aH(aR);aw()}function ax(){return V.length}function aD(aR){return V[aR]}function K(aR){var aS=V[aR];if(aS===undefined){return null}if(aS.__group){return Z.groupItemMetadataProvider.getGroupRowMetadata(aS)}if(aS.__groupTotals){return Z.groupItemMetadataProvider.getTotalsRowMetadata(aS)}return null}function aM(aT,aS){if(aT==null){for(var aR=0;aR<aq.length;aR++){j[aR]={};aq[aR].collapsed=aS}}else{j[aT]={};aq[aT].collapsed=aS}aw()}function P(aR){aM(aR,true)}function aB(aR){aM(aR,false)}function W(aT,aR,aS){j[aT][aR]=aq[aT].collapsed^aS;aw()}function ai(aT){var aR=Array.prototype.slice.call(arguments);var aS=aR[0];if(aR.length==1&&aS.indexOf(aJ)!=-1){W(aS.split(aJ).length-1,aS,true)}else{W(aR.length-1,aR.join(aJ),true)}}function ad(aT){var aR=Array.prototype.slice.call(arguments);var aS=aR[0];if(aR.length==1&&aS.indexOf(aJ)!=-1){W(aS.split(aJ).length-1,aS,false)}else{W(aR.length-1,aR.join(aJ),false)}}function am(){return h}function Y(a1,aY){var a0;var aT;var aU=[];var aZ=[];var aR;var aS=aY?aY.level+1:0;var aX=aq[aS];for(var aW=0,aV=aX.predefinedValues.length;aW<aV;aW++){aT=aX.predefinedValues[aW];a0=aZ[aT];if(!a0){a0=new Slick.Group();a0.value=aT;a0.level=aS;a0.groupingKey=(aY?aY.groupingKey+aJ:"")+aT;aU[aU.length]=a0;aZ[aT]=a0}}for(var aW=0,aV=a1.length;aW<aV;aW++){aR=a1[aW];aT=aX.getterIsAFn?aX.getter(aR):aR[aX.getter];a0=aZ[aT];if(!a0){a0=new Slick.Group();a0.value=aT;a0.level=aS;a0.groupingKey=(aY?aY.groupingKey+aJ:"")+aT;aU[aU.length]=a0;aZ[aT]=a0}a0.rows[a0.count++]=aR}if(aS<aq.length-1){for(var aW=0;aW<aU.length;aW++){a0=aU[aW];a0.groups=Y(a0.rows,a0)}}aU.sort(aq[aS].comparer);return aU}function ap(aW){var aT=aq[aW.level];var aV=(aW.level==aq.length);var aU=new Slick.GroupTotals();var aS,aR=aT.aggregators.length;while(aR--){aS=aT.aggregators[aR];aS.init();aT.compiledAccumulators[aR].call(aS,(!aV&&aT.aggregateChildGroups)?aW.groups:aW.rows);aS.storeResult(aU)}aU.group=aW;aW.totals=aU}function ae(aS,aV){aV=aV||0;var aT=aq[aV];var aR=aS.length,aU;while(aR--){aU=aS[aR];if(aU.collapsed&&!aT.aggregateCollapsed){continue}if(aU.groups){ae(aU.groups,aV+1)}if(aT.aggregators.length&&(aT.aggregateEmpty||aU.rows.length||(aU.groups&&aU.groups.length))){ap(aU)}}}function t(aS,aX){aX=aX||0;var aT=aq[aX];var aU=aT.collapsed;var aW=j[aX];var aR=aS.length,aV;while(aR--){aV=aS[aR];aV.collapsed=aU^aW[aV.groupingKey];aV.title=aT.formatter?aT.formatter(aV):aV.value;if(aV.groups){t(aV.groups,aX+1);aV.rows=[]}}}function i(aS,aR){aR=aR||0;var a0=aq[aR];var aT=[],a1,aX=0,aZ;for(var aW=0,aU=aS.length;aW<aU;aW++){aZ=aS[aW];aT[aX++]=aZ;if(!aZ.collapsed){a1=aZ.groups?i(aZ.groups,aR+1):aZ.rows;for(var aV=0,aY=a1.length;aV<aY;aV++){aT[aX++]=a1[aV]}}if(aZ.totals&&a0.displayTotalsRow&&(!aZ.collapsed||a0.aggregateCollapsed)){aT[aX++]=aZ.totals}}return aT}function R(aS){var aR=/^function[^(]*\(([^)]*)\)\s*{([\s\S]*)}$/;var aT=aS.toString().match(aR);return{params:aT[1].split(","),body:aT[2]}}function an(aT){var aS=R(aT.accumulate);var aR=new Function("_items","for (var "+aS.params[0]+", _i=0, _il=_items.length; _i<_il; _i++) {"+aS.params[0]+" = _items[_i]; "+aS.body+"}");aR.displayName=aR.name="compiledAccumulatorLoop";return aR}function aj(){var aU=R(v);var aR=aU.body.replace(/return false\s*([;}]|$)/gi,"{ continue _coreloop; }$1").replace(/return true\s*([;}]|$)/gi,"{ _retval[_idx++] = $item$; continue _coreloop; }$1").replace(/return ([^;}]+?)\s*([;}]|$)/gi,"{ if ($1) { _retval[_idx++] = $item$; }; continue _coreloop; }$2");var aS=["var _retval = [], _idx = 0; ","var $item$, $args$ = _args; ","_coreloop: ","for (var _i = 0, _il = _items.length; _i < _il; _i++) { ","$item$ = _items[_i]; ","$filter$; ","} ","return _retval; "].join("");aS=aS.replace(/\$filter\$/gi,aR);aS=aS.replace(/\$item\$/gi,aU.params[0]);aS=aS.replace(/\$args\$/gi,aU.params[1]);var aT=new Function("_items,_args",aS);aT.displayName=aT.name="compiledFilter";return aT}function B(){var aU=R(v);var aR=aU.body.replace(/return false\s*([;}]|$)/gi,"{ continue _coreloop; }$1").replace(/return true\s*([;}]|$)/gi,"{ _cache[_i] = true;_retval[_idx++] = $item$; continue _coreloop; }$1").replace(/return ([^;}]+?)\s*([;}]|$)/gi,"{ if ((_cache[_i] = $1)) { _retval[_idx++] = $item$; }; continue _coreloop; }$2");var aS=["var _retval = [], _idx = 0; ","var $item$, $args$ = _args; ","_coreloop: ","for (var _i = 0, _il = _items.length; _i < _il; _i++) { ","$item$ = _items[_i]; ","if (_cache[_i]) { ","_retval[_idx++] = $item$; ","continue _coreloop; ","} ","$filter$; ","} ","return _retval; "].join("");aS=aS.replace(/\$filter\$/gi,aR);aS=aS.replace(/\$item\$/gi,aU.params[0]);aS=aS.replace(/\$args\$/gi,aU.params[1]);var aT=new Function("_items,_args,_cache",aS);aT.displayName=aT.name="compiledFilterWithCaching";return aT}function o(aT,aU){var aS=[],aR=0;for(var aV=0,aW=aT.length;aV<aW;aV++){if(v(aT[aV],aU)){aS[aR++]=aT[aV]}}return aS}function Q(aU,aV,aT){var aS=[],aR=0,aY;for(var aW=0,aX=aU.length;aW<aX;aW++){aY=aU[aW];if(aT[aW]){aS[aR++]=aY}else{if(v(aY,aV)){aS[aR++]=aY;aT[aW]=true}}}return aS}function w(aS){if(v){var aR=Z.inlineFilters?G:o;var aU=Z.inlineFilters?z:Q;if(af.isFilterNarrowing){n=aR(n,aG)}else{if(af.isFilterExpanding){n=aU(aS,aG,ak)}else{if(!af.isFilterUnchanged){n=aR(aS,aG)}}}}else{n=C?aS:aS.concat()}var aT;if(C){if(n.length<D*C){D=Math.floor(n.length/C)}aT=n.slice(C*D,C*D+C)}else{aT=n}return{totalRows:n.length,rows:aT}}function l(a0,aU){var aZ,aR,aS,aY=[];var aW=0,aX=aU.length;if(af&&af.ignoreDiffsBefore){aW=Math.max(0,Math.min(aU.length,af.ignoreDiffsBefore))}if(af&&af.ignoreDiffsAfter){aX=Math.min(aU.length,Math.max(0,af.ignoreDiffsAfter))}for(var aT=aW,aV=a0.length;aT<aX;aT++){if(aT>=aV){aY[aY.length]=aT}else{aZ=aU[aT];aR=a0[aT];if((aq.length&&(aS=(aZ.__nonDataRow)||(aR.__nonDataRow))&&aZ.__group!==aR.__group||aZ.__group&&!aZ.equals(aR))||(aS&&(aZ.__groupTotals||aR.__groupTotals))||aZ[q]!=aR[q]||(ar&&ar[aZ[q]])){aY[aY.length]=aT}}}return aY}function s(aU){av=null;if(af.isFilterNarrowing!=N.isFilterNarrowing||af.isFilterExpanding!=N.isFilterExpanding){ak=[]}var aS=w(aU);g=aS.totalRows;var aR=aS.rows;h=[];if(aq.length){h=Y(aR);if(h.length){ae(h);t(h);aR=i(h)}}var aT=l(V,aR);V=aR;return aT}function aw(){if(E){return}var aR=V.length;var aS=g;var aT=s(au,v);if(C&&g<D*C){D=Math.max(0,Math.ceil(g/C)-1);aT=s(au,v)}ar=null;N=af;af={};if(aS!=g){aO.notify(al(),null,at)}if(aR!=V.length){aE.notify({previous:aR,current:V.length},null,at)}if(aT.length>0){M.notify({rows:aT},null,at)}}function U(aU,aT){var aS=this;var aR=aS.mapRowsToIds(aU.getSelectedRows());var aV;function aW(){if(aR.length>0){aV=true;var aX=aS.mapIdsToRows(aR);if(!aT){aR=aS.mapRowsToIds(aX)}aU.setSelectedRows(aX);aV=false}}aU.onSelectedRowsChanged.subscribe(function(aY,aX){if(aV){return}aR=aS.mapRowsToIds(aU.getSelectedRows())});this.onRowsChanged.subscribe(aW);this.onRowCountChanged.subscribe(aW)}function aa(aT,aS){var aR;var aV;aU(aT.getCellCssStyles(aS));function aU(aX){aR={};for(var aY in aX){var aZ=V[aY][q];aR[aZ]=aX[aY]}}function aW(){if(aR){aV=true;u();var aX={};for(var aZ in aR){var aY=av[aZ];if(aY!=undefined){aX[aY]=aR[aZ]}}aT.setCellCssStyles(aS,aX);aV=false}}aT.onCellCssStylesChanged.subscribe(function(aY,aX){if(aV){return}if(aS!=aX.key){return}if(aX.hash){aU(aX.hash)}});this.onRowsChanged.subscribe(aW);this.onRowCountChanged.subscribe(aW)}d.extend(this,{beginUpdate:p,endUpdate:r,setPagingOptions:A,getPagingInfo:al,getItems:aP,setItems:T,setFilter:ab,sort:H,fastSort:aI,reSort:x,setGrouping:J,getGrouping:ag,groupBy:ac,setAggregators:aL,collapseAllGroups:P,expandAllGroups:aB,collapseGroup:ai,expandGroup:ad,getGroups:am,getIdxById:I,getRowById:ah,getItemById:X,getItemByIdx:az,mapRowsToIds:S,mapIdsToRows:aF,setRefreshHints:ay,setFilterArgs:O,refresh:aw,updateItem:m,insertItem:aK,addItem:ao,deleteItem:aQ,syncGridSelection:U,syncGridCellCssStyles:aa,getLength:ax,getItem:aD,getItemMetadata:K,onRowCountChanged:aE,onRowsChanged:M,onPagingInfoChanged:aO})}function c(g){this.field_=g;this.init=function(){this.count_=0;this.nonNullCount_=0;this.sum_=0};this.accumulate=function(h){var i=h[this.field_];this.count_++;if(i!=null&&i!==""&&i!==NaN){this.nonNullCount_++;this.sum_+=parseFloat(i)}};this.storeResult=function(h){if(!h.avg){h.avg={}}if(this.nonNullCount_!=0){h.avg[this.field_]=this.sum_/this.nonNullCount_}}}function b(g){this.field_=g;this.init=function(){this.min_=null};this.accumulate=function(h){var i=h[this.field_];if(i!=null&&i!==""&&i!==NaN){if(this.min_==null||i<this.min_){this.min_=i}}};this.storeResult=function(h){if(!h.min){h.min={}}h.min[this.field_]=this.min_}}function a(g){this.field_=g;this.init=function(){this.max_=null};this.accumulate=function(h){var i=h[this.field_];if(i!=null&&i!==""&&i!==NaN){if(this.max_==null||i>this.max_){this.max_=i}}};this.storeResult=function(h){if(!h.max){h.max={}}h.max[this.field_]=this.max_}}function e(g){this.field_=g;this.init=function(){this.sum_=null};this.accumulate=function(h){var i=h[this.field_];if(i!=null&&i!==""&&i!==NaN){this.sum_+=parseFloat(i)}};this.storeResult=function(h){if(!h.sum){h.sum={}}h.sum[this.field_]=this.sum_}}})(jQuery);
/*mleibman-SlickGrid/slick.groupitemmetadataprovider.js*/
(function(b){b.extend(true,window,{Slick:{Data:{GroupItemMetadataProvider:a}}});function a(m){var i;var f={groupCssClass:"slick-group",groupTitleCssClass:"slick-group-title",totalsCssClass:"slick-group-totals",groupFocusable:true,totalsFocusable:false,toggleCssClass:"slick-group-toggle",toggleExpandedCssClass:"expanded",toggleCollapsedCssClass:"collapsed",enableExpandCollapse:true};m=b.extend(true,{},f,m);function h(s,n,r,o,q){if(!m.enableExpandCollapse){return q.title}var p=q.level*15+"px";return"<span class='"+m.toggleCssClass+" "+(q.collapsed?m.toggleCollapsedCssClass:m.toggleExpandedCssClass)+"' style='margin-left:"+p+"'></span><span class='"+m.groupTitleCssClass+"' level='"+q.level+"'>"+q.title+"</span>"}function d(r,n,q,o,p){return(o.groupTotalsFormatter&&o.groupTotalsFormatter(p,o))||""}function l(n){i=n;i.onClick.subscribe(e);i.onKeyDown.subscribe(j)}function k(){if(i){i.onClick.unsubscribe(e);i.onKeyDown.unsubscribe(j)}}function e(p,n){var o=this.getDataItem(n.row);if(o&&o instanceof Slick.Group&&b(p.target).hasClass(m.toggleCssClass)){if(o.collapsed){this.getData().expandGroup(o.groupingKey)}else{this.getData().collapseGroup(o.groupingKey)}p.stopImmediatePropagation();p.preventDefault()}}function j(q,o){if(m.enableExpandCollapse&&(q.which==b.ui.keyCode.SPACE)){var n=this.getActiveCell();if(n){var p=this.getDataItem(n.row);if(p&&p instanceof Slick.Group){if(p.collapsed){this.getData().expandGroup(p.groupingKey)}else{this.getData().collapseGroup(p.groupingKey)}q.stopImmediatePropagation();q.preventDefault()}}}}function c(n){return{selectable:false,focusable:m.groupFocusable,cssClasses:m.groupCssClass,columns:{0:{colspan:"*",formatter:h,editor:null}}}}function g(n){return{selectable:false,focusable:m.totalsFocusable,cssClasses:m.totalsCssClass,formatter:d,editor:null}}return{init:l,destroy:k,getGroupRowMetadata:c,getTotalsRowMetadata:g}}})(jQuery);
/*mleibman-SlickGrid/plugins/slick.cellselectionmodel.js*/
(function(b){b.extend(true,window,{Slick:{CellSelectionModel:a}});function a(s){var m;var j;var h=[];var l=this;var f=new Slick.CellRangeSelector({selectionCss:{border:"2px solid black"}});var o;var g={selectActiveCell:true};function p(t){o=b.extend(true,{},g,s);m=t;j=m.getCanvasNode();m.onActiveCellChanged.subscribe(i);m.onKeyDown.subscribe(c);t.registerPlugin(f);f.onCellRangeSelected.subscribe(q);f.onBeforeCellRangeSelected.subscribe(r)}function n(){m.onActiveCellChanged.unsubscribe(i);m.onKeyDown.unsubscribe(c);f.onCellRangeSelected.unsubscribe(q);f.onBeforeCellRangeSelected.unsubscribe(r);m.unregisterPlugin(f)}function e(u){var t=[];for(var v=0;v<u.length;v++){var w=u[v];if(m.canCellBeSelected(w.fromRow,w.fromCell)&&m.canCellBeSelected(w.toRow,w.toCell)){t.push(w)}}return t}function d(t){h=e(t);l.onSelectedRangesChanged.notify(h)}function k(){return h}function r(u,t){if(m.getEditorLock().isActive()){u.stopPropagation();return false}}function q(u,t){d([t.range])}function i(u,t){if(o.selectActiveCell&&t.row!=null&&t.cell!=null){d([new Slick.Range(t.row,t.cell)])}}function c(z){var t,C;var v=m.getActiveCell();if(v&&z.shiftKey&&!z.ctrlKey&&!z.altKey&&(z.which==37||z.which==39||z.which==38||z.which==40)){t=k();if(!t.length){t.push(new Slick.Range(v.row,v.cell))}C=t.pop();if(!C.contains(v.row,v.cell)){C=new Slick.Range(v.row,v.cell)}var D=C.toRow-C.fromRow,x=C.toCell-C.fromCell,B=v.row==C.fromRow?1:-1,A=v.cell==C.fromCell?1:-1;if(z.which==37){x-=A}else{if(z.which==39){x+=A}else{if(z.which==38){D-=B}else{if(z.which==40){D+=B}}}}var u=new Slick.Range(v.row,v.cell,v.row+B*D,v.cell+A*x);if(e([u]).length){t.push(u);var w=B>0?u.toRow:u.fromRow;var y=A>0?u.toCell:u.fromCell;m.scrollRowIntoView(w);m.scrollCellIntoView(w,y)}else{t.push(C)}d(t);z.preventDefault();z.stopPropagation()}}b.extend(this,{getSelectedRanges:k,setSelectedRanges:d,init:p,destroy:n,onSelectedRangesChanged:new Slick.Event()})}})(jQuery);
/*mleibman-SlickGrid/plugins/slick.checkboxselectcolumn.js*/
(function(a){a.extend(true,window,{Slick:{CheckboxSelectColumn:b}});function b(r){var i;var h=this;var m=new Slick.EventHandler();var q={};var f={columnId:"_checkbox_selector",cssClass:null,toolTip:"Select/Deselect All",width:30};var o=a.extend(true,{},f,r);function p(s){i=s;m.subscribe(i.onSelectedRowsChanged,j).subscribe(i.onClick,g).subscribe(i.onHeaderClick,n).subscribe(i.onKeyDown,c)}function k(){m.unsubscribeAll()}function j(w,s){var v=i.getSelectedRows();var u={},x,t;for(t=0;t<v.length;t++){x=v[t];u[x]=true;if(u[x]!==q[x]){i.invalidateRow(x);delete q[x]}}for(t in q){i.invalidateRow(t)}q=u;i.render();if(v.length&&v.length==i.getDataLength()){i.updateColumnHeader(o.columnId,"<input type='checkbox' checked='checked'>",o.toolTip)}else{i.updateColumnHeader(o.columnId,"<input type='checkbox'>",o.toolTip)}}function c(t,s){if(t.which==32){if(i.getColumns()[s.cell].id===o.columnId){if(!i.getEditorLock().isActive()||i.getEditorLock().commitCurrentEdit()){l(s.row)}t.preventDefault();t.stopImmediatePropagation()}}}function g(t,s){if(i.getColumns()[s.cell].id===o.columnId&&a(t.target).is(":checkbox")){if(i.getEditorLock().isActive()&&!i.getEditorLock().commitCurrentEdit()){t.preventDefault();t.stopImmediatePropagation();return}l(s.row);t.stopPropagation();t.stopImmediatePropagation()}}function l(s){if(q[s]){i.setSelectedRows(a.grep(i.getSelectedRows(),function(t){return t!=s}))}else{i.setSelectedRows(i.getSelectedRows().concat(s))}}function n(v,s){if(s.column.id==o.columnId&&a(v.target).is(":checkbox")){if(i.getEditorLock().isActive()&&!i.getEditorLock().commitCurrentEdit()){v.preventDefault();v.stopImmediatePropagation();return}if(a(v.target).is(":checked")){var u=[];for(var t=0;t<i.getDataLength();t++){u.push(t)}i.setSelectedRows(u)}else{i.setSelectedRows([])}v.stopPropagation();v.stopImmediatePropagation()}}function d(){return{id:o.columnId,name:"<input type='checkbox'>",toolTip:o.toolTip,field:"sel",width:o.width,resizable:false,sortable:false,cssClass:o.cssClass,formatter:e}}function e(w,t,v,u,s){if(s){return q[w]?"<input type='checkbox' checked='checked'>":"<input type='checkbox'>"}return null}a.extend(this,{init:p,destroy:k,getColumnDefinition:d})}})(jQuery);
/*mleibman-SlickGrid/plugins/slick.rowselectionmodel.js*/
(function(b){b.extend(true,window,{Slick:{RowSelectionModel:a}});function a(f){var r;var o=[];var i=this;var n=new Slick.EventHandler();var m;var q;var s={selectActiveRow:true};function t(x){q=b.extend(true,{},s,f);r=x;n.subscribe(r.onActiveCellChanged,e(v));n.subscribe(r.onKeyDown,e(l));n.subscribe(r.onClick,e(k))}function w(){n.unsubscribeAll()}function e(x){return function(){if(!m){m=true;x.apply(this,arguments);m=false}}}function g(x){var A=[];for(var z=0;z<x.length;z++){for(var y=x[z].fromRow;y<=x[z].toRow;y++){A.push(y)}}return A}function h(A){var y=[];var x=r.getColumns().length-1;for(var z=0;z<A.length;z++){y.push(new Slick.Range(A[z],0,A[z],x))}return y}function u(A,z){var x,y=[];for(x=A;x<=z;x++){y.push(x)}for(x=z;x<A;x++){y.push(x)}return y}function d(){return g(o)}function j(x){c(h(x))}function c(x){o=x;i.onSelectedRangesChanged.notify(o)}function p(){return o}function v(y,x){if(q.selectActiveRow&&x.row!=null){c([new Slick.Range(x.row,0,x.row,r.getColumns().length-1)])}}function l(C){var y=r.getActiveCell();if(y&&C.shiftKey&&!C.ctrlKey&&!C.altKey&&!C.metaKey&&(C.which==38||C.which==40)){var B=d();B.sort(function(D,E){return D-E});if(!B.length){B=[y.row]}var A=B[0];var x=B[B.length-1];var z;if(C.which==40){z=y.row<x||A==x?++x:++A}else{z=y.row<x?--x:--A}if(z>=0&&z<r.getDataLength()){r.scrollRowIntoView(z);o=h(u(A,x));c(o)}C.preventDefault();C.stopPropagation()}}function k(C){var y=r.getCellFromEvent(C);if(!y||!r.canCellBeActive(y.row,y.cell)){return false}var A=g(o);var x=b.inArray(y.row,A);if(!C.ctrlKey&&!C.shiftKey&&!C.metaKey){return false}else{if(r.getOptions().multiSelect){if(x===-1&&(C.ctrlKey||C.metaKey)){A.push(y.row);r.setActiveCell(y.row,y.cell)}else{if(x!==-1&&(C.ctrlKey||C.metaKey)){A=b.grep(A,function(G,F){return(G!==y.row)});r.setActiveCell(y.row,y.cell)}else{if(A.length&&C.shiftKey){var B=A.pop();var E=Math.min(y.row,B);var D=Math.max(y.row,B);A=[];for(var z=E;z<=D;z++){if(z!==B){A.push(z)}}A.push(B);r.setActiveCell(y.row,y.cell)}}}}}o=h(A);c(o);C.stopImmediatePropagation();return true}b.extend(this,{getSelectedRows:d,setSelectedRows:j,getSelectedRanges:p,setSelectedRanges:c,init:t,destroy:w,onSelectedRangesChanged:new Slick.Event()})}})(jQuery);
/*mleibman-SlickGrid/plugins/slick.rowmovemanager.js*/
(function(a){a.extend(true,window,{Slick:{RowMoveManager:b}});function b(o){var h;var f;var n;var g=this;var l=new Slick.EventHandler();var d={cancelEditOnDrag:false};function m(p){o=a.extend(true,{},d,o);h=p;f=h.getCanvasNode();l.subscribe(h.onDragInit,j).subscribe(h.onDragStart,e).subscribe(h.onDrag,c).subscribe(h.onDragEnd,i)}function k(){l.unsubscribeAll()}function j(q,p){q.stopImmediatePropagation()}function e(t,q){var p=h.getCellFromEvent(t);if(o.cancelEditOnDrag&&h.getEditorLock().isActive()){h.getEditorLock().cancelCurrentEdit()}if(h.getEditorLock().isActive()||!/move|selectAndMove/.test(h.getColumns()[p.cell].behavior)){return false}n=true;t.stopImmediatePropagation();var s=h.getSelectedRows();if(s.length==0||a.inArray(p.row,s)==-1){s=[p.row];h.setSelectedRows(s)}var r=h.getOptions().rowHeight;q.selectedRows=s;q.selectionProxy=a("<div class='slick-reorder-proxy'/>").css("position","absolute").css("zIndex","99999").css("width",a(f).innerWidth()).css("height",r*s.length).appendTo(f);q.guide=a("<div class='slick-reorder-guide'/>").css("position","absolute").css("zIndex","99998").css("width",a(f).innerWidth()).css("top",-1000).appendTo(f);q.insertBefore=-1}function c(t,p){if(!n){return}t.stopImmediatePropagation();var s=t.pageY-a(f).offset().top;p.selectionProxy.css("top",s-5);var q=Math.max(0,Math.min(Math.round(s/h.getOptions().rowHeight),h.getDataLength()));if(q!==p.insertBefore){var r={rows:p.selectedRows,insertBefore:q};if(g.onBeforeMoveRows.notify(r)===false){p.guide.css("top",-1000);p.canMove=false}else{p.guide.css("top",q*h.getOptions().rowHeight);p.canMove=true}p.insertBefore=q}}function i(r,p){if(!n){return}n=false;r.stopImmediatePropagation();p.guide.remove();p.selectionProxy.remove();if(p.canMove){var q={rows:p.selectedRows,insertBefore:p.insertBefore};g.onMoveRows.notify(q)}}a.extend(this,{onBeforeMoveRows:new Slick.Event(),onMoveRows:new Slick.Event(),init:m,destroy:k})}})(jQuery);
/*mleibman-SlickGrid/plugins/slick.cellrangeselector.js*/
(function(b){b.extend(true,window,{Slick:{CellRangeSelector:a}});function a(p){var i;var g;var o;var d;var h=this;var m=new Slick.EventHandler();var e={selectionCss:{border:"2px dashed blue"}};function n(q){p=b.extend(true,{},e,p);d=new Slick.CellRangeDecorator(q,p);i=q;g=i.getCanvasNode();m.subscribe(i.onDragInit,k).subscribe(i.onDragStart,f).subscribe(i.onDrag,c).subscribe(i.onDragEnd,j)}function l(){m.unsubscribeAll()}function k(r,q){r.stopImmediatePropagation()}function f(s,r){var q=i.getCellFromEvent(s);if(h.onBeforeCellRangeSelected.notify(q)!==false){if(i.canCellBeSelected(q.row,q.cell)){o=true;s.stopImmediatePropagation()}}if(!o){return}i.focus();var t=i.getCellFromPoint(r.startX-b(g).offset().left,r.startY-b(g).offset().top);r.range={start:t,end:{}};return d.show(new Slick.Range(t.row,t.cell))}function c(s,q){if(!o){return}s.stopImmediatePropagation();var r=i.getCellFromPoint(s.pageX-b(g).offset().left,s.pageY-b(g).offset().top);if(!i.canCellBeSelected(r.row,r.cell)){return}q.range.end=r;d.show(new Slick.Range(q.range.start.row,q.range.start.cell,r.row,r.cell))}function j(r,q){if(!o){return}o=false;r.stopImmediatePropagation();d.hide();h.onCellRangeSelected.notify({range:new Slick.Range(q.range.start.row,q.range.start.cell,q.range.end.row,q.range.end.cell)})}b.extend(this,{init:n,destroy:l,onBeforeCellRangeSelected:new Slick.Event(),onCellRangeSelected:new Slick.Event()})}})(jQuery);
/*mleibman-SlickGrid/controls/slick.pager.js*/
(function(b){function a(k,c,l){var n;function m(){k.onPagingInfoChanged.subscribe(function(q,p){e(p)});g();e(k.getPagingInfo())}function f(){var r=!Slick.GlobalEditorLock.commitCurrentEdit();var p=k.getPagingInfo();var q=p.totalPages-1;return{canGotoFirst:!r&&p.pageSize!=0&&p.pageNum>0,canGotoLast:!r&&p.pageSize!=0&&p.pageNum!=q,canGotoPrev:!r&&p.pageSize!=0&&p.pageNum>0,canGotoNext:!r&&p.pageSize!=0&&p.pageNum<q,pagingInfo:p}}function d(p){k.setRefreshHints({isFilterUnchanged:true});k.setPagingOptions({pageSize:p})}function j(){if(f().canGotoFirst){k.setPagingOptions({pageNum:0})}}function o(){var p=f();if(p.canGotoLast){k.setPagingOptions({pageNum:p.pagingInfo.totalPages-1})}}function h(){var p=f();if(p.canGotoPrev){k.setPagingOptions({pageNum:p.pagingInfo.pageNum-1})}}function i(){var p=f();if(p.canGotoNext){k.setPagingOptions({pageNum:p.pagingInfo.pageNum+1})}}function g(){l.empty();var p=b("<span class='slick-pager-nav' />").appendTo(l);var q=b("<span class='slick-pager-settings' />").appendTo(l);n=b("<span class='slick-pager-status' />").appendTo(l);q.append("<span class='slick-pager-settings-expanded' style='display:none'>Show: <a data=0>All</a><a data='-1'>Auto</a><a data=25>25</a><a data=50>50</a><a data=100>100</a></span>");q.find("a[data]").click(function(v){var u=b(v.target).attr("data");if(u!=undefined){if(u==-1){var t=c.getViewport();d(t.bottom-t.top)}else{d(parseInt(u))}}});var r="<span class='ui-state-default ui-corner-all ui-icon-container'><span class='ui-icon ";var s="' /></span>";b(r+"ui-icon-lightbulb"+s).click(function(){b(".slick-pager-settings-expanded").toggle()}).appendTo(q);b(r+"ui-icon-seek-first"+s).click(j).appendTo(p);b(r+"ui-icon-seek-prev"+s).click(h).appendTo(p);b(r+"ui-icon-seek-next"+s).click(i).appendTo(p);b(r+"ui-icon-seek-end"+s).click(o).appendTo(p);l.find(".ui-icon-container").hover(function(){b(this).toggleClass("ui-state-hover")});l.children().wrapAll("<div class='slick-pager' />")}function e(p){var q=f();l.find(".slick-pager-nav span").removeClass("ui-state-disabled");if(!q.canGotoFirst){l.find(".ui-icon-seek-first").addClass("ui-state-disabled")}if(!q.canGotoLast){l.find(".ui-icon-seek-end").addClass("ui-state-disabled")}if(!q.canGotoNext){l.find(".ui-icon-seek-next").addClass("ui-state-disabled")}if(!q.canGotoPrev){l.find(".ui-icon-seek-prev").addClass("ui-state-disabled")}if(p.pageSize==0){n.text("Showing all "+p.totalRows+" rows")}else{n.text("Showing page "+(p.pageNum+1)+" of "+p.totalPages)}}m()}b.extend(true,window,{Slick:{Controls:{Pager:a}}})})(jQuery);
/*php.js*/
function is_numeric(a){return(typeof a==="number"||typeof a==="string")&&a!==""&&!isNaN(a)}function sprintf(){var g=/%%|%(\d+\$)?([-+\'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g;var h=arguments,f=0,k=h[f++];var b=function(n,a,i,m){if(!i){i=" "}var l=(n.length>=a)?"":Array(1+a-n.length>>>0).join(i);return m?n+l:l+n};var c=function(m,l,p,a,i,o){var n=a-m.length;if(n>0){if(p||!i){m=b(m,a,o,p)}else{m=m.slice(0,l.length)+b("",n,"0",true)+m.slice(l.length)}}return m};var j=function(p,o,n,q,i,a,m){var l=p>>>0;n=n&&l&&{"2":"0b","8":"0","16":"0x"}[o]||"";p=n+b(l.toString(o),a||0,"0",false);return c(p,n,q,i,m)};var e=function(m,o,i,a,l,n){if(a!=null){m=m.slice(0,a)}return c(m,"",o,i,l,n)};var d=function(z,m,n,r,B,w,l){var a;var v;var i;var A;var t;if(z==="%%"){return"%"}var s=false,o="",q=false,y=false,x=" ";var p=n.length;for(var u=0;n&&u<p;u++){switch(n.charAt(u)){case" ":o=" ";break;case"+":o="+";break;case"-":s=true;break;case"'":x=n.charAt(u+1);break;case"0":q=true;break;case"#":y=true;break}}if(!r){r=0}else{if(r==="*"){r=+h[f++]}else{if(r.charAt(0)=="*"){r=+h[r.slice(1,-1)]}else{r=+r}}}if(r<0){r=-r;s=true}if(!isFinite(r)){throw new Error("sprintf: (minimum-)width must be finite")}if(!w){w="fFeE".indexOf(l)>-1?6:(l==="d")?0:undefined}else{if(w==="*"){w=+h[f++]}else{if(w.charAt(0)=="*"){w=+h[w.slice(1,-1)]}else{w=+w}}}t=m?h[m.slice(0,-1)]:h[f++];switch(l){case"s":return e(String(t),s,r,w,q,x);case"c":return e(String.fromCharCode(+t),s,r,w,q);case"b":return j(t,2,y,s,r,w,q);case"o":return j(t,8,y,s,r,w,q);case"x":return j(t,16,y,s,r,w,q);case"X":return j(t,16,y,s,r,w,q).toUpperCase();case"u":return j(t,10,y,s,r,w,q);case"i":case"d":a=+t||0;a=Math.round(a-a%1);v=a<0?"-":o;t=v+b(String(Math.abs(a)),w,"0",false);return c(t,v,s,r,q);case"e":case"E":case"f":case"F":case"g":case"G":a=+t;v=a<0?"-":o;i=["toExponential","toFixed","toPrecision"]["efg".indexOf(l.toLowerCase())];A=["toString","toUpperCase"]["eEfFgG".indexOf(l)%2];t=v+Math.abs(a)[i](w);return c(t,v,s,r,q)[A]();default:return z}};return k.replace(g,d)}function count(c,d){var b,a=0;if(c===null||typeof c==="undefined"){return 0}else{if(c.constructor!==Array&&c.constructor!==Object){return 1}}if(d==="COUNT_RECURSIVE"){d=1}if(d!=1){d=0}for(b in c){if(c.hasOwnProperty(b)){a++;if(d==1&&c[b]&&(c[b].constructor===Array||c[b].constructor===Object)){a+=this.count(c[b],1)}}}return a}function in_array(e,d,c){var b="",a=!!c;if(a){for(b in d){if(d[b]===e){return true}}}else{for(b in d){if(d[b]==e){return true}}}return false}function bcround(f,b){var e=this._phpjs_shared_bc();var c,a,g;var d;c=e.bc_init_num();c=e.php_str2num(f.toString());if(b>=c.n_scale){while(c.n_scale<b){c.n_value[c.n_len+c.n_scale]=0;c.n_scale++}return c.toString()}g=c.n_value[c.n_len+b];d=e.bc_init_num();d=e.bc_new_num(1,b);if(g>=5){d.n_value[d.n_len+d.n_scale-1]=1;if(c.n_sign==e.MINUS){d.n_sign=e.MINUS}a=e.bc_add(c,d,b)}else{a=c}if(a.n_scale>b){a.n_scale=b}return a.toString()}function bcadd(b,d,g){var e=this._phpjs_shared_bc();var f,c,a;if(typeof g==="undefined"){g=e.scale}g=((g<0)?0:g);f=e.bc_init_num();c=e.bc_init_num();a=e.bc_init_num();f=e.php_str2num(b.toString());c=e.php_str2num(d.toString());a=e.bc_add(f,c,g);if(a.n_scale>g){a.n_scale=g}return a.toString()}function bcmul(b,d,g){var e=this._phpjs_shared_bc();var f,c,a;if(typeof g==="undefined"){g=e.scale}g=((g<0)?0:g);f=e.bc_init_num();c=e.bc_init_num();a=e.bc_init_num();f=e.php_str2num(b.toString());c=e.php_str2num(d.toString());a=e.bc_multiply(f,c,g);if(a.n_scale>g){a.n_scale=g}return a.toString()}function bcsub(b,d,g){var e=this._phpjs_shared_bc();var f,c,a;if(typeof g==="undefined"){g=e.scale}g=((g<0)?0:g);f=e.bc_init_num();c=e.bc_init_num();a=e.bc_init_num();f=e.php_str2num(b.toString());c=e.php_str2num(d.toString());a=e.bc_sub(f,c,g);if(a.n_scale>g){a.n_scale=g}return a.toString()}function bccomp(a,c,f){var d=this._phpjs_shared_bc();var e,b;if(typeof f==="undefined"){f=d.scale}f=((f<0)?0:f);e=d.bc_init_num();b=d.bc_init_num();e=d.bc_str2num(a.toString(),f);b=d.bc_str2num(c.toString(),f);return d.bc_compare(e,b,f)}function bcdiv(b,d,g){var e=this._phpjs_shared_bc();var f,c,a;if(typeof g==="undefined"){g=e.scale}g=((g<0)?0:g);f=e.bc_init_num();c=e.bc_init_num();a=e.bc_init_num();f=e.php_str2num(b.toString());c=e.php_str2num(d.toString());a=e.bc_divide(f,c,g);if(a===-1){throw new Error(11,"(BC) Division by zero")}if(a.n_scale>g){a.n_scale=g}return a.toString()};
/*bazu.slick.grid.js*/
if(typeof Slick==="undefined"){throw"slick.core.js not loaded"}if(typeof Slick.Grid=="undefined"){throw"slick.grid.js not loaded"}(function($){var BazuCellFormatterFactory={getFormatter:function(column){if(typeof column.formatterType!="undefined"&&typeof BazuCellFormatters[column.formatterType]!="undefined"){return BazuCellFormatters[column.formatterType]}return function(row,cell,value,columnDef,dataContext){return value}}};var BazuCellEditorFactory={getEditor:function(column){if(typeof column.editorType!="undefined"&&typeof BazuCellEditors[column.editorType]=="function"){return BazuCellEditors[column.editorType]}return null}};var bracketTypeItems={"":"",OPEN:gt.gettext("Overall"),SEX:gt.gettext("Gender"),AGE:gt.gettext("Age Group"),OTHER:gt.gettext("Custom")};var disabledBracketTypeItems={OPEN:1};var rankTypeItems={"":"",GUN:gt.gettext("Gun Time"),CHIP:gt.gettext("Chip Time")};var disabledRankTypeItems={};var sexItems={"NOT SPECIFIED":gt.gettext("Not Specified"),F:gt.gettext("Female"),M:gt.gettext("Male")};var disabledSexItems={};var entryStatusItems={CONF:gt.gettext("Confirmed"),WITHDRAWN:gt.gettext("Withdrawn"),DQ:gt.gettext("Disqualified"),DNF:gt.gettext("Did Not Finished")};var disabledEntryStatusItems={};var entryTypeItems={"":"",IND:gt.gettext("Standard"),MEMBER:gt.gettext("Team Member"),TEAM:gt.gettext("Team")};var disabledEntryTypeItems={};var raceTypeItems={"":"",running:gt.gettext("Running"),biking:gt.gettext("Biking"),swimming:gt.gettext("Swimming"),triathlon:gt.gettext("Triathlon"),duathlon:gt.gettext("Duathlon"),other:gt.gettext("Other")};var disabledRaceTypeItems={};var raceItems={};var disabledRaceItems={};if(typeof(allRaces)!="undefined"){raceItems=allRaces}var primaryBracketItems={};if(typeof(allBrackets)!="undefined"){primaryBracketItems=allBrackets}var wavesItems={};if(typeof(allWaves)!="undefined"){wavesItems=allWaves}function _createSelectCellFormatter(items){return function(row,cell,value,columnDef,dataContext){var result=items[value];return(typeof result=="undefined")?value:result}}function _createSelectCellEditor(items,klass,disableItems,isRequired){return function(args){var $select,defaultValue,scope=this;this.init=function(){var h='<select tabIndex="0" class="'+klass+' span12">';for(var val in items){var dis=(disableItems&&disableItems[val])?' disabled="disabled"':"";h+='<option value="'+val+'"'+dis+">"+items[val]+"</option>"}h+="</select>";$select=$(h).appendTo(args.container).bind("change",scope.handleChange).bind("keyup",scope.handleChange).focus()};this.destroy=function(){$select.remove()};this.focus=function(){$select.focus()};this.handleChange=function(){args.commitChanges()};this.loadValue=function(item){$select.val((defaultValue=item[args.column.field]));$select.select()};this.serializeValue=function(){return $select.val()};this.applyValue=function(item,state){if(disableItems.hasOwnProperty(state)){item[args.column.field]=""}else{item[args.column.field]=state;if(typeof(item.wave)!="undefined"){item.wave=null}}};this.isValueChanged=function(){return(!($select.val()==""&&defaultValue==null)&&($select.val()!=defaultValue))};this.validate=function(){if(isRequired&&$select.val()==""){return{valid:false,msg:gt.gettext("This field is required.")}}else{return{valid:true,msg:null}}};this.init()}}var BazuCellEditors={BracketTypeCellEditor:_createSelectCellEditor(bracketTypeItems,"bracket-type",disabledBracketTypeItems,true),SexCellEditor:_createSelectCellEditor(sexItems,"sex",disabledSexItems),EntryStatusCellEditor:_createSelectCellEditor(entryStatusItems,"entry-status",disabledEntryStatusItems),EntryTypeCellEditor:_createSelectCellEditor(entryTypeItems,"entry-status",disabledEntryTypeItems),RankTypeCellEditor:_createSelectCellEditor(rankTypeItems,"rank-type",disabledRankTypeItems),RaceTypeCellEditor:_createSelectCellEditor(raceTypeItems,"race-type",disabledRaceTypeItems),RaceCellEditor:_createSelectCellEditor(raceItems,"race-list",disabledRaceItems),BracketNameCellEditor:function(args){var $input;var defaultValue;var scope=this;this.init=function(){$input=$('<input type="text" class="editor-text"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).focus()};this.focus=function(){$input.focus().select()};this.handleKeyDown=function(e){if(e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT){e.stopImmediatePropagation()}};this.destroy=function(){$(args.container).empty()};this.applyValue=function(item,state){item.name=state;if(item.type==="OTHER"){return}var name=state.toLowerCase();if(/(^|\b)(m|males?|m[ea]n'?s?)(\b|\d|$)/.test(name)){item.sex="M";item.type="SEX"}else{if(/(^|\b)(f|females?|wom[ea]n'?s?)(\b|\d|$)/.test(name)){item.sex="F";item.type="SEX"}}if(/(^|\b)master'?s?/.test(name)){item.type="AGE";item.min_age=40;item.max_age=120}var min_age;var max_age;if(/(\d+)\D+(\d+)/.test(name)){item.type="AGE";min_age=parseInt(RegExp.$1,10);max_age=parseInt(RegExp.$2,10);if(min_age<1){min_age=1}if(min_age>120){min_age=120}if(max_age<1){max_age=1}if(max_age>120){max_age=120}if(min_age>max_age){var x=max_age;max_age=min_age;min_age=x}item.min_age=min_age;item.max_age=max_age}else{if(/(over|above|older\s*than)\s*(\d+)/.test(name)){item.type="AGE";min_age=parseInt(RegExp.$2,10)+1;if(min_age<1){min_age=1}if(min_age>120){min_age=120}item.min_age=min_age;item.max_age=120}else{if(/(\d+)\s*([-+]|and\s*(over|older))/.test(name)){item.type="AGE";min_age=parseInt(RegExp.$1,10);if(min_age<1){min_age=1}if(min_age>120){min_age=120}item.min_age=min_age;item.max_age=120}else{if(/(-|under|below|younger\s*than)\s*(\d+)/.test(name)){item.type="AGE";max_age=parseInt(RegExp.$2,10)-1;if(max_age<1){max_age=1}if(max_age>120){max_age=120}item.max_age=max_age;item.min_age=1}else{if(/(\d+)\s*(and\s*(under|younger))/.test(name)){item.type="AGE";max_age=parseInt(RegExp.$1,10);if(max_age<1){max_age=1}if(max_age>120){max_age=120}item.max_age=max_age;item.min_age=1}}}}}return};this.loadValue=function(item){defaultValue=item.name||"";$input.val(item.name).select()};this.isValueChanged=function(){return(!($input.val()==""&&defaultValue==null))&&($input.val()!=defaultValue)};this.serializeValue=function(){return $input.val()};this.validate=function(){var input=$.trim($input.val());if(input.length==0){return{valid:false,msg:gt.gettext("Bracket name is required")}}return{valid:true,msg:null}};this.init()},EntryBibCellEditor:function(args){var $input;var defaultValue;var scope=this;this.init=function(){$input=$('<input type="text" class="editor-text"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).focus()};this.focus=function(){$input.focus().select()};this.handleKeyDown=function(e){if(e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT){e.stopImmediatePropagation()}if(e.keyCode==32){return false}};this.destroy=function(){$(args.container).empty()};this.applyValue=function(item,state){state=state.replace(/ /g,"");item.bib=state};this.loadValue=function(item){defaultValue=item.bib||"";$input.val(item.bib).select()};this.isValueChanged=function(){return(!($input.val()==""&&defaultValue==null))&&($input.val()!=defaultValue)};this.serializeValue=function(){return $input.val()};this.validate=function(){var input=$.trim($input.val());if(input.length==0){return{valid:false,msg:gt.gettext("Bib is required")}}else{return{valid:true,msg:""}}};this.init()},WaveNameCellEditor:function(args){var $input;var defaultValue;var scope=this;this.init=function(){$input=$('<input type="text" class="editor-text"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).focus()};this.focus=function(){$input.focus().select()};this.handleKeyDown=function(e){if(e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT){e.stopImmediatePropagation()}};this.destroy=function(){$(args.container).empty()};this.applyValue=function(item,state){item.name=state};this.loadValue=function(item){defaultValue=item.name||"Wave ";$input.val(item.name).select()};this.isValueChanged=function(){return(!($input.val()==""&&defaultValue==null))&&($input.val()!=defaultValue)};this.serializeValue=function(){return $input.val()};this.validate=function(){var input=$.trim($input.val());if(input.length==0){return{valid:false,msg:gt.gettext("Wave name is required")}}else{return{valid:true,msg:""}}};this.init()},WaveMaxEntriesCellEditor:function(args){var $input;var defaultValue;var scope=this;var allItem;this.init=function(){$input=$('<input type="text" class="editor-text"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).focus()};this.focus=function(){$input.focus().select()};this.handleKeyDown=function(e){if(e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT){e.stopImmediatePropagation()}};this.destroy=function(){$(args.container).empty()};this.applyValue=function(item,state){item.max_entries=state};this.loadValue=function(item){allItem=item;defaultValue=item.max_entries;if(typeof(defaultValue)!=="undefined"&&defaultValue.trim()=="&infin;"){defaultValue=""}$input.val(defaultValue).select()};this.isValueChanged=function(){return(!($input.val()==""&&defaultValue==null))&&($input.val()!=defaultValue)};this.serializeValue=function(){return $input.val()};this.validate=function(item){var input=$.trim($input.val());if(($.isNumeric(input)&&parseInt(allItem.athletes)<=input)||input==""){return{valid:true,msg:""}}else{if(parseInt(allItem.athletes)>input){$input.val(allItem.athletes);return{valid:true,msg:""}}else{return{valid:false,msg:""}}}};this.init()},EntryChipCellEditor:function(args){var $input;var defaultValue;var scope=this;this.init=function(){$input=$('<input type="text" class="editor-text"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).focus()};this.focus=function(){$input.focus().select()};this.handleKeyDown=function(e){if(e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT){e.stopImmediatePropagation()}};this.destroy=function(){$(args.container).empty()};this.applyValue=function(item,state){item.chip=state};this.loadValue=function(item){defaultValue=item.chip||"";$input.val(item.chip).select()};this.isValueChanged=function(){return(!($input.val()==""&&defaultValue==null))&&($input.val()!=defaultValue)};this.serializeValue=function(){return $input.val()};this.validate=function(){var input=$.trim($input.val());if(input.length==0){return{valid:false,msg:gt.gettext("Chip is required")}}else{return{valid:true,msg:""}}return{valid:true,msg:null}};this.init()},EntryAgeCellEditor:function(args){var $input;var defaultValue;var scope=this;this.init=function(){$input=$('<input type="text" class="editor-text"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).focus()};this.focus=function(){$input.focus().select()};this.handleKeyDown=function(e){if(e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT){e.stopImmediatePropagation()}};this.destroy=function(){$(args.container).empty()};this.applyValue=function(item,state){item.age=state};this.loadValue=function(item){defaultValue=item.age||"";$input.val(item.age).select()};this.isValueChanged=function(){return(!($input.val()==""&&defaultValue==null))&&($input.val()!=defaultValue)};this.serializeValue=function(){return $input.val()};this.validate=function(){var input=$.trim($input.val());input=parseInt(input,10);if(input<0||input>120||input.length==0){return{valid:false,msg:gt.gettext("Age must be between 0 and 120.")}}else{return{valid:true,msg:""}}};this.init()},EntryNameCellEditor:function(args){var $input;var defaultValue;var scope=this;this.init=function(){$input=$('<input type="text" class="editor-text"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).focus()};this.focus=function(){$input.focus().select()};this.handleKeyDown=function(e){if(e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT){e.stopImmediatePropagation()}};this.destroy=function(){$(args.container).empty()};this.applyValue=function(item,state){item.first_name=state};this.loadValue=function(item){defaultValue=item.first_name||"";$input.val(item.first_name).select()};this.isValueChanged=function(){return(!($input.val()==""&&defaultValue==null))&&($input.val()!=defaultValue)};this.serializeValue=function(){return $input.val()};this.validate=function(){var input=$.trim($input.val());if(input.length==0){return{valid:false,msg:gt.gettext("First name is required")}}else{return{valid:true,msg:""}}};this.init()},EntryLastNameCellEditor:function(args){var $input;var defaultValue;var scope=this;this.init=function(){$input=$('<input type="text" class="editor-text"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).focus()};this.focus=function(){$input.focus().select()};this.handleKeyDown=function(e){if(e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT){e.stopImmediatePropagation()}};this.destroy=function(){$(args.container).empty()};this.applyValue=function(item,state){item.last_name=state};this.loadValue=function(item){defaultValue=item.last_name||"";$input.val(item.last_name).select()};this.isValueChanged=function(){return(!($input.val()==""&&defaultValue==null))&&($input.val()!=defaultValue)};this.serializeValue=function(){return $input.val()};this.validate=function(){var input=$.trim($input.val());if(input.length==0){return{valid:false,msg:gt.gettext("Last name is required")}}else{return{valid:true,msg:""}}};this.init()},EntryPrimaryBracketCellEditor:function(args){var $select,defaultValue,scope=this;var item=args.item;var age=item.age;var sex=item.sex;var race_id=item.race;var items=primaryBracketItems[race_id];this.init=function(){var h='<select tabIndex="0" class="entry-primary-bracket">';h+='<option value="">'+gt.gettext("None")+"</option>";for(var val in items){var bracket=items[val];if(bracket.type=="SEX"){if(bracket.sex==sex){h+='<option value="'+val+'">'+bracket.name+"</option>"}}else{if(bracket.type=="AGE"){if(bracket.sex==sex||bracket.sex=="null"){if(age<=bracket.max_age&&age>=bracket.min_age){h+='<option value="'+val+'">'+bracket.name+"</option>"}}}else{h+='<option value="'+val+'">'+bracket.name+"</option>"}}}h+="</select>";$select=$(h).appendTo(args.container).bind("change",scope.handleChange).bind("keyup",scope.handleChange).focus()};this.destroy=function(){$select.remove()};this.focus=function(){$select.focus()};this.handleChange=function(){args.commitChanges()};this.loadValue=function(item){$select.val((defaultValue=item[args.column.field]));$select.select()};this.serializeValue=function(){return $select.val()};this.applyValue=function(item,state){item[args.column.field]=state};this.isValueChanged=function(){return(!($select.val()==""&&defaultValue==null)&&($select.val()!=defaultValue))};this.validate=function(){return{valid:true,msg:null}};this.init()},EntryWaveCellEditor:function(args){var $select,defaultValue,scope=this;var item=args.item;var race_id=item.race;var items=wavesItems[race_id];this.init=function(){var h='<select tabIndex="0" class="entry-primary-bracket">';h+='<option value="">'+gt.gettext("None")+"</option>";for(var val in items){h+='<option value="'+val+'">'+items[val]+"</option>"}h+="</select>";$select=$(h).appendTo(args.container).bind("change",scope.handleChange).bind("keyup",scope.handleChange).focus()};this.destroy=function(){$select.remove()};this.focus=function(){$select.focus()};this.handleChange=function(){args.commitChanges()};this.loadValue=function(item){$select.val((defaultValue=item[args.column.field]));$select.select()};this.serializeValue=function(){return $select.val()};this.applyValue=function(item,state){item[args.column.field]=state};this.isValueChanged=function(){return(!($select.val()==""&&defaultValue==null)&&($select.val()!=defaultValue))};this.validate=function(){return{valid:true,msg:null}};this.init()},AgeRangeCellEditor:function(args){var $min_age;var $max_age;var scope=this;var defaultValue={min_age:null,max_age:null};this.init=function(){$min_age=$('<input tabindex="0" type="text" class="min-age txs"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).bind("focus",function(){this.select()});$(args.container).append("&nbsp;to&nbsp;");$max_age=$('<input tabindex="0" type="text" class="max-age txs"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).bind("focus",function(){this.select()});scope.focus()};this.handleKeyDown=function(e){if((e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT)||($(e.target).hasClass("min-age")&&e.keyCode==$.ui.keyCode.TAB&&!e.shiftKey)||($(e.target).hasClass("max-age")&&e.keyCode==$.ui.keyCode.TAB&&e.shiftKey)){e.stopImmediatePropagation()}};this.destroy=function(){$(args.container).empty()};this.focus=function(){$min_age.focus()};this.serializeValue=function(){return{min_age:parseInt($min_age.val(),10),max_age:parseInt($max_age.val(),10)}};this.applyValue=function(item,state){item.min_age=state.min_age;item.max_age=state.max_age};this.loadValue=function(item){defaultValue={min_age:item.min_age,max_age:item.max_age};$min_age.val(item.min_age);$max_age.val(item.max_age)};this.isValueChanged=function(){return((!($min_age.val()==""&&defaultValue.min_age==null))&&($min_age.val()!=defaultValue.min_age)||(!($max_age.val()==""&&defaultValue.max_age==null))&&($max_age.val()!=defaultValue.max_age))};this.validate=function(){var min_age=parseInt($min_age.val(),10);var max_age=parseInt($max_age.val(),10);if(isNaN(min_age)||isNaN(max_age)){return{valid:false,msg:gt.gettext("Please type in valid numbers.")}}if(min_age>=max_age){return{valid:false,msg:gt.gettext("'min_age' should be less than 'max_age'")}}if(min_age<1||min_age>120||max_age<1||max_age>120){return{valid:false,msg:gt.gettext("Please enter numbers between 1 and 120")}}return{valid:true,msg:null}};this.init()},DateCellEditor:function(args){var $planned_date;var scope=this;var defaultValue={planned_start_date:null};this.init=function(){$planned_date=$('<input tabindex="0" type="text" value="--/--/----" class="planned-start editor-text"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).bind("blur",scope.blur).bind("focus",function(){this.select()});scope.focus()};this.handleKeyDown=function(e){if((e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT)){e.stopImmediatePropagation()}};this.destroy=function(){$(args.container).empty()};this.focus=function(){$planned_date.focus()};this.blur=function(){if($planned_date.val()=="--/--/----"){$planned_date.val("")}};this.serializeValue=function(){return{planned_start_date:$planned_date.val()}};this.applyValue=function(item,state){var dt=state.planned_start_date;var m=0,d=0,y=0;var na=dt.split(/\//);if(na.length>0&&$.isNumeric(na[0])){m=parseInt(na[0])}else{m=1}if(na.length>1&&$.isNumeric(na[1])){d=parseInt(na[1])}else{d=1}if(na.length>2&&$.isNumeric(na[2])){y=parseInt(na[2])}else{y=new Date().getFullYear()}var ft=((m<10)?"0":"")+m+"/"+((d<10)?"0":"")+d+"/"+y;item.planned_start_date=ft};this.loadValue=function(item){defaultValue={planned_start_date:item.planned_start_date};$planned_date.val(item.planned_start_date)};this.isValueChanged=function(){return((!($planned_date.val()==""&&defaultValue.planned_start_date==null))&&($planned_date.val()!=defaultValue.planned_start_date)&&($planned_date.val()!="--/--/----"))};this.validate=function(){if($planned_date.val()==""||$planned_date.val()=="--/--/----"){return{valid:false,msg:gt.gettext("Need to enter date.")}}else{return{valid:true,msg:null}}};this.init()},PlannedStartCellEditor:function(args){var $planned_start;var scope=this;var defaultValue={planned_start_time:null};this.init=function(){$planned_start=$('<input tabindex="0" type="text" value="--:--:--" class="planned-start editor-text"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).bind("blur",scope.blur).bind("focus",function(){this.select()});scope.focus()};this.handleKeyDown=function(e){if((e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT)){e.stopImmediatePropagation()}};this.destroy=function(){$(args.container).empty()};this.focus=function(){$planned_start.focus()};this.blur=function(){if($planned_start.val()=="--:--:--"){$planned_start.val("")}};this.serializeValue=function(){return{planned_start_time:$planned_start.val()}};this.applyValue=function(item,state){var t=state.planned_start_time;var h=0,m=0,s=0;var ap=/pm?\s*$/i.test(t)?"PM":"AM";var n=t.replace(/[^0-9:]/g,"").replace(/[:]+/g,":");var na=n.split(/:/);if(na.length>0){h=parseInt(na[0].replace(/^0/,""),10)%24;if(h>12&&account_time_format=="g:i a"){ap="PM";h-=12}if(h==0&&account_time_format=="g:i a"){ap="AM"}if(isNaN(h)){h="12"}}if(na.length>1){m=parseInt(na[1].replace(/^0/,""),10)%60}if(na.length>2){s=parseInt(na[2].replace(/^0/,""),10)%60}if(account_time_format=="H:i"){ap=""}var ft=((h<10)?"0":"")+h+":"+((m<10)?"0":"")+m+":"+((s<10)?"0":"")+s+" "+ap;item.planned_start_time=ft};this.loadValue=function(item){defaultValue={planned_start_time:item.planned_start_time};$planned_start.val(item.planned_start_time)};this.isValueChanged=function(){return((!($planned_start.val()==""&&defaultValue.planned_start_time==null))&&($planned_start.val()!=defaultValue.planned_start_time)&&($planned_start.val()!="--:--:--"))};this.validate=function(){if($planned_start.val()==""||$planned_start.val()=="--:--:--"){return{valid:false,msg:gt.gettext("Need to enter planned time start.")}}else{return{valid:true,msg:null}}};this.init()},ActualStartCellEditor:function(args){var $guntime,$actual_start,$date;var scope=this;var options=args.grid.getOptions();var defaultValue={guntime:"",actual_start_time:null};this.init=function(){if(options.guntime){var h='<select tabIndex="0" class="guntime" style="float: none;">';for(var i=0;i<options.guntime.length;i++){var val=options.guntime[i];var selected;if(val.time==args.item.actual_start_time){selected='selected="selected"'}else{selected=""}h+='<option value="'+val.time+'" '+selected+">"+val.time+"</option>"}h+="</select>";$guntime=$(h).appendTo(args.container).bind("change",function(){var selVal=$(this).val();if(selVal!="-No Available Gun Starts-"&&selVal!="-Available Gun Starts-"){$actual_start.val(selVal);scope.blur()}});$(args.container).append("&nbsp;&nbsp;")}$actual_start=$('<input tabindex="0" type="text" value="--:--:--.---" class="actual-start-time txs2" style="float: none;"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).bind("blur",scope.blur).bind("focus",function(){this.select()});scope.focus()};this.handleKeyDown=function(e){if((e.keyCode==$.ui.keyCode.LEFT||e.keyCode==$.ui.keyCode.RIGHT)){e.stopImmediatePropagation()}};this.destroy=function(){$(args.container).empty()};this.focus=function(){$actual_start.focus()};this.blur=function(){if($actual_start.val()=="--:--:--.---"){$actual_start.val("")}};this.serializeValue=function(){return{actual_start_time:$actual_start.val()}};this.applyValue=function(item,state){var t=state.actual_start_time;if(t==""){item.actual_start_time=t;return}var h=0,m=0,s=0,ms=0;var ap=/pm?\s*$/i.test(t)?"PM":"AM";var n=t.replace(/[^0-9:\.]/g,"").replace(/[:\.]+/g,":");var na=n.split(/:/);if(na.length>0){h=parseInt(na[0].replace(/^0/,""),10)%24;if(h>12&&account_time_format=="g:i a"){ap="PM";h-=12}if(h==0&&account_time_format=="g:i a"){ap="AM"}if(isNaN(h)){h="12"}}if(na.length>1){m=parseInt(na[1].replace(/^0/,""),10)%60}if(na.length>2){s=parseInt(na[2].replace(/^0/,""),10)%60}if(account_time_format=="H:i"){ap=""}if(na.length>3){ms=na[3];if(ms.length==1){ms=parseInt(ms,10)*100}else{if(ms.length==2){ms=parseInt(ms.replace(/^0/,""),10)*10}else{ms=parseInt(ms.replace(/^0{1,2}/,""),10)}}}var ft=((h<10)?"0":"")+h+":"+((m<10)?"0":"")+m+":"+((s<10)?"0":"")+s+"."+((ms<10)?"00":((ms<100)?"0":""))+ms+" "+ap;item.actual_start_time=ft};this.loadValue=function(item){defaultValue={actual_start_time:item.actual_start_time,guntime:""};$actual_start.val(item.actual_start_time)};this.isValueChanged=function(){var changed=($actual_start.val()!=defaultValue.actual_start_time)&&$actual_start.val()!="--:--:--.---";return changed};this.validate=function(){return{valid:true,msg:null}};this.init()},DateTimeCellEditor:function(args){var $dateInput;var $timeInput;var defaultValue;var scope=this;this.init=function(){$dateInput=$('<input type="text" class="form-text-date"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).bind("focus",function(){this.select()});$dateInput.datepicker();$("<span>&nbsp;</span>").appendTo(args.container);$timeInput=$('<input type="text" class="form-text-time"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).bind("focus",function(){this.select()}).timepicker({timeFormat:"h:mm p",interval:15});scope.focus()};this.destroy=function(){$.datepicker.dpDiv.stop(true,true);$dateInput.datepicker("hide");$dateInput.datepicker("destroy");$dateInput.remove();$timeInput.timepicker("hide");$timeInput.timepicker("destroy");$timeInput.remove();$(args.container).empty()};this.handleKeyDown=function(e){var inDP=$(e.target).hasClass("form-text-date");var inTP=$(e.target).hasClass("form-text-time");var leftArrow=e.keyCode==$.ui.keyCode.LEFT;var rightArrow=e.keyCode==$.ui.keyCode.RIGHT;var downArrow=e.keyCode==$.ui.keyCode.DOWN;var upArrow=e.keyCode==$.ui.keyCode.UP;var tabKey=e.keyCode==$.ui.keyCode.TAB;var shift=e.shiftKey;if(leftArrow||rightArrow||downArrow||upArrow||(inDP&&tabKey&&!shift)||(inTP&&tabKey&&shift)){e.stopImmediatePropagation();if(inDP&&tabKey){$dateInput.datepicker("hide")}if(inTP&&tabKey){$timeInput.timepicker("hide")}}};this.focus=function(){$dateInput.focus()};this.loadValue=function(item){defaultValue=item[args.column.field];var dt=defaultValue?defaultValue.split(" ",2):["",""];$dateInput.val(dt[0]);$timeInput.val(dt[1]);$dateInput.select()};this.serializeValue=function(){var d=$dateInput.val();var t=$timeInput.val();if(d!=""&&t!=""){return d+" "+t}else{return""}};this.applyValue=function(item,state){item[args.column.field]=state};this.isValueChanged=function(){var val=this.serializeValue();return(!(val==""&&defaultValue==null))&&(val!=defaultValue)};this.validate=function(){return{valid:true,msg:null}};this.init()},DistanceWithUnitsCellEditor:function(args){var $distInput;var $unitsInput;var defaultValue;var scope=this;this.init=function(){$distInput=$('<input type="text" class="form-text txs" style="width:50px"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).bind("focus",function(){this.select()});$unitsInput=$('<select class="units-menu"><option>km</option><option>mi</option><option>m</option><option>yd</option><option>ft</option></select>').appendTo(args.container).bind("keydown",scope.handleKeyDown);scope.focus()};this.destroy=function(){$distInput.remove();$unitsInput.remove()};this.handleKeyDown=function(e){var inTX=$(e.target).hasClass("form-text");var inUM=$(e.target).hasClass("units-menu");var leftArrow=e.keyCode==$.ui.keyCode.LEFT;var rightArrow=e.keyCode==$.ui.keyCode.RIGHT;var tabKey=e.keyCode==$.ui.keyCode.TAB;var shift=e.shiftKey;if((inTX&&(leftArrow||rightArrow||(tabKey&&!shift)))||(inUM&&tabKey&&shift)){e.stopImmediatePropagation()}};this.focus=function(){$distInput.focus()};this.loadValue=function(item){defaultValue=item[args.column.field];var du=defaultValue?defaultValue.split(" ",2):["",""];$distInput.val(du[0]);$unitsInput.val(du[1]);$distInput[0].defaultValue=du[0];$unitsInput[0].defaultValue=du[1];$distInput.select()};this.serializeValue=function(){var d=$.trim($distInput.val());var u=$.trim($unitsInput.val());if(d!=""&&u!=""){return d+" "+u}else{return""}};this.applyValue=function(item,state){item[args.column.field]=state};this.isValueChanged=function(){var val=this.serializeValue();return(!(val==""&&defaultValue==null))&&(val!=defaultValue)};this.validate=function(){return{valid:true,msg:null}};this.init()},DurationWithUnitsCellEditor:function(args){var $durInput;var $unitsInput;var defaultValue;var scope=this;this.init=function(){$durInput=$('<input type="text" class="form-text duration txs"/>').appendTo(args.container).bind("keydown",scope.handleKeyDown).bind("focus",function(){this.select()});$unitsInput=$('<select class="units-menu"><option>h</option><option>d</option></select>').appendTo(args.container).bind("keydown",scope.handleKeyDown);scope.focus()};this.destroy=function(){$durInput.remove();$unitsInput.remove()};this.handleKeyDown=function(e){var inTX=$(e.target).hasClass("form-text");var inUM=$(e.target).hasClass("units-menu");var leftArrow=e.keyCode==$.ui.keyCode.LEFT;var rightArrow=e.keyCode==$.ui.keyCode.RIGHT;var tabKey=e.keyCode==$.ui.keyCode.TAB;var shift=e.shiftKey;if((inTX&&(leftArrow||rightArrow||(tabKey&&!shift)))||(inUM&&tabKey&&shift)){e.stopImmediatePropagation()}};this.focus=function(){$durInput.focus()};this.loadValue=function(item){defaultValue=item[args.column.field];var du=defaultValue?defaultValue.split(" ",2):["",""];$durInput.val(du[0]);$unitsInput.val(du[1]);$durInput[0].defaultValue=du[0];$unitsInput[0].defaultValue=du[1];$durInput.select()};this.serializeValue=function(){var d=$.trim($durInput.val());var u=$.trim($unitsInput.val());if(d!=""&&u!=""){return d+" "+u}else{return""}};this.applyValue=function(item,state){item[args.column.field]=state;EntryStatusCellEditor};this.isValueChanged=function(){var val=this.serializeValue();return(!(val==""&&defaultValue==null))&&(val!=defaultValue)};this.validate=function(){return{valid:true,msg:null}};this.init()}};var BazuCellFormatters={BracketTypeCellFormatter:_createSelectCellFormatter(bracketTypeItems),SexCellFormatter:_createSelectCellFormatter(sexItems),EntryStatusCellFormatter:_createSelectCellFormatter(entryStatusItems),EntryTypeCellFormatter:_createSelectCellFormatter(entryTypeItems),RankTypeCellFormatter:_createSelectCellFormatter(rankTypeItems),RaceTypeCellFormatter:_createSelectCellFormatter(raceTypeItems),RaceCellFormatter:_createSelectCellFormatter(raceItems),BracketNameCellFormatter:function(row,cell,value,columnDef,dataContext){var indent=0;var hasKids=false;switch(dataContext.type){case"OPEN":hasKids=true;break;case"SEX":indent=1;hasKids=true;break;case"AGE":indent=2;break}var spacer="<span style='display:inline-block;height:1px;width:"+(15*indent)+"px'></span>";if(hasKids){if(dataContext._collapsed){return spacer+" <span class='toggle expand'></span>&nbsp;"+value}else{return spacer+" <span class='toggle collapse'></span>&nbsp;"+value}}else{return spacer+" <span class='toggle'></span>&nbsp;"+value}},EntryBibCellFormatter:function(row,cell,value,columnDef,dataContext){return dataContext.bib},LinkCellFormatter:function(row,cell,value,columnDef,dataContext){if(dataContext.type&&dataContext.type==="TEAM"){return'<a href="'+columnDef.formatterLinkTeam+dataContext.team_id+'" target="_blank">'+dataContext.team_id+"</a>"}else{return'<a href="'+columnDef.formatterLink+dataContext.id+'" target="_blank">'+dataContext.id+"</a>"}},EntryChronoFormatter:function(row,cell,value,columnDef,dataContext){return'<a href="'+columnDef.formatterLink+dataContext.chrono_id+'" target="_blank">'+dataContext.chrono_id+"</a>"},EntryPrimaryBracketsCellFormater:function(row,cell,value,columnDef,dataContext){var race_id=dataContext.race;if(typeof primaryBracketItems[race_id]!="undefined"){if(typeof primaryBracketItems[race_id][value]!="undefined"){var results=primaryBracketItems[race_id][value]}}if(value==""){value="None"}return(typeof result=="undefined")?value:result.name},EntryWaveCellFormatter:function(row,cell,value,columnDef,dataContext){var race_id=dataContext.race;var result=wavesItems[race_id][value];if(value==""){value="None"}return(typeof result=="undefined")?value:result},EntryNameCellFormatter:function(row,cell,value,columnDef,dataContext){return dataContext.first_name},EntryAgeCellFormatter:function(row,cell,value,columnDef,dataContext){return dataContext.age},EntryLastNameCellFormatter:function(row,cell,value,columnDef,dataContext){return dataContext.last_name},EntryChipCellFormatter:function(row,cell,value,columnDef,dataContext){return dataContext.chip},AgeRangeCellFormatter:function(row,cell,value,columnDef,dataContext){if(dataContext.type=="AGE"){return dataContext.min_age+" - "+dataContext.max_age}else{return""}},ActualStartCellFormatter:function(row,cell,value,columnDef,dataContext){var actual_start_time;if(dataContext.actual_start_time==null){actual_start_time="Not set"}else{actual_start_time=dataContext.actual_start_time}return actual_start_time},PlannedStartCellFormatter:function(row,cell,value,columnDef,dataContext){return dataContext.planned_start_time},DateCellFormatter:function(row,cell,value,columnDef,dataContext){return dataContext.planned_start_date}};function BazuSlickGrid(container,columns,options){var grid=null;var dataView=null;var pager=null;var pagerContainer=null;var filterContainer=null;var commandQueue=[];var commands=[];var deletedItems={};var insertedItems={};var updatedItems={};var trashCan=null;var activeRow=0;var activeCell=0;var defaults={editable:true,autoEdit:true,onBeforeEditCell:null,onChange:null,onUpdateItem:null,onAddItem:null,onDeleteItem:null,enableAddRow:true,enableFilterBar:false,filterBarSelector:".bazu-slick-filter",swallowFilterBar:false,wantsPager:true,autoPage:true,pagerContainerSelector:".bazu-slick-pager",enableRowCollapsing:true,rowCollapsingFilter:_rowCollapsingFilter,parentField:"parent_id",enableCellNavigation:true,enableRowReordering:true,enableColumnReorder:false,enableCheckboxColumn:true,asyncEditorLoading:true,enableRowDelete:false,enableUndo:true,forceFitColumns:true,newRowTemplate:{},selectionModelType:"row",dataFilter:null,formatterFactory:Bazu.Slick.Factory.CellFormatter,editorFactory:Bazu.Slick.Factory.CellEditor,groupBy:null,sortFunc:_sortFunc,sortBy:"display_order",autoSort:false,pageSize:false,orderField:"display_order"};container=$(container);options=$.extend({},defaults,options);function setData(data){dataView.beginUpdate();dataView.setItems(data);if(options.autoSort){dataView.sort(options.sortFunc,true);_updateOrderField()}dataView.endUpdate();if(options.autoPage){if(!options.pageSize){var vp=grid.getViewport();dataView.setPagingOptions({pageSize:(vp.bottom-vp.top)})}else{dataView.setPagingOptions({pageSize:options.pageSize})}}activeRow=0;activeCell=firstEditableColumn();grid.gotoCell(activeRow,activeCell);grid.setSelectedRows([]);deletedItems={};deletedItemsData={};commands=[];updatedItems={};insertedItems={};updateTrashCount();notifyChanges()}function sortGrid(){grid.navigateNext();dataView.reSort();_updateOrderField()}function saveAndGoNext(){grid.navigateNext()}function reset(){setData(dataView.getItems())}function firstEditableColumn(){col=0+(options.enableRowReordering?1:0)+(options.enableCheckboxColumn?1:0);return col}function getData(){return dataView.getItems()}function _analyzeUpdates(){var fc=0;var oc=0;for(id in updatedItems){var c=updatedItems[id];c._deleted_=deletedItems.hasOwnProperty(id);c._orderChangeOnly_=_length(c.changes)==1&&c.changes.hasOwnProperty(options.orderField);if(!c._deleted_){if(c._orderChangeOnly_){oc++}else{fc++}}}return{fieldUpdates:fc,orderUpdates:oc}}function _updateOrderField(){if(options.orderField){for(var i=0;i<dataView.getLength();i++){var item=dataView.getItem(i);var newOrder=i+1;if(item[options.orderField]!==newOrder){item[options.orderField]=newOrder;if(!itemIsNew(item)){markItemUpdated(item.id,options.orderField)}}}}}function notifyChanges(){if(options.onChange){upc=getUpdatedItemCount();options.onChange({updates:upc.fieldUpdates,order:upc.orderUpdates,inserts:getInsertedItemCount(),deletes:getDeletedItemCount(),selected:getSelectedItemCount()})}}function getSelectedItemCount(){return grid.getSelectedRows().length}function markItemDeleted(id){if(typeof updatedItems[id]=="object"){updatedItems[id]._deleted_=true}deletedItems[id]=1;updateTrashCount()}function markItemUpdated(id,changedField){if(typeof updatedItems[id]=="undefined"){updatedItems[id]={changes:{}}}updatedItems[id].changes[changedField]=1}function itemIsNew(item){return item.id.substr(0,5)=="_new_"}function _sortFunc(a,b){var x=a[options.sortBy];var y=b[options.sortBy];return(y<x)-(x<y)}function sorterString(a,b){var x=a[sortcol]!=null?a[sortcol].toLowerCase():"";var y=b[sortcol]!=null?b[sortcol].toLowerCase():"";return sortdir*(x===y?0:(x>y?1:-1))}function sorterNumeric(a,b){var x=(isNaN(a[sortcol])||a[sortcol]===""||a[sortcol]===null)?-990000000000:parseFloat(a[sortcol]);var y=(isNaN(b[sortcol])||b[sortcol]===""||b[sortcol]===null)?-990000000000:parseFloat(b[sortcol]);return sortdir*(x===y?0:(x>y?1:-1))}function sorterRating(a,b){var xrow=a[sortcol],yrow=b[sortcol];var x=xrow[3],y=yrow[3];return sortdir*(x===y?0:(x>y?1:-1))}function sorterDate(a,b){var regex_a=new RegExp("^((19[1-9][1-9])|([2][01][0-9]))\\d-([0]\\d|[1][0-2])-([0-2]\\d|[3][0-1])(\\s([0]\\d|[1][0-2])(\\:[0-5]\\d){1,2}(\\:[0-5]\\d){1,2})?$","gi");var regex_b=new RegExp("^((19[1-9][1-9])|([2][01][0-9]))\\d-([0]\\d|[1][0-2])-([0-2]\\d|[3][0-1])(\\s([0]\\d|[1][0-2])(\\:[0-5]\\d){1,2}(\\:[0-5]\\d){1,2})?$","gi");if(regex_a.test(a[sortcol])&&regex_b.test(b[sortcol])){var date_a=new Date(a[sortcol]);var date_b=new Date(b[sortcol]);var diff=date_a.getTime()-date_b.getTime();return sortdir*(diff===0?0:(date_a>date_b?1:-1))}else{var x=a[sortcol],y=b[sortcol];return sortdir*(x===y?0:(x>y?1:-1))}}function _queueExecEditCommand(item,column,editCommand){commandQueue.push(editCommand);editCommand.execute()}function undoEdit(){if(grid){var command=commandQueue.pop();if(command&&Slick.GlobalEditorLock.cancelCurrentEdit()){command.undo();grid.gotoCell(command.row,command.cell,false);delete updatedItems[command.item.id].changes[command.column.id];notifyChanges()}}}function undoDelete(id){var item=deletedItemsData[id];delete deletedItems[id];delete deletedItemsData[id];if(typeof updatedItems[id]!="undefined"){updatedItems[id]._deleted_=false}dataView.beginUpdate();dataView.addItem(item);if(options.autoSort){dataView.sort(options.sortFunc,true);_updateOrderField()}dataView.endUpdate();updateTrashCount();notifyChanges()}function undo(){var commandLast=commands.pop();if(commandLast.action=="edit"){undoEdit()}else{undoDelete(commandLast.deletedItem.id)}if(commands.length===0){$(".undo").button("disable")}}function removeSelectedRows(){var rows=grid.getSelectedRows();var dataView=grid.getData();dataView.beginUpdate();for(var i=0;i<rows.length;i++){var ix=rows[i];var item=dataView.getItem(ix);dataView.deleteItem(item.id);markItemDeleted(item.id);deletedItemsData[item.id]=item;commands.push({action:"delete",deletedItem:item});if(options.onDeleteItem){options.onDeleteItem(args.item,dataView.getItems())}}dataView.endUpdate();grid.invalidate();grid.setSelectedRows([]);notifyChanges()}function removeSelectedWaves(){var rows=grid.getSelectedRows();var options=grid.getOptions();var raceID=options.raceID;var emptyRow=true;var universal=false;var wavesIds=[];if(rows.length===0){alert(gt.gettext("Please select waves you want to delete."));return false}else{var j=0;for(var i=0;i<rows.length;i++){var ix=rows[i];var item=dataView.getItem(ix);if(item){if(item.id.indexOf("_new_")<0){wavesIds[j]=item.id;j++;emptyRow=false}if(item.tag=="ALL"){universal=true}}}}if(emptyRow){alert(gt.gettext("Please select waves you want to delete"));return false}else{if(universal){alert(gt.gettext("The Universal Wave may not be deleted."));return false}else{var waveIdsString=wavesIds.join("-");var waves=$(".delete_wave");waves.removeAttr("href");var href="/admin/wave/remove/waves/"+waveIdsString;waves.data("href",href);handlePopup.apply(waves);promptBeforeUnload=false}}return false}function modifySelectedWaves(){var rows=grid.getSelectedRows();var options=grid.getOptions();var raceID=options.raceID;var emptyRow=true;var universal=false;var wavesIds=[];if(rows.length==0){alert(gt.gettext("Please select waves you want to modify."));return false}else{var j=0;for(var i=0;i<rows.length;i++){var ix=rows[i];var item=dataView.getItem(ix);if(item){wavesIds[j]=item.id;j++;emptyRow=false}}if(emptyRow){alert(gt.gettext("Please select waves you want to modify"));return false}else{var waveIdsString=wavesIds.join("-");var waves=$(".modifyWave");waves.removeAttr("href");var href="/admin/wave/modify/waves/"+waveIdsString+"/race/"+raceID+"/_step/1";waves.data("href",href);handlePopup.apply(waves);promptBeforeUnload=false}return false}}function deleteSelectedPenalties(){var rows=grid.getSelectedRows();var penaltyIDs=[];if(rows.length===0){alert(gt.gettext("Please select penalties you want to delete."));return false}else{var j=0;for(var i=0;i<rows.length;i++){var ix=rows[i];var item=dataView.getItem(ix);if(item){penaltyIDs[j]=item.id;j++}}var penaltyIDString=penaltyIDs.join("-");var penaltyDelete=$(".deletePenalties");penaltyDelete.data("href","/admin/entry-penalty/remove/penalties/"+penaltyIDString);handlePopup.apply(penaltyDelete);promptBeforeUnload=false;return false}}function duplicateSelectedRow(){var rows=grid.getSelectedRows();var emptyRow=true;var activateChanges=false;var bracketIds=[];if(rows.length===0){alert(gt.gettext("Please select brackets to duplicate."));return false}else{var j=0;var others=0;var sex=0;for(var i=0;i<rows.length;i++){var ix=rows[i];var item=dataView.getItem(ix);if(item){if(item.type=="AGE"){if(item.id.indexOf("_new_")>=0){activateChanges=true}bracketIds[j]=item.id;j++;emptyRow=false}else{if(item.type=="OTHER"){if(item.id.indexOf("_new_")>=0){activateChanges=true}bracketIds[j]=item.id;j++;others=1;emptyRow=false}else{if(item.type=="SEX"){sex=1}}}}}if(activateChanges){alert(gt.gettext("Please activate your changes before duplicate."));return false}if(emptyRow){if(sex==1){alert('Brackets with type "Gender" can not be duplicated.')}else{alert(gt.gettext("Please select brackets to duplicate."))}}else{var bracketIdsString=bracketIds.join("-");var brackets=$(".duplicate");brackets.data("href","/admin/bracket/clone/brackets/"+bracketIdsString+"/others/"+others);handlePopup.apply(brackets);promptBeforeUnload=false}return false}}function ignoreSelectedRows(){var rows=grid.getSelectedRows();var emptyRow=true;var entryIds=[];if(rows.length===0){alert(gt.gettext("Please select rows to change."));return false}else{var j=0;for(var i=0;i<rows.length;i++){var ix=rows[i];var item=dataView.getItem(ix);if(item){entryIds[j]=item.id;emptyRow=false;j++}}if(emptyRow){alert(gt.gettext("Please select rows to change."))}else{entries=entryIds.join("-");var ignoreSelected=$(".ignoreRows");ignoreSelected.data("postData",{entries:entries});handlePopup.apply(ignoreSelected);promptBeforeUnload=false}return false}}function changeSelectedRows(){var rows=grid.getSelectedRows();var emptyRow=true;var entryIds=[];if(rows.length===0){alert(gt.gettext("Please select rows to change."));return false}else{var j=0;var race_changed=false;var lastRace="";for(var i=0;i<rows.length;i++){var ix=rows[i];var item=dataView.getItem(ix);if(item){if(typeof(item.race)!="undefined"){if(lastRace==""){lastRace=item.race}else{if(lastRace!=item.race){race_changed=true}}}entryIds[j]=item.id;emptyRow=false;j++}}if(emptyRow){alert(gt.gettext("Please select rows to change."))}else{entries=entryIds.join("-");var changeSelected=$(".changeSelected");var params=changeSelected.data("params");var href=changeSelected.data("check");href="/admin/scoring/datacheck/formType/"+href;if(typeof params!="undefined"&&typeof params.checkpointID!="undefined"){href=href+"/checkpointID/"+params.checkpointID}if(typeof params!="undefined"&&typeof params.raceID!="undefined"){href=href+"/raceID/"+params.raceID}if(!race_changed){href=href+"/race-change/"+lastRace}changeSelected.data("href",href);handlePopup.apply(changeSelected);promptBeforeUnload=false}return false}}function updateTrashCount(){if(trashCan){trashCan.find(".item-count").text(getDeletedItemCount()+" item(s)")}}function getDeletedItems(){return deletedItems}function getDeletedItemCount(){return _length(deletedItems)}function getUpdatedItems(includeDeleted){var items={};for(id in updatedItems){if(!updatedItems[id]._deleted_||includeDeleted){items[id]=updatedItems[id].changes}}return items}function getUpdatedItemCount(){return _analyzeUpdates()}function getInsertedItems(){return insertedItems}function getInsertedItemCount(){return _length(insertedItems)}function _length(o){var k=0;for(x in o){if(o.hasOwnProperty(x)){k++}}return k}function getGrid(){return grid}function getDataView(){return dataView}function _rowCollapsingFilter(item){var parentID=item[options.parentField];if(parentID){var parentItem=dataView.getItemById(parentID);while(parentItem){if(parentItem.id==parentItem.parent_bracket_id){break}if(parentItem._collapsed){return false}ancestorID=parentItem[options.parentField];parentItem=ancestorID?dataView.getItemById(ancestorID):null}}return true}function _init(){if(!options.editable){options.enableUndo=false;options.enableRowDelete=false;options.enableCheckboxColumn=false;options.enableRowReordering=false;options.enableAddRow=false}if(options.enableUndo){options.editCommandHandler=_queueExecEditCommand;options.enableFilterBar=true}if(options.enableRowDelete){options.enableCheckboxColumn=true;options.enableFilterBar=true}if(options.autoSort){options.enableRowReordering=false}var checkboxSelector=null;if(options.enableCheckboxColumn){checkboxSelector=new Slick.CheckboxSelectColumn({cssClass:"slick-cell-checkboxsel"});columns.unshift(checkboxSelector.getColumnDefinition())}if(options.enableRowReordering){columns.unshift({id:"#",name:"",field:"",width:40,resizable:false,selectable:false,editable:false,behavior:"selectAndMove",cssClass:"cell-reorder dnd"})}$.each(columns,function(i,e){$(e).attr("sortable",true)});dataView=new Slick.Data.DataView();grid=new Slick.Grid(container,dataView,columns,options);grid.onSort.subscribe(function(e,args){sortdir=args.sortAsc?1:-1;sortcol=args.sortCol.field;dataView.sort(function(dataRow1,dataRow2){sorter=args.sortCol.sorter?args.sortCol.sorter:"sorterString";var result=eval(sorter)(dataRow1,dataRow2);if(result!=0){return result}return 0})});dataView.getItemMetadata=function(i){var item=dataView.getItem(i);if(item===undefined){return null}if(item.is_universal=="1"){return{cssClasses:"highlight-universal"}}if(item.__group){return options.groupItemMetadataProvider.getGroupRowMetadata(item)}if(item.__groupTotals){return options.groupItemMetadataProvider.getTotalsRowMetadata(item)}return null};if(options.enableRowCollapsing){grid.onClick.subscribe(function(e,args){if($(e.target).hasClass("toggle")){var item=dataView.getItem(args.row);if(item){if(!item._collapsed){item._collapsed=true}else{item._collapsed=false}dataView.updateItem(item.id,item)}e.stopImmediatePropagation()}})}if(options.dataFilter){options.enableFilterBar=true;if(options.enableRowCollapsing){dataView.setFilter(function(item){return options.dataFilter(item)&&options.rowCollapsingFilter(item)})}else{dataView.setFilter(options.dataFilter)}}else{if(options.enableRowCollapsing){dataView.setFilter(options.rowCollapsingFilter)}}if(options.enableFilterBar){if(options.findInParent){filterContainer=$(options.filterBarSelector,container.parent().parent())}else{filterContainer=$(options.filterBarSelector,container.parent())}if(filterContainer.size()>0){if(options.swallowFilterBar){var p=grid.getTopPanel();filterContainer.appendTo(p).show()}filterContainer.find("#addBracket").click(function(){grid.gotoCell(grid.getDataLength(),firstEditableColumn(),true)}).end().find(".delete").click(function(){removeSelectedRows()}).end().find(".delete_wave").click(function(){removeSelectedWaves()}).end().find(".modifyWave").click(function(){modifySelectedWaves()}).end().find(".undo").click(function(){undo()}).end().find(".duplicate").click(function(){duplicateSelectedRow()}).end().find(".changeSelected").click(function(){changeSelectedRows()}).end().find(".deletePenalties").click(function(){deleteSelectedPenalties()}).end().find(".ignoreRows").click(ignoreSelectedRows).end()}else{options.enableFilterBar=false}}var selModel=options.selectionModelType=="row"?new Slick.RowSelectionModel():new Slick.CellSelectionModel();grid.setSelectionModel(selModel);if(checkboxSelector){grid.registerPlugin(checkboxSelector)}if(options.wantsPager){pagerContainer=$(options.pagerContainerSelector);if(pagerContainer.size()>0){pager=new Slick.Controls.Pager(dataView,grid,pagerContainer)}else{options.wantsPager=options.autoPage=false}}else{options.autoPage=false}grid.onCellChange.subscribe(function(e,args){commands.push({action:"edit"});var cols=grid.getColumns();var changedField=cols[args.cell].field;dataView.beginUpdate();dataView.updateItem(args.item.id,args.item);if(options.onUpdateItem){options.onUpdateItem(args.item,dataView.getItems())}dataView.endUpdate();if(!itemIsNew(args.item)){markItemUpdated(args.item.id,changedField)}notifyChanges()});grid.onAddNewRow.subscribe(function(e,args){var item=$.extend({},options.newRowTemplate,{id:"_new_"+(Math.round(Math.random()*10000))},args.item);dataView.beginUpdate();dataView.addItem(item);if(options.onAddItem){options.onAddItem(item,dataView.getItems())}dataView.endUpdate();var inserts=0;insertedItems[item.id]=1;notifyChanges()});if(options.onBeforeEditCell){grid.onBeforeEditCell.subscribe(options.onBeforeEditCell)}if(options.autoSort){grid.onActiveCellChanged.subscribe(function(e,args){var newActiveRow=args.row;if(activeRow==null){activeRow=newActiveRow}else{if(newActiveRow!=activeRow){activeRow=newActiveRow;dataView.reSort();_updateOrderField()}}})}dataView.onRowCountChanged.subscribe(function(e,args){grid.updateRowCount();grid.render()});dataView.onRowsChanged.subscribe(function(e,args){grid.invalidateRows(args.rows);grid.render()});dataView.onPagingInfoChanged.subscribe(function(e,pagingInfo){var isLastPage=pagingInfo.pageSize*(pagingInfo.pageNum+1)-1>=pagingInfo.totalRows;var enableAddRow=isLastPage||pagingInfo.pageSize===0;if(options.enableAddRow!=enableAddRow){grid.setOptions({enableAddRow:enableAddRow});options.enableAddRow=enableAddRow}});if(options.enableRowReordering){var moveRowsPlugin=new Slick.RowMoveManager();moveRowsPlugin.onBeforeMoveRows.subscribe(function(e,data){for(var i=0;i<data.rows.length;i++){if(data.rows[i]==data.insertBefore||data.rows[i]==data.insertBefore-1){e.stopPropagation();return false}}return true});moveRowsPlugin.onMoveRows.subscribe(function(e,args){var data=dataView.getItems();var extractedRows=[],left,right;var rows=args.rows;var insertBefore=args.insertBefore;left=data.slice(0,insertBefore);right=data.slice(insertBefore,data.length);for(var i=0;i<rows.length;i++){extractedRows.push(data[rows[i]])}rows.sort().reverse();for(var ii=0;ii<rows.length;ii++){var row=rows[ii];if(row<insertBefore){left.splice(row,1)}else{right.splice(row-insertBefore,1)}}data=left.concat(extractedRows.concat(right));var selectedRows=[];for(var iii=0;iii<rows.length;iii++){selectedRows.push(left.length+iii)}grid.resetActiveCell();dataView.setItems(data);grid.setSelectedRows(selectedRows);grid.render()});grid.registerPlugin(moveRowsPlugin)}grid.onSelectedRowsChanged.subscribe(function(e,args){notifyChanges()});if(options.enableRowDelete){grid.onDragInit.subscribe(function(e,dd){e.stopImmediatePropagation()});grid.onDragStart.subscribe(function(e,dd){var cell=grid.getCellFromEvent(e);if(!cell){return null}dd.row=cell.row;if(!dataView.getItem(dd.row)){return null}if(Slick.GlobalEditorLock.isActive()){Slick.GlobalEditorLock.cancelCurrentEdit()}e.stopImmediatePropagation();dd.mode="recycle";var selectedRows=grid.getSelectedRows();if(!selectedRows.length||$.inArray(dd.row,selectedRows)==-1){selectedRows=[dd.row];grid.setSelectedRows(selectedRows)}dd.rows=selectedRows;dd.count=selectedRows.length;var proxy=$("<span></span>").css({position:"absolute",display:"inline-block",padding:"4px 10px",background:"#e0e0e0",border:"1px solid gray","z-index":99999,"-moz-border-radius":"8px","-moz-box-shadow":"2px 2px 6px silver","-webkit-border-radius":"8px","-webkit-box-shadow":"2px 2px 6px silver","border-radius":"8px","box-shadow":"2px 2px 6px silver"}).text(gt.gettext("Drag to trash to delete ")+dd.count+gt.gettext(" selected row(s)")).appendTo("body");dd.helper=proxy;$(dd.available).css("background","pink");return proxy});grid.onDrag.subscribe(function(e,dd){if(dd.mode!="recycle"){return}e.stopImmediatePropagation();dd.helper.css({top:e.pageY+5,left:e.pageX+5})});grid.onDragEnd.subscribe(function(e,dd){if(dd.mode!="recycle"){return}e.stopImmediatePropagation();dd.helper.remove();$(dd.available).css("background","beige")})}}function getJSONChanges(){var rowsToDelete=[];for(var id in getDeletedItems()){if(id.substr(0,5)!="_new_"){rowsToDelete.push(id)}}var itemsToInsert=[];for(id in getInsertedItems()){itemsToInsert.push(dataView.getItemById(id))}var itemsToUpdate=[];for(id in getUpdatedItems()){itemsToUpdate.push(dataView.getItemById(id))}var result={rowsToDelete:rowsToDelete,itemsToInsert:itemsToInsert,itemsToUpdate:itemsToUpdate};return JSON.stringify(result)}$.extend(this,{reset:reset,setData:setData,getData:getData,getGrid:getGrid,getDataView:getDataView,getJSONChanges:getJSONChanges,getDeletedItems:getDeletedItems,getDeletedItemCount:getDeletedItemCount,getInsertedItems:getInsertedItems,getInsertedItemCount:getInsertedItemCount,getUpdatedItems:getUpdatedItems,getUpdatedItemCount:getUpdatedItemCount,itemIsNew:itemIsNew,undoEdit:undoEdit,undoDelete:undoDelete,undo:undo,removeSelectedWaves:removeSelectedWaves,removeSelectedRows:removeSelectedRows,duplicateSelectedRow:duplicateSelectedRow,sortGrid:sortGrid,saveAndGoNext:saveAndGoNext,changeSelectedRows:changeSelectedRows,deleteSelectedPenalties:deleteSelectedPenalties});_init()}$.extend(true,window,{Bazu:{Slick:{Grid:BazuSlickGrid,Factory:{CellFormatter:BazuCellFormatterFactory,CellEditor:BazuCellEditorFactory}}}})})(jQuery);
/*highslide/highslide-full.js*/
if(!hs){var hs={lang:{cssDirection:"ltr",loadingText:gt.gettext("Loading..."),loadingTitle:gt.gettext("Click to cancel"),focusTitle:gt.gettext("Click to bring to front"),fullExpandTitle:gt.gettext("Expand to actual size (f)"),creditsText:"Powered by <i>Highslide JS</i>",creditsTitle:"Go to the Highslide JS homepage",previousText:gt.gettext("Previous"),nextText:gt.gettext("Next"),moveText:gt.gettext("Move"),closeText:gt.gettext("Close"),closeTitle:gt.gettext("Close (esc)"),resizeTitle:gt.gettext("Resize"),playText:gt.gettext("Play"),playTitle:gt.gettext("Play slideshow (spacebar)"),pauseText:gt.gettext("Pause"),pauseTitle:gt.gettext("Pause slideshow (spacebar)"),previousTitle:gt.gettext("Previous (arrow left)"),nextTitle:gt.gettext("Next (arrow right)"),moveTitle:gt.gettext("Move"),fullExpandText:"1:1",number:gt.gettext("Image")+" %1 "+gt.gettext("of")+" %2",restoreTitle:gt.gettext("Click to close image, click and drag to move. Use arrow keys for next and previous.")},graphicsDir:"/highslide/graphics/",expandCursor:"zoomin.cur",restoreCursor:"zoomout.cur",expandDuration:250,restoreDuration:250,marginLeft:15,marginRight:15,marginTop:15,marginBottom:15,zIndexCounter:1001,loadingOpacity:0.75,allowMultipleInstances:true,numberOfImagesToPreload:5,outlineWhileAnimating:2,outlineStartOffset:3,padToMinWidth:false,fullExpandPosition:"bottom right",fullExpandOpacity:1,showCredits:true,creditsHref:"http://highslide.com/",creditsTarget:"_self",enableKeyListener:true,openerTagNames:["a","area"],transitions:[],transitionDuration:250,dimmingOpacity:0,dimmingDuration:50,allowWidthReduction:false,allowHeightReduction:true,preserveContent:true,objectLoadTime:"before",cacheAjax:true,anchor:"auto",align:"auto",targetX:null,targetY:null,dragByHeading:true,minWidth:200,minHeight:200,allowSizeReduction:true,outlineType:"drop-shadow",skin:{controls:'<div class="highslide-controls"><ul><li class="highslide-previous"><a href="#" title="{hs.lang.previousTitle}"><span>{hs.lang.previousText}</span></a></li><li class="highslide-play"><a href="#" title="{hs.lang.playTitle}"><span>{hs.lang.playText}</span></a></li><li class="highslide-pause"><a href="#" title="{hs.lang.pauseTitle}"><span>{hs.lang.pauseText}</span></a></li><li class="highslide-next"><a href="#" title="{hs.lang.nextTitle}"><span>{hs.lang.nextText}</span></a></li><li class="highslide-move"><a href="#" title="{hs.lang.moveTitle}"><span>{hs.lang.moveText}</span></a></li><li class="highslide-full-expand"><a href="#" title="{hs.lang.fullExpandTitle}"><span>{hs.lang.fullExpandText}</span></a></li><li class="highslide-close"><a href="#" title="{hs.lang.closeTitle}" ><span>{hs.lang.closeText}</span></a></li></ul></div>',contentWrapper:'<div class="highslide-header"><ul><li class="highslide-previous"><a href="#" title="{hs.lang.previousTitle}" onclick="return hs.previous(this)"><span>{hs.lang.previousText}</span></a></li><li class="highslide-next"><a href="#" title="{hs.lang.nextTitle}" onclick="return hs.next(this)"><span>{hs.lang.nextText}</span></a></li><li class="highslide-move"><a href="#" title="{hs.lang.moveTitle}" onclick="return false"><span>{hs.lang.moveText}</span></a></li><li class="highslide-close"><a href="#" title="{hs.lang.closeTitle}" onclick="return hs.close(this)"><span>{hs.lang.closeText}</span></a></li></ul></div><div class="highslide-body"></div><div class="highslide-footer"><div><span class="highslide-resize" title="{hs.lang.resizeTitle}"><span></span></span></div></div>'},preloadTheseImages:[],continuePreloading:true,expanders:[],overrides:["allowSizeReduction","useBox","anchor","align","targetX","targetY","outlineType","outlineWhileAnimating","captionId","captionText","captionEval","captionOverlay","headingId","headingText","headingEval","headingOverlay","creditsPosition","dragByHeading","autoplay","numberPosition","transitions","dimmingOpacity","width","height","contentId","allowWidthReduction","allowHeightReduction","preserveContent","maincontentId","maincontentText","maincontentEval","objectType","cacheAjax","objectWidth","objectHeight","objectLoadTime","swfOptions","wrapperClassName","minWidth","minHeight","maxWidth","maxHeight","pageOrigin","slideshowGroup","easing","easingClose","fadeInOut","src"],overlays:[],idCounter:0,oPos:{x:["leftpanel","left","center","right","rightpanel"],y:["above","top","middle","bottom","below"]},mouse:{},headingOverlay:{},captionOverlay:{},swfOptions:{flashvars:{},params:{},attributes:{}},timers:[],slideshows:[],pendingOutlines:{},sleeping:[],preloadTheseAjax:[],cacheBindings:[],cachedGets:{},clones:{},onReady:[],uaVersion:/Trident\/4\.0/.test(navigator.userAgent)?8:parseFloat((navigator.userAgent.toLowerCase().match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/)||[0,"0"])[1]),ie:(document.all&&!window.opera),safari:/Safari/.test(navigator.userAgent),geckoMac:/Macintosh.+rv:1\.[0-8].+Gecko/.test(navigator.userAgent),$:function(a){if(a){return document.getElementById(a)}},push:function(a,b){a[a.length]=b},createElement:function(a,f,e,d,c){var b=document.createElement(a);if(f){hs.extend(b,f)}if(c){hs.setStyles(b,{padding:0,border:"none",margin:0})}if(e){hs.setStyles(b,e)}if(d){d.appendChild(b)}return b},extend:function(b,c){for(var a in c){b[a]=c[a]}return b},setStyles:function(b,c){for(var a in c){if(hs.ieLt9&&a=="opacity"){if(c[a]>0.99){b.style.removeAttribute("filter")}else{b.style.filter="alpha(opacity="+(c[a]*100)+")"}}else{b.style[a]=c[a]}}},animate:function(f,a,d){var c,g,j;if(typeof d!="object"||d===null){var i=arguments;d={duration:i[2],easing:i[3],complete:i[4]}}if(typeof d.duration!="number"){d.duration=250}d.easing=Math[d.easing]||Math.easeInQuad;d.curAnim=hs.extend({},a);for(var b in a){var h=new hs.fx(f,d,b);c=parseFloat(hs.css(f,b))||0;g=parseFloat(a[b]);j=b!="opacity"?"px":"";h.custom(c,g,j)}},css:function(a,c){if(a.style[c]){return a.style[c]}else{if(document.defaultView){return document.defaultView.getComputedStyle(a,null).getPropertyValue(c)}else{if(c=="opacity"){c="filter"}var b=a.currentStyle[c.replace(/\-(\w)/g,function(e,d){return d.toUpperCase()})];if(c=="filter"){b=b.replace(/alpha\(opacity=([0-9]+)\)/,function(e,d){return d/100})}return b===""?1:b}}},getPageSize:function(){var f=document,b=window,e=f.compatMode&&f.compatMode!="BackCompat"?f.documentElement:f.body,g=hs.ie&&hs.uaVersion<9;var c=g?e.clientWidth:(f.documentElement.clientWidth||self.innerWidth),a=g?e.clientHeight:self.innerHeight;hs.page={width:c,height:a,scrollLeft:g?e.scrollLeft:pageXOffset,scrollTop:g?e.scrollTop:pageYOffset};return hs.page},getPosition:function(c){if(/area/i.test(c.tagName)){var e=document.getElementsByTagName("img");for(var b=0;b<e.length;b++){var a=e[b].useMap;if(a&&a.replace(/^.*?#/,"")==c.parentNode.name){c=e[b];break}}}var d={x:c.offsetLeft,y:c.offsetTop};while(c.offsetParent){c=c.offsetParent;d.x+=c.offsetLeft;d.y+=c.offsetTop;if(c!=document.body&&c!=document.documentElement){d.x-=c.scrollLeft;d.y-=c.scrollTop}}return d},expand:function(b,h,f,d){if(!b){b=hs.createElement("a",null,{display:"none"},hs.container)}if(typeof b.getParams=="function"){return h}if(d=="html"){for(var c=0;c<hs.sleeping.length;c++){if(hs.sleeping[c]&&hs.sleeping[c].a==b){hs.sleeping[c].awake();hs.sleeping[c]=null;return false}}hs.hasHtmlExpanders=true}try{new hs.Expander(b,h,f,d);return false}catch(g){return true}},htmlExpand:function(b,d,c){return hs.expand(b,d,c,"html")},getSelfRendered:function(){return hs.createElement("div",{className:"highslide-html-content",innerHTML:hs.replaceLang(hs.skin.contentWrapper)})},getElementByClass:function(e,c,d){var b=e.getElementsByTagName(c);for(var a=0;a<b.length;a++){if((new RegExp(d)).test(b[a].className)){return b[a]}}return null},replaceLang:function(c){c=c.replace(/\s/g," ");var b=/{hs\.lang\.([^}]+)\}/g,d=c.match(b),e;if(d){for(var a=0;a<d.length;a++){e=d[a].replace(b,"$1");if(typeof hs.lang[e]!="undefined"){c=c.replace(d[a],hs.lang[e])}}}return c},setClickEvents:function(){var b=document.getElementsByTagName("a");for(var a=0;a<b.length;a++){var c=hs.isUnobtrusiveAnchor(b[a]);if(c&&!b[a].hsHasSetClick){(function(){var d=c;if(hs.fireEvent(hs,"onSetClickEvent",{element:b[a],type:d})){b[a].onclick=(c=="image")?function(){return hs.expand(this)}:function(){return hs.htmlExpand(this,{objectType:d})}}})();b[a].hsHasSetClick=true}}hs.getAnchors()},isUnobtrusiveAnchor:function(a){if(a.rel=="highslide"){return"image"}else{if(a.rel=="highslide-ajax"){return"ajax"}else{if(a.rel=="highslide-iframe"){return"iframe"}else{if(a.rel=="highslide-swf"){return"swf"}}}}},getCacheBinding:function(b){for(var d=0;d<hs.cacheBindings.length;d++){if(hs.cacheBindings[d][0]==b){var e=hs.cacheBindings[d][1];hs.cacheBindings[d][1]=e.cloneNode(1);return e}}return null},preloadAjax:function(f){var b=hs.getAnchors();for(var d=0;d<b.htmls.length;d++){var c=b.htmls[d];if(hs.getParam(c,"objectType")=="ajax"&&hs.getParam(c,"cacheAjax")){hs.push(hs.preloadTheseAjax,c)}}hs.preloadAjaxElement(0)},preloadAjaxElement:function(d){if(!hs.preloadTheseAjax[d]){return}var b=hs.preloadTheseAjax[d];var c=hs.getNode(hs.getParam(b,"contentId"));if(!c){c=hs.getSelfRendered()}var e=new hs.Ajax(b,c,1);e.onError=function(){};e.onLoad=function(){hs.push(hs.cacheBindings,[b,c]);hs.preloadAjaxElement(d+1)};e.run()},focusTopmost:function(){var c=0,b=-1,a=hs.expanders,e,f;for(var d=0;d<a.length;d++){e=a[d];if(e){f=e.wrapper.style.zIndex;if(f&&f>c){c=f;b=d}}}if(b==-1){hs.focusKey=-1}else{a[b].focus()}},getParam:function(b,d){b.getParams=b.onclick;var c=b.getParams?b.getParams():null;b.getParams=null;return(c&&typeof c[d]!="undefined")?c[d]:(typeof hs[d]!="undefined"?hs[d]:null)},getSrc:function(b){var c=hs.getParam(b,"src");if(c){return c}return b.href},getNode:function(e){var c=hs.$(e),d=hs.clones[e],b={};if(!c&&!d){return null}if(!d){d=c.cloneNode(true);d.id="";hs.clones[e]=d;return c}else{return d.cloneNode(true)}},discardElement:function(a){if(a){hs.garbageBin.appendChild(a)}hs.garbageBin.innerHTML=""},dim:function(b){if(!hs.dimmer){a=true;hs.dimmer=hs.createElement("div",{className:"highslide-dimming highslide-viewport-size",owner:"",onclick:function(){if(hs.fireEvent(hs,"onDimmerClick")){hs.close()}}},{visibility:"visible",opacity:0},hs.container,true)}hs.dimmer.style.display="";var a=hs.dimmer.owner=="";hs.dimmer.owner+="|"+b.key;if(a){if(hs.geckoMac&&hs.dimmingGeckoFix){hs.setStyles(hs.dimmer,{background:"url("+hs.graphicsDir+"geckodimmer.png)",opacity:1})}else{hs.animate(hs.dimmer,{opacity:b.dimmingOpacity},hs.dimmingDuration)}}},undim:function(a){if(!hs.dimmer){return}if(typeof a!="undefined"){hs.dimmer.owner=hs.dimmer.owner.replace("|"+a,"")}if((typeof a!="undefined"&&hs.dimmer.owner!="")||(hs.upcoming&&hs.getParam(hs.upcoming,"dimmingOpacity"))){return}if(hs.geckoMac&&hs.dimmingGeckoFix){hs.dimmer.style.display="none"}else{hs.animate(hs.dimmer,{opacity:0},hs.dimmingDuration,null,function(){hs.dimmer.style.display="none"})}},transit:function(a,d){var b=d||hs.getExpander();d=b;if(hs.upcoming){return false}else{hs.last=b}hs.removeEventListener(document,window.opera?"keypress":"keydown",hs.keyHandler);try{hs.upcoming=a;a.onclick()}catch(c){hs.last=hs.upcoming=null}try{if(!a||d.transitions[1]!="crossfade"){d.close()}}catch(c){}return false},previousOrNext:function(a,c){var b=hs.getExpander(a);if(b){return hs.transit(b.getAdjacentAnchor(c),b)}else{return false}},previous:function(a){return hs.previousOrNext(a,-1)},next:function(a){return hs.previousOrNext(a,1)},keyHandler:function(a){if(!a){a=window.event}if(!a.target){a.target=a.srcElement}if(typeof a.target.form!="undefined"){return true}if(!hs.fireEvent(hs,"onKeyDown",a)){return true}var b=hs.getExpander();var c=null;switch(a.keyCode){case 70:if(b){b.doFullExpand()}return true;case 32:c=2;break;case 34:case 39:case 40:c=1;break;case 8:case 33:case 37:case 38:c=-1;break;case 27:case 13:c=0}if(c!==null){hs.removeEventListener(document,window.opera?"keypress":"keydown",hs.keyHandler);if(!hs.enableKeyListener){return true}if(a.preventDefault){a.preventDefault()}else{a.returnValue=false}if(b){if(c==0){b.close()}else{if(c==2){if(b.slideshow){b.slideshow.hitSpace()}}else{if(b.slideshow){b.slideshow.pause()}hs.previousOrNext(b.key,c)}}return false}}return true},registerOverlay:function(a){hs.push(hs.overlays,hs.extend(a,{hsId:"hsId"+hs.idCounter++}))},addSlideshow:function(b){var d=b.slideshowGroup;if(typeof d=="object"){for(var c=0;c<d.length;c++){var e={};for(var a in b){e[a]=b[a]}e.slideshowGroup=d[c];hs.push(hs.slideshows,e)}}else{hs.push(hs.slideshows,b)}},getWrapperKey:function(c,b){var e,d=/^highslide-wrapper-([0-9]+)$/;e=c;while(e.parentNode){if(e.hsKey!==undefined){return e.hsKey}if(e.id&&d.test(e.id)){return e.id.replace(d,"$1")}e=e.parentNode}if(!b){e=c;while(e.parentNode){if(e.tagName&&hs.isHsAnchor(e)){for(var a=0;a<hs.expanders.length;a++){var f=hs.expanders[a];if(f&&f.a==e){return a}}}e=e.parentNode}}return null},getExpander:function(b,a){if(typeof b=="undefined"){return hs.expanders[hs.focusKey]||null}if(typeof b=="number"){return hs.expanders[b]||null}if(typeof b=="string"){b=hs.$(b)}return hs.expanders[hs.getWrapperKey(b,a)]||null},isHsAnchor:function(b){return(b.onclick&&b.onclick.toString().replace(/\s/g," ").match(/hs.(htmlE|e)xpand/))},reOrder:function(){for(var a=0;a<hs.expanders.length;a++){if(hs.expanders[a]&&hs.expanders[a].isExpanded){hs.focusTopmost()}}},fireEvent:function(c,a,b){return c&&c[a]?(c[a](c,b)!==false):true},mouseClickHandler:function(d){if(!d){d=window.event}if(d.button>1){return true}if(!d.target){d.target=d.srcElement}var b=d.target;while(b.parentNode&&!(/highslide-(image|move|html|resize)/.test(b.className))){b=b.parentNode}var f=hs.getExpander(b);if(f&&(f.isClosing||!f.isExpanded)){return true}if(f&&d.type=="mousedown"){if(d.target.form){return true}var a=b.className.match(/highslide-(image|move|resize)/);if(a){hs.dragArgs={exp:f,type:a[1],left:f.x.pos,width:f.x.size,top:f.y.pos,height:f.y.size,clickX:d.clientX,clickY:d.clientY};hs.addEventListener(document,"mousemove",hs.dragHandler);if(d.preventDefault){d.preventDefault()}if(/highslide-(image|html)-blur/.test(f.content.className)){f.focus();hs.hasFocused=true}return false}else{if(/highslide-html/.test(b.className)&&hs.focusKey!=f.key){f.focus();f.doShowHide("hidden")}}}else{if(d.type=="mouseup"){hs.removeEventListener(document,"mousemove",hs.dragHandler);if(hs.dragArgs){if(hs.styleRestoreCursor&&hs.dragArgs.type=="image"){hs.dragArgs.exp.content.style.cursor=hs.styleRestoreCursor}var c=hs.dragArgs.hasDragged;if(!c&&!hs.hasFocused&&!/(move|resize)/.test(hs.dragArgs.type)){if(hs.fireEvent(f,"onImageClick")){f.close()}}else{if(c||(!c&&hs.hasHtmlExpanders)){hs.dragArgs.exp.doShowHide("hidden")}}if(hs.dragArgs.exp.releaseMask){hs.dragArgs.exp.releaseMask.style.display="none"}if(c){hs.fireEvent(hs.dragArgs.exp,"onDrop",hs.dragArgs)}hs.hasFocused=false;hs.dragArgs=null}else{if(/highslide-image-blur/.test(b.className)){b.style.cursor=hs.styleRestoreCursor}}}}return false},dragHandler:function(c){if(!hs.dragArgs){return true}if(!c){c=window.event}var b=hs.dragArgs,d=b.exp;if(d.iframe){if(!d.releaseMask){d.releaseMask=hs.createElement("div",null,{position:"absolute",width:d.x.size+"px",height:d.y.size+"px",left:d.x.cb+"px",top:d.y.cb+"px",zIndex:4,background:(hs.ieLt9?"white":"none"),opacity:0.01},d.wrapper,true)}if(d.releaseMask.style.display=="none"){d.releaseMask.style.display=""}}b.dX=c.clientX-b.clickX;b.dY=c.clientY-b.clickY;var f=Math.sqrt(Math.pow(b.dX,2)+Math.pow(b.dY,2));if(!b.hasDragged){b.hasDragged=(b.type!="image"&&f>0)||(f>(hs.dragSensitivity||5))}if(b.hasDragged&&c.clientX>5&&c.clientY>5){if(!hs.fireEvent(d,"onDrag",b)){return false}if(b.type=="resize"){d.resize(b)}else{d.moveTo(b.left+b.dX,b.top+b.dY);if(b.type=="image"){d.content.style.cursor="move"}}}return false},wrapperMouseHandler:function(c){try{if(!c){c=window.event}var b=/mouseover/i.test(c.type);if(!c.target){c.target=c.srcElement}if(!c.relatedTarget){c.relatedTarget=b?c.fromElement:c.toElement}var d=hs.getExpander(c.target);if(!d.isExpanded){return}if(!d||!c.relatedTarget||hs.getExpander(c.relatedTarget,true)==d||hs.dragArgs){return}hs.fireEvent(d,b?"onMouseOver":"onMouseOut",c);for(var a=0;a<d.overlays.length;a++){(function(){var e=hs.$("hsId"+d.overlays[a]);if(e&&e.hideOnMouseOut){if(b){hs.setStyles(e,{visibility:"visible",display:""})}hs.animate(e,{opacity:b?e.opacity:0},e.dur)}})()}}catch(c){}},addEventListener:function(a,c,b){if(a==document&&c=="ready"){hs.push(hs.onReady,b)}try{a.addEventListener(c,b,false)}catch(d){try{a.detachEvent("on"+c,b);a.attachEvent("on"+c,b)}catch(d){a["on"+c]=b}}},removeEventListener:function(a,c,b){try{a.removeEventListener(c,b,false)}catch(d){try{a.detachEvent("on"+c,b)}catch(d){a["on"+c]=null}}},preloadFullImage:function(b){if(hs.continuePreloading&&hs.preloadTheseImages[b]&&hs.preloadTheseImages[b]!="undefined"){var a=document.createElement("img");a.onload=function(){a=null;hs.preloadFullImage(b+1)};a.src=hs.preloadTheseImages[b]}},preloadImages:function(c){if(c&&typeof c!="object"){hs.numberOfImagesToPreload=c}var a=hs.getAnchors();for(var b=0;b<a.images.length&&b<hs.numberOfImagesToPreload;b++){hs.push(hs.preloadTheseImages,hs.getSrc(a.images[b]))}if(hs.outlineType){new hs.Outline(hs.outlineType,function(){hs.preloadFullImage(0)})}else{hs.preloadFullImage(0)}if(hs.restoreCursor){var d=hs.createElement("img",{src:hs.graphicsDir+hs.restoreCursor})}},init:function(){if(!hs.container){hs.ieLt7=hs.ie&&hs.uaVersion<7;hs.ieLt9=hs.ie&&hs.uaVersion<9;hs.getPageSize();hs.ie6SSL=hs.ieLt7&&location.protocol=="https:";for(var a in hs.langDefaults){if(typeof hs[a]!="undefined"){hs.lang[a]=hs[a]}else{if(typeof hs.lang[a]=="undefined"&&typeof hs.langDefaults[a]!="undefined"){hs.lang[a]=hs.langDefaults[a]}}}hs.container=hs.createElement("div",{className:"highslide-container"},{position:"absolute",left:0,top:0,width:"100%",zIndex:hs.zIndexCounter,direction:"ltr"},document.body,true);hs.loading=hs.createElement("a",{className:"highslide-loading",title:hs.lang.loadingTitle,innerHTML:hs.lang.loadingText,href:"javascript:;"},{position:"absolute",top:"-9999px",opacity:hs.loadingOpacity,zIndex:1},hs.container);hs.garbageBin=hs.createElement("div",null,{display:"none"},hs.container);hs.viewport=hs.createElement("div",{className:"highslide-viewport highslide-viewport-size"},{visibility:(hs.safari&&hs.uaVersion<525)?"visible":"hidden"},hs.container,1);hs.clearing=hs.createElement("div",null,{clear:"both",paddingTop:"1px"},null,true);Math.linearTween=function(f,e,h,g){return h*f/g+e};Math.easeInQuad=function(f,e,h,g){return h*(f/=g)*f+e};Math.easeOutQuad=function(f,e,h,g){return -h*(f/=g)*(f-2)+e};hs.hideSelects=hs.ieLt7;hs.hideIframes=((window.opera&&hs.uaVersion<9)||navigator.vendor=="KDE"||(hs.ieLt7&&hs.uaVersion<5.5));hs.fireEvent(this,"onActivate")}},ready:function(){if(hs.isReady){return}hs.isReady=true;for(var a=0;a<hs.onReady.length;a++){hs.onReady[a]()}},updateAnchors:function(){var a,d,l=[],h=[],k=[],b={},m;for(var e=0;e<hs.openerTagNames.length;e++){d=document.getElementsByTagName(hs.openerTagNames[e]);for(var c=0;c<d.length;c++){a=d[c];m=hs.isHsAnchor(a);if(m){hs.push(l,a);if(m[0]=="hs.expand"){hs.push(h,a)}else{if(m[0]=="hs.htmlExpand"){hs.push(k,a)}}var f=hs.getParam(a,"slideshowGroup")||"none";if(!b[f]){b[f]=[]}hs.push(b[f],a)}}}hs.anchors={all:l,groups:b,images:h,htmls:k};return hs.anchors},getAnchors:function(){return hs.anchors||hs.updateAnchors()},close:function(a){var b=hs.getExpander(a);if(b){b.close()}return false}};hs.fx=function(b,a,c){this.options=a;this.elem=b;this.prop=c;if(!a.orig){a.orig={}}};hs.fx.prototype={update:function(){(hs.fx.step[this.prop]||hs.fx.step._default)(this);if(this.options.step){this.options.step.call(this.elem,this.now,this)}},custom:function(e,d,c){this.startTime=(new Date()).getTime();this.start=e;this.end=d;this.unit=c;this.now=this.start;this.pos=this.state=0;var a=this;function b(f){return a.step(f)}b.elem=this.elem;if(b()&&hs.timers.push(b)==1){hs.timerId=setInterval(function(){var g=hs.timers;for(var f=0;f<g.length;f++){if(!g[f]()){g.splice(f--,1)}}if(!g.length){clearInterval(hs.timerId)}},13)}},step:function(d){var c=(new Date()).getTime();if(d||c>=this.options.duration+this.startTime){this.now=this.end;this.pos=this.state=1;this.update();this.options.curAnim[this.prop]=true;var a=true;for(var b in this.options.curAnim){if(this.options.curAnim[b]!==true){a=false}}if(a){if(this.options.complete){this.options.complete.call(this.elem)}}return false}else{var e=c-this.startTime;this.state=e/this.options.duration;this.pos=this.options.easing(e,0,1,this.options.duration);this.now=this.start+((this.end-this.start)*this.pos);this.update()}return true}};hs.extend(hs.fx,{step:{opacity:function(a){hs.setStyles(a.elem,{opacity:a.now})},_default:function(a){try{if(a.elem.style&&a.elem.style[a.prop]!=null){a.elem.style[a.prop]=a.now+a.unit}else{a.elem[a.prop]=a.now}}catch(b){}}}});hs.Outline=function(g,e){this.onLoad=e;this.outlineType=g;var a=hs.uaVersion,f;this.hasAlphaImageLoader=hs.ie&&hs.uaVersion<7;if(!g){if(e){e()}return}hs.init();this.table=hs.createElement("table",{cellSpacing:0},{visibility:"hidden",position:"absolute",borderCollapse:"collapse",width:0},hs.container,true);var b=hs.createElement("tbody",null,null,this.table,1);this.td=[];for(var c=0;c<=8;c++){if(c%3==0){f=hs.createElement("tr",null,{height:"auto"},b,true)}this.td[c]=hs.createElement("td",null,null,f,true);var d=c!=4?{lineHeight:0,fontSize:0}:{position:"relative"};hs.setStyles(this.td[c],d)}this.td[4].className=g+" highslide-outline";this.preloadGraphic()};hs.Outline.prototype={preloadGraphic:function(){var b=hs.graphicsDir+(hs.outlinesDir||"outlines/")+this.outlineType+".png";var a=hs.safari&&hs.uaVersion<525?hs.container:null;this.graphic=hs.createElement("img",null,{position:"absolute",top:"-9999px"},a,true);var c=this;this.graphic.onload=function(){c.onGraphicLoad()};this.graphic.src=b},onGraphicLoad:function(){var d=this.offset=this.graphic.width/4,f=[[0,0],[0,-4],[-2,0],[0,-8],0,[-2,-8],[0,-2],[0,-6],[-2,-2]],c={height:(2*d)+"px",width:(2*d)+"px"};for(var b=0;b<=8;b++){if(f[b]){if(this.hasAlphaImageLoader){var a=(b==1||b==7)?"100%":this.graphic.width+"px";var e=hs.createElement("div",null,{width:"100%",height:"100%",position:"relative",overflow:"hidden"},this.td[b],true);hs.createElement("div",null,{filter:"progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale, src='"+this.graphic.src+"')",position:"absolute",width:a,height:this.graphic.height+"px",left:(f[b][0]*d)+"px",top:(f[b][1]*d)+"px"},e,true)}else{hs.setStyles(this.td[b],{background:"url("+this.graphic.src+") "+(f[b][0]*d)+"px "+(f[b][1]*d)+"px"})}if(window.opera&&(b==3||b==5)){hs.createElement("div",null,c,this.td[b],true)}hs.setStyles(this.td[b],c)}}this.graphic=null;if(hs.pendingOutlines[this.outlineType]){hs.pendingOutlines[this.outlineType].destroy()}hs.pendingOutlines[this.outlineType]=this;if(this.onLoad){this.onLoad()}},setPosition:function(g,e,c,b,f){var d=this.exp,a=d.wrapper.style,e=e||0,g=g||{x:d.x.pos+e,y:d.y.pos+e,w:d.x.get("wsize")-2*e,h:d.y.get("wsize")-2*e};if(c){this.table.style.visibility=(g.h>=4*this.offset)?"visible":"hidden"}hs.setStyles(this.table,{left:(g.x-this.offset)+"px",top:(g.y-this.offset)+"px",width:(g.w+2*this.offset)+"px"});g.w-=2*this.offset;g.h-=2*this.offset;hs.setStyles(this.td[4],{width:g.w>=0?g.w+"px":0,height:g.h>=0?g.h+"px":0});if(this.hasAlphaImageLoader){this.td[3].style.height=this.td[5].style.height=this.td[4].style.height}},destroy:function(a){if(a){this.table.style.visibility="hidden"}else{hs.discardElement(this.table)}}};hs.Dimension=function(b,a){this.exp=b;this.dim=a;this.ucwh=a=="x"?"Width":"Height";this.wh=this.ucwh.toLowerCase();this.uclt=a=="x"?"Left":"Top";this.lt=this.uclt.toLowerCase();this.ucrb=a=="x"?"Right":"Bottom";this.rb=this.ucrb.toLowerCase();this.p1=this.p2=0};hs.Dimension.prototype={get:function(a){switch(a){case"loadingPos":return this.tpos+this.tb+(this.t-hs.loading["offset"+this.ucwh])/2;case"loadingPosXfade":return this.pos+this.cb+this.p1+(this.size-hs.loading["offset"+this.ucwh])/2;case"wsize":return this.size+2*this.cb+this.p1+this.p2;case"fitsize":return this.clientSize-this.marginMin-this.marginMax;case"maxsize":return this.get("fitsize")-2*this.cb-this.p1-this.p2;case"opos":return this.pos-(this.exp.outline?this.exp.outline.offset:0);case"osize":return this.get("wsize")+(this.exp.outline?2*this.exp.outline.offset:0);case"imgPad":return this.imgSize?Math.round((this.size-this.imgSize)/2):0}},calcBorders:function(){this.cb=(this.exp.content["offset"+this.ucwh]-this.t)/2;this.marginMax=hs["margin"+this.ucrb]},calcThumb:function(){this.t=this.exp.el[this.wh]?parseInt(this.exp.el[this.wh]):this.exp.el["offset"+this.ucwh];this.tpos=this.exp.tpos[this.dim];this.tb=(this.exp.el["offset"+this.ucwh]-this.t)/2;if(this.tpos==0||this.tpos==-1){this.tpos=(hs.page[this.wh]/2)+hs.page["scroll"+this.uclt]}},calcExpanded:function(){var a=this.exp;this.justify="auto";if(a.align=="center"){this.justify="center"}else{if(new RegExp(this.lt).test(a.anchor)){this.justify=null}else{if(new RegExp(this.rb).test(a.anchor)){this.justify="max"}}}this.pos=this.tpos-this.cb+this.tb;if(this.maxHeight&&this.dim=="x"){a.maxWidth=Math.min(a.maxWidth||this.full,a.maxHeight*this.full/a.y.full)}this.size=Math.min(this.full,a["max"+this.ucwh]||this.full);this.minSize=a.allowSizeReduction?Math.min(a["min"+this.ucwh],this.full):this.full;if(a.isImage&&a.useBox){this.size=a[this.wh];this.imgSize=this.full}if(this.dim=="x"&&hs.padToMinWidth){this.minSize=a.minWidth}this.target=a["target"+this.dim.toUpperCase()];this.marginMin=hs["margin"+this.uclt];this.scroll=hs.page["scroll"+this.uclt];this.clientSize=hs.page[this.wh]},setSize:function(a){var f=this.exp;if(f.isImage&&(f.useBox||hs.padToMinWidth)){this.imgSize=a;this.size=Math.max(this.size,this.imgSize);f.content.style[this.lt]=this.get("imgPad")+"px"}else{this.size=a}f.content.style[this.wh]=a+"px";f.wrapper.style[this.wh]=this.get("wsize")+"px";if(f.outline){f.outline.setPosition()}if(f.releaseMask){f.releaseMask.style[this.wh]=a+"px"}if(this.dim=="y"&&f.iDoc&&f.body.style.height!="auto"){try{f.iDoc.body.style.overflow="auto"}catch(b){}}if(f.isHtml){var c=f.scrollerDiv;if(this.sizeDiff===undefined){this.sizeDiff=f.innerContent["offset"+this.ucwh]-c["offset"+this.ucwh]}c.style[this.wh]=(this.size-this.sizeDiff)+"px";if(this.dim=="x"){f.mediumContent.style.width="auto"}if(f.body){f.body.style[this.wh]="auto"}}if(this.dim=="x"&&f.overlayBox){f.sizeOverlayBox(true)}if(this.dim=="x"&&f.slideshow&&f.isImage){if(a==this.full){f.slideshow.disable("full-expand")}else{f.slideshow.enable("full-expand")}}},setPos:function(a){this.pos=a;this.exp.wrapper.style[this.lt]=a+"px";if(this.exp.outline){this.exp.outline.setPosition()}}};hs.Expander=function(k,f,b,l){this.a=k;this.custom=b;this.contentType=l||"image";this.isHtml=(l=="html");this.isImage=!this.isHtml;hs.continuePreloading=false;this.overlays=[];this.last=hs.last;hs.last=null;hs.init();var m=this.key=hs.expanders.length;for(var g=0;g<hs.overrides.length;g++){var c=hs.overrides[g];this[c]=f&&typeof f[c]!="undefined"?f[c]:hs[c]}if(!this.src){this.src=k.href}var d=(f&&f.thumbnailId)?hs.$(f.thumbnailId):k;d=this.thumb=d.getElementsByTagName("img")[0]||d;this.thumbsUserSetId=d.id||k.id;if(!hs.fireEvent(this,"onInit")){return true}for(var g=0;g<hs.expanders.length;g++){if(hs.expanders[g]&&hs.expanders[g].a==k&&!(this.last&&this.transitions[1]=="crossfade")){hs.expanders[g].focus();return false}}if(!hs.allowSimultaneousLoading){for(var g=0;g<hs.expanders.length;g++){if(hs.expanders[g]&&hs.expanders[g].thumb!=d&&!hs.expanders[g].onLoadStarted){hs.expanders[g].cancelLoading()}}}hs.expanders[m]=this;if(!hs.allowMultipleInstances&&!hs.upcoming){if(hs.expanders[m-1]){hs.expanders[m-1].close()}if(typeof hs.focusKey!="undefined"&&hs.expanders[hs.focusKey]){hs.expanders[hs.focusKey].close()}}this.el=d;this.tpos=this.pageOrigin||hs.getPosition(d);hs.getPageSize();var j=this.x=new hs.Dimension(this,"x");j.calcThumb();var h=this.y=new hs.Dimension(this,"y");h.calcThumb();if(/area/i.test(d.tagName)){this.getImageMapAreaCorrection(d)}this.wrapper=hs.createElement("div",{id:"highslide-wrapper-"+this.key,className:"highslide-wrapper "+this.wrapperClassName},{visibility:"hidden",position:"absolute",zIndex:hs.zIndexCounter+=2},null,true);this.wrapper.onmouseover=this.wrapper.onmouseout=hs.wrapperMouseHandler;if(this.contentType=="image"&&this.outlineWhileAnimating==2){this.outlineWhileAnimating=0}if(!this.outlineType||(this.last&&this.isImage&&this.transitions[1]=="crossfade")){this[this.contentType+"Create"]()}else{if(hs.pendingOutlines[this.outlineType]){this.connectOutline();this[this.contentType+"Create"]()}else{this.showLoading();var e=this;new hs.Outline(this.outlineType,function(){e.connectOutline();e[e.contentType+"Create"]()})}}return true};hs.Expander.prototype={error:function(a){if(hs.debug){alert("Line "+a.lineNumber+": "+a.message)}else{window.location.href=this.src}},connectOutline:function(){var a=this.outline=hs.pendingOutlines[this.outlineType];a.exp=this;a.table.style.zIndex=this.wrapper.style.zIndex-1;hs.pendingOutlines[this.outlineType]=null},showLoading:function(){if(this.onLoadStarted||this.loading){return}this.loading=hs.loading;var c=this;this.loading.onclick=function(){c.cancelLoading()};if(!hs.fireEvent(this,"onShowLoading")){return}var c=this,a=this.x.get("loadingPos")+"px",b=this.y.get("loadingPos")+"px";if(!d&&this.last&&this.transitions[1]=="crossfade"){var d=this.last}if(d){a=d.x.get("loadingPosXfade")+"px";b=d.y.get("loadingPosXfade")+"px";this.loading.style.zIndex=hs.zIndexCounter++}setTimeout(function(){if(c.loading){hs.setStyles(c.loading,{left:a,top:b,zIndex:hs.zIndexCounter++})}},100)},imageCreate:function(){var b=this;var a=document.createElement("img");this.content=a;a.onload=function(){if(hs.expanders[b.key]){b.contentLoaded()}};if(hs.blockRightClick){a.oncontextmenu=function(){return false}}a.className="highslide-image";hs.setStyles(a,{visibility:"hidden",display:"block",position:"absolute",maxWidth:"9999px",zIndex:3});a.title=hs.lang.restoreTitle;if(hs.safari&&hs.uaVersion<525){hs.container.appendChild(a)}if(hs.ie&&hs.flushImgSize){a.src=null}a.src=this.src;this.showLoading()},htmlCreate:function(){if(!hs.fireEvent(this,"onBeforeGetContent")){return}this.content=hs.getCacheBinding(this.a);if(!this.content){this.content=hs.getNode(this.contentId)}if(!this.content){this.content=hs.getSelfRendered()}this.getInline(["maincontent"]);if(this.maincontent){var a=hs.getElementByClass(this.content,"div","highslide-body");if(a){a.appendChild(this.maincontent)}this.maincontent.style.display="block"}hs.fireEvent(this,"onAfterGetContent");var d=this.innerContent=this.content;if(/(swf|iframe)/.test(this.objectType)){this.setObjContainerSize(d)}hs.container.appendChild(this.wrapper);hs.setStyles(this.wrapper,{position:"static",padding:"0 "+hs.marginRight+"px 0 "+hs.marginLeft+"px"});this.content=hs.createElement("div",{className:"highslide-html"},{position:"relative",zIndex:3,height:0,overflow:"hidden"},this.wrapper);this.mediumContent=hs.createElement("div",null,null,this.content,1);this.mediumContent.appendChild(d);hs.setStyles(d,{position:"relative",display:"block",direction:hs.lang.cssDirection||""});if(this.width){d.style.width=this.width+"px"}if(this.height){hs.setStyles(d,{height:this.height+"px",overflow:"hidden"})}if(d.offsetWidth<this.minWidth){d.style.width=this.minWidth+"px"}if(this.objectType=="ajax"&&!hs.getCacheBinding(this.a)){this.showLoading();var c=this;var b=new hs.Ajax(this.a,d);b.src=this.src;b.onLoad=function(){if(hs.expanders[c.key]){c.contentLoaded()}};b.onError=function(){location.href=c.src};b.run()}else{if(this.objectType=="iframe"&&this.objectLoadTime=="before"){this.writeExtendedContent()}else{this.contentLoaded()}}},contentLoaded:function(){try{if(!this.content){return}this.content.onload=null;if(this.onLoadStarted){return}else{this.onLoadStarted=true}var j=this.x,g=this.y;if(this.loading){hs.setStyles(this.loading,{top:"-9999px"});this.loading=null;hs.fireEvent(this,"onHideLoading")}if(this.isImage){j.full=this.content.width;g.full=this.content.height;hs.setStyles(this.content,{width:j.t+"px",height:g.t+"px"});this.wrapper.appendChild(this.content);hs.container.appendChild(this.wrapper)}else{if(this.htmlGetSize){this.htmlGetSize()}}j.calcBorders();g.calcBorders();hs.setStyles(this.wrapper,{left:(j.tpos+j.tb-j.cb)+"px",top:(g.tpos+j.tb-g.cb)+"px"});this.initSlideshow();this.getOverlays();var f=j.full/g.full;j.calcExpanded();this.justify(j);g.calcExpanded();this.justify(g);if(this.isHtml){this.htmlSizeOperations()}if(this.overlayBox){this.sizeOverlayBox(0,1)}if(this.allowSizeReduction){if(this.isImage){this.correctRatio(f)}else{this.fitOverlayBox()}var k=this.slideshow;if(k&&this.last&&k.controls&&k.fixedControls){var h=k.overlayOptions.position||"",a;for(var c in hs.oPos){for(var b=0;b<5;b++){a=this[c];if(h.match(hs.oPos[c][b])){a.pos=this.last[c].pos+(this.last[c].p1-a.p1)+(this.last[c].size-a.size)*[0,0,0.5,1,1][b];if(k.fixedControls=="fit"){if(a.pos+a.size+a.p1+a.p2>a.scroll+a.clientSize-a.marginMax){a.pos=a.scroll+a.clientSize-a.size-a.marginMin-a.marginMax-a.p1-a.p2}if(a.pos<a.scroll+a.marginMin){a.pos=a.scroll+a.marginMin}}}}}}if(this.isImage&&this.x.full>(this.x.imgSize||this.x.size)){this.createFullExpand();if(this.overlays.length==1){this.sizeOverlayBox()}}}this.show()}catch(d){this.error(d)}},setObjContainerSize:function(a,d){var b=hs.getElementByClass(a,"DIV","highslide-body");if(/(iframe|swf)/.test(this.objectType)){if(this.objectWidth){b.style.width=this.objectWidth+"px"}if(this.objectHeight){b.style.height=this.objectHeight+"px"}}},writeExtendedContent:function(){if(this.hasExtendedContent){return}var f=this;this.body=hs.getElementByClass(this.innerContent,"DIV","highslide-body");if(this.objectType=="iframe"){this.showLoading();var g=hs.clearing.cloneNode(1);this.body.appendChild(g);this.newWidth=this.innerContent.offsetWidth;if(!this.objectWidth){this.objectWidth=g.offsetWidth}var c=this.innerContent.offsetHeight-this.body.offsetHeight,d=this.objectHeight||hs.page.height-c-hs.marginTop-hs.marginBottom,e=this.objectLoadTime=="before"?' onload="if (hs.expanders['+this.key+"]) hs.expanders["+this.key+'].contentLoaded()" ':"";this.body.innerHTML+='<iframe name="hs'+(new Date()).getTime()+'" frameborder="0" key="'+this.key+'"  style="width:'+this.objectWidth+"px; height:"+d+'px" '+e+' src="'+this.src+'" ></iframe>';this.ruler=this.body.getElementsByTagName("div")[0];this.iframe=this.body.getElementsByTagName("iframe")[0];if(this.objectLoadTime=="after"){this.correctIframeSize()}}if(this.objectType=="swf"){this.body.id=this.body.id||"hs-flash-id-"+this.key;var b=this.swfOptions;if(!b.params){b.params={}}if(typeof b.params.wmode=="undefined"){b.params.wmode="transparent"}if(swfobject){swfobject.embedSWF(this.src,this.body.id,this.objectWidth,this.objectHeight,b.version||"7",b.expressInstallSwfurl,b.flashvars,b.params,b.attributes)}}this.hasExtendedContent=true},htmlGetSize:function(){if(this.iframe&&!this.objectHeight){this.iframe.style.height=this.body.style.height=this.getIframePageHeight()+"px"}this.innerContent.appendChild(hs.clearing);if(!this.x.full){this.x.full=this.innerContent.offsetWidth}this.y.full=this.innerContent.offsetHeight;this.innerContent.removeChild(hs.clearing);if(hs.ie&&this.newHeight>parseInt(this.innerContent.currentStyle.height)){this.newHeight=parseInt(this.innerContent.currentStyle.height)}hs.setStyles(this.wrapper,{position:"absolute",padding:"0"});hs.setStyles(this.content,{width:this.x.t+"px",height:this.y.t+"px"})},getIframePageHeight:function(){var a;try{var d=this.iDoc=this.iframe.contentDocument||this.iframe.contentWindow.document;var b=d.createElement("div");b.style.clear="both";d.body.appendChild(b);a=b.offsetTop;if(hs.ie){a+=parseInt(d.body.currentStyle.marginTop)+parseInt(d.body.currentStyle.marginBottom)-1}}catch(c){a=300}return a},correctIframeSize:function(){var b=this.innerContent.offsetWidth-this.ruler.offsetWidth;hs.discardElement(this.ruler);if(b<0){b=0}var a=this.innerContent.offsetHeight-this.iframe.offsetHeight;if(this.iDoc&&!this.objectHeight&&!this.height&&this.y.size==this.y.full){try{this.iDoc.body.style.overflow="hidden"}catch(c){}}hs.setStyles(this.iframe,{width:Math.abs(this.x.size-b)+"px",height:Math.abs(this.y.size-a)+"px"});hs.setStyles(this.body,{width:this.iframe.style.width,height:this.iframe.style.height});this.scrollingContent=this.iframe;this.scrollerDiv=this.scrollingContent},htmlSizeOperations:function(){this.setObjContainerSize(this.innerContent);if(this.objectType=="swf"&&this.objectLoadTime=="before"){this.writeExtendedContent()}if(this.x.size<this.x.full&&!this.allowWidthReduction){this.x.size=this.x.full}if(this.y.size<this.y.full&&!this.allowHeightReduction){this.y.size=this.y.full}this.scrollerDiv=this.innerContent;hs.setStyles(this.mediumContent,{position:"relative",width:this.x.size+"px"});hs.setStyles(this.innerContent,{border:"none",width:"auto",height:"auto"});var e=hs.getElementByClass(this.innerContent,"DIV","highslide-body");if(e&&!/(iframe|swf)/.test(this.objectType)){var b=e;e=hs.createElement(b.nodeName,null,{overflow:"hidden"},null,true);b.parentNode.insertBefore(e,b);e.appendChild(hs.clearing);e.appendChild(b);var c=this.innerContent.offsetWidth-e.offsetWidth;var a=this.innerContent.offsetHeight-e.offsetHeight;e.removeChild(hs.clearing);var d=hs.safari||navigator.vendor=="KDE"?1:0;hs.setStyles(e,{width:(this.x.size-c-d)+"px",height:(this.y.size-a)+"px",overflow:"auto",position:"relative"});if(d&&b.offsetHeight>e.offsetHeight){e.style.width=(parseInt(e.style.width)+d)+"px"}this.scrollingContent=e;this.scrollerDiv=this.scrollingContent}if(this.iframe&&this.objectLoadTime=="before"){this.correctIframeSize()}if(!this.scrollingContent&&this.y.size<this.mediumContent.offsetHeight){this.scrollerDiv=this.content}if(this.scrollerDiv==this.content&&!this.allowWidthReduction&&!/(iframe|swf)/.test(this.objectType)){this.x.size+=17}if(this.scrollerDiv&&this.scrollerDiv.offsetHeight>this.scrollerDiv.parentNode.offsetHeight){setTimeout("try { hs.expanders["+this.key+"].scrollerDiv.style.overflow = 'auto'; } catch(e) {}",hs.expandDuration)}},getImageMapAreaCorrection:function(d){var h=d.coords.split(",");for(var b=0;b<h.length;b++){h[b]=parseInt(h[b])}if(d.shape.toLowerCase()=="circle"){this.x.tpos+=h[0]-h[2];this.y.tpos+=h[1]-h[2];this.x.t=this.y.t=2*h[2]}else{var f,e,a=f=h[0],g=e=h[1];for(var b=0;b<h.length;b++){if(b%2==0){a=Math.min(a,h[b]);f=Math.max(f,h[b])}else{g=Math.min(g,h[b]);e=Math.max(e,h[b])}}this.x.tpos+=a;this.x.t=f-a;this.y.tpos+=g;this.y.t=e-g}},justify:function(f,b){var g,h=f.target,e=f==this.x?"x":"y";if(h&&h.match(/ /)){g=h.split(" ");h=g[0]}if(h&&hs.$(h)){f.pos=hs.getPosition(hs.$(h))[e];if(g&&g[1]&&g[1].match(/^[-]?[0-9]+px$/)){f.pos+=parseInt(g[1])}if(f.size<f.minSize){f.size=f.minSize}}else{if(f.justify=="auto"||f.justify=="center"){var d=false;var a=f.exp.allowSizeReduction;if(f.justify=="center"){f.pos=Math.round(f.scroll+(f.clientSize+f.marginMin-f.marginMax-f.get("wsize"))/2)}else{f.pos=Math.round(f.pos-((f.get("wsize")-f.t)/2))}if(f.pos<f.scroll+f.marginMin){f.pos=f.scroll+f.marginMin;d=true}if(!b&&f.size<f.minSize){f.size=f.minSize;a=false}if(f.pos+f.get("wsize")>f.scroll+f.clientSize-f.marginMax){if(!b&&d&&a){f.size=Math.min(f.size,f.get(e=="y"?"fitsize":"maxsize"))}else{if(f.get("wsize")<f.get("fitsize")){f.pos=f.scroll+f.clientSize-f.marginMax-f.get("wsize")}else{f.pos=f.scroll+f.marginMin;if(!b&&a){f.size=f.get(e=="y"?"fitsize":"maxsize")}}}}if(!b&&f.size<f.minSize){f.size=f.minSize;a=false}}else{if(f.justify=="max"){f.pos=Math.floor(f.pos-f.size+f.t)}}}if(f.pos<f.marginMin){var c=f.pos;f.pos=f.marginMin;if(a&&!b){f.size=f.size-(f.pos-c)}}},correctRatio:function(c){var a=this.x,g=this.y,e=false,d=Math.min(a.full,a.size),b=Math.min(g.full,g.size),f=(this.useBox||hs.padToMinWidth);if(d/b>c){d=b*c;if(d<a.minSize){d=a.minSize;b=d/c}e=true}else{if(d/b<c){b=d/c;e=true}}if(hs.padToMinWidth&&a.full<a.minSize){a.imgSize=a.full;g.size=g.imgSize=g.full}else{if(this.useBox){a.imgSize=d;g.imgSize=b}else{a.size=d;g.size=b}}e=this.fitOverlayBox(this.useBox?null:c,e);if(f&&g.size<g.imgSize){g.imgSize=g.size;a.imgSize=g.size*c}if(e||f){a.pos=a.tpos-a.cb+a.tb;a.minSize=a.size;this.justify(a,true);g.pos=g.tpos-g.cb+g.tb;g.minSize=g.size;this.justify(g,true);if(this.overlayBox){this.sizeOverlayBox()}}},fitOverlayBox:function(b,c){var a=this.x,d=this.y;if(this.overlayBox&&(this.isImage||this.allowHeightReduction)){while(d.size>this.minHeight&&a.size>this.minWidth&&d.get("wsize")>d.get("fitsize")){d.size-=10;if(b){a.size=d.size*b}this.sizeOverlayBox(0,1);c=true}}return c},reflow:function(){if(this.scrollerDiv){var a=/iframe/i.test(this.scrollerDiv.tagName)?(this.getIframePageHeight()+1)+"px":"auto";if(this.body){this.body.style.height=a}this.scrollerDiv.style.height=a;this.y.setSize(this.innerContent.offsetHeight)}},show:function(){var a=this.x,b=this.y;this.doShowHide("hidden");hs.fireEvent(this,"onBeforeExpand");if(this.slideshow&&this.slideshow.thumbstrip){this.slideshow.thumbstrip.selectThumb()}this.changeSize(1,{wrapper:{width:a.get("wsize"),height:b.get("wsize"),left:a.pos,top:b.pos},content:{left:a.p1+a.get("imgPad"),top:b.p1+b.get("imgPad"),width:a.imgSize||a.size,height:b.imgSize||b.size}},hs.expandDuration)},changeSize:function(d,i,b){var k=this.transitions,e=d?(this.last?this.last.a:null):hs.upcoming,j=(k[1]&&e&&hs.getParam(e,"transitions")[1]==k[1])?k[1]:k[0];if(this[j]&&j!="expand"){this[j](d,i);return}if(this.outline&&!this.outlineWhileAnimating){if(d){this.outline.setPosition()}else{this.outline.destroy((this.isHtml&&this.preserveContent))}}if(!d){this.destroyOverlays()}var c=this,h=c.x,g=c.y,f=this.easing;if(!d){f=this.easingClose||f}var a=d?function(){if(c.outline){c.outline.table.style.visibility="visible"}setTimeout(function(){c.afterExpand()},50)}:function(){c.afterClose()};if(d){hs.setStyles(this.wrapper,{width:h.t+"px",height:g.t+"px"})}if(d&&this.isHtml){hs.setStyles(this.wrapper,{left:(h.tpos-h.cb+h.tb)+"px",top:(g.tpos-g.cb+g.tb)+"px"})}if(this.fadeInOut){hs.setStyles(this.wrapper,{opacity:d?0:1});hs.extend(i.wrapper,{opacity:d})}hs.animate(this.wrapper,i.wrapper,{duration:b,easing:f,step:function(n,l){if(c.outline&&c.outlineWhileAnimating&&l.prop=="top"){var m=d?l.pos:1-l.pos;var o={w:h.t+(h.get("wsize")-h.t)*m,h:g.t+(g.get("wsize")-g.t)*m,x:h.tpos+(h.pos-h.tpos)*m,y:g.tpos+(g.pos-g.tpos)*m};c.outline.setPosition(o,0,1)}if(c.isHtml){if(l.prop=="left"){c.mediumContent.style.left=(h.pos-n)+"px"}if(l.prop=="top"){c.mediumContent.style.top=(g.pos-n)+"px"}}}});hs.animate(this.content,i.content,b,f,a);if(d){this.wrapper.style.visibility="visible";this.content.style.visibility="visible";if(this.isHtml){this.innerContent.style.visibility="visible"}this.a.className+=" highslide-active-anchor"}},fade:function(f,h){this.outlineWhileAnimating=false;var c=this,j=f?hs.expandDuration:0;if(f){hs.animate(this.wrapper,h.wrapper,0);hs.setStyles(this.wrapper,{opacity:0,visibility:"visible"});hs.animate(this.content,h.content,0);this.content.style.visibility="visible";hs.animate(this.wrapper,{opacity:1},j,null,function(){c.afterExpand()})}if(this.outline){this.outline.table.style.zIndex=this.wrapper.style.zIndex;var b=f||-1,d=this.outline.offset,a=f?3:d,g=f?d:3;for(var e=a;b*e<=b*g;e+=b,j+=25){(function(){var i=f?g-e:a-e;setTimeout(function(){c.outline.setPosition(0,i,1)},j)})()}}if(f){}else{setTimeout(function(){if(c.outline){c.outline.destroy(c.preserveContent)}c.destroyOverlays();hs.animate(c.wrapper,{opacity:0},hs.restoreDuration,null,function(){c.afterClose()})},j)}},crossfade:function(g,m,o){if(!g){return}var f=this,p=this.last,l=this.x,k=this.y,d=p.x,b=p.y,a=this.wrapper,i=this.content,c=this.overlayBox;hs.removeEventListener(document,"mousemove",hs.dragHandler);hs.setStyles(i,{width:(l.imgSize||l.size)+"px",height:(k.imgSize||k.size)+"px"});if(c){c.style.overflow="visible"}this.outline=p.outline;if(this.outline){this.outline.exp=f}p.outline=null;var h=hs.createElement("div",{className:"highslide-"+this.contentType},{position:"absolute",zIndex:4,overflow:"hidden",display:"none"});var j={oldImg:p,newImg:this};for(var e in j){this[e]=j[e].content.cloneNode(1);hs.setStyles(this[e],{position:"absolute",border:0,visibility:"visible"});h.appendChild(this[e])}a.appendChild(h);if(this.isHtml){hs.setStyles(this.mediumContent,{left:0,top:0})}if(c){c.className="";a.appendChild(c)}h.style.display="";p.content.style.display="none";if(hs.safari&&hs.uaVersion<525){this.wrapper.style.visibility="visible"}hs.animate(a,{width:l.size},{duration:hs.transitionDuration,step:function(u,r){var x=r.pos,q=1-x;var w,s={},t=["pos","size","p1","p2"];for(var v in t){w=t[v];s["x"+w]=Math.round(q*d[w]+x*l[w]);s["y"+w]=Math.round(q*b[w]+x*k[w]);s.ximgSize=Math.round(q*(d.imgSize||d.size)+x*(l.imgSize||l.size));s.ximgPad=Math.round(q*d.get("imgPad")+x*l.get("imgPad"));s.yimgSize=Math.round(q*(b.imgSize||b.size)+x*(k.imgSize||k.size));s.yimgPad=Math.round(q*b.get("imgPad")+x*k.get("imgPad"))}if(f.outline){f.outline.setPosition({x:s.xpos,y:s.ypos,w:s.xsize+s.xp1+s.xp2+2*l.cb,h:s.ysize+s.yp1+s.yp2+2*k.cb})}p.wrapper.style.clip="rect("+(s.ypos-b.pos)+"px, "+(s.xsize+s.xp1+s.xp2+s.xpos+2*d.cb-d.pos)+"px, "+(s.ysize+s.yp1+s.yp2+s.ypos+2*b.cb-b.pos)+"px, "+(s.xpos-d.pos)+"px)";hs.setStyles(i,{top:(s.yp1+k.get("imgPad"))+"px",left:(s.xp1+l.get("imgPad"))+"px",marginTop:(k.pos-s.ypos)+"px",marginLeft:(l.pos-s.xpos)+"px"});hs.setStyles(a,{top:s.ypos+"px",left:s.xpos+"px",width:(s.xp1+s.xp2+s.xsize+2*l.cb)+"px",height:(s.yp1+s.yp2+s.ysize+2*k.cb)+"px"});hs.setStyles(h,{width:(s.ximgSize||s.xsize)+"px",height:(s.yimgSize||s.ysize)+"px",left:(s.xp1+s.ximgPad)+"px",top:(s.yp1+s.yimgPad)+"px",visibility:"visible"});hs.setStyles(f.oldImg,{top:(b.pos-s.ypos+b.p1-s.yp1+b.get("imgPad")-s.yimgPad)+"px",left:(d.pos-s.xpos+d.p1-s.xp1+d.get("imgPad")-s.ximgPad)+"px"});hs.setStyles(f.newImg,{opacity:x,top:(k.pos-s.ypos+k.p1-s.yp1+k.get("imgPad")-s.yimgPad)+"px",left:(l.pos-s.xpos+l.p1-s.xp1+l.get("imgPad")-s.ximgPad)+"px"});if(c){hs.setStyles(c,{width:s.xsize+"px",height:s.ysize+"px",left:(s.xp1+l.cb)+"px",top:(s.yp1+k.cb)+"px"})}},complete:function(){a.style.visibility=i.style.visibility="visible";i.style.display="block";hs.discardElement(h);f.afterExpand();p.afterClose();f.last=null}})},reuseOverlay:function(d,c){if(!this.last){return false}for(var b=0;b<this.last.overlays.length;b++){var a=hs.$("hsId"+this.last.overlays[b]);if(a&&a.hsId==d.hsId){this.genOverlayBox();a.reuse=this.key;hs.push(this.overlays,this.last.overlays[b]);return true}}return false},afterExpand:function(){this.isExpanded=true;this.focus();if(this.isHtml&&this.objectLoadTime=="after"){this.writeExtendedContent()}if(this.iframe){try{var g=this,f=this.iframe.contentDocument||this.iframe.contentWindow.document;hs.addEventListener(f,"mousedown",function(){if(hs.focusKey!=g.key){g.focus()}})}catch(d){}if(hs.ie&&typeof this.isClosing!="boolean"){this.iframe.style.width=(this.objectWidth-1)+"px"}}if(this.dimmingOpacity){hs.dim(this)}if(hs.upcoming&&hs.upcoming==this.a){hs.upcoming=null}this.prepareNextOutline();var c=hs.page,b=hs.mouse.x+c.scrollLeft,a=hs.mouse.y+c.scrollTop;this.mouseIsOver=this.x.pos<b&&b<this.x.pos+this.x.get("wsize")&&this.y.pos<a&&a<this.y.pos+this.y.get("wsize");if(this.overlayBox){this.showOverlays()}hs.fireEvent(this,"onAfterExpand")},prepareNextOutline:function(){var a=this.key;var b=this.outlineType;new hs.Outline(b,function(){try{hs.expanders[a].preloadNext()}catch(c){}})},preloadNext:function(){var b=this.getAdjacentAnchor(1);if(b&&b.onclick.toString().match(/hs\.expand/)){var a=hs.createElement("img",{src:hs.getSrc(b)})}},getAdjacentAnchor:function(c){var b=this.getAnchorIndex(),a=hs.anchors.groups[this.slideshowGroup||"none"];if(a&&!a[b+c]&&this.slideshow&&this.slideshow.repeat){if(c==1){return a[0]}else{if(c==-1){return a[a.length-1]}}}return(a&&a[b+c])||null},getAnchorIndex:function(){var a=hs.getAnchors().groups[this.slideshowGroup||"none"];if(a){for(var b=0;b<a.length;b++){if(a[b]==this.a){return b}}}return null},getNumber:function(){if(this[this.numberPosition]){var a=hs.anchors.groups[this.slideshowGroup||"none"];if(a){var b=hs.lang.number.replace("%1",this.getAnchorIndex()+1).replace("%2",a.length);this[this.numberPosition].innerHTML='<div class="highslide-number">'+b+"</div>"+this[this.numberPosition].innerHTML}}},initSlideshow:function(){if(!this.last){for(var c=0;c<hs.slideshows.length;c++){var b=hs.slideshows[c],d=b.slideshowGroup;if(typeof d=="undefined"||d===null||d===this.slideshowGroup){this.slideshow=new hs.Slideshow(this.key,b)}}}else{this.slideshow=this.last.slideshow}var b=this.slideshow;if(!b){return}var a=b.expKey=this.key;b.checkFirstAndLast();b.disable("full-expand");if(b.controls){this.createOverlay(hs.extend(b.overlayOptions||{},{overlayId:b.controls,hsId:"controls",zIndex:5}))}if(b.thumbstrip){b.thumbstrip.add(this)}if(!this.last&&this.autoplay){b.play(true)}if(b.autoplay){b.autoplay=setTimeout(function(){hs.next(a)},(b.interval||500))}},cancelLoading:function(){hs.discardElement(this.wrapper);hs.expanders[this.key]=null;if(hs.upcoming==this.a){hs.upcoming=null}hs.undim(this.key);if(this.loading){hs.loading.style.left="-9999px"}hs.fireEvent(this,"onHideLoading")},writeCredits:function(){if(this.credits){return}this.credits=hs.createElement("a",{href:hs.creditsHref,target:hs.creditsTarget,className:"highslide-credits",innerHTML:hs.lang.creditsText,title:hs.lang.creditsTitle});this.createOverlay({overlayId:this.credits,position:this.creditsPosition||"top left",hsId:"credits"})},getInline:function(types,addOverlay){for(var i=0;i<types.length;i++){var type=types[i],s=null;if(type=="caption"&&!hs.fireEvent(this,"onBeforeGetCaption")){return}else{if(type=="heading"&&!hs.fireEvent(this,"onBeforeGetHeading")){return}}if(!this[type+"Id"]&&this.thumbsUserSetId){this[type+"Id"]=type+"-for-"+this.thumbsUserSetId}if(this[type+"Id"]){this[type]=hs.getNode(this[type+"Id"])}if(!this[type]&&!this[type+"Text"]&&this[type+"Eval"]){try{s=eval(this[type+"Eval"])}catch(e){}}if(!this[type]&&this[type+"Text"]){s=this[type+"Text"]}if(!this[type]&&!s){this[type]=hs.getNode(this.a["_"+type+"Id"]);if(!this[type]){var next=this.a.nextSibling;while(next&&!hs.isHsAnchor(next)){if((new RegExp("highslide-"+type)).test(next.className||null)){if(!next.id){this.a["_"+type+"Id"]=next.id="hsId"+hs.idCounter++}this[type]=hs.getNode(next.id);break}next=next.nextSibling}}}if(!this[type]&&!s&&this.numberPosition==type){s="\n"}if(!this[type]&&s){this[type]=hs.createElement("div",{className:"highslide-"+type,innerHTML:s})}if(addOverlay&&this[type]){var o={position:(type=="heading")?"above":"below"};for(var x in this[type+"Overlay"]){o[x]=this[type+"Overlay"][x]}o.overlayId=this[type];this.createOverlay(o)}}},doShowHide:function(a){if(hs.hideSelects){this.showHideElements("SELECT",a)}if(hs.hideIframes){this.showHideElements("IFRAME",a)}if(hs.geckoMac){this.showHideElements("*",a)}},showHideElements:function(c,b){var e=document.getElementsByTagName(c);var a=c=="*"?"overflow":"visibility";for(var f=0;f<e.length;f++){if(a=="visibility"||(document.defaultView.getComputedStyle(e[f],"").getPropertyValue("overflow")=="auto"||e[f].getAttribute("hidden-by")!=null)){var h=e[f].getAttribute("hidden-by");if(b=="visible"&&h){h=h.replace("["+this.key+"]","");e[f].setAttribute("hidden-by",h);if(!h){e[f].style[a]=e[f].origProp}}else{if(b=="hidden"){var k=hs.getPosition(e[f]);k.w=e[f].offsetWidth;k.h=e[f].offsetHeight;if(!this.dimmingOpacity){var j=(k.x+k.w<this.x.get("opos")||k.x>this.x.get("opos")+this.x.get("osize"));var g=(k.y+k.h<this.y.get("opos")||k.y>this.y.get("opos")+this.y.get("osize"))}var d=hs.getWrapperKey(e[f]);if(!j&&!g&&d!=this.key){if(!h){e[f].setAttribute("hidden-by","["+this.key+"]");e[f].origProp=e[f].style[a];e[f].style[a]="hidden"}else{if(h.indexOf("["+this.key+"]")==-1){e[f].setAttribute("hidden-by",h+"["+this.key+"]")}}}else{if((h=="["+this.key+"]"||hs.focusKey==d)&&d!=this.key){e[f].setAttribute("hidden-by","");e[f].style[a]=e[f].origProp||""}else{if(h&&h.indexOf("["+this.key+"]")>-1){e[f].setAttribute("hidden-by",h.replace("["+this.key+"]",""))}}}}}}}},focus:function(){this.wrapper.style.zIndex=hs.zIndexCounter+=2;for(var a=0;a<hs.expanders.length;a++){if(hs.expanders[a]&&a==hs.focusKey){var b=hs.expanders[a];b.content.className+=" highslide-"+b.contentType+"-blur";if(b.isImage){b.content.style.cursor=hs.ieLt7?"hand":"pointer";b.content.title=hs.lang.focusTitle}hs.fireEvent(b,"onBlur")}}if(this.outline){this.outline.table.style.zIndex=this.wrapper.style.zIndex-1}this.content.className="highslide-"+this.contentType;if(this.isImage){this.content.title=hs.lang.restoreTitle;if(hs.restoreCursor){hs.styleRestoreCursor=window.opera?"pointer":"url("+hs.graphicsDir+hs.restoreCursor+"), pointer";if(hs.ieLt7&&hs.uaVersion<6){hs.styleRestoreCursor="hand"}this.content.style.cursor=hs.styleRestoreCursor}}hs.focusKey=this.key;hs.addEventListener(document,window.opera?"keypress":"keydown",hs.keyHandler);hs.fireEvent(this,"onFocus")},moveTo:function(a,b){this.x.setPos(a);this.y.setPos(b)},resize:function(d){var a,b,c=d.width/d.height;a=Math.max(d.width+d.dX,Math.min(this.minWidth,this.x.full));if(this.isImage&&Math.abs(a-this.x.full)<12){a=this.x.full}b=this.isHtml?d.height+d.dY:a/c;if(b<Math.min(this.minHeight,this.y.full)){b=Math.min(this.minHeight,this.y.full);if(this.isImage){a=b*c}}this.resizeTo(a,b)},resizeTo:function(a,b){this.y.setSize(b);this.x.setSize(a);this.wrapper.style.height=this.y.get("wsize")+"px"},close:function(){if(this.isClosing||!this.isExpanded){return}if(this.transitions[1]=="crossfade"&&hs.upcoming){hs.getExpander(hs.upcoming).cancelLoading();hs.upcoming=null}if(!hs.fireEvent(this,"onBeforeClose")){return}this.isClosing=true;if(this.slideshow&&!hs.upcoming){this.slideshow.pause()}hs.removeEventListener(document,window.opera?"keypress":"keydown",hs.keyHandler);try{if(this.isHtml){this.htmlPrepareClose()}this.content.style.cursor="default";this.changeSize(0,{wrapper:{width:this.x.t,height:this.y.t,left:this.x.tpos-this.x.cb+this.x.tb,top:this.y.tpos-this.y.cb+this.y.tb},content:{left:0,top:0,width:this.x.t,height:this.y.t}},hs.restoreDuration)}catch(a){this.afterClose()}},htmlPrepareClose:function(){if(hs.geckoMac){if(!hs.mask){hs.mask=hs.createElement("div",null,{position:"absolute"},hs.container)}hs.setStyles(hs.mask,{width:this.x.size+"px",height:this.y.size+"px",left:this.x.pos+"px",top:this.y.pos+"px",display:"block"})}if(this.objectType=="swf"){try{hs.$(this.body.id).StopPlay()}catch(a){}}if(this.objectLoadTime=="after"&&!this.preserveContent){this.destroyObject()}if(this.scrollerDiv&&this.scrollerDiv!=this.scrollingContent){this.scrollerDiv.style.overflow="hidden"}},destroyObject:function(){if(hs.ie&&this.iframe){try{this.iframe.contentWindow.document.body.innerHTML=""}catch(a){}}if(this.objectType=="swf"){swfobject.removeSWF(this.body.id)}this.body.innerHTML=""},sleep:function(){if(this.outline){this.outline.table.style.display="none"}this.releaseMask=null;this.wrapper.style.display="none";this.isExpanded=false;hs.push(hs.sleeping,this)},awake:function(){try{hs.expanders[this.key]=this;if(!hs.allowMultipleInstances&&hs.focusKey!=this.key){try{hs.expanders[hs.focusKey].close()}catch(b){}}var d=hs.zIndexCounter++,a={display:"",zIndex:d};hs.setStyles(this.wrapper,a);this.isClosing=false;var c=this.outline||0;if(c){if(!this.outlineWhileAnimating){a.visibility="hidden"}hs.setStyles(c.table,a)}if(this.slideshow){this.initSlideshow()}this.show()}catch(b){}},createOverlay:function(e){var d=e.overlayId,a=(e.relativeTo=="viewport"&&!/panel$/.test(e.position));if(typeof d=="string"){d=hs.getNode(d)}if(e.html){d=hs.createElement("div",{innerHTML:e.html})}if(!d||typeof d=="string"){return}if(!hs.fireEvent(this,"onCreateOverlay",{overlay:d})){return}d.style.display="block";e.hsId=e.hsId||e.overlayId;if(this.transitions[1]=="crossfade"&&this.reuseOverlay(e,d)){return}this.genOverlayBox();var c=e.width&&/^[0-9]+(px|%)$/.test(e.width)?e.width:"auto";if(/^(left|right)panel$/.test(e.position)&&!/^[0-9]+px$/.test(e.width)){c="200px"}var b=hs.createElement("div",{id:"hsId"+hs.idCounter++,hsId:e.hsId},{position:"absolute",visibility:"hidden",width:c,direction:hs.lang.cssDirection||"",opacity:0},a?hs.viewport:this.overlayBox,true);if(a){b.hsKey=this.key}b.appendChild(d);hs.extend(b,{opacity:1,offsetX:0,offsetY:0,dur:(e.fade===0||e.fade===false||(e.fade==2&&hs.ie))?0:250});hs.extend(b,e);if(this.gotOverlays){this.positionOverlay(b);if(!b.hideOnMouseOut||this.mouseIsOver){hs.animate(b,{opacity:b.opacity},b.dur)}}hs.push(this.overlays,hs.idCounter-1)},positionOverlay:function(e){var f=e.position||"middle center",c=(e.relativeTo=="viewport"),b=e.offsetX,a=e.offsetY;if(c){hs.viewport.style.display="block";e.hsKey=this.key;if(e.offsetWidth>e.parentNode.offsetWidth){e.style.width="100%"}}else{if(e.parentNode!=this.overlayBox){this.overlayBox.appendChild(e)}}if(/left$/.test(f)){e.style.left=b+"px"}if(/center$/.test(f)){hs.setStyles(e,{left:"50%",marginLeft:(b-Math.round(e.offsetWidth/2))+"px"})}if(/right$/.test(f)){e.style.right=-b+"px"}if(/^leftpanel$/.test(f)){hs.setStyles(e,{right:"100%",marginRight:this.x.cb+"px",top:-this.y.cb+"px",bottom:-this.y.cb+"px",overflow:"auto"});this.x.p1=e.offsetWidth}else{if(/^rightpanel$/.test(f)){hs.setStyles(e,{left:"100%",marginLeft:this.x.cb+"px",top:-this.y.cb+"px",bottom:-this.y.cb+"px",overflow:"auto"});this.x.p2=e.offsetWidth}}var d=e.parentNode.offsetHeight;e.style.height="auto";if(c&&e.offsetHeight>d){e.style.height=hs.ieLt7?d+"px":"100%"}if(/^top/.test(f)){e.style.top=a+"px"}if(/^middle/.test(f)){hs.setStyles(e,{top:"50%",marginTop:(a-Math.round(e.offsetHeight/2))+"px"})}if(/^bottom/.test(f)){e.style.bottom=-a+"px"}if(/^above$/.test(f)){hs.setStyles(e,{left:(-this.x.p1-this.x.cb)+"px",right:(-this.x.p2-this.x.cb)+"px",bottom:"100%",marginBottom:this.y.cb+"px",width:"auto"});this.y.p1=e.offsetHeight}else{if(/^below$/.test(f)){hs.setStyles(e,{position:"relative",left:(-this.x.p1-this.x.cb)+"px",right:(-this.x.p2-this.x.cb)+"px",top:"100%",marginTop:this.y.cb+"px",width:"auto"});this.y.p2=e.offsetHeight;e.style.position="absolute"}}},getOverlays:function(){this.getInline(["heading","caption"],true);this.getNumber();if(this.caption){hs.fireEvent(this,"onAfterGetCaption")}if(this.heading){hs.fireEvent(this,"onAfterGetHeading")}if(this.heading&&this.dragByHeading){this.heading.className+=" highslide-move"}if(hs.showCredits){this.writeCredits()}for(var a=0;a<hs.overlays.length;a++){var d=hs.overlays[a],e=d.thumbnailId,b=d.slideshowGroup;if((!e&&!b)||(e&&e==this.thumbsUserSetId)||(b&&b===this.slideshowGroup)){if(this.isImage||(this.isHtml&&d.useOnHtml)){this.createOverlay(d)}}}var c=[];for(var a=0;a<this.overlays.length;a++){var d=hs.$("hsId"+this.overlays[a]);if(/panel$/.test(d.position)){this.positionOverlay(d)}else{hs.push(c,d)}}for(var a=0;a<c.length;a++){this.positionOverlay(c[a])}this.gotOverlays=true},genOverlayBox:function(){if(!this.overlayBox){this.overlayBox=hs.createElement("div",{className:this.wrapperClassName},{position:"absolute",width:(this.x.size||(this.useBox?this.width:null)||this.x.full)+"px",height:(this.y.size||this.y.full)+"px",visibility:"hidden",overflow:"hidden",zIndex:hs.ie?4:"auto"},hs.container,true)}},sizeOverlayBox:function(f,d){var c=this.overlayBox,a=this.x,h=this.y;hs.setStyles(c,{width:a.size+"px",height:h.size+"px"});if(f||d){for(var e=0;e<this.overlays.length;e++){var g=hs.$("hsId"+this.overlays[e]);var b=(hs.ieLt7||document.compatMode=="BackCompat");if(g&&/^(above|below)$/.test(g.position)){if(b){g.style.width=(c.offsetWidth+2*a.cb+a.p1+a.p2)+"px"}h[g.position=="above"?"p1":"p2"]=g.offsetHeight}if(g&&b&&/^(left|right)panel$/.test(g.position)){g.style.height=(c.offsetHeight+2*h.cb)+"px"}}}if(f){hs.setStyles(this.content,{top:h.p1+"px"});hs.setStyles(c,{top:(h.p1+h.cb)+"px"})}},showOverlays:function(){var a=this.overlayBox;a.className="";hs.setStyles(a,{top:(this.y.p1+this.y.cb)+"px",left:(this.x.p1+this.x.cb)+"px",overflow:"visible"});if(hs.safari){a.style.visibility="visible"}this.wrapper.appendChild(a);for(var c=0;c<this.overlays.length;c++){var d=hs.$("hsId"+this.overlays[c]);d.style.zIndex=d.zIndex||4;if(!d.hideOnMouseOut||this.mouseIsOver){d.style.visibility="visible";hs.setStyles(d,{visibility:"visible",display:""});hs.animate(d,{opacity:d.opacity},d.dur)}}},destroyOverlays:function(){if(!this.overlays.length){return}if(this.slideshow){var d=this.slideshow.controls;if(d&&hs.getExpander(d)==this){d.parentNode.removeChild(d)}}for(var a=0;a<this.overlays.length;a++){var b=hs.$("hsId"+this.overlays[a]);if(b&&b.parentNode==hs.viewport&&hs.getExpander(b)==this){hs.discardElement(b)}}if(this.isHtml&&this.preserveContent){this.overlayBox.style.top="-9999px";hs.container.appendChild(this.overlayBox)}else{hs.discardElement(this.overlayBox)}},createFullExpand:function(){if(this.slideshow&&this.slideshow.controls){this.slideshow.enable("full-expand");return}this.fullExpandLabel=hs.createElement("a",{href:"javascript:hs.expanders["+this.key+"].doFullExpand();",title:hs.lang.fullExpandTitle,className:"highslide-full-expand"});if(!hs.fireEvent(this,"onCreateFullExpand")){return}this.createOverlay({overlayId:this.fullExpandLabel,position:hs.fullExpandPosition,hideOnMouseOut:true,opacity:hs.fullExpandOpacity})},doFullExpand:function(){try{if(!hs.fireEvent(this,"onDoFullExpand")){return}if(this.fullExpandLabel){hs.discardElement(this.fullExpandLabel)}this.focus();var b=this.x.size;this.resizeTo(this.x.full,this.y.full);var a=this.x.pos-(this.x.size-b)/2;if(a<hs.marginLeft){a=hs.marginLeft}this.moveTo(a,this.y.pos);this.doShowHide("hidden")}catch(c){this.error(c)}},afterClose:function(){this.a.className=this.a.className.replace("highslide-active-anchor","");this.doShowHide("visible");if(this.isHtml&&this.preserveContent&&this.transitions[1]!="crossfade"){this.sleep()}else{if(this.outline&&this.outlineWhileAnimating){this.outline.destroy()}hs.discardElement(this.wrapper)}if(hs.mask){hs.mask.style.display="none"}this.destroyOverlays();if(!hs.viewport.childNodes.length){hs.viewport.style.display="none"}if(this.dimmingOpacity){hs.undim(this.key)}hs.fireEvent(this,"onAfterClose");hs.expanders[this.key]=null;hs.reOrder()}};hs.Ajax=function(b,c,d){this.a=b;this.content=c;this.pre=d};hs.Ajax.prototype={run:function(){var d;if(!this.src){this.src=hs.getSrc(this.a)}if(this.src.match("#")){var a=this.src.split("#");this.src=a[0];this.id=a[1]}if(hs.cachedGets[this.src]){this.cachedGet=hs.cachedGets[this.src];if(this.id){this.getElementContent()}else{this.loadHTML()}return}try{d=new XMLHttpRequest()}catch(b){try{d=new ActiveXObject("Msxml2.XMLHTTP")}catch(b){try{d=new ActiveXObject("Microsoft.XMLHTTP")}catch(b){this.onError()}}}var f=this;d.onreadystatechange=function(){if(f.xhr.readyState==4){if(f.id){f.getElementContent()}else{f.loadHTML()}}};var c=this.src;this.xhr=d;if(hs.forceAjaxReload){c=c.replace(/$/,(/\?/.test(c)?"&":"?")+"dummy="+(new Date()).getTime())}d.open("GET",c,true);d.setRequestHeader("X-Requested-With","XMLHttpRequest");d.setRequestHeader("Content-Type","application/x-www-form-urlencoded");d.send(null)},getElementContent:function(){hs.init();var a=window.opera||hs.ie6SSL?{src:"about:blank"}:null;this.iframe=hs.createElement("iframe",a,{position:"absolute",top:"-9999px"},hs.container);this.loadHTML()},loadHTML:function(){var c=this.cachedGet||this.xhr.responseText,b;if(this.pre){hs.cachedGets[this.src]=c}if(!hs.ie||hs.uaVersion>=5.5){c=c.replace(new RegExp("<link[^>]*>","gi"),"").replace(new RegExp("<script[^>]*>.*?<\/script>","gi"),"");if(this.iframe){var f=this.iframe.contentDocument;if(!f&&this.iframe.contentWindow){f=this.iframe.contentWindow.document}if(!f){var g=this;setTimeout(function(){g.loadHTML()},25);return}f.open();f.write(c);f.close();try{c=f.getElementById(this.id).innerHTML}catch(d){try{c=this.iframe.document.getElementById(this.id).innerHTML}catch(d){}}hs.discardElement(this.iframe)}else{b=/(<body[^>]*>|<\/body>)/ig;if(b.test(c)){c=c.split(b)[hs.ieLt9?1:2]}}}hs.getElementByClass(this.content,"DIV","highslide-body").innerHTML=c;this.onLoad();for(var a in this){this[a]=null}}};hs.Slideshow=function(c,b){if(hs.dynamicallyUpdateAnchors!==false){hs.updateAnchors()}this.expKey=c;for(var a in b){this[a]=b[a]}if(this.useControls){this.getControls()}if(this.thumbstrip){this.thumbstrip=hs.Thumbstrip(this)}};hs.Slideshow.prototype={getControls:function(){this.controls=hs.createElement("div",{innerHTML:hs.replaceLang(hs.skin.controls)},null,hs.container);var b=["play","pause","previous","next","move","full-expand","close"];this.btn={};var c=this;for(var a=0;a<b.length;a++){this.btn[b[a]]=hs.getElementByClass(this.controls,"li","highslide-"+b[a]);this.enable(b[a])}this.btn.pause.style.display="none"},checkFirstAndLast:function(){if(this.repeat||!this.controls){return}var c=hs.expanders[this.expKey],b=c.getAnchorIndex(),a=/disabled$/;if(b==0){this.disable("previous")}else{if(a.test(this.btn.previous.getElementsByTagName("a")[0].className)){this.enable("previous")}}if(b+1==hs.anchors.groups[c.slideshowGroup||"none"].length){this.disable("next");this.disable("play")}else{if(a.test(this.btn.next.getElementsByTagName("a")[0].className)){this.enable("next");this.enable("play")}}},enable:function(d){if(!this.btn){return}var c=this,b=this.btn[d].getElementsByTagName("a")[0],e=/disabled$/;b.onclick=function(){c[d]();return false};if(e.test(b.className)){b.className=b.className.replace(e,"")}},disable:function(c){if(!this.btn){return}var b=this.btn[c].getElementsByTagName("a")[0];b.onclick=function(){return false};if(!/disabled$/.test(b.className)){b.className+=" disabled"}},hitSpace:function(){if(this.autoplay){this.pause()}else{this.play()}},play:function(a){if(this.btn){this.btn.play.style.display="none";this.btn.pause.style.display=""}this.autoplay=true;if(!a){hs.next(this.expKey)}},pause:function(){if(this.btn){this.btn.pause.style.display="none";this.btn.play.style.display=""}clearTimeout(this.autoplay);this.autoplay=null},previous:function(){this.pause();hs.previous(this.btn.previous)},next:function(){this.pause();hs.next(this.btn.next)},move:function(){},"full-expand":function(){hs.getExpander().doFullExpand()},close:function(){hs.close(this.btn.close)}};hs.Thumbstrip=function(k){function p(i){hs.extend(f||{},{overlayId:r,hsId:"thumbstrip",className:"highslide-thumbstrip-"+m+"-overlay "+(f.className||"")});if(hs.ieLt7){f.fade=0}i.createOverlay(f);hs.setStyles(r.parentNode,{overflow:"hidden"})}function c(i){d(undefined,Math.round(i*r[h?"offsetWidth":"offsetHeight"]*0.7))}function d(L,M){if(L===undefined){for(var K=0;K<j.length;K++){if(j[K]==hs.expanders[k.expKey].a){L=K;break}}}if(L===undefined){return}var G=r.getElementsByTagName("a"),z=G[L],w=z.parentNode,y=h?"Left":"Top",N=h?"Right":"Bottom",I=h?"Width":"Height",B="offset"+y,H="offset"+I,x=n.parentNode.parentNode[H],F=x-s[H],v=parseInt(s.style[h?"left":"top"])||0,C=v,D=20;if(M!==undefined){C=v-M;if(F>0){F=0}if(C>0){C=0}if(C<F){C=F}}else{for(var K=0;K<G.length;K++){G[K].className=""}z.className="highslide-active-anchor";var J=L>0?G[L-1].parentNode[B]:w[B],A=w[B]+w[H]+(G[L+1]?G[L+1].parentNode[H]:0);if(A>x-v){C=x-A}else{if(J<-v){C=-J}}}var E=w[B]+(w[H]-g[H])/2+C;hs.animate(s,h?{left:C}:{top:C},null,"easeOutQuad");hs.animate(g,h?{left:E}:{top:E},null,"easeOutQuad");l.style.display=C<0?"block":"none";t.style.display=(C>F)?"block":"none"}var j=hs.anchors.groups[hs.expanders[k.expKey].slideshowGroup||"none"],f=k.thumbstrip,m=f.mode||"horizontal",u=(m=="float"),o=u?["div","ul","li","span"]:["table","tbody","tr","td"],h=(m=="horizontal"),r=hs.createElement("div",{className:"highslide-thumbstrip highslide-thumbstrip-"+m,innerHTML:'<div class="highslide-thumbstrip-inner"><'+o[0]+"><"+o[1]+"></"+o[1]+"></"+o[0]+'></div><div class="highslide-scroll-up"><div></div></div><div class="highslide-scroll-down"><div></div></div><div class="highslide-marker"><div></div></div>'},{display:"none"},hs.container),e=r.childNodes,n=e[0],l=e[1],t=e[2],g=e[3],s=n.firstChild,a=r.getElementsByTagName(o[1])[0],b;for(var q=0;q<j.length;q++){if(q==0||!h){b=hs.createElement(o[2],null,null,a)}(function(){var v=j[q],i=hs.createElement(o[3],null,null,b),w=q;hs.createElement("a",{href:v.href,onclick:function(){if(/highslide-active-anchor/.test(this.className)){return false}hs.getExpander(this).focus();return hs.transit(v)},innerHTML:hs.stripItemFormatter?hs.stripItemFormatter(v):v.innerHTML},null,i)})()}if(!u){l.onclick=function(){c(-1)};t.onclick=function(){c(1)};hs.addEventListener(a,document.onmousewheel!==undefined?"mousewheel":"DOMMouseScroll",function(i){var v=0;i=i||window.event;if(i.wheelDelta){v=i.wheelDelta/120;if(hs.opera){v=-v}}else{if(i.detail){v=-i.detail/3}}if(v){c(-v*0.2)}if(i.preventDefault){i.preventDefault()}i.returnValue=false})}return{add:p,selectThumb:d}};hs.langDefaults=hs.lang;var HsExpander=hs.Expander;if(hs.ie&&window==window.top){(function(){try{document.documentElement.doScroll("left")}catch(a){setTimeout(arguments.callee,50);return}hs.ready()})()}hs.addEventListener(document,"DOMContentLoaded",hs.ready);hs.addEventListener(window,"load",hs.ready);hs.addEventListener(document,"ready",function(){if(hs.expandCursor||hs.dimmingOpacity){var c=hs.createElement("style",{type:"text/css"},null,document.getElementsByTagName("HEAD")[0]);function b(e,f){if(hs.ie&&hs.uaVersion<9){var d=document.styleSheets[document.styleSheets.length-1];if(typeof(d.addRule)=="object"){d.addRule(e,f)}}else{c.appendChild(document.createTextNode(e+" {"+f+"}"))}}function a(d){return"expression( ( ( ignoreMe = document.documentElement."+d+" ? document.documentElement."+d+" : document.body."+d+" ) ) + 'px' );"}if(hs.expandCursor){b(".highslide img","cursor: url("+hs.graphicsDir+hs.expandCursor+"), pointer !important;")}b(".highslide-viewport-size",hs.ie&&(hs.uaVersion<7||document.compatMode=="BackCompat")?"position: absolute; left:"+a("scrollLeft")+"top:"+a("scrollTop")+"width:"+a("clientWidth")+"height:"+a("clientHeight"):"position: fixed; width: 100%; height: 100%; left: 0; top: 0")}});hs.addEventListener(window,"resize",function(){hs.getPageSize();if(hs.viewport){for(var a=0;a<hs.viewport.childNodes.length;a++){var b=hs.viewport.childNodes[a],c=hs.getExpander(b);c.positionOverlay(b);if(b.hsId=="thumbstrip"){c.slideshow.thumbstrip.selectThumb()}}}});hs.addEventListener(document,"mousemove",function(a){hs.mouse={x:a.clientX,y:a.clientY}});hs.addEventListener(document,"mousedown",hs.mouseClickHandler);hs.addEventListener(document,"mouseup",hs.mouseClickHandler);hs.addEventListener(document,"ready",hs.setClickEvents);hs.addEventListener(window,"load",hs.preloadImages);hs.addEventListener(window,"load",hs.preloadAjax)};
/*jquery.busy.js*/
(function(b){function a(c){this.options=b.extend({},a.defaults,c)}a.instances=[];a.repositionAll=function(){for(var d=0;d<a.instances.length;d++){if(!a.instances[d]){continue}var c=a.instances[d].options;new a(c).positionImg(b(a.instances[d].target),b.data(a.instances[d].target,"busy"),c.position)}};a.prototype.hide=function(c){c.each(function(){var e=b.data(this,"busy");if(e){e.remove()}b(this).css("visibility","");b.data(this,"busy",null);for(var d=0;d<a.instances.length;d++){if(a.instances[d]!=null&&a.instances[d].target==this){a.instances[d]=null}}})};a.prototype.show=function(c){var d=this;c.each(function(){if(b.data(this,"busy")){return}var f=b(this);var e=d.buildImg();e.css("visibility","hidden");e.load(function(){d.positionImg(f,e,d.options.position);e.css("visibility","");e.css("zIndex",d.options.zIndex)});b("body").append(e);if(d.options.hide){f.css("visibility","hidden")}b.data(this,"busy",e);a.instances.push({target:this,options:d.options})})};a.prototype.preload=function(){var c=this.buildImg();c.css("visibility","hidden");c.load(function(){b(this).remove()});b("body").append(c)};a.prototype.buildImg=function(){var c="<img id='busyImg' src='"+this.options.img+"' alt='"+this.options.alt+"' title='"+this.options.title+"'";if(this.options.width){c+=" width='"+this.options.width+"'"}if(this.options.height){c+=" height='"+this.options.height+"'"}c+=" />";return b(c)};a.prototype.positionImg=function(i,c,g){var f=i.offset();var j=i.outerWidth();var h=i.outerHeight();var k=c.outerWidth();var l=c.outerHeight();if(g=="left"){var d=f.left-k-this.options.offset}else{if(g=="right"){var d=f.left+j+this.options.offset}else{var d=f.left+(j-k)/2}}var e=f.top+(h-l)/2;c.css("position","absolute");c.css("left",d+"px");c.css("top",e+"px")};a.defaults={img:"busy.gif",alt:"Please wait...",title:"Please wait...",hide:true,position:"center",zIndex:1001,width:null,height:null,offset:10};b.fn.busy=function(c,d){if(b.inArray(c,["clear","hide","remove"])!=-1){new a(c).hide(b(this))}else{if(c=="defaults"){b.extend(a.defaults,d||{})}else{if(c=="preload"){new a(c).preload()}else{if(c=="reposition"){a.repositionAll()}else{new a(c).show(b(this));return b(this)}}}}}})(jQuery);
/*jquery.hoverIntent.minified.js*/
/**
* hoverIntent r6 // 2011.02.26 // jQuery 1.5.1+
* <http://cherne.net/brian/resources/jquery.hoverIntent.html>
* 
* @param  f  onMouseOver function || An object with configuration options
* @param  g  onMouseOut function  || Nothing (use configuration options object)
* @author    Brian Cherne brian(at)cherne(dot)net
*/
(function($){$.fn.hoverIntent=function(f,g){var cfg={sensitivity:7,interval:100,timeout:0};cfg=$.extend(cfg,g?{over:f,out:g}:f);var cX,cY,pX,pY;var track=function(ev){cX=ev.pageX;cY=ev.pageY};var compare=function(ev,ob){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t);if((Math.abs(pX-cX)+Math.abs(pY-cY))<cfg.sensitivity){$(ob).unbind("mousemove",track);ob.hoverIntent_s=1;return cfg.over.apply(ob,[ev])}else{pX=cX;pY=cY;ob.hoverIntent_t=setTimeout(function(){compare(ev,ob)},cfg.interval)}};var delay=function(ev,ob){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t);ob.hoverIntent_s=0;return cfg.out.apply(ob,[ev])};var handleHover=function(e){var ev=jQuery.extend({},e);var ob=this;if(ob.hoverIntent_t){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t)}if(e.type=="mouseenter"){pX=ev.pageX;pY=ev.pageY;$(ob).bind("mousemove",track);if(ob.hoverIntent_s!=1){ob.hoverIntent_t=setTimeout(function(){compare(ev,ob)},cfg.interval)}}else{$(ob).unbind("mousemove",track);if(ob.hoverIntent_s==1){ob.hoverIntent_t=setTimeout(function(){delay(ev,ob)},cfg.timeout)}}};return this.bind('mouseenter',handleHover).bind('mouseleave',handleHover)}})(jQuery);
/*jquery.megamenu.js*/
var isIE6=navigator.userAgent.toLowerCase().indexOf("msie 6")!=-1;jQuery.fn.megamenu=function(a){a=jQuery.extend({activate_action:"mouseover",deactivate_action:"mouseleave",show_method:"slideDown",hide_method:"slideUp",justify:"left",enable_js_shadow:true,shadow_size:3,mm_timeout:100},a);var b=this;if(a.activate_action=="click"){a.mm_timeout=0}b.children("li").each(function(){jQuery(this).addClass("mm-item");jQuery(".mm-item").each(function(){var g=$(this).hasClass("align-right")?"right":($(this).hasClass("align-left")?"left":a.justify);$(this).css({"float":g})});jQuery(this).find("div:first").addClass("mm-item-content");jQuery(this).find("a:first").addClass("mm-item-link");var e=jQuery(this).find(".mm-item-content");var f=jQuery(this).find(".mm-item-link");e.hide();jQuery(document).bind("click",function(g){jQuery(".mm-item-content").hide();jQuery(".mm-item-link").removeClass("mm-item-link-hover")});jQuery(this).bind("click",function(g){g.stopPropagation()});e.wrapInner('<div class="mm-content-base"></div>');if(a.enable_js_shadow==true){e.append('<div class="mm-js-shadow"></div>')}var d=0;var c=$(this).hasClass("deactivate-on-close")?"mm:close":a.deactivate_action;jQuery(this).bind(a.activate_action,function(i){i.stopPropagation();var h=jQuery(this).find("a.mm-item-link");var g=jQuery(this).find("div.mm-item-content");clearTimeout(d);d=setTimeout(function(){h.addClass("mm-item-link-hover");g.css({top:(f.position().top+f.outerHeight())-1+"px",left:(f.position().left)-5+"px"});if(!jQuery(this).hasClass("align-right")){var k=b.position().left+b.outerWidth();var l=f.position().left+e.outerWidth()-5;if(l>=k){g.css({left:(f.position().left-(l-k))-2+"px"})}}else{var j=b.position().left;var m=f.position().left-g.outerWidth()+f.outerWidth()+5;if(m<=j){g.css({left:j+2+"px"})}else{g.css({left:m+"px"})}}if(a.enable_js_shadow==true){g.find(".mm-js-shadow").height(g.height());g.find(".mm-js-shadow").width(g.width());g.find(".mm-js-shadow").css({top:(a.shadow_size)+(isIE6?2:0)+"px",left:(a.shadow_size)+(isIE6?2:0)+"px",opacity:0.5})}switch(a.show_method){case"simple":g.show();break;case"slideDown":g.height("auto");g.slideDown("fast");break;case"fadeIn":g.fadeTo("fast",1);break;default:g.each(a.show_method);break}},a.mm_timeout)});jQuery(this).bind(c,function(k){clearTimeout(d);var j=jQuery(this).find("a.mm-item-link");var h=jQuery(this).find("div.mm-item-content");var i=h.find("tester").size();var g=h.find("tester").html();if((i>0&&g=="")||i==0){if(i>0){$(".token-input-dropdown").hide()}h.stop();switch(a.hide_method){case"simple":h.hide();j.removeClass("mm-item-link-hover");break;case"slideUp":h.slideUp("fast",function(){j.removeClass("mm-item-link-hover")});break;case"fadeOut":h.fadeOut("fast",function(){j.removeClass("mm-item-link-hover")});break;default:h.each(a.hide_method);j.removeClass("mm-item-link-hover");break}if(h.length<1){j.removeClass("mm-item-link-hover")}}})});this.find(">li:last").after('<li class="clear-fix"></li>');this.show()};
/*jquery.ui.selectmenu.js*/
(function(a){a.widget("ui.selectmenu",{getter:"value",version:"1.8",eventPrefix:"selectmenu",options:{transferClasses:true,typeAhead:"sequential",style:"dropdown",positionOptions:{my:"left top",at:"left bottom",offset:null},width:null,menuWidth:null,handleWidth:26,maxHeight:null,icons:null,format:null,bgImage:function(){},wrapperElement:"<div />"},_create:function(){var b=this,f=this.options;var e=(this.element.attr("id")||"ui-selectmenu-"+Math.random().toString(16).slice(2,10)).replace(":","\\:");this.ids=[e,e+"-button",e+"-menu"];this._safemouseup=true;this.isOpen=false;this.newelement=a("<a />",{"class":this.widgetBaseClass+" ui-widget ui-state-default ui-corner-all",id:this.ids[1],role:"button",href:"#nogo",tabindex:this.element.attr("disabled")?1:0,"aria-haspopup":true,"aria-owns":this.ids[2]});this.newelementWrap=a(f.wrapperElement).append(this.newelement).insertAfter(this.element);var d=this.element.attr("tabindex");if(d){this.newelement.attr("tabindex",d)}this.newelement.data("selectelement",this.element);this.selectmenuIcon=a('<span class="'+this.widgetBaseClass+'-icon ui-icon"></span>').prependTo(this.newelement);this.newelement.prepend('<span class="'+b.widgetBaseClass+'-status" />');this.element.bind({"click.selectmenu":function(g){b.newelement.focus();g.preventDefault()}});this.newelement.bind("mousedown.selectmenu",function(g){b._toggle(g,true);if(f.style=="popup"){b._safemouseup=false;setTimeout(function(){b._safemouseup=true},300)}return false}).bind("click.selectmenu",function(){return false}).bind("keydown.selectmenu",function(h){var g=false;switch(h.keyCode){case a.ui.keyCode.ENTER:g=true;break;case a.ui.keyCode.SPACE:b._toggle(h);break;case a.ui.keyCode.UP:if(h.altKey){b.open(h)}else{b._moveSelection(-1)}break;case a.ui.keyCode.DOWN:if(h.altKey){b.open(h)}else{b._moveSelection(1)}break;case a.ui.keyCode.LEFT:b._moveSelection(-1);break;case a.ui.keyCode.RIGHT:b._moveSelection(1);break;case a.ui.keyCode.TAB:g=true;break;default:g=true}return g}).bind("keypress.selectmenu",function(g){b._typeAhead(g.which,"mouseup");return true}).bind("mouseover.selectmenu focus.selectmenu",function(){if(!f.disabled){a(this).addClass(b.widgetBaseClass+"-focus ui-state-hover")}}).bind("mouseout.selectmenu blur.selectmenu",function(){if(!f.disabled){a(this).removeClass(b.widgetBaseClass+"-focus ui-state-hover")}});a(document).bind("mousedown.selectmenu-"+this.ids[0],function(g){if(b.isOpen){b.close(g)}});this.element.bind("click.selectmenu",function(){b._refreshValue()}).bind("focus.selectmenu",function(){if(b.newelement){b.newelement[0].focus()}});if(!f.width){f.width=this.element.outerWidth()}this.newelement.width(f.width);this.element.hide();this.list=a("<ul />",{"class":"ui-widget ui-widget-content","aria-hidden":true,role:"listbox","aria-labelledby":this.ids[1],id:this.ids[2]});this.listWrap=a(f.wrapperElement).addClass(b.widgetBaseClass+"-menu").append(this.list).appendTo("body");this.list.bind("keydown.selectmenu",function(h){var g=false;switch(h.keyCode){case a.ui.keyCode.UP:if(h.altKey){b.close(h,true)}else{b._moveFocus(-1)}break;case a.ui.keyCode.DOWN:if(h.altKey){b.close(h,true)}else{b._moveFocus(1)}break;case a.ui.keyCode.LEFT:b._moveFocus(-1);break;case a.ui.keyCode.RIGHT:b._moveFocus(1);break;case a.ui.keyCode.HOME:b._moveFocus(":first");break;case a.ui.keyCode.PAGE_UP:b._scrollPage("up");break;case a.ui.keyCode.PAGE_DOWN:b._scrollPage("down");break;case a.ui.keyCode.END:b._moveFocus(":last");break;case a.ui.keyCode.ENTER:case a.ui.keyCode.SPACE:b.close(h,true);a(h.target).parents("li:eq(0)").trigger("mouseup");break;case a.ui.keyCode.TAB:g=true;b.close(h,true);a(h.target).parents("li:eq(0)").trigger("mouseup");break;case a.ui.keyCode.ESCAPE:b.close(h,true);break;default:g=true}return g}).bind("keypress.selectmenu",function(g){b._typeAhead(g.which,"focus");return true}).bind("mousedown.selectmenu mouseup.selectmenu",function(){return false});a(window).bind("resize.selectmenu-"+this.ids[0],a.proxy(b.close,this))},_init:function(){var s=this,f=this.options;var b=[];this.element.find("option").each(function(){var i=a(this);b.push({value:i.attr("value"),text:s._formatText(i.text()),selected:i.attr("selected"),disabled:i.attr("disabled"),classes:i.attr("class"),typeahead:i.attr("typeahead"),parentOptGroup:i.parent("optgroup"),bgImage:f.bgImage.call(i)})});var n=(s.options.style=="popup")?" ui-state-active":"";this.list.html("");if(b.length){for(var l=0;l<b.length;l++){var g={role:"presentation"};if(b[l].disabled){g["class"]=this.namespace+"-state-disabled"}var u={html:b[l].text,href:"#nogo",tabindex:-1,role:"option","aria-selected":false};if(b[l].disabled){u["aria-disabled"]=b[l].disabled}if(b[l].typeahead){u.typeahead=b[l].typeahead}var r=a("<a/>",u);var e=a("<li/>",g).append(r).data("index",l).addClass(b[l].classes).data("optionClasses",b[l].classes||"").bind("mouseup.selectmenu",function(i){if(s._safemouseup&&!s._disabled(i.currentTarget)&&!s._disabled(a(i.currentTarget).parents("ul>li."+s.widgetBaseClass+"-group "))){var j=a(this).data("index")!=s._selectedIndex();s.index(a(this).data("index"));s.select(i);if(j){s.change(i)}s.close(i,true)}return false}).bind("click.selectmenu",function(){return false}).bind("mouseover.selectmenu focus.selectmenu",function(i){if(!a(i.currentTarget).hasClass(s.namespace+"-state-disabled")&&!a(i.currentTarget).parent("ul").parent("li").hasClass(s.namespace+"-state-disabled")){s._selectedOptionLi().addClass(n);s._focusedOptionLi().removeClass(s.widgetBaseClass+"-item-focus ui-state-hover");a(this).removeClass("ui-state-active").addClass(s.widgetBaseClass+"-item-focus ui-state-hover")}}).bind("mouseout.selectmenu blur.selectmenu",function(){if(a(this).is(s._selectedOptionLi().selector)){a(this).addClass(n)}a(this).removeClass(s.widgetBaseClass+"-item-focus ui-state-hover")});if(b[l].parentOptGroup.length){var m=s.widgetBaseClass+"-group-"+this.element.find("optgroup").index(b[l].parentOptGroup);if(this.list.find("li."+m).length){this.list.find("li."+m+":last ul").append(e)}else{a(' <li role="presentation" class="'+s.widgetBaseClass+"-group "+m+(b[l].parentOptGroup.attr("disabled")?" "+this.namespace+'-state-disabled" aria-disabled="true"':'"')+'><span class="'+s.widgetBaseClass+'-group-label">'+b[l].parentOptGroup.attr("label")+"</span><ul></ul></li> ").appendTo(this.list).find("ul").append(e)}}else{e.appendTo(this.list)}if(f.icons){for(var k in f.icons){if(e.is(f.icons[k].find)){e.data("optionClasses",b[l].classes+" "+s.widgetBaseClass+"-hasIcon").addClass(s.widgetBaseClass+"-hasIcon");var q=f.icons[k].icon||"";e.find("a:eq(0)").prepend('<span class="'+s.widgetBaseClass+"-item-icon ui-icon "+q+'"></span>');if(b[l].bgImage){e.find("span").css("background-image",b[l].bgImage)}}}}}}else{a('<li role="presentation"><a href="#nogo" tabindex="-1" role="option"></a></li>').appendTo(this.list)}var d=(f.style=="dropdown");this.newelement.toggleClass(s.widgetBaseClass+"-dropdown",d).toggleClass(s.widgetBaseClass+"-popup",!d);this.list.toggleClass(s.widgetBaseClass+"-menu-dropdown ui-corner-bottom",d).toggleClass(s.widgetBaseClass+"-menu-popup ui-corner-all",!d).find("li:first").toggleClass("ui-corner-top",!d).end().find("li:last").addClass("ui-corner-bottom");this.selectmenuIcon.toggleClass("ui-icon-triangle-1-s",d).toggleClass("ui-icon-triangle-2-n-s",!d);if(f.transferClasses){var t=this.element.attr("class")||"";this.newelement.add(this.list).addClass(t)}if(f.style=="dropdown"){this.list.width(f.menuWidth?f.menuWidth:f.width)}else{this.list.width(f.menuWidth?f.menuWidth:f.width-f.handleWidth)}this.list.css("height","auto");var p=this.listWrap.height();if(f.maxHeight&&f.maxHeight<p){this.list.height(f.maxHeight)}else{var h=a(window).height()/3;if(h<p){this.list.height(h)}}this._optionLis=this.list.find("li:not(."+s.widgetBaseClass+"-group)");if(this.element.attr("disabled")){this.disable()}else{this.enable()}this.index(this._selectedIndex());window.setTimeout(function(){s._refreshPosition()},200)},destroy:function(){this.element.removeData(this.widgetName).removeClass(this.widgetBaseClass+"-disabled "+this.namespace+"-state-disabled").removeAttr("aria-disabled").unbind(".selectmenu");a(window).unbind(".selectmenu-"+this.ids[0]);a(document).unbind(".selectmenu-"+this.ids[0]);this.newelementWrap.remove();this.listWrap.remove();this.element.unbind(".selectmenu").show();a.Widget.prototype.destroy.apply(this,arguments)},_typeAhead:function(f,e){var b=this,d=false,j=String.fromCharCode(f).toUpperCase();c=j.toLowerCase();if(b.options.typeAhead=="sequential"){window.clearTimeout("ui.selectmenu-"+b.selectmenuId);var i=typeof(b._prevChar)=="undefined"?"":b._prevChar.join("");function g(k,l,m){d=true;a(k).trigger(e);typeof(b._prevChar)=="undefined"?b._prevChar=[m]:b._prevChar[b._prevChar.length]=m}this.list.find("li a").each(function(k){if(!d){var l=a(this).attr("typeahead")||a(this).text();if(l.indexOf(i+j)===0){g(this,k,j)}else{if(l.indexOf(i+c)===0){g(this,k,c)}}}});window.setTimeout(function(k){b._prevChar=undefined},1000,b)}else{if(!b._prevChar){b._prevChar=["",0]}d=false;function h(k,l){d=true;a(k).trigger(e);b._prevChar[1]=l}this.list.find("li a").each(function(k){if(!d){var l=a(this).text();if(l.indexOf(j)===0||l.indexOf(c)===0){if(b._prevChar[0]==j){if(b._prevChar[1]<k){h(this,k)}}else{h(this,k)}}}});this._prevChar[0]=j}},_uiHash:function(){var b=this.index();return{index:b,option:a("option",this.element).get(b),value:this.element[0].value}},open:function(f){var b=this,g=this.options;if(b.newelement.attr("aria-disabled")!="true"){b._closeOthers(f);b.newelement.addClass("ui-state-active");b.listWrap.appendTo(g.appendTo);b.list.attr("aria-hidden",false);b.listWrap.addClass(b.widgetBaseClass+"-open");var d=this._selectedOptionLi();if(g.style=="dropdown"){b.newelement.removeClass("ui-corner-all").addClass("ui-corner-top")}else{this.list.css("left",-5000).scrollTop(this.list.scrollTop()+d.position().top-this.list.outerHeight()/2+d.outerHeight()/2).css("left","auto")}b._refreshPosition();var e=d.find("a");if(e.length){e[0].focus()}b.isOpen=true;b._trigger("open",f,b._uiHash())}},close:function(d,b){if(this.newelement.is(".ui-state-active")){this.newelement.removeClass("ui-state-active");this.listWrap.removeClass(this.widgetBaseClass+"-open");this.list.attr("aria-hidden",true);if(this.options.style=="dropdown"){this.newelement.removeClass("ui-corner-top").addClass("ui-corner-all")}if(b){this.newelement.focus()}this.isOpen=false;this._trigger("close",d,this._uiHash())}},change:function(b){this.element.trigger("change");this._trigger("change",b,this._uiHash())},select:function(b){if(this._disabled(b.currentTarget)){return false}this._trigger("select",b,this._uiHash())},_closeOthers:function(b){a("."+this.widgetBaseClass+".ui-state-active").not(this.newelement).each(function(){a(this).data("selectelement").selectmenu("close",b)});a("."+this.widgetBaseClass+".ui-state-hover").trigger("mouseout")},_toggle:function(d,b){if(this.isOpen){this.close(d,b)}else{this.open(d)}},_formatText:function(b){return(this.options.format?this.options.format(b):b)},_selectedIndex:function(){return this.element[0].selectedIndex},_selectedOptionLi:function(){return this._optionLis.eq(this._selectedIndex())},_focusedOptionLi:function(){return this.list.find("."+this.widgetBaseClass+"-item-focus")},_moveSelection:function(f,b){if(!this.options.disabled){var e=parseInt(this._selectedOptionLi().data("index")||0,10);var d=e+f;if(d<0){d=0}if(d>this._optionLis.size()-1){d=this._optionLis.size()-1}if(d===b){return false}if(this._optionLis.eq(d).hasClass(this.namespace+"-state-disabled")){(f>0)?++f:--f;this._moveSelection(f,d)}else{return this._optionLis.eq(d).trigger("mouseup")}}},_moveFocus:function(g,b){if(!isNaN(g)){var f=parseInt(this._focusedOptionLi().data("index")||0,10);var e=f+g}else{var e=parseInt(this._optionLis.filter(g).data("index"),10)}if(e<0){e=0}if(e>this._optionLis.size()-1){e=this._optionLis.size()-1}if(e===b){return false}var d=this.widgetBaseClass+"-item-"+Math.round(Math.random()*1000);this._focusedOptionLi().find("a:eq(0)").attr("id","");if(this._optionLis.eq(e).hasClass(this.namespace+"-state-disabled")){(g>0)?++g:--g;this._moveFocus(g,e)}else{this._optionLis.eq(e).find("a:eq(0)").attr("id",d).focus()}this.list.attr("aria-activedescendant",d)},_scrollPage:function(d){var b=Math.floor(this.list.outerHeight()/this.list.find("li:first").outerHeight());b=(d=="up"?-b:b);this._moveFocus(b)},_setOption:function(b,d){this.options[b]=d;if(b=="disabled"){if(d){this.close()}this.element.add(this.newelement).add(this.list)[d?"addClass":"removeClass"](this.widgetBaseClass+"-disabled "+this.namespace+"-state-disabled").attr("aria-disabled",d)}},disable:function(b,d){if(typeof(b)=="undefined"){this._setOption("disabled",true)}else{if(d=="optgroup"){this._disableOptgroup(b)}else{this._disableOption(b)}}},enable:function(b,d){if(typeof(b)=="undefined"){this._setOption("disabled",false)}else{if(d=="optgroup"){this._enableOptgroup(b)}else{this._enableOption(b)}}},_disabled:function(b){return a(b).hasClass(this.namespace+"-state-disabled")},_disableOption:function(b){var d=this._optionLis.eq(b);if(d){d.addClass(this.namespace+"-state-disabled").find("a").attr("aria-disabled",true);this.element.find("option").eq(b).attr("disabled","disabled")}},_enableOption:function(b){var d=this._optionLis.eq(b);if(d){d.removeClass(this.namespace+"-state-disabled").find("a").attr("aria-disabled",false);this.element.find("option").eq(b).removeAttr("disabled")}},_disableOptgroup:function(d){var b=this.list.find("li."+this.widgetBaseClass+"-group-"+d);if(b){b.addClass(this.namespace+"-state-disabled").attr("aria-disabled",true);this.element.find("optgroup").eq(d).attr("disabled","disabled")}},_enableOptgroup:function(d){var b=this.list.find("li."+this.widgetBaseClass+"-group-"+d);if(b){b.removeClass(this.namespace+"-state-disabled").attr("aria-disabled",false);this.element.find("optgroup").eq(d).removeAttr("disabled")}},index:function(b){if(arguments.length){if(!this._disabled(a(this._optionLis[b]))){this.element[0].selectedIndex=b;this._refreshValue()}else{return false}}else{return this._selectedIndex()}},value:function(b){if(arguments.length){this.element[0].value=b;this._refreshValue()}else{return this.element[0].value}},_refreshValue:function(){var e=(this.options.style=="popup")?" ui-state-active":"";var d=this.widgetBaseClass+"-item-"+Math.round(Math.random()*1000);this.list.find("."+this.widgetBaseClass+"-item-selected").removeClass(this.widgetBaseClass+"-item-selected"+e).find("a").attr("aria-selected","false").attr("id","");this._selectedOptionLi().addClass(this.widgetBaseClass+"-item-selected"+e).find("a").attr("aria-selected","true").attr("id",d);var b=(this.newelement.data("optionClasses")?this.newelement.data("optionClasses"):"");var f=(this._selectedOptionLi().data("optionClasses")?this._selectedOptionLi().data("optionClasses"):"");this.newelement.removeClass(b).data("optionClasses",f).addClass(f).find("."+this.widgetBaseClass+"-status").html(this._selectedOptionLi().find("a:eq(0)").html());this.list.attr("aria-activedescendant",d)},_refreshPosition:function(){var e=this.options;if(e.style=="popup"&&!e.positionOptions.offset){var d=this._selectedOptionLi();var b="0 "+(this.list.offset().top-d.offset().top-(this.newelement.outerHeight()+d.outerHeight())/2)}this.listWrap.zIndex(this.element.zIndex()+1).position({of:e.positionOptions.of||this.newelement,my:e.positionOptions.my,at:e.positionOptions.at,offset:e.positionOptions.offset||b,collision:e.positionOptions.collision||"flip"})}})})(jQuery);
/*jquery.jgrowl.js*/
(function(a){a.jGrowl=function(b,c){if(a("#jGrowl").size()==0){a('<div id="jGrowl"></div>').addClass((c&&c.position)?c.position:a.jGrowl.defaults.position).appendTo("body")}a("#jGrowl").jGrowl(b,c)};a.fn.jGrowl=function(b,d){if(a.isFunction(this.each)){var c=arguments;return this.each(function(){var e=this;if(a(this).data("jGrowl.instance")==undefined){a(this).data("jGrowl.instance",a.extend(new a.fn.jGrowl(),{notifications:[],element:null,interval:null}));a(this).data("jGrowl.instance").startup(this)}if(a.isFunction(a(this).data("jGrowl.instance")[b])){a(this).data("jGrowl.instance")[b].apply(a(this).data("jGrowl.instance"),a.makeArray(c).slice(1))}else{a(this).data("jGrowl.instance").create(b,d)}})}};a.extend(a.fn.jGrowl.prototype,{defaults:{pool:0,header:"",group:"",sticky:false,position:"top-right",glue:"after",theme:"default",themeState:"highlight",corners:"10px",check:250,life:3000,closeDuration:"normal",openDuration:"normal",easing:"swing",closer:true,closeTemplate:"&times;",closerTemplate:"<div>[ close all ]</div>",log:function(c,b,d){},beforeOpen:function(c,b,d){},afterOpen:function(c,b,d){},open:function(c,b,d){},beforeClose:function(c,b,d){},close:function(c,b,d){},animateOpen:{opacity:"show"},animateClose:{opacity:"hide"}},notifications:[],element:null,interval:null,create:function(b,c){var c=a.extend({},this.defaults,c);if(typeof c.speed!=="undefined"){c.openDuration=c.speed;c.closeDuration=c.speed}this.notifications.push({message:b,options:c});c.log.apply(this.element,[this.element,b,c])},render:function(d){var b=this;var c=d.message;var e=d.options;e.themeState=(e.themeState=="")?"":"ui-state-"+e.themeState;var d=a('<div class="jGrowl-notification '+e.themeState+" ui-corner-all"+((e.group!=undefined&&e.group!="")?" "+e.group:"")+'"><div class="jGrowl-close">'+e.closeTemplate+'</div><div class="jGrowl-header">'+e.header+'</div><div class="jGrowl-message">'+c+"</div></div>").data("jGrowl",e).addClass(e.theme).children("div.jGrowl-close").bind("click.jGrowl",function(){a(this).parent().trigger("jGrowl.close")}).parent();a(d).bind("mouseover.jGrowl",function(){a("div.jGrowl-notification",b.element).data("jGrowl.pause",true)}).bind("mouseout.jGrowl",function(){a("div.jGrowl-notification",b.element).data("jGrowl.pause",false)}).bind("jGrowl.beforeOpen",function(){if(e.beforeOpen.apply(d,[d,c,e,b.element])!=false){a(this).trigger("jGrowl.open")}}).bind("jGrowl.open",function(){if(e.open.apply(d,[d,c,e,b.element])!=false){if(e.glue=="after"){a("div.jGrowl-notification:last",b.element).after(d)}else{a("div.jGrowl-notification:first",b.element).before(d)}a(this).animate(e.animateOpen,e.openDuration,e.easing,function(){if(a.browser.msie&&(parseInt(a(this).css("opacity"),10)===1||parseInt(a(this).css("opacity"),10)===0)){this.style.removeAttribute("filter")}if(a(this).data("jGrowl")!=null){a(this).data("jGrowl").created=new Date()}a(this).trigger("jGrowl.afterOpen")})}}).bind("jGrowl.afterOpen",function(){e.afterOpen.apply(d,[d,c,e,b.element])}).bind("jGrowl.beforeClose",function(){if(e.beforeClose.apply(d,[d,c,e,b.element])!=false){a(this).trigger("jGrowl.close")}}).bind("jGrowl.close",function(){a(this).data("jGrowl.pause",true);a(this).animate(e.animateClose,e.closeDuration,e.easing,function(){if(a.isFunction(e.close)){if(e.close.apply(d,[d,c,e,b.element])!==false){a(this).remove()}}else{a(this).remove()}})}).trigger("jGrowl.beforeOpen");if(e.corners!=""&&a.fn.corner!=undefined){a(d).corner(e.corners)}if(a("div.jGrowl-notification:parent",b.element).size()>1&&a("div.jGrowl-closer",b.element).size()==0&&this.defaults.closer!=false){a(this.defaults.closerTemplate).addClass("jGrowl-closer "+this.defaults.themeState+" ui-corner-all").addClass(this.defaults.theme).appendTo(b.element).animate(this.defaults.animateOpen,this.defaults.speed,this.defaults.easing).bind("click.jGrowl",function(){a(this).siblings().trigger("jGrowl.beforeClose");if(a.isFunction(b.defaults.closer)){b.defaults.closer.apply(a(this).parent()[0],[a(this).parent()[0]])}})}},update:function(){a(this.element).find("div.jGrowl-notification:parent").each(function(){if(a(this).data("jGrowl")!=undefined&&a(this).data("jGrowl").created!=undefined&&(a(this).data("jGrowl").created.getTime()+parseInt(a(this).data("jGrowl").life))<(new Date()).getTime()&&a(this).data("jGrowl").sticky!=true&&(a(this).data("jGrowl.pause")==undefined||a(this).data("jGrowl.pause")!=true)){a(this).trigger("jGrowl.beforeClose")}});if(this.notifications.length>0&&(this.defaults.pool==0||a(this.element).find("div.jGrowl-notification:parent").size()<this.defaults.pool)){this.render(this.notifications.shift())}if(a(this.element).find("div.jGrowl-notification:parent").size()<2){a(this.element).find("div.jGrowl-closer").animate(this.defaults.animateClose,this.defaults.speed,this.defaults.easing,function(){a(this).remove()})}},startup:function(b){this.element=a(b).addClass("jGrowl").append('<div class="jGrowl-notification"></div>');this.interval=setInterval(function(){a(b).data("jGrowl.instance").update()},parseInt(this.defaults.check));if(a.browser.msie&&parseInt(a.browser.version)<7&&!window.XMLHttpRequest){a(this.element).addClass("ie6")}},shutdown:function(){a(this.element).removeClass("jGrowl").find("div.jGrowl-notification").remove();clearInterval(this.interval)},close:function(){a(this.element).find("div.jGrowl-notification").each(function(){a(this).trigger("jGrowl.beforeClose")})}});a.jGrowl.defaults=a.fn.jGrowl.prototype.defaults})(jQuery);
/*jquery.iframe-post-form.js*/
(function(a){a.fn.iframePostForm=function(e){var d,b,f,c=true,g;e=a.extend({},a.fn.iframePostForm.defaults,e);if(!a("#"+e.iframeID).length){a("body").append('<iframe id="'+e.iframeID+'" name="'+e.iframeID+'" style="display:none" />')}return a(this).each(function(){f=a(this);f.attr("target",e.iframeID);f.submit(function(){c=e.post.apply(this);if(c===false){return c}g=a("#"+e.iframeID).load(function(){d=g.contents().find("body");if(e.json){b=a.parseJSON(d.html())}else{b=d.html()}e.complete.apply(this,[b]);g.unbind("load");setTimeout(function(){d.html("")},1)})})})};a.fn.iframePostForm.defaults={iframeID:"iframe-post-form",json:false,post:function(){},complete:function(b){}}})(jQuery);
/*jquery.timepicker-1.1.2.js*/
if(typeof jQuery!=="undefined"){(function(b,d){function c(g,e,f){return(new Array(f+1-g.length).join(e))+g}function a(){if(arguments.length===1){var e=arguments[0];if(typeof e==="string"){e=b.fn.timepicker.parseTime(e)}return new Date(1988,7,24,e.getHours(),e.getMinutes(),e.getSeconds())}else{if(arguments.length===3){return new Date(1988,7,24,arguments[0],arguments[1],arguments[2])}else{if(arguments.length===2){return new Date(1988,7,24,arguments[0],arguments[1],0)}else{return new Date(1988,7,24)}}}}b.TimePicker=function(){var e=this;e.container=b(".ui-timepicker-container");e.ui=e.container.find(".ui-timepicker");if(e.ui.length===0){e.container=b("<div></div>").addClass("ui-timepicker-container").addClass("ui-timepicker-hidden ui-helper-hidden").appendTo("body").hide();e.ui=b("<ul></ul>").addClass("ui-timepicker").addClass("ui-widget ui-widget-content ui-menu").addClass("ui-corner-all").appendTo(e.container);if(b.fn.jquery>="1.4.2"){e.ui.delegate("a","mouseenter.timepicker",function(f){e.activate(false,b(this).parent())}).delegate("a","mouseleave.timepicker",function(f){e.deactivate(false)}).delegate("a","click.timepicker",function(f){f.preventDefault();e.select(false,b(this).parent())})}e.ui.bind("click.timepicker, scroll.timepicker",function(f){clearTimeout(e.closing)})}};b.TimePicker.count=0;b.TimePicker.instance=function(){if(!b.TimePicker._instance){b.TimePicker._instance=new b.TimePicker()}return b.TimePicker._instance};b.TimePicker.prototype={keyCode:{ALT:18,BLOQ_MAYUS:20,CTRL:17,DOWN:40,END:35,ENTER:13,HOME:36,LEFT:37,NUMPAD_ENTER:108,PAGE_DOWN:34,PAGE_UP:33,RIGHT:39,SHIFT:16,TAB:9,UP:38},_items:function(g,h){var k=this,f=b("<ul></ul>"),j=null,l,e;if(g.options.timeFormat.indexOf("m")===-1&&g.options.interval%60!==0){g.options.interval=Math.max(Math.round(g.options.interval/60),1)*60}if(h){l=a(h)}else{if(g.options.startTime){l=a(g.options.startTime)}else{l=a(g.options.startHour,g.options.startMinutes)}}e=new Date(l.getTime()+24*60*60*1000);while(l<e){if(k._isValidTime(g,l)){j=b("<li>").addClass("ui-menu-item").appendTo(f);b("<a>").addClass("ui-corner-all").text(b.fn.timepicker.formatTime(g.options.timeFormat,l)).appendTo(j);j.data("time-value",l)}l=new Date(l.getTime()+g.options.interval*60*1000)}return f.children()},_isValidTime:function(g,h){var f=null,e=null;h=a(h);if(g.options.minTime!==null){f=a(g.options.minTime)}else{if(g.options.minHour!==null||g.options.minMinutes!==null){f=a(g.options.minHour,g.options.minMinutes)}}if(g.options.maxTime!==null){e=a(g.options.maxTime)}else{if(g.options.maxHour!==null||g.options.maxMinutes!==null){e=a(g.options.maxHour,g.options.maxMinutes)}}if(f!==null&&e!==null){return h>=f&&h<=e}else{if(f!==null){return h>=f}else{if(e!==null){return h<=e}}}return true},_hasScroll:function(){var e=typeof this.ui.prop!=="undefined"?"prop":"attr";return this.ui.height()<this.ui[e]("scrollHeight")},_move:function(e,j,g){var h=this;if(h.closed()){h.open(e)}if(!h.active){h.activate(e,h.ui.children(g));return}var f=h.active[j+"All"](".ui-menu-item").eq(0);if(f.length){h.activate(e,f)}else{h.activate(e,h.ui.children(g))}},register:function(g,e){var h=this,f={};f.element=b(g);if(f.element.data("TimePicker")){return}f.element.data("TimePicker",f);f.options=b.metadata?b.extend({},e,f.element.metadata()):b.extend({},e);f.widget=h;f.selectedTime=b.fn.timepicker.parseTime(f.element.val());b.extend(f,{next:function(){return h.next(f)},previous:function(){return h.previous(f)},first:function(){return h.first(f)},last:function(){return h.last(f)},selected:function(){return h.selected(f)},open:function(){return h.open(f)},close:function(i){return h.close(f,i)},closed:function(){return h.closed(f)},destroy:function(){return h.destroy(f)},parse:function(i){return h.parse(f,i)},format:function(j,i){return h.format(f,j,i)},getTime:function(){return h.getTime(f)},setTime:function(j,i){return h.setTime(f,j,i)},option:function(i,j){return h.option(f,i,j)}});f.element.bind("keydown.timepicker",function(i){switch(i.which||i.keyCode){case h.keyCode.ENTER:case h.keyCode.NUMPAD_ENTER:i.preventDefault();if(h.closed()){f.element.trigger("change.timepicker")}else{h.select(f,h.active)}break;case h.keyCode.UP:f.previous();break;case h.keyCode.DOWN:f.next();break;default:if(!h.closed()){f.close(true)}break}}).bind("focus.timepicker",function(i){f.open()}).bind("blur.timepicker",function(i){f.close()}).bind("change.timepicker",function(i){if(f.closed()){f.setTime(b.fn.timepicker.parseTime(f.element.val()))}})},select:function(f,g){var h=this,e=f===false?h.instance:f;clearTimeout(h.closing);h.setTime(e,b.fn.timepicker.parseTime(g.children("a").text()));h.close(e,true)},activate:function(h,j){var k=this,g=h===false?k.instance:h;if(g!==k.instance){return}else{k.deactivate()}if(k._hasScroll()){var l=j.offset().top-k.ui.offset().top,f=k.ui.scrollTop(),e=k.ui.height();if(l<0){k.ui.scrollTop(f+l)}else{if(l>=e){k.ui.scrollTop(f+l-e+j.height())}}}k.active=j.eq(0).children("a").addClass("ui-state-hover").attr("id","ui-active-item").end()},deactivate:function(){var e=this;if(!e.active){return}e.active.children("a").removeClass("ui-state-hover").removeAttr("id");e.active=null},next:function(e){if(this.closed()||this.instance===e){this._move(e,"next",".ui-menu-item:first")}return e.element},previous:function(e){if(this.closed()||this.instance===e){this._move(e,"prev",".ui-menu-item:last")}return e.element},first:function(e){if(this.instance===e){return this.active&&!this.active.prevAll(".ui-menu-item").length}return false},last:function(e){if(this.instance===e){return this.active&&!this.active.nextAll(".ui-menu-item").length}return false},selected:function(e){if(this.instance===e){return this.active?this.active:null}return null},open:function(g){var h=this;if(!g.options.dropdown){return g.element}if(g.rebuild||!g.items||(g.options.dynamic&&g.selectedTime)){g.items=h._items(g)}if(g.rebuild||h.instance!==g||(g.options.dynamic&&g.selectedTime)){if(b.fn.jquery<"1.4.2"){h.ui.children().remove();h.ui.append(g.items);h.ui.find("a").bind("mouseover.timepicker",function(i){h.activate(g,b(this).parent())}).bind("mouseout.timepicker",function(i){h.deactivate(g)}).bind("click.timepicker",function(i){i.preventDefault();h.select(g,b(this).parent())})}else{h.ui.children().detach();h.ui.append(g.items)}}g.rebuild=false;h.container.removeClass("ui-helper-hidden ui-timepicker-hidden ui-timepicker-standard ui-timepicker-corners").show();switch(g.options.theme){case"standard":h.container.addClass("ui-timepicker-standard");break;case"standard-rounded-corners":h.container.addClass("ui-timepicker-standard ui-timepicker-corners");break;default:break}var j=parseInt(h.ui.css("paddingRight"),10),e,f;if(h.ui.hasClass("ui-no-scrollbar")&&!g.options.scrollbar){h.ui.css({paddingRight:j-40})}e=(h.ui.outerWidth()-h.ui.width())+(h.container.outerWidth()-h.container.width());f=g.options.zindex?g.options.zindex:g.element.offsetParent().css("z-index");h.ui.css({width:g.element.outerWidth()-e});h.container.css(b.extend(g.element.offset(),{height:h.ui.outerHeight(),width:h.ui.outerWidth(),zIndex:f}));e=g.items.eq(0).outerWidth()-g.items.eq(0).width();g.items.css("width",h.ui.width()-e);if(h.ui.hasClass("ui-no-scrollbar")&&!g.options.scrollbar){h.ui.css({paddingRight:j})}else{if(!g.options.scrollbar){h.ui.css({paddingRight:j+40}).addClass("ui-no-scrollbar")}}h.container.css("top",parseInt(h.container.css("top"),10)+g.element.outerHeight());h.instance=g;if(g.selectedTime){g.items.each(function(){var i=b(this),k;if(b.fn.jquery<"1.4.2"){k=b.fn.timepicker.parseTime(i.find("a").text())}else{k=i.data("time-value")}if(k.getTime()===g.selectedTime.getTime()){h.activate(g,i);return false}return true})}else{h.deactivate(g)}return g.element},close:function(e,g){var f=this;if(f.closed()||g){clearTimeout(f.closing);if(f.instance===e){f.container.addClass("ui-helper-hidden ui-timepicker-hidden").hide();f.ui.scrollTop(0);f.ui.children().removeClass("ui-state-hover")}}else{f.closing=setTimeout(function(){f.close(e,true)},150)}return e.element},closed:function(){return this.ui.is(":hidden")},destroy:function(e){var f=this;f.close(e,true);return e.element.unbind(".timepicker").data("TimePicker",null)},parse:function(e,f){return b.fn.timepicker.parseTime(f)},format:function(e,g,f){f=f||e.options.timeFormat;return b.fn.timepicker.formatTime(f,g)},getTime:function(e){return e.selectedTime?e.selectedTime:null},setTime:function(f,h,e){var g=this;if(typeof h==="string"){h=f.parse(h)}if(h&&h.getMinutes&&g._isValidTime(f,h)){h=a(h);f.selectedTime=h;f.element.val(f.format(h,f.options.timeFormat));if(e){return f}f.element.trigger("time-change",[h]);if(b.isFunction(f.options.change)){f.options.change.apply(f.element,[h])}}else{f.selectedTime=null}return f.element},option:function(g,f,j){if(typeof j==="undefined"){return g.options[f]}var h=this,e={},k;if(typeof f==="string"){e[f]=j}else{e=f}k=["minHour","minMinutes","minTime","maxHour","maxMinutes","maxTime","startHour","startMinutes","startTime","timeFormat","interval","dropdown"];b.each(g.options,function(i,l){if(typeof e[i]!=="undefined"){g.options[i]=e[i];if(!g.rebuild&&b.inArray(i,k)>-1){g.rebuild=true}}});if(g.rebuild){g.setTime(g.getTime())}}};b.TimePicker.defaults={timeFormat:"hh:mm p",minHour:null,minMinutes:null,minTime:null,maxHour:null,maxMinutes:null,maxTime:null,startHour:null,startMinutes:null,startTime:null,interval:30,dynamic:true,theme:"standard",zindex:null,dropdown:true,scrollbar:false,change:function(e){}};b.TimePicker.methods={chainable:["next","previous","open","close","destroy","setTime"]};b.fn.timepicker=function(g){if(b.fn.jquery<"1.3"){return this}if(typeof g==="string"){var f=Array.prototype.slice.call(arguments,1),i,e;if(g==="option"&&arguments.length>2){i="each"}else{if(b.inArray(g,b.TimePicker.methods.chainable)!==-1){i="each"}else{i="map"}}e=this[i](function(){var k=b(this),j=k.data("TimePicker");if(typeof j==="object"){return j[g].apply(j,f)}});if(i==="map"&&this.length===1){return b.makeArray(e).shift()}else{if(i==="map"){return b.makeArray(e)}else{return e}}}if(this.length===1&&this.data("TimePicker")){return this.data("TimePicker")}var h=b.extend({},b.TimePicker.defaults,g);return this.each(function(){b.TimePicker.instance().register(this,h)})};b.fn.timepicker.formatTime=function(n,e){var l=e.getHours(),i=l%12,h=e.getMinutes(),m=e.getSeconds(),f={hh:c((i===0?12:i).toString(),"0",2),HH:c(l.toString(),"0",2),mm:c(h.toString(),"0",2),ss:c(m.toString(),"0",2),h:(i===0?12:i),H:l,m:h,s:m,p:l>11?pmTranslate:amTranslate},j=n,g="";for(g in f){if(f.hasOwnProperty(g)){j=j.replace(new RegExp(g,"g"),f[g])}}j=j.replace(new RegExp("a","g"),l>11?"pm":"am");return j};b.fn.timepicker.parseTime=(function(g){var e=[[/^(\d+)$/,"$1"],[/^:(\d)$/,"$10"],[/^:(\d+)/,"$1"],[/^(\d):([7-9])$/,"0$10$2"],[/^(\d):(\d\d)$/,"$1$2"],[/^(\d):(\d{1,})$/,"0$1$20"],[/^(\d\d):([7-9])$/,"$10$2"],[/^(\d\d):(\d)$/,"$1$20"],[/^(\d\d):(\d*)$/,"$1$2"],[/^(\d{3,}):(\d)$/,"$10$2"],[/^(\d{3,}):(\d{2,})/,"$1$2"],[/^(\d):(\d):(\d)$/,"0$10$20$3"],[/^(\d{1,2}):(\d):(\d\d)/,"$10$2$3"]],f=e.length;return function(r){var q=a(new Date()),p=false,l=false,o=false,i=false,n=false;if(typeof r==="undefined"||!r.toLowerCase){return null}r=r.toLowerCase();p=/a/.test(r);l=p?false:/p/.test(r);r=r.replace(/[^0-9:]/g,"").replace(/:+/g,":");for(var j=0;j<f;j++){if(e[j][0].test(r)){r=r.replace(e[j][0],e[j][1]);break}}r=r.replace(/:/g,"");if(r.length===1){o=r}else{if(r.length===2){o=r}else{if(r.length===3||r.length===5){o=r.substr(0,1);i=r.substr(1,2);n=r.substr(3,2)}else{if(r.length===4||r.length>5){o=r.substr(0,2);i=r.substr(2,2);n=r.substr(4,2)}}}}if(r.length>0&&r.length<5){if(r.length<3){i=0}n=0}if(o===false||i===false||n===false){return false}o=parseInt(o,10);i=parseInt(i,10);n=parseInt(n,10);if(p&&o===12){o=0}else{if(l&&o<12){o=o+12}}if(o>24&&(o%10)<=6&&i<=60&&n<=60){if(r.length>=6){return b.fn.timepicker.parseTime(r.substr(0,5))}else{return b.fn.timepicker.parseTime(r+"0"+(p?"a":"")+(l?"p":""))}}else{if(o<=24&&i<=60&&n<=60){q.setHours(o,i,n);return q}else{return false}}}})()})(jQuery)};
/*bazu.timepicker.js*/
(function(c){function d(h,f,g){return(new Array(g+1-h.length).join(f))+h}function b(){if(arguments.length===1){var f=arguments[0];if(typeof f==="string"){f=c.fn.timepicker.parseTime(f)}return new Date(1988,7,24,f.getHours(),f.getMinutes(),f.getSeconds())}else{if(arguments.length===3){return new Date(1988,7,24,arguments[0],arguments[1],arguments[2])}else{if(arguments.length===2){return new Date(1988,7,24,arguments[0],arguments[1],0)}else{return new Date(1988,7,24)}}}}var a={open:function(f){var g=this;if(!f.options.dropdown){return f.element}if(f.rebuild||!f.items||(f.options.dynamic&&f.selectedTime)){f.items=g._items(f)}if(f.rebuild||g.instance!==f||(f.options.dynamic&&f.selectedTime)){if(c.fn.jquery<"1.4.2"){g.ui.children().remove();g.ui.append(f.items);g.ui.find("a").bind("mouseover.timepicker",function(h){g.activate(f,c(this).parent())}).bind("mouseout.timepicker",function(h){g.deactivate(f)}).bind("click.timepicker",function(h){h.preventDefault();g.select(f,c(this).parent())})}else{g.ui.children().detach();g.ui.append(f.items)}}f.rebuild=false;g.container.removeClass("ui-helper-hidden ui-timepicker-hidden ui-timepicker-standard ui-timepicker-corners").show();switch(f.options.theme){case"standard":g.container.addClass("ui-timepicker-standard");break;case"standard-rounded-corners":g.container.addClass("ui-timepicker-standard ui-timepicker-corners");break;default:break}g.ui.css(c.extend(f.element.offset(),{width:f.element.innerWidth(),zIndex:f.options.zindex?f.options.zindex:f.element.offsetParent().css("z-index")}));g.ui.css("top",parseInt(g.ui.css("top"),10)+f.element.outerHeight());g.instance=f;if(f.selectedTime){f.items.each(function(){var h=c(this),i;if(c.fn.jquery<"1.4.2"){i=c.fn.timepicker.parseTime(h.find("a").text())}else{i=h.data("time-value")}if(i.getTime()==f.selectedTime.getTime()){g.activate(f,h);return false}return true})}else{g.deactivate(f)}return f.element}};var e={formatTime:function(o,f){var m=f.getHours(),j=m%12,i=f.getMinutes(),n=f.getSeconds(),g={hh:d((j===0?12:j).toString(),"0",2),HH:d(m.toString(),"0",2),mm:d(i.toString(),"0",2),ss:d(n.toString(),"0",2),h:(j===0?12:j),H:m,m:i,s:n,p:m>11?pmTranslate:amTranslate},l=o,h="";for(h in g){if(g.hasOwnProperty(h)){l=l.replace(new RegExp(h,"g"),g[h])}}return l},parseTime:(function(h){var f=[[/^(\d+)$/,"$1"],[/^:(\d)$/,"$10"],[/^:(\d+)/,"$1"],[/^(\d):([7-9])$/,"0$10$2"],[/^(\d):(\d\d)$/,"$1$2"],[/^(\d):(\d{1,})$/,"0$1$20"],[/^(\d\d):([7-9])$/,"$10$2"],[/^(\d\d):(\d)$/,"$1$20"],[/^(\d\d):(\d*)$/,"$1$2"],[/^(\d{3,}):(\d)$/,"$10$2"],[/^(\d{3,}):(\d{2,})/,"$1$2"],[/^(\d):(\d):(\d)$/,"0$10$20$3"],[/^(\d{1,2}):(\d):(\d\d)/,"$10$2$3"]],g=f.length;return function(r){r=r.replace(amTranslate,"AM");r=r.replace(pmTranslate,"PM");var q=b(new Date()),p=false,l=false,o=false,i=false,n=false;if(typeof r==="undefined"||!r.toLowerCase){return null}r=r.toLowerCase();p=/a/.test(r);l=p?false:/p/.test(r);r=r.replace(/[^0-9:]/g,"").replace(/:+/g,":");for(var j=0;j<g;j++){if(f[j][0].test(r)){r=r.replace(f[j][0],f[j][1]);break}}r=r.replace(/:/g,"");if(r.length===1){o=r}else{if(r.length===2){o=r}else{if(r.length===3||r.length===5){o=r.substr(0,1);i=r.substr(1,2);n=r.substr(3,2)}else{if(r.length===4||r.length>5){o=r.substr(0,2);i=r.substr(2,2);n=r.substr(4,2)}}}}if(r.length>0&&r.length<5){if(r.length<3){i=0}n=0}if(o===false||i===false||n===false){return false}o=parseInt(o,10);i=parseInt(i,10);n=parseInt(n,10);if(p&&o===12){o=0}else{if(l&&o<12){o=o+12}}if(o>24&&(o%10)<=6&&i<=60&&n<=60){if(r.length>=6){return c.fn.timepicker.parseTime(r.substr(0,5))}else{return c.fn.timepicker.parseTime(r+"0"+(p?"a":"")+(l?"p":""))}}else{if(o<=24&&i<=60&&n<=60){q.setHours(o,i,n);return q}else{return false}}}})()};c.extend(c.fn.timepicker,e);c.extend(c.TimePicker.prototype,a)})(jQuery);
/*json2.min.js*/
var JSON;if(!JSON){JSON={}}(function(){function f(n){return n<10?"0"+n:n}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key)}if(typeof rep==="function"){value=rep.call(holder,key,value)}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null"}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null"}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==="string"){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v}}if(typeof JSON.stringify!=="function"){JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" "}}else{if(typeof space==="string"){indent=space}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":value})}}if(typeof JSON.parse!=="function"){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}}());
/*jquery.form.js*/
/*
 * jQuery Form Plugin
 * version: 2.82 (15-JUN-2011)
 * @requires jQuery v1.3.2 or later
 *
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function(b){b.fn.ajaxSubmit=function(d){if(!this.length){a("ajaxSubmit: skipping submit process - no element selected");return this}var c,p,f,g=this;if(typeof d=="function"){d={success:d}}c=this.attr("method");p=this.attr("action");f=(typeof p==="string")?b.trim(p):"";f=f||window.location.href||"";if(f){f=(f.match(/^([^#]+)/)||[])[1]}d=b.extend(true,{url:f,success:b.ajaxSettings.success,type:c||"GET",iframeSrc:/^https/i.test(window.location.href||"")?"javascript:false":"about:blank"},d);var j={};this.trigger("form-pre-serialize",[this,d,j]);if(j.veto){a("ajaxSubmit: submit vetoed via form-pre-serialize trigger");return this}if(d.beforeSerialize&&d.beforeSerialize(this,d)===false){a("ajaxSubmit: submit aborted via beforeSerialize callback");return this}var o,i,w=this.formToArray(d.semantic);if(d.data){d.extraData=d.data;for(o in d.data){if(d.data[o] instanceof Array){for(var r in d.data[o]){w.push({name:o,value:d.data[o][r]})}}else{i=d.data[o];i=b.isFunction(i)?i():i;w.push({name:o,value:i})}}}if(d.beforeSubmit&&d.beforeSubmit(w,this,d)===false){a("ajaxSubmit: submit aborted via beforeSubmit callback");return this}this.trigger("form-submit-validate",[w,this,d,j]);if(j.veto){a("ajaxSubmit: submit vetoed via form-submit-validate trigger");return this}var m=b.param(w);if(d.type.toUpperCase()=="GET"){d.url+=(d.url.indexOf("?")>=0?"&":"?")+m;d.data=null}else{d.data=m}var x=[];if(d.resetForm){x.push(function(){g.resetForm()})}if(d.clearForm){x.push(function(){g.clearForm()})}if(!d.dataType&&d.target){var e=d.success||function(){};x.push(function(n){var k=d.replaceTarget?"replaceWith":"html";b(d.target)[k](n).each(e,arguments)})}else{if(d.success){x.push(d.success)}}d.success=function(y,n,z){var v=d.context||d;for(var q=0,k=x.length;q<k;q++){x[q].apply(v,[y,n,z||g,g])}};var t=b("input:file",this).length>0;var s="multipart/form-data";var l=(g.attr("enctype")==s||g.attr("encoding")==s);if(d.iframe!==false&&(t||d.iframe||l)){if(d.closeKeepAlive){b.get(d.closeKeepAlive,function(){h(w)})}else{h(w)}}else{if(b.browser.msie&&c=="get"){var u=g[0].getAttribute("method");if(typeof u==="string"){d.type=u}}b.ajax(d)}this.trigger("form-submit-notify",[this,d]);return this;function h(R){var v=g[0],N,H,P,K,z,C,A,B,L,O,F;if(R){for(N=0;N<R.length;N++){b(v[R[N].name]).attr("disabled",false)}}if(b(":input[name=submit],:input[id=submit]",v).length){alert('Error: Form elements must not have name or id of "submit".');return}H=b.extend(true,{},b.ajaxSettings,d);H.context=H.context||H;K="jqFormIO"+(new Date().getTime());if(H.iframeTarget){z=b(H.iframeTarget);L=z.attr("name");if(L==null){z.attr("name",K)}else{K=L}}else{z=b('<iframe name="'+K+'" src="'+H.iframeSrc+'" />');z.css({position:"absolute",top:"-1000px",left:"-1000px"})}C=z[0];A={aborted:0,responseText:null,responseXML:null,status:0,statusText:"n/a",getAllResponseHeaders:function(){},getResponseHeader:function(){},setRequestHeader:function(){},abort:function(n){var U=(n==="timeout"?"timeout":"aborted");a("aborting upload... "+U);this.aborted=1;z.attr("src",H.iframeSrc);A.error=U;H.error&&H.error.call(H.context,A,U,n);P&&b.event.trigger("ajaxError",[A,H,U]);H.complete&&H.complete.call(H.context,A,U)}};P=H.global;if(P&&!b.active++){b.event.trigger("ajaxStart")}if(P){b.event.trigger("ajaxSend",[A,H])}if(H.beforeSend&&H.beforeSend.call(H.context,A,H)===false){if(H.global){b.active--}return}if(A.aborted){return}B=v.clk;if(B){L=B.name;if(L&&!B.disabled){H.extraData=H.extraData||{};H.extraData[L]=B.value;if(B.type=="image"){H.extraData[L+".x"]=v.clk_x;H.extraData[L+".y"]=v.clk_y}}}var G=1;var D=2;function E(U){var n=U.contentWindow?U.contentWindow.document:U.contentDocument?U.contentDocument:U.document;return n}function M(){var W=g.attr("target"),U=g.attr("action");v.setAttribute("target",K);if(!c){v.setAttribute("method","POST")}if(U!=H.url){v.setAttribute("action",H.url)}if(!H.skipEncodingOverride&&(!c||/post/i.test(c))){g.attr({encoding:"multipart/form-data",enctype:"multipart/form-data"})}if(H.timeout){F=setTimeout(function(){O=true;J(G)},H.timeout)}function X(){try{var n=E(C).readyState;a("state = "+n);if(n.toLowerCase()=="uninitialized"){setTimeout(X,50)}}catch(Z){a("Server abort: ",Z," (",Z.name,")");J(D);F&&clearTimeout(F);F=undefined}}var V=[];try{if(H.extraData){for(var Y in H.extraData){V.push(b('<input type="hidden" name="'+Y+'" />').attr("value",H.extraData[Y]).appendTo(v)[0])}}if(!H.iframeTarget){z.appendTo("body");C.attachEvent?C.attachEvent("onload",J):C.addEventListener("load",J,false)}setTimeout(X,15);v.submit()}finally{v.setAttribute("action",U);if(W){v.setAttribute("target",W)}else{g.removeAttr("target")}b(V).remove()}}if(H.forceSync){M()}else{setTimeout(M,10)}var S,T,Q=50,y;function J(Y){if(A.aborted||y){return}try{T=E(C)}catch(ab){a("cannot access response document: ",ab);Y=D}if(Y===G&&A){A.abort("timeout");return}else{if(Y==D&&A){A.abort("server abort");return}}if(!T||T.location.href==H.iframeSrc){if(!O){return}}C.detachEvent?C.detachEvent("onload",J):C.removeEventListener("load",J,false);var W="success",aa;try{if(O){throw"timeout"}var V=H.dataType=="xml"||T.XMLDocument||b.isXMLDoc(T);a("isXml="+V);if(!V&&window.opera&&(T.body==null||T.body.innerHTML=="")){if(--Q){a("requeing onLoad callback, DOM not available");setTimeout(J,250);return}}var ac=T.body?T.body:T.documentElement;A.responseText=ac?ac.innerHTML:null;A.responseXML=T.XMLDocument?T.XMLDocument:T;if(V){H.dataType="xml"}A.getResponseHeader=function(af){var ae={"content-type":H.dataType};return ae[af]};if(ac){A.status=Number(ac.getAttribute("status"))||A.status;A.statusText=ac.getAttribute("statusText")||A.statusText}var n=H.dataType||"";var Z=/(json|script|text)/.test(n.toLowerCase());if(Z||H.textarea){var X=T.getElementsByTagName("textarea")[0];if(X){A.responseText=X.value;A.status=Number(X.getAttribute("status"))||A.status;A.statusText=X.getAttribute("statusText")||A.statusText}else{if(Z){var U=T.getElementsByTagName("pre")[0];var ad=T.getElementsByTagName("body")[0];if(U){A.responseText=U.textContent?U.textContent:U.innerHTML}else{if(ad){A.responseText=ad.innerHTML}}}}}else{if(H.dataType=="xml"&&!A.responseXML&&A.responseText!=null){A.responseXML=I(A.responseText)}}try{S=k(A,H.dataType,H)}catch(Y){W="parsererror";A.error=aa=(Y||W)}}catch(Y){a("error caught: ",Y);W="error";A.error=aa=(Y||W)}if(A.aborted){a("upload aborted");W=null}if(A.status){W=(A.status>=200&&A.status<300||A.status===304)?"success":"error"}if(W==="success"){H.success&&H.success.call(H.context,S,"success",A);P&&b.event.trigger("ajaxSuccess",[A,H])}else{if(W){if(aa==undefined){aa=A.statusText}H.error&&H.error.call(H.context,A,W,aa);P&&b.event.trigger("ajaxError",[A,H,aa])}}P&&b.event.trigger("ajaxComplete",[A,H]);if(P&&!--b.active){b.event.trigger("ajaxStop")}H.complete&&H.complete.call(H.context,A,W);y=true;if(H.timeout){clearTimeout(F)}setTimeout(function(){if(!H.iframeTarget){z.remove()}A.responseXML=null},100)}var I=b.parseXML||function(n,U){if(window.ActiveXObject){U=new ActiveXObject("Microsoft.XMLDOM");U.async="false";U.loadXML(n)}else{U=(new DOMParser()).parseFromString(n,"text/xml")}return(U&&U.documentElement&&U.documentElement.nodeName!="parsererror")?U:null};var q=b.parseJSON||function(n){return window["eval"]("("+n+")")};var k=function(Y,W,V){var U=Y.getResponseHeader("content-type")||"",n=W==="xml"||!W&&U.indexOf("xml")>=0,X=n?Y.responseXML:Y.responseText;if(n&&X.documentElement.nodeName==="parsererror"){b.error&&b.error("parsererror")}if(V&&V.dataFilter){X=V.dataFilter(X,W)}if(typeof X==="string"){if(W==="json"||!W&&U.indexOf("json")>=0){X=q(X)}else{if(W==="script"||!W&&U.indexOf("javascript")>=0){b.globalEval(X)}}}return X}}};b.fn.ajaxForm=function(c){if(this.length===0){var d={s:this.selector,c:this.context};if(!b.isReady&&d.s){a("DOM not ready, queuing ajaxForm");b(function(){b(d.s,d.c).ajaxForm(c)});return this}a("terminating; zero elements found by selector"+(b.isReady?"":" (DOM not ready)"));return this}return this.ajaxFormUnbind().bind("submit.form-plugin",function(f){if(!f.isDefaultPrevented()){f.preventDefault();b(this).ajaxSubmit(c)}}).bind("click.form-plugin",function(j){var i=j.target;var g=b(i);if(!(g.is(":submit,input:image"))){var f=g.closest(":submit");if(f.length==0){return}i=f[0]}var h=this;h.clk=i;if(i.type=="image"){if(j.offsetX!=undefined){h.clk_x=j.offsetX;h.clk_y=j.offsetY}else{if(typeof b.fn.offset=="function"){var k=g.offset();h.clk_x=j.pageX-k.left;h.clk_y=j.pageY-k.top}else{h.clk_x=j.pageX-i.offsetLeft;h.clk_y=j.pageY-i.offsetTop}}}setTimeout(function(){h.clk=h.clk_x=h.clk_y=null},100)})};b.fn.ajaxFormUnbind=function(){return this.unbind("submit.form-plugin click.form-plugin")};b.fn.formToArray=function(q){var p=[];if(this.length===0){return p}var d=this[0];var g=q?d.getElementsByTagName("*"):d.elements;if(!g){return p}var k,h,f,r,e,m,c;for(k=0,m=g.length;k<m;k++){e=g[k];f=e.name;if(!f){continue}if(q&&d.clk&&e.type=="image"){if(!e.disabled&&d.clk==e){p.push({name:f,value:b(e).val()});p.push({name:f+".x",value:d.clk_x},{name:f+".y",value:d.clk_y})}continue}r=b.fieldValue(e,true);if(r&&r.constructor==Array){for(h=0,c=r.length;h<c;h++){p.push({name:f,value:r[h]})}}else{if(r!==null&&typeof r!="undefined"){p.push({name:f,value:r})}}}if(!q&&d.clk){var l=b(d.clk),o=l[0];f=o.name;if(f&&!o.disabled&&o.type=="image"){p.push({name:f,value:l.val()});p.push({name:f+".x",value:d.clk_x},{name:f+".y",value:d.clk_y})}}return p};b.fn.formSerialize=function(c){return b.param(this.formToArray(c))};b.fn.fieldSerialize=function(d){var c=[];this.each(function(){var h=this.name;if(!h){return}var f=b.fieldValue(this,d);if(f&&f.constructor==Array){for(var g=0,e=f.length;g<e;g++){c.push({name:h,value:f[g]})}}else{if(f!==null&&typeof f!="undefined"){c.push({name:this.name,value:f})}}});return b.param(c)};b.fn.fieldValue=function(h){for(var g=[],e=0,c=this.length;e<c;e++){var f=this[e];var d=b.fieldValue(f,h);if(d===null||typeof d=="undefined"||(d.constructor==Array&&!d.length)){continue}d.constructor==Array?b.merge(g,d):g.push(d)}return g};b.fieldValue=function(c,j){var e=c.name,p=c.type,q=c.tagName.toLowerCase();if(j===undefined){j=true}if(j&&(!e||c.disabled||p=="reset"||p=="button"||(p=="checkbox"||p=="radio")&&!c.checked||(p=="submit"||p=="image")&&c.form&&c.form.clk!=c||q=="select"&&c.selectedIndex==-1)){return null}if(q=="select"){var k=c.selectedIndex;if(k<0){return null}var m=[],d=c.options;var g=(p=="select-one");var l=(g?k+1:d.length);for(var f=(g?k:0);f<l;f++){var h=d[f];if(h.selected){var o=h.value;if(!o){o=(h.attributes&&h.attributes.value&&!(h.attributes.value.specified))?h.text:h.value}if(g){return o}m.push(o)}}return m}return b(c).val()};b.fn.clearForm=function(){return this.each(function(){b("input,select,textarea",this).clearFields()})};b.fn.clearFields=b.fn.clearInputs=function(){var c=/^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i;return this.each(function(){var e=this.type,d=this.tagName.toLowerCase();if(c.test(e)||d=="textarea"){this.value=""}else{if(e=="checkbox"||e=="radio"){this.checked=false}else{if(d=="select"){this.selectedIndex=-1}}}})};b.fn.resetForm=function(){return this.each(function(){if(typeof this.reset=="function"||(typeof this.reset=="object"&&!this.reset.nodeType)){this.reset()}})};b.fn.enable=function(c){if(c===undefined){c=true}return this.each(function(){this.disabled=!c})};b.fn.selected=function(c){if(c===undefined){c=true}return this.each(function(){var d=this.type;if(d=="checkbox"||d=="radio"){this.checked=c}else{if(this.tagName.toLowerCase()=="option"){var e=b(this).parent("select");if(c&&e[0]&&e[0].type=="select-one"){e.find("option").selected(false)}this.selected=c}}})};function a(){var c="[jquery.form] "+Array.prototype.join.call(arguments,"");if(window.console&&window.console.log){window.console.log(c)}else{if(window.opera&&window.opera.postError){window.opera.postError(c)}}}})(jQuery);
/*chosen/chosen.jquery.js*/
(function(){var a;a=(function(){function b(){this.options_index=0;this.parsed=[]}b.prototype.add_node=function(c){if(c.nodeName.toUpperCase()==="OPTGROUP"){return this.add_group(c)}else{return this.add_option(c)}};b.prototype.add_group=function(i){var h,e,g,d,f,c;h=this.parsed.length;this.parsed.push({array_index:h,group:true,label:i.label,children:0,disabled:i.disabled});f=i.childNodes;c=[];for(g=0,d=f.length;g<d;g++){e=f[g];c.push(this.add_option(e,h,i.disabled))}return c};b.prototype.add_option=function(d,e,c){if(d.nodeName.toUpperCase()==="OPTION"){if(d.text!==""){if(e!=null){this.parsed[e].children+=1}this.parsed.push({array_index:this.parsed.length,options_index:this.options_index,value:d.value,text:d.text,html:d.innerHTML,selected:d.selected,disabled:c===true?c:d.disabled,group_array_index:e,classes:d.className,style:d.style.cssText})}else{this.parsed.push({array_index:this.parsed.length,options_index:this.options_index,empty:true})}return this.options_index+=1}};return b})();a.select_to_array=function(b){var g,f,e,c,d;f=new a();d=b.childNodes;for(e=0,c=d.length;e<c;e++){g=d[e];f.add_node(g)}return f.parsed};this.SelectParser=a}).call(this);(function(){var b,a;a=this;b=(function(){function c(d,e){this.form_field=d;this.options=e!=null?e:{};this.is_multiple=this.form_field.multiple;this.set_default_text();this.set_default_values();this.setup();this.set_up_html();this.register_observers();this.finish_setup()}c.prototype.set_default_values=function(){var d=this;this.click_test_action=function(e){return d.test_active_click(e)};this.activate_action=function(e){return d.activate_field(e)};this.active_field=false;this.mouse_on_container=false;this.results_showing=false;this.result_highlighted=null;this.result_single_selected=null;this.allow_single_deselect=(this.options.allow_single_deselect!=null)&&(this.form_field.options[0]!=null)&&this.form_field.options[0].text===""?this.options.allow_single_deselect:false;this.disable_search_threshold=this.options.disable_search_threshold||0;this.disable_search=this.options.disable_search||false;this.enable_split_word_search=this.options.enable_split_word_search!=null?this.options.enable_split_word_search:true;this.search_contains=this.options.search_contains||false;this.choices=0;this.single_backstroke_delete=this.options.single_backstroke_delete||false;this.max_selected_options=this.options.max_selected_options||Infinity;return this.inherit_select_classes=this.options.inherit_select_classes||false};c.prototype.set_default_text=function(){if(this.form_field.getAttribute("data-placeholder")){this.default_text=this.form_field.getAttribute("data-placeholder")}else{if(this.is_multiple){this.default_text=this.options.placeholder_text_multiple||this.options.placeholder_text||"Select Some Options"}else{this.default_text=this.options.placeholder_text_single||this.options.placeholder_text||"Select an Option"}}return this.results_none_found=this.form_field.getAttribute("data-no_results_text")||this.options.no_results_text||"No results match"};c.prototype.mouse_enter=function(){return this.mouse_on_container=true};c.prototype.mouse_leave=function(){return this.mouse_on_container=false};c.prototype.input_focus=function(d){var e=this;if(this.is_multiple){if(!this.active_field){return setTimeout((function(){return e.container_mousedown()}),50)}}else{if(!this.active_field){return this.activate_field()}}};c.prototype.input_blur=function(d){var e=this;if(!this.mouse_on_container){this.active_field=false;return setTimeout((function(){return e.blur_test()}),100)}};c.prototype.result_add_option=function(f){var d,e;if(!f.disabled){f.dom_id=this.container_id+"_o_"+f.array_index;d=f.selected&&this.is_multiple?[]:["active-result"];if(f.selected){d.push("result-selected")}if(f.group_array_index!=null){d.push("group-option")}if(f.classes!==""){d.push(f.classes)}e=f.style.cssText!==""?' style="'+f.style+'"':"";return'<li id="'+f.dom_id+'" class="'+d.join(" ")+'"'+e+">"+f.html+"</li>"}else{return""}};c.prototype.results_update_field=function(){if(!this.is_multiple){this.results_reset_cleanup()}this.result_clear_highlight();this.result_single_selected=null;return this.results_build()};c.prototype.results_toggle=function(){if(this.results_showing){return this.results_hide()}else{return this.results_show()}};c.prototype.results_search=function(d){if(this.results_showing){return this.winnow_results()}else{return this.results_show()}};c.prototype.keyup_checker=function(d){var f,e;f=(e=d.which)!=null?e:d.keyCode;this.search_field_scale();switch(f){case 8:if(this.is_multiple&&this.backstroke_length<1&&this.choices>0){return this.keydown_backstroke()}else{if(!this.pending_backstroke){this.result_clear_highlight();return this.results_search()}}break;case 13:d.preventDefault();if(this.results_showing){return this.result_select(d)}break;case 27:if(this.results_showing){this.results_hide()}return true;case 9:case 38:case 40:case 16:case 91:case 17:break;default:return this.results_search()}};c.prototype.generate_field_id=function(){var d;d=this.generate_random_id();this.form_field.id=d;return d};c.prototype.generate_random_char=function(){var f,e,d;f="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";d=Math.floor(Math.random()*f.length);return e=f.substring(d,d+1)};return c})();a.AbstractChosen=b}).call(this);(function(){var e,f,d,a,b={}.hasOwnProperty,c=function(j,h){for(var g in h){if(b.call(h,g)){j[g]=h[g]}}function i(){this.constructor=j}i.prototype=h.prototype;j.prototype=new i();j.__super__=h.prototype;return j};a=this;e=jQuery;e.fn.extend({chosen:function(i){var h,g,j;j=navigator.userAgent.toLowerCase();g=/(msie) ([\w.]+)/.exec(j)||[];h={name:g[1]||"",version:g[2]||"0"};if(h.name==="msie"&&(h.version==="6.0"||(h.version==="7.0"&&document.documentMode===7))){return this}return this.each(function(k){var l;l=e(this);if(!l.hasClass("chzn-done")){return l.data("chosen",new f(this,i))}})}});f=(function(g){c(h,g);function h(){h.__super__.constructor.apply(this,arguments)}h.prototype.setup=function(){this.form_field_jq=e(this.form_field);this.current_value=this.form_field_jq.val();this.is_drop_up=0;this.prevHeight=0;return this.is_rtl=this.form_field_jq.hasClass("chzn-rtl")};h.prototype.finish_setup=function(){return this.form_field_jq.addClass("chzn-done")};h.prototype.set_up_html=function(){var n,q,m,p,l,o,i,k;this.container_id=this.form_field.id.length?this.form_field.id.replace(/[^\w]/g,"_"):this.generate_field_id();this.container_id+="_chzn";n=["chzn-container"];n.push("chzn-container-"+(this.is_multiple?"multi":"single"));if(this.inherit_select_classes&&this.form_field.className){n.push(this.form_field.className)}if(this.is_rtl){n.push("chzn-rtl")}var j=this.form_field_jq.attr("class");n.push(j);this.f_width=this.form_field_jq.outerWidth();m={id:this.container_id,"class":n.join(" "),style:"margin-left: 0px;",title:this.form_field.title};q=e("<div />",m);if(this.disable_search_threshold>0){i=" span12 "}else{i=""}if(this.form_field.options.length<=this.disable_search_threshold){k='style="padding:0px; height: 0px; overflow: hidden;"'}if(this.is_multiple){q.html('<ul class="chzn-choices"><li class="search-field"><input type="text" value="'+this.default_text+'" class="default" autocomplete="off" style="width:25px;" /></li></ul><div class="chzn-drop" style="left:-9000px;"><ul class="chzn-results"></ul></div>')}else{q.html('<a href="javascript:void(0)" class="chzn-single chzn-default" tabindex="-1"><span>'+this.default_text+'</span><div><b></b></div></a><div class="chzn-drop span12" style="left:-9000px; margin-left:0px !important"><div class="chzn-search '+i+'" '+k+'><input type="text" autocomplete="off" class="span12" /></div><ul class="chzn-results span12"></ul></div>')}this.form_field_jq.hide().after(q);this.container=e("#"+this.container_id);this.dropdown=this.container.find("div.chzn-drop").first();p=this.container.height();this.dropdown.css({top:p+"px"});this.search_field=this.container.find("input").first();this.search_results=this.container.find("ul.chzn-results").first();this.search_field_scale();this.search_no_results=this.container.find("li.no-results").first();if(this.is_multiple){this.search_choices=this.container.find("ul.chzn-choices").first();this.search_container=this.container.find("li.search-field").first()}else{this.search_container=this.container.find("div.chzn-search").first();this.selected_item=this.container.find(".chzn-single").first()}this.results_build();this.set_tab_index();return this.form_field_jq.trigger("liszt:ready",{chosen:this})};h.prototype.register_observers=function(){var i=this;this.container.mousedown(function(j){i.container_mousedown(j)});this.container.mouseup(function(j){i.container_mouseup(j)});this.container.mouseenter(function(j){i.mouse_enter(j)});this.container.mouseleave(function(j){i.mouse_leave(j)});this.search_results.mouseup(function(j){i.search_results_mouseup(j)});this.search_results.mouseover(function(j){i.search_results_mouseover(j)});this.search_results.mouseout(function(j){i.search_results_mouseout(j)});this.form_field_jq.bind("liszt:updated",function(j){i.results_update_field(j)});this.form_field_jq.bind("liszt:activate",function(j){i.activate_field(j)});this.form_field_jq.bind("liszt:open",function(j){i.container_mousedown(j)});this.search_field.blur(function(j){i.input_blur(j)});this.search_field.keyup(function(j){i.keyup_checker(j)});this.search_field.keydown(function(j){i.keydown_checker(j)});this.search_field.focus(function(j){i.input_focus(j)});if(this.is_multiple){return this.search_choices.click(function(j){i.choices_click(j)})}else{return this.container.click(function(j){j.preventDefault()})}};h.prototype.search_field_disabled=function(){this.is_disabled=this.form_field_jq[0].disabled;if(this.is_disabled){this.container.addClass("chzn-disabled");this.search_field[0].disabled=true;if(!this.is_multiple){this.selected_item.unbind("focus",this.activate_action)}return this.close_field()}else{this.container.removeClass("chzn-disabled");this.search_field[0].disabled=false;if(!this.is_multiple){return this.selected_item.bind("focus",this.activate_action)}}};h.prototype.container_mousedown=function(i){var j;if(!this.is_disabled){j=i!=null?(e(i.target)).hasClass("search-choice-close"):false;if(i&&i.type==="mousedown"&&!this.results_showing){i.preventDefault()}if(!this.pending_destroy_click&&!j){if(!this.active_field){if(this.is_multiple){this.search_field.val("")}e(document).click(this.click_test_action);this.results_show()}else{if(!this.is_multiple&&i&&((e(i.target)[0]===this.selected_item[0])||e(i.target).parents("a.chzn-single").length)){i.preventDefault();this.results_toggle()}}return this.activate_field()}else{return this.pending_destroy_click=false}}};h.prototype.container_mouseup=function(i){if(i.target.nodeName==="ABBR"&&!this.is_disabled){return this.results_reset(i)}};h.prototype.blur_test=function(i){if(!this.active_field&&this.container.hasClass("chzn-container-active")){return this.close_field()}};h.prototype.close_field=function(){e(document).unbind("click",this.click_test_action);this.active_field=false;this.results_hide();this.container.removeClass("chzn-container-active");this.winnow_results_clear();this.clear_backstroke();this.show_search_field_default();return this.search_field_scale()};h.prototype.activate_field=function(){this.container.addClass("chzn-container-active");this.active_field=true;this.search_field.val(this.search_field.val());return this.search_field.focus()};h.prototype.test_active_click=function(i){if(e(i.target).parents("#"+this.container_id).length){return this.active_field=true}else{return this.close_field()}};h.prototype.results_build=function(){var j,m,l,i,k;this.parsing=true;this.results_data=a.SelectParser.select_to_array(this.form_field);if(this.is_multiple&&this.choices>0){this.search_choices.find("li.search-choice").remove();this.choices=0}else{if(!this.is_multiple){this.selected_item.addClass("chzn-default").find("span").text(this.default_text);if(this.disable_search||this.is_multiple||this.form_field.options.length<=this.disable_search_threshold){this.container.addClass("chzn-container-single-nosearch");this.container.find(".chzn-search").removeClass("span12")}else{this.container.removeClass("chzn-container-single-nosearch")}}}j="";k=this.results_data;for(l=0,i=k.length;l<i;l++){m=k[l];if(m.group){j+=this.result_add_group(m)}else{if(!m.empty){j+=this.result_add_option(m);if(m.selected&&this.is_multiple){this.choice_build(m)}else{if(m.selected&&!this.is_multiple){this.selected_item.removeClass("chzn-default").find("span").text(m.text);if(this.allow_single_deselect){this.single_deselect_control_build()}}}}}}this.search_field_disabled();this.show_search_field_default();this.search_field_scale();this.search_results.html(j);return this.parsing=false};h.prototype.result_add_group=function(i){if(!i.disabled){i.dom_id=this.container_id+"_g_"+i.array_index;return'<li id="'+i.dom_id+'" class="group-result">'+e("<div />").text(i.label).html()+"</li>"}else{return""}};h.prototype.result_do_highlight=function(j){var n,m,k,l,i;if(j.length){this.result_clear_highlight();this.result_highlight=j;this.result_highlight.addClass("highlighted");k=parseInt(this.search_results.css("maxHeight"),10);i=this.search_results.scrollTop();l=k+i;m=this.result_highlight.position().top+this.search_results.scrollTop();n=m+this.result_highlight.outerHeight();if(n>=l){return this.search_results.scrollTop((n-k)>0?n-k:0)}else{if(m<i){return this.search_results.scrollTop(m)}}}};h.prototype.result_clear_highlight=function(){if(this.result_highlight){this.result_highlight.removeClass("highlighted")}return this.result_highlight=null};h.prototype.results_show=function(){var r=this;e(window).resize(function(){r.results_hide()});var q;if(!this.is_multiple){this.selected_item.addClass("chzn-single-with-drop");if(this.result_single_selected){this.result_do_highlight(this.result_single_selected)}}else{if(this.max_selected_options<=this.choices){this.form_field_jq.trigger("liszt:maxselected",{chosen:this});return false}}q=this.is_multiple?this.container.height():this.container.height()-1;this.form_field_jq.trigger("liszt:showing_dropdown",{chosen:this});if(e(".modal.in").length){var k=this.container.offset();var j=this.container.width()+1;var l=parseInt(e(window).scrollTop(),10);l=l<0?0:l;var o=0;if(this.container.hasClass("ajax-chosen")){this.is_drop_up=0}else{if(!this.container.hasClass("no-drop-up")){var n=this.dropdown.closest("div.dg").find("div.row-fluid").size();var m=this.dropdown.closest("div.row-fluid").index();if(((n-m<2&&n>5)||(n>8&&m>n/2))&&!this.is_multiple){o=this.dropdown.height()+q;this.is_drop_up=1;this.container.addClass("chzn_drop_up")}else{this.is_drop_up=0}}}var i=k.top+q-o-l-2;this.dropdown.css({top:i+"px",left:k.left+"px",width:j+"px"})}else{var p=q;if(this.container.hasClass("series-drop-up")){this.is_drop_up=1;this.container.addClass("chzn_drop_up");var p=-(this.dropdown.height()+2)}this.dropdown.css({top:p+"px",left:0})}this.results_showing=true;this.search_field.focus();this.search_field.val(this.search_field.val());return this.winnow_results()};h.prototype.results_hide=function(){if(!this.is_multiple){this.selected_item.removeClass("chzn-single-with-drop")}this.result_clear_highlight();this.form_field_jq.trigger("liszt:hiding_dropdown",{chosen:this});this.dropdown.css({left:"-9000px"});return this.results_showing=false};h.prototype.set_tab_index=function(j){var i;if(this.form_field_jq.attr("tabindex")){i=this.form_field_jq.attr("tabindex");this.form_field_jq.attr("tabindex",-1);return this.search_field.attr("tabindex",i)}};h.prototype.show_search_field_default=function(){if(this.is_multiple&&this.choices<1&&!this.active_field){this.search_field.val(this.default_text);return this.search_field.addClass("default")}else{this.search_field.val("");return this.search_field.removeClass("default")}};h.prototype.search_results_mouseup=function(i){var j;j=e(i.target).hasClass("active-result")?e(i.target):e(i.target).parents(".active-result").first();if(j.length){this.result_highlight=j;this.result_select(i);return this.search_field.focus()}};h.prototype.search_results_mouseover=function(i){var j;j=e(i.target).hasClass("active-result")?e(i.target):e(i.target).parents(".active-result").first();if(j){return this.result_do_highlight(j)}};h.prototype.search_results_mouseout=function(i){if(e(i.target).hasClass("active-result"||e(i.target).parents(".active-result").first())){return this.result_clear_highlight()}};h.prototype.choices_click=function(i){i.preventDefault();if(this.active_field&&!(e(i.target).hasClass("search-choice"||e(i.target).parents(".search-choice").first))&&!this.results_showing){return this.results_show()}};h.prototype.choice_build=function(l){var i,j,k,m=this;if(this.is_multiple&&this.max_selected_options<=this.choices){this.form_field_jq.trigger("liszt:maxselected",{chosen:this});return false}i=this.container_id+"_c_"+l.array_index;this.choices+=1;if(l.disabled){j='<li class="search-choice search-choice-disabled" id="'+i+'"><span>'+l.html+"</span></li>"}else{j='<li class="search-choice" id="'+i+'"><span>'+l.html+'</span><a href="javascript:void(0)" class="search-choice-close" rel="'+l.array_index+'"></a></li>'}this.search_container.before(j);k=e("#"+i).find("a").first();return k.click(function(n){return m.choice_destroy_link_click(n)})};h.prototype.choice_destroy_link_click=function(i){i.preventDefault();if(!this.is_disabled){this.pending_destroy_click=true;return this.choice_destroy(e(i.target))}else{return i.stopPropagation}};h.prototype.choice_destroy=function(i){if(this.result_deselect(i.attr("rel"))){this.choices-=1;this.show_search_field_default();if(this.is_multiple&&this.choices>0&&this.search_field.val().length<1){this.results_hide()}i.parents("li").first().remove();return this.search_field_scale()}};h.prototype.results_reset=function(){this.form_field.options[0].selected=true;this.selected_item.find("span").text(this.default_text);if(!this.is_multiple){this.selected_item.addClass("chzn-default")}this.show_search_field_default();this.results_reset_cleanup();this.form_field_jq.trigger("change");if(this.active_field){return this.results_hide()}};h.prototype.results_reset_cleanup=function(){this.current_value=this.form_field_jq.val();return this.selected_item.find("abbr").remove()};h.prototype.result_select=function(j){var m,l,k,i;if(this.result_highlight){m=this.result_highlight;l=m.attr("id");this.result_clear_highlight();if(this.is_multiple){this.result_deactivate(m)}else{this.search_results.find(".result-selected").removeClass("result-selected");this.result_single_selected=m;this.selected_item.removeClass("chzn-default")}m.addClass("result-selected");i=l.substr(l.lastIndexOf("_")+1);k=this.results_data[i];k.selected=true;this.form_field.options[k.options_index].selected=true;if(this.is_multiple){this.choice_build(k)}else{this.selected_item.find("span").first().text(k.text);if(this.allow_single_deselect){this.single_deselect_control_build()}}if(!((j.metaKey||j.ctrlKey)&&this.is_multiple)){this.results_hide()}this.search_field.val("");if(this.is_multiple||this.form_field_jq.val()!==this.current_value){this.form_field_jq.trigger("change",{selected:this.form_field.options[k.options_index].value})}this.current_value=this.form_field_jq.val();return this.search_field_scale()}};h.prototype.result_activate=function(i){return i.addClass("active-result")};h.prototype.result_deactivate=function(i){return i.removeClass("active-result")};h.prototype.result_deselect=function(k){var i,j;j=this.results_data[k];if(!this.form_field.options[j.options_index].disabled){j.selected=false;this.form_field.options[j.options_index].selected=false;i=e("#"+this.container_id+"_o_"+k);i.removeClass("result-selected").addClass("active-result").show();this.result_clear_highlight();this.winnow_results();this.form_field_jq.trigger("change",{deselected:this.form_field.options[j.options_index].value});this.search_field_scale();return true}else{return false}};h.prototype.single_deselect_control_build=function(){if(this.allow_single_deselect&&this.selected_item.find("abbr").length<1){return this.selected_item.find("span").first().after('<abbr class="search-choice-close"></abbr>')}};h.prototype.winnow_results=function(){this.prevHeight=this.dropdown.height();var o,r,w,v,k,t,n,A,u,z,y,q,l,j,i,B,C,m;this.no_results_clear();u=0;z=this.search_field.val()===this.default_text?"":e("<div/>").text(e.trim(this.search_field.val())).html();t=this.search_contains?"":"^";k=new RegExp(t+z.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&"),"i");l=new RegExp(z.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&"),"i");m=this.results_data;for(j=0,B=m.length;j<B;j++){r=m[j];if(!r.disabled&&!r.empty){if(r.group){e("#"+r.dom_id).css("display","none")}else{if(!(this.is_multiple&&r.selected)){o=false;A=r.dom_id;n=e("#"+A);if(k.test(r.html)){o=true;u+=1}else{if(this.enable_split_word_search&&(r.html.indexOf(" ")>=0||r.html.indexOf("[")===0)){v=r.html.replace(/\[|\]/g,"").split(" ");if(v.length){for(i=0,C=v.length;i<C;i++){w=v[i];if(k.test(w)){o=true;u+=1}}}}}if(o){if(z.length){y=r.html.search(l);q=r.html.substr(0,y+z.length)+"</em>"+r.html.substr(y+z.length);q=q.substr(0,y)+"<em>"+q.substr(y)}else{q=r.html}n.html(q);this.result_activate(n);if(r.group_array_index!=null){e("#"+this.results_data[r.group_array_index].dom_id).css("display","list-item")}}else{if(this.result_highlight&&A===this.result_highlight.attr("id")){this.result_clear_highlight()}this.result_deactivate(n)}}}}}var x=this.dropdown.height();if(this.is_drop_up&&!this.is_multiple){var p=this.prevHeight-x;var s=parseInt(this.dropdown.css("top"),10);this.dropdown.css({top:(s+p)+"px"})}if(u<1&&z.length){return this.no_results(z)}else{return this.winnow_results_set_highlight()}};h.prototype.winnow_results_clear=function(){var i,l,m,k,j;this.search_field.val("");l=this.search_results.find("li");j=[];for(m=0,k=l.length;m<k;m++){i=l[m];i=e(i);if(i.hasClass("group-result")){j.push(i.css("display","auto"))}else{if(!this.is_multiple||!i.hasClass("result-selected")){j.push(this.result_activate(i))}else{j.push(void 0)}}}return j};h.prototype.winnow_results_set_highlight=function(){var i,j;if(!this.result_highlight){j=!this.is_multiple?this.search_results.find(".result-selected.active-result"):[];i=j.length?j.first():this.search_results.find(".active-result").first();if(i!=null){return this.result_do_highlight(i)}}};h.prototype.no_results=function(i){var j;j=e('<li class="no-results">'+this.results_none_found+' "<span></span>"</li>');j.find("span").first().html(i);return this.search_results.append(j)};h.prototype.no_results_clear=function(){return this.search_results.find(".no-results").remove()};h.prototype.keydown_arrow=function(){var j,i;if(!this.result_highlight){j=this.search_results.find("li.active-result").first();if(j){this.result_do_highlight(e(j))}}else{if(this.results_showing){i=this.result_highlight.nextAll("li.active-result").first();if(i){this.result_do_highlight(i)}}}if(!this.results_showing){return this.results_show()}};h.prototype.keyup_arrow=function(){var i;if(!this.results_showing&&!this.is_multiple){return this.results_show()}else{if(this.result_highlight){i=this.result_highlight.prevAll("li.active-result");if(i.length){return this.result_do_highlight(i.first())}else{if(this.choices>0){this.results_hide()}return this.result_clear_highlight()}}}};h.prototype.keydown_backstroke=function(){var i;if(this.pending_backstroke){this.choice_destroy(this.pending_backstroke.find("a").first());return this.clear_backstroke()}else{i=this.search_container.siblings("li.search-choice").last();if(i.length&&!i.hasClass("search-choice-disabled")){this.pending_backstroke=i;if(this.single_backstroke_delete){return this.keydown_backstroke()}else{return this.pending_backstroke.addClass("search-choice-focus")}}}};h.prototype.clear_backstroke=function(){if(this.pending_backstroke){this.pending_backstroke.removeClass("search-choice-focus")}return this.pending_backstroke=null};h.prototype.keydown_checker=function(i){var k,j;k=(j=i.which)!=null?j:i.keyCode;this.search_field_scale();if(k!==8&&this.pending_backstroke){this.clear_backstroke()}switch(k){case 8:this.backstroke_length=this.search_field.val().length;break;case 9:if(this.results_showing&&!this.is_multiple){this.result_select(i)}this.mouse_on_container=false;break;case 13:i.preventDefault();break;case 38:i.preventDefault();this.keyup_arrow();break;case 40:this.keydown_arrow();break}};h.prototype.search_field_scale=function(){var q,i,l,j,o,p,n,k,m;if(this.is_multiple){l=0;n=0;o="position:absolute; left: -1000px; top: -1000px; display:none;";p=["font-size","font-style","font-weight","font-family","line-height","text-transform","letter-spacing"];for(k=0,m=p.length;k<m;k++){j=p[k];o+=j+":"+this.search_field.css(j)+";"}i=e("<div />",{style:o});i.text(this.search_field.val());e("body").append(i);n=i.width()+25;i.remove();if(n>this.f_width-10){n=this.f_width-10}if(n<150){n=150}this.search_field.css({width:n+"px"})}};h.prototype.generate_random_id=function(){var i;i="sel"+this.generate_random_char()+this.generate_random_char()+this.generate_random_char();while(e("#"+i).length>0){i+=this.generate_random_char()}return i};return h})(AbstractChosen);a.Chosen=f;d=function(g){var h;return h=g.outerWidth()-g.width()};a.get_side_border_padding=d}).call(this);
/*chosen/ajax-chosen.js*/
(function(a){return a.fn.ajaxChosen=function(f,h,g){var d,c,e,b;if(f==null){f={}}if(h==null){h={}}if(g==null){g=function(){}}c={minTermLength:3,afterTypeDelay:100,jsonTermKey:"term",keepTypingMsg:"Keep typing...",lookingForMsg:"Looking for"};b=this;d=null;e=a.extend({},c,a(b).data(),f);this.chosen(g?g:{});return this.each(function(){return a(this).next(".chzn-container").find(".search-field > input, .chzn-search > input").bind("keyup",function(l){var k,o,n,j,m,i;j=a(this).attr("value");m=a.trim(a(this).attr("value"));if(l.which!=8&&l.which!=32){b.next(".chzn-container").find(".active-result").each(function(){if(!a(this).hasClass("result-selected")||!a(this).hasClass("no-results")){a(this).remove()}});if(b.next(".chzn-container").find(".no-results").size()==0){b.next(".chzn-container").find(".chzn-results").append('<li class="no-results"></li>')}}o=m.length<e.minTermLength?e.keepTypingMsg:e.lookingForMsg+(" '"+m+"'");b.next(".chzn-container").find(".no-results").text(o);if(m===a(this).data("prevVal")){return false}a(this).data("prevVal",m);if(this.timer){clearTimeout(this.timer)}if(m.length<e.minTermLength){return false}k=a(this);if(!(e.data!=null)){e.data={}}e.data[e.jsonTermKey]=m;if(e.dataCallback!=null){e.data=e.dataCallback(e.data)}n=e.success;e.success=function(r){var p,q;if(!(r!=null)){return}q=[];b.find("option").each(function(){if(!a(this).is(":selected")){return a(this).remove()}else{return q.push(a(this).val()+"-"+a(this).text())}});b.find("optgroup:empty").each(function(){return a(this).remove()});p=h(r);a.each(p,function(t,s){var v,w,u;if(s.group){v=b.find("optgroup[label='"+s.text+"']");if(!v.size()){v=a("<optgroup />")}v.attr("label",s.text).appendTo(b);return a.each(s.items,function(y,x){var A,z;if(typeof x==="string"){z=y;A=x}else{z=x.value;A=x.text}if(a.inArray(z+"-"+A,q)===-1){return a("<option />").attr("value",z).html(A).appendTo(v)}})}else{if(typeof s==="string"){u=t;w=s}else{u=s.value;w=s.text}if(a.inArray(u+"-"+w,q)===-1){return a("<option />").attr("value",u).html(w).appendTo(b)}}});i=k.attr("value");if(Object.keys(p).length){b.trigger("liszt:updated")}else{b.data().chosen.no_results_clear();b.data().chosen.no_results(k.attr("value"))}if(n!=null){n(r)}return k.attr("value",i)};return this.timer=setTimeout(function(){if(d){d.abort()}return d=a.ajax(e)},e.afterTypeDelay)})})}})(jQuery);
/*boostrap-wysihtml/wysihtml5-0.3.0.js*/
var wysihtml5={version:"0.3.0",commands:{},dom:{},quirks:{},toolbar:{},lang:{},selection:{},views:{},INVISIBLE_SPACE:"\uFEFF",EMPTY_FUNCTION:function(){},ELEMENT_NODE:1,TEXT_NODE:3,BACKSPACE_KEY:8,ENTER_KEY:13,ESCAPE_KEY:27,SPACE_KEY:32,DELETE_KEY:46};window.rangy=(function(){var j="object",g="function",z="undefined";var k=["startContainer","startOffset","endContainer","endOffset","collapsed","commonAncestorContainer","START_TO_START","START_TO_END","END_TO_START","END_TO_END"];var c=["setStart","setStartBefore","setStartAfter","setEnd","setEndBefore","setEndAfter","collapse","selectNode","selectNodeContents","compareBoundaryPoints","deleteContents","extractContents","cloneContents","insertNode","surroundContents","cloneRange","toString","detach"];var r=["boundingHeight","boundingLeft","boundingTop","boundingWidth","htmlText","text"];var o=["collapse","compareEndPoints","duplicate","getBookmark","moveToBookmark","moveToElementText","parentElement","pasteHTML","select","setEndPoint","getBoundingClientRect"];function i(C,B){var A=typeof C[B];return A==g||(!!(A==j&&C[B]))||A=="unknown"}function d(B,A){return !!(typeof B[A]==j&&B[A])}function p(B,A){return typeof B[A]!=z}function l(A){return function(D,C){var B=C.length;while(B--){if(!A(D,C[B])){return false}}return true}}var n=l(i);var q=l(d);var y=l(p);function u(A){return A&&n(A,o)&&y(A,r)}var m={version:"1.2.2",initialized:false,supported:true,util:{isHostMethod:i,isHostObject:d,isHostProperty:p,areHostMethods:n,areHostObjects:q,areHostProperties:y,isTextRange:u},features:{},modules:{},config:{alertOnWarn:false,preferTextRange:false}};function f(A){window.alert("Rangy not supported in your browser. Reason: "+A);m.initialized=true;m.supported=false}m.fail=f;function t(B){var A="Rangy warning: "+B;if(m.config.alertOnWarn){window.alert(A)}else{if(typeof window.console!=z&&typeof window.console.log!=z){window.console.log(A)}}}m.warn=t;if({}.hasOwnProperty){m.util.extend=function(C,B){for(var A in B){if(B.hasOwnProperty(A)){C[A]=B[A]}}}}else{f("hasOwnProperty not supported")}var v=[];var a=[];function s(){if(m.initialized){return}var C;var G=false,H=false;if(i(document,"createRange")){C=document.createRange();if(n(C,c)&&y(C,k)){G=true}C.detach()}var B=d(document,"body")?document.body:document.getElementsByTagName("body")[0];if(B&&i(B,"createTextRange")){C=B.createTextRange();if(u(C)){H=true}}if(!G&&!H){f("Neither Range nor TextRange are implemented")}m.initialized=true;m.features={implementsDomRange:G,implementsTextRange:H};var F=a.concat(v);for(var E=0,A=F.length;E<A;++E){try{F[E](m)}catch(D){if(d(window,"console")&&i(window.console,"log")){window.console.log("Init listener threw an exception. Continuing.",D)}}}}m.init=s;m.addInitListener=function(A){if(m.initialized){A(m)}else{v.push(A)}};var w=[];m.addCreateMissingNativeApiListener=function(A){w.push(A)};function e(C){C=C||window;s();for(var B=0,A=w.length;B<A;++B){w[B](C)}}m.createMissingNativeApi=e;function x(A){this.name=A;this.initialized=false;this.supported=false}x.prototype.fail=function(A){this.initialized=true;this.supported=false;throw new Error("Module '"+this.name+"' failed to load: "+A)};x.prototype.warn=function(A){m.warn("Module "+this.name+": "+A)};x.prototype.createError=function(A){return new Error("Error in Rangy "+this.name+" module: "+A)};m.createModule=function(A,C){var B=new x(A);m.modules[A]=B;a.push(function(D){C(D,B);B.initialized=true;B.supported=true})};m.requireModules=function(C){for(var E=0,A=C.length,D,B;E<A;++E){B=C[E];D=m.modules[B];if(!D||!(D instanceof x)){throw new Error("Module '"+B+"' not found")}if(!D.supported){throw new Error("Module '"+B+"' not supported")}}};var b=false;var h=function(A){if(!b){b=true;if(!m.initialized){s()}}};if(typeof window==z){f("No window found");return}if(typeof document==z){f("No document found");return}if(i(document,"addEventListener")){document.addEventListener("DOMContentLoaded",h,false)}if(i(window,"addEventListener")){window.addEventListener("load",h,false)}else{if(i(window,"attachEvent")){window.attachEvent("onload",h)}else{f("Window does not have required addEventListener or attachEvent method")}}return m})();rangy.createModule("DomUtil",function(p,d){var t="undefined";var b=p.util;if(!b.areHostMethods(document,["createDocumentFragment","createElement","createTextNode"])){d.fail("document missing a Node creation method")}if(!b.isHostMethod(document,"getElementsByTagName")){d.fail("document missing getElementsByTagName method")}var e=document.createElement("div");if(!b.areHostMethods(e,["insertBefore","appendChild","cloneNode"]||!b.areHostObjects(e,["previousSibling","nextSibling","childNodes","parentNode"]))){d.fail("Incomplete Element implementation")}if(!b.isHostProperty(e,"innerHTML")){d.fail("Element is missing innerHTML property")}var s=document.createTextNode("test");if(!b.areHostMethods(s,["splitText","deleteData","insertData","appendData","cloneNode"]||!b.areHostObjects(e,["previousSibling","nextSibling","childNodes","parentNode"])||!b.areHostProperties(s,["data"]))){d.fail("Incomplete Text Node implementation")}var y=function(E,G){var F=E.length;while(F--){if(E[F]===G){return true}}return false};function i(F){var E;return typeof F.namespaceURI==t||((E=F.namespaceURI)===null||E=="http://www.w3.org/1999/xhtml")}function j(F){var E=F.parentNode;return(E.nodeType==1)?E:null}function a(F){var E=0;while((F=F.previousSibling)){E++}return E}function g(E){var F;return m(E)?E.length:((F=E.childNodes)?F.length:0)}function x(F,E){var G=[],H;for(H=F;H;H=H.parentNode){G.push(H)}for(H=E;H;H=H.parentNode){if(y(G,H)){return H}}return null}function C(E,F,H){var G=H?F:F.parentNode;while(G){if(G===E){return true}else{G=G.parentNode}}return false}function z(F,E,I){var G,H=I?F:F.parentNode;while(H){G=H.parentNode;if(G===E){return H}H=G}return null}function m(F){var E=F.nodeType;return E==3||E==4||E==8}function v(H,F){var E=F.nextSibling,G=F.parentNode;if(E){G.insertBefore(H,E)}else{G.appendChild(H)}return H}function w(G,E){var F=G.cloneNode(false);F.deleteData(0,E);G.deleteData(E,G.length-E);v(F,G);return F}function q(E){if(E.nodeType==9){return E}else{if(typeof E.ownerDocument!=t){return E.ownerDocument}else{if(typeof E.document!=t){return E.document}else{if(E.parentNode){return q(E.parentNode)}else{throw new Error("getDocument: no document found for node")}}}}}function l(E){var F=q(E);if(typeof F.defaultView!=t){return F.defaultView}else{if(typeof F.parentWindow!=t){return F.parentWindow}else{throw new Error("Cannot get a window object for node")}}}function B(E){if(typeof E.contentDocument!=t){return E.contentDocument}else{if(typeof E.contentWindow!=t){return E.contentWindow.document}else{throw new Error("getIframeWindow: No Document object found for iframe element")}}}function f(E){if(typeof E.contentWindow!=t){return E.contentWindow}else{if(typeof E.contentDocument!=t){return E.contentDocument.defaultView}else{throw new Error("getIframeWindow: No Window object found for iframe element")}}}function D(E){return b.isHostObject(E,"body")?E.body:E.getElementsByTagName("body")[0]}function c(F){var E;while((E=F.parentNode)){F=E}return F}function r(H,J,G,I){var E,K,M,L,F;if(H==G){return J===I?0:(J<I)?-1:1}else{if((E=z(G,H,true))){return J<=a(E)?-1:1}else{if((E=z(H,G,true))){return a(E)<I?-1:1}else{K=x(H,G);M=(H===K)?K:z(H,K,true);L=(G===K)?K:z(G,K,true);if(M===L){throw new Error("comparePoints got to case 4 and childA and childB are the same!")}else{F=K.firstChild;while(F){if(F===M){return -1}else{if(F===L){return 1}}F=F.nextSibling}throw new Error("Should not be here!")}}}}}function A(F){var E=q(F).createDocumentFragment(),G;while((G=F.firstChild)){E.appendChild(G)}return E}function o(E){if(!E){return"[No node]"}if(m(E)){return'"'+E.data+'"'}else{if(E.nodeType==1){var F=E.id?' id="'+E.id+'"':"";return"<"+E.nodeName+F+">["+E.childNodes.length+"]"}else{return E.nodeName}}}function n(E){this.root=E;this._next=E}n.prototype={_current:null,hasNext:function(){return !!this._next},next:function(){var G=this._current=this._next;var F,E;if(this._current){F=G.firstChild;if(F){this._next=F}else{E=null;while((G!==this.root)&&!(E=G.nextSibling)){G=G.parentNode}this._next=E}}return this._current},detach:function(){this._current=this._next=this.root=null}};function h(E){return new n(E)}function k(E,F){this.node=E;this.offset=F}k.prototype={equals:function(E){return this.node===E.node&this.offset==E.offset},inspect:function(){return"[DomPosition("+o(this.node)+":"+this.offset+")]"}};function u(E){this.code=this[E];this.codeName=E;this.message="DOMException: "+this.codeName}u.prototype={INDEX_SIZE_ERR:1,HIERARCHY_REQUEST_ERR:3,WRONG_DOCUMENT_ERR:4,NO_MODIFICATION_ALLOWED_ERR:7,NOT_FOUND_ERR:8,NOT_SUPPORTED_ERR:9,INVALID_STATE_ERR:11};u.prototype.toString=function(){return this.message};p.dom={arrayContains:y,isHtmlNamespace:i,parentElement:j,getNodeIndex:a,getNodeLength:g,getCommonAncestor:x,isAncestorOf:C,getClosestAncestorIn:z,isCharacterDataNode:m,insertAfter:v,splitDataNode:w,getDocument:q,getWindow:l,getIframeWindow:f,getIframeDocument:B,getBody:D,getRootContainer:c,comparePoints:r,inspectNode:o,fragmentFromNodeChildren:A,createIterator:h,DomPosition:k};p.DOMException=u});rangy.createModule("DomRange",function(i,f){i.requireModules(["DomUtil"]);var b=i.dom;var E=b.DomPosition;var T=i.DOMException;function x(al,e){return(al.nodeType!=3)&&(b.isAncestorOf(al,e.startContainer,true)||b.isAncestorOf(al,e.endContainer,true))}function m(e){return b.getDocument(e.startContainer)}function u(al,ap,am){var ao=al._listeners[ap];if(ao){for(var an=0,e=ao.length;an<e;++an){ao[an].call(al,{target:al,args:am})}}}function A(e){return new E(e.parentNode,b.getNodeIndex(e))}function W(e){return new E(e.parentNode,b.getNodeIndex(e)+1)}function j(al,an,am){var e=al.nodeType==11?al.firstChild:al;if(b.isCharacterDataNode(an)){if(am==an.length){b.insertAfter(al,an)}else{an.parentNode.insertBefore(al,am==0?an:b.splitDataNode(an,am))}}else{if(am>=an.childNodes.length){an.appendChild(al)}else{an.insertBefore(al,an.childNodes[am])}}return e}function H(am){var al;for(var an,ao=m(am.range).createDocumentFragment(),e;an=am.next();){al=am.isPartiallySelectedSubtree();an=an.cloneNode(!al);if(al){e=am.getSubtreeIterator();an.appendChild(H(e));e.detach(true)}if(an.nodeType==10){throw new T("HIERARCHY_REQUEST_ERR")}ao.appendChild(an)}return ao}function V(al,ao,e){var am,aq;e=e||{stop:false};for(var an,ap;an=al.next();){if(al.isPartiallySelectedSubtree()){if(ao(an)===false){e.stop=true;return}else{ap=al.getSubtreeIterator();V(ap,ao,e);ap.detach(true);if(e.stop){return}}}else{am=b.createIterator(an);while((aq=am.next())){if(ao(aq)===false){e.stop=true;return}}}}}function n(al){var e;while(al.next()){if(al.isPartiallySelectedSubtree()){e=al.getSubtreeIterator();n(e);e.detach(true)}else{al.remove()}}}function Q(al){for(var am,an=m(al.range).createDocumentFragment(),e;am=al.next();){if(al.isPartiallySelectedSubtree()){am=am.cloneNode(false);e=al.getSubtreeIterator();am.appendChild(Q(e));e.detach(true)}else{al.remove()}if(am.nodeType==10){throw new T("HIERARCHY_REQUEST_ERR")}an.appendChild(am)}return an}function p(am,e,an){var ap=!!(e&&e.length),ao;var aq=!!an;if(ap){ao=new RegExp("^("+e.join("|")+")$")}var al=[];V(new g(am,false),function(ar){if((!ap||ao.test(ar.nodeType))&&(!aq||an(ar))){al.push(ar)}});return al}function z(e){var al=(typeof e.getName=="undefined")?"Range":e.getName();return"["+al+"("+b.inspectNode(e.startContainer)+":"+e.startOffset+", "+b.inspectNode(e.endContainer)+":"+e.endOffset+")]"}function g(am,al){this.range=am;this.clonePartiallySelectedTextNodes=al;if(!am.collapsed){this.sc=am.startContainer;this.so=am.startOffset;this.ec=am.endContainer;this.eo=am.endOffset;var e=am.commonAncestorContainer;if(this.sc===this.ec&&b.isCharacterDataNode(this.sc)){this.isSingleCharacterDataNode=true;this._first=this._last=this._next=this.sc}else{this._first=this._next=(this.sc===e&&!b.isCharacterDataNode(this.sc))?this.sc.childNodes[this.so]:b.getClosestAncestorIn(this.sc,e,true);this._last=(this.ec===e&&!b.isCharacterDataNode(this.ec))?this.ec.childNodes[this.eo-1]:b.getClosestAncestorIn(this.ec,e,true)}}}g.prototype={_current:null,_next:null,_first:null,_last:null,isSingleCharacterDataNode:false,reset:function(){this._current=null;this._next=this._first},hasNext:function(){return !!this._next},next:function(){var e=this._current=this._next;if(e){this._next=(e!==this._last)?e.nextSibling:null;if(b.isCharacterDataNode(e)&&this.clonePartiallySelectedTextNodes){if(e===this.ec){(e=e.cloneNode(true)).deleteData(this.eo,e.length-this.eo)}if(this._current===this.sc){(e=e.cloneNode(true)).deleteData(0,this.so)}}}return e},remove:function(){var al=this._current,am,e;if(b.isCharacterDataNode(al)&&(al===this.sc||al===this.ec)){am=(al===this.sc)?this.so:0;e=(al===this.ec)?this.eo:al.length;if(am!=e){al.deleteData(am,e-am)}}else{if(al.parentNode){al.parentNode.removeChild(al)}else{}}},isPartiallySelectedSubtree:function(){var e=this._current;return x(e,this.range)},getSubtreeIterator:function(){var al;if(this.isSingleCharacterDataNode){al=this.range.cloneRange();al.collapse()}else{al=new aj(m(this.range));var ap=this._current;var an=ap,e=0,ao=ap,am=b.getNodeLength(ap);if(b.isAncestorOf(ap,this.sc,true)){an=this.sc;e=this.so}if(b.isAncestorOf(ap,this.ec,true)){ao=this.ec;am=this.eo}D(al,an,e,ao,am)}return new g(al,this.clonePartiallySelectedTextNodes)},detach:function(e){if(e){this.range.detach()}this.range=this._current=this._next=this._first=this._last=this.sc=this.so=this.ec=this.eo=null}};function O(e){this.code=this[e];this.codeName=e;this.message="RangeException: "+this.codeName}O.prototype={BAD_BOUNDARYPOINTS_ERR:1,INVALID_NODE_TYPE_ERR:2};O.prototype.toString=function(){return this.message};function w(al,e,am){this.nodes=p(al,e,am);this._next=this.nodes[0];this._position=0}w.prototype={_current:null,hasNext:function(){return !!this._next},next:function(){this._current=this._next;this._next=this.nodes[++this._position];return this._current},detach:function(){this._current=this._next=this.nodes=null}};var ae=[1,3,4,5,7,8,10];var ac=[2,9,11];var B=[5,6,10,12];var M=[1,3,4,5,7,8,10,11];var F=[1,3,4,5,7,8];function Y(e){return function(am,ao){var al,an=ao?am:am.parentNode;while(an){al=an.nodeType;if(b.arrayContains(e,al)){return an}an=an.parentNode}return null}}var t=b.getRootContainer;var I=Y([9,11]);var K=Y(B);var c=Y([6,10,12]);function r(al,e){if(c(al,e)){throw new O("INVALID_NODE_TYPE_ERR")}}function C(e){if(!e.startContainer){throw new T("INVALID_STATE_ERR")}}function U(e,al){if(!b.arrayContains(al,e.nodeType)){throw new O("INVALID_NODE_TYPE_ERR")}}function ad(e,al){if(al<0||al>(b.isCharacterDataNode(e)?e.length:e.childNodes.length)){throw new T("INDEX_SIZE_ERR")}}function d(al,e){if(I(al,true)!==I(e,true)){throw new T("WRONG_DOCUMENT_ERR")}}function aa(e){if(K(e,true)){throw new T("NO_MODIFICATION_ALLOWED_ERR")}}function ah(al,e){if(!al){throw new T(e)}}function o(e){return !b.arrayContains(ac,e.nodeType)&&!I(e,true)}function ak(e,al){return al<=(b.isCharacterDataNode(e)?e.length:e.childNodes.length)}function h(e){C(e);if(o(e.startContainer)||o(e.endContainer)||!ak(e.startContainer,e.startOffset)||!ak(e.endContainer,e.endOffset)){throw new Error("Range error: Range is no longer valid after DOM mutation ("+e.inspect()+")")}}var a=document.createElement("style");var P=false;try{a.innerHTML="<b>x</b>";P=(a.firstChild.nodeType==3)}catch(ag){}i.features.htmlParsingConforms=P;var R=P?function(am){var al=this.startContainer;var an=b.getDocument(al);if(!al){throw new T("INVALID_STATE_ERR")}var e=null;if(al.nodeType==1){e=al}else{if(b.isCharacterDataNode(al)){e=b.parentElement(al)}}if(e===null||(e.nodeName=="HTML"&&b.isHtmlNamespace(b.getDocument(e).documentElement)&&b.isHtmlNamespace(e))){e=an.createElement("body")}else{e=e.cloneNode(false)}e.innerHTML=am;return b.fragmentFromNodeChildren(e)}:function(al){C(this);var am=m(this);var e=am.createElement("body");e.innerHTML=al;return b.fragmentFromNodeChildren(e)};var L=["startContainer","startOffset","endContainer","endOffset","collapsed","commonAncestorContainer"];var l=0,y=1,af=2,Z=3;var s=0,v=1,J=2,k=3;function ab(){}ab.prototype={attachListener:function(e,al){this._listeners[e].push(al)},compareBoundaryPoints:function(ap,am){h(this);d(this.startContainer,am.startContainer);var ar,al,aq,e;var ao=(ap==Z||ap==l)?"start":"end";var an=(ap==y||ap==l)?"start":"end";ar=this[ao+"Container"];al=this[ao+"Offset"];aq=am[an+"Container"];e=am[an+"Offset"];return b.comparePoints(ar,al,aq,e)},insertNode:function(al){h(this);U(al,M);aa(this.startContainer);if(b.isAncestorOf(al,this.startContainer,true)){throw new T("HIERARCHY_REQUEST_ERR")}var e=j(al,this.startContainer,this.startOffset);this.setStartBefore(e)},cloneContents:function(){h(this);var am,al;if(this.collapsed){return m(this).createDocumentFragment()}else{if(this.startContainer===this.endContainer&&b.isCharacterDataNode(this.startContainer)){am=this.startContainer.cloneNode(true);am.data=am.data.slice(this.startOffset,this.endOffset);al=m(this).createDocumentFragment();al.appendChild(am);return al}else{var e=new g(this,true);am=H(e);e.detach()}return am}},canSurroundContents:function(){h(this);aa(this.startContainer);aa(this.endContainer);var e=new g(this,true);var al=(e._first&&(x(e._first,this))||(e._last&&x(e._last,this)));e.detach();return !al},surroundContents:function(al){U(al,F);if(!this.canSurroundContents()){throw new O("BAD_BOUNDARYPOINTS_ERR")}var e=this.extractContents();if(al.hasChildNodes()){while(al.lastChild){al.removeChild(al.lastChild)}}j(al,this.startContainer,this.startOffset);al.appendChild(e);this.selectNode(al)},cloneRange:function(){h(this);var e=new aj(m(this));var al=L.length,am;while(al--){am=L[al];e[am]=this[am]}return e},toString:function(){h(this);var al=this.startContainer;if(al===this.endContainer&&b.isCharacterDataNode(al)){return(al.nodeType==3||al.nodeType==4)?al.data.slice(this.startOffset,this.endOffset):""}else{var am=[],e=new g(this,true);V(e,function(an){if(an.nodeType==3||an.nodeType==4){am.push(an.data)}});e.detach();return am.join("")}},compareNode:function(am){h(this);var al=am.parentNode;var ao=b.getNodeIndex(am);if(!al){throw new T("NOT_FOUND_ERR")}var an=this.comparePoint(al,ao),e=this.comparePoint(al,ao+1);if(an<0){return(e>0)?J:s}else{return(e>0)?v:k}},comparePoint:function(e,al){h(this);ah(e,"HIERARCHY_REQUEST_ERR");d(e,this.startContainer);if(b.comparePoints(e,al,this.startContainer,this.startOffset)<0){return -1}else{if(b.comparePoints(e,al,this.endContainer,this.endOffset)>0){return 1}}return 0},createContextualFragment:R,toHtml:function(){h(this);var e=m(this).createElement("div");e.appendChild(this.cloneContents());return e.innerHTML},intersectsNode:function(an,e){h(this);ah(an,"NOT_FOUND_ERR");if(b.getDocument(an)!==m(this)){return false}var am=an.parentNode,ap=b.getNodeIndex(an);ah(am,"NOT_FOUND_ERR");var ao=b.comparePoints(am,ap,this.endContainer,this.endOffset),al=b.comparePoints(am,ap+1,this.startContainer,this.startOffset);return e?ao<=0&&al>=0:ao<0&&al>0},isPointInRange:function(e,al){h(this);ah(e,"HIERARCHY_REQUEST_ERR");d(e,this.startContainer);return(b.comparePoints(e,al,this.startContainer,this.startOffset)>=0)&&(b.comparePoints(e,al,this.endContainer,this.endOffset)<=0)},intersectsRange:function(al,e){h(this);if(m(al)!=m(this)){throw new T("WRONG_DOCUMENT_ERR")}var an=b.comparePoints(this.startContainer,this.startOffset,al.endContainer,al.endOffset),am=b.comparePoints(this.endContainer,this.endOffset,al.startContainer,al.startOffset);return e?an<=0&&am>=0:an<0&&am>0},intersection:function(e){if(this.intersectsRange(e)){var an=b.comparePoints(this.startContainer,this.startOffset,e.startContainer,e.startOffset),al=b.comparePoints(this.endContainer,this.endOffset,e.endContainer,e.endOffset);var am=this.cloneRange();if(an==-1){am.setStart(e.startContainer,e.startOffset)}if(al==1){am.setEnd(e.endContainer,e.endOffset)}return am}return null},union:function(e){if(this.intersectsRange(e,true)){var al=this.cloneRange();if(b.comparePoints(e.startContainer,e.startOffset,this.startContainer,this.startOffset)==-1){al.setStart(e.startContainer,e.startOffset)}if(b.comparePoints(e.endContainer,e.endOffset,this.endContainer,this.endOffset)==1){al.setEnd(e.endContainer,e.endOffset)}return al}else{throw new O("Ranges do not intersect")}},containsNode:function(al,e){if(e){return this.intersectsNode(al,false)}else{return this.compareNode(al)==k}},containsNodeContents:function(e){return this.comparePoint(e,0)>=0&&this.comparePoint(e,b.getNodeLength(e))<=0},containsRange:function(e){return this.intersection(e).equals(e)},containsNodeText:function(an){var ao=this.cloneRange();ao.selectNode(an);var am=ao.getNodes([3]);if(am.length>0){ao.setStart(am[0],0);var e=am.pop();ao.setEnd(e,e.length);var al=this.containsRange(ao);ao.detach();return al}else{return this.containsNodeContents(an)}},createNodeIterator:function(e,al){h(this);return new w(this,e,al)},getNodes:function(e,al){h(this);return p(this,e,al)},getDocument:function(){return m(this)},collapseBefore:function(e){C(this);this.setEndBefore(e);this.collapse(false)},collapseAfter:function(e){C(this);this.setStartAfter(e);this.collapse(true)},getName:function(){return"DomRange"},equals:function(e){return aj.rangesEqual(this,e)},inspect:function(){return z(this)}};function S(e){e.START_TO_START=l;e.START_TO_END=y;e.END_TO_END=af;e.END_TO_START=Z;e.NODE_BEFORE=s;e.NODE_AFTER=v;e.NODE_BEFORE_AND_AFTER=J;e.NODE_INSIDE=k}function G(e){S(e);S(e.prototype)}function q(e,al){return function(){h(this);var ar=this.startContainer,aq=this.startOffset,am=this.commonAncestorContainer;var ao=new g(this,true);var ap,at;if(ar!==am){ap=b.getClosestAncestorIn(ar,am,true);at=W(ap);ar=at.node;aq=at.offset}V(ao,aa);ao.reset();var an=e(ao);ao.detach();al(this,ar,aq,ar,aq);return an}}function X(an,aq,e){function ap(at,ar){return function(au){C(this);U(au,ae);U(t(au),ac);var av=(at?A:W)(au);(ar?am:ao)(this,av.node,av.offset)}}function am(at,av,aw){var au=at.endContainer,ar=at.endOffset;if(av!==at.startContainer||aw!==at.startOffset){if(t(av)!=t(au)||b.comparePoints(av,aw,au,ar)==1){au=av;ar=aw}aq(at,av,aw,au,ar)}}function ao(ar,at,aw){var av=ar.startContainer,au=ar.startOffset;if(at!==ar.endContainer||aw!==ar.endOffset){if(t(at)!=t(av)||b.comparePoints(at,aw,av,au)==-1){av=at;au=aw}aq(ar,av,au,at,aw)}}function al(ar,at,au){if(at!==ar.startContainer||au!==ar.startOffset||at!==ar.endContainer||au!==ar.endOffset){aq(ar,at,au,at,au)}}an.prototype=new ab();i.util.extend(an.prototype,{setStart:function(ar,at){C(this);r(ar,true);ad(ar,at);am(this,ar,at)},setEnd:function(ar,at){C(this);r(ar,true);ad(ar,at);ao(this,ar,at)},setStartBefore:ap(true,true),setStartAfter:ap(false,true),setEndBefore:ap(true,false),setEndAfter:ap(false,false),collapse:function(ar){h(this);if(ar){aq(this,this.startContainer,this.startOffset,this.startContainer,this.startOffset)}else{aq(this,this.endContainer,this.endOffset,this.endContainer,this.endOffset)}},selectNodeContents:function(ar){C(this);r(ar,true);aq(this,ar,0,ar,b.getNodeLength(ar))},selectNode:function(at){C(this);r(at,false);U(at,ae);var au=A(at),ar=W(at);aq(this,au.node,au.offset,ar.node,ar.offset)},extractContents:q(Q,aq),deleteContents:q(n,aq),canSurroundContents:function(){h(this);aa(this.startContainer);aa(this.endContainer);var ar=new g(this,true);var at=(ar._first&&(x(ar._first,this))||(ar._last&&x(ar._last,this)));ar.detach();return !at},detach:function(){e(this)},splitBoundaries:function(){h(this);var aw=this.startContainer,av=this.startOffset,at=this.endContainer,ar=this.endOffset;var au=(aw===at);if(b.isCharacterDataNode(at)&&ar>0&&ar<at.length){b.splitDataNode(at,ar)}if(b.isCharacterDataNode(aw)&&av>0&&av<aw.length){aw=b.splitDataNode(aw,av);if(au){ar-=av;at=aw}else{if(at==aw.parentNode&&ar>=b.getNodeIndex(aw)){ar++}}av=0}aq(this,aw,av,at,ar)},normalizeBoundaries:function(){h(this);var az=this.startContainer,au=this.startOffset,ay=this.endContainer,ar=this.endOffset;var av=function(aC){var aB=aC.nextSibling;if(aB&&aB.nodeType==aC.nodeType){ay=aC;ar=aC.length;aC.appendData(aB.data);aB.parentNode.removeChild(aB)}};var aA=function(aD){var aC=aD.previousSibling;if(aC&&aC.nodeType==aD.nodeType){az=aD;var aB=aD.length;au=aC.length;aD.insertData(0,aC.data);aC.parentNode.removeChild(aC);if(az==ay){ar+=au;ay=az}else{if(ay==aD.parentNode){var aE=b.getNodeIndex(aD);if(ar==aE){ay=aD;ar=aB}else{if(ar>aE){ar--}}}}}};var ax=true;if(b.isCharacterDataNode(ay)){if(ay.length==ar){av(ay)}}else{if(ar>0){var aw=ay.childNodes[ar-1];if(aw&&b.isCharacterDataNode(aw)){av(aw)}}ax=!this.collapsed}if(ax){if(b.isCharacterDataNode(az)){if(au==0){aA(az)}}else{if(au<az.childNodes.length){var at=az.childNodes[au];if(at&&b.isCharacterDataNode(at)){aA(at)}}}}else{az=ay;au=ar}aq(this,az,au,ay,ar)},collapseToPoint:function(ar,at){C(this);r(ar,true);ad(ar,at);al(this,ar,at)}});G(an)}function N(e){e.collapsed=(e.startContainer===e.endContainer&&e.startOffset===e.endOffset);e.commonAncestorContainer=e.collapsed?e.startContainer:b.getCommonAncestor(e.startContainer,e.endContainer)}function D(am,ao,al,ap,an){var e=(am.startContainer!==ao||am.startOffset!==al);var aq=(am.endContainer!==ap||am.endOffset!==an);am.startContainer=ao;am.startOffset=al;am.endContainer=ap;am.endOffset=an;N(am);u(am,"boundarychange",{startMoved:e,endMoved:aq})}function ai(e){C(e);e.startContainer=e.startOffset=e.endContainer=e.endOffset=null;e.collapsed=e.commonAncestorContainer=null;u(e,"detach",null);e._listeners=null}function aj(e){this.startContainer=e;this.startOffset=0;this.endContainer=e;this.endOffset=0;this._listeners={boundarychange:[],detach:[]};N(this)}X(aj,D,ai);i.rangePrototype=ab.prototype;aj.rangeProperties=L;aj.RangeIterator=g;aj.copyComparisonConstants=G;aj.createPrototypeRange=X;aj.inspect=z;aj.getRangeDocument=m;aj.rangesEqual=function(al,e){return al.startContainer===e.startContainer&&al.startOffset===e.startOffset&&al.endContainer===e.endContainer&&al.endOffset===e.endOffset};i.DomRange=aj;i.RangeException=O});rangy.createModule("WrappedRange",function(i,d){i.requireModules(["DomUtil","DomRange"]);var a;var h=i.dom;var b=h.DomPosition;var j=i.DomRange;function e(q){var o=q.parentElement();var m=q.duplicate();m.collapse(true);var p=m.parentElement();m=q.duplicate();m.collapse(false);var n=m.parentElement();var l=(p==n)?p:h.getCommonAncestor(p,n);return l==o?l:h.getCommonAncestor(o,l)}function c(l){return l.compareEndPoints("StartToEnd",l)==0}function f(z,w,n,s){var A=z.duplicate();A.collapse(n);var y=A.parentElement();if(!h.isAncestorOf(w,y,true)){y=w}if(!y.canHaveHTML){return new b(y.parentNode,h.getNodeIndex(y))}var m=h.getDocument(y).createElement("span");var x,u=n?"StartToStart":"StartToEnd";var v,q,l,o;do{y.insertBefore(m,m.previousSibling);A.moveToElementText(m)}while((x=A.compareEndPoints(u,z))>0&&m.previousSibling);o=m.nextSibling;if(x==-1&&o&&h.isCharacterDataNode(o)){A.setEndPoint(n?"EndToStart":"EndToEnd",z);var r;if(/[\r\n]/.test(o.data)){var t=A.duplicate();var p=t.text.replace(/\r\n/g,"\r").length;r=t.moveStart("character",p);while((x=t.compareEndPoints("StartToEnd",t))==-1){r++;t.moveStart("character",1)}}else{r=A.text.length}l=new b(o,r)}else{v=(s||!n)&&m.previousSibling;q=(s||n)&&m.nextSibling;if(q&&h.isCharacterDataNode(q)){l=new b(q,0)}else{if(v&&h.isCharacterDataNode(v)){l=new b(v,v.length)}else{l=new b(y,h.getNodeIndex(m))}}}m.parentNode.removeChild(m);return l}function k(l,n){var o,r,p=l.offset;var s=h.getDocument(l.node);var m,t,u=s.body.createTextRange();var q=h.isCharacterDataNode(l.node);if(q){o=l.node;r=o.parentNode}else{t=l.node.childNodes;o=(p<t.length)?t[p]:null;r=l.node}m=s.createElement("span");m.innerHTML="&#feff;";if(o){r.insertBefore(m,o)}else{r.appendChild(m)}u.moveToElementText(m);u.collapse(!n);r.removeChild(m);if(q){u[n?"moveStart":"moveEnd"]("character",p)}return u}if(i.features.implementsDomRange&&(!i.features.implementsTextRange||!i.config.preferTextRange)){(function(){var n;var s=j.rangeProperties;var v;function l(w){var x=s.length,y;while(x--){y=s[x];w[y]=w.nativeRange[y]}}function o(y,A,x,B,z){var w=(y.startContainer!==A||y.startOffset!=x);var C=(y.endContainer!==B||y.endOffset!=z);if(w||C){y.setEnd(B,z);y.setStart(A,x)}}function t(w){w.nativeRange.detach();w.detached=true;var x=s.length,y;while(x--){y=s[x];w[y]=null}}var m;a=function(w){if(!w){throw new Error("Range must be specified")}this.nativeRange=w;l(this)};j.createPrototypeRange(a,o,t);n=a.prototype;n.selectNode=function(w){this.nativeRange.selectNode(w);l(this)};n.deleteContents=function(){this.nativeRange.deleteContents();l(this)};n.extractContents=function(){var w=this.nativeRange.extractContents();l(this);return w};n.cloneContents=function(){return this.nativeRange.cloneContents()};n.surroundContents=function(w){this.nativeRange.surroundContents(w);l(this)};n.collapse=function(w){this.nativeRange.collapse(w);l(this)};n.cloneRange=function(){return new a(this.nativeRange.cloneRange())};n.refresh=function(){l(this)};n.toString=function(){return this.nativeRange.toString()};var r=document.createTextNode("test");h.getBody(document).appendChild(r);var p=document.createRange();p.setStart(r,0);p.setEnd(r,0);try{p.setStart(r,1);v=true;n.setStart=function(w,x){this.nativeRange.setStart(w,x);l(this)};n.setEnd=function(w,x){this.nativeRange.setEnd(w,x);l(this)};m=function(w){return function(x){this.nativeRange[w](x);l(this)}}}catch(q){v=false;n.setStart=function(x,y){try{this.nativeRange.setStart(x,y)}catch(w){this.nativeRange.setEnd(x,y);this.nativeRange.setStart(x,y)}l(this)};n.setEnd=function(x,y){try{this.nativeRange.setEnd(x,y)}catch(w){this.nativeRange.setStart(x,y);this.nativeRange.setEnd(x,y)}l(this)};m=function(w,x){return function(z){try{this.nativeRange[w](z)}catch(y){this.nativeRange[x](z);this.nativeRange[w](z)}l(this)}}}n.setStartBefore=m("setStartBefore","setEndBefore");n.setStartAfter=m("setStartAfter","setEndAfter");n.setEndBefore=m("setEndBefore","setStartBefore");n.setEndAfter=m("setEndAfter","setStartAfter");p.selectNodeContents(r);if(p.startContainer==r&&p.endContainer==r&&p.startOffset==0&&p.endOffset==r.length){n.selectNodeContents=function(w){this.nativeRange.selectNodeContents(w);l(this)}}else{n.selectNodeContents=function(w){this.setStart(w,0);this.setEnd(w,j.getEndOffset(w))}}p.selectNodeContents(r);p.setEnd(r,3);var u=document.createRange();u.selectNodeContents(r);u.setEnd(r,4);u.setStart(r,2);if(p.compareBoundaryPoints(p.START_TO_END,u)==-1&p.compareBoundaryPoints(p.END_TO_START,u)==1){n.compareBoundaryPoints=function(x,w){w=w.nativeRange||w;if(x==w.START_TO_END){x=w.END_TO_START}else{if(x==w.END_TO_START){x=w.START_TO_END}}return this.nativeRange.compareBoundaryPoints(x,w)}}else{n.compareBoundaryPoints=function(x,w){return this.nativeRange.compareBoundaryPoints(x,w.nativeRange||w)}}if(i.util.isHostMethod(p,"createContextualFragment")){n.createContextualFragment=function(w){return this.nativeRange.createContextualFragment(w)}}h.getBody(document).removeChild(r);p.detach();u.detach()})();i.createNativeRange=function(l){l=l||document;return l.createRange()}}else{if(i.features.implementsTextRange){a=function(l){this.textRange=l;this.refresh()};a.prototype=new j(document);a.prototype.refresh=function(){var n,l;var m=e(this.textRange);if(c(this.textRange)){l=n=f(this.textRange,m,true,true)}else{n=f(this.textRange,m,true,false);l=f(this.textRange,m,false,false)}this.setStart(n.node,n.offset);this.setEnd(l.node,l.offset)};j.copyComparisonConstants(a);var g=(function(){return this})();if(typeof g.Range=="undefined"){g.Range=a}i.createNativeRange=function(l){l=l||document;return l.body.createTextRange()}}}if(i.features.implementsTextRange){a.rangeToTextRange=function(l){if(l.collapsed){var o=k(new b(l.startContainer,l.startOffset),true);return o}else{var p=k(new b(l.startContainer,l.startOffset),true);var n=k(new b(l.endContainer,l.endOffset),false);var m=h.getDocument(l.startContainer).body.createTextRange();m.setEndPoint("StartToStart",p);m.setEndPoint("EndToEnd",n);return m}}}a.prototype.getName=function(){return"WrappedRange"};i.WrappedRange=a;i.createRange=function(l){l=l||document;return new a(i.createNativeRange(l))};i.createRangyRange=function(l){l=l||document;return new j(l)};i.createIframeRange=function(l){return i.createRange(h.getIframeDocument(l))};i.createIframeRangyRange=function(l){return i.createRangyRange(h.getIframeDocument(l))};i.addCreateMissingNativeApiListener(function(m){var l=m.document;if(typeof l.createRange=="undefined"){l.createRange=function(){return i.createRange(this)}}l=m=null})});rangy.createModule("WrappedSelection",function(g,d){g.requireModules(["DomUtil","DomRange","WrappedRange"]);g.config.checkSelectionRanges=true;var D="boolean",T="_rangySelection",c=g.dom,l=g.util,Q=g.DomRange,e=g.WrappedRange,N=g.DOMException,y=c.DomPosition,w,n,U="Control";function m(W){return(W||window).getSelection()}function q(W){return(W||window).document.selection}var S=g.util.isHostMethod(window,"getSelection"),M=g.util.isHostObject(document,"selection");var u=M&&(!S||g.config.preferTextRange);if(u){w=q;g.isSelectionValid=function(X){var Y=(X||window).document,W=Y.selection;return(W.type!="None"||c.getDocument(W.createRange().parentElement())==Y)}}else{if(S){w=m;g.isSelectionValid=function(){return true}}else{d.fail("Neither document.selection or window.getSelection() detected.")}}g.getNativeSelection=w;var L=w();var B=g.createNativeRange(document);var C=c.getBody(document);var J=l.areHostObjects(L,["anchorNode","focusNode"]&&l.areHostProperties(L,["anchorOffset","focusOffset"]));g.features.selectionHasAnchorAndFocus=J;var p=l.isHostMethod(L,"extend");g.features.selectionHasExtend=p;var V=(typeof L.rangeCount=="number");g.features.selectionHasRangeCount=V;var P=false;var O=true;if(l.areHostMethods(L,["addRange","getRangeAt","removeAllRanges"])&&typeof L.rangeCount=="number"&&g.features.implementsDomRange){(function(){var Y=document.createElement("iframe");C.appendChild(Y);var ac=c.getIframeDocument(Y);ac.open();ac.write("<html><head></head><body>12</body></html>");ac.close();var aa=c.getIframeWindow(Y).getSelection();var ad=ac.documentElement;var Z=ad.lastChild,ab=Z.firstChild;var X=ac.createRange();X.setStart(ab,1);X.collapse(true);aa.addRange(X);O=(aa.rangeCount==1);aa.removeAllRanges();var W=X.cloneRange();X.setStart(ab,0);W.setEnd(ab,2);aa.addRange(X);aa.addRange(W);P=(aa.rangeCount==2);X.detach();W.detach();C.removeChild(Y)})()}g.features.selectionSupportsMultipleRanges=P;g.features.collapsedNonEditableSelectionsSupported=O;var f=false,j;if(C&&l.isHostMethod(C,"createControlRange")){j=C.createControlRange();if(l.areHostProperties(j,["item","add"])){f=true}}g.features.implementsControlRange=f;if(J){n=function(W){return W.anchorNode===W.focusNode&&W.anchorOffset===W.focusOffset}}else{n=function(W){return W.rangeCount?W.getRangeAt(W.rangeCount-1).collapsed:false}}function b(Z,X,W){var Y=W?"end":"start",aa=W?"start":"end";Z.anchorNode=X[Y+"Container"];Z.anchorOffset=X[Y+"Offset"];Z.focusNode=X[aa+"Container"];Z.focusOffset=X[aa+"Offset"]}function v(X){var W=X.nativeSelection;X.anchorNode=W.anchorNode;X.anchorOffset=W.anchorOffset;X.focusNode=W.focusNode;X.focusOffset=W.focusOffset}function G(W){W.anchorNode=W.focusNode=null;W.anchorOffset=W.focusOffset=0;W.rangeCount=0;W.isCollapsed=true;W._ranges.length=0}function I(W){var X;if(W instanceof Q){X=W._selectionNativeRange;if(!X){X=g.createNativeRange(c.getDocument(W.startContainer));X.setEnd(W.endContainer,W.endOffset);X.setStart(W.startContainer,W.startOffset);W._selectionNativeRange=X;W.attachListener("detach",function(){this._selectionNativeRange=null})}}else{if(W instanceof e){X=W.nativeRange}else{if(g.features.implementsDomRange&&(W instanceof c.getWindow(W.startContainer).Range)){X=W}}}return X}function k(Y){if(!Y.length||Y[0].nodeType!=1){return false}for(var X=1,W=Y.length;X<W;++X){if(!c.isAncestorOf(Y[0],Y[X])){return false}}return true}function K(X){var W=X.getNodes();if(!k(W)){throw new Error("getSingleElementFromRange: range "+X.inspect()+" did not consist of a single element")}return W[0]}function F(W){return !!W&&typeof W.text!="undefined"}function H(Y,X){var W=new e(X);Y._ranges=[W];b(Y,W,false);Y.rangeCount=1;Y.isCollapsed=W.collapsed}function t(Z){Z._ranges.length=0;if(Z.docSelection.type=="None"){G(Z)}else{var Y=Z.docSelection.createRange();if(F(Y)){H(Z,Y)}else{Z.rangeCount=Y.length;var W,aa=c.getDocument(Y.item(0));for(var X=0;X<Z.rangeCount;++X){W=g.createRange(aa);W.selectNode(Y.item(X));Z._ranges.push(W)}Z.isCollapsed=Z.rangeCount==1&&Z._ranges[0].collapsed;b(Z,Z._ranges[Z.rangeCount-1],false)}}}function x(X,aa){var Y=X.docSelection.createRange();var W=K(aa);var ae=c.getDocument(Y.item(0));var ab=c.getBody(ae).createControlRange();for(var Z=0,ac=Y.length;Z<ac;++Z){ab.add(Y.item(Z))}try{ab.add(W)}catch(ad){throw new Error("addRange(): Element within the specified Range could not be added to control selection (does it have layout?)")}ab.select();t(X)}var o;if(l.isHostMethod(L,"getRangeAt")){o=function(Y,W){try{return Y.getRangeAt(W)}catch(X){return null}}}else{if(J){o=function(X){var Y=c.getDocument(X.anchorNode);var W=g.createRange(Y);W.setStart(X.anchorNode,X.anchorOffset);W.setEnd(X.focusNode,X.focusOffset);if(W.collapsed!==this.isCollapsed){W.setStart(X.focusNode,X.focusOffset);W.setEnd(X.anchorNode,X.anchorOffset)}return W}}}function A(W,Y,X){this.nativeSelection=W;this.docSelection=Y;this._ranges=[];this.win=X;this.refresh()}g.getSelection=function(Y){Y=Y||window;var X=Y[T];var W=w(Y),Z=M?q(Y):null;if(X){X.nativeSelection=W;X.docSelection=Z;X.refresh(Y)}else{X=new A(W,Z,Y);Y[T]=X}return X};g.getIframeSelection=function(W){return g.getSelection(c.getIframeWindow(W))};var a=A.prototype;function i(ab,W){var ac=c.getDocument(W[0].startContainer);var Z=c.getBody(ac).createControlRange();for(var Y=0,aa;Y<rangeCount;++Y){aa=K(W[Y]);try{Z.add(aa)}catch(X){throw new Error("setRanges(): Element within the one of the specified Ranges could not be added to control selection (does it have layout?)")}}Z.select();t(ab)}if(!u&&J&&l.areHostMethods(L,["removeAllRanges","addRange"])){a.removeAllRanges=function(){this.nativeSelection.removeAllRanges();G(this)};var h=function(Y,W){var Z=Q.getRangeDocument(W);var X=g.createRange(Z);X.collapseToPoint(W.endContainer,W.endOffset);Y.nativeSelection.addRange(I(X));Y.nativeSelection.extend(W.startContainer,W.startOffset);Y.refresh()};if(V){a.addRange=function(X,W){if(f&&M&&this.docSelection.type==U){x(this,X)}else{if(W&&p){h(this,X)}else{var Y;if(P){Y=this.rangeCount}else{this.removeAllRanges();Y=0}this.nativeSelection.addRange(I(X));this.rangeCount=this.nativeSelection.rangeCount;if(this.rangeCount==Y+1){if(g.config.checkSelectionRanges){var Z=o(this.nativeSelection,this.rangeCount-1);if(Z&&!Q.rangesEqual(Z,X)){X=new e(Z)}}this._ranges[this.rangeCount-1]=X;b(this,X,r(this.nativeSelection));this.isCollapsed=n(this)}else{this.refresh()}}}}}else{a.addRange=function(X,W){if(W&&p){h(this,X)}else{this.nativeSelection.addRange(I(X));this.refresh()}}}a.setRanges=function(X){if(f&&X.length>1){i(this,X)}else{this.removeAllRanges();for(var Y=0,W=X.length;Y<W;++Y){this.addRange(X[Y])}}}}else{if(l.isHostMethod(L,"empty")&&l.isHostMethod(B,"select")&&f&&u){a.removeAllRanges=function(){try{this.docSelection.empty();if(this.docSelection.type!="None"){var Z;if(this.anchorNode){Z=c.getDocument(this.anchorNode)}else{if(this.docSelection.type==U){var X=this.docSelection.createRange();if(X.length){Z=c.getDocument(X.item(0)).body.createTextRange()}}}if(Z){var Y=Z.body.createTextRange();Y.select();this.docSelection.empty()}}}catch(W){}G(this)};a.addRange=function(W){if(this.docSelection.type==U){x(this,W)}else{e.rangeToTextRange(W).select();this._ranges[0]=W;this.rangeCount=1;this.isCollapsed=this._ranges[0].collapsed;b(this,W,false)}};a.setRanges=function(W){this.removeAllRanges();var X=W.length;if(X>1){i(this,W)}else{if(X){this.addRange(W[0])}}}}else{d.fail("No means of selecting a Range or TextRange was found");return false}}a.getRangeAt=function(W){if(W<0||W>=this.rangeCount){throw new N("INDEX_SIZE_ERR")}else{return this._ranges[W]}};var E;if(u){E=function(X){var W;if(g.isSelectionValid(X.win)){W=X.docSelection.createRange()}else{W=c.getBody(X.win.document).createTextRange();W.collapse(true)}if(X.docSelection.type==U){t(X)}else{if(F(W)){H(X,W)}else{G(X)}}}}else{if(l.isHostMethod(L,"getRangeAt")&&typeof L.rangeCount=="number"){E=function(Y){if(f&&M&&Y.docSelection.type==U){t(Y)}else{Y._ranges.length=Y.rangeCount=Y.nativeSelection.rangeCount;if(Y.rangeCount){for(var X=0,W=Y.rangeCount;X<W;++X){Y._ranges[X]=new g.WrappedRange(Y.nativeSelection.getRangeAt(X))}b(Y,Y._ranges[Y.rangeCount-1],r(Y.nativeSelection));Y.isCollapsed=n(Y)}else{G(Y)}}}}else{if(J&&typeof L.isCollapsed==D&&typeof B.collapsed==D&&g.features.implementsDomRange){E=function(Y){var W,X=Y.nativeSelection;if(X.anchorNode){W=o(X,0);Y._ranges=[W];Y.rangeCount=1;v(Y);Y.isCollapsed=n(Y)}else{G(Y)}}}else{d.fail("No means of obtaining a Range or TextRange from the user's selection was found");return false}}}a.refresh=function(X){var W=X?this._ranges.slice(0):null;E(this);if(X){var Y=W.length;if(Y!=this._ranges.length){return false}while(Y--){if(!Q.rangesEqual(W[Y],this._ranges[Y])){return false}}return true}};var z=function(aa,Y){var X=aa.getAllRanges(),ab=false;aa.removeAllRanges();for(var Z=0,W=X.length;Z<W;++Z){if(ab||Y!==X[Z]){aa.addRange(X[Z])}else{ab=true}}if(!aa.rangeCount){G(aa)}};if(f){a.removeRange=function(aa){if(this.docSelection.type==U){var Y=this.docSelection.createRange();var W=K(aa);var ae=c.getDocument(Y.item(0));var ac=c.getBody(ae).createControlRange();var X,ad=false;for(var Z=0,ab=Y.length;Z<ab;++Z){X=Y.item(Z);if(X!==W||ad){ac.add(Y.item(Z))}else{ad=true}}ac.select();t(this)}else{z(this,aa)}}}else{a.removeRange=function(W){z(this,W)}}var r;if(!u&&J&&g.features.implementsDomRange){r=function(X){var W=false;if(X.anchorNode){W=(c.comparePoints(X.anchorNode,X.anchorOffset,X.focusNode,X.focusOffset)==1)}return W};a.isBackwards=function(){return r(this)}}else{r=a.isBackwards=function(){return false}}a.toString=function(){var Y=[];for(var X=0,W=this.rangeCount;X<W;++X){Y[X]=""+this._ranges[X]}return Y.join("")};function R(X,W){if(X.anchorNode&&(c.getDocument(X.anchorNode)!==c.getDocument(W))){throw new N("WRONG_DOCUMENT_ERR")}}a.collapse=function(X,Y){R(this,X);var W=g.createRange(c.getDocument(X));W.collapseToPoint(X,Y);this.removeAllRanges();this.addRange(W);this.isCollapsed=true};a.collapseToStart=function(){if(this.rangeCount){var W=this._ranges[0];this.collapse(W.startContainer,W.startOffset)}else{throw new N("INVALID_STATE_ERR")}};a.collapseToEnd=function(){if(this.rangeCount){var W=this._ranges[this.rangeCount-1];this.collapse(W.endContainer,W.endOffset)}else{throw new N("INVALID_STATE_ERR")}};a.selectAllChildren=function(X){R(this,X);var W=g.createRange(c.getDocument(X));W.selectNodeContents(X);this.removeAllRanges();this.addRange(W)};a.deleteFromDocument=function(){if(f&&M&&this.docSelection.type==U){var aa=this.docSelection.createRange();var Z;while(aa.length){Z=aa.item(0);aa.remove(Z);Z.parentNode.removeChild(Z)}this.refresh()}else{if(this.rangeCount){var X=this.getAllRanges();this.removeAllRanges();for(var Y=0,W=X.length;Y<W;++Y){X[Y].deleteContents()}this.addRange(X[W-1])}}};a.getAllRanges=function(){return this._ranges.slice(0)};a.setSingleRange=function(W){this.setRanges([W])};a.containsNode=function(Z,X){for(var Y=0,W=this._ranges.length;Y<W;++Y){if(this._ranges[Y].containsNode(Z,X)){return true}}return false};a.toHtml=function(){var Z="";if(this.rangeCount){var X=Q.getRangeDocument(this._ranges[0]).createElement("div");for(var Y=0,W=this._ranges.length;Y<W;++Y){X.appendChild(this._ranges[Y].cloneContents())}Z=X.innerHTML}return Z};function s(ac){var ab=[];var Z=new y(ac.anchorNode,ac.anchorOffset);var X=new y(ac.focusNode,ac.focusOffset);var Y=(typeof ac.getName=="function")?ac.getName():"Selection";if(typeof ac.rangeCount!="undefined"){for(var aa=0,W=ac.rangeCount;aa<W;++aa){ab[aa]=Q.inspect(ac.getRangeAt(aa))}}return"["+Y+"(Ranges: "+ab.join(", ")+")(anchor: "+Z.inspect()+", focus: "+X.inspect()+"]"}a.getName=function(){return"WrappedSelection"};a.inspect=function(){return s(this)};a.detach=function(){this.win[T]=null;this.win=this.anchorNode=this.focusNode=null};A.inspect=s;g.Selection=A;g.selectionPrototype=a;g.addCreateMissingNativeApiListener(function(W){if(typeof W.getSelection=="undefined"){W.getSelection=function(){return g.getSelection(this)}}W=null})});var Base=function(){};Base.extend=function(b,e){var f=Base.prototype.extend;Base._prototyping=true;var d=new this;f.call(d,b);d.base=function(){};delete Base._prototyping;var c=d.constructor;var a=d.constructor=function(){if(!Base._prototyping){if(this._constructing||this.constructor==a){this._constructing=true;c.apply(this,arguments);delete this._constructing}else{if(arguments[0]!=null){return(arguments[0].extend||f).call(arguments[0],d)}}}};a.ancestor=this;a.extend=this.extend;a.forEach=this.forEach;a.implement=this.implement;a.prototype=d;a.toString=this.toString;a.valueOf=function(g){return(g=="object")?a:c.valueOf()};f.call(a,e);if(typeof a.init=="function"){a.init()}return a};Base.prototype={extend:function(b,h){if(arguments.length>1){var e=this[b];if(e&&(typeof h=="function")&&(!e.valueOf||e.valueOf()!=h.valueOf())&&/\bbase\b/.test(h)){var a=h.valueOf();h=function(){var k=this.base||Base.prototype.base;this.base=e;var i=a.apply(this,arguments);this.base=k;return i};h.valueOf=function(i){return(i=="object")?h:a};h.toString=Base.toString}this[b]=h}else{if(b){var g=Base.prototype.extend;if(!Base._prototyping&&typeof this!="function"){g=this.extend||g}var d={toSource:null};var f=["constructor","toString","valueOf"];var c=Base._prototyping?0:1;while(j=f[c++]){if(b[j]!=d[j]){g.call(this,j,b[j])}}for(var j in b){if(!d[j]){g.call(this,j,b[j])}}}}return this}};Base=Base.extend({constructor:function(){this.extend(arguments[0])}},{ancestor:Object,version:"1.1",forEach:function(a,d,c){for(var b in a){if(this.prototype[b]===undefined){d.call(c,a[b],b,a)}}},implement:function(){for(var a=0;a<arguments.length;a++){if(typeof arguments[a]=="function"){arguments[a](this.prototype)}else{this.prototype.extend(arguments[a])}}return this},toString:function(){return String(this.valueOf())}});wysihtml5.browser=(function(){var f=navigator.userAgent,e=document.createElement("div"),c=f.indexOf("MSIE")!==-1&&f.indexOf("Opera")===-1,a=f.indexOf("Gecko")!==-1&&f.indexOf("KHTML")===-1,d=f.indexOf("AppleWebKit/")!==-1,g=f.indexOf("Chrome/")!==-1,b=f.indexOf("Opera/")!==-1;function h(i){return((/ipad|iphone|ipod/.test(i)&&i.match(/ os (\d+).+? like mac os x/))||[,0])[1]}return{USER_AGENT:f,supported:function(){var k=this.USER_AGENT.toLowerCase(),m="contentEditable" in e,i=document.execCommand&&document.queryCommandSupported&&document.queryCommandState,j=document.querySelector&&document.querySelectorAll,l=(this.isIos()&&h(k)<5)||k.indexOf("opera mobi")!==-1||k.indexOf("hpwos/")!==-1;return m&&i&&j&&!l},isTouchDevice:function(){return this.supportsEvent("touchmove")},isIos:function(){var i=this.USER_AGENT.toLowerCase();return i.indexOf("webkit")!==-1&&i.indexOf("mobile")!==-1},supportsSandboxedIframes:function(){return c},throwsMixedContentWarningWhenIframeSrcIsEmpty:function(){return !("querySelector" in document)},displaysCaretInEmptyContentEditableCorrectly:function(){return !a},hasCurrentStyleProperty:function(){return"currentStyle" in e},insertsLineBreaksOnReturn:function(){return a},supportsPlaceholderAttributeOn:function(i){return"placeholder" in i},supportsEvent:function(i){return"on"+i in e||(function(){e.setAttribute("on"+i,"return;");return typeof(e["on"+i])==="function"})()},supportsEventsInIframeCorrectly:function(){return !b},firesOnDropOnlyWhenOnDragOverIsCancelled:function(){return d||a},supportsDataTransfer:function(){try{return d&&(window.Clipboard||window.DataTransfer).prototype.getData}catch(i){return false}},supportsHTML5Tags:function(k){var j=k.createElement("div"),i="<article>foo</article>";j.innerHTML=i;return j.innerHTML.toLowerCase()===i},supportsCommand:(function(){var j={formatBlock:c,insertUnorderedList:c||b||d,insertOrderedList:c||b||d};var i={insertHTML:a};return function(l,n){var o=j[n];if(!o){try{return l.queryCommandSupported(n)}catch(m){}try{return l.queryCommandEnabled(n)}catch(k){return !!i[n]}}return false}})(),doesAutoLinkingInContentEditable:function(){return c},canDisableAutoLinking:function(){return this.supportsCommand(document,"AutoUrlDetect")},clearsContentEditableCorrectly:function(){return a||b||d},supportsGetAttributeCorrectly:function(){var i=document.createElement("td");return i.getAttribute("rowspan")!="1"},canSelectImagesInContentEditable:function(){return a||c||b},clearsListsInContentEditableCorrectly:function(){return a||c||d},autoScrollsToCaret:function(){return !d},autoClosesUnclosedTags:function(){var k=e.cloneNode(false),i,j;k.innerHTML="<p><div></div>";j=k.innerHTML.toLowerCase();i=j==="<p></p><div></div>"||j==="<p><div></div></p>";this.autoClosesUnclosedTags=function(){return i};return i},supportsNativeGetElementsByClassName:function(){return String(document.getElementsByClassName).indexOf("[native code]")!==-1},supportsSelectionModify:function(){return"getSelection" in window&&"modify" in window.getSelection()},supportsClassList:function(){return"classList" in e},needsSpaceAfterLineBreak:function(){return b},supportsSpeechApiOn:function(i){var j=f.match(/Chrome\/(\d+)/)||[,0];return j[1]>=11&&("onwebkitspeechchange" in i||"speech" in i)},crashesWhenDefineProperty:function(i){return c&&(i==="XMLHttpRequest"||i==="XDomainRequest")},doesAsyncFocus:function(){return c},hasProblemsSettingCaretAfterImg:function(){return c},hasUndoInContextMenu:function(){return a||g||b}}})();wysihtml5.lang.array=function(a){return{contains:function(d){if(a.indexOf){return a.indexOf(d)!==-1}else{for(var b=0,c=a.length;b<c;b++){if(a[b]===d){return true}}return false}},without:function(b){b=wysihtml5.lang.array(b);var d=[],c=0,e=a.length;for(;c<e;c++){if(!b.contains(a[c])){d.push(a[c])}}return d},get:function(){var c=0,d=a.length,b=[];for(;c<d;c++){b.push(a[c])}return b}}};wysihtml5.lang.Dispatcher=Base.extend({observe:function(a,b){this.events=this.events||{};this.events[a]=this.events[a]||[];this.events[a].push(b);return this},on:function(){return this.observe.apply(this,wysihtml5.lang.array(arguments).get())},fire:function(b,d){this.events=this.events||{};var a=this.events[b]||[],c=0;for(;c<a.length;c++){a[c].call(this,d)}return this},stopObserving:function(b,d){this.events=this.events||{};var c=0,a,e;if(b){a=this.events[b]||[],e=[];for(;c<a.length;c++){if(a[c]!==d&&d){e.push(a[c])}}this.events[b]=e}else{this.events={}}return this}});wysihtml5.lang.object=function(a){return{merge:function(b){for(var c in b){a[c]=b[c]}return this},get:function(){return a},clone:function(){var b={},c;for(c in a){b[c]=a[c]}return b},isArray:function(){return Object.prototype.toString.call(a)==="[object Array]"}}};(function(){var b=/^\s+/,a=/\s+$/;wysihtml5.lang.string=function(c){c=String(c);return{trim:function(){return c.replace(b,"").replace(a,"")},interpolate:function(e){for(var d in e){c=this.replace("#{"+d+"}").by(e[d])}return c},replace:function(d){return{by:function(e){return c.split(d).join(e)}}}}}})();(function(l){var j=l.lang.array(["CODE","PRE","A","SCRIPT","HEAD","TITLE","STYLE"]),k=/((https?:\/\/|www\.)[^\s<]{3,})/gi,e=/([^\w\/\-](,?))$/i,c=100,f={")":"(","]":"[","}":"{"};function b(m){if(i(m)){return m}if(m===m.ownerDocument.documentElement){m=m.ownerDocument.body}return a(m)}function g(m){return m.replace(k,function(p,o){var r=(o.match(e)||[])[1]||"",n=f[r];o=o.replace(e,"");if(o.split(n).length>o.split(r).length){o=o+r;r=""}var q=o,s=o;if(o.length>c){s=s.substr(0,c)+"..."}if(q.substr(0,4)==="www."){q="http://"+q}return'<a href="'+q+'">'+s+"</a>"+r})}function d(n){var m=n._wysihtml5_tempElement;if(!m){m=n._wysihtml5_tempElement=n.createElement("div")}return m}function h(o){var n=o.parentNode,m=d(n.ownerDocument);m.innerHTML="<span></span>"+g(o.data);m.removeChild(m.firstChild);while(m.firstChild){n.insertBefore(m.firstChild,o)}n.removeChild(o)}function i(m){var n;while(m.parentNode){m=m.parentNode;n=m.nodeName;if(j.contains(n)){return true}else{if(n==="body"){return false}}}return false}function a(n){if(j.contains(n.nodeName)){return}if(n.nodeType===l.TEXT_NODE&&n.data.match(k)){h(n);return}var p=l.lang.array(n.childNodes).get(),o=p.length,m=0;for(;m<o;m++){a(p[m])}return n}l.dom.autoLink=b;l.dom.autoLink.URL_REG_EXP=k})(wysihtml5);(function(c){var b=c.browser.supportsClassList(),a=c.dom;a.addClass=function(d,e){if(b){return d.classList.add(e)}if(a.hasClass(d,e)){return}d.className+=" "+e};a.removeClass=function(d,e){if(b){return d.classList.remove(e)}d.className=d.className.replace(new RegExp("(^|\\s+)"+e+"(\\s+|$)")," ")};a.hasClass=function(d,e){if(b){return d.classList.contains(e)}var f=d.className;return(f.length>0&&(f==e||new RegExp("(^|\\s)"+e+"(\\s|$)").test(f)))}})(wysihtml5);wysihtml5.dom.contains=(function(){var a=document.documentElement;if(a.contains){return function(b,c){if(c.nodeType!==wysihtml5.ELEMENT_NODE){c=c.parentNode}return b!==c&&b.contains(c)}}else{if(a.compareDocumentPosition){return function(b,c){return !!(b.compareDocumentPosition(c)&16)}}}})();wysihtml5.dom.convertToList=(function(){function b(f,e){var d=f.createElement("li");e.appendChild(d);return d}function c(e,d){return e.createElement(d)}function a(f,n){if(f.nodeName==="UL"||f.nodeName==="OL"||f.nodeName==="MENU"){return f}var p=f.ownerDocument,k=c(p,n),l=f.querySelectorAll("br"),j=l.length,r,q,d,m,h,s,g,o,e;for(e=0;e<j;e++){m=l[e];while((h=m.parentNode)&&h!==f&&h.lastChild===m){if(wysihtml5.dom.getStyle("display").from(h)==="block"){h.removeChild(m);break}wysihtml5.dom.insert(m).after(m.parentNode)}}r=wysihtml5.lang.array(f.childNodes).get();q=r.length;for(e=0;e<q;e++){o=o||b(p,k);d=r[e];s=wysihtml5.dom.getStyle("display").from(d)==="block";g=d.nodeName==="BR";if(s){o=o.firstChild?b(p,k):o;o.appendChild(d);o=null;continue}if(g){o=o.firstChild?null:o;continue}o.appendChild(d)}f.parentNode.replaceChild(k,f);return k}return a})();wysihtml5.dom.copyAttributes=function(a){return{from:function(b){return{to:function(c){var f,d=0,e=a.length;for(;d<e;d++){f=a[d];if(typeof(b[f])!=="undefined"&&b[f]!==""){c[f]=b[f]}}return{andTo:arguments.callee}}}}}};(function(b){var d=["-webkit-box-sizing","-moz-box-sizing","-ms-box-sizing","box-sizing"];var c=function(e){if(a(e)){return parseInt(b.getStyle("width").from(e),10)<e.offsetWidth}return false};var a=function(f){var e=0,g=d.length;for(;e<g;e++){if(b.getStyle(d[e]).from(f)==="border-box"){return d[e]}}};b.copyStyles=function(e){return{from:function(g){if(c(g)){e=wysihtml5.lang.array(e).without(d)}var h="",j=e.length,f=0,k;for(;f<j;f++){k=e[f];h+=k+":"+b.getStyle(k).from(g)+";"}return{to:function(i){b.setStyles(h).on(i);return{andTo:arguments.callee}}}}}}})(wysihtml5.dom);(function(a){a.dom.delegate=function(c,b,d,e){return a.dom.observe(c,d,function(g){var h=g.target,f=a.lang.array(c.querySelectorAll(b));while(h&&h!==c){if(f.contains(h)){e.call(h,g);break}h=h.parentNode}})}})(wysihtml5);wysihtml5.dom.getAsDom=(function(){var a=function(g,f){var d=f.createElement("div");d.style.display="none";f.body.appendChild(d);try{d.innerHTML=g}catch(h){}f.body.removeChild(d);return d};var c=function(e){if(e._wysihtml5_supportsHTML5Tags){return}for(var d=0,f=b.length;d<f;d++){e.createElement(b[d])}e._wysihtml5_supportsHTML5Tags=true};var b=["abbr","article","aside","audio","bdi","canvas","command","datalist","details","figcaption","figure","footer","header","hgroup","keygen","mark","meter","nav","output","progress","rp","rt","ruby","svg","section","source","summary","time","track","video","wbr"];return function(f,e){e=e||document;var d;if(typeof(f)==="object"&&f.nodeType){d=e.createElement("div");d.appendChild(f)}else{if(wysihtml5.browser.supportsHTML5Tags(e)){d=e.createElement("div");d.innerHTML=f}else{c(e);d=a(f,e)}}return d}})();wysihtml5.dom.getParentElement=(function(){function a(g,f){if(!f||!f.length){return true}if(typeof(f)==="string"){return g===f}else{return wysihtml5.lang.array(f).contains(g)}}function c(f){return f.nodeType===wysihtml5.ELEMENT_NODE}function b(f,g,h){var i=(f.className||"").match(h)||[];if(!g){return !!i.length}return i[i.length-1]===g}function e(f,h,g){while(g--&&f&&f.nodeName!=="BODY"){if(a(f.nodeName,h)){return f}f=f.parentNode}return null}function d(g,j,f,i,h){while(h--&&g&&g.nodeName!=="BODY"){if(c(g)&&a(g.nodeName,j)&&b(g,f,i)){return g}g=g.parentNode}return null}return function(g,f,h){h=h||50;if(f.className||f.classRegExp){return d(g,f.nodeName,f.className,f.classRegExp,h)}else{return e(g,f.nodeName,h)}}})();wysihtml5.dom.getStyle=(function(){var b={"float":("styleFloat" in document.createElement("div").style)?"styleFloat":"cssFloat"},c=/\-[a-z]/g;function a(d){return d.replace(c,function(e){return e.charAt(1).toUpperCase()})}return function(d){return{from:function(j){if(j.nodeType!==wysihtml5.ELEMENT_NODE){return}var o=j.ownerDocument,k=b[d]||a(d),g=j.style,h=j.currentStyle,p=g[k];if(p){return p}if(h){try{return h[k]}catch(m){}}var l=o.defaultView||o.parentWindow,n=(d==="height"||d==="width")&&j.nodeName==="TEXTAREA",i,f;if(l.getComputedStyle){if(n){i=g.overflow;g.overflow="hidden"}f=l.getComputedStyle(j,null).getPropertyValue(d);if(n){g.overflow=i||""}return f}}}}})();wysihtml5.dom.hasElementWithTagName=(function(){var c={},b=1;function a(d){return d._wysihtml5_identifier||(d._wysihtml5_identifier=b++)}return function(f,e){var d=a(f)+":"+e,g=c[d];if(!g){g=c[d]=f.getElementsByTagName(e)}return g.length>0}})();(function(d){var c={},b=1;function a(e){return e._wysihtml5_identifier||(e._wysihtml5_identifier=b++)}d.dom.hasElementWithClassName=function(g,f){if(!d.browser.supportsNativeGetElementsByClassName()){return !!g.querySelector("."+f)}var e=a(g)+":"+f,h=c[e];if(!h){h=c[e]=g.getElementsByClassName(f)}return h.length>0}})(wysihtml5);wysihtml5.dom.insert=function(a){return{after:function(b){b.parentNode.insertBefore(a,b.nextSibling)},before:function(b){b.parentNode.insertBefore(a,b)},into:function(b){b.appendChild(a)}}};wysihtml5.dom.insertCSS=function(a){a=a.join("\n");return{into:function(d){var c=d.head||d.getElementsByTagName("head")[0],b=d.createElement("style");b.type="text/css";if(b.styleSheet){b.styleSheet.cssText=a}else{b.appendChild(d.createTextNode(a))}if(c){c.appendChild(b)}}}};wysihtml5.dom.observe=function(c,g,d){g=typeof(g)==="string"?[g]:g;var f,a,b=0,e=g.length;for(;b<e;b++){a=g[b];if(c.addEventListener){c.addEventListener(a,d,false)}else{f=function(h){if(!("target" in h)){h.target=h.srcElement}h.preventDefault=h.preventDefault||function(){this.returnValue=false};h.stopPropagation=h.stopPropagation||function(){this.cancelBubble=true};d.call(c,h)};c.attachEvent("on"+a,f)}}return{stop:function(){var h,j=0,k=g.length;for(;j<k;j++){h=g[j];if(c.removeEventListener){c.removeEventListener(h,d,false)}else{c.detachEvent("on"+h,f)}}}}};wysihtml5.dom.parse=(function(){var a={"1":e,"3":l},o="span",g=/\s+/,j={tags:{},classes:{}},n={};function d(u,x,p,r){wysihtml5.lang.object(n).merge(j).merge(x).get();p=p||u.ownerDocument||document;var t=p.createDocumentFragment(),q=typeof(u)==="string",s,w,v;if(q){s=wysihtml5.dom.getAsDom(u,p)}else{s=u}while(s.firstChild){v=s.firstChild;s.removeChild(v);w=f(v,r);if(w){t.appendChild(w)}}s.innerHTML="";s.appendChild(t);return q?wysihtml5.quirks.getCorrectInnerHTML(s):s}function f(v,u){var t=v.nodeType,s=v.childNodes,r=s.length,q,w=a[t],p=0;q=w&&w(v);if(!q){return null}for(p=0;p<r;p++){newChild=f(s[p],u);if(newChild){q.appendChild(newChild)}}if(u&&q.childNodes.length<=1&&q.nodeName.toLowerCase()===o&&!q.attributes.length){return q.firstChild}return q}function e(u){var t,s,r,q=n.tags,v=u.nodeName.toLowerCase(),p=u.scopeName;if(u._wysihtml5){return null}u._wysihtml5=1;if(u.className==="wysihtml5-temp"){return null}if(p&&p!="HTML"){v=p+":"+v}if("outerHTML" in u){if(!wysihtml5.browser.autoClosesUnclosedTags()&&u.nodeName==="P"&&u.outerHTML.slice(-4).toLowerCase()!=="</p>"){v="div"}}if(v in q){t=q[v];if(!t||t.remove){return null}t=typeof(t)==="string"?{rename_tag:t}:t}else{if(u.firstChild){t={rename_tag:o}}else{return null}}s=u.ownerDocument.createElement(t.rename_tag||v);b(u,s,t);u=null;return s}function b(C,p,v){var y={},J=v.set_class,A=v.add_class,F=v.set_attributes,u=v.check_attributes,t=n.classes,E=0,H=[],K=[],s=[],D=[],w,z,r,x,B,I,q;if(F){y=wysihtml5.lang.object(F).clone()}if(u){for(B in u){q=h[u[B]];if(!q){continue}I=q(i(C,B));if(typeof(I)==="string"){y[B]=I}}}if(J){H.push(J)}if(A){for(B in A){q=k[A[B]];if(!q){continue}x=q(i(C,B));if(typeof(x)==="string"){H.push(x)}}}t["_wysihtml5-temp-placeholder"]=1;D=C.getAttribute("class");if(D){H=H.concat(D.split(g))}w=H.length;for(;E<w;E++){r=H[E];if(t[r]){K.push(r)}}z=K.length;while(z--){r=K[z];if(!wysihtml5.lang.array(s).contains(r)){s.unshift(r)}}if(s.length){y["class"]=s.join(" ")}for(B in y){try{p.setAttribute(B,y[B])}catch(G){}}if(y.src){if(typeof(y.width)!=="undefined"){p.setAttribute("width",y.width)}if(typeof(y.height)!=="undefined"){p.setAttribute("height",y.height)}}}var m=!wysihtml5.browser.supportsGetAttributeCorrectly();function i(r,q){q=q.toLowerCase();var t=r.nodeName;if(t=="IMG"&&q=="src"&&c(r)===true){return r.src}else{if(m&&"outerHTML" in r){var s=r.outerHTML.toLowerCase(),p=s.indexOf(" "+q+"=")!=-1;return p?r.getAttribute(q):null}else{return r.getAttribute(q)}}}function c(p){try{return p.complete&&!p.mozMatchesSelector(":-moz-broken")}catch(q){if(p.complete&&p.readyState==="complete"){return true}}}function l(p){return p.ownerDocument.createTextNode(p.data)}var h={url:(function(){return function(p){if(!p){return""}var q=document.createElement("a");q.href=p;if(q.protocol=="http:"||q.protocol=="https:"||q.protocol=="ftp:"){return p}}})(),alt:(function(){var p=/[^ a-z0-9_\-]/gi;return function(q){if(!q){return""}return q.replace(p,"")}})(),numbers:(function(){var p=/\D/g;return function(q){q=(q||"").replace(p,"");return q||null}})()};var k={align_img:(function(){var p={left:"wysiwyg-float-left",right:"wysiwyg-float-right"};return function(q){return p[String(q).toLowerCase()]}})(),align_text:(function(){var p={left:"wysiwyg-text-align-left",right:"wysiwyg-text-align-right",center:"wysiwyg-text-align-center",justify:"wysiwyg-text-align-justify"};return function(q){return p[String(q).toLowerCase()]}})(),clear_br:(function(){var p={left:"wysiwyg-clear-left",right:"wysiwyg-clear-right",both:"wysiwyg-clear-both",all:"wysiwyg-clear-both"};return function(q){return p[String(q).toLowerCase()]}})(),size_font:(function(){var p={"1":"wysiwyg-font-size-xx-small","2":"wysiwyg-font-size-small","3":"wysiwyg-font-size-medium","4":"wysiwyg-font-size-large","5":"wysiwyg-font-size-x-large","6":"wysiwyg-font-size-xx-large","7":"wysiwyg-font-size-xx-large","-":"wysiwyg-font-size-smaller","+":"wysiwyg-font-size-larger"};return function(q){return p[String(q).charAt(0)]}})()};return d})();wysihtml5.dom.removeEmptyTextNodes=function(c){var b,e=wysihtml5.lang.array(c.childNodes).get(),d=e.length,a=0;for(;a<d;a++){b=e[a];if(b.nodeType===wysihtml5.TEXT_NODE&&b.data===""){b.parentNode.removeChild(b)}}};wysihtml5.dom.renameElement=function(a,b){var d=a.ownerDocument.createElement(b),c;while(c=a.firstChild){d.appendChild(c)}wysihtml5.dom.copyAttributes(["align","className"]).from(a).to(d);a.parentNode.replaceChild(d,a);return d};wysihtml5.dom.replaceWithChildNodes=function(b){if(!b.parentNode){return}if(!b.firstChild){b.parentNode.removeChild(b);return}var a=b.ownerDocument.createDocumentFragment();while(b.firstChild){a.appendChild(b.firstChild)}b.parentNode.replaceChild(a,b);b=a=null};(function(e){function c(f){return e.getStyle("display").from(f)==="block"}function d(f){return f.nodeName==="BR"}function b(g){var f=g.ownerDocument.createElement("br");g.appendChild(f)}function a(k){if(k.nodeName!=="MENU"&&k.nodeName!=="UL"&&k.nodeName!=="OL"){return}var n=k.ownerDocument,l=n.createDocumentFragment(),g=k.previousElementSibling||k.previousSibling,m,h,i,j,f;if(g&&!c(g)){b(l)}while(f=k.firstChild){h=f.lastChild;while(m=f.firstChild){i=m===h;j=i&&!c(m)&&!d(m);l.appendChild(m);if(j){b(l)}}f.parentNode.removeChild(f)}k.parentNode.replaceChild(l,k)}e.resolveList=a})(wysihtml5.dom);(function(e){var d=document,c=["parent","top","opener","frameElement","frames","localStorage","globalStorage","sessionStorage","indexedDB"],b=["open","close","openDialog","showModalDialog","alert","confirm","prompt","openDatabase","postMessage","XMLHttpRequest","XDomainRequest"],a=["referrer","write","open","close"];e.dom.Sandbox=Base.extend({constructor:function(g,f){this.callback=g||e.EMPTY_FUNCTION;this.config=e.lang.object({}).merge(f).get();this.iframe=this._createIframe()},insertInto:function(f){if(typeof(f)==="string"){f=d.getElementById(f)}f.appendChild(this.iframe)},getIframe:function(){return this.iframe},getWindow:function(){this._readyError()},getDocument:function(){this._readyError()},destroy:function(){var f=this.getIframe();f.parentNode.removeChild(f)},_readyError:function(){throw new Error("wysihtml5.Sandbox: Sandbox iframe isn't loaded yet")},_createIframe:function(){var g=this,f=d.createElement("iframe");f.className="wysihtml5-sandbox";e.dom.setAttributes({security:"restricted",allowtransparency:"true",frameborder:0,width:0,height:0,marginwidth:0,marginheight:0}).on(f);if(e.browser.throwsMixedContentWarningWhenIframeSrcIsEmpty()){f.src="javascript:'<html></html>'"}f.onload=function(){f.onreadystatechange=f.onload=null;g._onLoadIframe(f)};f.onreadystatechange=function(){if(/loaded|complete/.test(f.readyState)){f.onreadystatechange=f.onload=null;g._onLoadIframe(f)}};return f},_onLoadIframe:function(h){if(!e.dom.contains(d.documentElement,h)){return}var l=this,f=h.contentWindow,m=h.contentWindow.document,n=d.characterSet||d.charset||"utf-8",k=this._getHtml({charset:n,stylesheets:this.config.stylesheets});m.open("text/html","replace");m.write(k);m.close();this.getWindow=function(){return h.contentWindow};this.getDocument=function(){return h.contentWindow.document};f.onerror=function(o,p,i){throw new Error("wysihtml5.Sandbox: "+o,p,i)};if(!e.browser.supportsSandboxedIframes()){var g,j;for(g=0,j=c.length;g<j;g++){this._unset(f,c[g])}for(g=0,j=b.length;g<j;g++){this._unset(f,b[g],e.EMPTY_FUNCTION)}for(g=0,j=a.length;g<j;g++){this._unset(m,a[g])}this._unset(m,"cookie","",true)}this.loaded=true;setTimeout(function(){l.callback(l)},0)},_getHtml:function(j){var k=j.stylesheets,g="",f=0,h;k=typeof(k)==="string"?[k]:k;if(k){h=k.length;for(;f<h;f++){g+='<link rel="stylesheet" href="'+k[f]+'">'}}j.stylesheets=g;return e.lang.string('<!DOCTYPE html><html><head><meta charset="#{charset}">#{stylesheets}</head><body></body></html>').interpolate(j)},_unset:function(g,i,h,k){try{g[i]=h}catch(j){}try{g.__defineGetter__(i,function(){return h})}catch(j){}if(k){try{g.__defineSetter__(i,function(){})}catch(j){}}if(!e.browser.crashesWhenDefineProperty(i)){try{var f={get:function(){return h}};if(k){f.set=function(){}}Object.defineProperty(g,i,f)}catch(j){}}}})})(wysihtml5);(function(){var a={className:"class"};wysihtml5.dom.setAttributes=function(b){return{on:function(d){for(var c in b){d.setAttribute(a[c]||c,b[c])}}}}})();wysihtml5.dom.setStyles=function(a){return{on:function(c){var d=c.style;if(typeof(a)==="string"){d.cssText+=";"+a;return}for(var b in a){if(b==="float"){d.cssFloat=a[b];d.styleFloat=a[b]}else{d[b]=a[b]}}}}};(function(a){a.simulatePlaceholder=function(d,b,c){var e="placeholder",f=function(){if(b.hasPlaceholderSet()){b.clear()}a.removeClass(b.element,e)},g=function(){if(b.isEmpty()){b.setValue(c);a.addClass(b.element,e)}};d.observe("set_placeholder",g).observe("unset_placeholder",f).observe("focus:composer",f).observe("paste:composer",f).observe("blur:composer",g);g()}})(wysihtml5.dom);(function(b){var a=document.documentElement;if("textContent" in a){b.setTextContent=function(c,d){c.textContent=d};b.getTextContent=function(c){return c.textContent}}else{if("innerText" in a){b.setTextContent=function(c,d){c.innerText=d};b.getTextContent=function(c){return c.innerText}}else{b.setTextContent=function(c,d){c.nodeValue=d};b.getTextContent=function(c){return c.nodeValue}}}})(wysihtml5.dom);wysihtml5.quirks.cleanPastedHTML=(function(){var a={"a u":wysihtml5.dom.replaceWithChildNodes};function b(l,m,d){m=m||a;d=d||l.ownerDocument||document;var h,e=typeof(l)==="string",c,k,n,g,f=0;if(e){h=wysihtml5.dom.getAsDom(l,d)}else{h=l}for(g in m){k=h.querySelectorAll(g);c=m[g];n=k.length;for(;f<n;f++){c(k[f])}}k=l=m=null;return e?h.innerHTML:h}return b})();(function(b){var a=b.dom;b.quirks.ensureProperClearing=(function(){var c=function(e){var d=this;setTimeout(function(){var f=d.innerHTML.toLowerCase();if(f=="<p>&nbsp;</p>"||f=="<p>&nbsp;</p><p>&nbsp;</p>"){d.innerHTML=""}},0)};return function(d){a.observe(d.element,["cut","keydown"],c)}})();b.quirks.ensureProperClearingOfLists=(function(){var d=["OL","UL","MENU"];var c=function(g,e){if(!e.firstChild||!b.lang.array(d).contains(e.firstChild.nodeName)){return}var i=a.getParentElement(g,{nodeName:d});if(!i){return}var h=i==e.firstChild;if(!h){return}var j=i.childNodes.length<=1;if(!j){return}var f=i.firstChild?i.firstChild.innerHTML==="":true;if(!f){return}i.parentNode.removeChild(i)};return function(e){a.observe(e.element,"keydown",function(g){if(g.keyCode!==b.BACKSPACE_KEY){return}var f=e.selection.getSelectedNode();c(f,e.element)})}})()})(wysihtml5);(function(b){var a="%7E";b.quirks.getCorrectInnerHTML=function(e){var j=e.innerHTML;if(j.indexOf(a)===-1){return j}var g=e.querySelectorAll("[href*='~'], [src*='~']"),c,h,f,d;for(d=0,f=g.length;d<f;d++){c=g[d].href||g[d].src;h=b.lang.string(c).replace("~").by(a);j=b.lang.string(j).replace(h).by(c)}return j}})(wysihtml5);(function(d){var c=d.dom,b=["LI","P","H1","H2","H3","H4","H5","H6"],a=["UL","OL","MENU"];d.quirks.insertLineBreakOnReturn=function(g){function e(j){var h=c.getParentElement(j,{nodeName:["P","DIV"]},2);if(!h){return}var i=document.createTextNode(d.INVISIBLE_SPACE);c.insert(i).before(h);c.replaceWithChildNodes(h);g.selection.selectNode(i)}function f(i){var k=i.keyCode;if(i.shiftKey||(k!==d.ENTER_KEY&&k!==d.BACKSPACE_KEY)){return}var h=i.target,j=g.selection.getSelectedNode(),l=c.getParentElement(j,{nodeName:b},4);if(l){if(l.nodeName==="LI"&&(k===d.ENTER_KEY||k===d.BACKSPACE_KEY)){setTimeout(function(){var n=g.selection.getSelectedNode(),m,o;if(!n){return}m=c.getParentElement(n,{nodeName:a},2);if(m){return}e(n)},0)}else{if(l.nodeName.match(/H[1-6]/)&&k===d.ENTER_KEY){setTimeout(function(){e(g.selection.getSelectedNode())},0)}}return}if(k===d.ENTER_KEY&&!d.browser.insertsLineBreaksOnReturn()){editor.composer.commands.exec("insertHTML","&nbsp;");g.commands.exec("insertLineBreak");i.preventDefault()}}c.observe(g.element.ownerDocument,"keydown",f)}})(wysihtml5);(function(b){var a="wysihtml5-quirks-redraw";b.quirks.redraw=function(c){b.dom.addClass(c,a);b.dom.removeClass(c,a);try{var f=c.ownerDocument;f.execCommand("italic",false,null);f.execCommand("italic",false,null)}catch(d){}}})(wysihtml5);(function(c){var b=c.dom;function a(d){var e=0;if(d.parentNode){do{e+=d.offsetTop||0;d=d.offsetParent}while(d)}return e}c.Selection=Base.extend({constructor:function(d){window.rangy.init();this.editor=d;this.composer=d.composer;this.doc=this.composer.doc},getBookmark:function(){var d=this.getRange();return d&&d.cloneRange()},setBookmark:function(d){if(!d){return}this.setSelection(d)},setBefore:function(e){var d=rangy.createRange(this.doc);d.setStartBefore(e);d.setEndBefore(e);return this.setSelection(d)},setAfter:function(e){var d=rangy.createRange(this.doc);d.setStartAfter(e);d.setEndAfter(e);return this.setSelection(d)},selectNode:function(d){var g=rangy.createRange(this.doc),j=d.nodeType===c.ELEMENT_NODE,l="canHaveHTML" in d?d.canHaveHTML:(d.nodeName!=="IMG"),i=j?d.innerHTML:d.data,f=(i===""||i===c.INVISIBLE_SPACE),k=b.getStyle("display").from(d),m=(k==="block"||k==="list-item");if(f&&j&&l){try{d.innerHTML=c.INVISIBLE_SPACE}catch(h){}}if(l){g.selectNodeContents(d)}else{g.selectNode(d)}if(l&&f&&j){g.collapse(m)}else{if(l&&f){g.setStartAfter(d);g.setEndAfter(d)}}this.setSelection(g)},getSelectedNode:function(e){var f,d;if(e&&this.doc.selection&&this.doc.selection.type==="Control"){d=this.doc.selection.createRange();if(d&&d.length){return d.item(0)}}f=this.getSelection(this.doc);if(f.focusNode===f.anchorNode){return f.focusNode}else{d=this.getRange(this.doc);return d?d.commonAncestorContainer:this.doc.body}},executeAndRestore:function(d,n){var h=this.doc.body,f=n&&h.scrollTop,i=n&&h.scrollLeft,l="_wysihtml5-temp-placeholder",o='<span class="'+l+'">'+c.INVISIBLE_SPACE+"</span>",g=this.getRange(this.doc),m;if(!g){d(h,h);return}var e=g.createContextualFragment(o);g.insertNode(e);try{d(g.startContainer,g.endContainer)}catch(k){setTimeout(function(){throw k},0)}caretPlaceholder=this.doc.querySelector("."+l);if(caretPlaceholder){m=rangy.createRange(this.doc);m.selectNode(caretPlaceholder);m.deleteContents();this.setSelection(m)}else{h.focus()}if(n){h.scrollTop=f;h.scrollLeft=i}try{caretPlaceholder.parentNode.removeChild(caretPlaceholder)}catch(j){}},executeAndRestoreSimple:function(d){var h=this.getRange(),i=this.doc.body,p,f,g,l,j;if(!h){d(i,i);return}l=h.getNodes([3]);f=l[0]||h.startContainer;g=l[l.length-1]||h.endContainer;j={collapsed:h.collapsed,startContainer:f,startOffset:f===h.startContainer?h.startOffset:0,endContainer:g,endOffset:g===h.endContainer?h.endOffset:g.length};try{d(h.startContainer,h.endContainer)}catch(k){setTimeout(function(){throw k},0)}p=rangy.createRange(this.doc);try{p.setStart(j.startContainer,j.startOffset)}catch(o){}try{p.setEnd(j.endContainer,j.endOffset)}catch(n){}try{this.setSelection(p)}catch(m){}},insertHTML:function(e){var d=rangy.createRange(this.doc),g=d.createContextualFragment(e),f=g.lastChild;this.insertNode(g);if(f){this.setAfter(f)}},insertNode:function(e){var d=this.getRange();if(d){d.insertNode(e)}},surround:function(f){var d=this.getRange();if(!d){return}try{d.surroundContents(f);this.selectNode(f)}catch(g){f.appendChild(d.extractContents());d.insertNode(f)}},scrollIntoView:function(){var g=this.doc,f=g.documentElement.scrollHeight>g.documentElement.offsetHeight,d=g._wysihtml5ScrollIntoViewElement=g._wysihtml5ScrollIntoViewElement||(function(){var h=g.createElement("span");h.innerHTML=c.INVISIBLE_SPACE;return h})(),e;if(f){this.insertNode(d);e=a(d);d.parentNode.removeChild(d);if(e>g.body.scrollTop){g.body.scrollTop=e}}},selectLine:function(){if(c.browser.supportsSelectionModify()){this._selectLine_W3C()}else{if(this.doc.selection){this._selectLine_MSIE()}}},_selectLine_W3C:function(){var e=this.doc.defaultView,d=e.getSelection();d.modify("extend","left","lineboundary");d.modify("extend","right","lineboundary")},_selectLine_MSIE:function(){var l=this.doc.selection.createRange(),h=l.boundingTop,p=l.boundingHeight,k=this.doc.body.scrollWidth,e,d,m,g,f;if(!l.moveToPoint){return}if(h===0){m=this.doc.createElement("span");this.insertNode(m);h=m.offsetTop;m.parentNode.removeChild(m)}h+=1;for(g=-10;g<k;g+=2){try{l.moveToPoint(g,h);break}catch(o){}}e=h;d=this.doc.selection.createRange();for(f=k;f>=0;f--){try{d.moveToPoint(f,e);break}catch(n){}}l.setEndPoint("EndToEnd",d);l.select()},getText:function(){var d=this.getSelection();return d?d.toString():""},getNodes:function(d,f){var e=this.getRange();if(e){return e.getNodes([d],f)}else{return[]}},getRange:function(){var d=this.getSelection();return d&&d.rangeCount&&d.getRangeAt(0)},getSelection:function(){return rangy.getSelection(this.doc.defaultView||this.doc.parentWindow)},setSelection:function(d){var f=this.doc.defaultView||this.doc.parentWindow,e=rangy.getSelection(f);return e.setSingleRange(d)}})})(wysihtml5);(function(n,j){var h="span";var f=/\s+/g;function d(q,o,p){if(!q.className){return false}var r=q.className.match(p)||[];return r[r.length-1]===o}function i(q,o,p){if(q.className){l(q,p);q.className+=" "+o}else{q.className=o}}function l(p,o){if(p.className){p.className=p.className.replace(o,"")}}function m(p,o){return p.className.replace(f," ")==o.className.replace(f," ")}function a(p){var o=p.parentNode;while(p.firstChild){o.insertBefore(p.firstChild,p)}o.removeChild(p)}function e(u,s){if(u.attributes.length!=s.attributes.length){return false}for(var t=0,o=u.attributes.length,r,p,q;t<o;++t){r=u.attributes[t];q=r.name;if(q!="class"){p=s.attributes.getNamedItem(q);if(r.specified!=p.specified){return false}if(r.specified&&r.nodeValue!==p.nodeValue){return false}}}return true}function c(o,p){if(j.dom.isCharacterDataNode(o)){if(p==0){return !!o.previousSibling}else{if(p==o.length){return !!o.nextSibling}else{return true}}}return p>0&&p<o.childNodes.length}function b(r,p,q){var o;if(j.dom.isCharacterDataNode(p)){if(q==0){q=j.dom.getNodeIndex(p);p=p.parentNode}else{if(q==p.length){q=j.dom.getNodeIndex(p)+1;p=p.parentNode}else{o=j.dom.splitDataNode(p,q)}}}if(!o){o=p.cloneNode(false);if(o.id){o.removeAttribute("id")}var s;while((s=p.childNodes[q])){o.appendChild(s)}j.dom.insertAfter(o,p)}return(p==r)?o:b(r,o.parentNode,j.dom.getNodeIndex(o))}function g(o){this.isElementMerge=(o.nodeType==n.ELEMENT_NODE);this.firstTextNode=this.isElementMerge?o.lastChild:o;this.textNodes=[this.firstTextNode]}g.prototype={doMerge:function(){var t=[],s,q,r;for(var p=0,o=this.textNodes.length;p<o;++p){s=this.textNodes[p];q=s.parentNode;t[p]=s.data;if(p){q.removeChild(s);if(!q.hasChildNodes()){q.parentNode.removeChild(q)}}}this.firstTextNode.data=r=t.join("");return r},getLength:function(){var p=this.textNodes.length,o=0;while(p--){o+=this.textNodes[p].length}return o},toString:function(){var q=[];for(var p=0,o=this.textNodes.length;p<o;++p){q[p]="'"+this.textNodes[p].data+"'"}return"[Merge("+q.join(",")+")]"}};function k(o,q,p,r){this.tagNames=o||[h];this.cssClass=q||"";this.similarClassRegExp=p;this.normalize=r;this.applyToAnyTagName=false}k.prototype={getAncestorWithClass:function(p){var o;while(p){o=this.cssClass?d(p,this.cssClass,this.similarClassRegExp):true;if(p.nodeType==n.ELEMENT_NODE&&j.dom.arrayContains(this.tagNames,p.tagName.toLowerCase())&&o){return p}p=p.parentNode}return false},postApply:function(A,w){var o=A[0],p=A[A.length-1];var r=[],B;var t=o,q=p;var y=0,C=p.length;var s,v;for(var u=0,x=A.length;u<x;++u){s=A[u];v=this.getAdjacentMergeableTextNode(s.parentNode,false);if(v){if(!B){B=new g(v);r.push(B)}B.textNodes.push(s);if(s===o){t=B.firstTextNode;y=t.length}if(s===p){q=B.firstTextNode;C=B.getLength()}}else{B=null}}var z=this.getAdjacentMergeableTextNode(p.parentNode,true);if(z){if(!B){B=new g(p);r.push(B)}B.textNodes.push(z)}if(r.length){for(u=0,x=r.length;u<x;++u){r[u].doMerge()}w.setStart(t,y);w.setEnd(q,C)}},getAdjacentMergeableTextNode:function(q,o){var s=(q.nodeType==n.TEXT_NODE);var p=s?q.parentNode:q;var t;var r=o?"nextSibling":"previousSibling";if(s){t=q[r];if(t&&t.nodeType==n.TEXT_NODE){return t}}else{t=p[r];if(t&&this.areElementsMergeable(q,t)){return t[o?"firstChild":"lastChild"]}}return null},areElementsMergeable:function(p,o){return j.dom.arrayContains(this.tagNames,(p.tagName||"").toLowerCase())&&j.dom.arrayContains(this.tagNames,(o.tagName||"").toLowerCase())&&m(p,o)&&e(p,o)},createContainer:function(p){var o=p.createElement(this.tagNames[0]);if(this.cssClass){o.className=this.cssClass}return o},applyToTextNode:function(q){var p=q.parentNode;if(p.childNodes.length==1&&j.dom.arrayContains(this.tagNames,p.tagName.toLowerCase())){if(this.cssClass){i(p,this.cssClass,this.similarClassRegExp)}}else{var o=this.createContainer(j.dom.getDocument(q));q.parentNode.insertBefore(o,q);o.appendChild(q)}},isRemovable:function(o){return j.dom.arrayContains(this.tagNames,o.tagName.toLowerCase())&&n.lang.string(o.className).trim()==this.cssClass},undoToTextNode:function(r,p,q){if(!p.containsNode(q)){var o=p.cloneRange();o.selectNode(q);if(o.isPointInRange(p.endContainer,p.endOffset)&&c(p.endContainer,p.endOffset)){b(q,p.endContainer,p.endOffset);p.setEndAfter(q)}if(o.isPointInRange(p.startContainer,p.startOffset)&&c(p.startContainer,p.startOffset)){q=b(q,p.startContainer,p.startOffset)}}if(this.similarClassRegExp){l(q,this.similarClassRegExp)}if(this.isRemovable(q)){a(q)}},applyToRange:function(p){var s=p.getNodes([n.TEXT_NODE]);if(!s.length){try{var r=this.createContainer(p.endContainer.ownerDocument);p.surroundContents(r);this.selectNode(p,r);return}catch(t){}}p.splitBoundaries();s=p.getNodes([n.TEXT_NODE]);if(s.length){var u;for(var q=0,o=s.length;q<o;++q){u=s[q];if(!this.getAncestorWithClass(u)){this.applyToTextNode(u)}}p.setStart(s[0],0);u=s[s.length-1];p.setEnd(u,u.length);if(this.normalize){this.postApply(s,p)}}},undoToRange:function(p){var s=p.getNodes([n.TEXT_NODE]),v,t;if(s.length){p.splitBoundaries();s=p.getNodes([n.TEXT_NODE])}else{var u=p.endContainer.ownerDocument,r=u.createTextNode(n.INVISIBLE_SPACE);p.insertNode(r);p.selectNode(r);s=[r]}for(var q=0,o=s.length;q<o;++q){v=s[q];t=this.getAncestorWithClass(v);if(t){this.undoToTextNode(v,p,t)}}if(o==1){this.selectNode(p,s[0])}else{p.setStart(s[0],0);v=s[s.length-1];p.setEnd(v,v.length);if(this.normalize){this.postApply(s,p)}}},selectNode:function(p,s){var r=s.nodeType===n.ELEMENT_NODE,o="canHaveHTML" in s?s.canHaveHTML:true,q=r?s.innerHTML:s.data,u=(q===""||q===n.INVISIBLE_SPACE);if(u&&r&&o){try{s.innerHTML=n.INVISIBLE_SPACE}catch(t){}}p.selectNodeContents(s);if(u&&r){p.collapse(false)}else{if(u){p.setStartAfter(s);p.setEndAfter(s)}}},getTextSelectedByRange:function(s,o){var p=o.cloneRange();p.selectNodeContents(s);var q=p.intersection(o);var r=q?q.toString():"";p.detach();return r},isAppliedToRange:function(p){var s=[],r,t=p.getNodes([n.TEXT_NODE]);if(!t.length){r=this.getAncestorWithClass(p.startContainer);return r?[r]:false}for(var q=0,o=t.length,u;q<o;++q){u=this.getTextSelectedByRange(t[q],p);r=this.getAncestorWithClass(t[q]);if(u!=""&&!r){return false}else{s.push(r)}}return s},toggleRange:function(o){if(this.isAppliedToRange(o)){this.undoToRange(o)}else{this.applyToRange(o)}}};n.selection.HTMLApplier=k})(wysihtml5,rangy);wysihtml5.Commands=Base.extend({constructor:function(a){this.editor=a;this.composer=a.composer;this.doc=this.composer.doc},support:function(a){return wysihtml5.browser.supportsCommand(this.doc,a)},exec:function(g,c){var f=wysihtml5.commands[g],b=wysihtml5.lang.array(arguments).get(),h=f&&f.exec,a=null;this.editor.fire("beforecommand:composer");if(h){b.unshift(this.composer);a=h.apply(f,b)}else{try{a=this.doc.execCommand(g,false,c)}catch(d){}}this.editor.fire("aftercommand:composer");return a},state:function(f,a){var d=wysihtml5.commands[f],b=wysihtml5.lang.array(arguments).get(),g=d&&d.state;if(g){b.unshift(this.composer);return g.apply(d,b)}else{try{return this.doc.queryCommandState(f)}catch(c){return false}}},value:function(c){var b=wysihtml5.commands[c],d=b&&b.value;if(d){return d.call(b,this.composer,c)}else{try{return this.doc.queryCommandValue(c)}catch(a){return null}}}});(function(b){var a;b.commands.bold={exec:function(c,d){return b.commands.formatInline.exec(c,d,"b")},state:function(d,e,c){return b.commands.formatInline.state(d,e,"b")},value:function(){return a}}})(wysihtml5);(function(f){var d,c="A",e=f.dom;function a(h,n){var m=n.length,j=0,g,l,k;for(;j<m;j++){g=n[j];l=e.getParentElement(g,{nodeName:"code"});k=e.getTextContent(g);if(k.match(e.autoLink.URL_REG_EXP)&&!l){l=e.renameElement(g,"code")}else{e.replaceWithChildNodes(g)}}}function b(g,m){var u=g.doc,r="_wysihtml5-temp-"+(+new Date()),w=/non-matching-class/g,q=0,k,h,p,t,o,n,s,v,l;f.commands.formatInline.exec(g,d,c,r,w);h=u.querySelectorAll(c+"."+r);k=h.length;for(;q<k;q++){p=h[q];p.removeAttribute("class");for(l in m){p.setAttribute(l,m[l])}}n=p;if(k===1){s=e.getTextContent(p);t=!!p.querySelector("*");o=s===""||s===f.INVISIBLE_SPACE;if(m.text){e.setTextContent(p,m.text||p.href);v=u.createTextNode(" ");g.selection.setAfter(p);g.selection.insertNode(v);n=v}}g.selection.setAfter(n)}f.commands.createLink={exec:function(g,j,i){var h=this.state(g,j);if(h){g.selection.executeAndRestore(function(){a(g,h)})}else{i=typeof(i)==="object"?i:{href:i};b(g,i)}},state:function(g,h){return f.commands.formatInline.state(g,h,"A")},value:function(){return d}}})(wysihtml5);(function(c){var b,a=/wysiwyg-font-size-[a-z\-]+/g;c.commands.fontSize={exec:function(d,f,e){return c.commands.formatInline.exec(d,f,"span","wysiwyg-font-size-"+e,a)},state:function(d,f,e){return c.commands.formatInline.state(d,f,"span","wysiwyg-font-size-"+e,a)},value:function(){return b}}})(wysihtml5);(function(c){var b,a=/wysiwyg-color-[a-z]+/g;c.commands.foreColor={exec:function(e,f,d){return c.commands.formatInline.exec(e,f,"span","wysiwyg-color-"+d,a)},state:function(e,f,d){return c.commands.formatInline.state(e,f,"span","wysiwyg-color-"+d,a)},value:function(){return b}}})(wysihtml5);(function(h){var b,o=h.dom,a="DIV",p=["H1","H2","H3","H4","H5","H6","P","BLOCKQUOTE",a];function m(s,t,u){if(s.className){g(s,u);s.className+=" "+t}else{s.className=t}}function g(s,t){s.className=s.className.replace(t,"")}function i(s){return s.nodeType===h.TEXT_NODE&&!h.lang.string(s.data).trim()}function j(t){var s=t.previousSibling;while(s&&i(s)){s=s.previousSibling}return s}function k(s){var t=s.nextSibling;while(t&&i(t)){t=t.nextSibling}return t}function f(t){var v=t.ownerDocument,u=k(t),s=j(t);if(u&&!e(u)){t.parentNode.insertBefore(v.createElement("br"),u)}if(s&&!e(s)){t.parentNode.insertBefore(v.createElement("br"),t)}}function c(t){var u=k(t),s=j(t);if(u&&l(u)){u.parentNode.removeChild(u)}if(s&&l(s)){s.parentNode.removeChild(s)}}function n(t){var s=t.lastChild;if(s&&l(s)){s.parentNode.removeChild(s)}}function l(s){return s.nodeName==="BR"}function e(s){if(l(s)){return true}if(o.getStyle("display").from(s)==="block"){return true}return false}function d(u,v,w,t){if(t){var s=o.observe(u,"DOMNodeInserted",function(y){var z=y.target,x;if(z.nodeType!==h.ELEMENT_NODE){return}x=o.getStyle("display").from(z);if(x.substr(0,6)!=="inline"){z.className+=" "+t}})}u.execCommand(v,false,w);if(s){s.stop()}}function q(s,t){s.selection.selectLine();s.selection.surround(t);c(t);n(t);s.selection.selectNode(t)}function r(s){return !!h.lang.string(s.className).trim()}h.commands.formatBlock={exec:function(s,y,z,t,v){var w=s.doc,x=this.state(s,y,z,t,v),u;z=typeof(z)==="string"?z.toUpperCase():z;if(x){s.selection.executeAndRestoreSimple(function(){if(v){g(x,v)}var A=r(x);if(!A&&x.nodeName===(z||a)){f(x);o.replaceWithChildNodes(x)}else{if(A){o.renameElement(x,a)}}});return}if(z===null||h.lang.array(p).contains(z)){u=s.selection.getSelectedNode();x=o.getParentElement(u,{nodeName:p});if(x){s.selection.executeAndRestoreSimple(function(){if(z){x=o.renameElement(x,z)}if(t){m(x,t,v)}});return}}if(s.commands.support(y)){d(w,y,z||a,t);return}x=w.createElement(z||a);if(t){x.className=t}q(s,x)},state:function(s,w,x,t,v){x=typeof(x)==="string"?x.toUpperCase():x;var u=s.selection.getSelectedNode();return o.getParentElement(u,{nodeName:x,className:t,classRegExp:v})},value:function(){return b}}})(wysihtml5);(function(f){var c,d={strong:"b",em:"i",b:"strong",i:"em"},e={};function b(h){var g=d[h];return g?[h.toLowerCase(),g.toLowerCase()]:[h.toLowerCase()]}function a(h,i,j){var g=h+":"+i;if(!e[g]){e[g]=new f.selection.HTMLApplier(b(h),i,j,true)}return e[g]}f.commands.formatInline={exec:function(h,l,i,j,k){var g=h.selection.getRange();if(!g){return false}a(i,j,k).toggleRange(g);h.selection.setSelection(g)},state:function(h,m,i,j,k){var l=h.doc,n=d[i]||i,g;if(!f.dom.hasElementWithTagName(l,i)&&!f.dom.hasElementWithTagName(l,n)){return false}if(j&&!f.dom.hasElementWithClassName(l,j)){return false}g=h.selection.getRange();if(!g){return false}return a(i,j,k).isAppliedToRange(g)},value:function(){return c}}})(wysihtml5);(function(b){var a;b.commands.insertHTML={exec:function(c,e,d){if(c.commands.support(e)){c.doc.execCommand(e,false,d)}else{c.selection.insertHTML(d)}},state:function(){return false},value:function(){return a}}})(wysihtml5);(function(b){var a="IMG";b.commands.insertImage={exec:function(c,k,f){f=typeof(f)==="object"?f:{src:f};var h=c.doc,g=this.state(c),j,d,e;if(g){c.selection.setBefore(g);e=g.parentNode;e.removeChild(g);b.dom.removeEmptyTextNodes(e);if(e.nodeName==="A"&&!e.firstChild){c.selection.setAfter(e);e.parentNode.removeChild(e)}b.quirks.redraw(c.element);return}g=h.createElement(a);for(d in f){g[d]=f[d]}c.selection.insertNode(g);if(b.browser.hasProblemsSettingCaretAfterImg()){j=h.createTextNode(b.INVISIBLE_SPACE);c.selection.insertNode(j);c.selection.setAfter(j)}else{c.selection.setAfter(g)}},state:function(d){var f=d.doc,e,g,c;if(!b.dom.hasElementWithTagName(f,a)){return false}e=d.selection.getSelectedNode();if(!e){return false}if(e.nodeName===a){return e}if(e.nodeType!==b.ELEMENT_NODE){return false}g=d.selection.getText();g=b.lang.string(g).trim();if(g){return false}c=d.selection.getNodes(b.ELEMENT_NODE,function(h){return h.nodeName==="IMG"});if(c.length!==1){return false}return c[0]},value:function(c){var d=this.state(c);return d&&d.src}}})(wysihtml5);(function(c){var b,a="<br>"+(c.browser.needsSpaceAfterLineBreak()?" ":"");c.commands.insertLineBreak={exec:function(d,e){if(d.commands.support(e)){d.doc.execCommand(e,false,null);if(!c.browser.autoScrollsToCaret()){d.selection.scrollIntoView()}}else{d.commands.exec("insertHTML",a)}},state:function(){return false},value:function(){return b}}})(wysihtml5);(function(b){var a;b.commands.insertOrderedList={exec:function(c,f){var k=c.doc,h=c.selection.getSelectedNode(),i=b.dom.getParentElement(h,{nodeName:"OL"}),j=b.dom.getParentElement(h,{nodeName:"UL"}),e="_wysihtml5-temp-"+new Date().getTime(),g,d;if(c.commands.support(f)){k.execCommand(f,false,null);return}if(i){c.selection.executeAndRestoreSimple(function(){b.dom.resolveList(i)})}else{if(j){c.selection.executeAndRestoreSimple(function(){b.dom.renameElement(j,"ol")})}else{c.commands.exec("formatBlock","div",e);d=k.querySelector("."+e);g=d.innerHTML===""||d.innerHTML===b.INVISIBLE_SPACE;c.selection.executeAndRestoreSimple(function(){i=b.dom.convertToList(d,"ol")});if(g){c.selection.selectNode(i.querySelector("li"))}}}},state:function(c){var d=c.selection.getSelectedNode();return b.dom.getParentElement(d,{nodeName:"OL"})},value:function(){return a}}})(wysihtml5);(function(b){var a;b.commands.insertUnorderedList={exec:function(c,f){var k=c.doc,h=c.selection.getSelectedNode(),i=b.dom.getParentElement(h,{nodeName:"UL"}),j=b.dom.getParentElement(h,{nodeName:"OL"}),e="_wysihtml5-temp-"+new Date().getTime(),g,d;if(c.commands.support(f)){k.execCommand(f,false,null);return}if(i){c.selection.executeAndRestoreSimple(function(){b.dom.resolveList(i)})}else{if(j){c.selection.executeAndRestoreSimple(function(){b.dom.renameElement(j,"ul")})}else{c.commands.exec("formatBlock","div",e);d=k.querySelector("."+e);g=d.innerHTML===""||d.innerHTML===b.INVISIBLE_SPACE;c.selection.executeAndRestoreSimple(function(){i=b.dom.convertToList(d,"ul")});if(g){c.selection.selectNode(i.querySelector("li"))}}}},state:function(c){var d=c.selection.getSelectedNode();return b.dom.getParentElement(d,{nodeName:"UL"})},value:function(){return a}}})(wysihtml5);(function(b){var a;b.commands.italic={exec:function(c,d){return b.commands.formatInline.exec(c,d,"i")},state:function(d,e,c){return b.commands.formatInline.state(d,e,"i")},value:function(){return a}}})(wysihtml5);(function(d){var b,c="wysiwyg-text-align-center",a=/wysiwyg-text-align-[a-z]+/g;d.commands.justifyCenter={exec:function(e,f){return d.commands.formatBlock.exec(e,"formatBlock",null,c,a)},state:function(e,f){return d.commands.formatBlock.state(e,"formatBlock",null,c,a)},value:function(){return b}}})(wysihtml5);(function(d){var b,c="wysiwyg-text-align-left",a=/wysiwyg-text-align-[a-z]+/g;d.commands.justifyLeft={exec:function(e,f){return d.commands.formatBlock.exec(e,"formatBlock",null,c,a)},state:function(e,f){return d.commands.formatBlock.state(e,"formatBlock",null,c,a)},value:function(){return b}}})(wysihtml5);(function(d){var b,c="wysiwyg-text-align-right",a=/wysiwyg-text-align-[a-z]+/g;d.commands.justifyRight={exec:function(e,f){return d.commands.formatBlock.exec(e,"formatBlock",null,c,a)},state:function(e,f){return d.commands.formatBlock.state(e,"formatBlock",null,c,a)},value:function(){return b}}})(wysihtml5);(function(b){var a;b.commands.underline={exec:function(c,d){return b.commands.formatInline.exec(c,d,"u")},state:function(c,d){return b.commands.formatInline.state(c,d,"u")},value:function(){return a}}})(wysihtml5);(function(j){var f=90,h=89,i=8,b=46,a=40,g='<span id="_wysihtml5-undo" class="_wysihtml5-temp">'+j.INVISIBLE_SPACE+"</span>",e='<span id="_wysihtml5-redo" class="_wysihtml5-temp">'+j.INVISIBLE_SPACE+"</span>",d=j.dom;function c(l){var k;while(k=l.querySelector("._wysihtml5-temp")){k.parentNode.removeChild(k)}}j.UndoManager=j.lang.Dispatcher.extend({constructor:function(k){this.editor=k;this.composer=k.composer;this.element=this.composer.element;this.history=[this.composer.getValue()];this.position=1;if(this.composer.commands.support("insertHTML")){this._observe()}},_observe:function(){var n=this,p=this.composer.sandbox.getDocument(),k;d.observe(this.element,"keydown",function(s){if(s.altKey||(!s.ctrlKey&&!s.metaKey)){return}var t=s.keyCode,q=t===f&&!s.shiftKey,r=(t===f&&s.shiftKey)||(t===h);if(q){n.undo();s.preventDefault()}else{if(r){n.redo();s.preventDefault()}}});d.observe(this.element,"keydown",function(q){var r=q.keyCode;if(r===k){return}k=r;if(r===i||r===b){n.transact()}});if(j.browser.hasUndoInContextMenu()){var l,m,o=function(){c(p);clearInterval(l)};d.observe(this.element,"contextmenu",function(){o();n.composer.selection.executeAndRestoreSimple(function(){if(n.element.lastChild){n.composer.selection.setAfter(n.element.lastChild)}p.execCommand("insertHTML",false,g);p.execCommand("insertHTML",false,e);p.execCommand("undo",false,null)});l=setInterval(function(){if(p.getElementById("_wysihtml5-redo")){o();n.redo()}else{if(!p.getElementById("_wysihtml5-undo")){o();n.undo()}}},400);if(!m){m=true;d.observe(document,"mousedown",o);d.observe(p,["mousedown","paste","cut","copy"],o)}})}this.editor.observe("newword:composer",function(){n.transact()}).observe("beforecommand:composer",function(){n.transact()})},transact:function(){var m=this.history[this.position-1],k=this.composer.getValue();if(k==m){return}var l=this.history.length=this.position;if(l>a){this.history.shift();this.position--}this.position++;this.history.push(k)},undo:function(){this.transact();if(this.position<=1){return}this.set(this.history[--this.position-1]);this.editor.fire("undo:composer")},redo:function(){if(this.position>=this.history.length){return}this.set(this.history[++this.position-1]);this.editor.fire("redo:composer")},set:function(k){this.composer.setValue(k);this.editor.focus(true)}})})(wysihtml5);wysihtml5.views.View=Base.extend({constructor:function(b,c,a){this.parent=b;this.element=c;this.config=a;this._observeViewChange()},_observeViewChange:function(){var a=this;this.parent.observe("beforeload",function(){a.parent.observe("change_view",function(b){if(b===a.name){a.parent.currentView=a;a.show();setTimeout(function(){a.focus()},0)}else{a.hide()}})})},focus:function(){if(this.element.ownerDocument.querySelector(":focus")===this.element){return}try{this.element.focus()}catch(a){}},hide:function(){this.element.style.display="none"},show:function(){this.element.style.display=""},disable:function(){this.element.setAttribute("disabled","disabled")},enable:function(){this.element.removeAttribute("disabled")}});(function(c){var b=c.dom,a=c.browser;c.views.Composer=c.views.View.extend({name:"composer",CARET_HACK:"<br>",constructor:function(e,f,d){this.base(e,f,d);this.textarea=this.parent.textarea;this._initSandbox()},clear:function(){this.element.innerHTML=a.displaysCaretInEmptyContentEditableCorrectly()?"":this.CARET_HACK},getValue:function(e){var d=this.isEmpty()?"":c.quirks.getCorrectInnerHTML(this.element);if(e){d=this.parent.parse(d)}d=c.lang.string(d).replace(c.INVISIBLE_SPACE).by("");return d},setValue:function(d,e){if(e){d=this.parent.parse(d)}this.element.innerHTML=d},show:function(){this.iframe.style.display=this._displayStyle||"";this.disable();this.enable()},hide:function(){this._displayStyle=b.getStyle("display").from(this.iframe);if(this._displayStyle==="none"){this._displayStyle=null}this.iframe.style.display="none"},disable:function(){this.element.removeAttribute("contentEditable");this.base()},enable:function(){this.element.setAttribute("contentEditable","true");this.base()},focus:function(e){if(c.browser.doesAsyncFocus()&&this.hasPlaceholderSet()){this.clear()}this.base();var d=this.element.lastChild;if(e&&d){if(d.nodeName==="BR"){this.selection.setBefore(this.element.lastChild)}else{this.selection.setAfter(this.element.lastChild)}}},getTextContent:function(){return b.getTextContent(this.element)},hasPlaceholderSet:function(){return this.getTextContent()==this.textarea.element.getAttribute("placeholder")},isEmpty:function(){var e=this.element.innerHTML,d="blockquote, ul, ol, img, embed, object, table, iframe, svg, video, audio, button, input, select, textarea";return e===""||e===this.CARET_HACK||this.hasPlaceholderSet()||(this.getTextContent()===""&&!this.element.querySelector(d))},_initSandbox:function(){var e=this;this.sandbox=new b.Sandbox(function(){e._create()},{stylesheets:this.config.stylesheets});this.iframe=this.sandbox.getIframe();var d=document.createElement("input");d.type="hidden";d.name="_wysihtml5_mode";d.value=1;var f=this.textarea.element;b.insert(this.iframe).after(f);b.insert(d).after(f)},_create:function(){var f=this;this.doc=this.sandbox.getDocument();this.element=this.doc.body;this.textarea=this.parent.textarea;this.element.innerHTML=this.textarea.getValue(true);this.enable();this.selection=new c.Selection(this.parent);this.commands=new c.Commands(this.parent);b.copyAttributes(["className","spellcheck","title","lang","dir","accessKey"]).from(this.textarea.element).to(this.element);b.addClass(this.element,this.config.composerClassName);if(this.config.style){this.style()}this.observe();var e=this.config.name;if(e){b.addClass(this.element,e);b.addClass(this.iframe,e)}var d=typeof(this.config.placeholder)==="string"?this.config.placeholder:this.textarea.element.getAttribute("placeholder");if(d){b.simulatePlaceholder(this.parent,this,d)}this.commands.exec("styleWithCSS",false);this._initAutoLinking();this._initObjectResizing();this._initUndoManager();if(this.textarea.element.hasAttribute("autofocus")||document.querySelector(":focus")==this.textarea.element){setTimeout(function(){f.focus()},100)}c.quirks.insertLineBreakOnReturn(this);if(!a.clearsContentEditableCorrectly()){c.quirks.ensureProperClearing(this)}if(!a.clearsListsInContentEditableCorrectly()){c.quirks.ensureProperClearingOfLists(this)}if(this.initSync&&this.config.sync){this.initSync()}this.textarea.hide();this.parent.fire("beforeload").fire("load")},_initAutoLinking:function(){var h=this,e=a.canDisableAutoLinking(),f=a.doesAutoLinkingInContentEditable();if(e){this.commands.exec("autoUrlDetect",false)}if(!this.config.autoLink){return}if(!f||(f&&e)){this.parent.observe("newword:composer",function(){h.selection.executeAndRestore(function(j,k){b.autoLink(k.parentNode)})})}var d=this.sandbox.getDocument().getElementsByTagName("a"),i=b.autoLink.URL_REG_EXP,g=function(j){var k=c.lang.string(b.getTextContent(j)).trim();if(k.substr(0,4)==="www."){k="http://"+k}return k};b.observe(this.element,"keydown",function(l){if(!d.length){return}var m=h.selection.getSelectedNode(l.target.ownerDocument),k=b.getParentElement(m,{nodeName:"A"},4),j;if(!k){return}j=g(k);setTimeout(function(){var n=g(k);if(n===j){return}if(n.match(i)){k.setAttribute("href",n)}},0)})},_initObjectResizing:function(){var f=["width","height"],e=f.length,d=this.element;this.commands.exec("enableObjectResizing",this.config.allowObjectResizing);if(this.config.allowObjectResizing){if(a.supportsEvent("resizeend")){b.observe(d,"resizeend",function(j){var l=j.target||j.srcElement,h=l.style,g=0,k;for(;g<e;g++){k=f[g];if(h[k]){l.setAttribute(k,parseInt(h[k],10));h[k]=""}}c.quirks.redraw(d)})}}else{if(a.supportsEvent("resizestart")){b.observe(d,"resizestart",function(g){g.preventDefault()})}}},_initUndoManager:function(){new c.UndoManager(this.parent)}})})(wysihtml5);(function(j){var a=j.dom,g=document,d=window,e=g.createElement("div"),b=["background-color","color","cursor","font-family","font-size","font-style","font-variant","font-weight","line-height","letter-spacing","text-align","text-decoration","text-indent","text-rendering","word-break","word-wrap","word-spacing"],h=["background-color","border-collapse","border-bottom-color","border-bottom-style","border-bottom-width","border-left-color","border-left-style","border-left-width","border-right-color","border-right-style","border-right-width","border-top-color","border-top-style","border-top-width","clear","display","float","margin-bottom","margin-left","margin-right","margin-top","outline-color","outline-offset","outline-width","outline-style","padding-left","padding-right","padding-top","padding-bottom","position","top","left","right","bottom","z-index","vertical-align","text-align","-webkit-box-sizing","-moz-box-sizing","-ms-box-sizing","box-sizing","-webkit-box-shadow","-moz-box-shadow","-ms-box-shadow","box-shadow","-webkit-border-top-right-radius","-moz-border-radius-topright","border-top-right-radius","-webkit-border-bottom-right-radius","-moz-border-radius-bottomright","border-bottom-right-radius","-webkit-border-bottom-left-radius","-moz-border-radius-bottomleft","border-bottom-left-radius","-webkit-border-top-left-radius","-moz-border-radius-topleft","border-top-left-radius","width","height"],c=["width","height","top","left","right","bottom"],f=["html             { height: 100%; }","body             { min-height: 100%; padding: 0; margin: 0; margin-top: -1px; padding-top: 1px; }","._wysihtml5-temp { display: none; }",j.browser.isGecko?"body.placeholder { color: graytext !important; }":"body.placeholder { color: #a9a9a9 !important; }","body[disabled]   { background-color: #eee !important; color: #999 !important; cursor: default !important; }","img:-moz-broken  { -moz-force-broken-image-icon: 1; height: 24px; width: 24px; }"];var i=function(m){if(m.setActive){try{m.setActive()}catch(o){}}else{var n=m.style,p=g.documentElement.scrollTop||g.body.scrollTop,l=g.documentElement.scrollLeft||g.body.scrollLeft,k={position:n.position,top:n.top,left:n.left,WebkitUserSelect:n.WebkitUserSelect};a.setStyles({position:"absolute",top:"-99999px",left:"-99999px",WebkitUserSelect:"none"}).on(m);m.focus();a.setStyles(k).on(m);if(d.scrollTo){d.scrollTo(l,p)}}};j.views.Composer.prototype.style=function(){var o=this,n=g.querySelector(":focus"),q=this.textarea.element,k=q.hasAttribute("placeholder"),p=k&&q.getAttribute("placeholder");this.focusStylesHost=this.focusStylesHost||e.cloneNode(false);this.blurStylesHost=this.blurStylesHost||e.cloneNode(false);if(k){q.removeAttribute("placeholder")}if(q===n){q.blur()}a.copyStyles(h).from(q).to(this.iframe).andTo(this.blurStylesHost);a.copyStyles(b).from(q).to(this.element).andTo(this.blurStylesHost);a.insertCSS(f).into(this.element.ownerDocument);i(q);a.copyStyles(h).from(q).to(this.focusStylesHost);a.copyStyles(b).from(q).to(this.focusStylesHost);var m=j.lang.array(h).without(["display"]);if(n){n.focus()}else{q.blur()}if(k){q.setAttribute("placeholder",p)}if(!j.browser.hasCurrentStyleProperty()){var l=a.observe(d,"resize",function(){if(!a.contains(document.documentElement,o.iframe)){l.stop();return}var s=a.getStyle("display").from(q),r=a.getStyle("display").from(o.iframe);q.style.display="";o.iframe.style.display="none";a.copyStyles(c).from(q).to(o.iframe).andTo(o.focusStylesHost).andTo(o.blurStylesHost);o.iframe.style.display=r;q.style.display=s})}this.parent.observe("focus:composer",function(){a.copyStyles(m).from(o.focusStylesHost).to(o.iframe);a.copyStyles(b).from(o.focusStylesHost).to(o.element)});this.parent.observe("blur:composer",function(){a.copyStyles(m).from(o.blurStylesHost).to(o.iframe);a.copyStyles(b).from(o.blurStylesHost).to(o.element)});return this}})(wysihtml5);(function(d){var c=d.dom,b=d.browser,a={"66":"bold","73":"italic","85":"underline"};d.views.Composer.prototype.observe=function(){var i=this,k=this.getValue(),h=this.sandbox.getIframe(),g=this.element,f=b.supportsEventsInIframeCorrectly()?g:this.sandbox.getWindow(),e=b.supportsEvent("drop")?["drop","paste"]:["dragdrop","paste"];c.observe(h,"DOMNodeRemoved",function(){clearInterval(j);i.parent.fire("destroy:composer")});var j=setInterval(function(){if(!c.contains(document.documentElement,h)){clearInterval(j);i.parent.fire("destroy:composer")}},250);c.observe(f,"focus",function(){i.parent.fire("focus").fire("focus:composer");setTimeout(function(){k=i.getValue()},0)});c.observe(f,"blur",function(){if(k!==i.getValue()){i.parent.fire("change").fire("change:composer")}i.parent.fire("blur").fire("blur:composer")});if(d.browser.isIos()){c.observe(g,"blur",function(){var n=g.ownerDocument.createElement("input"),p=document.documentElement.scrollTop||document.body.scrollTop,m=document.documentElement.scrollLeft||document.body.scrollLeft;try{i.selection.insertNode(n)}catch(o){g.appendChild(n)}n.focus();n.parentNode.removeChild(n);window.scrollTo(m,p)})}c.observe(g,"dragenter",function(){i.parent.fire("unset_placeholder")});if(b.firesOnDropOnlyWhenOnDragOverIsCancelled()){c.observe(g,["dragover","dragenter"],function(m){m.preventDefault()})}c.observe(g,e,function(m){var o=m.dataTransfer,n;if(o&&b.supportsDataTransfer()){n=o.getData("text/html")||o.getData("text/plain")}if(n){g.focus();i.commands.exec("insertHTML",n);i.parent.fire("paste").fire("paste:composer");m.stopPropagation();m.preventDefault()}else{setTimeout(function(){i.parent.fire("paste").fire("paste:composer")},0)}});c.observe(g,"keyup",function(m){var n=m.keyCode;if(n===d.SPACE_KEY||n===d.ENTER_KEY){i.parent.fire("newword:composer")}});this.parent.observe("paste:composer",function(){setTimeout(function(){i.parent.fire("newword:composer")},0)});if(!b.canSelectImagesInContentEditable()){c.observe(g,"mousedown",function(m){var n=m.target;if(n.nodeName==="IMG"){i.selection.selectNode(n);m.preventDefault()}})}c.observe(g,"keydown",function(m){var n=m.keyCode,o=a[n];if((m.ctrlKey||m.metaKey)&&!m.altKey&&o){i.commands.exec(o);m.preventDefault()}});c.observe(g,"keydown",function(n){var p=i.selection.getSelectedNode(true),o=n.keyCode,m;if(p&&p.nodeName==="IMG"&&(o===d.BACKSPACE_KEY||o===d.DELETE_KEY)){m=p.parentNode;m.removeChild(p);if(m.nodeName==="A"&&!m.firstChild){m.parentNode.removeChild(m)}setTimeout(function(){d.quirks.redraw(g)},0);n.preventDefault()}});var l={IMG:"Image: ",A:"Link: "};c.observe(g,"mouseover",function(n){var o=n.target,q=o.nodeName,p;if(q!=="A"&&q!=="IMG"){return}var m=o.hasAttribute("title");if(!m){p=l[q]+(o.getAttribute("href")||o.getAttribute("src"));o.setAttribute("title",p)}})}})(wysihtml5);(function(b){var a=400;b.views.Synchronizer=Base.extend({constructor:function(e,c,d){this.editor=e;this.textarea=c;this.composer=d;this._observe()},fromComposerToTextarea:function(c){this.textarea.setValue(b.lang.string(this.composer.getValue()).trim(),c)},fromTextareaToComposer:function(d){var c=this.textarea.getValue();if(c){this.composer.setValue(c,d)}else{this.composer.clear();this.editor.fire("set_placeholder")}},sync:function(c){if(this.editor.currentView.name==="textarea"){this.fromTextareaToComposer(c)}else{this.fromComposerToTextarea(c)}},_observe:function(){var c,e=this,d=this.textarea.element.form,g=function(){c=setInterval(function(){e.fromComposerToTextarea()},a)},f=function(){clearInterval(c);c=null};g();if(d){b.dom.observe(d,"submit",function(){e.sync(true)});b.dom.observe(d,"reset",function(){setTimeout(function(){e.fromTextareaToComposer()},0)})}this.editor.observe("change_view",function(h){if(h==="composer"&&!c){e.fromTextareaToComposer(true);g()}else{if(h==="textarea"){e.fromComposerToTextarea(true);f()}}});this.editor.observe("destroy:composer",f)}})})(wysihtml5);wysihtml5.views.Textarea=wysihtml5.views.View.extend({name:"textarea",constructor:function(b,c,a){this.base(b,c,a);this._observe()},clear:function(){this.element.value=""},getValue:function(b){var a=this.isEmpty()?"":this.element.value;if(b){a=this.parent.parse(a)}return a},setValue:function(a,b){if(b){a=this.parent.parse(a)}this.element.value=a},hasPlaceholderSet:function(){var d=wysihtml5.browser.supportsPlaceholderAttributeOn(this.element),a=this.element.getAttribute("placeholder")||null,b=this.element.value,c=!b;return(d&&c)||(b===a)},isEmpty:function(){return !wysihtml5.lang.string(this.element.value).trim()||this.hasPlaceholderSet()},_observe:function(){var c=this.element,d=this.parent,a={focusin:"focus",focusout:"blur"},b=wysihtml5.browser.supportsEvent("focusin")?["focusin","focusout","change"]:["focus","blur","change"];d.observe("beforeload",function(){wysihtml5.dom.observe(c,b,function(f){var e=a[f.type]||f.type;d.fire(e).fire(e+":textarea")});wysihtml5.dom.observe(c,["paste","drop"],function(){setTimeout(function(){d.fire("paste").fire("paste:textarea")},0)})})}});(function(f){var e=f.dom,a="wysihtml5-command-dialog-opened",d="input, select, textarea",b="[data-wysihtml5-dialog-field]",c="data-wysihtml5-dialog-field";f.toolbar.Dialog=f.lang.Dispatcher.extend({constructor:function(h,g){this.link=h;this.container=g},_observe:function(){if(this._observed){return}var k=this,l=function(n){var i=k._serialize();if(i==k.elementToChange){k.fire("edit",i)}else{k.fire("save",i)}k.hide();n.preventDefault();n.stopPropagation()};e.observe(k.link,"click",function(i){if(e.hasClass(k.link,a)){setTimeout(function(){k.hide()},0)}});e.observe(this.container,"keydown",function(i){var n=i.keyCode;if(n===f.ENTER_KEY){l(i)}if(n===f.ESCAPE_KEY){k.hide()}});e.delegate(this.container,"[data-wysihtml5-dialog-action=save]","click",l);e.delegate(this.container,"[data-wysihtml5-dialog-action=cancel]","click",function(i){k.fire("cancel");k.hide();i.preventDefault();i.stopPropagation()});var h=this.container.querySelectorAll(d),g=0,j=h.length,m=function(){clearInterval(k.interval)};for(;g<j;g++){e.observe(h[g],"change",m)}this._observed=true},_serialize:function(){var k=this.elementToChange||{},g=this.container.querySelectorAll(b),j=g.length,h=0;for(;h<j;h++){k[g[h].getAttribute(c)]=g[h].value}return k},_interpolate:function(m){var l,o,k,n=document.querySelector(":focus"),g=this.container.querySelectorAll(b),j=g.length,h=0;for(;h<j;h++){l=g[h];if(l===n){continue}if(m&&l.type==="hidden"){continue}o=l.getAttribute(c);k=this.elementToChange?(this.elementToChange[o]||""):l.defaultValue;l.value=k}},show:function(j){var h=this,g=this.container.querySelector(d);this.elementToChange=j;this._observe();this._interpolate();if(j){this.interval=setInterval(function(){h._interpolate(true)},500)}e.addClass(this.link,a);this.container.style.display="";this.fire("show");if(g&&!j){try{g.focus()}catch(i){}}},hide:function(){clearInterval(this.interval);this.elementToChange=null;e.removeClass(this.link,a);this.container.style.display="none";this.fire("hide")}})})(wysihtml5);(function(f){var e=f.dom;var d={position:"relative"};var c={left:0,margin:0,opacity:0,overflow:"hidden",padding:0,position:"absolute",top:0,zIndex:1};var b={cursor:"inherit",fontSize:"50px",height:"50px",marginTop:"-25px",outline:0,padding:0,position:"absolute",right:"-4px",top:"50%"};var a={"x-webkit-speech":"",speech:""};f.toolbar.Speech=function(i,j){var h=document.createElement("input");if(!f.browser.supportsSpeechApiOn(h)){j.style.display="none";return}var k=document.createElement("div");f.lang.object(c).merge({width:j.offsetWidth+"px",height:j.offsetHeight+"px"});e.insert(h).into(k);e.insert(k).into(j);e.setStyles(b).on(h);e.setAttributes(a).on(h);e.setStyles(c).on(k);e.setStyles(d).on(j);var g="onwebkitspeechchange" in h?"webkitspeechchange":"speechchange";e.observe(h,g,function(){i.execCommand("insertText",h.value);h.value=""});e.observe(h,"click",function(l){if(e.hasClass(j,"wysihtml5-command-disabled")){l.preventDefault()}l.stopPropagation()})}})(wysihtml5);(function(f){var a="wysihtml5-command-disabled",b="wysihtml5-commands-disabled",c="wysihtml5-command-active",d="wysihtml5-action-active",e=f.dom;f.toolbar.Toolbar=Base.extend({constructor:function(k,g){this.editor=k;this.container=typeof(g)==="string"?document.getElementById(g):g;this.composer=k.composer;this._getLinks("command");this._getLinks("action");this._observe();this.show();var h=this.container.querySelectorAll("[data-wysihtml5-command=insertSpeech]"),l=h.length,j=0;for(;j<l;j++){new f.toolbar.Speech(this,h[j])}},_getLinks:function(m){var q=this[m+"Links"]=f.lang.array(this.container.querySelectorAll("[data-wysihtml5-"+m+"]")).get(),j=q.length,k=0,g=this[m+"Mapping"]={},n,p,h,o,l;for(;k<j;k++){n=q[k];h=n.getAttribute("data-wysihtml5-"+m);o=n.getAttribute("data-wysihtml5-"+m+"-value");p=this.container.querySelector("[data-wysihtml5-"+m+"-group='"+h+"']");l=this._getDialog(n,h);g[h+":"+o]={link:n,group:p,name:h,value:o,dialog:l,state:false}}},_getDialog:function(k,l){var j=this,i=this.container.querySelector("[data-wysihtml5-dialog='"+l+"']"),h,g;if(i){h=new f.toolbar.Dialog(k,i);h.observe("show",function(){g=j.composer.selection.getBookmark();j.editor.fire("show:dialog",{command:l,dialogContainer:i,commandLink:k})});h.observe("save",function(m){if(g){j.composer.selection.setBookmark(g)}j._execCommand(l,m);j.editor.fire("save:dialog",{command:l,dialogContainer:i,commandLink:k})});h.observe("cancel",function(){j.editor.focus(false);j.editor.fire("cancel:dialog",{command:l,dialogContainer:i,commandLink:k})})}return h},execCommand:function(i,g){if(this.commandsDisabled){return}var h=this.commandMapping[i+":"+g];if(h&&h.dialog&&!h.state){h.dialog.show()}else{this._execCommand(i,g)}},_execCommand:function(h,g){this.editor.focus(false);this.composer.commands.exec(h,g);this._updateLinkStates()},execAction:function(h){var g=this.editor;switch(h){case"change_view":if(g.currentView===g.textarea){g.fire("change_view","composer")}else{g.fire("change_view","textarea")}break}},_observe:function(){var m=this,k=this.editor,g=this.container,h=this.commandLinks.concat(this.actionLinks),l=h.length,j=0;for(;j<l;j++){e.setAttributes({href:"javascript:;",unselectable:"on"}).on(h[j])}e.delegate(g,"[data-wysihtml5-command]","mousedown",function(i){i.preventDefault()});e.delegate(g,"[data-wysihtml5-command]","click",function(o){var n=this,p=n.getAttribute("data-wysihtml5-command"),i=n.getAttribute("data-wysihtml5-command-value");m.execCommand(p,i);o.preventDefault()});e.delegate(g,"[data-wysihtml5-action]","click",function(i){var n=this.getAttribute("data-wysihtml5-action");m.execAction(n);i.preventDefault()});k.observe("focus:composer",function(){m.bookmark=null;clearInterval(m.interval);m.interval=setInterval(function(){m._updateLinkStates()},500)});k.observe("blur:composer",function(){clearInterval(m.interval)});k.observe("destroy:composer",function(){clearInterval(m.interval)});k.observe("change_view",function(i){setTimeout(function(){m.commandsDisabled=(i!=="composer");m._updateLinkStates();if(m.commandsDisabled){e.addClass(g,b)}else{e.removeClass(g,b)}},0)})},_updateLinkStates:function(){var j=this.composer.element,h=this.commandMapping,m=this.actionMapping,g,l,k,n;for(g in h){n=h[g];if(this.commandsDisabled){l=false;e.removeClass(n.link,c);if(n.group){e.removeClass(n.group,c)}if(n.dialog){n.dialog.hide()}}else{l=this.composer.commands.state(n.name,n.value);if(f.lang.object(l).isArray()){l=l.length===1?l[0]:true}e.removeClass(n.link,a);if(n.group){e.removeClass(n.group,a)}}if(n.state===l){continue}n.state=l;if(l){e.addClass(n.link,c);if(n.group){e.addClass(n.group,c)}if(n.dialog){if(typeof(l)==="object"){n.dialog.show(l)}else{n.dialog.hide()}}}else{e.removeClass(n.link,c);if(n.group){e.removeClass(n.group,c)}if(n.dialog){n.dialog.hide()}}}for(g in m){k=m[g];if(k.name==="change_view"){k.state=this.editor.currentView===this.editor.textarea;if(k.state){e.addClass(k.link,d)}else{e.removeClass(k.link,d)}}}},show:function(){this.container.style.display=""},hide:function(){this.container.style.display="none"}})})(wysihtml5);(function(c){var b;var a={name:b,style:true,toolbar:b,autoLink:true,parserRules:{tags:{br:{},span:{},div:{},p:{}},classes:{}},parser:c.dom.parse,composerClassName:"wysihtml5-editor",bodyClassName:"wysihtml5-supported",stylesheets:[],placeholderText:b,allowObjectResizing:true,supportTouchDevices:true};c.Editor=c.lang.Dispatcher.extend({constructor:function(f,d){this.textareaElement=typeof(f)==="string"?document.getElementById(f):f;this.config=c.lang.object({}).merge(a).merge(d).get();this.textarea=new c.views.Textarea(this,this.textareaElement,this.config);this.currentView=this.textarea;this._isCompatible=c.browser.supported();if(!this._isCompatible||(!this.config.supportTouchDevices&&c.browser.isTouchDevice())){var e=this;setTimeout(function(){e.fire("beforeload").fire("load")},0);return}c.dom.addClass(document.body,this.config.bodyClassName);this.composer=new c.views.Composer(this,this.textareaElement,this.config);this.currentView=this.composer;if(typeof(this.config.parser)==="function"){this._initParser()}this.observe("beforeload",function(){this.synchronizer=new c.views.Synchronizer(this,this.textarea,this.composer);if(this.config.toolbar){this.toolbar=new c.toolbar.Toolbar(this,this.config.toolbar)}})},isCompatible:function(){return this._isCompatible},clear:function(){this.currentView.clear();return this},getValue:function(d){return this.currentView.getValue(d)},setValue:function(d,e){if(!d){return this.clear()}this.currentView.setValue(d,e);return this},focus:function(d){this.currentView.focus(d);return this},disable:function(){this.currentView.disable();return this},enable:function(){this.currentView.enable();return this},isEmpty:function(){return this.currentView.isEmpty()},hasPlaceholderSet:function(){return this.currentView.hasPlaceholderSet()},parse:function(d){var e=this.config.parser(d,this.config.parserRules,this.composer.sandbox.getDocument(),true);if(typeof(d)==="object"){c.quirks.redraw(d)}return e},_initParser:function(){this.observe("paste:composer",function(){var d=true,e=this;e.composer.selection.executeAndRestore(function(){c.quirks.cleanPastedHTML(e.composer.element);e.parse(e.composer.element)},d)});this.observe("paste:textarea",function(){var d=this.textarea.getValue(),e;e=this.parse(d);this.textarea.setValue(e)})}})})(wysihtml5);
/*boostrap-wysihtml/bootstrap-wysihtml5.js*/
!function(f,h){var d={"font-styles":function(i,j){var k=(j&&j.size)?" btn-"+j.size:"";return"<li class='dropdown'><a class='btn dropdown-toggle"+k+"' data-toggle='dropdown' href='#'><i class='icon-font'></i>&nbsp;<span class='current-font'>"+i.font_styles.normal+"</span>&nbsp;<b class='caret'></b></a><ul class='dropdown-menu'><li><a data-wysihtml5-command='formatBlock' data-wysihtml5-command-value='div'>"+i.font_styles.normal+"</a></li><li><a data-wysihtml5-command='formatBlock' data-wysihtml5-command-value='h1'>"+i.font_styles.h1+"</a></li><li><a data-wysihtml5-command='formatBlock' data-wysihtml5-command-value='h2'>"+i.font_styles.h2+"</a></li><li><a data-wysihtml5-command='formatBlock' data-wysihtml5-command-value='h3'>"+i.font_styles.h3+"</a></li></ul></li>"},emphasis:function(i,j){var k=(j&&j.size)?" btn-"+j.size:"";return"<li><div class='btn-group'><a class='btn"+k+"' data-wysihtml5-command='bold' title='CTRL+B'>"+i.emphasis.bold+"</a><a class='btn"+k+"' data-wysihtml5-command='italic' title='CTRL+I'>"+i.emphasis.italic+"</a><a class='btn"+k+"' data-wysihtml5-command='underline' title='CTRL+U'>"+i.emphasis.underline+"</a></div></li>"},lists:function(i,j){var k=(j&&j.size)?" btn-"+j.size:"";return"<li><div class='btn-group'><a class='btn"+k+"' data-wysihtml5-command='insertUnorderedList' title='"+i.lists.unordered+"'><i class='icon-list'></i></a><a class='btn"+k+"' data-wysihtml5-command='insertOrderedList' title='"+i.lists.ordered+"'><i class='icon-th-list'></i></a><a class='btn"+k+"' data-wysihtml5-command='Outdent' title='"+i.lists.outdent+"'><i class='icon-indent-right'></i></a><a class='btn"+k+"' data-wysihtml5-command='Indent' title='"+i.lists.indent+"'><i class='icon-indent-left'></i></a></div></li>"},link:function(i,j){var k=(j&&j.size)?" btn-"+j.size:"";return"<li><div class='bootstrap-wysihtml5-insert-link-modal modal hide fade'><div class='modal-header'><a class='close' data-dismiss='modal'>&times;</a><h3>"+i.link.insert+"</h3></div><div class='modal-body'><div class='row-fluid control-group'><label class='span2'>"+i.link.textToDisplay+": </label><input value='' class='bootstrap-wysihtml5-insert-link-text input-xlarge'></div><div class='row-fluid control-group'><label class='span2'>"+i.link.linkTo+": </label><input value='http://' class='bootstrap-wysihtml5-insert-link-url input-xlarge'></div></div><div class='modal-footer'><a href='#' class='btn' data-dismiss='modal'>"+i.link.cancel+"</a><a href='#' style='color:#ffffff!important;' class='btn btn-primary' data-dismiss='modal'>"+i.link.insert+"</a></div></div><a class='btn"+k+"' data-wysihtml5-command='createLink' title='"+i.link.insert+"'><i class='icon-share'></i></a></li>"},image:function(i,j){var k=(j&&j.size)?" btn-"+j.size:"";return"<li><div class='bootstrap-wysihtml5-insert-image-modal modal hide fade'><div class='modal-header'><a class='close' data-dismiss='modal'>&times;</a><h3>"+i.image.insert+"</h3></div><div class='modal-body'><input value='http://' class='bootstrap-wysihtml5-insert-image-url input-xlarge'></div><div class='modal-footer'><a href='#' class='btn' data-dismiss='modal'>"+i.image.cancel+"</a><a href='#' class='btn btn-primary' data-dismiss='modal'>"+i.image.insert+"</a></div></div><a class='btn"+k+"' data-wysihtml5-command='insertImage' title='"+i.image.insert+"'><i class='icon-picture'></i></a></li>"},html:function(i,j){var k=(j&&j.size)?" btn-"+j.size:"";return"<li><div class='btn-group'><a class='btn"+k+"' data-wysihtml5-action='change_view' title='"+i.html.edit+"'><i class='icon-pencil'></i></a></div></li>"},color:function(i,j){var k=(j&&j.size)?" btn-"+j.size:"";return"<li class='dropdown'><a class='btn dropdown-toggle"+k+"' data-toggle='dropdown' href='#'><span class='current-color'>"+i.colours.black+"</span>&nbsp;<b class='caret'></b></a><ul class='dropdown-menu'><li><div class='wysihtml5-colors' data-wysihtml5-command-value='black'></div><a class='wysihtml5-colors-title' data-wysihtml5-command='foreColor' data-wysihtml5-command-value='black'>"+i.colours.black+"</a></li><li><div class='wysihtml5-colors' data-wysihtml5-command-value='silver'></div><a class='wysihtml5-colors-title' data-wysihtml5-command='foreColor' data-wysihtml5-command-value='silver'>"+i.colours.silver+"</a></li><li><div class='wysihtml5-colors' data-wysihtml5-command-value='gray'></div><a class='wysihtml5-colors-title' data-wysihtml5-command='foreColor' data-wysihtml5-command-value='gray'>"+i.colours.gray+"</a></li><li><div class='wysihtml5-colors' data-wysihtml5-command-value='maroon'></div><a class='wysihtml5-colors-title' data-wysihtml5-command='foreColor' data-wysihtml5-command-value='maroon'>"+i.colours.maroon+"</a></li><li><div class='wysihtml5-colors' data-wysihtml5-command-value='red'></div><a class='wysihtml5-colors-title' data-wysihtml5-command='foreColor' data-wysihtml5-command-value='red'>"+i.colours.red+"</a></li><li><div class='wysihtml5-colors' data-wysihtml5-command-value='purple'></div><a class='wysihtml5-colors-title' data-wysihtml5-command='foreColor' data-wysihtml5-command-value='purple'>"+i.colours.purple+"</a></li><li><div class='wysihtml5-colors' data-wysihtml5-command-value='green'></div><a class='wysihtml5-colors-title' data-wysihtml5-command='foreColor' data-wysihtml5-command-value='green'>"+i.colours.green+"</a></li><li><div class='wysihtml5-colors' data-wysihtml5-command-value='olive'></div><a class='wysihtml5-colors-title' data-wysihtml5-command='foreColor' data-wysihtml5-command-value='olive'>"+i.colours.olive+"</a></li><li><div class='wysihtml5-colors' data-wysihtml5-command-value='navy'></div><a class='wysihtml5-colors-title' data-wysihtml5-command='foreColor' data-wysihtml5-command-value='navy'>"+i.colours.navy+"</a></li><li><div class='wysihtml5-colors' data-wysihtml5-command-value='blue'></div><a class='wysihtml5-colors-title' data-wysihtml5-command='foreColor' data-wysihtml5-command-value='blue'>"+i.colours.blue+"</a></li><li><div class='wysihtml5-colors' data-wysihtml5-command-value='orange'></div><a class='wysihtml5-colors-title' data-wysihtml5-command='foreColor' data-wysihtml5-command-value='orange'>"+i.colours.orange+"</a></li></ul></li>"}};var e=function(k,i,j){return d[k](i,j)};var g=function(k,i){this.el=k;var l=i||b;for(var j in l.customTemplates){d[j]=l.customTemplates[j]}this.toolbar=this.createToolbar(k,l);this.editor=this.createEditor(i);window.editor=this.editor;f("iframe.wysihtml5-sandbox").each(function(m,n){f(n.contentWindow).off("focus.wysihtml5").on({"focus.wysihtml5":function(){f("li.dropdown").removeClass("open")}})})};g.prototype={constructor:g,createEditor:function(j){j=j||{};j.toolbar=this.toolbar[0];var k=new h.Editor(this.el[0],j);if(j&&j.events){for(var i in j.events){k.on(i,j.events[i])}}return k},createToolbar:function(m,k){var j=this;var n=f("<ul/>",{"class":"wysihtml5-toolbar",style:"display:none"});var i=k.locale||b.locale||"en";for(var l in b){var o=false;if(k[l]!==undefined){if(k[l]===true){o=true}}else{o=b[l]}if(o===true){n.append(e(l,a[i],k));if(l==="html"){this.initHtml(n)}if(l==="link"){this.initInsertLink(n)}if(l==="image"){this.initInsertImage(n)}}}if(k.toolbar){for(l in k.toolbar){n.append(k.toolbar[l])}}n.find("a[data-wysihtml5-command='formatBlock']").click(function(r){var q=r.target||r.srcElement;var p=f(q);j.toolbar.find(".current-font").text(p.html())});n.find("a[data-wysihtml5-command='foreColor']").click(function(r){var q=r.target||r.srcElement;var p=f(q);j.toolbar.find(".current-color").text(p.html())});this.el.before(n);return n},initHtml:function(i){var j="a[data-wysihtml5-action='change_view']";i.find(j).click(function(k){i.find("a.btn").not(j).toggleClass("disabled")})},initInsertImage:function(p){var k=this;var o=p.find(".bootstrap-wysihtml5-insert-image-modal");var m=o.find(".bootstrap-wysihtml5-insert-image-url");var j=o.find("a.btn-primary");var i=m.val();var l;var n=function(){var q=m.val();m.val(i);k.editor.currentView.element.focus();if(l){k.editor.composer.selection.setBookmark(l);l=null}k.editor.composer.commands.exec("insertImage",q)};m.keypress(function(q){if(q.which==13){n();o.modal("hide")}});j.click(n);o.on("shown",function(){m.focus()});o.on("hide",function(){k.editor.currentView.element.focus()});p.find("a[data-wysihtml5-command=insertImage]").click(function(){var q=f(this).hasClass("wysihtml5-command-active");if(!q){k.editor.currentView.element.focus(false);l=k.editor.composer.selection.getBookmark();o.modal("show");o.on("click.dismiss.modal",'[data-dismiss="modal"]',function(r){r.stopPropagation()});return false}else{return true}})},initInsertLink:function(p){var t=this;var k=p.find(".bootstrap-wysihtml5-insert-link-modal");var n=k.find(".bootstrap-wysihtml5-insert-link-url");var l=k.find(".bootstrap-wysihtml5-insert-link-text");var m=k.find("a.btn-primary");var s=n.val();var r=l.val();var i;var q=function(){var v=l.val();var u=n.val();l.val(r);if(u.length==0||u=="http://"){l.val(v);var w=gt.gettext("You must enter Link.");if(f("#errorText").size()==0){n.after("<span id='errorText' style='color:red;'>"+w+"</span>")}return false}var x=/^(ht|f)tps?:\/\/[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/;if(!x.test(u)){var w=gt.gettext("Link is invalid.");if(f("#errorText").size()==0){n.after("<span id='errorText' style='color:red;'>"+w+"</span>")}return false}t.editor.currentView.element.focus();if(i){t.editor.composer.selection.setBookmark(i);i=null}var y=j(u,"http");if(y===false){u="http://"+u}if(v.length==0){v=u}t.editor.composer.commands.exec("createLink",{text:v,href:u,target:"_blank",rel:"nofollow"});n.val(s)};var j=function(v,w,x){var u=(v+"").indexOf(w,(x||0));return u===-1?false:u};var o=false;n.keypress(function(u){if(u.which==13){q();k.modal("hide")}});m.click(q);k.on("shown",function(){l.focus()});k.on("hide",function(){t.editor.currentView.element.focus()});p.find("a[data-wysihtml5-command=createLink]").click(function(){var u=f(this).hasClass("wysihtml5-command-active");if(!u){t.editor.currentView.element.focus(false);i=t.editor.composer.selection.getBookmark();k.appendTo("body").modal("show");f("#errorText").remove();l.val("");n.val("http://");k.on("click.dismiss.modal",'[data-dismiss="modal"]',function(v){v.stopPropagation()});return false}else{return false}})}};var c={resetDefaults:function(){f.fn.wysihtml5.defaultOptions=f.extend(true,{},f.fn.wysihtml5.defaultOptionsCache)},bypassDefaults:function(i){return this.each(function(){var j=f(this);j.data("wysihtml5",new g(j,i))})},shallowExtend:function(i){var j=f.extend({},f.fn.wysihtml5.defaultOptions,i||{});var k=this;return c.bypassDefaults.apply(k,[j])},deepExtend:function(i){var j=f.extend(true,{},f.fn.wysihtml5.defaultOptions,i||{});var k=this;return c.bypassDefaults.apply(k,[j])},init:function(i){var j=this;return c.shallowExtend.apply(j,[i])}};f.fn.wysihtml5=function(i){if(c[i]){return c[i].apply(this,Array.prototype.slice.call(arguments,1))}else{if(typeof i==="object"||!i){return c.init.apply(this,arguments)}else{f.error("Method "+i+" does not exist on jQuery.wysihtml5")}}};f.fn.wysihtml5.Constructor=g;var b=f.fn.wysihtml5.defaultOptions={"font-styles":true,color:false,emphasis:true,lists:true,html:false,link:true,image:true,events:{},parserRules:{classes:{"wysiwyg-color-silver":1,"wysiwyg-color-gray":1,"wysiwyg-color-white":1,"wysiwyg-color-maroon":1,"wysiwyg-color-red":1,"wysiwyg-color-purple":1,"wysiwyg-color-fuchsia":1,"wysiwyg-color-green":1,"wysiwyg-color-lime":1,"wysiwyg-color-olive":1,"wysiwyg-color-yellow":1,"wysiwyg-color-navy":1,"wysiwyg-color-blue":1,"wysiwyg-color-teal":1,"wysiwyg-color-aqua":1,"wysiwyg-color-orange":1},tags:{b:{},i:{},br:{},ol:{},ul:{},li:{},h1:{},h2:{},h3:{},blockquote:{},u:1,img:{check_attributes:{width:"numbers",alt:"alt",src:"url",height:"numbers"}},a:{set_attributes:{target:"_blank",rel:"nofollow"},check_attributes:{href:"url"}},span:1,div:1}},stylesheets:["./lib/css/wysiwyg-color.css"],locale:"en"};if(typeof f.fn.wysihtml5.defaultOptionsCache==="undefined"){f.fn.wysihtml5.defaultOptionsCache=f.extend(true,{},f.fn.wysihtml5.defaultOptions)}var a=f.fn.wysihtml5.locale={en:{font_styles:{normal:"Normal text",h1:"Heading 1",h2:"Heading 2",h3:"Heading 3"},emphasis:{bold:"Bold",italic:"Italic",underline:"Underline"},lists:{unordered:"Unordered list",ordered:"Ordered list",outdent:"Outdent",indent:"Indent"},link:{insert:"Insert link",cancel:"Cancel",textToDisplay:"Text to display",linkTo:"Link to"},image:{insert:"Insert image",cancel:"Cancel"},html:{edit:"Edit HTML"},colours:{black:"Black",silver:"Silver",gray:"Grey",maroon:"Maroon",red:"Red",purple:"Purple",green:"Green",olive:"Olive",navy:"Navy",blue:"Blue",orange:"Orange"}}}}(window.jQuery,window.wysihtml5);
/*bootstrap-markdown/bootstrap-markdown.js*/
(function(K){var e=K.Markdown=function e(R){switch(typeof R){case"undefined":this.dialect=e.dialects.Gruber;break;case"object":this.dialect=R;break;default:if(R in e.dialects){this.dialect=e.dialects[R]}else{throw new Error("Unknown Markdown dialect '"+String(R)+"'")}break}this.em_state=[];this.strong_state=[];this.debug_indent=""};K.parse=function(T,R){var S=new e(R);return S.toTree(T)};K.toHTML=function u(U,T,S){var R=K.toHTMLTree(U,T,S);return K.renderJsonML(R)};K.toHTMLTree=function w(S,W,U){if(typeof S==="string"){S=this.parse(S,W)}var T=C(S),R={};if(T&&T.references){R=T.references}var V=i(S,R,U);q(V);return V};function f(){return"Markdown.mk_block( "+uneval(this.toString())+", "+uneval(this.trailing)+", "+uneval(this.lineNumber)+" )"}function H(){var R=require("util");return"Markdown.mk_block( "+R.inspect(this.toString())+", "+R.inspect(this.trailing)+", "+R.inspect(this.lineNumber)+" )"}var g=e.mk_block=function(U,S,R){if(arguments.length==1){S="\n\n"}var T=new String(U);T.trailing=S;T.inspect=H;T.toSource=f;if(R!=undefined){T.lineNumber=R}return T};function G(S){var T=0,R=-1;while((R=S.indexOf("\n",R+1))!==-1){T++}return T}e.prototype.split_blocks=function z(T,W){var U=/([\s\S]+?)($|\n(?:\s*\n|$)+)/g,V=[],R;var S=1;if((R=/^(\s*\n)/.exec(T))!=null){S+=G(R[0]);U.lastIndex=R[0].length}while((R=U.exec(T))!==null){V.push(g(R[1],R[2],S));S+=G(R[0])}return V};e.prototype.processBlock=function M(W,V){var S=this.dialect.block,R=S.__order__;if("__call__" in S){return S.__call__.call(this,W,V)}for(var U=0;U<R.length;U++){var T=S[R[U]].call(this,W,V);if(T){if(!A(T)||(T.length>0&&!(A(T[0])))){this.debug(R[U],"didn't return a proper array")}return T}}return[]};e.prototype.processInline=function h(R){return this.dialect.inline.__call__.call(this,String(R))};e.prototype.toTree=function I(T,S){var U=T instanceof Array?T:this.split_blocks(T);var V=this.tree;try{this.tree=S||this.tree||["markdown"];U:while(U.length){var R=this.processBlock(U.shift(),U);if(!R.length){continue U}this.tree.push.apply(this.tree,R)}return this.tree}finally{if(S){this.tree=V}}};e.prototype.debug=function(){var R=Array.prototype.slice.call(arguments);R.unshift(this.debug_indent);if(typeof print!=="undefined"){print.apply(print,R)}if(typeof console!=="undefined"&&typeof console.log!=="undefined"){console.log.apply(null,R)}};e.prototype.loop_re_over_block=function(U,V,T){var S,R=V.valueOf();while(R.length&&(S=U.exec(R))!=null){R=R.substr(S[0].length);T.call(this,S)}return R};e.dialects={};e.dialects.Gruber={block:{atxHeader:function s(T,S){var R=T.match(/^(#{1,6})\s*(.*?)\s*#*\s*(?:\n|$)/);if(!R){return undefined}var U=["header",{level:R[1].length}];Array.prototype.push.apply(U,this.processInline(R[2]));if(R[0].length<T.length){S.unshift(g(T.substr(R[0].length),T.trailing,T.lineNumber+2))}return[U]},setextHeader:function x(T,S){var R=T.match(/^(.*)\n([-=])\2\2+(?:\n|$)/);if(!R){return undefined}var V=(R[2]==="=")?1:2;var U=["header",{level:V},R[1]];if(R[0].length<T.length){S.unshift(g(T.substr(R[0].length),T.trailing,T.lineNumber+2))}return[U]},code:function l(W,V){var T=[],U=/^(?: {0,3}\t| {4})(.*)\n?/,S;if(!W.match(U)){return undefined}block_search:do{var R=this.loop_re_over_block(U,W.valueOf(),function(X){T.push(X[1])});if(R.length){V.unshift(g(R,W.trailing));break block_search}else{if(V.length){if(!V[0].match(U)){break block_search}T.push(W.trailing.replace(/[^\n]/g,"").substring(2));W=V.shift()}else{break block_search}}}while(true);return[["code_block",T.join("\n")]]},horizRule:function P(T,S){var R=T.match(/^(?:([\s\S]*?)\n)?[ \t]*([-_*])(?:[ \t]*\2){2,}[ \t]*(?:\n([\s\S]*))?$/);if(!R){return undefined}var U=[["hr"]];if(R[1]){U.unshift.apply(U,this.processBlock(R[1],[]))}if(R[3]){S.unshift(g(R[3]))}return U},lists:(function(){var U="[*+-]|\\d+\\.",S=/[*+-]/,aa=/\d+\./,Y=new RegExp("^( {0,3})("+U+")[ \t]+"),T="(?: {0,3}\\t| {4})";function V(ab){return new RegExp("(?:^("+T+"{0,"+ab+"} {0,3})("+U+")\\s+)|(^"+T+"{0,"+(ab-1)+"}[ ]{0,4})")}function R(ab){return ab.replace(/ {0,3}\t/g,"    ")}function Z(ac,ai,ah,ad){if(ai){ac.push(["para"].concat(ah));return}var ab=ac[ac.length-1] instanceof Array&&ac[ac.length-1][0]=="para"?ac[ac.length-1]:ac;if(ad&&ac.length>1){ah.unshift(ad)}for(var af=0;af<ah.length;af++){var ag=ah[af],ae=typeof ag=="string";if(ae&&ab.length>1&&typeof ab[ab.length-1]=="string"){ab[ab.length-1]+=ag}else{ab.push(ag)}}}function W(ah,ag){var af=new RegExp("^("+T+"{"+ah+"}.*?\\n?)*$"),ae=new RegExp("^"+T+"{"+ah+"}","gm"),ad=[];while(ag.length>0){if(af.exec(ag[0])){var ac=ag.shift(),ab=ac.replace(ae,"");ad.push(g(ab,ac.trailing,ac.lineNumber))}break}return ad}function X(ae,ad,ab){var ag=ae.list;var af=ag[ag.length-1];if(af[1] instanceof Array&&af[1][0]=="para"){return}if(ad+1==ab.length){af.push(["para"].concat(af.splice(1)))}else{var ac=af.pop();af.push(["para"].concat(af.splice(1)),ac)}}return function(ag,am){var an=ag.match(Y);if(!an){return undefined}function ae(ax){var ay=S.exec(ax[2])?["bulletlist"]:["numberlist"];af.push({list:ay,indent:ax[1]});return ay}var af=[],ar=ae(an),ad,al=false,aw=[af[0].list],ap;loose_search:while(true){var ab=ag.split(/(?=\n)/);var at="";tight_search:for(var au=0;au<ab.length;au++){var ac="",ao=ab[au].replace(/^\n/,function(ax){ac=ax;return""});var aj=V(af.length);an=ao.match(aj);if(an[1]!==undefined){if(at.length){Z(ad,al,this.processInline(at),ac);al=false;at=""}an[1]=R(an[1]);var ah=Math.floor(an[1].length/4)+1;if(ah>af.length){ar=ae(an);ad.push(ar);ad=ar[1]=["listitem"]}else{var ak=false;for(ap=0;ap<af.length;ap++){if(af[ap].indent!=an[1]){continue}ar=af[ap].list;af.splice(ap+1);ak=true;break}if(!ak){ah++;if(ah<=af.length){af.splice(ah);ar=af[ah-1].list}else{ar=ae(an);ad.push(ar)}}ad=["listitem"];ar.push(ad)}ac=""}if(ao.length>an[0].length){at+=ac+ao.substr(an[0].length)}}if(at.length){Z(ad,al,this.processInline(at),ac);al=false;at=""}var aq=W(af.length,am);if(aq.length>0){c(af,X,this);ad.push.apply(ad,this.toTree(aq,[]))}var ai=am[0]&&am[0].valueOf()||"";if(ai.match(Y)||ai.match(/^ /)){ag=am.shift();var av=this.dialect.block.horizRule(ag,am);if(av){aw.push.apply(aw,av);break}c(af,X,this);al=true;continue loose_search}break}return aw}})(),blockquote:function L(W,U){if(!W.match(/^>/m)){return undefined}var Y=[];if(W[0]!=">"){var S=W.split(/\n/),V=[];while(S.length&&S[0][0]!=">"){V.push(S.shift())}W=S.join("\n");Y.push.apply(Y,this.processBlock(V.join("\n"),[]))}while(U.length&&U[0][0]==">"){var R=U.shift();W=new String(W+W.trailing+R);W.trailing=R.trailing}var T=W.replace(/^> ?/gm,""),X=this.tree;Y.push(this.toTree(T,["blockquote"]));return Y},referenceDefn:function J(V,U){var T=/^\s*\[(.*?)\]:\s*(\S+)(?:\s+(?:(['"])(.*?)\3|\((.*?)\)))?\n?/;if(!V.match(T)){return undefined}if(!C(this.tree)){this.tree.splice(1,0,{})}var S=C(this.tree);if(S.references===undefined){S.references={}}var R=this.loop_re_over_block(T,V,function(W){if(W[2]&&W[2][0]=="<"&&W[2][W[2].length-1]==">"){W[2]=W[2].substring(1,W[2].length-1)}var X=S.references[W[1].toLowerCase()]={href:W[2]};if(W[4]!==undefined){X.title=W[4]}else{if(W[5]!==undefined){X.title=W[5]}}});if(R.length){U.unshift(g(R,V.trailing))}return[]},para:function D(S,R){return[["para"].concat(this.processInline(S))]}}};e.dialects.Gruber.inline={__oneElement__:function d(W,S,V){var R,T,X=0;S=S||this.dialect.inline.__patterns__;var U=new RegExp("([\\s\\S]*?)("+(S.source||S)+")");R=U.exec(W);if(!R){return[W.length,W]}else{if(R[1]){return[R[1].length,R[1]]}}var T;if(R[2] in this.dialect.inline){T=this.dialect.inline[R[2]].call(this,W.substr(R.index),R,V||[])}T=T||[R[2].length,R[2]];return T},__call__:function r(V,T){var R=[],S;function U(W){if(typeof W=="string"&&typeof R[R.length-1]=="string"){R[R.length-1]+=W}else{R.push(W)}}while(V.length>0){S=this.dialect.inline.__oneElement__.call(this,V,T,R);V=V.substr(S.shift());c(S,U)}return R},"]":function(){},"}":function(){},"\\":function t(R){if(R.match(/^\\[\\`\*_{}\[\]()#\+.!\-]/)){return[2,R[1]]}else{return[1,"\\"]}},"![":function m(T){var R=T.match(/^!\[(.*?)\][ \t]*\([ \t]*(\S*)(?:[ \t]+(["'])(.*?)\3)?[ \t]*\)/);if(R){if(R[2]&&R[2][0]=="<"&&R[2][R[2].length-1]==">"){R[2]=R[2].substring(1,R[2].length-1)}R[2]=this.dialect.inline.__call__.call(this,R[2],/\\/)[0];var S={alt:R[1],href:R[2]||""};if(R[4]!==undefined){S.title=R[4]}return[R[0].length,["img",S]]}R=T.match(/^!\[(.*?)\][ \t]*\[(.*?)\]/);if(R){return[R[0].length,["img_ref",{alt:R[1],ref:R[2].toLowerCase(),original:R[0]}]]}return[2,"!["]},"[":function n(ab){var Y=String(ab);var W=e.DialectHelpers.inline_until_char.call(this,ab.substr(1),"]");if(!W){return[1,"["]}var Z=1+W[0],S=W[1],X,aa;ab=ab.substr(Z);var U=ab.match(/^\s*\([ \t]*(\S+)(?:[ \t]+(["'])(.*?)\2)?[ \t]*\)/);if(U){var R=U[1];Z+=U[0].length;if(R&&R[0]=="<"&&R[R.length-1]==">"){R=R.substring(1,R.length-1)}if(!U[3]){var T=1;for(var V=0;V<R.length;V++){switch(R[V]){case"(":T++;break;case")":if(--T==0){Z-=R.length-V;R=R.substring(0,V)}break}}}R=this.dialect.inline.__call__.call(this,R,/\\/)[0];aa={href:R||""};if(U[3]!==undefined){aa.title=U[3]}X=["link",aa].concat(S);return[Z,X]}U=ab.match(/^\s*\[(.*?)\]/);if(U){Z+=U[0].length;aa={ref:(U[1]||String(S)).toLowerCase(),original:Y.substr(0,Z)};X=["link_ref",aa].concat(S);return[Z,X]}if(S.length==1&&typeof S[0]=="string"){aa={ref:S[0].toLowerCase(),original:Y.substr(0,Z)};X=["link_ref",aa,S[0]];return[Z,X]}return[1,"["]},"<":function v(S){var R;if((R=S.match(/^<(?:((https?|ftp|mailto):[^>]+)|(.*?@.*?\.[a-zA-Z]+))>/))!=null){if(R[3]){return[R[0].length,["link",{href:"mailto:"+R[3]},R[3]]]}else{if(R[2]=="mailto"){return[R[0].length,["link",{href:R[1]},R[1].substr("mailto:".length)]]}else{return[R[0].length,["link",{href:R[1]},R[1]]]}}}return[1,"<"]},"`":function y(S){var R=S.match(/(`+)(([\s\S]*?)\1)/);if(R&&R[2]){return[R[1].length+R[2].length,["inlinecode",R[3]]]}else{return[1,"`"]}},"  \n":function O(R){return[3,["linebreak"]]}};function F(R,U){var T=R+"_state",V=R=="strong"?"em_state":"strong_state";function S(W){this.len_after=W;this.name="close_"+U}return function(ad,ac){if(this[T][0]==U){this[T].shift();return[ad.length,new S(ad.length-U.length)]}else{var W=this[V].slice(),ab=this[T].slice();this[T].unshift(U);var Y=this.processInline(ad.substr(U.length));var Z=Y[Y.length-1];var X=this[T].shift();if(Z instanceof S){Y.pop();var aa=ad.length-Z.len_after;return[aa,[R].concat(Y)]}else{this[V]=W;this[T]=ab;return[U.length,U]}}}}e.dialects.Gruber.inline["**"]=F("strong","**");e.dialects.Gruber.inline.__=F("strong","__");e.dialects.Gruber.inline["*"]=F("em","*");e.dialects.Gruber.inline._=F("em","_");e.buildBlockOrder=function(T){var R=[];for(var S in T){if(S=="__order__"||S=="__call__"){continue}R.push(S)}T.__order__=R};e.buildInlinePatterns=function(V){var U=[];for(var S in V){if(S.match(/^__.*__$/)){continue}var R=S.replace(/([\\.*+?|()\[\]{}])/g,"\\$1").replace(/\n/,"\\n");U.push(S.length==1?R:"(?:"+R+")")}U=U.join("|");V.__patterns__=U;var T=V.__call__;V.__call__=function(X,W){if(W!=undefined){return T.call(this,X,W)}else{return T.call(this,X,U)}}};e.DialectHelpers={};e.DialectHelpers.inline_until_char=function(V,U){var T=0,R=[];while(true){if(V[T]==U){T++;return[T,R]}if(T>=V.length){return null}var S=this.dialect.inline.__oneElement__.call(this,V.substr(T));T+=S[0];R.push.apply(R,S.slice(1))}};e.subclassDialect=function(T){function R(){}R.prototype=T.block;function S(){}S.prototype=T.inline;return{block:new R(),inline:new S()}};e.buildBlockOrder(e.dialects.Gruber.block);e.buildInlinePatterns(e.dialects.Gruber.inline);e.dialects.Maruku=e.subclassDialect(e.dialects.Gruber);e.dialects.Maruku.processMetaHash=function k(U){var V=o(U),R={};for(var S=0;S<V.length;++S){if(/^#/.test(V[S])){R.id=V[S].substring(1)}else{if(/^\./.test(V[S])){if(R["class"]){R["class"]=R["class"]+V[S].replace(/./," ")}else{R["class"]=V[S].substring(1)}}else{if(/\=/.test(V[S])){var T=V[S].split(/\=/);R[T[0]]=T[1]}}}}return R};function o(T){var V=T.split(""),U=[""],R=false;while(V.length){var S=V.shift();switch(S){case" ":if(R){U[U.length-1]+=S}else{U.push("")}break;case"'":case'"':R=!R;break;case"\\":S=V.shift();default:U[U.length-1]+=S;break}}return U}e.dialects.Maruku.block.document_meta=function j(W,T){if(W.lineNumber>1){return undefined}if(!W.match(/^(?:\w+:.*\n)*\w+:.*$/)){return undefined}if(!C(this.tree)){this.tree.splice(1,0,{})}var V=W.split(/\n/);for(p in V){var R=V[p].match(/(\w+):\s*(.*)$/),S=R[1].toLowerCase(),U=R[2];this.tree[1][S]=U}return[]};e.dialects.Maruku.block.block_meta=function E(Y,V){var U=Y.match(/(^|\n) {0,3}\{:\s*((?:\\\}|[^\}])*)\s*\}$/);if(!U){return undefined}var T=this.dialect.processMetaHash(U[2]);var X;if(U[1]===""){var W=this.tree[this.tree.length-1];X=C(W);if(typeof W==="string"){return undefined}if(!X){X={};W.splice(1,0,X)}for(a in T){X[a]=T[a]}return[]}var S=Y.replace(/\n.*$/,""),R=this.processBlock(S,[]);X=C(R[0]);if(!X){X={};R[0].splice(1,0,X)}for(a in T){X[a]=T[a]}return R};e.dialects.Maruku.block.definition_list=function N(T,W){var Y=/^((?:[^\s:].*\n)+):\s+([\s\S]+)$/,X=["dl"],V;if((S=T.match(Y))){var R=[T];while(W.length&&Y.exec(W[0])){R.push(W.shift())}for(var Z=0;Z<R.length;++Z){var S=R[Z].match(Y),U=S[1].replace(/\n$/,"").split(/\n/),aa=S[2].split(/\n:\s+/);for(V=0;V<U.length;++V){X.push(["dt",U[V]])}for(V=0;V<aa.length;++V){X.push(["dd"].concat(this.processInline(aa[V].replace(/(\n)\s+/,"$1"))))}}}else{return undefined}return[X]};e.dialects.Maruku.inline["{:"]=function B(Y,W,U){if(!U.length){return[2,"{:"]}var V=U[U.length-1];if(typeof V==="string"){return[2,"{:"]}var S=Y.match(/^\{:\s*((?:\\\}|[^\}])*)\s*\}/);if(!S){return[2,"{:"]}var X=this.dialect.processMetaHash(S[1]),R=C(V);if(!R){R={};V.splice(1,0,R)}for(var T in X){R[T]=X[T]}return[S[0].length,""]};e.buildBlockOrder(e.dialects.Maruku.block);e.buildInlinePatterns(e.dialects.Maruku.inline);var A=Array.isArray||function(R){return Object.prototype.toString.call(R)=="[object Array]"};var c;if(Array.prototype.forEach){c=function(S,R,T){return S.forEach(R,T)}}else{c=function(S,R,U){for(var T=0;T<S.length;T++){R.call(U||S,S[T],T,S)}}}function C(R){return A(R)&&R.length>1&&typeof R[1]==="object"&&!(A(R[1]))?R[1]:undefined}K.renderJsonML=function(T,R){R=R||{};R.root=R.root||false;var S=[];if(R.root){S.push(Q(T))}else{T.shift();if(T.length&&typeof T[0]==="object"&&!(T[0] instanceof Array)){T.shift()}while(T.length){S.push(Q(T.shift()))}}return S.join("\n\n")};function b(R){return R.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function Q(W){if(typeof W==="string"){return b(W)}var R=W.shift(),T={},U=[];if(W.length&&typeof W[0]==="object"&&!(W[0] instanceof Array)){T=W.shift()}while(W.length){U.push(arguments.callee(W.shift()))}var V="";for(var S in T){V+=" "+S+'="'+b(T[S])+'"'}if(R=="img"||R=="br"||R=="hr"){return"<"+R+V+"/>"}else{return"<"+R+V+">"+U.join("")+"</"+R+">"}}function i(Z,W,Y){var T;Y=Y||{};var V=Z.slice(0);if(typeof Y.preprocessTreeNode==="function"){V=Y.preprocessTreeNode(V,W)}var X=C(V);if(X){V[1]={};for(T in X){V[1][T]=X[T]}X=V[1]}if(typeof V==="string"){return V}switch(V[0]){case"header":V[0]="h"+V[1].level;delete V[1].level;break;case"bulletlist":V[0]="ul";break;case"numberlist":V[0]="ol";break;case"listitem":V[0]="li";break;case"para":V[0]="p";break;case"markdown":V[0]="html";if(X){delete X.references}break;case"code_block":V[0]="pre";T=X?2:1;var R=["code"];R.push.apply(R,V.splice(T));V[T]=R;break;case"inlinecode":V[0]="code";break;case"img":V[1].src=V[1].href;delete V[1].href;break;case"linebreak":V[0]="br";break;case"link":V[0]="a";break;case"link_ref":V[0]="a";var S=W[X.ref];if(S){delete X.ref;X.href=S.href;if(S.title){X.title=S.title}delete X.original}else{return X.original}break;case"img_ref":V[0]="img";var S=W[X.ref];if(S){delete X.ref;X.src=S.href;if(S.title){X.title=S.title}delete X.original}else{return X.original}break}T=1;if(X){for(var U in V[1]){T=2}if(T===1){V.splice(T,1)}}for(;T<V.length;++T){V[T]=arguments.callee(V[T],W,Y)}return V}function q(S){var R=C(S)?2:1;while(R<S.length){if(typeof S[R]==="string"){if(R+1<S.length&&typeof S[R+1]==="string"){S[R]+=S.splice(R+1,1)[0]}else{++R}}else{arguments.callee(S[R]);++R}}}})((function(){if(typeof exports==="undefined"){window.markdown={};return window.markdown}else{return exports}})());var toMarkdown=function(m){var k=[{patterns:"p",replacement:function(j,i,r){return r?"\n\n"+r+"\n":""}},{patterns:"br",type:"void",replacement:"\n"},{patterns:"h([1-6])",replacement:function(u,j,s,v){var r="";for(var t=0;t<j;t++){r+="#"}return"\n\n"+r+" "+v+"\n"}},{patterns:"hr",type:"void",replacement:"\n\n* * *\n"},{patterns:"a",replacement:function(s,j,t){var i=j.match(o("href")),r=j.match(o("title"));return i?"["+t+"]("+i[1]+(r&&r[1]?' "'+r[1]+'"':"")+")":s}},{patterns:["b","strong"],replacement:function(j,i,r){return r?"**"+r+"**":""}},{patterns:["i","em"],replacement:function(j,i,r){return r?"_"+r+"_":""}},{patterns:"code",replacement:function(j,i,r){return r?"`"+r+"`":""}},{patterns:"img",type:"void",replacement:function(t,i,u){var s=i.match(o("src")),j=i.match(o("alt")),r=i.match(o("title"));return"!["+(j&&j[1]?j[1]:"")+"]("+s[1]+(r&&r[1]?' "'+r[1]+'"':"")+")"}}];for(var l=0,n=k.length;l<n;l++){if(typeof k[l].patterns==="string"){m=f(m,{tag:k[l].patterns,replacement:k[l].replacement,type:k[l].type})}else{for(var g=0,h=k[l].patterns.length;g<h;g++){m=f(m,{tag:k[l].patterns[g],replacement:k[l].replacement,type:k[l].type})}}}function f(j,s){var t=s.type==="void"?"<"+s.tag+"\\b([^>]*)\\/?>":"<"+s.tag+"\\b([^>]*)>([\\s\\S]*?)<\\/"+s.tag+">",r=new RegExp(t,"gi"),i="";if(typeof s.replacement==="string"){i=j.replace(r,s.replacement)}else{i=j.replace(r,function(x,w,v,u){return s.replacement.call(this,x,w,v,u)})}return i}function o(i){return new RegExp(i+"\\s*=\\s*[\"']?([^\"']*)[\"']?","i")}m=m.replace(/<pre\b[^>]*>`([\s\S]*)`<\/pre>/gi,function(i,j){j=j.replace(/^\t+/g,"  ");j=j.replace(/\n/g,"\n    ");return"\n\n    "+j+"\n"});m=m.replace(/^(\s{0,3}\d+)\. /g,"$1\\. ");var q=/<(ul|ol)\b[^>]*>(?:(?!<ul|<ol)[\s\S])*?<\/\1>/gi;while(m.match(q)){m=m.replace(q,function(i){return d(i)})}function d(i){i=i.replace(/<(ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi,function(t,r,u){var j=u.split("</li>");j.splice(j.length-1,1);for(l=0,n=j.length;l<n;l++){if(j[l]){var s=(r==="ol")?(l+1)+".  ":"*   ";j[l]=j[l].replace(/\s*<li[^>]*>([\s\S]*)/i,function(v,w){w=w.replace(/^\s+/,"");w=w.replace(/\n\n/g,"\n\n    ");w=w.replace(/\n([ ]*)+(\*|\d+\.) /g,"\n$1    $2 ");return s+w})}}return j.join("\n")});return"\n\n"+i.replace(/[ \t]+\n|\s+$/g,"")}var c=/<blockquote\b[^>]*>((?:(?!<blockquote)[\s\S])*?)<\/blockquote>/gi;while(m.match(c)){m=m.replace(c,function(i){return b(i)})}function b(i){i=i.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi,function(r,j){j=j.replace(/^\s+|\s+$/g,"");j=e(j);j=j.replace(/^/gm,"> ");j=j.replace(/^(>([ \t]{2,}>)+)/gm,"> >");return j});return i}function e(i){i=i.replace(/^[\t\r\n]+|[\t\r\n]+$/g,"");i=i.replace(/\n\s+\n/g,"\n\n");i=i.replace(/\n{3,}/g,"\n\n");return i}return e(m)};if(typeof exports==="object"){exports.toMarkdown=toMarkdown}!function(f){var d=function(h,g){this.$ns="bootstrap-markdown";this.$element=f(h);this.$editable={el:null,type:null,attrKeys:[],attrValues:[],content:null};this.$options=f.extend(true,{},f.fn.markdown.defaults,g);this.$oldContent=null;this.$isPreview=false;this.$editor=null;this.$textarea=null;this.$handler=[];this.$callback=[];this.$nextTab=[];this.showEditor()};d.prototype={constructor:d,__alterButtons:function(i,h){var j=this.$handler,g=(i=="all"),k=this;f.each(j,function(m,l){var n=true;if(g){n=false}else{n=l.indexOf(i)<0}if(n==false){h(k.$editor.find('button[data-handler="'+l+'"]'))}})},__buildButtons:function(k,h){var m,v=this.$ns,A=this.$handler,w=this.$callback;for(m=0;m<k.length;m++){var u,s=k[m];for(u=0;u<s.length;u++){var r,q=s[u].data,t=f("<div/>",{"class":"btn-group"});for(r=0;r<q.length;r++){var n=q[r],l="",x=v+"-"+n.name,o=n.btnText?n.btnText:"",g=n.btnClass?n.btnClass:"btn",j=n.tabIndex?n.tabIndex:"-1";if(n.toggle==true){l=' data-toggle="button"'}t.append('<button class="'+g+' btn-small" title="'+n.title+'" tabindex="'+j+'" data-provider="'+v+'" data-handler="'+x+'"'+l+'><i class="'+n.icon+'"></i> '+o+"</button>");A.push(x);w.push(n.callback)}h.append(t)}}return h},__setListener:function(){var h=typeof this.$textarea.attr("rows")!="undefined",g=this.$textarea.val().split("\n").length>5?this.$textarea.val().split("\n").length:"5",i=h?this.$textarea.attr("rows"):g;this.$textarea.attr("rows",i);this.$textarea.css("resize","none");this.$textarea.on("focus",f.proxy(this.focus,this)).on("keypress",f.proxy(this.keypress,this)).on("keyup",f.proxy(this.keyup,this));if(this.eventSupported("keydown")){this.$textarea.on("keydown",f.proxy(this.keydown,this))}this.$textarea.data("markdown",this)},__handle:function(k){var j=f(k.currentTarget),i=this.$handler,m=this.$callback,h=j.attr("data-handler"),l=i.indexOf(h),g=m[l];f(k.currentTarget).focus();g(this);if(h.indexOf("cmdSave")<0){this.$textarea.focus()}k.preventDefault()},showEditor:function(){var t=this,s,q=this.$ns,g=this.$element,r=g.css("height"),i=g.css("width"),k=this.$editable,v=this.$handler,u=this.$callback,w=this.$options,m=f("<div/>",{"class":"md-editor",click:function(){t.focus()}});if(this.$editor==null){var h=f("<div/>",{"class":"md-header"});if(w.buttons.length>0){h=this.__buildButtons(w.buttons,h)}if(w.additionalButtons.length>0){h=this.__buildButtons(w.additionalButtons,h)}m.append(h);if(g.is("textarea")){g.before(m);s=g;s.addClass("md-input");m.append(s)}else{var n=(typeof toMarkdown=="function")?toMarkdown(g.html()):g.html(),o=f.trim(n);s=f("<textarea/>",{"class":"md-input",val:o});m.append(s);k.el=g;k.type=g.prop("tagName").toLowerCase();k.content=g.html();f(g[0].attributes).each(function(){k.attrKeys.push(this.nodeName);k.attrValues.push(this.nodeValue)});g.replaceWith(m)}if(w.savable){var l=f("<div/>",{"class":"md-footer"}),j="cmdSave";v.push(j);u.push(w.onSave);l.append('<button class="btn btn-success" data-provider="'+q+'" data-handler="'+j+'"><i class="icon icon-white icon-ok"></i> Save</button>');m.append(l)}f.each(["height","width"],function(y,x){if(w[x]!="inherit"){if(jQuery.isNumeric(w[x])){m.css(x,w[x]+"px")}else{m.addClass(w[x])}}});this.$editor=m;this.$textarea=s;this.$editable=k;this.$oldContent=this.getContent();this.__setListener();this.$editor.attr("id",(new Date).getTime());this.$editor.on("click",'[data-provider="bootstrap-markdown"]',f.proxy(this.__handle,this))}else{this.$editor.show()}if(w.autofocus){this.$textarea.focus();this.$editor.addClass("active")}w.onShow(this);return this},showPreview:function(){var i=this.$options,j=i.onPreview(this),g=this.$textarea,l=g.next(),h=f("<div/>",{"class":"md-preview","data-provider":"markdown-preview"}),k;this.$isPreview=true;this.disableButtons("all").enableButtons("cmdPreview");if(typeof j=="string"){k=j}else{k=(typeof markdown=="object")?markdown.toHTML(g.val()):g.val()}k=(k+"").replace(/\n/g,"<br>");h.html(k);if(l&&l.attr("class")=="md-footer"){h.insertBefore(l)}else{g.parent().append(h)}g.hide();h.data("markdown",this);return this},hidePreview:function(){this.$isPreview=false;var g=this.$editor.find('div[data-provider="markdown-preview"]');g.remove();this.enableButtons("all");this.$textarea.show();this.__setListener();return this},isDirty:function(){return this.$oldContent!=this.getContent()},getContent:function(){return this.$textarea.val()},setContent:function(g){this.$textarea.val(g);return this},findSelection:function(h){var k=this.getContent(),j;if(j=k.indexOf(h),j>=0&&h.length>0){var g=this.getSelection(),i;this.setSelection(j,j+h.length);i=this.getSelection();this.setSelection(g.start,g.end);return i}else{return null}},getSelection:function(){var g=this.$textarea[0];return(("selectionStart" in g&&function(){var h=g.selectionEnd-g.selectionStart;return{start:g.selectionStart,end:g.selectionEnd,length:h,text:g.value.substr(g.selectionStart,h)}})||function(){return null})()},setSelection:function(i,g){var h=this.$textarea[0];return(("selectionStart" in h&&function(){h.selectionStart=i;h.selectionEnd=g;return})||function(){return null})()},replaceSelection:function(h){var g=this.$textarea[0];return(("selectionStart" in g&&function(){g.value=g.value.substr(0,g.selectionStart)+h+g.value.substr(g.selectionEnd,g.value.length);g.selectionStart=g.value.length;return this})||function(){g.value+=h;return jQuery(g)})()},getNextTab:function(){if(this.$nextTab.length==0){return null}else{var g,h=this.$nextTab.shift();if(typeof h=="function"){g=h()}else{if(typeof h=="object"&&h.length>0){g=h}}return g}},setNextTab:function(j,h){if(typeof j=="string"){var i=this;this.$nextTab.push(function(){return i.findSelection(j)})}else{if(typeof j=="numeric"&&typeof h=="numeric"){var g=this.getSelection();this.setSelection(j,h);this.$nextTab.push(this.getSelection());this.setSelection(g.start,g.end)}}return},enableButtons:function(h){var g=function(i){i.removeAttr("disabled")};this.__alterButtons(h,g);return this},disableButtons:function(h){var g=function(i){i.attr("disabled","disabled")};this.__alterButtons(h,g);return this},eventSupported:function(g){var h=g in this.$element;if(!h){this.$element.setAttribute(g,"return;");h=typeof this.$element[g]==="function"}return h},keydown:function(g){this.suppressKeyPressRepeat=~f.inArray(g.keyCode,[40,38,9,13,27]);this.keyup(g)},keypress:function(g){if(this.suppressKeyPressRepeat){return}this.keyup(g)},keyup:function(j){var h=false;switch(j.keyCode){case 40:case 38:case 16:case 17:case 18:break;case 9:var g;if(g=this.getNextTab(),g!=null){var i=this;setTimeout(function(){i.setSelection(g.start,g.end)},500);h=true}else{var k=this.getSelection();if(k.start==k.end&&k.end==this.getContent().length){h=false}else{this.setSelection(this.getContent().length,this.getContent().length);h=true}}break;case 13:case 27:h=false;break;default:h=false}if(h){j.stopPropagation();j.preventDefault()}},focus:function(j){var g=this.$options,i=g.hideable,h=this.$editor;h.addClass("active");f(document).find(".md-editor").each(function(){if(f(this).attr("id")!=h.attr("id")){var k;if(k=f(this).find("textarea").data("markdown"),k==null){k=f(this).find('div[data-provider="markdown-preview"]').data("markdown")}if(k){k.blur()}}});return this},blur:function(n){var h=this.$options,m=h.hideable,k=this.$editor,i=this.$editable;if(k.hasClass("active")||this.$element.parent().length==0){k.removeClass("active");if(m){if(i.el!=null){var g=f("<"+i.type+"/>"),l=this.getContent(),j=(typeof markdown=="object")?markdown.toHTML(l):l;f(i.attrKeys).each(function(q,o){g.attr(i.attrKeys[q],i.attrValues[q])});g.html(j);k.replaceWith(g)}else{k.hide()}}h.onBlur(this)}return this}};var b=f.fn.markdown;f.fn.markdown=function(g){return this.each(function(){var j=f(this),i=j.data("markdown"),h=typeof g=="object"&&g;if(!i){j.data("markdown",(i=new d(this,h)))}})};f.fn.markdown.defaults={autofocus:false,hideable:false,savable:false,width:"inherit",height:"inherit",buttons:[[{name:"groupFont",data:[{name:"cmdBold",title:"Bold",icon:"icon icon-bold",callback:function(j){var g,k,h=j.getSelection(),i=j.getContent();if(h.length==0){g="strong text"}else{g=h.text}if(i.substr(h.start-2,2)=="**"&&i.substr(h.end,2)=="**"){j.setSelection(h.start-2,h.end+2);j.replaceSelection(g);k=h.start-2}else{j.replaceSelection("**"+g+"**");k=h.start+2}j.setSelection(k,k+g.length)}},{name:"cmdItalic",title:"Italic",icon:"icon icon-italic",callback:function(j){var g,k,h=j.getSelection(),i=j.getContent();if(h.length==0){g="emphasized text"}else{g=h.text}if(i.substr(h.start-1,1)=="*"&&i.substr(h.end,1)=="*"){j.setSelection(h.start-1,h.end+1);j.replaceSelection(g);k=h.start-1}else{j.replaceSelection("*"+g+"*");k=h.start+1}j.setSelection(k,k+g.length)}}]},{name:"groupLink",data:[{name:"cmdUrl",title:"URL/Link",icon:"icon icon-globe",callback:function(k){var g,l,h=k.getSelection(),j=k.getContent(),i;if(h.length==0){g="enter link description here"}else{g=h.text}i=prompt("Insert Hyperlink","http://");if(i!=null){k.replaceSelection("["+g+"]("+i+")");l=h.start+1;k.setSelection(l,l+g.length)}}}]},{name:"groupMisc",data:[{name:"cmdList",title:"List",icon:"icon icon-list",callback:function(k){var g,l,h=k.getSelection(),i=k.getContent();if(h.length==0){g="list text here";k.replaceSelection("- "+g);l=h.start+2}else{if(h.text.indexOf("\n")<0){g=h.text;k.replaceSelection("- "+g);l=h.start+2}else{var j=[];j=h.text.split("\n");g=j[0];f.each(j,function(n,m){j[n]="- "+m});k.replaceSelection("\n\n"+j.join("\n"));l=h.start+4}}k.setSelection(l,l+g.length)}}]},{name:"groupUtil",data:[{name:"cmdPreview",toggle:true,title:"Preview",btnText:"Preview",btnClass:"btn btn-inverse",icon:"icon icon-white icon-search",callback:function(i){var g=i.$isPreview,h;if(g==false){i.showPreview()}else{i.hidePreview()}}}]}]],additionalButtons:[],onShow:function(g){},onPreview:function(g){},onSave:function(g){},onBlur:function(g){}};f.fn.markdown.Constructor=d;f.fn.markdown.noConflict=function(){f.fn.markdown=b;return this};var e=function(g){var h=g;if(h.data("markdown")){h.data("markdown").showEditor();return}h.markdown(h.data())};var c=function(i){var j=false,h,g=f(i.currentTarget);if((i.type=="focusin"||i.type=="click")&&g.length==1&&typeof g[0]=="object"){h=g[0].activeElement;if(!f(h).data("markdown")){if(typeof f(h).parent().parent().parent().attr("class")=="undefined"||f(h).parent().parent().parent().attr("class").indexOf("md-editor")<0){if(typeof f(h).parent().parent().attr("class")=="undefined"||f(h).parent().parent().attr("class").indexOf("md-editor")<0){j=true}}else{j=false}}if(j){f(document).find(".md-editor").each(function(){var l=f(h).parent();if(f(this).attr("id")!=l.attr("id")){var k;if(k=f(this).find("textarea").data("markdown"),k==null){k=f(this).find('div[data-provider="markdown-preview"]').data("markdown")}if(k){k.blur()}}})}i.stopPropagation()}};f(document).on("click.markdown.data-api",'[data-provide="markdown-editable"]',function(g){e(f(this));g.preventDefault()}).on("click",function(g){c(g)}).on("focusin",function(g){c(g)}).ready(function(){f('textarea[data-provide="markdown"]').each(function(){e(f(this))})})}(window.jQuery);
/*bootstrap-datepicker/bootstrap-datepicker.js*/
!function(c){var a=function(e,d){this.element=c(e);this.format=b.parseFormat(d.format||this.element.data("date-format")||"mm/dd/yyyy");this.picker=c(b.template).appendTo("body").on({click:c.proxy(this.click,this)});this.isInput=this.element.is("input");this.component=this.element.is(".date")?this.element.find(".add-on"):false;if(this.isInput){this.element.on({focus:c.proxy(this.show,this),keyup:c.proxy(this.update,this)})}else{if(this.component){this.component.on("click",c.proxy(this.show,this))}else{this.element.on("click",c.proxy(this.show,this))}}this.minViewMode=d.minViewMode||this.element.data("date-minviewmode")||0;if(typeof this.minViewMode==="string"){switch(this.minViewMode){case"months":this.minViewMode=1;break;case"years":this.minViewMode=2;break;default:this.minViewMode=0;break}}this.viewMode=d.viewMode||this.element.data("date-viewmode")||0;if(typeof this.viewMode==="string"){switch(this.viewMode){case"months":this.viewMode=1;break;case"years":this.viewMode=2;break;default:this.viewMode=0;break}}this.startViewMode=this.viewMode;this.weekStart=d.weekStart||this.element.data("date-weekstart")||0;this.weekEnd=this.weekStart===0?6:this.weekStart-1;this.onRender=d.onRender;this.fillDow();this.fillMonths();this.update();this.showMode()};a.prototype={constructor:a,show:function(f){this.picker.show();this.height=this.component?this.component.outerHeight():this.element.outerHeight();this.place();c(window).on("resize",c.proxy(this.place,this));if(f){f.stopPropagation();f.preventDefault()}if(!this.isInput){}var d=this;c(document).on("mousedown",function(e){if(c(e.target).closest(".datepicker").length==0){d.hide()}});this.element.trigger({type:"show",date:this.date})},hide:function(){this.picker.hide();c(window).off("resize",this.place);this.viewMode=this.startViewMode;this.showMode();if(!this.isInput){c(document).off("mousedown",this.hide)}this.element.trigger({type:"hide",date:this.date})},set:function(){var d=b.formatDate(this.date,this.format);if(!this.isInput){if(this.component){this.element.find("input").prop("value",d)}this.element.data("date",d)}else{this.element.prop("value",d)}},setValue:function(d){if(typeof d==="string"){this.date=b.parseDate(d,this.format)}else{this.date=new Date(d)}this.set();this.viewDate=new Date(this.date.getFullYear(),this.date.getMonth(),1,0,0,0,0);this.fill()},place:function(){var d=this.component?this.component.offset():this.element.offset();this.picker.css({top:d.top+this.height,left:d.left})},update:function(d){this.date=b.parseDate(typeof d==="string"?d:(this.isInput?this.element.prop("value"):this.element.data("date")),this.format);this.viewDate=new Date(this.date.getFullYear(),this.date.getMonth(),1,0,0,0,0);this.fill()},fillDow:function(){var d=this.weekStart;var e="<tr>";while(d<this.weekStart+7){e+='<th class="dow">'+b.dates.daysMin[(d++)%7]+"</th>"}e+="</tr>";this.picker.find(".datepicker-days thead").append(e)},fillMonths:function(){var e="";var d=0;while(d<12){e+='<span class="month">'+b.dates.monthsShort[d++]+"</span>"}this.picker.find(".datepicker-months td").append(e)},fill:function(){var r=new Date(this.viewDate),s=r.getFullYear(),q=r.getMonth(),g=this.date.valueOf();this.picker.find(".datepicker-days th:eq(1)").text(b.dates.months[q]+" "+s);var k=new Date(s,q-1,28,0,0,0,0),t=b.getDaysInMonth(k.getFullYear(),k.getMonth());k.setDate(t);k.setDate(t-(k.getDay()-this.weekStart+7)%7);var n=new Date(k);n.setDate(n.getDate()+42);n=n.valueOf();var m=[];var j,p,e;while(k.valueOf()<n){if(k.getDay()===this.weekStart){m.push("<tr>")}j=this.onRender(k);p=k.getFullYear();e=k.getMonth();if((e<q&&p===s)||p<s){j+=" old"}else{if((e>q&&p===s)||p>s){j+=" new"}}if(k.valueOf()===g){j+=" active"}m.push('<td class="day '+j+'">'+k.getDate()+"</td>");if(k.getDay()===this.weekEnd){m.push("</tr>")}k.setDate(k.getDate()+1)}this.picker.find(".datepicker-days tbody").empty().append(m.join(""));var o=this.date.getFullYear();var f=this.picker.find(".datepicker-months").find("th:eq(1)").text(s).end().find("span").removeClass("active");if(o===s){f.eq(this.date.getMonth()).addClass("active")}m="";s=parseInt(s/10,10)*10;var h=this.picker.find(".datepicker-years").find("th:eq(1)").text(s+"-"+(s+9)).end().find("td");s-=1;for(var l=-1;l<11;l++){m+='<span class="year'+(l===-1||l===10?" old":"")+(o===s?" active":"")+'">'+s+"</span>";s+=1}h.html(m)},click:function(i){i.stopPropagation();i.preventDefault();var h=c(i.target).closest("span, td, th");if(h.length===1){switch(h[0].nodeName.toLowerCase()){case"th":switch(h[0].className){case"switch":this.showMode(1);break;case"prev":case"next":this.viewDate["set"+b.modes[this.viewMode].navFnc].call(this.viewDate,this.viewDate["get"+b.modes[this.viewMode].navFnc].call(this.viewDate)+b.modes[this.viewMode].navStep*(h[0].className==="prev"?-1:1));this.fill();this.set();break}break;case"span":if(h.is(".month")){var g=h.parent().find("span").index(h);this.viewDate.setMonth(g)}else{var f=parseInt(h.text(),10)||0;this.viewDate.setFullYear(f)}if(this.viewMode!==0){this.date=new Date(this.viewDate);this.element.trigger({type:"changeDate",date:this.date,viewMode:b.modes[this.viewMode].clsName})}this.showMode(-1);this.fill();this.set();break;case"td":if(h.is(".day")&&!h.is(".disabled")){var d=parseInt(h.text(),10)||1;var g=this.viewDate.getMonth();if(h.is(".old")){g-=1}else{if(h.is(".new")){g+=1}}var f=this.viewDate.getFullYear();this.date=new Date(f,g,d,0,0,0,0);this.viewDate=new Date(f,g,Math.min(28,d),0,0,0,0);this.fill();this.set();this.element.trigger({type:"changeDate",date:this.date,viewMode:b.modes[this.viewMode].clsName})}break}}},mousedown:function(d){d.stopPropagation();d.preventDefault()},showMode:function(d){if(d){this.viewMode=Math.max(this.minViewMode,Math.min(2,this.viewMode+d))}this.picker.find(">div").hide().filter(".datepicker-"+b.modes[this.viewMode].clsName).show()}};c.fn.datepicker=function(d,e){return this.each(function(){var h=c(this),g=h.data("datepicker"),f=typeof d==="object"&&d;if(!g){h.data("datepicker",(g=new a(this,c.extend({},c.fn.datepicker.defaults,f))))}if(typeof d==="string"){g[d](e)}})};c.fn.datepicker.defaults={onRender:function(d){return""}};c.fn.datepicker.Constructor=a;var b={modes:[{clsName:"days",navFnc:"Month",navStep:1},{clsName:"months",navFnc:"FullYear",navStep:1},{clsName:"years",navFnc:"FullYear",navStep:10}],dates:{days:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],daysShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sun"],daysMin:["Su","Mo","Tu","We","Th","Fr","Sa","Su"],months:["January","February","March","April","May","June","July","August","September","October","November","December"],monthsShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]},isLeapYear:function(d){return(((d%4===0)&&(d%100!==0))||(d%400===0))},getDaysInMonth:function(d,e){return[31,(b.isLeapYear(d)?29:28),31,30,31,30,31,31,30,31,30,31][e]},parseFormat:function(f){var e=f.match(/[.\/\-\s].*?/),d=f.split(/\W+/);if(!e||!d||d.length===0){throw new Error("Invalid date format.")}return{separator:e,parts:d}},parseDate:function(f,m){var g=f.split(m.separator),f=new Date(),e;f.setHours(0);f.setMinutes(0);f.setSeconds(0);f.setMilliseconds(0);if(g.length===m.parts.length){var k=f.getFullYear(),l=f.getDate(),j=f.getMonth();for(var h=0,d=m.parts.length;h<d;h++){e=parseInt(g[h],10)||1;switch(m.parts[h]){case"dd":case"d":l=e;f.setDate(e);break;case"mm":case"m":j=e-1;f.setMonth(e-1);break;case"yy":k=2000+e;f.setFullYear(2000+e);break;case"yyyy":k=e;f.setFullYear(e);break}}f=new Date(k,j,l,0,0,0)}return f},formatDate:function(d,g){var h={d:d.getDate(),m:d.getMonth()+1,yy:d.getFullYear().toString().substring(2),yyyy:d.getFullYear()};h.dd=(h.d<10?"0":"")+h.d;h.mm=(h.m<10?"0":"")+h.m;var d=[];for(var f=0,e=g.parts.length;f<e;f++){d.push(h[g.parts[f]])}return d.join(g.separator)},headTemplate:'<thead><tr><th class="prev">&lsaquo;</th><th colspan="5" class="switch"></th><th class="next">&rsaquo;</th></tr></thead>',contTemplate:'<tbody><tr><td colspan="7"></td></tr></tbody>'};b.template='<div class="datepicker dropdown-menu"><div class="datepicker-days"><table class=" table-condensed">'+b.headTemplate+'<tbody></tbody></table></div><div class="datepicker-months"><table class="table-condensed">'+b.headTemplate+b.contTemplate+'</table></div><div class="datepicker-years"><table class="table-condensed">'+b.headTemplate+b.contTemplate+"</table></div></div>"}(window.jQuery);
/*bootstrap-confirm/bootstrap-confirm.js*/
(function(a){a.fn.extend({confirmModal:function(b){var d='<div class="modal" id="confirmContainer"><div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>#Heading#</h3></div><div class="modal-body">#Body#</div><div class="modal-footer">';var e={heading:gt.gettext("Please confirm"),body:gt.gettext("Body contents"),noConfirm:false,callback:null};var b=a.extend(e,b);d=d.replace("#Heading#",b.heading).replace("#Body#",b.body);if(!b.noConfirm){d+='<button href="#" class="btn btn-primary" id="confirmYesBtn">'+gt.gettext("Confirm")+"</button>"}d+='<a href="#" class="btn" data-dismiss="modal">'+gt.gettext("Close")+"</a></div></div>";a(this).html(d);a(this).modal("show");var c=a(this);a("#confirmYesBtn",this).click(function(){if(b.callback!=null){b.callback()}a(c).modal("hide")})}})})(jQuery);
/*bazu.datepicker.js*/
(function(a){var b={setFormat:function(e){var d=e.match(/[.\/\-\s].*?/),c=e.split(/\W+/);this.format={separator:d,parts:c}}};a.extend(a.fn.datepicker.Constructor.prototype,b)})(window.jQuery);
/*jquery.infieldlabel.js*/
(function(a){a.InFieldLabels=function(c,e,b){var d=this;d.$label=a(c);d.$field=a(e);d.$label.data("InFieldLabels",d);d.showing=true;d.init=function(){d.options=a.extend({},a.InFieldLabels.defaultOptions,b);d.$label.css("position","absolute");d.$label.css("opacity",d.options.normalOpacity);var f=d.$field.position();var g=9;var h=3;d.$label.css({left:f.left+h,top:f.top+g}).addClass(d.options.labelClass);if(d.$field.val()!=""){d.$label.hide();d.showing=false}d.$field.focus(function(){d.fadeOnFocus()}).blur(function(){d.checkForEmpty(true)}).bind("keydown.infieldlabel",function(i){d.hideOnChange(i)}).change(function(i){d.checkForEmpty()}).bind("onPropertyChange",function(){d.checkForEmpty()})};d.fadeOnFocus=function(){if(d.showing){d.setOpacity(d.options.fadeOpacity)}};d.setOpacity=function(f){d.$label.stop().animate({opacity:f},d.options.fadeDuration);d.showing=(f>0)};d.checkForEmpty=function(f){if(d.$field.val()==""){d.prepForShow();d.setOpacity(f?d.options.normalOpacity:d.options.fadeOpacity)}else{d.setOpacity(0)}};d.prepForShow=function(f){if(!d.showing){d.$label.css({opacity:0}).show();d.$field.bind("keydown.infieldlabel",function(g){d.hideOnChange(g)})}};d.hideOnChange=function(f){if((f.keyCode==16)||(f.keyCode==9)){return}if(d.showing){d.$label.hide();d.showing=false}d.$field.unbind("keydown.infieldlabel")};d.init()};a.InFieldLabels.defaultOptions={normalOpacity:0.5,fadeOpacity:0.2,fadeDuration:300,labelClass:"infield"};a.fn.inFieldLabels=function(b){return this.each(function(){var d=a(this).attr("for");if(!d){return}var c=a("input#"+d+"[type='text'],input#"+d+"[type='password'],textarea#"+d);if(c.length==0){return}(new a.InFieldLabels(this,c[0],b))})}})(jQuery);
/*jquery.tokeninput.js*/
(function(e){var c={method:"GET",contentType:"json",queryParam:"q",searchDelay:300,minChars:1,propertyToSearch:"name",jsonContainer:null,hintText:"Type in a search term",noResultsText:"No results",searchingText:"Searching...",deleteText:"&times;",animateDropdown:true,tokenLimit:null,tokenDelimiter:",",preventDuplicates:false,tokenValue:"id",prePopulate:null,processPrePopulate:false,idPrefix:"token-input-",resultsFormatter:function(g){return"<li>"+g[this.propertyToSearch]+"</li>"},tokenFormatter:function(g){return"<li><p>"+g[this.propertyToSearch]+"</p></li>"},onResult:null,onAdd:null,onDelete:null,onReady:null};var f={tokenList:"token-input-list",token:"token-input-token",tokenDelete:"token-input-delete-token",selectedToken:"token-input-selected-token",highlightedToken:"token-input-highlighted-token",dropdown:"token-input-dropdown",dropdownItem:"token-input-dropdown-item",dropdownItem2:"token-input-dropdown-item2",selectedDropdownItem:"token-input-selected-dropdown-item",inputToken:"token-input-input-token"};var d={BEFORE:0,AFTER:1,END:2};var a={BACKSPACE:8,TAB:9,ENTER:13,ESCAPE:27,SPACE:32,PAGE_UP:33,PAGE_DOWN:34,END:35,HOME:36,LEFT:37,UP:38,RIGHT:39,DOWN:40,NUMPAD_ENTER:108,COMMA:188};var b={init:function(g,h){var i=e.extend({},c,h||{});return this.each(function(){e(this).data("tokenInputObject",new e.TokenList(this,g,i))})},clear:function(){this.data("tokenInputObject").clear();return this},add:function(g){this.data("tokenInputObject").add(g);return this},remove:function(g){this.data("tokenInputObject").remove(g);return this},flush:function(){this.data("tokenInputObject").flushCache();return this},get:function(){return this.data("tokenInputObject").getTokens()}};e.fn.tokenInput=function(g){if(b[g]){return b[g].apply(this,Array.prototype.slice.call(arguments,1))}else{return b.init.apply(this,arguments)}};e.TokenList=function(i,s,Q){if(e.type(s)==="string"||e.type(s)==="function"){Q.url=s;var m=x();if(Q.crossDomain===undefined){if(m.indexOf("://")===-1){Q.crossDomain=false}else{Q.crossDomain=(location.href.split(/\/+/g)[1]!==m.split(/\/+/g)[1])}}}else{if(typeof(s)==="object"){Q.local_data=s}}if(Q.classes){Q.classes=e.extend({},f,Q.classes)}else{if(Q.theme){Q.classes={};e.each(f,function(V,W){Q.classes[V]=W+"-"+Q.theme})}else{Q.classes=f}}var E=[];var v=0;var r=new e.TokenList.Cache();var O;var L;var z=e('<input type="text"  autocomplete="off">').css({outline:"none"}).attr("id",Q.idPrefix+i.id).blur(function(){F();e(this).val("")}).bind("keyup keydown blur update",g).keydown(function(W){var Y;var V;switch(W.keyCode){case a.LEFT:case a.RIGHT:case a.UP:case a.DOWN:if(!e(this).val()){Y=n.prev();V=n.next();if((Y.length&&Y.get(0)===C)||(V.length&&V.get(0)===C)){if(W.keyCode===a.LEFT||W.keyCode===a.UP){I(e(C),d.BEFORE)}else{I(e(C),d.AFTER)}}else{if((W.keyCode===a.LEFT||W.keyCode===a.UP)&&Y.length){R(e(Y.get(0)))}else{if((W.keyCode===a.RIGHT||W.keyCode===a.DOWN)&&V.length){R(e(V.get(0)))}}}}else{var X=null;if(W.keyCode===a.DOWN||W.keyCode===a.RIGHT){X=e(N).next()}else{X=e(N).prev()}if(X.length){U(X)}return false}break;case a.BACKSPACE:Y=n.prev();if(!e(this).val().length){if(C){k(e(C));D.change()}else{if(Y.length){R(e(Y.get(0)))}}return false}else{if(e(this).val().length===1){F()}else{setTimeout(function(){B()},5)}}break;case a.TAB:case a.ENTER:case a.NUMPAD_ENTER:case a.COMMA:if(N){K(e(N).data("tokeninput"));D.change();return false}break;case a.ESCAPE:F();return true;default:if(String.fromCharCode(W.which)){setTimeout(function(){B()},5)}break}});var D=e(i).hide().val("").focus(function(){z.trigger("click")}).blur(function(){z.blur()});var C=null;var G=0;var N=null;var p=e("<ul />").addClass(Q.classes.tokenList).click(function(W){var V=e(W.target).closest("li");if(V&&V.get(0)&&e.data(V.get(0),"tokeninput")){T(V)}else{if(C){I(e(C),d.END)}z.focus()}}).mouseover(function(W){var V=e(W.target).closest("li");if(V&&C!==this){V.addClass(Q.classes.highlightedToken)}}).mouseout(function(W){var V=e(W.target).closest("li");if(V&&C!==this){V.removeClass(Q.classes.highlightedToken)}}).insertBefore(D);var n=e("<li />").click(function(){if((Q.tokenLimit===null||Q.tokenLimit!==v)&&z.val()==""){l()}}).addClass(Q.classes.inputToken).appendTo(p).append(z);var S=e("<div>").addClass(Q.classes.dropdown).appendTo("body").hide();var J=e("<tester/>").insertAfter(z).css({position:"absolute",top:-9999,left:-9999,width:"auto",fontSize:z.css("fontSize"),fontFamily:z.css("fontFamily"),fontWeight:z.css("fontWeight"),letterSpacing:z.css("letterSpacing"),whiteSpace:"nowrap"});D.val("");var y=Q.prePopulate||D.data("pre");if(Q.processPrePopulate&&e.isFunction(Q.onResult)){y=Q.onResult.call(D,y)}if(y&&y.length){e.each(y,function(V,W){j(W);H()})}if(e.isFunction(Q.onReady)){Q.onReady.call()}this.clear=function(){p.children("li").each(function(){if(e(this).children("input").length===0){k(e(this))}})};this.add=function(V){K(V)};this.remove=function(V){p.children("li").each(function(){if(e(this).children("input").length===0){var Y=e(this).data("tokeninput");var W=true;for(var X in V){if(V[X]!==Y[X]){W=false;break}}if(W){k(e(this))}}})};this.getTokens=function(){return E};this.flushCache=function(){this.clear();r.flush()};function H(){if(Q.tokenLimit!==null&&v>=Q.tokenLimit){z.hide();F();return}}function g(){if(L===(L=z.val())){return}var V=L.replace(/&/g,"&amp;").replace(/\s/g," ").replace(/</g,"&lt;").replace(/>/g,"&gt;");J.html(V);z.width(J.width()+30)}function P(V){return((V>=48&&V<=90)||(V>=96&&V<=111)||(V>=186&&V<=192)||(V>=219&&V<=222))}function j(V){var X=Q.tokenFormatter(V);X=e(X).addClass(Q.classes.token).insertBefore(n);e("<span>"+Q.deleteText+"</span>").addClass(Q.classes.tokenDelete).appendTo(X).click(function(){k(e(this).parent());D.change();return false});var W={id:V.id};W[Q.propertyToSearch]=V[Q.propertyToSearch];e.data(X.get(0),"tokeninput",V);E=E.slice(0,G).concat([W]).concat(E.slice(G));G++;w(E,D);v+=1;if(Q.tokenLimit!==null&&v>=Q.tokenLimit){z.hide();F()}return X}function K(V){var X=Q.onAdd;if(v>0&&Q.preventDuplicates){var W=null;p.children().each(function(){var Z=e(this);var Y=e.data(Z.get(0),"tokeninput");if(Y&&Y.id===V.id){W=Z;return false}});if(W){R(W);n.insertAfter(W);z.focus();return}}if(Q.tokenLimit==null||v<Q.tokenLimit){j(V);H()}z.val("");F();if(e.isFunction(X)){X.call(D,V)}}function R(V){V.addClass(Q.classes.selectedToken);C=V.get(0);z.val("");F()}function I(W,V){W.removeClass(Q.classes.selectedToken);C=null;if(V===d.BEFORE){n.insertBefore(W);G--}else{if(V===d.AFTER){n.insertAfter(W);G++}else{n.appendTo(p);G=v}}z.focus()}function T(W){var V=C;if(C){I(e(C),d.END)}if(V===W.get(0)){I(W,d.END)}else{R(W)}}function k(W){var X=e.data(W.get(0),"tokeninput");var Y=Q.onDelete;var V=W.prevAll().length;if(V>G){V--}W.remove();C=null;z.focus();E=E.slice(0,V).concat(E.slice(V+1));if(V<G){G--}w(E,D);v-=1;if(Q.tokenLimit!==null){z.show().val("").focus()}if(e.isFunction(Y)){Y.call(D,X)}}function w(X,V){var W=e.map(X,function(Y){return Y[Q.tokenValue]});V.val(W.join(Q.tokenDelimiter))}function F(){S.hide().empty();N=null}function q(){S.css({position:"absolute",top:e(p).offset().top+e(p).outerHeight(),left:e(p).offset().left,zindex:999}).show()}function o(){if(Q.searchingText){S.html("<p>"+Q.searchingText+"</p>");q()}}function l(){if(Q.hintText){S.html("<p>"+Q.hintText+"</p>");q()}}function u(W,V){return W?W.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)("+V+")(?![^<>]*>)(?![^&;]+;)","gi"),"<b>$1</b>"):W}function A(W,X,V){return W.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)("+X+")(?![^<>]*>)(?![^&;]+;)","g"),u(X,V))}function M(X,V){if(V&&V.length){S.empty();var W=e("<ul>").appendTo(S).mouseover(function(Y){U(e(Y.target).closest("li"))}).mousedown(function(Y){K(e(Y.target).closest("li").data("tokeninput"));D.change();return false}).hide();e.each(V,function(Y,Z){var aa=Q.resultsFormatter(Z);aa=A(aa,Z[Q.propertyToSearch],X);aa=e(aa).appendTo(W);if(Y%2){aa.addClass(Q.classes.dropdownItem)}else{aa.addClass(Q.classes.dropdownItem2)}if(Y===0){U(aa)}e.data(aa.get(0),"tokeninput",Z)});q();if(Q.animateDropdown){W.slideDown("fast")}else{W.show()}}else{if(Q.noResultsText){S.html("<p>"+Q.noResultsText+"</p>");q()}}}function U(V){if(V){if(N){h(e(N))}V.addClass(Q.classes.selectedDropdownItem);N=V.get(0)}}function h(V){V.removeClass(Q.classes.selectedDropdownItem);N=null}function B(){var V=z.val().toLowerCase();if(V&&V.length){if(C){I(e(C),d.AFTER)}if(V.length>=Q.minChars){o();clearTimeout(O);O=setTimeout(function(){t(V)},Q.searchDelay)}else{F()}}}function t(ab){var X=ab+x();var V=r.get(X);if(V){M(ab,V)}else{if(Q.url){var Z=x();var Y={};Y.data={};if(Z.indexOf("?")>-1){var ac=Z.split("?");Y.url=ac[0];var W=ac[1].split("&");e.each(W,function(ad,af){var ae=af.split("=");Y.data[ae[0]]=ae[1]})}else{Y.url=Z}Y.data[Q.queryParam]=ab;Y.type=Q.method;Y.dataType=Q.contentType;if(Q.crossDomain){Y.dataType="jsonp"}Y.success=function(ad){if(e.isFunction(Q.onResult)){ad=Q.onResult.call(D,ad)}r.add(X,Q.jsonContainer?ad[Q.jsonContainer]:ad);if(z.val().toLowerCase()===ab){M(ab,Q.jsonContainer?ad[Q.jsonContainer]:ad)}};e.ajax(Y)}else{if(Q.local_data){var aa=e.grep(Q.local_data,function(ad){return ad[Q.propertyToSearch].toLowerCase().indexOf(ab.toLowerCase())>-1});if(e.isFunction(Q.onResult)){aa=Q.onResult.call(D,aa)}r.add(X,aa);M(ab,aa)}}}}function x(){var V=Q.url;if(typeof Q.url=="function"){V=Q.url.call()}return V}};e.TokenList.Cache=function(h){var j=e.extend({max_size:500},h);var k={};var i=0;var g=function(){k={};i=0};this.flush=g;this.add=function(m,l){if(i>j.max_size){g()}if(!k[m]){i+=1}k[m]=l};this.get=function(l){return k[l]}}}(jQuery));
/*jreject/jquery.reject.min.js*/
/*
    * jReject (jQuery Browser Rejection Plugin)
    * Version 0.7-Beta
    * URL: http://jreject.turnwheel.com/
    * Description: jReject gives you a customizable and easy solution to reject/allowing specific browsers access to your pages
    * Author: Steven Bower (TurnWheel Designs) http://turnwheel.com/
    * Copyright: Copyright (c) 2009-2010 Steven Bower under dual MIT/GPL license.
    * Depends On: jQuery Browser Plugin (http://jquery.thewikies.com/browser)
 */
(function(b){b.reject=function(a){a=b.extend(true,{reject:{all:false,msie5:true,msie6:true},display:[],browserInfo:{firefox:{text:"Firefox 3.5+",url:"http://www.mozilla.com/firefox/"},safari:{text:"Safari 4",url:"http://www.apple.com/safari/download/"},opera:{text:"Opera 10.5",url:"http://www.opera.com/download/"},chrome:{text:"Chrome 5",url:"http://www.google.com/chrome/"},msie:{text:"Internet Explorer 8",url:"http://www.microsoft.com/windows/Internet-explorer/"},gcf:{text:"Google Chrome Frame",
url:"http://code.google.com/chrome/chromeframe/",allow:{all:false,msie:true}}},header:"Did you know that your Internet Browser is out of date?",paragraph1:"Your browser is out of date, and may not be compatible with our website. A list of the most popular web browsers can be found below.",paragraph2:"Just click on the icons to get to the download page",close:true,closeMessage:"By closing this window you acknowledge that your experience on this website may be degraded",closeLink:"Close This Window",
closeURL:"#",closeESC:true,closeCookie:false,cookieSettings:{path:"/",expires:0},imagePath:"/images/",overlayBgColor:"#000",overlayOpacity:0.8,fadeInTime:"fast",fadeOutTime:"fast"},a);if(a.display.length<1)a.display=["firefox","chrome","msie","safari","opera","gcf"];b.isFunction(a.beforeReject)&&a.beforeReject(a);if(!a.close)a.closeESC=false;var d=function(c){return(c.all?true:false)||(c[b.os.name]?true:false)||(c[b.layout.name]?true:false)||(c[b.browser.name]?true:false)||(c[b.browser.className]?
true:false)};if(!d(a.reject)){b.isFunction(a.onFail)&&a.onFail(a);return false}if(a.close&&a.closeCookie){var f="jreject-close",h=function(c,g){if(typeof g!="undefined"){var e="";if(a.cookieSettings.expires!=0){e=new Date;e.setTime(e.getTime()+a.cookieSettings.expires);e="; expires="+e.toGMTString()}var k=a.cookieSettings.path||"/";document.cookie=c+"="+encodeURIComponent(g==null?"":g)+e+"; path="+k}else{k=null;if(document.cookie&&document.cookie!="")for(var o=document.cookie.split(";"),n=0;n<o.length;++n){e=
b.trim(o[n]);if(e.substring(0,c.length+1)==c+"="){k=decodeURIComponent(e.substring(c.length+1));break}}return k}};if(h(f)!=null)return false}var i='<div id="jr_overlay"></div><div id="jr_wrap"><div id="jr_inner"><h1 id="jr_header">'+a.header+"</h1>"+(a.paragraph1===""?"":"<p>"+a.paragraph1+"</p>")+(a.paragraph2===""?"":"<p>"+a.paragraph2+"</p>")+"<ul>",l=0;for(var s in a.display){var p=a.display[s],j=a.browserInfo[p]||false;if(!(!j||j.allow!=undefined&&!d(j.allow))){i+='<li id="jr_'+p+'"><div class="jr_icon"></div><div><a href="'+
(j.url||"#")+'">'+(j.text||"Unknown")+"</a></div></li>";++l}}i+='</ul><div id="jr_close">'+(a.close?'<a href="'+a.closeURL+'">'+a.closeLink+"</a><p>"+a.closeMessage+"</p>":"")+"</div></div></div>";var m=b("<div>"+i+"</div>");d=q();i=r();m.bind("closejr",function(){if(!a.close)return false;b.isFunction(a.beforeClose)&&a.beforeClose(a);b(this).unbind("closejr");b("#jr_overlay,#jr_wrap").fadeOut(a.fadeOutTime,function(){b(this).remove();b.isFunction(a.afterClose)&&a.afterClose(a)});b("embed, object, select, applet").show();
a.closeCookie&&h(f,"true");return true});m.find("#jr_overlay").css({width:d[0],height:d[1],position:"absolute",top:0,left:0,background:a.overlayBgColor,zIndex:200,opacity:a.overlayOpacity,padding:0,margin:0}).next("#jr_wrap").css({position:"absolute",width:"100%",top:i[1]+d[3]/4,left:i[0],zIndex:300,textAlign:"center",padding:0,margin:0}).children("#jr_inner").css({background:"#FFF",border:"1px solid #CCC",fontFamily:'"Lucida Grande","Lucida Sans Unicode",Arial,Verdana,sans-serif',color:"#4F4F4F",
margin:"0 auto",position:"relative",height:"auto",minWidth:l*100,maxWidth:l*140,width:b.layout.name=="trident"?l*155:"auto",padding:20,fontSize:12}).children("#jr_header").css({display:"block",fontSize:"1.3em",marginBottom:"0.5em",color:"#333",fontFamily:"Helvetica,Arial,sans-serif",fontWeight:"bold",textAlign:"left",padding:5,margin:0}).nextAll("p").css({textAlign:"left",padding:5,margin:0}).siblings("ul").css({listStyleImage:"none",listStylePosition:"outside",listStyleType:"none",margin:0,padding:0}).children("li").css({background:'transparent url("'+
a.imagePath+'background_browser.gif") no-repeat scroll left top',cusor:"pointer","float":"left",width:120,height:122,margin:"0 10px 10px 10px",padding:0,textAlign:"center"}).children(".jr_icon").css({width:100,height:100,margin:"1px auto",padding:0,background:"transparent no-repeat scroll left top",cursor:"pointer"}).each(function(){var c=b(this);c.css("background","transparent url("+a.imagePath+"browser_"+c.parent("li").attr("id").replace(/jr_/,"")+".gif) no-repeat scroll left top");c.click(function(){window.open(b(this).next("div").children("a").attr("href"),
"jr_"+Math.round(Math.random()*11));return false})}).siblings("div").css({color:"#808080",fontSize:"0.8em",height:18,lineHeight:"17px",margin:"1px auto",padding:0,width:118,textAlign:"center"}).children("a").css({color:"#333",textDecoration:"none",padding:0,margin:0}).hover(function(){b(this).css("textDecoration","underline")},function(){b(this).css("textDecoration","none")}).click(function(){window.open(b(this).attr("href"),"jr_"+Math.round(Math.random()*11));return false}).parents("#jr_inner").children("#jr_close").css({margin:"0 0 0 50px",
clear:"both",textAlign:"left",padding:0,margin:0}).children("a").css({color:"#000",display:"block",width:"auto",margin:0,padding:0,textDecoration:"underline"}).click(function(){b(this).trigger("closejr");if(a.closeURL==="#")return false}).nextAll("p").css({padding:"10px 0 0 0",margin:0});b("#jr_overlay").focus();b("embed, object, select, applet").hide();b("body").append(m.hide().fadeIn(a.fadeInTime));b(window).bind("resize scroll",function(){var c=q();b("#jr_overlay").css({width:c[0],height:c[1]});
var g=r();b("#jr_wrap").css({top:g[1]+c[3]/4,left:g[0]})});a.closeESC&&b(document).bind("keydown",function(c){c.keyCode==27&&m.trigger("closejr")});b.isFunction(a.afterReject)&&a.afterReject(a);return true};var q=function(){var a=window.innerWidth&&window.scrollMaxX?window.innerWidth+window.scrollMaxX:document.body.scrollWidth>document.body.offsetWidth?document.body.scrollWidth:document.body.offsetWidth,d=window.innerHeight&&window.scrollMaxY?window.innerHeight+window.scrollMaxY:document.body.scrollHeight>
document.body.offsetHeight?document.body.scrollHeight:document.body.offsetHeight,f=window.innerWidth?window.innerWidth:document.documentElement&&document.documentElement.clientWidth?document.documentElement.clientWidth:document.body.clientWidth,h=window.innerHeight?window.innerHeight:document.documentElement&&document.documentElement.clientHeight?document.documentElement.clientHeight:document.body.clientHeight;return[a<f?a:f,d<h?h:d,f,h]},r=function(){return[window.pageXOffset?window.pageXOffset:
document.documentElement&&document.documentElement.scrollTop?document.documentElement.scrollLeft:document.body.scrollLeft,window.pageYOffset?window.pageYOffset:document.documentElement&&document.documentElement.scrollTop?document.documentElement.scrollTop:document.body.scrollTop]}})(jQuery);

/*
    * jQuery Browser Plugin
    * Version 2.3
    * 2008-09-17 19:27:05
    * URL: http://jquery.thewikies.com/browser
    * Description: jQuery Browser Plugin extends browser detection capabilities and can assign browser selectors to CSS classes.
    * Author: Nate Cavanaugh, Minhchau Dang, & Jonathan Neal
    * Copyright: Copyright (c) 2008 Jonathan Neal under dual MIT/GPL license.
*/
(function($){$.browserTest=function(a,z){var u='unknown',x='X',m=function(r,h){for(var i=0;i<h.length;i=i+1){r=r.replace(h[i][0],h[i][1]);}return r;},c=function(i,a,b,c){var r={name:m((a.exec(i)||[u,u])[1],b)};r[r.name]=true;r.version=(c.exec(i)||[x,x,x,x])[3];if(r.name.match(/safari/)&&r.version>400){r.version='2.0';}if(r.name==='presto'){r.version=($.browser.version>9.27)?'futhark':'linear_b';}r.versionNumber=parseFloat(r.version,10)||0;r.versionX=(r.version!==x)?(r.version+'').substr(0,1):x;r.className=r.name+r.versionX;return r;};a=(a.match(/Opera|Navigator|Minefield|KHTML|Chrome/)?m(a,[[/(Firefox|MSIE|KHTML,\slike\sGecko|Konqueror)/,''],['Chrome Safari','Chrome'],['KHTML','Konqueror'],['Minefield','Firefox'],['Navigator','Netscape']]):a).toLowerCase();$.browser=$.extend((!z)?$.browser:{},c(a,/(camino|chrome|firefox|netscape|konqueror|lynx|msie|opera|safari)/,[],/(camino|chrome|firefox|netscape|netscape6|opera|version|konqueror|lynx|msie|safari)(\/|\s)([a-z0-9\.\+]*?)(\;|dev|rel|\s|$)/));$.layout=c(a,/(gecko|konqueror|msie|opera|webkit)/,[['konqueror','khtml'],['msie','trident'],['opera','presto']],/(applewebkit|rv|konqueror|msie)(\:|\/|\s)([a-z0-9\.]*?)(\;|\)|\s)/);$.os={name:(/(win|mac|linux|sunos|solaris|iphone)/.exec(navigator.platform.toLowerCase())||[u])[0].replace('sunos','solaris')};if(!z){$('html').addClass([$.os.name,$.browser.name,$.browser.className,$.layout.name,$.layout.className].join(' '));}};$.browserTest(navigator.userAgent);})(jQuery);
/*admin/race.js*/
function calculateDistance(){var a=0,b;$("input.legDistance").each(function(){b=$(this).val();b=b!=""?b:0;a+=toKilometers(parseFloat(b),$(this).closest("tr").find("select.unitSelect").val())});return a.toFixed(4)}function toKilometers(b,a){switch(a){case"meters":b*=0.001;break;case"miles":b*=1.60934;break;case"yards":b*=0.0009144;break;case"feet":b*=0.0003048;break;default:break}return b}var age_ref_date="";var previous;
/*imgpreview.full.jquery.js*/
/*
 * imgPreview jQuery plugin
 * Copyright (c) 2009 James Padolsey
 * j@qd9.co.uk | http://james.padolsey.com
 * Dual licensed under MIT and GPL.
 * Updated: 09/02/09
 * @author James Padolsey
 * @version 0.22
 */
(function($){
    
    $.expr[':'].linkingToImage = function(elem, index, match){
        // This will return true if the specified attribute contains a valid link to an image:
        return !! ($(elem).attr(match[3]) && $(elem).attr(match[3]).match(/\.(gif|jpe?g|png|bmp)$/i));
    };
    
    $.fn.imgPreview = function(userDefinedSettings){
        
        var s = $.extend({
            
            /* DEFAULTS */
            
            // CSS to be applied to image:
            imgCSS: {},
            // Distance between cursor and preview:
            distanceFromCursor: {top:10, left:-10},
            // Boolean, whether or not to preload images:
            preloadImages: true,
            // Callback: run when link is hovered: container is shown:
            onShow: function(){},
            // Callback: container is hidden:
            onHide: function(){},
            // Callback: Run when image within container has loaded:
            onLoad: function(){},
            // ID to give to container (for CSS styling):
            containerID: 'imgPreviewContainer',
            // Class to be given to container while image is loading:
            containerLoadingClass: 'loading',
            // Prefix (if using thumbnails), e.g. 'thumb_'
            thumbPrefix: '',
            // Where to retrieve the image from:
            srcAttr: 'href'
            
        }, userDefinedSettings),
        
        $container = $('<div/>').attr('id', s.containerID)
                        .append('<img/>').hide()
                        .css('position','absolute')
                        .css('z-index','2000')
                        .appendTo('body'),
            
        $img = $('img', $container).css(s.imgCSS),
        
        // Get all valid elements (linking to images / ATTR with image link):
        $collection = this.filter(':linkingToImage(' + s.srcAttr + ')');
        
        // Re-usable means to add prefix (from setting):
        function addPrefix(src) {
          if (src) {
            return src.replace(/(\/?)([^\/]+)$/, '$1' + s.thumbPrefix + '$2');
          }
          return src;
        }
        
        if (s.preloadImages) {
            (function(i){
                var tempIMG = new Image(),
                    callee = arguments.callee;
                tempIMG.src = addPrefix($($collection[i]).attr(s.srcAttr));
                tempIMG.onload = function(){
                    $collection[i + 1] && callee(i + 1);
                };
            })(0);
        }
        
        $collection
            .mousemove(function(e){
                
                $container.css({
                    top: e.pageY + s.distanceFromCursor.top + 'px',
                    left: e.pageX + s.distanceFromCursor.left + 'px'
                });
                
            })
            .hover(function(){
                
                var link = this;
                $container
                    .addClass(s.containerLoadingClass)
                    .show();
                $img
                    .load(function(){
                        $container.removeClass(s.containerLoadingClass);
                        $img.show();
                        s.onLoad.call($img[0], link);
                    })
                    .attr( 'src' , addPrefix($(link).attr(s.srcAttr)) );
                s.onShow.call($container[0], link);
                
            }, function(){
                
                $container.hide();
                $img.unbind('load').attr('src','').hide();
                s.onHide.call($container[0], this);
                
            });
        
        // Return full selection, not $collection!
        return this;
        
    };
    
})(jQuery);
/*ui.bootstrap.js*/
$(function () {

  $('body').addClass('JS');
  
  // handle session timeouts
  $.ajaxSetup({
                'statusCode':{
                  401:function (jqXHR) {
                    var redirectUrl = jqXHR.getResponseHeader('X-Bazu-Redirect');
                    if (!redirectUrl) {
                      redirectUrl = '/auth/sign-in-form';
                    }
                    window.location.replace(redirectUrl);
                  }
                }
              });
              
  $(document).click(function(){
    $('.dropdown-list:visible').hide(); 
  });

  $(document).ready(function() {
    if ($('.highlight-menu').size()) {
      var id = $('.highlight-menu').val();
      $('#' + id).parent().addClass('active');
    }
    if ($('.append-class').size()) {
      $('.append-class').each(function() {
        var data       = $(this).data();
        var classToAdd = data.class;
        $(this).addClass(classToAdd);
      });
    }
    $('body').on('change', '#event-location-country', function() {
      var country = $(this).val();
      var geolocation = $('#fr-event-location');
      var showIfUs = geolocation.find('.show-if-us').size() > 0;
      geolocation.attr('country', country);
      geolocation.toggle(country !== 'US' && showIfUs);
    });
  });
  
  $('a.external').click(function () { 
    var newTab;
    if($(this).attr("id") == "onsite-registration-link"){
        var confirmOnsiteRedirect = confirm(gt.gettext("Navigating to the On-site Registration form will log you out of admin. Do you want to continue?"));
        if(confirmOnsiteRedirect) {
            newTab = window.open(this.getAttribute('href'), '_blank');
            newTab.focus();
            return false;
        } else {
            return false;
        }
    } else {
        newTab = window.open(this.getAttribute('href'), '_blank');
        newTab.focus();
        return false;
    }
  });
  
  
  $('.overlay button[type=submit]').live('click', function () {

    var f = $(this).closest('.overlay form,.mm-item form');

    //Overwrite bibs?
    if(f.hasClass('confirm-overwrite-complete') && $(this).attr("id")=="submitcomplete_save"){
      var status = confirm(gt.gettext('Are you sure you want to over write your existing bibs?'));
      if(!status){
        return false;
      }
    }

    $(this).closest('form').find('#submitvalue').val($(this).attr('name'));

    return true;
  });
  
  $('.payment-form-with-token :submit:not(#submitback)').live('click', function(e){
    
    var f = $(this).closest('form');
    var dlg = f.closest('.overlay,.mm-item');
    dlg.append('<div class="spinner"><div class="inner"></div></div>');
    
    e.stopPropagation();
            
    var data = f.serializeArray();
    
    var tokenData = $.paymentProcessor.prepareTokenData(data);
    
    if(jQuery.isEmptyObject(tokenData)) {
      var jqXHR = $.post(f.prop('action'), data, submitHandler)
      .always(function () {
        dlg.find('.spinner').remove();
      })
      .error(function () {
        $.jGrowl("Submission failed", {theme:'error'});
      });
      
      return false;
    }
    
    var promise = $.paymentProcessor.createToken(tokenData);
    
    promise.then(function(res){
      
      var dataToSend = $.paymentProcessor.cleanDataForSubmit(data);
      dataToSend = $.paymentProcessor.addTokenToData(dataToSend, res.token);
      dataToSend = $.paymentProcessor.addConfigToData(dataToSend, res.config, 'card[processorConfig]');
      
      var jqXHR = $.post(f.prop('action'), dataToSend, submitHandler)
      .always(function () {
        dlg.find('.spinner').remove();
      })
      .error(function () {
        $.jGrowl("Submission failed", {theme:'error'});
      });
      
      return false;
            
    }, function(error){
      
      $('#fr-card-cardExpires').find('ul.errors').remove();
      $('#fr-card-cardNumber').find('ul.errors').remove();
      $('#fr-card-cardName').find('ul.errors').remove();
      $('#fr-card-cardCode').find('ul.errors').remove();
      
      
      var errorMsg  = error.message;
      var errorCode = error.param;
      switch(errorCode) {

        case "exp_year":
        case "exp_month":
          $('#fr-card-cardExpires').append('<ul class="errors alert alert-danger">');
          $('#fr-card-cardExpires > ul').append('<li>'+errorMsg+'</li>');
          
          break;
        case "number":
          $('#fr-card-cardNumber').append('<ul class="errors alert alert-danger">');
          $('#fr-card-cardNumber > ul').append('<li>'+errorMsg+'</li>');
          break;
        case "name":
          $('#fr-card-cardName').append('<ul class="errors alert alert-danger">');
          $('#fr-card-cardName > ul').append('<li>'+errorMsg+'</li>');
          
          break;
        case "cvc":
          $('#fr-card-cardCode').append('<ul class="errors alert alert-danger">');
          $('#fr-card-cardCode > ul').append('<li>'+errorMsg+'</li>');
          break;
      }
      
      dlg.find('.spinner').remove();
      
      return false;
      
    });
        
    return false;    
    
  });
  // convert bytes for file size to human readable file size 
  var humanFileSize = function(size) {
    var i = Math.floor( Math.log(size) / Math.log(1024) );
    return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
  };
  // allow ajax submits in popup dialogs
  $('.overlay form,.mm-item form').live('submit', function (e) {
    var f = $(this);
    var dlg = f.closest('.overlay,.mm-item');
    if($(f).attr('id') == "import-preroll-media-form") {
      if(typeof f.find('#file')[0] != 'undefined' && f.find('#file')[0].files[0].size > 20971520) {
        if($('.video-size-warning').size() == 0) {
          f.find('#fr-file').append(('<ul class="errors alert video-size-warning alert-danger"><li>' 
            + gt.gettext('Your pre-roll media exceeds the limit of 20MB. The maximum allowable limit is 20MB and your file is '+ humanFileSize(f.find('#file')[0].files[0].size)) + 
         '</li></ul>'));
        }
        return false;
      }
    }
    dlg.append('<div class="spinner"><div class="inner"></div></div>');
    if (f.find('.fileupload').size() > 0) {
      return true;
    }
    var jqXHR = $.post(f.prop('action'), f.serializeArray(), submitHandler)
      .always(function () {
                dlg.find('.spinner').remove();
              })
      .error(function () {
               $.jGrowl("Submission failed", {theme:'error'});
             });
    return false;
  });
  
  
  $('.navmenu').live('change', function () {
    $(this).closest('form').find('#submitvalue').val('submitjump').end().submit();
  });
  
  $("button.no-reload").click(function(){
      showSpinner($(this));
      $(".errors").hide();
      var form = $(this).closest('form');
      var action = $(form).attr('action');
      var data = $(form).serialize();
      $.post(action,data,function(response){
        if(response.status == 0){
              $.jGrowl(response.msg, {
                theme:'success'
            });
            window.onbeforeunload = null; 
            $(window).unbind("beforeunload");
        } else {
            var errors = response.msg;
            for(var key in errors) {
                var msgs = errors[key];
                $("#event-"+key + '-element').append("<ul class='errors'></ul>");
                for (var ekey in msgs){
                    $("#event-"+key+"-element > ul").append("<li>"+msgs[ekey]+"</li>");
                }
            }     
        }
        $(".no-reload").busy('hide');
      });
      return false;
    });
     
  //Handle cancel button elements
  $('.overlay button.cancel').live('click', function () {
    var dlg = $(this).closest('.overlay');
    dlg.modal('hide');
    return false;
  });
  
  //Handle close & refresh button elements
  $('body').on('click', 'button.reload', function () {
    var dlg = $(this).closest('.overlay');
    dlg.modal('hide');
    window.location.reload();
    return false;
  });
  
  $('#edit-event-form .organizer_id,#edit-event-form .timer_id,#create-event-form .organizer_id, #create-event-form .timer_id').live('change',function() {
    //Fix for bug #2425
    //Adding spinner for changeing organizer and timer, removed busy icon.
    //When we change organizer or timer, ajax call can take little bit long, and if we hit save before ajax load values
    //we can overwrite some existing organizer and we do not want that.
    $('select.region_id').closest('div').find('ul.errors').remove();
    var dlg = $(this).closest('.overlay');
    dlg.append('<div class="spinner"><div class="inner"></div></div>');
    var val = $(this).val();
    var depClass,depPrefix;
    if ($(this).hasClass('timer_id')) {
      depClass = 'timer_id-dep';
      depPrefix = 'event-timer-';
    }
    else {
      depClass = 'organizer_id-dep';
      depPrefix = 'event-organizer-';
    }
    var others = $(this).closest('form').find('[class*='+depClass+']');
    var frs = others.closest('.fr');
    if (val == "") {
      frs.hide();
      others.val("");      
      dlg.find('.spinner').remove();
    }
    else {
      if (val == "_NEW_" || val == "_PleaseSelect_") {
        others.val("");
        frs.show();
        dlg.find('.spinner').remove();
        others.each(function(){
           if ($(this).hasClass('chzn'))
           {
              $(this ).attr('disabled', false ).trigger("liszt:updated");
           }
        });
      }
      else {
        frs.show();
        $this = $(this);
        $.get('/admin/organization/index/organizationID/'+val,null,function(data){
          var loc = data.location;
          if (typeof loc == 'Array') {
            loc = {};
          }
          others.each(function(){
            var key = $(this).attr('id').replace(depPrefix,'');
            var val = "";
            if (key.substr(0,9)=="location-") {
              key = key.substr(9);
              if (key == "location_name") {
                val = loc.name;
              }
              else if (key == "country") {
                val = loc.region_id.substr(0,2);
              }
              else {
                val = loc[key];
              }
            }
            else {
              if (key == "location_id") {
                val = loc.id;
              }
              else{
                val = data[key];
              } 
            }
            $(this).val(val);
            if($(this).context.nodeName == 'SELECT' && $(this).hasClass('chzn')) {
              $(this).trigger('change').trigger("liszt:updated");
            }
          });
          dlg.find('.spinner').remove();
        }).error(function(){$.jGrowl('Ajax call failed',{theme:'error'});dlg.find('.spinner').remove();});
      }
    }
  });

  $('.accordion-toggle').click(function(){
    $($(this).attr('collapse')).toggle(500);
    if($(this).attr('data-icon') == 'icon-chevron-down') {
      $(this).attr('data-icon', 'icon-chevron-right');
      $(this).find('i').removeClass('icon-chevron-down').addClass('icon-chevron-right');
    }
    else {
      $(this).attr('data-icon', 'icon-chevron-down');
      $(this).find('i').removeClass('icon-chevron-right').addClass('icon-chevron-down');
    }
  });
  
  if($('#showInfo').size()) {
    handlePopup.apply($('#showInfo'));
  }

});

function resizeModal(overlay) {
  if (!overlay) {
    overlay = $('#overlay');
  }
  var winHeight = $(window).height();
  var popHeight = overlay.outerHeight();
  if((winHeight - popHeight) < 60){
    overlay.find('.modal-body').css({'height':$(window).height()-240});
  }else{
    overlay.find('.modal-body').removeAttr('height').removeAttr('overflow');
  }
}

function refreshEmailListElement(data, type) {
  $('#fr-emailCampaign-email_list').remove();
  $('#fr-emailCampaign-lang').after(data);
  if (type == 'remove') {
    var campignID = $('#emailCampaignID').val();
    $("#createEmailList").attr('href', '/admin/email-list/create?emailCampaignID='+campignID+'&_step=1');
  }
}

function submitHandler(data, stat, jqXHR) {
  dlg = $('#overlay');
  dlg.find('.spinner').remove();
  var f = dlg.find('form');
  if (typeof(data) == 'object') {
    if (data.close) {
      if (dlg.hasClass('overlay')) {
        dlg.modal('hide');
      }
      else {
        $(document).trigger('click'); // yuck...this closes the megamenu...
      }
    }
    if(data.xscript) {
      eval(data.xscript);
    }
    if (data.reload) {
      location.reload();
    }
    else {
      if (data.url) {
        location.href = data.url;
      }
      else {
        if (data.xurl) {
          $.get(data.xurl, {}, function (data) {
            setupOverlay(dlg, data);
          });
        }
      }
    }
  }
  else {
    setupOverlay(dlg, data);
    f = dlg.find('form');
    //$('.jGrowl-notification').trigger('jGrowl.close');
    //if (f.find('ul.errors').size() > 0) {
    //  $.jGrowl('Errors found.',{theme:'error',sticky:true});
    //}
    f.find('input:text:first').focus();
    eval(dlg.find('.xscript').text());
  }
}

function handlePopup() {
  if ($(this).hasClass('ui-state-disabled') || $(this).hasClass('disabled')) {
    return false;
  }
  var params = $(this).data('postData');
  var onClose = $(this).data('afterClose');
  if (typeof onClose == "string") {
    onClose = eval(onClose);
  }
  var $req = $.post;
  if (typeof params == "undefined" || !params) {
    $req = $.get;
    params = null;
  }
  else {
    if (typeof params == "function") {
      params = params();
    }
  }
  var linkIsObject = false;
  var url = $(this).attr('href');
  if(typeof(url) == 'object') {
    url = url[0].attributes.href.nodeValue;
    linkIsObject = true;
  }
  if (!url) {
    url = $(this).data('href');
  }
  
  var warnUrl = $(this).attr('warn');

  if (warnUrl) {
    if (params == null) {
      params = new Object();
    }
    params.url = url;
    url        = warnUrl;
  }

  var $this = $(this);
  showSpinner($this);
  var overlaySelector = $(this).data('popupOverlay') || $(this).attr('rel') || '#overlay';
  var overlay = $(overlaySelector);
  if(linkIsObject) {
    overlay = $('#overlay');
  } else {
    overlay = $(overlaySelector);
  }
  $req(url, params,
      function (data) {
        $this.busy('hide');
        if(data.code == -2) {
          window.location = data.url;
          return false;
        }
        var w = parseInt($this.data('popupWidth'), 10);
        setupOverlay(overlay, data, w, onClose);
        return true;
      }).error(function () {$this.busy('hide');});
  return false;
}

function useEndDate() {
  var endDate = $('div.end-date > input.use_end_date');
  var reportEndDate = $('div.end-date div input.use_end_date');
  if($(this).is(':checked')) {
    endDate.removeAttr('readonly');
    endDate.removeClass('disabled');
    reportEndDate.removeAttr('readonly');
    reportEndDate.removeClass('disabled');
  } else {
    endDate.attr('readonly','readonly');
    endDate.addClass('disabled');
    reportEndDate.attr('readonly','readonly');
    reportEndDate.addClass('disabled');
  }
}
function updateRegionInfo(country, regionId, regionSelector){
    var dlg = $(regionSelector).closest('.overlay');
    dlg.append('<div class="spinner"><div class="inner"></div></div>');
    var regMenu = $(regionSelector);
    function noRegion() {
      regMenu.html('<option value="" selected="selected">'+gt.gettext('No Region')+'</option>');
    }
    function done() {
      regMenu.trigger('liszt:updated');
      dlg.find('.spinner').remove();
    }
    if (!country) {
      noRegion();
      done();
      return;
    }
    $.post('/reg/regions-for-country',{'country': country},function(data){
        if (!data || data.length === 0) {
          noRegion();
        }
        else {
            var h = '';
            var sr = regMenu.val();
            $.each(data,function(i,r){
                h += '<option value="'+r.id+'"'+(r.id==sr?' selected="selected"':'')+'>'+r.name+'</option>';
            });
            regMenu.html(h);
            $(regionSelector).val(regionId);
        }
        done();
    }, 'json');
}

function configureFileUploader() {
  var form = $(this).closest('form');
  form.iframePostForm({
    json:    false,
    complete:function (response, stat, jqXHR) {
      submitHandler(response, stat, jqXHR);
    }
  });
}

function configureListEditor() {
  var editor = $(this);
  var gridContainer = editor.find('.bazu-slick-grid');
  var el = editor.find('input:hidden');
  var data = eval(el.val());
  var cols = eval(editor.data('gridColumns'));
  var options = eval(editor.data('gridOptions'));
  if (options.length > 0) {
    options = options[0];
  }
  else {
    options = {
      wantsPager:         false,
      enableRowCollapsing:false
    };
  }
  var bg = new Bazu.Slick.Grid(gridContainer, cols, options);
  bg.setData(data);
}

function handleSelectMenu() {
  var $this = $(this);
  var options = {style:'popup', width:'auto'};
  $.each([
           'transferClasses',
           'style',
           'width',
           'menuWidth',
           'handleWidth',
           'maxHeight',
           'icons',
           'format'
         ], function () {
    var opt = $this.data('selectmenu' + this.substr(0, 1).toUpperCase() + this.substr(1));
    if (typeof opt != 'undefined') {
      options[this] = opt;
    }
  });
  if (options.icons) {
    options.icons = JSON.parse(options.icons);
  }
  $this.selectmenu(options);
}

function createFromatedDate(enteredDate, isDob, returnFormat) {
  returnFormat = typeof returnFormat !== 'undefined' ? returnFormat : "MM/dd/yyyy";
  isDob = typeof isDob !== 'undefined' ? isDob : false;
  var parts = enteredDate.split("\/");
  var k     = 0;
  var length = parts.length;

  for (var i = 0; i < length; i++) {
    if (is_numeric(parts[i])) {
      k++;
    }
  }

  if (k < 3) {
    return false;
  }

  var m = '';
  var d = '';
  var y = '';

  if (parts[0] > 999) {
    y = parts[0];
    m = parts[1];
    d = parts[2];
  }
  else {
    m = parts[0];
    d = parts[1];
    y = parts[2];
  }
  y = parseInt(y, 10);

  if(isDob) {
    if (y < 100) {
      if (y < 10) {
          y += parseInt('2000', 10);
      }
      else {
          y += parseInt('1900', 10);
      }
    }
  }
  else {
    if (y < 100) {
      if (y < 35) {
          y += parseInt('2000', 10);
      }
      else {
          y += parseInt('1900', 10);
      }
    }
  }
  

  format = sprintf("%02d/%02d/%4d",m,d,y);
  var d = new Date(y,m,d);
  if ( Object.prototype.toString.call(d) === "[object Date]" ) {
      if ( isNaN( d.getTime() ) ) {  // d.valueOf() could also work
        return FALSE;
      }
      else {
        return format;
      }
  }
  else {
    return FALSE;
  }
}

function applyButtonStyles() {
  var args = {text:true};
  if ($(this).hasClass('uicon')) {
    var primaryIcon = $(this).data('primaryIcon');
    if (!primaryIcon) {
      if (/\b(ui-icon-[^\s]+)/.test($(this).attr('class'))) {
        primaryIcon = RegExp.$1;
      }
    }
    var secondaryIcon = $(this).data('secondaryIcon');
    if (primaryIcon || secondaryIcon) {
      args.icons = {};
      if (primaryIcon) {
        args.icons.primary = primaryIcon;
      }
      if (secondaryIcon) {
        args.icons.secondary = secondaryIcon;
      }
      if ($(this).hasClass('unotext')) {
        args.text = false;
      }
    }
  }
  if ($(this).hasClass('ui-state-disabled')) {
    args.disabled = true;
  }
  var fontSize = $(this).data('fontSize') || "auto";
  var padding = $(this).data('padding') || ".2em";
  $(this).button(args).find('.ui-button-text').css({'fontSize':fontSize, 'paddingTop':padding, 'paddingBottom':padding});
}

function applySplitButtonStyles() {
  $(this).buttonset();
  var btn = $(this).find('a.dropdown');
  var list = $('#' + btn.data('dropdown'));
  btn.click(function(){
    if (list.is(':visible')) {
      list.hide();
    }
    else {
      $('.dropdown-list').hide();
      var w = $(this).parent().outerWidth();
      var p = $(this).position();
      var t = p.top + $(this).outerHeight() + 2;
      var l = p.left + $(this).outerWidth() - w - 8;
      list.show().css({
        'position':'absolute',
        'left': l,
        'top':  t,
        'width': w
      });
    }
    return false;
  });
  list.hide().find('a').click(function(){
    list.hide();
  });
}

function updateDisplayOrder() {
  var args = {};
  var $this = $(this);
  if ($this.hasClass('dnd-sortable')) {
    args.placeholder = "ui-highlight placeholder";
  }
  if ($this.data('dragAxis')) {
    args.axis = $this.data('dragAxis');
  }
  if ($this.get(0).tagName.toLowerCase() == 'tbody') {
    args.helper = function (e, ui) {
      ui.children().each(function () {
        $(this).width($(this).width());
      });
      return ui;
    };
    args.change = function (e, ui) {
      $(".placeholder").html('<td colspan="100%">&nbsp;</td>');
    };
  }
  var data = getDataAttributes(this);
  var baseOrder = $this.data('baseOrder');
  if (typeof baseOrder == "undefined") {
    baseOrder = 0;
  }
  else {
    baseOrder = parseInt(baseOrder, 10);
  }
  var model = $this.data('model');
  var shouldReload = $this.data('order-reload');
  var m = model.split('-');
  var modelID = m[0];
  for (var i = 1; i < m.length; i++) {
    modelID += m[i].substr(0, 1).toUpperCase() + m[i].substr(1);
  }
  modelID += "Id";
  args.update = function (event, ui) {
    var order = {};
    $this.children().each(function (ix) {
      order[$(this).data(modelID)] = baseOrder + ix + 1;
    });
    data.order = JSON.stringify(order);
    $.post('/admin/' + model + '/update-display-order', data, function(postData){
      var notify = $this.data('notify');
      var jGrowl = postData.jGrowl;
      if(notify) {
        if($this.closest('.container').find('.overlapNotify').size()===0) {
          $this.closest('.container').prepend('<div class="overlapNotify">'+gt.gettext('Forms must be re-released for waiver changes to take place.')+' </div>');
        }
      }
      if (jGrowl) {
        if(postData.status == 1){
          $.jGrowl(gt.gettext(postData.msg), {theme:'error'});
        }
        else {
          $.jGrowl(gt.gettext(postData.msg), {theme:'success'});
          $this.trigger('change');
        }
      }
      if (shouldReload) {
        window.location.reload();
      }
    });
  };
  $this.sortable(args).disableSelection();
}

function getDataAttributes(el) {
  var data = {};
  for (var k in el.attributes) {
    if (!isNaN(k)) {
      var att = el.attributes[k].name;
      if (att.substr(0, 5) == 'data-') {
        var key = att.substr(5).replace(/-(.)/g, function (s, p1) {return p1.toUpperCase();});
        if (key.substr(-2) == 'Id') {
          key = key.substr(0, key.length - 2) + 'ID';
        }
        data[key] = el.attributes[k].value;
      }
    }
  }
  return data;
}

function handleTabs() {
  args = {};
  var ul = $(this).find('ul');
  if (ul.hasClass('closeable')) {
    var $tabs = $(this);
    // this breaks stuff? args.cookie = { expires: 14 };
    args.tabTemplate = '<li><a href="#{href}">#{label}</a> <span class="ui-icon ui-icon-close">'+gt.gettext('Remove Tab')+'</span></li>';
    var onClose = ul.data('onClose') ? eval(ul.data('onClose')) : null;
    if (ul.data('event') == 'mouseover') {
      args.event = 'mouseover';
    }
    ul.find('li i').click(function () {
                 if (onClose) {
                   var ok = onClose.apply($(this).parent().parent().get(0));
                   if (!ok) {
                     return;
                   }
                 }
                 var ix = ul.find('li').index($(this).parent());
                 $tabs.tabs('remove', ix);
               });
  }
  $('.closeable a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });
  if (!$tabs.data('activeTab')) {
    $('.closeable :first-child a').tab('show');
  }
}

function handleSubObjectEdit() {
  var depClass = $(this).data('depClass');
  var hide = $(this).data('depHide') == 'yes' ? true : false;
  var prefix = $(this).data('depPrefix');
  var model = $(this).data('model');
  var idParam = model.replace(/-([a-z0-9])/g, function (s, p1) {return p1.toUpperCase();}) + "ID";
  var others = $(this).closest('form').find('[class*=' + depClass + ']');
  var frs = others.closest('.fr');
  var val = $(this).val();
  var url = '/admin/' + model + '/index/' + idParam + '/' + val + '/prefix/' + prefix;
  if (val == "") {
    if (hide) {frs.hide();}
    others.val("");
    recenter($(this).closest('.overlay'));
  }
  else {
    if (val == "_NEW_") {
      others.val("");
      frs.show();
      recenter($(this).closest('.overlay'));
    }
    else {
      others.attr('disabled', 'disabled');
      frs.show();
      $this = $(this);
      $(this).busy({position:'right', hide:false, zIndex:1020});
      $.get(url, null,
            function (data) {
              $this.busy('hide');
              others.each(function () {
                var key = $(this).attr('id');
                $(this).val(data[key]);
              });

              others.removeAttr('disabled');
            }).error(function () {
                       btn.busy('hide');
                       $.jGrowl('Ajax call failed', {theme:'error'});
                     });
    }
  }
}

var countAutoMinMaxAcceptedTime = function(type) {
  var distanceFromStart = $("#checkpoint-distance_from_start-distance").val();
  var distanceUnit      = $("#checkpoint-distance_from_start-unit").val();
  var distanceMeters    = "";
  switch(distanceUnit) {
    case "kilometers":
      distanceMeters = distanceFromStart * 1000;
    break;
    case "miles":
      distanceMeters = distanceFromStart * 1609.34;
    break;
    case "yards":
      distanceMeters = distanceFromStart * 0.9144;
    break;
    case "feet":
      distanceMeters = distanceFromStart * 0.3048;
    break;
    default:
      distanceMeters = distanceFromStart;
  };
  if(type == "min") {
    var exclude_before_offset = distanceMeters / 6.75;
    var hours = Math.ceil(parseInt( exclude_before_offset / 3600 ) % 24).toString();
    var minutes = Math.ceil(parseInt( exclude_before_offset / 60 ) % 60).toString();
    var seconds = Math.ceil(exclude_before_offset % 60).toString();
    hours   = (hours < 10) ? ("0" + hours) : hours;
    minutes = (minutes < 10) ? ("0" + minutes) : minutes;
    seconds = (seconds < 10) ? ("0" + seconds) : seconds;
    $("#checkpoint-exclude_before_offset-hours").val(hours);
    $("#checkpoint-exclude_before_offset-minutes").val(minutes);
    $("#checkpoint-exclude_before_offset-seconds").val(seconds);
  } else {
    $("#checkpoint-exclude_after_offset-hours").val("24");
    $("#checkpoint-exclude_after_offset-minutes").val("00");
    $("#checkpoint-exclude_after_offset-seconds").val("00");
  }
}

//Setup bootstrap modal
var refreshReloads = [];
function clearRefreshReloads() {
  $.each(refreshReloads, function(index, timeoutID) {
    if (!timeoutID) {
      return;
    }
    clearTimeout(timeoutID);
  });
  refreshReloads.length = 0;
}
var globalTimeout = null;
function setupOverlay(overlay, content, popupWidth, onClose) {
  if (!overlay) {
    overlay = $('#overlay');
  }
  overlay.html(content);
  var first = overlay.find(':first');
  var title = first.data('title');
  if (!title) {
    title = gt.gettext("ChronoTrack Live");
  }
  var xscript = $.trim( overlay.find('.xscript').text() );
  if (xscript) {
    eval(xscript);
  }
  var doRefreshes = [];
  var refreshTimeout = 0;
  overlay.find('.auto-refresh').each(function () {
    if (overlay.find('.stop-refresh').size() !== 0) {
      return;
    }
    var refreshContent = $(this);
    var rel = refreshContent.attr('rel').split('@');
    var refreshUrl = rel[0];
    var refreshDelay = parseInt(rel[1], 10);
    if (refreshDelay < 1000) {
      refreshDelay *= 1000;
    }
    var doRefresh = function () {
      overlay.load(refreshUrl, null, function (data) {
        setupOverlay(overlay, data);
      });
    };
    doRefreshes[doRefreshes.length] = {
      refreshDelay: refreshDelay,
      doRefresh: doRefresh
    };
  });

  first.find('form').wrapInner('<div class="modal-body modal-body-overlay" />');
  first.contents().unwrap();
  var footer = overlay.find('.modal-footer').clone().remove().end();
  overlay.find('form').append(footer);
  var header = '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><h3>'+title+'</h3></div>';
  overlay.prepend(header);


  var destroy = false;
  var marginLeft = -300;
  if (!popupWidth) {
    popupWidth = parseInt(first.data('popupWidth'), 10);
    if (!popupWidth) {
      popupWidth = 600;
    } else {
      marginLeft = -popupWidth/2;
    }
  } else {
    marginLeft = -popupWidth/2;
  }
  setupElements(overlay);
  resizeModal(overlay);

  overlay.css('width', popupWidth + 'px');
  overlay.css('margin-left', marginLeft + 'px');
  overlay.addClass('modal');
  overlay.modal({backdrop: 'static', show: true});

  if(destroy) {
    overlay.on('hide', function (event,ui) {
      overlay.empty();
      overlay.modal('hide');
    });

  } else if (typeof(onClose) != 'undefined') {
    overlay.on('hide', function (event,ui) {
      clearRefreshReloads();
      onClose();
    });
  }
  overlay.find('input:visible:first').focus();
  $.each(doRefreshes, function () {
    refreshReloads[refreshReloads.length] = setTimeout(this.doRefresh, this.refreshDelay);
  });
}
var EventOptions  = null;
var OrgOptions    = null;
var searchingSwapEntry = false, swapTimeout;
var entries;
function setupElements(sel) {
  var numOfAddedRows = 0;
  sel
    .find('.fileupload').each(configureFileUploader).end()
    .find('select.selectmenu').each(handleSelectMenu).end()
    .find('.progress.progress-striped').each(function () {
                                 $(this).css('width',$(this).data('percentComplete'));
                               })
    .end()
    .find('#assignbibs-skip_options-overwrite').click(function(){
          if($(this).val() == "overwrite"){
              $("#assign-bibs-event-form").addClass("confirm-overwrite-complete");
          }
    }).end()
    .find('div[type="javascript"]').each(function(index, element){
      var script = $(this).html();
      eval(script);
      $(this).remove();
    }).end()
    .find('.toggleResultsTable').click(function(event){
      $('#progressForm').toggleClass('show-results');
      event.preventDefault();
    }).end()
    .find('.useEndDate').click(useEndDate)
    .end()
    .find('.useEndDate').each(useEndDate)
    .end()
    .find('#create-email_list-date-allAvalible-all').each(function() {
      if ($(this).attr('checked')) {
        $("#fr-create-email_list-date-dateRange").hide();
      }
    })
    .end()
    .find('#create-email_list-date-allAvalible-all').live('change',function() {
      if ($(this).attr("checked")) {
        $("#fr-create-email_list-date-dateRange").hide();
      }
      else {
        $("#fr-create-email_list-date-dateRange").show();
      }
    }).end()
    .find('.payment_structure').on("click",function(){
      var val = $("input[name='regchoice[advanced_payment_structure]']:checked").val();
      var participantsChoice = $("label[for='regchoice-pricing_change_type-PARTICIPANTS'],#regchoice-pricing_change_type-PARTICIPANTS");      
      if ($.inArray(val, ['CAPTAIN_PAYS_AFTER', 'CAPTAIN_CHOOSE']) !==-1) {
        participantsChoice.addClass('hide');
        $('#regchoice-pricing_change_type-DATE').click();
      }
      else {
        participantsChoice.removeClass('hide').show();    
      }
    }).end()
    .find('.modal').on("show", function(){
      $('body').css({overflow: 'hidden'}); 
    }).on('hidden', function(){ 
      $('body').css({overflow: ''}); 
    }).end()
    .find('#fr-exportType').on('click', 'input[name="exportType"]', function() {
      $('#fr-raceID,#fr-entry-status,#fr-lastID').toggle($(this).val() === "0");
      $('#fr-importHistoryFile, #fr-preamble').toggle($(this).val() === "1");
    }).end().find('#edit-bracket-rule-form, #create-bracket-rule-form').each(function(e) {
      var primaryBracket = $('.br-policy.btn-success').last().val();
      setPrimaryBracketKinect(primaryBracket);
    }).end()
    .find('#edit-bracket-rule-form .custom-bracket-rule, #create-bracket-rule-form .custom-bracket-rule').on('click',function(){
      $('.custom-bracket-rule').removeClass('selected');
      $(this).addClass('selected');
      $("#policy-custom-bracket").html($(this).text());
      $("#prefered_bracket").val($(this).data('value'));
    }).end()
    .find('.prevent-default').on('click', function(e){
      e.preventDefault();
    }).end()
    .find('#addAnotherRestriction').on('click', function(){
      var tr          = $('.tableRestrictions').find('tbody > tr:last-child');
      var trSelect    = $('.tableRestrictions').find('tbody > tr:last-child td:first-child select');
      var selectClone = $(trSelect).clone(false);
      $(selectClone).removeClass('chzn-done').show();
      var trClone     = $(tr).clone();
      var cloneClass  = $(trClone).attr('class');
      var cloneNumber = cloneClass.split('-');
      cloneNumber[1] = $.trim(cloneNumber[1]);
      var cloneNumberLine = parseInt(cloneNumber[1]) + 1;
      $(trClone).attr('class', 'line-' + cloneNumberLine);
      $('.tableRestrictions').find('tbody').append(trClone);
      var inputNumber = parseInt(cloneNumber[1])-1;
      var elements = new Array('sex', 'min_members', 'max_members', 'min_age', 'max_age');
      for(var i in elements) {
        $('table.tableRestrictions tr.line-' + cloneNumberLine + ' dt').attr('id', 'team_bracket-restrictions-'+cloneNumber[1]+'-'+elements[i]+'-label');
        $('table.tableRestrictions tr.line-' + cloneNumberLine + ' dd').attr('id', 'team_bracket-restrictions-'+cloneNumber[1]+'-'+elements[i]+'-element');
        $('table.tableRestrictions tr.line-' + cloneNumberLine + ' #team_bracket-restrictions-'+inputNumber+'-'+elements[i]).attr('name', 'team_bracket[restrictions]['+cloneNumber[1]+']['+elements[i]+']');
        $('table.tableRestrictions tr.line-' + cloneNumberLine + ' #team_bracket-restrictions-'+inputNumber+'-'+elements[i]).attr('id', 'team_bracket-restrictions-'+cloneNumber[1]+'-'+elements[i]);
        $('table.tableRestrictions tr.line-' + cloneNumberLine + ' #team_bracket-restrictions-'+cloneNumber[1]+'-'+elements[i]).val('').trigger('change');
      }
      $('table.tableRestrictions tr.line-' + cloneNumberLine + ' td:first-child').html('<dt>&nbsp</dt><dd></dd>');
      $('table.tableRestrictions tr.line-' + cloneNumberLine + ' td:first-child').find('dd').html($(selectClone));
      $('table.tableRestrictions tr.line-' + cloneNumberLine + ' td:first-child select').addClass('teamRestrictionsInput').attr('id', 'team_bracket-restrictions-'+cloneNumber[1]+'-sex')
      .attr('name', 'team_bracket[restrictions]['+cloneNumber[1]+'][sex]').chosen({disable_search_threshold: 10});
      
      var remove = $('table.tableRestrictions tbody tr td:last-child').html('<a href="#" class="removeRestriction">Remove</a>');
      $('.selectRestriction').each(function(index, element){
        $(element).trigger('chosen:updated');
      });
      resizeModal();
    }).end()
    .find('.excluded-report-race-select').on('change',function(){
      $('.timingPoints').attr('checked', false);
      if($(this).val() == 0) {
        $('#fr-report-params-checkpointID').hide();
      } else {
        $('#fr-report-params-checkpointID').show();
        $('.timing-point-check').hide();
        $("[data-race='"+$(this).val()+"']").show();
      }
    }).end()
    .find('#series_organizer').on('change',function() {
      var originalOrgID = $('.original-organizer-id').val();
      var orgID         = $(this).val();
      var element       = $(this);
      $(this).parent().find('.series-error').remove();
      var c = true;
      var eventsListSize = $('.one-series-event').length;
      if (originalOrgID != orgID && originalOrgID != '' && eventsListSize) {
        c = confirm("Changing the organizer for this event series will cause the current event list to be cleared. You will have to add new events associated with the newly selected organizer for this series. Are you sure you want to continue?");
      }      
      if (c) {
        var seriesID = $('.series-id').val();
        var seriesPayee   = $('#series_payee');
        seriesPayee.next().hide();
        seriesPayee.before('<i class="fa fa-spinner fa-spin" style="font-size: 20px; margin-top:5px; margin-left: 140px;"></i>');
        $('.organizer-id').val(orgID);
        if (orgID) {
          seriesPayee.parent().find('.fa-check').remove();
          $.post('/admin/payee/get-payees-for-organizer',{'orgID': orgID}, function(data) {
            seriesPayee.html(data);
            seriesPayee.trigger("liszt:updated");
            seriesPayee.next().show();
            seriesPayee.prev().remove();
            seriesPayee.trigger('change');
          });
          processCountOfEventsInOrg(orgID);
        } else {
          seriesPayee.parent().find('.fa-check').remove();
          seriesPayee.html('');
          seriesPayee.trigger("liszt:updated");
          seriesPayee.next().show();
          seriesPayee.prev().remove();
          processCountOfEventsInOrg('');
        }
      } else {
        element.val(originalOrgID);
        element.trigger("liszt:updated");
        processCountOfEventsInOrg(originalOrgID);
      }
      
    }).end()
    .find('#series_payee').on('change',function() {
      var element  = $(this);
      var payeeID  = element.val();
      var seriesID = $('.series-id').val();
      element.parent().find('.fa-check').remove();
      if (payeeID) {
        var orgID = $('#series_organizer').val();
        $.post('/admin/series/set-payee-to-series',{'payeeID': payeeID, 'seriesID': seriesID, 'orgID': orgID}, function(data) {
          element.parent().find('.fa-spinner').remove();
        });
      }
    }).end()
    .find('.throw-error').live('click',function() {
      $('.no-events-in-org').show();
      $("html, body").animate({ scrollTop: 0 }, "slow");
      return false;
    }).end()
    .find('.fr-enable_mapping input').on('click', function() {
      $(".fr-elementsMapping").toggleClass('force-hide', !parseInt($(this).val()));
      resizeModal();
    }).end()
    .find('#series_title').on('input', function() {
      enableUpdateSeriesDataButton($(this));
    }).end()
    .find('#series_description').on('input', function() {
      enableUpdateSeriesDataButton($(this));
    }).end()
    .find('#series_waiver').on('input', function() {
      enableUpdateSeriesDataButton($(this));
    }).end()
    .find('#series_site_uri').on('input', function() {
      enableUpdateSeriesDataButton($(this));
    }).end()
    .find(".apply-series-data").live('click' , function(e) {
      e.preventDefault();
      var elementHolder = $(this).closest('.row-fluid').prev();
      if (elementHolder.find('input').length) {
        element = elementHolder.find('input');
      } else {
        element = elementHolder.find('textarea');
      }
      var data = element.data();
      $(this).hide();
      updateMasterSeriesEvent(data.trigger, element.val());
    }).end()
    .find(".disabled-series-step").on('click', 'a', function(event){
      event.preventDefault();        
    }).end()
    .find(".indeterminate").each(function() {
      $(this).prop("indeterminate", true);
    }).end()
    .find(".option-no-discount-package-label").on('click' , function() {
      $('.package-price-holder').hide();
      $('.package-discount-holder').hide();
    }).end()
    .find(".option-price-package-label").on('click' , function() {
      $('.package-price-holder').show();
      $('.package-discount-holder').hide();
    }).end()
    .find(".radio-discount-package-label").on('click' , function() {
      $('.package-price-holder').hide();
      $('.package-discount-holder').show();
    }).end()
    .find(".radio-price-individual-label").on('click' , function() {
      $('.invidivual-pricing-holder').show();
    }).end()
    .find(".individual-option-no-discount-label").on('click' , function() {
      $('.invidivual-pricing-holder').hide();
    }).end()
    .find(".requirement-package-label").on('click' , function() {
      $('.package-option-discount-wrap').show();
      $('.individual-option-discount-wrap').hide();
    }).end()
    .find(".requirement-discount-label").on('click' , function() {
      $('.package-option-discount-wrap').hide();
      $('.individual-option-discount-wrap').show();
    }).end()    
    .find(".all-events-checkbox label").live('click', function() {
      var checkbox = $(this).parent().find('input[type="checkbox"]');
      var isSelected = !checkbox.is(':checked');
      $('.series-add-event-list').find('.series-event-checkbox').find('label').each(function() {
        var cTemp = $(this).parent().find('input[type="checkbox"]');
        var indeterminate = cTemp.prop('indeterminate');
        if (isSelected) {
          cTemp.attr('checked', 'checked');
          $(this).closest('.one-event-in-series-list').find('.series-event-reg-options').find('input[type="checkbox"]').each(function() {
            $(this).attr('checked', 'checked');
          });
          $(this).closest('.one-event-in-series-list').find('.series-event-reg-options').show();
          setTimeout(function() { cTemp.prop("indeterminate", true); }, 100);
        }
        if (!isSelected && indeterminate) {
          cTemp.removeAttr('checked');
          cTemp.prop("indeterminate", false);
          $(this).closest('.one-event-in-series-list').find('.series-event-reg-options').find('input[type="checkbox"]').each(function() {
            $(this).attr('checked', false);
          });
          $(this).closest('.one-event-in-series-list').find('.series-event-reg-options').hide();
        }
      });
    }).end()
    .find(".series-event-checkbox label").on('click' , function() {
      var checkbox   = $(this).parent().find('input[type="checkbox"]');
      var indeterminate = checkbox.prop('indeterminate');
      //this will occur if checkbox is selected - js will not catch it at this point, so !indeterminate is used
      if (!indeterminate) {
        var totalEventCheckboxes = $('.series-event-checkbox').size();
        var totalChecked         = $('.series-event-checkbox input[type="checkbox"]:checked').size();
        if ((totalEventCheckboxes - 1) == totalChecked) {
          $('.all-events-checkbox input[type="checkbox"]').attr('checked', 'checked');
        } else {
          $('.all-events-checkbox input[type="checkbox"]').removeAttr('checked');
        }
        $(this).closest('.one-event-in-series-list').find('.series-event-reg-options').show();
        $(this).closest('.one-event-in-series-list').find('.series-event-reg-options').find('input[type="checkbox"]').each(function() {
          $(this).attr('checked', 'checked');
        });
        setTimeout(function() { checkbox.prop("indeterminate", true); }, 100);
      } else {
        $('.all-events-checkbox input[type="checkbox"]').removeAttr('checked');
        $(this).closest('.one-event-in-series-list').find('.series-event-reg-options').find('input[type="checkbox"]').each(function() {
          $(this).attr('checked', false);
        });
        $(this).closest('.one-event-in-series-list').find('.series-event-reg-options').hide()
      }

    }).end()
    .find(".series-search-event").on('keyup' , function() {
      var val = $(this).val();
      val     = val.toLowerCase();
      var parentRowEq;
      $('.one-event-in-series-list-holder').each(function() {
        var shouldHide = true;
        var eventName = $(this).find('.sa1').find('label').text();
        var location  = $(this).find('.sa2').find('p').text();
        var date      = $(this).find('.sa3').find('p').text();
        
        if (eventName.toLowerCase().indexOf(val) >= 0) {
          shouldHide = false;
        }
        if (location.toLowerCase().indexOf(val) >= 0) {
          shouldHide = false;
        }
        if (date.toLowerCase().indexOf(val) >= 0) {
          shouldHide = false;
        }
        if (shouldHide) {
          $(this).hide();
        } else {
          $(this).show();
        }
      });
    }).end()
    .find('.hide-row').each(function(){
      $(this).closest('.control-group').hide();
    }).end()
    .find('.excluded-report-race-select').each(function(){
      $('.timing-point-check').hide();
      $("[data-race='"+$(this).val()+"']").show();
    }).end()
    .find(".showPassword").on('click' , function() {
      if($(".passwordContainer").is(':visible')) {
        $(this).toggleClass( "icon-eye-open icon-eye-close" ).attr('data-original-title', gt.gettext('View')).tooltip('show');
        $(".passwordContainer").hide();
      }
      else {
        $(this).toggleClass( "icon-eye-close icon-eye-open" ).attr('data-original-title', gt.gettext('Hide')).tooltip('show');
        $(".passwordContainer").show();
      }
      return false;
    }).end()
    .find('#fr-report-params-rankType input').on('click', function() {
      $('#fr-report-params-pushers').toggle($(this).val() === 'xc');
    })
    .end()
    .find('#assignbibs-options, #race-options').on('change', function() {
      var val = $(this).val();
      var withTeams = $(this).data('withteams');
      if(withTeams.indexOf(val) !== -1) {
        $('#fr-team_entry_warning div div').show();
      }
      else {
        $('#fr-team_entry_warning div div').hide();
      }
    }).end()
    .find('table.tableRestrictions').on('click', '.removeRestriction', function() {
      $(this).closest('tr').remove();
      var restrictionCount = $('.tableRestrictions tbody tr').length;
      if (restrictionCount == 1) {
        $('table.tableRestrictions tbody tr td:last-child').html('');
      }
      resizeModal();
    }).end()
    .find('form#info-change_log-form > div.modal-body-overlay').on('scroll', function() {
      if($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
        $('#fr-info >table > tbody > tr:hidden').slice(0,20).show();
      }
    }).end()
    .find('#addAnotherLegType').on('click', function(){
      var rowNumber = $('.legDistance').length;
      var newId = 'new_' + rowNumber;
      var legRow = getLegRow(rowNumber, newId);
      $('#fr-race-legdistance > table.tableLegTypes > tbody').append(legRow);
      $('#race-course_info-' + newId + '-type').chosen();
      $('#race-course_info-' + newId + '-unit').chosen();
      
      if($('#hasResults').val() === "0") {
       $('table.tableLegTypes tbody tr td:last-child').html(
          '<a href="#" class="removeCourseTypes">' + gt.gettext('Remove') + '</a>'
        );
      }
      resizeModal();
    }).end()
    .find('#report-params-useDateRange').on('change', function(){
      var currentVal = $(this).attr('checked');
      var pickers = $('.form-text-date');
      if(typeof currentVal !== 'undefined') {
        pickers.removeClass('disabled');
        pickers.removeAttr('disabled');
      } else {
        pickers.addClass('disabled');
        pickers.attr('disabled','disabled');
        pickers.val('');
      }
    }).end()
    .find('#report-params-allEvents').on('change', function(){
      var currentVal = $(this).attr('checked');
      toggleAddEvents(currentVal);
    }).end().find('#report-params-allEvents').each(function(){
      var currentVal = $(this).attr('checked');
      toggleAddEvents(currentVal);
    }).end()
    .find('.report-organizer-element').on('change',function() {
       var dlg = $(this).closest('.overlay');
       dlg.append('<div class="spinner"><div class="inner"></div></div>');
       var orgID = $(this).val();
       $('#report-org_id').val(orgID);
       $.get('/admin/event/search-by-org/orgID/' + orgID + '/withoutRole/true', function(data) {
          var htmlSelect = '<option label="" value="">' + gt.gettext('Select Event') + '</option>';
          for(var i=0; i<data.length; i++) {
            var mat = data[i];
            htmlSelect += '<option label="'+mat.name+'" value="'+mat.id+'">'+mat.name+ ' - ' + mat.id +'</option>';
          }
          $('div[class*="fr-eventRemoveElement"]').not(':first').remove();
          var selectObject = $('.event-select-element').first().parent().find('select');
          selectObject.show().removeClass('chzn-done');
          selectObject.next().remove();
          selectObject.html(htmlSelect);
          selectObject.chosen();
          selectObject.next().removeClass('hidden');
          $('#overlay').find('.spinner').remove();
          setEventsForOrgWideReport();
      });
    }).end()
    .find('#addAnotherEvent').on('click', function() {
      $('.alert-danger').remove();
      if ($('.scroll-div').length == 0 && $('.event-select-element').length > 4) {
        $('div[class*="fr-eventRemoveElement"]').wrapAll( "<div class='scroll-div' style='height:250px;overflow-y:scroll;' />");
      }
      var newEventSelect = $('.event-select-element').last().parent().clone(true);
      newEventSelect.find('label').empty();
      var newSelect = newEventSelect.find('select');
      var id        = newSelect.attr('element');
      var newId     = parseInt(id) + 1;
      newEventSelect.find('a.removeEvent').removeClass('hidden').parent().removeClass('hidden');
      newEventSelect.find('div#event_select'+id+'_chzn').remove();
      newEventSelect.insertAfter($('.event-select-element').last().parent());
      newSelect.removeClass('chzn-done').attr('id', 'event_select' + newId).attr('element', newId).
        attr('name', 'event_select'+ newId).val('');
      newSelect.chosen();
      newEventSelect.find('div#event_select'+newId+'_chzn').removeClass('hidden');
      $('div.scroll-div').scrollTop('250');
      resizeModal();
    }).end()
    .find('.event-element').on('change', function() {
      setEventsForOrgWideReport();
    }).end()
    .find('.event-select-element').each(function(index, element) {
      if ($('.scroll-div').length == 0 && $('.event-select-element').length > 4) {
        $('div[class*="fr-eventRemoveElement"]').wrapAll( "<div class='scroll-div' style='height:250px;overflow-y:scroll;' />");
        $('div.scroll-div').scrollTop('250');
      }
    }).end() 
    .find('.removeEvent').on('click', function() {
      $(this).closest('div.control-group').remove();
      setEventsForOrgWideReport();
    }).end()
    .find('.wants-question-wrapper').on('click', 'input', function (){
      if($(this).val() == '1') {
        $(".registration-all-wrapper, .reg-context-wrapper, .reg-choice-list-element, .slide-move-to-front, .slide-required, .slide-label").removeClass('force-hide');
        if($('.registration-all-wrapper input:checked').length > 0) {
          $('.reg-choice-list-element').addClass('force-hide');
        }
      } else {
        $(".registration-all-wrapper, .reg-context-wrapper, .reg-choice-list-element, .slide-move-to-front, .slide-required, .slide-label").addClass('force-hide');
      }
    }).end()   
    .find('table.tableLegTypes').on('click', '.removeCourseTypes', function() {
      $(this).closest('tr').remove();
      var tableCount = $('.tableLegTypes tbody tr').length;
      if (tableCount == 2) {
        $('table.tableLegTypes tbody tr td:last-child').html('');
      }
      var total = calculateDistance();
      $('span#totalDistance').html(total);
      $('#race-course_distance-distance').val(total);
      resizeModal();
    }).end()
    .find('#regchoice-team_type_id').each(handleRegOptionTeamType)
    .end()
    .find('#regchoice-team_type_id').change(handleRegOptionTeamType)
    .end()
    .find('#org-srch').keyup(function(){
      var q =$(this).val();
      if (globalTimeout != null) {
        clearTimeout(globalTimeout);
      }
      globalTimeout = setTimeout(function() {
        globalTimeout = null;  
        if (q.length > 1) {
          $("#fr-payee-orgs > .fi > label").hide();
          $("#fr-payee-orgs > .fi > label:contains-ci('" + q + "')").show();
        }
        else {
          $("#fr-payee-orgs > .fi > label").show();
        }
      }, 350);
    })
    .end()
    .find('#payee-type-STRIPECONNECT').click(function(){
      
      $('.required-for-stripe').closest('.control-group').show();
      $('.required-for-ach').closest('.control-group').hide();
      $('.required-for-check').closest('.control-group').hide();
            
      resizeModal();
    })
    .end()
    .find('#payee-type-CHECK').click(function(){
      
      $('.required-for-check').closest('.control-group').show();
      $('.required-for-ach').closest('.control-group').hide();
      $('.required-for-stripe').closest('.control-group').hide();
      
      resizeModal();
    })
    .end()
    .find('#payee-type-ACH').click(function(){
      
      $('.required-for-check').closest('.control-group').show();
      $('.required-for-ach').closest('.control-group').show();
      $('.required-for-stripe').closest('.control-group').hide();
      
      resizeModal();
    })
    .end()
    .find('#payee-type-WIRE').click(function(){
       
      $('.required-for-check').closest('.control-group').show();
      $('.required-for-ach').closest('.control-group').hide();
      $('.required-for-stripe').closest('.control-group').hide();
     
      resizeModal();
    })
    .end()
    .find(".preventMultiClick").click( function (e) { 
        var href = $(this).attr('href');
        $(this).attr('href', 'javascript:void(0);');
        window.location.href = href;
     })
    .end()
    .find('#team-team_bracket_id').each(function(){
      $(this).find('optgroup').attr('disabled','disabled');
      if($('#race_name_hidden').size() > 0) {
        var raceName = $('#race_name_hidden').val();
        $('#team-team_bracket_id').find('optgroup[label="'+raceName+'"]').removeAttr('disabled');
      }
    }).end()
    .find('#team-team_bracket_id').each(function(index, element) {
      $(element).on('change', function(i,el) {
        var elID = $(this).val();
        $('#fr-team_bracket_restriction table tbody tr').each(function(index, element){
          if($(element).hasClass('bracket' + elID)) {
            $(element).removeClass('hidden');
          } 
          else {
            $(element).addClass('hidden');
          }
        });
       });
     }).end().find('#edit-bracket-rule-form .br-policy, #create-bracket-rule-form .br-policy').on('click', function(e) {
      e.preventDefault();
      if($(this).hasClass('btn-success')) {
        $(this).removeClass('btn-success').addClass('btn-disabled');
      } else {
        $(this).removeClass('btn-disabled').addClass('btn-success');
      }
      var primaryBracket = $('.br-policy.btn-success').last().val();
      setPrimaryBracketKinect(primaryBracket);
    }).end()
    .find('#create-bracket-rule-form .br-policy').click(function(e) {
      $('.br-policy-custom').val('CUSTOM_PRIMARY');
    }).end()
    .find('#payee-type-ACH').click(function() {
      payeeTypeAfterClick('ACH');
    })
    .end()
    .find('#payee-type-CHECK').click(function() {
      payeeTypeAfterClick('CHECK');
    }).end()
    .find('#payee-type-STRIPECONNECT').click(function() {
      payeeTypeAfterClick('STRIPECONNECT');
    }).end()
    .find('#payee-type-WIRE').click(function() {
      payeeTypeAfterClick('WIRE');
    }).end()
    .find('.create_new_payee_button').click(function(event) {
      event.preventDefault();
      $('#event-check_payable').val('');
      $('#event-payee').val('');
      $('#fr-event-select_payee').hide();
      $('.cnp').val('1');

      $('#payee-type-CHECK').removeAttr('disabled');
      $('#payee-type-ACH').removeAttr('disabled');
      $('#payee-type-STRIPECONNECT').removeAttr('disabled');
      $('#payee-type-WIRE').removeAttr('disabled');
      $('#payee-check_payable').removeAttr('disabled');
      $('#payee-payee_name').removeAttr('disabled');
      $('#payee-ach_configured').removeAttr('disabled');

      $('#payee-charge_currency_id').removeAttr('disabled');
      $('#payee-charge_currency_id').trigger("liszt:updated");

      $('#payee-check_payable').val('');
      $('#payee-payee_name').val('');

      setTimeout(function() {
        $('#payee-payment_location-country').val('US').removeAttr('disabled').trigger("liszt:updated");
        $('#payee-payment_location-postal_code').val('').removeAttr('disabled');
        $('#payee-payment_location-region_id').val('').removeAttr('disabled').trigger("liszt:updated");
        $('#payee-payment_location-city').val('').removeAttr('disabled');
        $('#payee-payment_location-street').val('').removeAttr('disabled');
        $('#payee-payment_location-street2').val('').removeAttr('disabled');
        $('#location_same_as_organizer_container').show();
        updateRegionInfo('US', '', '#payee-payment_location-region_id');
      }, 500);
    }).end()
    .find('#event-new_payee_id').on('change',function() {
      var val = $(this).val();
      if (val == 'np') {
        $('.create_new_payee_button').trigger('click');
        if($('input[type="hidden"]#payee-type').size() > 0) {
          payeeTypeAfterClick('CHECK');
          $('#payee-type').val('CHECK');
          resizeModal();
        }
        return false;
      }
      $('.cnp').val('0');
      $('#overlay').append('<div class="spinner"><div class="inner"></div></div>');
      
      $.post("/admin/event/get-payee-info", {payeeID: val, orgID: $('#selected_org_id').val()}, function(data) {
        if (typeof data.payee !== "undefined") {
          $('#payee-check_payable').val(data.payee.check_payable);
          $('#payee-payee_name').val(data.payee.payee_name);
          $('#payee-charge_currency_id').val(data.payee.charge_currency_id);
          $('#payee-charge_currency_id').trigger('liszt:updated');
          $('#payee-settle_currency_id').val(data.payee.settle_currency_id);
          $('#payee-settle_currency_id').trigger('liszt:updated');
          if (data.location) {
            $('#payee-payment_location-country').val(data.location.country_id);
            $('#payee-payment_location-country').trigger('liszt:updated');
            $('#payee-payment_location-region_id').val(data.location.region_id);
            $('#payee-payment_location-region_id').trigger('liszt:updated');
            $('#payee-payment_location-postal_code').val(data.location.postal_code);
            $('#payee-payment_location-time_zone').val(data.location.time_zone);
            $('#payee-payment_location-time_zone').trigger('liszt:updated');
            $('#payee-payment_location-city').val(data.location.city);
            $('#payee-payment_location-street').val(data.location.street);
            $('#payee-payment_location-street2').val(data.location.street2);
          } 

          $('#payee-check_payable').attr('disabled', 'disabled');
          $('#payee-payee_name').attr('disabled', 'disabled');
          $('#payee-charge_currency_id').attr('disabled', 'disabled');
          $('#payee-charge_currency_id').trigger("liszt:updated");
          $('#payee-settle_currency_id').attr('disabled', 'disabled');
          $('#payee-settle_currency_id').trigger("liszt:updated");

          var type = data.payee.type.replace(/\_/g, '');
          $('#payee-type-' + type).prop('checked', true);

          $('#payee-type-CHECK').attr('disabled', 'disabled');
          $('#payee-type-STRIPECONNECT').attr('disabled', 'disabled');
          $('#payee-type-ACH').attr('disabled', 'disabled');
          $('#payee-type-WIRE').attr('disabled', 'disabled');
          
          $('#payee-payment_location-country').attr('disabled', 'disabled');
          $('#payee-payment_location-country').trigger('liszt:updated');
          $('#payee-payment_location-postal_code').attr('disabled', 'disabled');
          $('#payee-payment_location-region_id').attr('disabled', 'disabled');
          $('#payee-payment_location-region_id').trigger('liszt:updated');
          $('#payee-payment_location-city').attr('disabled', 'disabled');
          $('#payee-payment_location-street').attr('disabled', 'disabled');
          $('#payee-payment_location-street2').attr('disabled', 'disabled');
          $('#location_same_as_organizer_container').hide();
          payeeTypeAfterClick(type);
          $('#payee-ach_configured').prop('checked', data.payee.ach_configured == "1");
        }
        $('.spinner').remove();
        resizeModal();
      });
      return false;
    }).end()
    .find('#event-new_payee_id').each(function(){
      var val = $(this).val();
      if(val != "np") {
        $(this).trigger('liszt:updated');
        $(this).trigger('change');
      }
    })
    .end()
    .find('.check-inspector .nav ul li').on('click', function() {
      $('.check-inspector .nav ul li.active').removeClass('active');
      $(this).addClass('active');
    }).end()
    .find( '.check-inspector [data-description]').on('click',function(){
      var description = $(this).data('description');
      $('.description-wrapper').addClass('hidden');
      $('.description-wrapper.description-' + description).removeClass('hidden');
    }).end()
    .find('#fr-report-params-toHide .fi.multibutton.multicheckbox').prepend(
      '<label class="fl200 inline checkbox span12" for="report-params-toHide-SELECTALL"'+
      'style="margin-left:0px"><input type="checkbox" id="report-params-toHide-SELECTALL"' +
      'class="cbg">' + gt.gettext('Select all') + '</label>').end()
    .find('label[for="report-params-toHide-SELECTALL"]').addClass('span12').attr('style', 'margin-left:0px').end()
    .find('#report-params-toHide-SELECTALL').on('click', function(e){
        var isChecked = $(this).is(':checked');
        $('#fr-report-params-toHide input.toHide').each(function(index, element){
            $(this).attr('checked', isChecked);
        });
    }).attr('checked', $('#fr-report-params-toHide input.toHide').length == 
      $('#fr-report-params-toHide input.toHide:checked').length).end()
    .find('.reg_option_team').change(function(){
      $.post('/admin/reg-option/reg-option-team-type',{regOptionID:$(this).val()},function(data){
        $('#team-type').val(data.type).trigger("liszt:updated");
        $('#team-team_bracket_id').find('optgroup').attr('disabled','disabled');
        $('#team-team_bracket_id').find('optgroup[label="'+data.race+'"]').removeAttr('disabled');
      });
      $.post('/admin/team-bracket/reg-option-team-bracket',{regOptionID:$(this).val()},function(data){
        var options = '';
        for( var i in data) {
          options += "<option value='"+i+"'>"+data[i]+"</option>";
        }
        $("#team-team_bracket_id").html(options).trigger("liszt:updated");
      });
      
      var regOptionID = $(this).val();
      var data = $(this).data();
      var payment = data.payment;
      var regOptionPaymentStructure = payment[regOptionID];
      if(regOptionPaymentStructure == "CAPTAIN_CHOOSE") {
        $('#fr-team-create_payment_type').show();
      } else {
        $('#fr-team-create_payment_type').hide();
      }
    }).end()
    .find('.modal-body').on('click', 'li.swap_result', function(){
      $(this).closest('div.swapBibResults').hide();
      $('#swap_entry').val($(this).find('span.swapName').html())
      $('#swap_entry_id').val($(this).attr('id'))
      $('#bibSwapBib').html($(this).attr('bib'));
      $('#bibSwapTimingTag').html($(this).attr('tag'));
      $('#bibSwapRace').html($(this).attr('race'));
      $('#bibSwapHometown').html($(this).attr('hometown'));
    }).end()
    .find('.device-name').each(function(){
      var width = $(this).find('a span.name').width();
      if (width < 80) {
        width = 50;
      }
      $(this).find('a').width(width+12);
      $(this).width(width+28);
      $(this).find('.full-view').width(width+24).css('margin-left','2px');
    }).end()
    .find('.device-name a').on('click', function() {
      var border;
      if ($(this).parent().hasClass('collapsed')) {
        border = 0;
      } else {
        border = 6;
      }
      $(this).css('border-bottom-left-radius', border).css('border-bottom-right-radius', border);
      $(this).css('-webkit-border-bottom-left-radius', border).css('-webkit-border-bottom-right-radius', border);
      $(this).css('-moz-border-radius-bottomleft', border).css('-moz-border-radius-bottomright', border);
    }).end()
    .find('#event_waiver-rules-STANDARD').each(function(index, element){
      if ($(element).is(':checked')) {
        $('#fr-event_waiver-scroll').hide();
      }
    }).end()
    .find('#event-remove_timer').each(function(index,element){
      if(!$(this).is(':checked')) {
        $('*[id^="fr-event"]' ).hide();
        $('*[id^="fr-event"]' ).attr('display', 'none');
        $(this).parent().show();
        $('input[class*="timer_id-dep"], select[class*="timer_id-dep"]' ).attr("disabled", "disabled");
        $('*[class*="timer_id-dep"]' ).val("");
        $("#event-timer_id").val("_NEW_").trigger("liszt:updated");
      }
    }).end()
    .find('.waiver_rules').each(function(index,element){
      $(element).on('click', function(){
        if ($(element).val() == 'STANDARD' && $(element).is(':checked')) {
           $('#fr-event_waiver-scroll').hide();
           $('#event_waiver-scroll').attr('checked', false); 
        } else {
           $('#fr-event_waiver-scroll').show();
        }
      });
    }).end()
    .find('input[name="bracket_rule[type]"]:checked').each(function(){
      $(this).trigger('click');
    }).end()
    .find('#swap_entry').on('keyup', function(){
      var $search = $(this);
      swapTimeout = setTimeout(function(){
        if(!searchingSwapEntry) {
          searchingSwapEntry = true
          $.post('/admin/entry/swap-bibs-search', 
                {swap_entry:$search.val(), eventID:$('#eventID').val(), excludeEntryID:$('#entryID').val()}, function(data) {
            var results = '<ul>';
            $('div.swapBibResults').remove();
            if(data.length) {
              for( var i in data) {
                results += '<li class="swap_result" id="' + data[i]['id'] + '" bib="' + data[i]['bib'] + 
                            '" hometown="' + data[i]['city'] + 
                            '" tag="' + data[i]['tag'] + 
                            '" race="' + data[i]['race_name'] + '">' + 
                            '<span class="swapName">' + data[i]['name'] + "</span> : "  +
                            '<span class="swapBib">' + data[i]['bib'] + "</span>"  +
                          '</li>'
              }
              results += '</ul>';
            } else {
              results += '<li>' + gt.gettext('No results') + '</li></ul>';
            }
            $search.closest('div').append('<div style="margin-left:20px;margin-top:-12px;" class="swapBibResults">' + results + '</div>');
            searchingSwapEntry = false;
          })
        }
      }, 1500);
    }).end()
    .find('.modal-body').on('change', '#create-entry-country', function () {
      if ($(this).val() != 'US') {
        $('#fr-create-entry-city').show();
        $('#fr-create-entry-city label').removeClass('hide');
        $('#fr-create-entry-city input').removeClass('hide');
      }
      else {
        $('#fr-create-entry-city').hide();
      }
    }).end()
    .find('.modal-body').on('change', '.db-update-change-type > input', function(){
      var option = $(this).val();
      if (option === 'single') {
        $('#fr-create-table_item_id label').text(gt.gettext('Enter Exsisting ID (if edit)'));
        $('#fr-create-table_name_multi').hide();
        $('#fr-create-table_name_single').show();
        $('#fr-create-table_name_single label').removeClass('hide');
        $('#fr-create-table_name_single #create_table_name_single_chzn').removeClass('hide');
      }
      else {
        $('#fr-create-table_item_id label').text(gt.gettext('Enter ' + getLabelName('#create-table_name_multi')));
        $('#fr-create-table_name_single').hide();
        $('#fr-create-table_name_multi').show();
        $('#fr-create-table_name_multi label').removeClass('hide');
        $('#fr-create-table_name_multi #create_table_name_multi_chzn').removeClass('hide');
      }
    }).end()
    .find('.modal-body').on('change', '#create-table_name_multi', function() {
      $('#fr-create-table_item_id label').text(gt.gettext('Enter ' + getLabelName('#create-table_name_multi')));
    }).end()
    .find('a.appendButton').on('click', function(event){
      executeAppendButtonAction($(this), $(this).parent().find('input.appendButton-input'), event, 'REMOVE');
    }).end()
    .find('#scoring-entries').each(function(index, element){
      $(this).val(entries);
    }).end()
    .find('.teamBracketRegOption').on('click', function(index, element){
         $(this).closest('tr').find('input[type="radio"]').attr('disabled', !$(this).is(':checked'))
    }).end()
    .find('#fr-team-payment_type').each(function(){
      var regOptionID = $('.reg_option_team').val();
      if(regOptionID == "") {
        $(this).hide();
      }
    }).end()
    .find('.reg_option_team').each(function() {
      var selected = $("#team-team_bracket_id").val();
      $.post('/admin/team-bracket/reg-option-team-bracket',{regOptionID:$(this).val()},function(data){
        var options = '';
        for( var i in data){
          if(selected == i){
            options += "<option value='"+i+"' selected='selected'>"+data[i]+"</option>";
          }
          else {
            options += "<option value='"+i+"'>"+data[i]+"</option>";
          }
        }        
        $("#team-team_bracket_id").html(options);
        $("#team-team_bracket_id").trigger("liszt:updated");
      });
    }).end()
    .find('.toggleReport').each(function(index, element) {
      var check = false;
      $(element).on('click', function() {
        if ($(element).parent().find('.multicheckbox label input').not(':checked').length == 0) {
          check = true;
        }
        if (!check) {
          $(element).parent().find('.multicheckbox label input').prop("checked", true);
          check = true;
        } else {
          $(element).parent().find('.multicheckbox label input').prop("checked", false);
          check = false;
        }
      });
    }).end()
    .find('.hide-form-field,.hide-display-settings').each(function(){
      $(this).closest('.control-group').hide();
    }).end()
    .find('input[type="radio"][name="payee"]').on('change', function(){
      var val = $(this).val();
      if(val == "other") {
        $('#fr-other_org_id').show();
      }
      else {
         $('#fr-other_org_id').hide();
      }
    }).end()
    .find('input[type="radio"][name="payer"]').on('change', function(){
      var val = $(this).val();
      if(val == "athlete") {
        $('#fr-display_setting_athlete').show();
        $('#fr-display_setting_event').hide();
      }
      else {
        $('#fr-display_setting_athlete').hide();
        $('#fr-display_setting_event').show();
      }
    }).end()
    .find('#reapplyWaveRules').on('click', function() {
      showSpinner($(this));
      var href = $(this).attr('href');
      $.post(href,{raceID:$(this).attr('raceID')}, function(data){
        var jGrowl = data.jGrowl;
        if (jGrowl) {
        if(data.status == 1){
          $.jGrowl(gt.gettext(data.msg), {theme:'error'});
        }
        else {
          $.jGrowl(gt.gettext(data.msg), {theme:'success'});
         }
       }
        $("#reapplyWaveRules").busy('hide');
        setTimeout(function() {
          window.location.reload();
        }, 1000);
      });
    }).end()
    .find('#assignbibs-skip_options-skip').click(function(){
          if($(this).val() == "skip"){
              $("#assign-bibs-event-form").removeClass("confirm-overwrite-complete");
          }
     }).end()
    .find('.display-orderable').each(updateDisplayOrder).end()
    .find('.multioption-sortable').each(function(){
      $(this).sortable();
    }).end()
    .find('.promooffer-code-type').on('change', function(){
      if($(this).val() == 'membership') {
        $('#fr-promooffer-event').removeClass('hide');
        $('#promooffer-max_uses').val(1).attr('disabled', 'disabled');
        resizeModal();
      } 
      else {
        $('#fr-promooffer-event').addClass('hide');
        $('#promooffer-max_uses').removeAttr('disabled');
      }
    }).end()
    .find("#fieldset-Create #race-type").each(function() {
      if($(this).val() !== 'multisport' && age_ref_date == ""){
        age_ref_date = $('#race-age_ref_time-date').val();
      }
    })
    .end()
    .find('.email_select_recipients').each(function(){
      $('.fileupload').each(configureFileUploader);
      $('#fr-file').hide();
      $('#is_import').val(0);
      var type = $(this).val();
      if (type=="import") {
        $('#is_import').val(1);
        $('#fr-create-email_list-sort_recipients').hide();
        $('#fr-create-email_list-date-rangeDate').hide();
        $('#fr-file').show();
      }
    }).end()
    .find('.email_select_recipients').change(function(){
      var type = $(this).val();
      if(type=="import") {
        $('#is_import').val(1);
        $('#fr-create-email_list-sort_recipients').hide();
        $('#fr-create-email_list-date-rangeDate').hide();
        $('#fr-file').show();
        return false;
      }
      $('#is_import').val(0);
      $('#fr-create-email_list-sort_recipients').show();
      $('#fr-create-email_list-date-rangeDate').show();
      $('#fr-file').hide();
      $('#overlay').append('<div class="spinner"><div class="inner"></div></div>');
      $.get('/admin/email-list/get-sort-recipients/sortType/'+type,function(data){
        var html = '';
        for(var key in data) {
          html += '<option value="'+key+'">'+data[key]+'</option>';
        }
        $("#overlay").find(".spinner").remove();
        $('#create-email_list-sort_recipients').html(html);
        $('#create-email_list-sort_recipients').trigger("liszt:updated");
      });
      return true;
    }).end()
     .find('#promooffer-code_codes').each(function() {
      $('#file').each(configureFileUploader);
      $('.fr-file').hide();
      var type = $(this).val();
      if (type == "import") {
        $('.fr-code_format').hide();
        $('.fr-no_of_codes').hide();
        $('.fr-file').show();
      }
    }).end()
    .find('#promooffer-code_codes').change(function() {
      var type = $(this).val();
      if (type == "import") {
        $('.fr-code_format').hide();
        $('.fr-no_of_codes').hide();
        $('.fr-file').show();
        return false;
      }
      
      $('.fr-code_format').show();
      $('.fr-no_of_codes').show();
      $('.fr-file').hide();
      
      return true;
    }).end()
    .find('.custom_question_hidden').each(function(index, element){
        $(element).parent().hide();
    }).end()
    .find('.pmalloc').change(function() {
      var val   = $("input:radio[name='payee_allocation']:checked").val();
      var payer = val == '1' ? 'athlete' : 'event';
      $('#payer-' + payer).attr('checked', 'checked');
    })
    .end()
    .find('#custom_fee-event_id').change(function() {
      var val              = $(this).val();
      var regChoicesParent = $('#fr-custom_fee-rules_REG_OPTION').find('.multicheckbox');
      var productsParent   = $('#fr-custom_fee-rules_PRODUCT').find('.multicheckbox');
      if (val == 'all') {
        var otherElements = regChoicesParent.find('label');
        otherElements.each(function(index, value) {
          if ($(value).find('input').attr('id') != 'custom_fee-rules_REG_OPTION-all') {
            $(value).remove();
          }
        });
        $('#custom_fee-rules_REG_OPTION-all').attr('checked', true);

        var otherElements = productsParent.find('label');
        otherElements.each(function(index, value) {
          if ($(value).find('input').attr('id') != 'custom_fee-rules_PRODUCT-all') {
            $(value).remove();
          }
        });
        $('#custom_fee-rules_REG_OPTION-all').attr('checked', true);
      } else {
        $('#overlay').append('<div class="spinner"><div class="inner"></div></div>');
        $.post('/admin/event/get-reg-choices-and-products',{eventID:val},function(data) {
          var otherElements = regChoicesParent.find('label');
          otherElements.each(function(index, value) {
            if ($(value).find('input').attr('id') != 'custom_fee-rules_REG_OPTION-all') {
              $(value).remove();
            }
          });
          $.each( data['REG_OPTION'], function( key, value ) {
            regChoicesParent.append('<label class="fl200 inline checkbox" for="custom_fee-rules-REGOPTION-' + key + '"><input type="checkbox" name="custom_fee[rules_REG_OPTION][]" id="custom_fee-rules-REGOPTION-' + key + '" value="' + key + '" class="cbg rules_reg_choice rules_REG_OPTION" arrtostr="">' + value + '</label>');
          });
          var otherElements = productsParent.find('label');
          otherElements.each(function(index, value) {
            if ($(value).find('input').attr('id') != 'custom_fee-rules_PRODUCT-all') {
              $(value).remove();
            }
          });
          if (data['PRODUCT']) {
            $.each( data['PRODUCT'], function( key, value ) {
              productsParent.append('<label class="fl200 inline checkbox" for="custom_fee-rules-PRODUCT-' + key + '"><input type="checkbox" name="custom_fee[rules_PRODUCT][]" id="custom_fee-rules-PRODUCT-' + key + '" value="' + key + '" class="cbg rules_reg_choice rules_PRODUCT" arrtostr="">' + value + '</label>');
            });
          }
          $('.spinner').remove();
        });
      }
    }).end()
    .find('#custom_fee-rules_REG_OPTION-all').on('click', function() {
      if ($(this).is(':checked')) {
        var parent        = $(this).closest('.multicheckbox');
        var otherElements = parent.find('label');
        otherElements.each(function(index, value) {
          var checkbox = $(value).find('input');
          if (checkbox.attr('id') != 'custom_fee-rules_REG_OPTION-all') {
            checkbox.attr('checked', false);
          }
        });
      }
    }).end()
    .find('.rules_REG_OPTION').live('change', function() {
      if ($(this).is(':checked') && $(this).attr('id') != 'custom_fee-rules_REG_OPTION-all') {
        $('#custom_fee-rules_REG_OPTION-all').attr('checked', false);
      }
    }).end()
    .find('#custom_fee-rules_PRODUCT-all').on('click', function() {
      if ($(this).is(':checked')) {
        var parent        = $(this).closest('.multicheckbox');
        var otherElements = parent.find('label');
        otherElements.each(function(index, value) {
          var checkbox = $(value).find('input');
          if (checkbox.attr('id') != 'custom_fee-rules_PRODUCT-all') {
            checkbox.attr('checked', false);
          }
        });
      }
    }).end()
    .find('.rules_PRODUCT').live('change', function() {
      if ($(this).is(':checked') && $(this).attr('id') != 'custom_fee-rules_PRODUCT-all') {
        $('#custom_fee-rules_PRODUCT-all').attr('checked', false);
      }
    }).end()
    .find('#custom_question_add_athlete').on('click', function(){
      $('.custom_question_hidden').each(function(index, element){
        $(element).parent().toggle();
      });
      resizeModal();
    }).end()
    .find('#fieldset-Create #race-type').live('change', function(){
      if($(this).find('option:selected').val() == 'multisport') {
        $('#fr-race-course_distance').hide();
        $('#fr-race-multisport_distance').show();
        $('#fr-race-course_info-action').show();
        $('.fr-legdistance').show();
        var startTime = $('#race-planned_start_time-date').val();
        var year = startTime.substr(startTime.lastIndexOf('/') + 1);
        $('#race-age_ref_time-date').val('12/31/' + year);
      }
      else {
        if($(this).val() !== 'untimed') {
          $('#fr-race-course_distance').show();
        }
        $('#fr-race-multisport_distance').hide();
        $('#fr-race-course_info-action').hide();
        $('.fr-legdistance').hide();
        if(previous == "multisport"){
          $("#race-age_ref_time-date").val(age_ref_date);
        }
      }
      resizeModal();
      previous = $(this).val();
    }).end()
    .find('.payment-token').each(function(){
      $(this).closest('form').addClass('payment-form-with-token');
    }).end()
    .find('#race-multisport_distance').on('change', function(){
      var raceCourse = $('#race_course_pattern').val();
      raceCourse     = $.parseJSON(raceCourse);
      var value      = $(this).find('option:selected').val();
      var num        = 0;

      $.each(raceCourse[value], function(index, element){
        if (typeof($('#race-course_info-'+num+'-type').val()) == 'undefined') {
          $('#addAnotherLegType').trigger('click');
        }
        $('table.tableLegTypes tbody tr:eq('+num+') td select.distance-select').val(index);
        $('table.tableLegTypes tbody tr:eq('+num+') td select.distance-select').trigger("liszt:updated");
        $('table.tableLegTypes tbody tr:eq('+num+') td input.legDistance').val(element.distance);
        $('table.tableLegTypes tbody tr:eq('+num+') td select.unitSelect').val(element.unit);
        $('table.tableLegTypes tbody tr:eq('+num+') td select.unitSelect').trigger("liszt:updated");
        num++;
      });
      $.each($('table.tableLegTypes tbody').children(), function(index, element) {
        if (index > 2)
          $(element).remove();
      });
           
      var total = calculateDistance();
      $('span#totalDistance').html(total);
      $('#race-course_distance-distance').val(total);
    }).end()
    .find('.range_slider').on('change', function() {
      $('.range_slider_val').html($(this).val());
    }).end()
    .find('#event_camera-photo_sync_range').on('change', function() {
      var msg = null;
      if ($(this).val() == 1) {
        msg = gt.gettext("second before and after Tag Read.");
      }
      else {
        msg = gt.gettext("seconds before and after Tag Read.");
      }
      $('.range_slider_msg').text(msg);
    }).end()
    .find('#fr-race-subtype').each(function(){
      initRaceSubtype($('#race-type').val(), false);
      toggleUntimed($('#race-type').val());
    }).end()
    .find('#race-type').on('change', function(){
      var type = $(this).val();
      initRaceSubtype(type, true);
      toggleUntimed(type);
    }).end()
    .find('#edit-interval-form #interval-pace_display_unit').each(function () {
      var selectedValue = $(this).val();
      if(selectedValue != 'none') {
        $('[for|="interval-default_pace"]').append('*');
        $('[for|="interval-flag_under_pace"]').append('*');
        $('[for|="interval-flag_over_pace"]').append('*');
      }
    }).end()
    .find('#checkpoint-distance_from_start-distance').on('keyup',function(){
      if($(this).val() !== "") {
        $('.min_accepted_time_auto_populate').removeClass('hide');
      } else {
        $('.min_accepted_time_auto_populate').addClass('hide');
      }
    }).end()
    .find('##checkpoint-time_selection_type').on('change',function(){
      if($(this).val() == "F") {
        $('.max_accepted_time_auto_populate').removeClass('hide');
      } else {
        $('.max_accepted_time_auto_populate').addClass('hide');
      }
    }).end()
    .find('.min_accepted_time_auto_populate').on('click',function(){
      countAutoMinMaxAcceptedTime('min');
    }).end()
    .find('.max_accepted_time_auto_populate').on('click',function(){
      countAutoMinMaxAcceptedTime('max');
    }).end()
    .find('#fr-race-legdistance').on('change','.unitSelect, .legDistance', function() {
      var total = calculateDistance();
      $('span#totalDistance').html(total);
      $('#race-course_distance-distance').val(total);
    }).end()
    .find("#fieldset-Edit #fr-race-type #race-type").each(function() {
      if($('#race-type').find('option:selected').val() == 'multisport') {
        $('#fr-race-multisport_distance').show();
        $('#fr-race-legdistance').show();
        $('#fr-race-course_info-action').show();
        $('#fr-race-course_distance').hide();
        $('#fr-race-wants_penalties').hide();
      }
    }).end()
    .find("#fieldset-Edit #fr-race-type #race-type").live('change', function() {
      if($(this).find('option:selected').val() == 'multisport') {
        $('#fr-race-course_distance').hide();
        $('#fr-race-multisport_distance').show();
        $('#fr-race-course_info-action').show();
        $("#race-multisport_distance").change();
        $('.fr-legdistance').show();
        var startTime = $('#race-planned_start_time-date').val();
        var year = startTime.substr(startTime.lastIndexOf('/') + 1);
        $('#race-age_ref_time-date').val('12/31/' + year);
      }
      else {
        if($(this).val() !== 'untimed') {
          $('#fr-race-course_distance').show();
        }
        $('#fr-race-multisport_distance').hide();
        $('#fr-race-course_info-action').hide();
        $('.fr-legdistance').hide();
        //$('#race-age_ref_time-date').val('');
      }
      resizeModal();
    }).end()
    .find('input.select-all-in-row').click(function(){
      var i = $(this).closest('th').index();
      var isChecked = $(this).is(':checked');
      $(this).closest('table').find('tbody').children('tr').each(function() {
        $(this).find('td:eq(' + i + ') > input').attr('checked', isChecked);
      });
      $(this).closest('table').find('input.add-on-blur').trigger('blur');
    }).end()
    .find('#report-params-all_or_specific-all').click(function() {
      $('.fr-specific_events').hide();
    }).end()
    .find('#report-params-all_or_specific-specific').click(function() {
      $('.fr-specific_events').show();
    }).end()
    .find('#report-org_id').on('change', function() {
      if ($('.fr-specific_events').is(':visible')) {
        $('.fr-specific_events').find('.chzn-container').hide();
        $('.fr-specific_events').append('<div class="spinner"><div class="inner"></div></div>');
          var orgID = $('#report-org_id').val();
          if (orgID) {
            $.get('/admin/event/search-by-org/orgID/'+orgID,function(data) {
              var htmlSelect = '';
              for(var i=0; i<data.length; i++) {
                var mat = data[i];
                htmlSelect += '<option label="'+mat.name+'" value="'+mat.id+'">'+mat.name+'</option>';
              }
              var selectObject = $('#report-params-specific_events');
              selectObject.show().removeClass('chzn-done')
              selectObject.next().remove()
              selectObject.html(htmlSelect)
              selectObject.chosen({disable_search_threshold: 5});
              selectObject.trigger('liszt:updated');
              $('#overlay').find('.spinner').remove();
            });
          }
      }
    }).end()
    .find('input.add-on-blur').on('blur', sumarizeColumn).end()
    .find('input.select-table-row').on('click', function(){
      $(this).closest('tr').find('input.add-on-blur').trigger('blur');
    }).end()
    .find('#reg_transaction-cc_for_charge-CARDONFILE, #reg_transaction-cc_for_charge-NEWCARD').on("click", function(){
      var isDisabled = $(this).val() == 'CARD_ON_FILE' ? true : false;
      $('#card-cardName, #card-cardNumber, #card-cardExpires, #card-cardCode, #card-paymentToken').attr('disabled', isDisabled);
      if(isDisabled) {
        $('#card-cardName, #card-cardNumber, #card-cardExpires, #card-cardCode, #card-paymentToken').addClass('disabled');
      }
      else {
        $('#card-cardName, #card-cardNumber, #card-cardExpires, #card-cardCode, #card-paymentToken').removeClass('disabled');
      }
    }).end()
    .find('.datacheck_wave_list').each(function(){
        var raceID = $('.change_dropdown_race').val();
        var selectMenu = $(this);
        $('#overlay').append('<div class="spinner"><div class="inner"></div></div>');
        $.post('/admin/scoring/get-waves',{raceID:raceID},function(data){
          var htmlSelect = "";
          for(var i=0; i<data.length; i++) {
              var wave = data[i];
              htmlSelect += '<option label="'+wave.name+'" value="'+wave.id+'">'+wave.name+'</option>';
          }
          selectMenu.html(htmlSelect).trigger("liszt:updated");
          $('#overlay').find('.spinner').remove();
        });
    }).end()
    .find('.change_dropdown_race').live("change",function(){
        var raceID = $(this).val();
        $.post('/admin/scoring/get-waves',{raceID:raceID},function(data){
          var htmlSelect = "";
          for(var i=0; i<data.length; i++) {
              var wave = data[i];
              htmlSelect += '<option label="'+wave.name+'" value="'+wave.id+'">'+wave.name+'</option>';
          }
          $('select.datacheck_wave_list').html(htmlSelect);
          $('select.datacheck_wave_list').trigger("liszt:updated");
        });
    }).end()
    .find('.duplicate_dropdown').each(function(){
        $(this).closest('.row-fluid').hide();
        var val = $('.duplicate_bracket:checked').val();
        $('.duplicate_bracket_'+val).closest('.row-fluid').show();
    }).end()
    .find('.change_dropdown').each(function(){
        $(this).closest('.row-fluid').hide();
        var val = $('.datacheck_change_type:checked').val();
        $('.change_type_'+val).closest('.row-fluid').show();
    }).end()
    .find('.duplicate_bracket').live('click',function(){
        $('.duplicate_dropdown').closest('.row-fluid').hide();
        var val = $('.duplicate_bracket:checked').val();
        $('.duplicate_bracket_'+val).closest('.row-fluid').show();
    }).end()
    .find('.datacheck_change_type').live('change',function(){
        $('.change_dropdown').closest('.row-fluid').hide();
        var val = $('.datacheck_change_type:checked').val();
        $('.change_type_'+val).closest('.row-fluid').show();
    }).end()
    .find('.reload-page').click(
      function () {
          window.location.reload();
          return false;
    }).end()
    .find('#event_camera-type').each(function() {
      $('#fr-event_camera-photo_sync_range').toggle($(this).val() === "PHOTO");
    }).end()
    .find('#interval-iv_type').each(function() {
      if($('#isMultisport').val() === '1' && $('#isLeg').val() === '1') {
        //do not do anything if is leg and multisport
        return;
      }
      $('#interval-begin_checkpoint_id')
        .prop('disabled', $(this).val() === 'course')
        .trigger('liszt:updated');
    }).end()
    .find('#interval-iv_type').on('change', function() {
      if($('#isMultisport').val() === '1' && $('#isLeg').val() === '1') {
        //do not do anything if is leg and multisport
        return;
      }
      var isCourse = $(this).val() === 'course', beginCp = '#interval-begin_checkpoint_id';
      $(beginCp).prop('disabled', isCourse);
      if(isCourse) {
         $(beginCp).val($(beginCp + " option:first").val());
      }
      $(beginCp).trigger('liszt:updated');
    }).end()
    .find("#regchoice-team_payment_structure-PERMEMBER").each(function(){
      if($("#regchoice-team_payment_structure-PERMEMBER:checked").val() == 'PER_MEMBER') {
        $("#regchoice-team_payment_structure-PERMEMBER").parent().after($('#fr-regchoice-advanced_payment_structure > div.multiradio').children().css('margin-left', '50px') );
      }
      else {
        $('#fr-regchoice-advanced_payment_structure').hide();
      }
      resizeModal();
    }).end()
    .find("#regchoice-team_payment_structure-PERMEMBER").click(function(){
      $(this).parent().after($('#fr-regchoice-advanced_payment_structure > div.multiradio').children().css('margin-left', '50px') );
      $('.has_payment').show();
      resizeModal();
    }).end()
    .find("#regchoice-team_payment_structure-FLATRATE").click(function(){
      $('.has_payment').hide();
      resizeModal();
    }).end()
    .find('.table-box table tbody tr').hover(function () {
      if(!$(this).hasClass('warning')) {
        $(this).addClass('warning');
      } else {
        $(this).addClass('warning');
      }
      }, function () {
        $(this).removeClass('warning');
      })
    .end()
    .find('#edit-checkpoint-form #fr-checkpoint-devices .checkbox, #edit-timing-device-form #fr-timing_device-checkpoint_id .checkbox ').on('change' , function() {
      if($('#device_ids').size() > 0) {
        var posibleWarning = JSON.parse($('#device_ids').val());
        var warningForPrinting = [];
        $('.device-checkbox, .point-checkbox').each(function(i, e) {
          if(posibleWarning.indexOf($(e).val()) > -1) {
            if($(e).attr('checked') === 'checked') {
              warningForPrinting.push($(e).parent().text());
            }
          }
        });
        
        if(warningForPrinting.length === 0) {
          $('.alert-device-text').hide();
        } else {
          var html = warningForPrinting.length === 1 ? $('#singular_message').val() : $('#plural_message').val();
          warningForPrinting = warningForPrinting.join(', ');
          html = sprintf(html, "<strong>" + warningForPrinting + "</strong>");
          $('.alert-device-text').removeClass('hidden').text('').html(html).show();
        }
      }
    }).end()
    .find('#location_same_as_organizer').on('click', function() {
      //check for form and add prefix
      var formType = $(this).closest("form").attr("id");
      var context = "";
      if(formType == "edit-event-form"){
          context = "payment_location";
      } else if(formType == "create-event-form"){
          context = "payment_location";
      }
      var dataInfo = new Object();
      dataInfo.country = $("#payee-"+context+"-country").data().countryId;
      dataInfo.postal_code = $("#payee-"+context+"-postal_code").attr('data-postal-code');
      dataInfo.time_zone = $("#payee-"+context+"-time_zone").attr('data-time-zone');
      dataInfo.regionId = $("#payee-"+context+"-region_id").data().regionId;
      dataInfo.city = $("#payee-"+context+"-city").data().cityName;
      dataInfo.street = $("#payee-"+context+"-street").data().street;
      dataInfo.street2 = $("#payee-"+context+"-street2").data().street2;
      $("#payee-"+context+"-country").val(dataInfo.country).trigger("liszt:updated");
      $("#payee-"+context+"-postal_code").val(dataInfo.postal_code);
      $("#payee-"+context+"-time_zone").val(dataInfo.time_zone).trigger("liszt:updated");
      $("#payee-"+context+"-time_zone");
      $("#payee-"+context+"-city").val(dataInfo.city);
      $("#payee-"+context+"-street").val(dataInfo.street);
      $("#payee-"+context+"-street2").val(dataInfo.street2);
      updateRegionInfo(dataInfo.country, dataInfo.regionId, "#payee-"+context+"-region_id");
    }).end()
    .find('.unpublish_video').click(function(){
      var videoID = $(this).data('videoId');
      window.location.href = '/admin/event-video/unpublish/id/'+videoID;
    }).end()
    .find('.publish_video').click(function(){
      var camera = $(this).data('camera');
      var videoName = $(this).data('name');
      window.location.href = '/admin/event-video/publish/camera/'+camera+'/name/'+videoName;
    }).end()
    .find('#fr-want_publish_video label').each(function(){
      $(this).addClass('longLabel');
    }).end()
    .find('.jwPlayerVideo').each(function(){
        var data        = $(this).data();
        var videoUrl    = data.videoPath;
        var thumbPic    = data.videoThumb;
        var duration    = data.videoDuration;
        var start       = data.videoStart;
        var width       = parseInt(data.videoWidth, 10);
        var height      = parseInt(data.videoHeight, 10);
        var provider    = data.videoStreamDisable ? '' : 'rtmp';
        var streamer    = data.videoStreamDisable ? '' : 'rtmp://' + data.videoStreamer + '/cfx/st';
        if(!width) {
          width = 640;
        }
        if(!height) {
          height = 480;
        }
        var jwBase   = data.cdnHost + '/' + data.jwplayerBucket + '/';
        var ext      = videoUrl.split('.').pop().toLowerCase();
        var filePath = (provider == 'rtmp') ? streamer + ext + ':' + videoUrl : videoUrl;   
        
        $.getScript(jwBase + "jwplayer.js")
            .done(function(script, textStatus) {
            jwplayer.key = data.jwplayerKey;
            var seek = false;
            var config = {
              flashplayer: jwBase + "jwplayer.flash.swf",
              playlist: [{
                  file: filePath,
                  start: start, 
                  durationTime: duration
              }],
              image: thumbPic,
              height: height,
              width: width,
              repeat: 'list',
              primary: 'flash',
              events: {
                onPause: function(event){
                  if($("#eventVideo-paused_at").size() == 1){
                      $("#eventVideo-paused_at").val(this.getPosition());
                  }
                },
                onPlay: function(event) {
                  if (!seek) {
                    jwplayer().seek(start);
                    seek = true;
                  }
                  var item = jwplayer().getPlaylistItem();
                  jwplayer().onTime(function(currentVideo) {
                    if (jwplayer().getPosition() > item.durationTime) {
                      jwplayer().stop();
                      seek = false;
                    }
                  });
                }
              }
            };
            jwplayer("jwPlayerVideo").setup(config);
           });
        }
    )
    .end()
    .find('.sub-object-edit').live('change', handleSubObjectEdit).end()
    .find('.popup').on('click', handlePopup).end()
    .find('.utabs').each(handleTabs).end()
    .find('label.infield').inFieldLabels().end()
    .find('input.token-input').each(
    function () {
      var val = $.trim($(this).val());
      if (val.length > 0) {
        val = val.length ? JSON.parse(val) : null;
        $(this).val("");
      }
      else {
        val = null;
      }
      var config = {
        prePopulate:      val,
        preventDuplicates:true
      };
      var c = $(this).data('tokenInputConfig');
      if (typeof c == "undefined") {
        c = {};
        var data = $(this).data();
        for (var i in data) {
          if (i.substr(0, 10) == 'tokenInput') {
            var key = i.substr(10, 1).toLowerCase() + i.substr(11);
            c[key] = data[i];
          }
        }
      }
      $.extend(config, c);
      var cb = {onAdd:1, onDelete:1, onResult:1, onReady:1};
      for (var k in cb) {
        if (typeof config[k] == 'string') {
          config[k] = eval(config[k]);
        }
      }
      $(this).tokenInput(config.url, config);
    }).end()
    .find('.btn-file').click(function(){
      var file = $(this).closest('.fileupload.fileupload-new').find('input:file').click();
    }).end()
    .find('input[type="file"]').live("change", function() {
      $(this).parent().find('.fileupload-preview').html($(this).val());
    }).end()
    .find('input.usearch').each(
    function () {
      $(
        '<span class="ui-icon ui-icon-search"></span>'
      ).css({
              'display': 'inline-block',
              'position':'relative',
              'top':     '0.3em',
              'left':    '-1.7em',
              'opacity': 0.5
            }).insertAfter($(this));
    }).end()
    .find('.product-question-report').on('click',function() {
      if (!$(this).hasClass('checkbox')) {
        var element = $(this);
        var parent = element.closest('.row-fluid');
        parent.find('input[type="checkbox"]').each(function() {
          if (element.hasClass('select-all') && !$(this).is(':checked')) {
            $(this).prop( "checked", true );
          }
          if (element.hasClass('unselect-all') && $(this).is(':checked')) {
            $(this).prop( "checked", false );
          }
        });
        element.toggleClass('select-all');
        element.toggleClass('unselect-all');
      }
    }).end()
    .find('.prod_type').on('click',function() {
      var prodType = $(this).val();
      $.post('/admin/display-group-element/get-product-questions',{prodType: prodType},function(data) {
        var htmlChk = "";
        $.each(data, function(k,v){
            htmlChk += '<label class="fl200 checkbox" for="report-params-customElements-'+k+'">\n\
             <input type="checkbox" name="report[params][customElements][]" id="report-params-customElements-'+k+'" value="'+k+'" class="cbg xnColumns">\n\
             '+v+'</label>';
          });
        
        if (htmlChk == "") {
          htmlChk += gt.gettext("There are no product questions in this event that match the selected product type."); 
        }
        $('.fr-customElements > .multicheckbox').html(htmlChk);
      });
    }).end()
    .find('.ubutton,input:submit').each(function(){
      $(this).addClass('btn');
    }).end()
    .find('.ajax-chosen').each(function(){
      var data = $(this).data();
      var url = data.url;
      var maxOptions = data.maxSelectedOptions ? {max_selected_options: data.maxSelectedOptions} : {};
      $(this).ajaxChosen({
          type: 'GET',
          url: url,
          dataType: 'json'
      }, function (data) {
          var results = [];
          $.each(data, function (i, val) {
              results.push({value: val.id, text: val.name});
          });
          return results;
      },
      maxOptions);
    }).end()
    .find('select:not(.ajax-chosen):not(.skip_chzn)').each(function(){
      $(this).chosen({disable_search_threshold: 10, search_contains: true});
    }).end()
    .find('.add-tooltip').each(function(){
      var data = $(this).data();
      var placement = 'top';
      if(data.placement) {
        placement = data.placement;
      }
      $(this).tooltip({placement: placement});
    }).end()
    .find('.uicon').each(applyButtonIcon).end()
    .find('.split-button').each(applySplitButtonStyles).end()
    .find('.country').each(
    function () {
      countryRegionPostalInit($(this).closest('form'));
    }).end()
    .find('select.timing-device-select').change(function(){
      var timingDeviceID = $(this).val();
      if(timingDeviceID == '') {
        return;
      }
      $.get('/admin/timing-device/list-timing-mats/timingDeviceID/'+timingDeviceID,function(data){
        var htmlSelect = "";
        var element = $('div.athleteFirstRead div:nth-child(1) input:radio');
        for(var i=0; i<data.length; i++) {
            var mat = data[i];
            if(i == 0) {
              if(mat.disableAthleteFirstRead) {
                element.attr('disabled', 'disabled');
                if (element.is(':checked')) {
                  element.removeAttr('checked');
                  $('div.athleteFirstRead div:nth-child(1) .crossing-time-element-holder input').attr('disabled', 'disabled');
                  $('div.athleteFirstRead div:nth-child(1) .crossing-time-element-holder input').addClass('disabled');
                  $('div.athleteFirstRead div:nth-child(1) .crossing-time-element-holder').addClass('grayed');
                  $('div.athleteFirstRead div:nth-child(2) input').attr('checked', 'checked');
                  $('div.athleteFirstRead div:nth-child(2) .crossing-time-element-holder input').removeAttr('disabled');
                  $('div.athleteFirstRead div:nth-child(2) .crossing-time-element-holder input').removeClass('disabled');
                  $('div.athleteFirstRead div:nth-child(2) .crossing-time-element-holder').removeClass('grayed');
                }
             }
              else {
                 if (element.val() != 'CourseTimeFromAthletesStartReadhhmmssmsampm') {
                    element.removeAttr('disabled');
                 }
               }

            }
            htmlSelect += '<option label="'+mat.name+'" value="'+mat.id+'">'+mat.name+'</option>';
        }
        $('#chip_time-timing_mat_id').html(htmlSelect).trigger("liszt:updated");
      });
    }).end()
    .find('#ver-nav a').click(function(e) {
      e.preventDefault();
      $(this).tab("show");
    }).end()
    .find('.download-menager-btn').on('click',function(){
      $('.modal').modal('hide');
    }).end()
    .find('.check-race-change').on('click', function() {
      var singleRace = $('#single_race_id');
      if (singleRace.length) {
        var checkedInputs = $('#edit-reg-option-form #fr-regchoice-race_id input:checked');
        if (checkedInputs.length == 1 ) {
          if (checkedInputs.val() != singleRace.val()) {
            var status = confirm(gt.gettext('All existing entries associated with this registration choice will be updated to the newly selected race. Click "Ok" to continue.'));
            if(!status){
              return false;
            }
          }
        }        
      }
    }).end()
    .find('#fr-reg_options label').on("click", function() {
      if ($(this).next('.multicheckbox').find('input[type=checkbox]').prop('checked')) {
        $(this).next('.multicheckbox').find('input[type=checkbox]').prop('checked', false);
      }
      else {
        $(this).next('.multicheckbox').find('input[type=checkbox]').prop('checked', true);
      }
    }).end()
    .find('select.timing-device-select').each(function(){
      var timingDeviceID = $(this).val();
      var timingMatID = $('#chip_time-timing_mat_id').val();
      $.get('/admin/timing-device/list-timing-mats/timingDeviceID/'+timingDeviceID,function(data){
        var htmlSelect = "";
        var element = $('div.athleteFirstRead div:nth-child(1) input:radio');
        for(var i=0; i<data.length; i++) {
            var mat = data[i];
            if(i == 0) {
              if(mat.disableAthleteFirstRead) {
                element.attr('disabled', 'disabled');
                if (element.is(':checked')) {
                  element.removeAttr('checked');
                  $('div.athleteFirstRead div:nth-child(1) .crossing-time-element-holder input').attr('disabled', 'disabled');
                  $('div.athleteFirstRead div:nth-child(1) .crossing-time-element-holder input').addClass('disabled');
                  $('div.athleteFirstRead div:nth-child(1) .crossing-time-element-holder').addClass('grayed');
                  $('div.athleteFirstRead div:nth-child(2) input').attr('checked', 'checked');
                  $('div.athleteFirstRead div:nth-child(2) .crossing-time-element-holder input').removeAttr('disabled');
                  $('div.athleteFirstRead div:nth-child(2) .crossing-time-element-holder input').removeClass('disabled');
                  $('div.athleteFirstRead div:nth-child(2) .crossing-time-element-holder').removeClass('grayed');
                }
              } 
              else {
                if (element.val() != 'CourseTimeFromAthletesStartReadhhmmssmsampm') {
                    element.removeAttr('disabled');
                 }
              }
            }
            htmlSelect += '<option label="'+mat.name+'" value="'+mat.id+'">'+mat.name+'</option>';
        }
        $('#chip_time-timing_mat_id').html(htmlSelect);
        $('#chip_time-timing_mat_id').val(timingMatID).trigger("liszt:updated");
      });
    }).end()
    .find('.crossing-time-radio').click(function(){
      $('.crossing-time-element-holder').addClass('grayed');
      $('.crossing-time-element-holder input').addClass('disabled');
      $('.crossing-time-element-holder input').attr('disabled','disabled');
      $(this).parent().find('.crossing-time-element-holder').removeClass('grayed');
      $(this).parent().find('.crossing-time-element-holder input').removeClass('disabled');
      $(this).parent().find('.crossing-time-element-holder input').removeAttr('disabled');
    }).end()
    .find('.crossing-time-radio:checked').each(function(){
      $('.crossing-time-element-holder').addClass('grayed');
      $('.crossing-time-element-holder input').addClass('disabled');
      $('.crossing-time-element-holder input').attr('disabled','disabled');
      $(this).parent().find('.crossing-time-element-holder').removeClass('grayed');
      $(this).parent().find('.crossing-time-element-holder input').removeClass('disabled');
      $(this).parent().find('.crossing-time-element-holder input').removeAttr('disabled');
    }).end()
    .find('.form-text-date').each(
      function () {
        $(this).attr('style', 'font-size:12px !important;');
        var val         = $(this).val();          
        var formatDate  = $(this).parent().attr('data-date-format');
        if(!val) {
          $(this).parent().datepicker();
        } else if (/(\d{4})-(\d{1,2})-(\d{1,2})/.test(val)) {
          var date = null;
          if (formatDate == "mm/dd/yyyy") {
            date = RegExp.$2 + '/' + RegExp.$3 + '/' + RegExp.$1;
          }
          else {
            date = RegExp.$3 + '/' + RegExp.$2 + '/' + RegExp.$1;
          }
          if (!$(this).hasClass('disabled')) {
            $(this).val(date).parent().datepicker('setValue', date);
            $(this).parent().datepicker().on('changeDate', function(ev) {
              $(this).datepicker('hide');
            });
          }
          else {
            $(this).val(date);
          }
        }
    }).end()
    .find('.form-text-time').each(
    function () {
      var timeF  = $(this).attr("time-format");
      var config = {showOn: 'button', button: '.timepicker_button_trigger', timeFormat:timeF, dropdown: false};
      $(this).timepicker(config);
    }).end()
    .find('.form-text-date').live('blur', function(){
      var val = $(this).val();
      val = createFromatedDate(val);
      val = !val ? '' : val;
      var formatDate  = $(this).parent().attr('data-date-format');
      switch (formatDate) {
        case "mm/dd/yyyy":
          var month = val.split("/").shift();
          break;
        case "dd/mm/yyyy":
          var month = val.split("/")[1];          
          break;
      }
      if (month != 'undefined') {
        if (parseInt(month, 10) > 12) {
            $(this).parent().addClass('error');
            return false;
        }
        else {
          $(this).parent().removeClass('error');
        }
      }
      if (/(\d{1,2})\/(\d{1,2})\/(\d{4})/.test(val)) {
        $(this).parent().attr("data-date", val);
        $(this).parent().datepicker('setValue', val);
      }
    }).end()
    .find('.date > input').on('blur', function() {
      var formatedDate = "";
      var date = $(this).val();
      if ($(this).hasClass('birthdate')) {
        formatedDate = createFromatedDate(date, true);
      }
      else {
        formatedDate = createFromatedDate(date);
      }
      
      if (formatedDate) {
        $(this).val(formatedDate);
      }
      $(this).trigger('change');
    }).end()
    .find('.form-text-time-millis').on('change', function () {
      var t = $(this).val();
      if(t!="") {
        var h = 0, m = 0, s = 0, ms = 0;
        if ($(this).attr('time-format') != 'HH:mm') {
          var patern = new RegExp(pmTranslate + "?\s*$", 'gi');
          var ap = patern.test(t) ? pmTranslate : amTranslate;
          var n = t.replace(/[^0-9:\.]/g, "").replace(/[:\.]+/g, ":");
          var na = n.split(/:/);
          if (na.length > 0) {
              h = parseInt(na[0].replace(/^0/, ""), 10) % 24;
              if (h > 12) {
              ap = "PM";
              h -= 12;
              }
              if (h===0) {
              ap = "AM";
              }
          }
        }
        if (na.length > 1) {
            m = parseInt(na[1].replace(/^0/, ""), 10) % 60;
        }
        if (na.length > 2) {
            s = parseInt(na[2].replace(/^0/, ""), 10) % 60;
        }
        if (na.length > 3) {
            ms = na[3];
            if (ms.length == 1) {
            ms = parseInt(ms, 10) * 100;
            }
            else {
            if (ms.length == 2) {
                ms = parseInt(ms.replace(/^0/, ""), 10) * 10;
            }
            else {
                ms = parseInt(ms.replace(/^0{1,2}/, ""), 10);
            }
            }
        }
        var ft = ((h < 10) ? "0" : "") + h + ":" +
            ((m < 10) ? "0" : "") + m + ":" +
            ((s < 10) ? "0" : "") + s + "." +
            ((ms < 10) ? "00" : ((ms < 100) ? "0" : "")) + ms + " " + ap;
        $(this).val(ft);
      }
    }).end()
    .find('.import-ignore-preamble').each(function(index, element){
      $(element).closest('#fr-preamble').after('<div class="row-fluid"><div class="span10"></div><div class="span2" style="padding-left:8px">'+
        gt.gettext('Ignore')+'</div></div>')
    }).end()
    .find('div.import-ignore').each(function(index, element){
        $(element).after('<input type="checkbox" select_id="cmap-c'+index+
          '" chzn="cmap_c'+index+'_chzn" name="checkbox['+index+']" class="inline checkbox-ignore" '+
          'style="margin-left:30px !important; width:30px; height:30px; margin-top:0px !important;"/>');
    }).end()
    .find('select.import-ignore').each(function(index, element){
        if($(element).val() == 'ignore') {
          $(element).parent().find('input.checkbox-ignore').attr('checked', 'checked');
        } else {
          $(element).parent().find('input.checkbox-ignore').removeAttr('checked');
        }
        $(element).on('change', function() {
          if($(element).val() == 'ignore') {
            $(element).parent().find('input.checkbox-ignore').attr('checked', 'checked');
          } else {
            $(element).parent().find('input.checkbox-ignore').removeAttr('checked');
          }
        });
    }).end()
    .find('input.checkbox-ignore').each(function(index, element) {
      $(element).on('click', function() {
        var id = $(this).attr('select_id');
        var chzn = $(this).attr('chzn');
        if ($(element).is(':checked') && $('#' + id).val() != 'ignore') {
          $(element).attr('previous',$('#' + id).val());
          $('#' + id).val('ignore').trigger("liszt:updated");
        } else {
          $('#' + id).val($(element).attr('previous')).trigger("liszt:updated");
        }
      });
    }).end()
    .find('#search').keypress(function(e) {
      var code = e.keyCode || e.which;
      if (code  == 13) {
        e.preventDefault();
        return false;
      }
    }).end()
    .find('#search').keyup(function() {
      var q =$(this).val();
      if (q.length > 1) {
        $("#fr-entrieslist > table > tbody > tr").hide();
        $("#fr-entrieslist > table > tbody > tr > td:contains-ci('" + q + "')").parent("tr").show();
        if ($("#fr-entrieslist > table > tbody > tr > td:contains-ci('" + q + "'):visible").size() < 1) {
          var noteText =  gt.gettext('There are no results.');
          if ($('div#no-result').size() > 0) {
            $('div#no-result').show();
          }
          else {
            $("#fr-entrieslist").append("<div id='no-result' >"+noteText+"</div>");
          }
        }
        else {
          $('div#no-result').hide();
        }
      }
      else {
        $("#fr-entrieslist > table > tbody > tr").show();
      }
    }).end()
    .find('select.organizer_trigger').change(changeEvent).end()
    .find('#create-account-role_id').change(function() {
      if($(this).val() == $('#superRole').val())  {
        $("#superMessage").show();
        $("#fr-account-access, #labsMessage").hide();
      }
      else if ($(this).val() == $('#labsRole').val()){
        $("#labsMessage").show();
        $("#fr-account-access, #superMessage").hide();
      }
      else {
        $("#fr-account-access").show();
        $("#superMessage, #labsMessage").hide();
      }
    }).end()
    .find('#addAnother').click(function() {
      numOfAddedRows = $('#numOfRows').val();
      numOfAddedRows++;
      checkForEventAndOrgOptions();
      
      var OrgHtml = "<div class='multi-element-column span5' style='margin-top:10px;'>"+
                      '<div id="fr-create-account-account_role-' + numOfAddedRows + '-org_id" class="fr fr-org_id" style="overflow:visible;">' +
                      '<label class="field-label required" for="create-account-account_role-'+numOfAddedRows+'-org_id">Organizer*</label>' +
                        "<select row='" + numOfAddedRows + "' class=\"span9 organizer_id chzn organizer_trigger\" id=\"account-organizer_id_"+numOfAddedRows+"\" name=\"create[account][account_role]["+numOfAddedRows+"][org_id]\">"+OrgOptions+"</select>"+
                      '</div>' +
                    "</div>";
      
      var EventHtml = "<div class='multi-element-column span5' style='margin-top:10px;'>"+
                        '<div id="fr-create-account-account_role-' + numOfAddedRows + '-event_id" class="fr fr-org_id" style="overflow:visible;">' +
                          '<label class="field-label required" for="create-account-account_role-'+numOfAddedRows+'-org_id">Event*</label>' +
                          "<select row='" + numOfAddedRows + "' class=\"span9 event_id chzn\" id=\"account-event_id_"+numOfAddedRows+"\" name=\"create[account][account_role]["+numOfAddedRows+"][event_id]\">"+EventOptions+"</select>"+
                        '</div>' + 
                      "</div>";

      $("#account-event_id_"+numOfAddedRows).val(0);
      $("#account-event_id_"+numOfAddedRows).trigger("liszt:updated");
      
      $(this).closest('#fr-account-access').find('ul.errors').remove();
      $(this).closest('div.multi-element-column').before(OrgHtml);
      $(this).closest('#fr-account-access').find("#account-organizer_id_"+numOfAddedRows).val(0).chosen();
      $(this).closest('div.multi-element-column').before(EventHtml);
      $(this).closest('#fr-account-access').find("#account-event_id_"+numOfAddedRows).chosen();
      if($('.removeOrgEvent').size() === 0) {
        
        var firstRow = $("#fr-account-access").find(".multi-element-column:eq(0)").find('select.organizer_trigger').attr("row");
        
        var removeElementFirst = '<div class="multi-element-column topmargin30 span2">' + 
                                    '<div id="fr-intro" class="fr fr-intro" style="overflow:visible;"><div class="form-content fi ">' +
                                      '<div style="font-size: 13px;margin-top: 29px;">' + 
                                        '<a href="#" class="removeOrgEvent" row="'+firstRow+'">' + 
                                          gt.gettext('Remove') + 
                                        '<a/>' + 
                                      '</div>' +
                                    '</div></div>' +
                                 '</div>';
        $('div.multi-element-column:nth-child(3)').before(removeElementFirst);
      }
      var newRemoveElement = '<div class="multi-element-column topmargin30 span2">' + 
                                '<div id="fr-intro" class="fr fr-intro" style="overflow:visible;"><div class="form-content fi ">' +
                                  '<div style="font-size: 13px;margin-top: 29px;">' + 
                                    '<a href="#" class="removeOrgEvent" row="' + numOfAddedRows + '">' + 
                                      gt.gettext('Remove') + 
                                    '<a/>' + 
                                  '</div>' +
                                '</div></div>' +
                              '</div>';
      $(this).closest('div.multi-element-column').before(newRemoveElement);
      $("#account-organizer_id_"+numOfAddedRows).bind('change', changeEvent);
      $('#numOfRows').val(numOfAddedRows);
    }).end()        
    .find('.removeOrgEvent').live('click',function(){
      checkForEventAndOrgOptions();
      var row = $(this).attr('row');
      $('#fr-create-account-account_role-' + row + '-event_id').closest('div.multi-element-column').remove();
      $('#fr-create-account-account_role-' + row + '-org_id').closest('div.multi-element-column').remove();
      $(this).closest('div.multi-element-column').remove();
      if($('.removeOrgEvent').size() == 1) {
        $('.removeOrgEvent').closest('div.multi-element-column').remove();
      }
    }).end()
    .find('div#sortable').each(function(){
      $(this).sortable({
        items: "div.single-row",
        update : function () {
            rearangeAwardBrackets();
        } 
      });
    }).end()
    .find("#reg_option_all-all").change(handleTshirt).end()
    .find("#fr-reg_option_list input").change(function() {
      if ($('#fr-reg_option_list input[type=checkbox]:checked').length == $('#fr-reg_option_list input[type=checkbox]').length) {
        $("#reg_option_all-all").trigger("click");
      }
    }).end()
    .find('#fr-report-params-sort div label input').each(function(index, element){
      if ($(element).is(':checked')) {
        var id = element.id;
        if (id == 'report-params-sort-tod') {
          $('#fr-report-params-priority').hide();
          $('#fr-report-params-device').hide();
        }
        else if (id == 'report-params-sort-timing') {
            $('#fr-report-params-priority').hide();
            $('#fr-report-params-device').show();
        } else {
          $('#fr-report-params-device').hide();
          $('#fr-report-params-priority').show();
        }
      }
    }).end()
    .find('#report-params-sort-timing').on('click', function(){
      
      $.post("/admin/report/get-race-info",{
          raceID: $('select#report-params-raceID.race-timing-report').val(),
          point: true,
          device: $('select#report-params-point.point-select').val()
      },function(race){

        var options = '<input type="hidden" name="report[params][device][]" value="_E_">';
        for (var j = 0; j < race.devices.length; j++) {
          var deviceID = race.devices[j].id;
          var device   = race.devices[j].name;
          options += '<label class="fl200 checkbox" for="report-params-device-'+deviceID+'">'+
                    '<input type="checkbox" name="report[params][device][]" value="'+deviceID+'" id="report-params-device-'+deviceID+'" class="cbg device-checkbox" />'+
                    device +
                  '</label>';
        }
        $('#fr-report-params-device > div.multibutton').html(options);
        $('#fr-report-params-priority').hide();
        $('#fr-report-params-device').show();
      });
    }).end()
    .find('#report-params-sort-tod').on('click', function(){
      $('#fr-report-params-device').hide();
      $('#fr-report-params-priority').hide();
    }).end()
    .find('#report-params-sort-priority').on('click', function(){
      $('#fr-report-params-device').hide();
      $('#fr-report-params-priority').show();
    }).end()
    .find('.refresh-graphic-for-series').on('click', function() {
      var data    = $(this).data();
      var graphic = $('#selected_graphic').val();
      $.post("/admin/event-graphic/pull-image-for-event/eventID/" + data.eventId + "/graphic/" + graphic, {
      },function(data) {
        var container = $('.for-' + graphic);
        container.find('a').attr('href', data.noThumb);
        container.find('img').attr('src', data.thumb);
        $('.modal-header .close').trigger('click');
      });
    }).end()
    .find('select#report-params-raceID.race-timing-report').on('change', function(){
      $.post("/admin/report/get-race-info",{
        raceID: $(this).val(),
        point: true
      },function(race){
        var html = '';
        for (var i = 0; i< race.points.length; i++) {
            html += '<option value="' + race.points[i].id + '">' + race.points[i].name + '</option>';
        }
        $('select#report-params-point.point-select').html(html).trigger("liszt:updated");
        var options = '<input type="hidden" name="report[params][device][]" value="_E_">';
        for (var j = 0; j < race.devices.length; j++) {
          var deviceID = race.devices[j].id;
          var device   = race.devices[j].name;
          options += '<label class="fl200 checkbox" for="report-params-device-'+deviceID+'">'+
                     '<input type="checkbox" name="report[params][device][]" value="'+deviceID+'" id="report-params-device-'+deviceID+'" class="cbg device-checkbox" />'+
                     device +
                   '</label>';
        }
        $('#fr-report-params-device > div.multibutton').html(options);
      });
    }).end()
    .find('select#report-params-point.point-select').on('change', function(){
      $.post("/admin/report/get-race-info",{
        raceID: $('select#report-params-raceID.race-timing-report').val(),
        point: true,
        device: $(this).val()
      },function(race){
        
        var options = '<input type="hidden" name="report[params][device][]" value="_E_">';
        for (var j = 0; j < race.devices.length; j++) {
          var deviceID = race.devices[j].id;
          var device   = race.devices[j].name;
          options += '<label class="fl200 checkbox" for="report-params-device-'+deviceID+'">'+
                     '<input type="checkbox" name="report[params][device][]" value="'+deviceID+'" id="report-params-device-'+deviceID+'" class="cbg device-checkbox" />'+
                     device +
                   '</label>';
        }
        $('#fr-report-params-device > div.multibutton').html(options);
      });
    }).end()
    .find('select#report-params-race_id.race-award-report').change(function(){
      $('div#fr-report-params-brackets').find('div.single-row').each(function(){
        $(this).remove();
      });
      updateBracketSelects();
      rearangeAwardBrackets();
      $.post('/admin/bracket/get-brackets-for-race/raceID/' + $(this).val(),null,function(response){
        $('div.multi-reorder').attr('data-all-options', response.data);
        $('div.add-button > a.add-another').trigger('click');
        togleAddAnother();
      });
    }).end()
    .find('select#report-params-race_id.wave_jumper').each(function(i, el){
      var raceID = $(this).val();
      $('table.wave_jumper_table tr.wave_jumper_row').each(function(index, element) {
        if ($(element).attr('race_id') == raceID) {
          $(element).removeClass('hidden');
        } 
        else {
          $(element).addClass('hidden');
        }
      });
    }).end()
    .find('select#report-params-race_id.wave_jumper').on('change', function(){
      $.post("/admin/report/get-race-info",{raceID:$(this).val(),removeAll:$("#report-params-interval_id").attr('removeAll')},function(race){
        var html = '';
        for (var i = 0; i< race.intervals.length; i++) {
            html += '<option value="' + race.intervals[i].id + '">' + race.intervals[i].name + '</option>';
        }
        $('#report-params-interval_id').html(html);
        $('#report-params-interval_id').trigger('liszt:updated');
      });
      var raceID = $(this).val();
      $('table.wave_jumper_table tr.wave_jumper_row').each(function(index, element) {
        if ($(element).attr('race_id') == raceID) {
          $(element).removeClass('hidden');
        } 
        else {
          $(element).addClass('hidden');
        }
      });
    }).end()
    .find('.fill_wave_jumper').each(function(index, element) {
      $(element).on('click', function() {
        var waveID = $(this).attr('waveid');
        var before = true;
        $('.before_wave_jumper').each(function(i, e) {
          if ($(e).hasClass(waveID)) {
            if ($('#report-params-wave_jumper-before-hours').val() == '' &&
            $('#report-params-wave_jumper-before-minutes').val() == '' && 
            $('#report-params-wave_jumper-before-seconds').val() == ''
          ) {
              before = false;
            }
          }
        });
        if (before) {
          $('#select_before_'+waveID).val($('#select_before').val()).trigger("liszt:updated");
          $('#report-params-wave_jumper-before'+waveID+'-hours').val($('#report-params-wave_jumper-before-hours').val());
          $('#report-params-wave_jumper-before'+waveID+'-minutes').val($('#report-params-wave_jumper-before-minutes').val());
          $('#report-params-wave_jumper-before'+waveID+'-seconds').val($('#report-params-wave_jumper-before-seconds').val());
        }
        var after = true;
        $('.after_wave_jumper').each(function(i, e) {
          if ($(e).hasClass(waveID)) {
            if ($('#report-params-wave_jumper-after-hours').val() == '' &&
            $('#report-params-wave_jumper-after-minutes').val() == '' && 
            $('#report-params-wave_jumper-after-seconds').val() == ''
          ) {
              after = false;
            }
          }
        });
        if (after) {
          $('#select_after_'+waveID).val($('#select_after').val()).trigger("liszt:updated");
          $('#report-params-wave_jumper-after'+waveID+'-hours').val($('#report-params-wave_jumper-after-hours').val());
          $('#report-params-wave_jumper-after'+waveID+'-minutes').val($('#report-params-wave_jumper-after-minutes').val());
          $('#report-params-wave_jumper-after'+waveID+'-seconds').val($('#report-params-wave_jumper-after-seconds').val());
        }
      });
    }).end()
    .find('.by_proxy_check').on('change', function(){
      if ($(this).val() != 0) {
         $('#report-params-by_proxy').removeAttr('disabled');
      } else {
         $('#report-params-by_proxy').attr('disabled', true);
      }
    }).end()
    .find('a.removeBracketRow').live('click', function(){
      $(this).closest('div.single-row').remove();
      updateBracketSelects();
      rearangeAwardBrackets();
      if($('div.single-row').size() == 1) {
        $('a.removeBracketRow').hide();
      }  
      togleAddAnother();
    }).end()
    .find('#team_id').on('change', function(){
      var teamValue  = $(this).val();
      var teamView   = $('.view-team');
      var linkPrefix = "/admin/team/info/teamID/"
      if(teamValue === "") {
        teamView.addClass('hidden');
      } else {
        teamView.removeClass('hidden');
        teamView.find('a').attr('href', linkPrefix + teamValue);
      }
    }).end()
    .find('div.add-button > a.add-all').click(function(){
      $this = $(this);
      var allOpt = $(this).closest('div.multi-reorder').attr('data-all-options');
      allOpt = JSON.parse(allOpt);
      var selectedBrackets = getSelectedBracketsArray();
      var diffBracket = [];
      var race_name;
      for(var race in allOpt) {
        race_name = race;
        diffBracket = jQuery.grep(allOpt[race], function(bracket){
          if(jQuery.inArray(bracket['id'],selectedBrackets) == -1){
            return bracket;
          }
        });
      }       
      var rowNum = parseInt($('#rowNum').val(), 10);
      var orderNum = parseInt($('#orderNum').val(), 10);
      $.each( diffBracket, function( key, bracket ) {
        var html = ''; 
        var options = '<optgroup label="' + race_name + '">';
        options += '<option value=' + bracket.id +' disabled="disabled" selected="selected">' + bracket.name + '</option>';
        options += '</optgroup>';
        html += bracketRowHtml(rowNum, orderNum, options);             
         $this.parent('.add-button').before(html);
         $('#bracket-select-' + rowNum).chosen({disable_search_threshold: 10});
         rowNum++;
         orderNum++;
      });      
      $('#rowNum').val(rowNum);
      $('#orderNum').val(orderNum);
      updateBracketSelects();
      togleAddAnother();
      resizeModal();
    }).end()
    .find('div.add-button > a.add-another').click(function(){
      var allOpt = $(this).closest('div.multi-reorder').attr('data-all-options');
      allOpt = JSON.parse(allOpt);
      var options = '', disabled, bracketNumber = 0;
      var selectedBrackets = getSelectedBracketsArray();
      for(var race in allOpt) {
        options += '<optgroup label="' + race + '">';
        for(var i in allOpt[race]){
          if(jQuery.inArray(allOpt[race][i]['id'], selectedBrackets) != -1) {
            disabled = 'disabled="disabled"';
          }
          else {
            disabled = '';
          }
          options += '<option value="' + allOpt[race][i]['id'] + '" ' + disabled + '>' + allOpt[race][i]['name'] + '</option>';
        }
        options += '</optgroup>';
      }
      var rowNum = parseInt($('#rowNum').val(), 10);
      var orderNum = parseInt($('#orderNum').val(), 10);
      var rowHtml = '';
      rowHtml = bracketRowHtml(rowNum, orderNum, options);
      $(this).parent('.add-button').before(rowHtml);
      $('#bracket-select-' + rowNum).chosen({disable_search_threshold: 10});
      updateBracketSelects();
      $('#rowNum').val(rowNum + 1);
      $('#orderNum').val(orderNum + 1);
      if(rowNum > 0) {
        $('a.removeBracketRow').show();
      }
      else {
        $('a.removeBracketRow').hide();
      }
      togleAddAnother();
      resizeModal();
    }).end()
    .find('select.bracket-select').change(function(){
      if($(this).val() == 0) {
        $('select.bracket-select').each(function(){
          if($(this).val() != 0) {
            $(this).closest('div.single-row').remove();
          }
        });
        rearangeAwardBrackets();
        $('div.add-button').hide();
      }
      else {
        $('div.add-button').show();
      }
      updateBracketSelects($(this).val());
    }).end()
    .find('.zeros').change(function(){
      var t = $(this).val();
      var n = t.replace(/[^0-9]/g, "0");
      $(this).val(n);
    }).end()
    .find('.remove-amp').each(function(){
      var value = $(this).val();
      value = value.replace(/&amp;/g, "&");
      $(this).val(value);
    }).end()
    .find('.list-editor').each(configureListEditor).end()
    .find('.tinymce').each(function(){
      $(this).removeClass('span9');
      var attr = $(this).attr('disabled');
      if (typeof attr !== 'undefined' && attr !== false) {
         return;
      }
      $(this).wysihtml5({'font-styles' : false, 'image' : false, 'stylesheets': ['/css/bootstrap/bootstrap.min.css']});
    }).end()
    .find('.markdown-editor').each(function(){
      $(this).markdown({iconlibrary: 'fa'});
    }).end()
    .find('.abutton').live('click', function() {
      if ($(this).attr('target') == '_blank') {
        window.open($(this).attr('href'),'preview','width='+$(window).width()+',height='+$(window).height());
      }
      else {
        window.open($(this).attr('href'), "_self");
      }
    }).end()
    .find('#open--form #submitclose').live('click', function() {
      window.onbeforeunload = null;
    }).end()
    .find('.elementImagePreview').each(function(){
      $(this).imgPreview({
        imgCSS: {width: 200}
      });
    }).end()
    .find('#google-map').on('click', function() {
      var href = 'http://maps.google.com/maps',
          lat = $('.geolocation-latitude').val(),
          long = $('.geolocation-longitude').val();
      if(lat && long) {
        href += "?q=" + lat + "," + long;
      }
      $(this).attr('href', href);
    }).end()
    .find('#interval-wants_ranking').on('click', function(){   
      var $intervalUseForMessaging = $('#interval-use_for_messaging');
      var $publishResults          = $('#interval-publish_results');
      if (!$(this).is(':checked')){
        if ($intervalUseForMessaging.is(':checked')) {      
            if (confirm(gt.gettext('Wants Ranking must be checked for messaging to work over this interval. Are you sure you want to proceed?'))) {
              $intervalUseForMessaging.removeAttr('checked').attr('disabled','disabled');
              $publishResults.removeAttr('checked').attr('disabled','disabled');
            }
            else {
              $(this).attr('checked', 'checked');         
            }
        }
        else {
          $intervalUseForMessaging.attr('disabled','disabled');
          $publishResults.attr('disabled','disabled');
        }
      } 
      else if ($(this).is(':checked')){
        $intervalUseForMessaging.removeAttr('disabled');
        $publishResults.removeAttr('disabled');
      }          
    }).end()
    .find('.show-hide-items').on('click', function(){
      var value = $(this).val();
      var showIf = $(this).attr('show-if');
      if(showIf == value) {
       $($(this).attr('show')).show();
      }
      else {
       $($(this).attr('show')).hide();
      }
    }).end()
    .find('select#report-params-raceID.didnotfinish-report').on('change', function(){
       $.post("/admin/report/get-race-info",{
         raceID: $(this).val(),
         point: true
       },function(race){
         var html = '';
         for (var i = 0; i< race.points.length; i++) {
             html += '<option value="' + race.points[i].id + '">' + race.points[i].name + '</option>';
         }
         $('select#report-params-timingPointID.didnotfinish-report').html(html).trigger("liszt:updated");
       });
    }).end()
    .find('.show-hide-items').each(function(){
      if($(this).is(':checked') && $(this).val() != $(this).attr('show-if')) {
        $($(this).attr('show')).hide();
      }
    }).end()
    .find('.removeEventImage').live("click", function(){
      var data = $(this).data();
      var removeLink  = $(this);
      if(data.id) {
        if($(this).closest('form').hasClass('create')) {
          var url = '/admin/element-image/remove/elementImageID/'+data.id;
        }
        if($(this).closest('form').hasClass('edit') || $(this).closest('form').attr('id') == "tshirtForm" 
                || $(this).closest('form').attr('id') == "donationForm") {
          var url = '/admin/element-image/remove/elementImageID/'+data.id+'/displayGroupElementID/'+data.dge;
        }
                
        $(this).text('Removing...');
        $.get(url, function(data) {
          //Remove old id from array
          var addedImages = $('.element_image_added').val();
          var images = addedImages.split(',');
          var newImages = [];
          for(var i=0; i < images.length; i++) {
            if(images[i] != data.id) {
              newImages.push(images[i]);
            }
          }
          
          //Remove disabled if there is less then 4 images uploaded
          removeLink.parent().parent().parent().find('input[type="file"]').removeAttr('disabled');
          removeLink.parent().parent().parent().find('.fileupload-preview').removeClass('disabled');
          removeLink.parent().parent().parent().find('#uploadFileWithAjax').removeClass('disabled');
          
          $('.element_image_added').val(newImages.join(','));
          $('div#element-image-'+data.id).remove();
        });
      }
      return false;
    }).end()
    .find("a.popover-enable").each(function() {
      $(this).popover({html:true, content:'<img style="width:328px;height:150px;" src="/img/securecode-all.gif" />'});
    }).end()
    .find('select#event-location-time_zone').on('change', function() {
      $('select#event-location-time_zone').closest('form').find('.event_change_note').remove();
      $('select#event-location-time_zone').closest('div').append('<div class="event_change_note alert alert-danger span9 pull-right">' +
        gt.gettext('Scheduled Event times are not automatically adjusted. Please manually adjust planned Race and Registration times if necessary.') + '</div>');
    }).end()
    .find('#bracket_rule-element_id').change(function() {
      var answerData = $('#bracket_rule-element_id').data();
      var elID = $(this).val();
      var select  = $('#bracket_rule-multioption_value');
      var answers = "";
      $.each(answerData.elementAnswer[elID], function (i, answer) {
        answers += "<option value='"+i+"'>"+answer+"</option>";
      });
      select.html(answers);
      select.trigger("liszt:updated");
    }).end()
    .find('#wave_rule-element_id').change(function() {
      var answerData = $('#wave_rule-element_id').data();
      var elID = $(this).val();
      var select  = $('#wave_rule-multioption_value');
      var answers = "";
      $.each(answerData.elementAnswer[elID], function (i, answer) {
        answers += "<option value='"+i+"'>"+answer+"</option>";
      });
      select.html(answers);
      select.trigger("liszt:updated");
    }).end()
    .find('.time-option').on('blur',function() {
      var time      = $(this).val();
      var haveMili  = $(this).hasClass('form-text-time-millis');
      if (time && !haveMili) {
        var split     = time.split(" ");
        var splitTime = split[0].split(":");
        var date    = new Date(0,0,0,splitTime[0],splitTime[1],0,0);
        var hours   = date.getHours();
        var minutes = date.getMinutes();
        if (minutes.toString().length == 1) {
          minutes = ("0" + minutes).slice(-2);
        }
        var newDate = hours+":"+minutes+" "+split[1];
        $(this).val(newDate);
      }
    }).end()
    .find('#uploadFileWithAjax').click(function(){
      //If disabled return false
      if($(this).hasClass('disabled')) return false;
      
      var button = $(this);
      //Remove errors
      button.parent().parent().parent().find('ul.errors').remove();
      
      //If there is no file selected throw error, basic javascript protection
      if(button.parent().find('div > .fileupload-preview').text() == "") {
        button.parent().parent().after('<ul class="errors alert alert-danger"><li>' + gt.gettext('No file was uploaded.') + '</li></ul>');
        return false;
      }
      var form           = null;
      var formObject     = $(this).closest('form');
      var maxNumOfImages = 4;
      //Check to see if we hit the limit
      if (formObject.attr('id') == "donationForm") {
        maxNumOfImages = 1;
      } 
      if (button.parent().parent().find('.images-uploaded > .element-image').size() >= maxNumOfImages) {
        return false;
      }
      
      
      if(formObject.hasClass('create')) {
        form = "create";
      }
      if(formObject.hasClass('edit')) {
        form = "edit";
      }
      if(formObject.attr('id') == "tshirtForm") {
        form = "tshirtForm";
      }
      if(formObject.attr('id') == "donationForm") {
        form = "donationForm";
      }
      if(form == null) {
        return false;
      }
      
      //Set button to loading state
      button.text(gt.gettext('Uploading...'));
      button.addClass('disabled');
      
      var elementID = $(this).parent().parent().find('input[type="file"]').attr('id');
      var limitHit  = false;
      
      if(form == "edit" || form == "tshirtForm" || form == 'donationForm') {
        var dgeID = $('#displayGroupElementID').val();
        var urlCreate = '/admin/element-image/create/displayGroupElementID/'+dgeID;
      } else {
        var urlCreate = '/admin/element-image/create';
      }
            
      $.ajaxFileUpload
      ({
        url: urlCreate,
        secureuri: false,
        fileElementId: elementID,
        dataType: 'json',
        success: function (data, status) {
         var html = '';
         //Everything is fine, show image
         if(data.code == 1) {
           var addedImages = $('#display_group_element-element_image').val();
           if(addedImages == "") {
             var images = [];
           } else {
             var images = addedImages.split(',');
           }
           
           images.push(data.id);
           $('#display_group_element-element_image').val(images.join(','));
           
           html += '<div class="element-image span9 pull-right" style="margin-top: 10px;" id="element-image-' + data.id + '">';
           html += '<a href="' + data.href + '" class="elementImagePreview label label-info" style="padding: 4px;">' + data.name + '</a> ';
           
           if(form == "edit") {
             html += '<a class="label label-important removeEventImage" style="padding: 3px;" href="#" data-id="' + data.id + '"><i class="icon-remove-sign icon-white"></i></button>';
           } else {
             html += '<a class="label label-important removeEventImage" style="padding: 3px;" href="#" data-dge="' + dgeID + '" data-id="' + data.id + '"><i class="icon-remove-sign icon-white"></i></button>';
           }
           html += '</div>';
           button.parent().parent().find('.images-uploaded').append(html);
           $(".elementImagePreview").imgPreview({
             imgCSS: {width: 200}
           });
           
           //Disable button if we hit limit of 4
           if(button.parent().parent().find('.images-uploaded > .element-image').size() >= 4) {
             limitHit = true;
             button.parent().find('div > .fileupload-preview').addClass('disabled');
             button.parent().parent().find('input[type="file"]').attr('disabled', 'disabled');
           }
           
           resizeModal();
           
         } else {
           button.parent().parent().after('<ul class="errors alert alert-danger"><li>'+data.msg+'</li></ul>');
         }
         button.text(gt.gettext('Upload'));
         if(!limitHit) button.removeClass('disabled');
        },
        error: function(data) {
          button.parent().parent().after('<ul class="errors alert alert-danger"><li>'+data.msg+'</li></ul>');
          button.text('Upload');
          button.removeClass('disabled');
        }
      });
      return false;
    }).end()
    .find(".reg_transaction-type-select").on('change',function(){
      var selected = $(this).val();
      var i   = $(".reg_transaction-type-select option[value='"+selected+"']").index();
      var sel = $(".reg_transaction-type p:not([class*=hidden])");
      sel.addClass('hidden');
      $(".reg_transaction-type > p:eq("+i+")").removeClass('hidden');
    }).end()
    .find(".check-payment").on('click',function(){
      var showDialog  = false;
      $("input:text, select").each(function(){
        var checkVal = $(this).attr('forCheck');
        if (checkVal) {
          if (checkVal != $(this).val()) {
            showDialog = true;
            $(this).attr("forCheck", $(this).val());
          }
        }
      });
      
      if (showDialog) {
        var bodyText = gt.gettext("If you are changing the payee information after already receiving a payment from ChronoTrack please notify regacct@chronotrack.com");
        if (!confirm(bodyText)) {
          $("#event-payment_location-region_id").remove();
          $("#navmenu").trigger('change');
          return false;
        }
      }
    }).end()
    .find('#options-date_format').on('change', function(){
      var dateFormat = $(this).val();
      var newFormat  = null;
      if (dateFormat == 'd/M/yyyy') {
        newFormat = 'dd/mm/yyyy';
      }
      else {
        newFormat = 'mm/dd/yyyy';
      }
      $('.form-text-date').each(function() {
        $(this).parent().datepicker('setFormat', newFormat);
        $("#options-min, #options-max").attr("placeholder", newFormat);
      });
    }).end()
    .find("#importTagReads").closest('ul').addClass('scoring-menu').end()
    .find('.resultsTimerHeading').closest("dl").find('dt:first').remove().end()
    .find('.raceCheckpointSelect').on('change', function(){
        $.post("/admin/checkpoint/get-checkpoints-by-race-id",{raceID:$(this).val()},function(checkpoint){
          if(checkpoint) {
            var html = '';
            $.each(checkpoint, function(k,v){
              html += '<option value="' + v.id + '">' + v.name + '</option>';
            });
          }
          $('.checkPointSelect').html(html).trigger("liszt:updated");
        }).error(function(){alert('Request failed.');});
    }).end();
    
  return sel;
}

function updateBracketSelects() {
  var selectedBrackets = getSelectedBracketsArray();
  $('select.bracket-select').each(function(){
    var selectedValue = $(this).val();
    $(this).find('option').attr('disabled', false);
    $(this).find('option').each(function(){
      if(selectedValue != $(this).val() && 
         jQuery.inArray($(this).val(), selectedBrackets) != -1) {
        $(this).attr('disabled', true);
      }
    });
  });
  $('select.bracket-select').trigger('liszt:updated');
}

function handleTshirt(e) {
  if ($(this).is(":checked")) {
    $("#fr-reg_option_list").find("input").prop("checked", true);
    $("#fr-reg_option_list").hide();
  }
  else {
    if (e.type == "change") {
      $("#fr-reg_option_list").find("input").prop("checked", false);
    }
    $("#fr-reg_option_list").show();
    $('#fr-reg_option_list').removeClass('force-hide');
  }
}

function getSelectedBracketsArray() {
  var selectedBrackets = new Array();
  $('select.bracket-select').each(function(){
    selectedBrackets.push($(this).val());
  });
  return selectedBrackets;
}

function togleAddAnother() {
  var allOpts = JSON.parse($('div.multi-reorder').attr('data-all-options')), length = 0;
  for(var race in allOpts) {
    length += allOpts[race].length;
  }
  if(length <= $('div.single-row').length) {
    $('div.add-button').hide();
  }
  else {
    $('div.add-button').show();
  }
}

function bracketRowHtml(rowNum, orderNum, options) {
  return '<div class="single-row">' +
            '<i class="icon-resize-vertical pull-left row-left-icon"></i>' +
            '<input type="hidden" class="row-order" value="' + orderNum + '" name="report[params][brackets][' + rowNum + '][order]">' + 
            '<div class="span4">' + 
              '<select class="span12 bracket-select" name="report[params][brackets][' + rowNum + '][bracket_id]" id="bracket-select-' + rowNum + '">' +
                options +
              '<select>' + 
            '</div>' +
            '<div class="span5">' +
              '<input type="text" name="report[params][brackets][' + rowNum + '][depth]" class="form-text span9" value="3">' + 
            '</div>' +
            '<div style="margin-left: 45px;" class="span2">' + 
              '<a row="' + rowNum + '" class="removeBracketRow" href="#">' + gt.gettext('Remove') + '</a>' +
            '</div>' + 
          '</div>';
}
function enableUpdateSeriesDataButton(element) {
  var value  = element.val();
  var parent = element.parent();
  parent.find('.fa-check').remove();
  parent.find('.fa-times').remove();
  parent.find('.errors').remove();
  var buttonHolder = element.closest('.row-fluid').next();
  if (value != '') {
    buttonHolder.find('.apply-series-data').attr('disabled', null);
  } else {
    buttonHolder.find('.apply-series-data').attr('disabled', 'disabled');
  }
}
function updateMasterSeriesEvent(trigger, value) {
  var seriesID = $('.series-id').val();
  var parent;
  switch (trigger) {
    case 'name':
      parent = $('#fr-series_title');
      break;
    case 'description':
      parent = $('#fr-series_description');
      break;
    case 'waiver':
      parent = $('#fr-series_waiver');
      break;
    case 'site_uri':
      parent = $('#fr-series_site_uri');
      break;
  }
  parent.find('.fa-check').remove();
  parent.find('.fa-times').remove();
  parent.find('.series-error').remove();

  var buttonHolder = parent.next();
  buttonHolder.find('button').hide();
  buttonHolder.append().append('<i class="fa fa-spin fa-spinner" style="font-size: 25px;margin-left: 15px;margin-top: 2px;"></i>');
  var url      = '/admin/series/update-event';
  $.post(url,{'seriesID': seriesID, 'value': value, 'trigger': trigger},function(data) {
    buttonHolder.find('.fa-spinner').remove();
    if (data.status) {
      parent.find('.errors').remove();
      buttonHolder.find('.fa-times').remove();
      buttonHolder.append('<i class="fa fa-check" style="font-size: 25px;margin-left: 15px;margin-top: 2px; color:green;"></i>');
      setTimeout(function() { 
        buttonHolder.find('.fa-check').remove();
        buttonHolder.find('button').show();
        buttonHolder.find('button').attr('disabled', true);
      }, 3000);
    } else {
      buttonHolder.append('<i class="fa fa-times" style="font-size: 25px;margin-left: 15px;margin-top: 2px; color:red;"></i>');
      if (trigger == 'site_uri') {
        $('#series_site_uri').val(data.url);
        if (parent.find('.errors').length) {
          parent.find('.errors').find('li').text(data.message);
        } else {
          parent.append('<ul class="errors alert alert-danger" style="margin-left: 0;"><li>' + data.message + '</li></ul>');
        }
      }
      setTimeout(function() { 
        buttonHolder.find('.fa-times').remove();
        buttonHolder.find('button').show();
        buttonHolder.find('button').attr('disabled', true);
      }, 3000);
    }
  });
}
function rearangeAwardBrackets() {
  var order = 0;
  $('div#fr-report-params-brackets > div.multi-reorder > div.single-row').each(function(){
    $(this).find('input.row-order').val(order++);
  });
  $('#orderNum').val(order);
}

function checkForEventAndOrgOptions(){
  if(OrgOptions == null) {
        var orgData = $('#create-account-account_role-0-org_id').data();
        $.each(orgData['orgs'], function (i, orgName) {
          OrgOptions   += "<option label='"+orgName+"' value='"+i+"'>"+orgName+"</option>";
        });       
      }
      if (EventOptions == null) {
        var eventData = $('#create-account-account_role-0-event_id').data();
        $.each(eventData['events'], function (i, eventName) {
          EventOptions   += "<option label='"+eventName+"' value='"+i+"'>"+eventName+"</option>";
        });
      }
}
    
setupElements($('body'));

function applyButtonIcon() {
  var icon = $(this).data('icon');
  if(typeof icon == "undefined") {
    if (/\buicon-img-([^\s]+)/.test($(this).attr('class'))) {
      icon = RegExp.$1;
    }
  }
  
  var color = $(this).data('iconColor');
  if(!color) {
    color = "";
  }
  
  var position = $(this).data('iconPosition');
  if(!position) {
    position = 'left';
  }
  var html = $(this).html();
  html += '<i class="'+icon+' '+color+' button-icon-'+position+'"></i>';
  $(this).html(html);
}

$('#profile-tabs a, #event-tabs a').click(function (e) {
  e.preventDefault();
  $(this).tab('show');
});

$('#ver-nav li a').click(function() {
  $('#ver-nav').css('height', $('.account-info .tab-content').height());
});

function changeEvent() {
  if (EventOptions == null) {
    EventOptions = $(this).closest('#fr-account-access').find('#create-account-account_role-0-event_id').html();
  }
  
  $('#overlay').append('<div class="spinner"><div class="inner"></div></div>');
  
  var orgID = $(this).val();
  var org = $(this);
  $.get('/admin/event/search-by-org/orgID/'+orgID,function(data) {
    var htmlSelect = '<option label="" value="all">All</option>';
    for(var i=0; i<data.length; i++) {
      var mat = data[i];
      htmlSelect += '<option label="'+mat.name+'" value="'+mat.id+'">'+mat.name+'</option>';
    }
    var selectObject = org.closest('.multi-element-column').next().find('select.event_id');
    selectObject.show().removeClass('chzn-done')
    selectObject.next().remove()
    selectObject.html(htmlSelect)
    selectObject.chosen({disable_search_threshold: 5});
    $('#overlay').find('.spinner').remove();
  });
}

function setEventsForOrgWideReport() {
  var events = [];
  $('select.event-element').each(function(index, element) {
    if ($(element).val() != '') {
      events.push($(element).val());
    }
  });
  events = jQuery.unique(events);
  $('#report-params-event_id').val(events);
}

function showSpinner(obj, zindex) {
  if(zindex == null) {
    zindex = 1050;
  }
  if (obj.hasClass('blue-spinner')) {
    jQuery().busy("defaults", {img:'/img/embed/indicator32-blue.gif', zIndex:zindex, preload:'preload'});
  }
  else {
    jQuery().busy("defaults", {img:'/img/embed/indicator32.gif', zIndex:zindex, preload:'preload'});
  }
  obj.busy();
}

// jQuery expression for case-insensitive filter
$.extend($.expr[":"], 
{
    "contains-ci": function(elem, i, match, array) 
  {
    return (elem.textContent || elem.innerText || $(elem).text() || "").toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
  }
});

function handleRegOptionTeamType() {
  if($(this).val()=="") {
    $('#fr-regchoice-require_team').hide();
    $('.fr-team_payment_structure').hide();
  }
  else {
    $('#fr-regchoice-require_team').show();
    $('.fr-team_payment_structure').show();
  }
  resizeModal();
}

$(function(){
  $("#page ul#pager").flexMenu({
    linkText: gt.gettext('More') + "&#x25BC;", 
    linkTitle: gt.gettext('View More'),
    wantsEllipsis: true, 
    ulFlexCss: "top: 28px; border-radius: 6px; border: 1px solid #d3d3d3;",
    cutoff: 0
  });
});
function sumarizeColumn() {
  var i = $(this).closest('td').index(), total = 0.0;
  var subTotal = $(this).closest('tbody').find(".add-subtotal-on-blur").html();
  if (subTotal != null) {
    total = parseFloat(subTotal)
  }
  $(this).closest('tbody').children().each(function(){
    var $input = $(this).find('td:eq(' + i + ') > input.add-on-blur');
    if($input.val() && 
        $input.attr('if-row-checked') && 
        $input.closest('tr').find('input.select-table-row').is(':checked')) {
      total += parseFloat($input.val());
    }
    else if($input.val() && !$input.attr('if-row-checked')){
      total += parseFloat($input.val());
    }
  });
  $($(this).attr('add-to')).html(parseFloat(total).toFixed(2));
}

function executeAppendButtonAction($button, $input, event, actionOnSuccess) {
  showSpinner($button);
  event.preventDefault();
  var action = $button.attr('href');
  var val  = $input.val();
  $.post(action,val,function(response){
    if(response.status == 0){
        $.jGrowl(response.msg, {
          theme:'success'
      });
      switch(actionOnSuccess) {
        case "REMOVE":
          $input.val('');
          break;
      }
    } 
    else {
      var error = response.msg;
      $input.parent().append("<ul class='errors alert alert-danger'><li>"+error+"</li></ul>");   
    }
    $button.busy('hide');
  });
  
}

function payeeTypeAfterClick(payeeType) {
  switch (payeeType) {
    case 'CHECK':
      $('.ach-info').hide();
      $('#fr-achinfo').hide();
      $('#fr-event-stripeconnectinfo').hide();
      $('#fr-payee-charge_currency_id').show();
      $('#fr-event-same_as_organizer').show();
      $('#fr-payee-payment_location-country').show();
      $('#fr-payee-payment_location-postal_code').show();
      $('#fr-payee-payment_location-city').show();
      $('#fr-payee-payment_location-region_id').show();
      $('#payee-payment_location-street').show();
      $('#payee-payment_location-street').show();
      $('#fr-payee-payee_name').show();
      $('#fr-payee-new_payee_id').show();
      $('#fr-payee-check_payable').show();
      $('.hide-if-stripe').closest('.control-group').show();
      break;
    case 'STRIPECONNECT':
      $('.hide-if-stripe').closest('.control-group').hide();
      $('#fr-event-stripeconnectinfo').show();
      $('#fr-event-same_as_organizer').hide();
      break;
    default:
    break;
  }
}
  
function getLabelName(id) {
  var label  = $.parseJSON($(id).attr('data-table'));
  var multiOption = $(id + " option[value='"+$(id).val()+"']").text();
  var text = 'ID';
  label = label[multiOption.trim()];
  for (var key in label) {
    text = key;
  }
  return text;
}

function getLegRow(row, id) {
  return '<tr class="line-' + row + '" style="">' + 
      '<td style="text-align: center;" class="">' +
        '<dt id="race-course_info-' + id + '-type-label">&nbsp;</dt>' +
        '<dd id="race-course_info-' + id + '-type-element">' +
          '<select name="race[course_info][' + id + '][type]" id="race-course_info-' + id + '-type" singleerror="" class="distance-select pull-left legSelect" style="width: 152px;">' +
            '<option value="swim" label="Swim">' + gt.gettext('Swim') + '</option>' +
            '<option value="bike" label="Bike">' + gt.gettext('Bike') + '</option>' +
            '<option value="run" label="Run">' + gt.gettext('Run') + '</option>' + 
            '<option value="other" label="Other">' + gt.gettext('Other') + '</option>' + 
          '</select>' + 
        '</dd>' + 
      '</td>' + 
      '<td style="text-align: center;" class="">' + 
        '<dt id="race-course_info-' + id + '-distance-label">&nbsp;</dt>' + 
        '<dd id="race-course_info-' + id + '-distance-element">' +
          '<input type="text" name="race[course_info][' + id + '][distance]" id="race-course_info-' + id + '-distance" value="" class="span12 legDistance">' +
        '</dd>' +
      '</td>' +
      '<td style="text-align: center;" class="">' +
        '<dt id="race-course_info-' + id + '-unit-label">&nbsp;</dt>' +
        '<dd id="race-course_info-' + id + '-unit-element">' +
          '<select name="race[course_info][' + id + '][unit]" id="race-course_info-' + id + '-unit" singleerror="" class="distance-select pull-left unitSelect" style="width: 152px;">' +
            '<option value="kilometers" label="Kilometers">' + gt.gettext('Kilometers') + '</option>' +
            '<option value="miles" label="Miles">' + gt.gettext('Miles') + '</option>' + 
            '<option value="meters" label="Meters">' + gt.gettext('Meters') + '</option>' + 
            '<option value="yards" label="Yards">' + gt.gettext('Yards') + '</option>' +
            '<option value="feet" label="Feet">' + gt.gettext('Feet') + '</option>' +
          '</select>' +
        '</dd>' +
      '</td>' +
      '<td style="text-align: center;" class=""></td>' +
    '</tr>';
}

function initRaceSubtype(type, isTypeChanged) {
  var $subtype = $('#race-subtype');
  if(!type || type === 'swimming' || type === 'obstacle' || type === 'untimed') {
    $('#fr-race-subtype').hide();
  }
  else {
    $('#fr-race-subtype').show();
    $subtype.find('optgroup').prop('disabled', true);
    $subtype.find('optgroup[label="' + type + '"]').prop('disabled', false);
    if(!$subtype.val() || isTypeChanged) {
      $subtype.val($subtype.find('optgroup[label="' + type + '"] > option').attr('value'));
    }
    $subtype.trigger('liszt:updated');
  }
}
function toggleAddEvents(flag) {
  if(typeof flag !== 'undefined') {
    $('.event-select-element label, .event-select-element .chzn-container, .fr-action > .form-content').addClass('hidden');
    $('.event-remove-element .fi, .event-select-element, .event-remove-element').addClass('hidden');
    $('.event-select-element').parent().addClass('hidden');
  } else {
    $('.event-select-element label, .event-select-element .chzn-container, .fr-action > .form-content').removeClass('hidden');
    $('.event-remove-element .fi, .event-select-element, .event-remove-element,.event-element').removeClass('hidden');
    $('.event-select-element').parent().removeClass('hidden');
  }
}
function toggleUntimed(type) {
  var toggleGroup = '#fr-race-course_distance,#fr-race-wants_relay_teams,' + 
    '#fr-race-wants_penalties,#fr-race-default_bracket_id,' + 
    '#fr-race-wants_results,#fr-race-wants_messaging';
  $(toggleGroup).toggle(type !== 'untimed');
  resizeModal();
}

function processCountOfEventsInOrg(orgID) {
  $.post('/admin/series/get-count-of-events',{'orgID': orgID}, function(data) {
    if (!data.count) {
      $('.series-info-submit').addClass('throw-error');
    } else {
      $('.series-info-submit').removeClass('throw-error');
    }
  });
}

function setPrimaryBracketKinect(primaryBracket) {
  if($('.br-policy.btn-success').length === 0) {
    $('.br-policy-overall').click();
  } else {
    $('.primary_bracker_wrap').text(gt.gettext("Primary"));
    $('.primary_bracker_kinetic').attr('bracket-policy', primaryBracket);
  }
  $('.br-policy').slice(0,3).each(function(i,e) {
    var tooltipMessage = 'Remove from ';
    if($(e).hasClass('btn-success')) {
      $(e).attr('data-original-title',gt.gettext(tooltipMessage + $(e).text()));
    } else {
      $(e).attr('data-original-title', '');
    }
    var customMessage = gt.gettext('Make Custom Primary');
    if($('.br-policy-custom').hasClass('btn-disabled')) {
      $('.custom-tooltip').attr('data-original-title', customMessage);
    } else {
      $('.custom-tooltip').attr('data-original-title', '');
    }
  });
}

/*admin/ajaxFileUpload.js*/

jQuery.extend({
  

    createUploadIframe: function(id, uri)
  {
      //create frame
            var frameId = 'jUploadFrame' + id;
            var iframeHtml = '<iframe id="' + frameId + '" name="' + frameId + '" style="position:absolute; top:-9999px; left:-9999px"';
      if(window.ActiveXObject)
      {
                if(typeof uri== 'boolean'){
          iframeHtml += ' src="' + 'javascript:false' + '"';

                }
                else if(typeof uri== 'string'){
          iframeHtml += ' src="' + uri + '"';

                } 
      }
      iframeHtml += ' />';
      jQuery(iframeHtml).appendTo(document.body);

            return jQuery('#' + frameId).get(0);      
    },
    createUploadForm: function(id, fileElementId, data)
  {
    //create form 
    var formId = 'jUploadForm' + id;
    var fileId = 'jUploadFile' + id;
    var form = jQuery('<form  action="" method="POST" name="' + formId + '" id="' + formId + '" enctype="multipart/form-data"></form>');  
    if(data)
    {
      for(var i in data)
      {
        jQuery('<input type="hidden" name="' + i + '" value="' + data[i] + '" />').appendTo(form);
      }     
    }   
    var oldElement = jQuery('#' + fileElementId);
    var newElement = jQuery(oldElement).clone();
    jQuery(oldElement).attr('id', fileId);
    jQuery(oldElement).before(newElement);
    jQuery(oldElement).appendTo(form);


    
    //set attributes
    jQuery(form).css('position', 'absolute');
    jQuery(form).css('top', '-1200px');
    jQuery(form).css('left', '-1200px');
    jQuery(form).appendTo('body');    
    return form;
    },

    ajaxFileUpload: function(s) {
        // TODO introduce global settings, allowing the client to modify them for all requests, not only timeout    
        s = jQuery.extend({}, jQuery.ajaxSettings, s);
        var id = new Date().getTime()        
    var form = jQuery.createUploadForm(id, s.fileElementId, (typeof(s.data)=='undefined'?false:s.data));
    var io = jQuery.createUploadIframe(id, s.secureuri);
    var frameId = 'jUploadFrame' + id;
    var formId = 'jUploadForm' + id;    
        // Watch for a new set of requests
        if ( s.global && ! jQuery.active++ )
    {
      jQuery.event.trigger( "ajaxStart" );
    }            
        var requestDone = false;
        // Create the request object
        var xml = {}   
        if ( s.global )
            jQuery.event.trigger("ajaxSend", [xml, s]);
        // Wait for a response to come back
        var uploadCallback = function(isTimeout)
    {     
      var io = document.getElementById(frameId);
            try 
      {       
        if(io.contentWindow)
        {
           xml.responseText = io.contentWindow.document.body?io.contentWindow.document.body.innerHTML:null;
                   xml.responseXML = io.contentWindow.document.XMLDocument?io.contentWindow.document.XMLDocument:io.contentWindow.document;
           
        }else if(io.contentDocument)
        {
           xml.responseText = io.contentDocument.document.body?io.contentDocument.document.body.innerHTML:null;
                  xml.responseXML = io.contentDocument.document.XMLDocument?io.contentDocument.document.XMLDocument:io.contentDocument.document;
        }           
            }catch(e)
      {
        jQuery.handleError(s, xml, null, e);
      }
            if ( xml || isTimeout == "timeout") 
      {       
                requestDone = true;
                var status;
                try {
                    status = isTimeout != "timeout" ? "success" : "error";
                    // Make sure that the request was successful or notmodified
                    if ( status != "error" )
          {
                        // process the data (runs the xml through httpData regardless of callback)
                        var data = jQuery.uploadHttpData( xml, s.dataType );    
                        // If a local callback was specified, fire it and pass it the data
                        if ( s.success )
                            s.success( data, status );
    
                        // Fire the global callback
                        if( s.global )
                            jQuery.event.trigger( "ajaxSuccess", [xml, s] );
                    } else
                        jQuery.handleError(s, xml, status);
                } catch(e) 
        {
                    status = "error";
                    jQuery.handleError(s, xml, status, e);
                }

                // The request was completed
                if( s.global )
                    jQuery.event.trigger( "ajaxComplete", [xml, s] );

                // Handle the global AJAX counter
                if ( s.global && ! --jQuery.active )
                    jQuery.event.trigger( "ajaxStop" );

                // Process result
                if ( s.complete )
                    s.complete(xml, status);

                jQuery(io).unbind()

                setTimeout(function()
                  { try 
                    {
                      jQuery(io).remove();
                      jQuery(form).remove();  
                      
                    } catch(e) 
                    {
                      jQuery.handleError(s, xml, null, e);
                    }                 

                  }, 100)

                xml = null

            }
        }
        // Timeout checker
        if ( s.timeout > 0 ) 
    {
            setTimeout(function(){
                // Check to see if the request is still happening
                if( !requestDone ) uploadCallback( "timeout" );
            }, s.timeout);
        }
        try 
    {

      var form = jQuery('#' + formId);
      jQuery(form).attr('action', s.url);
      jQuery(form).attr('method', 'POST');
      jQuery(form).attr('target', frameId);
            if(form.encoding)
      {
        jQuery(form).attr('encoding', 'multipart/form-data');           
            }
            else
      { 
        jQuery(form).attr('enctype', 'multipart/form-data');      
            }     
            jQuery(form).submit();

        } catch(e) 
    {     
            jQuery.handleError(s, xml, null, e);
        }
    
    jQuery('#' + frameId).load(uploadCallback );
        return {abort: function () {}}; 

    },

    uploadHttpData: function( r, type ) {
        var data = !type;
        data = type == "xml" || data ? r.responseXML : r.responseText;
        // If the type is "script", eval it in global context
        if ( type == "script" )
            jQuery.globalEval( data );
        // Get the JavaScript object, if JSON is used.
        if ( type == "json" )
            eval( "data = " + data );
        // evaluate scripts within html
        if ( type == "html" )
            jQuery("<div>").html(data).evalScripts();

        return data;
    },
    
    handleError: function( s, xhr, status, e ) {
      // If a local callback was specified, fire it
      if ( s.error ) {
          s.error.call( s.context || window, xhr, status, e );
      }

      // Fire the global callback
      if ( s.global ) {
          (s.context ? jQuery(s.context) : jQuery.event).trigger( "ajaxError", [xhr, s, e] );
      }
  }
})


/*zclip/jquery.zclip.js*/
/*
 * zClip :: jQuery ZeroClipboard v1.1.1
 * http://steamdev.com/zclip
 *
 * Copyright 2011, SteamDev
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Wed Jun 01, 2011
 */

$.fn.zclip = function (params) {

        if (typeof params == "object" && !params.length) {

            var settings = $.extend({

                path: 'ZeroClipboard.swf',
                copy: null,
                beforeCopy: null,
                afterCopy: null,
                clickAfter: true,
                setHandCursor: true,
                setCSSEffects: true

            }, params);
      

            return this.each(function () {

                var o = $(this);

                if (o.is(':visible') && (typeof settings.copy == 'string' || $.isFunction(settings.copy))) {

                    ZeroClipboard.setMoviePath(settings.path);
                    var clip = new ZeroClipboard.Client();
                    
                    if($.isFunction(settings.copy)){
                      o.bind('zClip_copy',settings.copy);
                    }
                    if($.isFunction(settings.beforeCopy)){
                      o.bind('zClip_beforeCopy',settings.beforeCopy);
                    }
                    if($.isFunction(settings.afterCopy)){
                      o.bind('zClip_afterCopy',settings.afterCopy);
                    }                    

                    clip.setHandCursor(settings.setHandCursor);
                    clip.setCSSEffects(settings.setCSSEffects);
                    clip.addEventListener('mouseOver', function (client) {
                        o.trigger('mouseenter');
                    });
                    clip.addEventListener('mouseOut', function (client) {
                        o.trigger('mouseleave');
                    });
                    clip.addEventListener('mouseDown', function (client) {

                        o.trigger('mousedown');
                        
      if(!$.isFunction(settings.copy)){
         clip.setText(settings.copy);
      } else {
         clip.setText(o.triggerHandler('zClip_copy'));
      }                        
                        
                        if ($.isFunction(settings.beforeCopy)) {
                            o.trigger('zClip_beforeCopy');                            
                        }

                    });

                    clip.addEventListener('complete', function (client, text) {

                        if ($.isFunction(settings.afterCopy)) {
                            
                            o.trigger('zClip_afterCopy');

                        } else {
                            if (text.length > 500) {
                                text = text.substr(0, 500) + "...\n\n(" + (text.length - 500) + " characters not shown)";
                            }
              
          o.removeClass('hover');
                            alert("Copied text to clipboard:\n\n " + text);
                        }

                        if (settings.clickAfter) {
                            o.trigger('click');
                        }

                    });

          
                    clip.glue(o[0], o.parent()[0]);
          
        $(window).bind('load resize',function(){clip.reposition();});
          

                }

            });

        } else if (typeof params == "string") {

            return this.each(function () {

                var o = $(this);

                params = params.toLowerCase();
                var zclipId = o.data('zclipId');
                var clipElm = $('#' + zclipId + '.zclip');

                if (params == "remove") {

                    clipElm.remove();
                    o.removeClass('active hover');

                } else if (params == "hide") {

                    clipElm.hide();
                    o.removeClass('active hover');

                } else if (params == "show") {

                    clipElm.show();

                }

            });

        }

    } 







// ZeroClipboard
// Simple Set Clipboard System
// Author: Joseph Huckaby
var ZeroClipboard = {

    version: "1.0.7",
    clients: {},
    // registered upload clients on page, indexed by id
    moviePath: 'ZeroClipboard.swf',
    // URL to movie
    nextId: 1,
    // ID of next movie
    $: function (thingy) {
        // simple DOM lookup utility function
        if (typeof(thingy) == 'string') thingy = document.getElementById(thingy);
        if (!thingy.addClass) {
            // extend element with a few useful methods
            thingy.hide = function () {
                this.style.display = 'none';
            };
            thingy.show = function () {
                this.style.display = '';
            };
            thingy.addClass = function (name) {
                this.removeClass(name);
                this.className += ' ' + name;
            };
            thingy.removeClass = function (name) {
                var classes = this.className.split(/\s+/);
                var idx = -1;
                for (var k = 0; k < classes.length; k++) {
                    if (classes[k] == name) {
                        idx = k;
                        k = classes.length;
                    }
                }
                if (idx > -1) {
                    classes.splice(idx, 1);
                    this.className = classes.join(' ');
                }
                return this;
            };
            thingy.hasClass = function (name) {
                return !!this.className.match(new RegExp("\\s*" + name + "\\s*"));
            };
        }
        return thingy;
    },

    setMoviePath: function (path) {
        // set path to ZeroClipboard.swf
        this.moviePath = path;
    },

    dispatch: function (id, eventName, args) {
        // receive event from flash movie, send to client   
        var client = this.clients[id];
        if (client) {
            client.receiveEvent(eventName, args);
        }
    },

    register: function (id, client) {
        // register new client to receive events
        this.clients[id] = client;
    },

    getDOMObjectPosition: function (obj, stopObj) {
        // get absolute coordinates for dom element
        var info = {
            left: 0,
            top: 0,
            width: obj.width ? obj.width : obj.offsetWidth,
            height: obj.height ? obj.height : obj.offsetHeight
        };

        if (obj && (obj != stopObj)) {
      info.left += obj.offsetLeft;
            info.top += obj.offsetTop;
        }

        return info;
    },

    Client: function (elem) {
        // constructor for new simple upload client
        this.handlers = {};

        // unique ID
        this.id = ZeroClipboard.nextId++;
        this.movieId = 'ZeroClipboardMovie_' + this.id;

        // register client with singleton to receive flash events
        ZeroClipboard.register(this.id, this);

        // create movie
        if (elem) this.glue(elem);
    }
};

ZeroClipboard.Client.prototype = {

    id: 0,
    // unique ID for us
    ready: false,
    // whether movie is ready to receive events or not
    movie: null,
    // reference to movie object
    clipText: '',
    // text to copy to clipboard
    handCursorEnabled: true,
    // whether to show hand cursor, or default pointer cursor
    cssEffects: true,
    // enable CSS mouse effects on dom container
    handlers: null,
    // user event handlers
    glue: function (elem, appendElem, stylesToAdd) {
        // glue to DOM element
        // elem can be ID or actual DOM element object
        this.domElement = ZeroClipboard.$(elem);

        // float just above object, or zIndex 99 if dom element isn't set
        var zIndex = 99;
        if (this.domElement.style.zIndex) {
            zIndex = parseInt(this.domElement.style.zIndex, 10) + 1;
        }

        if (typeof(appendElem) == 'string') {
            appendElem = ZeroClipboard.$(appendElem);
        } else if (typeof(appendElem) == 'undefined') {
            appendElem = document.getElementsByTagName('body')[0];
        }

        // find X/Y position of domElement
        var box = ZeroClipboard.getDOMObjectPosition(this.domElement, appendElem);

        // create floating DIV above element
        this.div = document.createElement('div');
        this.div.className = "zclip";
        this.div.id = "zclip-" + this.movieId;
        $(this.domElement).data('zclipId', 'zclip-' + this.movieId);
        var style = this.div.style;
        style.position = 'absolute';
        style.left = '' + box.left + 'px';
        style.top = '' + box.top + 'px';
        style.width = '' + box.width + 'px';
        style.height = '' + box.height + 'px';
        style.zIndex = zIndex;

        if (typeof(stylesToAdd) == 'object') {
            for (addedStyle in stylesToAdd) {
                style[addedStyle] = stylesToAdd[addedStyle];
            }
        }

        // style.backgroundColor = '#f00'; // debug
        appendElem.appendChild(this.div);

        this.div.innerHTML = this.getHTML(box.width, box.height);
    },

    getHTML: function (width, height) {
        // return HTML for movie
        var html = '';
        var flashvars = 'id=' + this.id + '&width=' + width + '&height=' + height;

        if (navigator.userAgent.match(/MSIE/)) {
            // IE gets an OBJECT tag
            var protocol = location.href.match(/^https/i) ? 'https://' : 'http://';
            html += '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="' + protocol + 'download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="' + width + '" height="' + height + '" id="' + this.movieId + '" align="middle"><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="false" /><param name="movie" value="' + ZeroClipboard.moviePath + '" /><param name="loop" value="false" /><param name="menu" value="false" /><param name="quality" value="best" /><param name="bgcolor" value="#ffffff" /><param name="flashvars" value="' + flashvars + '"/><param name="wmode" value="transparent"/></object>';
        } else {
            // all other browsers get an EMBED tag
            html += '<embed id="' + this.movieId + '" src="' + ZeroClipboard.moviePath + '" loop="false" menu="false" quality="best" bgcolor="#ffffff" width="' + width + '" height="' + height + '" name="' + this.movieId + '" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" flashvars="' + flashvars + '" wmode="transparent" />';
        }
        return html;
    },

    hide: function () {
        // temporarily hide floater offscreen
        if (this.div) {
            this.div.style.left = '-2000px';
        }
    },

    show: function () {
        // show ourselves after a call to hide()
        this.reposition();
    },

    destroy: function () {
        // destroy control and floater
        if (this.domElement && this.div) {
            this.hide();
            this.div.innerHTML = '';

            var body = document.getElementsByTagName('body')[0];
            try {
                body.removeChild(this.div);
            } catch (e) {;
            }

            this.domElement = null;
            this.div = null;
        }
    },

    reposition: function (elem) {
        // reposition our floating div, optionally to new container
        // warning: container CANNOT change size, only position
        if (elem) {
            this.domElement = ZeroClipboard.$(elem);
            if (!this.domElement) this.hide();
        }

        if (this.domElement && this.div) {
            var box = ZeroClipboard.getDOMObjectPosition(this.domElement);
            var style = this.div.style;
            style.left = '' + box.left + 'px';
            style.top = '' + box.top + 'px';
        }
    },

    setText: function (newText) {
        // set text to be copied to clipboard
        this.clipText = newText;
        if (this.ready) {
            this.movie.setText(newText);
        }
    },

    addEventListener: function (eventName, func) {
        // add user event listener for event
        // event types: load, queueStart, fileStart, fileComplete, queueComplete, progress, error, cancel
        eventName = eventName.toString().toLowerCase().replace(/^on/, '');
        if (!this.handlers[eventName]) {
            this.handlers[eventName] = [];
        }
        this.handlers[eventName].push(func);
    },

    setHandCursor: function (enabled) {
        // enable hand cursor (true), or default arrow cursor (false)
        this.handCursorEnabled = enabled;
        if (this.ready) {
            this.movie.setHandCursor(enabled);
        }
    },

    setCSSEffects: function (enabled) {
        // enable or disable CSS effects on DOM container
        this.cssEffects = !! enabled;
    },

    receiveEvent: function (eventName, args) {
        // receive event from flash
        eventName = eventName.toString().toLowerCase().replace(/^on/, '');

        // special behavior for certain events
        switch (eventName) {
        case 'load':
            // movie claims it is ready, but in IE this isn't always the case...
            // bug fix: Cannot extend EMBED DOM elements in Firefox, must use traditional function
            this.movie = document.getElementById(this.movieId);
            if (!this.movie) {
                var self = this;
                setTimeout(function () {
                    self.receiveEvent('load', null);
                }, 1);
                return;
            }

            // firefox on pc needs a "kick" in order to set these in certain cases
            if (!this.ready && navigator.userAgent.match(/Firefox/) && navigator.userAgent.match(/Windows/)) {
                var self = this;
                setTimeout(function () {
                    self.receiveEvent('load', null);
                }, 100);
                this.ready = true;
                return;
            }

            this.ready = true;
            try {
                this.movie.setText(this.clipText);
            } catch (e) {}
            try {
                this.movie.setHandCursor(this.handCursorEnabled);
            } catch (e) {}
            break;

        case 'mouseover':
            if (this.domElement && this.cssEffects) {
                this.domElement.addClass('hover');
                if (this.recoverActive) {
                    this.domElement.addClass('active');
                }


            }


            break;

        case 'mouseout':
            if (this.domElement && this.cssEffects) {
                this.recoverActive = false;
                if (this.domElement.hasClass('active')) {
                    this.domElement.removeClass('active');
                    this.recoverActive = true;
                }
                this.domElement.removeClass('hover');

            }
            break;

        case 'mousedown':
            if (this.domElement && this.cssEffects) {
                this.domElement.addClass('active');
            }
            break;

        case 'mouseup':
            if (this.domElement && this.cssEffects) {
                this.domElement.removeClass('active');
                this.recoverActive = false;
            }
            break;
        } // switch eventName
        if (this.handlers[eventName]) {
            for (var idx = 0, len = this.handlers[eventName].length; idx < len; idx++) {
                var func = this.handlers[eventName][idx];

                if (typeof(func) == 'function') {
                    // actual function reference
                    func(this, args);
                } else if ((typeof(func) == 'object') && (func.length == 2)) {
                    // PHP style object + method, i.e. [myObject, 'myMethod']
                    func[0][func[1]](this, args);
                } else if (typeof(func) == 'string') {
                    // name of function
                    window[func](this, args);
                }
            } // foreach event handler defined
        } // user defined handler for event
    }

};
/*admin/core.js*/
$(function(){$(".event-fb-fallback").error(function(){$(this).error(null).attr("src","https://s3.amazonaws.com/bazu-static/img/event/assets/bazu/std-90x90.jpg").attr("title","If you're seeing this, you should go to Event/Registration/Graphics and update the event icon graphic")});$(".chipreads tr").not(".disabled").click(function(){$(this).closest("table:first").find("tr").removeClass("current").end().addClass("current")});$(".device .top").click(function(d){$(this).closest(".device").toggleClass("collapsed").toggleClass("expanded");if(d.shiftKey){var c=$(this).closest(".device").hasClass("collapsed")?"collapsed":"expanded";$(this).closest(".device-group").find(".device").removeClass("collapsed").removeClass("expanded").addClass(c)}return false});$("ul.markers li, ul.markers li *").click(function(){$("ul.markers li").css("z-index","3");$(this).closest("li").css("z-index","50")});$.reject({reject:{all:false,msie5:true,msie6:true,msie7:false},close:false,imagePath:"/js/jreject/images/",paragraph1:"Your browser is out of date and is not compatible with our website.  A list of supported, popular web browsers can be found below.  Click on any of the browser icons to be redirected to the appropriate download page.",paragraph2:"<br/>",display:["firefox","chrome","opera","msie","safari"],browserInfo:{firefox:{text:"Firefox",url:"http://www.mozilla.org/en-US/firefox/new/"},safari:{text:"Safari",url:"http://www.apple.com/safari/"},opera:{text:"Opera",url:"http://www.opera.com/download/"},chrome:{text:"Chrome",url:"https://www.google.com/intl/en/chrome/browser/"},msie:{text:"Internet Explorer",url:"http://windows.microsoft.com/en-us/internet-explorer/download-ie"}}});var a=null;function b(){var c=$(".event-id").data("event-id");$(".recalc-status-container").load("/event/recalc-status/eventID/"+c,function(f){if(f.charAt(0)=="{"){var d=jQuery.parseJSON(f);if(d.code==-2){var e=d.url;window.location.replace(e);return false}}setupElements($(this));$(this).show();if($(this).attr("auto-recalc")=="on"){a=setTimeout(b,9500+1000*Math.random())}return true})}b();$(".recalc-status-container").on("click","#toggleScoring",function(){showSpinner($("#scoringDropDown"));var c=$(this).attr("href");$.post(c,null,function(d){if(d.status==1){$.jGrowl(gt.gettext(d.msg),{theme:"error"})}else{$.jGrowl(gt.gettext(d.msg),{theme:"success"})}$("div.recalc-status-container").attr("auto-recalc",d.recalcStatus);$("#scoringDropDown").busy("hide");$(".recalc-status-container").hide();clearTimeout(a);b()});return false});$("#copyEventTag").zclip({path:"/js/zclip/ZeroClipboard.swf",copy:$("#event-tag").val(),afterCopy:function(){$("#copyEventTag").find("i").remove();var c=$("#copyEventTag").html();c+=' <i class="icon-ok icon-white"></i>';$("#copyEventTag").html(c)}})});
/*admin/entry.js*/
$(function(){$("#bibName").closest("div").css("width","100%");$("#resetsearch").click(function(){$.get("/admin/entry/reset",function(b){$("#raceID").val("");$("#bracketID").val("");$("#waveID").val("");$("#status").val("");$("#isTest").val("0");$("#bibName").val("");window.location.href="/admin/entry/search"})});$("#import-entry-form .team_id").live("change",function(){var b=$(this).val();if(b.substring(0,5)=="_NEW_"){$("#import-entry-form .new-team-name-"+$(this).attr("team")).show();$("#import-entry-form .new-team-type-"+$(this).attr("team")).show()}else{$("#import-entry-form .new-team-name-"+$(this).attr("team")).hide();$("#import-entry-form .new-team-type-"+$(this).attr("team")).hide()}resizeModal()});$("#resetathletesearch").click(function(){$("#organizer_id").val("");$("#organizer_id").trigger("updated:lizt");$("#name").val("");$.get("/admin/organization/reset",function(b){window.location.href="/admin/organization/athletes"})});function a(c){var b;switch(c){case"OVERALL":b=$(".open").find("input[type=checkbox]");break;case"GENDER":b=$(".sex").find("input[type=checkbox]");break;default:return;break}b.prop("checked",!b.prop("checked"))}$(".btn-group .custom-bracket").on("click",function(){$(".custom-bracket").removeClass("selected");$(this).addClass("selected");$("#policy-custom").html($(this).text());$("#prefered_bracket").val($(this).data("value"));$("#prefered_bracket").trigger("liszt:updated")});$("#edit-entry-form .br-policy").on("click",function(g){g.preventDefault();var i=$(this);a(i.val());var f=$("#bracketPolicy").val();var h=f==""?new Array():f.split(",");if($.inArray(i.val(),h)==-1){h.push(i.val());$("#bracketPolicy").val(h.join(","));i.removeClass("btn-success").addClass("btn-disabled");if(i.val()=="CUSTOM_PRIMARY"){i.next().removeClass("btn-success").addClass("avoid-clicks").addClass("btn-disabled")}}else{$.each(h,function(e,m){if(m==i.val()){h.splice(e,1)}});$("#bracketPolicy").val(h.join(","));i.removeClass("btn-disabled").addClass("btn-success");if(i.val()=="CUSTOM_PRIMARY"){i.next().removeClass("btn-disabled").removeClass("avoid-clicks").addClass("btn-success")}}if($.inArray("CUSTOM_PRIMARY",h)==-1){$("#prefered_bracket").attr("disabled",false);$("#prefered_bracket").trigger("liszt:updated")}else{$("#prefered_bracket").attr("disabled",true);$("#prefered_bracket").trigger("liszt:updated")}if($.inArray("AGE",h)==-1){$(".age").find("label").removeClass("disabled");$(".age").find("input[type=checkbox]").removeAttr("disabled")}else{$(".age").find("label").addClass("disabled");$(".age").find("input[type=checkbox]").attr("disabled","disabled")}var d=$($(".br-policy.btn-success").last()).val();var c={CUSTOM_PRIMARY:"custom-label",AGE:"age-label",GENDER:"gender-label",OVERALL:"overall-label"};var l="<div class='alert no-bracket-error alert-error overlapNotify'>"+gt.gettext("Please select your preferred custom Primary Bracket")+"</div>";if(d=="CUSTOM_PRIMARY"&&$("#prefered_bracket option:selected").text()=="-Not Set-"){setTimeout(function(){$("#customBracketList").trigger("click");$(l).insertAfter("#fr-entry-bracketPolicy")},100);$("#policy-custom").text("Please Select");$(".primary_bracker_wrap").addClass("red")}else{$(".primary_bracker_wrap").removeClass("red");$("#policy-custom").text("Custom");$(l).remove()}$(".dropdown-menu .custom-bracket").on("click",function(){$(".primary_bracker_wrap").removeClass("red");$("#policy-custom").text($(this).text());$(".primary_bracker_wrap").text($(this).text());$(".no-bracket-error").remove();$(".custom-label").find("input").prop("checked",false);var e=$(this).text();$(".custom-label").filter(function(){return $(this).text()===e}).find("input").prop("checked",true)});$(".primary_bracker_kinetic").attr("bracket-policy",d);var j=$($("."+c[d]).find("input:checked")[0]).parent().text();var k=j==""||$("#bracketPolicy").val().indexOf("CUSTOM_PRIMARY")==-1?"Not Set":j;$(".primary_bracker_wrap").html(k);var b="<div class='alert no-bracket-error alert-error overlapNotify'>"+gt.gettext("Entry must have a Primary Bracket")+"</div>";if($(".br-policy.btn-success").length==0){$(b).insertAfter("#fr-entry-bracketPolicy")}else{$(".no-bracket-error").remove()}});$(".age-bracket").on("click",function(){var b=[];$(".age-bracket").each(function(){if(!$(this).prop("checked")){b.push($(this).val())}});$("#removeFromBracket").val(b.join())})});
/*admin/events.js*/
$(function(){$("#event-results_url,#event-results_theme,#event-current_gen_id,#event-show_athlete_names,#event-mute_video,#event-live_video,#event-results_age_information-age,#event-results_age_information-primarybracketname,#event-results_age_information-sex,#event-results_video_tab-1,#event-results_video_tab-0,#event-results_photo_tab-1,#event-results_photo_tab-0").change(function(){$("#unsavedChanges").val(1);var b="You have unsaved changes that will be lost if you reload or leave this page now.";var c=$("#unsavedChanges").val();var a=b;window.onbeforeunload=function(){if(c==1){return a}}});$("form").submit(function(){window.onbeforeunload=false});$("#race-gunstart").live("change",function(){if($(this).val()!=""){var c=$(this).find("option:selected").attr("label").split(" ");var d=c[0];var b=c[2]?c[2]:"";var a=c[1]+" "+b;$("#race-actual_start_time-date").val(d);$("#race-actual_start_time-time").val(a)}});if($(".race-list").hasClass("no-races")){$(".add-race").trigger("click")}$("#edit-event-form .navmenu").live("change",function(){$(this).closest("form").find("#submitvalue").val("submitjump").end().submit()});$("#event-start_time-date").live("change",function(){$("#event-end_time-date").val($(this).val())});$("#add_timer, #event-remove_timer").live("click",(function(){if($(this).is(":checked")){$('*[id^="fr-event"]').attr("display","block");$('*[id^="fr-event"]').show();$('input[class*="timer_id-dep"]').removeAttr("disabled");$('select[class*="timer_id-dep"]').removeAttr("disabled").trigger("liszt:updated");$("#timer_id").find("option:first-child").prop("selected",true).end().trigger("liszt:updated")}else{$('*[id^="fr-event"]').hide();$('*[id^="fr-event"]').attr("display","none");$(this).parent().show();$('input[class*="timer_id-dep"], select[class*="timer_id-dep"]').attr("disabled","disabled");$('*[class*="timer_id-dep"]').val("");$("#event-timer_id").val("_NEW_").trigger("liszt:updated")}}));$("#context").change(function(){this.form.submit()});$("#search-regPromo-form #submitsearch").click(function(){if($("#couponTerm").val()==""){window.location.href="/admin/event/reg-promos?reset=1";return false}});$("#db-update-btn").click()});function eqsUiEventSelected(b){var a="/admin/event/index/eventID/"+encodeURIComponent(b.eventID);window.location.replace(a)};
/*admin/waiver.js*/
$(function(){$("#create-event-waiver-form .waiver_id").live("change",function(){var b=$(this).val();if(b==""){$("#waiver-name").val("");$("#waiver-description").val("");recenter($(this).closest(".overlay"))}else{if(b=="_NEW_"){$("#event_waiver-name").val("");var a=$("#event_waiver-waiver").data("wysihtml5");a.editor.clear();$('input[type="radio"].waiver_rules').removeAttr("checked","checked");$("#event_waiver-rules-STANDARD").attr("checked","checked");$("#fr-event_waiver-scroll").hide();$("#event_waiver-scroll").attr("checked",false)}else{$this=$(this);$(this).busy({position:"right",hide:false,zIndex:1020});$("#overlay").append('<div class="spinner"><div class="inner"></div></div>');$.get("/admin/event-waiver/list/eventWaiverID/"+b,null,function(c){$this.busy("hide");$("#event_waiver-name").val(c.name);$(".wysihtml5-sandbox").contents().find("body").html(c.waiver);$('input[type="radio"].waiver_rules').removeAttr("checked","checked");$("#event_waiver-rules-"+c.rules).attr("checked","checked");if(c.rules!="STANDARD"){$("#fr-event_waiver-scroll").show()}else{$("#fr-event_waiver-scroll").hide();$("#event_waiver-scroll").attr("checked",false)}$("#overlay").find(".spinner").hide()}).error(function(){$this.busy("hide");$.jGrowl("Ajax call failed",{theme:"error"})})}}})});
/*admin/report-edit.js*/
$(document).ready(function(){$("#report-params-race_id").live("change",function(){$.post("/admin/report/get-race-info",{raceID:$(this).val(),removeAll:$("#report-params-interval_id").attr("removeAll")},function(d){var c="";for(var b=0;b<d.intervals.length;b++){c+='<option value="'+d.intervals[b].id+'">'+d.intervals[b].name+"</option>"}$("#report-params-interval_id").html(c);$("#report-params-interval_id").trigger("liszt:updated");var a="";for(var e=0;e<d.brackets.length;e++){var f=d.brackets[e].id;var g=d.brackets[e].name;a+='<label class="fl120 multicheckbox" for="report-params-bracket_id-'+f+'"><input type="checkbox" name="report[params][bracket_id][]" value="'+f+'" id="report-params-bracket_id-'+f+'" class="cbg bracket_id" />'+g+"</label>"}$("#fr-report-params-bracket_id > div.multibutton").html(a)})});$(document).on("change","form#assign-bibs-event-form #assignment_type",function(d){var e=$(this).val();var b=(e==="import");var a=$("form#assign-bibs-event-form");var c=$(".fileupload_container",a);var f=$(".assignment_order_container",a);if(e==="delete_bib_map"){c.toggle(false);f.toggle(false)}else{c.toggle(b);f.toggle(!b)}});$(document).on("click","#addAnotherDate",function(b){numOfAddedRows=$("#numOfRows").val();numOfAddedRows++;$("#numOfRows").val(numOfAddedRows);var a='<div class="multi-element-column span9 pull-right newDates"><div class="fr fr-date_1" id="fr-date_1" style="overflow:visible;"><div class="span3 input-append pull-left date control-group"style="margin-left:0px;" data-date="" data-date-format="mm/dd/yyyy"><input type="text" name="date_'+numOfAddedRows+'" id="date'+numOfAddedRows+'" value="" class="span2 form-text-date  txm cbg span5 inline" placeholder="mm/dd/yyyy"style="font-size:12px !important;">&nbsp;<span class="add-on"><i class="icon-calendar button-icon-left"></i></span></div></div><div class="span2 removeDate"><div style="overflow:visible;" class="fr fr-intro" id="fr-intro"><div class="form-content fi "><div style="font-size: 13px;margin-top: 29px;"><a href="#">Remove</a>\n          </div></div></div></div></div>';$(this).closest("div.multi-element-column").before(a);setupElements($(".newDates"));$("#numOfRows").val(numOfAddedRows)});$(document).on("click",".removeDate",function(a){$(this).parent().remove()})});
/*admin/entry-edit.js*/
function entry_edit_init(form) {
  $('select.auto_bracket_policy',form).change(function(){
    var val = $(this).val();
    $('.fr-brackets input:checkbox',form).removeAttr('disabled');
    $('.fr-brackets label.ui-state-disabled',form).removeClass('ui-state-disabled');
    $('.fr-primary_bracket_id select',form).removeAttr('disabled').trigger('liszt:updated');
    if (val != 'NONE') {
      $('.fr-brackets input.OPEN',form).attr('disabled','disabled');
      $('.fr-brackets label.OPEN',form).addClass('ui-state-disabled');
    }
    if (val == 'SEX' || val == 'AGE') {
      $('.fr-brackets input.SEX',form).attr('disabled','disabled');
      $('.fr-brackets label.SEX',form).addClass('ui-state-disabled');
    }
    if (val == 'AGE') {
      $('.fr-brackets input.AGE',form).attr('disabled','disabled');
      $('.fr-brackets label.AGE',form).addClass('ui-state-disabled');
      $('.fr-primary_bracket_id select',form).attr('disabled','disabled').trigger('liszt:updated');
    }
  }).trigger('change').trigger('liszt:updated');

  $("#fr-entry-typeTeam").on('change', '#team_id', function() {
    if ($(this).val() != "") {
      $("#fr-entry-raceWave").find("#type").val("MEMBER").trigger('liszt:updated');
    }
    else {
      $("#fr-entry-raceWave").find("#type").val("IND").trigger('liszt:updated');;
    }
  });
  
  $("#fr-entry-typeTeam").on('change', '#type', function(){
    $("#fr-entry-typeTeam").find('#team_id').prop('disabled', $(this).val() === 'IND').trigger('liszt:updated');
    $('#entry-bib').prop('disabled', $(this).val() !== 'IND' && $('#entry-bib').is(':disabled'));
    $('#entry-via-assignTag-tags').prop('disabled', 
      $(this).val() !== 'IND' && $('#entry-via-assignTag-tags').is(":disabled"));
  });
  
  var raceEl = $('select.race_id',form);
  if (raceEl.size() > 0) {
    var origRaceID = raceEl.val();
    $('form').on('change', 'select.race_id.update-race-inputs', function() {
      var raceID = $(this).val();
      var regOptionID = $('select.reg_option').val();
      var actType = $(this).closest('form').attr('id')=="edit-entry-form"?"edit":"create";
      var args = {originalRaceID: origRaceID, newRaceID: raceID, regOptionID: regOptionID, actionType: actType};
      $(this).busy({position:'right',hide:false});
      $(this).closest('form').find('.race-sensitive,input:submit').attr('disabled','disabled');
      var $this=$(this);
      $.post('/admin/entry/update-race-inputs',args,function(data) {
        for (sel in data) {
          if (sel == "#wave_id") {
            $(sel).closest('div.control-group').find('.multi-element-column')
              .find('.fr-wave_id').find('label.apply-wave-rule').remove();
          }
          $(sel).closest('div.control-group').find('div.chzn-container').remove();
          $(sel).replaceWith(data[sel]);
          if($(sel).is('select')) {
            $(sel).chosen({disable_search_threshold: 10});
          }
        }
        setTimeout(function(){$('select.auto_bracket_policy',form).trigger('change').trigger('liszt:updated');},0);
        if (origRaceID != raceID && actType=="edit") {
          $('select.race_id.update-race-inputs').closest('form').find('.race-change-note').remove();
          $('select.race_id.update-race-inputs').closest('div.multi-element-column')
            .append('<div class="race-change-note alert alert-danger span6 pull-right" style="margin-right:10px;">Race change will be applied on submit</div>');
        }
        else {
          $('select.race_id.update-race-inputs').closest('form').find('.race-change-note').remove();
        }
        $this.closest('form').find('.race-sensitive,input:submit').removeAttr('disabled');
        $this.busy('hide');
      });
      if ($('#bracketPolicy').val().indexOf('CUSTOM_PRIMARY') === -1) {
        $("#bracketPolicy").val("CUSTOM, CUSTOM_PRIMARY");
      }
      $(".br-policy").prop('disabled', 'disabled');
      $("#customBracketList").prop('disabled', 'disabled');
    });
    $('form').on('change', 'select.reg_option', function(){
      var regOptionID = $(this).val();    
      var race = $('select.race_id');
      $.post('/admin/entry/get-races-by-reg-option',{regOptionID: regOptionID},function(data) {
        var h = '';
        $.each(data,function(id,name){
          h += '<option value="'+id+'">'+name+'</option>';
        });
        race.html(h);
        race.trigger('change');
        race.trigger('liszt:updated');;
      });
    });
  }
  
  if($('#entry-check_in').val() == 1) {
     $('#entry-by_proxy').removeAttr('disabled');
  } 
  else {
     $('#entry-by_proxy').attr('disabled', true);
  }
   
  $('#entry-check_in').on('change', function(){
    if($(this).val() != 1) {
      $('#entry-by_proxy').attr('disabled', true); 
    }
    else {
      $('#entry-by_proxy').removeAttr('disabled');
    }  
  });
  
  var $race = $('select.wrong-race');
  if($race.size() > 0) {
    var $wrongRace = $race.find('option[value="WRONG_RACE"]');
    $wrongRace.addClass('wrong-race-option');
    $wrongRace.trigger('liszt:updated');
    var wrongRaceAlert = gt.gettext('Current race does not mach current reg choice.')
    $('#entry_reg_option_id_chzn').after(
      '<div id="wrong-race-alert" class="alert alert-danger">' + 
        wrongRaceAlert + 
      '</div>'
    );
    
    $('select.wrong-race').on('change', function() {
      if($(this).val() === 'WRONG_RACE') {
        return;
      }
      $(this).removeClass('wrong-race');
      $('label.wrong-race').removeClass('wrong-race');
      $('div#wrong-race-alert').remove();
      $('#fr-entry-raceWave').find('ul.errors').remove();
    });
  }
  
}

/*admin/team-edit.js*/
$(document).ready(function(){
  var regData = $('#team-reg_option_id').data('reg');
  var savedBracketIDs = new Array();
  $('input.brackets:checked').each(function(){
    savedBracketIDs.push($(this).val());
  });
  $('#edit-team-form').on('change', '#team-reg_option_id', function(){
    var value = $(this).val();
    var regOption = regData[value];
    var raceHTML = '', waveHTML = '', pimaryBracketHTML = '', bracketHTML = '', race;
    for(var raceID in regOption['races']) {
      race = regOption['races'][raceID];
      raceHTML += '<option value="' + raceID + '">' + race['name'] + '</option>'
      if(!waveHTML) {
        var waves = race['waves'];
        for(var waveID in waves) {
          waveHTML += '<option value="' + waveID + '">' + waves[waveID] + '</option>';
        }
      }
      if(!bracketHTML) {
        var brackets = race['brackets'];
        for(var bracketID in brackets) {
          pimaryBracketHTML += '<option value="' + bracketID + '">' + brackets[bracketID] + '</option>';
          bracketHTML += '<label for="entry-via-assignBrackets-brackets-' + bracketID + '" class="fl120 multicheckbox short-label checkbox">' + 
                           '<input type="checkbox" class="cbg brackets" value="' + bracketID + 
                                '" id="entry-via-assignBrackets-brackets-' + bracketID + 
                                '" name="entry[via][assignBrackets][brackets][]"' + 
                                ($.inArray(bracketID, savedBracketIDs) > -1 ? 'checked' : '') +'>' + 
                           brackets[bracketID] +
                         '</label>';
        }
      }
    }
    $('#edit-team-form').find('#race_id').html(raceHTML).trigger('liszt:updated');
    $('#edit-team-form').find('#wave_id').html(waveHTML).trigger('liszt:updated');
    $('#edit-team-form').find('#entry-primary_bracket_id').html(pimaryBracketHTML).trigger('liszt:updated');
    $('#fr-entry-via-assignBrackets-brackets > div.multibutton').html(bracketHTML);
    $('#entry-allow_tracking').attr('disabled', regOption['team_type'] == 'AGGREGATE');
  });
  
  var searchingTeamEntry = false, teamTimeout;
  
  $('.container').on('click', 'li.team_result', function(){
    $(this).closest('div.teamMembersResults').hide();
    $('#team_entry').val($(this).find('span.teamName').html())
    var href = $('#addTeamMember').attr('href');
    $('#addTeamMember').attr('href', href + '&entryID=' + $(this).attr('id'));
  });
    
  $('#team_entry').on('keyup', function(){
    var $search = $(this);
    teamTimeout = setTimeout(function(){
      if(!searchingTeamEntry) {
        searchingTeamEntry = true
        $.post('/admin/entry/team-members-search', 
              {team_entry:$search.val(), regOptionID:$('#regOptionID').val(), excludeEntryID:$('#exludeEntries').val()}, function(data) {
          var results = '<ul>';
          $('div.teamMembersResults').remove();
          if(data.length) {
            for( var i in data) {
              results += '<li class="team_result" id="' + data[i]['id'] + '" bib="' + data[i]['bib'] + '">' +
                          '<span>' + data[i]['id'] + "</span> - "  +
                          '<span class="teamName">' + data[i]['name'] + "</span> - "  +
                          '<span>' + data[i]['sex'] + "</span> - "  +
                          '<span>' + data[i]['age'] + "</span> - "  +
                          '<span>' + data[i]['team_name'] + "</span> - "  +
                          '<span class="teamBib">' + data[i]['bib'] + "</span>"  +
                        '</li>'
            }
            results += '</ul>';
          } else {
            results += '<li>' + gt.gettext('No results') + '</li></ul>';
          }
          $search.closest('div').append('<div class="teamMembersResults">' + results + '</div>');
          searchingTeamEntry = false;
        })
      }
    }, 1500);
  });
  
  $('#team_entry').on('blur', function(){
    $('body').on('click', function(e) {
      if (!$(e.target).hasClass('team_result') && !$('#team_entry').hasClass('focus')) {
        $('div.teamMembersResults').hide();
      }
    });
    $(this).removeClass('focus');
  });
  
  $('#team_entry').on('focus', function(){
    $(this).addClass('focus');
    $('div.teamMembersResults').show();
  });
  
  $('#addTeamMember').on('click', function(){
    $.post($(this).attr('href'), function(data) {
        if ($('#alert-team')) {
          $('#alert-team').remove();
        }
        if(data.prevTeamID) {
          $('#team_member_info').attr('href', $('#team_member_info').attr('href') + 
                                              '?teamID=' + data.prevTeamID + '&' +
                                              'athleteID=' + data.athleteID);
          handlePopup.apply($('#team_member_info'));
        } 
        else {
          $('#team_entry').closest('div').append('<div id="alert-team" class="span8 offset3 alert alert-'+data.alert
            +'" style="margin-left:25.66% !important">' 
            + data.message + '</div>'); 
          if (data.alert == 'success') {
            window.location.reload();
          }
        }
    });
    return false;
  });
  
  $('#edit-team-form').on('keypress', function(event){
    if(event.keyCode == 13) {
      event.preventDefault();
      return false;
    }
  });
  
  $('#edit-team-form').on('change', 'select,input:not(#team_entry)', function(){
    window.onbeforeunload = function(e) {
      return true;
    };
  });
  
  $('#edit-team-form select#entry-auto_bracket_policy').on('change', function() {
    $('#entry-primary_bracket_id,#fr-entry-via-assignTeamBrackets-brackets input')
      .attr('disabled', $(this).val() == 'TEAM');
    $('#entry-primary_bracket_id').trigger('liszt:updated');
  });
  
})
/*admin/country-region-postal.js*/
function countryRegionPostalInit(b){if($(b).data("crpproc")=="processed"){return}var g=$(".organizer_id",b);var c=$(".timer_id",b);var h=$("select.country",b);var d=$("select.region_id",b);var f=d.add(".city",b).add(".time_zone",b);f.unbind("change").change(function(){if($(this).hasClass("ui-state-disabled")){$(this).val($(this).data("sticky"));return false}return true});var e=$(".postal_code",b);var a="";var i=$(".time_zone",b);if(h.size()>0){h.unbind("change").change(function(){var m=h.val();if(!h.attr("no-country")&&!m){m="US"}$("#overlay").append('<div class="spinner"><div class="inner"></div></div>');var k=g?g.val():null;var l=c?c.val():null;var j=d?d.val():null;$.post("/reg/regions-for-country",{country:m,organizerID:k,timerID:l,regionID:j},function(q){if(!q||q.length==0){d.html('<option value="" selected="selected">No Region</option>')}else{var p="";var o=d.val();var n=d.data();if(n!=null){if(typeof n.selectedRegion!=="undefined"){o=n.selectedRegion}if(typeof n.regionId!=="undefined"){o=n.regionId}}$.each(q,function(s,u){var t=u.selected=="1"?u.id:o;if(d.attr("no-country")&&m=="US"&&u.id==""){u.id="US_--"}p+='<option value="'+u.id+'"'+(u.id==t?' selected="selected"':"")+">"+u.name+"</option>"});d.html(p)}if(d.parent().children("ul.errors").length>0){d.val("")}d.trigger("liszt:updated");$("#overlay").find(".spinner").remove()},"json")});h.trigger("change");h.trigger("liszt:updated");e.unbind("keydown").keydown(function(j){if(j.which==13||j.keyCode==13){return false}});e.unbind("focus").focus(function(){$("button.submit").attr("disabled","disabled")});e.unbind("blur").blur(function(){if($(this).val()==a||a==""){$("button.submit").removeAttr("disabled")}a=$(this).val()});e.unbind("change").change(function(){$(this).removeClass("ui-state-error").parent().find(".error").remove();if($.trim($(this).val())==""){return}if(h.val()=="US"||h.val()==""){$this=$(this);$("#overlay").append('<div class="spinner"><div class="inner"></div></div>');$.post("/reg/postal-code-change",{postalCode:$this.val(),country:h.val()},function(j){if(j.code==0){$(".city",b).val(j.city).data("sticky",j.city);d.val(j.regionID).data("sticky",j.regionID);d.trigger("liszt:updated");i.val(j.timeZone).data("sticky",j.timeZone);i.trigger("liszt:updated");$this.removeClass("ui-state-error").next(".error").remove();$(".geolocation-latitude").val(j.latitude);$(".geolocation-longitude").val(j.longitude)}else{$this.addClass("ui-state-error");$('<span class="error">Invalid Zip</span>').insertAfter($this)}$("#overlay").find(".spinner").remove();$("button.submit").removeAttr("disabled")})}})}$(b).data("crpproc","processed")};
/*admin/race-edit.js*/
function race_edit_init(a){$(".form-text-date.planned_start_time,.form-text-date.actual_start_time",a).each(function(){$(this).change(function(){var b=$(this).hasClass("planned_start_time")?"planned":"actual";var c=$(this).val();$(".form-text-date."+b+"_end_time").each(function(){if(c!=""){$(this).val(c)}})})});if($("#race-type").find("option:selected").val()=="multisport"){$("#fr-race-multisport_distance").show();$("#fr-race-legdistance").show();$("#fr-race-course_info-action").show();$("#fr-race-course_distance").hide();$("#fr-race-wants_penalties").hide()}$("#race-type").change(function(){if($(this).val()==="multisport"){$("#fr-race-multisport_distance").show();$("#fr-race-legdistance").show();$("#fr-race-course_info-action").show();$("#fr-race-course_distance").hide();$("#race-wants_penalties-1").prop("checked",true);$("#fr-race-wants_penalties").hide()}else{$("#fr-race-wants_penalties").show()}})};
/*admin/account.js*/
function mmUiEmailSelected(b){var a="/admin/account/manage?_step=1&accountEmail="+encodeURIComponent(b.email);$("#mm-ui-account-manage").attr("href",a).button("enable").trigger("click")}function mmUiEmailCleared(a){$("#mm-ui-form .token-input").tokenInput("flush")}function onAfterSeparate(c){var b=c.closest(".manage-accounts").find(".num-accounts");var a=parseInt(b.text());if(a==2){accountOneLeft(c.siblings(":visible"))}else{b.text(a-1)}c.hide(1000)}function onAfterMerge(c){var b={};var a="";$(".accountRoles").each(function(){var d=$(this).find("span").attr("data-roles");d=$.parseJSON(d);$.each(d,function(f,e){b[e]=e})});$.each(b,function(e,d){a+=d+"<br>"});c.siblings().fadeOut("slow").end().find(".accountRoles").html(a).end();accountOneLeft(c)}function accountOneLeft(b){b.find("a.separate, a.merge").remove().end().find("a.editAccount").show().end();var a=b.data("accountName")+" &lt;"+b.closest(".manage-accounts").data("email")+"&gt;";$("#mm-ui-form .token-input-token p").html(a);b.closest(".manage-accounts").find("div:first").html("<p>"+gt.gettext("You've merged all accounts into one. To edit this account, click the edit button below. Otherwise, close this dialog to continue.")+"</p>")}$(function(){$("#my-users .popup").click(handlePopup);$("a.separate,a.merge").live("click",function(){var a=$(this).hasClass("separate")?onAfterSeparate:onAfterMerge;var c=$(this).closest("tr");showSpinner($(this),99999);var b=$(this);$.get($(this).attr("href"),function(d){b.busy("hide");if(d.code==0){a(c)}else{alert(d.message)}});return false});$("#role.account-search").change(function(){var a=$(this).val();if(a==1){$("#organizer_id.account-search").attr("disabled",true).trigger("liszt:updated")}else{$("#organizer_id.account-search").attr("disabled",false).trigger("liszt:updated")}});$("#organizer_id.account-search").each(function(){if($("#role.account-search").val()==1){$(this).attr("disabled",true).trigger("liszt:updated")}})});
/*admin/event-camera-edit.js*/
function event_camera_edit_init(a){$(".checkpoint_id",a).change(function(){var b=$(".checkpoint_id").closest(".overlay");b.append('<div class="spinner"><div class="inner"></div></div>');$.post("/admin/scoring/get-camera-mats",{checkpoint:$(this).val()},function(g){var c="";for(var e=0;e<g.length;e++){var h=g[e].id;var d=g[e].mat;var f=g[e].device;c+='<label class="fl120 multicheckbox checkbox inline" for="event_camera-mats-'+h+'"><input type="checkbox" name="event_camera[mats][]" value="'+h+'" id="event_camera-mats-'+h+'" class="cbg mats" />'+f+":"+d+"</label>"}b.find(".spinner").remove();$(".fr-mats .multibutton",a).html(c)})});if($(a).hasClass("create")){$(".checkpoint_id",a).trigger("change")}};
/*admin/regoption.js*/
$(function(){$("#form_admin_regoption_create").live("submit",function(a){$(".dialogcontent").hide();$(".dataLoader").show();$.post("/admin/regoption/create",$("#form_admin_regoption_create").serialize(),function(b){$(".dialogcontent").html(b);$.get("/admin/event/reg-options/layout/none",function(c){$("#content.text-content").html(c);$(".dataLoader").hide();$(".dialogcontent").show()})});return false});$("a#pricing").live("click",function(){var a=$(this).attr("href");$(".dialogform").html("");$(".dialogform").dialog({close:function(){$(this).dialog("destroy")},title:"Create pricing phase"});$.get(a,function(b){$(".dialogform").html(b)});$(".dialogform").dialog("option","autoOpen",false);$(".dialogform").dialog("option","height","auto");$(".dialogform").dialog("option","width","auto");$(".dialogform").dialog("open");return false});$("#form_admin_reg-option_pricing").live("submit",function(a){$(".dialogcontent").hide();$(".dataLoader").show();$.post("/admin/reg-option/pricing",$("#form_admin_reg-option_pricing").serialize(),function(c){$(".dialogcontent").html(c);var b=$("#regOptionIdHolder").val();$.get("/admin/event/reg-option/layout/none",function(d){$("#content.text-content").html(d);$("#regOption-"+b).show();$(".dataLoader").hide();$(".dialogcontent").show()})});return false});$("a.editDialog#regOptionPricingPhase").live("click",function(){var a=$(this).attr("href");$(".dialogform").html("");$(".dialogform").dialog("destroy");$(".dialogform").dialog({close:function(){$(this).dialog("destroy")},title:"Modify pricing phase",modal:true});$.get(a,function(b){$(".dialogform").html(b)});$(".dialogform").dialog("option","autoOpen",false);$(".dialogform").dialog("option","height","auto");$(".dialogform").dialog("option","width","auto");$(".dialogform").dialog("open");return false});$("a.editDialog#regOptionModify").live("click",function(){var a=$(this).attr("href");$(".dialogform").html("");$(".dialogform").dialog("destroy");$(".dialogform").dialog({close:function(){$(this).dialog("destroy")},title:"Modify registration option",modal:true});$.get(a,function(b){$(".dialogform").html(b)});$(".dialogform").dialog("option","autoOpen",false);$(".dialogform").dialog("option","height","auto");$(".dialogform").dialog("option","width","auto");$(".dialogform").dialog("open");return false});$("#form_admin_regoption_edit").live("submit",function(a){alert("test");$(".dialogcontent").hide();$(".dataLoader").show();$.post("/admin/regoption/edit",$("#form_admin_regoption_edit").serialize(),function(b){$(".dialogcontent").html(b);alert(b);$.get("/admin/event/reg-options/layout/none",function(c){$("#content.text-content").html(c);if(b=="true"){alert("test");$(".dialogform").dialog("destroy");$(".dialogform").dialog("close")}else{$(".dataLoader").hide();$(".dialogcontent").show()}})});return false});$("fieldset.tshirt-options input[type=checkbox]").change(function(){var b=$(this).closest(".fi").find("input[type=checkbox]:not(:checked)").size()>0;var a=$(this).closest("fieldset").find(".check-all-tshirt-options");if(b){a.removeAttr("checked")}else{a.attr("checked","checked")}});$("fieldset.tshirt-options legend").each(function(b,c){var a=$(c).text();a=a.replace(/\s+/g,"").replace("'","").toLowerCase();var d=$(this).closest("fieldset").find("input[type=checkbox]");var e=d.filter(":not(:checked)").size()>0;$(this).prepend('<input name="'+a+'"  val="1" type="checkbox" class="check-all-tshirt-options"'+(e?"":' checked="checked"')+"/>&nbsp;").find("input").change(function(){if($(this).attr("checked")=="checked"){d.attr("checked","checked")}else{d.removeAttr("checked")}})});$("a#submitTshirtForm").live("click",function(){$("#tshirtForm").submit()});$("a#submitWaiverForm").live("click",function(){$("#waiverForm").submit()});$("a#createPromoButton").live("click",function(){var a=$(this).attr("href");$(".dialogform").html("");$(".dialogform").dialog({close:function(){$(this).dialog("destroy")},title:"Create coupon "});$.get(a,function(b){$(".dialogform").html(b)});$(".dialogform").dialog("option","autoOpen",false);$(".dialogform").dialog("option","height","auto");$(".dialogform").dialog("option","width","500px");$(".dialogform").dialog("open");return false});$("#createPromoForm").live("submit",function(a){$(".dialogcontent").hide();$(".dataLoader").show();$.post("/admin/event/create-new-promo",$("#createPromoForm").serialize(),function(c){$(".dialogcontent").html(c);var b=$("#currentPaginationPage").attr("href");$.get("/admin/event/reg-promos/layout/none",function(d){$("#content.text-content").html(d);$(".dataLoader").hide();if(c==1){$(".dialogform").dialog("destroy");$(".dialogform").dialog("close")}else{$(".dialogcontent").show()}})});return false});$("a.viewCodesDialog").live("click",function(){var a=$(this).attr("href");$(".dialogform").html("");$(".dialogform").dialog({close:function(){$(this).dialog("destroy")},title:"View all codes"});$.get(a,function(b){$(".dialogform").html(b)});$(".dialogform").dialog("option","autoOpen",false);$(".dialogform").dialog("option","height","400");$(".dialogform").dialog("option","width","350");$(".dialogform").dialog("open");return false});$("a#updatePromoButton").live("click",function(){var a=$(this).attr("href");$(".dialogform").html("");$(".dialogform").dialog({close:function(){$(this).dialog("destroy")},title:"Update coupon settings"});$.get(a,function(b){$(".dialogform").html(b)});$(".dialogform").dialog("option","autoOpen",false);$(".dialogform").dialog("option","height","auto");$(".dialogform").dialog("option","width","auto");$(".dialogform").dialog("open");return false});$("#updatePromoForm").live("submit",function(a){var b=$("input[name='page']").val();$(".dialogcontent").hide();$(".dataLoader").show();$.post("/admin/event/create-new-promo",$("#updatePromoForm").serialize(),function(c){$(".dialogcontent").html(c);$.get("/admin/event/reg-promos/layout/none/pages/"+b,function(d){$("#content").html(d);$(".dataLoader").hide();$(".dialogform").dialog("destroy");$(".dialogform").dialog("close")})});return false});$("#code_type_single").live("click",function(){$("input#code_format").attr("disabled",false);$("input#no_of_codes").attr("disabled",true);$("input#code_format_series").attr("disabled",true);$("select#code_codes").attr("disabled",true)});$("#code_type_series").live("click",function(a){$("input#code_format").attr("disabled",true);$("input#no_of_codes").attr("disabled",false);$("input#code_format_series").attr("disabled",false);$("select#code_codes").attr("disabled",false)});$("a#promoDeleteLink").live("click",function(){var a=confirm("Are you sure you want to delete this coupon?");if(a){return true}else{return false}});$(".couponDiscountType").live("change",function(){var a=$(this).val();var b=$(this).attr("id");if(a!="$"&&a!="%"){$('input[name="'+b+'_amount"]').attr("disabled",true);$('input[name="reg_option_specific_'+b+'"]').attr("value","0")}else{$('input[name="'+b+'_amount"]').attr("disabled",false);$('input[name="reg_option_specific_'+b+'"]').attr("value","1")}});$("input#max_uses").live("focus",function(){var a=$(this).val();if(a=="Unlimited"){$(this).attr("value","")}return false});$("#max_uses").live("change",function(){var a=$(this).val();if(a=="0"){$(this).val("Unlimited")}return false});$(document).on("change",".membership_type",function(a){if($(this).val()=="DATE"){$(".fr-membership_lasts").hide();$(".fr-membership_start_date").show();$(".fr-membership_expiration_date").show()}else{$(".fr-membership_lasts").show();$(".fr-membership_start_date").hide();$(".fr-membership_expiration_date").hide()}})});
/*admin/teams.js*/
$(document).ready(function(){$("select#race").change(function(){var b=$(this).find("option:selected").text();var e=$("#bracketID").find("option:selected").removeAttr("selected").text();var d="";$("#bracketID").find("optgroup").each(function(){if($(this).attr("label")==b){$(this).removeAttr("disabled");if(e){d=$(this).find('option:contains("'+e+'")').attr("value")}}else{$(this).attr("disabled","disabled")}}).find("option[value="+d+"]").attr("selected","selected");$("#bracketID").trigger("liszt:updated");var c=$("#waveID").find("option:selected").removeAttr("selected").text();var a="";$("#waveID").find("optgroup").each(function(){if($(this).attr("label")==b){$(this).removeAttr("disabled");if(c){a=$(this).find('option:contains("'+c+'")').attr("value")}}else{$(this).attr("disabled","disabled")}}).find("option[value="+a+"]").attr("selected","selected");$("#waveID").trigger("liszt:updated")}).trigger("change");$("#teamName").closest("div").css("width","100%");$("#resetsearchteam").click(function(){$.get("/admin/team/reset",function(a){$("#raceID").val("");$("#bracketID").val("");$("#teamType").val("");$("#teamName").val("");$("#status").val("CONF");window.location.href="/admin/team/search"})})});
/*admin/misc.js*/
$(function(){$(".forces-recalc").live("change",function(){$("input[name=options\\[recalc\\]]").prop("checked",true)});$(".play-video-link").hover(function(){$(this).find(".play-button").show()},function(){$(this).find(".play-button").hide()})});$(document).ready(function(){$("a.cb").click(function(){var c=$(this);if(!c.closest(".fr").hasClass("disabled")){var b=c.closest(".fr").attr("id");b=b.substring(3);if(c.hasClass("cbon")){if(c.parent().parent().find("input[type='hidden'][id='"+b+"']").size()>0){c.parent().parent().find("input[type='hidden'][id='"+b+"']").attr("value","")}$(this).removeClass("cbon")}else{if(!c.hasClass("cbon")){var a=c.attr("rel");if(c.parent().parent().find("input[type='hidden'][id='"+b+"']").size()>0){c.parent().parent().find("input[type='hidden'][id='"+b+"']").attr("value",a)}$(this).addClass("cbon")}}}return false})});
/*admin/interval.js*/
$(function(){var a=$("#interval-begin_checkpoint_id").find("option:first").attr("value");$("#interval-iv_type").change(function(){if($(this).val()=="course"){$("#interval-begin_checkpoint_id").val(a)}});$("#create-interval-form #interval-pace_display_unit").live("change",function(){var b=$(this).val();if(b!="none"){$('[for|="interval-default_pace"]').html($('[for|="interval-default_pace"]').text().replace("*",""));$('[for|="interval-flag_under_pace"]').html($('[for|="interval-flag_under_pace"]').text().replace("*",""));$('[for|="interval-flag_over_pace"]').html($('[for|="interval-flag_over_pace"]').text().replace("*",""));$('[for|="interval-default_pace"]').append("*");$('[for|="interval-flag_under_pace"]').append("*");$('[for|="interval-flag_over_pace"]').append("*")}else{$('[for|="interval-default_pace"]').html($('[for|="interval-default_pace"]').text().replace("*",""));$('[for|="interval-flag_under_pace"]').html($('[for|="interval-flag_under_pace"]').text().replace("*",""));$('[for|="interval-flag_over_pace"]').html($('[for|="interval-flag_over_pace"]').text().replace("*",""))}});$("#edit-interval-form #interval-pace_display_unit").live("change",function(){var b=$(this).val();if(b!="none"){$('[for|="interval-default_pace"]').html($('[for|="interval-default_pace"]').text().replace("*",""));$('[for|="interval-flag_under_pace"]').html($('[for|="interval-flag_under_pace"]').text().replace("*",""));$('[for|="interval-flag_over_pace"]').html($('[for|="interval-flag_over_pace"]').text().replace("*",""));$('[for|="interval-default_pace"]').append("*");$('[for|="interval-flag_under_pace"]').append("*");$('[for|="interval-flag_over_pace"]').append("*")}else{$('[for|="interval-default_pace"]').html($('[for|="interval-default_pace"]').text().replace("*",""));$('[for|="interval-flag_under_pace"]').html($('[for|="interval-flag_under_pace"]').text().replace("*",""));$('[for|="interval-flag_over_pace"]').html($('[for|="interval-flag_over_pace"]').text().replace("*",""))}});$(document).on({mouseenter:function(){$(this).closest("li").find("span.intervalDisplayOrder").addClass("intervalDisplayOrder-hover")},mouseleave:function(){$(this).closest("li").find("span.intervalDisplayOrder").removeClass("intervalDisplayOrder-hover")}},"div.outer");$("div.intervals ul.row-fluid").on("change",function(){$("span.intervalDisplayOrder").each(function(b,c){$(c).text(b+1)})})});
/*admin/external_report.js*/
$(document).ready(function(){$("a.btn-publish,a.btn-unpublish").on("click",showExternalReportDialog);$("div.external-report-modal .btn-activate").on("click",toggleExternalReportAccess);$("div.external-report-modal .btn-clipboard").zclip({path:"/js/zclip/ZeroClipboard.swf",copy:function(){return $(this).prev("input").val()}})});function showExternalReportDialog(){var a=$(this).closest("li");var b=a.data("reportId");var d=a.closest("ul").data("reportBaseUrl")+"/"+b;var c=a.hasClass("report-public");var e=c?$("#unpublish-external-report-modal"):$("#publish-external-report-modal");e.find("input.external-report-url").val(d);e.data("reportId",b);e.modal();return false}function toggleExternalReportAccess(){var c=$(this);showSpinner(c,10000);var d=$(this).closest("div.external-report-modal");var b=d.data("reportId");var a="/admin/external-report/toggle-access/reportID/"+b;$.getJSON(a,function(f){if(!f.error){var e=$("li[data-report-id="+b+"]");if(f.isPublic){e.removeClass("report-private").addClass("report-public")}else{e.removeClass("report-public").addClass("report-private")}}c.busy("hide");d.modal("hide")}).fail(function(){c.busy("hide");d.modal("hide")});return false};
/*jquery.cookies.js*/
jQuery.cookie=function(d,e,b){if(arguments.length>1&&(e===null||typeof e!=="object")){b=jQuery.extend({},b);if(e===null){b.expires=-1}if(typeof b.expires==="number"){var g=b.expires,c=b.expires=new Date();c.setDate(c.getDate()+g)}return(document.cookie=[encodeURIComponent(d),"=",b.raw?String(e):encodeURIComponent(String(e)),b.expires?"; expires="+b.expires.toUTCString():"",b.path?"; path="+b.path:"",b.domain?"; domain="+b.domain:"",b.secure?"; secure":""].join(""))}b=e||{};var a,f=b.raw?function(h){return h}:decodeURIComponent;return(a=new RegExp("(?:^|; )"+encodeURIComponent(d)+"=([^;]*)").exec(document.cookie))?f(a[1]):null};
/*modernizr.touch-detect.min.js*/
/* Modernizr 2.5.3 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-touch-cssclasses-teststyles-prefixes
 */
;window.Modernizr=function(a,b,c){function w(a){j.cssText=a}function x(a,b){return w(m.join(a+";")+(b||""))}function y(a,b){return typeof a===b}function z(a,b){return!!~(""+a).indexOf(b)}function A(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:y(f,"function")?f.bind(d||b):f}return!1}var d="2.5.3",e={},f=!0,g=b.documentElement,h="modernizr",i=b.createElement(h),j=i.style,k,l={}.toString,m=" -webkit- -moz- -o- -ms- ".split(" "),n={},o={},p={},q=[],r=q.slice,s,t=function(a,c,d,e){var f,i,j,k=b.createElement("div"),l=b.body,m=l?l:b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:h+(d+1),k.appendChild(j);return f=["&#173;","<style>",a,"</style>"].join(""),k.id=h,(l?k:m).innerHTML+=f,m.appendChild(k),l||(m.style.background="",g.appendChild(m)),i=c(k,a),l?k.parentNode.removeChild(k):m.parentNode.removeChild(m),!!i},u={}.hasOwnProperty,v;!y(u,"undefined")&&!y(u.call,"undefined")?v=function(a,b){return u.call(a,b)}:v=function(a,b){return b in a&&y(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=r.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(r.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(r.call(arguments)))};return e});var B=function(c,d){var f=c.join(""),g=d.length;t(f,function(c,d){var f=b.styleSheets[b.styleSheets.length-1],h=f?f.cssRules&&f.cssRules[0]?f.cssRules[0].cssText:f.cssText||"":"",i=c.childNodes,j={};while(g--)j[i[g].id]=i[g];e.touch="ontouchstart"in a||a.DocumentTouch&&b instanceof DocumentTouch||(j.touch&&j.touch.offsetTop)===9},g,d)}([,["@media (",m.join("touch-enabled),("),h,")","{#touch{top:9px;position:absolute}}"].join("")],[,"touch"]);n.touch=function(){return e.touch};for(var C in n)v(n,C)&&(s=C.toLowerCase(),e[s]=n[C](),q.push((e[s]?"":"no-")+s));return w(""),i=k=null,e._version=d,e._prefixes=m,e.testStyles=t,g.className=g.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(f?" js "+q.join(" "):""),e}(this,this.document);
/*flexmenu-1.1.js*/
(function(c){var e=[],b;function d(){c(e).each(function(){c(this).flexMenu({undo:true}).flexMenu(this.options)})}function a(g){var h,f;h=c("li.flexMenu-viewMore.active");f=h.not(g);f.removeClass("active").find("> ul").hide()}c(window).resize(function(){clearTimeout(b);b=setTimeout(function(){d()},200)});c.fn.flexMenu=function(g){var f,h=c.extend({threshold:2,cutoff:2,linkText:"More",linkTitle:"View More",linkTextAll:"Menu",linkTitleAll:"Open/Close Menu",showOnHover:true,popupAbsolute:true,undo:false,ulFlexCss:"",wantsEllipsis:false},g);this.options=h;f=c.inArray(this,e);if(f>=0){e.splice(f,1)}else{e.push(this)}return this.each(function(){var m=c(this),x=m,u=m.find("li:first-child"),v=m.find("li:last-child"),p=m.find("li").length,r=Math.floor(u.offset().top),y=Math.floor(u.outerHeight(true)),A,n,o,z,j,s=false,k,w;function l(B){var i=(Math.ceil(B.offset().top)>=(r+y))?true:false;return i}if(l(v)&&p>h.threshold&&!h.undo&&m.is(":visible")){var t=c('<ul class="flexMenu-popup" style="display:none;'+((h.popupAbsolute)?" position: absolute; "+h.ulFlexCss:"")+'"></ul>'),q=u.offset().top;for(w=p;w>1;w--){A=m.find("li:last-child");n=(l(A));A.appendTo(t);if((w-1)<=h.cutoff){c(m.children().get().reverse()).appendTo(t);s=true;break}if(!n){break}}if(s){m.append('<li class="flexMenu-viewMore flexMenu-allInPopup"><a href="#" title="'+h.linkTitleAll+'">'+h.linkTextAll+"</a></li>")}else{m.append('<li class="flexMenu-viewMore"><a href="#" title="'+h.linkTitle+'">'+h.linkText+"</a></li>")}o=m.find("li.flexMenu-viewMore");if(l(o)){m.find("li:nth-last-child(2)").appendTo(t)}t.children().each(function(C,B){t.prepend(B)});o.append(t);z=m.find("li.flexMenu-viewMore > a");z.click(function(i){a(o);t.toggle();o.toggleClass("active");i.preventDefault()});if(h.showOnHover&&(typeof Modernizr!=="undefined")&&!Modernizr.touch){o.hover(function(){t.show();c(this).addClass("active")},function(){t.hide();c(this).removeClass("active")})}}else{if(h.undo&&m.find("ul.flexMenu-popup")){k=m.find("ul.flexMenu-popup");j=k.find("li").length;for(w=1;w<=j;w++){k.find("li:first-child").appendTo(m)}k.remove();m.find("li.flexMenu-viewMore").remove()}}if(h.wantsEllipsis){m.find(".flexMenu-popup li").css({"white-space":"nowrap",overflow:"hidden","text-overflow":"ellipsis"})}})}})(jQuery);
