# spromise

一个对promise模型的实现，s for simple。

### 用法

    var defer = sp.defer;

    function s1(){
      var d = defer();

      setTimeout(function(){
        d.notify('a');
        d.resolve(123);

      }, 1000);
      return d.promise;
    }

    function s2(){
      var d = defer();
      setTimeout(function(){
        d.reject(111);
        d.resolve(222);
      }, 1000);
      return d.promise;
    }

    sp.all([s1(), s2()]).then(function(d){
      console.log(d);
    }).fail(function(d){
      console.log(d);
    }).progress(function(n){
      console.log(n);
    });
    
### 功能

提供两个额外方法:
  
+ all

+ waterfall