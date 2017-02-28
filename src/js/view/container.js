/**
 * @fileoverview View class that conaints a top element of the DOM structure of the grid.
 * @author NHN Ent. FE Development Lab
 */
'use strict';

var View = require('../base/view');
var GridEvent = require('../event/gridEvent');
var targetTypeConst = GridEvent.targetTypeConst;
var attrNameConst = require('../common/constMap').attrName;
var classNameConst = require('../common/classNameConst');

/**
 * Container View
 * @module view/container
 * @extends module:base/view
 * @param {Object} options - Options
 * @ignore
 */
var Container = View.extend(/**@lends module:view/container.prototype */{
    initialize: function(options) {
        View.prototype.initialize.call(this);

        this.gridId = options.gridId;
        this.dimensionModel = options.dimensionModel;
        this.dataModel = options.dataModel;
        this.viewFactory = options.viewFactory;
        this.domEventBus = options.domEventBus;

        this._createChildViews();

        this.listenTo(this.dimensionModel, 'setWidth', this._onSetWidth);
        $(window).on('resize.grid', $.proxy(this._onResizeWindow, this));

        this.__$el = this.$el.clone();
    },

    events: {
        'click': '_onClick',
        'dblclick': '_onDblClick',
        'mousedown': '_onMouseDown',
        'mouseover': '_onMouseOver',
        'mouseout': '_onMouseOut',

        // for preventing drag
        'selectstart': '_preventDrag',
        'dragstart': '_preventDrag'
    },

    /**
     * 내부에서 사용할 view 인스턴스들을 초기화한다.
     * @private
     */
    _createChildViews: function() {
        var factory = this.viewFactory;

        this._addChildren([
            factory.createContentArea(),
            factory.createHeightResizeHandle(),
            factory.createPagination(),
            factory.createStateLayer(),
            factory.createEditingLayer(),
            factory.createDatePickerLayer(),
            factory.createClipboard()
        ]);
    },

    /**
     * Event handler for resize event on window.
     * @private
     */
    _onResizeWindow: function() {
        this.domEventBus.trigger('windowResize');
    },

    /**
     * drag 이벤트 발생시 이벤트 핸들러
     * @returns {boolean} false
     * @private
     */
    _preventDrag: function() {
        return false;
    },

    /**
     * Event handler for 'setSize' event on Dimension
     * @private
     */
    _onSetWidth: function() {
        console.log('set width');
        this.$el.width(this.dimensionModel.get('width'));
    },

    /**
     * Event handler for click event
     * @param {MouseEvent} ev - Mouse event
     * @private
     */
    _onClick: function(ev) {
        var $target = $(document.elementFromPoint(ev.pageX, ev.pageY));
        var gridEvent = new GridEvent(ev, GridEvent.getTargetInfo($target));

        /**
         * Occurs when a mouse button is clicked on the Grid.
         * The properties of the event object is the same as the native MouseEvent.
         * @api
         * @property {string} targetType - type of event target
         * @property {number} rowKey - rowKey of the target cell
         * @property {string} columnName - columnName of the target cell
         * @event tui.Grid#click
         * @type {module:event/gridEvent}
         */
        this.domEventBus.trigger('click', gridEvent);

        if (!gridEvent.isStopped() && gridEvent.targetType === targetTypeConst.CELL) {
            this.domEventBus.trigger('click:cell', gridEvent);
        }
    },

    /**
     * Event handler for the dblclick event
     * @param {MouseEvent} ev - MouseEvent
     * @private
     */
    _onDblClick: function(ev) {
        var $target = $(ev.target);
        var gridEvent = new GridEvent(ev, GridEvent.getTargetInfo($target));

        /**
         * Occurs when a mouse button is double clicked on the Grid.
         * The event object has all properties copied from the native MouseEvent.
         * @api
         * @event tui.Grid#dblclick
         * @type {module:event/gridEvent}
         * @property {string} targetType - type of event target
         * @property {number} rowKey - rowKey of the target cell
         * @property {string} columnName - columnName of the target cell
         */
        this.domEventBus.trigger('dblclick', gridEvent);

        if (!gridEvent.isStopped() && gridEvent.targetType === targetTypeConst.CELL) {
            this.domEventBus.trigger('dblclick:cell', gridEvent);
        }
    },

    /**
     * Event listener for the mouseover event
     * @param {MouseEvent} ev - MouseEvent
     * @private
     */
    _onMouseOver: function(ev) {
        var $target = $(ev.target);
        var gridEvent = new GridEvent(ev, GridEvent.getTargetInfo($target));

        /**
         * Occurs when a mouse pointer is moved onto a table cell
         * The event object has all properties copied from the native MouseEvent.
         * @api
         * @event tui.Grid#mouseoverCell
         * @type {module:event/gridEvent}
         * @property {string} targetType - type of event target
         * @property {number} rowKey - rowKey of the target cell
         * @property {string} columnName - columnName of the target cell
         */
        this.domEventBus.trigger('mouseover', gridEvent);
    },

    /**
     * Event listener for the mouseout event
     * @param {MouseEvent} ev - MouseEvent
     * @private
     */
    _onMouseOut: function(ev) {
        var $target = $(ev.target);
        var gridEvent = new GridEvent(ev, GridEvent.getTargetInfo($target));

        /**
         * Occurs when a mouse pointer is moved off from a table cell
         * The event object has all properties copied from the native MouseEvent.
         * @api
         * @event tui.Grid#mouseoutCell
         * @type {module:event/gridEvent}
         * @property {string} targetType - type of event target
         * @property {number} rowKey - rowKey of the target cell
         * @property {string} columnName - columnName of the target cell
         */
        this.domEventBus.trigger('mouseout', gridEvent);
    },

    /**
     * Event handler for 'mousedown' event
     * @param {MouseEvent} ev - Mouse event
     * @private
     */
    _onMouseDown: function(ev) {
        var $target = $(ev.target);
        var gridEvent = new GridEvent(ev, GridEvent.getTargetInfo($target));
        var shouldFocus = !$target.is('input, a, button, select, textarea');

        if (shouldFocus) {
            ev.preventDefault();

            // fix IE8 bug (cancelling event doesn't prevent focused element from losing foucs)
            $target[0].unselectable = true;

            this.domEventBus.trigger('mousedown:focus', gridEvent);
        }
    },

    /**
     * Render
     * @returns {module:view/container} this object
     */
    render: function() {
        var childElements = this._renderChildren();

        this.$el.addClass(classNameConst.CONTAINER)
            .attr(attrNameConst.GRID_ID, this.gridId)
            .append(childElements);

        this._triggerChildrenAppended();

        return this;
    },

    /**
     * Destroy
     */
    destroy: function() {
        this.stopListening();
        $(window).off('resize.grid');
        this._destroyChildren();

        this.$el.replaceWith(this.__$el);
        this.$el = this.__$el = null;
    }
});

module.exports = Container;
