function f1(main) {
    var e = ['click', 'mouseenter', 'mouseout'];
    for (var i = 0; i < e.length; i++) {
        main.addEventListener(e[i], function (e) {
            console.log('this is ' + e.type + ' event in context of f1');
        }, false);
    }
}
function f2(main) {
    var e = ['click', 'wheel'];
    for (var i = 0; i < e.length; i++) {
        main.addEventListener(e[i], function (e) {
            console.log('this is ' + e.type + ' event in context of f2');
        }, false);
    }
}
function f3(main) {
    var e = ['click', 'mouseover'];
    for (var i = 0; i < e.length; i++) {
        main.addEventListener(e[i], function (e) {
            console.log('this is ' + e.type + ' event in context of f3');
        }, false);
    }
}
function ProxyListener(div) {
    var hashMap = {};
    var actualAddEventListener = div.addEventListener;
    var stack = new Array();
    function newEventListener(eventName, callback, useCapture) {
        var currentContext = peekContext();
        if (currentContext) {
            if (!hashMap[currentContext])
                hashMap[currentContext] = new Array();
            hashMap[currentContext].push({ eventName: eventName, callback: callback });
        }
        actualAddEventListener.call(this, eventName, callback, useCapture);
    }
    function pushContext(params) {
        stack.push(params);
        div.addEventListener = newEventListener;
    }
    function popContext() {
        stack.splice(stack.length - 1, 1);
        if (stack.length === 0)
            div.addEventListener = actualAddEventListener;
    }
    function peekContext() {
        if (stack.length === 0)
            return undefined;
        return stack[stack.length - 1];
    }
    function removeContext(contextName) {
        if (!hashMap[contextName])
            return;
        for (var i = 0; i < hashMap[contextName].length; i++) {
            div.removeEventListener(hashMap[contextName][i].eventName, hashMap[contextName][i].callback, false);
        }
        delete hashMap[contextName];
    }
    return {
        pushContext: pushContext,
        popContext: popContext,
        peekContext: peekContext,
        removeContext: removeContext
    };
}
var proxyEventListener;
var excutionContext = { f1: f1, f2: f2, f3: f3 };
function unregister(str) {
    proxyEventListener.removeContext(str);
}
window.onload = function () {
    var main = document.querySelector('#MainContainer');
    var k = ProxyListener(main);
    proxyEventListener = k;
    main.addEventListener('click', function () {
        console.log('i was called directly & can\'t be unregistered');
    }, false);
    main.addEventListener('change', function (e) {
        var node = e.target;
        var parentElement = node.parentElement;
        var isFirstchild = parentElement.firstChild === node;
        if (node.checked) {
            parentElement.textContent = 'unregister';
            proxyEventListener.pushContext(node.id);
            excutionContext[node.id](main); // calling f1 ,f2 ,f3;
            proxyEventListener.popContext(); // removing context 
        }
        else {
            parentElement.textContent = 'register';
            proxyEventListener.removeContext(node.id); // remove the context
        }
        if (isFirstchild)
            parentElement.insertBefore(node, parentElement.firstChild);
        else
            parentElement.appendChild(node);
    });
};
//# sourceMappingURL=app.js.map