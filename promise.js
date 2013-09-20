"use strict";

(function(exports){
  var mapping = ['resolve', 'reject', 'notify'];

  function isFunction(arg){
    return typeof(arg) == 'function';
  }

  function createPromise(){
    // state: -1 pending, 0 fulfilled, 1 rejected;
    // store[0] value, values[1] reason;
    // cbs[0] onFulfilled, cbs[1] onRejected
    var state = -1, cbs = [[], [], []], store = [], next = [], runned = false;

    function honor(){
      if(!runned){
        setTimeout(honorAsync);
      }
    }

    function notify(){
      var cb, nx;
      cbs[2].forEach(function(cb, i){
        nx = next[i];
        if(isFunction(cb)){
          nx.notify(cb(store[2]));
        } else {
          nx.notify(store[2]);
        }
      });
    }

    function honorAsync(){

      if(!next.length){
        return;
      }
      
      var cb, nx;
      do {
        cb = cbs[state].shift();
        nx = next.shift();
        honorPiece(cb, nx);
      } while (cbs[state].length);
    }

    function honorPiece(cb, nx){
      try {
        var r, v = store[state];
        if(!isFunction(cb)){
          nx[mapping[state]](store[state]);
        } else {
          r = cb(v);
          if(r && isFunction(r.then)){
            r.then.apply(r, mapping.map(function(name){
              return nx[name];
            }));
          } else {
            nx.resolve(r);
          }
        }
      } catch(e) {
        nx.reject(e);
      }
    }

    var ins = {
          then: function () {
            var args = arguments, nx = createPromise();
            next.push(nx);
            mapping.forEach(function(name, i){
              cbs[i].push(args[i]);
            });
            if(state > -1){
              runned = true;
              honor();
            }
            return nx;
          },
          progress: function(fn){
            this.then(null, null, fn);
            return this;
          },
          fail: function(fn){
            this.then(null, fn);
            return this;
          }
        }

    mapping.forEach(function(item, i){
      ins[item] = function(arg){
        if(state < 0){
          store[i] = arg;
          if(i == 2){
          //  setTimeout(function(){
            notify(arg);
          //  });
            return ins;
          } else {
            state = i;
            honor();
          }
        }
      }
    });
    return ins;
  }

  function detach(des, prvtList){
    var priv = {};
    prvtList.forEach(function(k){
      priv[k] = des[k];
      delete des[k];
    });
    return priv;
  }

  function extend(target) {
    var source, key;
    source = Array.prototype.slice.call(arguments, 1);
    source.forEach(function(item){
      for( key in item ){
        target[key] = item[key];
      }
    });
    return target;
  }

  var addition = {
    call: function(fn){
      var d = this.defer();
      d.resolve();
      return d.promise.then(fn);
    },
    waterfall: function(ps){
      return ps.reduce(function(n, u){
          return n.then(u);
        }, this.call());
    },
    all: function(ps){
      var l = ps.length, results = [], d = this.defer();
      try {
        ps.forEach(function(p, n){
          p().then(function(r){
            results[n] = r;
            if(!--l) {
              d.resolve(results);
            }
          }, function(r){
            d.reject(r);
          }, function(n){
            d.notify(n);
          });
        });
      } catch(e){
        d.reject(e);
      }
      
      return d.promise;
    }
  }

  var sp = {
    defer: function () {
      var promise = createPromise()
      , _private = detach(promise, mapping)
      , ins = { promise: promise };

      mapping.forEach(function(k){
        ins[k] = function(arg){
          _private[k](arg);
        }
      });

      return ins;
    }
  }

  extend(sp, addition);
  exports.sp = sp;
})(this['module'] ? module.exports: this);