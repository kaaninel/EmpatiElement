import { TemplateResult, render, Constructor } from "../Particles";
import EEBase from "../Particles";

type Promisable<T> = Promise<T> | T;

export enum Stages {
  Offline,
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
  Disconnecting
}

export default function StageParticle<TBase extends Constructor<EEBase>>(Ctor: TBase){
  return class StageParticleP extends Ctor {
    public $Stage = Stages.Constr;

    protected async $Constr(){
      if("Constr" in this) this.Constr();
      this.$Stage = Stages.Idle;
      await this.$Idle();
    }
  
    protected async $Update(){
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
  
    protected $RenderedOnce = false;
    protected $BatchedWorkOnQueue = true;
    
    public async ReRender(){
      this.$Stage = Stages.NeedsUpdate;
      await this.$Update();
    }
  
    protected Constr?(): Promisable<void>;
    protected Destr?(): Promisable<void>;
    protected Moved?(): Promisable<void>;
    protected Update?(): Promisable<void>;
    protected Rendered?(): Promisable<void>;
    protected FirstRender?(): Promisable<void>;
    protected Render?(): Promisable<TemplateResult>;  
  }
}