// fluent-chain.js

// A helper for creating nicely chained API's in Javascript
// (c) 2013 - Tim Griesser
// License: MIT
// -----------------

// Create a stack of function calls, for deferred evaluation
// of chained function calls.
var FluentChain = module.exports = function(stack) {
  if (!(this instanceof FluentChain)) {
    return new this(stack);
  }
  this.__stack = stack || [];
  this.__attributes = {};
  if (stack instanceof FluentChain) {
    this.__stack = stack.__stack.slice();
    attachProps(stack, this);
  }
};

// If we want to start off by chaining.
FluentChain.chain = function() {
  return new this().chain();
};

// Chain is used in cases where we do want to be mutating the
// internal state of the builder, rather than just chaining
// new objects.
FluentChain.prototype.chain = function() {
  this.__chaining = true;
  return this;
};

// Breaks the current "chain".
FluentChain.prototype.unchain = function() {
  this.__chaining = false;
  return this;
};

// Create a fresh copy of the current "chain".
FluentChain.prototype.cloneChain = function() {
  return attachProps(this, new this.constructor(this.__stack.slice()));
};

// Set an attribute on the "attributes" hash.
FluentChain.prototype.setAttribute = function(key, value) {
  this.__attributes[key] = value;
  return this;
};

// Add a new method to the chainable interface.
FluentChain.attachChainable = function(name, fn) {
  attachChainable(this, name, fn);
};

var hasProp = Object.prototype.hasOwnProperty;

// Add a function to the current "FluentChain" object
// as both a static and prototype method.
function fluentMethod(Chain, method) {
  Chain[method] =
  Chain.prototype[method] = function() {
    var args = [], arr = new Array(arguments.length);
    for (var i = 0, l = arr.length; i < l; i++) {
      args[i] = arguments[i];
    }
    return pushChain(this, {method: method, args: args});
  };
}

// Adds a method to the stack.
function pushChain(ctx, obj) {
  if (ctx instanceof FluentChain) {
    if (ctx.__chaining) {
      ctx.__stack.push(obj);
      return ctx;
    }
    return attachProps(ctx, new ctx.constructor(ctx.__stack.concat(obj)));
  }
  return attachProps(ctx, new ctx([obj]));
}

// Ensures that the set properties are copied
// each time the object is chained.
function attachProps(current, target) {
  var attrs = current.__attributes;
  for (var key in attrs) {
    if (hasProp.call(attrs, key))
    target.__attributes[key] = attrs[key];
  }
  return target;
}

// Attaches a new method to both the prototype and constructor,
// ensuring it's called with the correct context and returns the
// chain if another return value is not supplied.
function attachChainable(Target, name, fn) {
  Target[name] = Target.prototype[name] = function() {
    var target = this instanceof FluentChain ? this : new this();
    return fn.apply(target, arguments) || target;
  };
}

// Placeholder constructor for creating the prototype chain.
function ctor() {}

// Create a new "chain" object, binding the appropriate methods
// and defining any "long-lived" properties that are assignable
// directly to the chain.
FluentChain.extendChain = function(methods, additional) {
  var parent = this;
  function Chain() { parent.apply(this, arguments); }
  for (var key in parent) {
    if (hasProp.call(parent, key)) {
      Chain[key] = parent[key];
    }
  }
  ctor.prototype  = parent.prototype;
  Chain.prototype = new ctor();
  Chain.prototype.constructor = Chain;
  for (var i = 0, l = methods.length; i < l; i++) {
    fluentMethod(Chain, methods[i]);
  }
  if (additional) {
    for (key in additional) {
      attachChainable(Chain, key, additional[key]);
    }
  }
  return Chain;
};
