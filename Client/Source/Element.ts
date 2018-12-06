import { TemplateResult, render, html } from "./Lit/lit-html";
import { css, EmpatiStyle } from "./Template";

export enum Stages {
  Constr,
  Idle,
  Update,
  Template,
  Style,
  FirstRender,
  Rendered
}

type MaybePromise<T> = Promise<T> | T;
type TRorNull = TemplateResult | undefined | null;
type ParticleMiddleware<T> = Array<() => MaybePromise<T>>;

export function RegisterParticle<T extends EmpatiElement>(
  Base: typeof ParticleBase,
  Proto: T
) {
  if (!Proto.hasOwnProperty("Particles")) Proto.Particles = {};
  if (!Proto.Particles.hasOwnProperty(Base.name)) {
    Proto.Particles[Base.name] = new Base();
  }
  return Proto;
}

export function Particle(Base: typeof ParticleBase) {
  return function<T extends typeof EmpatiElement>(Constr: T) {
    const Proto = Constr.prototype;
    if (!Proto.hasOwnProperty("Particles")) Proto.Particles = {};
    if (!Proto.Particles.hasOwnProperty(Base.name))
      Proto.Particles[Base.name] = new Base();
    return Constr;
  };
}

export class ParticleBase {
  BeforeConstr?(Target: EmpatiElement): MaybePromise<void>;
  BeforeIdle?(Target: EmpatiElement): MaybePromise<void>;
  BeforeUpdate?(Target: EmpatiElement): MaybePromise<void>;
  BeforeTemplate?(Target: EmpatiElement): MaybePromise<TRorNull>;
  BeforeStyle?(Target: EmpatiElement): MaybePromise<TRorNull>;
  BeforeRendered?(Target: EmpatiElement): MaybePromise<void>;
  BeforeConnected?(Target: EmpatiElement): MaybePromise<void>;
  BeforeDisconnected?(Target: EmpatiElement): MaybePromise<void>;

  AfterConstr?(Target: EmpatiElement): MaybePromise<void>;
  AfterIdle?(Target: EmpatiElement): MaybePromise<void>;
  AfterUpdate?(Target: EmpatiElement): MaybePromise<void>;
  AfterTemplate?(Target: EmpatiElement): MaybePromise<TRorNull>;
  AfterStyle?(Target: EmpatiElement): MaybePromise<TRorNull>;
  AfterRendered?(Target: EmpatiElement): MaybePromise<void>;
  AfterConnected?(Target: EmpatiElement): MaybePromise<void>;
  AfterDisconnected?(Target: EmpatiElement): MaybePromise<void>;
}

function ParticleMiddleware(Obj: any[], Key: string): ParticleMiddleware<any> {
  return Object.values(Obj)
    .filter(x => !!x[Key])
    .map(x => () => x[Key](this)) as any;
}

export default class EmpatiElement extends HTMLElement {
  public Root: EmpatiElement | ShadowRoot;

  get Proto(): EmpatiElement{
    return this.constructor.prototype;
  }

  protected CreateRoot(): EmpatiElement | ShadowRoot {
    return this;
  }

  id = this.tagName + Math.random().toString().substr(2);
  $ = "#" + this.id;

  static Namespace = "empati";

