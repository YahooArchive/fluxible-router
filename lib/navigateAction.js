/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var debug = require('debug')('navigateAction');

module.exports = function navigateAction (context, payload, done) {
    var routeStore = context.getStore('RouteStore');
    if (!payload.url && payload.routeName) {
        payload.url = routeStore.makePath(payload.routeName, payload.params);
        payload.routeName = null;
    }
    debug('dispatching NAVIGATE_START', payload);
    context.dispatch('NAVIGATE_START', payload);

    if (!routeStore.getCurrentRoute) {
        done(new Error('RouteStore has not implemented `getCurrentRoute` method.'));
        return;
    }
    debug('executing', payload);

    var route = routeStore.getCurrentRoute();

    if (!route) {
        var error404 = {
            statusCode: 404,
            message: 'Url \'' + payload.url + '\' does not match any routes'
        };

        context.dispatch('NAVIGATE_FAILURE', error404);
        done(Object.assign(new Error(), error404));
        return;
    }

    var action = route.get('action');

    if ('string' === typeof action && context.getAction) {
        action = context.getAction(action);
    }

    if (!action || 'function' !== typeof action) {
        debug('route has no action, dispatching without calling action');
        context.dispatch('NAVIGATE_SUCCESS', route);
        done();
        return;
    }

    debug('executing route action');
    context.executeAction(action, route, function (err) {
        if (err) {
            var error500 = {
                statusCode: err.statusCode || 500,
                message: err.message
            };

            context.dispatch('NAVIGATE_FAILURE', error500);
            done(Object.assign(err, error500));
        } else {
            context.dispatch('NAVIGATE_SUCCESS', route);
            done();
        }
    });
};
