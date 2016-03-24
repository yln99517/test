
function f1(main: HTMLDivElement) {
    var e = ['click', 'mouseenter', 'mouseout'];
    for (var i = 0; i < e.length; i++) {
        main.addEventListener(e[i], function(e) {
            console.log('this is ' + e.type + ' event in context of f1');
        }, false);
    }
}
function f2(main: HTMLDivElement) {
    var e = ['click', 'wheel'];
    for (var i = 0; i < e.length; i++) {
        main.addEventListener(e[i], function(e) {
            console.log('this is ' + e.type + ' event in context of f2');
        }, false);
    }
}
function f3(main: HTMLDivElement) {
    var e = ['click', 'mouseover'];
    for (var i = 0; i < e.length; i++) {
        main.addEventListener(e[i], function(e) {
            console.log('this is ' + e.type + ' event in context of f3');
        }, false);
    }
}



function ProxyListener(div: HTMLDivElement) {

    var hashMap: { [key: string]: Array<{ eventName: string, callback: any }> } = {};
    var actualAddEventListener = div.addEventListener;
    var stack: Array<string> = new Array<string>();

    function newEventListener(eventName: string, callback, useCapture: boolean) {
        var currentContext = peekContext();

        if (currentContext) {
            if (!hashMap[currentContext])
                hashMap[currentContext] = new Array();
            hashMap[currentContext].push({ eventName: eventName, callback: callback });
        }
        actualAddEventListener.call(this, eventName, callback, useCapture);

    }

    function pushContext(params: string) {
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
    function removeContext(contextName: string) {
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

function unregister(str: string) {
    proxyEventListener.removeContext(str);
}




window.onload = function() {
    var main = <HTMLDivElement>document.querySelector('#MainContainer');

    var k = ProxyListener(main);
    proxyEventListener = k;

    main.addEventListener('click', function() {
        console.log('i was called directly & can\'t be unregistered');
    }, false);
    main.addEventListener('change', function(e) {
        var node: HTMLInputElement = <HTMLInputElement>e.target;
        var parentElement = node.parentElement;
        var isFirstchild = parentElement.firstChild === node;
        if (node.checked) {
            parentElement.textContent = 'unregister';
            proxyEventListener.pushContext(node.id);
            excutionContext[node.id](main);      // calling f1 ,f2 ,f3;
            proxyEventListener.popContext();     // removing context 
        } else {
            parentElement.textContent = 'register';
            proxyEventListener.removeContext(node.id); // remove the context
        }
        if (isFirstchild)
            parentElement.insertBefore(node,parentElement.firstChild);
        else
            parentElement.appendChild(node);

    });
};



interface ServiceWorker {

}