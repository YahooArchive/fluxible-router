/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';
var createStore = require('fluxible/addons/createStore');
var Router = require('routr');
var queryString = require('qs');
var inherits = require('inherits');
var Immutable = require('immutable');

var searchPattern = /\?([^\#]*)/;

var RouteStore = createStore({
    storeName: 'RouteStore',
    handlers: {
        'NAVIGATE_START': '_handleNavigateStart',
        'NAVIGATE_SUCCESS': '_handleNavigateSuccess',
        'NAVIGATE_FAILURE': '_handleNavigateFailure',
        'RECEIVE_ROUTES': '_handleReceiveRoutes'
    },
    initialize: function () {
        this._routes = null;
        this._currentUrl = null;
        this._currentRoute = null;
        this._currentNavigate = null;
        this._currentNavigateError = null;
        this._isNavigateComplete = null;
        this._router = null;
    },
    _handleNavigateStart: function (payload) {
        var matchedRoute = this._matchRoute(payload.url, {
            navigate: payload,
            method: payload.method
        });

        if (!Immutable.is(matchedRoute, this._currentRoute)) {
            this._currentRoute = matchedRoute;
            this._currentNavigate = payload;
        }

        this._currentNavigateError = null;
        this._isNavigateComplete = false;
        this._currentUrl = payload.url;
        this.emitChange();
    },
    _handleNavigateSuccess: function (route) {
        this._isNavigateComplete = true;
        this.emitChange();
    },
    _handleNavigateFailure: function (error) {
        this._isNavigateComplete = true;
        this._currentNavigateError = error;
        this.emitChange();
    },
    _handleReceiveRoutes: function (payload) {
        this._routes = Object.assign(this._routes || {}, payload);
        // Reset the router so that it is recreated next time it's needed
        this._router = null;
        this.emitChange();
    },
    _matchRoute: function (url, options) {
        var self = this;
        var route = self.getRouter().getRoute(url, options);
        if (!route) {
            return null;
        }

        var matchedUrl = route.url;
        route = Immutable.fromJS(route.config).withMutations(function (r) {
            r.set('name', route.name);
            r.set('url', route.url);
            r.set('params', Immutable.fromJS(route.params));
            r.set('query', Immutable.fromJS(self._parseQueryString(matchedUrl)));
            r.set('navigate', Immutable.fromJS(route.navigate));
        });

        return route;
    },
    _parseQueryString: function (url) {
        var matches = url.match(searchPattern);
        var search;
        if (matches) {
            search = matches[1];
        }
        return (search && queryString.parse(search), {
            arrayLimit: 40
        }) || {};
    },
    makePath: function (routeName, params) {
        return this.getRouter().makePath(routeName, params);
    },
    getCurrentRoute: function () {
        return this._currentRoute;
    },
    getCurrentNavigate: function () {
        return this._currentNavigate;
    },
    getCurrentNavigateError: function () {
        return this._currentNavigateError;
    },
    isNavigateComplete: function () {
        return this._isNavigateComplete;
    },
    getRoutes: function () {
        return this._routes;
    },
    getRouter: function () {
        if (!this._router) {
            this._router = new Router(this.getRoutes());
        }
        return this._router;
    },
    isActive: function (href) {
        return this._currentUrl === href;
    },
    dehydrate: function () {
        return {
            currentUrl: this._currentUrl,
            currentNavigate: this._currentNavigate,
            currentNavigateError: this._currentNavigateError,
            isNavigateComplete: this._isNavigateComplete,
            routes: this._routes
        };
    },
    rehydrate: function (state) {
        this._routes = state.routes;
        this._currentUrl = state.currentUrl;
        this._currentRoute = this._matchRoute(this._currentUrl, {
            method: state.currentNavigate && state.currentNavigate.method || 'GET'
        });
        this._currentNavigate = state.currentNavigate;
        this._isNavigateComplete = state.isNavigateComplete;
        this._currentNavigateError = state.currentNavigateError;
    }
});

RouteStore.withStaticRoutes = function (staticRoutes) {
    function StaticRouteStore() {
        RouteStore.apply(this, arguments);
    }
    inherits(StaticRouteStore, RouteStore);
    StaticRouteStore.storeName = RouteStore.storeName;
    StaticRouteStore.handlers = RouteStore.handlers;
    StaticRouteStore.routes = staticRoutes || {};
    StaticRouteStore.prototype.getRoutes = function () {
        return StaticRouteStore.routes;
    };
    StaticRouteStore.prototype._handleReceiveRoutes = function () {
        throw new Error('RECEIVE_ROUTES action handler will not work with StaticRouteStore');
    };
    return StaticRouteStore;
};

module.exports = RouteStore;
