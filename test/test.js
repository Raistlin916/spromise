"use strict";
var expect = require('chai').expect
  , sp = require('../promise').sp
  , Deferred = require('../_deferred').Deferred
  , when = require('../when')
  , Q = require('../q')
  , rsvp = require('rsvp');

var defer = sp.defer;

describe('defer', function(){
  var d, count, fooObj, targetData, targetData2, e;
  before(function(){
    fooObj = {};
    targetData = 'bar';
    targetData2 = 'bar2';
    e = new Error;
  });
  beforeEach(function(){
    d = defer();
    count = 0;
  });
  it('.defer() should return value which has promise', function(){
    expect(d).to.have.property('promise');
  });

  describe('promise', function(){
    
    describe('then', function(){
      describe('onFulfilled and onRejected are optional arguments', function(){
        it('ignored onFulfilled is not a function', function(){
          d.promise.then(fooObj, null);
          d.resolve();
        });
        it('ignored onRejected is not a function', function(){
          d.promise.then(null, fooObj);
          d.resolve();
        });
        it('ignored onFulfilled, onRejected is null', function(){
          d.promise.then();
          d.resolve();
        });
      });
      describe('If onFulfilled is a function', function(){
        it('called after promise is fulfilled', function(done){
          d.promise.then(done);
          d.resolve();
        });
        describe('with promise\'s value as its first argument', function(){
          it('fulfill before', function(done){
            d.resolve(targetData);
            d.promise.then(function(arg){
              expect(arg).to.equal(targetData);
              done();
            });
            
          });
          it('fulfill after', function(done){
            d.promise.then(function(arg){
              expect(arg).to.equal(targetData);
              done();
            });
            d.resolve(targetData);
          });
        });
        it('not be called before promise is fulfilled', function(){
          d.promise.then(function(arg){
            throw new Error;
          });
          d.reject();
        });

        it('not be called more than once', function(done){
          d.resolve();
          d.resolve();
          d.promise.then(function(arg){    
            done();
          });
          d.resolve();
          d.resolve();
        });

      });
      describe('If onRejected is a function', function(){
        it('called after promise is rejected', function(done){
          d.promise.then(null, done);
          d.reject();
        });
        describe('with promise\'s value as its first argument', function(){
          it('reject before', function(done){
            d.reject(targetData);
            d.promise.then(null, function(arg){
              expect(arg).to.equal(targetData);
              done();
            });
          });
          it('reject after', function(done){
            d.promise.then(null, function(arg){
              expect(arg).to.equal(targetData);
              done();
            });
            d.reject(targetData);
          });
        });
        it('not be called before promise is rejected', function(){
          d.promise.then(null, function(arg){
            throw new Error;
          });
          d.resolve();
        });
        it('not be called more than once', function(done){
          d.reject();
          d.reject();
          d.promise.then(null, function(arg){    
            done();
          });
          d.reject();
          d.reject();
        });
      });
      describe('onFulfilled or onRejected must be called', function(){
        it('not until the execution context stack contains only platform code(before)', function(done){
          d.resolve();
          d.promise.then(function(arg){
            count++;
            expect(count).to.equal(2);
            done();
          });
          count++;
        });
        it('not until the execution context stack contains only platform code(after)', function(done){
          d.promise.then(function(arg){
            count++;
            expect(count).to.equal(2);
            done();
          });
          d.resolve();
          count++;
        });
        it('as functions (onFulfilled)', function(done){
          d.resolve();
          d.promise.then(function(arg){
            try{
              expect(this).to.not.exist;
              done();
            } catch(e){
              done(e);
            }
          }); 
        });
        it('as functions (onRejected)', function(done){
          d.reject();
          d.promise.then(null, function(arg){    
            try{
              expect(this).to.not.exist;
              done();
            } catch(e){
              done(e);
            }
          }); 
        });
      });

      describe('then may be called multiple times on the same promise', function(){
        it('fulfilled onFulfilled callbacks execute in order',
          function(done){
            d.promise.then(function(arg){    
              expect(++count).to.be.equal(1);
            });
            d.promise.then(function(arg){    
              expect(++count).to.be.equal(2);
              done();
            }); 
            d.resolve();
          });
        it('rejected onRejected callbacks execute in order',
          function(done){
            d.promise.then(null, function(arg){    
              expect(++count).to.be.equal(1);
            });
            d.promise.then(null, function(arg){    
              expect(++count).to.be.equal(2);
              done();
            }); 
            d.reject();
          });
      });

      describe('must return a promise', function(){
        var promise2;
        beforeEach(function(){
          promise2 = d.promise.then(function(){
            return targetData;
          }, function(){
            return targetData2;
          });
        });
        it('is a promise', function(){
          expect(promise2).to.exist;
          expect(promise2).to.have.property('then');
        });
        it('onFulfilled returns x, run PRP', function(done){
          d.resolve();
          promise2.then(function(v){
            try{
              expect(v).to.equal(targetData);
              done();
            } catch(e) {
              done(e);
            }          
          });
        });
        it('onRejected returns x, run PRP', function(done){
          d.reject();
          promise2.then(function(v){
            try{
              expect(v).to.equal(targetData2);
              done();
            } catch(e) {
              done(e);
            }     
          });
        });

        describe('PRP', function(){
          var d2;
          beforeEach(function(){
            d2 = defer();
          });
          describe('promise and x refer to the same object', function(){
            it.skip('reject promise with a TypeError as the reason', function(done){
              d.promise.then(function(){
                return d.promise;
              }).then(null, function(e){
                try {
                  expect(e).to.be.an.instanceof(TypeError);
                  done();
                } catch(e){
                  done(e);
                }
              });
              d.resolve();
            });
          });

          describe('x is a promise', function(){
            it('when x is fulfilled, fulfill promise with the same value', function(done){
              setTimeout(function(){
                d2.resolve(targetData);
              }, 50);

              d.promise.then(function(){
                return d2.promise;
              }).then(function(data){
                expect(data).to.equal(targetData);
                done();
              });
              d.resolve();
            });

            it('when x is rejected, reject promise with the same value', function(done){
              setTimeout(function(){
                d2.reject(targetData);
              }, 50);

              d.promise.then(function(){
                return d2.promise;
              }).then(null, function(data){
                expect(data).to.equal(targetData);
                done();
              });
              d.resolve();
            });
          });
          
          describe('x is an object or function', function(){
            it('let then be x.then', function(done){
              d.promise.then(function(){
                return {
                  then: function(){
                    done();
                  }
                };
              }).then(function(){
                done('should not run orignal then');
              });
              d.resolve();
            });

            it.skip('retrieving the property x.then results in a thrown exception e, reject promise with e as the reason', function(){
              
            });

            it('in x.then, this is x', function(done){
              d.promise.then(function(){
                var r = {
                  then: function(){
                    expect(this).to.equal(r);
                    done();
                  },
                  foo: targetData2
                }
                return r;
              });
              d.resolve();
            });

            describe('x.then have two arguments, resolvePromise and rejectPromise', function(){

              it('rejectPromise is called with a reason r, reject promise with r', function(done){
                d.promise.then(function(){
                  return {
                    then: function(res, rej){
                      rej(targetData);
                      throw targetData2;
                    }
                  };
                }).then(function(d){
                  done('should not run this');
                }, function(e){
                  expect(e).to.equal(targetData);
                  done();
                });
                d.resolve();
              });

              it( 'both resolvePromise and rejectPromise are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored', function(done){
                d.promise.then(function(){
                  return {
                    then: function(res, rej){
                      res(targetData2)
                      rej(targetData);
                    }
                  };
                }).then(function(d){
                  expect(d).to.equal(targetData2);
                  done();
                }, function(e){
                  done('should not run this');
                });
                d.resolve();
              });

              describe('calling then throws an exception e', function(){
                it('resolvePromise or rejectPromise have been called, ignore it', function(done){
                  d.promise.then(function(){
                    return {
                      then: function(res, rej){
                        res(targetData);
                        throw targetData2;
                      }
                    };
                  }).then(function(d){
                    expect(d).to.equal(targetData);
                    done();
                  }, function(e){
                    done('should not run this');
                  });
                  d.resolve();
                });
                it('otherwise, reject promise with e as the reason', function(done){
                  d.promise.then(function(){
                    return {
                      then: function(res, rej){
                        throw targetData;
                      }
                    };
                  }).then(function(){
                    done('should not run this');
                  }, function(e){
                    expect(e).to.equal(targetData);
                    done();
                  });
                  d.resolve();
                });
              });
            });
            
          });
          
        });

        describe('either onFulfilled or onRejected throws an exception e', function(){
          it('throw in onFulfilled', function(done){
            d.promise.then(function(){
              throw e;
            }).then(null, function(err){
              expect(err).to.equal(e);
              done();
            });
            d.resolve();
          });
          it('throw in onRejected', function(){
            d.promise.then(null, function(){
              throw e;
            }).then(null, function(err){
              expect(err).to.equal(e);
              done();
            });
            d.reject();
          });
        });

        describe('onFulfilled is not a function and promise1 is fulfilled', function(){
          it('promise2 must be fulfilled with the same value', function(done){
            var p2 = d.promise.then();
            d.resolve(targetData);
            p2.then(function(data){
              try{
                expect(data).to.equal(targetData);
                done();
              } catch(e){
                done(e);
              }
            })
          });
        });

        describe('onRejected is not a function and promise1 is rejected', function(){
          it('promise2 must be rejected with the same reason', function(done){
            var p2 = d.promise.then();
            d.reject(targetData);
            p2.then(null, function(data){
              try{
                expect(data).to.equal(targetData);
                done();
              } catch(e){
                done(e);
              }
            });
          });
        });
      });
      it('error bubbling', function(done){
        d.promise.then(function(){
          expect(++count).to.equal(1);
          throw targetData;
        }).then(function(){
          expect(++count).to.equal(2);
        }).then(function(){
          expect(++count).to.equal(3);
        }, function(e){
          try{
            expect(e).to.equal(targetData);
            done();
          } catch(e){
            done(e);
          }
        });

        d.resolve();
      });
    });
  });

  it('promise should not have resolve', function(){
    expect(d.promise.resolve).to.not.exist;
  });

  it('promise should not have reject', function(){
    expect(d.promise.reject).to.not.exist;
  });

});



