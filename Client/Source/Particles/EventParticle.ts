import EEBase, { Constructor } from "../Particles";

export const IESTarget = new EventTarget();

export default function EventParticle<TBase extends Constructor<EEBase>>(Ctor: TBase){
  return class EventParticleP extends Ctor {
    static Events: Array<{
      Host?: (this: HTMLElement) => HTMLElement | string;
      Event: string;
      Func: Function;
    }>;
    static IEvents: Array<{
      Event: string;
      Func: Function;
    }>;

    constructor(...args: any[]) {
      super(...args);
      if ("Events" in this.Proto)
        (this.Proto as typeof EventParticleP).Events.forEach(x => {
          let Host = this;
          if (x.Host) {
            if (typeof x.Host === "string")
              //@ts-ignore
              Host = this.Root.querySelector(x.Host);
            else if (typeof x.Host == "function") Host = x.Host.call(this);
            else Host = x.Host;
          }
          Host.addEventListener(x.Event, x.Func.bind(this));
        });
      if ("IEvents" in this.Proto)
        (this.Proto as typeof EventParticleP).IEvents.forEach(x => {
          IESTarget.addEventListener(x.Event, x.Func.bind(this));
        });
    }
  };
}
