import EEBase, { Constructor } from "../Particles";

export const IESTarget = new EventTarget();

export function Event(
  Event: string,
  Host?: (this: EEBase) => EEBase | EEBase | string
) {
  return function(Target: any, Key: string) {
    if (!("Events" in Target)) Target.Events = [];
    //@ts-ignore
    (Target as typeof EEBase).Events.push({
      Event,
      Host,
      Func: Target[Key]
    });
  };
}

export function IEvent(Event: string) {
  return function(Target: any, Key: string) {
    if (!("IEvents" in Target)) Target.IEvents = [];
    //@ts-ignore
    (Target as typeof EEBase).IEvents.push({
      Event,
      Func: Target[Key]
    });
  };
}

export default function EventParticle<TBase extends Constructor<EEBase>>(
  Ctor: TBase
) {
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

    Dispatch(Key: string, Data: any) {
      this.dispatchEvent(new CustomEvent(Key, { detail: Data }));
    }
  };
}
