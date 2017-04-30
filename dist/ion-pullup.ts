/*
ionic-pullup-content v2 for Ionic/Angular 2
 
Copyright 2016 Ariel Faur (https://github.com/arielfaur)
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { ChangeDetectionStrategy, Component, EventEmitter, ElementRef, Renderer, ViewChild, Output, Input } from '@angular/core';
import { Platform } from 'ionic-angular';

export interface FooterMetadata {
  height: number;
  posY: number;
  lastPosY: number;
  defaultHeight?: number;
}

export interface ViewMetadata {
  tabs?: Element;
  tabsHeight?: number;
  hasBottomTabs?: boolean;  
  header?: Element;
  headerHeight?: number;
}

export interface FooterTab {
  x?: number;
  y?: number;
  upperLeftRadius?: number;
  upperRightRadius?: number;
  backgroundColor?: string;
  color?: string;
  content?: string;
}

export enum IonPullUpContentState {
  Collapsed = 0,  
  Expanded = 1,
  Minimized = 2
}

export enum IonPullUpContentBehavior {
  Hide, 
  Expand
}

@Component({
    selector: 'ion-pullup-content',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <ion-content-footer #footer>
      <ng-content></ng-content>
    </ion-content-footer>
    `
})
export class IonPullUpComponent  { 
  @Input() state: IonPullUpContentState;
  @Output() stateChange: EventEmitter<IonPullUpContentState> = new EventEmitter<IonPullUpContentState>();

  @Input() initialState: IonPullUpContentState;          // TODO implemment
  @Input() defaultBehavior: IonPullUpContentBehavior;    // TODO implemment
  @Input() maxHeight: number;

  @Output() onExpand = new EventEmitter<any>();
  @Output() onCollapse = new EventEmitter<any>();
  @Output() onMinimize = new EventEmitter<any>();

  @ViewChild('footer') childFooter;

  protected _footerMeta: FooterMetadata;
  protected _currentViewMeta: ViewMetadata;  
  protected _oldState: IonPullUpContentState;

  constructor(private platform: Platform, private el: ElementRef, private renderer: Renderer) {
    this._footerMeta = {
      height: 0,
      posY:  0,
      lastPosY: 0
    }
    this._currentViewMeta = {};  
    
    // sets initial state
    this.initialState = this.initialState || IonPullUpContentState.Collapsed;
    this.defaultBehavior = this.defaultBehavior || IonPullUpContentBehavior.Expand;
    this.maxHeight = this.maxHeight || 0;
  }
  
  ngOnInit() {
    console.debug('ionic-pullup-content => Initializing footer...');

    window.addEventListener("orientationchange", () => {
      console.debug('ionic-pullup-content => Changed orientation => updating');
      this.updateUI();
    });
    this.platform.resume.subscribe(() => {
      console.debug('ionic-pullup-content => Resumed from background => updating');
      this.updateUI();
    });
  }

   ngAfterContentInit() {    
      this.computeDefaults();

      this.state = IonPullUpContentState.Collapsed;

      this.updateUI(true);  // need to indicate whether it's first run to avoid emitting events twice due to change detection

   }

  public get expandedHeight() : number {
    return window.innerHeight - this._currentViewMeta.headerHeight; 
  }
  
  computeDefaults() {
    this._footerMeta.defaultHeight =  this.childFooter.nativeElement.offsetHeight;
    
    
    // TODO: still need to test with tabs template (not convinced it is a valid use case...)
    this._currentViewMeta.tabs = this.el.nativeElement.closest('ion-tabs');
    this._currentViewMeta.tabsHeight = this._currentViewMeta.tabs ? (<HTMLElement> this._currentViewMeta.tabs.querySelector('.tabbar')).offsetHeight : 0
    console.debug (this._currentViewMeta.tabsHeight ? 'ionic-pullup-content => Tabs detected' : 'ionic.pullup => View has no tabs'); 
    //this._currentViewMeta.hasBottomTabs = this._currentViewMeta.tabs && this._currentViewMeta.tabs.classList.contains('tabs-bottom');
    
    
    this._currentViewMeta.header = document.querySelector('ion-navbar.toolbar');
    this._currentViewMeta.headerHeight = this._currentViewMeta.header ? (<HTMLElement>this._currentViewMeta.header).offsetHeight : 0;
  }
  
  computeHeights(isInit: boolean = false) {
    this._footerMeta.height = this.maxHeight > 0 ? this.maxHeight : this.expandedHeight; 

    this.renderer.setElementStyle(this.childFooter.nativeElement, 'height', this._footerMeta.height + 'px');
    
    // TODO: implement minimize mode
    //this.renderer.setElementStyle(this.el.nativeElement, 'min-height', this._footerMeta.height + 'px'); 
    //if (this.initialState == IonPullUpContentState.Minimized) {
    //  this.minimize()  
    //} else {
      this.collapse(isInit); 
    //} 
  }
  
  updateUI(isInit: boolean = false) {
    setTimeout(() => {  
      this.computeHeights(isInit);
    }, 300);
    this.renderer.setElementStyle(this.childFooter.nativeElement, 'transition', 'none');  // avoids flickering when changing orientation
  }
  
  expand() {
    this._footerMeta.lastPosY = 0;
    this.renderer.setElementStyle(this.childFooter.nativeElement, '-webkit-transform', 'translate3d(0, 0, 0)');
    this.renderer.setElementStyle(this.childFooter.nativeElement, 'transform', 'translate3d(0, 0, 0)');
    this.renderer.setElementStyle(this.childFooter.nativeElement, 'transition', '300ms ease-in-out');
    
    this.onExpand.emit(null);
  }
  
  collapse(isInit: boolean = false) {
    this._footerMeta.lastPosY = this._footerMeta.height - this._footerMeta.defaultHeight - this._currentViewMeta.tabsHeight;
    this.renderer.setElementStyle( this.childFooter.nativeElement, '-webkit-transform', 'translate3d(0, ' + this._footerMeta.lastPosY + 'px, 0)');
    this.renderer.setElementStyle( this.childFooter.nativeElement, 'transform', 'translate3d(0, ' + this._footerMeta.lastPosY + 'px, 0)');
    
    if (!isInit) this.onCollapse.emit(null);
  }
  
  minimize() {
    this._footerMeta.lastPosY = this._footerMeta.height;
    this.renderer.setElementStyle(this.childFooter.nativeElement, '-webkit-transform', 'translate3d(0, ' + this._footerMeta.lastPosY + 'px, 0)');
    this.renderer.setElementStyle(this.childFooter.nativeElement, 'transform', 'translate3d(0, ' + this._footerMeta.lastPosY + 'px, 0)');
    
    this.onMinimize.emit(null);
  }
  
  
  onTap(e: any) {
    e.preventDefault();
    
    if (this.state == IonPullUpContentState.Collapsed) {
        if (this.defaultBehavior == IonPullUpContentBehavior.Hide) 
            this.state = IonPullUpContentState.Minimized;
        else
            this.state = IonPullUpContentState.Expanded;
    } else {
        if (this.state == IonPullUpContentState.Minimized) {
            if (this.defaultBehavior == IonPullUpContentBehavior.Hide)
                this.state = IonPullUpContentState.Collapsed;
            else
                this.state = IonPullUpContentState.Expanded;
        } else {
            // footer is expanded
            this.state = this.initialState == IonPullUpContentState.Minimized ? IonPullUpContentState.Minimized : IonPullUpContentState.Collapsed;
        }
    }
  }
  
  
  onDrag(e: any) {
    e.preventDefault();
    
    switch(e.type) {
      case 'panstart':
        this.renderer.setElementStyle(this.childFooter.nativeElement, 'transition', 'none');
        break;
      case 'pan':
        this._footerMeta.posY = Math.round(e.deltaY) + this._footerMeta.lastPosY;
        if (this._footerMeta.posY < 0 || this._footerMeta.posY > this._footerMeta.height) return;
        this.renderer.setElementStyle(this.childFooter.nativeElement, '-webkit-transform', 'translate3d(0, ' + this._footerMeta.posY + 'px, 0)');
        this.renderer.setElementStyle(this.childFooter.nativeElement, 'transform', 'translate3d(0, ' + this._footerMeta.posY + 'px, 0)');
        break;
      case 'panend':
        this.renderer.setElementStyle(this.childFooter.nativeElement, 'transition', '300ms ease-in-out');
        
          if (this._footerMeta.lastPosY > this._footerMeta.posY) {
              this.state = IonPullUpContentState.Expanded;
          }
          else if (this._footerMeta.lastPosY < this._footerMeta.posY) {
              this.state = (this.initialState == IonPullUpContentState.Minimized) ? IonPullUpContentState.Minimized : IonPullUpContentState.Collapsed;
          }  

        break;
    }
  }
  
  ngDoCheck() {
    if (!Object.is(this.state, this._oldState)) {
      switch (this.state) {
        case IonPullUpContentState.Collapsed:
          this.collapse();
          break;
        case IonPullUpContentState.Expanded:
          this.expand();
          break;
        case IonPullUpContentState.Minimized:
          this.minimize();
          break;
      }
      this._oldState = this.state;

      // TODO: fix hack due to BUG (https://github.com/angular/angular/issues/6005)
      window.setTimeout(() => {
        this.stateChange.emit(this.state);
      })
    }  
  }
   
}