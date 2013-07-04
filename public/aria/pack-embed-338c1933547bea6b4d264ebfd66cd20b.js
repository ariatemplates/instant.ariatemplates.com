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
//LOGICAL-PATH:aria/embed/CfgBeans.js
//*******************
Aria.beanDefinitions({$package:"aria.embed.CfgBeans",$namespaces:{json:"aria.core.JsonTypes",html:"aria.templates.CfgBeans"},$beans:{ElementCfg:{$type:"json:Object",$properties:{controller:{$type:"json:ObjectRef"},type:{$type:"json:String",$default:"div"},attributes:{$type:"html:HtmlAttribute"},args:{$type:"json:MultiTypes"}}},PlaceholderCfg:{$type:"json:Object",$properties:{name:{$type:"json:String",$mandatory:!0},type:{$type:"json:String",$default:"div"},attributes:{$type:"html:HtmlAttribute"}}},MapCfg:{$type:"json:Object",$properties:{id:{$type:"json:String",$mandatory:!0},provider:{$type:"json:String",$mandatory:!0},initArgs:{$type:"json:MultiTypes"},loadingIndicator:{$type:"json:Boolean",$default:!1},type:{$type:"json:String",$default:"div"},attributes:{$type:"html:HtmlAttribute"}}}}});
//*******************
//LOGICAL-PATH:aria/embed/Element.js
//*******************
Aria.classDefinition({$classpath:"aria.embed.Element",$extends:"aria.widgetLibs.BaseWidget",$dependencies:["aria.embed.CfgBeans","aria.utils.Html","aria.core.JsonValidator","aria.core.Log","aria.utils.Dom"],$constructor:function(e){this.$BaseWidget.constructor.apply(this,arguments),this._cfgOk=aria.core.JsonValidator.validateCfg(this._cfgBeanName,e)},$destructor:function(){this._domId&&this._cfg.controller.onEmbededElementDispose(aria.utils.Dom.getElementById(this._domId),this._cfg.args),this.$BaseWidget.$destructor.apply(this,arguments)},$prototype:{_cfgBeanName:"aria.embed.CfgBeans.ElementCfg",writeMarkup:function(e){if(this._cfgOk){this._domId=this._createDynamicId();var t=this._cfg.type,i=["<",t,' id="',this._domId,'"'];this._cfg.attributes&&i.push(" "+aria.utils.Html.buildAttributeList(this._cfg.attributes)),i.push("></"+t+">"),e.write(i.join(""))}},initWidget:function(){this._cfgOk&&this._cfg.controller.onEmbededElementCreate(aria.utils.Dom.getElementById(this._domId),this._cfg.args)}}});
//*******************
//LOGICAL-PATH:aria/embed/EmbedLib.js
//*******************
Aria.classDefinition({$classpath:"aria.embed.EmbedLib",$extends:"aria.widgetLibs.WidgetLib",$singleton:!0,$prototype:{widgets:{Element:"aria.embed.Element",Map:"aria.embed.Map",Placeholder:"aria.embed.Placeholder"}}});
//*******************
//LOGICAL-PATH:aria/embed/IContentProvider.js
//*******************
Aria.interfaceDefinition({$classpath:"aria.embed.IContentProvider",$events:{contentChange:""},$interface:{getContent:function(){}}});
//*******************
//LOGICAL-PATH:aria/embed/IEmbedController.js
//*******************
Aria.interfaceDefinition({$classpath:"aria.embed.IEmbedController",$extends:"aria.templates.IModuleCtrl",$interface:{onEmbededElementCreate:function(){},onEmbededElementDispose:function(){}}});
//*******************
//LOGICAL-PATH:aria/embed/PlaceholderManager.js
//*******************
Aria.classDefinition({$classpath:"aria.embed.PlaceholderManager",$dependencies:["aria.utils.Type","aria.utils.Array"],$singleton:!0,$constructor:function(){this._contentChangeListener={fn:this._onContentChange,scope:this},this._providers=[]},$destructor:function(){this.unregisterAll(),this._contentChangeListener=null},$events:{contentChange:""},$statics:{PLACEHOLDER_PATH_NOT_FOUND:"No content has been found for the placeholder path '%1'"},$prototype:{getContent:function(e){for(var t=[],i=aria.utils.Type,r=this._providers,s=0,n=r.length;n>s;s++){var a=r[s],o=a.getContent(e);if(o)if(i.isArray(o))for(var l=0,c=o.length;c>l;l++)t.push(o[l]);else t.push(o)}return 0===t.length&&this.$logWarn(this.PLACEHOLDER_PATH_NOT_FOUND,[e]),t},register:function(e){var t=this._providers;aria.utils.Array.contains(t,e)||(e.$addListeners({contentChange:this._contentChangeListener}),t.push(e))},unregister:function(e){var t=this._providers;aria.utils.Array.remove(t,e)&&e.$removeListeners({contentChange:this._contentChangeListener})},unregisterAll:function(){for(var e=this._providers;e.length>0;)this.unregister(e[0])},_onContentChange:function(e){this.$raiseEvent({name:"contentChange",placeholderPaths:e.contentPaths})}}});
//*******************
//LOGICAL-PATH:aria/embed/Placeholder.js
//*******************
Aria.classDefinition({$classpath:"aria.embed.Placeholder",$extends:"aria.widgetLibs.BaseWidget",$dependencies:["aria.embed.CfgBeans","aria.core.JsonValidator","aria.html.Template","aria.embed.PlaceholderManager","aria.utils.Array"],$constructor:function(e,t){this.$BaseWidget.constructor.apply(this,arguments),this._cfgOk=aria.core.JsonValidator.validateCfg(this._cfgBeanName,e),this._placeholderPath=this._getPlaceholderPath(t),this._sectionId="p_"+this._createDynamicId(),this._onContentChangeListener={fn:this._onContentChange,scope:this},this._placeholderManager=aria.embed.PlaceholderManager,this._placeholderManager.$addListeners({contentChange:this._onContentChangeListener})},$destructor:function(){this._placeholderManager.$removeListeners({contentChange:this._onContentChangeListener}),this._onContentChangeListener=null,this.$BaseWidget.$destructor.apply(this,arguments)},$prototype:{_cfgBeanName:"aria.embed.CfgBeans.PlaceholderCfg",writeMarkup:function(e){if(this._cfgOk){var t=this._cfg,i={id:this._sectionId,type:t.type,attributes:t.attributes};e.beginSection(i),this._writePlaceholderContent(e),e.endSection()}},_writePlaceholderContent:function(e){for(var t=aria.utils.Type,i=aria.embed.PlaceholderManager,r=this._placeholderPath,s=i.getContent(r),n=0,a=s.length;a>n;n++){var o=s[n];if(t.isString(o))e.write(o);else{var l=new aria.html.Template(o,this._context,this._lineNumber);l.subTplCtxt.placeholderPath=r,e.registerBehavior(l),l.writeMarkup(e)}}},_onContentChange:function(e){var t=e.placeholderPaths;if(aria.utils.Array.contains(t,this._placeholderPath)){var i=this._context.getRefreshedSection({outputSection:this._sectionId,writerCallback:{fn:this._writePlaceholderContent,scope:this}});this._context.insertSection(i)}},_getPlaceholderPath:function(){for(var e="",t=this._context;t;){if(t.placeholderPath){e=t.placeholderPath+".";break}t=t.parent}return e+this._cfg.name}}});