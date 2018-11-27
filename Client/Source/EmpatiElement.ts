import { TemplateResult, render, html } from "./Lit/lit-html";

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

  AfterConstr?(Target: EmpatiElement): MaybePromise<void>;
  AfterIdle?(Target: EmpatiElement): MaybePromise<void>;
  AfterUpdate?(Target: EmpatiElement): MaybePromise<void>;
  AfterTemplate?(Target: EmpatiElement): MaybePromise<TRorNull>;
  AfterStyle?(Target: EmpatiElement): MaybePromise<TRorNull>;
  AfterRendered?(Target: EmpatiElement): MaybePromise<void>;
}

function ParticleMiddleware(Obj: any[], Key: string): ParticleMiddleware<any> {
  return Object.values(Obj)
    .filter(x => !!x[Key])
    .map(x => () => x[Key](this)) as any;
}

export default class EmpatiElement extends HTMLElement {
  public Root: ShadowRoot | Node;

  get Proto(): EmpatiElement {
    return this.constructor.prototype;
  }

  protected CreateRoot(): ShadowRoot | Node {
    return this.attachShadow({ mode: "open" });
  }

  static Namespace = "empati";

  static toString() {
    return (
      this.Namespace +
      "-" +
      (this.name.charAt(0).toLowerCase() +
        this.name.substr(1).replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`))
    );
  }

  _Renderable = true;
  _RAFLock = true;
  _InnerView = true;

  public StyleSheet: HTMLStyleElement | null = null;
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

  protected $BeforeConstr: ParticleMiddleware<void>;
  protected $BeforeIdle: ParticleMiddleware<void>;
  protected $BeforeUpdate: ParticleMiddleware<void>;
  protected $BeforeTemplate: ParticleMiddleware<void>;
  protected $BeforeStyle: ParticleMiddleware<void>;
  protected $BeforeRendered: ParticleMiddleware<void>;

  protected $AfterConstr: ParticleMiddleware<void>;
  protected $AfterIdle: ParticleMiddleware<void>;
  protected $AfterUpdate: ParticleMiddleware<void>;
  protected $AfterTemplate: ParticleMiddleware<void>;
  protected $AfterStyle: ParticleMiddleware<void>;
  protected $AfterRendered: ParticleMiddleware<void>;

  constructor() {
    super();
    this.Root = this.CreateRoot();
    this.$Constr();
  }

  public Particles: Record<string, ParticleBase>;

  protected async $Constr() {
    if (this.$Stage === Stages.Constr) {
      this.$ConstrEx = "Constr" in this;
      this.$IdleEx = "Idle" in this;
      this.$UpdateEx = "Update" in this;
      this.$TemplateEx = "Template" in this;
      this.$StyleEx = "Style" in this;
      this.$RenderedEx = "Rendered" in this;
      if (this.Proto.Particles) {
        const Middlewares = ParticleMiddleware.bind(this, this.Proto.Particles);
        this.$BeforeConstr = Middlewares("BeforeConstr");
        this.$BeforeIdle = Middlewares("BeforeIdle");
        this.$BeforeUpdate = Middlewares("BeforeUpdate");
        this.$BeforeTemplate = Middlewares("BeforeTemplate");
        this.$BeforeStyle = Middlewares("BeforeStyle");
        this.$BeforeRendered = Middlewares("BeforeRendered");

        this.$AfterConstr = Middlewares("AfterConstr");
        this.$AfterIdle = Middlewares("AfterIdle");
        this.$AfterUpdate = Middlewares("AfterUpdate");
        this.$AfterTemplate = Middlewares("AfterTemplate");
        this.$AfterStyle = Middlewares("AfterStyle");
        this.$AfterRendered = Middlewares("AfterRendered");
      }

      if (this.$TemplateEx && this._InnerView) {
        this.View = document.createElement("view");
        this.View.style.display = "contents";
        this.Root.appendChild(this.View);
      }
      if (this.$StyleEx) {
        this.StyleSheet = document.createElement("style");
        this.Root.appendChild(this.StyleSheet);
      }
      if (this.$BeforeConstr) for (const Fn of this.$BeforeConstr) await Fn();
      if (this.$ConstrEx) await this.Constr();
      if (this.$AfterConstr) for (const Fn of this.$AfterConstr) Fn();
    }
    this.$Idle();
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
    if (this.$BatchedWorkOnQueue) await this.$Update();
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

  private async $Template() {
    if (this.$Stage !== Stages.Update) {
      console.warn(
        "Anti-pattern: You can only switch to Template from Update!"
      );
      return;
    }
    this.$Stage = Stages.Template;
    if (this.$BeforeTemplate) for (const Fn of this.$BeforeTemplate) await Fn();
    if (this.$TemplateEx)
      if (this._InnerView) render(await this.Template(), this.View);
      else if (!this.$StyleEx)
        render(await this.Template(), this.Root as ShadowRoot);
      else
        render(
          html`
            ${this.StyleSheet}${await this.Template()}
          `,
          this.Root as ShadowRoot
        );
    if (this.$AfterTemplate) for (const Fn of this.$AfterTemplate) Fn();
    this.$Style();
  }

  private async $Style() {
    if (this.$Stage !== Stages.Template) {
      console.warn("Anti-pattern: You can only switch to Style from Template!");
      return;
    }
    this.$Stage = Stages.Style;
    if (this.$BeforeStyle) for (const Fn of this.$BeforeStyle) await Fn();
    if (this.$StyleEx) render(await this.Style(), this.StyleSheet);
    if (this.$AfterStyle) for (const Fn of this.$AfterStyle) Fn();
    this.$Rendered();
  }

  private async $Rendered() {
    if (this.$Stage !== Stages.Style) {
      console.warn("Anti-pattern: You can only switch to Rendered from Style!");
      return;
    }
    this.$Stage = Stages.Rendered;
    if (this._RAFLock) await $RAFLock;
    if (this.$BeforeRendered) for (const Fn of this.$BeforeRendered) await Fn();
    if (this.$RenderedEx) await this.Rendered();
    if (this.$AfterRendered) for (const Fn of this.$AfterRendered) Fn();
    this.$Idle();
  }

  public async Refresh() {
    this.$BatchedWorkOnQueue = true;
    if (this.$Stage == Stages.Idle) this.$Idle();
  }

  Constr?(): MaybePromise<void>;
  Idle?(): MaybePromise<void>;
  Update?(): MaybePromise<void>;
  Template?(): MaybePromise<TRorNull>;
  Style?(): MaybePromise<TRorNull>;
  Rendered?(): MaybePromise<void>;
}

let $$RAFLock = () => new Promise(R => {
  requestAnimationFrame(() => {
    $RAFLock = $$RAFLock();
    R();
  });
});

let $RAFLock = $$RAFLock();

export type Constructor<T = {}> = new (...args: any[]) => T;
export function CustomElement(ctor: Constructor<EmpatiElement>) {
  customElements.define(ctor.toString(), ctor);
}
