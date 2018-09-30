import { TemplateResult, render } from "./LitHTML";

export enum Stages {
  Idle,
  Connecting,
  Constr,
  NeedsUpdate,
  Update,
  Updated,
  Render,
  FirstRender,
  Rendered,
  Moving,
  Dying
}

export const IESTarget = new EventTarget();

export default class EmpatiElement<Root = ShadowRoot> extends HTMLElement {

  Root: Root = this.CreateRoot();
  
  static Events: Array<{
    Host?: (this: EmpatiElement) => EmpatiElement | EmpatiElement | string,
    Event: string,
    Func: Function
  }>;
  static IEvents: Array<{
    Event: string,
    Func: Function
  }>;

  static PropertySet: string[];
  static AttributeSet: string[];
  static Queries: Record<string, string>;
  static AllQueries: Record<string, string>;
  private Properties = {} as Record<string, any>;
  
  static get observedAttributes(): string[]{
    return (this.prototype as any).observedAttributes;
  }

  constructor(){
    super();
    if("PropertySet" in this.Proto) 
      this.Proto.PropertySet.forEach(x => this.$RegisterProperty(x));
    if("AttributeSet" in this.Proto) 
      this.Proto.AttributeSet.forEach(x => this.$RegisterProperty(x, true));
    if("Queries" in this.Proto) 
      for(const Key in this.Proto.Queries)
        Object.defineProperty(this, Key, {
          get(this: EmpatiElement){
            return this.Root.querySelector(this.Proto.Queries[Key]);
          }
        });
    if("AllQueries" in this.Proto) 
      for(const Key in this.Proto.AllQueries)
        Object.defineProperty(this, Key, {
          get(this: EmpatiElement){
            return this.Root.querySelectorAll(this.Proto.AllQueries[Key]);
          }
        });
    if("Events" in this.Proto) 
      this.Proto.Events.forEach(x => {
        let Host = this;
        if(x.Host) {
          if(typeof x.Host === "string") 
            //@ts-ignore
            Host = this.Root.querySelector(x.Host);
          else if(typeof x.Host == "function")
            Host = x.Host.call(this);
          else 
            Host = x.Host;
        }
        Host.addEventListener(x.Event, x.Func.bind(this));
      });
    if("IEvents" in this.Proto) 
      this.Proto.IEvents.forEach(x => {
        IESTarget.addEventListener(x.Event, x.Func.bind(this));
      });
  }

  get Proto(){
    return this.constructor.prototype as typeof EmpatiElement;
  }

  async connectedCallback(){
    this.$Stage = Stages.Connecting;
    if("AttributeSet" in this.Proto) 
    this.Proto.AttributeSet.map(x => { 
      this.setAttribute(x, this.Properties[x]);
    });
    await this.$Constr();
  }

  async disconnectedCallback(){
    this.$Stage = Stages.Dying;
    if("Destr" in this) await this.Destr();
    this.$Stage = Stages.Idle;
  }

  async adoptedCallback(){
    this.$Stage = Stages.Moving; 
    if("Moved" in this) await this.Moved();
    this.$Stage = Stages.Idle;
  }

  attributeChangedCallback(Key: string, Old: string, New: string){
    if(`CanChange${Key}` in this.Proto &&
        !(this.Proto as any)[`CanChange${Key}`].call(this, New, Old))
      this.setAttribute(Key, Old);
    else 
      this.Properties[Key] = New;
    
    if(this.$Stage === Stages.Idle){
      this.$Stage = Stages.NeedsUpdate;
      this.$Update();
    }
    else 
      this.$BatchedWorkOnQueue = true;
  }

  protected $RenderedOnce = false;
  protected $BatchedWorkOnQueue = true;
  protected $Stage = Stages.Constr;

  private $RegisterProperty(Key: string, Attribute = false){
    const IfFilter = `CanChange${Key}` in this.Proto;
    Object.defineProperty(this, Key, {
      get(this: EmpatiElement){
        return Attribute ? this.getAttribute(Key) : this.Properties[Key];
      },
      set(this: EmpatiElement, Value: any){
        if((this.Properties[Key] === Value) || (IfFilter && !(this.Proto as any)[`CanChange${Key}`]
          .call(this, Value, this.Properties[Key]))) return;
        this.Properties[Key] = Value;
        if(Attribute && this.$Stage !== Stages.Constr) 
          this.setAttribute(Key, Value);
        if(this.$Stage === Stages.Idle){
          this.$Stage = Stages.NeedsUpdate;
          this.$Update();
        }
        else 
          this.$BatchedWorkOnQueue = true;
      }
    });
  }

  public async ReRender(){
    this.$Stage = Stages.NeedsUpdate;
    await this.$Update();
  }

  private async $Constr(){
    if("Constr" in this) this.Constr();
    this.$Stage = Stages.Idle;
    await this.$Idle();
  }

  private async $Update(){
    if(this.$Stage !== Stages.NeedsUpdate) return;
    this.$Stage = Stages.Update;

    if("Update" in this) await this.Update();
    this.$Stage = Stages.Updated;
    await this.$Render();
  }

  private async $Render(){
    if(this.$Stage !== Stages.Updated) return;
    this.$Stage = Stages.Render;

    if("Render" in this) 
      render(await this.Render(), this.Root as any); 
    if(!this.$RenderedOnce) {
      this.$Stage = Stages.FirstRender;
      if("FirstRender" in this) await this.FirstRender();
      this.$RenderedOnce = true;
    }
    this.$Stage = Stages.Rendered;
    if("Rendered" in this) await this.Rendered();
    this.$Stage = Stages.Idle;
    await this.$Idle();
  }

  private async $Idle(){
    if(this.$BatchedWorkOnQueue){
      this.$BatchedWorkOnQueue = false;
      this.$Stage = Stages.NeedsUpdate;
      await this.$Update();
    }
  }

  protected CreateRoot(): Root{
    return this.attachShadow({mode: "open"}) as any as Root;
  }

  toString(){
    return this.tagName;
  }

  static toString(){
    return this.name.charAt(0).toLowerCase() +
      this.name.substr(1).replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
  }

  protected Constr?(): Promisable<void>;
  protected Destr?(): Promisable<void>;
  protected Moved?(): Promisable<void>;
  protected Update?(): Promisable<void>;
  protected Rendered?(): Promisable<void>;
  protected FirstRender?(): Promisable<void>;
  protected Render?(): Promisable<TemplateResult>;
}

type Promisable<T> = Promise<T> | T;

export type Constructor<T> = { new (): T };

export function CustomElement<T>(ctor: Constructor<EmpatiElement<T>>) {
  customElements.define(ctor.toString(), ctor);
}

declare global {
  interface Window { Main: EmpatiElement }
}

export function EntryPoint<T>(ctor:  Constructor<EmpatiElement<T>>) {
  
  class EPClass extends ctor {
    //@ts-ignore
    CreateRoot(){
      return document.body;
    }
  }

  customElements.define(ctor.toString(), EPClass);
  window.Main = document.createElement(ctor.toString()) as EmpatiElement;
  document.head.appendChild(window.Main);
} 