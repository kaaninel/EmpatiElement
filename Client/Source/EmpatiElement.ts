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

  Renderable: boolean = true;

  protected StyleSheet: HTMLStyleElement | null = null;

  protected $RenderedOnce = false;
  protected $BatchedWorkOnQueue = true;

  public $Stage = Stages.Constr;

  private ConstrEx = false;
  private IdleEx = false;
  private UpdateEx = false;
  private TemplateEx = false;
  private StyleEx = false;
  private RenderedEx = false;

  protected BeforeConstr: ParticleMiddleware<void> = [];
  protected BeforeIdle: ParticleMiddleware<void> = [];
  protected BeforeUpdate: ParticleMiddleware<void> = [];
  protected BeforeTemplate: ParticleMiddleware<TRorNull> = [];
  protected BeforeStyle: ParticleMiddleware<TRorNull> = [];
  protected BeforeRendered: ParticleMiddleware<void> = [];

  protected AfterConstr: ParticleMiddleware<void> = [];
  protected AfterIdle: ParticleMiddleware<void> = [];
  protected AfterUpdate: ParticleMiddleware<void> = [];
  protected AfterTemplate: ParticleMiddleware<TRorNull> = [];
  protected AfterStyle: ParticleMiddleware<TRorNull> = [];
  protected AfterRendered: ParticleMiddleware<void> = [];

  constructor() {
    super();
    this.Root = this.CreateRoot();
    this.$Constr();
  }

  public Particles: Record<string, ParticleBase>;

  protected async $Constr() {
    if (this.$Stage === Stages.Constr) {
      this.ConstrEx = "Constr" in this;
      this.IdleEx = "Idle" in this;
      this.UpdateEx = "Update" in this;
      this.TemplateEx = "Template" in this;
      this.StyleEx = "Style" in this;
      this.RenderedEx = "Rendered" in this;
      const Middlewares = ParticleMiddleware.bind(this, this.Proto.Particles);
      this.BeforeConstr = Middlewares("BeforeConstr");
      this.BeforeIdle = Middlewares("BeforeIdle");
      this.BeforeUpdate = Middlewares("BeforeUpdate");
      this.BeforeTemplate = Middlewares("BeforeTemplate");
      this.BeforeStyle = Middlewares("BeforeStyle");
      this.BeforeRendered = Middlewares("BeforeRendered");

      this.AfterConstr = Middlewares("AfterConstr");
      this.AfterIdle = Middlewares("AfterIdle");
      this.AfterUpdate = Middlewares("AfterUpdate");
      this.AfterTemplate = Middlewares("AfterTemplate");
      this.AfterStyle = Middlewares("AfterStyle");
      this.AfterRendered = Middlewares("AfterRendered");

      if (this.StyleEx) {
        this.StyleSheet = document.createElement("style");
        this.Root.appendChild(this.StyleSheet);
      }
      for (const Fn of this.BeforeConstr) await Fn();
      if (this.ConstrEx) await this.Constr();
      for (const Fn of this.AfterConstr) Fn();
    }
    this.$Idle();
  }

  private async $Idle() {
    if (![Stages.Constr, Stages.Rendered].includes(this.$Stage)) {
      console.warn("Anti-pattern: Still have work to do can't switch to idle!");
      return;
    }
    this.$Stage = Stages.Idle;

    for (const Fn of this.BeforeIdle) await Fn();
    if (this.IdleEx) await this.Idle();
    for (const Fn of this.AfterIdle) Fn();
    if (this.$BatchedWorkOnQueue) await this.$Update();
  }

  private async $Update() {
    if (this.$Stage !== Stages.Idle) {
      console.warn("Anti-pattern: You can only switch to Update from Idle!");
      return;
    }
    this.$Stage = Stages.Update;
    this.$BatchedWorkOnQueue = false;
    for (const Fn of this.BeforeUpdate) await Fn();
    if (this.UpdateEx) await this.Update();
    for (const Fn of this.AfterUpdate) Fn();
    if (this.Renderable) this.$Template();
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
    for (const Fn of this.BeforeTemplate) await Fn();
    if (this.TemplateEx) {
      render(
        html`
          ${this.StyleSheet}${await this.Template()}
        `,
        this.Root as ShadowRoot
      );
    }
    for (const Fn of this.AfterTemplate) Fn();
    this.$Style();
  }

  private async $Style() {
    if (this.$Stage !== Stages.Template) {
      console.warn("Anti-pattern: You can only switch to Style from Template!");
      return;
    }
    this.$Stage = Stages.Style;
    for (const Fn of this.BeforeStyle) await Fn();
    if (this.StyleEx) render(await this.Style(), this.StyleSheet);
    for (const Fn of this.AfterStyle) Fn();
    this.$Rendered();
  }

  private async $Rendered() {
    if (this.$Stage !== Stages.Style) {
      console.warn("Anti-pattern: You can only switch to Rendered from Style!");
      return;
    }
    this.$Stage = Stages.Rendered;
    for (const Fn of this.BeforeRendered) await Fn();
    if (this.RenderedEx) await this.Rendered();
    for (const Fn of this.AfterRendered) Fn();
    this.$Idle();
  }

  public async Refresh() {
    this.$BatchedWorkOnQueue = true;
    if (this.$Stage == Stages.Idle) await this.$Update();
  }

  Constr?(): MaybePromise<void>;
  Idle?(): MaybePromise<void>;
  Update?(): MaybePromise<void>;
  Template?(): MaybePromise<TRorNull>;
  Style?(): MaybePromise<TRorNull>;
  Rendered?(): MaybePromise<void>;
}

export type Constructor<T = {}> = new (...args: any[]) => T;
export function CustomElement(ctor: Constructor<EmpatiElement>) {
  customElements.define(ctor.toString(), ctor);
}
