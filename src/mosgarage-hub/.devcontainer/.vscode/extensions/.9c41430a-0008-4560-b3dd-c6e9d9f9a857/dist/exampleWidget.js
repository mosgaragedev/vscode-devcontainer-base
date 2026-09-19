/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@fortawesome/free-solid-svg-icons/faBrain.js":
/*!*******************************************************************!*\
  !*** ./node_modules/@fortawesome/free-solid-svg-icons/faBrain.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var prefix = 'fas';
var iconName = 'brain';
var width = 512;
var height = 512;
var aliases = [129504];
var unicode = 'f5dc';
var svgPathData = 'M184 0c30.9 0 56 25.1 56 56V456c0 30.9-25.1 56-56 56c-28.9 0-52.7-21.9-55.7-50.1c-5.2 1.4-10.7 2.1-16.3 2.1c-35.3 0-64-28.7-64-64c0-7.4 1.3-14.6 3.6-21.2C21.4 367.4 0 338.2 0 304c0-31.9 18.7-59.5 45.8-72.3C37.1 220.8 32 207 32 192c0-30.7 21.6-56.3 50.4-62.6C80.8 123.9 80 118 80 112c0-29.9 20.6-55.1 48.3-62.1C131.3 21.9 155.1 0 184 0zM328 0c28.9 0 52.6 21.9 55.7 49.9c27.8 7 48.3 32.1 48.3 62.1c0 6-.8 11.9-2.4 17.4c28.8 6.2 50.4 31.9 50.4 62.6c0 15-5.1 28.8-13.8 39.7C493.3 244.5 512 272.1 512 304c0 34.2-21.4 63.4-51.6 74.8c2.3 6.6 3.6 13.8 3.6 21.2c0 35.3-28.7 64-64 64c-5.6 0-11.1-.7-16.3-2.1c-3 28.2-26.8 50.1-55.7 50.1c-30.9 0-56-25.1-56-56V56c0-30.9 25.1-56 56-56z';

exports.definition = {
  prefix: prefix,
  iconName: iconName,
  icon: [
    width,
    height,
    aliases,
    unicode,
    svgPathData
  ]};

exports.faBrain = exports.definition;
exports.prefix = prefix;
exports.iconName = iconName;
exports.width = width;
exports.height = height;
exports.ligatures = aliases;
exports.unicode = unicode;
exports.svgPathData = svgPathData;
exports.aliases = aliases;

/***/ }),

/***/ "./exampleWidget/widget.ts":
/*!*********************************!*\
  !*** ./exampleWidget/widget.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const webviews_1 = __importDefault(__webpack_require__(/*! tangle/webviews */ "./node_modules/tangle/dist/cjs/webviews.js"));
const faBrain_1 = __webpack_require__(/*! @fortawesome/free-solid-svg-icons/faBrain */ "./node_modules/@fortawesome/free-solid-svg-icons/faBrain.js");
const ch = new webviews_1.default('stateful.marquee');
const client = ch.attach(window.vscode);
const template = document.createElement('template');
template.innerHTML = /*html*/ `
  <style>
  :host {
    margin: 10px;
    display: block;
  }
  </style>
  <div>
    Hello World
  </div>
`;
class StatefulMarqueeIncrementExampleWidget extends HTMLElement {
    static get is() {
        return 'stateful-marquee-widget';
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        client.on('counter', (cnt) => {
            this.shadowRoot.querySelector('div').innerHTML = ('Hello World' +
                [...new Array(cnt)].map(() => '!').join(''));
        });
    }
    connectedCallback() {
        var _a;
        (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.appendChild(template.content.cloneNode(true));
    }
}
const updateNameWidgetTemplate = document.createElement('template');
updateNameWidgetTemplate.innerHTML = /*html*/ `
  <style>
  :host {
    margin: 10px;
    display: block;
  }
  button {
    cursor: pointer;
    padding: 10px 15px;
    border: none;
    background-color: #F62458;
    color: #ffffff
  }
  </style>
  <section>
    <div>Name: </div>
    <button>Change Name</button>
  </section>
`;
class StatefulMarqueeUpdateNameWidget extends HTMLElement {
    static get is() {
        return 'stateful-marquee-updatename';
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        client.on('changeName', (name) => {
            this.shadowRoot.querySelector('div').innerHTML = `<h1>Name: ${name}</h1>`;
        });
    }
    connectedCallback() {
        var _a;
        (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.appendChild(updateNameWidgetTemplate.content.cloneNode(true));
        const button = this.shadowRoot.querySelector('button');
        button === null || button === void 0 ? void 0 : button.addEventListener('click', () => {
            client.emit('changeName', 'Bar');
        });
    }
}
window.marqueeExtension.defineWidget({
    name: StatefulMarqueeIncrementExampleWidget.is,
    icon: faBrain_1.faBrain,
    label: 'Marquee Example Widget - Counter',
    tags: ['productivity'],
    description: 'An example widget that shows how other extensions can add Marquee widgets.'
}, StatefulMarqueeIncrementExampleWidget);
window.marqueeExtension.defineWidget({
    name: StatefulMarqueeUpdateNameWidget.is,
    icon: faBrain_1.faBrain,
    label: 'Marquee Example - Change Name',
    tags: ['productivity'],
    description: 'An example widget that shows how other extensions can add Marquee widgets.'
}, StatefulMarqueeUpdateNameWidget);
exports["default"] = StatefulMarqueeIncrementExampleWidget;


/***/ }),

