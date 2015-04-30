/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var React = require('react');
var expect = require('chai').expect;
var RouteStore = require('../../../').RouteStore;
var StaticRouteStore = RouteStore.withStaticRoutes({
    foo: {
        path: '/foo',
        method: 'get'
    }
});

describe('RouteStore', function () {

    describe('withStaticRoutes', function () {
        var routeStore;
        beforeEach(function () {
            routeStore = new StaticRouteStore();
            routeStore._handleNavigateStart({
                url: '/foo',
                method: 'get'
            });
        });
        describe('dehydrate', function () {
            it('should dehydrate correctly', function () {
                var state = routeStore.dehydrate();
                expect(state).to.be.an('object');
                expect(state.currentUrl).to.equal('/foo');
                expect(state.currentNavigate).to.deep.equal({
                    url: '/foo',
                    method: 'get'
                });
                expect(state.routes).to.equal(null);
            });
        });
        describe('rehydrate', function () {
            it('should rehydrate correctly', function () {
                var newStore = new StaticRouteStore();
                newStore.rehydrate({
                    currentUrl: '/foo',
                    currentNavigate: { url: '/foo', method: 'get' },
                    routes: null
                });
                expect(newStore.getCurrentRoute()).to.be.an('object');
                expect(newStore.getCurrentNavigate()).to.deep.equal({
                    url: '/foo',
                    method: 'get'
                });
                expect(newStore.routes).to.equal(null);
            });
        });
    });

    describe('withoutStaticRoutes', function () {
        var routeStore;
        var FooComponent = React.createClass({
            render: function () {
                return (<div>Foo!</div>);
            }
        });
        var BarComponent = React.createClass({
            render: function () {
                return (<div>Bar!</div>);
            }
        });
        var routes = {
            foo: {
                path: '/foo',
                method: 'get',
                handler: FooComponent
            },
            bar: {
                path: '/bar',
                method: 'get',
                handler: BarComponent
            }
        };
        beforeEach(function () {
            routeStore = new RouteStore();
            routeStore._handleReceiveRoutes(routes);
            routeStore._handleNavigateStart({
                url: '/foo',
                method: 'get'
            });
        });
        describe('dehydrate', function () {
            it('should dehydrate correctly', function () {
                var state = routeStore.dehydrate();
                expect(state).to.be.an('object');
                expect(state.currentUrl).to.equal('/foo');
                expect(state.currentNavigate).to.deep.equal({
                    url: '/foo',
                    method: 'get'
                });
                expect(state.routes).to.deep.equal(routes);
            });
        });
        describe('rehydrate', function () {
            it('should rehydrate correctly', function () {
                var newStore = new StaticRouteStore();
                newStore.rehydrate({
                    currentUrl: '/foo',
                    currentNavigate: { url: '/foo', method: 'get' },
                    routes: routes
                });
                expect(newStore.getCurrentRoute()).to.be.an('object');
                expect(newStore.getCurrentNavigate()).to.deep.equal({
                    url: '/foo',
                    method: 'get'
                });
                expect(newStore.routes).to.deep.equal(routes);
            });
            it('should rehydrate with a rewriteen route correctly', function () {
                var newStore = new StaticRouteStore();
                newStore.rehydrate({
                    isRewrite: true,
                    rewriteRouteName: 'bar',
                    currentUrl: '/foo',
                    currentNavigate: { url: '/foo', method: 'get' },
                    routes: routes
                });
                expect(newStore.getCurrentRoute().get('handler').displayName).to.equal('BarComponent');
            });
        });
    });

    describe('rewriteRoute', function () {
        var routeStore;
        var FooComponent = React.createClass({
            render: function () {
                return (<div>Foo!</div>);
            }
        });
        var BarComponent = React.createClass({
            render: function () {
                return (<div>Bar!</div>);
            }
        });
        var routes = {
            foo: {
                path: '/foo',
                method: 'get',
                handler: FooComponent
            },
            bar: {
                path: '/bar',
                method: 'get',
                handler: BarComponent
            }
        };
        beforeEach(function () {
            routeStore = new RouteStore();
            routeStore._handleReceiveRoutes(routes);
            routeStore._handleNavigateStart({
                url: '/foo',
                method: 'get'
            });
        });
        it('should rewrite the current route', function () {
            var CurrentRoute = routeStore.getCurrentRoute();
            expect(CurrentRoute.get('handler').displayName).to.equal('FooComponent');
            expect(CurrentRoute.get('url')).to.equal('/foo');

            routeStore._handleRewriteRoute({
                name: 'bar',
                route: routes.bar
            });

            CurrentRoute = routeStore.getCurrentRoute();
            expect(CurrentRoute.get('handler').displayName).to.equal('BarComponent');
            expect(CurrentRoute.get('url')).to.equal('/foo');
        });
    });

});
