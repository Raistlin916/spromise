"use strict";
/*call: function(data){
      var d = this.defer();
      d.resolve(data);
      return d.promise;
    },
    waterfall: function(ps){
      return ps.reduce(function(n, u){
          return n.then(u);
        }, this.call());
    },
    all: function(ps){
      var l = ps.length, results = [], d = this.defer();
      ps.forEach(function(p, n){
        p().then(function(r){
          results[n] = r;
          d.notify(r);
          if(!--l) {
            d.resolve(results);
          }
        });
      });
      return d.promise;
    },*/

(function(exports){
  var noop = function(){}
  , mapping = ['resolve', 'reject'];

  function isFunction(arg){
    return typeof(arg) == 'function';
  }

  function createPromise(){
    // state: -1 pending, 0 fulfilled, 1 rejected;
    // store[0] value, values[1] reason;
    // cbs[0] onFulfilled, cbs[1] onRejected
    var state = -1, cbs = [], store = [], next;

    function honor(){
      var r, v = store[state];
      r = cbs[state] && cbs[state](v);
      if(r && isFunction(r.then)){
        r.then.apply(r, mapping.map(function(name){
          return next[name];
        }));
      }
    }

    var ins = {
          then: function () {
            var args = arguments;
            next = createPromise();
            mapping.forEach(function(name, i){
              if(isFunction(args[i])){
                cbs[i] = args[i];
              }
            });

            if(state > -1){
              honor();
            }
            return next;
          }
        }

    mapping.forEach(function(item, i){
      ins[item] = function(arg){
        state = i;
        store[state] = arg;
        honor();
        ins[item] = noop;
      }
    });


    return ins;
  }

  var sp = {
    defer: function () {
      var promise = createPromise();

      return {
        promise: promise,
        resolve: function (arg) {
          promise.resolve(arg);
        },
        reject: function (arg) {
          promise.reject(arg);
        }
      }
    }
  }


  exports.sp = sp;
})(this['module'] ? module.exports: this);