/***/ "./node_modules/tangle/dist/cjs/channel-275f5852.js":
/*!**********************************************************!*\
  !*** ./node_modules/tangle/dist/cjs/channel-275f5852.js ***!
  \**********************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var e=__webpack_require__(/*! ./tangle-e9ac0fd9.js */ "./node_modules/tangle/dist/cjs/tangle-e9ac0fd9.js");exports.BaseChannel=class{constructor(e,n){this._namespace=e,this._defaultValue=n,this.providers=[]}debounceResolution(n,r){return t=>{return t.pipe((i=t=>{const i=t.length===n?0:r;return e.timer(i)},e.operate((function(n,r){var t=!1,s=null,u=null,o=function(){if(null==u||u.unsubscribe(),u=null,t){t=!1;var e=s;s=null,r.next(e)}};n.subscribe(e.createOperatorSubscriber(r,(function(n){null==u||u.unsubscribe(),t=!0,s=n,u=e.createOperatorSubscriber(r,o,e.noop),e.innerFrom(i(n)).subscribe(u)}),(function(){o(),r.complete()}),void 0,(function(){s=u=null})))}))));var i}}registerPromise(n){const r=n.map((n=>"function"==typeof n.then?e.from(n):e.of(n)));return new Promise(((e,n)=>this.register(r).subscribe({next:e,error:n})))}_register(n,r){const t=n.map((n=>{return(r=n)&&(r instanceof e.Observable||e.isFunction(r.lift)&&e.isFunction(r.subscribe))?n:e.of(n);var r}));var i,s,u,o,c,l;return e.merge(...t).pipe((i=e=>this.providers.push(e),(o=e.isFunction(i)||s||u?{next:i,error:s,complete:u}:i)?e.operate((function(n,r){var t;null===(t=o.subscribe)||void 0===t||t.call(o);var i=!0;n.subscribe(e.createOperatorSubscriber(r,(function(e){var n;null===(n=o.next)||void 0===n||n.call(o,e),r.next(e)}),(function(){var e;i=!1,null===(e=o.complete)||void 0===e||e.call(o),r.complete()}),(function(e){var n;i=!1,null===(n=o.error)||void 0===n||n.call(o,e),r.error(e)}),(function(){var e,n;i&&(null===(e=o.unsubscribe)||void 0===e||e.call(o)),null===(n=o.finalize)||void 0===n||n.call(o)})))})):e.identity),e.map((e=>r(e))),e.scan(((e,n)=>(e.push(n),e)),[])).pipe(this.debounceResolution(this.providers.length,100),(c=n=>new e.Observable((e=>{const r=this._initiateBus(n,this._state),t=r.transient.subscribe((e=>this._state=e));return e.next(r),()=>{r.dispose(),t.unsubscribe()}})),e.operate((function(n,r){var t=null,i=0,s=!1,u=function(){return s&&!t&&r.complete()};n.subscribe(e.createOperatorSubscriber(r,(function(n){null==t||t.unsubscribe();var s=0,o=i++;e.innerFrom(c(n,o)).subscribe(t=e.createOperatorSubscriber(r,(function(e){return r.next(l?l(n,e,o,s++):e)}),(function(){t=null,u()})))}),(function(){s=!0,u()})))}))))}_initiateBus(n,r){return new e.Bus(this._namespace,n,r||this._defaultValue||{})}_initiateClient(n){const r=new e.Client(this._namespace,[n],this._defaultValue||{});return r.notify(),r}};


/***/ }),

