/*
 * Aria Templates 1.4.4 - 22 May 2013
 *
 * Copyright 2009-2013 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//***MULTI-PART
//*******************
//LOGICAL-PATH:aria/storage/EventBus.js
//*******************
Aria.classDefinition({$classpath:"aria.storage.EventBus",$singleton:!0,$events:{change:""},$prototype:{stop:!1,notifyChange:function(t,e,i,s,a){this.$raiseEvent({name:"change",location:t,namespace:a,key:e,newValue:i,oldValue:s,url:Aria.$window.location})}}});
//*******************
//LOGICAL-PATH:aria/storage/IStorage.js
//*******************
Aria.interfaceDefinition({$classpath:"aria.storage.IStorage",$events:{change:""},$interface:{getItem:function(){},setItem:function(){},removeItem:function(){},clear:function(){}}});
//*******************
//LOGICAL-PATH:aria/storage/AbstractStorage.js
//*******************
Aria.classDefinition({$classpath:"aria.storage.AbstractStorage",$dependencies:["aria.storage.EventBus","aria.utils.json.JsonSerializer","aria.utils.Type"],$implements:["aria.storage.IStorage"],$statics:{INVALID_SERIALIZER:"Invalid serializer configuration. Make sure it implements aria.utils.json.ISerializer",INVALID_NAMESPACE:"Inavlid namespace configuration. Must be a string.",EVENT_KEYS:["name","key","oldValue","newValue","url"]},$constructor:function(t){this._disposeSerializer=!1,this._eventCallback={fn:this._onStorageEvent,scope:this},aria.storage.EventBus.$on({change:this._eventCallback});var e=t?t.serializer:null,i=!0;e&&("serialize"in e&&"parse"in e?i=!1:this.$logError(this.INVALID_SERIALIZER)),i&&(e=new aria.utils.json.JsonSerializer(!0),this._disposeSerializer=!0),this.serializer=e;var s="";t&&t.namespace&&(aria.utils.Type.isString(t.namespace)?s=t.namespace+"$":this.$logError(this.INVALID_NAMESPACE)),this.namespace=s},$destructor:function(){aria.storage.EventBus.$removeListeners({change:this._eventCallback}),this._disposeSerializer&&this.serializer&&this.serializer.$dispose(),this.serializer=null,this._eventCallback=null},$prototype:{getItem:function(t){var e=this._get(this.namespace+t);return this.serializer.parse(e)},setItem:function(t,e){var i=this.getItem(t),s=this.serializer.serialize(e,{reversible:!0,keepMetadata:!1});aria.storage.EventBus.stop=!0,this._set(this.namespace+t,s),aria.storage.EventBus.stop=!1,e=this.serializer.parse(s),aria.storage.EventBus.notifyChange(this.type,t,e,i,this.namespace)},removeItem:function(t){var e=this.getItem(t);null!==e&&(aria.storage.EventBus.stop=!0,this._remove(this.namespace+t),aria.storage.EventBus.stop=!1,aria.storage.EventBus.notifyChange(this.type,t,null,e,this.namespace))},clear:function(){aria.storage.EventBus.stop=!0,this._clear(),aria.storage.EventBus.stop=!1,aria.storage.EventBus.notifyChange(this.type,null,null,null)},_onStorageEvent:function(t){if(null===t.key||t.namespace===this.namespace){var e=aria.utils.Json.copy(t,!1,this.EVENT_KEYS);this.$raiseEvent(e)}}}});
//*******************
//LOGICAL-PATH:aria/storage/Beans.js
//*******************
Aria.beanDefinitions({$package:"aria.storage.Beans",$namespaces:{json:"aria.core.JsonTypes"},$beans:{ConstructorArgs:{$type:"json:Object",$properties:{namespace:{$type:"json:String"},serializer:{$type:"json:ObjectRef"}}}}});
//*******************
//LOGICAL-PATH:aria/storage/HTML5Storage.js
//*******************
Aria.classDefinition({$classpath:"aria.storage.HTML5Storage",$dependencies:["aria.utils.Event"],$extends:"aria.storage.AbstractStorage",$statics:{UNAVAILABLE:"%1 not supported by the browser."},$constructor:function(t,e,i){if(this.$AbstractStorage.constructor.call(this,t),this.type=e,this.storage=Aria.$window[e],this._browserEventCb={fn:this._browserEvent,scope:this},this.storage)aria.utils.Event.addListener(Aria.$window,"storage",this._browserEventCb);else if(i!==!1)throw this._disposeSerializer&&this.serializer&&this.serializer.$dispose(),this.$logError(this.UNAVAILABLE,[this.type]),Error(this.type)},$destructor:function(){aria.utils.Event.removeListener(Aria.$window,"storage",this._browserEventCb),this._browserEventCb=null,this.__target=null,this.$AbstractStorage.$destructor.call(this)},$prototype:{_get:function(t){return this.storage.getItem(t)},_set:function(t,e){this.storage.setItem(t,e)},_remove:function(t){this.storage.removeItem(t)},_clear:function(){this.storage.clear()},_browserEvent:function(t){if(!aria.storage.EventBus.stop){var e=this.namespace?t.key.substring(0,this.namespace.length)===this.namespace:!0;if(e){var i=t.oldValue,s=t.newValue;i&&(i=this.serializer.parse(i)),s&&(s=this.serializer.parse(s)),this._onStorageEvent({name:"change",key:t.key,oldValue:i,newValue:s,url:t.url,namespace:this.namespace})}}},$on:function(t){aria.core.Browser.isIE8&&this.$logWarn(this.UNAVAILABLE,"change event"),this.$AbstractStorage.$on.call(this,t)}}});
//*******************
//LOGICAL-PATH:aria/storage/UserData.js
//*******************
(function(){function t(){a||(a=new aria.utils.json.JsonSerializer(!0));var t=s.getAttribute("kMap");return t?a.parse(t):{}}function e(t,e){t?n[e]=t:delete n[e],s.setAttribute("kMap",a.serialize(n)),s.save("JSONPersist")}function i(i,s){if(n=t(),!s||i in n)return n[i];var a="uD"+r++;return e(a,i),a}var s,a,n={},r=4;Aria.classDefinition({$classpath:"aria.storage.UserData",$dependencies:["aria.utils.Object","aria.utils.Dom","aria.utils.json.JsonSerializer","aria.core.Browser"],$implements:["aria.storage.IStorage"],$extends:"aria.storage.AbstractStorage",$onload:function(){if(aria.core.Browser.isIE)try{var e=Aria.$frameworkWindow.document.createElement("form");e.innerHTML="<input type='hidden' id='__aria_storage_UserData__' style='behavior:url(#default#userData)'>",Aria.$frameworkWindow.document.body.appendChild(e),s=e.firstChild,s.load("JSONPersist"),t()}catch(i){}},$onunload:function(){aria.core.Browser.isIE&&(s&&s.parentNode.removeChild(s),s=null),a&&a.$dispose(),a=null},$prototype:{_get:function(t){var e=i(t);return e?s.getAttribute(e):null},_set:function(t,e){var a=i(t,!0);s.setAttribute(a,e),s.save("JSONPersist")},_remove:function(t){s.removeAttribute(i(t)),e(null,t),s.save("JSONPersist")},_clear:function(){var e=t();n={},s.removeAttribute("kMap");for(var i in e)e.hasOwnProperty(i)&&s.removeAttribute(e[i]);s.save("JSONPersist")}}})})();
//*******************
//LOGICAL-PATH:aria/storage/LocalStorage.js
//*******************
(function(){function t(t,e){t._get=e._get,t._set=e._set,t._remove=e._remove,t._clear=e._clear,t.storage=aria.storage.UserData._STORAGE,t.__keys=aria.storage.UserData._ALL_KEYS}Aria.classDefinition({$classpath:"aria.storage.LocalStorage",$extends:"aria.storage.HTML5Storage",$dependencies:["aria.core.Browser","aria.storage.UserData"],$constructor:function(e){var i=aria.core.Browser.isIE7;if(this.$HTML5Storage.constructor.call(this,e,"localStorage",!i),!this.storage&&i){var s=new aria.storage.UserData(e);t(this,s),this._fallback=s}},$destructor:function(){this._fallback&&(this._fallback.$dispose(),this._fallback=null),this.$HTML5Storage.$destructor.call(this)}})})();
//*******************
//LOGICAL-PATH:aria/storage/SessionStorage.js
//*******************
Aria.classDefinition({$classpath:"aria.storage.SessionStorage",$extends:"aria.storage.HTML5Storage",$constructor:function(t){this.$HTML5Storage.constructor.call(this,t,"sessionStorage")}});