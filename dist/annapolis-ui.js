/**
 * Created by tzachit on 17/11/14.
 */

(function(window, angular, undefiend){

    'use strict';

    var module = angular.module('annapolis-ui', []);

    (function(module){

        function DeveloperException(message){
            this.message = message;
        }

        function Element(){
            this.isEmpty = true;
            this.element = null;
            this.scope = null;
        }

        Element.ENTITY_NAME = null;

        Element.prototype.setEntity = function(entity){
            this.scope[Element.ENTITY_NAME] = entity;
        };

        Element.prototype.getEntity = function(){
            return this.scope[Element.ENTITY_NAME];
        };

        module.factory('CollectionManager', [
            function(){

                function CollectionManager(){

                    this._ready = false;
                    this._identifier = 'id';
                    this._isIdentifierSet = false;
                    this._capacity = 0;
                    this._isCapacitySet = false;

                    this._onReadyListeners = [];
                    this._elements = [];
                    this._keys = [];
                }

                Object.defineProperties(CollectionManager.prototype, {
                    identifier: {
                        get: function(){ return this._identifier; }
                    },
                    capacity: {
                        get: function(){ return this._capacity; }
                    },
                    isEmpty: {
                        get: function(){ return Object.keys(this._keys).length === 0; }
                    },
                    isFull: {
                        get: function(){ return Object.keys(this._keys).length === this._capacity; }
                    },
                    onready: {
                        set: function(callback){
                            if(typeof callback !== 'function'){
                                throw new DeveloperException("Invalid onready callback");
                            }

                            this._onReadyListeners.push(callback);
                        }
                    }
                });

                CollectionManager.prototype.setIdentifier = function(identifier){
                    if(this._isIdentifierSet || this._ready){
                        return false;
                    }

                    if(typeof identifier !== 'string' || identifier === ''){
                        throw new DeveloperException('Invalid identifier value');
                    }

                    this._identifier = identifier;
                    this._isIdentifierSet = true;
                };

                CollectionManager.prototype.setCapacity = function(capacity){
                    if(this._isCapacitySet || this._ready){
                        return false;
                    }

                    if(typeof capacity !== 'number' || capacity < 0){
                        throw new DeveloperException('Invalid capacity value');
                    }

                    this._capacity = capacity;
                    this._isCapacitySet = true;
                };

                CollectionManager.prototype.setEntityName = function(entityName){
                    if(Element.ENTITY_NAME !== null){
                        return false;
                    }

                    if(typeof entityName !== 'string' || entityName === ''){
                        throw new DeveloperException('Invalid entity name value');
                    }

                    Element.ENTITY_NAME = entityName;
                };

                CollectionManager.prototype.getElements = function(){
                    return this._elements;
                };

                CollectionManager.prototype.ready = function(){
                    this._isIdentifierSet = true;
                    this._isCapacitySet = true;
                    this._ready = true;

                    for(var i = 0; i < this._onReadyListeners.length; i++){
                        this._onReadyListeners[i]();
                    }
                };

                CollectionManager.prototype.add = function(entity){
                    if(!this._ready){
                        return false;
                    }

                    if(typeof entity !== 'object' || typeof entity[this._identifier] === 'undefined'){
                        throw new DeveloperException('Invalid entity');
                    }

                    if(typeof this._keys[entity[this._identifier]] !== 'undefined'){
                        return false;
                    }

                    if(Object.keys(this._keys).length === this._elements.length){
                        return false;
                    }

                    for(var i = 0; i < this._elements.length; i++){
                        if(this._elements[i].isEmpty){
                            var element = this._elements[i];
                            element.isEmpty = false;
                            element.setEntity(entity);
                            this._keys[entity[this._identifier]] = i;
                            element.element.css('display', '');
                            if(!element.scope.$$phase && !element.scope.$root.$$phase){
                                element.scope.$digest();
                            }
                            return true;
                        }
                    }

                    return false;
                };

                CollectionManager.prototype.remove = function(entity){
                    if(!this._ready){
                        return false;
                    }

                    if(typeof entity !== 'object' || typeof entity[this._identifier] === 'undefined'){
                        throw new DeveloperException('Invalid entity');
                    }

                    if(typeof this._keys[entity[this._identifier]] === 'undefined'){
                        return false;
                    }

                    var element = this._elements[this._keys[entity[this._identifier]]];
                    element.isEmpty = true;
                    element.setEntity({});
                    delete this._keys[entity[this._identifier]];
                    element.element.css('display', 'none');
                    if(!element.scope.$$phase && !element.scope.$root.$$phase){
                        element.scope.$digest();
                    }
                    return true;
                };

                CollectionManager.prototype.update = function(entity){
                    if(!this._ready){
                        return false;
                    }

                    if(typeof entity !== 'object' || typeof entity[this._identifier] === 'undefined'){
                        throw new DeveloperException('Invalid entity');
                    }

                    if(typeof this._keys[entity[this._identifier]] === 'undefined'){
                        return false;
                    }

                    var element = this._elements[this._keys[entity[this._identifier]]];
                    element.setEntity(entity);
                    if(!element.scope.$$phase && !element.scope.$root.$$phase){
                        element.scope.$digest();
                    }
                    return true;
                };

                CollectionManager.prototype.addOrUpdate = function(entity){
                    if(!this.update(entity)){
                        return this.add(entity);
                    }

                    return true;
                };

                return CollectionManager;
            }
        ]);

        module.directive('ngLazyRepeat', ['CollectionManager',
            function(CollectionManager){
                return {
                    restrict: 'EA',
                    replace: true,
                    transclude: 'element',
                    compile: function(element, attrs){
                        return function(scope, element, attrs, controller, linker){
                            var manager = scope.$eval(attrs.ngLazyRepeat);

                            if(!(manager instanceof CollectionManager)){
                                throw new DeveloperException('Manager must be instance of collection manager');
                            }

                            if(typeof attrs.entity !== 'undefined') {
                                manager.setEntityName(attrs.entity);
                            }

                            var parent = element.parent();
                            var elements = manager.getElements();

                            for(var i = 0; i < manager.capacity; i++){

                                linker(function(clone, childScope){
                                    clone.css('display', 'none');
                                    parent.append(clone);

                                    var elm = new Element();
                                    elm.isEmpty = true;
                                    elm.element = clone;
                                    elm.scope = childScope;

                                    elements.push(elm);
                                });
                            }

                            manager.ready();
                        }
                    }
                };
            }
        ]);

    }(module));

}(window, window.angular));