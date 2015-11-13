/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
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
                transactionId: 'first',
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
                    transactionId: 'first',
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
                    currentNavigate: { transactionId: 'first', url: '/foo', method: 'get' },
                    routes: null
                });
                expect(newStore.getCurrentRoute()).to.be.an('object');
                expect(newStore.getCurrentNavigate()).to.deep.equal({
                    transactionId: 'first',
                    url: '/foo',
                    method: 'get'
                });
                expect(newStore._routes).to.equal(null);
            });
        });

        it('should reuse static router between instances', function () {
            var newStore = new StaticRouteStore();
            expect(newStore._router).to.equal(routeStore._router);
        });

        it('should only use the latest navigate on success', function () {
            // Start a new navigate before first has completed
            routeStore._handleNavigateStart({
                transactionId: 'second',
                url: '/bar',
                method: 'get'
            });
            expect(routeStore.isNavigateComplete()).to.equal(false);
            routeStore._handleNavigateSuccess({
                navigate: {
                    transactionId: 'first'
                },
                url: '/bar',
                method: 'get'
            });
            expect(routeStore.isNavigateComplete()).to.equal(false);
            routeStore._handleNavigateSuccess({
                navigate: {
                    transactionId: 'second'
                },
                url: '/bar',
                method: 'get'
            });
            expect(routeStore.isNavigateComplete()).to.equal(true);
        });
        it('should only use the latest navigate on failure', function () {
            // Start a new navigate before first has completed
            routeStore._handleNavigateStart({
                transactionId: 'second',
                url: '/bar',
                method: 'get'
            });
            expect(routeStore.isNavigateComplete()).to.equal(false);
            routeStore._handleNavigateFailure({
                transactionId: 'first',
                statusCode: 404,
                message: 'Url /unknown does not match any routes'
            });
            expect(routeStore.isNavigateComplete()).to.equal(false);
            routeStore._handleNavigateFailure({
                transactionId: 'second',
                statusCode: 404,
                message: 'Url /unknown does not match any routes'
            });
            expect(routeStore.isNavigateComplete()).to.equal(true);
        });
    });

    describe('dynamic routes', function () {
        var routeStore;
        var routes = {
            foo: {
                path: '/foo',
                method: 'get'
            },
            bar: {
              path: '/bar',
              method: 'post'
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
                expect(newStore._routes).to.deep.equal(routes);
            });

            it('should rehydrate POST routes correctly', function() {
                var newStore = new StaticRouteStore();
                newStore.rehydrate({
                    currentUrl: '/bar',
                    currentNavigate: { url: '/bar', method: 'post' },
                    routes: routes
                });
                expect(newStore.getCurrentRoute()).to.be.an('object');
                expect(newStore.getCurrentNavigate()).to.deep.equal({
                    url: '/bar',
                    method: 'post'
                });
                expect(newStore._routes).to.deep.equal(routes);
            });
        });
    });

});