/***/ "./node_modules/tangle/dist/cjs/tangle-e9ac0fd9.js":
/*!*********************************************************!*\
  !*** ./node_modules/tangle/dist/cjs/tangle-e9ac0fd9.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, exports) => {

var t=function(n,e){return t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,n){t.__proto__=n}||function(t,n){for(var e in n)Object.prototype.hasOwnProperty.call(n,e)&&(t[e]=n[e])},t(n,e)};function n(n,e){if("function"!=typeof e&&null!==e)throw new TypeError("Class extends value "+String(e)+" is not a constructor or null");function r(){this.constructor=n}t(n,e),n.prototype=null===e?Object.create(e):(r.prototype=e.prototype,new r)}function e(t,n,e,r){return new(e||(e=Promise))((function(i,o){function u(t){try{c(r.next(t))}catch(t){o(t)}}function s(t){try{c(r.throw(t))}catch(t){o(t)}}function c(t){var n;t.done?i(t.value):(n=t.value,n instanceof e?n:new e((function(t){t(n)}))).then(u,s)}c((r=r.apply(t,n||[])).next())}))}function r(t,n){var e,r,i,o,u={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return o={next:s(0),throw:s(1),return:s(2)},"function"==typeof Symbol&&(o[Symbol.iterator]=function(){return this}),o;function s(s){return function(c){return function(s){if(e)throw new TypeError("Generator is already executing.");for(;o&&(o=0,s[0]&&(u=0)),u;)try{if(e=1,r&&(i=2&s[0]?r.return:s[0]?r.throw||((i=r.return)&&i.call(r),0):r.next)&&!(i=i.call(r,s[1])).done)return i;switch(r=0,i&&(s=[2&s[0],i.value]),s[0]){case 0:case 1:i=s;break;case 4:return u.label++,{value:s[1],done:!1};case 5:u.label++,r=s[1],s=[0];continue;case 7:s=u.ops.pop(),u.trys.pop();continue;default:if(!(i=u.trys,(i=i.length>0&&i[i.length-1])||6!==s[0]&&2!==s[0])){u=0;continue}if(3===s[0]&&(!i||s[1]>i[0]&&s[1]<i[3])){u.label=s[1];break}if(6===s[0]&&u.label<i[1]){u.label=i[1],i=s;break}if(i&&u.label<i[2]){u.label=i[2],u.ops.push(s);break}i[2]&&u.ops.pop(),u.trys.pop();continue}s=n.call(t,u)}catch(t){s=[6,t],r=0}finally{e=i=0}if(5&s[0])throw s[1];return{value:s[0]?s[1]:void 0,done:!0}}([s,c])}}}function i(t){var n="function"==typeof Symbol&&Symbol.iterator,e=n&&t[n],r=0;if(e)return e.call(t);if(t&&"number"==typeof t.length)return{next:function(){return t&&r>=t.length&&(t=void 0),{value:t&&t[r++],done:!t}}};throw new TypeError(n?"Object is not iterable.":"Symbol.iterator is not defined.")}function o(t,n){var e="function"==typeof Symbol&&t[Symbol.iterator];if(!e)return t;var r,i,o=e.call(t),u=[];try{for(;(void 0===n||n-- >0)&&!(r=o.next()).done;)u.push(r.value)}catch(t){i={error:t}}finally{try{r&&!r.done&&(e=o.return)&&e.call(o)}finally{if(i)throw i.error}}return u}function u(t,n,e){if(e||2===arguments.length)for(var r,i=0,o=n.length;i<o;i++)!r&&i in n||(r||(r=Array.prototype.slice.call(n,0,i)),r[i]=n[i]);return t.concat(r||Array.prototype.slice.call(n))}function s(t){return this instanceof s?(this.v=t,this):new s(t)}function c(t,n,e){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var r,i=e.apply(t,n||[]),o=[];return r={},u("next"),u("throw"),u("return"),r[Symbol.asyncIterator]=function(){return this},r;function u(t){i[t]&&(r[t]=function(n){return new Promise((function(e,r){o.push([t,n,e,r])>1||c(t,n)}))})}function c(t,n){try{(e=i[t](n)).value instanceof s?Promise.resolve(e.value.v).then(l,a):f(o[0][2],e)}catch(t){f(o[0][3],t)}var e}function l(t){c("next",t)}function a(t){c("throw",t)}function f(t,n){t(n),o.shift(),o.length&&c(o[0][0],o[0][1])}}function l(t){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var n,e=t[Symbol.asyncIterator];return e?e.call(t):(t=i(t),n={},r("next"),r("throw"),r("return"),n[Symbol.asyncIterator]=function(){return this},n);function r(e){n[e]=t[e]&&function(n){return new Promise((function(r,i){(function(t,n,e,r){Promise.resolve(r).then((function(n){t({value:n,done:e})}),n)})(r,i,(n=t[e](n)).done,n.value)}))}}}function a(t){return"function"==typeof t}function f(t){var n=t((function(t){Error.call(t),t.stack=(new Error).stack}));return n.prototype=Object.create(Error.prototype),n.prototype.constructor=n,n}var h=f((function(t){return function(n){t(this),this.message=n?n.length+" errors occurred during unsubscription:\n"+n.map((function(t,n){return n+1+") "+t.toString()})).join("\n  "):"",this.name="UnsubscriptionError",this.errors=n}}));function p(t,n){if(t){var e=t.indexOf(n);0<=e&&t.splice(e,1)}}var v=function(){function t(t){this.initialTeardown=t,this.closed=!1,this._parentage=null,this._finalizers=null}var n;return t.prototype.unsubscribe=function(){var t,n,e,r,s;if(!this.closed){this.closed=!0;var c=this._parentage;if(c)if(this._parentage=null,Array.isArray(c))try{for(var l=i(c),f=l.next();!f.done;f=l.next()){f.value.remove(this)}}catch(n){t={error:n}}finally{try{f&&!f.done&&(n=l.return)&&n.call(l)}finally{if(t)throw t.error}}else c.remove(this);var p=this.initialTeardown;if(a(p))try{p()}catch(t){s=t instanceof h?t.errors:[t]}var v=this._finalizers;if(v){this._finalizers=null;try{for(var d=i(v),b=d.next();!b.done;b=d.next()){var _=b.value;try{y(_)}catch(t){s=null!=s?s:[],t instanceof h?s=u(u([],o(s)),o(t.errors)):s.push(t)}}}catch(t){e={error:t}}finally{try{b&&!b.done&&(r=d.return)&&r.call(d)}finally{if(e)throw e.error}}}if(s)throw new h(s)}},t.prototype.add=function(n){var e;if(n&&n!==this)if(this.closed)y(n);else{if(n instanceof t){if(n.closed||n._hasParent(this))return;n._addParent(this)}(this._finalizers=null!==(e=this._finalizers)&&void 0!==e?e:[]).push(n)}},t.prototype._hasParent=function(t){var n=this._parentage;return n===t||Array.isArray(n)&&n.includes(t)},t.prototype._addParent=function(t){var n=this._parentage;this._parentage=Array.isArray(n)?(n.push(t),n):n?[n,t]:t},t.prototype._removeParent=function(t){var n=this._parentage;n===t?this._parentage=null:Array.isArray(n)&&p(n,t)},t.prototype.remove=function(n){var e=this._finalizers;e&&p(e,n),n instanceof t&&n._removeParent(this)},t.EMPTY=((n=new t).closed=!0,n),t}(),d=v.EMPTY;function b(t){return t instanceof v||t&&"closed"in t&&a(t.remove)&&a(t.add)&&a(t.unsubscribe)}function y(t){a(t)?t():t.unsubscribe()}var _={onUnhandledError:null,onStoppedNotification:null,Promise:void 0,useDeprecatedSynchronousErrorHandling:!1,useDeprecatedNextContext:!1},x=function(t,n){for(var e=[],r=2;r<arguments.length;r++)e[r-2]=arguments[r];return setTimeout.apply(void 0,u([t,n],o(e)))};function w(t){x((function(){throw t}))}function m(){}function g(t){t()}var S=function(t){function e(n){var e=t.call(this)||this;return e.isStopped=!1,n?(e.destination=n,b(n)&&n.add(e)):e.destination=C,e}return n(e,t),e.create=function(t,n,e){return new I(t,n,e)},e.prototype.next=function(t){this.isStopped||this._next(t)},e.prototype.error=function(t){this.isStopped||(this.isStopped=!0,this._error(t))},e.prototype.complete=function(){this.isStopped||(this.isStopped=!0,this._complete())},e.prototype.unsubscribe=function(){this.closed||(this.isStopped=!0,t.prototype.unsubscribe.call(this),this.destination=null)},e.prototype._next=function(t){this.destination.next(t)},e.prototype._error=function(t){try{this.destination.error(t)}finally{this.unsubscribe()}},e.prototype._complete=function(){try{this.destination.complete()}finally{this.unsubscribe()}},e}(v),E=Function.prototype.bind;function O(t,n){return E.call(t,n)}var A=function(){function t(t){this.partialObserver=t}return t.prototype.next=function(t){var n=this.partialObserver;if(n.next)try{n.next(t)}catch(t){P(t)}},t.prototype.error=function(t){var n=this.partialObserver;if(n.error)try{n.error(t)}catch(t){P(t)}else P(t)},t.prototype.complete=function(){var t=this.partialObserver;if(t.complete)try{t.complete()}catch(t){P(t)}},t}(),I=function(t){function e(n,e,r){var i,o,u=t.call(this)||this;a(n)||!n?i={next:null!=n?n:void 0,error:null!=e?e:void 0,complete:null!=r?r:void 0}:u&&_.useDeprecatedNextContext?((o=Object.create(n)).unsubscribe=function(){return u.unsubscribe()},i={next:n.next&&O(n.next,o),error:n.error&&O(n.error,o),complete:n.complete&&O(n.complete,o)}):i=n;return u.destination=new A(i),u}return n(e,t),e}(S);function P(t){w(t)}var C={closed:!0,next:m,error:function(t){throw t},complete:m},j="function"==typeof Symbol&&Symbol.observable||"@@observable";function M(t){return t}function k(t){return 0===t.length?M:1===t.length?t[0]:function(n){return t.reduce((function(t,n){return n(t)}),n)}}var T=function(){function t(t){t&&(this._subscribe=t)}return t.prototype.lift=function(n){var e=new t;return e.source=this,e.operator=n,e},t.prototype.subscribe=function(t,n,e){var r,i=this,o=(r=t)&&r instanceof S||function(t){return t&&a(t.next)&&a(t.error)&&a(t.complete)}(r)&&b(r)?t:new I(t,n,e);return g((function(){var t=i,n=t.operator,e=t.source;o.add(n?n.call(o,e):e?i._subscribe(o):i._trySubscribe(o))})),o},t.prototype._trySubscribe=function(t){try{return this._subscribe(t)}catch(n){t.error(n)}},t.prototype.forEach=function(t,n){var e=this;return new(n=z(n))((function(n,r){var i=new I({next:function(n){try{t(n)}catch(t){r(t),i.unsubscribe()}},error:r,complete:n});e.subscribe(i)}))},t.prototype._subscribe=function(t){var n;return null===(n=this.source)||void 0===n?void 0:n.subscribe(t)},t.prototype[j]=function(){return this},t.prototype.pipe=function(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];return k(t)(this)},t.prototype.toPromise=function(t){var n=this;return new(t=z(t))((function(t,e){var r;n.subscribe((function(t){return r=t}),(function(t){return e(t)}),(function(){return t(r)}))}))},t.create=function(n){return new t(n)},t}();function z(t){var n;return null!==(n=null!=t?t:_.Promise)&&void 0!==n?n:Promise}function B(t){return function(n){if(function(t){return a(null==t?void 0:t.lift)}(n))return n.lift((function(n){try{return t(n,this)}catch(t){this.error(t)}}));throw new TypeError("Unable to lift unknown Observable type")}}function V(t,n,e,r,i){return new F(t,n,e,r,i)}var F=function(t){function e(n,e,r,i,o,u){var s=t.call(this,n)||this;return s.onFinalize=o,s.shouldUnsubscribe=u,s._next=e?function(t){try{e(t)}catch(t){n.error(t)}}:t.prototype._next,s._error=i?function(t){try{i(t)}catch(t){n.error(t)}finally{this.unsubscribe()}}:t.prototype._error,s._complete=r?function(){try{r()}catch(t){n.error(t)}finally{this.unsubscribe()}}:t.prototype._complete,s}return n(e,t),e.prototype.unsubscribe=function(){var n;if(!this.shouldUnsubscribe||this.shouldUnsubscribe()){var e=this.closed;t.prototype.unsubscribe.call(this),!e&&(null===(n=this.onFinalize)||void 0===n||n.call(this))}},e}(S),L=f((function(t){return function(){t(this),this.name="ObjectUnsubscribedError",this.message="object unsubscribed"}})),U=function(t){function e(){var n=t.call(this)||this;return n.closed=!1,n.currentObservers=null,n.observers=[],n.isStopped=!1,n.hasError=!1,n.thrownError=null,n}return n(e,t),e.prototype.lift=function(t){var n=new N(this,this);return n.operator=t,n},e.prototype._throwIfClosed=function(){if(this.closed)throw new L},e.prototype.next=function(t){var n=this;g((function(){var e,r;if(n._throwIfClosed(),!n.isStopped){n.currentObservers||(n.currentObservers=Array.from(n.observers));try{for(var o=i(n.currentObservers),u=o.next();!u.done;u=o.next()){u.value.next(t)}}catch(t){e={error:t}}finally{try{u&&!u.done&&(r=o.return)&&r.call(o)}finally{if(e)throw e.error}}}}))},e.prototype.error=function(t){var n=this;g((function(){if(n._throwIfClosed(),!n.isStopped){n.hasError=n.isStopped=!0,n.thrownError=t;for(var e=n.observers;e.length;)e.shift().error(t)}}))},e.prototype.complete=function(){var t=this;g((function(){if(t._throwIfClosed(),!t.isStopped){t.isStopped=!0;for(var n=t.observers;n.length;)n.shift().complete()}}))},e.prototype.unsubscribe=function(){this.isStopped=this.closed=!0,this.observers=this.currentObservers=null},Object.defineProperty(e.prototype,"observed",{get:function(){var t;return(null===(t=this.observers)||void 0===t?void 0:t.length)>0},enumerable:!1,configurable:!0}),e.prototype._trySubscribe=function(n){return this._throwIfClosed(),t.prototype._trySubscribe.call(this,n)},e.prototype._subscribe=function(t){return this._throwIfClosed(),this._checkFinalizedStatuses(t),this._innerSubscribe(t)},e.prototype._innerSubscribe=function(t){var n=this,e=this,r=e.hasError,i=e.isStopped,o=e.observers;return r||i?d:(this.currentObservers=null,o.push(t),new v((function(){n.currentObservers=null,p(o,t)})))},e.prototype._checkFinalizedStatuses=function(t){var n=this,e=n.hasError,r=n.thrownError,i=n.isStopped;e?t.error(r):i&&t.complete()},e.prototype.asObservable=function(){var t=new T;return t.source=this,t},e.create=function(t,n){return new N(t,n)},e}(T),N=function(t){function e(n,e){var r=t.call(this)||this;return r.destination=n,r.source=e,r}return n(e,t),e.prototype.next=function(t){var n,e;null===(e=null===(n=this.destination)||void 0===n?void 0:n.next)||void 0===e||e.call(n,t)},e.prototype.error=function(t){var n,e;null===(e=null===(n=this.destination)||void 0===n?void 0:n.error)||void 0===e||e.call(n,t)},e.prototype.complete=function(){var t,n;null===(n=null===(t=this.destination)||void 0===t?void 0:t.complete)||void 0===n||n.call(t)},e.prototype._subscribe=function(t){var n,e;return null!==(e=null===(n=this.source)||void 0===n?void 0:n.subscribe(t))&&void 0!==e?e:d},e}(U),D=function(t){function e(n){var e=t.call(this)||this;return e._value=n,e}return n(e,t),Object.defineProperty(e.prototype,"value",{get:function(){return this.getValue()},enumerable:!1,configurable:!0}),e.prototype._subscribe=function(n){var e=t.prototype._subscribe.call(this,n);return!e.closed&&n.next(this._value),e},e.prototype.getValue=function(){var t=this,n=t.hasError,e=t.thrownError,r=t._value;if(n)throw e;return this._throwIfClosed(),r},e.prototype.next=function(n){t.prototype.next.call(this,this._value=n)},e}(U),R=function(){return Date.now()},Y=function(t){function e(n,e){return t.call(this)||this}return n(e,t),e.prototype.schedule=function(t,n){return this},e}(v),q=function(t,n){for(var e=[],r=2;r<arguments.length;r++)e[r-2]=arguments[r];return setInterval.apply(void 0,u([t,n],o(e)))},G=function(t){return clearInterval(t)},H=function(t){function e(n,e){var r=t.call(this,n,e)||this;return r.scheduler=n,r.work=e,r.pending=!1,r}return n(e,t),e.prototype.schedule=function(t,n){var e;if(void 0===n&&(n=0),this.closed)return this;this.state=t;var r=this.id,i=this.scheduler;return null!=r&&(this.id=this.recycleAsyncId(i,r,n)),this.pending=!0,this.delay=n,this.id=null!==(e=this.id)&&void 0!==e?e:this.requestAsyncId(i,this.id,n),this},e.prototype.requestAsyncId=function(t,n,e){return void 0===e&&(e=0),q(t.flush.bind(t,this),e)},e.prototype.recycleAsyncId=function(t,n,e){if(void 0===e&&(e=0),null!=e&&this.delay===e&&!1===this.pending)return n;null!=n&&G(n)},e.prototype.execute=function(t,n){if(this.closed)return new Error("executing a cancelled action");this.pending=!1;var e=this._execute(t,n);if(e)return e;!1===this.pending&&null!=this.id&&(this.id=this.recycleAsyncId(this.scheduler,this.id,null))},e.prototype._execute=function(t,n){var e,r=!1;try{this.work(t)}catch(t){r=!0,e=t||new Error("Scheduled action threw falsy error")}if(r)return this.unsubscribe(),e},e.prototype.unsubscribe=function(){if(!this.closed){var n=this.id,e=this.scheduler,r=e.actions;this.work=this.state=this.scheduler=null,this.pending=!1,p(r,this),null!=n&&(this.id=this.recycleAsyncId(e,n,null)),this.delay=null,t.prototype.unsubscribe.call(this)}},e}(Y),Z=function(){function t(n,e){void 0===e&&(e=t.now),this.schedulerActionCtor=n,this.now=e}return t.prototype.schedule=function(t,n,e){return void 0===n&&(n=0),new this.schedulerActionCtor(this,t).schedule(e,n)},t.now=R,t}(),J=new(function(t){function e(n,e){void 0===e&&(e=Z.now);var r=t.call(this,n,e)||this;return r.actions=[],r._active=!1,r}return n(e,t),e.prototype.flush=function(t){var n=this.actions;if(this._active)n.push(t);else{var e;this._active=!0;do{if(e=t.execute(t.state,t.delay))break}while(t=n.shift());if(this._active=!1,e){for(;t=n.shift();)t.unsubscribe();throw e}}},e}(Z))(H),K=J,Q=new T((function(t){return t.complete()}));function W(t){return t&&a(t.schedule)}function X(t){return t[t.length-1]}function $(t){return a(X(t))?t.pop():void 0}function tt(t){return W(X(t))?t.pop():void 0}function nt(t,n){return"number"==typeof X(t)?t.pop():n}var et=function(t){return t&&"number"==typeof t.length&&"function"!=typeof t};function rt(t){return a(null==t?void 0:t.then)}function it(t){return a(t[j])}function ot(t){return Symbol.asyncIterator&&a(null==t?void 0:t[Symbol.asyncIterator])}function ut(t){return new TypeError("You provided "+(null!==t&&"object"==typeof t?"an invalid object":"'"+t+"'")+" where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.")}var st="function"==typeof Symbol&&Symbol.iterator?Symbol.iterator:"@@iterator";function ct(t){return a(null==t?void 0:t[st])}function lt(t){return c(this,arguments,(function(){var n,e,i;return r(this,(function(r){switch(r.label){case 0:n=t.getReader(),r.label=1;case 1:r.trys.push([1,,9,10]),r.label=2;case 2:return[4,s(n.read())];case 3:return e=r.sent(),i=e.value,e.done?[4,s(void 0)]:[3,5];case 4:return[2,r.sent()];case 5:return[4,s(i)];case 6:return[4,r.sent()];case 7:return r.sent(),[3,2];case 8:return[3,10];case 9:return n.releaseLock(),[7];case 10:return[2]}}))}))}function at(t){return a(null==t?void 0:t.getReader)}function ft(t){if(t instanceof T)return t;if(null!=t){if(it(t))return o=t,new T((function(t){var n=o[j]();if(a(n.subscribe))return n.subscribe(t);throw new TypeError("Provided object does not correctly implement Symbol.observable")}));if(et(t))return r=t,new T((function(t){for(var n=0;n<r.length&&!t.closed;n++)t.next(r[n]);t.complete()}));if(rt(t))return e=t,new T((function(t){e.then((function(n){t.closed||(t.next(n),t.complete())}),(function(n){return t.error(n)})).then(null,w)}));if(ot(t))return ht(t);if(ct(t))return n=t,new T((function(t){var e,r;try{for(var o=i(n),u=o.next();!u.done;u=o.next()){var s=u.value;if(t.next(s),t.closed)return}}catch(t){e={error:t}}finally{try{u&&!u.done&&(r=o.return)&&r.call(o)}finally{if(e)throw e.error}}t.complete()}));if(at(t))return ht(lt(t))}var n,e,r,o;throw ut(t)}function ht(t){return new T((function(n){(function(t,n){var i,o,u,s;return e(this,void 0,void 0,(function(){var e,c;return r(this,(function(r){switch(r.label){case 0:r.trys.push([0,5,6,11]),i=l(t),r.label=1;case 1:return[4,i.next()];case 2:if((o=r.sent()).done)return[3,4];if(e=o.value,n.next(e),n.closed)return[2];r.label=3;case 3:return[3,1];case 4:return[3,11];case 5:return c=r.sent(),u={error:c},[3,11];case 6:return r.trys.push([6,,9,10]),o&&!o.done&&(s=i.return)?[4,s.call(i)]:[3,8];case 7:r.sent(),r.label=8;case 8:return[3,10];case 9:if(u)throw u.error;return[7];case 10:return[7];case 11:return n.complete(),[2]}}))}))})(t,n).catch((function(t){return n.error(t)}))}))}function pt(t,n,e,r,i){void 0===r&&(r=0),void 0===i&&(i=!1);var o=n.schedule((function(){e(),i?t.add(this.schedule(null,r)):this.unsubscribe()}),r);if(t.add(o),!i)return o}function vt(t,n){return void 0===n&&(n=0),B((function(e,r){e.subscribe(V(r,(function(e){return pt(r,t,(function(){return r.next(e)}),n)}),(function(){return pt(r,t,(function(){return r.complete()}),n)}),(function(e){return pt(r,t,(function(){return r.error(e)}),n)})))}))}function dt(t,n){return void 0===n&&(n=0),B((function(e,r){r.add(t.schedule((function(){return e.subscribe(r)}),n))}))}function bt(t,n){if(!t)throw new Error("Iterable cannot be null");return new T((function(e){pt(e,n,(function(){var r=t[Symbol.asyncIterator]();pt(e,n,(function(){r.next().then((function(t){t.done?e.complete():e.next(t.value)}))}),0,!0)}))}))}function yt(t,n){if(null!=t){if(it(t))return function(t,n){return ft(t).pipe(dt(n),vt(n))}(t,n);if(et(t))return function(t,n){return new T((function(e){var r=0;return n.schedule((function(){r===t.length?e.complete():(e.next(t[r++]),e.closed||this.schedule())}))}))}(t,n);if(rt(t))return function(t,n){return ft(t).pipe(dt(n),vt(n))}(t,n);if(ot(t))return bt(t,n);if(ct(t))return function(t,n){return new T((function(e){var r;return pt(e,n,(function(){r=t[st](),pt(e,n,(function(){var t,n,i;try{n=(t=r.next()).value,i=t.done}catch(t){return void e.error(t)}i?e.complete():e.next(n)}),0,!0)})),function(){return a(null==r?void 0:r.return)&&r.return()}}))}(t,n);if(at(t))return function(t,n){return bt(lt(t),n)}(t,n)}throw ut(t)}function _t(t,n){return n?yt(t,n):ft(t)}function xt(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];var e=tt(t);return _t(t,e)}var wt=f((function(t){return function(){t(this),this.name="EmptyError",this.message="no elements in sequence"}}));function mt(t,n){return B((function(e,r){var i=0;e.subscribe(V(r,(function(e){r.next(t.call(n,e,i++))})))}))}function gt(t,n,e){return void 0===e&&(e=1/0),a(n)?gt((function(e,r){return mt((function(t,i){return n(e,t,r,i)}))(ft(t(e,r)))}),e):("number"==typeof n&&(e=n),B((function(n,r){return function(t,n,e,r,i,o,u,s){var c=[],l=0,a=0,f=!1,h=function(){!f||c.length||l||n.complete()},p=function(t){return l<r?v(t):c.push(t)},v=function(t){o&&n.next(t),l++;var s=!1;ft(e(t,a++)).subscribe(V(n,(function(t){null==i||i(t),o?p(t):n.next(t)}),(function(){s=!0}),void 0,(function(){if(s)try{l--;for(var t=function(){var t=c.shift();u?pt(n,u,(function(){return v(t)})):v(t)};c.length&&l<r;)t();h()}catch(t){n.error(t)}})))};return t.subscribe(V(n,p,(function(){f=!0,h()}))),function(){null==s||s()}}(n,r,t,e)})))}function St(t){return void 0===t&&(t=1/0),gt(M,t)}function Et(t,n,e){void 0===t&&(t=0),void 0===e&&(e=K);var r=-1;return null!=n&&(W(n)?e=n:r=n),new T((function(n){var i,o=(i=t)instanceof Date&&!isNaN(i)?+t-e.now():t;o<0&&(o=0);var u=0;return e.schedule((function(){n.closed||(n.next(u++),0<=r?this.schedule(void 0,r):n.complete())}),o)}))}function Ot(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];var e=tt(t),r=nt(t,1/0),i=t;return i.length?1===i.length?ft(i[0]):St(r)(_t(i,e)):Q}function At(t,n){return B((function(e,r){var i=0;e.subscribe(V(r,(function(e){return t.call(n,e,i++)&&r.next(e)})))}))}function It(t,n){return void 0===n&&(n=null),n=null!=n?n:t,B((function(e,r){var o=[],u=0;e.subscribe(V(r,(function(e){var s,c,l,a,f=null;u++%n==0&&o.push([]);try{for(var h=i(o),v=h.next();!v.done;v=h.next()){(y=v.value).push(e),t<=y.length&&(f=null!=f?f:[]).push(y)}}catch(t){s={error:t}}finally{try{v&&!v.done&&(c=h.return)&&c.call(h)}finally{if(s)throw s.error}}if(f)try{for(var d=i(f),b=d.next();!b.done;b=d.next()){var y=b.value;p(o,y),r.next(y)}}catch(t){l={error:t}}finally{try{b&&!b.done&&(a=d.return)&&a.call(d)}finally{if(l)throw l.error}}}),(function(){var t,n;try{for(var e=i(o),u=e.next();!u.done;u=e.next()){var s=u.value;r.next(s)}}catch(n){t={error:n}}finally{try{u&&!u.done&&(n=e.return)&&n.call(e)}finally{if(t)throw t.error}}r.complete()}),void 0,(function(){o=null})))}))}function Pt(t,n,e,r,i){return function(o,u){var s=e,c=n,l=0;o.subscribe(V(u,(function(n){var e=l++;c=s?t(c,n,e):(s=!0,n),r&&u.next(c)}),i&&function(){s&&u.next(c),u.complete()}))}}function Ct(t){return B((function(n,e){var r=!1;n.subscribe(V(e,(function(t){r=!0,e.next(t)}),(function(){r||e.next(t),e.complete()})))}))}function jt(t){return t<=0?function(){return Q}:B((function(n,e){var r=0;n.subscribe(V(e,(function(n){++r<=t&&(e.next(n),t<=r&&e.complete())})))}))}function Mt(t,n){return t===n}function kt(t){return void 0===t&&(t=Tt),B((function(n,e){var r=!1;n.subscribe(V(e,(function(t){r=!0,e.next(t)}),(function(){return r?e.complete():e.error(t())})))}))}function Tt(){return new wt}function zt(t,n){return B(Pt(t,n,arguments.length>=2,!0))}function Bt(t){void 0===t&&(t={});var n=t.connector,e=void 0===n?function(){return new U}:n,r=t.resetOnError,i=void 0===r||r,o=t.resetOnComplete,u=void 0===o||o,s=t.resetOnRefCountZero,c=void 0===s||s;return function(t){var n,r,o,s=0,l=!1,a=!1,f=function(){null==r||r.unsubscribe(),r=void 0},h=function(){f(),n=o=void 0,l=a=!1},p=function(){var t=n;h(),null==t||t.unsubscribe()};return B((function(t,v){s++,a||l||f();var d=o=null!=o?o:e();v.add((function(){0!==--s||a||l||(r=Vt(p,c))})),d.subscribe(v),!n&&s>0&&(n=new I({next:function(t){return d.next(t)},error:function(t){a=!0,f(),r=Vt(h,i,t),d.error(t)},complete:function(){l=!0,f(),r=Vt(h,u),d.complete()}}),ft(t).subscribe(n))}))(t)}}function Vt(t,n){for(var e=[],r=2;r<arguments.length;r++)e[r-2]=arguments[r];if(!0!==n){if(!1!==n){var i=new I({next:function(){i.unsubscribe(),t()}});return n.apply(void 0,u([],o(e))).subscribe(i)}}else t()}var Ft={leading:!0,trailing:!1};function Lt(t,n,e){void 0===n&&(n=J),void 0===e&&(e=Ft);var r=Et(t,n);return function(t,n){return void 0===n&&(n=Ft),B((function(e,r){var i=n.leading,o=n.trailing,u=!1,s=null,c=null,l=!1,a=function(){null==c||c.unsubscribe(),c=null,o&&(p(),l&&r.complete())},f=function(){c=null,l&&r.complete()},h=function(n){return c=ft(t(n)).subscribe(V(r,a,f))},p=function(){if(u){u=!1;var t=s;s=null,r.next(t),!l&&h(t)}};e.subscribe(V(r,(function(t){u=!0,s=t,(!c||c.closed)&&(i?p():h(t))}),(function(){l=!0,(!(o&&u&&c)||c.closed)&&r.complete()})))}))}((function(){return r}),e)}function Ut(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];var e=$(t);return B((function(n,r){for(var i=t.length,s=new Array(i),c=t.map((function(){return!1})),l=!1,a=function(n){ft(t[n]).subscribe(V(r,(function(t){s[n]=t,l||c[n]||(c[n]=!0,(l=c.every(M))&&(c=null))}),m))},f=0;f<i;f++)a(f);n.subscribe(V(r,(function(t){if(l){var n=u([t],o(s));r.next(e?e.apply(void 0,u([],o(n))):n)}})))}))}class Nt{constructor(t,n,e,r=!1){this.namespace=t,this.providers=n,this.defaultValue=e,this._isBus=r,this.id=this._isBus?"bus":Math.random().toString(36).substring(2),this._notifer=new U,this._eventMap=new Map,this._context={clients:new Map},this._outbound=new U,this._inbound=new D({transient:this.defaultValue,context:this._context}),this._events=new U,this._context.clients.set(this.id,this._isBus),this.context=this._registerContext(),this._transient=this._register(),this._isBus&&this.context.pipe(Ut(this.transient)).subscribe((([,t])=>this.broadcast(t||this.defaultValue)))}get events(){return this._events.asObservable().pipe(Bt())}get transient(){return this._transient}get state(){return this._inbound.value.transient}dispose(){this._events.complete(),this._notifer.complete(),this._outbound.complete(),this._inbound.complete(),this.removeAllListeners()}notify(){this._context.clients.set(this.id,!0),this._notifer.next(this._context)}_registerContext(){const t=this._inbound.pipe(mt((t=>null==t?void 0:t.context)),At((t=>void 0!==t)),zt(((t,n)=>{if(Array.isArray(null==n?void 0:n.clients)){({clients:new Map(n.clients)}).clients.forEach(((n,e)=>t.clients.set(e,n)))}return t}),this._context),Bt());return t.subscribe((t=>{this._isBus&&this.notify(),this._context.clients=t.clients})),t}broadcast(t){this._outbound.next({transient:t,context:this._context})}listen(t,n){return this._isBus&&n(this.defaultValue[t]),this.events.pipe(mt((t=>null==t?void 0:t.transient)),mt((n=>null==n?void 0:n[t])),At((t=>void 0!==t)),mt((t=>t)),(void 0===r&&(r=M),e=null!=e?e:Mt,B((function(t,n){var i,o=!0;t.subscribe(V(n,(function(t){var u=r(t);!o&&e(i,u)||(o=!1,i=u,n.next(t))})))})))).subscribe(n);var e,r}emit(t,n){this._outbound.next({event:{[t]:n}})}on(t,n){return this._registerEvent(t,n)}once(t,n){return this._registerEvent(t,n,!0)}off(t,n){return(this._eventMap.get(t)||[]).filter((({fn:t})=>t===n)).forEach((({obs:t})=>t.unsubscribe())),this}eventNames(){return[...this._eventMap.keys()]}listenerCount(t){return this.listeners(t).length}listeners(t){return(this._eventMap.get(t)||[]).map((({fn:t})=>t))}removeAllListeners(){const t=[...this._eventMap.values()];for(const n of t)n.forEach((({obs:t})=>t.unsubscribe()));return this}_registerEvent(t,n,e=!1){const r=this._eventMap.get(t)||[],i="string"==typeof t?t.toLocaleLowerCase():t.toString().toLowerCase(),o=this.events.pipe(mt((t=>null==t?void 0:t.event)),At((t=>void 0!==t)),mt((t=>t)),gt((t=>_t(Object.entries(t)))),At((([t])=>t.toLowerCase().indexOf(i)>=0)),mt((([,t])=>t)),(t=>e?t.pipe(function(t,n){var e=arguments.length>=2;return function(r){return r.pipe(t?At((function(n,e){return t(n,e,r)})):M,jt(1),e?Ct(n):kt((function(){return new wt})))}}()):t)).subscribe(n);return r.push({fn:n,obs:o}),this._eventMap.set(t,r),o}_register(){const t=_t(this.providers),n=Ot(this._inbound.pipe(mt((t=>null==t?void 0:t.transient))),this._outbound.pipe(mt((t=>null==t?void 0:t.transient)))),e=Ot(t).pipe(this._fromProviders(),gt((()=>n.pipe(zt(this._fold,this.defaultValue),Lt(20),gt((t=>(({}[this.namespace]=t,xt(t)))))))),It(this.providers.length),mt((t=>t.reduce(this._fold,this.defaultValue))),Bt());this._isBus||this._inbound.subscribe((t=>{t&&this._events.next(t)}));return(this._isBus?Ot(this._outbound,this._inbound):this._outbound).pipe(Ut(e),mt((([t,n])=>t.event?{event:t.event}:t.transient?{transient:{...n,...t.transient}}:void 0)),mt((t=>{if(void 0===t)return Q;this._isBus&&this._events.next({event:t.event,transient:t.transient||{},context:this._context}),this.providers.forEach((n=>{n.postMessage({[this.namespace]:t})}))}))).subscribe(),this._notifer.pipe(mt((t=>({context:{clients:Array.from(t.clients.entries())}})))).subscribe((t=>{this.providers.forEach((n=>{n.postMessage({[this.namespace]:t})}))})),e.subscribe(),e}_fromProviders(){return t=>t.pipe(mt((t=>(t.onMessage((t=>{const n=t[this.namespace];n&&this._inbound.next(n)})),t))))}_fold(t,n){return t&&n?{...t,...n}:t||n}}exports.Bus=class extends Nt{constructor(t,n,e){super(t,n,e,!0)}whenReady(){return function(t,n){var e="object"==typeof n;return new Promise((function(r,i){var o=new I({next:function(t){r(t),o.unsubscribe()},error:i,complete:function(){e?r(n.defaultValue):i(new wt)}});t.subscribe(o)}))}(this.context.pipe(It(this.providers.length),mt((()=>this._context))))}},exports.Client=Nt,exports.Observable=T,exports.createOperatorSubscriber=V,exports.from=_t,exports.identity=M,exports.innerFrom=ft,exports.isFunction=a,exports.map=mt,exports.merge=Ot,exports.noop=m,exports.of=xt,exports.operate=B,exports.scan=zt,exports.timer=Et;


/***/ }),

/***/ "./node_modules/tangle/dist/cjs/webviews.js":
/*!**************************************************!*\
  !*** ./node_modules/tangle/dist/cjs/webviews.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var e=__webpack_require__(/*! ./channel-275f5852.js */ "./node_modules/tangle/dist/cjs/channel-275f5852.js");__webpack_require__(/*! ./tangle-e9ac0fd9.js */ "./node_modules/tangle/dist/cjs/tangle-e9ac0fd9.js");class s extends e.BaseChannel{register(e){return this._register(e,(e=>({onMessage:e.onDidReceiveMessage.bind(e),postMessage:e.postMessage.bind(e)})))}attach(e){return this._initiateClient({onMessage:e=>{window.addEventListener("message",(s=>e(s.data)))},postMessage:s=>(e.postMessage(s),Promise.resolve())})}}module.exports=s;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./exampleWidget/widget.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=exampleWidget.js.map