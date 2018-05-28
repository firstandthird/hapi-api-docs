const registerAll = require('./lib/methods');
const routes = require('./lib/routes');
const html = require('./lib/html');

const register = function(server, pluginOptions = {}) {
  server.decorate('server', 'docs', {
    events() {
      return Object.keys(server.events._eventListeners).reduce((memo, key) => {
        const listener = server.events._eventListeners[key];
        if (listener.handlers) {
          memo[key] = [];
          listener.handlers.forEach(handler => {
            memo[key].push(handler.listener.name || '(anonymous)');
          });
        }
        return memo;
      }, {});
    },
    auth(routeList) {
      return routeList.reduce((memo, item) => {
        if (item.auth && item.auth.strategies) {
          item.auth.strategies.forEach(strat => {
            if (!memo.includes(strat)) {
              memo.push(strat);
            }
          });
        }
        return memo;
      }, []);
    },
    methods() {
      const allMethods = [];
      registerAll(allMethods, server.methods);
      return allMethods;
    },
    routes(options) { return routes(server, Object.assign({}, pluginOptions, options)); },
    html(options = {}) {
      const routeList = server.docs.routes(options);
      return html(server.docs.methods(), routeList, server.docs.auth(routeList), server.docs.events());
    }
  });
  if (pluginOptions.docsEndpoint) {
    server.route({
      method: 'get',
      path: pluginOptions.docsEndpoint,
      handler(request, h) {
        const options = request.query.tags ? { tags: request.query.tags } : {};
        return server.docs.html(options);
      }
    });
  }
};

exports.plugin = {
  once: true,
  pkg: require('./package.json'),
  register
};