  static toString() {
    return (
      this.Namespace +
      "-" +
      (this.name.charAt(0).toLowerCase() +
        this.name.substr(1).replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`))
    );
  }

  Doc: Document | EmpatiElement = document;
  $StyleRoot: EmpatiElement & {$SetStyle: (Host: EmpatiElement, Value: EmpatiStyle) => void};

  _DOM = true;
  _Renderable = true;
  _InnerView = true;

  public View: HTMLElement | null = null;

  protected $RenderedOnce = false;
  protected $BatchedWorkOnQueue = true;
  protected $Queue: any[] = [];

  public $Stage = Stages.Constr;

  private $ConstrEx = false;
  private $IdleEx = false;
  private $UpdateEx = false;
  private $TemplateEx = false;
  private $StyleEx = false;
  private $RenderedEx = false;
  private $ConnectedEx = false;
  private $DisconnectedEx = false;

  protected $BeforeConstr: ParticleMiddleware<void>;
  protected $BeforeIdle: ParticleMiddleware<void>;
  protected $BeforeUpdate: ParticleMiddleware<void>;
  protected $BeforeTemplate: ParticleMiddleware<void>;
  protected $BeforeStyle: ParticleMiddleware<void>;
  protected $BeforeRendered: ParticleMiddleware<void>;
  protected $BeforeConnected: ParticleMiddleware<void>;
  protected $BeforeDisconnected: ParticleMiddleware<void>;

  protected $AfterConstr: ParticleMiddleware<void>;
  protected $AfterIdle: ParticleMiddleware<void>;
  protected $AfterUpdate: ParticleMiddleware<void>;
  protected $AfterTemplate: ParticleMiddleware<void>;
  protected $AfterStyle: ParticleMiddleware<void>;
  protected $AfterRendered: ParticleMiddleware<void>;
  protected $AfterConnected: ParticleMiddleware<void>;
  protected $AfterDisconnected: ParticleMiddleware<void>;

  constructor() {
    super();
    this.Root = this.CreateRoot();
    new Promise((R) => {
      this.$Constr();
    });
  }

  public Slot: Node[] = null;

  public Particles: Record<string, ParticleBase>;

  protected async $Constr() {
    if (this.$Stage === Stages.Constr) {
      this.$ConstrEx = "Constr" in this;
      this.$IdleEx = "Idle" in this;
      this.$UpdateEx = "Update" in this;
      this.$TemplateEx = "Template" in this;
      this.$StyleEx = "Style" in this;
      this.$RenderedEx = "Rendered" in this;
      this.$ConnectedEx = "Connected" in this;
      this.$DisconnectedEx = "Disconnected" in this;
      if (this.Proto.Particles) {
        const Middlewares = ParticleMiddleware.bind(this, this.Proto.Particles);
        this.$BeforeConstr = Middlewares("BeforeConstr");
        this.$BeforeIdle = Middlewares("BeforeIdle");
        this.$BeforeUpdate = Middlewares("BeforeUpdate");
        this.$BeforeTemplate = Middlewares("BeforeTemplate");
        this.$BeforeStyle = Middlewares("BeforeStyle");
        this.$BeforeRendered = Middlewares("BeforeRendered");
        this.$BeforeConnected = Middlewares("BeforeConnected");
        this.$BeforeDisconnected = Middlewares("BeforeDisconnected");

        this.$AfterConstr = Middlewares("AfterConstr");
        this.$AfterIdle = Middlewares("AfterIdle");
        this.$AfterUpdate = Middlewares("AfterUpdate");
        this.$AfterTemplate = Middlewares("AfterTemplate");
        this.$AfterStyle = Middlewares("AfterStyle");
        this.$AfterRendered = Middlewares("AfterRendered");
        this.$AfterConnected = Middlewares("AfterConnected");
        this.$AfterDisconnected = Middlewares("AfterDisconnected");
      }
      if(this.$TemplateEx){
        this.Slot = Array.from(this.childNodes);
        if (this._InnerView) {
          this.View = document.createElement("view");
          this.View.style.display = "contents";
          this.Root.appendChild(this.View);
        }
      }
      if("$$Constr" in this) await this.$$Constr();
      if (this.$BeforeConstr) for (const Fn of this.$BeforeConstr) await Fn();
      if (this.$ConstrEx) await this.Constr();
      if (this.$AfterConstr) for (const Fn of this.$AfterConstr) Fn();
    }
    if(!this._DOM) 
      await this.connectedCallback();
    this.$Idle();
  }

  $$Constr?(): void;

  Getters: Record<string, () => any> = {};
  Setters: Record<string, (Value: any) => void> = {};

  Store: Record<string, any> = {};

  DefineProp(
    Key: string,
    Getter?: (Super: () => any) => any,
    Setter?: (Super: (Value: any) => void, Value: any) => void
  ) {
    const AD = Key in this.Getters;
    const SuperGetter = AD ? this.Getters[Key] : () => this.Store[Key];
    this.Getters[Key] = Getter ? Getter.bind(this, SuperGetter) : SuperGetter;
    const SuperSetter = AD
      ? this.Setters[Key]
      : (Value: any) => {
          this.Store[Key] = Value;
        };
    this.Setters[Key] = Setter ? Setter.bind(this, SuperSetter) : SuperSetter;
    if (!AD){
      this.Store[Key] = (this as any)[Key];
      Object.defineProperty(this, Key, {
        get() {
          return this.Getters[Key]();
        },
        set(Value: any) {
          return this.Setters[Key](Value);
        }
      });
    }
  }

  private async $Idle() {
    if (this.$Stage !== Stages.Idle) {
      if (![Stages.Constr, Stages.Rendered].includes(this.$Stage)) {
        console.warn(
          "Anti-pattern: Still have work to do can't switch to idle!",
          this.$Stage
        );
        return;
      }
      this.$Stage = Stages.Idle;

      if (this.$BeforeIdle) for (const Fn of this.$BeforeIdle) await Fn();
      if (this.$IdleEx) await this.Idle();
      if (this.$AfterIdle) for (const Fn of this.$AfterIdle) Fn();
    }
    if (this.$BatchedWorkOnQueue) this.$Update();
  }

  private async $Update() {
    if (this.$Stage !== Stages.Idle) {
      console.warn("Anti-pattern: You can only switch to Update from Idle!");
      return;
    }
    this.$Stage = Stages.Update;
    this.$BatchedWorkOnQueue = false;
    if (this.$BeforeUpdate) for (const Fn of this.$BeforeUpdate) await Fn();
    if (this.$UpdateEx) await this.Update();
    if (this.$AfterUpdate) for (const Fn of this.$AfterUpdate) Fn();
    if (this._Renderable) this.$Template();
    else this.$Idle();
  }

  protected _DynamicTemplate = true;
  protected $FirstTemplate = true;

  private async $Template() {
    if (this.$Stage !== Stages.Update) {
      console.warn(
        "Anti-pattern: You can only switch to Template from Update!"
      );
      return;
    }
    this.$Stage = Stages.Template;
    if(!this._DynamicTemplate && this.$FirstTemplate || this._DynamicTemplate){
      if (this.$BeforeTemplate) for (const Fn of this.$BeforeTemplate) await Fn();
      if (this.$TemplateEx) {
        const T = await this.Template();
        if (this._InnerView) render(T, this.View);
        else render(T, this.Root);
        this.$FirstTemplate = false;
      }
      if (this.$AfterTemplate) for (const Fn of this.$AfterTemplate) Fn();
    }
    this.$Style();
  }

  protected _DynamicStyle = true;
  protected $FirstStyle = true;

  private async $Style() {
    if (this.$Stage !== Stages.Template) {
      console.warn("Anti-pattern: You can only switch to Style from Template!");
      return;
    }
    this.$Stage = Stages.Style;
    if(!this._DynamicStyle && this.$FirstStyle || this._DynamicStyle){
      if (this.$BeforeStyle) for (const Fn of this.$BeforeStyle) await Fn();
      if (this.$StyleEx) 
        this.$StyleRoot.$SetStyle(this, await this.Style());
      if (this.$AfterStyle) for (const Fn of this.$AfterStyle) Fn();
      this.$FirstStyle = false;
    }
    this.$Rendered();
  }

  private async $Rendered() {
    if (this.$Stage !== Stages.Style) {
      console.warn("Anti-pattern: You can only switch to Rendered from Style!");
      return;
    }
    this.$Stage = Stages.Rendered;
    if (this.$BeforeRendered) for (const Fn of this.$BeforeRendered) await Fn();
    if (this.$RenderedEx) await this.Rendered();
    if (this.$AfterRendered) for (const Fn of this.$AfterRendered) Fn();
    this.$Idle();
  }

  public async Refresh() {
    this.$BatchedWorkOnQueue = true;
    if (this.$Stage == Stages.Idle) this.$Idle();
  }

  async connectedCallback(){
    const E = this.parentElement as EmpatiElement;
    if(E && E.Doc) this.Doc = E.Doc;
    this.$StyleRoot = (this.Doc === document ? window.Managers.Stylist : this.Doc) as any;
    if (this.$BeforeConnected) for (const Fn of this.$BeforeConnected) await Fn();
    if (this.$ConnectedEx) await this.Connected();
    if (this.$AfterConnected) for (const Fn of this.$AfterConnected) Fn();
  }

  async disconnectedCallback(){
    if (this.$BeforeDisconnected) for (const Fn of this.$BeforeDisconnected) await Fn();
    if (this.$DisconnectedEx) await this.Disconnect();
    if (this.$AfterDisconnected) for (const Fn of this.$AfterDisconnected) Fn();
  }

  static Style?(): EmpatiStyle;

  Constr?(): MaybePromise<void>;
  Connected?(): MaybePromise<void>;
  Idle?(): MaybePromise<void>;
  Update?(): MaybePromise<void>;
  Template?(): MaybePromise<TRorNull>;
  Style?(): MaybePromise<TRorNull>;
  Rendered?(): MaybePromise<void>;
  Disconnect?(): MaybePromise<void>;
}

export type Constructor<T = {}> = new (...args: any[]) => T;
export function CustomElement<T extends typeof EmpatiElement>(ctor: T) {
  const Key = ctor.toString();
  customElements.define(Key, ctor);
  if(ctor.Style && !(ctor as any).$ComponentMark)
    window.Styles[Key] = ctor.Style();
  return  ctor;
}
