/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
/*globals describe,it,before,beforeEach */
var React;
var NavLink;
var ReactTestUtils;
var jsdom = require('jsdom');
var expect = require('chai').expect;
var onClickMock;
var testResult;
var MockAppComponent;
var RouteStore = require('../../../').RouteStore;
var createMockComponentContext = require('fluxible/utils/createMockComponentContext');
var navigateAction = require('../../../').navigateAction;

var TestRouteStore = RouteStore.withStaticRoutes({
    foo: { path: '/foo', method: 'get' },
    bar: { path: '/bar', method: 'get'},
    fooA: { path: '/foo/:a', method: 'get' },
    fooAB: { path: '/foo/:a/:b', method: 'get' }
});

onClickMock = function () {
    testResult.onClickMockInvoked = true;
};

describe('NavLink', function () {
    var mockContext;

    beforeEach(function () {
        global.document = jsdom.jsdom('<html><body></body></html>');
        global.window = global.document.parentWindow;
        global.navigator = global.window.navigator;
        React = require('react/addons');
        ReactTestUtils = React.addons.TestUtils;
        mockContext = createMockComponentContext({
            stores: [TestRouteStore]
        });
        mockContext.getStore('RouteStore')._handleNavigateStart({
            url: '/foo',
            method: 'GET'
        });
        MockAppComponent = require('../../mocks/MockAppComponent');
        NavLink = require('../../../lib/NavLink');
        testResult = {};
    });

    afterEach(function () {
        delete global.window;
        delete global.document;
        delete global.navigator;
    });

    describe('render()', function () {
        it('should set href correctly', function () {
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink href="/foo">
                        bar
                    </NavLink>
                </MockAppComponent>
            );
            expect(link.getDOMNode().getAttribute('href')).to.equal('/foo');
            expect(link.getDOMNode().textContent).to.equal('bar');
        });
        it('should prefer href over routeName', function () {
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink routeName="fooo" href="/foo" />
                </MockAppComponent>
            );
            expect(link.getDOMNode().getAttribute('href')).to.equal('/foo');
        });
        it('should create href from routeName and parameters', function () {
            var navParams = {a: 1, b: 2};
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink routeName='fooAB' navParams={navParams} />
                </MockAppComponent>
            );
            expect(link.getDOMNode().getAttribute('href')).to.equal('/foo/1/2');
        });
        it('should throw if href and routeName undefined', function () {
            var navParams = {a: 1, b: 2};
            expect(function () {
                ReactTestUtils.renderIntoDocument(
                    <MockAppComponent context={mockContext}>
                        <NavLink navParams={navParams} />
                    </MockAppComponent>
                );
            }).to.throw();
        });
        it('should set active state if href matches current route', function () {
            var navParams = {a: 1, b: 2};
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink routeName='foo' />
                </MockAppComponent>
            );
            expect(link.getDOMNode().getAttribute('class')).to.equal('active');
        });
        it('should set active state with custom class and style', function () {
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink routeName='foo' activeClass="bar" activeStyle={{color: 'red'}} />
                </MockAppComponent>
            );
            expect(link.getDOMNode().getAttribute('class')).to.equal('bar');
            expect(link.getDOMNode().getAttribute('style')).to.equal('color:red;');
        });
        it('should set the active state and keep the passed props', function () {
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink routeName='foo' className='bar' activeClass="active2"
                        activeStyle={{color: 'red'}} style={{background: 'blue'}} />
                </MockAppComponent>
            );
            expect(link.getDOMNode().getAttribute('class')).to.equal('bar active2');
            expect(link.getDOMNode().getAttribute('style')).to.equal('background:blue;color:red;');
        });
        it('should not set active state if href does not match current route', function () {
            var navParams = {a: 1, b: 2};
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink routeName='fooAB' navParams={navParams} />
                </MockAppComponent>
            );
            expect(link.getDOMNode().getAttribute('class')).to.equal(null);
        });
    });

    describe('dispatchNavAction()', function () {
        it ('use react context', function (done) {
            var navParams = {a: 1, b: true};
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink href='/foo' preserveScrollPosition={true} navParams={navParams} />
                </MockAppComponent>
            );
            ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
            window.setTimeout(function () {
                expect(mockContext.executeActionCalls[0].action).to.equal(navigateAction);
                expect(mockContext.executeActionCalls[0].payload.type).to.equal('click');
                expect(mockContext.executeActionCalls[0].payload.url).to.equal('/foo');
                expect(mockContext.executeActionCalls[0].payload.preserveScrollPosition).to.equal(true);
                expect(mockContext.executeActionCalls[0].payload.params).to.eql({a: 1, b: true});
                done();
            }, 10);
        });
        it('context.executeAction called for relative urls', function (done) {
            var navParams = {a: 1, b: true};
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink href='/foo' navParams={navParams} />
                </MockAppComponent>
            );
            ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
            window.setTimeout(function () {
                expect(mockContext.executeActionCalls.length).to.equal(1);
                expect(mockContext.executeActionCalls[0].action).to.equal(navigateAction);
                expect(mockContext.executeActionCalls[0].payload.type).to.equal('click');
                expect(mockContext.executeActionCalls[0].payload.url).to.equal('/foo');
                expect(mockContext.executeActionCalls[0].payload.params).to.eql({a: 1, b: true});
                done();
            }, 10);
        });
        it ('context.executeAction called for routeNames', function (done) {
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink routeName='foo' />
                </MockAppComponent>
            );
            link.context = mockContext;
            ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
            window.setTimeout(function () {
                expect(mockContext.executeActionCalls.length).to.equal(1);
                expect(mockContext.executeActionCalls[0].action).to.equal(navigateAction);
                expect(mockContext.executeActionCalls[0].payload.type).to.equal('click');
                expect(mockContext.executeActionCalls[0].payload.url).to.equal('/foo');
                done();
            }, 10);
        });
        it ('context.executeAction called for absolute urls from same origin', function (done) {
            var navParams = {a: 1, b: true};
            var origin = window.location.origin;
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink href={origin + '/foo?x=y'} navParams={navParams} />
                </MockAppComponent>
            );
            ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
            window.setTimeout(function () {
                expect(mockContext.executeActionCalls.length).to.equal(1);
                expect(mockContext.executeActionCalls[0].action).to.equal(navigateAction);
                expect(mockContext.executeActionCalls[0].payload.type).to.equal('click');
                expect(mockContext.executeActionCalls[0].payload.url).to.equal('/foo?x=y');
                expect(mockContext.executeActionCalls[0].payload.params).to.eql({a: 1, b: true});
                done();
            }, 10);
        });
        it('context.executeAction not called for external urls', function (done) {
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink href='http://domain.does.not.exist/foo' />
                </MockAppComponent>
            );
            ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
            window.setTimeout(function () {
                expect(testResult.dispatch).to.equal(undefined);
                done();
            }, 10);
        });
        it('context.executeAction not called for # urls', function (done) {
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink href='#here' />
                </MockAppComponent>
            );
            ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
            ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
            window.setTimeout(function () {
                expect(testResult.dispatch).to.equal(undefined);
                done();
            }, 10);
        });

        it('context.executeAction not called if followLink=true', function (done) {
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink href='/foo' followLink={true} />
                </MockAppComponent>
            );
            ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
            window.setTimeout(function () {
                expect(testResult.dispatch).to.equal(undefined);
                done();
            }, 10);
        });
        it('context.executeAction called if followLink=false', function (done) {
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink href='/foo' followLink={false} />
                </MockAppComponent>
            );
            ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
            window.setTimeout(function () {
                expect(mockContext.executeActionCalls.length).to.equal(1);
                expect(mockContext.executeActionCalls[0].action).to.equal(navigateAction);
                expect(mockContext.executeActionCalls[0].payload.type).to.equal('click');
                expect(mockContext.executeActionCalls[0].payload.url).to.equal('/foo');
                done();
            }, 10);
        });

        it('should throw if context not available', function () {
            expect(function () {
                try{
                    ReactTestUtils.renderIntoDocument(
                        <NavLink href='/foo' followLink={false} />
                    );
                } catch (e) {
                    throw e;
                }
            }).to.throw();
        });

        describe('click type', function () {
            it('navigates on regular click', function (done) {
                var origin = window.location.origin;
                var link = ReactTestUtils.renderIntoDocument(
                    <MockAppComponent context={mockContext}>
                        <NavLink href={origin} />
                    </MockAppComponent>
                );
                ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
                window.setTimeout(function () {
                    expect(mockContext.executeActionCalls.length).to.equal(1);
                    expect(mockContext.executeActionCalls[0].action).to.equal(navigateAction);
                    expect(mockContext.executeActionCalls[0].payload.type).to.equal('click');
                    done();
                }, 10);
            });

            it('navigates on regular click using replaceState', function (done) {
                var origin = window.location.origin;
                var link = ReactTestUtils.renderIntoDocument(
                    <MockAppComponent context={mockContext}>
                        <NavLink href={origin} replaceState={true} />
                    </MockAppComponent>
                );
                ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
                window.setTimeout(function () {
                    expect(mockContext.executeActionCalls[0].action).to.equal(navigateAction);
                    expect(mockContext.executeActionCalls[0].payload.type).to.equal('replacestate');
                    done();
                }, 10);
            });

            ['metaKey', 'altKey', 'ctrlKey', 'shiftKey'].map(function (key) {
                it('does not navigate on modified ' + key, function (done) {
                    var eventData = {button: 0};
                    eventData[key] = true;
                    var origin = window.location.origin;
                    var link = ReactTestUtils.renderIntoDocument(
                        <MockAppComponent context={mockContext}>
                            <NavLink href={origin} />
                        </MockAppComponent>
                    );
                    ReactTestUtils.Simulate.click(link.getDOMNode(), eventData);
                    window.setTimeout(function () {
                        expect(testResult.dispatch).to.equal(undefined);
                        done();
                    }, 10);
                });
            });
        });

        it('allow overriding onClick', function (done) {
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink href='#here' onClick={onClickMock} />
                </MockAppComponent>
            );
            expect(testResult.onClickMockInvoked).to.equal(undefined);
            ReactTestUtils.Simulate.click(link.getDOMNode(), {button: 0});
            window.setTimeout(function () {
                expect(testResult.dispatch).to.equal(undefined);
                expect(testResult.onClickMockInvoked).to.equal(true);
                done();
            }, 10);
        });
    });

    describe('onStoreChange', function () {
        it('should update active state', function (done) {
            var link = ReactTestUtils.renderIntoDocument(
                <MockAppComponent context={mockContext}>
                    <NavLink href='/foo'>
                        bar
                    </NavLink>
                </MockAppComponent>
            );
            expect(link.getDOMNode().getAttribute('href')).to.equal('/foo');
            expect(link.getDOMNode().textContent).to.equal('bar');
            expect(link.getDOMNode().getAttribute('class')).to.equal('active');
            mockContext.getStore('RouteStore')._handleNavigateStart({
                url: '/bar',
                method: 'GET'
            });
            // Wait for DOM to update
            setTimeout(function () {
                expect(link.getDOMNode().getAttribute('href')).to.equal('/foo');
                expect(link.getDOMNode().textContent).to.equal('bar');
                expect(!link.getDOMNode().getAttribute('class'));
                done();
            }, 50);
        });
    });

    describe('componentWillUnmount', function () {
        it('should update active state', function () {
            var div = document.createElement('div');
            React.render(
                <MockAppComponent context={mockContext}>
                    <NavLink href='/foo' />
                </MockAppComponent>
            , div);
            var routeStore = mockContext.getStore('RouteStore');
            expect(routeStore.listeners('change').length).to.equal(2);
            React.unmountComponentAtNode(div);
            expect(routeStore.listeners('change').length).to.equal(0);
        });
    });
});
