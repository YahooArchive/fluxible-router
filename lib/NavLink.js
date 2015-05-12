/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
/*global window */
'use strict';

var React = require('react/addons');
var navigateAction = require('./navigateAction');
var debug = require('debug')('NavLink');
var objectAssign = require('object-assign');
var handleRoute = require('./handleRoute');
var Immutable = require('immutable');

function isLeftClickEvent (e) {
    return e.button === 0;
}

function isModifiedEvent (e) {
    return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}

var NavLink = React.createClass({
    displayName: 'NavLink',
    contextTypes: {
        executeAction: React.PropTypes.func
    },
    propTypes: {
        currentRoute: React.PropTypes.object,
        currentNavigate: React.PropTypes.object,
        href: React.PropTypes.string,
        isActive: React.PropTypes.func,
        makePath: React.PropTypes.func,
        routeName: React.PropTypes.string,
        navParams: React.PropTypes.object,
        followLink: React.PropTypes.bool,
        preserveScrollPosition: React.PropTypes.bool,
        replaceState: React.PropTypes.bool
    },
    _getHrefFromProps: function (props) {
        var href = props.href;
        var routeName = props.routeName;
        if (!href && routeName) {
            href = this.props.makePath(routeName, props.navParams);
        }
        if (!href) {
            throw new Error('NavLink created without href or unresolvable routeName \'' + routeName + '\'');
        }
        return href;
    },
    dispatchNavAction: function (e) {
        var navType = this.props.replaceState ? 'replacestate' : 'click';
        debug('dispatchNavAction: action=NAVIGATE', this.props.href, this.props.followLink, this.props.navParams);

        if (this.props.followLink) {
            return;
        }

        if (isModifiedEvent(e) || !isLeftClickEvent(e)) {
            // this is a click with a modifier or not a left-click
            // let browser handle it natively
            return;
        }

        var href = this._getHrefFromProps(this.props);

        if (href[0] === '#') {
            // this is a hash link url for page's internal links.
            // Do not trigger navigate action. Let browser handle it natively.
            return;
        }

        if (href[0] !== '/') {
            // this is not a relative url. check for external urls.
            var location = window.location;
            var origin = location.origin || (location.protocol + '//' + location.host);

            if (href.indexOf(origin) !== 0) {
                // this is an external url, do not trigger navigate action.
                // let browser handle it natively.
                return;
            }

            href = href.substring(origin.length) || '/';
        }

        e.preventDefault();

        var context = this.props.context || this.context;
        var onBeforeUnloadText = typeof window.onbeforeunload === 'function' ? window.onbeforeunload() : '';
        var confirmResult = onBeforeUnloadText ? window.confirm(onBeforeUnloadText) : true;

        if (confirmResult) {
            // Removes the window.onbeforeunload method so that the next page will not be affected
            window.onbeforeunload = null;

            context.executeAction(navigateAction, {
                type: navType,
                url: href,
                preserveScrollPosition: this.props.preserveScrollPosition,
                params: this.props.navParams
            });
        }
    },
    render: function() {
        var href = this._getHrefFromProps(this.props);
        var isActive = this.props.isActive(href);

        var className = this.props.className;
        var style = this.props.style;
        if (isActive) {
            className = className ? (className + ' ') : '';
            className += this.props.activeClass || 'active';
            style = objectAssign({}, style, this.props.activeStyle);
        }

        return React.createElement(
            'a',
            objectAssign({}, {
                onClick: this.dispatchNavAction
            }, this.props, {
                href: href,
                className: className,
                style: style
            }),
            this.props.children
        );
    }
});

module.exports = handleRoute(NavLink);
